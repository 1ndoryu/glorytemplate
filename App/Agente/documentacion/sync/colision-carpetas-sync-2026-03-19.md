# Colisión de carpetas en Sync — Investigación profunda

> **Fecha:** 2026-03-19 (actualizado 2026-03-19 193A-42)  
> **Tareas relacionadas:** 193A-3, 193A-29, 193A-40, 193A-42  
> **Estado:** Bug de código CORREGIDO. Datos legacy CORREGIDOS. Pipeline IA parcheada para no sobreescribir carpetas sync.

## Resumen

El sistema de sync de Kamples desktop mapea carpetas locales a colecciones en el servidor. Las colecciones tienen jerarquía de máximo 2 niveles (padre → sub) via `parent_id`. El bug original: al crear `Carpeta_B/Sub_A` cuando ya existía `Carpeta_A/Sub_A`, el matching buscaba solo por nombre "Sub_A" sin filtrar por `parent_id`, reutilizando la colección equivocada.

## Arquitectura del sistema

### Servidor (PHP/PostgreSQL)

**Tabla `colecciones`:**
- Columnas clave: `id, usuario_id, parent_id, nombre, slug, version`
- Índice UNIQUE: `(usuario_id, COALESCE(parent_id, 0), LOWER(nombre))`
- Max profundidad: 2 niveles (raíz + 1 sub)

**Tabla `coleccion_samples`:**
- Columnas: `coleccion_id, sample_id, usuario_id, posicion, added_at`
- UNIQUE: `(usuario_id, sample_id)` → 1 sample = 1 colección por usuario
- `agregarAtomico()`: ON CONFLICT DO UPDATE → mover atómico

**Metadata en `samples.metadata` JSONB:**
- `origen_subida`: ruta completa al subir (`"Drums / Kicks"`)
- `carpeta_primaria`: nombre carpeta raíz (`"Drums"`)
- `carpeta_secundaria`: nombre subcarpeta (`"Kicks"`)

### Desktop (TypeScript/Tauri)

**Archivos clave:**
- `syncCollectionService.ts` — Central: crear/buscar/asignar colecciones
- `syncTrackingService.ts` — Persistencia local (Tauri Store)
- `uploadQueueService.ts` — Cola de subida con resolución de colecciones
- `syncWatcherSetup.ts` — File watcher, callbacks de carpetas
- `syncOrchestratorService.ts` — Orquestador del ciclo sync

**Flujo de creación de colección:**
1. Watcher detecta nueva carpeta (o upload queue necesita colección)
2. `crearColeccionDesdeLocal(nombre, parentId)` es llamada
3. Busca en tracking local (filtrado por `parentId`)
4. Busca en-flight creations (key: `${parentId}_${nombre}`)
5. `buscarColeccionServidorPorNombre(nombre, parentId)` — GET /me/sync/colecciones + filter
6. Si no existe: POST /colecciones con `parent_id` en body
7. Si 409: re-busca con `buscarColeccionServidorPorNombre(nombre, parentId)`
8. Registra en tracking local

## El bug y sus fixes

### Bug original (pre-193A-3)
`buscarColeccionServidorPorNombre(nombre)` en `syncCollectionService.ts`:
```typescript
// ANTES (bug):
colecciones.find(c => c.nombre === nombre)
// DESPUÉS (fix 193A-3):
colecciones.find(c => c.nombre === nombre && (parentId ? c.parent_id === parentId : c.parent_id == null))
```

### Bug residual (pre-193A-29)
El handler de 409 en `crearColeccionDesdeLocal` llamaba sin `parentId`:
```typescript
// ANTES (bug):
buscarColeccionServidorPorNombre(nombre)
// DESPUÉS (fix 193A-29):
buscarColeccionServidorPorNombre(nombre, parentId)
```

### Estado actual — TODOS los paths corregidos

| Caller | Archivo | ¿Pasa parentId? |
|--------|---------|-----------------|
| crearColeccionDesdeLocal — lookup | syncCollectionService.ts | ✅ |
| crearColeccionDesdeLocal — 409 | syncCollectionService.ts | ✅ |
| uploadQueue — crear root | uploadQueueService.ts | ✅ (null, correcto) |
| uploadQueue — crear sub | uploadQueueService.ts | ✅ coleccionIdResuelta |
| watcher — nueva sub | syncWatcherSetup.ts | ✅ padre.id |
| watcher — rename sub | syncWatcherSetup.ts | ✅ padre.id |

**El servidor** siempre usó `parentId` correctamente en `ColeccionesRepository::crear()` y `buscarIdPorNombreEnJerarquia()`.

## Por qué el problema sigue apareciendo

**Datos legacy:** Samples subidos ANTES de los fixes tienen `coleccion_id` incorrecto en `coleccion_samples`. El código ya no causa colisiones nuevas, pero las asignaciones erróneas previas persisten.

**Escenario concreto:**
1. Pre-fix: usuario tiene `Drums/Kicks` (colección id=10, parent_id=5)
2. Crea `Percs/Kicks` → desktop busca "Kicks" sin parentId → encuentra id=10
3. Sample asignado a colección 10 (`Drums/Kicks`) en vez de colección nueva `Percs/Kicks`
4. Post-fix: código corregido, pero el sample sigue en colección 10

## Resultados del diagnóstico en producción (2026-03-19)

### Timeline de eventos
- **193A-3 commit:** 2026-03-19 06:36 UTC — fix búsqueda por nombre
- **193A-29 commit:** 2026-03-19 10:24 UTC — fix handler 409
- **Primera colisión detectada:** 2026-03-17 10:46 UTC
- **Última colisión detectada:** 2026-03-19 10:08 UTC (16 min antes del fix 193A-29)
- **Colisiones post-fix:** 0 (confirmado con query)

