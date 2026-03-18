# QL66-EXTRA: Reestructuración Pipeline de Duplicados

> **Objetivo:** Que TODOS los archivos (incluso duplicados) se suban al servidor para que el admin los revise. El desktop NO debe bloquear ni mover archivos a `duplicados/`.

## Estado Actual del Pipeline

### Server (PipelineAudio.php) — YA CORRECTO
- Paso 2.5: SHA-256 hash → dedup check → si duplicado: `en_supervision` + insert `duplicados_pendientes` + **return** (no gasta IA)
- Paso 3+: IA, waveform, preview, etc. solo si NO es duplicado
- `ReprocesadorPostDuplicado`: cuando admin aprueba → pipeline completo con `$omitirDedup=true` → estado=activo
- **No requiere cambios**

### Desktop (uploadQueueService.ts) — REQUIERE CAMBIOS
4 puntos en `encolarArchivoInterno()` que bloquean upload:

| # | Trigger | Acción Actual | Acción Deseada |
|---|---------|---------------|----------------|
| 1 | Pre-check servidor: mismo usuario + duplicado | `moverADuplicados()` | Subir normalmente (server decide) |
| 2 | Hash reservado por encola concurrente | `moverADuplicados()` | Skip sin mover (ya en cola) |
| 3 | Hash ya en cola[] | `moverADuplicados()` | Skip sin mover (ya en cola) |
| 4 | Hash en hashesConocidos con tracking activo | `moverADuplicados()` | Skip sin mover (ya subido) |

### Web/App Upload — YA CORRECTO
usa PipelineAudio::procesar() directamente.

## Plan de Implementación

### Cambio 1: Eliminar bloqueo de same-user duplicados (punto 1)
- El pre-check a `/check-duplicate` que detecta `esMismoUsuario` ya NO debe bloquear
- Opción A: eliminar el pre-check completamente → dejar que el server lo detecte vía SHA-256 completo
- Opción B: mantener pre-check pero no bloquear → log informativo + continuar upload
- **Elegido: Opción A** — el pre-check usa hash parcial (8KB head+tail+size) que puede dar falsos positivos. Mejor dejar que el SHA-256 completo del server decida.

### Cambio 2: Reemplazar moverADuplicados() por skip silencioso (puntos 2, 3, 4)
- Estos guards previenen uploads duplicados CONCURRENTES (mismo archivo en el mismo batch)
- No deben mover archivos, solo hacer skip con log

### Cambio 3: No eliminar la carpeta duplicados/ existente
- Los archivos ya movidos a `duplicados/` se quedan ahí (no moverlos de vuelta)
- `moverADuplicados()` se puede eliminar o marcar como deprecated

## Archivos a Modificar

1. `desktop/src/services/uploadQueueService.ts`
   - Eliminar o desactivar pre-check a `/check-duplicate`
   - Reemplazar 3x `moverADuplicados()` por return/continue sin mover
   - Eliminar o marcar `moverADuplicados()` como deprecated

## Riesgos y Mitigación

- **Duplicados excesivos del mismo usuario:** El server los marca `en_supervision`, no se publican automáticamente. El admin controla.
- **Bandwidth desperdiciado subiendo duplicados:** Marginal — la detección SHA-256 del server retorna rápido y los archivos son de audio (megabytes, no gigabytes).
- **Carpeta de sync se llena:** Los archivos se eliminan tras upload exitoso (flujo normal existente).
