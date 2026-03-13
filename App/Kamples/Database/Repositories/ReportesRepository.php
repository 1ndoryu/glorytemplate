<?php

/**
 * ReportesRepository — Acceso a datos para tabla 'reportes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ReportesCols;
use App\Config\Schema\_generated\ReportesEnums;
use App\Config\Schema\_generated\ReportesDTO;
use App\Config\Schema\_generated\UsuariosExtCols;

class ReportesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ReportesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ReportesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ReportesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ReportesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /* QQ76: Umbrales de reportes pendientes para auto-ocultacion de contenido */
    const UMBRAL_OCULTAR_SAMPLE = 3;
    const UMBRAL_OCULTAR_PUBLICACION = 3;

    /*
     * QQ76: Genera clausula SQL para ocultar contenido con >= N reportes pendientes.
     * El creador del contenido sigue viendolo (para que pueda editarlo/eliminarlo).
     *
     * @param string   $tipo          Tipo de reporte (ReportesEnums::TIPO_SAMPLE, etc.)
     * @param string   $colTarget     Alias.columna del ID del contenido (ej: 's.id')
     * @param int      $umbral        Numero minimo de reportes para ocultar
     * @param string   $colCreador    Alias.columna del creador del contenido (ej: 's.creador_id')
     * @param int|null $currentUserId ID del usuario actual (null = anonimo)
     * @return string Fragmento SQL " AND (...)" o vacio si umbral <= 0
     *
     * NOTA: $tipo y $colTarget/$colCreador DEBEN venir de constantes del schema, nunca de input.
     * Se usa integer inline (cast seguro) para el umbral y userId dentro del SQL.
     */
    public static function sqlFiltroAutoOcultacion(
        string $tipo,
        string $colTarget,
        int $umbral,
        string $colCreador,
        ?int $currentUserId
    ): string {
        if ($umbral <= 0) {
            return '';
        }

        $tabla = ReportesCols::TABLA;
        $estadoPendiente = ReportesEnums::ESTADO_PENDIENTE;
        $umbral = (int) $umbral;

        $subquery = "(SELECT COUNT(*) FROM {$tabla}"
            . " WHERE " . ReportesCols::TIPO . " = '{$tipo}'"
            . " AND " . ReportesCols::TARGET_ID . " = {$colTarget}"
            . " AND " . ReportesCols::ESTADO . " = '{$estadoPendiente}')";

        /* El creador siempre ve su propio contenido */
        if ($currentUserId !== null) {
            $currentUserId = (int) $currentUserId;
            return " AND ({$subquery} < {$umbral} OR {$colCreador} = {$currentUserId})";
        }

        return " AND {$subquery} < {$umbral}";
    }

    /*
     * Listar reportes pendientes con username del reportador.
     * OPT05: Soporta offset para paginacion.
     */
    public static function listarPendientes(int $limit = 10, int $offset = 0): array
    {
        $tr = ReportesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $estadoPendiente = ReportesEnums::ESTADO_PENDIENTE;

        return static::consultar(
            "SELECT r." . ReportesCols::ID
            . ", r." . ReportesCols::TIPO
            . ", r." . ReportesCols::TARGET_ID
            . ", r." . ReportesCols::REPORTADOR_ID
            . ", r." . ReportesCols::RAZON
            . ", r." . ReportesCols::DETALLES
            . ", r." . ReportesCols::ESTADO
            . ", r." . ReportesCols::CREATED_AT
            . ", u." . UsuariosExtCols::USERNAME . " as reportador_username"
            . " FROM {$tr} r JOIN {$tu} u ON r." . ReportesCols::REPORTADOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE r." . ReportesCols::ESTADO . " = :estado"
            . " ORDER BY r." . ReportesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['estado' => $estadoPendiente, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Contar total de reportes pendientes (para paginacion).
     */
    public static function contarPendientes(): int
    {
        $tabla = ReportesCols::TABLA;
        $estadoPendiente = ReportesEnums::ESTADO_PENDIENTE;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla} WHERE " . ReportesCols::ESTADO . " = :estado",
            ['estado' => $estadoPendiente]
        );

        return $row ? (int) $row['total'] : 0;
    }

    /*
     * Verificar si un usuario ya reportó un target específico.
     */
    public static function yaReportado(string $tipo, int $targetId, int $userId): bool
    {
        $tabla = ReportesCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . ReportesCols::ID . " FROM {$tabla}"
            . " WHERE " . ReportesCols::TIPO . " = :tipo AND " . ReportesCols::TARGET_ID . " = :targetId"
            . " AND " . ReportesCols::REPORTADOR_ID . " = :userId",
            ['tipo' => $tipo, 'targetId' => $targetId, 'userId' => $userId]
        );

        return $row !== null;
    }

    /*
     * Crear nuevo reporte. Retorna el ID generado.
     * Acepta opcionalmente 'detalles' para informacion ampliada (ej: reportes de error).
     */
    public static function crearReporte(string $tipo, int $targetId, int $userId, string $razon, ?string $detalles = null): int
    {
        $tabla = ReportesCols::TABLA;

        if ($detalles !== null) {
            return static::insertar(
                "INSERT INTO {$tabla} (" . ReportesCols::TIPO . ", " . ReportesCols::TARGET_ID
                . ", " . ReportesCols::REPORTADOR_ID . ", " . ReportesCols::RAZON . ", " . ReportesCols::DETALLES
                . ", " . ReportesCols::ESTADO . ")"
                . " VALUES (:tipo, :targetId, :userId, :razon, :detalles, '" . ReportesEnums::ESTADO_PENDIENTE . "') RETURNING " . ReportesCols::ID,
                ['tipo' => $tipo, 'targetId' => $targetId, 'userId' => $userId, ReportesCols::RAZON => $razon, 'detalles' => $detalles]
            );
        }

        return static::insertar(
            "INSERT INTO {$tabla} (" . ReportesCols::TIPO . ", " . ReportesCols::TARGET_ID
            . ", " . ReportesCols::REPORTADOR_ID . ", " . ReportesCols::RAZON . ", " . ReportesCols::ESTADO . ")"
            . " VALUES (:tipo, :targetId, :userId, :razon, '" . ReportesEnums::ESTADO_PENDIENTE . "') RETURNING " . ReportesCols::ID,
            ['tipo' => $tipo, 'targetId' => $targetId, 'userId' => $userId, ReportesCols::RAZON => $razon]
        );
    }

    /*
     * QQ23: Crear reporte de usuario con reportado_id.
     * Rellena tipo='usuario', target_id y reportado_id con el ID del usuario reportado.
     */
    public static function crearReporteUsuario(int $reportadoId, int $reportadorId, string $razon, ?string $detalles = null): int
    {
        $tabla = ReportesCols::TABLA;

        return static::insertar(
            "INSERT INTO {$tabla} ("
            . ReportesCols::TIPO . ", "
            . ReportesCols::TARGET_ID . ", "
            . ReportesCols::REPORTADOR_ID . ", "
            . ReportesCols::REPORTADO_ID . ", "
            . ReportesCols::RAZON . ", "
            . ReportesCols::DETALLES . ", "
            . ReportesCols::ESTADO
            . ") VALUES (:tipo, :targetId, :reportadorId, :reportadoId, :razon, :detalles, :estado)"
            . " RETURNING " . ReportesCols::ID,
            [
                'tipo'         => 'usuario',
                'targetId'     => $reportadoId,
                'reportadorId' => $reportadorId,
                'reportadoId'  => $reportadoId,
                'razon'        => $razon,
                'detalles'     => $detalles,
                'estado'       => ReportesEnums::ESTADO_PENDIENTE,
            ]
        );
    }

    /*
     * Resolver un reporte: cambiar estado a 'resuelto' o 'descartado'.
     * Registra quién lo resolvió y cuándo.
     * Retorna true si el reporte existía y fue actualizado.
     */
    public static function resolverReporte(int $reporteId, string $estado, int $resueltoPor): bool
    {
        $tabla = ReportesCols::TABLA;

        $filasAfectadas = static::ejecutar(
            "UPDATE {$tabla} SET "
            . ReportesCols::ESTADO . " = :estado, "
            . ReportesCols::RESUELTO_POR . " = :resueltoPor, "
            . ReportesCols::RESUELTO_AT . " = NOW()"
            . " WHERE " . ReportesCols::ID . " = :id"
            . " AND " . ReportesCols::ESTADO . " = :estadoPendiente",
            [
                'estado' => $estado,
                'resueltoPor' => $resueltoPor,
                'id' => $reporteId,
                'estadoPendiente' => ReportesEnums::ESTADO_PENDIENTE,
            ]
        );

        return $filasAfectadas > 0;
    }

    /*
     * QQ63: Contar reportes de un tipo específico creados por un usuario.
     * Se usa para verificar si un usuario ya envió una solicitud_whatsapp.
     */
    public static function contarPorTipoYUsuario(string $tipo, int $userId): int
    {
        $tabla = ReportesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla}"
            . " WHERE " . ReportesCols::TIPO . " = :tipo"
            . " AND " . ReportesCols::REPORTADOR_ID . " = :userId",
            ['tipo' => $tipo, 'userId' => $userId]
        );

        return $row ? (int) $row['total'] : 0;
    }

    /*
     * QQ63: Contar reportes de un tipo específico creados hoy (limite global diario).
     */
    public static function contarPorTipoHoy(string $tipo): int
    {
        $tabla = ReportesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla}"
            . " WHERE " . ReportesCols::TIPO . " = :tipo"
            . " AND " . ReportesCols::CREATED_AT . " >= CURRENT_DATE",
            ['tipo' => $tipo]
        );

        return $row ? (int) $row['total'] : 0;
    }

    /*
     * Crear reporte legal (DMCA/derechos) sin requerir usuario registrado.
     * Los datos del reclamante se almacenan en la columna JSONB 'detalles'.
     * Retorna el ID generado o null en fallo.
     */
    public static function crearReporteLegal(
        string $tipo,
        int $targetId,
        string $razon,
        array $detalles
    ): ?int {
        $tabla = ReportesCols::TABLA;

        $detallesJson = json_encode($detalles, JSON_UNESCAPED_UNICODE);
        if ($detallesJson === false || strlen($detallesJson) > 65535) {
            return null;
        }

        return static::insertar(
            "INSERT INTO {$tabla} ("
            . ReportesCols::TIPO . ", "
            . ReportesCols::TARGET_ID . ", "
            . ReportesCols::RAZON . ", "
            . ReportesCols::DETALLES . ", "
            . ReportesCols::ESTADO
            . ") VALUES (:tipo, :targetId, :razon, :detalles::jsonb, :estado)"
            . " RETURNING " . ReportesCols::ID,
            [
                'tipo'     => $tipo,
                'targetId' => $targetId,
                'razon'    => $razon,
                'detalles' => $detallesJson,
                'estado'   => ReportesEnums::ESTADO_PENDIENTE,
            ]
        );
    }

    /*
     * Listar reportes legales pendientes (legal_sample | legal_relacion).
     * Incluye info del sample/relacion para que el moderador pueda actuar.
     */
    public static function listarLegalesPendientes(int $limit = 20, int $offset = 0): array
    {
        $tabla = ReportesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla}"
            . " WHERE " . ReportesCols::TIPO . " IN ('legal_sample', 'legal_relacion')"
            . "   AND " . ReportesCols::ESTADO . " = :estado"
            . " ORDER BY " . ReportesCols::CREATED_AT . " DESC"
            . " LIMIT :limit OFFSET :offset",
            [
                'estado' => ReportesEnums::ESTADO_PENDIENTE,
                'limit'  => $limit,
                'offset' => $offset,
            ]
        );
    }

    /*
     * Contar reportes legales pendientes (para paginacion admin).
     */
    public static function contarLegalesPendientes(): int
    {
        $tabla = ReportesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla}"
            . " WHERE " . ReportesCols::TIPO . " IN ('legal_sample', 'legal_relacion')"
            . "   AND " . ReportesCols::ESTADO . " = :estado",
            ['estado' => ReportesEnums::ESTADO_PENDIENTE]
        );

        return $row ? (int) $row['total'] : 0;
    }

    /*
     * QQ65: Contar reportes recibidos sobre un usuario en las últimas N horas.
     * Para auto-suspensión: cuenta reportes de tipo 'usuario' donde target_id = userId
     * creados dentro de la ventana temporal.
     * Gotcha: INTERVAL no acepta parámetros PDO — se usa whitelist de valores permitidos.
     */
    public static function contarReportesRecientesSobreUsuario(int $userId, int $horas): int
    {
        $tabla = ReportesCols::TABLA;

        /* Whitelist de ventanas temporales válidas para prevenir inyección en INTERVAL */
        $intervalosValidos = [1 => '1 hours', 2 => '2 hours', 6 => '6 hours', 12 => '12 hours', 24 => '24 hours', 48 => '48 hours'];
        $intervalo = $intervalosValidos[$horas] ?? '2 hours';

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla}"
            . " WHERE " . ReportesCols::TIPO . " = '" . ReportesEnums::TIPO_USUARIO . "'"
            . " AND " . ReportesCols::TARGET_ID . " = :userId"
            . " AND " . ReportesCols::CREATED_AT . " >= NOW() - INTERVAL '{$intervalo}'",
            ['userId' => $userId]
        );

        return $row ? (int) $row['total'] : 0;
    }
}
