<?php

/**
 * SmtpService - Configura WordPress para usar SMTP externo
 *
 * Configura PHPMailer para enviar correos via SMTP en lugar de usar
 * la función mail() de PHP que no funciona en servidores sin servidor de correo.
 *
 * Configuración requerida en opciones de WordPress:
 * - glory_smtp_enabled: Activar/desactivar SMTP
 * - glory_smtp_host: Servidor SMTP (ej: smtp-relay.brevo.com)
 * - glory_smtp_port: Puerto (587 para TLS, 465 para SSL)
 * - glory_smtp_user: Usuario SMTP
 * - glory_smtp_password: Contraseña SMTP
 * - glory_smtp_from_email: Email remitente
 * - glory_smtp_from_name: Nombre remitente
 *
 * @package App\Services
 */

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;

class SmtpService
{
    /**
     * Registrar el hook de configuración SMTP
     */
    public static function register(): void
    {
        add_action('phpmailer_init', [self::class, 'configureSmtp'], 10, 1);
        add_action('rest_api_init', [self::class, 'registerEndpoints']);
    }

    /**
     * Registrar endpoints REST
     */
    public static function registerEndpoints(): void
    {
        register_rest_route('glory/v1', '/smtp/test', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'handleTestEmail'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);
    }

    /**
     * Manejar petición de email de prueba
     */
    public static function handleTestEmail(\WP_REST_Request $request): \WP_REST_Response
    {
        $email = $request->get_param('email');

        if (empty($email) || !is_email($email)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Email invalido',
            ], 400);
        }

        $result = self::sendTestEmail($email);

        return new \WP_REST_Response($result, $result['success'] ? 200 : 500);
    }

    /**
     * Configurar PHPMailer con las credenciales SMTP
     * 
     * Nota: Usamos get_option() directamente porque las opciones SMTP
     * se guardan como opciones de WordPress estándar, no pasan por OpcionRegistry.
     */
    public static function configureSmtp(PHPMailer $phpmailer): void
    {
        $smtpEnabled = get_option('glory_smtp_enabled', false);

        if (!$smtpEnabled) {
            return;
        }

        $host = get_option('glory_smtp_host', '');
        $port = get_option('glory_smtp_port', 587);
        $user = get_option('glory_smtp_user', '');
        $password = get_option('glory_smtp_password', '');
        $fromEmail = get_option('glory_smtp_from_email', '');
        $fromName = get_option('glory_smtp_from_name', get_bloginfo('name'));

        if (empty($host) || empty($user) || empty($password)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[SmtpService] SMTP habilitado pero faltan credenciales');
            }
            return;
        }

        $phpmailer->isSMTP();
        $phpmailer->Host = $host;
        $phpmailer->Port = (int) $port;
        $phpmailer->SMTPAuth = true;
        $phpmailer->Username = $user;
        $phpmailer->Password = $password;
        $phpmailer->SMTPSecure = ($port == 465) ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;

        if (!empty($fromEmail)) {
            $phpmailer->setFrom($fromEmail, $fromName);
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[SmtpService] SMTP configurado: ' . $host . ':' . $port);
        }
    }

    /**
     * Obtener la configuración actual de SMTP (para debug)
     */
    public static function getConfig(): array
    {
        return [
            'enabled' => get_option('glory_smtp_enabled', false),
            'host' => get_option('glory_smtp_host', ''),
            'port' => get_option('glory_smtp_port', 587),
            'user' => get_option('glory_smtp_user', ''),
            'password' => !empty(get_option('glory_smtp_password', '')) ? '***' : '',
            'from_email' => get_option('glory_smtp_from_email', ''),
            'from_name' => get_option('glory_smtp_from_name', ''),
        ];
    }

    /**
     * Enviar email de prueba
     */
    public static function sendTestEmail(string $toEmail): array
    {
        $subject = '[Test SMTP] Correo de prueba desde ' . get_bloginfo('name');
        $message = self::buildTestEmailBody();

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
        ];

        $sent = wp_mail($toEmail, $subject, $message, $headers);

        return [
            'success' => $sent,
            'message' => $sent
                ? 'Email de prueba enviado correctamente a ' . $toEmail
                : 'Error al enviar el email. Revisa las credenciales SMTP.',
            'config' => self::getConfig(),
        ];
    }

    /**
     * Construir cuerpo del email de prueba
     */
    private static function buildTestEmailBody(): string
    {
        $siteName = get_bloginfo('name');
        $timestamp = wp_date('d/m/Y H:i:s');

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #0B93F6 0%, #0866FF 100%); color: white; padding: 30px; border-radius: 12px; text-align: center;">
        <h1 style="margin: 0;">SMTP Configurado Correctamente</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">{$siteName}</p>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
        <p>Este es un correo de prueba para confirmar que la configuración SMTP funciona correctamente.</p>
        <p><strong>Fecha/Hora:</strong> {$timestamp}</p>
        <p style="color: #10b981; font-weight: 600;">Los formularios de contacto ahora enviarán emails correctamente.</p>
    </div>
</body>
</html>
HTML;
    }
}
