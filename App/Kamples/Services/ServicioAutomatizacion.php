<?php

/* [223A-3] ServicioAutomatizacion — Orquestador de ejecución automática por hora.
 *
 * Registra WP Cron hooks horarios para extracción (20 items/h) y scraping (500 items/h).
 * Gestiona auto-stop ante fallos y notificación al admin.
 * La cola IA (ProcesadorColaIA) es independiente y NUNCA se detiene.
 *
 * Estado de auto-stop se persiste en WordPress options:
 *   - kmpl_auto_extraccion_activo (bool)
 *   - kmpl_auto_scraping_activo (bool)
 *   - kmpl_auto_scraping_fallos_consecutivos (int)
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\LotesProcesamientoRepository;
use App\Config\Schema\_generated\LotesProcesamientoEnums;
use App\Kamples\KamplesLogger;

class ServicioAutomatizacion
{
    public const CRON_HOOK_EXTRACCION = 'kamples_auto_extraccion';
    public const CRON_HOOK_SCRAPING = 'kamples_auto_scraping';
    public const CRON_INTERVALO = 'kamples_1hora';
    public const CRON_INTERVALO_SEGUNDOS = 3600;

    /* Límites por lote */
    private const LIMITE_EXTRACCION = 20;
    private const LIMITE_SCRAPING = 500;

    /* Umbral de fallos para auto-stop */
    private const UMBRAL_FALLOS_EXTRACCION = 20;
    /* [243A-1] Bajado de 50 a 5: si el scraper lleva 5h seguidas sin items
     * nuevos (todo dedup o sin entries), auto-stop para no gastar proxy. */
    private const UMBRAL_FALLOS_SCRAPING = 5;

    /* WordPress options para estado */
    private const OPT_EXTRACCION_ACTIVO = 'kmpl_auto_extraccion_activo';
    private const OPT_SCRAPING_ACTIVO = 'kmpl_auto_scraping_activo';
    private const OPT_SCRAPING_FALLOS = 'kmpl_auto_scraping_fallos_consecutivos';

    /* Admin user ID para notificaciones */
    private const ADMIN_ID = 1;

    /**
     * Registra cron hooks para automatización. Llamar desde KamplesInit::init().
     */
    public static function registrarCron(): void
    {
        /* Intervalo horario */
        add_filter('cron_schedules', function (array $schedules): array {
            if (!isset($schedules[self::CRON_INTERVALO])) {
                $schedules[self::CRON_INTERVALO] = [
                    'interval' => self::CRON_INTERVALO_SEGUNDOS,
                    'display'  => 'Kamples: cada 1 hora (Automatización)',
                ];
            }
            return $schedules;
        });

        add_action(self::CRON_HOOK_EXTRACCION, [self::class, 'ejecutarExtraccion']);
        add_action(self::CRON_HOOK_SCRAPING, [self::class, 'ejecutarScraping']);

        if (!wp_next_scheduled(self::CRON_HOOK_EXTRACCION)) {
            wp_schedule_event(time(), self::CRON_INTERVALO, self::CRON_HOOK_EXTRACCION);
        }

        if (!wp_next_scheduled(self::CRON_HOOK_SCRAPING)) {
            wp_schedule_event(time(), self::CRON_INTERVALO, self::CRON_HOOK_SCRAPING);
        }
    }

    /**
     * Ejecuta lote de extracción de audio (20 items).
     */
    public static function ejecutarExtraccion(): void
    {
        $tipo = LotesProcesamientoEnums::TIPO_EXTRACCION;

        if (!self::estaActivo($tipo)) {
            KamplesLogger::info('[Automatizacion] Extracción auto-detenida, saltando lote');
            return;
        }

        /* Verificar que no hay otro proceso corriendo */
        $estado = GestorProcesosFondo::estadoProceso('extraccion');
        if ($estado['estado'] === 'running') {
            KamplesLogger::info('[Automatizacion] Extracción ya en ejecución, saltando');
            return;
        }

        try {
            $loteId = LotesProcesamientoRepository::crearLote($tipo);

            KamplesLogger::info('[Automatizacion] Iniciando lote extracción', [
                'lote_id' => $loteId,
                'limite'  => self::LIMITE_EXTRACCION,
            ]);

            /* Inyectar batch ID como env var para que Python lo reporte */
            \putenv("KAMPLES_BATCH_ID={$loteId}");

            $resultado = GestorProcesosFondo::iniciar('extraccion', [
                'limit' => self::LIMITE_EXTRACCION,
                'env'   => ['KAMPLES_BATCH_ID' => (string) $loteId],
            ]);

            if (!($resultado['ok'] ?? false)) {
                LotesProcesamientoRepository::completarLote($loteId, [
                    'estado'        => LotesProcesamientoEnums::ESTADO_ERROR,
                    'error_mensaje' => $resultado['error'] ?? 'No se pudo iniciar el proceso',
                ]);
                KamplesLogger::error('[Automatizacion] No se pudo iniciar extracción', $resultado);
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('[Automatizacion] Error iniciando extracción', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Ejecuta lote de scraping WhoSampled (500 items).
     */
    public static function ejecutarScraping(): void
    {
        $tipo = LotesProcesamientoEnums::TIPO_SCRAPING;

        if (!self::estaActivo($tipo)) {
            KamplesLogger::info('[Automatizacion] Scraping auto-detenido, saltando lote');
            return;
        }

        $estado = GestorProcesosFondo::estadoProceso('scraping');
        if ($estado['estado'] === 'running') {
            KamplesLogger::info('[Automatizacion] Scraping ya en ejecución, saltando');
            return;
        }

        try {
            $loteId = LotesProcesamientoRepository::crearLote($tipo);

            KamplesLogger::info('[Automatizacion] Iniciando lote scraping', [
                'lote_id' => $loteId,
                'limite'  => self::LIMITE_SCRAPING,
            ]);

            \putenv("KAMPLES_BATCH_ID={$loteId}");

            $resultado = GestorProcesosFondo::iniciar('scraping', [
                'limit' => self::LIMITE_SCRAPING,
                'env'   => ['KAMPLES_BATCH_ID' => (string) $loteId],
            ]);

            if (!($resultado['ok'] ?? false)) {
                LotesProcesamientoRepository::completarLote($loteId, [
                    'estado'        => LotesProcesamientoEnums::ESTADO_ERROR,
                    'error_mensaje' => $resultado['error'] ?? 'No se pudo iniciar el proceso',
                ]);
                KamplesLogger::error('[Automatizacion] No se pudo iniciar scraping', $resultado);
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('[Automatizacion] Error iniciando scraping', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Procesa el reporte de un lote completado (llamado por Python vía REST).
     * Evalúa si debe auto-detener el proceso.
     */
    public static function procesarReporteLote(int $loteId, array $datos): void
    {
        $lote = LotesProcesamientoRepository::consultarUno(
            "SELECT * FROM " . \App\Config\Schema\_generated\LotesProcesamientoCols::TABLA
            . " WHERE id = :id",
            ['id' => $loteId]
        );

        if (!$lote) {
            KamplesLogger::warning('[Automatizacion] Lote no encontrado para reporte', ['lote_id' => $loteId]);
            return;
        }

        $tipo = $lote['tipo'];
        $exitosos = (int) ($datos['exitosos'] ?? 0);
        $fallidos = (int) ($datos['fallidos'] ?? 0);

        /* Determinar estado final */
        $estado = ($exitosos > 0 || $fallidos === 0)
            ? LotesProcesamientoEnums::ESTADO_COMPLETADO
            : LotesProcesamientoEnums::ESTADO_ERROR;

        $datos['estado'] = $estado;
        LotesProcesamientoRepository::completarLote($loteId, $datos);

        KamplesLogger::info('[Automatizacion] Lote completado', [
            'lote_id'  => $loteId,
            'tipo'     => $tipo,
            'exitosos' => $exitosos,
            'fallidos' => $fallidos,
            'estado'   => $estado,
        ]);

        /* Evaluar auto-stop según tipo */
        if ($tipo === LotesProcesamientoEnums::TIPO_EXTRACCION) {
            self::evaluarAutoStopExtraccion($exitosos, $fallidos);
        } elseif ($tipo === LotesProcesamientoEnums::TIPO_SCRAPING) {
            self::evaluarAutoStopScraping($exitosos, $fallidos);
        }
    }

    /**
     * Extracción: si TODOS los items del lote fallaron → auto-stop.
     */
    private static function evaluarAutoStopExtraccion(int $exitosos, int $fallidos): void
    {
        if ($exitosos > 0 || $fallidos < self::UMBRAL_FALLOS_EXTRACCION) {
            return;
        }

        /* Todos fallaron — detener */
        self::autoDetener(LotesProcesamientoEnums::TIPO_EXTRACCION,
            "Lote de extracción completo con {$fallidos} fallos y 0 éxitos. Proceso detenido automáticamente."
        );
    }

    /**
     * Scraping: tracker de fallos consecutivos. Se resetea si hay éxitos.
     * [243A-1] Cuando exitosos=0 y fallidos=0 (caso de reporte sin telemetría
     * o legacy), contar como 1 fallo idle para que el auto-stop progrese
     * en vez de quedarse paralizado infinitamente.
     */
    private static function evaluarAutoStopScraping(int $exitosos, int $fallidos): void
    {
        if ($exitosos > 0) {
            /* Éxitos en el lote → resetear contador */
            \update_option(self::OPT_SCRAPING_FALLOS, 0, false);
            return;
        }

        /* exitosos=0: acumular fallos. Si fallidos también es 0, contar como 1
         * (run idle — no hay items nuevos ni errores, solo gasto de proxy). */
        $increment = \max($fallidos, 1);
        $acumulado = (int) \get_option(self::OPT_SCRAPING_FALLOS, 0);
        $nuevo = $acumulado + $increment;
        \update_option(self::OPT_SCRAPING_FALLOS, $nuevo, false);

        if ($nuevo >= self::UMBRAL_FALLOS_SCRAPING) {
            self::autoDetener(LotesProcesamientoEnums::TIPO_SCRAPING,
                "{$nuevo} lotes consecutivos sin items nuevos. Scraper detenido para no gastar proxy."
            );
            \update_option(self::OPT_SCRAPING_FALLOS, 0, false);
        }
    }

    /**
     * Detiene automáticamente un tipo de proceso y notifica al admin.
     */
    private static function autoDetener(string $tipo, string $razon): void
    {
        $opcion = $tipo === LotesProcesamientoEnums::TIPO_EXTRACCION
            ? self::OPT_EXTRACCION_ACTIVO
            : self::OPT_SCRAPING_ACTIVO;

        \update_option($opcion, false, false);

        KamplesLogger::warning('[Automatizacion] Auto-stop activado', [
            'tipo'  => $tipo,
            'razon' => $razon,
        ]);

        /* Notificar al admin */
        $etiqueta = $tipo === LotesProcesamientoEnums::TIPO_EXTRACCION
            ? 'Extractor de Audio'
            : 'Scraper WhoSampled';

        try {
            ServicioNotificaciones::crear(
                self::ADMIN_ID,
                'sistema',
                $razon,
                ['tipo_proceso' => $tipo, 'accion' => 'auto_stop'],
                null,
                "⚠ {$etiqueta} detenido"
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('[Automatizacion] Error enviando notificación auto-stop', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Reactivar un proceso auto-detenido.
     */
    public static function reactivar(string $tipo): array
    {
        if (!\in_array($tipo, [LotesProcesamientoEnums::TIPO_EXTRACCION, LotesProcesamientoEnums::TIPO_SCRAPING], true)) {
            return ['ok' => false, 'error' => 'Tipo de proceso inválido.'];
        }

        $opcion = $tipo === LotesProcesamientoEnums::TIPO_EXTRACCION
            ? self::OPT_EXTRACCION_ACTIVO
            : self::OPT_SCRAPING_ACTIVO;

        \update_option($opcion, true, false);

        /* Resetear contador de fallos scraping si aplica */
        if ($tipo === LotesProcesamientoEnums::TIPO_SCRAPING) {
            \update_option(self::OPT_SCRAPING_FALLOS, 0, false);
        }

        $etiqueta = $tipo === LotesProcesamientoEnums::TIPO_EXTRACCION
            ? 'Extractor de Audio'
            : 'Scraper WhoSampled';

        KamplesLogger::info('[Automatizacion] Proceso reactivado', ['tipo' => $tipo]);

        return ['ok' => true, 'mensaje' => "{$etiqueta} reactivado correctamente."];
    }

    /**
     * Verifica si un tipo de proceso está activo (no auto-detenido).
     */
    public static function estaActivo(string $tipo): bool
    {
        $opcion = $tipo === LotesProcesamientoEnums::TIPO_EXTRACCION
            ? self::OPT_EXTRACCION_ACTIVO
            : self::OPT_SCRAPING_ACTIVO;

        /* Por defecto activo si no se ha seteado */
        $valor = \get_option($opcion, true);

        /* get_option puede retornar string "1"/"0" o bool */
        if (\is_string($valor)) {
            return $valor !== '0' && $valor !== '';
        }

        return (bool) $valor;
    }

    /**
     * Retorna el estado de automatización para el panel admin.
     */
    public static function estadoGeneral(): array
    {
        return [
            'extraccion' => [
                'activo'             => self::estaActivo(LotesProcesamientoEnums::TIPO_EXTRACCION),
                'limite_por_lote'    => self::LIMITE_EXTRACCION,
                'intervalo_segundos' => self::CRON_INTERVALO_SEGUNDOS,
                'ultimo_lote'        => LotesProcesamientoRepository::ultimoLote(LotesProcesamientoEnums::TIPO_EXTRACCION),
            ],
            'scraping' => [
                'activo'               => self::estaActivo(LotesProcesamientoEnums::TIPO_SCRAPING),
                'limite_por_lote'      => self::LIMITE_SCRAPING,
                'intervalo_segundos'   => self::CRON_INTERVALO_SEGUNDOS,
                'fallos_consecutivos'  => (int) \get_option(self::OPT_SCRAPING_FALLOS, 0),
                'ultimo_lote'          => LotesProcesamientoRepository::ultimoLote(LotesProcesamientoEnums::TIPO_SCRAPING),
            ],
        ];
    }
}
