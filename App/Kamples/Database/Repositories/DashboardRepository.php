<?php

/**
 * DashboardRepository — Queries de estadísticas del creador para el dashboard.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\FollowsCols;
use App\Kamples\Database\PostgresService;

class DashboardRepository
{
    /*
     * Obtiene métricas del mes actual para un creador en una sola query.
     * OPT01: 4 queries combinadas con subqueries escalares.
     * PDO con ATTR_EMULATE_PREPARES=false prohíbe reusar placeholders,
     * por eso se usan uid1-uid4 con el mismo valor.
     *
     * @return array{descargas_mes: int, reproducciones_mes: int, reproducciones_totales: int, seguidores_nuevos: int}|null
     */
    public static function statsMesCreador(int $userId): ?array
    {
        $td = DescargasCols::TABLA;
        $tr = ReproduccionesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $tf = FollowsCols::TABLA;

        return PostgresService::consultarUno(
            "SELECT"
            . " (SELECT COUNT(*) FROM {$td} d JOIN {$ts} s ON d." . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . "  WHERE s." . SamplesCols::CREADOR_ID . " = :uid1"
            . "  AND d." . DescargasCols::CREATED_AT . " >= date_trunc('month', NOW())) as descargas_mes,"
            . " (SELECT COUNT(*) FROM {$tr} r JOIN {$ts} s ON r." . ReproduccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . "  WHERE s." . SamplesCols::CREADOR_ID . " = :uid2"
            . "  AND r." . ReproduccionesCols::CREATED_AT . " >= date_trunc('month', NOW())) as reproducciones_mes,"
            . " (SELECT COALESCE(SUM(" . SamplesCols::TOTAL_REPRODUCCIONES . "), 0) FROM {$ts}"
            . "  WHERE " . SamplesCols::CREADOR_ID . " = :uid3) as reproducciones_totales,"
            . " (SELECT COUNT(*) FROM {$tf}"
            . "  WHERE " . FollowsCols::SEGUIDO_ID . " = :uid4"
            . "  AND " . FollowsCols::CREATED_AT . " >= date_trunc('month', NOW())) as seguidores_nuevos",
            ['uid1' => $userId, 'uid2' => $userId, 'uid3' => $userId, 'uid4' => $userId]
        );
    }
}
