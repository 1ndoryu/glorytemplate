# Auditoría de Seguridad y Calidad — Backend PHP Kamples

> **Fecha:** 2026-02-20  
> **Agente:** AG-SEC  
> **Alcance:** 86 archivos PHP en `App/Kamples/` (~70 leídos completamente, ~16 cubiertos por grep)  
> **Base:** PostgresService + BaseRepository + 18 repos + 29 controllers + 12 servicios + 4 helpers

---

## Resumen Ejecutivo

| Severidad | Hallazgos | Estado |
|-----------|-----------|--------|
| **P0** — Inyección (SQL/Command) | 3 | Requiere fix inmediato |
| **P1** — Fallos silenciosos / Patrones inseguros | 7 | Requiere fix planificado |
| **P2** — Optimización (N+1, queries secuenciales) | 8 | Mejora de rendimiento |
| **P3** — Calidad / Consistencia | 5 | Limpieza técnica |
| **Total** | **23** | |

**Nota positiva:** La capa de infraestructura (PostgresService, BaseRepository) es sólida: PDO con `ERRMODE_EXCEPTION`, `EMULATE_PREPARES = false`, prepared statements en todos los métodos base, y KamplesLogger consistente. Los controladores sanitizan input con `sanitize_text_field`/`sanitize_textarea_field` y aplican rate limiting. AuthMiddleware funciona correctamente.

---

## P0 — Inyección (CORREGIR INMEDIATAMENTE)

### P0-1. Command Injection en DeduplicadorAudio (CRÍTICO)

**Archivo:** `Services/DeduplicadorAudio.php` L155-170  
**Código vulnerable:**
```php
$cmd = sprintf(
    '"%s" -y -i "%s" -t %d -ar %d -ac 1 -f s16le "%s" 2>&1',
    $ffmpeg, $rutaArchivo, $seg, $sr, $tempInicio
);
exec($cmd, $output, $exitCode);
```

**Riesgo:** `$rutaArchivo` viene de la BD (`ruta_original`) y se interpola con comillas dobles, NO con `escapeshellarg()`. Si un archivo malicioso se guardó con nombre tipo `foo" && rm -rf / "bar.wav`, se ejecutaría como comando del sistema.

**Contraste:** `ProcesadorFFmpeg.php`, `DetectorBpm.php` y `DetectorTonalidad.php` SÍ usan `escapeshellarg()` correctamente. Solo `DeduplicadorAudio` no lo hace.

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
Aplicar el mismo patrón a las 3 llamadas `exec()` dentro de `calcularHash()` (L155, L168, L184) y `buscarFFmpeg()` (L206).

---

### P0-2. SQL Injection en INTERVAL — TransaccionesRepository (Medio-Bajo ACTUAL, Alto POTENCIAL)

**Archivo:** `Database/Repositories/TransaccionesRepository.php` L174  
**Código:**
```php
. " AND " . TransaccionesCols::CREATED_AT . " >= NOW() - INTERVAL '{$intervalo}'"
```

**Riesgo actual: BAJO** — El único caller (`DashboardController::ingresos()` L110) usa `match()` que whitelist a 3 valores fijos (`'7 days'`, `'30 days'`, `'365 days'`). Pero el método acepta `string $intervalo` sin restricción, lo que es una bomba de tiempo si otro caller pasa input del usuario.

**Fix:** Agregar whitelist dentro del repo:
```php
public static function ingresosGrafico(int $creadorId, string $intervalo): array
{
    $validos = ['7 days', '30 days', '90 days', '365 days'];
    if (!in_array($intervalo, $validos, true)) {
        $intervalo = '30 days';
    }
    // ...resto igual...
}
```

---

### P0-3. SQL Injection en INTERVAL — ReproduccionesRepository y ComentariosRepository (Bajo ACTUAL)

**Archivos:**
- `Database/Repositories/ReproduccionesRepository.php` L103: `INTERVAL '{$intervalo}'`
- `Database/Repositories/ComentariosRepository.php` L317: `INTERVAL '{$ventanaSeg} seconds'`

**Riesgo actual: BAJO** — Ambos se llaman solo con literales hardcodeados:
- `buscarRecientePorUsuario()` se llama con `'3 seconds'` desde `ReproduccionesController:78`
- `buscarDuplicadoReciente()` se llama con `int $ventanaSeg` (type-hint int) desde `ServicioAntiSpam:73`

