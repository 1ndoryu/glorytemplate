/*
 * Comando: cache-site
 * Gestiona cache headers HTTP de un sitio WordPress.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;
use crate::infra::validation;
use crate::services::cache_manager;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: Option<&str>,
    action: &str,
    all: bool,
) -> std::result::Result<(), CoolifyError> {
    /* Validar accion */
    let valid_actions = ["status", "enable", "disable"];
    if !valid_actions.contains(&action) {
        return Err(CoolifyError::Validation(format!(
            "Accion invalida '{}'. Usa: {}",
            action,
            valid_actions.join(", ")
        )));
    }

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

    for site in &sites {
        let stack_uuid = site.stack_uuid.as_deref().unwrap();
        let wp_container = docker::find_wordpress_container(&ssh, stack_uuid).await?;

        match action {
            "status" => {
                let enabled = cache_manager::get_cache_status(&ssh, &wp_container).await?;
                println!("{}: cache {}", site.nombre, if enabled { "HABILITADO" } else { "DESHABILITADO" });
            }
            "enable" => {
                cache_manager::enable_cache_headers(&ssh, &wp_container).await?;
                println!("{}: cache habilitado.", site.nombre);
            }
            "disable" => {
                cache_manager::disable_cache_headers(&ssh, &wp_container).await?;
                println!("{}: cache deshabilitado.", site.nombre);
            }
            _ => unreachable!(),
        }
    }

    Ok(())
}
