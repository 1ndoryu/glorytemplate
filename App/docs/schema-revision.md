# Schema System - Revisión y Pendientes (v1.0)

> Fecha: 18-Feb-2026 | Agente: AG-SCH

## Correcciones Aplicadas en Esta Revisión

### CRITICO 1: SchemaRegistry::init() nunca se invocaba
- **Síntoma:** Fatal error `SchemaRegistry: tabla 'usuarios_ext' no tiene schema registrado` en TODOS los endpoints.
- **Causa:** `init()` carga los schemas desde `App/Config/Schema/` pero nadie lo llamaba. Los arrays `$tablas` y `$postTypes` siempre estaban vacíos.
- **Fix:** Se añadió `self::init()` lazy en todos los métodos públicos que acceden a datos: `tabla()`, `postType()`, `columnaExiste()`, `metaExiste()`, `exigirTabla()`, `exigirColumna()`. El guard `$inicializado` evita doble carga.
- **Archivo:** `Glory/src/Core/SchemaRegistry.php`

### CRITICO 2: ejecutar() e insertar() no validaban schemas
- **Síntoma:** INSERT/UPDATE/DELETE pasaban sin validación de SchemaRegistry en modo estricto.
- **Fix:** Se añadió `self::validarQueryContraSchema($sql)` al inicio de `ejecutar()` e `insertar()`.
- **Archivo:** `App/Kamples/Database/PostgresService.php`

### SERIO 3: Falsos positivos con CTEs (Common Table Expressions)
- **Síntoma:** Queries con `WITH scored AS (...)` causaban que `scored` se extrajera como nombre de tabla y lanzara SchemaException.
- **Fix:** El regex de `validarQueryContraSchema` ahora extrae CTEs definidos con `WITH ... AS (...)` y los excluye de la validación. También se ignoran aliases cortos (1-2 chars).
- **Archivo:** `App/Kamples/Database/PostgresService.php`

### SERIO 4: Columnas faltantes en schemas
- `UsuariosExtSchema`: faltaba `stripe_subscription_id` (usada en PagosController)
- `PublicacionesSchema`: faltaban `moderacion_razon` y `updated_at` (usadas en PublicacionesController)
- **Fix:** Columnas añadidas a los schemas. Archivos _generated regenerados con `npx glory schema:generate`.

---

## Pendientes Menores (Migración de accesos hardcoded restantes)

> **COMPLETADO en R56** — Todos los archivos listados aquí fueron migrados a Cols constants.

### Archivos migrados en R56 (previamente sin Cols imports)

| Archivo | Cols añadidos | Accesos migrados |
|---|---|---|
| `StripeService.php` | UsuariosExtCols | 5 (`stripe_connect_id` x2, `stripe_customer_id`, `email`, `nombre_visible`, `username`) |
| `ServicioBan.php` | UsuariosExtCols | 4 (`violaciones_moderacion`, `baneado_hasta` x2, `ban_razon`) |
| `GeneradorEmbeddings.php` | SamplesCols | 8 (`bpm` x2, `key`, `escala`, `tipo`, `duracion` x2, `es_premium`, `tags`, `id`) |
| `PlanificadorAlgoritmo.php` | AlgoritmoEstadoCols | 2 (`usuario_id` x2). Patrón dinámico `$estado[$columna.$sufijo]` preservado. |
| `DeduplicadorAudio.php` | SamplesCols | 7 (`ruta_original` x2, `duracion`, `creador_id` x2, `titulo` x2, `id`) |
| `ServicioAntiSpam.php` | ComentariosCols | 1 (`id`) |
| `ExperimentosController.php` | UsuariosExtCols, SamplesCols, ConversacionesCols | 5 (`id` x4, `id` conv x2) |

### Residuos corregidos en R56 (archivos que ya tenían algunas imports)

| Archivo | Cols añadidos | Accesos migrados |
|---|---|---|
| `ComentariosController.php` | ComentariosCols, LikesCols | 18 en `normalizarComentarios()` |
| `MensajesController.php` | ConversacionesCols, MensajesCols | 8 en `listarConversaciones()` |
| `ColeccionesController.php` | ColeccionSamplesCols | 1 (`sample_id`) |
| `DescargasController.php` | — (ya tenía ColeccionesCols) | 1 (`updated_at`) |

### SQL aliases preservados como strings (no requieren Cols)

- `otro_id` (alias en MensajesController), `total` (COUNT), `seg_inactivo`, `seg_desde_rapido`, `seg_desde_preciso` (EXTRACT), `peso` (literal en subquery), `primaria`, `secundaria` (CASE), `reaccion_usuario`.

### Prioridad BAJA - Observaciones (sin cambios)

- **`SELECT *`** — PlanificadorAlgoritmo usa `SELECT *`. Considerar migrar a SELECT explícito.
- **2 schemas sin uso activo** — `suscripciones` y `reportes_duplicados`.
- **Accesos WP** — `display_name` etc. no requieren Cols.
- **Retornos internos** — `$resultado['error']`, `$resultado['url']` etc. no son columnas DB.

---

## Lecciones Aprendidas

- [SchemaRegistry]: Métodos estáticos que dependen de datos cargados DEBEN tener lazy-init. Sin `self::init()`, la primera llamada falla catastróficamente.
- [PostgresService]: La validación de tablas debe cubrir TODOS los métodos que ejecutan SQL, no solo SELECT.
- [CTEs/SQL]: El regex de extracción de tablas necesita excluir nombres definidos como CTEs (`WITH nombre AS`). 
- [Schema completud]: Validar que TODAS las columnas usadas en queries SQL estén documentadas en el Schema correspondiente. Una columna que existe en la BD pero no en el Schema rompe el contrato de "fuente única de verdad".
- [Generación]: Después de modificar cualquier Schema, ejecutar `npx glory schema:generate` para regenerar constantes.
- [SQL aliases]: Columnas aliasadas (CASE WHEN, EXTRACT, COUNT, AS) no se migran a Cols. Son resultados calculados, no columnas de tabla. Preservar como strings.
- [Patrones dinámicos]: Código que construye keys en runtime (`$estado[$columna . $sufijo]`) no se puede migrar a Cols. Dejar documentado como excepción consciente.
- [JOINs mixtos]: Cuando una query hace JOIN de varias tablas, las columnas del resultado mezclan schemas. Usar el Cols de cada tabla según la columna (ej: `$fila[ComentariosCols::ID]` + `$fila[UsuariosExtCols::USERNAME]`).
