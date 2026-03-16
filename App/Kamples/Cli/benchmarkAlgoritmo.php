<?php

/**
 * Benchmark detallado del algoritmo de recomendación.
 *
 * Mide tiempos de cada componente del pipeline: perfil, señales, query CTE,
 * normalización, cache. Ejecuta N iteraciones y calcula promedios.
 *
 * Ejecutar desde raíz de WordPress:
 *   php wp-content/themes/glorytemplate/App/Kamples/Cli/benchmarkAlgoritmo.php [userId] [iteraciones] [perPage]
 *
 * Ejemplo:
 *   php wp-content/themes/glorytemplate/App/Kamples/Cli/benchmarkAlgoritmo.php 1 5 30
 *
 * @package Kamples
 */

/* Prevenir ejecución web */
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Solo ejecución CLI');
}

/* Bootstrap WordPress */
$wpLoad = dirname(__DIR__, 5) . '/wp-load.php';
if (!file_exists($wpLoad)) {
    /* Fallback: buscar wp-load.php subiendo directorios */
    $dir = __DIR__;
    for ($i = 0; $i < 10; $i++) {
        $dir = dirname($dir);
        if (file_exists($dir . '/wp-load.php')) {
            $wpLoad = $dir . '/wp-load.php';
            break;
        }
    }
}
if (!file_exists($wpLoad)) {
    fwrite(STDERR, "ERROR: No se encontró wp-load.php\n");
    exit(1);
}
require_once $wpLoad;

use App\Kamples\Services\MotorRecomendacion;
use App\Kamples\Services\PerfilUsuario;
use App\Kamples\Services\ConstructorSenales;
use App\Kamples\Services\SelectorCandidatos;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;

/* Parámetros CLI */
$userId = (int) ($argv[1] ?? 1);
$iteraciones = (int) ($argv[2] ?? 5);
$perPage = (int) ($argv[3] ?? 30);

if ($iteraciones < 1) $iteraciones = 1;
if ($iteraciones > 20) $iteraciones = 20;
if ($perPage < 1) $perPage = 30;

/* Cargar config del algoritmo */
$configPath = dirname(__DIR__) . '/Config/algoritmoPesos.php';
$config = file_exists($configPath) ? require $configPath : [];
$pesos = $config['senales'] ?? [];
$params = $config['parametros'] ?? [];

/* Información del entorno */
$totalSamplesActivos = SelectorCandidatos::contarActivos();
$pgvectorActivo = SamplesRepository::verificarPgvector();
$umbralCandidatos = (int) ($config['candidatos']['umbral_activacion'] ?? 5000);
$usarPipeline = $totalSamplesActivos > $umbralCandidatos;

/* Detectar vista materializada trending */
$mvTrendingExiste = false;
try {
    $existe = SamplesRepository::consultarValor(
        "SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_trending_samples' LIMIT 1",
        []
    );
    $mvTrendingExiste = ($existe !== null);
} catch (\Throwable $e) {
    /* no disponible */
}

/* Versión del algoritmo: hash de los pesos para identificar config */
$versionAlgoritmo = substr(md5(json_encode($config['senales'] ?? []) . json_encode($config['parametros'] ?? [])), 0, 8);

echo "==========================================================\n";
echo "  BENCHMARK ALGORITMO DE RECOMENDACION - KAMPLES\n";
echo "==========================================================\n";
echo "Fecha:                " . date('Y-m-d H:i:s') . "\n";
echo "Usuario ID:           {$userId}\n";
echo "Iteraciones:          {$iteraciones}\n";
echo "Samples por pagina:   {$perPage}\n";
echo "Total samples activos:{$totalSamplesActivos}\n";
echo "pgvector activo:      " . ($pgvectorActivo ? 'SI' : 'NO') . "\n";
echo "Pipeline candidatos:  " . ($usarPipeline ? "SI (umbral {$umbralCandidatos})" : "NO (< {$umbralCandidatos})") . "\n";
echo "Vista mat. trending:  " . ($mvTrendingExiste ? 'SI' : 'NO') . "\n";
echo "Config version hash:  {$versionAlgoritmo}\n";
echo "Pesos: similitud={$pesos['similitud_contenido']}, comportamiento={$pesos['comportamiento']}, ";
echo "contexto={$pesos['contexto']}, tendencias={$pesos['tendencias']}, social={$pesos['grafo_social']}, novedad={$pesos['novedad']}\n";
echo "==========================================================\n\n";

/**
 * Mide el tiempo de ejecución de un callable en milisegundos.
 */
function medirMs(callable $fn): array
{
    $inicio = hrtime(true);
    $resultado = $fn();
    $fin = hrtime(true);
    $ms = ($fin - $inicio) / 1_000_000;
    return ['ms' => $ms, 'resultado' => $resultado];
}

