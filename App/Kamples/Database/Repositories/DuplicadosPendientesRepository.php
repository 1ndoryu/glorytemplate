<?php

/**
 * DuplicadosPendientesRepository — Acceso a datos para tabla 'duplicados_pendientes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\DuplicadosPendientesCols;
use App\Config\Schema\_generated\DuplicadosPendientesEnums;
use App\Config\Schema\_generated\DuplicadosPendientesDTO;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\DescargasCols;
use App\Kamples\Services\ReprocesadorPostDuplicado;

class DuplicadosPendientesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return DuplicadosPendientesCols::TABLA;
    }

    protected static function colId(): string
    {
        return DuplicadosPendientesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = DuplicadosPendientesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . DuplicadosPendientesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /**
     * Contar duplicados con estado 'pendiente' (para badge en navegacion admin).
     */
    public static function contarPendientes(): int
    {
        $tabla = DuplicadosPendientesCols::TABLA;
        $val   = static::consultarValor(
            "SELECT COUNT(*) FROM {$tabla} WHERE " . DuplicadosPendientesCols::ESTADO . " = :estado",
            ['estado' => DuplicadosPendientesEnums::ESTADO_PENDIENTE]
        );
        return (int) ($val ?? 0);
    }

    /**
     * Listar duplicados paginados con datos basicos de los dos samples (JOINs).
     */
    public static function listar(string $estado, ?string $tipo, int $pagina, int $porPagina): array
    {
        $tabla    = DuplicadosPendientesCols::TABLA;
        $tSamples = SamplesCols::TABLA;
        $tUsuarios = UsuariosExtCols::TABLA;
        $offset   = ($pagina - 1) * $porPagina;

        $params     = ['estado' => $estado, 'limit' => $porPagina, 'offset' => $offset];
        $whereTipo  = '';
        if ($tipo !== null) {
            $whereTipo     = ' AND dp.' . DuplicadosPendientesCols::TIPO . ' = :tipo';
            $params['tipo'] = $tipo;
        }

        return static::consultar(
            "SELECT dp.*,
                so." . SamplesCols::TITULO . " AS original_titulo,
                so." . SamplesCols::ID_CORTO . " AS original_id_corto,
                so." . SamplesCols::AUDIO_HASH . " AS original_hash,
                so." . SamplesCols::ESTADO . " AS original_estado,
                so." . SamplesCols::RUTA_PREVIEW . " AS original_ruta_preview,
                so." . SamplesCols::RUTA_ORIGINAL . " AS original_ruta_original,
                so." . SamplesCols::RUTA_WAVEFORM . " AS original_ruta_waveform,
                so." . SamplesCols::SLUG . " AS original_slug,
                so." . SamplesCols::CREADOR_ID . " AS original_creador_id,
                so." . SamplesCols::PUBLICADO_AT . " AS original_subido_at,
                uo." . UsuariosExtCols::NOMBRE_VISIBLE . " AS original_creador,
                sd." . SamplesCols::TITULO . " AS duplicado_titulo,
                sd." . SamplesCols::ID_CORTO . " AS duplicado_id_corto,
                sd." . SamplesCols::AUDIO_HASH . " AS duplicado_hash,
                sd." . SamplesCols::ESTADO . " AS duplicado_estado,
                sd." . SamplesCols::RUTA_PREVIEW . " AS duplicado_ruta_preview,
                sd." . SamplesCols::RUTA_ORIGINAL . " AS duplicado_ruta_original,
                sd." . SamplesCols::RUTA_WAVEFORM . " AS duplicado_ruta_waveform,
                sd." . SamplesCols::SLUG . " AS duplicado_slug,
                sd." . SamplesCols::CREADOR_ID . " AS duplicado_creador_id,
                sd." . SamplesCols::PUBLICADO_AT . " AS duplicado_subido_at,
                ud." . UsuariosExtCols::NOMBRE_VISIBLE . " AS duplicado_creador
            FROM {$tabla} dp
            LEFT JOIN {$tSamples} so ON dp." . DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID . " = so." . SamplesCols::ID . "
            LEFT JOIN {$tSamples} sd ON dp." . DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID . " = sd." . SamplesCols::ID . "
            LEFT JOIN {$tUsuarios} uo ON so." . SamplesCols::CREADOR_ID . " = uo." . UsuariosExtCols::ID . "
            LEFT JOIN {$tUsuarios} ud ON sd." . SamplesCols::CREADOR_ID . " = ud." . UsuariosExtCols::ID . "
            WHERE dp." . DuplicadosPendientesCols::ESTADO . " = :estado{$whereTipo}
            ORDER BY dp." . DuplicadosPendientesCols::CREATED_AT . " DESC
            LIMIT :limit OFFSET :offset",
            $params
        );
    }

    /**
     * Fusionar: conservar original, transferir likes/descargas/colecciones, soft-delete duplicado.
     */
    public static function fusionar(int $registroId, int $adminId): bool
    {
        $registro = static::buscarPorId($registroId);
        if (!$registro || $registro[DuplicadosPendientesCols::ESTADO] !== DuplicadosPendientesEnums::ESTADO_PENDIENTE) {
            return false;
        }

        $originalId  = (int) $registro[DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID];
        $duplicadoId = (int) $registro[DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID];

        self::transferirRelaciones($originalId, $duplicadoId);

        /* Soft-delete del sample duplicado para preservar integridad referencial */
        $tSamples = SamplesCols::TABLA;
        static::ejecutar(
            "UPDATE {$tSamples} SET " . SamplesCols::ESTADO . " = :estado WHERE " . SamplesCols::ID . " = :id",
            ['estado' => SamplesEnums::ESTADO_ELIMINADO, 'id' => $duplicadoId]
        );

        self::recalcularConteos($originalId);

        return static::marcarResuelto($registroId, $adminId, DuplicadosPendientesEnums::ESTADO_FUSIONADO);
    }

    /**
     * Aprobar: ambos samples coexisten (no es duplicado real).
     * Restaura el sample duplicado a 'procesando' y programa el pipeline completo
     * (omitiendo dedup) para generar preview, waveform, IA tags, etc.
     */
    public static function aprobar(int $registroId, int $adminId): bool
    {
        $registro = static::buscarPorId($registroId);
        if (!$registro || $registro[DuplicadosPendientesCols::ESTADO] !== DuplicadosPendientesEnums::ESTADO_PENDIENTE) {
            return false;
        }

        /*
         * El sample duplicado fue interrumpido en el pipeline (paso 2.5) antes de generar
         * preview, waveform, IA tags, etc. Restaurar a 'procesando' y re-encolar pipeline.
         */
        $duplicadoId = (int) $registro[DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID];
        $tSamples = SamplesCols::TABLA;
        static::ejecutar(
            "UPDATE {$tSamples} SET " . SamplesCols::ESTADO . " = :estado WHERE " . SamplesCols::ID . " = :id",
            ['estado' => SamplesEnums::ESTADO_PROCESANDO, 'id' => $duplicadoId]
        );

        /* Programar re-procesamiento en background (5s de delay para evitar colision) */
        \wp_schedule_single_event(\time() + 5, ReprocesadorPostDuplicado::HOOK, [$duplicadoId]);

        return static::marcarResuelto($registroId, $adminId, DuplicadosPendientesEnums::ESTADO_APROBADO);
    }

    /**
     * Rechazar: soft-delete del sample duplicado, cerrar registro como rechazado.
     */
    public static function rechazar(int $registroId, int $adminId): bool
    {
        $registro = static::buscarPorId($registroId);
        if (!$registro || $registro[DuplicadosPendientesCols::ESTADO] !== DuplicadosPendientesEnums::ESTADO_PENDIENTE) {
            return false;
        }

        $duplicadoId = (int) $registro[DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID];
        $tSamples    = SamplesCols::TABLA;
        static::ejecutar(
            "UPDATE {$tSamples} SET " . SamplesCols::ESTADO . " = :estado WHERE " . SamplesCols::ID . " = :id",
            ['estado' => SamplesEnums::ESTADO_ELIMINADO, 'id' => $duplicadoId]
        );

        return static::marcarResuelto($registroId, $adminId, DuplicadosPendientesEnums::ESTADO_RECHAZADO);
    }

    /**
     * Intercambiar: invertir roles original<->duplicado y luego fusionar.
     * Util cuando el admin detecta que se identifico mal cual es el original.
     */
    public static function intercambiar(int $registroId, int $adminId): bool
    {
        $registro = static::buscarPorId($registroId);
        if (!$registro || $registro[DuplicadosPendientesCols::ESTADO] !== DuplicadosPendientesEnums::ESTADO_PENDIENTE) {
            return false;
        }

        $tabla = DuplicadosPendientesCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET
                " . DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID . " = :nuevo_original,
                " . DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID . " = :nuevo_duplicado
            WHERE " . DuplicadosPendientesCols::ID . " = :id",
            [
                'nuevo_original'  => $registro[DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID],
                'nuevo_duplicado' => $registro[DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID],
                'id' => $registroId,
            ]
        );

        /* fusionar re-lee el registro con los IDs ya intercambiados */
        return static::fusionar($registroId, $adminId);
    }

    /* Helpers privados */

    /*
     * Transfiere likes, descargas y entradas de coleccion del duplicado al original.
     * Usa NOT EXISTS para evitar conflictos de unicidad en likes y colecciones.
     */
    private static function transferirRelaciones(int $originalId, int $duplicadoId): void
    {
        $tLikes = LikesCols::TABLA;
        $tDesc  = DescargasCols::TABLA;
        $tCol   = ColeccionSamplesCols::TABLA;
        $tipo   = LikesEnums::TIPO_SAMPLE;

        /* Likes: copiar los que no generan conflicto, luego limpiar */
        static::ejecutar(
            "INSERT INTO {$tLikes}
                (" . LikesCols::USUARIO_ID . ", " . LikesCols::TIPO . ", " . LikesCols::TARGET_ID . ", " . LikesCols::CREATED_AT . ", " . LikesCols::REACCION . ")
            SELECT l." . LikesCols::USUARIO_ID . ", l." . LikesCols::TIPO . ", :orig_id, l." . LikesCols::CREATED_AT . ", l." . LikesCols::REACCION . "
            FROM {$tLikes} l
            WHERE l." . LikesCols::TIPO . " = :tipo AND l." . LikesCols::TARGET_ID . " = :dup_id
              AND NOT EXISTS (
                  SELECT 1 FROM {$tLikes}
                  WHERE " . LikesCols::USUARIO_ID . " = l." . LikesCols::USUARIO_ID . "
                    AND " . LikesCols::TIPO . " = :tipo
                    AND " . LikesCols::TARGET_ID . " = :orig_id
              )",
            ['orig_id' => $originalId, 'dup_id' => $duplicadoId, 'tipo' => $tipo]
        );
        static::ejecutar(
            "DELETE FROM {$tLikes} WHERE " . LikesCols::TIPO . " = :tipo AND " . LikesCols::TARGET_ID . " = :dup_id",
            ['tipo' => $tipo, 'dup_id' => $duplicadoId]
        );

        /* Descargas: reasignar directamente (no hay constraint de unicidad por usuario+sample) */
        static::ejecutar(
            "UPDATE {$tDesc} SET " . DescargasCols::SAMPLE_ID . " = :orig_id WHERE " . DescargasCols::SAMPLE_ID . " = :dup_id",
            ['orig_id' => $originalId, 'dup_id' => $duplicadoId]
        );

        /* Colecciones: copiar las que no generan conflicto, luego limpiar */
        static::ejecutar(
            "INSERT INTO {$tCol}
                (" . ColeccionSamplesCols::COLECCION_ID . ", " . ColeccionSamplesCols::SAMPLE_ID . ", " . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::POSICION . ", " . ColeccionSamplesCols::ADDED_AT . ")
            SELECT cs." . ColeccionSamplesCols::COLECCION_ID . ", :orig_id, cs." . ColeccionSamplesCols::USUARIO_ID . ", cs." . ColeccionSamplesCols::POSICION . ", cs." . ColeccionSamplesCols::ADDED_AT . "
            FROM {$tCol} cs
            WHERE cs." . ColeccionSamplesCols::SAMPLE_ID . " = :dup_id
              AND NOT EXISTS (
                  SELECT 1 FROM {$tCol}
                  WHERE " . ColeccionSamplesCols::COLECCION_ID . " = cs." . ColeccionSamplesCols::COLECCION_ID . "
                    AND " . ColeccionSamplesCols::SAMPLE_ID . " = :orig_id
              )",
            ['orig_id' => $originalId, 'dup_id' => $duplicadoId]
        );
        static::ejecutar(
            "DELETE FROM {$tCol} WHERE " . ColeccionSamplesCols::SAMPLE_ID . " = :dup_id",
            ['dup_id' => $duplicadoId]
        );
    }

    /*
     * Recalcula total_likes y total_descargas en base a datos reales de BD.
     */
    private static function recalcularConteos(int $sampleId): void
    {
        $tSamples = SamplesCols::TABLA;
        $tLikes   = LikesCols::TABLA;
        $tDesc    = DescargasCols::TABLA;

        static::ejecutar(
            "UPDATE {$tSamples} SET
                " . SamplesCols::TOTAL_LIKES . " = (
                    SELECT COUNT(*) FROM {$tLikes}
                    WHERE " . LikesCols::TIPO . " = :tipo AND " . LikesCols::TARGET_ID . " = :id
                      AND " . LikesCols::REACCION . " != :dislike
                ),
                " . SamplesCols::TOTAL_DESCARGAS . " = (
                    SELECT COUNT(*) FROM {$tDesc}
                    WHERE " . DescargasCols::SAMPLE_ID . " = :id
                )
            WHERE " . SamplesCols::ID . " = :id",
            ['id' => $sampleId, 'tipo' => LikesEnums::TIPO_SAMPLE, 'dislike' => LikesEnums::REACCION_DISLIKE]
        );
    }

    /*
     * Actualiza estado, resuelto_por y resuelto_at en el registro de duplicado.
     */
    private static function marcarResuelto(int $registroId, int $adminId, string $estado): bool
    {
        $tabla     = DuplicadosPendientesCols::TABLA;
        $afectadas = static::ejecutar(
            "UPDATE {$tabla} SET
                " . DuplicadosPendientesCols::ESTADO . " = :estado,
                " . DuplicadosPendientesCols::RESUELTO_POR . " = :admin,
                " . DuplicadosPendientesCols::RESUELTO_AT . " = NOW()
            WHERE " . DuplicadosPendientesCols::ID . " = :id",
            ['estado' => $estado, 'admin' => $adminId, 'id' => $registroId]
        );
        return $afectadas > 0;
    }
}
