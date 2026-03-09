<?php

/**
 * ColaProcesamientoIaRepository — Acceso a datos para tabla 'cola_procesamiento_ia'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ColaProcesamientoIaCols;
use App\Config\Schema\_generated\ColaProcesamientoIaEnums;
use App\Config\Schema\_generated\ColaProcesamientoIaDTO;

class ColaProcesamientoIaRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ColaProcesamientoIaCols::TABLA;
    }

    protected static function colId(): string
    {
        return ColaProcesamientoIaCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ColaProcesamientoIaCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ColaProcesamientoIaCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

        

        

    

    /**
     * Encolar un item para procesamiento IA.
     * Si ya existe un item pendiente/reintento para la misma entidad+operacion, no duplicar.
     *
     * @return int|null ID del item encolado o null si ya existe
     */
    public static function encolar(string $tipo, int $entidadId, string $operacion, array $metadata = []): ?int
    {
        $tabla = ColaProcesamientoIaCols::TABLA;
        $colTipo = ColaProcesamientoIaCols::TIPO;
        $colEntidad = ColaProcesamientoIaCols::ENTIDAD_ID;
        $colOperacion = ColaProcesamientoIaCols::OPERACION;
        $colEstado = ColaProcesamientoIaCols::ESTADO;

        /* Verificar que no exista ya un item pendiente/reintento para esta misma entidad+operacion */
        $existente = static::consultarUno(
            "SELECT " . ColaProcesamientoIaCols::ID . " FROM {$tabla}
             WHERE {$colTipo} = :tipo
               AND {$colEntidad} = :entidad_id
               AND {$colOperacion} = :operacion
               AND {$colEstado} IN (:estado_pendiente, :estado_reintento, :estado_procesando)",
            [
                'tipo' => $tipo,
                'entidad_id' => $entidadId,
                'operacion' => $operacion,
                'estado_pendiente' => ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
                'estado_reintento' => ColaProcesamientoIaEnums::ESTADO_ERROR_REINTENTO,
                'estado_procesando' => ColaProcesamientoIaEnums::ESTADO_PROCESANDO,
            ]
        );

        if ($existente) {
            return null;
        }

        return static::insertarRegistro([
            ColaProcesamientoIaCols::TIPO => $tipo,
            ColaProcesamientoIaCols::ENTIDAD_ID => $entidadId,
            ColaProcesamientoIaCols::OPERACION => $operacion,
            ColaProcesamientoIaCols::ESTADO => ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
            ColaProcesamientoIaCols::INTENTOS => 0,
            ColaProcesamientoIaCols::MAX_INTENTOS => 2,
            ColaProcesamientoIaCols::METADATA => \json_encode($metadata),
        ]);
    }

    /**
     * Obtener items listos para procesar.
     * Incluye: pendientes sin proximo_intento, y error_reintento cuyo proximo_intento ya paso.
     *
     * @param int $limite Maximo items a retornar (evitar sobrecarga)
     * @return array Lista de filas crudas
     */
    public static function obtenerPendientes(int $limite = 10): array
    {
        $tabla = ColaProcesamientoIaCols::TABLA;
        $colEstado = ColaProcesamientoIaCols::ESTADO;
        $colProximo = ColaProcesamientoIaCols::PROXIMO_INTENTO;
        $colCreated = ColaProcesamientoIaCols::CREATED_AT;
        $columnas = \implode(', ', ColaProcesamientoIaCols::TODAS);

        return static::consultar(
            "SELECT {$columnas} FROM {$tabla}
             WHERE (
                 {$colEstado} = :estado_pendiente
                 OR ({$colEstado} = :estado_reintento AND {$colProximo} <= NOW())
             )
             ORDER BY {$colCreated} ASC
             LIMIT :limite",
            [
                'estado_pendiente' => ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
                'estado_reintento' => ColaProcesamientoIaEnums::ESTADO_ERROR_REINTENTO,
                'limite' => $limite,
            ]
        );
    }

    /**
     * Marcar un item como "procesando" (lock optimista).
     * Solo actualiza si aun esta en estado pendiente/reintento.
     *
     * @return bool true si se tomo el lock
     */
    public static function marcarProcesando(int $id): bool
    {
        $tabla = ColaProcesamientoIaCols::TABLA;
        $colId = ColaProcesamientoIaCols::ID;
        $colEstado = ColaProcesamientoIaCols::ESTADO;

        $afectadas = static::ejecutar(
            "UPDATE {$tabla}
             SET {$colEstado} = :estado_nuevo
             WHERE {$colId} = :id
               AND {$colEstado} IN (:estado_pendiente, :estado_reintento)",
            [
                'estado_nuevo' => ColaProcesamientoIaEnums::ESTADO_PROCESANDO,
                'id' => $id,
                'estado_pendiente' => ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
                'estado_reintento' => ColaProcesamientoIaEnums::ESTADO_ERROR_REINTENTO,
            ]
        );

        return $afectadas > 0;
    }

    /**
     * Marcar item como completado exitosamente.
     */
    public static function marcarCompletado(int $id): bool
    {
        return static::actualizarPorId($id, [
            ColaProcesamientoIaCols::ESTADO => ColaProcesamientoIaEnums::ESTADO_COMPLETADO,
            ColaProcesamientoIaCols::PROCESADO_AT => \date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Marcar item como error con reintento programado.
     * Si ya excedio max_intentos, marca como error_final.
     *
     * @param int $id ID del item
     * @param string $error Mensaje de error
     * @param int $minutosEspera Minutos hasta el proximo reintento
     * @return string Estado resultante (error_reintento|error_final)
     */
    public static function marcarError(int $id, string $error, int $minutosEspera = 30): string
    {
        $item = static::buscarPorId($id);
        if (!$item) {
            return ColaProcesamientoIaEnums::ESTADO_ERROR_FINAL;
        }

        $intentos = (int) $item[ColaProcesamientoIaCols::INTENTOS] + 1;
        $maxIntentos = (int) $item[ColaProcesamientoIaCols::MAX_INTENTOS];

        if ($intentos >= $maxIntentos) {
            static::actualizarPorId($id, [
                ColaProcesamientoIaCols::ESTADO => ColaProcesamientoIaEnums::ESTADO_ERROR_FINAL,
                ColaProcesamientoIaCols::INTENTOS => $intentos,
                ColaProcesamientoIaCols::ULTIMO_ERROR => $error,
            ]);
            return ColaProcesamientoIaEnums::ESTADO_ERROR_FINAL;
        }

        $proximoIntento = \date('Y-m-d H:i:s', \time() + ($minutosEspera * 60));
        static::actualizarPorId($id, [
            ColaProcesamientoIaCols::ESTADO => ColaProcesamientoIaEnums::ESTADO_ERROR_REINTENTO,
            ColaProcesamientoIaCols::INTENTOS => $intentos,
            ColaProcesamientoIaCols::ULTIMO_ERROR => $error,
            ColaProcesamientoIaCols::PROXIMO_INTENTO => $proximoIntento,
        ]);

        return ColaProcesamientoIaEnums::ESTADO_ERROR_REINTENTO;
    }

    /**
     * Reintentar un item en error_final (forzado desde admin).
     * Resetea intentos y pone en pendiente.
     */
    public static function forzarReintento(int $id): bool
    {
        return static::actualizarPorId($id, [
            ColaProcesamientoIaCols::ESTADO => ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
            ColaProcesamientoIaCols::INTENTOS => 0,
            ColaProcesamientoIaCols::ULTIMO_ERROR => null,
            ColaProcesamientoIaCols::PROXIMO_INTENTO => null,
        ]);
    }

    /**
     * Reintentar TODOS los items en error_final.
     *
     * @return int Cantidad de items reactivados
     */
    public static function forzarReintentarTodos(): int
    {
        $tabla = ColaProcesamientoIaCols::TABLA;
        $colEstado = ColaProcesamientoIaCols::ESTADO;
        $colIntentos = ColaProcesamientoIaCols::INTENTOS;
        $colError = ColaProcesamientoIaCols::ULTIMO_ERROR;
        $colProximo = ColaProcesamientoIaCols::PROXIMO_INTENTO;

        return static::ejecutar(
            "UPDATE {$tabla}
             SET {$colEstado} = :estado_nuevo,
                 {$colIntentos} = 0,
                 {$colError} = NULL,
                 {$colProximo} = NULL
             WHERE {$colEstado} = :estado_error",
            [
                'estado_nuevo' => ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
                'estado_error' => ColaProcesamientoIaEnums::ESTADO_ERROR_FINAL,
            ]
        );
    }

    /**
     * Obtener estadisticas de la cola para el panel admin.
     *
     * @return array {pendientes, procesando, completados_hoy, errores, total}
     */
    public static function obtenerEstadisticas(): array
    {
        $tabla = ColaProcesamientoIaCols::TABLA;
        $colEstado = ColaProcesamientoIaCols::ESTADO;
        $colProcesadoAt = ColaProcesamientoIaCols::PROCESADO_AT;
        $colCreatedAt = ColaProcesamientoIaCols::CREATED_AT;

        $row = static::consultarUno(
            "SELECT
                COUNT(*) FILTER (WHERE {$colEstado} = :pendiente) AS pendientes,
                COUNT(*) FILTER (WHERE {$colEstado} = :procesando) AS procesando,
                COUNT(*) FILTER (WHERE {$colEstado} = :completado AND {$colProcesadoAt} >= CURRENT_DATE) AS completados_hoy,
                COUNT(*) FILTER (WHERE {$colEstado} = :reintento) AS en_reintento,
                COUNT(*) FILTER (WHERE {$colEstado} = :error_final) AS errores,
                COUNT(*) FILTER (WHERE {$colCreatedAt} >= CURRENT_DATE) AS encolados_hoy,
                COUNT(*) AS total
             FROM {$tabla}",
            [
                'pendiente' => ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
                'procesando' => ColaProcesamientoIaEnums::ESTADO_PROCESANDO,
                'completado' => ColaProcesamientoIaEnums::ESTADO_COMPLETADO,
                'reintento' => ColaProcesamientoIaEnums::ESTADO_ERROR_REINTENTO,
                'error_final' => ColaProcesamientoIaEnums::ESTADO_ERROR_FINAL,
            ]
        );

        return [
            'pendientes' => (int) ($row['pendientes'] ?? 0),
            'procesando' => (int) ($row['procesando'] ?? 0),
            'completados_hoy' => (int) ($row['completados_hoy'] ?? 0),
            'en_reintento' => (int) ($row['en_reintento'] ?? 0),
            'errores' => (int) ($row['errores'] ?? 0),
            'encolados_hoy' => (int) ($row['encolados_hoy'] ?? 0),
            'total' => (int) ($row['total'] ?? 0),
        ];
    }

    /**
     * Listar items de la cola con paginacion y filtro opcional por estado.
     *
     * @return array {data: array, pagination: array}
     */
    public static function listarItems(int $pagina = 1, int $porPagina = 20, ?string $estado = null, ?string $tipo = null): array
    {
        $tabla = ColaProcesamientoIaCols::TABLA;
        $colEstado = ColaProcesamientoIaCols::ESTADO;
        $colTipo = ColaProcesamientoIaCols::TIPO;
        $colCreated = ColaProcesamientoIaCols::CREATED_AT;
        $offset = ($pagina - 1) * $porPagina;

        $conditions = [];
        $params = ['limite' => $porPagina, 'offset' => $offset];
        $whereParams = [];

        if ($estado !== null) {
            $conditions[] = "{$colEstado} = :estado";
            $params['estado'] = $estado;
            $whereParams['estado'] = $estado;
        }
        if ($tipo !== null) {
            $conditions[] = "{$colTipo} = :tipo";
            $params['tipo'] = $tipo;
            $whereParams['tipo'] = $tipo;
        }

        $whereSql = !empty($conditions) ? 'WHERE ' . \implode(' AND ', $conditions) : '';

        $totalRow = static::consultarUno(
            "SELECT COUNT(*) AS total FROM {$tabla} {$whereSql}",
            $whereParams
        );
        $total = (int) ($totalRow['total'] ?? 0);

        $columnas = \implode(', ', ColaProcesamientoIaCols::TODAS);

        $items = static::consultar(
            "SELECT {$columnas} FROM {$tabla} {$whereSql} ORDER BY {$colCreated} DESC LIMIT :limite OFFSET :offset",
            $params
        );

        return [
            'data' => $items,
            'pagination' => [
                'page' => $pagina,
                'per_page' => $porPagina,
                'total' => $total,
                'pages' => $total > 0 ? (int) \ceil($total / $porPagina) : 1,
            ],
        ];
    }
}
