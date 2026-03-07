# Plan de Deduplicacion Global — "1 Sample = 1 Existencia"

> **Decision definitiva del usuario:** Un sample solo puede existir UNA vez en todo el sistema — una vez en el servidor, una vez en una coleccion, una vez por usuario. No se aceptan duplicados en diferentes colecciones ni entre usuarios. La moderacion resuelve conflictos.

> **Fecha:** 2025-01-XX | **Estado:** Planificacion | **Prioridad:** Critica

---

## Indice

1. [Estado Actual y Problemas](#1-estado-actual-y-problemas)
2. [Arquitectura Objetivo](#2-arquitectura-objetivo)
3. [Fase D1 — Hash de Audio y Deteccion Server-Side](#3-fase-d1--hash-de-audio-y-deteccion-server-side)
4. [Fase D2 — Constraint 1:1 Sample-Coleccion](#4-fase-d2--constraint-11-sample-coleccion)
5. [Fase D3 — Vista Virtual en Colecciones Padre](#5-fase-d3--vista-virtual-en-colecciones-padre)
6. [Fase D4 — Ajustes Desktop Sync](#6-fase-d4--ajustes-desktop-sync)
7. [Fase D5 — Panel de Moderacion de Duplicados](#7-fase-d5--panel-de-moderacion-de-duplicados)
8. [Migracion de Datos Existentes](#8-migracion-de-datos-existentes)
9. [Resumen de Cambios por Archivo](#9-resumen-de-cambios-por-archivo)
10. [Riesgos y Mitigaciones](#10-riesgos-y-mitigaciones)
11. [Orden de Implementacion](#11-orden-de-implementacion)

---

## 1. Estado Actual y Problemas

### 1.1 Schema actual

```
coleccion_samples:
  PRIMARY KEY (coleccion_id, sample_id)   -- M:N, permite mismo sample en multiples colecciones
  FK coleccion_id → colecciones(id) ON DELETE CASCADE
  FK sample_id → samples(id) ON DELETE CASCADE
  posicion INT
  added_at TIMESTAMP

samples:
  audio_hash VARCHAR(64)   -- EXISTE pero NUNCA se popula
  -- No hay UNIQUE INDEX sobre audio_hash
```

### 1.2 Problemas identificados

| Problema | Causa raiz | Efecto |
|---|---|---|
| Sample descargado en carpeta incorrecta | M:N en `coleccion_samples`: sample en coleccion padre `as11` Y subcoleccion `ap22`. Sync procesa padre primero, descarga ahi. Subcoleccion recibe 'existente' apuntando al archivo del padre. | Archivo fisico en carpeta equivocada |
| Duplicados entre colecciones del mismo usuario | `agregarAtomico()` permite agregar el mismo sample a N colecciones sin restriccion | Sample aparece en multiples carpetas locales |
| Duplicados entre usuarios distintos | No hay validacion de hash al subir — dos usuarios suben el mismo WAV y se crean 2 rows en `samples` | Storage duplicado, confusion en comunidad |
| `audio_hash` inutilizado | `PipelineAudio` programa calculo via `DeduplicadorAudio::programarCalculo` pero la columna no se usa para validacion | No hay infraestructura de dedup funcional |
| Cross-collection tracking complejo | `buscarArchivoPorSampleId()` crea tracking entries apuntando al mismo archivo desde multiples colecciones | Complejidad innecesaria, inconsistencia disco vs tracking |

### 1.3 Flujo actual de upload (relevante)

```
SamplesUploadController::subir()
  → Validar archivo (MIME, size, magic bytes)
  → wp_handle_upload() → guardar en wp_kamples/{userId}/{year}/{month}/
  → SamplesRepository::insertarSample() → row en `samples` (audio_hash = NULL)
  → shutdown hook → PipelineAudio::procesar()
    → FFprobe duracion
    → BPM/key analisis
    → IA analisis creativo (Gemini/Groq)
    → Renombrar archivo
    → Waveform peaks
    → MP3 optimizado + preview
    → DeduplicadorAudio::programarCalculo() → [NO BLOQUEA, calculo async]
    → UPDATE samples SET estado = 'activo'
```

**Problema critico:** El sample se activa ANTES de tener hash. Si otro usuario sube el mismo audio 1 segundo despues, se crea un duplicado.

### 1.4 Flujo actual de agregar a coleccion

```
ColeccionSamplesRepository::agregarAtomico($colId, $sampleId)
  → INSERT INTO coleccion_samples (coleccion_id, sample_id, posicion)
    SELECT :colId, :sampleId, MAX(posicion)+1
    ON CONFLICT DO NOTHING
```

**Conflicto solo por PK (coleccion_id, sample_id):** Si el mismo sample ya esta en ESA coleccion, no se duplica. Pero se puede agregar a CUALQUIER otra coleccion libremente.

---

## 2. Arquitectura Objetivo

### 2.1 Reglas absolutas

1. **1 sample = 1 row en `samples`**: No puede existir audio identico como dos registros distintos.
2. **1 sample = 1 coleccion**: Un sample solo puede pertenecer a UNA coleccion/subcoleccion por usuario. `UNIQUE(sample_id)` en `coleccion_samples`.
3. **1 archivo = 1 carpeta en desktop**: El archivo fisico existe en una unica ubicacion. Sin cross-collection tracking.
4. **Hash obligatorio pre-activacion**: El sample NO se activa (`estado = 'activo'`) hasta que su `audio_hash` este calculado y verificado contra duplicados.
5. **Vista virtual en padre**: Cuando un usuario ve una coleccion padre sin filtro de subcoleccion, los samples de las subcolecciones se muestran como "heredados" (query aggregation, no duplicacion fisica).
6. **Moderacion para conflictos cross-user**: Si dos usuarios suben el mismo audio, el sistema lo detecta y lo gestiona via panel de moderacion.

### 2.2 Diagrama de flujo objetivo (upload)

```
Cliente sube audio
  → Pre-check parcial: POST /samples/check-duplicate { hashParcial, tamano }
    → Si match parcial → "posible duplicado, continuar upload para verificacion completa"
    → Si no match → "seguro, continuar"
  
  → Upload: POST /samples/upload
    → Crear row en samples con estado = 'procesando' (NO activo)
    → PipelineAudio::procesar()
      → [Paso nuevo] Calcular SHA-256 del audio completo
      → Buscar hash en samples WHERE audio_hash = :hash AND estado = 'activo'
        → MATCH mismo usuario → Rechazar, retornar sample existente
        → MATCH otro usuario  → Crear flag de moderacion, activar como 'en_supervision'
        → NO MATCH → Guardar hash, continuar pipeline normal
      → Activar sample (estado = 'activo')
```

### 2.3 Diagrama de flujo objetivo (agregar a coleccion)

```
Usuario agrega sample a coleccion X
  → Verificar: SELECT coleccion_id FROM coleccion_samples WHERE sample_id = :id
    → Si ya esta en coleccion X → noop (idempotente)
    → Si esta en coleccion Y → MOVER atomicamente (DELETE de Y + INSERT en X)
    → Si no esta en ninguna → INSERT normal
  
  → Desktop sync recibe el cambio via delta/reconciliacion
    → Sample en coleccion anterior → eliminar tracking + archivo
    → Sample en coleccion nueva → descargar
```

---

## 3. Fase D1 — Hash de Audio y Deteccion Server-Side

### 3.1 Calculo de hash en pipeline (BLOQUANTE)

**Archivo:** `App/Kamples/Api/PipelineAudio.php`

**Cambio:** Mover el calculo de hash de `DeduplicadorAudio::programarCalculo()` (async, no bloquea) a un paso SINCRONO dentro de `PipelineAudio::procesar()`, ANTES de activar el sample.

```
Nuevo paso en pipeline (entre paso 5 y activacion):
  → hash_sha256 = hash_file('sha256', $rutaArchivo)
  → Buscar duplicado: SELECT id, creador_id FROM samples 
      WHERE audio_hash = :hash AND estado IN ('activo','en_supervision') AND id != :currentId
  → Si duplicado mismo usuario → DELETE sample actual + archivos, retornar ID existente
  → Si duplicado otro usuario → Crear entrada en tabla 'duplicados_pendientes', estado = 'en_supervision'
  → Si no hay duplicado → UPDATE samples SET audio_hash = :hash, estado = 'activo'
```

### 3.2 Indice unico parcial

**Migracion SQL:**

```sql
/* Solo aplica a samples activos/en_supervision — los eliminados/inactivos pueden tener hashes repetidos */
CREATE UNIQUE INDEX idx_samples_audio_hash_unique 
ON samples (audio_hash) 
WHERE audio_hash IS NOT NULL AND estado IN ('activo', 'en_supervision');
```

### 3.3 Endpoint de pre-verificacion

**Nuevo endpoint:** `POST /kamples/v1/samples/check-duplicate`

**Request:**
```json
{
  "hashParcial": "sha256 de primeros 8KB + ultimos 8KB + tamano",
  "tamano": 1234567,
  "formato": "wav"
}
```

**Response:**
```json
{
  "posibleDuplicado": true,
  "sampleId": 456,
  "esMismoUsuario": true,
  "mensaje": "Ya tienes este sample subido. Se vinculara automaticamente."
}
```

**Logica server:**
- Tabla auxiliar `samples_hash_parcial` o columna extra en `samples`
- El hash parcial NO es definitivo — solo ahorra bandwidth si hay match obvio
- Si `posibleDuplicado = true` Y `esMismoUsuario = true` → cliente puede vincular sin re-subir
- Si `posibleDuplicado = true` Y `esMismoUsuario = false` → cliente sube normalmente, pipeline completo decidira

### 3.4 Desktop: hash parcial pre-upload

**Archivo:** `desktop/src/services/uploadQueueService.ts`

**Estado actual:** Ya calcula SHA-256 parcial (first 8KB + last 8KB + filesize) para evitar re-uploads en la misma sesion (variable `J`).

**Cambio:** Antes de encolar, llamar al endpoint `check-duplicate`:
```
calcularHashParcial(archivo)
  → POST /samples/check-duplicate { hashParcial, tamano, formato }
  → Si duplicado mismo usuario → skip upload, vincular sample existente a coleccion
  → Si duplicado otro usuario → subir normalmente (pipeline server resuelve)
  → Si no duplicado → subir normalmente
```

### 3.5 Backfill de hashes existentes

**Script migracion:** Calcular `audio_hash` para TODOS los samples existentes que tengan `audio_hash IS NULL`.

```sql
/* Paso 1: Identificar samples sin hash */
SELECT id, ruta_original FROM samples WHERE audio_hash IS NULL AND estado = 'activo';
```

**Implementacion:** CLI command o cron job que:
1. Obtiene batch de 100 samples sin hash
2. Calcula SHA-256 de cada archivo
3. UPDATE samples SET audio_hash = :hash WHERE id = :id
4. Si detecta duplicado (hash ya existe) → crear entrada en `duplicados_pendientes`

---

## 4. Fase D2 — Constraint 1:1 Sample-Coleccion

### 4.1 Objetivo

Un sample solo puede estar en UNA coleccion a la vez. Esto elimina:
- Samples descargados en carpeta incorrecta (problema del usuario con as11/ap22)
- Cross-collection tracking complejo en desktop
- Confusion sobre "donde esta mi sample"

### 4.2 Migracion SQL

```sql
/* Paso 1: Limpiar duplicados existentes — conservar la entrada mas especifica */
/* Regla: subcoleccion > coleccion raiz; si ambas son raiz/sub, conservar la mas reciente */
WITH duplicados AS (
  SELECT 
    cs.sample_id,
    cs.coleccion_id,
    c.parent_id,
    cs.added_at,
    ROW_NUMBER() OVER (
      PARTITION BY cs.sample_id 
      ORDER BY 
        CASE WHEN c.parent_id IS NOT NULL THEN 0 ELSE 1 END,  /* subcoleccion primero */
        cs.added_at DESC  /* mas reciente segundo */
    ) as rn
  FROM coleccion_samples cs
  JOIN colecciones c ON cs.coleccion_id = c.id
)
DELETE FROM coleccion_samples 
WHERE (sample_id, coleccion_id) IN (
  SELECT sample_id, coleccion_id FROM duplicados WHERE rn > 1
);

/* Paso 2: Agregar constraint UNIQUE */
ALTER TABLE coleccion_samples ADD CONSTRAINT uq_sample_una_coleccion UNIQUE (sample_id);
```

### 4.3 Cambio en agregarAtomico()

**Archivo:** `App/Kamples/Database/Repositories/ColeccionSamplesRepository.php`

**Antes:**
```php
INSERT INTO coleccion_samples (coleccion_id, sample_id, posicion)
SELECT :colId, :sampleId, MAX(posicion)+1
ON CONFLICT DO NOTHING  /* conflicto por PK (coleccion_id, sample_id) */
```

**Despues:**
```php
/* Mover atomicamente: si el sample ya esta en otra coleccion, MOVER */
INSERT INTO coleccion_samples (coleccion_id, sample_id, posicion)
SELECT :colId, :sampleId, COALESCE(MAX(posicion), 0) + 1
FROM coleccion_samples WHERE coleccion_id = :colIdMax
ON CONFLICT (sample_id) DO UPDATE 
SET coleccion_id = EXCLUDED.coleccion_id,
    posicion = EXCLUDED.posicion,
    added_at = NOW()
```

**Alternativa mas explicita (controller level):**
```php
public static function moverAColeccion(int $colId, int $sampleId): string {
    $existente = static::consultarUno(
        "SELECT coleccion_id FROM coleccion_samples WHERE sample_id = :sid",
        ['sid' => $sampleId]
    );
    
    if ($existente && (int)$existente['coleccion_id'] === $colId) {
        return 'ya_en_coleccion'; /* Idempotente */
    }
    
    /* Transaccion atomica: quitar de anterior + agregar a nueva */
    static::ejecutar("DELETE FROM coleccion_samples WHERE sample_id = :sid", ['sid' => $sampleId]);
    static::agregarAtomico($colId, $sampleId);
    
    return $existente ? 'movido' : 'agregado';
}
```

### 4.4 Nuevo endpoint: Mover sample entre colecciones

**Endpoint:** `POST /kamples/v1/colecciones/{colId}/mover-sample`

**Request:**
```json
{
  "sampleId": 123,
  "confirmar": true  /* requerido si el sample ya esta en otra coleccion */
}
```

**Response:**
```json
{
  "ok": true,
  "accion": "movido",       /* "agregado" | "movido" | "ya_en_coleccion" */
  "coleccionAnterior": 45,  /* null si era nuevo */
  "coleccionNueva": 67
}
```

### 4.5 Impacto en SyncRepository::coleccionesConSamples()

Con el constraint UNIQUE(sample_id), la CTE ya no puede retornar el mismo sample en multiples colecciones. **No requiere cambio SQL** — el constraint a nivel de BD garantiza la unicidad automaticamente.

---

## 5. Fase D3 — Vista Virtual en Colecciones Padre

### 5.1 Problema

Si un sample solo puede estar en UNA subcoleccion, al ver la coleccion padre "vacia" no se ven los samples. El usuario espera ver todos los samples de sus subcolecciones agregados cuando navega el padre.

### 5.2 Solucion: Agregacion por herencia

**En la web (React Islands):**

Cuando se solicitan samples de una coleccion padre:
```sql
/* Samples directos de la coleccion + samples de subcolecciones */
SELECT s.*, cs.coleccion_id as coleccion_origen, c.nombre as coleccion_nombre
FROM coleccion_samples cs
JOIN samples s ON cs.sample_id = s.id
JOIN colecciones c ON cs.coleccion_id = c.id
WHERE cs.coleccion_id = :colId          /* directos */
   OR c.parent_id = :colId              /* heredados de subcolecciones */
ORDER BY cs.posicion ASC
```

Opcionalmente, agregar bandera `esHeredado: true` para que el frontend muestre de que subcoleccion viene.

**En el desktop sync:**

El desktop YA maneja la estructura de carpetas fisicamente (padre/subcarpeta/). No necesita esta vista virtual — el usuario navega carpetas en el sistema de archivos. Opcionalmente, la UI del panel de sync podria mostrar el conteo total incluyendo subcolecciones.

### 5.3 Endpoint ajustado

**Archivo:** Controlador de colecciones (web API, no sync)

Agregar parametro `?incluirSubcolecciones=true` (default true para vista de coleccion padre):

```php
public static function samplesDeColeccion(int $colId, bool $incluirSub = false): array {
    if ($incluirSub) {
        /* Agregar todos los samples de colecciones hijas */
        $subIds = ColeccionesRepository::idsSubcolecciones($colId);
        $todosIds = array_merge([$colId], $subIds);
        return self::samplesPorColecciones($todosIds);
    }
    return self::samplesDirectos($colId);
}
```

---

## 6. Fase D4 — Ajustes Desktop Sync

### 6.1 Simplificacion de descargarSiNecesario()

**Archivo:** `desktop/src/services/syncCollectionService.ts`

**Con el constraint 1:1**, cada sample viene del servidor en exactamente UNA coleccion. Los pasos de cross-collection check se simplifican:

**Antes (complejo):**
```
1. Buscar en tracking de esta coleccion
2. Si no → buscar en tracking de TODAS las colecciones (buscarArchivoPorSampleId)
3. Si encontrado en otra → crear tracking duplicado apuntando al mismo archivo
4. Si no → descargar
```

**Despues (simple):**
```
1. Buscar en tracking de esta coleccion
2. Si existe Y archivo en disco → existente
3. Si existe pero NO en disco → limpiar tracking corrupto, re-descargar
4. Si no existe → descargar a la carpeta de esta coleccion
```

**Eliminacion de buscarArchivoPorSampleId():** Ya no necesario para el flujo de descarga. Se puede conservar solo para limpieza/diagnostico.

### 6.2 Manejo de movimiento server-side

Si el servidor mueve un sample de coleccion A a coleccion B (via `mover-sample`):

1. **Delta sync detecta:** Sample desaparece de coleccion A, aparece en coleccion B
2. **syncCollectionService procesa:**
   - Coleccion A: sample no esta en servidor pero si en tracking local → eliminar tracking + mover archivo a papelera/"duplicados" (o simplemente eliminar si ya se descargar en B)
   - Coleccion B: sample nuevo → descargar (o mover archivo fisico de A a B)
3. **Optimizacion:** Si el archivo ya existe localmente en otra carpeta, MOVER en vez de re-descargar:
   ```typescript
   const archivoAnterior = buscarArchivoPorSampleIdEnTracking(sample.id);
   if (archivoAnterior && await existeEnDisco(archivoAnterior.rutaLocal)) {
     await rename(archivoAnterior.rutaLocal, nuevaRuta);
     eliminarTracking(archivoAnterior);
     registrarTracking(sample.id, coleccionId, nuevaRuta);
     return 'movido';
   }
   /* Si no existe localmente, descargar normalmente */
   ```

### 6.3 Upload desde desktop con dedup

**Archivo:** `desktop/src/services/uploadQueueService.ts`

**Flujo mejorado:**
```
1. Calcular hash parcial (ya existe: first 8KB + last 8KB + size)
2. POST /samples/check-duplicate { hashParcial, tamano }
3. Si duplicado mismo usuario:
   → No subir
   → POST /colecciones/{colId}/mover-sample { sampleId: existente.id }
   → Actualizar tracking local
4. Si duplicado otro usuario:
   → Subir normalmente (pipeline decidira en_supervision)
5. Si no duplicado:
   → Subir normalmente
```

---

## 7. Fase D5 — Panel de Moderacion de Duplicados

### 7.1 Tabla nueva: duplicados_pendientes

```sql
CREATE TABLE duplicados_pendientes (
  id SERIAL PRIMARY KEY,
  sample_original_id INT NOT NULL REFERENCES samples(id),
  sample_duplicado_id INT NOT NULL REFERENCES samples(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cross_usuario', 'mismo_usuario', 'backfill')),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'fusionado')),
  resuelto_por INT REFERENCES usuarios_ext(id),
  resuelto_at TIMESTAMP,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sample_original_id, sample_duplicado_id)
);

CREATE INDEX idx_duplicados_estado ON duplicados_pendientes(estado) WHERE estado = 'pendiente';
```

### 7.2 Deteccion automatica

**En PipelineAudio (D1):**
```
hash calculado → buscar en samples
  → Match cross-user → INSERT duplicados_pendientes (tipo='cross_usuario')
  → Match mismo usuario → INSERT duplicados_pendientes (tipo='mismo_usuario') + reject/link automatico
```

**En backfill (D1.5):**
```
Calculo batch de hashes → agrupar por hash → para cada grupo con >1 sample:
  → INSERT duplicados_pendientes (tipo='backfill')
```

### 7.3 Endpoint Admin: Listar duplicados pendientes

**Endpoint:** `GET /kamples/v1/admin/duplicados`

**Query params:** `?estado=pendiente&tipo=cross_usuario&pagina=1&porPagina=20`

**Response:**
```json
{
  "ok": true,
  "total": 42,
  "duplicados": [
    {
      "id": 1,
      "original": {
        "id": 100, "titulo": "Sad Piano Loop", "creador": "usuario_A",
        "creadorId": 5, "subidoAt": "2024-12-01", "coleccion": "Mi Libreria"
      },
      "duplicado": {
        "id": 200, "titulo": "Piano Melancholy", "creador": "usuario_B",
        "creadorId": 8, "subidoAt": "2024-12-15", "coleccion": null
      },
      "tipo": "cross_usuario",
      "estado": "pendiente",
      "similitud": "hash_exacto"
    }
  ]
}
```

### 7.4 Acciones del moderador

| Accion | Efecto | Endpoint |
|---|---|---|
| **Fusionar** | Conservar sample original (mas antiguo), eliminar duplicado, reasignar relaciones (likes, descargas, colecciones) al original | `POST /admin/duplicados/{id}/fusionar` |
| **Aprobar ambos** | Override: marcar como "no duplicado real" (ej: samples similares pero no identicos) | `POST /admin/duplicados/{id}/aprobar` |
| **Rechazar duplicado** | Eliminar el sample mas reciente, notificar al usuario afectado | `POST /admin/duplicados/{id}/rechazar` |
| **Intercambiar original** | Si el "duplicado" tiene mejor calidad/metadatos, invertir cual se conserva | `POST /admin/duplicados/{id}/intercambiar` |

### 7.5 Logica de fusion (critica)

Cuando se fusiona sample_duplicado INTO sample_original:

```sql
BEGIN;

/* 1. Transferir relaciones del duplicado al original */
UPDATE coleccion_samples SET sample_id = :originalId 
WHERE sample_id = :duplicadoId 
ON CONFLICT (sample_id) DO NOTHING;  /* si original ya esta en esa coleccion, ignorar */

UPDATE likes SET sample_id = :originalId WHERE sample_id = :duplicadoId ON CONFLICT DO NOTHING;
UPDATE descargas SET sample_id = :originalId WHERE sample_id = :duplicadoId ON CONFLICT DO NOTHING;
UPDATE publicaciones SET sample_id = :originalId WHERE sample_id = :duplicadoId ON CONFLICT DO NOTHING;

/* 2. Marcar duplicado como eliminado */
UPDATE samples SET estado = 'eliminado' WHERE id = :duplicadoId;

/* 3. Resolver el registro de duplicado */
UPDATE duplicados_pendientes 
SET estado = 'fusionado', resuelto_por = :adminId, resuelto_at = NOW() 
WHERE id = :duplicadoRegistroId;

COMMIT;
```

### 7.6 UI del panel de moderacion

**Ubicacion:** Tab dedicada en Panel Admin (FASE 13 del roadmap)

**Componentes React:**
- `PanelDuplicados.tsx` — Lista paginada con filtros (estado, tipo, fecha)
- `TarjetaDuplicado.tsx` — Muestra ambos samples lado a lado con player integrado para comparar
- `usePanelDuplicados.ts` — Hook con fetching, paginacion, acciones

**Informacion mostrada por cada par:**
- Player de audio de ambos samples (para escuchar y comparar)
- Metadata: titulo, tags, BPM, key, fecha de subida
- Creador de cada uno
- En que colecciones estan
- Cuantos likes/descargas tiene cada uno
- Botones de accion: Fusionar, Aprobar, Rechazar, Intercambiar

---

## 8. Migracion de Datos Existentes

### 8.1 Orden de ejecucion (CRITICO)

```
1. [D1.5] Backfill: Calcular audio_hash para todos los samples existentes
2. [D1.5] Detectar: Agrupar por hash, crear entradas en duplicados_pendientes
3. [D2.2] Limpiar: SQL para eliminar entradas duplicadas en coleccion_samples (conservar mas especifica)
4. [D2.2] Constraint: ALTER TABLE coleccion_samples ADD CONSTRAINT uq_sample_una_coleccion UNIQUE (sample_id)
5. [D1.2] Index: CREATE UNIQUE INDEX idx_samples_audio_hash_unique ON samples (audio_hash) WHERE ...
6. [D5] Panel: Resolver duplicados pendientes via moderacion (puede ser gradual)
```

### 8.2 Backfill hash (script CLI)

```php
/* CLI: php glory hash:backfill --batch=100 */
class HashBackfillCommand {
    public function ejecutar(int $batch = 100): void {
        $pendientes = SamplesRepository::sinHash($batch);
        
        foreach ($pendientes as $sample) {
            $ruta = $sample['ruta_original'];
            if (!file_exists($ruta)) {
                KamplesLogger::warning('Backfill: archivo no encontrado', ['id' => $sample['id']]);
                continue;
            }
            
            $hash = hash_file('sha256', $ruta);
            
            /* Verificar si ya existe otro sample con este hash */
            $existente = SamplesRepository::buscarPorHash($hash, $sample['id']);
            if ($existente) {
                DuplicadosPendientesRepository::crear([
                    'sample_original_id' => min($existente['id'], $sample['id']),
                    'sample_duplicado_id' => max($existente['id'], $sample['id']),
                    'tipo' => $existente['creador_id'] === $sample['creador_id'] ? 'mismo_usuario' : 'cross_usuario',
                ]);
            }
            
            SamplesRepository::actualizarHash($sample['id'], $hash);
        }
    }
}
```

### 8.3 Limpieza de coleccion_samples duplicados

```sql
/* Preview: Ver cuantos samples estan en multiples colecciones */
SELECT sample_id, COUNT(*) as veces
FROM coleccion_samples 
GROUP BY sample_id 
HAVING COUNT(*) > 1;

/* Limpieza con regla: subcoleccion > raiz, mas reciente > mas antigua */
/* VER SQL COMPLETO EN seccion 4.2 */
```

### 8.4 Rollback plan

Si algo sale mal:
1. **Backup previo:** `pg_dump` completo antes de iniciar
2. **Constraint reversible:** `ALTER TABLE coleccion_samples DROP CONSTRAINT uq_sample_una_coleccion`
3. **Index reversible:** `DROP INDEX idx_samples_audio_hash_unique`
4. **Tabla nueva (duplicados_pendientes):** DROP si se necesita revertir completamente

---

## 9. Resumen de Cambios por Archivo

### Server (PHP)

| Archivo | Cambio | Fase |
|---|---|---|
| `PipelineAudio.php` | Hash SHA-256 sincrono + verificacion duplicado ANTES de activar | D1 |
| `SamplesUploadController.php` | Sin cambio directo (pipeline hace la magia) | — |
| `ColeccionSamplesRepository.php` | `moverAColeccion()` atomico, ajustar `agregarAtomico()` | D2 |
| `SyncRepository.php` | Sin cambio (constraint BD garantiza unicidad) | — |
| `SyncController.php` | Sin cambio (respuesta ya es 1 sample = 1 coleccion post-migracion) | — |
| **NUEVO** `DuplicadosPendientesRepository.php` | CRUD para tabla `duplicados_pendientes` | D5 |
| **NUEVO** `DuplicadosController.php` | Endpoints admin: listar, fusionar, aprobar, rechazar | D5 |
| **NUEVO** `HashBackfillCommand.php` | CLI para calcular hashes existentes | D1 |
| **NUEVO** endpoint `check-duplicate` | Pre-verificacion de hash parcial | D1 |
| **NUEVO** endpoint `mover-sample` | Mover sample entre colecciones atomicamente | D2 |
| **NUEVO** migracion SQL `v00X_dedup_global` | hash index + unique coleccion + tabla duplicados | D1+D2+D5 |

### Desktop (TypeScript)

| Archivo | Cambio | Fase |
|---|---|---|
| `syncCollectionService.ts` | Simplificar `descargarSiNecesario()`: eliminar cross-collection check, agregar logica de move | D4 |
| `syncTrackingService.ts` | Simplificar: sin tracking multi-coleccion para mismo sample | D4 |
| `uploadQueueService.ts` | Pre-check `check-duplicate` antes de encolar, vincular si ya existe | D4 |

### Web (React Islands)

| Archivo | Cambio | Fase |
|---|---|---|
| **NUEVO** `PanelDuplicados.tsx` | UI lista duplicados pendientes con comparador | D5 |
| **NUEVO** `TarjetaDuplicado.tsx` | Tarjeta comparativa lado a lado | D5 |
| **NUEVO** `usePanelDuplicados.ts` | Hook para fetching/acciones | D5 |
| Controlador web de colecciones | Parametro `incluirSubcolecciones` | D3 |

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Backfill tarde horas en produccion | Media | Bajo (readonly) | Ejecutar en batches de 100, con sleep entre batches. No bloquea uploads. |
| Hash collision SHA-256 | Practicamente nula | Alto | SHA-256 tiene 2^256 posibilidades. No es un riesgo real. Si se quiere extra seguridad, comparar tamano + hash. |
| Samples "perdidos" al limpiar coleccion_samples | Baja | Alto | La limpieza SQL CONSERVA siempre 1 entrada. Ningun sample se queda sin coleccion. Backup previo obligatorio. |
| Desktop sync rompe al recibir datos post-constraint | Media | Medio | El desktop ya no recibiria duplicados, asi que se simplifica. Desplegar server primero, desktop despues. |
| Pipeline se ralentiza por hash sincrono | Baja | Bajo | SHA-256 de un archivo de 50MB tarda ~200ms. Insignificante vs pipeline de IA (10-30s). |
| Usuarios se quejan de "no puedo duplicar mi sample" | Media | Bajo | El concepto de "agregar a coleccion" se redefine como "mover". La UI debe comunicar claramente "Mover a coleccion X". |

---

## 11. Orden de Implementacion

### Prioridad de fases

```
D1 (Hash + Deteccion)          ← Fundacion, todo depende de esto
  ↓
D2 (Constraint 1:1)            ← Requiere D1 para resolver duplicados antes de aplicar constraint
  ↓
D4 (Desktop Sync ajustes)      ← Requiere D2 (server ya envia datos sin duplicados)
  ↓
D3 (Vista virtual padre)       ← Independiente, puede ir en paralelo con D4
  ↓
D5 (Panel moderacion)          ← Puede desarrollarse en paralelo con D2-D4, pero resolver duplicados requiere D1
```

### Checklist de implementacion

- [ ] **D1.1** — Hash SHA-256 sincrono en PipelineAudio + verificacion duplicado pre-activacion
- [ ] **D1.2** — Indice unico parcial `idx_samples_audio_hash_unique`
- [ ] **D1.3** — Endpoint `check-duplicate` (pre-verificacion parcial)
- [ ] **D1.4** — Tabla `samples_hash_parcial` (o columna en `samples`)
- [ ] **D1.5** — Script CLI backfill hashes existentes
- [ ] **D2.1** — Metodo `moverAColeccion()` en ColeccionSamplesRepository
- [ ] **D2.2** — SQL limpieza duplicados en coleccion_samples
- [ ] **D2.3** — Constraint UNIQUE(sample_id) en coleccion_samples
- [ ] **D2.4** — Endpoint `mover-sample` en controlador de colecciones
- [ ] **D3.1** — Query de herencia virtual en colecciones padre (web API)
- [ ] **D3.2** — Parametro `incluirSubcolecciones` en endpoint de coleccion
- [ ] **D4.1** — Simplificar `descargarSiNecesario()` (eliminar cross-collection)
- [ ] **D4.2** — Logica de move local (detectar sample movido entre colecciones)
- [ ] **D4.3** — Pre-check `check-duplicate` en uploadQueueService
- [ ] **D5.1** — Tabla `duplicados_pendientes` + Repository
- [ ] **D5.2** — Controller admin con endpoints (listar, fusionar, aprobar, rechazar)
- [ ] **D5.3** — PanelDuplicados.tsx + TarjetaDuplicado.tsx + hook
- [ ] **D5.4** — Logica de fusion con transferencia de relaciones
- [ ] **D5.5** — Logica de resolucion automatica (mismo usuario = auto-link)

---

## Lecciones y Contexto

- [Schema]: `coleccion_samples` PK es `(coleccion_id, sample_id)` — M:N que permite duplicados cross-coleccion
- [Schema]: `samples.audio_hash` existe (VARCHAR 64) pero nunca se popula — infraestructura muerta
- [Pipeline]: `DeduplicadorAudio::programarCalculo()` es async y no bloquea activacion — sample se activa sin hash
- [Desktop]: `buscarArchivoPorSampleId()` crea tracking entries duplicadas apuntando al mismo archivo fisico — complejidad innecesaria que se elimina con constraint 1:1
- [Upload]: Idempotencia por `X-Idempotency-Key` ya funciona — protege contra re-upload accidental en misma sesion pero no contra duplicados reales
- [Upload desktop]: Hash parcial (SHA-256 first 8KB + last 8KB + size) ya existe en `uploadQueueService.ts` variable `J` — reutilizable para check-duplicate
- [Servidor]: `agregarAtomico()` usa ON CONFLICT DO NOTHING por PK — no detecta que el sample ya esta en OTRA coleccion
- [Subcolecciones]: parent_id en colecciones establece jerarquia. Desktop crea subcarpetas fisicas dentro de carpeta padre. Server retorna flat list con parent_id para que el cliente reconstruya el arbol.
