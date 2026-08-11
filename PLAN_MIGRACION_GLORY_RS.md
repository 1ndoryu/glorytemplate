# Plan: Migración de Glory React Logic a Glory RS

> **ID:** 118A-1  
> **Estado:** Activo — Fase 0, inventario y decisiones bloqueantes  
> **Base objetivo:** `glory-rust-template`, rama `main` (template React + Axum + PostgreSQL + SQLx + OpenAPI)  
> **Frontend a conservar:** `App/React` y `Glory/assets/react` del proyecto actual  
> **No usar como base:** la rama `wandorius` del template, porque contiene otro producto y un frontend Vanilla/OS

## Objetivo

Reemplazar progresivamente WordPress/PHP como backend de `glory-react-logic` por un monolito Rust/Axum ligero, manteniendo la UI, UX, estados, responsive, Capacitor y flujos principales del frontend actual.

El resultado esperado es un único servicio Rust con PostgreSQL, migraciones SQLx, API documentada con OpenAPI, cliente TypeScript generado y el build del frontend servido por el mismo despliegue o por un reverse proxy sencillo.

## No objetivos de la primera entrega

- No portar el frontend Vanilla/OS de `wandorius`.
- No hacer una reescritura visual ni cambiar React por Vanilla TS.
- No introducir microservicios, colas distribuidas ni otra base de datos.
- No migrar inicialmente AI, WhatsApp/WACLI, grupos de Facebook, MCP, Magnific, Stripe ni automatizaciones secundarias.
- No hacer doble escritura global entre WordPress y Rust.
- No borrar WordPress ni modificar producción durante las fases locales.

## Hechos confirmados

- El frontend actual monta islas y SPA desde `Glory/assets/react/src/main.tsx`, con producto en `App/React`.
- El arranque depende de `window.gloryDashboard`, páginas PHP, `PageManager`, `ReactIslands`, nonce WordPress y rutas hardcodeadas `/wp-json/glory/v1`.
- El backend actual contiene 28 controladores REST y aproximadamente 141 registros de ruta estáticos.
- La persistencia propia contiene 26 tablas `glory_*`, además de `wp_users`, `wp_usermeta`, `wp_options`, transients, cron y archivos en uploads.
- El frontend usa React 19 en `App/React` y React 18 en el runtime de `Glory`; la compatibilidad debe auditarse antes de fusionar dependencias.
- `glory-rust-template/main` parte de auth, notas, Axum, SQLx, PostgreSQL, OpenAPI/utoipa, Orval y React/Vite/Zustand.
- La rama local `glory-rust-template/wandorius` tiene dominios adicionales, pero no es la base aprobada para este producto.

## Decisiones arquitectónicas

1. **Strangler por dominios.** Un router/compatibility layer dirige cada familia a WordPress o Rust. Cada dominio tiene un único escritor durante la transición.
2. **Compatibilidad temporal.** Rust expondrá inicialmente rutas compatibles bajo `/wp-json/glory/v1` y conservará envelopes/DTOs que el frontend ya consume. El contrato canónico nuevo será `/api` + OpenAPI; el namespace legacy tendrá fecha de retirada.
3. **Frontend primero estable.** Se reutilizan componentes, CSS, Zustand, Capacitor, EditorJS, DnD Kit y patrones existentes. Solo se reemplazan el arranque WordPress y la capa de API.
4. **Monolito mínimo.** Un binario Axum con PostgreSQL/SQLx, handlers delgados, services por caso de uso y repositories por dominio. No crear traits genéricos ni extraer lógica a `glory-rs` sin un segundo consumidor real.
5. **Identidad explícita.** La opción recomendada para el primer corte es relogin controlado usando sesiones propias HttpOnly + CSRF. Un puente de sesión WordPress solo se acepta si se demuestra expiración, revocación y auditoría; no se improvisará.
6. **Migración sin doble escritura.** Export/import idempotente desde MySQL, con `shadow reads` de comparación. El escritor cambia por dominio y se conserva rollback de routing.
7. **IDs compatibles.** Mantener IDs enteros legacy en el JSON del core durante la primera fase, con `legacy_id` único si el modelo interno usa UUID. No forzar UUID del template si rompe joins o el frontend actual.

