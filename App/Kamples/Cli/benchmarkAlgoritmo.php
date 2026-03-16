<?php

/**
 * Benchmark detallado del algoritmo de recomendacion — Kamples.
 *
 * Mide tiempos de cada componente del pipeline: perfil, senales, query CTE.
 * Ejecucion unica, controlada, con timeout de seguridad.
 *
 * Ejecutar dentro del contenedor WordPress:
 *   php wp-content/themes/glorytemplate/App/Kamples/Cli/benchmarkAlgoritmo.php [userId] [perPage]
 *
 * @package Kamples
 */

/* Prevenir ejecucion web */
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Solo ejecucion CLI');
}

/* Timeout: 120s max para todo el proceso */
set_time_limit(120);
if (function_exists('pcntl_alarm')) {
    pcntl_alarm(120);
    pcntl_signal(SIGALRM, function () {
        fwrite(STDERR, "\n[TIMEOUT] Benchmark abortado tras 120s.\n");
        exit(2);
    });
}

/* Bootstrap WordPress */
$wpLoad = dirname(__DIR__, 5) . '/wp-load.php';
if (!file_exists($wpLoad)) {
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
    fwrite(STDERR, "ERROR: No se encontro wp-load.php\n");
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

/* Parametros CLI */
$userId = (int) ($argv[1] ?? 1);
$perPage = (int) ($argv[2] ?? 30);
if ($perPage < 1) $perPage = 30;

/* Timeout PG: 30s por query */
try {
    SamplesRepository::ejecutar("SET statement_timeout = '30000'", []);
} catch (\Throwable $e) {
    /* No critico */
}

/* Config */
$configPath = dirname(__DIR__) . '/Config/algoritmoPesos.php';
$config = file_exists($configPath) ? require $configPath : [];
$pesos = $config['senales'] ?? [];
$params = $config['parametros'] ?? [];

/* Info entorno */
$totalSamplesActivos = SelectorCandidatos::contarActivos();
$pgvectorActivo = SamplesRepository::verificarPgvector();
$umbralCandidatos = (int) ($config['candidatos']['umbral_activacion'] ?? 5000);
$usarPipeline = $totalSamplesActivos > $umbralCandidatos;

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

$versionAlgoritmo = substr(md5(json_encode($pesos) . json_encode($params)), 0, 8);

echo "==========================================================\n";
echo "  BENCHMARK ALGORITMO — KAMPLES (ejecucion unica)\n";
echo "==========================================================\n";
echo "Fecha:                " . date('Y-m-d H:i:s') . "\n";
echo "Usuario ID:           {$userId}\n";
echo "Samples por pagina:   {$perPage}\n";
echo "Total samples activos:{$totalSamplesActivos}\n";
echo "pgvector activo:      " . ($pgvectorActivo ? 'SI' : 'NO') . "\n";
echo "Pipeline candidatos:  " . ($usarPipeline ? "SI (>{$umbralCandidatos})" : "NO (<{$umbralCandidatos})") . "\n";
echo "Vista mat. trending:  " . ($mvTrendingExiste ? 'SI' : 'NO') . "\n";
echo "Config version:       {$versionAlgoritmo}\n";
echo "Pesos: sim=" . ($pesos['similitud_contenido'] ?? '?');
echo " comp=" . ($pesos['comportamiento'] ?? '?');
echo " ctx=" . ($pesos['contexto'] ?? '?');
echo " trend=" . ($pesos['tendencias'] ?? '?');
echo " social=" . ($pesos['grafo_social'] ?? '?');
echo " nov=" . ($pesos['novedad'] ?? '?') . "\n";
echo "Timeout: 120s proceso / 30s por query PG\n";
echo "==========================================================\n\n";

function medirMs(callable $fn): array
{
    $inicio = hrtime(true);
    $resultado = $fn();
    $fin = hrtime(true);
    return ['ms' => ($fin - $inicio) / 1_000_000, 'resultado' => $resultado];
}

function invalidarCaches(int $userId): void
{
    MotorRecomendacion::invalidarCache($userId);
    delete_transient('kamples_perfil_usr_' . $userId);
    delete_transient('kamples_pgvector_activo');
    delete_transient('kamples_total_activos');
}

$tiempos = [];

echo "[1/8] Perfil usuario (sin cache)...\n";
invalidarCaches($userId);
$m = medirMs(fn() => PerfilUsuario::construir($userId));
$tiempos['perfil_usuario'] = $m['ms'];
$perfilUsuario = $m['resultado'];
echo "      " . number_format($m['ms'], 1) . "ms\n";

echo "[2/8] Conteo samples activos...\n";
delete_transient('kamples_total_activos');
$m = medirMs(function () {
    $sEstado = SamplesCols::ESTADO;
    $eActivo = SamplesEnums::ESTADO_ACTIVO;
    return SamplesRepository::contarConFiltros("s.{$sEstado} = '{$eActivo}'", []);
});
$tiempos['conteo_activos'] = $m['ms'];
echo "      " . number_format($m['ms'], 1) . "ms ({$m['resultado']} samples)\n";

echo "[3/8] Verificacion pgvector...\n";
delete_transient('kamples_pgvector_activo');
$m = medirMs(fn() => SamplesRepository::verificarPgvector());
$tiempos['verificar_pgvector'] = $m['ms'];
echo "      " . number_format($m['ms'], 1) . "ms\n";

echo "[4/8] Generacion SQL senales...\n";
$qp = ['userId' => $userId, 'limit' => $perPage, 'offset' => 0];

$m = medirMs(fn() => ConstructorSenales::sqlComportamiento($userId, $pesos['comportamiento'] ?? 0.27, $config, $qp));
$tiempos['sql_comportamiento'] = $m['ms'];
echo "      Comportamiento: " . number_format($m['ms'], 2) . "ms\n";

$qp2 = ['userId' => $userId, 'limit' => $perPage, 'offset' => 0];
$m = medirMs(fn() => ConstructorSenales::sqlContexto($userId, $pesos['contexto'] ?? 0.15, $perfilUsuario, $config, $qp2));
$tiempos['sql_contexto'] = $m['ms'];
echo "      Contexto:       " . number_format($m['ms'], 2) . "ms\n";

$ventanas = $params['ventanas_tendencias'] ?? ['corta' => '24 hours'];
$m = medirMs(fn() => ConstructorSenales::sqlTendencias($pesos['tendencias'] ?? 0.12, $ventanas, $config, $mvTrendingExiste));
$tiempos['sql_tendencias'] = $m['ms'];
echo "      Tendencias:     " . number_format($m['ms'], 2) . "ms\n";

$qp3 = ['userId' => $userId, 'limit' => $perPage, 'offset' => 0];
$m = medirMs(fn() => ConstructorSenales::sqlGrafoSocial($userId, $pesos['grafo_social'] ?? 0.10, $qp3));
$tiempos['sql_social'] = $m['ms'];
echo "      Grafo social:   " . number_format($m['ms'], 2) . "ms\n";

if ($pgvectorActivo) {
    $qp4 = ['userId' => $userId, 'limit' => $perPage, 'offset' => 0];
    $m = medirMs(fn() => ConstructorSenales::sqlSimilitudContenido($userId, $pesos['similitud_contenido'] ?? 0.28, $qp4));
    $tiempos['sql_similitud'] = $m['ms'];
    echo "      Similitud:      " . number_format($m['ms'], 2) . "ms\n";
}

echo "[5/8] FEED pag 1 (sin cache)...\n";
invalidarCaches($userId);
$m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, 0));
$tiempos['feed_pag1'] = $m['ms'];
$countPag1 = count($m['resultado']);
echo "      " . number_format($m['ms'], 1) . "ms ({$countPag1} samples)\n";

