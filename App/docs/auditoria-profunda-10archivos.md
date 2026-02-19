# Auditoría Profunda — 10 Archivos PHP Críticos

> **Fecha:** 2026-02-19  
> **Agente:** AG-AUD  
> **Alcance:** Deep audit línea por línea de 10 archivos específicos  
> **Complementa:** `auditoria-seguridad-php.md` (AG-SEC) y `auditoria-sql.md` (AG-SQL)

---

## Resumen Ejecutivo

| Severidad | Hallazgos | Archivos afectados |
|-----------|-----------|-------------------|
| **P0** — Seguridad/Inyección | 4 | DeduplicadorAudio, TransaccionesRepo, ReproduccionesRepo, ComentariosRepo |
| **P1** — Fallos silenciosos / Missing try-catch | 11 | Todos excepto ServicioNotificaciones |
| **P2** — Optimización | 12 | DashboardController, repos, PostgresService, StripeService |
| **P3** — Calidad / Consistencia | 12 | Todos |
| **Total** | **39** | |

> **Nota:** Los hallazgos P0-1, P0-2, P0-3 de la auditoría AG-SEC se confirman y expanden aquí con más detalle. Las referencias `[AG-SEC P0-X]` indican hallazgos ya reportados.

---

## Archivo 1: DeduplicadorAudio.php

**Ruta:** `Services/DeduplicadorAudio.php` (207 líneas)

### DA-01. P0: Command Injection — exec() sin escapeshellarg() [confirma AG-SEC P0-1]

**Líneas:** 138-141, 152-156, 169  
**3 llamadas afectadas:**

```php
// L138-141 — Primera extracción
$cmd = sprintf(
    '"%s" -y -i "%s" -t %d -ar %d -ac 1 -f s16le "%s" 2>&1',
    $ffmpeg, $rutaArchivo, $seg, $sr, $tempInicio
);
exec($cmd, $output, $exitCode);

// L152-156 — Segunda extracción (segmento final)
$cmd = sprintf(
    '"%s" -y -i "%s" -ss %.2f -t %d -ar %d -ac 1 -f s16le "%s" 2>&1',
    $ffmpeg, $rutaArchivo, $offset, $seg, $sr, $tempFinal
);
exec($cmd);

// L191 — Búsqueda de FFmpeg
exec($cmd, $output, $exitCode);
```

**`$rutaArchivo` viene de BD** (`SamplesCols::RUTA_ORIGINAL`). Si un nombre de archivo contiene `"$(rm -rf /)"` o `"; malicious_command"`, se ejecuta como shell command.

**Fix:**
```php
$cmd = sprintf(
    '%s -y -i %s -t %d -ar %d -ac 1 -f s16le %s 2>&1',
    escapeshellarg($ffmpeg),
    escapeshellarg($rutaArchivo),
    $seg, $sr,
    escapeshellarg($tempInicio)
);
```

---

### DA-02. P1: exec() sin captura de exit code (segundo segmento)

**Línea:** 156  
```php
exec($cmd);  // SIN $output ni $exitCode
if (file_exists($tempFinal)) {
    $pcmFinal = file_get_contents($tempFinal);
```

**Problema:** Si FFmpeg falla parcialmente, puede crear un archivo vacío o corrupto. Se hashearía datos basura, generando falsos positivos/negativos de duplicados.

**Fix:**
```php
exec($cmd, $output2, $exitCode2);
if ($exitCode2 === 0 && file_exists($tempFinal)) {
```

---

### DA-03. P1: calcularYVerificar() sin try-catch global

**Líneas:** 56-120  
**Problema:** Es un callback de `wp_schedule_single_event`. Aunque PostgresService captura PDOException internamente, `ServicioNotificaciones::crear()` (L100) y `file_exists()` / `file_get_contents()` pueden lanzar excepciones no capturadas (ej: permisos de disco). Un crash en cron silenciosamente aborta sin log.

**Fix:**
```php
public static function calcularYVerificar(int $sampleId): void
{
    try {
        // ...cuerpo actual...
    } catch (\Throwable $e) {
        KamplesLogger::error('DeduplicadorAudio: error en cálculo', [
            'sampleId' => $sampleId,
            'error' => $e->getMessage(),
        ]);
    }
}
```

---

### DA-04. P1: temp file leak en error path

**Líneas:** 147-162  
```php
$tempInicio = tempnam(sys_get_temp_dir(), 'kmp_hash_ini_');
// ... exec() ...
$pcmInicio = file_get_contents($tempInicio);
@unlink($tempInicio);

// Luego:
$tempFinal = tempnam(sys_get_temp_dir(), 'kmp_hash_fin_');
// exec() puede fallar → $tempFinal queda en disco
```

**Problema:** Si ocurre una excepción entre `tempnam()` y `@unlink()`, los archivos temporales se acumulan en `/tmp`. Con procesos cron frecuentes, esto llena el disco.

**Fix:** Usar `try/finally` para garantizar cleanup:
```php
$tempInicio = tempnam(sys_get_temp_dir(), 'kmp_hash_ini_');
try {
    // ...proceso...
} finally {
    @unlink($tempInicio);
    if (isset($tempFinal)) @unlink($tempFinal);
}
```

---

### DA-05. P3: Usa $_ENV directamente en vez de FFmpegDetector

**Línea:** 192  
```php
$envPath = $_ENV['FFMPEG_PATH'] ?? getenv('FFMPEG_PATH') ?: null;
```

**Contraste:** `FFmpegDetector::obtenerFFmpeg()` ya existe con lógica robusta (is_executable, multi-path, Windows+Linux). Este archivo duplica la lógica de forma más frágil.

**Fix:** Reemplazar `buscarFFmpeg()` con `FFmpegDetector::obtenerFFmpeg()`.