### Impacto cuantificado
- **517 samples** detectados inicialmente con asignación incorrecta (usuario_id=4)
- **321 samples** — colisión directa DOOMVIBE→FREDDIE DREDD (ya corregidos automáticamente)
  - 224: ACAPELLAS (debía estar bajo DOOMVIBE, estaba en FREDDIE DREDD)
  - 75: FX (mismo patrón)
  - 22: 808 (mismo patrón)
- **198 samples** — metadata "General / General" en subcollecciones reales (pendiente revisión manual)
  - 104: en FREDDIE DREDD / ACAPELLAS
  - 93: en DOOMVIBE / COWBELLS
  - 1: en FREDDIE DREDD / DRUM KIT
  - Sin `origen_subida` → no se puede determinar ubicación original
  - Probablemente subidos sin carpeta y asignados al azar por el bug

### Acciones realizadas
1. Creadas subcolecciones faltantes bajo DOOMVIBE! DRUM KIT (id=45): ACAPELLAS (60), FX (61), 808 (62)
2. Los 321 samples de colisión directa ya estaban corregidos (migración previa o sync posterior)
3. Contadores `total_samples` verificados y alineados
4. 0 colisiones post-fix confirmado

### Pendiente: 198 samples "General / General" — RESUELTO (193A-42)
La causa raíz: el pipeline IA (`PipelineAudio.php` y `ProcesadorColaIA.php`) hacía `json_encode`
completo de la metadata, SOBREESCRIBIENDO `carpeta_primaria`/`carpeta_secundaria` que el sync
desktop ya había establecido correctamente via PUT `/me/coleccionados/{id}/carpeta`.

**Secuencia del race condition:**
1. Desktop POST → crear sample (sin carpetas en metadata aún)
2. Desktop PUT → `jsonb_set` atómico → carpetas correctas (ej: "DOOMVIBE! DRUM KIT" / "COWBELLS")
3. Cron → `ejecutarPipelineDiferido` → `json_encode` completo → sobreescribe con IA ("General/General")

**Fix aplicado en 3 puntos:**
- `PipelineAudio.php` L541 (IA exitosa): lee `$metadataExistente`, preserva carpetas sync si no son "General"
- `PipelineAudio.php` L571 (rate limit fallback): misma lógica
- `ProcesadorColaIA.php` L320 (reprocesado): misma lógica
- Los 3 puntos también preservan `origen_subida` que se perdía con el `json_encode` completo.

**Fix de datos legacy:**
SQL UPDATE usando `coleccion_samples` + `colecciones` para derivar carpeta_primaria/secundaria reales:
- 213 samples corregidos (de 215 con "General")
- 9 restantes: 7 son colecciones raíz con secundaria="General" (correcto), 2 sin colección asignada
- Resultado final: 0 samples con metadata incorrecta

### SQL de diagnóstico (referencia)

```sql
-- Encontrar samples potencialmente mal asignados
SELECT 
    s.id AS sample_id,
    s.metadata->>'origen_subida' AS ruta_original,
    s.metadata->>'carpeta_primaria' AS meta_primaria,
    s.metadata->>'carpeta_secundaria' AS meta_secundaria,
    cs.coleccion_id AS col_asignada,
    c_actual.nombre AS nombre_col_asignada,
    c_padre.nombre AS nombre_padre_col_asignada
FROM samples s
JOIN coleccion_samples cs ON cs.sample_id = s.id
JOIN colecciones c_actual ON c_actual.id = cs.coleccion_id
LEFT JOIN colecciones c_padre ON c_padre.id = c_actual.parent_id
WHERE s.metadata->>'carpeta_secundaria' IS NOT NULL
  AND s.metadata->>'carpeta_secundaria' != ''
  AND s.metadata->>'carpeta_primaria' IS NOT NULL
  AND c_actual.parent_id IS NOT NULL
  AND LOWER(COALESCE(c_padre.nombre, '')) != LOWER(s.metadata->>'carpeta_primaria')
ORDER BY s.created_at DESC;
```

## Flujo completo de asignación (referencia)

### Durante upload (uploadQueueService.ts):
1. Upload completa → `resultado.sample_id` obtenido
2. Tracking busca colección por `carpetas[0]` (root) y `carpetas[1]` (sub)
3. Si no existe en tracking → `crearColeccionDesdeLocal(nombre, parentId)`
4. `agregarSampleAColeccion(coleccionFinal, sampleId)` → POST /colecciones/{id}/samples
5. `moverSampleEnServidorPublico(sampleId, primaria, secundaria)` → PUT metadata

### Durante sync (sincronizarColecciones):
1. GET /me/sync/colecciones → lista completa con `parent_id`
2. Mapea por nombre+parentId contra tracking local
3. Crea carpetas faltantes, descarga samples faltantes
4. Procesa raíces primero, luego subs (ya tienen padreLocal resuelto)

### Endpoints relevantes:
- `GET /me/sync/colecciones` → todas las colecciones del usuario con samples
- `POST /colecciones` → crear colección (body: `{nombre, parent_id}`)
- `POST /colecciones/{id}/samples` → asignar sample a colección (`coleccion_samples`)
- `PUT /me/coleccionados/{id}/carpeta` → actualizar metadata de carpeta (solo JSONB, no mueve)
- `GET /me/sync/delta` → changelog delta para sync incremental