/**
 * Invalida todos los caches del usuario para medir sin cache.
 */
function invalidarTodosLosCaches(int $userId): void
{
    MotorRecomendacion::invalidarCache($userId);
    delete_transient('kamples_perfil_usr_' . $userId);
    delete_transient('kamples_pgvector_activo');
}

/* ============================================================
 * FASE 1: Benchmark de componentes individuales
 * ============================================================ */
echo "--- FASE 1: Componentes individuales ---\n\n";

$resultadosComponentes = [];

for ($iter = 1; $iter <= $iteraciones; $iter++) {
    echo "Iteracion {$iter}/{$iteraciones}...\n";

    /* Limpiar caches antes de cada iteración */
    invalidarTodosLosCaches($userId);

    $tiempos = [];

    /* 1. Perfil de usuario */
    $m = medirMs(fn() => PerfilUsuario::construir($userId));
    $tiempos['perfil_usuario'] = $m['ms'];
    $perfilUsuario = $m['resultado'];
    /* Invalidar cache del perfil para la siguiente medición limpia */
    delete_transient('kamples_perfil_usr_' . $userId);

    /* 2. Conteo de samples activos */
    $m = medirMs(function () {
        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        return SamplesRepository::contarConFiltros("s.{$sEstado} = '{$eActivo}'", []);
    });
    $tiempos['conteo_activos'] = $m['ms'];

    /* 3. Verificación pgvector */
    delete_transient('kamples_pgvector_activo');
    $m = medirMs(fn() => SamplesRepository::verificarPgvector());
    $tiempos['verificar_pgvector'] = $m['ms'];

    /* 4. Señales individuales — construir SQL (no ejecutar, solo medir generación) */
    $queryParams = ['userId' => $userId, 'limit' => $perPage, 'offset' => 0];

    $m = medirMs(fn() => ConstructorSenales::sqlComportamiento($userId, $pesos['comportamiento'] ?? 0.27, $config, $queryParams));
    $tiempos['sql_gen_comportamiento'] = $m['ms'];

    $m = medirMs(fn() => ConstructorSenales::sqlContexto($userId, $pesos['contexto'] ?? 0.15, $perfilUsuario, $config, $queryParams));
    $tiempos['sql_gen_contexto'] = $m['ms'];

    $ventanas = $params['ventanas_tendencias'] ?? ['corta' => '24 hours'];
    $m = medirMs(fn() => ConstructorSenales::sqlTendencias($pesos['tendencias'] ?? 0.12, $ventanas, $config, $mvTrendingExiste));
    $tiempos['sql_gen_tendencias'] = $m['ms'];

    $m = medirMs(fn() => ConstructorSenales::sqlGrafoSocial($userId, $pesos['grafo_social'] ?? 0.10, $queryParams));
    $tiempos['sql_gen_social'] = $m['ms'];

    if ($pgvectorActivo) {
        $m = medirMs(fn() => ConstructorSenales::sqlSimilitudContenido($userId, $pesos['similitud_contenido'] ?? 0.28, $queryParams));
        $tiempos['sql_gen_similitud'] = $m['ms'];
    }

    /* 5. Pipeline de candidatos (si aplica) */
    if ($usarPipeline) {
        $candidatoParams = ['userId' => $userId, 'limit' => $perPage, 'offset' => 0];
        $m = medirMs(fn() => SelectorCandidatos::seleccionar($userId, $perfilUsuario, $candidatoParams, $config));
        $tiempos['pipeline_candidatos_sql'] = $m['ms'];
    }

    /* 6. Feed completo (sin cache) — es la medición más importante */
    invalidarTodosLosCaches($userId);
    $m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, 0));
    $tiempos['feed_completo_pag1'] = $m['ms'];
    $resultadosPag1 = $m['resultado'];

    /* 7. Feed página 2 (sin cache) */
    invalidarTodosLosCaches($userId);
    $m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, $perPage));
    $tiempos['feed_completo_pag2'] = $m['ms'];

    /* 8. Feed página 3 */
    invalidarTodosLosCaches($userId);
    $m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, $perPage * 2));
    $tiempos['feed_completo_pag3'] = $m['ms'];

    /* 9. Feed CON cache (medir latencia de cache hit) */
    $m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, $perPage * 2));
    $tiempos['feed_cache_hit'] = $m['ms'];

    $resultadosComponentes[] = $tiempos;
}

/* ============================================================
 * FASE 2: Calcular promedios, min, max
 * ============================================================ */
echo "\n--- FASE 2: Resultados ---\n\n";

$metricas = array_keys($resultadosComponentes[0]);
$promedios = [];
$minimos = [];
$maximos = [];
$desvEstandar = [];

