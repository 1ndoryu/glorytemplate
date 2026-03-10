/*
 * Migración v029: Escalabilidad Relacional (S-ESCALA)
 *
 * S-E.1: Triggers para contadores total_sampleada / total_samplea en canciones
 * S-E.2: (cambio en pipeline Python, no SQL)
 * S-E.3: Índices compuestos para queries bidireccionales filtradas
 * S-E.4: Columnas re-scraping en scraping_log
 *
 * Ejecutar: psql -U postgres -d kamples -f v029_escalabilidad_relacional.sql
 */

BEGIN;

/* S-E.1: Trigger function para actualizar contadores de relaciones en canciones.
 * Incrementa/decrementa total_sampleada y total_samplea al INSERT/DELETE
 * en relaciones_sample. Solo cuenta tipo_relacion = 'sample'.
 *
 * total_samplea = cuántas relaciones tiene como DESTINO (usa samples de otras)
 * total_sampleada = cuántas relaciones tiene como FUENTE (es sampleada por otras)
 */

CREATE OR REPLACE FUNCTION trg_actualizar_contadores_relacion()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.tipo_relacion = 'sample' THEN
            UPDATE canciones SET total_samplea = total_samplea + 1
            WHERE id = NEW.cancion_destino_id;

            UPDATE canciones SET total_sampleada = total_sampleada + 1
            WHERE id = NEW.cancion_fuente_id;
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.tipo_relacion = 'sample' THEN
            UPDATE canciones SET total_samplea = GREATEST(total_samplea - 1, 0)
            WHERE id = OLD.cancion_destino_id;

            UPDATE canciones SET total_sampleada = GREATEST(total_sampleada - 1, 0)
            WHERE id = OLD.cancion_fuente_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_relaciones_contadores ON relaciones_sample;
CREATE TRIGGER trg_relaciones_contadores
    AFTER INSERT OR DELETE ON relaciones_sample
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_contadores_relacion();

/* S-E.1: Batch update — recalcular contadores existentes desde cero.
 * Solo tipo_relacion = 'sample' se cuenta (covers/remixes son categoría aparte).
 */
UPDATE canciones c SET
    total_sampleada = COALESCE(sub.cnt, 0)
FROM (
    SELECT cancion_fuente_id AS cid, COUNT(*) AS cnt
    FROM relaciones_sample
    WHERE tipo_relacion = 'sample'
    GROUP BY cancion_fuente_id
) sub
WHERE c.id = sub.cid;

UPDATE canciones c SET
    total_samplea = COALESCE(sub.cnt, 0)
FROM (
    SELECT cancion_destino_id AS cid, COUNT(*) AS cnt
    FROM relaciones_sample
    WHERE tipo_relacion = 'sample'
    GROUP BY cancion_destino_id
) sub
WHERE c.id = sub.cid;


/* S-E.3: Índices compuestos para queries bidireccionales con filtro por tipo.
 * Reemplazan scans secuenciales cuando se filtra tipo_relacion en queries de detalle.
 */
CREATE INDEX IF NOT EXISTS idx_rel_destino_tipo
    ON relaciones_sample (cancion_destino_id, tipo_relacion);

CREATE INDEX IF NOT EXISTS idx_rel_fuente_tipo
    ON relaciones_sample (cancion_fuente_id, tipo_relacion);

CREATE INDEX IF NOT EXISTS idx_rel_verificada_reciente
    ON relaciones_sample (verificada, created_at DESC)
    WHERE verificada = TRUE;


/* S-E.4: Columnas de re-scraping en scraping_log.
 * re_scrapeable: marca URLs que deben revisitarse periódicamente.
 * proximo_rescrape: timestamp del próximo rescrape planificado.
 * veces_rescrapeado: contador para limitar rescrapes y detectar abuse.
 */
ALTER TABLE scraping_log
    ADD COLUMN IF NOT EXISTS re_scrapeable BOOLEAN DEFAULT FALSE;

ALTER TABLE scraping_log
    ADD COLUMN IF NOT EXISTS proximo_rescrape TIMESTAMPTZ;

ALTER TABLE scraping_log
    ADD COLUMN IF NOT EXISTS veces_rescrapeado SMALLINT DEFAULT 0;

/* Índice para encontrar URLs que necesitan rescrape */
CREATE INDEX IF NOT EXISTS idx_scraping_rescrape
    ON scraping_log (proximo_rescrape)
    WHERE re_scrapeable = TRUE AND proximo_rescrape IS NOT NULL;

/* Marcar las páginas de track como re-scrapeables (son las que evolucionan).
 * Las hot_samples/detail no necesitan rescrape — siempre generan URLs nuevas.
 * Primer rescrape en 30 días desde ahora.
 */
UPDATE scraping_log SET
    re_scrapeable = TRUE,
    proximo_rescrape = NOW() + INTERVAL '30 days'
WHERE tipo_pagina IN ('track', 'track_samples', 'track_sampled', 'artist')
  AND estado = 'procesado';

COMMIT;
