<?php

/**
 * ContactFormRestApi - API REST para el formulario de contacto
 *
 * Endpoint:
 * - POST /glory/v1/contact - Enviar formulario de contacto
 *
 * El email se envia al correo configurado en glory_site_email.
 * Si no esta configurado, usa el admin_email de WordPress.
 *
 * @package App\Services
 */

namespace App\Services;

use Glory\Manager\OpcionManager;

class ContactFormRestApi
{
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
        register_rest_route('glory/v1', '/contact', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'handleContactForm'],
            'permission_callback' => '__return_true', // Publico (cualquier visitante puede enviar)
            'args'                => self::getEndpointArgs(),
        ]);
    }

    /**
     * Definir argumentos esperados del endpoint
     */
    private static function getEndpointArgs(): array
    {
        return [
            'nombre' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'email' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_email',
                'validate_callback' => function ($value) {
                    return is_email($value);
                },
            ],
            'telefono' => [
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'empresa' => [
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'servicio' => [
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'mensaje' => [
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_textarea_field',
            ],
            'canalPreferido' => [
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'consentimiento' => [
                'required'          => true,
                'type'              => 'boolean',
            ],
            // Campos de tracking (opcionales)
            'utmSource'   => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'utmMedium'   => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'utmCampaign' => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'utmContent'  => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'pageUrl'     => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'esc_url_raw'],
            'timestamp'   => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
        ];
    }

    /**
     * POST /glory/v1/contact
     * Procesar y enviar formulario de contacto
     */
    public static function handleContactForm(\WP_REST_Request $request): \WP_REST_Response
    {
        // Validar consentimiento RGPD
        $consentimiento = $request->get_param('consentimiento');
        if (!$consentimiento) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Debes aceptar la Politica de Privacidad para continuar.',
            ], 400);
        }

        // Obtener datos del formulario
        $formData = [
            'nombre'         => $request->get_param('nombre'),
            'email'          => $request->get_param('email'),
            'telefono'       => $request->get_param('telefono') ?: 'No proporcionado',
            'empresa'        => $request->get_param('empresa') ?: 'No proporcionada',
            'servicio'       => self::getServicioLabel($request->get_param('servicio')),
            'mensaje'        => $request->get_param('mensaje') ?: 'Sin mensaje adicional',
            'canalPreferido' => self::getCanalLabel($request->get_param('canalPreferido')),
            // Tracking
            'utmSource'      => $request->get_param('utmSource') ?: '-',
            'utmMedium'      => $request->get_param('utmMedium') ?: '-',
            'utmCampaign'    => $request->get_param('utmCampaign') ?: '-',
            'utmContent'     => $request->get_param('utmContent') ?: '-',
            'pageUrl'        => $request->get_param('pageUrl') ?: '-',
            'timestamp'      => $request->get_param('timestamp') ?: current_time('c'),
        ];

        // Obtener email de destino
        $toEmail = self::getDestinationEmail();

        // Construir y enviar email
        $emailSent = self::sendEmail($toEmail, $formData);

        if ($emailSent) {
            // Log opcional para debugging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[ContactForm] Email enviado a: ' . $toEmail . ' desde: ' . $formData['email']);
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Mensaje enviado correctamente. Te responderemos pronto.',
            ], 200);
        }

        // Error al enviar
        return new \WP_REST_Response([
            'success' => false,
            'message' => 'Hubo un error al enviar el mensaje. Por favor, intentalo de nuevo o contactanos por WhatsApp.',
        ], 500);
    }

    /**
     * Obtener email de destino desde Theme Options o fallback a admin
     */
    private static function getDestinationEmail(): string
    {
        // Intentar obtener de glory_site_email
        if (class_exists('Glory\Manager\OpcionManager')) {
            $configuredEmail = OpcionManager::get('glory_site_email', '');
            if (!empty($configuredEmail) && is_email($configuredEmail)) {
                return $configuredEmail;
            }
        }

        // Fallback: email del administrador de WordPress
        return get_option('admin_email');
    }

    /**
     * Enviar email con los datos del formulario
     */
    private static function sendEmail(string $toEmail, array $formData): bool
    {
        $siteName = get_bloginfo('name');

        // Subject
        $subject = "[{$siteName}] Nuevo mensaje de contacto - {$formData['nombre']}";

        // Construir cuerpo del email en HTML
        $message = self::buildEmailBody($formData, $siteName);

        // Headers
        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $siteName . ' <' . get_option('admin_email') . '>',
            'Reply-To: ' . $formData['nombre'] . ' <' . $formData['email'] . '>',
        ];

        // Enviar usando wp_mail
        return wp_mail($toEmail, $subject, $message, $headers);
    }

    /**
     * Construir cuerpo del email en HTML
     */
    private static function buildEmailBody(array $data, string $siteName): string
    {
        $timestamp = $data['timestamp'];
        if ($timestamp !== '-' && strtotime($timestamp)) {
            $timestamp = wp_date('d/m/Y H:i', strtotime($timestamp));
        } else {
            $timestamp = wp_date('d/m/Y H:i');
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f5f5f5;">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Nuevo Mensaje de Contacto</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">{$siteName}</p>
    </div>

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #2563eb; margin-top: 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Datos del Contacto
        </h2>

        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #4b5563; width: 140px;">Nombre:</td>
                <td style="padding: 8px 0;">{$data['nombre']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:{$data['email']}" style="color: #2563eb;">{$data['email']}</a></td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Telefono:</td>
                <td style="padding: 8px 0;">{$data['telefono']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Empresa:</td>
                <td style="padding: 8px 0;">{$data['empresa']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Servicio:</td>
                <td style="padding: 8px 0;">{$data['servicio']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Canal preferido:</td>
                <td style="padding: 8px 0;">{$data['canalPreferido']}</td>
            </tr>
        </table>

        <h2 style="color: #2563eb; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 24px;">
            Mensaje
        </h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6;">
{$data['mensaje']}
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p style="margin: 4px 0;"><strong>Fecha/Hora:</strong> {$timestamp}</p>
            <p style="margin: 4px 0;"><strong>Pagina:</strong> {$data['pageUrl']}</p>
            <p style="margin: 4px 0;"><strong>UTM:</strong> source={$data['utmSource']} | medium={$data['utmMedium']} | campaign={$data['utmCampaign']}</p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
            <a href="mailto:{$data['email']}?subject=Re: Tu consulta en {$siteName}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Responder a {$data['nombre']}
            </a>
        </div>
    </div>

    <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
        Este email fue generado automaticamente desde el formulario de contacto de {$siteName}.
    </p>
</body>
</html>
HTML;
    }

    /**
     * Convertir valor de servicio a etiqueta legible
     */
    private static function getServicioLabel(?string $value): string
    {
        $labels = [
            'chatbot-whatsapp'   => 'Chatbot WhatsApp',
            'chatbot-instagram'  => 'Chatbot Instagram',
            'chatbot-web'        => 'Chatbot Web',
            'voicebot'           => 'Voicebot (llamadas)',
            'automatizacion'     => 'Automatizacion de tareas',
            'integraciones'      => 'Integraciones CRM/Software',
            'otro'               => 'Otro / No estoy seguro',
        ];

        return $labels[$value] ?? ($value ?: 'No especificado');
    }

    /**
     * Convertir valor de canal a etiqueta legible
     */
    private static function getCanalLabel(?string $value): string
    {
        $labels = [
            'whatsapp'   => 'WhatsApp',
            'email'      => 'Email',
            'telefono'   => 'Llamada telefonica',
            'cualquiera' => 'Cualquiera',
        ];

        return $labels[$value] ?? ($value ?: 'No especificado');
    }
}
