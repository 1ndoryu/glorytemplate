/*
 * Comando: set-domain
 * Cambia el dominio de un sitio WordPress.
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
    new_domain: &str,
) -> std::result::Result<(), CoolifyError> {
    validation::validate_domain(new_domain)?;

    let mut settings = Settings::load(config_path)?;
    let site = settings.get_site(site_name)?;
    validation::assert_site_ready(site)?;

    let stack_uuid = site.stack_uuid.as_deref().unwrap().to_string();
    let old_domain = site.dominio.clone();

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    let wp_container = docker::find_wordpress_container(&ssh, &stack_uuid).await?;

    /* Actualizar URLs en WordPress */
    site_manager::set_wordpress_urls(&ssh, &wp_container, new_domain).await?;

    /* Actualizar configuracion local */
    if let Some(site_mut) = settings.sitios.iter_mut().find(|s| s.nombre == site_name) {
        site_mut.dominio = new_domain.to_string();
    }
    settings.save(config_path)?;

    println!("Dominio actualizado: {old_domain} -> {new_domain}");
    println!("Nota: Actualiza tambien el FQDN en Coolify dashboard si es necesario.");
    Ok(())
}
