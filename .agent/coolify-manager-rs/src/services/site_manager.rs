/*
 * SiteManager — configuracion de sitios WordPress.
 * Equivale a WordPress/SiteManager.psm1.
 */

use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;

/// Actualiza las URLs de WordPress (home y siteurl).
pub async fn set_wordpress_urls(
    ssh: &SshClient,
    container_id: &str,
    domain: &str,
) -> std::result::Result<(), CoolifyError> {
    let php_script = format!(
        r#"<?php
define('ABSPATH', '/var/www/html/');
require_once ABSPATH . 'wp-load.php';
update_option('home', '{domain}');
update_option('siteurl', '{domain}');
echo 'URLs actualizadas a: {domain}';
"#,
        domain = domain
    );

    let cmd = format!(
        "echo '{}' > /tmp/fix_urls.php && php /tmp/fix_urls.php && rm -f /tmp/fix_urls.php",
        php_script.replace('\'', "'\\''")
    );

    let result = docker::docker_exec(ssh, container_id, &cmd).await?;

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: result.stderr,
        });
    }

    tracing::info!("URLs de WordPress actualizadas a {domain}");
    Ok(())
}

/// Activa el tema Glory en WordPress.
pub async fn enable_glory_theme(
    ssh: &SshClient,
    container_id: &str,
    theme_name: &str,
) -> std::result::Result<(), CoolifyError> {
    let php_script = format!(
        r#"<?php
/* Suprimir warning de HTTP_HOST para CLI */
if (!isset($_SERVER['HTTP_HOST'])) {{
    $_SERVER['HTTP_HOST'] = 'localhost';
}}
define('ABSPATH', '/var/www/html/');
require_once ABSPATH . 'wp-load.php';

$theme = wp_get_theme('{theme_name}');
if ($theme->exists()) {{
    switch_theme('{theme_name}');
    echo 'Tema {theme_name} activado correctamente';
}} else {{
    $themes_dir = '/var/www/html/wp-content/themes/';
    $available = array_map('basename', glob($themes_dir . '*', GLOB_ONLYDIR));
    echo 'ERROR: Tema {theme_name} no encontrado. Disponibles: ' . implode(', ', $available);
    exit(1);
}}
"#,
        theme_name = theme_name
    );

    let cmd = format!(
        "echo '{}' > /tmp/enable_theme.php && php /tmp/enable_theme.php && rm -f /tmp/enable_theme.php",
        php_script.replace('\'', "'\\''")
    );

    let result = docker::docker_exec(ssh, container_id, &cmd).await?;

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: format!("{}\n{}", result.stdout, result.stderr),
        });
    }

    tracing::info!("Tema {theme_name} activado");
    Ok(())
}

/// Crea un usuario administrador de WordPress.
pub async fn create_admin_user(
    ssh: &SshClient,
    container_id: &str,
    username: &str,
    password: &str,
    email: &str,
) -> std::result::Result<(), CoolifyError> {
    let php_script = format!(
        r#"<?php
if (!isset($_SERVER['HTTP_HOST'])) {{
    $_SERVER['HTTP_HOST'] = 'localhost';
}}
define('ABSPATH', '/var/www/html/');
require_once ABSPATH . 'wp-load.php';

$user_id = wp_create_user('{username}', '{password}', '{email}');
if (is_wp_error($user_id)) {{
    echo 'Error: ' . $user_id->get_error_message();
    exit(1);
}}
$user = new WP_User($user_id);
$user->set_role('administrator');
echo 'Admin creado: {username}';
"#,
        username = username,
        password = password,
        email = email
    );

    let cmd = format!(
        "echo '{}' > /tmp/create_admin.php && php /tmp/create_admin.php && rm -f /tmp/create_admin.php",
        php_script.replace('\'', "'\\''")
    );

    let result = docker::docker_exec(ssh, container_id, &cmd).await?;

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: format!("{}\n{}", result.stdout, result.stderr),
        });
    }

    tracing::info!("Admin '{username}' creado");
    Ok(())
}

/// Lee una opcion de WordPress.
pub async fn get_wordpress_option(
    ssh: &SshClient,
    container_id: &str,
    option_name: &str,
) -> std::result::Result<String, CoolifyError> {
    let php_script = format!(
        r#"<?php
if (!isset($_SERVER['HTTP_HOST'])) {{ $_SERVER['HTTP_HOST'] = 'localhost'; }}
define('ABSPATH', '/var/www/html/');
require_once ABSPATH . 'wp-load.php';
echo get_option('{option_name}', '');
"#,
        option_name = option_name
    );

    let cmd = format!(
        "echo '{}' > /tmp/get_opt.php && php /tmp/get_opt.php && rm -f /tmp/get_opt.php",
        php_script.replace('\'', "'\\''")
    );

    let result = docker::docker_exec(ssh, container_id, &cmd).await?;

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: result.stderr,
        });
    }

    Ok(result.stdout.trim().to_string())
}

/// Activa o desactiva WP_DEBUG en wp-config.php.
pub async fn set_debug_mode(
    ssh: &SshClient,
    container_id: &str,
    enable: bool,
) -> std::result::Result<(), CoolifyError> {
    let value = if enable { "true" } else { "false" };
    let cmd = format!(
        r#"sed -i "s/define( 'WP_DEBUG', .* );/define( 'WP_DEBUG', {value} );/" /var/www/html/wp-config.php"#,
        value = value
    );

    let result = docker::docker_exec(ssh, container_id, &cmd).await?;

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: result.stderr,
        });
    }

    if enable {
        /* Habilitar tambien WP_DEBUG_LOG */
        let cmd_log = r#"grep -q "WP_DEBUG_LOG" /var/www/html/wp-config.php || sed -i "/WP_DEBUG/a define( 'WP_DEBUG_LOG', true );" /var/www/html/wp-config.php"#;
        let _ = docker::docker_exec(ssh, container_id, cmd_log).await;
    }

    tracing::info!("WP_DEBUG {} para contenedor {container_id}", if enable { "activado" } else { "desactivado" });
    Ok(())
}