---

### DA-06. P3: unpack('v*') interpreta como unsigned pero datos son signed

**Línea:** 177-180  
```php
$samples = unpack('v*', $pcmData);
// ...
if ($sample > 32767) $sample -= 65536; // Conversión manual
```

**Problema de calidad:** El format `v` es unsigned 16-bit little-endian. Para s16le debería usarse una conversión más explícita. El código funciona pero es confuso.

**Fix ideal:** Documentar con comentario o usar array_map con int16 conversion helper.

---

## Archivo 2: TransaccionesRepository.php

**Ruta:** `Database/Repositories/TransaccionesRepository.php` (180 líneas)

### TR-01. P0: INTERVAL interpolation sin whitelist [confirma AG-SEC P0-2]

**Línea:** 174  
```php
. " AND " . TransaccionesCols::CREATED_AT . " >= NOW() - INTERVAL '{$intervalo}'"
```

**Caller actual:** `DashboardController::ingresos()` con `match()` whitelist. **Pero el método acepta cualquier string.**

**Fix:** Whitelist dentro del repo:
```php
$validos = ['7 days', '30 days', '90 days', '365 days'];
if (!in_array($intervalo, $validos, true)) {
    $intervalo = '30 days';
}
```

---

### TR-02. P1: registrarRevenueShare() — fallo silencioso sin retorno

**Líneas:** 64-92  
```php
public static function registrarRevenueShare(...): void
{
    static::ejecutar("INSERT INTO ...", [...]);
}
```

**Problema:** `ejecutar()` retorna -1 si falla (PostgresService logging). Pero `registrarRevenueShare()` retorna `void` — el caller no tiene forma de saber si la transacción financiera se guardó. En un sistema de pagos, esto es crítico.

**Fix:**
```php
public static function registrarRevenueShare(...): bool
{
    $filas = static::ejecutar("INSERT INTO ...", [...]);
    return $filas > 0;
}
```

---

### TR-03. P3: String 'descarga' hardcodeado en INSERT

**Línea:** 82  
```php
. ", " . TransaccionesCols::TIPO
. ") VALUES (:comprador, :creador, :sample, 'descarga', ...)"
```

**Problema:** Debería usar `TransaccionesEnums::TIPO_DESCARGA` (si existe) o al menos un parámetro nombrado para consistencia con el patrón de Cols/Enums.

---

### TR-04. P2: 3 queries de ingresos separadas que podrían combinarse

**Líneas:** 95-136  
```php
ingresosCreadorMes()      // Query 1
ingresosCreadorMesAnterior()  // Query 2
ingresosCreadorTotal()    // Query 3
```

**Fix:** Combinar en una sola query con CASE/FILTER:
```sql
SELECT
    COALESCE(SUM(pago_creador) FILTER (WHERE created_at >= date_trunc('month', NOW())), 0) as mes,
    COALESCE(SUM(pago_creador) FILTER (
        WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
        AND created_at < date_trunc('month', NOW())
    ), 0) as mes_anterior,
    COALESCE(SUM(pago_creador), 0) as total
FROM transacciones
WHERE creador_id = :userId AND estado = 'completed'
```

---

### TR-05. P3: Fully qualified class names inline en SQL builder

**Líneas:** 140-155  
```php
$ts = \App\Config\Schema\_generated\SamplesCols::TABLA;
$tu = \App\Config\Schema\_generated\UsuariosExtCols::TABLA;
```

**Problema:** Usa FQN en lugar de imports con `use`. El archivo ya importa TransaccionesCols pero no las otras clases.

**Fix:** Agregar `use` statements al inicio del archivo.

---

## Archivo 3: ReproduccionesRepository.php

**Ruta:** `Database/Repositories/ReproduccionesRepository.php` (148 líneas)

### RE-01. P0: INTERVAL interpolation sin whitelist [confirma AG-SEC P0-3]

**Línea:** 103  
```php
. " AND " . ReproduccionesCols::CREATED_AT . " >= NOW() - INTERVAL '{$intervalo}'",
```

**Caller actual:** `ReproduccionesController` con `'3 seconds'` hardcodeado. Pero el parámetro acepta cualquier string y tiene default `'30 seconds'`.

**Fix:** Whitelist dentro del método:
```php
$intervalosValidos = ['3 seconds', '10 seconds', '30 seconds', '1 minute', '5 minutes'];
if (!in_array($intervalo, $intervalosValidos, true)) {
    $intervalo = '30 seconds';
}
```

---

### RE-02. P1: Boolean pasado como string a PDO

**Líneas:** 115-116, 129  
```php
'completada' => $completada ? 'true' : 'false'
```

**Problema:** PDO con PostgreSQL acepta `'true'`/`'false'` como strings para columnas boolean, pero es frágil. Si la columna cambia de tipo o se migra a otro driver, rompe. El patrón correcto en PDO es usar valores nativos PHP.

**Fix:**
```php
'completada' => $completada  // PHP bool → PG bool directo
```
O con PDO bindValue explícito usando `PDO::PARAM_BOOL`.

---

### RE-03. P1: eliminarPorSample() — DELETE sin verificar resultado

**Líneas:** 72-78  
```php
public static function eliminarPorSample(int $sampleId): void
{
    static::ejecutar("DELETE FROM ...", ['id' => $sampleId]);
}
```

**Problema:** Si el DELETE falla (retorna -1), el caller no lo sabe. En contexto de cascade-delete de samples, esto puede dejar datos huérfanos.

**Fix:**
```php
public static function eliminarPorSample(int $sampleId): bool
{
    return static::ejecutar("DELETE FROM ...", ['id' => $sampleId]) >= 0;
}
```

---

