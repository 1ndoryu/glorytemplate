<?php

/**
 * AINotificationService - Servicio de notificaciones por email
 * 
 * Envia notificaciones por email cuando:
 * - Se genera contenido exitosamente
 * - Hay errores en la generacion
 * 
 * @package Glory\Services\ContentAI
 */

namespace App\Services\ContentAI;

class AINotificationService
{
    /**
     * Envia notificacion de exito
     * 
     * @param string $title Titulo del articulo generado
     * @param int $postId ID del post creado
     * @param array $metadata Datos adicionales (modelo, duracion, etc)
     */
    public static function notifySuccess(string $title, int $postId, array $metadata = []): bool
    {
        if (!self::shouldNotify('success')) {
            return false;
        }

        $email = self::getNotificationEmail();
        if (empty($email)) {
            return false;
        }

        $siteName = get_bloginfo('name');
        $subject = "[{$siteName}] Contenido IA generado: {$title}";

        $editUrl = admin_url("post.php?post={$postId}&action=edit");
        $previewUrl = get_permalink($postId);

        $model = $metadata['model'] ?? 'desconocido';
        $duration = isset($metadata['duration']) ? round($metadata['duration'], 2) . 's' : 'N/A';
        $sources = $metadata['sources'] ?? [];

        $message = self::buildSuccessEmailBody([
            'title' => $title,
            'postId' => $postId,
            'editUrl' => $editUrl,
            'previewUrl' => $previewUrl,
            'model' => $model,
            'duration' => $duration,
            'sources' => $sources,
            'siteName' => $siteName
        ]);

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $siteName . ' <' . get_option('admin_email') . '>'
        ];

        return wp_mail($email, $subject, $message, $headers);
    }

    /**
     * Envia notificacion de error
     * 
     * @param string $error Descripcion del error
     * @param array $context Contexto adicional (titulo intentado, modelo, etc)
     */
    public static function notifyError(string $error, array $context = []): bool
    {
        if (!self::shouldNotify('error')) {
            return false;
        }

        $email = self::getNotificationEmail();
        if (empty($email)) {
            return false;
        }

        $siteName = get_bloginfo('name');
        $subject = "[{$siteName}] Error en generacion de contenido IA";

        $message = self::buildErrorEmailBody([
            'error' => $error,
            'context' => $context,
            'siteName' => $siteName,
            'timestamp' => current_time('mysql')
        ]);

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $siteName . ' <' . get_option('admin_email') . '>'
        ];

        return wp_mail($email, $subject, $message, $headers);
    }

    /**
     * Verifica si se debe enviar notificacion
     */
    private static function shouldNotify(string $type): bool
    {
        $enabled = AIConfigManager::get('notification_enabled', false);
        if (!$enabled) {
            return false;
        }

        if ($type === 'success') {
            return (bool) AIConfigManager::get('notification_on_success', true);
        }

        if ($type === 'error') {
            return (bool) AIConfigManager::get('notification_on_error', true);
        }

        return false;
    }

    /**
     * Obtiene el email de notificacion configurado
     */
    private static function getNotificationEmail(): string
    {
        $email = AIConfigManager::get('notification_email', '');

        // Si no hay email configurado, usar el del administrador
        if (empty($email)) {
            $email = get_option('admin_email');
        }

        return is_email($email) ? $email : '';
    }

    /**
     * Construye el cuerpo del email de exito
     */
    private static function buildSuccessEmailBody(array $data): string
    {
        $sourcesHtml = '';
        if (!empty($data['sources'])) {
            $sourcesHtml = '<h3 style="margin: 20px 0 10px;">Fuentes utilizadas:</h3><ul style="margin: 0; padding-left: 20px;">';
            foreach ($data['sources'] as $source) {
                $title = esc_html($source['title'] ?? 'Sin titulo');
                $url = esc_url($source['url'] ?? '#');
                $sourcesHtml .= "<li><a href=\"{$url}\" style=\"color: #2563eb;\">{$title}</a></li>";
            }
            $sourcesHtml .= '</ul>';
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Contenido Generado</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Sistema de IA - {$data['siteName']}</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #166534; font-weight: 600;">
                Se ha generado un nuevo borrador exitosamente
            </p>
        </div>

        <h2 style="margin: 0 0 15px; color: #111827; font-size: 20px;">{$data['title']}</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Modelo:</td>
                <td style="padding: 8px 0; font-weight: 500;">{$data['model']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Duracion:</td>
                <td style="padding: 8px 0; font-weight: 500;">{$data['duration']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">ID del Post:</td>
                <td style="padding: 8px 0; font-weight: 500;">#{$data['postId']}</td>
            </tr>
        </table>

        {$sourcesHtml}

        <div style="margin-top: 25px; text-align: center;">
            <a href="{$data['editUrl']}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 10px;">
                Editar borrador
            </a>
            <a href="{$data['previewUrl']}" style="display: inline-block; background: #64748b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Vista previa
            </a>
        </div>
    </div>

    <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        Este email fue enviado automaticamente por el sistema de IA de {$data['siteName']}
    </p>
</body>
</html>
HTML;
    }

    /**
     * Construye el cuerpo del email de error
     */
    private static function buildErrorEmailBody(array $data): string
    {
        $contextHtml = '';
        if (!empty($data['context'])) {
            $contextHtml = '<h3 style="margin: 20px 0 10px;">Contexto:</h3><ul style="margin: 0; padding-left: 20px;">';
            foreach ($data['context'] as $key => $value) {
                $key = esc_html($key);
                $value = esc_html(is_array($value) ? json_encode($value) : $value);
                $contextHtml .= "<li><strong>{$key}:</strong> {$value}</li>";
            }
            $contextHtml .= '</ul>';
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Error de Generacion</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Sistema de IA - {$data['siteName']}</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">
                Ha ocurrido un error durante la generacion de contenido
            </p>
        </div>

        <div style="background: #fee2e2; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-family: monospace; font-size: 14px; color: #991b1b; word-break: break-all;">
                {$data['error']}
            </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Fecha:</td>
                <td style="padding: 8px 0; font-weight: 500;">{$data['timestamp']}</td>
            </tr>
        </table>

        {$contextHtml}

        <div style="margin-top: 25px; text-align: center;">
            <a href="{admin_url('admin.php?page=panel-ia')}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Ir al Panel de IA
            </a>
        </div>
    </div>

    <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        Este email fue enviado automaticamente por el sistema de IA de {$data['siteName']}
    </p>
</body>
</html>
HTML;
    }
}
