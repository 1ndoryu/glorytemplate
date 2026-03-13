/* v046: Columna para almacenar ruta del audio completo descargado (no recortado).
 * Permite reutilizar el audio original para extender recortes sin re-descargar de YouTube.
 * QQ130-C
 */
ALTER TABLE cola_extraccion_samples
ADD COLUMN IF NOT EXISTS ruta_audio_completo TEXT;

COMMENT ON COLUMN cola_extraccion_samples.ruta_audio_completo IS
  'Ruta persistente al audio completo descargado de YouTube/SoundCloud (no recortado). Permite re-recortar sin re-descargar.';
