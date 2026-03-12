<?php

/**
 * ServicioSuspension — Gestión de suspensiones y eliminación de cuentas (QQ65).
 *
 * Diferencia con ServicioBan:
 * - Ban: restricción temporal de escritura (el usuario ve contenido pero no puede interactuar).
 * - Suspensión: oculta TODO el contenido del usuario y bloquea el acceso completo a la plataforma.
 *   El usuario suspendido solo ve un overlay con razón + timer + botón de comentar.
 *
 * Estados:
 *   activo          — cuenta normal
 *   suspendido      — contenido oculto, acceso bloqueado (temporal con suspendido_hasta)
 *   en_eliminacion  — igual que suspendido + countdown de 15 días para borrado definitivo
 *
 * Auto-suspensión: 4+ reportes en 2 horas → suspensión automática 48h.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\ReportesCols;

class ServicioSuspension
{
    /* QQ65: Umbral de reportes y ventana temporal para auto-suspensión */
    private const UMBRAL_REPORTES = 4;
    private const VENTANA_HORAS = 2;
    private const AUTO_SUSPENSION_HORAS = 48;
    private const DIAS_ELIMINACION = 15;

    /**
     * Suspender un usuario por una duración específica.
     *
     * @param int    $userId  ID PG del usuario
     * @param int    $horas   Duración en horas de la suspensión
     * @param string $razon   Razón legible
     * @return bool  True si la suspensión se aplicó correctamente
     */
    public static function suspender(int $userId, int $horas, string $razon): bool
    {
        try {
            $suspendidoHasta = date('c', time() + ($horas * 3600));
            $razonLimpia = sanitize_text_field($razon);

            UsuariosExtRepository::actualizarEstadoCuenta(
                $userId,
                UsuariosExtEnums::ESTADO_SUSPENDIDO,
                $suspendidoHasta,
                $razonLimpia
            );

            /* Notificar al usuario */
            $duracionTexto = self::formatearDuracion($horas);
            ServicioNotificaciones::crear(
                $userId,
                'moderacion',
                "Tu cuenta ha sido suspendida por {$duracionTexto}. Razón: {$razonLimpia}.",
                ['horas' => $horas, 'razon' => $razonLimpia],
                null,
                'Cuenta suspendida'
            );

            KamplesLogger::warning('Usuario suspendido', [
                'userId' => $userId,
                'horas' => $horas,
                'razon' => $razonLimpia,
                'hasta' => $suspendidoHasta,
            ]);

            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioSuspension::suspender fallo', [
                'userId' => $userId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Quitar suspensión y restaurar cuenta a estado activo.
     */
    public static function desuspender(int $userId): bool
    {
        try {
            UsuariosExtRepository::restaurarEstadoCuenta($userId);

            ServicioNotificaciones::crear(
                $userId,
                'moderacion',
                'Tu cuenta ha sido reactivada. Tu contenido vuelve a ser visible.',
                [],
                null,
                'Cuenta reactivada'
            );

            KamplesLogger::info('Suspensión removida', ['userId' => $userId]);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioSuspension::desuspender fallo', [
                'userId' => $userId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Marcar cuenta para eliminación (15 días de countdown).
     * El usuario queda en estado en_eliminacion y no puede acceder.
     */
    public static function marcarParaEliminacion(int $userId, string $razon): bool
    {
        try {
            $ahora = date('c');
            $seraEliminadoEn = date('c', time() + (self::DIAS_ELIMINACION * 86400));
            $razonLimpia = sanitize_text_field($razon);

            UsuariosExtRepository::marcarEliminacion(
                $userId,
                $ahora,
                $seraEliminadoEn,
                $razonLimpia
            );

            ServicioNotificaciones::crear(
                $userId,
                'moderacion',
                "Tu cuenta ha sido marcada para eliminación. Será eliminada definitivamente en " . self::DIAS_ELIMINACION . " días. Razón: {$razonLimpia}.",
                ['seraEliminadoEn' => $seraEliminadoEn, 'razon' => $razonLimpia],
                null,
                'Cuenta marcada para eliminación'
            );

            KamplesLogger::warning('Cuenta marcada para eliminación', [
                'userId' => $userId,
                'seraEliminadoEn' => $seraEliminadoEn,
                'razon' => $razonLimpia,
            ]);

            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioSuspension::marcarParaEliminacion fallo', [
                'userId' => $userId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Cancelar eliminación pendiente y restaurar cuenta.
     */
    public static function cancelarEliminacion(int $userId): bool
    {
        try {
            UsuariosExtRepository::restaurarEstadoCuenta($userId);

            ServicioNotificaciones::crear(
                $userId,
                'moderacion',
                'La eliminación de tu cuenta ha sido cancelada. Tu cuenta ha sido reactivada.',
                [],
                null,
                'Eliminación cancelada'
            );

            KamplesLogger::info('Eliminación cancelada', ['userId' => $userId]);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioSuspension::cancelarEliminacion fallo', [
                'userId' => $userId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Verificar si un usuario debe ser auto-suspendido por exceso de reportes.
     * Umbral: UMBRAL_REPORTES reportes sobre el usuario en las últimas VENTANA_HORAS horas.
     * Retorna true si se activó la auto-suspensión.
     */
    public static function verificarAutoSuspension(int $userId): bool
    {
        try {
            $totalRecientes = ReportesRepository::contarReportesRecientesSobreUsuario(
                $userId,
                self::VENTANA_HORAS
            );

            if ($totalRecientes < self::UMBRAL_REPORTES) {
                return false;
            }

            /* Verificar que no esté ya suspendido */
            $estado = UsuariosExtRepository::obtenerEstadoCuenta($userId);
            if ($estado !== UsuariosExtEnums::ESTADO_ACTIVO) {
                return false;
            }

            $razon = "Suspensión automática: {$totalRecientes} reportes recibidos en las últimas " . self::VENTANA_HORAS . " horas";
            return self::suspender($userId, self::AUTO_SUSPENSION_HORAS, $razon);
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioSuspension::verificarAutoSuspension fallo', [
                'userId' => $userId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Verificar el estado de suspensión de un usuario y retornar info si está suspendido.
     * Limpia auto-expiraciones. Retorna null si el usuario está activo.
     */
    public static function verificarSuspension(int $userId): ?array
    {
        $datos = UsuariosExtRepository::obtenerDatosSuspension($userId);
        if (!$datos) return null;

        $estado = $datos[UsuariosExtCols::ESTADO] ?? UsuariosExtEnums::ESTADO_ACTIVO;

        if ($estado === UsuariosExtEnums::ESTADO_ACTIVO) {
            return null;
        }

        /* Para suspensiones temporales, verificar si ya expiró */
        if ($estado === UsuariosExtEnums::ESTADO_SUSPENDIDO) {
            $suspendidoHasta = $datos[UsuariosExtCols::SUSPENDIDO_HASTA] ?? null;
            if ($suspendidoHasta && strtotime($suspendidoHasta) <= time()) {
                /* Suspensión expirada: restaurar automáticamente */
                UsuariosExtRepository::restaurarEstadoCuenta($userId);
                return null;
            }
        }

        return [
            'estado' => $estado,
            'suspendidoHasta' => $datos[UsuariosExtCols::SUSPENDIDO_HASTA],
            'razon' => $datos[UsuariosExtCols::SUSPENSION_RAZON] ?? 'Violación de normas de la comunidad',
            'seraEliminadoEn' => $datos[UsuariosExtCols::SERA_ELIMINADO_EN],
        ];
    }

    /**
     * Formatea horas en texto legible.
     */
    private static function formatearDuracion(int $horas): string
    {
        if ($horas < 24) {
            return "{$horas} hora(s)";
        }
        $dias = (int) round($horas / 24);
        return "{$dias} día(s)";
    }
}
