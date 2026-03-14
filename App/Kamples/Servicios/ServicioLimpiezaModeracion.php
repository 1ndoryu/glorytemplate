<?php

declare(strict_types=1);

namespace App\Kamples\Servicios;

use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\KamplesLogger;

/*
 * QK48: Limpieza automatica de metadata de moderacion.
 * Cada dia, borra moderacion_detalle y moderacion_razon de publicaciones
 * aprobadas hace mas de 7 dias. La publicacion persiste normalmente;
 * solo se elimina la info del panel de moderacion para no acumular datos.
 */
class ServicioLimpiezaModeracion
{
    private const DIAS_RETENCION = 7;

    public static function limpiarAprobadas(): array
    {
        $tabla = PublicacionesCols::TABLA;
        $colEstado = PublicacionesCols::MODERACION_ESTADO;
        $colDetalle = PublicacionesCols::MODERACION_DETALLE;
        $colRazon = PublicacionesCols::MODERACION_RAZON;
        $colUpdated = PublicacionesCols::UPDATED_AT;

        try {
            $afectadas = PublicacionesRepository::ejecutar(
                "UPDATE {$tabla} SET {$colDetalle} = NULL, {$colRazon} = NULL "
                . "WHERE {$colEstado} = :estado "
                . "AND {$colUpdated} < NOW() - INTERVAL '" . self::DIAS_RETENCION . " days' "
                . "AND ({$colDetalle} IS NOT NULL OR {$colRazon} IS NOT NULL)",
                ['estado' => PublicacionesEnums::MODERACION_ESTADO_APROBADO]
            );

            return ['totalLimpiadas' => $afectadas];
        } catch (\Throwable $e) {
            KamplesLogger::error('[LIMPIEZA-MODERACION] Error limpiando aprobadas', [
                'error' => $e->getMessage(),
            ]);
            return ['totalLimpiadas' => 0, 'error' => $e->getMessage()];
        }
    }
}