### RE-04. P3: Default de anti-bot demasiado permisivo

**Línea:** 100  
```php
public static function buscarRecientePorUsuario(int $userId, int $sampleId, string $intervalo = '30 seconds'): ?array
```

**Problema:** El default es `'30 seconds'` pero el caller único usa `'3 seconds'`. Si alguien llama sin parámetro, el window anti-bot sería 10x más amplio de lo esperado.

**Fix:** Hacer el intervalo obligatorio (sin default) o ajustar el default a `'3 seconds'`.

---

### RE-05. P2: historialUsuario() — GROUP BY con muchas columnas

**Líneas:** 135-147  
```php
. " GROUP BY s." . SamplesCols::ID . ", u." . UsuariosExtCols::ID
. ", u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
. ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::VERIFICADO
. ", u." . UsuariosExtCols::WP_USER_ID
```

**Problema:** El GROUP BY obliga a listar todas las columnas non-aggregated. PostgreSQL permite `GROUP BY s.id, u.id` si ambos son PKs (todas las demás columnas son funcionalmente dependientes).

**Fix:** Simplificar a:
```sql
GROUP BY s.id, u.id
```

---

## Archivo 4: ComentariosRepository.php

**Ruta:** `Database/Repositories/ComentariosRepository.php` (313 líneas)

### CO-01. P0: INTERVAL interpolation con cast integer [confirma AG-SEC P0-3]

**Línea:** 298  
```php
. " AND " . ComentariosCols::CREATED_AT . " > NOW() - INTERVAL '{$ventanaSeg} seconds'"
```

**Riesgo actual BAJO:** El type-hint `int $ventanaSeg` previene inyección directa, pero defense-in-depth recomienda validar.

**Fix:**
```php
$ventanaSeg = max(1, min(3600, (int) $ventanaSeg));
```

---

### CO-02. P2: actualizarEstadoModeracion() — query redundante

**Líneas:** 67-74  
```php
public static function actualizarEstadoModeracion(int $id, string $estado): bool
{
    static::ejecutar("UPDATE ...", ['estado' => $estado, 'id' => $id]);
    return static::existe([ComentariosCols::ID => $id]);
}
```

**Problema:** Hace UPDATE + SELECT (vía `existe()` → `contarDonde()`). Son 2 roundtrips a BD.

**Fix:**
```php
public static function actualizarEstadoModeracion(int $id, string $estado): bool
{
    $filas = static::ejecutar("UPDATE ...", ['estado' => $estado, 'id' => $id]);
    return $filas > 0;
}
```

---

### CO-03. P2: recalcularTotalEnTarget() — subquery en UPDATE

**Líneas:** 233-244  
```php
"UPDATE {$tablaDestino} SET {$colTotal} = ("
    . "SELECT COUNT(*) FROM {$tc} WHERE tipo = :tipo AND target_id = :targetId"
    . ") WHERE {$colId} = :targetId2",
```

**Problema:** Correctamente parametrizado pero usa `:targetId` y `:targetId2` para el mismo valor. PDO con EMULATE_PREPARES=false no permite reusar placeholders (documentado en lecciones aprendidas). El workaround con `targetId2` funciona pero es confuso.

**Nota:** Este patrón es necesario por limitación de PDO. Mantener pero documentar.

---

### CO-04. P3: buscarDuplicadoReciente() — falta índice compuesto

**Líneas:** 290-304  
```sql
WHERE autor_id = :autor AND contenido = :contenido AND created_at > NOW() - INTERVAL '...'
```

**Problema:** Sin un índice en `(autor_id, created_at)`, esta query hace seq scan. El campo `contenido` (TEXT) no debería indexarse directamente (demasiado grande), pero `(autor_id, created_at)` sí.

**Fix SQL:**
```sql
CREATE INDEX idx_comentarios_autor_created ON comentarios(autor_id, created_at DESC);
```

---

### CO-05. P3: insertarComentario() — RETURNING con lastInsertId()

**Líneas:** 211-222  
```php
return static::insertar(
    "INSERT INTO ... RETURNING " . ComentariosCols::ID,
    $datos
);
```

**Problema:** `BaseRepository::insertar()` → `PostgresService::insertar()` usa `$pdo->lastInsertId()`, NO `$stmt->fetchColumn()`. El `RETURNING` clause se ejecuta pero su resultado se ignora. Funciona con tablas SERIAL porque `lastInsertId()` lee la secuencia independientemente, pero:
1. Es redundante incluir RETURNING si no se fetchea.
2. Si la tabla usa GENERATED ALWAYS AS IDENTITY, `lastInsertId()` sin nombre de secuencia podría fallar.

**Fix en PostgresService::insertar():**
```php
public static function insertar(string $sql, array $params = []): ?int
{
    // Si la query tiene RETURNING, usar fetchColumn()
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    if (stripos($sql, 'RETURNING') !== false) {
        $id = $stmt->fetchColumn();
        return $id !== false ? (int) $id : null;
    }
    return (int) $pdo->lastInsertId();
}
```

---

## Archivo 5: NotificacionesController.php

**Ruta:** `Api/Controladores/NotificacionesController.php` (95 líneas)

### NC-01. P1: NINGÚN método tiene try-catch

**Líneas:** 46-95  
```php
public static function listar(\WP_REST_Request $request): \WP_REST_Response
{
    $userId = UsuarioHelper::obtenerIdPg();
    if (!$userId) return UsuarioHelper::respuestaNoEncontrado();
    // ...sin try-catch...
    $notificaciones = NotificacionesRepository::listarConActor($userId, $offset);
    // ...sin try-catch...
    return new \WP_REST_Response(['data' => $notificaciones], 200);
}
```

