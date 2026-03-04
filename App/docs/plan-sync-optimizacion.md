# Plan: Sistema de Sync — Colecciones y Subcolecciones

> **Última actualización:** 2026-03-04 | **Módulos:** fileWatcherService, syncCollectionService, syncWatcherSetup, syncTrackingService, ColeccionesRepository, ColeccionDetalleIsland, LibreriaIsland

---

## Historial Compactado (Fases 1-2 — COMPLETADAS)

> Detalles completos en git. Commits de referencia: `0e02e219`+ (Fase 1), C368 (Fase 2).

**Fase 1 (2026-02-27):** Infraestructura base sync — semáforo concurrencia, persistencia debounced, indices O(1), purga periódica, papelera 30 días, borrado bidireccional, config MPA, upload dedup pre-flight.

**Fase 2 (2026-03-03 — C368):** Fix ciclo upload→papelera→re-upload→duplicado (7 tareas P1-P7):
- P1: Excluir `.papelera/` del watcher (`CARPETAS_EXCLUIDAS_TOTAL`)
- P2: Guard `marcarDescargaEnCurso()` en papeleraService antes de rename
- P3: `exists()` pre-readFile + rechazo rutas `.papelera/` en encolarArchivo
- P4: Normalización nombre (strip `^\d{13,}_`) para dedup — `normalizarNombreArchivo.ts`
- P5: Idempotency key `X-Idempotency-Key` cliente + check server-side
- P6: Historial: `moverAPapelera()` actualiza estado a `en_papelera`
- P7: Auditoría carpetas excluidas (`CARPETAS_SOLO_DELETE` para `Sin colección`)

**Lecciones Fase 2:**
- [Watcher]: `.papelera/` dentro de carpeta sync = watcher la observa. Excluir SIEMPRE carpetas internas.
- [Papelera]: Toda operación rename dentro de carpeta sync DEBE usar guard `marcarDescargaEnCurso`.
- [OneDrive]: `readFile` falla en archivos cloud-only sin error descriptivo. Siempre pre-check `exists()`.
- [Dedup]: Prefijo `${Date.now()}_` de papelera rompe comparaciones por nombre. Normalizar.
- [Idempotency]: Sin key server-side, retry = duplicado. Exactly-once imposible solo desde cliente.

---

## Fase 3: Subcolecciones + Fix Rename + UI Colecciones

### Bug Activo: Rename carpeta duplica colección en servidor

**Reporte:** Al renombrar una carpeta, el servidor crea una nueva colección con el nombre nuevo en vez de renombrar la existente. El usuario ve 2 colecciones: una con el nombre viejo y otra con el nuevo.

**Root Cause:**
En `syncWatcherSetup.ts`, el callback de rename de carpeta busca con `buscarColeccionPorCarpeta(nombreAnterior)`. Esta función busca por `carpetaLocal === nombreAnterior` (case-sensitive, match exacto). Si la carpeta en tracking se sanitizó diferente del nombre del directorio en disco (ej: acentos, espacios), la búsqueda falla → cae al `else` → `crearColeccionDesdeLocal(nombreNuevo)` → nueva colección duplicada.

Además, `fileWatcherService.ts` detecta renames de carpeta por DOS patrones:
1. **Evento `modify.kind = 'name'`:** El OS reporta directamente `(rutaOrigen, rutaDestino)` → `esCarpetaNivel1Rename` → callback con `(nombreOrigen, nombreNuevo)`.
2. **Patrón `delete + create`:** OS emite `remove(viejo)` + `create(nuevo)` → buffer `carpetasEliminadasPendientes` (3s gracia) → si llega create, es rename.

El problema es que `buscarColeccionPorCarpeta` busca por nombre de carpeta ACTUAL en disco. Si el tracking registró el nombre sanitizado (ej: `"mi carpeta"` → tracking `carpetaLocal: "mi carpeta"`) pero el OS reporta un nombre ligeramente diferente, no hay match.

**Fix planificado:**
1. **`buscarColeccionPorCarpeta`** → buscar case-insensitive + comparar también después de sanitizar ambos lados.
2. **Callback rename en syncWatcherSetup** → antes de crear nueva, verificar si existe colección en servidor con nombre viejo y renombrarla.

