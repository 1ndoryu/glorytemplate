/*
 * Migración v008 — Soporte multimedia en mensajes
 * Agrega tipo de mensaje, URL de media y metadata,
 * para soportar imágenes, audio y samples compartidos.
 */

/* Tipo de mensaje: texto (default), imagen, audio, sample */
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'texto';

/* URL del archivo multimedia */
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS media_url TEXT;

/* Metadata adicional (dimensiones imagen, duración audio, sample_id, etc.) */
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS media_metadata JSONB;

/* Índice para buscar mensajes por tipo */
CREATE INDEX IF NOT EXISTS idx_mensajes_tipo ON mensajes(tipo);

/* Comentario: media_metadata puede contener:
 * - Para imagen: { "ancho": 800, "alto": 600, "formato": "jpg", "tamano": 102400 }
 * - Para audio: { "duracion": 15.5, "formato": "mp3", "tamano": 256000 }
 * - Para sample: { "sampleId": 42, "titulo": "Beat Name", "idCorto": "a3Kf9x2" }
 */
