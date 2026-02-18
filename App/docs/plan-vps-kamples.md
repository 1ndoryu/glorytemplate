# Plan de Adaptación VPS — Kamples en Coolify

> C262 — Planificación para desplegar Kamples en VPS Linux con coolify-manager.  
> **Última actualización:** 18/02/2026 — sincronizado con Schema System (R54-R58), Mezclador DAW (R48-R52), Admin Panel (R47).

---

## 1. Contexto Actual

El **coolify-manager** (`.agent/coolify-manager/`) gestiona stacks WordPress + MariaDB en Coolify. Kamples necesita servicios adicionales que no existen en la configuración actual:

| Componente | Actual (coolify-manager) | Requerido (Kamples) |
|---|---|---|
| DB WordPress | MariaDB 10.11 | MariaDB 10.11 (sin cambio) |
| DB Kamples | No existe | **PostgreSQL 18 + pgvector** |
| Audio Pipeline | No existe | **FFmpeg + FFprobe** |
| PHP Extensions | Estándar WP | `pdo_pgsql`, `pgsql` |
| Build JS | No existe | **Node.js 20+ / npm** (Vite + Rollup) |
| WebSocket | No existe | **Bun** (futuro, fase 2) |
| APIs externas | Ninguna | Groq, Stripe, Google Gemini |
| Schema System | No existe | **CLI dev-only** (archivos generados commiteados en git) |

---

## 2. Arquitectura del Stack Propuesto

```
docker-compose (stack Coolify):
├── wordpress (imagen custom — Dockerfile.kamples)
│   ├── PHP 8.2+ con pdo_pgsql, pgsql
│   ├── FFmpeg + FFprobe instalados
│   ├── Composer (autoload PSR-4: Glory\ + App\)
│   └── Node.js 20 (Vite build — React + Tailwind CSS v4)
├── mariadb (MariaDB 10.11 — WordPress core)
│   └── DB: wordpress
├── postgres (PostgreSQL 18 + pgvector)
│   └── DB: kamples (18 tablas, embeddings vector(128))
└── [futuro] bun-websocket (Bun WebSocket server)
```

### Componentes de la aplicación

```
glorytemplate/
├── Glory/                      # Framework core
│   ├── src/                    # PHP backend (PSR-4: Glory\)
│   ├── assets/react/           # BUILD PRINCIPAL (Vite + React + Tailwind)
│   │   ├── src/                # Componentes Glory UI
│   │   └── dist/               # Output compilado (manifest.json para PHP enqueue)
│   └── cli/                    # Herramientas dev (schema:generate, etc.)
├── App/                        # Aplicación Kamples (PSR-4: App\)
│   ├── Kamples/                # Backend: 19 controladores, 8 servicios, pipeline IA
│   │   ├── Api/                # REST API endpoints
│   │   ├── Services/           # MotorRecomendacion, Stripe, IA, etc.
│   │   └── Database/           # PostgresService + 20 migraciones SQL
│   ├── Config/Schema/          # Schema declarations (18 tablas)
│   │   └── _generated/         # 36 archivos: *Cols.php + *DTO.php (commiteados)
│   └── React/                  # Islands TypeScript (compilados por Vite via aliases)
├── Mezclador/                  # Mini DAW (integrado en Vite build via @mezclador alias)
│   ├── components/             # 10 componentes React
│   ├── hooks/                  # 4 hooks
│   ├── services/               # motorAudio, pitchShift (SoundTouchJS)
│   └── stores/                 # Zustand (5 módulos)
└── vendor/                     # Composer dependencies (autoload.php)
```

---

## 3. Cambios Requeridos en coolify-manager

### 3.1. Nuevo template: `templates/kamples-stack.yaml`

