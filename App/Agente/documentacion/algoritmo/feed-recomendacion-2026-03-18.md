# Feed y recomendacion — actualizado 193A-33

## Diversidad (actualizado 193A-33)

Dos mecanismos de diversidad en la CTE `scored`:

1. **Por creador** (`PARTITION BY creador_id`): max 3 del mismo creador a score completo, luego -15% por cada extra (piso 0.3).
2. **Por género** (`PARTITION BY genero_diversidad`): max 4 del mismo género a score completo, luego -10% por cada extra (piso 0.5). El género se extrae de `metadata->'genero'` (primer elemento si array, string directo si no, 'other' si null).

Ambas penalizaciones se multiplican en el ORDER BY final: `score * penalty_creador * penalty_genero`.

## Serendipia (actualizado 193A-33)

Post-query: cada 5 samples (antes era cada 8) inyecta 1 sample de "descubrimiento" con distancia coseno 0.3–1.0 del perfil del usuario y engagement mínimo ≥5. Los samples inyectados llevan `_serendipia = true`.

## Debug score (193A-31)

Para admin con `kamples_debug_score=1` en localStorage: param `debug=1` en la API, activa `NormalizadorSample::$incluirDebugScore`, retorna `scoreDebug` con: total, serendipia, rn (creador), rnGenero (género), generoDiversidad, verificado, tieneEmbedding, horasPublicacion, boostReciente. BadgeDebugScore.tsx muestra tooltip con explicación humana.

Ver historial git para version anterior.