## Fases ejecutables

### Fase 0 — Inventario y decisiones bloqueantes

- Crear un catálogo ejecutable de rutas: método, path, request, response, permisos, consumidor React, tabla/servicio y dependencia externa.
- Separar rutas en `auth`, `productivity`, `collaboration`, `media`, `billing` e `integrations`.
- Documentar columnas reales, volúmenes, soft deletes, JSON, relaciones, índices, `wp_users/usermeta/options`, uploads, cron y workers.
- Definir el contrato de identidad: relogin o puente temporal; compatibilidad de Google web/Capacitor; migración de contraseñas solo si el hash es verificable.
- Definir dominio inicial: auth + dashboard, tareas, hábitos, proyectos, notas y actividad/historial.
- Definir objetivos de carga inicial: p95 lectura <300 ms, mutación <500 ms, dashboard en ≤5 consultas, paginación en actividad/notificaciones/mensajes y límites de adjuntos.
- Entregables: catálogo versionado, matriz ruta–DTO–permiso–pantalla, matriz de datos, ADR de identidad y plan de cutover.

### Fase 1 — Nuevo consumidor desde `glory-rust-template/main`

- Crear el proyecto/branch de la aplicación a partir del commit fijado de `main`; no copiar la rama `wandorius`.
- Conservar Axum, SQLx, OpenAPI, Orval, sesiones, CSRF, rate limits y estructura `handler → service → repository`.
- Portar el frontend actual al `frontend/` del consumidor, manteniendo sus componentes y tokens; no mezclar dos runtimes React sin una decisión de versión.
- Añadir configuración tipada de arranque para sustituir `window.gloryDashboard` y eliminar la dependencia de `wp_enqueue_script`/PHP.
- Añadir `FRONTEND_DIST`, healthcheck, límites de request, timeouts, logging estructurado y configuración por entorno.
- Criterio: la app nueva compila y muestra el shell/login sin WordPress, aunque aún no tenga todas las rutas.

### Fase 2 — Primer vertical slice: identidad y sesión

- Implementar usuarios, perfil mínimo, registro, login, logout, sesión revocable, `/auth/me` y CSRF.
- Implementar Google solo después de fijar el flujo web y Capacitor; no copiar secretos ni client IDs al código.
- Implementar el adaptador temporal de `/wp-json/glory/v1/auth/*` y el cliente nuevo `/api/auth/*`.
- Probar login, refresh, logout, sesión expirada, CSRF, rate limit, usuario desactivado y autorización por recurso.
- Criterio: el frontend usa la sesión Rust sin nonce ni `gloryDashboard` y conserva el mismo flujo visual.

### Fase 3 — Core de productividad

- Migrar en conjunto dashboard/sync, tareas, hábitos, subhábitos, proyectos, notas, carpetas, actividad e historial.
- Mantener semántica de IDs, estados, orden, soft delete, snapshots, dependencias y sincronización usada por Zustand.
- Implementar primero repositories SQLx y casos de uso; luego handlers de compatibilidad y DTOs OpenAPI.
- Generar cliente TypeScript por tags con Orval solo cuando cada grupo de endpoints esté estable.
- Añadir pruebas de contrato y de propiedad por usuario; validar carga inicial, mutaciones, errores, offline y reconciliación.
- Criterio: el dashboard real funciona contra Rust con comparación funcional frente a WordPress y sin cambio visual intencional.

### Fase 4 — Colaboración, notificaciones y archivos

- Migrar equipos, compartidos, roles, mensajes, mensajes leídos, notificaciones, feedback y adjuntos.
- Mover archivos a un storage definido con límites, ownership, MIME permitido, nombres no confiables y URLs temporales.
- Añadir paginación, backpressure, índices y observabilidad antes de activar notificaciones o WebSocket.
- Criterio: permisos cruzados, unread counts, adjuntos y fallos parciales tienen pruebas de contrato y rollback de routing.