```yaml
services:
    wordpress:
        build:
            context: .
            dockerfile: Dockerfile.kamples
        volumes:
            - wordpress_data:/var/www/html
            - uploads_data:/var/www/html/wp-content/uploads
        environment:
            WORDPRESS_DB_HOST: mariadb
            WORDPRESS_DB_USER: manager
            WORDPRESS_DB_PASSWORD: {{DB_PASSWORD}}
            WORDPRESS_DB_NAME: wordpress
            # Kamples PostgreSQL
            KAMPLES_PG_HOST: postgres
            KAMPLES_PG_PORT: 5432
            KAMPLES_PG_DBNAME: kamples
            KAMPLES_PG_USER: kamples_app
            KAMPLES_PG_PASSWORD: {{PG_PASSWORD}}
            # APIs
            GROQ_API: {{GROQ_API_KEY}}
            GLORY_STRIPE_SECRET_KEY: {{STRIPE_SECRET}}
            GLORY_STRIPE_PUBLISHABLE_KEY: {{STRIPE_PUBLISHABLE}}
            GLORY_STRIPE_WEBHOOK_SECRET: {{STRIPE_WEBHOOK}}
            GOOGLE_GEMINI_API: {{GEMINI_KEY}}
            # Google OAuth (pendiente keys)
            GOOGLE_CLIENT_ID: {{GOOGLE_CLIENT_ID}}
            GOOGLE_CLIENT_SECRET: {{GOOGLE_CLIENT_SECRET}}
            # FFmpeg (rutas Linux)
            FFMPEG_PATH: /usr/bin/ffmpeg
            FFPROBE_PATH: /usr/bin/ffprobe
            # Produccion
            DEV: "FALSE"
            LOCAL: "FALSE"
            WP_DEBUG: "FALSE"
            SERVICE_FQDN_WORDPRESS: {{DOMAIN}}
        depends_on:
            postgres:
                condition: service_healthy
            mariadb:
                condition: service_healthy

    mariadb:
        image: mariadb:10.11
        volumes:
            - db_data:/var/lib/mysql
        environment:
            MYSQL_ROOT_PASSWORD: {{ROOT_PASSWORD}}
            MYSQL_DATABASE: wordpress
            MYSQL_USER: manager
            MYSQL_PASSWORD: {{DB_PASSWORD}}
        healthcheck:
            test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
            interval: 10s
            timeout: 5s
            retries: 5

    postgres:
        image: pgvector/pgvector:pg18
        volumes:
            - pg_data:/var/lib/postgresql/data
            - ./init-postgres.sh:/docker-entrypoint-initdb.d/init.sh
        environment:
            POSTGRES_DB: kamples
            POSTGRES_USER: kamples_app
            POSTGRES_PASSWORD: {{PG_PASSWORD}}
        healthcheck:
            test: ["CMD-SHELL", "pg_isready -U kamples_app -d kamples"]
            interval: 10s
            timeout: 5s
            retries: 5

volumes:
    wordpress_data:
    uploads_data:
    db_data:
    pg_data:
```

### 3.2. Nuevo archivo: `templates/Dockerfile.kamples`

```dockerfile
FROM wordpress:php8.2-apache

# Extensiones PostgreSQL para PHP
RUN apt-get update && apt-get install -y \
    libpq-dev \
    ffmpeg \
    && docker-php-ext-install pdo_pgsql pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Node.js 20 para builds de React (Vite)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Verificacion
RUN php -m | grep -E "pdo_pgsql|pgsql" && ffmpeg -version && node -v && composer -V
```

### 3.3. Nuevo archivo: `templates/init-postgres.sh`

Script de inicialización que corre al crear el contenedor PostgreSQL por primera vez:

```bash
#!/bin/bash
set -e

# Activar extensión pgvector
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo "pgvector activado en base de datos $POSTGRES_DB"
```

### 3.4. Nuevo comando: `commands/setup-kamples.ps1`

Script que después de crear el stack:
1. Espera que PostgreSQL esté healthy
2. Copia y ejecuta las 20 migraciones SQL de producción (ver sección 5 para orden exacto)
3. Verifica pgvector con el endpoint de diagnóstico (protegido — requiere admin auth)
4. Ejecuta `composer install --no-dev --optimize-autoloader` en el contenedor WordPress
5. Ejecuta pipeline de build: `npm install && npm run build` (Vite build + prerender)
6. Genera el `.env` de producción dentro del contenedor
7. Verifica que FFmpeg funciona: `ffmpeg -version`
8. Asegura `WP_DEBUG=false` (SchemaRegistry lanza excepciones fatales en modo debug)
9. Reinicia Apache para cargar extensiones

### 3.5. Modificaciones a módulos existentes

