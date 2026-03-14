<?php

/**
 * AdminRepository — Queries cross-tabla para el panel de administración.
 *
 * Contiene queries de dashboard/KPIs que tocan múltiples tablas.
 * No extiende BaseRepository porque no tiene tabla propia.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\ReportesCols;
use App\Config\Schema\_generated\ScrapingLogCols;
use App\Config\Schema\_generated\ColaExtraccionSamplesCols;
use App\Config\Schema\_generated\ColaExtraccionSamplesEnums;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Config\Schema\_generated\ReportesEnums;

class AdminRepository
{
    /*
     * KPIs principales del dashboard.
     * Retorna conteos globales en una sola query con subselects.
     */
    public static function obtenerKpisResumen(): ?array
    {
        $tu = UsuariosExtCols::TABLA;
        $ts = SamplesCols::TABLA;
        $td = DescargasCols::TABLA;
        $tp = PublicacionesCols::TABLA;
        $tr = ReportesCols::TABLA;

        $activo = SamplesEnums::ESTADO_ACTIVO;
        $pro = UsuariosExtEnums::PLAN_PRO;
        $premium = UsuariosExtEnums::PLAN_PREMIUM;
        $modPendiente = PublicacionesEnums::MODERACION_ESTADO_PENDIENTE;
        $repPendiente = ReportesEnums::ESTADO_PENDIENTE;

        return SamplesRepository::consultarUno("SELECT
                (SELECT COUNT(*) FROM {$tu}) as total_usuarios,
                (SELECT COUNT(*) FROM {$ts} WHERE " . SamplesCols::ESTADO . " = '{$activo}') as total_samples,
                (SELECT COUNT(*) FROM {$td}) as total_descargas,
                (SELECT COUNT(*) FROM {$tp}) as total_publicaciones,
                (SELECT COUNT(*) FROM {$tp} WHERE " . PublicacionesCols::MODERACION_ESTADO . " = '{$modPendiente}') as pendientes_moderacion,
                (SELECT COUNT(*) FROM {$tr} WHERE " . ReportesCols::ESTADO . " = '{$repPendiente}') as reportes_pendientes,
                (SELECT COUNT(*) FROM {$tu} WHERE " . UsuariosExtCols::PLAN . " = '{$pro}') as usuarios_pro,
                (SELECT COUNT(*) FROM {$tu} WHERE " . UsuariosExtCols::PLAN . " = '{$premium}') as usuarios_premium,
                (SELECT COUNT(*) FROM {$ts} WHERE " . SamplesCols::CREATED_AT . " > NOW() - INTERVAL '7 days') as samples_semana,
                (SELECT COUNT(*) FROM {$tu} WHERE " . UsuariosExtCols::CREATED_AT . " > NOW() - INTERVAL '7 days') as registros_semana
        ");
    }

    /*
     * Actividad por día: registros, uploads y descargas.
     */
    public static function obtenerActividadPorDias(int $dias): array
    {
        $tu = UsuariosExtCols::TABLA;
        $ts = SamplesCols::TABLA;
        $td = DescargasCols::TABLA;

        $sqlBase = fn(string $tabla) =>
        "SELECT DATE(created_at) as fecha, COUNT(*) as total
             FROM {$tabla}
             WHERE created_at > NOW() - INTERVAL '1 day' * :dias
             GROUP BY DATE(created_at) ORDER BY fecha";

        return [
            'registros' => SamplesRepository::consultar($sqlBase($tu), ['dias' => $dias]),
            'uploads'   => SamplesRepository::consultar($sqlBase($ts), ['dias' => $dias]),
            'descargas' => SamplesRepository::consultar($sqlBase($td), ['dias' => $dias]),
        ];
    }

    /*
     * Lista paginada de usuarios con estadísticas (samples activos, descargas).
     * Construye WHERE dinámico según filtros.
     * sentinel-disable-next-line php-service-retorna-asociativo — retorna ['data' => [], 'total' => int], data es indexado
     */
    public static function listarUsuariosConEstadisticas(
        string $busqueda,
        string $plan,
        string $orden,
        int $offset,
        int $porPagina = 20
    ): array {
        $tu = UsuariosExtCols::TABLA;
        $ts = SamplesCols::TABLA;
        $td = DescargasCols::TABLA;
        $activo = SamplesEnums::ESTADO_ACTIVO;

        $params = ['offset' => $offset, 'porPagina' => $porPagina];
        $where = '1=1';

        if (!empty($busqueda)) {
            $where .= ' AND (u.' . UsuariosExtCols::USERNAME . ' ILIKE :busqueda'
                . ' OR u.' . UsuariosExtCols::NOMBRE_VISIBLE . ' ILIKE :busqueda'
                . ' OR u.' . UsuariosExtCols::EMAIL . ' ILIKE :busqueda)';
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        if (!empty($plan) && in_array($plan, [
            UsuariosExtEnums::PLAN_FREE,
            UsuariosExtEnums::PLAN_PRO,
            UsuariosExtEnums::PLAN_PREMIUM,
        ])) {
            $where .= ' AND u.' . UsuariosExtCols::PLAN . ' = :plan';
            $params['plan'] = $plan;
        }

        $orderBy = match ($orden) {
            'actividad' => 'u.' . UsuariosExtCols::UPDATED_AT . ' DESC NULLS LAST',
            'samples'   => 'total_samples DESC',
            default     => 'u.' . UsuariosExtCols::CREATED_AT . ' DESC',
        };

        $data = SamplesRepository::consultar(
            "SELECT u." . UsuariosExtCols::ID . ", u." . UsuariosExtCols::USERNAME
                . ", u." . UsuariosExtCols::NOMBRE_VISIBLE . ", u." . UsuariosExtCols::EMAIL
                . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::WP_USER_ID
                . ", u." . UsuariosExtCols::PLAN . ", u." . UsuariosExtCols::ROL
                . ", u." . UsuariosExtCols::VERIFICADO . ", u." . UsuariosExtCols::BANEADO_HASTA . " AS ban_hasta"
                . ", u." . UsuariosExtCols::ESTADO . ", u." . UsuariosExtCols::SUSPENDIDO_HASTA
                . ", u." . UsuariosExtCols::SUSPENSION_RAZON . ", u." . UsuariosExtCols::SERA_ELIMINADO_EN
                . ", u." . UsuariosExtCols::CREATED_AT . ", u." . UsuariosExtCols::UPDATED_AT
                . ", (SELECT COUNT(*) FROM {$ts} s WHERE s." . SamplesCols::CREADOR_ID . " = u." . UsuariosExtCols::ID
                . " AND s." . SamplesCols::ESTADO . " = '{$activo}') as total_samples"
                . ", (SELECT COUNT(*) FROM {$td} d WHERE d." . DescargasCols::USUARIO_ID . " = u." . UsuariosExtCols::ID
                . ") as total_descargas"
                . " FROM {$tu} u WHERE {$where} ORDER BY {$orderBy} LIMIT :porPagina OFFSET :offset",
            $params
        );

        /* Count total sin offset */
        $paramsCount = array_diff_key($params, ['offset' => true, 'porPagina' => true]);
        $total = SamplesRepository::consultarUno(
            "SELECT COUNT(*) as total FROM {$tu} u WHERE {$where}",
            $paramsCount
        );

        return [
            'data'  => $data,
            'total' => (int) ($total['total'] ?? 0),
        ];
    }

    /*
     * QK40: Lista paginada de scraping_log con búsqueda y filtro por estado.
     */
    public static function listarScrapingLog(
        int $offset,
        string $busqueda = '',
        string $estado = '',
        int $porPagina = 25,
        string $sortCol = '',
        string $sortDir = 'DESC'
    ): array {
        $t = ScrapingLogCols::TABLA;
        $params = ['offset' => $offset, 'porPagina' => $porPagina];
        $where = '1=1';

        if (!empty($busqueda)) {
            $where .= ' AND (' . ScrapingLogCols::URL . ' ILIKE :busqueda'
                . ' OR ' . ScrapingLogCols::TIPO_PAGINA . ' ILIKE :busqueda'
                . ' OR ' . ScrapingLogCols::ERROR_MENSAJE . ' ILIKE :busqueda)';
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        $estadosValidos = ['pending', 'scraped', 'error', 'skipped'];
        if (!empty($estado) && in_array($estado, $estadosValidos, true)) {
            $where .= ' AND ' . ScrapingLogCols::ESTADO . ' = :estado';
            $params['estado'] = $estado;
        }

        $data = SamplesRepository::consultar(
            "SELECT " . ScrapingLogCols::ID
                . ', ' . ScrapingLogCols::URL
                . ', ' . ScrapingLogCols::TIPO_PAGINA
                . ', ' . ScrapingLogCols::ESTADO
                . ', ' . ScrapingLogCols::INTENTOS
                . ', ' . ScrapingLogCols::BYTES_DESCARGADOS
                . ', ' . ScrapingLogCols::ERROR_MENSAJE
                . ', ' . ScrapingLogCols::RE_SCRAPEABLE
                . ', ' . ScrapingLogCols::VECES_RESCRAPEADO
                . ', ' . ScrapingLogCols::PROCESADO_AT
                . ', ' . ScrapingLogCols::CREATED_AT
                . " FROM {$t} WHERE {$where}"
                . ' ORDER BY ' . self::resolverSort($sortCol, ScrapingLogCols::TODAS, ScrapingLogCols::CREATED_AT) . ' ' . self::resolverDir($sortDir) . ', ' . ScrapingLogCols::ID . ' DESC'
                . ' LIMIT :porPagina OFFSET :offset',
            $params
        );

        $paramsCount = array_diff_key($params, ['offset' => true, 'porPagina' => true]);
        $total = SamplesRepository::consultarUno(
            "SELECT COUNT(*) as total FROM {$t} WHERE {$where}",
            $paramsCount
        );

        return [
            'data'  => $data,
            'total' => (int) ($total['total'] ?? 0),
        ];
    }

    /*
     * QK40: Lista paginada de cola_extraccion_samples con búsqueda y filtro por estado.
     * Incluye datos de la relación (canción fuente/destino) para contexto.
     */
    public static function listarColaExtraccion(
        int $offset,
        string $busqueda = '',
        string $estado = '',
        int $porPagina = 25,
        string $sortCol = '',
        string $sortDir = 'DESC',
        string $lado = ''
    ): array {
        $tc = ColaExtraccionSamplesCols::TABLA;
        $params = ['offset' => $offset, 'porPagina' => $porPagina];
        $where = '1=1';

        if (!empty($busqueda)) {
            $where .= ' AND (c.' . ColaExtraccionSamplesCols::YOUTUBE_ID . ' ILIKE :busqueda'
                . ' OR c.' . ColaExtraccionSamplesCols::ERROR_MENSAJE . ' ILIKE :busqueda'
                . ' OR c.' . ColaExtraccionSamplesCols::SPOTIFY_ID . ' ILIKE :busqueda)';
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        /* Filtro estado: soporta valor unico o comma-separated */
        $estadosValidos = ColaExtraccionSamplesEnums::TODOS_ESTADO;
        if (!empty($estado)) {
            $estadosSolicitados = array_filter(
                array_map('trim', explode(',', $estado)),
                fn(string $e) => in_array($e, $estadosValidos, true)
            );
            if (count($estadosSolicitados) === 1) {
                $where .= ' AND c.' . ColaExtraccionSamplesCols::ESTADO . ' = :estado';
                $params['estado'] = $estadosSolicitados[0];
            } elseif (count($estadosSolicitados) > 1) {
                $placeholders = [];
                foreach ($estadosSolicitados as $i => $e) {
                    $key = "estado_{$i}";
                    $placeholders[] = ":{$key}";
                    $params[$key] = $e;
                }
                $where .= ' AND c.' . ColaExtraccionSamplesCols::ESTADO . ' IN (' . implode(',', $placeholders) . ')';
            }
        }

        /* Filtro lado */
        $ladosValidos = ColaExtraccionSamplesEnums::TODOS_LADO;
        if (!empty($lado) && in_array($lado, $ladosValidos, true)) {
            $where .= ' AND c.' . ColaExtraccionSamplesCols::LADO . ' = :lado';
            $params['lado'] = $lado;
        }

        $data = SamplesRepository::consultar(
            "SELECT c." . ColaExtraccionSamplesCols::ID
                . ', c.' . ColaExtraccionSamplesCols::RELACION_ID
                . ', c.' . ColaExtraccionSamplesCols::YOUTUBE_ID
                . ', c.' . ColaExtraccionSamplesCols::SPOTIFY_ID
                . ', c.' . ColaExtraccionSamplesCols::ESTADO
                . ', c.' . ColaExtraccionSamplesCols::INTENTOS
                . ', c.' . ColaExtraccionSamplesCols::LADO
                . ', c.' . ColaExtraccionSamplesCols::ERROR_MENSAJE
                . ', c.' . ColaExtraccionSamplesCols::SAMPLE_ID
                . ', c.' . ColaExtraccionSamplesCols::TIMING_INICIO_SEG
                . ', c.' . ColaExtraccionSamplesCols::COMPAS_INICIO_SEG
                . ', c.' . ColaExtraccionSamplesCols::COMPAS_FIN_SEG
                . ', c.' . ColaExtraccionSamplesCols::BPM_DETECTADO
                . ', c.' . ColaExtraccionSamplesCols::PROCESADO_AT
                . ', c.' . ColaExtraccionSamplesCols::CREATED_AT
                . ', c.' . ColaExtraccionSamplesCols::PROXIMO_INTENTO_AT
                . " FROM {$tc} c WHERE {$where}"
                . ' ORDER BY c.' . self::resolverSort($sortCol, ColaExtraccionSamplesCols::TODAS, ColaExtraccionSamplesCols::CREATED_AT) . ' ' . self::resolverDir($sortDir) . ', c.' . ColaExtraccionSamplesCols::ID . ' DESC'
                . ' LIMIT :porPagina OFFSET :offset',
            $params
        );

        $paramsCount = array_diff_key($params, ['offset' => true, 'porPagina' => true]);
        $total = SamplesRepository::consultarUno(
            "SELECT COUNT(*) as total FROM {$tc} c WHERE {$where}",
            $paramsCount
        );

        return [
            'data'  => $data,
            'total' => (int) ($total['total'] ?? 0),
        ];
    }

    /*
     * Valida y resuelve columna de ordenamiento contra whitelist del Schema.
     * Si la columna no es valida, retorna el default.
     */
    private static function resolverSort(string $col, array $permitidas, string $default): string
    {
        return in_array($col, $permitidas, true) ? $col : $default;
    }

    /*
     * Valida dirección de ordenamiento. Solo ASC o DESC.
     */
    private static function resolverDir(string $dir): string
    {
        return strtoupper($dir) === 'ASC' ? 'ASC' : 'DESC';
    }

    /*
     * QK66: Conteo de registros por estado en cola_extraccion_samples.
     * Retorna solo estados con al menos 1 registro (para select dinámico).
     */
    public static function conteoEstadosCola(): array
    {
        $tc = ColaExtraccionSamplesCols::TABLA;
        $rows = SamplesRepository::consultar(
            "SELECT " . ColaExtraccionSamplesCols::ESTADO . " as estado, COUNT(*) as total "
                . "FROM {$tc} GROUP BY " . ColaExtraccionSamplesCols::ESTADO
                . " ORDER BY total DESC"
        );
        $result = [];
        foreach ($rows as $row) {
            $result[$row['estado']] = (int) $row['total'];
        }
        return $result;
    }

    /*
     * QK66: Conteo de registros por estado en scraping_log.
     */
    public static function conteoEstadosScraping(): array
    {
        $t = ScrapingLogCols::TABLA;
        $rows = SamplesRepository::consultar(
            "SELECT " . ScrapingLogCols::ESTADO . " as estado, COUNT(*) as total "
                . "FROM {$t} GROUP BY " . ScrapingLogCols::ESTADO
                . " ORDER BY total DESC"
        );
        $result = [];
        foreach ($rows as $row) {
            $result[$row['estado']] = (int) $row['total'];
        }
        return $result;
    }
}