foreach ($metricas as $metrica) {
    $valores = array_map(fn($r) => $r[$metrica], $resultadosComponentes);
    $promedios[$metrica] = array_sum($valores) / count($valores);
    $minimos[$metrica] = min($valores);
    $maximos[$metrica] = max($valores);
    /* Desviación estándar */
    $media = $promedios[$metrica];
    $sumaCuadrados = array_sum(array_map(fn($v) => ($v - $media) ** 2, $valores));
    $desvEstandar[$metrica] = sqrt($sumaCuadrados / count($valores));
}

/* Tabla de resultados */
$etiquetas = [
    'perfil_usuario' => 'PerfilUsuario::construir (sin cache)',
    'conteo_activos' => 'SamplesRepository::contarConFiltros',
    'verificar_pgvector' => 'SamplesRepository::verificarPgvector',
    'sql_gen_comportamiento' => 'SQL gen: Comportamiento (0.27)',
    'sql_gen_contexto' => 'SQL gen: Contexto (0.15)',
    'sql_gen_tendencias' => 'SQL gen: Tendencias (0.12)',
    'sql_gen_social' => 'SQL gen: Grafo Social (0.10)',
    'sql_gen_similitud' => 'SQL gen: Similitud pgvector (0.28)',
    'pipeline_candidatos_sql' => 'Pipeline Candidatos (SQL gen)',
    'feed_completo_pag1' => 'FEED COMPLETO pag1 (sin cache)',
    'feed_completo_pag2' => 'FEED COMPLETO pag2 (sin cache)',
    'feed_completo_pag3' => 'FEED COMPLETO pag3 (sin cache)',
    'feed_cache_hit' => 'FEED cache hit (con cache)',
];

echo "+-------------------------------------------------------+----------+----------+----------+----------+\n";
echo "| Componente                                            | Prom(ms) | Min(ms)  | Max(ms)  | Desv(ms) |\n";
echo "+-------------------------------------------------------+----------+----------+----------+----------+\n";

foreach ($metricas as $metrica) {
    $etiqueta = $etiquetas[$metrica] ?? $metrica;
    printf(
        "| %-53s | %8.2f | %8.2f | %8.2f | %8.2f |\n",
        $etiqueta,
        $promedios[$metrica],
        $minimos[$metrica],
        $maximos[$metrica],
        $desvEstandar[$metrica]
    );
}

echo "+-------------------------------------------------------+----------+----------+----------+----------+\n";

/* ============================================================
 * FASE 3: Benchmark de TODAS las páginas secuenciales
 * ============================================================ */
echo "\n--- FASE 3: Todas las paginas (1 iteracion completa) ---\n\n";

invalidarTodosLosCaches($userId);
$paginasTiempos = [];
$pagina = 1;
$maxPaginas = (int) ceil($totalSamplesActivos / $perPage);
if ($maxPaginas > 50) $maxPaginas = 50; /* Limitar a 50 páginas */

echo "+--------+----------+----------+\n";
echo "| Pagina | Tiempo   | Samples  |\n";
echo "+--------+----------+----------+\n";

$tiempoTotalPaginas = 0;
$totalSamplesServidos = 0;

for ($pag = 1; $pag <= $maxPaginas; $pag++) {
    $offsetPag = ($pag - 1) * $perPage;
    invalidarTodosLosCaches($userId);

    $m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, $offsetPag));
    $count = count($m['resultado']);
    $paginasTiempos[$pag] = ['ms' => $m['ms'], 'samples' => $count];
    $tiempoTotalPaginas += $m['ms'];
    $totalSamplesServidos += $count;

    printf("| %6d | %7.1fms | %8d |\n", $pag, $m['ms'], $count);

    if ($count === 0) {
        echo "| -- FIN: 0 resultados, no hay mas paginas --          |\n";
        break;
    }
}

echo "+--------+----------+----------+\n";
printf("| TOTAL  | %7.0fms | %8d |\n", $tiempoTotalPaginas, $totalSamplesServidos);
echo "+--------+----------+----------+\n";

/* ============================================================
 * FASE 4: Resumen EXPLAIN del query principal
 * ============================================================ */
echo "\n--- FASE 4: EXPLAIN ANALYZE del feed pag1 ---\n\n";

