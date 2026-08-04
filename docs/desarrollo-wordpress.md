# Desarrollo WordPress reproducible

Este repositorio usa `wp-env` + Docker para ejecutar WordPress localmente y Vite para React.

## Requisitos

- Node.js 18+
- npm
- Docker Desktop iniciado
- Composer para instalar `vendor/`

El entorno de WordPress se sirve en `http://localhost:8888` y Vite en `http://localhost:5174`.

## Primer arranque

```bash
npm install
composer install
npm run wp:start
npm run wp:activate
npm run dev
```

`npm run dev` inicia los contenedores de `wp-env`, activa de forma idempotente el tema `glorytemplate`, espera a que WordPress responda y arranca Vite. No importa datos ni destruye el entorno automáticamente.

El tema del checkout se monta en `wp-content/themes/`. Los uploads se guardan en `.wp-env/uploads/`, que no se versiona.

## Comandos

```bash
npm run dev             # WordPress + Vite
npm run wp:start        # Iniciar WordPress (crea uploads/backups locales)
npm run wp:stop         # Detener contenedores sin borrar datos
npm run wp:status       # Consultar versión de WordPress
npm run wp:activate     # Activar el tema
npm run dev:wp           # WordPress + activación, sin Vite
npm run wp:export       # Crear dump en .wp-env/backups/
npm run wp:import -- .wp-env/backups/archivo.sql
npm run wp:destroy      # Destruir contenedores y datos: usar con cuidado
```

`wp:import` reemplaza la base de datos actual y exige seleccionar explícitamente un dump. Antes de importar, crea un backup con `npm run wp:export`.

## Migración desde LocalWP

1. Exporta la base de datos desde LocalWP.
2. Copia `wp-content/uploads` a `.wp-env/uploads/`.
3. Arranca `wp-env` con `npm run wp:start`.
4. Importa el dump:

   ```bash
   npm run wp:import -- ruta/al/dump.sql
   ```

5. Si el dump usa `glory.local`, previsualiza y aplica las URLs preservando datos serializados:

   ```bash
   npm run wp:replace-url
   npm run wp:replace-url -- http://glory.local http://localhost:8888 --apply
   ```

6. Ejecuta `npm run wp:activate` y valida REST, login y páginas React.

Mantén LocalWP intacto hasta completar esta validación.

## Vite dentro de Docker

PHP corre dentro del contenedor de WordPress. Por eso el probe de Vite usa `host.docker.internal:5174`, mientras el navegador carga los módulos desde `localhost:5174`. Estos valores están definidos en `.wp-env.json` y son configurables mediante variables de entorno.

## Ramas y datos

La configuración de `wp-env` y los scripts de infraestructura deben permanecer iguales en todas las ramas soportadas. La base de datos no está en Git y no cambia al cambiar de rama; exporta un snapshot antes de probar una rama con migraciones distintas. El archivo `.wp-env.override.json` es opcional y local; parte de `.wp-env.override.json.example` sin copiar secretos.

Reglas:

- `npm run dev` nunca destruye ni importa datos.
- No versionar `.wp-env/`, dumps SQL, uploads ni credenciales.
- Las migraciones PHP deben ser idempotentes.
- Ejecutar `npm run infra:check` tras integrar cambios de infraestructura.
- No ejecutar workers de producción automáticamente en el entorno local.

## Problemas frecuentes

### Docker no está iniciado

Abre Docker Desktop y repite `npm run dev`.

### Puerto ocupado

Configura `WP_ENV_URL`/`WP_ENV_READY_TIMEOUT_MS` para diagnóstico; si necesitas otro puerto, actualiza `.wp-env.json` y el origen de Vite de forma coordinada.

### Falta `vendor/`

Ejecuta `composer install` desde la raíz del tema.
