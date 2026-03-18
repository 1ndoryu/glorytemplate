<?php

/**
 * ColeccionesLikesRepository — Likes de colecciones.
 * [183A-22] Los usuarios pueden dar like a colecciones de otros (distinto al "guardar"/bookmark).
 * La tabla se crea automáticamente con CREATE TABLE IF NOT EXISTS en el primer acceso.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ColeccionesLikesCols;
use App\Kamples\KamplesLogger;

class ColeccionesLikesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ColeccionesLikesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ColeccionesLikesCols::ID;
    }

    /**
     * Asegura que la tabla colecciones_likes exista.
     * Se llama una vez por request (lazy) desde los métodos públicos.
     * Gotcha: IF NOT EXISTS hace que sea idempotente sin coste en accesos posteriores.
     */
    private static bool $tablaVerificada = false;

    private static function asegurarTabla(): void
    {
        if (static::$tablaVerificada) {
            return;
        }

        try {
            static::ejecutar(
                "CREATE TABLE IF NOT EXISTS colecciones_likes (
                    id           SERIAL PRIMARY KEY,
                    usuario_id   INTEGER NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
                    coleccion_id INTEGER NOT NULL REFERENCES colecciones(id) ON DELETE CASCADE,
                    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (usuario_id, coleccion_id)
                )"
            );
            static::$tablaVerificada = true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ColeccionesLikesRepository::asegurarTabla error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Toggle like: si ya existe lo elimina, si no existe lo inserta.
     * Retorna true si quedó likeada, false si quedó no likeada.
     */
    public static function toggle(int $usuarioId, int $coleccionId): bool
    {
        try {
            static::asegurarTabla();

            $t = ColeccionesLikesCols::TABLA;

            /* Intentar insertar; si ya existe (UNIQUE conflict) eliminar */
            $insertado = static::ejecutar(
                "INSERT INTO {$t} (usuario_id, coleccion_id)
                 VALUES (:usuario, :coleccion)
                 ON CONFLICT (usuario_id, coleccion_id) DO NOTHING",
                ['usuario' => $usuarioId, 'coleccion' => $coleccionId]
            );

            if ($insertado > 0) {
                return true;
            }

            /* Ya existia — eliminar */
            static::ejecutar(
                "DELETE FROM {$t} WHERE usuario_id = :usuario AND coleccion_id = :coleccion",
                ['usuario' => $usuarioId, 'coleccion' => $coleccionId]
            );

            return false;
        } catch (\Throwable $e) {
            KamplesLogger::error('ColeccionesLikesRepository::toggle error', [
                'error'       => $e->getMessage(),
                'usuarioId'   => $usuarioId,
                'coleccionId' => $coleccionId,
            ]);
            throw $e;
        }
    }

    /**
     * Verificar si un usuario ya dio like a una colección.
     */
    public static function estaLikeada(int $usuarioId, int $coleccionId): bool
    {
        try {
            static::asegurarTabla();

            $t = ColeccionesLikesCols::TABLA;

            $existe = static::consultarValor(
                "SELECT 1 FROM {$t} WHERE usuario_id = :usuario AND coleccion_id = :coleccion LIMIT 1",
                ['usuario' => $usuarioId, 'coleccion' => $coleccionId]
            );

            return $existe !== null;
        } catch (\Throwable $e) {
            KamplesLogger::error('ColeccionesLikesRepository::estaLikeada error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Contar total de likes de una colección.
     */
    public static function contarLikes(int $coleccionId): int
    {
        try {
            static::asegurarTabla();

            $t = ColeccionesLikesCols::TABLA;

            $count = static::consultarValor(
                "SELECT COUNT(*) FROM {$t} WHERE coleccion_id = :coleccion",
                ['coleccion' => $coleccionId]
            );

            return (int) ($count ?? 0);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColeccionesLikesRepository::contarLikes error', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    /**
     * Batch check: dado un usuario y un array de IDs de colección, retorna
     * el set de IDs que el usuario ya likeó.
     * Pendiente: usado en listados para evitar N+1.
     */
    public static function likeadosPorUsuario(int $usuarioId, array $coleccionIds): array
    {
        if (empty($coleccionIds)) {
            return [];
        }

        try {
            static::asegurarTabla();

            $t = ColeccionesLikesCols::TABLA;
            $placeholders = implode(', ', array_fill(0, count($coleccionIds), '?'));

            $params = array_values($coleccionIds);
            array_unshift($params, $usuarioId);

            /* Usar consultar con params posicionales — BaseRepository soporta PDO */
            $rows = static::consultar(
                "SELECT coleccion_id FROM {$t} WHERE usuario_id = ? AND coleccion_id IN ({$placeholders})",
                $params
            );

            return array_column($rows, 'coleccion_id');
        } catch (\Throwable $e) {
            KamplesLogger::error('ColeccionesLikesRepository::likeadosPorUsuario error', ['error' => $e->getMessage()]);
            return [];
        }
    }
}
