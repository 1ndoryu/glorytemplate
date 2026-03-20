# Plan combinar colecciones — 2026-03-20

## Tarea
- 193A-79 — Revisar a fondo por qué combinar colecciones no está funcionando

## Hipótesis principal
- La transacción de combinación no resuelve colisiones entre subcolecciones hijas del origen y del destino. Con volúmenes y jerarquía de 2 niveles esto deja de ser un caso raro y puede hacer rollback completo, dejando ambas colecciones intactas.

## Señales verificadas
- El merge raíz ya tuvo un fix previo por conflicto de nombre entre origen y destino.
- La lógica actual mueve `parent_id` de todas las hijas del origen al destino sin comprobar si bajo el destino ya existe una hija homónima.
- Los logs generales no mostraron aún evidencia suficiente del POST fallido, así que la revisión se centró en el contrato transaccional y en dejar mejor trazabilidad documental del comportamiento.

## Fases
1. Repositorio
- Resolver colisiones de hijas por nombre durante `combinarEnTransaccion`.
- Guardar backup suficiente para que `deshacerCombinacionEnTransaccion` pueda restaurar también las hijas que se fusionen con una hija existente del destino.

2. Observabilidad
- Revisar logs remotos y confirmar si había rastro del endpoint o de conflictos SQL/PHP.

3. Validación
- PHP lint y diagnostics del repositorio.
- `npm run type-check`.
- Deploy por Coolify y health check del sitio.

## Riesgos
- Un fix parcial que solo renombre hijas evita la excepción pero degrada la semántica del merge y complica el undo.
- Si el backup no guarda a qué hija destino se fusionó cada hija del origen, el deshacer de 7 días queda corrupto.

## Cierre
- Implementado el merge de hijas homónimas y la restauración asociada en undo.
- Verificado con lint PHP, diagnostics, `npm run type-check`, deploy y health check.
- No hubo reproducción autenticada end-to-end desde esta sesión por limitaciones del tooling remoto, así que el cierre queda documentado con esa salvedad.