echo "[6/8] FEED pag 2 (sin cache)...\n";
invalidarCaches($userId);
$m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, $perPage));
$tiempos['feed_pag2'] = $m['ms'];
echo "      " . number_format($m['ms'], 1) . "ms (" . count($m['resultado']) . " samples)\n";

echo "[7/8] FEED pag 3 (sin cache)...\n";
invalidarCaches($userId);
$m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, $perPage * 2));
$tiempos['feed_pag3'] = $m['ms'];
echo "      " . number_format($m['ms'], 1) . "ms (" . count($m['resultado']) . " samples)\n";

echo "[8/8] FEED pag 3 con cache (hit)...\n";
$m = medirMs(fn() => MotorRecomendacion::feedPersonalizado($userId, $perPage, $perPage * 2));
$tiempos['feed_cache_hit'] = $m['ms'];
echo "      " . number_format($m['ms'], 1) . "ms\n";

/* ===== TABLA ===== */
echo "\n+----------------------------------------------------+----------+\n";
echo "| Componente                                         | Tiempo   |\n";
echo "+----------------------------------------------------+----------+\n";

$etiquetas = [
    'perfil_usuario'     => 'PerfilUsuario::construir (sin cache)',
    'conteo_activos'     => 'Conteo samples activos (SQL COUNT)',
    'verificar_pgvector' => 'Verificacion pgvector',
    'sql_comportamiento' => 'SQL gen: Comportamiento (' . ($pesos['comportamiento'] ?? '?') . ')',
    'sql_contexto'       => 'SQL gen: Contexto (' . ($pesos['contexto'] ?? '?') . ')',
    'sql_tendencias'     => 'SQL gen: Tendencias (' . ($pesos['tendencias'] ?? '?') . ')',
    'sql_social'         => 'SQL gen: Grafo Social (' . ($pesos['grafo_social'] ?? '?') . ')',
    'sql_similitud'      => 'SQL gen: Similitud pgvector (' . ($pesos['similitud_contenido'] ?? '?') . ')',
    'feed_pag1'          => '>> FEED pag1 sin cache <<',
    'feed_pag2'          => '>> FEED pag2 sin cache <<',
    'feed_pag3'          => '>> FEED pag3 sin cache <<',
    'feed_cache_hit'     => 'Feed pag3 cache hit',
];

