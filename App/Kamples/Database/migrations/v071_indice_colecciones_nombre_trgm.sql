/*
 * v071 — Índice pg_trgm en colecciones.nombre
 * [183A-93] La búsqueda rápida hacía ILIKE en colecciones sin índice trgm.
 * Con pocas colecciones era tolerable pero escalará mal.
 */

CREATE INDEX IF NOT EXISTS idx_colecciones_nombre_trgm
    ON colecciones USING GIN (nombre gin_trgm_ops);
