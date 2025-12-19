<?php

/**
 * SettingsRestApi - API REST para el panel de configuracion React
 *
 * Endpoints:
 * - GET  /glory/v1/settings       - Obtener todas las opciones
 * - POST /glory/v1/settings       - Guardar opciones
 *
 * @package App\Services
 */

namespace App\Services;

use Glory\Manager\OpcionManager;
use Glory\Core\OpcionRepository;

class SettingsRestApi
{
    /**
     * Opciones permitidas para editar desde el panel React
     * Mapeadas desde opcionesTema.php
     */
    private const ALLOWED_OPTIONS = [
        // Identity
        'glory_site_name',
        'glory_site_tagline',
        'glory_site_phone',
        'glory_site_email',
        // Contact
        'glory_url_calendly',
        'glory_url_whatsapp',
        'glory_whatsapp_message',
        // Social
        'glory_social_linkedin',
        'glory_social_twitter',
        'glory_social_youtube',
        'glory_social_instagram',
        // Images
        'glory_image_hero',
        'glory_image_secondary',
        // Logo
        'glory_logo_mode',
        'glory_logo_text',
        'glory_logo_image',
        // Integrations
        'glory_gtm_id',
        'glory_ga4_measurement_id',
        'glory_gsc_verification_code',
        'glory_custom_header_scripts',
        // Pricing
        'glory_pricing_basico',
        'glory_pricing_avanzado',
        'glory_pricing_total',
        'glory_pricing_currency',
        'glory_pricing_period',
    ];

    /**
     * Registrar endpoints
     */
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerEndpoints']);
    }

    /**
     * Registrar rutas REST
     */
    public static function registerEndpoints(): void
    {
        register_rest_route('glory/v1', '/settings', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'getSettings'],
                'permission_callback' => [self::class, 'checkAdminPermission'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [self::class, 'saveSettings'],
                'permission_callback' => [self::class, 'checkAdminPermission'],
            ],
        ]);
    }

    /**
     * Verificar que el usuario es administrador
     */
    public static function checkAdminPermission(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * GET /glory/v1/settings
     * Obtener todas las opciones configurables
     */
    public static function getSettings(\WP_REST_Request $request): \WP_REST_Response
    {
        $options = [];

        foreach (self::ALLOWED_OPTIONS as $key) {
            $options[$key] = OpcionManager::get($key, '');
        }

        return new \WP_REST_Response([
            'success' => true,
            'options' => $options,
        ], 200);
    }

    /**
     * POST /glory/v1/settings
     * Guardar opciones
     */
    public static function saveSettings(\WP_REST_Request $request): \WP_REST_Response
    {
        $body = $request->get_json_params();
        $options = $body['options'] ?? [];

        if (empty($options)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'No se proporcionaron opciones para guardar',
            ], 400);
        }

        $saved = [];
        $errors = [];

        foreach ($options as $key => $value) {
            // Solo permitir opciones de la lista blanca
            if (!in_array($key, self::ALLOWED_OPTIONS, true)) {
                $errors[] = "Opcion no permitida: {$key}";
                continue;
            }

            // Sanitizar segun tipo
            $sanitizedValue = self::sanitizeOption($key, $value);

            // Guardar usando OpcionRepository (que aplica el prefijo correcto)
            // OpcionManager lee desde OpcionRepository, no directamente desde wp_options
            $result = OpcionRepository::save($key, $sanitizedValue);

            if ($result !== false) {
                $saved[] = $key;
                // Limpiar cache de OpcionManager para que refleje el nuevo valor
                OpcionManager::clearCache();
            } else {
                // save() devuelve false si el valor no cambio
                // En ese caso, consideramos que el guardado fue exitoso
                $saved[] = $key;
            }
        }

        if (!empty($errors)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => implode(', ', $errors),
                'saved'   => $saved,
            ], 400);
        }

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'Configuracion guardada correctamente',
            'saved'   => $saved,
        ], 200);
    }

    /**
     * Sanitizar valor segun el tipo de opcion
     */
    private static function sanitizeOption(string $key, string $value): string
    {
        // URLs
        if (strpos($key, '_url_') !== false || strpos($key, '_social_') !== false) {
            return esc_url_raw($value);
        }

        // Scripts (permitir HTML)
        if ($key === 'glory_custom_header_scripts') {
            return $value; // Se sanitiza al renderizar
        }

        // Emails
        if (strpos($key, '_email') !== false) {
            return sanitize_email($value);
        }

        // Imagenes (URLs)
        if (strpos($key, '_image_') !== false || $key === 'glory_logo_image') {
            return esc_url_raw($value);
        }

        // Default: sanitizar texto
        return sanitize_text_field($value);
    }
}