### C386: Fix Rename Carpeta Duplica Colección

- [ ] **C386a** `syncTrackingService.buscarColeccionPorCarpeta`: comparar case-insensitive (`toLowerCase`) + sanitización de ambos lados para match robusto.
- [ ] **C386b** `syncWatcherSetup` callback rename: fallback — si `buscarColeccionPorCarpeta(nombreAnterior)` falla, buscar en servidor por nombre y renombrar en vez de crear.

### C387: Subcolecciones (2 niveles máximo)

**Modelo de datos:**
- Tabla `colecciones`: agregar columna `parent_id INT NULL REFERENCES colecciones(id) ON DELETE CASCADE`.
- Constraint: subcolección (parent_id != null) NO puede tener hijos → máximo 2 niveles.
- Constraint: `UNIQUE (usuario_id, LOWER(nombre), COALESCE(parent_id, 0))` — nombres únicos dentro del mismo padre.

**Regla de carpetas:**
```
carpetaSync/
  coleccion/           → colección (parent_id = null)
    sample.wav
    subcoleccion/      → subcolección (parent_id = coleccion.id)
      sample2.wav
      sub-sub/         → NO es otra subcolección. Sus archivos pertenecen a "subcoleccion"
        sample3.wav    → se asigna a "subcoleccion", NO crea sub-sub-colección
```

**Tareas backend:**
- [ ] **C387a** Migración SQL: `ALTER TABLE colecciones ADD COLUMN parent_id INT NULL REFERENCES colecciones(id) ON DELETE CASCADE; CREATE INDEX idx_colecciones_parent ON colecciones(parent_id);`
- [ ] **C387b** Schema: Actualizar `ColeccionesSchema.php` + regenerar (`npx glory schema:generate`).
- [ ] **C387c** `ColeccionesRepository`: método `listarConSubcolecciones(userId)` — retorna colecciones padre con `subcolecciones: []` anidadas. Método `listarSubcolecciones(parentId)`.
- [ ] **C387d** `ColeccionesCrudController::crear`: aceptar param `parent_id` opcional. Validar: (1) padre existe y es del usuario, (2) padre NO es subcolección (max 2 niveles), (3) nombre único dentro del padre.
- [ ] **C387e** `ColeccionesController::obtener`: incluir subcolecciones en la respuesta de detalle.
- [ ] **C387f** `ColeccionesController::listar`: incluir subcolecciones agrupadas dentro de sus padres.
- [ ] **C387g** SyncRepository (`/me/sync/colecciones`): incluir `parent_id` en el payload de sync.
- [ ] **C387h** NormalizadorSample/normalizarColeccion: incluir `parentId` en la normalización.

**Tareas desktop sync:**
- [ ] **C387i** `syncTrackingService.ColeccionLocal`: agregar campo `parentId: number | null`.
- [ ] **C387j** `syncCollectionService.crearColeccionDesdeLocal`: aceptar `parentId` opcional. Si la carpeta estáen nivel 2 (subcarpeta de colección), buscar parent por nombre de carpeta padre.
- [ ] **C387k** `fileWatcherService`: extender detección de carpetas a nivel 2 (actualmente solo nivel 1). Carpeta nueva dentro de colección = subcolección.
- [ ] **C387l** `syncWatcherSetup`: callbacks de carpeta nivel 2 → crear subcolección con `parentId`.
- [ ] **C387m** `escanearCarpetaYEncolar`: ya escanea 2 niveles, ajustar para crear subcolecciones cuando detecte archivos en nivel 2.
- [ ] **C387n** `encolarArchivo`: si `carpetas` tiene 2 elementos (coleccion/subcoleccion), resolver ambos IDs.

**Tareas React UI — Detalle colección (feedTags subcolecciones):**
- [ ] **C387o** `useColeccionDetalle`: cargar subcolecciones del endpoint. Nuevo state `subcolecciones` + `subcoleccionActiva: number | null`.
- [ ] **C387p** `ColeccionDetalleIsland`: renderizar subcolecciones como badges/tags debajo del header, ANTES del FeedSamples. Badge "Ver todo" (default activo) + badge por subcolección. Al hacer click se filtra el feed por samples de esa subcolección.
- [ ] **C387q** Crear componente `FiltroSubcolecciones.tsx`: fila horizontal de badges clicables (estilo feedTags). Props: `subcolecciones`, `activa`, `onCambiar`. Incluye badge "Ver todo" que muestra todos los samples incluyendo subcolecciones.
- [ ] **C387r** CSS: `filtroSubcolecciones.css` — estilo consistente con feedTags existente.