**Fix:** Mismo patrón de whitelist o casteo explícito:
```php
// ReproduccionesRepository — agregar whitelist
$intervalosValidos = ['3 seconds','10 seconds','30 seconds','1 minute','5 minutes'];
if (!in_array($intervalo, $intervalosValidos, true)) $intervalo = '30 seconds';

// ComentariosRepository — castear a int (ya tiene type-hint, pero defense-in-depth)
$ventanaSeg = max(1, min(3600, (int) $ventanaSeg));
// Y usar: INTERVAL '$ventanaSeg seconds'
```

---

## P1 — Patrones Inseguros / Fallos Silenciosos

### P1-1. Column Name Interpolation sin whitelist — BaseRepository

**Archivo:** `Database/BaseRepository.php` — métodos `buscarDonde()` y `contarDonde()`  
**Código:**
```php
foreach ($condiciones as $columna => $valor) {
    $whereParts[] = "{$columna} = :{$paramName}";
```

**Riesgo:** Las keys del array `$condiciones` se interpolan como nombres de columna SQL. Actualmente TODOS los callers usan constantes `XxxCols::COLUMNA`, pero no hay validación en el repository.

**Fix recomendado:** Validar contra SchemaRegistry o tabla de columnas conocidas:
```php
// Opción simple: verificar que la columna solo contiene alfanuméricos y _
if (!preg_match('/^[a-z_][a-z0-9_]*$/i', $columna)) {
    throw new \InvalidArgumentException("Columna inválida: {$columna}");
}
```

---

### P1-2. Column Name Interpolation — AlgoritmoEstadoRepository::incrementarContador()

**Archivo:** `Database/Repositories/AlgoritmoEstadoRepository.php`  
**Código:**
```php
"SET {$columna} = {$columna} + 1"
```

**Riesgo:** `$columna` viene de `PlanificadorAlgoritmo` que tiene un allow-list, pero el repository no valida. Si otro caller pasa input no sanitizado, es SQL injection directa.

**Fix:** Agregar whitelist en el propio method:
```php
$columnasPermitidas = ['contador_likes', 'contador_descargas', 'contador_follows', ...];
if (!in_array($columna, $columnasPermitidas, true)) {
    throw new \InvalidArgumentException("Columna no permitida: {$columna}");
}
```

---

### P1-3. SET Clauses sin encapsulamiento — UsuariosExtRepository::actualizarCamposAdmin()

**Archivo:** `Database/Repositories/UsuariosExtRepository.php` L55  
**Código:**
```php
public static function actualizarCamposAdmin(int $id, array $clausulasSet, array $params): void
```

**Riesgo:** Recibe cláusulas SET ya construidas como strings. El caller (AdminController) las construye correctamente con whitelist de campos + enums validados, pero el método del repo confía ciegamente en el caller.

**Fix ideal:** Que el repo reciba un array clave-valor y construya las cláusulas internamente, con whitelist propia:
```php
public static function actualizarCamposAdmin(int $id, array $campos): void
{
    $permitidos = ['plan', 'rol', 'verificado', 'baneado_hasta'];
    $set = [];
    $params = ['id' => $id];
    foreach ($campos as $col => $valor) {
        if (!in_array($col, $permitidos, true)) continue;
        $set[] = "{$col} = :{$col}";
        $params[$col] = $valor;
    }
    // ...
}
```

---

### P1-4. `$userId` interpolado en SQL — NormalizadorSample::sqlSelectSamples()

**Archivo:** `Api/Helpers/NormalizadorSample.php` L258  
**Código:**
```php
$reaccionExpr = $userId !== null
    ? "(...WHERE " . LikesCols::USUARIO_ID . " = " . (int) $userId . " AND...)"
    : "NULL";
```

**Riesgo: MUY BAJO** — Se castea a `(int)` explícitamente y el parámetro es `?int`. Pero rompe el patrón de prepared statements usado en todo el codebase. Si alguien modifica el type-hint a string en el futuro, se abre un vector.

**Fix:** Pasar como parámetro nombrado de la query principal o documentarlo claramente. El comment actual es aceptable pero se debería reforzar.

---

### P1-5. DeduplicadorAudio — exec() sin verificar return code (segundo call)

**Archivo:** `Services/DeduplicadorAudio.php` L168-175  
**Código:**
```php
exec($cmd); // Sin capturar return code
if (file_exists($tempFinal)) {
```

