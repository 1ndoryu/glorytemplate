-- v030: Agregar spotify_id a canciones
-- Permite mostrar embed de Spotify cuando no hay YouTube disponible.

ALTER TABLE canciones
    ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(30) DEFAULT NULL;

COMMENT ON COLUMN canciones.spotify_id IS
    'Track ID de Spotify (ej: 7aheCJTgZydWp7D0BWgrpc). NULL si no disponible.';
