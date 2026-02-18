# Plan de Adaptación VPS — Kamples en Coolify

> C262 — Planificación para desplegar Kamples en VPS Linux con coolify-manager.

## 1. Contexto Actual

El **coolify-manager** (`.agent/coolify-manager/`) gestiona stacks WordPress + MariaDB en Coolify. Kamples necesita servicios adicionales que no existen en la configuración actual:

| Componente | Actual (coolify-manager) | Requerido (Kamples) |
|---|---|---|
| DB WordPress | MariaDB 10.11 | MariaDB 10.11 (sin cambio) |
| DB Kamples | No existe | **PostgreSQL 18 + pgvector** |
| Audio Pipeline | No existe | **FFmpeg + FFprobe** |
| PHP Extensions | Estándar WP | `pdo_pgsql`, `pgsql` |
| Build JS | No existe | **Node.js 20+ / npm** (esbuild) |
| WebSocket | No existe | **Bun** (futuro, fase 2) |
| APIs externas | Ninguna | Groq, Stripe, Google Gemini |

---

## 2. Arquitectura del Stack Propuesto

```
docker-compose (stack Coolify):
├── wordpress (imagen custom o WP + Dockerfile)
│   ├── PHP 8.2+ con pdo_pgsql, pgsql
│   ├── FFmpeg + FFprobe instalados
│   ├── Composer (autoload PSR-4)
│   └── Node.js 20 (build React, esbuild)
├── mariadb (MariaDB 10.11 — WordPress core)
│   └── DB: wordpress
├── postgres (PostgreSQL 18 + pgvector)
│   └── DB: kamples
└── [futuro] bun-websocket (Bun WebSocket server)
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
            # FFmpeg (rutas Linux)
            FFMPEG_PATH: /usr/bin/ffmpeg
            FFPROBE_PATH: /usr/bin/ffprobe
            # Produccion
            DEV: "FALSE"
            LOCAL: "FALSE"
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

# Node.js 20 para builds de React
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
2. Copia y ejecuta las 20 migraciones SQL (`App/Kamples/Database/migrations/v001-v020`)
3. Verifica pgvector con el endpoint de diagnóstico
4. Ejecuta `composer install` en el contenedor WordPress
5. Ejecuta `npm install && npm run build` para React assets
6. Genera el `.env` de producción dentro del contenedor
7. Verifica que FFmpeg funciona: `ffmpeg -version`
8. Reinicia Apache para cargar extensiones

### 3.5. Modificaciones a módulos existentes

| Módulo | Cambio |
|---|---|
| `config/settings.json` | Agregar sección `kamples` con PG credentials, API keys |
| `modules/WordPress/SiteManager.psm1` | Agregar `Initialize-KamplesDatabase` para ejecutar migraciones |
| `commands/deploy-theme.ps1` | Agregar paso de `composer install` + `npm run build` post-deploy |
| `commands/new-site.ps1` | Detectar template de stack (standard vs kamples) |

---

## 4. Variables de Entorno para Producción

```env
# Produccion
DEV=FALSE
LOCAL=FALSE

# Stripe (live)
GLORY_STRIPE_SECRET_KEY=sk_live_...
GLORY_STRIPE_PUBLISHABLE_KEY=pk_live_...
GLORY_STRIPE_WEBHOOK_SECRET=whsec_...          # NECESITA configurar webhook en Stripe Dashboard

# Google
GOOGLE_GEMINI_API=AIzaSy...

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

**Importante:** `KAMPLES_PG_HOST` cambia de `127.0.0.1` (local) a `postgres` (nombre del servicio Docker en el stack).

---

## 5. Migraciones PostgreSQL — Orden de Ejecución

Las migraciones deben ejecutarse secuencialmente en el contenedor PostgreSQL:

```
v001_schema_base.sql          → Tablas core: samples, usuarios, etc.
v002_pgvector_setup.sql       → CREATE EXTENSION vector + columna embedding
v003_samples_id_corto.sql     → IDs cortos para URLs
v004_features_avanzados.sql   → Columnas avanzadas
v005_imagenes_metadata.sql    → Imágenes de samples
v006_descargas_tamano.sql     → Tracking descargas
v007_moderacion_publicaciones → Sistema moderación
v008_mensajes_multimedia.sql  → Chat multimedia
v009_embeddings_pgvector.sql  → Índices HNSW
v010_planificador_algoritmo   → Scheduler
v011_samples_comentarios.sql  → Comentarios
v012_reacciones.sql           → Likes/reacciones
v013_comentarios_multimedia   → Media en comentarios
v014_moderacion_comentarios   → Moderación comentarios
v015_verificacion_samples.sql → Verificación
v016_fix_reproducciones.sql   → Fix campo completada
v017_creditos_bonus.sql       → Sistema créditos
v018_comentarios_resp_likes   → Respuestas anidadas + likes
v019_mostrar_comunidad.sql    → Toggle comunidad
v020_notif_titulo_nullable    → Fix notificaciones
```

Script de ejecución automática (para `setup-kamples.ps1`):