**Problema:** Si `listarConActor()` falla y el error no se captura en PostgresService (ej: por timeout de conexión o error inesperado), WP REST API retorna 500 con detalles de error internos visibles al usuario.

**Fix:** Envolver cada método:
```php
public static function listar(\WP_REST_Request $request): \WP_REST_Response
{
    try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();
        $page = max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 30;
        $notificaciones = NotificacionesRepository::listarConActor($userId, $offset);
        // ...
        return new \WP_REST_Response(['data' => $notificaciones], 200);
    } catch (\Throwable $e) {
        KamplesLogger::error('NotificacionesController::listar error', ['error' => $e->getMessage()]);
        return new \WP_REST_Response(['error' => 'Error interno'], 500);
    }
}
```

Aplica a los 4 métodos: `listar`, `marcarLeida`, `marcarTodasLeidas`, `conteoNoLeidas`.

---

### NC-02. P1: marcarLeida() — no verifica que el resultado sea exitoso

**Líneas:** 69-76  
```php
$notifId = (int) $request->get_param('id');
NotificacionesRepository::marcarLeida($notifId, $userId);
return new \WP_REST_Response(['ok' => true], 200);
```

**Problema:** `marcarLeida()` llama `ejecutar()` que retorna int (-1 en fallo). El controller ignora el resultado y SIEMPRE retorna `['ok' => true]`. Si el UPDATE falló (notificación no existe, BD caída), el frontend cree que se marcó correctamente.

**Fix:**
```php
$resultado = NotificacionesRepository::marcarLeida($notifId, $userId);
// marcarLeida debería retornar bool
return new \WP_REST_Response(['ok' => $resultado], $resultado ? 200 : 404);
```

---

### NC-03. P3: Columnas hardcodeadas en NotificacionesRepository::crear()

**Líneas referidas en NotificacionesRepository:** L138, L159-164  
```php
// crear() L138:
"INSERT INTO {$tabla} (" . NotificacionesCols::USUARIO_ID . ", " . NotificacionesCols::TIPO . ", datos)"

// crearCompleta() L159-164:
", titulo, mensaje, datos, actor_id, enlace)"
```

**Problema:** `datos`, `titulo`, `mensaje`, `actor_id`, `enlace` están hardcodeados como strings en vez de usar `NotificacionesCols::DATOS`, `NotificacionesCols::TITULO`, etc. Rompe el patrón Schema System.

**Fix:** Reemplazar con constantes de NotificacionesCols.

---

### NC-04. P3: O09 "JSON join fragile" — ya resuelto

**Evaluación:** El O09 original mencionaba un "JSON join frágil" en notificaciones. Tras inspeccionar:
- `listarConActor()` usa LEFT JOIN estándar `ON u.id = n.actor_id` — correcto.
- La columna `datos` es JSONB almacenada/leída como string sin deserialización en SQL — correcto.
- **No hay JSON join** (no se usa `->>'key'` en JOIN conditions ni WHERE).

**Conclusión:** O09 está resuelto o era un falso positivo. El JOIN es relacional estándar.

---

## Archivo 6: DashboardController.php

**Ruta:** `Api/Controladores/DashboardController.php` (112 líneas)

### DC-01. P2: stats() — 8 queries secuenciales (O16)

**Líneas:** 49-62  
```php
$descargasMes = DescargasRepository::contarDelCreadorMes($userId);        // Query 1
$reproduccionesMes = ReproduccionesRepository::contarDelCreadorMes($userId); // Query 2
$reproduccionesTotal = SamplesRepository::totalReproduccionesCreador($userId); // Query 3
$seguidoresNuevos = FollowsRepository::seguidoresNuevosMes($userId);      // Query 4
$ingresosMes = TransaccionesRepository::ingresosCreadorMes($userId);       // Query 5
$ingresosAnterior = TransaccionesRepository::ingresosCreadorMesAnterior($userId); // Query 6
$ingresosTotal = TransaccionesRepository::ingresosCreadorTotal($userId);   // Query 7
// + UsuarioHelper::obtenerPorId = Query 8
```

**Impacto:** 8 roundtrips a BD secuenciales. En red local es ~8-16ms, en VPS con connection pooling podría ser ~40-80ms.

**Fix ideal:** Un solo CTE combinado:
```sql
WITH descargas_mes AS (
    SELECT COUNT(*) as total FROM descargas d
    JOIN samples s ON d.sample_id = s.id
    WHERE s.creador_id = :userId AND d.created_at >= date_trunc('month', NOW())
),
repros_mes AS (
    SELECT COUNT(*) as total FROM reproducciones r
    JOIN samples s ON r.sample_id = s.id
    WHERE s.creador_id = :userId AND r.created_at >= date_trunc('month', NOW())
),
follows_mes AS (
    SELECT COUNT(*) as total FROM follows
    WHERE seguido_id = :userId AND created_at >= date_trunc('month', NOW())
),
ingresos AS (
    SELECT
        COALESCE(SUM(pago_creador) FILTER (WHERE created_at >= date_trunc('month', NOW())), 0) as mes,
        COALESCE(SUM(pago_creador) FILTER (
            WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
            AND created_at < date_trunc('month', NOW())
        ), 0) as mes_anterior,
        COALESCE(SUM(pago_creador), 0) as total
    FROM transacciones WHERE creador_id = :userId AND estado = 'completed'
)
SELECT
    (SELECT total FROM descargas_mes) as descargas_mes,
    (SELECT total FROM repros_mes) as repros_mes,
    -- etc...
```
Reduce de 8 roundtrips a 1.

---

### DC-02. P1: NINGÚN método tiene try-catch

**Líneas:** 46-112  
**Problema:** Exactamente igual que NC-01. Sin try-catch en `stats()`, `topSamples()`, `transacciones()`, `ingresos()`. 

