<?php

/**
 * UnificadorDuplicadosExtraccion — QK53
 *
 * Detecta y unifica samples duplicados creados por el pipeline de extraccion.
 * Dos samples se consideran duplicados cuando provienen del mismo video YouTube,
 * mismo lado de la relacion, y su timing de inicio y duracion difieren en <= 5 segundos.
 *
 * Logica:
 * - El sample con ID mas bajo (el primero creado) se considera el canonico.
 * - Los duplicados no se eliminan: sus relaciones se re-apuntan al canonico.
 * - Los items de cola de los duplicados se marcan como 'unificado'.
 * - Los samples duplicados se marcan con metadata 'unificado_en' para trazabilidad.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\ColaExtraccionSamplesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\ColaExtraccionSamplesCols;
use App\Config\Schema\_generated\ColaExtraccionSamplesEnums;
use App\Config\Schema\_generated\RelacionesSampleCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;

class UnificadorDuplicadosExtraccion
{
    private const TOLERANCIA_SEG = 5.0;

    /**
     * Ejecuta la unificacion retroactiva de duplicados existentes.
     * @return array{grupos: int, unificados: int, errores: int}
     */
    public static function ejecutar(): array
    {
        $grupos = self::detectarGruposDuplicados();
        $totalUnificados = 0;
        $totalErrores = 0;

        foreach ($grupos as $grupo) {
            try {
                $unificados = self::unificarGrupo($grupo);
                $totalUnificados += $unificados;
            } catch (\Throwable $e) {
                $totalErrores++;
                KamplesLogger::error('[UNIFICADOR] Error al unificar grupo', [
                    'youtube_id' => $grupo['youtube_id'] ?? '?',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        KamplesLogger::info('[UNIFICADOR] Ejecucion completada', [
            'grupos' => count($grupos),
            'unificados' => $totalUnificados,
            'errores' => $totalErrores,
        ]);

        return [
            'grupos' => count($grupos),
            'unificados' => $totalUnificados,
            'errores' => $totalErrores,
        ];
    }

    /**
     * Detecta grupos de samples que son el mismo recorte de audio pero publicados como
     * entries separadas. Agrupa por youtube_id + lado + timing similar.
     */
    private static function detectarGruposDuplicados(): array
    {
        $tc = ColaExtraccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;

        /*
         * Estrategia: self-join de cola_extraccion_samples donde dos entries comparten
         * youtube_id, lado, timing similar y duracion similar pero tienen sample_id distinto.
         * Agrupamos por el sample_id mas bajo (canonico) y listamos los duplicados.
         */
        $candidatos = ColaExtraccionSamplesRepository::consultar(
            "SELECT ce1." . ColaExtraccionSamplesCols::SAMPLE_ID . " AS canonico_id,"
            . " ce2." . ColaExtraccionSamplesCols::SAMPLE_ID . " AS duplicado_id,"
            . " ce2." . ColaExtraccionSamplesCols::ID . " AS cola_duplicado_id,"
            . " ce1." . ColaExtraccionSamplesCols::YOUTUBE_ID . " AS youtube_id,"
            . " ce1." . ColaExtraccionSamplesCols::LADO . " AS lado"
            . " FROM {$tc} ce1"
            . " JOIN {$tc} ce2 ON ce2." . ColaExtraccionSamplesCols::YOUTUBE_ID
            .     " = ce1." . ColaExtraccionSamplesCols::YOUTUBE_ID
            .     " AND ce2." . ColaExtraccionSamplesCols::LADO
            .     " = ce1." . ColaExtraccionSamplesCols::LADO
            .     " AND ce2." . ColaExtraccionSamplesCols::SAMPLE_ID
            .     " != ce1." . ColaExtraccionSamplesCols::SAMPLE_ID
            .     " AND ce2." . ColaExtraccionSamplesCols::SAMPLE_ID
            .     " > ce1." . ColaExtraccionSamplesCols::SAMPLE_ID
            .     " AND ABS(COALESCE(ce2." . ColaExtraccionSamplesCols::TIMING_INICIO_SEG . ", 0)"
            .         " - COALESCE(ce1." . ColaExtraccionSamplesCols::TIMING_INICIO_SEG . ", 0)) <= "
            .         self::TOLERANCIA_SEG
            .     " AND ABS(COALESCE(ce2." . ColaExtraccionSamplesCols::DURACION_COMPAS_SEG . ", 0)"
            .         " - COALESCE(ce1." . ColaExtraccionSamplesCols::DURACION_COMPAS_SEG . ", 0)) <= "
            .         self::TOLERANCIA_SEG
            . " JOIN {$ts} s1 ON s1." . SamplesCols::ID . " = ce1." . ColaExtraccionSamplesCols::SAMPLE_ID
            . " JOIN {$ts} s2 ON s2." . SamplesCols::ID . " = ce2." . ColaExtraccionSamplesCols::SAMPLE_ID
            . " WHERE ce1." . ColaExtraccionSamplesCols::ESTADO . " = '" . ColaExtraccionSamplesEnums::ESTADO_COMPLETADO . "'"
            . " AND ce2." . ColaExtraccionSamplesCols::ESTADO . " = '" . ColaExtraccionSamplesEnums::ESTADO_COMPLETADO . "'"
            . " AND s1." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
            . " AND s2." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
            . " ORDER BY ce1." . ColaExtraccionSamplesCols::SAMPLE_ID . " ASC",
            []
        );

        /*
         * Agrupar por canonico_id: cada grupo tiene el canonico y sus duplicados.
         * Un sample puede aparecer como duplicado de varios canonicos si hay cadenas,
         * pero al procesar siempre tomamos el ID mas bajo como canonico.
         */
        $grupos = [];
        $yaAsignado = [];

        foreach ($candidatos as $row) {
            $canonicoId = (int) $row['canonico_id'];
            $duplicadoId = (int) $row['duplicado_id'];
            $colaDupId = (int) $row['cola_duplicado_id'];

            /* Evitar que un sample asignado como duplicado sea tambien canonico en otro grupo */
            if (isset($yaAsignado[$duplicadoId])) {
                continue;
            }

            if (!isset($grupos[$canonicoId])) {
                $grupos[$canonicoId] = [
                    'canonico_id' => $canonicoId,
                    'youtube_id' => $row['youtube_id'],
                    'lado' => $row['lado'],
                    'duplicados' => [],
                ];
            }

            $grupos[$canonicoId]['duplicados'][] = [
                'sample_id' => $duplicadoId,
                'cola_id' => $colaDupId,
            ];

            $yaAsignado[$duplicadoId] = $canonicoId;
        }

        return array_values($grupos);
    }

    /**
     * Unifica un grupo: re-apunta relaciones de los duplicados al canonico.
     * @return int Cantidad de samples duplicados unificados
     */
    private static function unificarGrupo(array $grupo): int
    {
        $canonicoId = (int) $grupo['canonico_id'];
        $unificados = 0;

        foreach ($grupo['duplicados'] as $dup) {
            $dupSampleId = (int) $dup['sample_id'];
            $dupColaId = (int) $dup['cola_id'];

            try {
                /* Re-apuntar relaciones que referencian el sample duplicado al canonico */
                self::redirigirRelaciones($dupSampleId, $canonicoId);

                /* Marcar el item de cola como unificado, apuntando al sample canonico */
                ColaExtraccionSamplesRepository::ejecutar(
                    "UPDATE " . ColaExtraccionSamplesCols::TABLA
                    . " SET " . ColaExtraccionSamplesCols::ESTADO . " = :estado,"
                    . " " . ColaExtraccionSamplesCols::SAMPLE_ID . " = :canonico_id"
                    . " WHERE " . ColaExtraccionSamplesCols::ID . " = :id",
                    [
                        'estado' => ColaExtraccionSamplesEnums::ESTADO_UNIFICADO,
                        'canonico_id' => $canonicoId,
                        'id' => $dupColaId,
                    ]
                );

                /* Marcar el sample duplicado con metadata de trazabilidad (no se elimina) */
                try {
                    SamplesRepository::agregarMetadata($dupSampleId, [
                        'unificado_en' => $canonicoId,
                        'unificado_at' => \date('c'),
                    ]);
                } catch (\Throwable $e) {
                    /* Metadata de trazabilidad no es critica, solo loggear */
                    KamplesLogger::warning('[UNIFICADOR] No se pudo guardar metadata de unificacion', [
                        'dupSampleId' => $dupSampleId, 'error' => $e->getMessage(),
                    ]);
                }

                $unificados++;

                KamplesLogger::info('[UNIFICADOR] Sample duplicado unificado', [
                    'canonicoId' => $canonicoId,
                    'duplicadoId' => $dupSampleId,
                    'colaId' => $dupColaId,
                ]);
            } catch (\Throwable $e) {
                KamplesLogger::error('[UNIFICADOR] Error al unificar duplicado', [
                    'canonicoId' => $canonicoId,
                    'duplicadoId' => $dupSampleId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $unificados;
    }

    /**
     * Redirige las relaciones (sample_fuente_id / sample_destino_id)
     * que apuntan al sample duplicado para que apunten al canonico.
     */
    private static function redirigirRelaciones(int $dupSampleId, int $canonicoId): void
    {
        $tr = RelacionesSampleCols::TABLA;

        /* Redirigir sample_fuente_id */
        RelacionesSampleRepository::ejecutar(
            "UPDATE {$tr} SET " . RelacionesSampleCols::SAMPLE_FUENTE_ID . " = :canonico"
            . " WHERE " . RelacionesSampleCols::SAMPLE_FUENTE_ID . " = :dup",
            ['canonico' => $canonicoId, 'dup' => $dupSampleId]
        );

        /* Redirigir sample_destino_id */
        RelacionesSampleRepository::ejecutar(
            "UPDATE {$tr} SET " . RelacionesSampleCols::SAMPLE_DESTINO_ID . " = :canonico"
            . " WHERE " . RelacionesSampleCols::SAMPLE_DESTINO_ID . " = :dup",
            ['canonico' => $canonicoId, 'dup' => $dupSampleId]
        );
    }
}
