/*
 * Cliente SSH nativo usando russh.
 * Reemplaza las llamadas a ssh.exe del PowerShell original.
 * Soporte para ejecucion de comandos remotos, transferencia de archivos y multiplexing.
 */

use crate::domain::CommandOutput;
use crate::error::{CoolifyError, SshError};

use async_trait::async_trait;
use russh::*;
use russh_keys::key;
use std::path::Path;
use std::sync::Arc;

const SSH_TIMEOUT_SECS: u64 = 30;
const CHANNEL_TIMEOUT_SECS: u64 = 300;

struct ClientHandler;

#[async_trait]
impl client::Handler for ClientHandler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &key::PublicKey,
    ) -> Result<bool, Self::Error> {
        /* Aceptar todas las claves del servidor (equivalente al comportamiento de ssh.exe con StrictHostKeyChecking=no) */
        Ok(true)
    }
}

pub struct SshClient {
    host: String,
    user: String,
    ssh_key_path: Option<String>,
    session: Option<client::Handle<ClientHandler>>,
}

impl SshClient {
    pub fn new(host: &str, user: &str, ssh_key_path: Option<&str>) -> Self {
        Self {
            host: host.to_string(),
            user: user.to_string(),
            ssh_key_path: ssh_key_path.map(|s| s.to_string()),
            session: None,
        }
    }

    /// Establece conexion SSH al servidor.
    pub async fn connect(&mut self) -> std::result::Result<(), CoolifyError> {
        let config = client::Config {
            inactivity_timeout: Some(std::time::Duration::from_secs(CHANNEL_TIMEOUT_SECS)),
            ..Default::default()
        };

        let config = Arc::new(config);
        let handler = ClientHandler;

        let addr = format!("{}:22", self.host);
        let mut session = tokio::time::timeout(
            std::time::Duration::from_secs(SSH_TIMEOUT_SECS),
            client::connect(config, &addr, handler),
        )
        .await
        .map_err(|_| SshError::ChannelTimeout {
            seconds: SSH_TIMEOUT_SECS,
        })?
        .map_err(|e| SshError::ConnectionRefused {
            host: self.host.clone(),
            reason: e.to_string(),
        })?;

        /* Autenticar con clave SSH */
        let key_path = self.resolve_key_path();
        let key = russh_keys::load_secret_key(&key_path, None).map_err(|_e| SshError::AuthFailed {
            user: self.user.clone(),
            host: self.host.clone(),
        })?;

        let auth_result = session
            .authenticate_publickey(&self.user, Arc::new(key))
            .await
            .map_err(|_e| SshError::AuthFailed {
                user: self.user.clone(),
                host: self.host.clone(),
            })?;

        if !auth_result {
            return Err(SshError::AuthFailed {
                user: self.user.clone(),
                host: self.host.clone(),
            }
            .into());
        }

        self.session = Some(session);
        tracing::debug!("SSH conectado a {}@{}", self.user, self.host);
        Ok(())
    }

    /// Ejecuta un comando remoto y retorna stdout, stderr y exit code.
    pub async fn execute(&self, command: &str) -> std::result::Result<CommandOutput, CoolifyError> {
        let session = self
            .session
            .as_ref()
            .ok_or(SshError::Disconnected)?;

        let mut channel = session.channel_open_session().await.map_err(|e| SshError::ConnectionRefused {
            host: self.host.clone(),
            reason: e.to_string(),
        })?;

        /* Limpiar \r de Windows antes de enviar a Linux */
        let clean_command = command.replace('\r', "");
        channel.exec(true, clean_command).await.map_err(|e| SshError::CommandFailed {
            exit_code: -1,
            stderr: e.to_string(),
        })?;

        let mut stdout = Vec::new();
        let mut stderr = Vec::new();
        let mut exit_code = 0i32;

        loop {
            let msg = tokio::time::timeout(
                std::time::Duration::from_secs(CHANNEL_TIMEOUT_SECS),
                channel.wait(),
            )
            .await
            .map_err(|_| SshError::ChannelTimeout {
                seconds: CHANNEL_TIMEOUT_SECS,
            })?;

            match msg {
                Some(ChannelMsg::Data { data }) => {
                    stdout.extend_from_slice(&data);
                }
                Some(ChannelMsg::ExtendedData { data, ext }) => {
                    if ext == 1 {
                        stderr.extend_from_slice(&data);
                    }
                }
                Some(ChannelMsg::ExitStatus { exit_status }) => {
                    exit_code = exit_status as i32;
                }
                None => break,
                _ => {}
            }
        }

        Ok(CommandOutput {
            stdout: String::from_utf8_lossy(&stdout).to_string(),
            stderr: String::from_utf8_lossy(&stderr).to_string(),
            exit_code,
        })
    }

