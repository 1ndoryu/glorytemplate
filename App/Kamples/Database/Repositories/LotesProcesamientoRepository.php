<?php

/* [223A-3] Repository para tabla lotes_procesamiento — historial de lotes automáticos */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\LotesProcesamientoCols;
use App\Config\Schema\_generated\LotesProcesamientoEnums;

class LotesProcesamientoRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return LotesProcesamientoCols::TABLA;
    }

    protected static function colId(): string
    {
        return LotesProcesamientoCols::ID;
    }

    /**
     * Crea un nuevo lote con estado 'ejecutando'.
     * @return int ID del lote creado
     */
    public static function crearLote(string $tipo): int
    {
        $tabla = LotesProcesamientoCols::TABLA;
        $id = static::consultarValor(
            "INSERT INTO {$tabla} (" . LotesProcesamientoCols::TIPO . ") VALUES (:tipo) RETURNING " . LotesProcesamientoCols::ID,
            ['tipo' => $tipo]
        );
        return (int) $id;
    }

    /**
     * Actualiza un lote con resultados al completarse.
     */
    public static function completarLote(int $id, array $datos): void
    {
        $tabla = LotesProcesamientoCols::TABLA;
        $sets = [
            LotesProcesamientoCols::ESTADO . ' = :estado',
            LotesProcesamientoCols::COMPLETADO_AT . ' = NOW()',
            LotesProcesamientoCols::EXITOSOS . ' = :exitosos',
            LotesProcesamientoCols::FALLIDOS . ' = :fallidos',
        ];
        $params = [
            'id'       => $id,
            'estado'   => $datos['estado'] ?? LotesProcesamientoEnums::ESTADO_COMPLETADO,
            'exitosos' => (int) ($datos['exitosos'] ?? 0),
            'fallidos' => (int) ($datos['fallidos'] ?? 0),
        ];

        if (isset($datos['recortes'])) {
            $sets[] = LotesProcesamientoCols::RECORTES . ' = :recortes';
            $params['recortes'] = (int) $datos['recortes'];
        }
        if (isset($datos['samples_publicados'])) {
            $sets[] = LotesProcesamientoCols::SAMPLES_PUBLICADOS . ' = :samples_publicados';
            $params['samples_publicados'] = (int) $datos['samples_publicados'];
        }
        if (isset($datos['canciones_nuevas'])) {
            $sets[] = LotesProcesamientoCols::CANCIONES_NUEVAS . ' = :canciones_nuevas';
            $params['canciones_nuevas'] = (int) $datos['canciones_nuevas'];
        }
        if (isset($datos['sampleos_nuevos'])) {
            $sets[] = LotesProcesamientoCols::SAMPLEOS_NUEVOS . ' = :sampleos_nuevos';
            $params['sampleos_nuevos'] = (int) $datos['sampleos_nuevos'];
        }
        if (isset($datos['error_mensaje'])) {
            $sets[] = LotesProcesamientoCols::ERROR_MENSAJE . ' = :error_mensaje';
            $params['error_mensaje'] = \substr((string) $datos['error_mensaje'], 0, 2000);
        }
        if (isset($datos['metadata'])) {
            $sets[] = LotesProcesamientoCols::METADATA . ' = :metadata::jsonb';
            $params['metadata'] = \json_encode($datos['metadata']);
        }

        $setSql = \implode(', ', $sets);
        static::ejecutar("UPDATE {$tabla} SET {$setSql} WHERE " . LotesProcesamientoCols::ID . " = :id", $params);
    }

    /**
     * Lista historial de lotes paginado, más recientes primero.
     */
    public static function listarHistorial(?string $tipo = null, int $pagina = 1, int $porPagina = 20): array
    {
        $tabla = LotesProcesamientoCols::TABLA;
        $where = '';
        $params = ['limit' => $porPagina, 'offset' => ($pagina - 1) * $porPagina];

        if ($tipo !== null) {
            $where = 'WHERE ' . LotesProcesamientoCols::TIPO . ' = :tipo';
            $params['tipo'] = $tipo;
        }

        $items = static::consultar(
            "SELECT * FROM {$tabla} {$where} ORDER BY " . LotesProcesamientoCols::INICIADO_AT . " DESC LIMIT :limit OFFSET :offset",
            $params
        );

        $total = (int) static::consultarValor(
            "SELECT COUNT(*) FROM {$tabla} {$where}",
            $tipo !== null ? ['tipo' => $tipo] : []
        );

        return ['items' => $items, 'total' => $total];
    }

    /**
     * Busca lotes 'ejecutando' que llevan más de $minutos para limpieza.
     */
    public static function lotesEstancados(int $minutos = 180): array
    {
        $tabla = LotesProcesamientoCols::TABLA;
        return static::consultar(
            "SELECT * FROM {$tabla} WHERE " . LotesProcesamientoCols::ESTADO . " = :estado "
            . "AND " . LotesProcesamientoCols::INICIADO_AT . " < NOW() - INTERVAL ':min minutes'",
            ['estado' => LotesProcesamientoEnums::ESTADO_EJECUTANDO, 'min' => $minutos]
        );
    }

    /**
     * Obtiene el último lote completado/error de un tipo para ver stats.
     */
    public static function ultimoLote(string $tipo): ?array
    {
        $tabla = LotesProcesamientoCols::TABLA;
        return static::consultarUno(
            "SELECT * FROM {$tabla} WHERE " . LotesProcesamientoCols::TIPO . " = :tipo "
            . "ORDER BY " . LotesProcesamientoCols::INICIADO_AT . " DESC LIMIT 1",
            ['tipo' => $tipo]
        );
    }

    /**
     * Estadísticas resumen para un tipo de proceso.
     */
    public static function estadisticasResumen(string $tipo): array
    {
        $tabla = LotesProcesamientoCols::TABLA;
        $fila = static::consultarUno(
            "SELECT COUNT(*) AS total_lotes, "
            . "COALESCE(SUM(" . LotesProcesamientoCols::EXITOSOS . "), 0) AS total_exitosos, "
            . "COALESCE(SUM(" . LotesProcesamientoCols::FALLIDOS . "), 0) AS total_fallidos, "
            . "COALESCE(SUM(" . LotesProcesamientoCols::RECORTES . "), 0) AS total_recortes, "
            . "COALESCE(SUM(" . LotesProcesamientoCols::SAMPLES_PUBLICADOS . "), 0) AS total_samples_publicados, "
            . "COALESCE(SUM(" . LotesProcesamientoCols::CANCIONES_NUEVAS . "), 0) AS total_canciones, "
            . "COALESCE(SUM(" . LotesProcesamientoCols::SAMPLEOS_NUEVOS . "), 0) AS total_sampleos "
            . "FROM {$tabla} WHERE " . LotesProcesamientoCols::TIPO . " = :tipo",
            ['tipo' => $tipo]
        );
        return $fila ?? [];
    }
}
