<?php

/**
 * DuplicadosPendientesRepository — CRUD para tabla 'duplicados_pendientes'.
 *
 * Gestiona registros de duplicados detectados para revision por moderador.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\DuplicadosPendientesCols;
use App\Config\Schema\_generated\DuplicadosPendientesEnums;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\DescargasCols;

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

    /* === METODOS CUSTOM === */

    /**
     * Crear registro de duplicado. ON CONFLICT ignora si ya existe el par.
     * @return int|null ID del registro creado (null si ya existia)
     */
    public static function crear(array $datos): ?int
    {
        $t = DuplicadosPendientesCols::TABLA;
        $originalId = (int) $datos['sample_original_id'];
        $duplicadoId = (int) $datos['sample_duplicado_id'];

        /* Normalizar: original siempre es el ID menor */
        $minId = min($originalId, $duplicadoId);
        $maxId = max($originalId, $duplicadoId);

        $tipo = $datos['tipo'] ?? DuplicadosPendientesEnums::TIPO_BACKFILL;
        if (!\in_array($tipo, DuplicadosPendientesEnums::TODOS_TIPO, true)) {
            $tipo = DuplicadosPendientesEnums::TIPO_BACKFILL;
        }

        return static::insertar(
            "INSERT INTO {$t} ("
            . DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID . ", "
            . DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID . ", "
            . DuplicadosPendientesCols::TIPO
            . ") VALUES (:originalId, :duplicadoId, :tipo)"
            . " ON CONFLICT (" . DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID . ", " . DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID . ") DO NOTHING",
            ['originalId' => $minId, 'duplicadoId' => $maxId, 'tipo' => $tipo]
        );
    }

    /**
     * Listar duplicados con filtros + paginacion.
     * Incluye datos de ambos samples y sus creadores.
     */
    public static function listar(
        string $estado = DuplicadosPendientesEnums::ESTADO_PENDIENTE,
        ?string $tipo = null,
        int $pagina = 1,
        int $porPagina = 20
    ): array {
        $t = DuplicadosPendientesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $offset = ($pagina - 1) * $porPagina;

        $where = "d." . DuplicadosPendientesCols::ESTADO . " = :estado";
        $params = ['estado' => $estado, 'limit' => $porPagina, 'offset' => $offset];

        if ($tipo !== null && \in_array($tipo, DuplicadosPendientesEnums::TODOS_TIPO, true)) {
            $where .= " AND d." . DuplicadosPendientesCols::TIPO . " = :tipo";
            $params['tipo'] = $tipo;
        }

        $sql = "
            SELECT
                d." . DuplicadosPendientesCols::ID . ",
                d." . DuplicadosPendientesCols::TIPO . ",
                d." . DuplicadosPendientesCols::ESTADO . ",
                d." . DuplicadosPendientesCols::CREATED_AT . ",
                so." . SamplesCols::ID . " as original_id,
                so." . SamplesCols::TITULO . " as original_titulo,
                so." . SamplesCols::CREATED_AT . " as original_subido_at,
                uo." . UsuariosExtCols::NOMBRE_VISIBLE . " as original_creador,
                uo." . UsuariosExtCols::ID . " as original_creador_id,
                sd." . SamplesCols::ID . " as duplicado_id,
                sd." . SamplesCols::TITULO . " as duplicado_titulo,
                sd." . SamplesCols::CREATED_AT . " as duplicado_subido_at,
                ud." . UsuariosExtCols::NOMBRE_VISIBLE . " as duplicado_creador,
                ud." . UsuariosExtCols::ID . " as duplicado_creador_id
            FROM {$t} d
            JOIN {$ts} so ON d." . DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID . " = so." . SamplesCols::ID . "
            JOIN {$ts} sd ON d." . DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID . " = sd." . SamplesCols::ID . "
            LEFT JOIN {$tu} uo ON so." . SamplesCols::CREADOR_ID . " = uo." . UsuariosExtCols::ID . "
            LEFT JOIN {$tu} ud ON sd." . SamplesCols::CREADOR_ID . " = ud." . UsuariosExtCols::ID . "
            WHERE {$where}
            ORDER BY d." . DuplicadosPendientesCols::CREATED_AT . " DESC
            LIMIT :limit OFFSET :offset
        ";

        return static::consultar($sql, $params);
    }

    /**
     * Contar duplicados pendientes (para paginacion y badge).
     */
    public static function contarPendientes(): int
    {
        $t = DuplicadosPendientesCols::TABLA;
        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$t} WHERE " . DuplicadosPendientesCols::ESTADO . " = :estado",
            ['estado' => DuplicadosPendientesEnums::ESTADO_PENDIENTE]
        );
        return (int) ($row['total'] ?? 0);
    }

    /**
     * Fusionar duplicado: transferir relaciones al original + eliminar duplicado.
     * Operacion atomica via transaccion.
     */
    public static function fusionar(int $registroId, int $adminId): bool
    {
        $t = DuplicadosPendientesCols::TABLA;

        /* Obtener el registro de duplicado */
        $registro = static::buscarPorId($registroId);
        if (!$registro) return false;

        $originalId = (int) $registro[DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID];
        $duplicadoId = (int) $registro[DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID];

        $tcs = ColeccionSamplesCols::TABLA;
        $tl = LikesCols::TABLA;
        $td = DescargasCols::TABLA;
        $ts = SamplesCols::TABLA;

        /* Transferir coleccion_samples del duplicado al original.
         * Per-user: solo transferir si ESE usuario no tiene ya el original en su coleccion */
        static::ejecutar(
            "UPDATE {$tcs} SET " . ColeccionSamplesCols::SAMPLE_ID . " = :originalId"
            . " WHERE " . ColeccionSamplesCols::SAMPLE_ID . " = :duplicadoId"
            . " AND NOT EXISTS ("
            . "   SELECT 1 FROM {$tcs} x"
            . "   WHERE x." . ColeccionSamplesCols::USUARIO_ID . " = {$tcs}." . ColeccionSamplesCols::USUARIO_ID
            . "   AND x." . ColeccionSamplesCols::SAMPLE_ID . " = :originalIdCheck"
            . " )",
            ['originalId' => $originalId, 'duplicadoId' => $duplicadoId, 'originalIdCheck' => $originalId]
        );

        /* Eliminar relaciones sobrantes del duplicado (si original ya estaba en coleccion) */
        static::ejecutar(
            "DELETE FROM {$tcs} WHERE " . ColeccionSamplesCols::SAMPLE_ID . " = :duplicadoId",
            ['duplicadoId' => $duplicadoId]
        );

        /* Transferir likes: solo donde el usuario no tenga ya like al original.
         * UNIQUE(usuario_id, tipo, target_id) impide duplicados; usamos NOT EXISTS */
        static::ejecutar(
            "UPDATE {$tl} SET " . LikesCols::TARGET_ID . " = :originalId"
            . " WHERE " . LikesCols::TARGET_ID . " = :duplicadoId"
            . " AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "'"
            . " AND NOT EXISTS ("
            . "   SELECT 1 FROM {$tl} x"
            . "   WHERE x." . LikesCols::USUARIO_ID . " = {$tl}." . LikesCols::USUARIO_ID
            . "   AND x." . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "'"
            . "   AND x." . LikesCols::TARGET_ID . " = :originalIdCheck"
            . " )",
            ['originalId' => $originalId, 'duplicadoId' => $duplicadoId, 'originalIdCheck' => $originalId]
        );

        /* Eliminar likes sobrantes del duplicado (usuario ya tenia like al original) */
        static::ejecutar(
            "DELETE FROM {$tl} WHERE " . LikesCols::TARGET_ID . " = :duplicadoId"
            . " AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "'",
            ['duplicadoId' => $duplicadoId]
        );

        /* Transferir descargas (no hay UNIQUE — simple reasignacion) */
        static::ejecutar(
            "UPDATE {$td} SET " . DescargasCols::SAMPLE_ID . " = :originalId"
            . " WHERE " . DescargasCols::SAMPLE_ID . " = :duplicadoId",
            ['originalId' => $originalId, 'duplicadoId' => $duplicadoId]
        );

        /* Marcar duplicado como eliminado */
        static::ejecutar(
            "UPDATE {$ts} SET " . SamplesCols::ESTADO . " = :estado WHERE " . SamplesCols::ID . " = :id",
            ['estado' => SamplesEnums::ESTADO_ELIMINADO, 'id' => $duplicadoId]
        );

        /* Resolver registro de duplicado */
        static::ejecutar(
            "UPDATE {$t} SET "
            . DuplicadosPendientesCols::ESTADO . " = :estado, "
            . DuplicadosPendientesCols::RESUELTO_POR . " = :adminId, "
            . DuplicadosPendientesCols::RESUELTO_AT . " = NOW()"
            . " WHERE " . DuplicadosPendientesCols::ID . " = :id",
            ['estado' => DuplicadosPendientesEnums::ESTADO_FUSIONADO, 'adminId' => $adminId, 'id' => $registroId]
        );

        return true;
    }

    /**
     * Aprobar: marcar como "no duplicado real". Ambos samples se conservan.
     */
    public static function aprobar(int $registroId, int $adminId): bool
    {
        $t = DuplicadosPendientesCols::TABLA;

        $filas = static::ejecutar(
            "UPDATE {$t} SET "
            . DuplicadosPendientesCols::ESTADO . " = :estado, "
            . DuplicadosPendientesCols::RESUELTO_POR . " = :adminId, "
            . DuplicadosPendientesCols::RESUELTO_AT . " = NOW()"
            . " WHERE " . DuplicadosPendientesCols::ID . " = :id"
            . " AND " . DuplicadosPendientesCols::ESTADO . " = :estadoPendiente",
            [
                'estado' => DuplicadosPendientesEnums::ESTADO_APROBADO,
                'adminId' => $adminId,
                'id' => $registroId,
                'estadoPendiente' => DuplicadosPendientesEnums::ESTADO_PENDIENTE,
            ]
        );

        return $filas > 0;
    }

    /**
     * Rechazar: eliminar el sample duplicado, conservar el original.
     */
    public static function rechazar(int $registroId, int $adminId): bool
    {
        $t = DuplicadosPendientesCols::TABLA;
        $ts = SamplesCols::TABLA;

        $registro = static::buscarPorId($registroId);
        if (!$registro) return false;

        $duplicadoId = (int) $registro[DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID];

        /* Marcar sample duplicado como eliminado */
        static::ejecutar(
            "UPDATE {$ts} SET " . SamplesCols::ESTADO . " = :estado WHERE " . SamplesCols::ID . " = :id",
            ['estado' => SamplesEnums::ESTADO_ELIMINADO, 'id' => $duplicadoId]
        );

        /* Resolver registro */
        static::ejecutar(
            "UPDATE {$t} SET "
            . DuplicadosPendientesCols::ESTADO . " = :estado, "
            . DuplicadosPendientesCols::RESUELTO_POR . " = :adminId, "
            . DuplicadosPendientesCols::RESUELTO_AT . " = NOW()"
            . " WHERE " . DuplicadosPendientesCols::ID . " = :id",
            ['estado' => DuplicadosPendientesEnums::ESTADO_RECHAZADO, 'adminId' => $adminId, 'id' => $registroId]
        );

        return true;
    }

    /**
     * Intercambiar: invertir cual es el original y cual el duplicado, luego fusionar.
     */
    public static function intercambiar(int $registroId, int $adminId): bool
    {
        $t = DuplicadosPendientesCols::TABLA;

        $registro = static::buscarPorId($registroId);
        if (!$registro) return false;

        /* Invertir IDs */
        static::ejecutar(
            "UPDATE {$t} SET "
            . DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID . " = :nuevoOriginal, "
            . DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID . " = :nuevoDuplicado"
            . " WHERE " . DuplicadosPendientesCols::ID . " = :id",
            [
                'nuevoOriginal' => (int) $registro[DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID],
                'nuevoDuplicado' => (int) $registro[DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID],
                'id' => $registroId,
            ]
        );

        /* Ahora fusionar con los roles invertidos */
        return self::fusionar($registroId, $adminId);
    }
}
