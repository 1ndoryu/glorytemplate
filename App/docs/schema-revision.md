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

### Prioridad ALTA - Archivos sin Cols imports que deberían tenerlos

| Archivo | Cols necesarios | Accesos hardcoded estimados |
|---|---|---|
| `App/Kamples/Services/StripeService.php` | UsuariosExtCols | ~4 (`stripe_customer_id`, `email`, `nombre_visible`, `username`) |
| `App/Kamples/Services/ServicioBan.php` | UsuariosExtCols | ~3 (`violaciones_moderacion`, `baneado_hasta`, `ban_razon`) |
| `App/Kamples/Services/GeneradorEmbeddings.php` | SamplesCols, LikesCols, DescargasCols, ReproduccionesCols | ~5+ |
| `App/Kamples/Services/PlanificadorAlgoritmo.php` | AlgoritmoEstadoCols | Usa `SELECT *`, acceso implícito |
| `App/Kamples/Services/DeduplicadorAudio.php` | SamplesCols | ~3 |
| `App/Kamples/Services/ServicioAntiSpam.php` | ComentariosCols | ~2 |
| `App/Kamples/Api/Controladores/ExperimentosController.php` | UsuariosExtCols, NotificacionesCols, ConversacionesCols, MensajesCols | ~5 |

### Prioridad MEDIA - Archivos CON Cols pero con residuos hardcoded

| Archivo | Residuos |
|---|---|
| `ComentariosController.php` (L724-751) | ~15 accesos hardcoded en función de formateo, pese a tener ComentariosCols importado |
| `MensajesController.php` (L89-100) | ~6 accesos hardcoded a colums de conversaciones/usuarios |
| `ColeccionesController.php` (L502) | `$r['sample_id']` |
| `SamplesController.php` (L962) | `$r['sample_id']`, `$row['primaria']`, `$row['secundaria']`, `$row['total']` |
| `DescargasController.php` (L499) | `$coleccion['updated_at']` |
| `SocialController.php` (L79) | `$row['id']` |

### Prioridad BAJA - Observaciones

- **`SELECT *` en varios lugares** — PlanificadorAlgoritmo, algunos helpers usan `SELECT *` que hace imposible rastrear qué columnas se acceden. Considerar migrar a `SELECT` explícito con Cols.
- **2 schemas sin uso activo** — `suscripciones` y `reportes_duplicados` tienen schemas pero no se referencian en queries SQL activas. Pueden ser para uso futuro.
- **Accesos a datos WP** — `$datos['display_name']` en PerfilController viene de WordPress, no de PostgreSQL. No requiere Cols.
- **Accesos a retornos internos** — `$resultado['error']`, `$resultado['url']` (Stripe), `$resultado['rapido']` (Embeddings) son retornos de funciones, no columnas. No requieren Cols.

---

## Lecciones Aprendidas

- [SchemaRegistry]: Métodos estáticos que dependen de datos cargados DEBEN tener lazy-init. Sin `self::init()`, la primera llamada falla catastróficamente.
- [PostgresService]: La validación de tablas debe cubrir TODOS los métodos que ejecutan SQL, no solo SELECT.
- [CTEs/SQL]: El regex de extracción de tablas necesita excluir nombres definidos como CTEs (`WITH nombre AS`). 
- [Schema completud]: Validar que TODAS las columnas usadas en queries SQL estén documentadas en el Schema correspondiente. Una columna que existe en la BD pero no en el Schema rompe el contrato de "fuente única de verdad".
- [Generación]: Después de modificar cualquier Schema, ejecutar `npx glory schema:generate` para regenerar constantes.
