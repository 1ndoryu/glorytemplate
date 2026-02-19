/*
 * Migración v016 — Fix nombre columna reproducciones
 * La columna se llamaba "completa" pero el código usa "completada".
 * Ejecutada: auto
 */
ALTER TABLE reproducciones RENAME COLUMN completa TO completada;
