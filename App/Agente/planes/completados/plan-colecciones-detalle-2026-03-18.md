# Plan — Conteo y estabilidad del detalle de colección — 2026-03-18

## Tareas
- 183A-13: inconsistencia entre conteo de lista y conteo interno
- 183A-14: flash de “Esta colección aún no tiene samples”

## Hipótesis inicial
- El detalle está mezclando múltiples fuentes de verdad para total de items y estado vacío.
- Puede haber reseteos de UI antes de que llegue el fetch real o al cambiar orden/filtros.

## Fases
1. Auditar backend del detalle y payloads de conteo
2. Auditar hooks/islas del detalle de colección en React
3. Unificar fuente de verdad del total y del estado vacío
4. Validar en type-check y errores
5. Archivar, mover plan, commit y push
