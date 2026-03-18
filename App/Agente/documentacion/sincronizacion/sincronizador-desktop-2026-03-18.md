# Sincronizador desktop — 2026-03-18

## Objetivo
Describir el sincronizador desktop actual de Kamples desde su arquitectura real: orquestación, tracking local, reconciliación, journaling y relación con el backend.

## Módulos principales
- desktop/src/services/syncService.ts: fachada pública del sincronizador.
- desktop/src/services/syncOrchestratorService.ts: flujo principal de sincronización, locks y resync.
- desktop/src/services/syncInitService.ts: inicialización y migraciones.
- desktop/src/services/syncTrackingService.ts: persistencia tipada de archivos sincronizados y estado local.
- desktop/src/services/syncJournal.ts: write-ahead log y checkpoints.
- desktop/src/services/syncReconciliacion.ts: comparación entre disco, tracking local y servidor.
- desktop/src/services/syncWatcherSetup.ts: watchers de filesystem y operaciones locales.
- App/React/stores/syncStore.ts: estado global reactivo del sincronizador.
- App/Kamples/Api/Controladores/SyncController.php: endpoints del backend para sync.

## Flujo general
1. El cliente desktop inicializa configuración y migra tracking si hace falta.
2. El orquestador obtiene estado del servidor y colecciones aplicables.
3. Se decide qué descargar, qué mantener, qué reconciliar y qué rehidratar.
4. Cada operación se registra en journal antes o durante el procesamiento crítico.
5. El tracking persistente se actualiza con claves compuestas por sample y colección.
6. Los watchers detectan cambios locales y evitan duplicar trabajo o corromper el estado.

## Diseño actual
- El sistema ya no se apoya en un array plano legacy; usa estructura indexada para lookup O(1).
- Hay locking explícito para que dos syncs no corran en paralelo y generen carreras.
- La reconciliación es de tres vías: servidor, store local y disco real.
- El changelog del backend funciona como rastro auditable, no como log descartable.

## Cambios recientes relevantes
- QL103, QL104, QL121 y QL135 endurecieron el loop, el manejo de duplicados, el borrado y la protección frente a índices legacy stale.
- QL125 y QL126 reforzaron logging y diagnóstico del sincronizador.
- QL134 ajustó el watcher para no tratar archivos sin extensión como colecciones si no son directorios.

## Gotchas
- Los problemas de sync suelen ser de estado y no solo de red; por eso journal, tracking y reconciliación deben explicarse juntos.
- El sincronizador es desktop-only: su documentación no debe mezclarlo con la APK móvil o el sitio web.
- Los arreglos rápidos en watchers o borrado tienden a reabrir bugs de duplicados si se documentan por separado y sin el flujo completo.

## Regla Sentinel
- No se detectó necesidad de una regla nueva de Glory Sentinel para este dominio.