**Riesgo:** La segunda llamada a `exec()` (extracción del final del audio) no captura `$exitCode`. Si FFmpeg falla parcialmente, puede producir un archivo corrupto que se hasheará, generando falsos positivos/negativos en deduplicación.

**Fix:**
```php
exec($cmd, $output2, $exitCode2);
if ($exitCode2 === 0 && file_exists($tempFinal)) {
```

---

### P1-6. SamplesRepository::eliminarConCascada() — Sin transacción explícita

**Archivo:** `Database/Repositories/SamplesRepository.php`  
**Código (inferido del summary):** 5 DELETEs secuenciales sin `BEGIN`/`COMMIT`.

**Riesgo:** Si falla a mitad (ej: DELETE de reproducciones ok, DELETE de likes falla), queda inconsistencia en BD. PostgresService auto-commitea cada `ejecutar()`.

**Fix:** Wrappear en transacción:
```php
$pdo = PostgresService::obtenerConexion();
$pdo->beginTransaction();
try {
    // 5 DELETEs...
    $pdo->commit();
} catch (\Throwable $e) {
    $pdo->rollBack();
    throw $e;
}
```
O mejor: usar `ON DELETE CASCADE` en las FKs de la BD.

---

### P1-7. StripeService::obtenerOCrearCustomer() — Race condition

**Archivo:** `Services/StripeService.php`  
**Riesgo:** Dos requests concurrentes del mismo usuario podrían crear dos Stripe Customers porque la verificación y creación no son atómicas.

**Fix:** Usar advisory lock de PostgreSQL antes de la operación:
```php
UsuariosExtRepository::advisoryLock($userId); // Ya existe en el codebase
// Luego verificar+crear
```

---

## P2 — Optimización de Rendimiento

### P2-1. AdminRepository::obtenerKpisResumen() — 10 subconsultas correlacionadas

**Archivo:** `Database/Repositories/AdminRepository.php`  
**Impacto:** Cada llamada ejecuta 10 COUNT en tablas separadas. Para un dashboard admin que se carga poco, es aceptable, pero escala mal.

**Fix:** Combinar en un solo query con CTEs laterales o una función SQL:
```sql
SELECT
    (SELECT COUNT(*) FROM usuarios_ext) as total_usuarios,
    (SELECT COUNT(*) FROM samples WHERE estado = 'activo') as total_samples,
    -- ... etc
```
PostgreSQL optimiza subqueries en SELECT list a un solo scan si son sobre tablas distintas.

---

### P2-2. AdminRepository::listarUsuariosConEstadisticas() — N+1 correlated subqueries

**Archivo:** `Database/Repositories/AdminRepository.php`  
**Impacto:** 2 correlated subqueries por fila = 2N queries adicionales para N usuarios.

**Fix:** Usar LEFT JOIN con GROUP BY o CTE pre-calculado:
```sql
WITH stats AS (
    SELECT creador_id, COUNT(*) as total_samples FROM samples GROUP BY creador_id
)
SELECT u.*, COALESCE(s.total_samples, 0) ...
FROM usuarios_ext u LEFT JOIN stats s ON u.id = s.creador_id
```

---

### P2-3. AdminRepository::obtenerActividadPorDias() — 3 queries secuenciales

**Archivo:** `Database/Repositories/AdminRepository.php`  
**Impacto:** 3 queries separadas (registros, uploads, descargas por día) que podrían ser UNION ALL.

**Fix:**
```sql
SELECT 'registros' as tipo, DATE(created_at) as fecha, COUNT(*) as total FROM usuarios_ext WHERE... GROUP BY fecha
UNION ALL
SELECT 'uploads', DATE(publicado_at), COUNT(*) FROM samples WHERE... GROUP BY DATE(publicado_at)
UNION ALL
SELECT 'descargas', DATE(created_at), COUNT(*) FROM descargas WHERE... GROUP BY DATE(created_at)
```

---

### P2-4. PerfilUsuario::construir() — 5 queries secuenciales

**Archivo:** `Services/PerfilUsuario.php`  
**Impacto:** `bpmPromedio()`, `keyFavorita()`, `tipoFavorito()` + 2 más hacen 5 roundtrips al DB.

**Fix:** Combinar en una sola query CTE:
```sql
WITH stats AS (
    SELECT AVG(bpm) as bpm_avg,
           MODE() WITHIN GROUP (ORDER BY key) as key_fav,
           MODE() WITHIN GROUP (ORDER BY tipo) as tipo_fav
    FROM samples WHERE creador_id = :userId AND estado = 'activo'
)
SELECT * FROM stats;
```