    /// Sube un archivo al servidor remoto via SCP (cat > file).
    pub async fn upload_file(
        &self,
        local_path: &Path,
        remote_path: &str,
    ) -> std::result::Result<(), CoolifyError> {
        let content = std::fs::read(local_path)?;
        let encoded = base64_encode(&content);

        let cmd = format!("echo '{}' | base64 -d > {}", encoded, remote_path);
        let result = self.execute(&cmd).await?;

        if !result.success() {
            return Err(SshError::CommandFailed {
                exit_code: result.exit_code,
                stderr: result.stderr,
            }
            .into());
        }

        Ok(())
    }

    /// Descarga un archivo del servidor remoto.
    pub async fn download_file(
        &self,
        remote_path: &str,
        local_path: &Path,
    ) -> std::result::Result<(), CoolifyError> {
        let cmd = format!("base64 {}", remote_path);
        let result = self.execute(&cmd).await?;

        if !result.success() {
            return Err(SshError::CommandFailed {
                exit_code: result.exit_code,
                stderr: result.stderr,
            }
            .into());
        }

        let decoded = base64_decode(&result.stdout.trim())?;
        std::fs::write(local_path, decoded)?;
        Ok(())
    }

    /// Verifica si la conexion SSH esta activa.
    pub async fn test_connection(&self) -> bool {
        match self.execute("echo ok").await {
            Ok(output) => output.stdout.trim() == "ok",
            Err(_) => false,
        }
    }

    fn resolve_key_path(&self) -> String {
        if let Some(ref key) = self.ssh_key_path {
            return key.clone();
        }
        /* Ruta por defecto de SSH key */
        if let Some(home) = dirs::home_dir() {
            let default_key = home.join(".ssh").join("id_ed25519");
            if default_key.exists() {
                return default_key.display().to_string();
            }
            let rsa_key = home.join(".ssh").join("id_rsa");
            if rsa_key.exists() {
                return rsa_key.display().to_string();
            }
        }
        "~/.ssh/id_ed25519".to_string()
    }
}

fn base64_encode(data: &[u8]) -> String {
    /* Implementacion simple con chunks para evitar problemas de longitud de linea */
    let chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let combined = (b0 << 16) | (b1 << 8) | b2;
        result.push(chars[((combined >> 18) & 0x3F) as usize] as char);
        result.push(chars[((combined >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(chars[((combined >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(chars[(combined & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

fn base64_decode(input: &str) -> std::result::Result<Vec<u8>, CoolifyError> {
    let input = input.replace(['\n', '\r', ' '], "");
    let chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = Vec::new();

    let lookup = |c: u8| -> std::result::Result<u32, CoolifyError> {
        if c == b'=' {
            return Ok(0);
        }
        chars
            .iter()
            .position(|&ch| ch == c)
            .map(|p| p as u32)
            .ok_or_else(|| CoolifyError::Validation(format!("Caracter base64 invalido: {}", c as char)))
    };

    for chunk in input.as_bytes().chunks(4) {
        if chunk.len() < 4 {
            break;
        }
        let b0 = lookup(chunk[0])?;
        let b1 = lookup(chunk[1])?;
        let b2 = lookup(chunk[2])?;
        let b3 = lookup(chunk[3])?;
        let combined = (b0 << 18) | (b1 << 12) | (b2 << 6) | b3;
        result.push(((combined >> 16) & 0xFF) as u8);
        if chunk[2] != b'=' {
            result.push(((combined >> 8) & 0xFF) as u8);
        }
        if chunk[3] != b'=' {
            result.push((combined & 0xFF) as u8);
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base64_roundtrip() {
        let original = b"Hello, World!";
        let encoded = base64_encode(original);
        let decoded = base64_decode(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_base64_roundtrip_binary() {
        let original: Vec<u8> = (0..=255).collect();
        let encoded = base64_encode(&original);
        let decoded = base64_decode(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_base64_empty() {
        let encoded = base64_encode(b"");
        let decoded = base64_decode(&encoded).unwrap();
        assert!(decoded.is_empty());
    }

    #[test]
    fn test_ssh_client_creation() {
        let client = SshClient::new("1.2.3.4", "root", None);
        assert_eq!(client.host, "1.2.3.4");
        assert_eq!(client.user, "root");
        assert!(client.session.is_none());
    }
}
