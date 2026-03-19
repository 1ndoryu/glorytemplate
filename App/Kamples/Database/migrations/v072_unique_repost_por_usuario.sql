/* [183A-98] Constraint UNIQUE para evitar reposts duplicados del mismo usuario.
 * Partial index: solo aplica cuando repost_id IS NOT NULL (filas de repost).
 * ON CONFLICT ... DO NOTHING en el INSERT garantiza atomicidad. */

CREATE UNIQUE INDEX IF NOT EXISTS uk_publicaciones_repost_usuario
ON publicaciones (autor_id, repost_id)
WHERE repost_id IS NOT NULL;