Los demás controllers del roadmap tienen try-catch (según la auditoría AG-SEC), pero estos 2 controllers (Notificaciones + Dashboard) NO.

**Fix:** Envolver cada método con try-catch + KamplesLogger.

---

### DC-03. P2: ingresos() — INTERVAL pasa por TransaccionesRepository sin whitelist

**Líneas:** 103-110  
```php
$intervalo = match ($periodo) {
    'semana' => '7 days',
    'anio' => '365 days',
    default => '30 days',
};
$ingresos = TransaccionesRepository::ingresosGrafico($userId, $intervalo);
```

**Evaluación:** El controller whitelist con `match()` — seguro. Pero el fix debería estar en AMBOS lados (controller + repo) para defense-in-depth. Ver TR-01.

---

### DC-04. P3: stats() hardcodea (int) cast sin null-safe

**Líneas:** 64-74  
```php
'descargasTotal' => (int) ($usuario[UsuariosExtCols::TOTAL_DESCARGAS] ?? 0),
```

**Problema menor:** Si `obtenerPorId()` retorna null (porque el usuario no existe en usuarios_ext), `$usuario` será null y `$usuario[UsuariosExtCols::TOTAL_DESCARGAS]` lanza warning en PHP 8.

**Fix:** Ya hay check `if (!$userId)` pero falta verificar `if (!$usuario)`.

---

## Archivo 7: ExperimentosController.php

**Ruta:** `Api/Controladores/ExperimentosController.php` (203 líneas)

### EX-01. P1: Hardcoded password en constante [confirma O11]

**Líneas:** 18-19  
```php
private const TEST_PASS = 'GloryTest2026!';
```

**Problema:** Password visible en source code, commiteada en git. El usuario de test persiste en BD con esta contraseña conocida. Cualquiera que tenga acceso al repo puede loguearse como `alice_test`.

**Fix:** 
1. Generar password aleatorio con `wp_generate_password(24, true)` en cada creación.
2. No almacenar la contraseña como constante.
3. O leer de variable de entorno.

```php
$testPass = wp_generate_password(24, true, true);
```

---

### EX-02. P1: permission_callback usa requerirAuth en vez de requerirAdmin

**Líneas:** 36-40  
```php
register_rest_route($namespace, '/admin/experimentos/generar', [
    'methods'             => 'POST',
    'callback'            => [self::class, 'generar'],
    'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
]);
```

**Problema:** Cualquier usuario autenticado puede llegar al callback `generar()`. El check de admin está DENTRO del callback (L55-60), lo que significa que:
1. El request ya pasó por validación, parsing, etc.
2. Un usuario no-admin recibe 403, pero el trabajo de procesamiento ya se hizo.
3. Inconsistente con otras rutas admin que usan `requerirAdmin`.

**Fix:**
```php
'permission_callback' => [AuthMiddleware::class, 'requerirAdmin'],
```

---

### EX-03. P1: generar() sin try-catch global

**Líneas:** 46-105  
**Problema:** Si `obtenerOcrearUsuarioTest()` lanza excepción (ej: BD inaccesible pero WP funciona), no hay catch.

---

### EX-04. P3: json_encode() sin verificación de error

**Líneas:** 143, 151, 158, 163  
```php
$datos = json_encode(['seguidor_id' => $testUserId]);
```

**Problema:** `json_encode()` retorna `false` si los datos contienen valores no-UTF8. Aunque aquí los datos son todos int, es un patrón que debería usar `json_encode($datos, JSON_THROW_ON_ERROR)` o verificar.

---

### EX-05. P3: No rate limiting en endpoint de generación

**Problema:** Sin RateLimiter, un admin podría accidentalmente generar cientos de notificaciones/mensajes con requests repetidos.

---

## Archivo 8: PostgresService.php

**Ruta:** `Database/PostgresService.php` (290 líneas)

### PG-01. P1: .env parser frágil — no maneja comillas ni espacios

**Líneas:** 247-263  
```php
$parts = explode('=', $line, 2);
if (count($parts) === 2) {
    $key = trim($parts[0]);
    $val = trim($parts[1]);
    $_ENV[$key] = $val;
    putenv("{$key}={$val}");
}
```

**Problemas concretos:**
1. `KAMPLES_PG_PASSWORD="my password"` → almacena `"my password"` con comillas incluidas → falla autenticación PG.
2. `KAMPLES_PG_HOST=127.0.0.1 # local` → almacena `127.0.0.1 # local` → falla conexión.
3. No maneja `export KAMPLES_PG_HOST=...` (aunque solo filtra `KAMPLES_PG_*`).

**Fix:**
```php
$val = trim($parts[1]);
// Remover comillas
$val = trim($val, '"\'');
// Remover comentarios inline
if (($pos = strpos($val, ' #')) !== false) {
    $val = trim(substr($val, 0, $pos));
}
```

O mejor: reutilizar `vlucas/phpdotenv` que ya está en `vendor/`.

---

### PG-02. P1: .env parser sobreescribe variables de entorno del sistema

**Línea:** 259  
```php
putenv("{$key}={$val}");
```

**Problema:** Si el sistema ya tiene `KAMPLES_PG_HOST` configurado (ej: en Docker/Kubernetes), el .env file lo sobreescribiría. La convención estándar es que variables de entorno del sistema tienen PRIORIDAD sobre .env.

**Fix:** Solo settear si no existe:
```php
if (!isset($_ENV[$key]) && getenv($key) === false) {
    $_ENV[$key] = $val;
    putenv("{$key}={$val}");
}
```

---

### PG-03. P2: insertar() usa lastInsertId() — ignora RETURNING

