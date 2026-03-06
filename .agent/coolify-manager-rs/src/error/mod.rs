/*
 * Tipos de error por dominio.
 * Cada capa tiene su propio tipo para dar contexto preciso.
 */

use thiserror::Error;

#[derive(Error, Debug)]
pub enum CoolifyError {
    #[error("Configuracion: {0}")]
    Config(#[from] ConfigError),

    #[error("API Coolify: {0}")]
    Api(#[from] ApiError),

    #[error("SSH: {0}")]
    Ssh(#[from] SshError),

    #[error("Docker exec fallo (exit {exit_code}): {stderr}")]
    Docker { exit_code: i32, stderr: String },

    #[error("Validacion: {0}")]
    Validation(String),

    #[error("Sitio '{0}' no encontrado en configuracion")]
    SiteNotFound(String),

    #[error("Operacion revertida: {0}")]
    RolledBack(String),

    #[error("Template: {0}")]
    Template(String),

    #[error("IO: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Error, Debug)]
pub enum ConfigError {
    #[error("Archivo de configuracion no encontrado: {path}")]
    FileNotFound { path: String },

    #[error("Error parseando configuracion: {0}")]
    Parse(String),

    #[error("Variable de entorno '{var}' no definida")]
    EnvVarMissing { var: String },

    #[error("Campo requerido '{field}' falta en configuracion")]
    MissingField { field: String },

    #[error("Valor invalido para '{field}': {reason}")]
    InvalidValue { field: String, reason: String },
}

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("HTTP {status}: {body}")]
    HttpError { status: u16, body: String },

    #[error("Timeout despues de {seconds}s")]
    Timeout { seconds: u64 },

    #[error("Red: {0}")]
    Network(String),

    #[error("Respuesta invalida: {0}")]
    InvalidResponse(String),

    #[error("Servicio no encontrado: {uuid}")]
    ServiceNotFound { uuid: String },
}

#[derive(Error, Debug)]
pub enum SshError {
    #[error("Conexion rechazada a {host}: {reason}")]
    ConnectionRefused { host: String, reason: String },

    #[error("Autenticacion fallida para {user}@{host}")]
    AuthFailed { user: String, host: String },

    #[error("Comando fallo (exit {exit_code}): {stderr}")]
    CommandFailed { exit_code: i32, stderr: String },

    #[error("Contenedor '{filter}' no encontrado")]
    ContainerNotFound { filter: String },

    #[error("Timeout SSH despues de {seconds}s")]
    ChannelTimeout { seconds: u64 },

    #[error("Conexion SSH cerrada")]
    Disconnected,
}

pub type Result<T> = std::result::Result<T, CoolifyError>;
