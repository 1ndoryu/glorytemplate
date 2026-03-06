/*
 * Comando: redeploy
 * Fuerza un redeploy del servicio via Coolify API.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::coolify_api::CoolifyApiClient;
use crate::infra::validation;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: &str,
) -> std::result::Result<(), CoolifyError> {
    let settings = Settings::load(config_path)?;
    let site = settings.get_site(site_name)?;
    validation::assert_site_ready(site)?;

    let stack_uuid = site.stack_uuid.as_deref().unwrap();

    let api = CoolifyApiClient::new(&settings.coolify)?;

    tracing::info!("Forzando redeploy de '{site_name}' (uuid: {stack_uuid})");

    /* Stop + Start = redeploy completo (rebuild containers) */
    api.stop_service(stack_uuid).await?;

    tracing::info!("Servicio detenido, esperando antes de reiniciar...");
    tokio::time::sleep(std::time::Duration::from_secs(5)).await;

    api.start_service(stack_uuid).await?;

    println!("Redeploy iniciado para '{site_name}'. Verifica el estado en Coolify dashboard.");
    Ok(())
}
