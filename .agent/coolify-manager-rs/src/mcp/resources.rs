/*
 * MCP Resources — recursos expuestos via MCP.
 * Provee acceso de lectura a configuracion, sitios, logs y templates.
 */

use crate::config::Settings;
use crate::error::CoolifyError;

use serde_json::Value;

/// Retorna la lista de recursos disponibles.
pub fn list_resources() -> Vec<Value> {
    vec![
        serde_json::json!({
            "uri": "coolify://config",
            "name": "Configuracion",
            "description": "Configuracion actual del coolify-manager (sin secrets)",
            "mimeType": "application/json"
        }),
        serde_json::json!({
            "uri": "coolify://sites",
            "name": "Sitios",
            "description": "Lista de todos los sitios configurados",
            "mimeType": "application/json"
        }),
        serde_json::json!({
            "uri": "coolify://minecraft",
            "name": "Minecraft",
            "description": "Lista de servidores Minecraft configurados",
            "mimeType": "application/json"
        }),
        serde_json::json!({
            "uri": "coolify://templates",
            "name": "Templates",
            "description": "Templates de Docker Compose disponibles",
            "mimeType": "application/json"
        }),
    ]
}

/// Lee el contenido de un recurso por URI.
pub async fn read_resource(uri: &str) -> std::result::Result<String, CoolifyError> {
    let config_path = Settings::resolve_config_path(None);

    match uri {
        "coolify://config" => {
            let settings = Settings::load(&config_path)?;
            /* Sanitizar: no exponer tokens ni passwords */
            let safe = serde_json::json!({
                "vps": {
                    "ip": settings.vps.ip,
                    "user": settings.vps.user
                },
                "coolify": {
                    "baseUrl": settings.coolify.base_url,
                    "serverUuid": settings.coolify.server_uuid,
                    "projectUuid": settings.coolify.project_uuid,
                    "environmentName": settings.coolify.environment_name,
                    "apiToken": "***"
                },
                "wordpress": {
                    "dbUser": settings.wordpress.db_user,
                    "dbPassword": "***",
                    "defaultAdminEmail": settings.wordpress.default_admin_email
                },
                "glory": settings.glory,
                "totalSitios": settings.sitios.len(),
                "totalMinecraft": settings.minecraft.len()
            });
            Ok(serde_json::to_string_pretty(&safe).unwrap_or_default())
        }

        "coolify://sites" => {
            let settings = Settings::load(&config_path)?;
            let sites: Vec<Value> = settings
                .sitios
                .iter()
                .map(|s| {
                    serde_json::json!({
                        "nombre": s.nombre,
                        "dominio": s.dominio,
                        "stackUuid": s.stack_uuid,
                        "gloryBranch": s.glory_branch,
                        "libraryBranch": s.library_branch,
                        "themeName": s.theme_name,
                        "skipReact": s.skip_react,
                        "template": s.template.to_string()
                    })
                })
                .collect();
            Ok(serde_json::to_string_pretty(&sites).unwrap_or_default())
        }

        "coolify://minecraft" => {
            let settings = Settings::load(&config_path)?;
            let servers: Vec<Value> = settings
                .minecraft
                .iter()
                .map(|m| {
                    serde_json::json!({
                        "serverName": m.server_name,
                        "stackUuid": m.stack_uuid,
                        "memory": m.memory,
                        "maxPlayers": m.max_players,
                        "difficulty": m.difficulty
                    })
                })
                .collect();
            Ok(serde_json::to_string_pretty(&servers).unwrap_or_default())
        }

        "coolify://templates" => {
            let templates_dir = config_path
                .parent()
                .unwrap_or(std::path::Path::new("."))
                .join("templates");

            let templates: Vec<String> = if templates_dir.exists() {
                std::fs::read_dir(&templates_dir)
                    .into_iter()
                    .flatten()
                    .filter_map(|e| e.ok())
                    .filter(|e| {
                        e.path()
                            .extension()
                            .map(|ext| ext == "yaml" || ext == "yml")
                            .unwrap_or(false)
                    })
                    .filter_map(|e| e.file_name().into_string().ok())
                    .collect()
            } else {
                vec![]
            };

            Ok(serde_json::to_string_pretty(&templates).unwrap_or_default())
        }

        _ => Err(CoolifyError::Validation(format!("Recurso desconocido: {uri}"))),
    }
}
