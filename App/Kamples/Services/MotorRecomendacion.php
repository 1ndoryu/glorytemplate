<?php
namespace App\Kamples\Services;

/* sentinel-disable-file limite-lineas: orquestador central del feed con cache, scoring, fallback y warmup; fragmentarlo completo en esta tarea mezclaría una refactorización estructural mucho mayor que 173A-6. */

/**
 * MotorRecomendacion — Orquestador de scoring y recomendación v3.
 *
 * A01 SOLID split: Lógica de señales extraída a ConstructorSenales,
 * perfil de usuario extraído a PerfilUsuario.
 * Este archivo conserva la orquestación (feed, cache, similares).
 *
 * 6 señales: Similitud contenido (0.25), Comportamiento (0.25),
 * Contexto (0.15), Tendencias (0.15), Grafo social (0.10), Novedad (0.10).
 *
 * Cache: WP transients con invalidación al publicar/interactuar.
 *
 * @package Kamples
 */

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Services\ConstructorSenales;
use App\Kamples\Services\PrecomputadorFeed;
use App\Kamples\Services\PerfilUsuario;
use App\Kamples\Services\SelectorCandidatos;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Kamples\Database\Repositories\BloqueosRepository;
use App\Kamples\Services\ServicioCache;
use App\Kamples\Services\AlgoTimingLogger;
use App\Kamples\LogAlgoritmo as KamplesLogger;

class MotorRecomendacion
{
    private static ?array $pesos = null;
    private static ?bool $pgvectorDisponible = null;
    /* [183A-89] Filosofía de cache del feed: para usuarios activos escuchando
     * samples, el feed debe actualizarse cada 5 minutos para maximizar el
     * descubrimiento. El stale-while-revalidate (6h) garantiza respuesta
     * instantánea mientras se recalcula en background. Recálculo completo
     * (con pgvector/embeddings) ocurre cada 1h de actividad (ver frecuencia
     * en algoritmoPesos.php). PerfilUsuario: 30min (ya alineado). */
    private const CACHE_TTL = 300; /* 5 minutos — pagina 1 */
    private const CACHE_TTL_PAGINADOS = 900; /* 15 minutos — paginas subsecuentes */
    private const CACHE_PREFIX = 'kamples_feed_';
    private const CACHE_STALE_PREFIX = 'kamples_feed_stale_';
    private const CACHE_STALE_TTL = 7200; /* 2 horas — escudo stale para primera pagina */
    /* [183A-86] Stale TTL igualado a pag1 (6h). Con TTL desigual (1h vs 6h),
     * entre la hora 1-6 pag1 tiene stale (viejo seed) pero pag2 no → pag2
     * se recalcula con nuevo seed → dedup descarta todo → paginación rota. */
    private const CACHE_STALE_TTL_PAGINAS = 7200;
    private const WARM_LOCK_PREFIX = 'kamples_warm_feed_';
    private const LIMITES_WARM_PRIMERA_PAGINA = [12, 30];
    /* [183A-80] Máximo de páginas a pre-computar en una sola query (OFFSET 0).
     * Elimina el cuello de botella de OFFSET en pag2/3: PostgreSQL no puede usar
     * top-N heapsort con OFFSET > 0, forzando un full sort de TODOS los samples.
     * Bulk-fetch: 1 query LIMIT (limite*3) OFFSET 0 → split + cache por página. */
    private const PAGINAS_BULK = 3;

    private static function cacheKey(int $userId, int $limite, int $offset): string
    {
        return self::CACHE_PREFIX . $userId . '_' . $limite . '_' . $offset;
    }

    /* [183A-30] staleCacheKey acepta offset para cubrir paginas 2+ con stale-while-revalidate. */
    private static function staleCacheKey(int $userId, int $limite, int $offset = 0): string
    {
        return self::CACHE_STALE_PREFIX . $userId . '_' . $limite . '_' . $offset;
    }

    /* [183A-30] warmLockKey acepta offset para evitar doble-warm de la misma pagina. */
    private static function warmLockKey(int $userId, int $limite, int $offset = 0): string
    {
        if ($offset === 0) {
            return self::WARM_LOCK_PREFIX . $userId . '_' . $limite;
        }
        return self::WARM_LOCK_PREFIX . $userId . '_' . $limite . '_' . $offset;
    }

    private static function guardarResultadoEnCache(int $userId, int $limite, int $offset, array $resultado): void
    {
        if (empty($resultado)) {
            return;
        }

        $ttl = $offset === 0 ? self::CACHE_TTL : self::CACHE_TTL_PAGINADOS;
        ServicioCache::guardar(self::cacheKey($userId, $limite, $offset), $resultado, $ttl);

        /* [173A-6] Copia stale de p1 para responder en ~1ms mientras recalcula.
         * [183A-30] Extendido a paginas 2+: 1h de stale en vez de 6h (datos menos criticos). */
        if ($offset === 0) {
            ServicioCache::guardar(self::staleCacheKey($userId, $limite, 0), $resultado, self::CACHE_STALE_TTL);
        } else {
            ServicioCache::guardar(self::staleCacheKey($userId, $limite, $offset), $resultado, self::CACHE_STALE_TTL_PAGINAS);
        }
    }

