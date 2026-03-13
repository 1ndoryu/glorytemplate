/*
 * v048: Corregir dimension del vector embedding de 1536 a 128.
 *
 * v001 creo embedding vector(1536) pensando en OpenAI ada-002,
 * pero GeneradorEmbeddings.php genera vectores locales de 128 dimensiones
 * (BPM + key + escala + tipo + duracion + premium + tags hasheados).
 *
 * El error en produccion: "expected 1536 dimensions, not 128"
 * impide guardar embeddings y afecta busqueda por similitud.
 *
 * Requiere: reconstruir el indice HNSW despues del ALTER.
 */

/* Eliminar indice HNSW existente (no soporta ALTER in-place) */
DROP INDEX IF EXISTS idx_samples_embedding;

/* Cambiar dimension del vector */
ALTER TABLE samples
    ALTER COLUMN embedding TYPE vector(128)
    USING NULL;

/* Recrear indice HNSW con la dimension correcta */
CREATE INDEX idx_samples_embedding
    ON samples USING hnsw (embedding vector_cosine_ops);
