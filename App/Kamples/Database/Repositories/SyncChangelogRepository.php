<?php

/**
 * SyncChangelogRepository — Registro y consulta de cambios para delta sync.
 *
 * Cada operacion que modifica el estado de sync de un usuario (crear/renombrar/eliminar
 * coleccion, agregar/quitar sample) inserta un registro aqui. El desktop consulta
 * con cursor (ultimo id conocido) para obtener solo los cambios pendientes.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\SyncChangelogCols;
use App\Config\Schema\_generated\SyncChangelogEnums;
use App\Kamples\KamplesLogger;

class SyncChangelogRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return SyncChangelogCols::TABLA;
    }

    protected static function colId(): string
    {
        return SyncChangelogCols::ID;
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /**
     * Registrar un cambio en el changelog de sync.
     *
     * @param int    $usuarioId  ID del usuario propietario
     * @param string $tipo       Uno de SyncChangelogEnums::TIPOS_VALIDOS
     * @param int    $entidadId  ID de la coleccion o sample afectado
     * @param array  $metadata   Datos adicionales (nombre anterior, etc)
     * @return int|null           ID del registro creado o null si falla
     */
    public static function registrar(
        int $usuarioId,
        string $tipo,
        int $entidadId,
        array $metadata = []
    ): ?int {
        if (!in_array($tipo, SyncChangelogEnums::TIPOS_VALIDOS, true)) {
            KamplesLogger::error('SyncChangelogRepository: tipo invalido', [
                'tipo' => $tipo,
                'validos' => SyncChangelogEnums::TIPOS_VALIDOS,
            ]);
            return null;
        }

        $metadataJson = json_encode($metadata, JSON_UNESCAPED_UNICODE);
        if ($metadataJson === false) {
            KamplesLogger::error('SyncChangelogRepository: error codificando metadata', [
                'json_error' => json_last_error_msg(),
            ]);
            $metadataJson = '{}';
        }

        /* A8: Limitar tamaño de metadata para evitar crecimiento descontrolado de la tabla */
        if (strlen($metadataJson) > 10240) {
            KamplesLogger::warn('SyncChangelogRepository: metadata demasiado grande, truncando', [
                'tamano' => strlen($metadataJson),
            ]);
            $metadataJson = json_encode(['_truncado' => true, 'tamano_original' => strlen($metadataJson)]);
        }

        $sql = "INSERT INTO " . SyncChangelogCols::TABLA . " ("
            . SyncChangelogCols::USUARIO_ID . ", "
            . SyncChangelogCols::TIPO . ", "
            . SyncChangelogCols::ENTIDAD_ID . ", "
            . SyncChangelogCols::METADATA
            . ") VALUES (:usuarioId, :tipo, :entidadId, :metadata::jsonb) "
            . "RETURNING " . SyncChangelogCols::ID;

        return static::insertar($sql, [
            'usuarioId' => $usuarioId,
            'tipo'      => $tipo,
            'entidadId' => $entidadId,
            'metadata'  => $metadataJson,
        ]);
    }

    /**
     * Obtener cambios desde un cursor (id) en adelante para un usuario.
     *
     * Retorna array de cambios mas recientes que $cursor, limitado a $limite.
     * Si cursor=0, el cliente necesita full sync (se retorna array vacio con flag).
     *
     * @param int $usuarioId
     * @param int $cursor     Ultimo ID conocido por el cliente (0 = primera vez)
     * @param int $limite     Maximo de registros a retornar
     * @return array{cambios: array, cursor: int, hayMas: bool, fullSyncRequired: bool}
     */
    public static function obtenerDelta(int $usuarioId, int $cursor, int $limite = 100): array
    {
        /* A6: Defensa en profundidad — acotar limite aunque el caller ya lo valide */
        $limite = max(1, min(500, $limite));

        /* Primera conexion: cursor=0, requiere full sync */
        if ($cursor <= 0) {
            $ultimoId = static::obtenerUltimoCursor($usuarioId);
            return [
                'cambios'          => [],
                'cursor'           => $ultimoId ?? 0,
                'hayMas'           => false,
                'fullSyncRequired' => true,
            ];
        }

        /*
         * A5: Intentar obtener cambios directamente sin verificar cursor por separado.
         * Si cursor ya no existe (purgado) y no hay resultados con id > cursor,
         * verificar si hay registros más antiguos — si sí, cursor fue purgado → fullSync.
         */
        $sql = "SELECT "
            . SyncChangelogCols::ID . ", "
            . SyncChangelogCols::TIPO . ", "
            . SyncChangelogCols::ENTIDAD_ID . ", "
            . SyncChangelogCols::METADATA . ", "
            . SyncChangelogCols::CREATED_AT
            . " FROM " . SyncChangelogCols::TABLA
            . " WHERE " . SyncChangelogCols::USUARIO_ID . " = :usuarioId"
            . " AND " . SyncChangelogCols::ID . " > :cursor"
            . " ORDER BY " . SyncChangelogCols::ID . " ASC"
            . " LIMIT :limite";

        $rows = static::consultar($sql, [
            'usuarioId' => $usuarioId,
            'cursor'    => $cursor,
            'limite'    => $limite + 1,
        ]);

        /* Si no hay resultados, verificar si el cursor fue purgado o simplemente no hay cambios */
        if (empty($rows)) {
            $minId = static::consultarUno(
                "SELECT MIN(" . SyncChangelogCols::ID . ") as min_id FROM " . SyncChangelogCols::TABLA
                . " WHERE " . SyncChangelogCols::USUARIO_ID . " = :usuarioId",
                ['usuarioId' => $usuarioId]
            );
            $minExistente = $minId && $minId['min_id'] !== null ? (int) $minId['min_id'] : null;

            if ($minExistente !== null && $cursor < $minExistente) {
                /* Cursor fue purgado: forzar full sync */
                $ultimoId = static::obtenerUltimoCursor($usuarioId);
                return [
                    'cambios'          => [],
                    'cursor'           => $ultimoId ?? 0,
                    'hayMas'           => false,
                    'fullSyncRequired' => true,
                ];
            }

            /* No hay cambios nuevos */
            return [
                'cambios'          => [],
                'cursor'           => $cursor,
                'hayMas'           => false,
                'fullSyncRequired' => false,
            ];
        }

        $hayMas = count($rows) > $limite;
        if ($hayMas) {
            array_pop($rows);
        }

        /* Parsear metadata JSONB */
        $cambios = array_map(function (array $row): array {
            $meta = $row[SyncChangelogCols::METADATA] ?? '{}';
            if (is_string($meta)) {
                $decoded = json_decode($meta, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $decoded = [];
                }
                $meta = $decoded;
            }

            return [
                'id'        => (int) $row[SyncChangelogCols::ID],
                'tipo'      => $row[SyncChangelogCols::TIPO],
                'entidadId' => (int) $row[SyncChangelogCols::ENTIDAD_ID],
                'metadata'  => $meta,
                'createdAt' => $row[SyncChangelogCols::CREATED_AT],
            ];
        }, $rows);

        $nuevoCursor = !empty($cambios) ? $cambios[count($cambios) - 1]['id'] : $cursor;

        return [
            'cambios'          => $cambios,
            'cursor'           => $nuevoCursor,
            'hayMas'           => $hayMas,
            'fullSyncRequired' => false,
        ];
    }

    /**
     * Obtener el ultimo ID del changelog para un usuario.
     * Util para asignar cursor inicial tras full sync.
     */
    public static function obtenerUltimoCursor(int $usuarioId): ?int
    {
        $row = static::consultarUno(
            "SELECT MAX(" . SyncChangelogCols::ID . ") as ultimo FROM " . SyncChangelogCols::TABLA
            . " WHERE " . SyncChangelogCols::USUARIO_ID . " = :usuarioId",
            ['usuarioId' => $usuarioId]
        );

        return $row && $row['ultimo'] !== null ? (int) $row['ultimo'] : null;
    }

    /**
     * Purgar registros antiguos del changelog.
     *
     * POLITICA DE PURGA (M6):
     * - Ejecutar via cron periodico (recomendado: diario o semanal).
     * - Retiene los ultimos $diasRetencion dias de changelog.
     * - Si un cliente tiene un cursor anterior a la purga (cursor < MIN(id)),
     *   obtenerDelta() retorna fullSyncRequired=true para forzar re-sync completo.
     * - El cron debe configurarse en wp-cron o crontab del sistema:
     *   SyncChangelogRepository::purgar(90); // Conservar 90 dias
     * - Valores validos: 30, 60, 90, 180, 365 dias. Otros se normalizan a 90.
     *
     * @param int $diasRetencion Dias a conservar (default 90)
     * @return int Filas eliminadas
     */
    public static function purgar(int $diasRetencion = 90): int
    {
        $validos = [30, 60, 90, 180, 365];
        if (!in_array($diasRetencion, $validos, true)) {
            $diasRetencion = 90;
        }

        $sql = "DELETE FROM " . SyncChangelogCols::TABLA
            . " WHERE " . SyncChangelogCols::CREATED_AT . " < NOW() - INTERVAL '{$diasRetencion} days'";

        return static::ejecutar($sql);
    }
}