### Fase 5 — Integraciones fuera del camino crítico

- Migrar por separado suscripción/Stripe, AI, agentes, WhatsApp/WACLI, grupos de Facebook, MCP, Magnific y backups.
- Cada integración conserva firmas, idempotencia, rate limits, secretos por entorno y estados de worker.
- Mientras tanto, el router puede dejar estas familias en WordPress sin que el core Rust dependa de ellas.
- Criterio: ninguna integración bloquea el arranque ni aumenta el pool/latencia del core cuando está deshabilitada.

### Fase 6 — Migración de datos y cutover

- Ejecutar ETL desde una copia restaurable de MySQL hacia PostgreSQL; nunca sobre producción como primer ensayo.
- Hacer importaciones idempotentes por dominio, con conteos, checksums por usuario, referencias, archivos y registros rechazados explícitos.
- Ejecutar `shadow reads` durante una ventana definida; comparar DTOs normalizados sin duplicar escrituras.
- Activar un dominio por feature flag, con un único escritor, métricas de discrepancia y rollback de routing.
- Congelar cambios durante el corte final, importar delta, validar auth/core, habilitar canary y observar antes de ampliar.
- Criterio: rollback ensayado, datos reconciliados y procedimiento reproducible por otra persona.

### Fase 7 — Retirada de WordPress

- Confirmar cero consumidores de cada ruta legacy, cron/worker transferido y archivos migrados.
- Retirar adaptadores `/wp-json/glory/v1` por dominio, PHP y dependencias Composer solo después de una ventana de observación.
- Mantener export de backup y documentación de recuperación; no eliminar tablas o uploads hasta validar restauración.

## Gate y evidencia por fase

- Template: `npm run check`, `npm run codegen`, `cargo fmt --check`, `cargo clippy` y `cargo test` según el alcance.
- Verificar `sentinel doctor`, lock, rama primaria y `npm run gate:check -- <ID>` antes de adoptar el gate del nuevo consumidor.
- Frontend: type-check, build, tests de servicios y comprobación visual en desktop/móvil, incluyendo estados vacío, error, carga y offline.
- Backend: tests de handler/service/repository, OpenAPI exportada, contract tests y límites de request/DB.
- Datos: reporte de conteos/checksums, rechazados, duración, tamaño, idempotencia y rollback.
- Operación: métricas p95, errores, pool SQLx, conexiones, tamaño de respuestas, logs estructurados y healthcheck.

## Definition of Done global

- El frontend conserva rutas, apariencia, estados, responsive y flujos Capacitor acordados.
- Auth y core funcionan sin WordPress; las rutas legacy restantes están explícitamente clasificadas.
- PostgreSQL es la única fuente de verdad de los dominios cortados y no existe doble escritura global.
- El ETL es repetible, auditable y reversible; no hay pérdidas silenciosas.
- OpenAPI, cliente generado, migraciones, tests y documentación están sincronizados.
- Gate y pruebas aplicables pasan; no se afirma cobertura no ejecutada.
- Deploy/cutover solo se ejecuta con autorización explícita y mediante Coolify Manager.

## Riesgos abiertos que bloquean el inicio de Fase 1

- Volumen real y acceso de lectura a MySQL/producción.
- Decisión de relogin frente a puente de sesión y compatibilidad de hashes WordPress.
- Alcance exacto de Google OAuth web/Capacitor y configuración de dominios.
- Storage de adjuntos cifrados y normales, URLs públicas y política de retención.
- Tareas programadas y workers que hoy dependen de WP-Cron/systemd.
- Requisitos de Stripe, AI, WhatsApp y administradores durante la coexistencia.
- Objetivo de carga real y presupuesto de infraestructura Coolify.

## Siguiente acción

Ejecutar la Fase 0 en una copia de trabajo: generar el catálogo ruta–DTO–permiso–pantalla y la matriz de datos sin cambiar producción; después fijar la decisión de identidad y crear el consumidor desde `glory-rust-template/main`.