**Líneas:** 196-209  
```php
public static function insertar(string $sql, array $params = []): ?int
{
    // ...
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return (int) $pdo->lastInsertId();
}
```

**Problema:** Múltiples repos usan `RETURNING id` en sus INSERT queries (ComentariosRepo L221, NotificacionesRepo, etc.), pero `insertar()` ignora el resultado del RETURNING y usa `lastInsertId()` en su lugar.

- Con tablas SERIAL: funciona (la secuencia se lee correctamente).
- Con GENERATED ALWAYS AS IDENTITY: `lastInsertId()` sin argumento devuelve `'0'` o vacío.
- El RETURNING clause se ejecuta pero su resultado nunca se fetchea.

**Fix:**
```php
$stmt->execute($params);
if (stripos($sql, 'RETURNING') !== false) {
    $col = $stmt->fetchColumn();
    return $col !== false ? (int) $col : null;
}
return (int) $pdo->lastInsertId();
```

---

### PG-04. P2: cargarEnvSiNecesario() solo carga KAMPLES_PG_*

**Línea:** 255  
```php
if (!str_starts_with($line, 'KAMPLES_PG_')) {
    continue;
}
```

**Problema:** Si Dotenv no se ejecutó, STRIPE_*, FFMPEG_*, GROQ_* y demás variables quedan vacías. Esto puede causar fallos silenciosos en StripeService, ServicioIA, etc.

**Fix:** O cargar TODAS las variables en el fallback, o documentar explícitamente que este fallback es SOLO para la conexión PG.

---

### PG-05. P3: validarQueryContraSchema() — regex no detecta aliases con AS

**Líneas:** 266-290  
```php
$patron = '/\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z_]+)\b/i';
```

**Problema menor:** Si la query usa `FROM (SELECT ...) AS subquery`, la regex podría capturar tokens incorrectos. El filtro por `strlen <= 2` mitiga la mayoría, pero aliases como `sub` o `datos` podrían generar falsos positivos en SchemaRegistry.

---

### PG-06. P3: RuntimeException en obtenerConexion() sin catch para callers

**Línea:** 56-58  
```php
if ($user === '' || $password === '') {
    throw new RuntimeException(
        'PostgresService: KAMPLES_PG_USER y KAMPLES_PG_PASSWORD son obligatorios en .env'
    );
}
```

**Problema:** Este throw está DENTRO del try-catch de PDOException (L66), pero RuntimeException NO es PDOException. Se propagará sin catch. Es intencional (forzar configuración correcta), pero todos los callers asumen que `obtenerConexion()` retorna `?PDO` sin excepciones.

**Fix:** O catchear RuntimeException también, o documentar que puede lanzar.

---

## Archivo 9: ServicioNotificaciones.php

**Ruta:** `Services/ServicioNotificaciones.php` (185 líneas)

### SN-01. P3: Error handling es sólido — bien hecho

El método `crear()` tiene try-catch con KamplesLogger. Es fire-and-forget por diseño.

---

### SN-02. P2: N+1 en obtenerNombreActor()

**Línea:** 181  
```php
private static function obtenerNombreActor(int $actorId): string
{
    try {
        return UsuariosExtRepository::buscarUsername($actorId);
    } catch (\Throwable $e) {
        return 'usuario';
    }
}
```

**Problema:** Cada helper (likeSample, follow, nuevoComentario, etc.) llama `obtenerNombreActor()` que es una query a BD. Si se crean múltiples notificaciones del mismo actor en un request, se ejecuta la misma query N veces.

**Fix:** Cache estático:
```php
private static array $cacheNombres = [];

private static function obtenerNombreActor(int $actorId): string
{
    if (isset(self::$cacheNombres[$actorId])) {
        return self::$cacheNombres[$actorId];
    }
    try {
        $nombre = UsuariosExtRepository::buscarUsername($actorId);
        self::$cacheNombres[$actorId] = $nombre;
        return $nombre;
    } catch (\Throwable $e) {
        return 'usuario';
    }
}
```

---

### SN-03. P3: crear() no retorna éxito/fallo

**Líneas:** 38-62  
```php
public static function crear(...): void
```

**Problema:** Fire-and-forget es aceptable, pero algunos callers podrían querer saber si la notificación se creó. No bloquea pero debería retornar bool opcionalmente.

---

### SN-04. P3: Mensajes con ñ/acentos inconsistentes

**Líneas varias:**
```php
"@{$actorNombre} comento en tu sample"     // L125 — sin acento
"@{$actorNombre} respondio a tu comentario" // L138 — sin acento  
"Tu publicacion ha sido eliminada"          // L160 — sin acento
```

**Problema de calidad:** Mezcla de acentos (algunos métodos los usan, otros no). Para una app en español, todos deberían usar acentos: "comentó", "respondió", "publicación".

---

## Archivo 10: StripeService.php

**Ruta:** `Services/StripeService.php` (255 líneas)

### ST-01. P1: request() — no verifica SSL explícitamente

**Líneas:** 96-114  
```php
$ch = curl_init();
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
```

**Problema:** No setea `CURLOPT_SSL_VERIFYPEER` ni `CURLOPT_SSL_VERIFYHOST`. PHP 7.1+ los habilita por defecto, pero algunas distribuciones/Docker images tienen CA bundles incorrectos o deshabilitados. Para comunicación con API de pagos, la verificación SSL debería ser EXPLÍCITA.

**Fix:**
```php
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
```

---

### ST-02. P1: transferirACreador() — no valida monto

**Líneas:** 171-183  
```php
public static function transferirACreador(int $creadorId, int $monto, string $moneda = 'usd', string $descripcion = ''): array
```

**Problema:** `$monto` puede ser 0 o negativo. Stripe API rechazaría montos inválidos, pero no hay validación preventiva ni log de intento sospechoso.

