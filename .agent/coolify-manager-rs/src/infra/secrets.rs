/*
 * Manejo seguro de credenciales y secrets.
 * Usa secrecy para enmascarar valores sensibles en logs/debug.
 */

use secrecy::SecretString;

/// Enmascara un string para logging seguro (muestra solo primeros 4 chars).
pub fn mask_secret(value: &str) -> String {
    if value.len() <= 4 {
        return "****".to_string();
    }
    format!("{}...{}", &value[..4], "*".repeat(value.len().min(8) - 4))
}

/// Obtiene un secret de variable de entorno como SecretString.
pub fn env_secret(var_name: &str) -> Option<SecretString> {
    std::env::var(var_name).ok().map(SecretString::from)
}

#[cfg(test)]
mod tests {
    use secrecy::ExposeSecret;
    use super::*;

    #[test]
    fn test_mask_short() {
        assert_eq!(mask_secret("ab"), "****");
        assert_eq!(mask_secret("abcd"), "****");
    }

    #[test]
    fn test_mask_long() {
        let masked = mask_secret("my-secret-token");
        assert!(masked.starts_with("my-s"));
        assert!(masked.contains("*"));
        assert!(!masked.contains("secret-token"));
    }

    #[test]
    fn test_env_secret_missing() {
        std::env::remove_var("CM_TEST_NONEXISTENT_SECRET");
        assert!(env_secret("CM_TEST_NONEXISTENT_SECRET").is_none());
    }

    #[test]
    fn test_env_secret_present() {
        std::env::set_var("CM_TEST_SECRET_VAL", "my-value");
        let secret = env_secret("CM_TEST_SECRET_VAL");
        assert!(secret.is_some());
        assert_eq!(secret.unwrap().expose_secret(), "my-value");
        std::env::remove_var("CM_TEST_SECRET_VAL");
    }
}
