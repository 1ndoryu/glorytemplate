/*
 * v070 — Expandir tags_enriquecidos con artista_vibes y tags IA.
 * [193A-35] La búsqueda no encontraba "Tommy Wright III" porque artista_vibes
 * y metadata.tags no estaban incluidos en tags_enriquecidos.
 * El trigger fn_recalcular_tags_enriquecidos ahora incluye ambos campos.
 */

/* Actualizar función trigger para incluir artista_vibes y metadata.tags */
CREATE OR REPLACE FUNCTION fn_recalcular_tags_enriquecidos()
RETURNS TRIGGER AS $$
DECLARE
    resultado text[];
    elem text;
BEGIN
    resultado := ARRAY[]::text[];

    /* Tags base (array columna) */
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

    /* [193A-35] artista_vibes desde metadata (array de nombres de artistas similares) */
    IF NEW.metadata IS NOT NULL AND NEW.metadata->'artista_vibes' IS NOT NULL
       AND jsonb_typeof(NEW.metadata->'artista_vibes') = 'array' THEN
        FOR elem IN SELECT jsonb_array_elements_text(NEW.metadata->'artista_vibes') LOOP
            IF elem IS NOT NULL AND elem != '' THEN
                resultado := array_append(resultado, LOWER(elem));
            END IF;
        END LOOP;
    END IF;

    /* [193A-35] tags desde metadata IA (array de tags generados por IA, distinto del array base) */
    IF NEW.metadata IS NOT NULL AND NEW.metadata->'tags' IS NOT NULL
       AND jsonb_typeof(NEW.metadata->'tags') = 'array' THEN
        FOR elem IN SELECT jsonb_array_elements_text(NEW.metadata->'tags') LOOP
            IF elem IS NOT NULL AND elem != '' THEN
                resultado := array_append(resultado, LOWER(elem));
            END IF;
        END LOOP;
    END IF;

    NEW.tags_enriquecidos := resultado;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* Backfill: incluir artista_vibes y metadata.tags para samples existentes.
 * Recalcula todo para simplicidad (el trigger se encarga del futuro). */
UPDATE samples SET tags = tags
WHERE metadata IS NOT NULL
  AND (metadata->'artista_vibes' IS NOT NULL OR metadata->'tags' IS NOT NULL);