**Fix:**
```php
if ($monto <= 0) {
    KamplesLogger::warning('StripeService: intento de transferencia con monto inválido', [
        'creadorId' => $creadorId, 'monto' => $monto
    ]);
    return ['error' => 'Monto debe ser positivo'];
}
```

---

### ST-03. P1: obtenerPriceId() — fallo silencioso sin log

**Líneas:** 248-252  
```php
private static function obtenerPriceId(string $plan): ?string
{
    $key = 'STRIPE_PRICE_' . strtoupper($plan);
    $keyGlory = 'GLORY_' . $key;
    return $_ENV[$keyGlory] ?? getenv($keyGlory)
        ?: $_ENV[$key] ?? getenv($key) ?: null;
}
```

**Problema:** Si la variable de entorno no existe, retorna null silenciosamente. El caller `crearCheckoutSession()` sí reporta el error, pero no hay log de QUÉ variable falta, lo que dificulta debugging de configuración.

**Fix:**
```php
$result = $_ENV[$keyGlory] ?? getenv($keyGlory) ?: $_ENV[$key] ?? getenv($key) ?: null;
if ($result === null) {
    KamplesLogger::warning("StripeService: price ID no configurado", [
        'plan' => $plan, 'envKey' => $keyGlory, 'fallback' => $key
    ]);
}
return $result;
```

---

### ST-04. P1: Race condition en obtenerOCrearCustomer() [confirma AG-SEC P1-7]

**Líneas:** 235-255  
```php
$existing = self::obtenerCustomerId($userId);
if ($existing) return $existing;
// ... crear customer ...
```

**Problema:** Dos requests concurrentes pueden crear dos Stripe Customers para el mismo usuario.

**Fix:** Advisory lock de PostgreSQL o upsert atómico.

---

### ST-05. P2: Account IDs concatenados en URL sin validación

**Líneas:** 191, 198, 206  
```php
return self::request('GET', '/accounts/' . $accountId);
return self::request('POST', '/accounts/' . $accountId . '/login_links');
```

**Problema:** `$accountId` se concatena directamente en la URL. Si contiene `../` o caracteres especiales, podría apuntar a otro endpoint. Stripe IDs son formato `acct_xxx` (alfanuméricos), pero no se valida.

**Fix:**
```php
if (!preg_match('/^acct_[a-zA-Z0-9]+$/', $accountId)) {
    return ['error' => 'Account ID inválido'];
}
```

---

### ST-06. P3: PLANES hardcodeados — desync con Stripe

**Líneas:** 28-50  
```php
private const PLANES = [
    'pro' => ['precio_mensual' => 5.00, ...],
    'premium' => ['precio_mensual' => 19.99, ...],
    'free' => ['precio_mensual' => 0, ...],
];
```

**Problema:** Si los precios cambian en Stripe Dashboard, este código queda desactualizado. Ya documentado en roadmap. Considerar leer de Stripe API o de configuración externa.

---

### ST-07. P2: request() — no implementa retry ni exponential backoff

**Problema:** Las APIs de pago pueden tener rate limits o errores transitorios (429, 500, 502). Sin retry, una transferencia legítima podría fallar permanentemente por un error temporal.

**Fix futuro:** Implementar retry con backoff para status 429 y 5xx.

---

## Tabla Resumen de Todos los Hallazgos