try {
    /* Construir la misma query que feedPersonalizado pero con EXPLAIN ANALYZE */
    invalidarTodosLosCaches($userId);
    $perfilExplain = PerfilUsuario::construir($userId);

    $queryParamsExplain = ['userId' => $userId, 'limit' => $perPage, 'offset' => 0];
    $additiveParts = [];

    $pesoComportamiento = $pesos['comportamiento'] ?? 0.27;
    if ($pesoComportamiento > 0) {
        $additiveParts[] = ConstructorSenales::sqlComportamiento($userId, $pesoComportamiento, $config, $queryParamsExplain);
    }
    $pesoContexto = $pesos['contexto'] ?? 0.15;
    if ($pesoContexto > 0) {
        $additiveParts[] = ConstructorSenales::sqlContexto($userId, $pesoContexto, $perfilExplain, $config, $queryParamsExplain);
    }
    $pesoTendencias = $pesos['tendencias'] ?? 0.12;
    if ($pesoTendencias > 0) {
        $ventanas = $params['ventanas_tendencias'] ?? ['corta' => '24 hours'];
        $additiveParts[] = ConstructorSenales::sqlTendencias($pesoTendencias, $ventanas, $config, $mvTrendingExiste);
    }
    $pesoNovedad = $pesos['novedad'] ?? 0.08;
    if ($pesoNovedad > 0) {
        $diasBoost = (int) ($params['novedad_dias_boost'] ?? 14);
        $sPubAt = SamplesCols::PUBLICADO_AT;
        $additiveParts[] = "({$pesoNovedad} * GREATEST(0, 1 - LN(GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) / 86400)) / LN({$diasBoost})))";
    }
    $pesoSocial = $pesos['grafo_social'] ?? 0.10;
    if ($pesoSocial > 0) {
        $additiveParts[] = ConstructorSenales::sqlGrafoSocial($userId, $pesoSocial, $queryParamsExplain);
    }
    if ($pgvectorActivo) {
        $pesoSimilitud = $pesos['similitud_contenido'] ?? 0.28;
        if ($pesoSimilitud > 0) {
            $sqlSim = ConstructorSenales::sqlSimilitudContenido($userId, $pesoSimilitud, $queryParamsExplain);
            if ($sqlSim !== '0') {
                $additiveParts[] = $sqlSim;
            }
        }
    }
    $scoreAditivo = !empty($additiveParts) ? '(' . implode(' + ', $additiveParts) . ')' : '1';

    /* Obtener EXPLAIN ANALYZE del conteo (una de las queries que ejecuta siempre) */
    $sEstado = SamplesCols::ESTADO;
    $eActivo = SamplesEnums::ESTADO_ACTIVO;
    $ts = SamplesCols::TABLA;

    $explainConteo = SamplesRepository::consultar(
        "EXPLAIN ANALYZE SELECT COUNT(*) FROM {$ts} s WHERE s.{$sEstado} = :estado",
        ['estado' => $eActivo]
    );
    echo "EXPLAIN conteo activos:\n";
    foreach ($explainConteo as $row) {
        $line = reset($row);
        echo "  {$line}\n";
    }
} catch (\Throwable $e) {
    echo "Error en EXPLAIN: " . $e->getMessage() . "\n";
}

/* ============================================================
 * FASE 5: Resumen final para copiar al MD
 * ============================================================ */
echo "\n==========================================================\n";
echo "  RESUMEN PARA DOCUMENTACION\n";
echo "==========================================================\n";
echo "Fecha:                " . date('Y-m-d H:i:s') . "\n";
echo "Config hash:          {$versionAlgoritmo}\n";
echo "Samples activos:      {$totalSamplesActivos}\n";
echo "pgvector:             " . ($pgvectorActivo ? 'SI' : 'NO') . "\n";
echo "Pipeline candidatos:  " . ($usarPipeline ? 'SI' : 'NO') . "\n";
echo "MV trending:          " . ($mvTrendingExiste ? 'SI' : 'NO') . "\n";
echo "Iteraciones:          {$iteraciones}\n";
echo "Samples/pagina:       {$perPage}\n";
echo "\n";
echo "TIEMPOS PROMEDIO (sin cache):\n";
echo "  Feed pag1:          " . number_format($promedios['feed_completo_pag1'], 1) . "ms\n";
echo "  Feed pag2:          " . number_format($promedios['feed_completo_pag2'], 1) . "ms\n";
echo "  Feed pag3:          " . number_format($promedios['feed_completo_pag3'], 1) . "ms\n";
echo "  Cache hit:          " . number_format($promedios['feed_cache_hit'], 1) . "ms\n";
echo "  Perfil usuario:     " . number_format($promedios['perfil_usuario'], 1) . "ms\n";
echo "  Conteo activos:     " . number_format($promedios['conteo_activos'], 1) . "ms\n";
echo "\n";
echo "Total paginas medidas:" . count($paginasTiempos) . "\n";
echo "Total samples:        {$totalSamplesServidos}\n";
echo "Tiempo total paginas: " . number_format($tiempoTotalPaginas, 0) . "ms\n";
echo "==========================================================\n";
