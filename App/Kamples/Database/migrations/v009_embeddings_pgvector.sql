/*
 * Migración v009 — Columna de embeddings para similitud con pgvector.
 *
 * Agrega vector(128) a samples para similitud por metadata.
 * 128 dimensiones compuestas de: BPM(1) + key(12) + escala(2) + tipo(5)
 * + duración(1) + premium(1) + tags hasheados(106).
 *
 * Incluye índice HNSW para búsqueda por coseno eficiente.
 * Requiere: CREATE EXTENSION vector (ya instalada).
 *
 * Idempotente: puede ejecutarse múltiples veces sin error.
 */

/* Verificar que pgvector existe */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE EXTENSION vector;
    END IF;
END $$;

/* Agregar columna embedding a samples si no existe */
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'samples' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE samples ADD COLUMN embedding vector(128);
        RAISE NOTICE 'Columna embedding vector(128) agregada a samples';
    END IF;
END $$;

/* Crear índice HNSW para búsqueda por coseno */
CREATE INDEX IF NOT EXISTS idx_samples_embedding
    ON samples USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

/* Función SQL para buscar samples similares por embedding */
CREATE OR REPLACE FUNCTION buscar_similares(
    p_sample_id INTEGER,
    p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    distancia FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, (s.embedding <=> ref.embedding)::FLOAT as distancia
    FROM samples s
    CROSS JOIN (SELECT embedding FROM samples WHERE samples.id = p_sample_id) ref
    WHERE s.id != p_sample_id
      AND s.estado = 'activo'
      AND s.embedding IS NOT NULL
      AND ref.embedding IS NOT NULL
    ORDER BY s.embedding <=> ref.embedding
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql STABLE;

/* Función SQL para buscar por vector directo (perfil de usuario) */
CREATE OR REPLACE FUNCTION buscar_por_vector(
    p_vector vector(128),
    p_limite INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    distancia FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, (s.embedding <=> p_vector)::FLOAT as distancia
    FROM samples s
    WHERE s.estado = 'activo'
      AND s.embedding IS NOT NULL
    ORDER BY s.embedding <=> p_vector
    LIMIT p_limite OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

/* Test rápido de la extensión vector */
DO $$
DECLARE
    v1 vector(3) := '[1,0,0]';
    v2 vector(3) := '[0,1,0]';
    dist float;
BEGIN
    dist := (v1 <=> v2)::float;
    RAISE NOTICE 'pgvector OK — distancia coseno [1,0,0]<->[0,1,0] = %', dist;
END $$;