| Módulo | Cambio |
|---|---|
| `config/settings.json` | Agregar sección `kamples` con PG credentials, API keys, schema config |
| `modules/WordPress/SiteManager.psm1` | Agregar `Initialize-KamplesDatabase` para ejecutar migraciones |
| `commands/deploy-theme.ps1` | Agregar paso de `composer install` + `npm run build` post-deploy |
| `commands/new-site.ps1` | Detectar template de stack (standard vs kamples) |

---

## 4. Variables de Entorno para Producción

```env
# Produccion
DEV=FALSE
LOCAL=FALSE

# WordPress (CRITICO para Schema System)
WP_DEBUG=FALSE                                  # SchemaRegistry valida en modo debug — lanza SchemaException si hay mismatch

# Stripe (live)
GLORY_STRIPE_SECRET_KEY=sk_live_...
GLORY_STRIPE_PUBLISHABLE_KEY=pk_live_...
GLORY_STRIPE_WEBHOOK_SECRET=whsec_...          # NECESITA configurar webhook en Stripe Dashboard

# Google
GOOGLE_GEMINI_API=AIzaSy...
GOOGLE_CLIENT_ID=                               # Pendiente — Google OAuth
GOOGLE_CLIENT_SECRET=                           # Pendiente — Google OAuth

# IA (Groq — Whisper + LLM + Vision)
GROQ_API=gsk_...

# PostgreSQL (dentro del stack Docker)
KAMPLES_PG_HOST=postgres                        # Nombre del servicio Docker, no localhost
KAMPLES_PG_PORT=5432
KAMPLES_PG_DBNAME=kamples
KAMPLES_PG_USER=kamples_app                     # NO usar postgres/root en produccion
KAMPLES_PG_PASSWORD=<password-seguro-generado>

# FFmpeg (rutas Linux)
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
```

**Importante:**
- `KAMPLES_PG_HOST` cambia de `127.0.0.1` (local) a `postgres` (nombre del servicio Docker en el stack).
- `WP_DEBUG` **DEBE** ser `FALSE` en producción. El SchemaRegistry ejecuta validaciones estrictas (`exigirTabla`, `exigirColumna`) que lanzan `SchemaException` en modo debug. En producción solo loguea warnings.

---

## 5. Migraciones PostgreSQL — Orden de Ejecución

Las migraciones deben ejecutarse secuencialmente en el contenedor PostgreSQL.

### Archivos en el directorio (`App/Kamples/Database/migrations/`)

**Hay 3 variantes de v001.** Para producción VPS, ejecutar SOLO `v001_schema_base.sql`:
- `v001_schema_base.sql` — **USAR ESTE** (schema completo con soporte pgvector)
- `v001_schema_inicial.sql` — variante inicial (NO usar)
- `v001_local_sin_pgvector.sql` — para entornos sin pgvector (NO usar en VPS)

### Orden de ejecución para VPS (producción):

```
v001_schema_base.sql                    → Tablas core: samples, usuarios_ext, colecciones, etc.
v002_pgvector_setup.sql                 → CREATE EXTENSION vector + columna embedding
v003_samples_id_corto.sql               → IDs cortos para URLs
v004_features_avanzados.sql             → Columnas avanzadas
v005_imagenes_metadata.sql              → Imágenes de samples
v006_descargas_tamano.sql               → Tracking descargas + límites por plan
v007_moderacion_publicaciones.sql       → Sistema moderación publicaciones
v008_mensajes_multimedia.sql            → Chat multimedia
v009_embeddings_pgvector.sql            → Índices HNSW para vector(128)
v010_planificador_algoritmo.sql         → Scheduler algoritmo
v011_samples_comentarios.sql            → Comentarios en samples
v012_reacciones.sql                     → Likes/dislike/encanta
v013_comentarios_multimedia.sql         → Media en comentarios
v014_moderacion_comentarios.sql         → Moderación IA comentarios + bans + reportes
v015_verificacion_samples.sql           → Verificación de samples (badge)
v016_fix_reproducciones_completada.sql  → Fix campo completada
v017_creditos_bonus.sql                 → Sistema créditos bonus
v018_comentarios_respuestas_likes.sql   → Respuestas anidadas + likes comentarios
v019_samples_mostrar_comunidad.sql      → Toggle mostrar en comunidad
v020_notificaciones_titulo_nullable.sql → Fix notificaciones
```

