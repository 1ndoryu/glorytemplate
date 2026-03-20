# Plan combinar colecciones — 2026-03-20

## Tarea
- 193A-79 — Revisar a fondo por qué combinar colecciones no está funcionando

## Hipótesis principal
- La transacción de combinación no resuelve colisiones entre subcolecciones hijas del origen y del destino. Con volúmenes y jerarquía de 2 niveles esto deja de ser un caso raro y puede hacer rollback completo, dejando ambas colecciones intactas.

## Señales verificadas
- El merge raíz ya tuvo un fix previo por conflicto de nombre entre origen y destino.
- La lógica actual mueve `parent_id` de todas las hijas del origen al destino sin comprobar si bajo el destino ya existe una hija homónima.
- Los logs generales no mostraron aún evidencia suficiente del POST fallido, así que la revisión debe centrarse en el contrato transaccional y en dejar mejor trazabilidad.

## Fases
1. Repositorio
- Resolver colisiones de hijas por nombre durante `combinarEnTransaccion`.
- Guardar backup suficiente para que `deshacerCombinacionEnTransaccion` pueda restaurar también las hijas que se fusionen con una hija existente del destino.

2. Observabilidad
- Mejorar logging o códigos de error si la combinación falla por constraint o conflicto estructural.

3. Validación
- PHP lint y diagnostics del repositorio/controlador.
- `npm run type-check` aunque el cambio sea backend, para asegurar que no se arrastró ninguna rotura colateral.

## Riesgos
- Un fix parcial que solo renombre hijas evita la excepción pero degrada la semántica del merge y complica el undo.
- Si el backup no guarda a qué hija destino se fusionó cada hija del origen, el deshacer de 7 días quedará corrupto.