/*
 * Servidor MCP con transporte stdio (JSON-RPC 2.0).
 * Atiende peticiones de VS Code Copilot via stdin/stdout.
 */

use crate::error::CoolifyError;
use crate::mcp::{resources, tools};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::{self, BufRead, Write};

const MCP_VERSION: &str = "2024-11-05";

#[derive(Debug, Deserialize)]
struct JsonRpcRequest {
    #[allow(dead_code)]
    jsonrpc: String,
    id: Option<Value>,
    method: String,
    #[serde(default)]
    params: Value,
}

#[derive(Debug, Serialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    id: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<JsonRpcError>,
}

#[derive(Debug, Serialize)]
struct JsonRpcError {
    code: i32,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<Value>,
}

impl JsonRpcResponse {
    fn success(id: Value, result: Value) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id,
            result: Some(result),
            error: None,
        }
    }

    fn error(id: Value, code: i32, message: String) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(JsonRpcError {
                code,
                message,
                data: None,
            }),
        }
    }
}

pub async fn run() -> std::result::Result<(), CoolifyError> {
    tracing::info!("Servidor MCP iniciado (stdio)");

    let stdin = io::stdin();
    let stdout = io::stdout();

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(e) => {
                tracing::error!("Error leyendo stdin: {e}");
                break;
            }
        };

        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let request: JsonRpcRequest = match serde_json::from_str(line) {
            Ok(r) => r,
            Err(e) => {
                let err_response = JsonRpcResponse::error(
                    Value::Null,
                    -32700,
                    format!("Error parseando JSON: {e}"),
                );
                send_response(&stdout, &err_response);
                continue;
            }
        };

        let id = request.id.clone().unwrap_or(Value::Null);
        let response = handle_request(request).await;

        /* Solo responder si tiene id (no es notificacion) */
        if id != Value::Null {
            send_response(&stdout, &response);
        }
    }

    tracing::info!("Servidor MCP finalizado");
    Ok(())
}

fn send_response(stdout: &io::Stdout, response: &JsonRpcResponse) {
    let json = match serde_json::to_string(response) {
        Ok(j) => j,
        Err(e) => {
            tracing::error!("Error serializando respuesta: {e}");
            return;
        }
    };

    let mut out = stdout.lock();
    if writeln!(out, "{json}").is_err() {
        tracing::error!("Error escribiendo a stdout");
    }
    let _ = out.flush();
}

async fn handle_request(request: JsonRpcRequest) -> JsonRpcResponse {
    let id = request.id.clone().unwrap_or(Value::Null);

    match request.method.as_str() {
        "initialize" => handle_initialize(id),
        "initialized" => JsonRpcResponse::success(id, Value::Null),
        "tools/list" => handle_tools_list(id),
        "tools/call" => handle_tools_call(id, request.params).await,
        "resources/list" => handle_resources_list(id),
        "resources/read" => handle_resources_read(id, request.params).await,
        "ping" => JsonRpcResponse::success(id, serde_json::json!({})),
        _ => JsonRpcResponse::error(id, -32601, format!("Metodo no soportado: {}", request.method)),
    }
}

fn handle_initialize(id: Value) -> JsonRpcResponse {
    JsonRpcResponse::success(
        id,
        serde_json::json!({
            "protocolVersion": MCP_VERSION,
            "capabilities": {
                "tools": {},
                "resources": {}
            },
            "serverInfo": {
                "name": "coolify-manager",
                "version": env!("CARGO_PKG_VERSION")
            }
        }),
    )
}

fn handle_tools_list(id: Value) -> JsonRpcResponse {
    JsonRpcResponse::success(id, serde_json::json!({ "tools": tools::list_tools() }))
}

async fn handle_tools_call(id: Value, params: Value) -> JsonRpcResponse {
    let tool_name = params
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let arguments = params
        .get("arguments")
        .cloned()
        .unwrap_or(serde_json::json!({}));

    match tools::call_tool(tool_name, arguments).await {
        Ok(result) => JsonRpcResponse::success(
            id,
            serde_json::json!({
                "content": [{
                    "type": "text",
                    "text": result
                }]
            }),
        ),
        Err(e) => JsonRpcResponse::success(
            id,
            serde_json::json!({
                "content": [{
                    "type": "text",
                    "text": format!("Error: {e}")
                }],
                "isError": true
            }),
        ),
    }
}

fn handle_resources_list(id: Value) -> JsonRpcResponse {
    JsonRpcResponse::success(id, serde_json::json!({ "resources": resources::list_resources() }))
}

async fn handle_resources_read(id: Value, params: Value) -> JsonRpcResponse {
    let uri = params
        .get("uri")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    match resources::read_resource(uri).await {
        Ok(content) => JsonRpcResponse::success(
            id,
            serde_json::json!({
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": content
                }]
            }),
        ),
        Err(e) => JsonRpcResponse::error(id, -32002, format!("Error leyendo recurso: {e}")),
    }
}
