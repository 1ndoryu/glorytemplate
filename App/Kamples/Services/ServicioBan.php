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

use App\Kamples\Database\PostgresService;
use App\Kamples\KamplesLogger;

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
    public static function registrarViolacion(int $userId, string $razon, string $tipoContenido = 'comentario'): bool
    {
        /*
         * Incremento atómico + lectura en un solo statement para evitar race condition.
         * Dos requests concurrentes no pueden leer el mismo valor.
         */
        $resultado = PostgresService::consultarUno(
            "UPDATE usuarios_ext SET violaciones_moderacion = COALESCE(violaciones_moderacion, 0) + 1
             WHERE id = :id RETURNING violaciones_moderacion",
            ['id' => $userId]
        );

        $violaciones = (int) ($resultado['violaciones_moderacion'] ?? 0);

        if ($violaciones === 0) {
            KamplesLogger::warning('ServicioBan: no se pudo incrementar violaciones', [
                'userId' => $userId,
            ], 'moderacion');
            return false;
        }

        KamplesLogger::info('Violación registrada', [
            'userId' => $userId,
            'razon' => $razon,
            'tipo' => $tipoContenido,
            'totalViolaciones' => $violaciones,
        ], 'moderacion');

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

            PostgresService::ejecutar(
                "UPDATE usuarios_ext SET baneado_hasta = :hasta, ban_razon = :razon WHERE id = :id",
                ['hasta' => $banHasta, 'razon' => $banRazon, 'id' => $userId]
            );

            KamplesLogger::warning('Ban aplicado', [
                'userId' => $userId,
                'horas' => $horasBan,
                'violaciones' => $violaciones,
                'hasta' => $banHasta,
            ], 'moderacion');

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
        $usuario = PostgresService::consultarUno(
            "SELECT baneado_hasta, ban_razon FROM usuarios_ext WHERE id = :id",
            ['id' => $userId]
        );

        if (!$usuario || !$usuario['baneado_hasta']) return null;

        $banHasta = strtotime($usuario['baneado_hasta']);
        if ($banHasta && $banHasta > time()) {
            return [
                'baneadoHasta' => $usuario['baneado_hasta'],
                'razon' => $usuario['ban_razon'] ?? 'Violación de normas',
            ];
        }

        /* Ban expirado, limpiar */
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET baneado_hasta = NULL, ban_razon = NULL WHERE id = :id",
            ['id' => $userId]
        );

        return null;
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

        PostgresService::insertar(
            "INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos)
             VALUES (:userId, 'moderacion', :titulo, :mensaje, :datos::jsonb)",
            [
                'userId' => $userId,
                'titulo' => $titulo,
                'mensaje' => $mensaje,
                'datos' => json_encode([
                    'tipoContenido' => $tipo,
                    'razon' => $razon,
                    'horasBan' => $horasBan,
                ]),
            ]
        );
    }
}
