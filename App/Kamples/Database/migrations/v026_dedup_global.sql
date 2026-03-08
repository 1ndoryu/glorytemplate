/* Migración v026 — Dedup Global: "1 Sample = 1 Existencia" */

/* ======================== */
/* FASE D1: Hash + Detección */
/* ======================== */

/* Indice unico parcial sobre audio_hash.
 * Solo aplica a samples activos/en_supervision — eliminados/inactivos pueden repetir hash.
 * El indice regular idx_samples_audio_hash (v004) se conserva para lookups sin filtro de estado. */
CREATE UNIQUE INDEX IF NOT EXISTS idx_samples_audio_hash_unique
ON samples (audio_hash)
WHERE audio_hash IS NOT NULL AND estado IN ('activo', 'en_supervision');

/* Columna para hash parcial (first 8KB + last 8KB + size) — pre-verificacion antes de upload.
 * Permite al desktop preguntar "ya existe?" sin subir el archivo completo. */
ALTER TABLE samples ADD COLUMN IF NOT EXISTS hash_parcial VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_samples_hash_parcial ON samples (hash_parcial) WHERE hash_parcial IS NOT NULL;


/* ======================== */
/* FASE D2: Constraint 1:1 per-user */
/* ======================== */

/* Paso 1: Denormalizar usuario_id en coleccion_samples.
 * Permite constraint UNIQUE(usuario_id, sample_id) — un sample solo en 1 coleccion POR USUARIO.
 * Diferentes usuarios pueden coleccionar el mismo sample en sus propias colecciones. */
ALTER TABLE coleccion_samples ADD COLUMN IF NOT EXISTS usuario_id INT REFERENCES usuarios_ext(id);

/* Poblar desde colecciones existentes */
UPDATE coleccion_samples cs
SET usuario_id = c.usuario_id
FROM colecciones c
WHERE cs.coleccion_id = c.id AND cs.usuario_id IS NULL;

/* Hacer NOT NULL despues de poblar */
ALTER TABLE coleccion_samples ALTER COLUMN usuario_id SET NOT NULL;

/* Indice para lookups por usuario */
CREATE INDEX IF NOT EXISTS idx_cs_usuario_id ON coleccion_samples (usuario_id);

/* Paso 2: Limpiar duplicados existentes POR USUARIO.
 * Regla: subcoleccion > coleccion raiz; mas reciente segundo.
 * Se conserva 1 entrada por (usuario_id, sample_id). */
WITH duplicados AS (
  SELECT
    cs.sample_id,
    cs.coleccion_id,
    cs.usuario_id,
    ROW_NUMBER() OVER (
      PARTITION BY cs.usuario_id, cs.sample_id
      ORDER BY
        CASE WHEN c.parent_id IS NOT NULL THEN 0 ELSE 1 END,
        cs.added_at DESC
    ) as rn
  FROM coleccion_samples cs
  JOIN colecciones c ON cs.coleccion_id = c.id
)
DELETE FROM coleccion_samples
WHERE (sample_id, coleccion_id) IN (
  SELECT sample_id, coleccion_id FROM duplicados WHERE rn > 1
);

/* Paso 3: Constraint — un sample solo puede estar en 1 coleccion POR USUARIO */
ALTER TABLE coleccion_samples ADD CONSTRAINT uq_usuario_sample UNIQUE (usuario_id, sample_id);


/* ======================== */
/* FASE D5: Moderacion      */
/* ======================== */

/* Tabla de duplicados pendientes de revision por moderador */
CREATE TABLE IF NOT EXISTS duplicados_pendientes (
  id SERIAL PRIMARY KEY,
  sample_original_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  sample_duplicado_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cross_usuario', 'mismo_usuario', 'backfill')),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'fusionado')),
  resuelto_por INT REFERENCES usuarios_ext(id),
  resuelto_at TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sample_original_id, sample_duplicado_id)
);

CREATE INDEX IF NOT EXISTS idx_duplicados_estado ON duplicados_pendientes(estado) WHERE estado = 'pendiente';
