/*
 * Comando: debug-site
 * Activa o desactiva WP_DEBUG en un sitio WordPress.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;
use crate::infra::validation;
use crate::services::site_manager;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: &str,
    enable: bool,
    disable: bool,
    _status: bool,
) -> std::result::Result<(), CoolifyError> {
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

    let wp_container = docker::find_wordpress_container(&ssh, stack_uuid).await?;

    if enable {
        site_manager::set_debug_mode(&ssh, &wp_container, true).await?;
        println!("WP_DEBUG activado en '{site_name}'.");
    } else if disable {
        site_manager::set_debug_mode(&ssh, &wp_container, false).await?;
        println!("WP_DEBUG desactivado en '{site_name}'.");
    } else {
        /* Status por defecto */
        let result = docker::docker_exec(
            &ssh,
            &wp_container,
            "grep 'WP_DEBUG' /var/www/html/wp-config.php 2>/dev/null || echo 'WP_DEBUG no encontrado'",
        )
        .await?;
        println!("{}", result.stdout.trim());
    }

    Ok(())
}
