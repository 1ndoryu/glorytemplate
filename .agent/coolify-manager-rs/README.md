# coolify-manager-rs

Herramienta de gestion para sitios WordPress en Coolify — reescritura completa en Rust del coolify-manager PowerShell original.

## Arquitectura

```
CLI/MCP ─> Commands ─> Services ─> Infrastructure
  │           │           │              │
  clap     handlers    logica de     SSH, API, Docker,
  JSON-RPC  por cmd    negocio       templates, secrets
```

4 capas con separacion estricta de responsabilidades:

- **CLI** (`src/cli/`): Parser clap con 15 subcomandos.
- **MCP** (`src/mcp/`): Servidor JSON-RPC 2.0 sobre stdio para VS Code.
- **Commands** (`src/commands/`): Handlers individuales por comando.
- **Services** (`src/services/`): Logica de negocio (temas, DB, cache, rollback).
- **Infrastructure** (`src/infra/`): SSH nativo (russh), Coolify API (reqwest), Docker, templates, secrets.

## Requisitos

- **Rust 1.70+** (probado con 1.94)
- **Cargo** (incluido con rustup)

## Build

```bash
cargo build --release
```

El binario se genera en `target/release/coolify-manager.exe` (~10 MB).

## Tests

```bash
cargo test
```

45 tests unitarios cubriendo: configuracion, validacion, templates, rollback, domain, errores, secrets, SSH encoding.

## Uso CLI

```bash
# Ver ayuda
coolify-manager --help

# Crear un sitio nuevo
coolify-manager new --name mi-sitio --domain https://mi-sitio.com

# Desplegar tema Glory
coolify-manager deploy --name mi-sitio

# Listar sitios
coolify-manager list

# Ver logs
coolify-manager logs --name mi-sitio --lines 50

# Importar base de datos
coolify-manager import --name mi-sitio --file backup.sql

# Exportar base de datos
coolify-manager export --name mi-sitio --output backup.sql

# Debug mode
coolify-manager debug --name mi-sitio --enable
coolify-manager debug --name mi-sitio --disable

# Reiniciar sitio
coolify-manager restart --name mi-sitio

# Ejecutar comando remoto
coolify-manager exec --name mi-sitio --command "wp option get siteurl"

# Cambiar dominio
coolify-manager set-domain --name mi-sitio --domain https://nuevo.com

# Cache headers
coolify-manager cache --name mi-sitio --enable
coolify-manager cache --name mi-sitio --disable

# Git status remoto
coolify-manager git-status --name mi-sitio

# Redeploy via Coolify API
coolify-manager redeploy --name mi-sitio

# Configurar SMTP
coolify-manager smtp --name mi-sitio --host smtp.gmail.com --port 587

# Minecraft
coolify-manager minecraft --action new --server-name survival --memory 4G
coolify-manager minecraft --action logs --server-name survival
```

## Uso como MCP Server (VS Code)

```bash
coolify-manager --mcp
```

Se comunica por stdin/stdout con JSON-RPC 2.0 (protocolo MCP). Configurar en `.vscode/mcp.json`:

```json
{
  "servers": {
    "coolify-manager": {
      "type": "stdio",
      "command": "${workspaceFolder}/.agent/coolify-manager-rs/target/release/coolify-manager.exe",
      "args": ["--mcp"]
    }
  }
}
```

### Herramientas MCP disponibles

| Herramienta | Descripcion |
|---|---|
| `new_site` | Crear sitio WordPress |
| `deploy_theme` | Desplegar tema Glory |
| `list_sites` | Listar sitios configurados |
| `restart_site` | Reiniciar servicios |
| `import_database` | Importar SQL |
| `export_database` | Exportar SQL |
| `exec_command` | Ejecutar comando remoto |
| `view_logs` | Ver logs |
| `debug_site` | Toggle WP_DEBUG |
| `cache_site` | Gestionar cache headers |
| `git_status` | Estado Git remoto |
| `set_domain` | Cambiar dominio |
| `redeploy` | Forzar redeploy |
| `setup_smtp` | Configurar SMTP |
| `minecraft` | Gestionar servidores Minecraft |

### Recursos MCP

| Recurso | URI |
|---|---|
| Configuracion | `coolify://config` |
| Lista sitios | `coolify://sites` |
| Servidores Minecraft | `coolify://minecraft` |
| Templates disponibles | `coolify://templates` |

## Configuracion

El archivo `config/settings.json` sigue el mismo formato que el coolify-manager PowerShell:

```json
{
  "vps": {
    "ip": "123.456.789.0",
    "user": "root",
    "sshKey": "C:/Users/user/.ssh/id_ed25519"
  },
  "coolify": {
    "baseUrl": "http://123.456.789.0:8000",
    "apiToken": "tu-token-coolify",
    "serverUuid": "srv-uuid",
    "projectUuid": "proj-uuid",
    "environmentName": "production"
  },
  "wordpress": {
    "dbUser": "manager",
    "dbPassword": "${DB_PASSWORD}",
    "defaultAdminEmail": "admin@example.com"
  },
  "glory": {
    "templateRepo": "https://github.com/user/template.git",
    "libraryRepo": "https://github.com/user/library.git",
    "defaultBranch": "main"
  },
  "sitios": [],
  "minecraft": []
}
```

Variables de entorno (`${VAR}`) se expanden automaticamente al cargar.

## Compatibilidad con el Manager Original

- Lee el mismo `settings.json` sin cambios.
- Despliega sobre los mismos stacks de Coolify.
- Los templates Docker Compose son identicos.
- Se puede usar en paralelo con el PowerShell original.

## Estructura del Proyecto

```
src/
  main.rs              # Entry point (CLI o MCP)
  cli/mod.rs           # Parser clap con 15 subcomandos
  commands/            # 15 handlers de comandos
  mcp/                 # Servidor MCP (server, tools, resources)
  services/            # Logica de negocio
  infra/               # SSH, API, Docker, templates, secrets
  config/mod.rs        # Carga y cache de settings.json
  domain/mod.rs        # Tipos de dominio (SiteConfig, etc.)
  error/mod.rs         # Tipos de error por capa
  logging/mod.rs       # Tracing con rotacion de archivos
templates/             # Docker Compose YAML templates
config/                # settings.json (creado por usuario)
```
