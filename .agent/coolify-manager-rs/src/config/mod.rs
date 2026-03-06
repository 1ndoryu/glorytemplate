/*
 * Sistema de configuracion.
 * Lee settings.json, expande variables de entorno y valida schema.
 * Compatible 1:1 con el formato del coolify-manager PowerShell.
 */

use crate::domain::{MinecraftServer, SiteConfig};
use crate::error::{ConfigError, CoolifyError};

use secrecy::SecretString;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

static CONFIG_CACHE: OnceLock<Settings> = OnceLock::new();

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub vps: VpsConfig,
    pub coolify: CoolifyConfig,
    pub wordpress: WordPressConfig,
    pub glory: GloryConfig,
    #[serde(default)]
    pub sitios: Vec<SiteConfig>,
    #[serde(default)]
    pub minecraft: Vec<MinecraftServer>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpsConfig {
    pub ip: String,
    pub user: String,
    #[serde(rename = "sshKey", default)]
    pub ssh_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoolifyConfig {
    #[serde(rename = "baseUrl")]
    pub base_url: String,
    #[serde(rename = "apiToken")]
    pub api_token: String,
    #[serde(rename = "serverUuid")]
    pub server_uuid: String,
    #[serde(rename = "projectUuid")]
    pub project_uuid: String,
    #[serde(rename = "environmentName", default = "default_env_name")]
    pub environment_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordPressConfig {
    #[serde(rename = "dbUser")]
    pub db_user: String,
    #[serde(rename = "dbPassword")]
    pub db_password: String,
    #[serde(rename = "defaultAdminEmail")]
    pub default_admin_email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GloryConfig {
    #[serde(rename = "templateRepo")]
    pub template_repo: String,
    #[serde(rename = "libraryRepo")]
    pub library_repo: String,
    #[serde(rename = "defaultBranch", default = "default_branch")]
    pub default_branch: String,
}

fn default_env_name() -> String {
    "production".to_string()
}

fn default_branch() -> String {
    "main".to_string()
}

impl Settings {
    /// Carga la configuracion desde settings.json con expansion de variables de entorno.
    pub fn load(config_path: &Path) -> std::result::Result<Self, CoolifyError> {
        if !config_path.exists() {
            return Err(ConfigError::FileNotFound {
                path: config_path.display().to_string(),
            }
            .into());
        }

        let raw = std::fs::read_to_string(config_path).map_err(|e| ConfigError::Parse(e.to_string()))?;
        let expanded = expand_env_vars(&raw);
        let settings: Settings = serde_json::from_str(&expanded).map_err(|e| ConfigError::Parse(e.to_string()))?;

        Ok(settings)
    }

    /// Carga con cache global (una sola lectura por proceso).
    pub fn load_cached(config_path: &Path) -> std::result::Result<&'static Settings, CoolifyError> {
        if let Some(cached) = CONFIG_CACHE.get() {
            return Ok(cached);
        }
        let settings = Self::load(config_path)?;
        /* Si otro hilo inicializo primero, usamos su version */
        let _ = CONFIG_CACHE.set(settings);
        Ok(CONFIG_CACHE.get().expect("CONFIG_CACHE recien inicializado"))
    }

    /// Busca un sitio por nombre.
    pub fn get_site(&self, name: &str) -> std::result::Result<&SiteConfig, CoolifyError> {
        self.sitios
            .iter()
            .find(|s| s.nombre == name)
            .ok_or_else(|| CoolifyError::SiteNotFound(name.to_string()))
    }

    /// Busca un servidor Minecraft por nombre.
    pub fn get_minecraft(&self, name: &str) -> std::result::Result<&MinecraftServer, CoolifyError> {
        self.minecraft
            .iter()
            .find(|m| m.server_name == name)
            .ok_or_else(|| CoolifyError::SiteNotFound(format!("minecraft:{name}")))
    }

    /// Obtiene el password de DB de forma segura (env var > config).
    pub fn get_db_password(&self, site_name: &str) -> SecretString {
        let env_key = format!("DB_PASSWORD_{}", site_name.to_uppercase().replace('-', "_"));
        if let Ok(val) = std::env::var(&env_key) {
            return SecretString::from(val);
        }
        if let Ok(val) = std::env::var("COOLIFY_DB_PASSWORD") {
            return SecretString::from(val);
        }
        SecretString::from(self.wordpress.db_password.clone())
    }

    /// Resuelve la ruta al archivo de configuracion.
    pub fn resolve_config_path(explicit: Option<&Path>) -> PathBuf {
        if let Some(p) = explicit {
            return p.to_path_buf();
        }
        /* Buscar relativo al ejecutable primero */
        if let Ok(exe) = std::env::current_exe() {
            let candidate = exe.parent().unwrap_or(Path::new(".")).join("config").join("settings.json");
            if candidate.exists() {
                return candidate;
            }
        }
        /* Fallback: directorio actual */
        PathBuf::from("config").join("settings.json")
    }

    /// Agrega un sitio nuevo a la configuracion y persiste a disco.
    pub fn add_site(&mut self, site: SiteConfig, config_path: &Path) -> std::result::Result<(), CoolifyError> {
        if self.sitios.iter().any(|s| s.nombre == site.nombre) {
            return Err(CoolifyError::Validation(format!(
                "Sitio '{}' ya existe en configuracion",
                site.nombre
            )));
        }
        self.sitios.push(site);
        self.save(config_path)
    }

    /// Persiste la configuracion actual a disco.
    pub fn save(&self, config_path: &Path) -> std::result::Result<(), CoolifyError> {
        let json = serde_json::to_string_pretty(self).map_err(|e| ConfigError::Parse(e.to_string()))?;
        std::fs::write(config_path, json)?;
        Ok(())
    }
}

/// Expande patrones `${VAR_NAME}` con valores de variables de entorno.
fn expand_env_vars(input: &str) -> String {
    let re = regex::Regex::new(r"\$\{([^}]+)\}").expect("regex valido");
    re.replace_all(input, |caps: &regex::Captures| {
        let var_name = &caps[1];
        std::env::var(var_name).unwrap_or_else(|_| {
            tracing::warn!("Variable de entorno '{var_name}' no definida, dejando vacio");
            String::new()
        })
    })
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use secrecy::ExposeSecret;
    use std::io::Write;
    use tempfile::NamedTempFile;

    fn create_temp_config(json: &str) -> NamedTempFile {
        let mut f = NamedTempFile::new().unwrap();
        f.write_all(json.as_bytes()).unwrap();
        f.flush().unwrap();
        f
    }

    #[test]
    fn test_load_minimal_config() {
        let json = r#"{
            "vps": { "ip": "1.2.3.4", "user": "root" },
            "coolify": {
                "baseUrl": "http://1.2.3.4:8000",
                "apiToken": "test-token",
                "serverUuid": "srv-1",
                "projectUuid": "proj-1"
            },
            "wordpress": {
                "dbUser": "manager",
                "dbPassword": "secret",
                "defaultAdminEmail": "a@b.com"
            },
            "glory": {
                "templateRepo": "https://github.com/test/template.git",
                "libraryRepo": "https://github.com/test/lib.git"
            }
        }"#;

        let f = create_temp_config(json);
        let settings = Settings::load(f.path()).unwrap();

        assert_eq!(settings.vps.ip, "1.2.3.4");
        assert_eq!(settings.vps.user, "root");
        assert_eq!(settings.coolify.api_token, "test-token");
        assert_eq!(settings.wordpress.db_user, "manager");
        assert_eq!(settings.glory.default_branch, "main");
        assert!(settings.sitios.is_empty());
        assert!(settings.minecraft.is_empty());
    }

    #[test]
    fn test_load_with_sites() {
        let json = r#"{
            "vps": { "ip": "1.2.3.4", "user": "root" },
            "coolify": {
                "baseUrl": "http://1.2.3.4:8000",
                "apiToken": "tok",
                "serverUuid": "s",
                "projectUuid": "p"
            },
            "wordpress": { "dbUser": "u", "dbPassword": "p", "defaultAdminEmail": "a@b.c" },
            "glory": { "templateRepo": "r1", "libraryRepo": "r2" },
            "sitios": [
                { "nombre": "blog", "dominio": "https://blog.com", "stackUuid": "abc123" },
                { "nombre": "shop", "dominio": "https://shop.com" }
            ]
        }"#;

        let f = create_temp_config(json);
        let settings = Settings::load(f.path()).unwrap();

        assert_eq!(settings.sitios.len(), 2);
        assert_eq!(settings.get_site("blog").unwrap().nombre, "blog");
        assert_eq!(
            settings.get_site("blog").unwrap().stack_uuid.as_deref(),
            Some("abc123")
        );
        assert!(settings.get_site("nonexistent").is_err());
    }

    #[test]
    fn test_env_var_expansion() {
        std::env::set_var("TEST_CM_TOKEN", "expanded-token");
        let input = r#"{"token": "${TEST_CM_TOKEN}", "other": "literal"}"#;
        let result = expand_env_vars(input);
        assert!(result.contains("expanded-token"));
        assert!(result.contains("literal"));
        std::env::remove_var("TEST_CM_TOKEN");
    }

    #[test]
    fn test_env_var_missing_leaves_empty() {
        std::env::remove_var("NONEXISTENT_VAR_CM_TEST");
        let input = r#"{"val": "${NONEXISTENT_VAR_CM_TEST}"}"#;
        let result = expand_env_vars(input);
        assert!(result.contains(r#""val": """#));
    }

    #[test]
    fn test_config_file_not_found() {
        let result = Settings::load(Path::new("/nonexistent/path/settings.json"));
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(matches!(err, CoolifyError::Config(ConfigError::FileNotFound { .. })));
    }

    #[test]
    fn test_add_site() {
        let json = r#"{
            "vps": { "ip": "1.2.3.4", "user": "root" },
            "coolify": { "baseUrl": "u", "apiToken": "t", "serverUuid": "s", "projectUuid": "p" },
            "wordpress": { "dbUser": "u", "dbPassword": "p", "defaultAdminEmail": "a@b.c" },
            "glory": { "templateRepo": "r1", "libraryRepo": "r2" },
            "sitios": []
        }"#;

        let f = create_temp_config(json);
        let mut settings = Settings::load(f.path()).unwrap();

        let new_site = SiteConfig {
            nombre: "nuevo".to_string(),
            dominio: "https://nuevo.com".to_string(),
            stack_uuid: Some("uuid-123".to_string()),
            glory_branch: "main".to_string(),
            library_branch: "main".to_string(),
            theme_name: "glory".to_string(),
            skip_react: false,
            template: crate::domain::StackTemplate::Wordpress,
        };

        settings.add_site(new_site, f.path()).unwrap();
        assert_eq!(settings.sitios.len(), 1);
        assert_eq!(settings.sitios[0].nombre, "nuevo");

        /* Verificar que se persistio */
        let reloaded = Settings::load(f.path()).unwrap();
        assert_eq!(reloaded.sitios.len(), 1);
        assert_eq!(reloaded.sitios[0].nombre, "nuevo");
    }

    #[test]
    fn test_add_duplicate_site_fails() {
        let json = r#"{
            "vps": { "ip": "1.2.3.4", "user": "root" },
            "coolify": { "baseUrl": "u", "apiToken": "t", "serverUuid": "s", "projectUuid": "p" },
            "wordpress": { "dbUser": "u", "dbPassword": "p", "defaultAdminEmail": "a@b.c" },
            "glory": { "templateRepo": "r1", "libraryRepo": "r2" },
            "sitios": [{ "nombre": "blog", "dominio": "https://blog.com" }]
        }"#;

        let f = create_temp_config(json);
        let mut settings = Settings::load(f.path()).unwrap();

        let dup = SiteConfig {
            nombre: "blog".to_string(),
            dominio: "https://blog2.com".to_string(),
            stack_uuid: None,
            glory_branch: "main".to_string(),
            library_branch: "main".to_string(),
            theme_name: "glory".to_string(),
            skip_react: false,
            template: crate::domain::StackTemplate::Wordpress,
        };

        assert!(settings.add_site(dup, f.path()).is_err());
    }

    #[test]
    fn test_get_db_password_priority() {
        let json = r#"{
            "vps": { "ip": "1.2.3.4", "user": "root" },
            "coolify": { "baseUrl": "u", "apiToken": "t", "serverUuid": "s", "projectUuid": "p" },
            "wordpress": { "dbUser": "u", "dbPassword": "config-pass", "defaultAdminEmail": "a@b.c" },
            "glory": { "templateRepo": "r1", "libraryRepo": "r2" }
        }"#;

        let f = create_temp_config(json);
        let settings = Settings::load(f.path()).unwrap();

        /* Sin env vars, usa config */
        std::env::remove_var("DB_PASSWORD_BLOG");
        std::env::remove_var("COOLIFY_DB_PASSWORD");
        let pass = settings.get_db_password("blog");
        assert_eq!(pass.expose_secret(), "config-pass");

        /* Con env var especifica del sitio */
        std::env::set_var("DB_PASSWORD_BLOG", "site-specific");
        let pass = settings.get_db_password("blog");
        assert_eq!(pass.expose_secret(), "site-specific");
        std::env::remove_var("DB_PASSWORD_BLOG");
    }
}
