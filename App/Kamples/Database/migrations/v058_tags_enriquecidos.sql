/*
 * v058 — Columna materializada tags_enriquecidos + trigger + indice GIN.
 * QL50 BN-2: Elimina el recalculo dinamico de tags enriquecidos en cada query del feed.
 *
 * tags_enriquecidos = tags + metadata.genero + metadata.instrumentos + metadata.emocion
 * Todos normalizados a LOWER(). La columna se actualiza automaticamente via trigger
 * cuando cambian tags o metadata. Indice GIN habilita busquedas por tag en O(log N).
 */

/* Columna con DEFAULT para backfill progresivo */
ALTER TABLE samples ADD COLUMN IF NOT EXISTS tags_enriquecidos text[] DEFAULT ARRAY[]::text[];

/* Funcion que recalcula tags_enriquecidos a partir de tags + metadata */
CREATE OR REPLACE FUNCTION fn_recalcular_tags_enriquecidos()
RETURNS TRIGGER AS $$
DECLARE
    resultado text[];
    elem text;
BEGIN
    resultado := ARRAY[]::text[];

    /* Tags base */
    IF NEW.tags IS NOT NULL THEN
        FOREACH elem IN ARRAY NEW.tags LOOP
            IF elem IS NOT NULL AND elem != '' THEN
                resultado := array_append(resultado, LOWER(elem));
            END IF;
        END LOOP;
    END IF;

    /* Genero desde metadata */
    IF NEW.metadata IS NOT NULL AND NEW.metadata->>'genero' IS NOT NULL THEN
        IF jsonb_typeof(NEW.metadata->'genero') = 'array' THEN
            FOR elem IN SELECT jsonb_array_elements_text(NEW.metadata->'genero') LOOP
                IF elem IS NOT NULL AND elem != '' THEN
                    resultado := array_append(resultado, LOWER(elem));
                END IF;
            END LOOP;
        ELSIF NEW.metadata->>'genero' != '' THEN
            resultado := array_append(resultado, LOWER(NEW.metadata->>'genero'));
        END IF;
    END IF;

    /* Instrumentos desde metadata */
    IF NEW.metadata IS NOT NULL AND NEW.metadata->>'instrumentos' IS NOT NULL THEN
        IF jsonb_typeof(NEW.metadata->'instrumentos') = 'array' THEN
            FOR elem IN SELECT jsonb_array_elements_text(NEW.metadata->'instrumentos') LOOP
                IF elem IS NOT NULL AND elem != '' THEN
                    resultado := array_append(resultado, LOWER(elem));
                END IF;
            END LOOP;
        ELSIF NEW.metadata->>'instrumentos' != '' THEN
            resultado := array_append(resultado, LOWER(NEW.metadata->>'instrumentos'));
        END IF;
    END IF;

    /* Emocion desde metadata */
    IF NEW.metadata IS NOT NULL AND NEW.metadata->>'emocion' IS NOT NULL THEN
        IF jsonb_typeof(NEW.metadata->'emocion') = 'array' THEN
            FOR elem IN SELECT jsonb_array_elements_text(NEW.metadata->'emocion') LOOP
                IF elem IS NOT NULL AND elem != '' THEN
                    resultado := array_append(resultado, LOWER(elem));
                END IF;
            END LOOP;
        ELSIF NEW.metadata->>'emocion' != '' THEN
            resultado := array_append(resultado, LOWER(NEW.metadata->>'emocion'));
        END IF;
    END IF;

    NEW.tags_enriquecidos := resultado;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* Trigger: recalcula en INSERT o UPDATE de tags/metadata */
DROP TRIGGER IF EXISTS trg_tags_enriquecidos ON samples;
CREATE TRIGGER trg_tags_enriquecidos
    BEFORE INSERT OR UPDATE OF tags, metadata ON samples
    FOR EACH ROW EXECUTE FUNCTION fn_recalcular_tags_enriquecidos();

/* Backfill: recalcular para todos los samples existentes */
UPDATE samples SET tags_enriquecidos = (
    SELECT COALESCE(ARRAY_AGG(LOWER(t)), ARRAY[]::text[])
    FROM UNNEST(
        COALESCE(tags, ARRAY[]::text[])
        || COALESCE(
            CASE
                WHEN metadata IS NOT NULL AND jsonb_typeof(metadata->'genero') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(metadata->'genero'))
                WHEN metadata IS NOT NULL AND metadata->>'genero' IS NOT NULL AND metadata->>'genero' != ''
                THEN ARRAY[metadata->>'genero']
                ELSE ARRAY[]::text[]
            END, ARRAY[]::text[]
        )
        || COALESCE(
            CASE
                WHEN metadata IS NOT NULL AND jsonb_typeof(metadata->'instrumentos') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(metadata->'instrumentos'))
                WHEN metadata IS NOT NULL AND metadata->>'instrumentos' IS NOT NULL AND metadata->>'instrumentos' != ''
                THEN ARRAY[metadata->>'instrumentos']
                ELSE ARRAY[]::text[]
            END, ARRAY[]::text[]
        )
        || COALESCE(
            CASE
                WHEN metadata IS NOT NULL AND jsonb_typeof(metadata->'emocion') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(metadata->'emocion'))
                WHEN metadata IS NOT NULL AND metadata->>'emocion' IS NOT NULL AND metadata->>'emocion' != ''
                THEN ARRAY[metadata->>'emocion']
                ELSE ARRAY[]::text[]
            END, ARRAY[]::text[]
        )
    ) AS t WHERE t IS NOT NULL AND t != ''
);

/* Indice GIN para busquedas por tag O(log N) via array containment (@>) */
CREATE INDEX IF NOT EXISTS idx_samples_tags_enriquecidos ON samples USING GIN(tags_enriquecidos);
