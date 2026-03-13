/*
 * v049: Asignar prioridades a artistas seleccionados por el usuario.
 *
 * QK8: El scraper/extractor prioriza artistas con prioridad > 0.
 * pipeline.py ordena la cola por prioridad de artista (mayor primero).
 * artist.py spider con priority_mode procesa artistas prioritarios primero.
 *
 * Escala de prioridad: 0 (normal), 70-100 (alta).
 */

UPDATE artistas_musicales SET prioridad = 100 WHERE nombre = 'DJ Smokey';
UPDATE artistas_musicales SET prioridad = 98  WHERE nombre = 'Soudiere';
UPDATE artistas_musicales SET prioridad = 96  WHERE nombre = 'Juicy J';
UPDATE artistas_musicales SET prioridad = 94  WHERE nombre = 'Three 6 Mafia';
UPDATE artistas_musicales SET prioridad = 92  WHERE nombre = 'Project Pat';
UPDATE artistas_musicales SET prioridad = 90  WHERE nombre = 'Tyler, The Creator';
UPDATE artistas_musicales SET prioridad = 88  WHERE nombre = 'Freddie Dredd';
UPDATE artistas_musicales SET prioridad = 86  WHERE nombre = 'Kanye West';
UPDATE artistas_musicales SET prioridad = 84  WHERE nombre = 'Daft Punk';
