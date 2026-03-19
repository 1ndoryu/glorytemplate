<?php

/* [183A-106] Repositorio para codigos de descarga gratuita.
 * Usa el userId de PG (obtenido via UsuarioHelper::obtenerIdPg()) de forma consistente
 * con el resto de repositorios del sistema. */

namespace App\Kamples\Database\Repositories;

use App\Kamples\Database\PgDatabase;

class CodigoGratisRepository
{
    /**
     * Inserta un nuevo codigo de descarga gratis.
     * Retorna el ID generado o null si falla.
     */
    public static function crear(string $codigo, string $tipo, int $targetId, int $creadoPorId): ?int
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'INSERT INTO codigos_descarga_gratis (codigo, tipo, target_id, creado_por_id)
                VALUES ($1, $2, $3, $4) RETURNING id';
        $res = pg_query_params($db, $sql, [$codigo, $tipo, $targetId, $creadoPorId]);
        if (!$res) return null;
        $row = pg_fetch_assoc($res);
        return $row ? (int) $row['id'] : null;
    }

    /**
     * Busca un codigo activo.
     * Retorna la fila completa o null si no existe o esta inactivo.
     */
    public static function buscarPorCodigo(string $codigo): ?array
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'SELECT * FROM codigos_descarga_gratis WHERE codigo = $1 AND activo = TRUE';
        $res = pg_query_params($db, $sql, [$codigo]);
        if (!$res) return null;
        $row = pg_fetch_assoc($res);
        return $row ?: null;
    }

    /**
     * Registra que un usuario reclamo el codigo.
     * ON CONFLICT DO NOTHING: idempotente, no falla si ya fue reclamado.
     */
    public static function registrarUso(int $codigoId, int $usuarioId): bool
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'INSERT INTO codigos_gratis_usos (codigo_id, usuario_id)
                VALUES ($1, $2)
                ON CONFLICT (codigo_id, usuario_id) DO NOTHING';
        $res = pg_query_params($db, $sql, [$codigoId, $usuarioId]);
        return (bool) $res;
    }

    /**
     * Verifica si un usuario puede descargar un item usando un codigo especifico.
     * Requiere que el codigo este activo, coincida tipo+target, y el usuario lo haya reclamado.
     */
    public static function usuarioPuedeDescargar(string $codigo, string $tipo, int $targetId, int $usuarioId): bool
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'SELECT cdg.id
                FROM codigos_descarga_gratis cdg
                INNER JOIN codigos_gratis_usos cgu ON cgu.codigo_id = cdg.id
                WHERE cdg.codigo = $1
                  AND cdg.tipo = $2
                  AND cdg.target_id = $3
                  AND cgu.usuario_id = $4
                  AND cdg.activo = TRUE';
        $res = pg_query_params($db, $sql, [$codigo, $tipo, $targetId, $usuarioId]);
        return $res && pg_num_rows($res) > 0;
    }
}
