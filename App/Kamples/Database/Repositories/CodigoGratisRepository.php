<?php

/* [183A-106] Repositorio para codigos de descarga gratuita.
 * Usa el userId de PG (obtenido via UsuarioHelper::obtenerIdPg()) de forma consistente
 * con el resto de repositorios del sistema.
 * [183A-110] Agrega: expires_at (1 año), nombre_item, buscarSiActivo(), invalidarPorTipoTarget(),
 * yaCompensadoPorExpiracion(), registrarCompensacion().
 * [193A-39] Reescrito: usaba PgDatabase (inexistente) con funciones pg_* nativas.
 * Ahora extiende BaseRepository con PDO via PostgresService, consistente con el resto.
 * Causa del 500 en /codigos-gratis/generar: Class "App\Kamples\Database\PgDatabase" not found. */

namespace App\Kamples\Database\Repositories;

class CodigoGratisRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return 'codigos_descarga_gratis';
    }

    protected static function colId(): string
    {
        return 'id';
    }

    /**
     * Inserta un nuevo codigo de descarga gratis.
     * [183A-110] Ahora acepta nombre_item para el modal de compensacion.
     * Retorna el ID generado o null si falla.
     */
    public static function crear(string $codigo, string $tipo, int $targetId, int $creadoPorId, string $nombreItem = ''): ?int
    {
        return static::insertar(
            'INSERT INTO codigos_descarga_gratis (codigo, tipo, target_id, creado_por_id, nombre_item)
             VALUES (:codigo, :tipo, :targetId, :creadoPorId, :nombreItem) RETURNING id',
            [
                'codigo'      => $codigo,
                'tipo'        => $tipo,
                'targetId'    => $targetId,
                'creadoPorId' => $creadoPorId,
                'nombreItem'  => $nombreItem,
            ]
        );
    }

    /**
     * Busca un codigo activo y NO expirado.
     * [183A-110] Retorna null si el codigo expiró (usar buscarSiActivo para detectar expiracion).
     */
    public static function buscarPorCodigo(string $codigo): ?array
    {
        return static::consultarUno(
            'SELECT * FROM codigos_descarga_gratis
             WHERE codigo = :codigo AND activo = TRUE AND expires_at > NOW()',
            ['codigo' => $codigo]
        );
    }

    /**
     * [183A-110] Busca un codigo activo independientemente de si expiró.
     * Usado para detectar codigos vencidos y devolver respuesta diferenciada.
     * Retorna la fila o null si el codigo no existe o fue invalidado.
     */
    public static function buscarSiActivo(string $codigo): ?array
    {
        return static::consultarUno(
            'SELECT * FROM codigos_descarga_gratis WHERE codigo = :codigo AND activo = TRUE',
            ['codigo' => $codigo]
        );
    }

    /**
     * Registra que un usuario reclamo el codigo.
     * ON CONFLICT DO NOTHING: idempotente, no falla si ya fue reclamado.
     */
    public static function registrarUso(int $codigoId, int $usuarioId): bool
    {
        $filas = static::ejecutar(
            'INSERT INTO codigos_gratis_usos (codigo_id, usuario_id)
             VALUES (:codigoId, :usuarioId)
             ON CONFLICT (codigo_id, usuario_id) DO NOTHING',
            ['codigoId' => $codigoId, 'usuarioId' => $usuarioId]
        );
        return $filas >= 0;
    }

    /**
     * [183A-110] Verifica si el usuario ya recibió compensación por este codigo expirado.
     * Previene dar 50 créditos múltiples veces.
     */
    public static function yaCompensadoPorExpiracion(int $codigoId, int $usuarioId): bool
    {
        $row = static::consultarUno(
            'SELECT 1 AS existe FROM codigos_gratis_usos
             WHERE codigo_id = :codigoId AND usuario_id = :usuarioId AND expirado = TRUE',
            ['codigoId' => $codigoId, 'usuarioId' => $usuarioId]
        );
        return $row !== null;
    }

    /**
     * [183A-110] Registra un uso como compensacion por expiración (no da acceso de descarga).
     * ON CONFLICT DO NOTHING: idempotente.
     */
    public static function registrarCompensacion(int $codigoId, int $usuarioId): bool
    {
        $filas = static::ejecutar(
            'INSERT INTO codigos_gratis_usos (codigo_id, usuario_id, expirado)
             VALUES (:codigoId, :usuarioId, TRUE)
             ON CONFLICT (codigo_id, usuario_id) DO NOTHING',
            ['codigoId' => $codigoId, 'usuarioId' => $usuarioId]
        );
        return $filas >= 0;
    }

    /**
     * Verifica si un usuario puede descargar un item usando un codigo especifico.
     * [183A-110] Requiere ademas que expires_at > NOW() — codigos expirados no dan acceso.
     */
    public static function usuarioPuedeDescargar(string $codigo, string $tipo, int $targetId, int $usuarioId): bool
    {
        $row = static::consultarUno(
            'SELECT cdg.id
             FROM codigos_descarga_gratis cdg
             INNER JOIN codigos_gratis_usos cgu ON cgu.codigo_id = cdg.id
             WHERE cdg.codigo = :codigo
               AND cdg.tipo = :tipo
               AND cdg.target_id = :targetId
               AND cgu.usuario_id = :usuarioId
               AND cgu.expirado = FALSE
               AND cdg.activo = TRUE
               AND cdg.expires_at > NOW()',
            [
                'codigo'    => $codigo,
                'tipo'      => $tipo,
                'targetId'  => $targetId,
                'usuarioId' => $usuarioId,
            ]
        );
        return $row !== null;
    }

    /**
     * [183A-110] Invalida todos los codigos activos para un tipo+target.
     * Solo el admin puede llamar esto vía el endpoint /codigos-gratis/invalidar.
     * Retorna el número de codigos invalidados.
     */
    public static function invalidarPorTipoTarget(string $tipo, int $targetId): int
    {
        $filas = static::ejecutar(
            'UPDATE codigos_descarga_gratis
             SET activo = FALSE
             WHERE tipo = :tipo AND target_id = :targetId AND activo = TRUE',
            ['tipo' => $tipo, 'targetId' => $targetId]
        );
        return max($filas, 0);
    }
}