---

### P2-5. UsuariosExtRepository — 3 queries preferencias separadas

**Archivo:** `Database/Repositories/UsuariosExtRepository.php`  
**Impacto:** `bpmPromedio()`, `keyFavorita()`, `tipoFavorito()` son 3 queries que podrían unificarse.

**Fix:** Idéntico a P2-4 — combinar en una sola query.

---

### P2-6. MotorRecomendacion::feedPersonalizado() — Subqueries por señal

**Archivo:** `Services/MotorRecomendacion.php`  
**Impacto:** La query del feed incluye 6 subqueries correlacionadas por cada sample evaluado. Es el diseño fundamental del algoritmo, así que el fix es a nivel de índices, no de rewrite.

**Fix recomendado:**
- Asegurar índices en: `likes(tipo, target_id, created_at)`, `reproducciones(sample_id, created_at)`, `descargas(sample_id, created_at)`, `follows(seguidor_id, seguido_id)`
- Considerar materializar scores periódicamente en tabla cache

---

### P2-7. SamplesRepository::eliminarConCascada() — 5 DELETEs secuenciales

**Archivo:** `Database/Repositories/SamplesRepository.php`  
**Impacto:** 5 roundtrips a BD. Además de P1-6 (falta de transacción), es ineficiente.

**Fix:** `ON DELETE CASCADE` en las FKs, o agrupar en transacción con un solo roundtrip:
```sql
BEGIN;
DELETE FROM reproducciones WHERE sample_id = :id;
DELETE FROM descargas WHERE sample_id = :id;
DELETE FROM likes WHERE tipo = 'sample' AND target_id = :id;
DELETE FROM coleccion_samples WHERE sample_id = :id;
DELETE FROM samples WHERE id = :id;
COMMIT;
```

---

### P2-8. ColeccionesRepository::explorarPublicas() — Query compleja sin paginación eficiente

**Archivo:** `Database/Repositories/ColeccionesRepository.php` L93-177  
**Impacto:** La versión con algoritmo (usuario autenticado) ejecuta 2 CTEs + scoring con OFFSET. Para OFFSET alto, PostgreSQL escanea y descarta filas.

**Fix futuro:** Keyset pagination (`WHERE updated_at < :cursor`) en vez de OFFSET.

---

## P3 — Calidad y Consistencia

### P3-1. Estilo de placeholders inconsistente — LikesRepository

**Archivo:** `Database/Repositories/LikesRepository.php`  
**Detalle:** `likesDeUsuarioEnComentarios()` usa placeholders posicionales `?` mientras el resto del codebase usa named params `:param`.

**Fix:** Migrar a named params para consistencia.

---

### P3-2. DeduplicadorAudio::buscarFFmpeg() usa `$_ENV` directamente

**Archivo:** `Services/DeduplicadorAudio.php` L198  
**Código:**
```php
$envPath = $_ENV['FFMPEG_PATH'] ?? getenv('FFMPEG_PATH') ?: null;
```

**Contraste:** `ComentariosInteraccionController::obtenerFFmpegBin()` usa `defined('FFMPEG_PATH')` y `FFmpegDetector` usa una lógica más robusta con is_executable().

**Fix:** Reutilizar `FFmpegDetector::obtenerFFmpeg()` que ya existe y cubre Windows+Linux+env.

---

### P3-3. Enum strings hardcodeados en SQL — AdminRepository, ColeccionSamplesRepository

**Archivos:** Varios repositorios usan strings literales (`'activo'`, `'completed'`, `'pendiente'`) en lugar de constantes `XxxEnums::VALOR`.

**Nota:** El roadmap ya registra esto como TODO de la auditoría R63-R64. Los Cols/Enums generados cubren la mayoría, pero quedan residuales.

---

### P3-4. `DescargasStreamController` — exit() después de readfile()

**Archivo:** `Api/Controladores/DescargasStreamController.php` L96  
**Código:**
```php
readfile($rutaArchivo);
exit;
```

**Riesgo:** `exit` impide que WordPress ejecute hooks de shutdown. Generalmente necesario para streaming, pero debería documentarse que es intencional.

---

### P3-5. Patrón $_SERVER para IP sin filtro adicional