foreach ($tiempos as $key => $ms) {
    $label = $etiquetas[$key] ?? $key;
    printf("| %-50s | %7.1fms |\n", $label, $ms);
}

$feedProm = ($tiempos['feed_pag1'] + $tiempos['feed_pag2'] + $tiempos['feed_pag3']) / 3;
echo "+----------------------------------------------------+----------+\n";
printf("| %-50s | %7.1fms |\n", 'PROMEDIO feed sin cache (3 pags)', $feedProm);
echo "+----------------------------------------------------+----------+\n";

/* Resumen compacto */
echo "\n=== RESUMEN (para documentacion) ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . " | Config: {$versionAlgoritmo}\n";
echo "Samples: {$totalSamplesActivos} | pgvector: " . ($pgvectorActivo ? 'SI' : 'NO');
echo " | Pipeline: " . ($usarPipeline ? 'SI' : 'NO') . "\n";
echo "Feed pag1: " . number_format($tiempos['feed_pag1'], 0) . "ms";
echo " | pag2: " . number_format($tiempos['feed_pag2'], 0) . "ms";
echo " | pag3: " . number_format($tiempos['feed_pag3'], 0) . "ms";
echo " | promedio: " . number_format($feedProm, 0) . "ms";
echo " | cache: " . number_format($tiempos['feed_cache_hit'], 0) . "ms\n";
echo "Perfil: " . number_format($tiempos['perfil_usuario'], 0) . "ms";
echo " | Conteo: " . number_format($tiempos['conteo_activos'], 0) . "ms\n";
echo "=== FIN ===\n";
