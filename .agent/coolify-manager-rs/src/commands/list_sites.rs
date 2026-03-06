/*
 * Comando: list-sites
 * Lista todos los sitios configurados con su estado.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::coolify_api::CoolifyApiClient;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    detailed: bool,
) -> std::result::Result<(), CoolifyError> {
    let settings = Settings::load(config_path)?;

    if settings.sitios.is_empty() {
        println!("No hay sitios configurados.");
        return Ok(());
    }

    /* Obtener estado real de los servicios si se pide detalle */
    let api_services = if detailed {
        let api = CoolifyApiClient::new(&settings.coolify)?;
        match api.get_services().await {
            Ok(services) => services,
            Err(e) => {
                tracing::warn!("No se pudo obtener estado de servicios: {e}");
                vec![]
            }
        }
    } else {
        vec![]
    };

    println!("{:<15} {:<35} {:<25} {}", "NOMBRE", "DOMINIO", "STACK UUID", if detailed { "ESTADO" } else { "" });
    println!("{}", "-".repeat(if detailed { 90 } else { 75 }));

    for site in &settings.sitios {
        let uuid_display = site.stack_uuid.as_deref().unwrap_or("(sin asignar)");

        let status = if detailed {
            api_services
                .iter()
                .find(|s| Some(s.uuid.as_str()) == site.stack_uuid.as_deref())
                .map(|s| s.status.as_str())
                .unwrap_or("desconocido")
        } else {
            ""
        };

        println!("{:<15} {:<35} {:<25} {}", site.nombre, site.dominio, uuid_display, status);
    }

    /* Minecraft servers si existen */
    if !settings.minecraft.is_empty() {
        println!("\n--- Servidores Minecraft ---");
        for mc in &settings.minecraft {
            let uuid = mc.stack_uuid.as_deref().unwrap_or("(sin asignar)");
            println!("  {} ({}RAM, {}p) uuid={}", mc.server_name, mc.memory, mc.max_players, uuid);
        }
    }

    println!("\nTotal: {} sitio(s), {} minecraft", settings.sitios.len(), settings.minecraft.len());
    Ok(())
}
