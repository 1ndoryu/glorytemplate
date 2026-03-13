/*
 * v047: Prioridad de artistas para extraccion y scraping.
 * Agrega columna prioridad a artistas_musicales (mayor = mas urgente).
 * Siembra prioridad inicial para artistas destacados por el usuario.
 */

ALTER TABLE artistas_musicales
    ADD COLUMN IF NOT EXISTS prioridad SMALLINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_artistas_prioridad
    ON artistas_musicales (prioridad DESC)
    WHERE prioridad > 0;

/* Asignar prioridad a artistas indicados (si ya existen en la BD) */
UPDATE artistas_musicales
SET prioridad = CASE whosampled_slug
    WHEN 'DJ-Smokey'            THEN 100
    WHEN 'Soudiere'             THEN 95
    WHEN 'Juicy-J'              THEN 90
    WHEN 'Three-6-Mafia'        THEN 90
    WHEN 'Project-Pat'          THEN 85
    WHEN 'Tyler,-The-Creator'   THEN 80
    WHEN 'Freddie-Dredd'        THEN 80
    WHEN 'Kanye-West'           THEN 75
    WHEN 'Daft-Punk'            THEN 70
    ELSE prioridad
END
WHERE whosampled_slug IN (
    'DJ-Smokey', 'Soudiere', 'Juicy-J', 'Three-6-Mafia', 'Project-Pat',
    'Tyler,-The-Creator', 'Freddie-Dredd', 'Kanye-West', 'Daft-Punk'
);