### C388: UI Página Colecciones — barraControl + tags

**Contexto:** La página de colecciones (LibreriaIsland tab "Mis Colecciones") actualmente muestra un grid plano de `TarjetaColeccion`. Necesita:
1. `inicioBarraControl` con filtros y ordenamiento (como en InicioIsland).
2. `feedSamplesContenedor` con `feedTags` para filtrar por los tags más frecuentes de los samples dentro de las colecciones.
3. Las subcolecciones deben mostrarse igual que las colecciones en la grid.

**Tareas:**
- [ ] **C388a** `apiColecciones`: nuevo endpoint o param para obtener tags agregados de todas las colecciones del usuario (top N tags más frecuentes).
- [ ] **C388b** Backend: `ColeccionesController::listar` → incluir `tags_frecuentes` (top 15 tags de todos los samples del usuario agrupados por frecuencia).
- [ ] **C388c** `useLibreriaIsland`: agregar estado para filtros (tags incluidos/excluidos), ordenamiento (recientes, nombre, total_samples), y búsqueda.
- [ ] **C388d** `LibreriaIsland` tab "Mis Colecciones": agregar `inicioBarraControl` con contador, selector de orden, y botón "Nueva colección".
- [ ] **C388e** `LibreriaIsland`: agregar `FiltroTags` encima del grid para filtrar colecciones por tags de sus samples.
- [ ] **C388f** `LibreriaIsland`: renderizar subcolecciones en el mismo grid que colecciones padre (con indicador visual de que son sub). TarjetaColeccion muestra badge "Sub" o ícono de anidamiento.
- [ ] **C388g** `TarjetaColeccion`: prop opcional `esSubcoleccion` para renderizar indicador visual (ícono folder anidado o badge).

---

## Orden de Implementación

| Prioridad | Tarea | Dependencia |
|---|---|---|
| 1 | **C386** Fix rename duplica colección | Ninguna (bug activo) |
| 2 | **C387a-b** Migración BD + schema | Ninguna |
| 3 | **C387c-h** Backend API subcolecciones | C387a-b |
| 4 | **C387i-n** Desktop sync subcolecciones | C387c-h |
| 5 | **C387o-r** UI feedTags subcolecciones en detalle | C387c-h |
| 6 | **C388a-g** UI barraControl + tags en página colecciones | C387c-h |

## Archivos a Modificar

| Archivo | Cambios |
|---|---|
| `syncTrackingService.ts` | `buscarColeccionPorCarpeta` case-insensitive + `ColeccionLocal.parentId` |
| `syncWatcherSetup.ts` | Fallback rename + callbacks carpeta nivel 2 |
| `syncCollectionService.ts` | `crearColeccionDesdeLocal` con `parentId` |
| `fileWatcherService.ts` | Detección carpetas nivel 2 |
| `ColeccionesSchema.php` | `parent_id` columna |
| `ColeccionesRepository.php` | Queries con subcolecciones |
| `ColeccionesCrudController.php` | Validación `parent_id` en crear |
| `ColeccionesController.php` | Endpoints ajustados |
| `SyncRepository.php` | `parent_id` en payload sync |
| `coleccion.ts` (tipos) | `parentId` en interfaces |
| `ColeccionDetalleIsland.tsx` | Badges subcolecciones |
| `useColeccionDetalle.tsx` | State subcolecciones |
| `LibreriaIsland.tsx` | barraControl + filtros + subcolecciones en grid |
| `useLibreriaIsland.ts` | Lógica filtros/orden |

## Archivos Nuevos

| Archivo | Responsabilidad |
|---|---|
| `v021_subcolecciones.sql` | Migración `parent_id` + índice |
| `FiltroSubcolecciones.tsx` | Componente badges de subcolecciones |
| `filtroSubcolecciones.css` | Estilos del filtro |
