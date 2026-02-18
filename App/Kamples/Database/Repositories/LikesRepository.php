<?php

/**
 * LikesRepository — Acceso a datos para tabla 'likes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\LikesDTO;

class LikesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return LikesCols::TABLA;
    }

    /* PK compuesta (usuario_id, tipo, target_id) — colId usa usuario_id como referencia */
    protected static function colId(): string
    {
        return LikesCols::USUARIO_ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = LikesCols::TABLA;
        $col = LikesCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY id DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = LikesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Eliminar todos los likes de tipo 'sample' para un sample dado.
     * Usado en cascada al eliminar un sample.
     */
    public static function eliminarPorSample(int $sampleId): void
    {
        $tabla = LikesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . LikesCols::TIPO . " = :tipo AND " . LikesCols::TARGET_ID . " = :id",
            ['tipo' => LikesEnums::TIPO_SAMPLE, 'id' => $sampleId]
        );
    }
}
