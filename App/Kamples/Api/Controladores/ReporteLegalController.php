<?php

/**
 * ReporteLegalController — Endpoints DMCA / reclamaciones legales.
 *
 * IMPORTANTE: El endpoint POST /reportar-legal es publico (sin autenticacion).
 * Cualquier titular de derechos puede enviar una reclamacion, conforme al plan
 * Safe Harbor (DMCA / EUCD). Los datos del reclamante se almacenan en JSONB.
 *
 * Rutas registradas:
 *   POST  kamples/v1/reportar-legal              — Crear reclamacion legal
 *   GET   kamples/v1/admin/reportes/legales      — Listar legales pendientes (admin)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use WP_REST_Request;
use WP_REST_Response;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Kamples\Auth\AuthMiddleware;

class ReporteLegalController
{
    /* Tipos legales validos */
    private const TIPO_SAMPLE   = 'legal_sample';
    private const TIPO_RELACION = 'legal_relacion';
    private const TIPOS_VALIDOS = [self::TIPO_SAMPLE, self::TIPO_RELACION];

    /* ------------------------------------------------------------------ */
    /* Registro de rutas                                                    */
    /* ------------------------------------------------------------------ */

    public static function registrarRutas(string $ns): void
    {
        register_rest_route($ns, '/reportar-legal', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crearReporteLegal'],
            'permission_callback' => '__return_true', // acceso publico (titulares externos)
        ]);

        register_rest_route($ns, '/admin/reportes/legales', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarLegales'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAdmin'],
        ]);
    }

    /* ------------------------------------------------------------------ */
    /* POST /reportar-legal                                                 */
    /* ------------------------------------------------------------------ */

    /**
     * Recibe una reclamacion DMCA/legal de un titular de derechos externo.
     *
     * Parametros requeridos:
     *   tipo           (legal_sample | legal_relacion)
     *   target_id      INT — ID del sample o relacion reclamada
     *   razon          string — descripcion breve de la reclamacion
     *   nombre         string — nombre del reclamante
     *   email          string — email de contacto verificable
     *   tipo_derecho   string — 'copyright' | 'trademark' | 'otro'
     *   obra_protegida string — titulo/descripcion de la obra reclamada
     *   declaracion    bool   — declaracion de buena fe (debe ser true)
     */
    public static function crearReporteLegal(WP_REST_Request $request): WP_REST_Response
    {
        /* [183A-64] Rate limiting: max 3 reclamaciones por IP por hora.
         * Previene abuso masivo del endpoint publico (spam, DoS, takedowns falsos). */
        $rlCheck = self::verificarRateLimit();
        if ($rlCheck !== null) {
            return $rlCheck;
        }

        $tipo      = sanitize_text_field((string) ($request->get_param('tipo') ?? ''));
        $targetId  = (int) ($request->get_param('target_id') ?? 0);
        $razon     = sanitize_textarea_field((string) ($request->get_param('razon') ?? ''));
        $nombre    = sanitize_text_field((string) ($request->get_param('nombre') ?? ''));
        $email     = sanitize_email((string) ($request->get_param('email') ?? ''));
        $tipoDer   = sanitize_text_field((string) ($request->get_param('tipo_derecho') ?? ''));
        $obra      = sanitize_textarea_field((string) ($request->get_param('obra_protegida') ?? ''));
        $declaracion = (bool) ($request->get_param('declaracion') ?? false);

        /* Validaciones */
        if (!in_array($tipo, self::TIPOS_VALIDOS, true)) {
            return new WP_REST_Response(['error' => 'tipo_invalido'], 400);
        }

        if ($targetId <= 0) {
            return new WP_REST_Response(['error' => 'target_id_requerido'], 400);
        }

        if (strlen(trim($razon)) < 10) {
            return new WP_REST_Response(['error' => 'razon_demasiado_corta'], 400);
        }

        if (strlen(trim($nombre)) < 2) {
            return new WP_REST_Response(['error' => 'nombre_requerido'], 400);
        }

        if (!is_email($email)) {
            return new WP_REST_Response(['error' => 'email_invalido'], 400);
        }

        $tiposDerechoValidos = ['copyright', 'trademark', 'otro'];
        if (!in_array($tipoDer, $tiposDerechoValidos, true)) {
            return new WP_REST_Response(['error' => 'tipo_derecho_invalido'], 400);
        }

        if (strlen(trim($obra)) < 3) {
            return new WP_REST_Response(['error' => 'obra_protegida_requerida'], 400);
        }

        if (!$declaracion) {
            return new WP_REST_Response(['error' => 'declaracion_buena_fe_requerida'], 400);
        }

        $detalles = [
            'nombre'         => $nombre,
            'email'          => $email,
            'tipo_derecho'   => $tipoDer,
            'obra_protegida' => $obra,
            'declaracion_bf' => true,
            'ip_origen'      => self::obtenerIpCliente(),
            'fecha_envio'    => date('c'),
        ];

        try {
            $reporteId = ReportesRepository::crearReporteLegal($tipo, $targetId, $razon, $detalles);

            if ($reporteId === null) {
                return new WP_REST_Response(['error' => 'error_crear_reporte'], 500);
            }

            /* [183A-64] No auto-desactivar sample con una reclamacion sin verificar.
             * Un atacante podria desactivar samples de competidores enviando
             * reclamaciones falsas. El sample queda activo hasta revision manual
             * del admin via GET /admin/reportes/legales. */

            return new WP_REST_Response([
                'ok'         => true,
                'reporte_id' => $reporteId,
                'mensaje'    => 'Reclamación registrada. Nuestro equipo la revisará en 72 horas hábiles.',
            ], 201);

        } catch (\Throwable $e) {
            /* Logging sin exponer detalles internos al cliente externo */
            error_log('[ReporteLegalController] Error al crear reporte: ' . $e->getMessage());

            return new WP_REST_Response(['error' => 'error_interno'], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /* GET /admin/reportes/legales                                          */
    /* ------------------------------------------------------------------ */

    public static function listarLegales(WP_REST_Request $request): WP_REST_Response
    {
        $limit  = max(1, min(100, (int) ($request->get_param('limit') ?? 20)));
        $offset = max(0, (int) ($request->get_param('offset') ?? 0));

        try {
            $reportes = ReportesRepository::listarLegalesPendientes($limit, $offset);
            $total    = ReportesRepository::contarLegalesPendientes();

            return new WP_REST_Response([
                'ok'       => true,
                'reportes' => $reportes,
                'total'    => $total,
            ], 200);

        } catch (\Throwable $e) {
            error_log('[ReporteLegalController] Error al listar legales: ' . $e->getMessage());

            return new WP_REST_Response(['error' => 'error_interno'], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Helpers privados                                                     */
    /* ------------------------------------------------------------------ */

    /*
     * Obtiene la IP real del cliente respetando proxies confiables de WP.
     * No se expone en respuestas — solo se almacena internamente para compliance.
     */
    private static function obtenerIpCliente(): string
    {
        /* WP usa $_SERVER['REMOTE_ADDR'] como fuente autoritativa */
        return sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? '');
    }

    /* [183A-64] Rate limiting basado en transients de WP.
     * Limita a 3 reclamaciones por IP por hora para prevenir abuso. */
    private static function verificarRateLimit(): ?WP_REST_Response
    {
        $ip = self::obtenerIpCliente();
        $cacheKey = 'dmca_rl_' . md5($ip);
        $intentos = (int) (get_transient($cacheKey) ?: 0);

        if ($intentos >= 3) {
            return new WP_REST_Response(
                ['error' => 'demasiadas_solicitudes'],
                429
            );
        }

        set_transient($cacheKey, $intentos + 1, HOUR_IN_SECONDS);
        return null;
    }
}
