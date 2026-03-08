<?php

/**
 * ServicioBan — Gestión de bans y violaciones de moderación (C132).
 *
 * Escalado progresivo de sanciones:
 * - 1-2 violaciones: solo eliminación del contenido + notificación
 * - 3 violaciones: ban temporal 24h
 * - 5 violaciones: ban temporal 7 días
 * - 8+ violaciones: ban temporal 30 días
 *
 * Cada ban genera una notificación al usuario con la razón.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\LogModeracion as KamplesLogger;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\LikesEnums;

class ServicioBan
{
    /* Escala de sanciones: violaciones => horas de ban */
    private const ESCALA_BAN = [
        3  => 24,
        5  => 168,
        8  => 720,
    ];

    /**
     * Registra una violación de moderación y aplica ban si corresponde.
     * Retorna true si el usuario fue baneado.
     */
    public static function registrarViolacion(int $userId, string $razon, string $tipoContenido = LikesEnums::TIPO_COMENTARIO): bool
    {
        /*
         * Incremento atómico + lectura en un solo statement para evitar race condition.
         * Dos requests concurrentes no pueden leer el mismo valor.
         */
        $violaciones = UsuariosExtRepository::incrementarViolaciones($userId);

        if ($violaciones === 0) {
            KamplesLogger::warning('ServicioBan: no se pudo incrementar violaciones', [
                'userId' => $userId,
            ]);
            return false;
        }

        KamplesLogger::info('Violación registrada', [
            'userId' => $userId,
            'razon' => $razon,
            'tipo' => $tipoContenido,
            'totalViolaciones' => $violaciones,
        ]);

        /* Determinar si aplica ban según escala */
        $horasBan = 0;
        foreach (self::ESCALA_BAN as $umbral => $horas) {
            if ($violaciones >= $umbral) {
                $horasBan = $horas;
            }
        }

        /* Notificar eliminación de contenido al usuario */
        self::notificarModeracion($userId, $razon, $tipoContenido, $horasBan);

        if ($horasBan > 0) {
            $banHasta = date('c', time() + ($horasBan * 3600));
            $banRazon = "Ban automático por {$violaciones} violaciones de moderación. Última: {$razon}";

            UsuariosExtRepository::aplicarBan($userId, $banHasta, $banRazon);

            KamplesLogger::warning('Ban aplicado', [
                'userId' => $userId,
                'horas' => $horasBan,
                'violaciones' => $violaciones,
                'hasta' => $banHasta,
            ]);

            return true;
        }

        return false;
    }

    /**
     * Verifica si un usuario está actualmente baneado.
     * Retorna null si no está baneado, o un array con info del ban.
     */
    public static function verificarBan(int $userId): ?array
    {
        $usuario = UsuariosExtRepository::obtenerDatosBan($userId);

        if (!$usuario || !$usuario[UsuariosExtCols::BANEADO_HASTA]) return null;

        $banHasta = strtotime($usuario[UsuariosExtCols::BANEADO_HASTA]);
        if ($banHasta && $banHasta > time()) {
            return [
                'baneadoHasta' => $usuario[UsuariosExtCols::BANEADO_HASTA],
                'razon' => $usuario[UsuariosExtCols::BAN_RAZON] ?? 'Violación de normas',
            ];
        }

        /* Ban expirado, limpiar */
        UsuariosExtRepository::limpiarBan($userId);

        return null;
    }

    /**
     * Aplica ban manual desde el panel de admin (sin incrementar violaciones).
     * Duración válida: '1h', '24h', '7d', '30d'.
     */
    public static function aplicarBanManual(int $userId, string $duracion, string $razon): void
    {
        $horasMap = ['1h' => 1, '24h' => 24, '7d' => 168, '30d' => 720];
        if (!array_key_exists($duracion, $horasMap)) {
            $duracion = '24h';
        }
        $horas   = $horasMap[$duracion];
        $banHasta = date('c', time() + ($horas * 3600));
        $razonLimpia = sanitize_text_field($razon);
        $banRazon = "Ban manual por equipo de moderaci\u00f3n. Raz\u00f3n: {$razonLimpia}";

        UsuariosExtRepository::aplicarBan($userId, $banHasta, $banRazon);

        /* Notificar al usuario */
        $dias    = round($horas / 24);
        $etiqueta = $dias >= 1 ? "{$dias} d\u00eda(s)" : "{$horas} hora(s)";
        $mensaje  = "Tu cuenta fue suspendida por {$etiqueta} por el equipo de moderaci\u00f3n. Raz\u00f3n: {$razonLimpia}.";

        ServicioNotificaciones::crear(
            $userId,
            'moderacion',
            $mensaje,
            ['razon' => $razonLimpia, 'horas' => $horas],
            null,
            'Cuenta suspendida'
        );

        KamplesLogger::warning('Ban manual aplicado por admin', [
            'userId'   => $userId,
            'duracion' => $duracion,
            'razon'    => $razonLimpia,
        ]);
    }

    /**
     * Crea notificación de moderación para el usuario afectado.
     */
    private static function notificarModeracion(int $userId, string $razon, string $tipo, int $horasBan): void
    {
        $titulo = 'Contenido eliminado por moderación';
        $mensaje = "Tu {$tipo} fue eliminado automáticamente. Razón: {$razon}.";

        if ($horasBan > 0) {
            $dias = round($horasBan / 24);
            $mensaje .= " Además, tu cuenta ha sido suspendida por {$dias} día(s) debido a violaciones repetidas.";
        }

        /* C266: Usa ServicioNotificaciones para notificaciones de moderacion */
        ServicioNotificaciones::crear(
            $userId,
            'moderacion',
            $mensaje,
            [
                'tipoContenido' => $tipo,
                'razon' => $razon,
                'horasBan' => $horasBan,
            ],
            null,
            $titulo
        );
    }
}
