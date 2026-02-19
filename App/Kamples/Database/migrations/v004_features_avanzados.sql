/*
 * Kamples — Migración v004: Features avanzados
 *
 * Cambios:
 * 1. Renombra remitente_id → autor_id en mensajes (si existe con nombre antiguo)
 * 2. Agrega columna datos JSONB a notificaciones (para almacenar datos estructurados)
 * 3. Agrega creador_id, pago_creador, comision_plataforma a transacciones
 * 4. Agrega audio_hash a samples (para deduplicación por fingerprint)
 * 5. Actualiza constraint de estado en samples (agrega 'en_supervision')
 * 6. Agrega repost_id a publicaciones
 * 7. Agrega updated_at a colecciones
 * 8. Crea tabla reportes_duplicados
 * 9. Agrega portada_url a colecciones
 *
 * Ejecutar: psql -U postgres -d kamples -f v004_features_avanzados.sql
 */

/* 1. Tabla mensajes: renombrar remitente_id → autor_id si existe */
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mensajes' AND column_name = 'remitente_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mensajes' AND column_name = 'autor_id'
    ) THEN
        ALTER TABLE mensajes RENAME COLUMN remitente_id TO autor_id;
        RAISE NOTICE 'mensajes: remitente_id → autor_id renombrado';
    END IF;
END $$;

/* 2. Notificaciones: agregar columna datos JSONB */
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS datos JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_notificaciones_datos ON notificaciones USING GIN (datos);

/* 3. Transacciones: agregar columnas para revenue share */
DO $$
BEGIN
    /* creador_id como alias de vendedor_id */
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transacciones' AND column_name = 'vendedor_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transacciones' AND column_name = 'creador_id'
    ) THEN
        ALTER TABLE transacciones RENAME COLUMN vendedor_id TO creador_id;
        RAISE NOTICE 'transacciones: vendedor_id → creador_id renombrado';
    END IF;
END $$;

ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS pago_creador DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS comision_plataforma DECIMAL(10, 2) DEFAULT 0;

/* Actualizar constraint de estado en transacciones para incluir 'completed' */
DO $$
BEGIN
    ALTER TABLE transacciones DROP CONSTRAINT IF EXISTS transacciones_estado_check;
    ALTER TABLE transacciones ADD CONSTRAINT transacciones_estado_check
        CHECK (estado IN ('completada', 'completed', 'pendiente', 'fallida', 'reembolsada'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint de estado en transacciones ya actualizado o no existe';
END $$;

/* 4. Samples: columna audio_hash para deduplicación */
ALTER TABLE samples ADD COLUMN IF NOT EXISTS audio_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_samples_audio_hash ON samples (audio_hash) WHERE audio_hash IS NOT NULL;

/* Actualizar constraint de estado en samples para incluir 'en_supervision' */
DO $$
BEGIN
    ALTER TABLE samples DROP CONSTRAINT IF EXISTS samples_estado_check;
    ALTER TABLE samples ADD CONSTRAINT samples_estado_check
        CHECK (estado IN ('procesando', 'activo', 'inactivo', 'eliminado', 'en_supervision'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint de estado en samples ya actualizado o no existe';
END $$;

/* 5. Publicaciones: repost_id para reposts */
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS repost_id INT REFERENCES publicaciones(id) ON DELETE SET NULL;

/* 6. Colecciones: updated_at y portada_url */
ALTER TABLE colecciones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE colecciones ADD COLUMN IF NOT EXISTS portada_url TEXT;

/* Trigger de updated_at para colecciones */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_colecciones_updated') THEN
        CREATE TRIGGER trg_colecciones_updated
            BEFORE UPDATE ON colecciones
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
END $$;

/* 7. Tabla reportes_duplicados */
CREATE TABLE IF NOT EXISTS reportes_duplicados (
    id SERIAL PRIMARY KEY,
    sample_original_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    sample_duplicado_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    reportador_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'reportado'
        CHECK (estado IN ('reportado', 'en_revision', 'resuelto', 'rechazado')),
    pruebas_texto TEXT DEFAULT '',
    resuelto_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reportes_dup_estado ON reportes_duplicados (estado);
CREATE INDEX IF NOT EXISTS idx_reportes_dup_original ON reportes_duplicados (sample_original_id);

/* Verificación final */
DO $$
DECLARE
    cols_added INT := 0;
BEGIN
    SELECT COUNT(*) INTO cols_added
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND (
        (table_name = 'samples' AND column_name = 'audio_hash') OR
        (table_name = 'notificaciones' AND column_name = 'datos') OR
        (table_name = 'publicaciones' AND column_name = 'repost_id') OR
        (table_name = 'transacciones' AND column_name = 'pago_creador')
    );

    RAISE NOTICE '--------------------------------------';
    RAISE NOTICE 'Migración v004 completada.';
    RAISE NOTICE 'Columnas verificadas: %/4', cols_added;
    RAISE NOTICE '--------------------------------------';
END $$;
