<?php

/**
 * AlgoritmoEstadoRepository — Acceso a datos para tabla 'algoritmo_estado'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\AlgoritmoEstadoCols;
use App\Config\Schema\_generated\AlgoritmoEstadoDTO;

class AlgoritmoEstadoRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return AlgoritmoEstadoCols::TABLA;
    }

    protected static function colId(): string
    {
        /* La PK de algoritmo_estado es usuario_id, no hay columna 'id' separada */
        return AlgoritmoEstadoCols::USUARIO_ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        $col = AlgoritmoEstadoCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . AlgoritmoEstadoCols::ID . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    

    /*
     * Asegurar que existe un registro para el usuario (INSERT ON CONFLICT DO NOTHING).
     */
    public static function upsertEstado(int $userId): void
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        static::ejecutar(
            "INSERT INTO {$tabla} (" . AlgoritmoEstadoCols::USUARIO_ID . ") VALUES (:userId) ON CONFLICT (" . AlgoritmoEstadoCols::USUARIO_ID . ") DO NOTHING",
            ['userId' => $userId]
        );
    }

    /*
     * Incrementar contador dinamico + su variante _preciso + ultima_actividad.
     * La columna es siempre una clave conocida de MAPEO_COLUMNAS (cnt_likes, etc.).
     * Usamos un allow-list en PlanificadorAlgoritmo; aqui la columna viene validada.
     */
    public static function incrementarContador(int $userId, string $columna): void
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla}
             SET {$columna} = {$columna} + 1,
                 {$columna}_preciso = {$columna}_preciso + 1,
                 ultima_actividad = NOW()
             WHERE " . AlgoritmoEstadoCols::USUARIO_ID . " = :userId",
            ['userId' => $userId]
        );
    }

    /*
     * Obtener estado completo de un usuario.
     */
    public static function obtenerEstado(int $userId): ?array
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        return static::consultarUno(
            /* sentinel-disable-next-line repository-sin-whitelist-columnas — intencionado: obtenerEstado retorna entidad completa */
            "SELECT * FROM {$tabla} WHERE " . AlgoritmoEstadoCols::USUARIO_ID . " = :userId",
            ['userId' => $userId]
        );
    }

    /*
     * Resetear contadores rapidos a cero + marcar timestamp ultimo_rapido.
     */
    public static function resetearContadoresRapidos(int $userId): void
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla}
             SET " . AlgoritmoEstadoCols::CNT_LIKES . " = 0, " . AlgoritmoEstadoCols::CNT_REPRODUCCIONES . " = 0, " . AlgoritmoEstadoCols::CNT_COMPLETAS . " = 0,
                 " . AlgoritmoEstadoCols::CNT_DESCARGAS . " = 0, " . AlgoritmoEstadoCols::CNT_FOLLOWS . " = 0, " . AlgoritmoEstadoCols::CNT_COMENTARIOS . " = 0,
                 " . AlgoritmoEstadoCols::ULTIMO_RAPIDO . " = NOW()
             WHERE " . AlgoritmoEstadoCols::USUARIO_ID . " = :userId",
            ['userId' => $userId]
        );
    }

    /*
     * Resetear contadores precisos a cero + incrementar version_perfil + marcar timestamp.
     */
    public static function resetearContadoresPrecisos(int $userId): void
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla}
             SET " . AlgoritmoEstadoCols::CNT_LIKES_PRECISO . " = 0, " . AlgoritmoEstadoCols::CNT_REPRODUCCIONES_PRECISO . " = 0,
                 " . AlgoritmoEstadoCols::CNT_COMPLETAS_PRECISO . " = 0, " . AlgoritmoEstadoCols::CNT_DESCARGAS_PRECISO . " = 0,
                 " . AlgoritmoEstadoCols::CNT_FOLLOWS_PRECISO . " = 0, " . AlgoritmoEstadoCols::CNT_COMENTARIOS_PRECISO . " = 0,
                 " . AlgoritmoEstadoCols::ULTIMO_PRECISO . " = NOW(),
                 " . AlgoritmoEstadoCols::VERSION_PERFIL . " = " . AlgoritmoEstadoCols::VERSION_PERFIL . " + 1
             WHERE " . AlgoritmoEstadoCols::USUARIO_ID . " = :userId",
            ['userId' => $userId]
        );
    }

    /*
     * Obtener todos los usuarios con metricas de tiempo para evaluacion de cron.
     * Calcula segundos desde ultimo_rapido, ultimo_preciso y ultima_actividad.
     */
    public static function obtenerTodosParaEvaluacion(): array
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        return static::consultar(
            "SELECT " . AlgoritmoEstadoCols::USUARIO_ID . ",
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMO_RAPIDO . ") as seg_desde_rapido,
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMO_PRECISO . ") as seg_desde_preciso,
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMA_ACTIVIDAD . ") as seg_inactivo
             FROM {$tabla}"
        );
    }

    /*
     * Obtener solo usuarios que necesitan recalculo (filtrado por intervalo minimo).
     * Evita cargar TODOS los usuarios cuando solo unos pocos necesitan actualización.
     * Solo retorna usuarios cuyo ultimo_rapido O ultimo_preciso exceda el intervalo minimo.
     */
    public static function obtenerParaEvaluacionFiltrado(int $intervaloMinimoSeg): array
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        return static::consultar(
            "SELECT " . AlgoritmoEstadoCols::USUARIO_ID . ",
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMO_RAPIDO . ") as seg_desde_rapido,
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMO_PRECISO . ") as seg_desde_preciso,
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMA_ACTIVIDAD . ") as seg_inactivo
             FROM {$tabla}
             WHERE EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMO_RAPIDO . ") >= :intervalo
                OR EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMO_PRECISO . ") >= :intervalo2",
            ['intervalo' => $intervaloMinimoSeg, 'intervalo2' => $intervaloMinimoSeg]
        );
    }

    /*
     * Estado detallado con calculos de tiempo para diagnostico (admin).
     */
    public static function obtenerEstadoDiagnostico(int $userId): ?array
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        return static::consultarUno(
            "SELECT *,
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMO_RAPIDO . ")::int as seg_desde_rapido,
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMO_PRECISO . ")::int as seg_desde_preciso,
                    EXTRACT(EPOCH FROM NOW() - " . AlgoritmoEstadoCols::ULTIMA_ACTIVIDAD . ")::int as seg_inactivo
             FROM {$tabla} WHERE " . AlgoritmoEstadoCols::USUARIO_ID . " = :userId",
            ['userId' => $userId]
        );
    }

    /*
     * Obtener todos los usuario_id para recalculo global (admin).
     */
    public static function obtenerTodosIds(): array
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        return static::consultar(
            "SELECT " . AlgoritmoEstadoCols::USUARIO_ID . " FROM {$tabla}"
        );
    }
}