    /**
     * [183A-30] Programa el recalculo de cualquier pagina del feed en post-respuesta.
     * Generaliza programarWarmPrimeraPagina para cubrir paginas 2+.
     * En PHP-FPM usa fastcgi_finish_request para no bloquear al usuario.
     */
    private static function programarWarm(int $userId, int $limite, int $offset): void
    {
        if (PHP_SAPI === 'cli' || !ServicioCache::adquirirLock(self::warmLockKey($userId, $limite, $offset), 90)) {
            return;
        }

        add_action('shutdown', function () use ($userId, $limite, $offset) {
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            } else {
                ignore_user_abort(true);
                if (session_id()) {
                    session_write_close();
                }
                if (!headers_sent()) {
                    header('Connection: close');
                }
                while (ob_get_level() > 0) {
                    ob_end_flush();
                }
                flush();
            }

            try {
                self::feedPersonalizado($userId, $limite, $offset, false);
            } catch (\Throwable $e) {
                KamplesLogger::warning('Algoritmo: Warm async fallo', [
                    'userId' => $userId,
                    'limite' => $limite,
                    'offset' => $offset,
                    'error' => $e->getMessage(),
                ]);
            } finally {
                ServicioCache::liberarLock(self::warmLockKey($userId, $limite, $offset));
            }
        }, 0);
    }

    /* Retrocompatibilidad: mantener el nombre anterior apuntando al nuevo metodo. */
    private static function programarWarmPrimeraPagina(int $userId, int $limite): void
    {
        self::programarWarm($userId, $limite, 0);
    }

    /**
     * Proxy retrocompatible: delega a ConstructorSenales::sqlTagsEnriquecidos.
     * @deprecated Usar ConstructorSenales::sqlTagsEnriquecidos() directamente.
     */
    public static function sqlTagsEnriquecidos(string $alias): string
    {
        return ConstructorSenales::sqlTagsEnriquecidos($alias);
    }

    /**
     * Carga los pesos desde el archivo de configuración.
     */
    private static function cargarPesos(): array
    {
        if (self::$pesos === null) {
            $ruta = \dirname(__DIR__) . '/Config/algoritmoPesos.php';
            self::$pesos = \file_exists($ruta) ? require $ruta : [];
        }
        return self::$pesos;
    }

    /**
     * Verifica si pgvector está disponible y configurado.
     * Se cachea en memoria + WP transient para no consultar en cada request.
     */
    private static function pgvectorActivo(): bool
    {
        if (self::$pgvectorDisponible !== null) return self::$pgvectorDisponible;

        /* Cache en Redis/transient para evitar query SQL por request */
        $cached = ServicioCache::obtener('kamples_pgvector_activo');
        if ($cached !== false) {
            self::$pgvectorDisponible = ($cached === '1');
            return self::$pgvectorDisponible;
        }

        self::$pgvectorDisponible = SamplesRepository::verificarPgvector();
        ServicioCache::guardar('kamples_pgvector_activo', self::$pgvectorDisponible ? '1' : '0', 3600);
        return self::$pgvectorDisponible;
    }

    /**
     * Feed personalizado para el usuario autenticado.
     * Combina todas las señales disponibles con pesos configurables.
     * Implementa cache con WP transients para reducir carga SQL.
     *
     * REGLAS FUNDAMENTALES DEL ALGORITMO (no negociables):
     * 1. TODOS los samples activos deben evaluarse. No existe "viejo = malo".
     *    Los samples no pierden calidad por antigüedad ni fecha de subida.
     *    No hay un rango temporal que determine si un sample "vale" o no.
     * 2. La ÚNICA razón legítima para excluir un sample del scoring es
     *    desinterés activo demostrado por el usuario (5+ reproducciones en
     *    30 días sin like/encanta). Esto se implementa en CTE ignored_samples.
     * 3. Optimizar sin sacrificar calidad: bulk-fetch (PAGINAS_BULK), cache
     *    stale-while-revalidate, CTEs pre-computados. Nunca recortar el
     *    candidate set por métricas globales ni popularidad mínima.
     * 4. El sistema debe escalar a muchos usuarios sin colapsar: un usuario
     *    nuevo no debe degradar la experiencia de usuarios existentes.
     */
    public static function feedPersonalizado(int $userId, int $limite = 20, int $offset = 0, bool $permitirStale = true): array
    {
        KamplesLogger::info('Algoritmo: feedPersonalizado iniciado', [
            'userId' => $userId, 'limite' => $limite, 'offset' => $offset,
        ]);

        /* Intentar leer de cache (todas las páginas) */
        $cacheKey = self::cacheKey($userId, $limite, $offset);
        $cached = ServicioCache::obtener($cacheKey);
        if ($cached !== false && \is_array($cached)) {
            KamplesLogger::debug('Algoritmo: Sirviendo desde cache', [
                'cacheKey' => $cacheKey, 'resultados' => \count($cached),
            ]);
            return $cached;
        }

        /* [173A-6] p1: paint ligero con stale, recalcula tras respuesta.
         * [183A-30] Extendido a paginas 2+: misma logica, TTL stale 1h en vez de 6h. */
        if ($permitirStale) {
            $stale = ServicioCache::obtener(self::staleCacheKey($userId, $limite, $offset));
            if ($stale !== false && \is_array($stale)) {
                self::programarWarm($userId, $limite, $offset);
                return $stale;
            }
        }

        /* [183A-86] Stampede protection: lock unificado para todo el rango bulk.
         * Sin esto, pag2 obtiene un lock diferente al de pag1, permitiendo
         * bulk-fetches concurrentes con seeds RANDOM() distintas.
         * El dedup del frontend descarta los duplicados → pag2 parece vacía. */
        $maxBulkOffset = $limite * (self::PAGINAS_BULK - 1);
        $esBulkRango = $offset <= $maxBulkOffset;
        $lockOffset = $esBulkRango ? 0 : $offset;
        $lockKey = 'kamples_lock_feed_' . $userId . '_' . $limite . '_' . $lockOffset;
        $lockAdquirido = ServicioCache::adquirirLock($lockKey, 30);

        if (!$lockAdquirido) {
            /* [183A-86] Para páginas bulk, esperar hasta 500ms (el bulk tarda ~37ms)
             * con reintentos de cache cada 50ms. Para páginas individuales, 80ms simple. */
            if ($esBulkRango) {
                for ($intento = 0; $intento < 10; $intento++) {
                    \usleep(50000);
                    $cached = ServicioCache::obtener($cacheKey);
                    if ($cached !== false && \is_array($cached)) {
                        return $cached;
                    }
                }
            } else {
                \usleep(80000);
                $cached = ServicioCache::obtener($cacheKey);
                if ($cached !== false && \is_array($cached)) {
                    return $cached;
                }
            }
        }

        try {
            $config = self::cargarPesos();
            $pesos = $config['senales'] ?? [];
            $params = $config['parametros'] ?? [];

            /* [2003A-3] Iniciar medicion de timing — solo para userId 1, no-op para el resto */
            AlgoTimingLogger::iniciar($userId);

            /* Obtener perfil de preferencias del usuario */
            $perfilUsuario = PerfilUsuario::construir($userId);
            AlgoTimingLogger::marcar($userId, 'perfilUsuario');

            if (empty($perfilUsuario['interacciones']) && ($params['min_interacciones'] ?? 5) > 0) {
                KamplesLogger::info('Algoritmo: Usuario nuevo sin interacciones, usando feed de tendencias', [
                    'userId' => $userId, 'interacciones' => $perfilUsuario['interacciones'] ?? 0,
                ]);
                $resultado = self::feedNuevoUsuario($limite, $offset, $userId);
                self::guardarResultadoEnCache($userId, $limite, $offset, $resultado);
                return $resultado;
            }

            $queryParams = ['limit' => $limite, 'offset' => $offset];

                /*
                 * Construir query SQL con scoring multi-señal.
                 * Cada señal genera una sub-expresión SQL ponderada (delegada a ConstructorSenales).
                 */

                /*
                 * Opt-8: Detectar si la vista materializada mv_trending_samples existe.
                 * Si existe, sqlTendencias() la usará en vez de 4 subqueries correlacionadas.
                 * Cache de 1h para no consultar pg_matviews en cada request.
                 */
            $usarVistaMatTrending = (bool) ServicioCache::obtener('kamples_mv_trending_existe');
            if (!$usarVistaMatTrending) {
                try {
                    $existe = SamplesRepository::consultarValor(
                        "SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_trending_samples' LIMIT 1",
                        []
                    );
                    $usarVistaMatTrending = ($existe !== null);
                    if ($usarVistaMatTrending) {
                        ServicioCache::guardar('kamples_mv_trending_existe', 1, HOUR_IN_SECONDS);
                    }
                } catch (\Throwable $e) {
                    $usarVistaMatTrending = false;
                }
            }
            $additiveParts = [];

        /* Señal 1: Comportamiento — 5 sub-factores ponderados */
        $pesoComportamiento = $pesos['comportamiento'] ?? 0.25;
        if ($pesoComportamiento > 0) {
            $additiveParts[] = PrecomputadorFeed::sqlComportamiento($pesoComportamiento, $config);
        }

        /* Señal 2: Contexto — BPM proximidad, key match, género match, tipo match */
        $pesoContexto = $pesos['contexto'] ?? 0.15;
        if ($pesoContexto > 0) {
            $additiveParts[] = PrecomputadorFeed::sqlContexto($pesoContexto, $perfilUsuario, $config, $queryParams);
        }

        /* Señal 3: Tendencias — engagement velocity multi-ventana */
        $pesoTendencias = $pesos['tendencias'] ?? 0.15;
        if ($pesoTendencias > 0) {
            $ventanas = $params['ventanas_tendencias'] ?? ['corta' => '24 hours'];
            $additiveParts[] = ConstructorSenales::sqlTendencias($pesoTendencias, $ventanas, $config, $usarVistaMatTrending);
        }

        /* Señal 4: Novedad — boost logarítmico (inline, no necesita servicio) */
        $pesoNovedad = $pesos['novedad'] ?? 0.10;
        if ($pesoNovedad > 0) {
            $diasBoost = (int) ($params['novedad_dias_boost'] ?? 14);
            $sPubAt = SamplesCols::PUBLICADO_AT;
        $additiveParts[] = "({$pesoNovedad} * GREATEST(0, 1 - LN(GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) / 86400)) / LN({$diasBoost})))";
        }

        /* Señal 5: Grafo social — samples de seguidos + likes de seguidos */
        $pesoSocial = $pesos['grafo_social'] ?? 0.10;
        if ($pesoSocial > 0) {
            $additiveParts[] = PrecomputadorFeed::sqlGrafoSocial($pesoSocial);
        }

        /* Señal 6: Similitud de contenido — pgvector coseno */
        $pgvActivo = self::pgvectorActivo();
        KamplesLogger::debug('Algoritmo: pgvector activo', ['activo' => $pgvActivo]);
        if ($pgvActivo) {
            $pesoSimilitud = $pesos['similitud_contenido'] ?? 0.25;
            if ($pesoSimilitud > 0) {
                $sqlSim = ConstructorSenales::sqlSimilitudContenido($userId, $pesoSimilitud, $queryParams);
                if ($sqlSim !== '0') {
                    $additiveParts[] = $sqlSim;
                }
            }
        }

        /* Sumar todas las señales aditivas */
        $scoreAditivo = !empty($additiveParts) ? '(' . \implode(' + ', $additiveParts) . ')' : '1';

        KamplesLogger::info('Algoritmo: Señales construidas', [
            'userId' => $userId,
            'numSenales' => \count($additiveParts),
            'perfilInteracciones' => $perfilUsuario['interacciones'] ?? 0,
            'bpmProm' => $perfilUsuario['bpmProm'] ?? 0,
            'keyFav' => $perfilUsuario['keyFav'] ?? null,
            'tipoFav' => $perfilUsuario['tipoFav'] ?? null,
        ]);

        /* Multiplicador: penalización progresiva por reproducciones (via CTE repro_peso) */
        $penalizacion = PrecomputadorFeed::sqlPenalizacionReproduccion($config);

        /* Multiplicador: penalización pasiva (reproducción sin like/descarga/guardar) */
        $penalizacionPasiva = PrecomputadorFeed::sqlPenalizacionPasiva($userId, $config);

        /* Multiplicador: saturación de popularidad (samples sobreusados pierden valor) */
        $saturacionPop = ConstructorSenales::sqlSaturacionPopularidad($config);

        /* C178: Boost para samples verificados por humano */
        $boostVerificado = (float) ($params['verificado_boost'] ?? 1.15);
        $sVerif = SamplesCols::VERIFICADO;
        $multiplicadorVerificado = "(CASE WHEN s.{$sVerif} = true THEN {$boostVerificado} ELSE 1 END)";

        /* [183A-90] Reducción para samples sin metadata IA procesada.
         * embedding IS NOT NULL = IA completó análisis → factor 1.0 (sin cambio).
         * embedding IS NULL = aún sin procesar → factor configurable (default 0.5).
         * No es exclusión: siguen en el feed, pero con menor score.
         * Cuando la IA los procese, el embedding se llena y el factor desaparece. */
        $sEmbed = SamplesCols::EMBEDDING;
        $reduccionIA = (float) ($params['metadata_ia_reduccion'] ?? 0.5);
        $multiplicadorIA = "(CASE WHEN s.{$sEmbed} IS NOT NULL THEN 1 ELSE {$reduccionIA} END)";

        /* [193A-28] Boost multiplicativo para samples recién publicados.
         * Resuelve cold start: samples nuevos no tienen interacciones → nunca entran
         * en página 1 sin un boost temporal que los iguale con los establecidos.
         * < horas_full (24h): factor_full (x2.0).
         * horas_full..horas_medio (24-72h): decae linealmente de factor_medio a 1.0.
         * > horas_medio: 1.0 (sin boost). */
        $boostReciente = $params['boost_reciente'] ?? [];
        $boostHabilitado = $boostReciente['habilitado'] ?? true;
        $multiplicadorReciente = '1';
        if ($boostHabilitado) {
            $horasFull = (int) ($boostReciente['horas_full'] ?? 24);
            $horasMedio = (int) ($boostReciente['horas_medio'] ?? 72);
            $factorFull = (float) ($boostReciente['factor_full'] ?? 2.0);
            $factorMedio = (float) ($boostReciente['factor_medio'] ?? 1.4);
            $segFull = $horasFull * 3600;
            $segMedio = $horasMedio * 3600;
            $multiplicadorReciente = "(CASE
                WHEN EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) < {$segFull} THEN {$factorFull}
                WHEN EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) < {$segMedio} THEN
                    GREATEST(1.0, {$factorMedio} - ({$factorMedio} - 1.0) * (EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) - {$segFull}) / ({$segMedio} - {$segFull}))
                ELSE 1.0
            END)";
        }

        $scoreTotal = "{$scoreAditivo} * {$penalizacion} * {$penalizacionPasiva} * {$saturacionPop} * {$multiplicadorVerificado} * {$multiplicadorIA} * {$multiplicadorReciente}";

        /* Diversidad por creador como penalización suave */
        $maxPorCreador = (int) ($params['max_por_creador'] ?? 3);

        /* [193A-33] Diversidad por categoría/género: evita monocultura en el feed.
         * Si el usuario likea 5 kicks, sin esto el feed entero sería kick.
         * Extraemos el género dominante del JSONB metadata y aplicamos penalización
         * suave a partir del 5to sample del mismo género, análogo al de creador. */
        $maxPorCategoria = 4;
        $sMeta = SamplesCols::METADATA;

        /*
         * CTEs de pre-cómputo: tags enriquecidos (1× en vez de 9×),
         * flags usuario (LEFT JOIN en vez de 4 EXISTS), vectores de afinidad.
         * FIX verificado_sample: alias obligatorio para NormalizadorSample.
         */
        $ctesPrecomputo = PrecomputadorFeed::generarCtes($userId, $config);
        $ctesPrecomputoPrefijo = PrecomputadorFeed::serializarCtes($ctesPrecomputo);
        AlgoTimingLogger::marcar($userId, 'generacionSQL');

        $ts = SamplesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $sId = SamplesCols::ID;
        $sCreadorId = SamplesCols::CREADOR_ID;
        $sEstado = SamplesCols::ESTADO;
        $sMostrar = SamplesCols::MOSTRAR_EN_COMUNIDAD;
        $uId = UsuariosExtCols::ID;
        $uUser = UsuariosExtCols::USERNAME;
        $uNombre = UsuariosExtCols::NOMBRE_VISIBLE;
        $uAvatar = UsuariosExtCols::AVATAR_URL;
        $uVerif = UsuariosExtCols::VERIFICADO;
        $uWpId = UsuariosExtCols::WP_USER_ID;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $userId_int = (int) $userId;

        /*
         * Pipeline de candidatos: pre-filtro rápido si >5000 samples activos.
         * Se inserta como CTE adicional entre pre-cómputo y base_scores.
         */
        $umbralCandidatos = (int) ($config['candidatos']['umbral_activacion'] ?? 5000);
        $totalActivos = SelectorCandidatos::contarActivos();
        $usarCandidatos = $totalActivos > $umbralCandidatos;

        $cteCandidatosSql = '';
        $joinCandidatos = '';
        $joinTrendingMV = '';
        if ($usarCandidatos) {
            $cteCandidatos = SelectorCandidatos::seleccionar($userId, $perfilUsuario, $queryParams, $config);
            $cteCandidatosSql = ",\n                " . $cteCandidatos;
            $joinCandidatos = "JOIN (SELECT id FROM candidatos) cand ON s.{$sId} = cand.id\n                    ";
            KamplesLogger::info('Algoritmo: Usando pipeline de candidatos', [
                'totalActivos' => $totalActivos, 'umbral' => $umbralCandidatos,
            ]);
        }

        if ($usarVistaMatTrending) {
            $joinTrendingMV = "LEFT JOIN mv_trending_samples mvt ON mvt.sample_id = s.{$sId}\n                    ";
        }

        $joinsPrecomputo = PrecomputadorFeed::joinsPrecomputo();

        $sImagen = SamplesCols::IMAGEN_URL;

        $sql = "WITH {$ctesPrecomputoPrefijo}{$cteCandidatosSql},
                base_scores AS (
                    SELECT s.*, s.{$sVerif} AS verificado_sample, s.{$sMostrar},
                           u.{$uUser}, u.{$uNombre}, u.{$uAvatar}, u.{$uVerif},
                           u.{$uWpId} AS creador_wp_user_id,
                           ul.reaccion AS reaccion_usuario,
                           ud.sample_id IS NOT NULL AS ya_coleccionado,
                           uc.sample_id IS NOT NULL AS ya_guardado_en_coleccion,
                           ucom.sample_id IS NOT NULL AS ya_comentado,
                           (s.{$sCreadorId} = {$userId_int}) AS es_mio,
                           /* [2003A-3] Reemplazadas subqueries correlacionadas por CTEs pre-computadas.
                            * Antes: 2 subqueries × 2,611 samples = 5,222 ejecuciones.
                            * Ahora: 2 CTEs + 2 LEFT JOINs = 2 scans. */
                           CASE WHEN s.{$sImagen} IS NOT NULL THEN NULL ELSE cip.col_imagen_url END AS imagen_coleccion_propietario,
                           CASE WHEN cp.sample_id IS NOT NULL
                               THEN json_build_object('id', cp.col_id, 'nombre', cp.col_nombre, 'slug', cp.col_slug, 'imagen_url', cp.col_imagen_url)
                               ELSE NULL END AS coleccion_original_json,
                           /* [193A-33] Género dominante para diversidad: primer género en metadata JSONB.
                            * COALESCE a 'other' si no tiene, para que la partición no ignore samples sin género. */
                           LOWER(COALESCE(
                               CASE WHEN jsonb_typeof(s.{$sMeta}->'genero') = 'array'
                                    THEN s.{$sMeta}->'genero'->>0
                                    ELSE s.{$sMeta}->>'genero'
                               END, 'other'
                           )) AS genero_diversidad,
                           ({$scoreTotal}) as score
                    FROM {$ts} s
                    {$joinsPrecomputo}{$joinCandidatos}{$joinTrendingMV}LEFT JOIN {$tu} u ON s.{$sCreadorId} = u.{$uId}
                    WHERE s.{$sEstado} = '{$eActivo}'
                        AND ign.sample_id IS NULL"
                . BloqueosRepository::sqlExcluirBloqueados("s.{$sCreadorId}", $userId)
                . "),
                scored AS (
                    SELECT base_scores.*,
                           ROW_NUMBER() OVER (PARTITION BY base_scores.{$sCreadorId} ORDER BY base_scores.score DESC) as rn,
                           ROW_NUMBER() OVER (PARTITION BY base_scores.genero_diversidad ORDER BY base_scores.score DESC) as rn_genero
                    FROM base_scores
                )
                SELECT * FROM scored
                ORDER BY (
                    score
                    * CASE WHEN rn <= {$maxPorCreador} THEN 1 ELSE GREATEST(0.3, 1.0 - (rn - {$maxPorCreador}) * 0.15) END
                    * CASE WHEN rn_genero <= {$maxPorCategoria} THEN 1 ELSE GREATEST(0.5, 1.0 - (rn_genero - {$maxPorCategoria}) * 0.10) END
                ) DESC
                LIMIT :limit OFFSET :offset";

            /* [183A-80] Bulk-fetch: si el offset solicitado cabe en PAGINAS_BULK,
             * ejecutar UNA sola query con LIMIT = limite * PAGINAS_BULK, OFFSET = 0.
             * Esto elimina el cuello de botella de OFFSET en PostgreSQL para pag2/3:
             * top-N heapsort funciona con OFFSET=0 (O(N)), pero OFFSET>0 fuerza full sort (O(N log N)).
             * Resultado: pag2/3 pasan de ~350ms a ~0ms (servidas desde slice en memoria).
             * Para offsets > PAGINAS_BULK * limite, fallback al OFFSET original. */
            $maxBulkOffset = $limite * (self::PAGINAS_BULK - 1);
            $usarBulk = $offset <= $maxBulkOffset;

            if ($usarBulk) {
                $limiteBulk = $limite * self::PAGINAS_BULK;
                /* [183A-86] Usar $queryParams completo (incluye params de señales como
                 * :bpmProm, :keyFav, embedding, etc.) con limit/offset sobrescritos.
                 * Sin esto, el prepared statement recibe 2 params cuando necesita ~8,
                 * causando SQLSTATE[08P01] y retorno vacío → fallback a recientes. */
                $bulkParams = $queryParams;
                $bulkParams['limit'] = $limiteBulk;
                $bulkParams['offset'] = 0;
                $todoResultados = SamplesRepository::consultar($sql, $bulkParams);
                AlgoTimingLogger::marcar($userId, 'sqlFeed');

                /* [2003A-3-B] Capturar EXPLAIN ANALYZE para desglose detallado por CTE.
                 * Solo se ejecuta para userId 1 (no-op para el resto). */
                AlgoTimingLogger::capturarExplain($userId, $sql, $bulkParams);

                KamplesLogger::info('Algoritmo: Bulk-fetch completado', [
                    'userId' => $userId, 'totalBulk' => \count($todoResultados),
                    'paginasBulk' => self::PAGINAS_BULK,
                ]);

                /* Dividir en páginas, inyectar serendipia por página y cachear cada una */
                for ($pag = 0; $pag < self::PAGINAS_BULK; $pag++) {
                    $pagOffset = $pag * $limite;
                    $pagSlice = \array_slice($todoResultados, $pagOffset, $limite);
                    if (empty($pagSlice)) break;

                    $pagSlice = self::inyectarSerendipia($pagSlice, $userId, $config);
                    self::guardarResultadoEnCache($userId, $limite, $pagOffset, $pagSlice);
                }

                /* Retornar la página solicitada (ya tiene serendipia del loop anterior) */
                $resultado = ServicioCache::obtener(self::cacheKey($userId, $limite, $offset));
                if ($resultado === false || !\is_array($resultado)) {
                    /* Fallback: slice directo si el cache fallo */
                    $resultado = \array_slice($todoResultados, $offset, $limite);
                    $resultado = self::inyectarSerendipia($resultado, $userId, $config);
                }
            } else {
                $resultado = SamplesRepository::consultar($sql, $queryParams);
                AlgoTimingLogger::marcar($userId, 'sqlFeed');

                /* [2003A-3-B] EXPLAIN ANALYZE para path sin bulk-fetch */
                AlgoTimingLogger::capturarExplain($userId, $sql, $queryParams);

                $resultado = self::inyectarSerendipia($resultado, $userId, $config);
                self::guardarResultadoEnCache($userId, $limite, $offset, $resultado);
            }

            KamplesLogger::info('Algoritmo: Resultados obtenidos', [
                'userId' => $userId, 'totalResultados' => \count($resultado),
                'primerScore' => !empty($resultado) ? ($resultado[0]['score'] ?? 'N/A') : 'vacío',
                'bulkFetch' => $usarBulk,
            ]);

            /* [2003A-3] Guardar medicion de timing con metadatos del contexto de ejecucion */
            AlgoTimingLogger::guardar($userId, [
                'totalSamples'  => $totalActivos,
                'usoCandidatos' => $usarCandidatos,
                'usoMV'         => $usarVistaMatTrending,
                'bulkFetch'     => $usarBulk,
                'resultados'    => \count($resultado),
                'limite'        => $limite,
                'offset'        => $offset,
            ]);

            return $resultado;
        } finally {
            /* [173A-6] El lock no puede depender de llegar al final feliz: usuarios
             * nuevos y excepciones también deben liberar el stampede protection lock. */
            if ($lockAdquirido) {
                ServicioCache::liberarLock($lockKey);
            }
        }
    }

    /**
     * Feed para usuarios nuevos sin historial de interacciones.
     * Mezcla trending reciente + samples nuevos + diversidad por creador.
     * Score: engagement ponderado * freshness decay * diversidad creador.
     */
    private static function feedNuevoUsuario(int $limite, int $offset, ?int $userId = null): array
    {
        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $sTotLikes = SamplesCols::TOTAL_LIKES;
        $sTotRepro = SamplesCols::TOTAL_REPRODUCCIONES;
        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;
        $sPubAt = SamplesCols::PUBLICADO_AT;
        $sVerif = SamplesCols::VERIFICADO;
        $sCreadorId = SamplesCols::CREADOR_ID;

        /*
         * CTE dos niveles: calcular score engagement + freshness, luego diversidad por creador.
         * Freshness: decay exponencial a 30 días (no lineal como antes).
         * Diversidad: penalización suave a partir del 3er sample del mismo creador.
         * Boost: +15% para samples verificados.
         */
        $selectBase = NormalizadorSample::sqlSelectSamples($userId);
        $filtroBloqueos = BloqueosRepository::sqlExcluirBloqueados("s.{$sCreadorId}", $userId);
        $sql = "WITH base AS (
                    {$selectBase}
                    WHERE s.{$sEstado} = '{$eActivo}'{$filtroBloqueos}
                ),
                ranked AS (
                    SELECT base.*,
                           ((base.{$sTotLikes} * 2 + base.{$sTotRepro} + base.{$sTotDesc} * 3)
                            * EXP(-EXTRACT(EPOCH FROM NOW() - base.{$sPubAt}) / (30 * 86400))
                            * CASE WHEN base.{$sVerif} = true THEN 1.15 ELSE 1 END
                           ) as score_nuevo,
                           ROW_NUMBER() OVER (PARTITION BY base.{$sCreadorId} ORDER BY (base.{$sTotLikes} * 2 + base.{$sTotRepro} + base.{$sTotDesc} * 3) DESC) as rn_creador
                    FROM base
                )
                SELECT * FROM ranked
                ORDER BY (score_nuevo * CASE WHEN rn_creador <= 3 THEN 1 ELSE GREATEST(0.3, 1.0 - (rn_creador - 3) * 0.2) END) DESC
                LIMIT :limit OFFSET :offset";

        return SamplesRepository::consultar($sql, ['limit' => $limite, 'offset' => $offset]);
    }

    /**
     * Invalida el cache fresco de feed para un usuario específico.
     * Conserva el fallback stale de p1 para responder rápido mientras se recalcula.
     * Llamar cuando: el usuario da like, descarga, o se publica un nuevo sample.
     */
    public static function invalidarCache(int $userId): void
    {
        ServicioCache::eliminarPatron(self::CACHE_PREFIX . $userId . '_*');
    }

    /**
     * Invalida el cache fresco de feed para TODOS los usuarios.
     * El escudo stale se conserva para que la primera carga siga siendo ligera.
     */
    public static function invalidarCacheGlobal(): void
    {
        KamplesLogger::debug('Algoritmo: Invalidando cache global de feeds');
        ServicioCache::eliminarPatron(self::CACHE_PREFIX . '*');
    }

    /**
     * [173A-6] Precalienta la primera página para tamaños usados por la app.
     * Se ejecuta en cron para mantener caliente la p1 de usuarios activos.
     */
    public static function precalentarPrimeraPagina(int $userId, array $limites = self::LIMITES_WARM_PRIMERA_PAGINA): void
    {
        foreach ($limites as $limite) {
            $limite = (int) $limite;
            if ($limite < 1) {
                continue;
            }

            $lockKey = self::warmLockKey($userId, $limite);
            if (!ServicioCache::adquirirLock($lockKey, 180)) {
                continue;
            }

            try {
                self::feedPersonalizado($userId, $limite, 0, false);
            } catch (\Throwable $e) {
                KamplesLogger::warning('Algoritmo: Precalentado de p1 fallo', [
                    'userId' => $userId,
                    'limite' => $limite,
                    'error' => $e->getMessage(),
                ]);
            } finally {
                ServicioCache::liberarLock($lockKey);
            }
        }
    }

    /**
     * Samples similares a uno dado.
     * Usa embeddings pgvector (cosine distance) con fallback a scoring
     * por tags + BPM + key + tipo usando pesos de config['samples_similares'].
     */
    public static function samplesSimilares(int $sampleId, int $limite = 5, ?int $userId = null): array
    {
        $config = self::cargarPesos();
        $pesosSimil = $config['samples_similares'] ?? [];

        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $sId = SamplesCols::ID;
        $sEmbed = SamplesCols::EMBEDDING;
        $ts = SamplesCols::TABLA;

        if (self::pgvectorActivo()) {
            if (SamplesRepository::verificarTieneEmbedding($sampleId)) {
                $similares = SamplesRepository::consultar(
                    NormalizadorSample::sqlSelectSamples($userId)
                    . " WHERE s.{$sEstado} = '{$eActivo}' AND s.{$sId} != :sampleId AND s.{$sEmbed} IS NOT NULL"
                    . " ORDER BY s.{$sEmbed} <=> (SELECT {$sEmbed} FROM {$ts} WHERE {$sId} = :sampleId)"
                    . " LIMIT :limit",
                    ['sampleId' => $sampleId, 'limit' => $limite]
                );

                if (!empty($similares)) return $similares;
            }
        }

        /*
         * Fallback: scoring por tags, BPM, key, tipo usando pesos de config.
         * Los pesos se leen de config['samples_similares'] normalizado a 1.0 total.
         */
        $sample = SamplesRepository::buscarMetadataParaSimilares($sampleId);

        if (!$sample) return [];

        $pesoSimilitud = $pesosSimil['similitud_contenido'] ?? 0.55;
        $pesoContexto = $pesosSimil['contexto'] ?? 0.10;
        $pesoTendencias = $pesosSimil['tendencias'] ?? 0.20;
        $pesoNovedad = $pesosSimil['novedad'] ?? 0.15;

        $tags = NormalizadorSample::pgArrayToPhp($sample[SamplesCols::TAGS] ?? '');
        $bpm = $sample[SamplesCols::BPM] ? (int) $sample[SamplesCols::BPM] : null;
        $key = $sample[SamplesCols::KEY] ?? null;
        $tipo = $sample[SamplesCols::TIPO] ?? SamplesEnums::TIPO_ONESHOT;
        $toleranciaBpm = $config['parametros']['bpm_tolerancia'] ?? 15;

        $params = ['sampleId' => $sampleId, 'limit' => $limite];

        /* Similitud contenido: tags en comun — normalizado a [0,1] */
        $sTags = SamplesCols::TAGS;
        $tagParts = [];
        foreach (\array_slice($tags, 0, 10) as $i => $tag) {
            $tagParts[] = "CASE WHEN :tag{$i} = ANY(s.{$sTags}) THEN 1 ELSE 0 END";
            $params["tag{$i}"] = $tag;
        }
        $numTags = \max(1, \count($tagParts));
        $tagScore = !empty($tagParts) ? '((' . \implode(' + ', $tagParts) . ')::float / ' . $numTags . ')' : '0';

        /*
         * Contexto técnico: BPM + key + tipo — sub-pesos configurables.
         * En samples_similares, datos técnicos importan menos que tags/género.
         */
        $sBpm = SamplesCols::BPM;
        $sKey = SamplesCols::KEY;
        $sTipo = SamplesCols::TIPO;
        $sTotLk = SamplesCols::TOTAL_LIKES;
        $sTotRepro = SamplesCols::TOTAL_REPRODUCCIONES;
        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;
        $sPubAt = SamplesCols::PUBLICADO_AT;

        $ctxSimil = $config['samples_similares_contexto'] ?? [];
        $pesoBpmCtx = $ctxSimil['bpm_proximidad'] ?? 0.25;
        $pesoKeyCtx = $ctxSimil['key_match'] ?? 0.25;
        $pesoTipoCtx = $ctxSimil['tipo_match'] ?? 0.50;

        $bpmScore = $bpm
            ? "GREATEST(0, ({$toleranciaBpm} - ABS(COALESCE(s.{$sBpm}, 0) - {$bpm}))::float / {$toleranciaBpm})"
            : "0.5";

        $keyScore = $key ? "CASE WHEN s.{$sKey} = :simKey THEN 1 ELSE 0 END" : "0.5";
        if ($key) $params['simKey'] = $key;

        $tipoScore = "CASE WHEN s.{$sTipo} = :simTipo THEN 1 ELSE 0 END";
        $params['simTipo'] = $tipo;

        $contextoScore = "({$pesoBpmCtx} * {$bpmScore} + {$pesoKeyCtx} * {$keyScore} + {$pesoTipoCtx} * {$tipoScore})";

        /* Tendencias: engagement total normalizado (aprox, sin ventana temporal) */
        $tendenciasScore = "(LEAST(1.0, (s.{$sTotLk} * 2 + s.{$sTotRepro} + s.{$sTotDesc} * 3)::float / GREATEST(1, (SELECT AVG({$sTotLk} * 2 + {$sTotRepro} + {$sTotDesc} * 3) FROM {$ts} WHERE {$sEstado} = '{$eActivo}')::float)))";

        /* Novedad: decay logaritmico */
        $diasBoost = (int) ($config['parametros']['novedad_dias_boost'] ?? 14);
        $novedadScore = "GREATEST(0, 1 - LN(GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) / 86400)) / LN({$diasBoost}))";

        $scoreFinal = "({$pesoSimilitud} * {$tagScore} + {$pesoContexto} * {$contextoScore} + {$pesoTendencias} * {$tendenciasScore} + {$pesoNovedad} * {$novedadScore})";

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " WHERE s.{$sEstado} = '{$eActivo}' AND s.{$sId} != :sampleId"
             . " ORDER BY {$scoreFinal} DESC"
             . " LIMIT :limit";

        return SamplesRepository::consultar($sql, $params);
    }

    /**
     * Inyecta samples de descubrimiento en el feed cada N posiciones.
     *
     * Usa pgvector para encontrar samples a distancia moderada del perfil
     * del usuario (no muy similar ni demasiado diferente) con engagement
     * mínimo para garantizar calidad. Fallback: random de calidad.
     *
     * @param array $resultados Feed principal ya calculado
     * @param int $userId ID del usuario
     * @param array $config Configuración del algoritmo
     * @return array Feed con descubrimientos inyectados
     */
    private static function inyectarSerendipia(array $resultados, int $userId, array $config): array
    {
        $serendipConfig = $config['serendipidad'] ?? [];
        if (!($serendipConfig['habilitado'] ?? true)) return $resultados;
        if (\count($resultados) < 4) return $resultados;

        $frecuencia = (int) ($serendipConfig['frecuencia'] ?? 6);
        $numDescubrimientos = (int) \floor(\count($resultados) / $frecuencia);
        if ($numDescubrimientos < 1) return $resultados;

        $idsExcluir = \array_column($resultados, SamplesCols::ID);

        try {
            $descubrimientos = self::obtenerSamplesDescubrimiento(
                $userId,
                $numDescubrimientos,
                $idsExcluir,
                $serendipConfig
            );
        } catch (\Throwable $e) {
            KamplesLogger::debug('Algoritmo: Serendipia falló, feed sin modificar', [
                'error' => $e->getMessage(),
            ]);
            return $resultados;
        }

        if (empty($descubrimientos)) return $resultados;

        /* Inyectar en posiciones múltiplo de frecuencia (0-indexed: pos 5, 11, 17...) */
        $posInsercion = $frecuencia - 1;
        foreach ($descubrimientos as $descubrimiento) {
            if ($posInsercion >= \count($resultados)) break;
            /* [193A-31] Marcar sample como serendipia para debug badge */
            $descubrimiento['_serendipia'] = true;
            \array_splice($resultados, $posInsercion, 0, [$descubrimiento]);
            $posInsercion += $frecuencia + 1; /* +1 porque el array creció */
        }

        KamplesLogger::debug('Algoritmo: Serendipia inyectada', [
            'inyectados' => \min(\count($descubrimientos), $numDescubrimientos),
            'feedSize' => \count($resultados),
        ]);

        return $resultados;
    }

    /**
     * Obtiene samples candidatos para descubrimiento (fuera de la burbuja).
     *
     * Con pgvector: samples a distancia coseno moderada (ni muy similar ni opuesto).
     * Sin pgvector: samples aleatorios con buen engagement que el usuario no ha oído.
     *
     * BN-5: Resultados cacheados 30 min por usuario. La serendipia no depende de
     * interacciones recientes (RANDOM + distancia moderada), asi que es seguro
     * cachear sin invalidacion por eventos.
     */
    private static function obtenerSamplesDescubrimiento(
        int $userId,
        int $limite,
        array $idsExcluir,
        array $serendipConfig
    ): array {
        $cacheTtl = (int) ($serendipConfig['cache_ttl'] ?? 1800);
        $cacheKey = "kamples_serendipia_{$userId}";
        $cached = ServicioCache::obtener($cacheKey);
        if ($cached !== false && \is_array($cached) && !empty($cached)) {
            /* Filtrar los que ya estan en el feed actual */
            $idsSet = \array_flip($idsExcluir);
            $filtrados = \array_values(\array_filter($cached, function ($s) use ($idsSet) {
                return !isset($idsSet[$s[SamplesCols::ID] ?? -1]);
            }));
            if (!empty($filtrados)) {
                return \array_slice($filtrados, 0, $limite);
            }
            /* Si todos los cacheados ya estan en el feed, recalcular */
        }

        $distMin = (float) ($serendipConfig['distancia_min'] ?? 0.3);
        $distMax = (float) ($serendipConfig['distancia_max'] ?? 1.0);
        $minEngagement = (int) ($serendipConfig['min_engagement'] ?? 5);
        $limiteCandidatos = (int) ($serendipConfig['limite_candidatos'] ?? 10);

        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $sId = SamplesCols::ID;
        $sEmbed = SamplesCols::EMBEDDING;
        $sTotLk = SamplesCols::TOTAL_LIKES;
        $sTotRepro = SamplesCols::TOTAL_REPRODUCCIONES;
        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;

        $params = ['userId' => $userId, 'limit' => \min($limite, $limiteCandidatos)];

        /* Construir exclusión de IDs ya en el feed */
        $excludeParts = [];
        foreach (\array_slice($idsExcluir, 0, 100) as $i => $id) {
            $key = "excl{$i}";
            $params[$key] = (int) $id;
            $excludeParts[] = ":{$key}";
        }
        $excludeIn = !empty($excludeParts) ? "AND s.{$sId} NOT IN (" . \implode(',', $excludeParts) . ")" : '';

        /* Engagement mínimo para filtrar ruido */
        $engagementFilter = "AND (s.{$sTotLk} + s.{$sTotRepro} + s.{$sTotDesc}) >= {$minEngagement}";

        if (self::pgvectorActivo()) {
            $perfil = GeneradorEmbeddings::perfilUsuario($userId);
            if ($perfil !== null) {
                /*
                 * Params para pgvector: NO incluye :userId (no está en este SQL).
                 * Cada query recibe solo los params que referencia para evitar HY093.
                 */
                $paramsVector = $params;
                unset($paramsVector['userId']);
                $paramsVector['discoveryVector'] = GeneradorEmbeddings::vectorAString($perfil);

                /*
                 * Distancia coseno entre perfil y candidato BETWEEN min y max.
                 * Así encontramos samples "algo diferentes" pero no completamente ajenos.
                 */
                $sql = NormalizadorSample::sqlSelectSamples($userId)
                    . " WHERE s.{$sEstado} = '{$eActivo}'"
                    . " AND s.{$sEmbed} IS NOT NULL"
                    . " AND (s.{$sEmbed} <=> :discoveryVector::vector) BETWEEN {$distMin} AND {$distMax}"
                    . " {$excludeIn} {$engagementFilter}"
                    . " ORDER BY RANDOM()"
                    . " LIMIT :limit";

                $candidatos = SamplesRepository::consultar($sql, $paramsVector);
                if (!empty($candidatos)) {
                    ServicioCache::guardar($cacheKey, $candidatos, $cacheTtl);
                    return $candidatos;
                }
            }
        }

        /* Fallback sin pgvector: random de calidad que el usuario no ha reproducido mucho */
        $trep = ReproduccionesCols::TABLA;
        $trUid = ReproduccionesCols::USUARIO_ID;
        $trSid = ReproduccionesCols::SAMPLE_ID;

        $sql = NormalizadorSample::sqlSelectSamples($userId)
            . " WHERE s.{$sEstado} = '{$eActivo}'"
            . " {$excludeIn} {$engagementFilter}"
            . " AND COALESCE((SELECT COUNT(*) FROM {$trep} WHERE {$trUid} = :userId AND {$trSid} = s.{$sId}), 0) < 2"
            . " ORDER BY RANDOM()"
            . " LIMIT :limit";

        /* Fallback NO usa :discoveryVector — pasar solo params relevantes */
        $paramsFallback = $params;
        unset($paramsFallback['discoveryVector']);

        $candidatos = SamplesRepository::consultar($sql, $paramsFallback);
        if (!empty($candidatos)) {
            ServicioCache::guardar($cacheKey, $candidatos, $cacheTtl);
        }
        return $candidatos;
    }

    /*
     * TO-DO: Este archivo tiene ~550 líneas. Candidato a split:
     * - MotorRecomendacion: feed orchestration + cache
     * - RecomendadorSimilares: samplesSimilares + fallback
     * - ServicioSerendipia: inyección de descubrimiento
     */
}
