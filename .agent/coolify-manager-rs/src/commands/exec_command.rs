/*
 * Comando: exec-command
 * Ejecuta un comando bash o PHP dentro del contenedor del sitio.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;
use crate::infra::validation;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: &str,
    command: Option<&str>,
    php_code: Option<&str>,
    target: &str,
) -> std::result::Result<(), CoolifyError> {
    if command.is_none() && php_code.is_none() {
        return Err(CoolifyError::Validation(
            "Especifica --command o --php".into(),
        ));
    }

    let settings = Settings::load(config_path)?;
    let site = settings.get_site(site_name)?;
    validation::assert_site_ready(site)?;

    let stack_uuid = site.stack_uuid.as_deref().unwrap();

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    let container_id = match target {
        "mariadb" => docker::find_mariadb_container(&ssh, stack_uuid).await?,
        _ => docker::find_wordpress_container(&ssh, stack_uuid).await?,
    };

    let cmd = if let Some(php) = php_code {
        /* Ejecutar PHP inline */
        format!(
            "echo '{}' | php",
            php.replace('\'', "'\\''")
        )
    } else {
        command.unwrap().to_string()
    };

    let result = docker::docker_exec(&ssh, &container_id, &cmd).await?;

    if !result.stdout.is_empty() {
        print!("{}", result.stdout);
    }
    if !result.stderr.is_empty() {
        eprint!("{}", result.stderr);
    }

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: "Comando fallo".into(),
        });
    }

    Ok(())
}
