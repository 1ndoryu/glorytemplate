/*
 * Comando: setup-smtp
 * Configura SMTP relay (Brevo) en un sitio WordPress.
 * Despliega mu-plugin + msmtp como sendmail fallback.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;
use crate::infra::validation;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: Option<&str>,
    all: bool,
    test: bool,
    test_email: Option<&str>,
    status: bool,
) -> std::result::Result<(), CoolifyError> {
    let settings = Settings::load(config_path)?;

    let sites: Vec<_> = if all {
        settings
            .sitios
            .iter()
            .filter(|s| s.stack_uuid.is_some())
            .collect()
    } else {
        let name = site_name.ok_or_else(|| {
            CoolifyError::Validation("Especifica --name o --all".into())
        })?;
        let site = settings.get_site(name)?;
        validation::assert_site_ready(site)?;
        vec![site]
    };

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    /* Obtener credenciales SMTP desde env vars */
    let smtp_host = std::env::var("SMTP_HOST").unwrap_or_else(|_| "smtp-relay.brevo.com".to_string());
    let smtp_port = std::env::var("SMTP_PORT").unwrap_or_else(|_| "587".to_string());
    let smtp_user = std::env::var("SMTP_USER").unwrap_or_default();
    let smtp_pass = std::env::var("SMTP_PASS").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| settings.wordpress.default_admin_email.clone());

    if smtp_user.is_empty() || smtp_pass.is_empty() {
        if !status {
            return Err(CoolifyError::Validation(
                "Variables SMTP_USER y SMTP_PASS requeridas. Configura las variables de entorno.".into(),
            ));
        }
    }

    for site in &sites {
        let stack_uuid = site.stack_uuid.as_deref().unwrap();
        let wp_container = docker::find_wordpress_container(&ssh, stack_uuid).await?;

        if status {
            /* Verificar estado de SMTP */
            let check = docker::docker_exec(
                &ssh,
                &wp_container,
                "ls /var/www/html/wp-content/mu-plugins/smtp-relay.php 2>/dev/null && echo 'INSTALADO' || echo 'NO INSTALADO'",
            )
            .await?;
            println!("{}: SMTP {}", site.nombre, check.stdout.trim());
            continue;
        }

        tracing::info!("Configurando SMTP en '{}'...", site.nombre);

        /* Paso 1: Instalar msmtp como sendmail fallback */
        let install_msmtp = format!(
            r#"apt-get update -qq && apt-get install -y -qq msmtp msmtp-mta > /dev/null 2>&1
cat > /etc/msmtprc << 'MSMTP_EOF'
defaults
auth           on
tls            on
tls_starttls   on
logfile        /var/log/msmtp.log

account        brevo
host           {host}
port           {port}
from           {from}
user           {user}
password       {pass}

account default : brevo
MSMTP_EOF
chmod 600 /etc/msmtprc
echo 'sendmail_path = "/usr/bin/msmtp -t"' > /usr/local/etc/php/conf.d/msmtp.ini
echo 'msmtp configurado'"#,
            host = smtp_host,
            port = smtp_port,
            from = smtp_from,
            user = smtp_user,
            pass = smtp_pass,
        );

        let result = docker::docker_exec(&ssh, &wp_container, &install_msmtp).await?;
        if !result.success() {
            tracing::warn!("Error instalando msmtp en '{}': {}", site.nombre, result.stderr);
        }

        /* Paso 2: Crear mu-plugin para override de phpmailer */
        let mu_plugin = format!(
            r#"<?php
/*
 * Plugin: SMTP Relay (auto-configurado por coolify-manager)
 * Configura PHPMailer para usar SMTP relay via Brevo.
 */
add_action('phpmailer_init', function($phpmailer) {{
    $phpmailer->isSMTP();
    $phpmailer->Host       = '{host}';
    $phpmailer->SMTPAuth   = true;
    $phpmailer->Port       = {port};
    $phpmailer->Username   = '{user}';
    $phpmailer->Password   = '{pass}';
    $phpmailer->SMTPSecure = 'tls';
    $phpmailer->From       = '{from}';
    $phpmailer->FromName   = get_bloginfo('name');
}});
"#,
            host = smtp_host,
            port = smtp_port,
            user = smtp_user,
            pass = smtp_pass,
            from = smtp_from,
        );

        let create_mu = format!(
            "mkdir -p /var/www/html/wp-content/mu-plugins && echo '{}' > /var/www/html/wp-content/mu-plugins/smtp-relay.php",
            mu_plugin.replace('\'', "'\\''")
        );
        docker::docker_exec(&ssh, &wp_container, &create_mu).await?;

        /* Permisos */
        let _ = docker::docker_exec(
            &ssh,
            &wp_container,
            "chown www-data:www-data /var/www/html/wp-content/mu-plugins/smtp-relay.php",
        )
        .await;

        println!("{}: SMTP configurado.", site.nombre);

        /* Paso 3: Test email si se solicita */
        if test {
            let to = test_email.unwrap_or(&settings.wordpress.default_admin_email);
            let test_php = format!(
                r#"<?php
require_once '/var/www/html/wp-load.php';
$result = wp_mail('{to}', 'Test SMTP - coolify-manager', 'Email de prueba enviado desde coolify-manager-rs.');
echo $result ? 'Email enviado correctamente' : 'Error enviando email';
"#,
                to = to
            );
            let cmd = format!(
                "echo '{}' | php",
                test_php.replace('\'', "'\\''")
            );
            let result = docker::docker_exec(&ssh, &wp_container, &cmd).await?;
            println!("  Test: {}", result.stdout.trim());
        }
    }

    Ok(())
}
