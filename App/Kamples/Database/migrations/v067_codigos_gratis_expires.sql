/* [183A-110] Expiración (1 año) y nombre_item en codigos_descarga_gratis.
 * - expires_at: timestamp de expiración. NULL inicial → backfill → NOT NULL + DEFAULT.
 * - nombre_item: nombre del sample/colección guardado al crear el código.
 *   Permite mostrar el modal de compensación aunque el item sea eliminado.
 * codigos_gratis_usos: columna expirado=TRUE cuando el uso se registró como compensación
 *   (codigo ya vencido). Previene dar 50 créditos múltiples veces al mismo usuario. */

ALTER TABLE codigos_descarga_gratis
    ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS nombre_item VARCHAR(255) NOT NULL DEFAULT '';

/* Backfill: codigos existentes expiran 1 año desde su creacion */
UPDATE codigos_descarga_gratis
   SET expires_at = creado_at + INTERVAL '1 year'
 WHERE expires_at IS NULL;

/* Ahora que no hay NULLs, convertir a NOT NULL con default dinamico */
ALTER TABLE codigos_descarga_gratis
    ALTER COLUMN expires_at SET NOT NULL,
    ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '1 year';

CREATE INDEX IF NOT EXISTS idx_codigos_gratis_expires_activo
    ON codigos_descarga_gratis(expires_at) WHERE activo = TRUE;

/* codigos_gratis_usos: flag para compensaciones por expiración */
ALTER TABLE codigos_gratis_usos
    ADD COLUMN IF NOT EXISTS expirado BOOLEAN NOT NULL DEFAULT FALSE;
