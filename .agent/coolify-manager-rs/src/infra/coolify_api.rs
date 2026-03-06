/*
 * Cliente para la API REST de Coolify v4.
 * Equivale a CoolifyApi.psm1 del PowerShell original.
 */

use crate::config::CoolifyConfig;
use crate::domain::{ServiceInfo, StackCreationResult};
use crate::error::{ApiError, CoolifyError};

use reqwest::Client;
use serde_json::Value;
use std::time::Duration;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

pub struct CoolifyApiClient {
    client: Client,
    base_url: String,
    token: String,
}

impl CoolifyApiClient {
    pub fn new(config: &CoolifyConfig) -> std::result::Result<Self, CoolifyError> {
        let client = Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .build()
            .map_err(|e| ApiError::Network(e.to_string()))?;

        Ok(Self {
            client,
            base_url: config.base_url.trim_end_matches('/').to_string(),
            token: config.api_token.clone(),
        })
    }

    async fn request(
        &self,
        method: reqwest::Method,
        path: &str,
        body: Option<&Value>,
    ) -> std::result::Result<Value, CoolifyError> {
        let url = format!("{}{}", self.base_url, path);

        let mut req = self
            .client
            .request(method, &url)
            .header("Authorization", format!("Bearer {}", self.token))
            .header("Accept", "application/json")
            .header("Content-Type", "application/json");

        if let Some(b) = body {
            req = req.json(b);
        }

        let response = req.send().await.map_err(|e| {
            if e.is_timeout() {
                ApiError::Timeout {
                    seconds: REQUEST_TIMEOUT.as_secs(),
                }
            } else {
                ApiError::Network(e.to_string())
            }
        })?;

        let status = response.status();
        let body_text = response.text().await.map_err(|e| ApiError::Network(e.to_string()))?;

        if !status.is_success() {
            return Err(ApiError::HttpError {
                status: status.as_u16(),
                body: body_text,
            }
            .into());
        }

        if body_text.is_empty() {
            return Ok(Value::Null);
        }

        serde_json::from_str(&body_text).map_err(|e| ApiError::InvalidResponse(e.to_string()).into())
    }

    /// Lista todos los servidores en Coolify.
    pub async fn get_servers(&self) -> std::result::Result<Vec<Value>, CoolifyError> {
        let resp = self.request(reqwest::Method::GET, "/api/v1/servers", None).await?;
        Ok(resp.as_array().cloned().unwrap_or_default())
    }

    /// Lista todos los proyectos.
    pub async fn get_projects(&self) -> std::result::Result<Vec<Value>, CoolifyError> {
        let resp = self.request(reqwest::Method::GET, "/api/v1/projects", None).await?;
        Ok(resp.as_array().cloned().unwrap_or_default())
    }

    /// Lista todos los servicios (stacks).
    pub async fn get_services(&self) -> std::result::Result<Vec<ServiceInfo>, CoolifyError> {
        let resp = self.request(reqwest::Method::GET, "/api/v1/services", None).await?;
        let arr = resp.as_array().cloned().unwrap_or_default();

        let services = arr
            .into_iter()
            .filter_map(|v| {
                Some(ServiceInfo {
                    uuid: v.get("uuid")?.as_str()?.to_string(),
                    name: v.get("name")?.as_str()?.to_string(),
                    status: v
                        .get("status")
                        .and_then(|s| s.as_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    fqdn: v.get("fqdn").and_then(|s| s.as_str()).map(|s| s.to_string()),
                })
            })
            .collect();

        Ok(services)
    }

    /// Obtiene un servicio por UUID.
    pub async fn get_service(&self, uuid: &str) -> std::result::Result<Value, CoolifyError> {
        let path = format!("/api/v1/services/{uuid}");
        self.request(reqwest::Method::GET, &path, None).await
    }

    /// Crea un nuevo stack de WordPress + MariaDB.
    pub async fn create_stack(
        &self,
        name: &str,
        server_uuid: &str,
        project_uuid: &str,
        environment_name: &str,
        docker_compose: &str,
    ) -> std::result::Result<StackCreationResult, CoolifyError> {
        let body = serde_json::json!({
            "type": "docker-compose",
            "name": name,
            "server_uuid": server_uuid,
            "project_uuid": project_uuid,
            "environment_name": environment_name,
            "docker_compose_raw": docker_compose,
            "instant_deploy": true,
        });

        let resp = self
            .request(reqwest::Method::POST, "/api/v1/services", Some(&body))
            .await?;

        let uuid = resp
            .get("uuid")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ApiError::InvalidResponse("Respuesta sin uuid".into()))?
            .to_string();

        let result_name = resp
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or(name)
            .to_string();

        Ok(StackCreationResult {
            uuid,
            name: result_name,
        })
    }

    /// Inicia (deploy) un servicio.
    pub async fn start_service(&self, uuid: &str) -> std::result::Result<(), CoolifyError> {
        let path = format!("/api/v1/services/{uuid}/start");
        self.request(reqwest::Method::POST, &path, None).await?;
        Ok(())
    }

    /// Detiene un servicio.
    pub async fn stop_service(&self, uuid: &str) -> std::result::Result<(), CoolifyError> {
        let path = format!("/api/v1/services/{uuid}/stop");
        self.request(reqwest::Method::POST, &path, None).await?;
        Ok(())
    }

    /// Reinicia un servicio.
    pub async fn restart_service(&self, uuid: &str) -> std::result::Result<(), CoolifyError> {
        let path = format!("/api/v1/services/{uuid}/restart");
        self.request(reqwest::Method::POST, &path, None).await?;
        Ok(())
    }

    /// Prueba la conexion a la API.
    pub async fn test_connection(&self) -> std::result::Result<bool, CoolifyError> {
        match self.get_servers().await {
            Ok(_) => Ok(true),
            Err(e) => {
                tracing::warn!("Test de conexion API fallo: {e}");
                Ok(false)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let config = CoolifyConfig {
            base_url: "http://localhost:8000".into(),
            api_token: "test-token".into(),
            server_uuid: "srv-1".into(),
            project_uuid: "proj-1".into(),
            environment_name: "production".into(),
        };

        let client = CoolifyApiClient::new(&config);
        assert!(client.is_ok());
    }

    #[test]
    fn test_base_url_trailing_slash_stripped() {
        let config = CoolifyConfig {
            base_url: "http://localhost:8000/".into(),
            api_token: "tok".into(),
            server_uuid: "s".into(),
            project_uuid: "p".into(),
            environment_name: "prod".into(),
        };

        let client = CoolifyApiClient::new(&config).unwrap();
        assert_eq!(client.base_url, "http://localhost:8000");
    }
}