```powershell
$migrationsPath = "App/Kamples/Database/migrations"
$containerName = Get-PostgresContainerId -SiteName $SiteName

$sqlFiles = Get-ChildItem "$migrationsPath/*.sql" | Sort-Object Name
foreach ($file in $sqlFiles) {
    Write-Log "Ejecutando migración: $($file.Name)"
    # Copiar SQL al contenedor y ejecutar
    $sql = Get-Content $file.FullName -Raw
    Invoke-SshCommand -Command "docker exec -i $containerName psql -U kamples_app -d kamples -c `"$sql`""
}
```

---

## 6. Storage y Uploads

### Audio files
- Ruta: `wp-content/uploads/kamples/{userId}/{year}/{month}/`
- Volumen Docker: `uploads_data:/var/www/html/wp-content/uploads`
- **Backup:** Montar volumen externo o sincronizar a S3/B2 (futuro)

### Seguridad (.htaccess)
El `.htaccess` de seguridad ya creado (C202) bloquea acceso directo a WAV y MP3 optimizados. Funciona en Apache (imagen WordPress default).

### Permisos
```bash
chown -R www-data:www-data /var/www/html/wp-content/uploads/kamples
chmod -R 755 /var/www/html/wp-content/uploads/kamples
```

---

## 7. Checklist de Implementación

### Fase 1: Stack Base (Prioridad Alta)
- [ ] Crear `templates/kamples-stack.yaml` con WordPress + MariaDB + PostgreSQL
- [ ] Crear `templates/Dockerfile.kamples` (PHP + pdo_pgsql + FFmpeg + Node.js)
- [ ] Crear `templates/init-postgres.sh` (pgvector extension)
- [ ] Agregar sitio "kamples" a `config/settings.json`
- [ ] Crear comando `setup-kamples.ps1` (migraciones + composer + npm build)
- [ ] Testear creación de stack completo con `manager.ps1 new`

### Fase 2: Deploy y CI (Prioridad Media)
- [ ] Adaptar `deploy-theme.ps1` para ejecutar `composer install` + `npm run build`
- [ ] Configurar Stripe webhook URL con dominio de producción
- [ ] Generar `.env` de producción automáticamente desde settings.json
- [ ] Configurar backup automático PostgreSQL (pg_dump cron)
- [ ] Configurar backup automático de uploads (rsync o S3)

### Fase 3: WebSocket + Optimización (Futuro)
- [ ] Agregar servicio Bun al stack para WebSocket
- [ ] Configurar Nginx reverse proxy (reemplazar Apache si necesario)
- [ ] CDN para assets estáticos (Cloudflare o similar)
- [ ] Monitoring: health checks de PostgreSQL + pgvector
- [ ] Rate limiting a nivel de servidor (fail2ban + mod_security)

---

## 8. Configuración settings.json — Sección Kamples

```json
{
    "nombre": "kamples",
    "dominio": "https://kamples.example.com",
    "stackUuid": "<se genera al crear>",
    "gloryBranch": "main",
    "libraryBranch": "glory-react",
    "themeName": "glory",
    "template": "kamples",
    "postgres": {
        "user": "kamples_app",
        "database": "kamples",
        "pgvector": true
    },
    "apis": {
        "groq": true,
        "stripe": true,
        "gemini": true
    },
    "ffmpeg": true
}
```

---

## 9. Diferencias Clave Local vs VPS

| Aspecto | Local (Windows) | VPS (Linux Docker) |
|---|---|---|
| `KAMPLES_PG_HOST` | `127.0.0.1` | `postgres` (service name) |
| `FFMPEG_PATH` | `C:\Users\...\ffmpeg.exe` | `/usr/bin/ffmpeg` |
| `FFPROBE_PATH` | `C:\Users\...\ffprobe.exe` | `/usr/bin/ffprobe` |
| `DEV` | `TRUE` | `FALSE` |
| `LOCAL` | `TRUE` | `FALSE` |
| PostgreSQL | Instalado nativo | Contenedor Docker |
| PHP pdo_pgsql | Habilitado en php.ini | Instalado en Dockerfile |
| Node.js | Instalado nativo | Instalado en Dockerfile |

---

## 10. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Imagen Docker grande (~2GB con FFmpeg + Node) | Multi-stage build o imagen base optimizada |
| pgvector no disponible en imagen estándar PG | Usar imagen oficial `pgvector/pgvector:pg18` |
| Migraciones SQL fallan por orden | Script secuencial con verificación de cada paso |
| Stripe webhook no recibe en dominio nuevo | Configurar webhook en Stripe Dashboard post-deploy |
| FFmpeg consume mucha RAM en conversión | Limitar workers concurrentes, memory_limit PHP |
| Uploads llenan disco | Monitoring de espacio + cleanup de temporales |
| PostgreSQL sin backup | Cron job pg_dump diario + rotación |

---

## Notas Técnicas

- **Dual DB:** WordPress usa MariaDB (wp_options, wp_posts, etc.). Kamples usa PostgreSQL (samples, usuarios kamples, embeddings). Son independientes, conectados solo por el `user_id` de WordPress.
- **pgvector:** La imagen `pgvector/pgvector:pg18` ya incluye la extensión. Solo hay que ejecutar `CREATE EXTENSION IF NOT EXISTS vector;` en la DB.
- **Composer autoload:** `Glory\` → `Glory/src/`, `App\` → `App/`. Ejecutar `composer install --no-dev` en producción.
- **React build:** `cd Glory/assets/react && npm install && npm run build` + `cd App/React && npm install && npm run build`. Los assets compilados van a `Glory/assets/react/dist/` y `App/React/dist/`.
- **Migraciones:** No hay sistema automático de ejecución. Las 20 SQL se ejecutan manualmente o via el script `setup-kamples.ps1`. Considerar implementar un runner de migraciones en PHP para el futuro.