| ID | Sev | Archivo | Línea | Descripción | Esfuerzo |
|----|-----|---------|-------|-------------|----------|
| DA-01 | P0 | DeduplicadorAudio | 138,152,169 | exec() sin escapeshellarg (3 calls) | 15 min |
| TR-01 | P0 | TransaccionesRepo | 174 | INTERVAL interpolation sin whitelist | 5 min |
| RE-01 | P0 | ReproduccionesRepo | 103 | INTERVAL interpolation sin whitelist | 5 min |
| CO-01 | P0 | ComentariosRepo | 298 | INTERVAL interpolation (int cast defense) | 5 min |
| DA-02 | P1 | DeduplicadorAudio | 156 | exec() sin captura exit code | 5 min |
| DA-03 | P1 | DeduplicadorAudio | 56-120 | calcularYVerificar sin try-catch | 10 min |
| DA-04 | P1 | DeduplicadorAudio | 147-162 | temp file leak en error paths | 10 min |
| TR-02 | P1 | TransaccionesRepo | 64-92 | registrarRevenueShare void sin retorno | 5 min |
| RE-02 | P1 | ReproduccionesRepo | 115,129 | Boolean como string a PDO | 5 min |
| RE-03 | P1 | ReproduccionesRepo | 72-78 | DELETE sin verificar resultado | 5 min |
| NC-01 | P1 | NotificacionesCtrl | 46-95 | 4 métodos sin try-catch | 15 min |
| NC-02 | P1 | NotificacionesCtrl | 69-76 | marcarLeida ignora resultado | 5 min |
| DC-02 | P1 | DashboardCtrl | 46-112 | 4 métodos sin try-catch | 15 min |
| EX-01 | P1 | ExperimentosCtrl | 18-19 | Hardcoded password en const | 10 min |
| EX-02 | P1 | ExperimentosCtrl | 36-40 | permission_callback usa requerirAuth | 2 min |
| PG-01 | P1 | PostgresService | 247-263 | .env parser frágil (comillas/espacios) | 20 min |
| PG-02 | P1 | PostgresService | 259 | .env sobreescribe env del sistema | 5 min |
| ST-01 | P1 | StripeService | 96-114 | SSL no verificado explícitamente | 5 min |
| ST-02 | P1 | StripeService | 171-183 | transferirACreador sin validar monto | 5 min |
| ST-03 | P1 | StripeService | 248-252 | obtenerPriceId fallo silencioso | 5 min |
| ST-04 | P1 | StripeService | 235-255 | Race condition crear customer | 15 min |
| TR-04 | P2 | TransaccionesRepo | 95-136 | 3 queries combinables en 1 | 20 min |
| RE-04 | P2 | ReproduccionesRepo | 100 | Default anti-bot demasiado permisivo | 2 min |
| RE-05 | P2 | ReproduccionesRepo | 135-147 | GROUP BY excesivo (PK basta) | 5 min |
| CO-02 | P2 | ComentariosRepo | 67-74 | Query redundante (UPDATE + SELECT) | 5 min |
| CO-05 | P2 | ComentariosRepo | 211-222 | RETURNING ignorado por lastInsertId | 20 min |
| DC-01 | P2 | DashboardCtrl | 49-62 | 8 queries secuenciales → 1 CTE | 45 min |
| DC-03 | P2 | DashboardCtrl | 103-110 | INTERVAL defense-in-depth | 5 min |
| PG-03 | P2 | PostgresService | 196-209 | insertar() ignora RETURNING | 15 min |
| PG-04 | P2 | PostgresService | 255 | Fallback solo carga KAMPLES_PG_* | 5 min |
| SN-02 | P2 | ServicioNotif | 181 | N+1 obtenerNombreActor | 10 min |
| ST-05 | P2 | StripeService | 191,198,206 | Account ID sin validar en URL | 5 min |
| ST-07 | P2 | StripeService | request() | Sin retry/backoff para API pagos | 30 min |
| DA-05 | P3 | DeduplicadorAudio | 192 | $_ENV vs FFmpegDetector existente | 10 min |
| DA-06 | P3 | DeduplicadorAudio | 177 | unpack('v*') confuso para s16le | 2 min |
| TR-03 | P3 | TransaccionesRepo | 82 | 'descarga' hardcodeado vs Enums | 5 min |
| TR-05 | P3 | TransaccionesRepo | 140-155 | FQN inline vs use statements | 5 min |
| CO-03 | P3 | ComentariosRepo | 233-244 | :targetId/:targetId2 duplicado | 0 (doc) |
| CO-04 | P3 | ComentariosRepo | 290-304 | Falta índice (autor_id, created_at) | 5 min |
| NC-03 | P3 | NotificacionesRepo | 138,159 | Columnas hardcodeadas vs Cols | 10 min |
| DC-04 | P3 | DashboardCtrl | 64-74 | Null-safe check de $usuario | 5 min |
| EX-03 | P3 | ExperimentosCtrl | 46-105 | generar() sin try-catch global | 10 min |
| EX-04 | P3 | ExperimentosCtrl | 143-163 | json_encode sin verificación | 5 min |
| EX-05 | P3 | ExperimentosCtrl | endpoint | Sin rate limiting | 10 min |
| PG-05 | P3 | PostgresService | 266-290 | Regex aliases falsos positivos | 0 (doc) |
| PG-06 | P3 | PostgresService | 56-58 | RuntimeException no catcheada | 5 min |
| SN-03 | P3 | ServicioNotif | 38-62 | crear() no retorna bool | 5 min |
| SN-04 | P3 | ServicioNotif | varios | Acentos inconsistentes en español | 10 min |
| ST-06 | P3 | StripeService | 28-50 | PLANES hardcodeados vs Stripe | 0 (doc) |

---

## Priorización de Correcciones

| Prioridad | IDs | Esfuerzo total | Impacto |
|-----------|-----|---------------|---------|
| **INMEDIATO** (P0) | DA-01, TR-01, RE-01, CO-01 | 30 min | Elimina injection vectors |
| **Sprint actual** (P1 críticos) | DA-02, DA-03, DA-04, TR-02, NC-01, DC-02, PG-01 | 80 min | Corrige silent failures |
| **Sprint actual** (P1 menores) | RE-02, RE-03, NC-02, EX-01, EX-02, PG-02, ST-01-04 | 55 min | Defense-in-depth |
| **Backlog** (P2) | DC-01, TR-04, PG-03, CO-02, CO-05, SN-02, ST-05,07 | ~2.5h | Optimización BD |
| **Backlog** (P3) | Todos P3 | ~1.5h | Limpieza técnica |

---

## Lecciones para futuras sesiones

- [try-catch controllers]: NotificacionesController y DashboardController son los UNICOS controllers sin try-catch. Todos los demás sí lo tienen.
- [INTERVAL PDO]: 3 repos interpolan INTERVAL. Fix = whitelist in-repo. NUNCA confiar en que el caller valida.
- [RETURNING vs lastInsertId]: PostgresService::insertar() ignora RETURNING clause. Funciona con SERIAL, podría fallar con IDENTITY. Fix: detectar RETURNING y usar fetchColumn().
- [.env parser]: El fallback manual en PostgresService no maneja comillas, comentarios ni prioridad de env vars del sistema. Usar vlucas/phpdotenv.
- [Boolean PDO]: PDO PostgreSQL acepta 'true'/'false' como strings, pero es frágil. Usar valores PHP nativos.
- [DeduplicadorAudio]: Es el UNICO archivo con exec() sin escapeshellarg (3 calls). Los otros 3 archivos FFmpeg lo hacen correctamente.
- [StripeService]: curl requests no validan SSL explícitamente ni implementan retry. Para API de pagos, ambos son necesarios.
- [ExperimentosController]: Hardcoded password + permission_callback lax. Bajo riesgo porque requiere admin, pero es un mal patrón.
- [ServicioNotificaciones]: Bien implementado. El try-catch en crear() y el fire-and-forget es el patrón correcto. Solo falta cache de nombres.
