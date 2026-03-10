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
}
