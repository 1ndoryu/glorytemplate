<?php

/* [183A-106] Repositorio para codigos de descarga gratuita.
 * Usa el userId de PG (obtenido via UsuarioHelper::obtenerIdPg()) de forma consistente
 * con el resto de repositorios del sistema.
 * [183A-110] Agrega: expires_at (1 año), nombre_item, buscarSiActivo(), invalidarPorTipoTarget(),
 * yaCompensadoPorExpiracion(), registrarCompensacion(). */

namespace App\Kamples\Database\Repositories;

use App\Kamples\Database\PgDatabase;

class CodigoGratisRepository
{
    /**
     * Inserta un nuevo codigo de descarga gratis.
     * [183A-110] Ahora acepta nombre_item para el modal de compensacion.
     * Retorna el ID generado o null si falla.
     */
    public static function crear(string $codigo, string $tipo, int $targetId, int $creadoPorId, string $nombreItem = ''): ?int
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'INSERT INTO codigos_descarga_gratis (codigo, tipo, target_id, creado_por_id, nombre_item)
                VALUES ($1, $2, $3, $4, $5) RETURNING id';
        $res = pg_query_params($db, $sql, [$codigo, $tipo, $targetId, $creadoPorId, $nombreItem]);
        if (!$res) return null;
        $row = pg_fetch_assoc($res);
        return $row ? (int) $row['id'] : null;
    }

    /**
     * Busca un codigo activo y NO expirado.
     * [183A-110] Retorna null si el codigo expiró (usar buscarSiActivo para detectar expiracion).
     */
    public static function buscarPorCodigo(string $codigo): ?array
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'SELECT * FROM codigos_descarga_gratis
                WHERE codigo = $1 AND activo = TRUE AND expires_at > NOW()';
        $res = pg_query_params($db, $sql, [$codigo]);
        if (!$res) return null;
        $row = pg_fetch_assoc($res);
        return $row ?: null;
    }

    /**
     * [183A-110] Busca un codigo activo independientemente de si expiró.
     * Usado para detectar codigos vencidos y devolver respuesta diferenciada.
     * Retorna la fila o null si el codigo no existe o fue invalidado.
     */
    public static function buscarSiActivo(string $codigo): ?array
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
     * [183A-110] Verifica si el usuario ya recibió compensación por este codigo expirado.
     * Previene dar 50 créditos múltiples veces.
     */
    public static function yaCompensadoPorExpiracion(int $codigoId, int $usuarioId): bool
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'SELECT 1 FROM codigos_gratis_usos
                WHERE codigo_id = $1 AND usuario_id = $2 AND expirado = TRUE';
        $res = pg_query_params($db, $sql, [$codigoId, $usuarioId]);
        return $res && pg_num_rows($res) > 0;
    }

    /**
     * [183A-110] Registra un uso como compensacion por expiración (no da acceso de descarga).
     * ON CONFLICT DO NOTHING: idempotente.
     */
    public static function registrarCompensacion(int $codigoId, int $usuarioId): bool
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'INSERT INTO codigos_gratis_usos (codigo_id, usuario_id, expirado)
                VALUES ($1, $2, TRUE)
                ON CONFLICT (codigo_id, usuario_id) DO NOTHING';
        $res = pg_query_params($db, $sql, [$codigoId, $usuarioId]);
        return (bool) $res;
    }

    /**
     * Verifica si un usuario puede descargar un item usando un codigo especifico.
     * [183A-110] Requiere ademas que expires_at > NOW() — codigos expirados no dan acceso.
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
                  AND cgu.expirado = FALSE
                  AND cdg.activo = TRUE
                  AND cdg.expires_at > NOW()';
        $res = pg_query_params($db, $sql, [$codigo, $tipo, $targetId, $usuarioId]);
        return $res && pg_num_rows($res) > 0;
    }

    /**
     * [183A-110] Invalida todos los codigos activos para un tipo+target.
     * Solo el admin puede llamar esto vía el endpoint /codigos-gratis/invalidar.
     * Retorna el número de codigos invalidados.
     */
    public static function invalidarPorTipoTarget(string $tipo, int $targetId): int
    {
        $db = PgDatabase::obtenerConexion();
        $sql = 'UPDATE codigos_descarga_gratis
                SET activo = FALSE
                WHERE tipo = $1 AND target_id = $2 AND activo = TRUE';
        $res = pg_query_params($db, $sql, [$tipo, $targetId]);
        if (!$res) return 0;
        return (int) pg_affected_rows($res);
    }
}