**Total: 20 migraciones** ejecutadas secuencialmente (excluyendo las 2 variantes alternativas de v001).

### Script de ejecución automática (para `setup-kamples.ps1`):

```powershell
$migrationsPath = "App/Kamples/Database/migrations"
$containerName = Get-PostgresContainerId -SiteName $SiteName

# Excluir variantes de v001 que no son para produccion
$excluir = @('v001_local_sin_pgvector.sql', 'v001_schema_inicial.sql')

$sqlFiles = Get-ChildItem "$migrationsPath/*.sql" |
    Where-Object { $_.Name -notin $excluir } |
    Sort-Object Name

foreach ($file in $sqlFiles) {
    Write-Log "Ejecutando migración: $($file.Name)"
    $sql = Get-Content $file.FullName -Raw
    Invoke-SshCommand -Command "docker exec -i $containerName psql -U kamples_app -d kamples -c `"$sql`""
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Migración falló: $($file.Name)"
        return
    }
    Write-Log "OK: $($file.Name)"
}
```

---

## 6. Schema System — Consideraciones de Deploy

### Resumen del Sistema

El Schema System (R54-R58) proporciona tipado end-to-end entre PostgreSQL, PHP y TypeScript:

```
App/Config/Schema/*Schema.php          (fuente de verdad — 18 tablas)
        │  [CLI: npx glory schema:generate]
        ▼
App/Config/Schema/_generated/          (36 archivos PHP — commiteados en git)
├── {Tabla}Cols.php                    (constantes de columnas)
└── {Tabla}DTO.php                     (clase readonly con factory methods)

App/React/types/_generated/schema.ts   (interfaces TS + union types — commiteado)
```

### Impacto en Deploy (VPS)

| Aspecto | Detalle |
|---|---|
| **Archivos generados** | Los 37 archivos en `_generated/` **están commiteados en git**. No necesitan regenerarse en el VPS. |
| **CLI schema:generate** | **NO se ejecuta en producción**. Es herramienta de desarrollo. No aparece en ningún script de `package.json`. |
| **CLI schema:validate** | Útil como check pre-deploy en CI: escanea `$row['xxx']` hardcodeados vs schemas. Opcional. |
| **Runtime validation** | `SchemaRegistry` valida queries contra schemas en `WP_DEBUG=true`. **En producción (WP_DEBUG=false), solo loguea warnings**, no lanza excepciones. |
| **Node.js en VPS** | El Schema System NO requiere Node.js en runtime. Solo para `npm run build` (Vite). |
| **Sincronización SQL-Schema** | Las migraciones SQL y los Schema declarations son artefactos independientes. Si se añade una columna en producción, hay que actualizar el Schema en dev, regenerar, y commitear. |

### Pipeline de deploy seguro

```bash
# 1. Git pull (archivos _generated/ ya incluidos)
git pull origin main-kamples

# 2. Composer (autoload PHP — carga los *Cols.php y *DTO.php automáticamente)
composer install --no-dev --optimize-autoloader

# 3. NPM build (Vite compila React/TS — consume schema.ts que ya existe en el repo)
npm install
npm run build

# 4. Migraciones SQL (solo si hay nuevas — contra PostgreSQL del VPS)
# Ejecutar selectivamente las migraciones que no se hayan aplicado aún
```

### WP_DEBUG — CRÍTICO

| `WP_DEBUG` | Comportamiento SchemaRegistry |
|---|---|
| `true` | `exigirTabla()` / `exigirColumna()` lanzan `SchemaException` → **Fatal error** si hay desincronización |
| `false` | Solo `error_log()` con warnings — **la app NO se rompe** |

**Regla:** En producción VPS, `WP_DEBUG=FALSE` obligatorio. Esto también evita que WordPress exponga errores PHP al usuario.

---

## 7. Pipeline de Build — Vite

El proyecto usa **Vite** (esbuild para transpiling + Rollup para bundling), no esbuild standalone.

### Configuración de build

| Archivo | Ubicación | Propósito |
|---|---|---|
| `vite.config.ts` | `Glory/assets/react/` | Config principal de build |
| `tsconfig.json` | `Glory/assets/react/` | TS config principal (include: src, scripts, App/React, Mezclador) |
| `tsconfig.json` | `App/React/` | Paths aliases para isla imports |
| `tsconfig.json` | `Mezclador/` | TS config DAW (baseUrl → Glory/assets/react) |

### Aliases de Vite

```typescript
// vite.config.ts — Aliases que resuelven imports
'@/'         → 'Glory/assets/react/src/'
'@app'       → 'App/React/'
'@mezclador' → 'Mezclador/'
```

**Importante:** El Mezclador y App/React NO tienen su propio build. Se compilan como parte del build de Vite en `Glory/assets/react/`. Todo queda en un solo bundle.

### Comandos de build

```bash
# Build completo para producción (desde raíz del tema):
npm install                              # Root + postinstall auto-instala subdeps
npm run build                            # = cd Glory/assets/react && vite build && prerender

# Equivale a:
cd Glory/assets/react
npx vite build                           # Compila React + TS + Tailwind CSS v4
npx vite-node scripts/prerender.ts       # Pre-renderizado de páginas estáticas
```

### Output del build

```
Glory/assets/react/dist/
├── assets/main-[hash].js               # Bundle JavaScript
├── assets/main-[hash].css              # Tailwind CSS compilado
└── .vite/manifest.json                 # PHP usa esto para wp_enqueue_script/style
```

El `manifest.json` es leído por PHP (`assets.php`) para inyectar los assets con hash correcto en el HTML.

---

## 8. Storage y Uploads

### Audio files
- Ruta: `wp-content/uploads/kamples/{userId}/{year}/{month}/`
- Volumen Docker: `uploads_data:/var/www/html/wp-content/uploads`
- **Backup:** Montar volumen externo o sincronizar a S3/B2 (futuro)

### Audio pipeline en servidor
El `PipelineAudio.php` procesa cada upload:
1. Validación MIME + tamaño
2. FFmpeg: WAV original → MP3 optimizado → MP3 preview (20s para IA Groq)
3. Waveform JSON: FFmpeg `-f f32le -ac 1 -ar 8000` + picos → 60 barras
4. Renombrado IA: `Instrumento-Genero-Tono-BPM-Nombre-kamples-{id}.ext`
5. Análisis IA async (shutdown hook): Groq Whisper + LLM → metadata JSONB

### Seguridad (.htaccess)
El `.htaccess` de seguridad (C202) bloquea acceso directo a WAV y MP3 optimizados. Streaming via PHP con HMAC validation (`DescargasController`). Funciona en Apache (imagen WordPress default).

### Permisos
```bash
chown -R www-data:www-data /var/www/html/wp-content/uploads/kamples
chmod -R 755 /var/www/html/wp-content/uploads/kamples
```

---

## 9. Checklist de Implementación

### Fase 1: Stack Base (Prioridad Alta)
- [ ] Crear `templates/kamples-stack.yaml` con WordPress + MariaDB + PostgreSQL
- [ ] Crear `templates/Dockerfile.kamples` (PHP + pdo_pgsql + FFmpeg + Node.js 20)
- [ ] Crear `templates/init-postgres.sh` (pgvector extension)
- [ ] Agregar sitio "kamples" a `config/settings.json`
- [ ] Crear comando `setup-kamples.ps1` (migraciones + composer + npm build)
- [ ] Crear `.env.example` con todas las variables documentadas (sin credenciales)
- [ ] Asegurar `WP_DEBUG=FALSE` en producción (SchemaRegistry)
- [ ] Testear creación de stack completo con `manager.ps1 new`

### Fase 2: Deploy y CI (Prioridad Media)
- [ ] Adaptar `deploy-theme.ps1` para ejecutar `composer install --no-dev` + `npm run build` post-deploy
- [ ] Configurar Stripe webhook URL con dominio de producción
- [ ] Generar `.env` de producción automáticamente desde settings.json
- [ ] Configurar backup automático PostgreSQL (pg_dump cron)
- [ ] Configurar backup automático de uploads (rsync o S3)
- [ ] Agregar `npx glory schema:validate` como check pre-deploy (CI opcional)
- [ ] Verificar que DiagnosticoController `/debug/pgvector` requiere admin auth (S13 corregido)

### Fase 3: WebSocket + Optimización (Futuro)
- [ ] Agregar servicio Bun al stack para WebSocket (chat, notificaciones, typing, online)
- [ ] Configurar Nginx reverse proxy (reemplazar Apache si necesario)
- [ ] CDN para assets estáticos (Cloudflare o similar)
- [ ] Monitoring: health checks de PostgreSQL + pgvector
- [ ] Rate limiting a nivel de servidor (fail2ban + mod_security)
- [ ] Google OAuth: configurar `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- [ ] Implementar runner de migraciones PHP para actualizaciones incrementales

---

## 10. Configuración settings.json — Sección Kamples

```json
{
    "nombre": "kamples",
    "dominio": "https://kamples.example.com",
    "stackUuid": "<se genera al crear>",
    "gloryBranch": "main",
    "libraryBranch": "glory-react",
    "themeName": "glorytemplate",
    "template": "kamples",
    "postgres": {
        "user": "kamples_app",
        "database": "kamples",
        "pgvector": true,
        "migraciones": 20
    },
    "apis": {
        "groq": true,
        "stripe": true,
        "gemini": true,
        "googleOAuth": false
    },
    "ffmpeg": true,
    "schema": {
        "tablas": 18,
        "generados": "App/Config/Schema/_generated/",
        "validarPreDeploy": true
    },
    "build": {
        "tool": "vite",
        "entry": "Glory/assets/react/",
        "output": "Glory/assets/react/dist/",
        "includes": ["App/React/", "Mezclador/"]
    }
}
```

---

## 11. Diferencias Clave Local vs VPS

| Aspecto | Local (Windows) | VPS (Linux Docker) |
|---|---|---|
| `KAMPLES_PG_HOST` | `127.0.0.1` | `postgres` (service name) |
| `KAMPLES_PG_USER` | `postgres` | `kamples_app` (no root) |
| `KAMPLES_PG_PASSWORD` | `root` | `<password-seguro-generado>` |
| `FFMPEG_PATH` | `C:\Users\...\ffmpeg.exe` | `/usr/bin/ffmpeg` |
| `FFPROBE_PATH` | `C:\Users\...\ffprobe.exe` | `/usr/bin/ffprobe` |
| `DEV` | `TRUE` | `FALSE` |
| `LOCAL` | `TRUE` | `FALSE` |
| `WP_DEBUG` | `TRUE` (SchemaRegistry valida estricto) | `FALSE` (solo warnings) |
| PostgreSQL | Instalado nativo (PG18 + pgvector compilado) | Contenedor Docker (`pgvector/pgvector:pg18`) |
| PHP pdo_pgsql | Habilitado en php.ini | Instalado en Dockerfile |
| Node.js | Instalado nativo | Instalado en Dockerfile |
| Build | `npm run dev` (Vite HMR) | `npm run build` (Vite prod + prerender) |
| Schema CLI | `npx glory schema:generate` (dev) | No se ejecuta — archivos commiteados |
| Tema nombre | `glorytemplate` | `glorytemplate` |

---

## 12. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Imagen Docker grande (~2GB con FFmpeg + Node) | Multi-stage build o imagen base optimizada |
| pgvector no disponible en imagen estándar PG | Usar imagen oficial `pgvector/pgvector:pg18` |
| Migraciones SQL fallan por orden | Script secuencial con verificación + excluir variantes v001 |
| Stripe webhook no recibe en dominio nuevo | Configurar webhook en Stripe Dashboard post-deploy |
| FFmpeg consume mucha RAM en conversión | Limitar workers concurrentes, `memory_limit` PHP |
| Uploads llenan disco | Monitoring de espacio + cleanup de temporales |
| PostgreSQL sin backup | Cron job `pg_dump` diario + rotación |
| Schema desincronizado con BD | `npx glory schema:validate` en CI pre-deploy (opcional) |
| `WP_DEBUG=true` en producción | SchemaRegistry lanza `SchemaException` fatales — asegurar `FALSE` |
| SoundTouchJS (WASM) falla en server | Es client-side only (Web Audio API) — sin impacto en backend |
| Nombre de tema incorrecto en paths | Usar `glorytemplate`, no `glory` — verificar `vite.config.ts` base path |

---

## 13. Dependencias del Proyecto (inventario)

### PHP (Composer)

| Paquete | Versión | Uso | Producción |
|---|---|---|---|
| `vlucas/phpdotenv` | ^5.6 | Variables `.env` | Si |
| `dealerdirect/phpcodesniffer-composer-installer` | ^0.7.0 | Linting | No (dev) |
| `wptrt/wpthemereview` | ^0.2.1 | Review estándares | No (dev) |
| `php-parallel-lint/php-parallel-lint` | ^1.2.0 | Lint PHP | No (dev) |
| `wp-cli/i18n-command` | ^2.2.5 | Internacionalización | No (dev) |
| `php-stubs/wordpress-stubs` | ^6.9 | Autocomplete | No (dev) |

**Autoload PSR-4:** `Glory\` → `Glory/src/`, `App\` → `App/`

### NPM (Glory/assets/react) — Producción

| Paquete | Versión | Uso |
|---|---|---|
| `react` + `react-dom` | ^18.3 | UI framework |
| `zustand` | ^5.0.10 | State management |
| `framer-motion` | ^12.23 | Animaciones |
| `lucide-react` | ^0.559 | Iconos |
| `@stripe/react-stripe-js` + `@stripe/stripe-js` | ^5.4 / ^8.6 | Pagos |
| `@dnd-kit/core` + `sortable` + `utilities` | ^6.3 / ^10.0 / ^3.2 | Drag & Drop (Mezclador + colecciones) |
| `@editorjs/*` (7 plugins) | varios | Editor de texto (publicaciones) |
| `@capacitor/app` + `core` | ^6.0 / ^6.2 | Mobile (futuro) |
| `soundtouchjs` | ^0.3.0 | Pitch-independent stretch (Mezclador DAW) |

### NPM — Dev

| Paquete | Uso |
|---|---|
| `vite` ^6.0 + `@vitejs/plugin-react` ^4.3 | Build tool |
| `typescript` ^5.6 | Tipado |
| `tailwindcss` ^4.1 + `@tailwindcss/vite` ^4.1 | CSS framework |
| `eslint` ^9.39 + `prettier` ^3.8 | Linting/formatting |

---

## 14. Notas Técnicas

- **Dual DB:** WordPress usa MariaDB (wp_options, wp_posts, etc.). Kamples usa PostgreSQL (samples, usuarios_ext, embeddings). Son independientes, conectados solo por el `user_id` de WordPress.
- **pgvector:** La imagen `pgvector/pgvector:pg18` ya incluye la extensión. Solo hay que ejecutar `CREATE EXTENSION IF NOT EXISTS vector;` en la DB. Embeddings de 128 dimensiones con índice HNSW.
- **Composer autoload:** `Glory\` → `Glory/src/`, `App\` → `App/`. Ejecutar `composer install --no-dev --optimize-autoloader` en producción. Los 36 archivos `_generated/` se cargan automáticamente por PSR-4 (`App\Config\Schema\_generated\`).
- **React build:** Un solo build Vite desde `Glory/assets/react/`. Los aliases `@app` y `@mezclador` incluyen `App/React/` y `Mezclador/` en el bundle. **NO hay builds separados** para App/React ni Mezclador.
- **Migraciones:** No hay sistema automático de ejecución. Las SQL se ejecutan manualmente o via `setup-kamples.ps1`. Considerar implementar un runner de migraciones en PHP para actualizaciones incrementales (registrar versión aplicada en tabla `_migraciones`).
- **Schema System:** Herramienta de desarrollo. Los archivos generados (Cols + DTOs + schema.ts) están commiteados en git, no necesitan regenerarse en el VPS. Si se modifica la BD, actualizar Schema en dev → `npx glory schema:generate` → commit → deploy.
- **Mezclador DAW:** Totalmente client-side (Web Audio API, OfflineAudioContext para export). No requiere infraestructura adicional en el servidor. SoundTouchJS se ejecuta en el navegador.
- **Tailwind CSS v4:** Usa el plugin `@tailwindcss/vite` directamente, sin PostCSS config separado.
- **Prerender:** `scripts/prerender.ts` genera HTML estático para páginas clave. Se ejecuta automáticamente dentro de `npm run build`.
