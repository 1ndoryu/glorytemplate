# Coolify Manager deploy del tema — 2026-03-18

## Objetivo
Documentar el flujo real de deploy del tema y el fallo corregido en 183A-12 para que futuros cambios de dependencias no rompan el build remoto de forma silenciosa.

## Flujo actual
1. deploy_theme.rs localiza el contenedor WordPress del stack.
2. theme_manager.rs hace pull del repo del tema y del repo Glory por separado.
3. composer install actualiza dependencias PHP.
4. Si no se usa --skip-react, el manager reinstala dependencias JS y compila el frontend.
5. Se ejecutan migraciones, ajustes de PHP, SMTP, cron, CORS, WebSocket y limpieza de OPcache.
6. deploy_theme.rs ejecuta health_manager::assert_site_healthy().
7. Si algo falla, el manager reporta commits aplicados y hace rollback del repo del tema y de Glory.

## Bug corregido en 183A-12
- Antes: update_glory_theme() solo ejecutaba npm install si faltaba node_modules.
- Efecto: el contenedor podía conservar node_modules viejo, omitir dependencias nuevas y fallar luego en Vite con imports no resueltos.
- Además, npm install y npm run build solo dejaban warning y el deploy seguía hasta terminar en health 500.
- El rollback solo reseteaba el repo raíz del tema, no la librería Glory.

## Corrección aplicada
- App/React ahora declara explícitamente los paquetes de Capacitor que importa el código compartido.
- theme_manager.rs reinstala siempre dependencias JS durante deploy cuando hay build React.
- npm install y npm run build ahora son fatales: si fallan, el deploy aborta de inmediato.
- deploy_theme.rs reporta commits aplicados también en rutas de fallo y rollbackea tanto tema como Glory.

## Implicación práctica
Cuando se agreguen imports nuevos en App/React o Glory/assets/react, el deploy remoto ya no dependerá del estado previo del contenedor. El contenedor reinstala dependencias y falla temprano si el árbol no es consistente.

## Regla Sentinel
- No hizo falta una regla nueva de Glory Sentinel para este flujo.