**Archivo:** `Api/Helpers/RateLimiter.php` L85-93  
**Código:**
```php
$headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
foreach ($headers as $header) {
    if (!empty($_SERVER[$header])) {
        $ip = explode(',', $_SERVER[$header])[0];
```

**Riesgo:** `X-Forwarded-For` es spoofeable si no hay proxy de confianza delante. Un atacante puede bypassear el rate limit enviando IPs aleatorias.

**Fix futuro:** Cuando se despliegue con Cloudflare/Nginx, confiar solo en `CF-Connecting-IP` o `X-Real-IP` y ignorar `X-Forwarded-For`. Agregar constante de configuración `TRUSTED_PROXY_HEADERS`.

---

## Hallazgos Positivos (bien hecho)

| Área | Detalle |
|------|---------|
| **PostgresService** | PDO con `ERRMODE_EXCEPTION` + `EMULATE_PREPARES=false`. Prepared statements en todos los métodos. SQL solo en logs cuando `WP_DEBUG` activo. SchemaRegistry validation. |
| **ProcesadorFFmpeg** | `escapeshellarg()` en TODAS las llamadas a `exec()`. Verificación de return code. |
| **DetectorBpm / DetectorTonalidad** | `escapeshellarg()` correcto. Temp files con cleanup. |
| **SamplesUploadController** | Validación MIME real con `finfo`, whitelist de formatos, rate limit, magic bytes check, precio validado. |
| **DescargasStreamController** | HMAC firmado con `hash_equals()` (timing-safe). Token temporal con expiración. |
| **AuthController** | Rate limit por IP, validación centralizada (Validador), no expone errores internos. |
| **PipelineAudio::actualizarSample()** | Whitelist de columnas permitidas (`$columnasPermitidas`). Modelo a seguir para otros repos. |
| **ConstructorSenales::sqlTendencias()** | Whitelist de intervalos válidos (`$ventanasValidas`). Fix P0 ya implementado. |
| **Sanitización** | Uso consistente de `sanitize_text_field`/`sanitize_textarea_field`/`esc_url_raw` en todos los controllers. |
| **Rate Limiting** | RateLimiter aplicado en login, registro, upload, follow, like, listado. |
| **Error handling** | `try-catch` con KamplesLogger en todos los controllers. No se encontraron catch vacíos. |

---

## Priorización de Correcciones

| Prioridad | IDs | Esfuerzo estimado | Impacto |
|-----------|-----|-------------------|---------|
| **INMEDIATO** | P0-1 | 15 min | Elimina command injection |
| **INMEDIATO** | P0-2, P0-3 | 20 min | Whitelist en repos previene futura SQL injection |
| **Sprint actual** | P1-1, P1-2 | 30 min | Defense-in-depth para interpolación de columnas |
| **Sprint actual** | P1-5, P1-6 | 20 min | Corrige silent failures y consistencia transaccional |
| **Próximo sprint** | P1-3, P1-7 | 45 min | Refactors de seguridad |
| **Backlog** | P2-1 a P2-8 | 3-4 horas | Optimización SQL |
| **Backlog** | P3-1 a P3-5 | 1 hora | Limpieza de código |

---

## Lecciones / Contexto para futuras sesiones

- [SQL INTERVAL]: PDO no soporta bind de INTERVAL. Solución: whitelist in-repo. NUNCA confiar en que el caller valida.
- [exec/shell_exec]: Todo el codebase usa `escapeshellarg()` EXCEPTO DeduplicadorAudio. Patrón a seguir: ProcesadorFFmpeg.
- [Command Injection]: `sprintf('"%s"', $var)` con comillas dobles NO es protección. Solo `escapeshellarg()` es seguro.
- [BaseRepository]: Los métodos `buscarDonde`/`contarDonde` interpolan keys de $condiciones. Es seguro porque siempre se usan Cols constants, pero carece de defense-in-depth.
- [Transacciones]: PostgresService no tiene begin/commit/rollback expuestos como métodos. Se necesita acceder al PDO directamente para transacciones multi-statement.
- [Counts atómicos]: `eliminarConCascada` debería usar transacción. Considerar ON DELETE CASCADE en el schema.
- [FFmpeg]: 4 archivos hacen exec() con FFmpeg. 3 usan escapeshellarg (correcto), 1 no (DeduplicadorAudio).
- [Hallazgo previo]: La auditoría SQL (R-AG-SQL) ya detectó 58 hallazgos. Este documento complementa con perspectiva de seguridad/command injection/patrones.
