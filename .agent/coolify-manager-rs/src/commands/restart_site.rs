/*
 * Comando: restart-site
 * Reinicia los servicios (contenedores) de un sitio via Coolify API.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::coolify_api::CoolifyApiClient;
use crate::infra::validation;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: Option<&str>,
    all: bool,
    _only_db: bool,
    _only_wordpress: bool,
) -> std::result::Result<(), CoolifyError> {
    let settings = Settings::load(config_path)?;
    let api = CoolifyApiClient::new(&settings.coolify)?;

    let sites_to_restart: Vec<_> = if all {
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

    for site in &sites_to_restart {
        let uuid = site.stack_uuid.as_deref().unwrap();
        tracing::info!("Reiniciando '{}'...", site.nombre);

        match api.restart_service(uuid).await {
            Ok(()) => println!("'{}' reiniciado correctamente.", site.nombre),
            Err(e) => {
                tracing::error!("Error reiniciando '{}': {e}", site.nombre);
                println!("Error reiniciando '{}': {e}", site.nombre);
            }
        }
    }

    Ok(())
}
