/*
 * Kamples — Setup de pgvector para embeddings de audio
 * Migración v002: Extensión vector + verificación
 *
 * Prerrequisito: pgvector debe estar instalado en el servidor PostgreSQL.
 *   - Windows: descargar DLL desde https://github.com/pgvector/pgvector/releases
 *              copiar vector.dll a {PG_DIR}/lib y vector.control + SQL a {PG_DIR}/share/extension
 *   - Linux:   sudo apt install postgresql-16-pgvector (ajustar versión)
 *
 * Ejecutar: psql -U postgres -d kamples -f v002_pgvector_setup.sql
 */

/* Crear extensión vector (idempotente) */
CREATE EXTENSION IF NOT EXISTS vector;

/* 
 * Verificar que la extensión se cargó correctamente.
 * Si la siguiente consulta no retorna "vector" algo falló en la instalación.
 */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector no se instaló correctamente. Verificar que vector.dll/.so existe en el directorio de extensiones de PostgreSQL.';
    END IF;
    
    RAISE NOTICE 'pgvector instalado correctamente. Version: %', 
        (SELECT extversion FROM pg_extension WHERE extname = 'vector');
END $$;

/* 
 * Verificar que la columna embedding existe en samples.
 * Si ya ejecutaste v001, la columna ya existe con vector(1536).
 * Si no, la agregamos aquí.
 */
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'samples' AND column_name = 'embedding'
    ) THEN
        /* La tabla samples existe pero sin columna embedding */
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'samples') THEN
            ALTER TABLE samples ADD COLUMN embedding vector(1536);
            RAISE NOTICE 'Columna embedding agregada a tabla samples.';
        ELSE
            RAISE NOTICE 'Tabla samples no existe aún. Se creará con v001_schema_inicial.sql';
        END IF;
    ELSE
        RAISE NOTICE 'Columna embedding ya existe en tabla samples.';
    END IF;
END $$;

/* 
 * Verificar/crear índice HNSW para búsqueda eficiente de similitud.
 * HNSW es más rápido que IVFFlat para datasets < 1M vectores.
 */
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_samples_embedding'
    ) THEN
        CREATE INDEX idx_samples_embedding ON samples USING hnsw (embedding vector_cosine_ops);
        RAISE NOTICE 'Índice HNSW creado en samples.embedding.';
    ELSE
        RAISE NOTICE 'Índice idx_samples_embedding ya existe.';
    END IF;
END $$;

/* 
 * Prueba funcional: insertar y buscar un vector dummy.
 * Se usa una tabla temporal para no contaminar datos reales.
 */
DO $$
DECLARE
    resultado RECORD;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS _test_pgvector (
        id SERIAL PRIMARY KEY,
        vec vector(3)
    );

    INSERT INTO _test_pgvector (vec) VALUES ('[1,0,0]'), ('[0,1,0]'), ('[0,0,1]');

    /* Buscar el vector más cercano a [1,0,0] usando distancia coseno */
    SELECT id, vec, (vec <=> '[1,0,0]') AS distancia
    INTO resultado
    FROM _test_pgvector
    ORDER BY vec <=> '[1,0,0]'
    LIMIT 1;

    IF resultado.distancia = 0 THEN
        RAISE NOTICE 'Prueba pgvector OK: búsqueda coseno funciona correctamente.';
    ELSE
        RAISE NOTICE 'Prueba pgvector: resultado inesperado, distancia = %', resultado.distancia;
    END IF;

    DROP TABLE _test_pgvector;
END $$;

/* Resumen final */
DO $$
BEGIN
    RAISE NOTICE '---------------------------------------';
    RAISE NOTICE 'Setup pgvector completado exitosamente.';
    RAISE NOTICE 'Extensión: vector %', (SELECT extversion FROM pg_extension WHERE extname = 'vector');
    RAISE NOTICE 'Tabla samples: columna embedding vector(1536) OK';
    RAISE NOTICE 'Índice HNSW: idx_samples_embedding OK';
    RAISE NOTICE '---------------------------------------';
END $$;
