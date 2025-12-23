<?php

/**
 * Script directo para crear notificaciones (sin WP-CLI)
 * 
 * Uso desde la carpeta del tema:
 *   php cli/crear-notificacion.php <user_id> <tipo> "<titulo>" ["<contenido>"]
 * 
 * Ejemplos:
 *   php cli/crear-notificacion.php 1 solicitud_equipo "Juan quiere unirse a tu equipo"
 *   php cli/crear-notificacion.php 1 tarea_vence_hoy "Revisar código" "La tarea vence hoy"
 */

/* Cargar WordPress */
$wpLoadPath = dirname(__FILE__, 5) . '/wp-load.php';
if (!file_exists($wpLoadPath)) {
    die("Error: No se pudo encontrar wp-load.php en: {$wpLoadPath}\n");
}
require_once $wpLoadPath;

require_once get_template_directory() . '/App/Services/NotificacionesService.php';

use App\Services\NotificacionesService;

/* Obtener argumentos de CLI de forma segura */

$argv = $_SERVER['argv'] ?? $GLOBALS['argv'] ?? [];
$argc = count($argv);

if ($argc < 4) {
    echo "Uso: php crear-notificacion.php <user_id> <tipo> \"<titulo>\" [\"<contenido>\"]\n\n";
    echo "Tipos disponibles:\n";
    echo "  - solicitud_equipo\n";
    echo "  - solicitud_aceptada\n";
    echo "  - tarea_vence_hoy\n";
    echo "  - tarea_asignada\n";
    echo "  - tarea_removida\n";
    echo "  - adjunto_agregado\n";
    echo "  - mensaje_chat\n";
    echo "  - habito_companero\n\n";
    echo "Ejemplo:\n";
    echo "  php cli/crear-notificacion.php 1 solicitud_equipo \"Juan quiere conectarse\"\n";
    exit(1);
}

$userId = (int) $argv[1];
$tipo = $argv[2];
$titulo = $argv[3];
$contenido = $argv[4] ?? null;

$user = get_user_by('ID', $userId);
if (!$user) {
    die("Error: Usuario con ID {$userId} no encontrado\n");
}

$service = new NotificacionesService();
$resultado = $service->crear($userId, $tipo, $titulo, $contenido, [
    'cli_direct' => true,
    'timestamp' => current_time('mysql')
]);

if ($resultado['exito']) {
    echo "Notificación creada exitosamente!\n";
    echo "-------------------------------\n";
    echo "ID: {$resultado['notificacion']['id']}\n";
    echo "Usuario: {$user->display_name} ({$user->user_email})\n";
    echo "Tipo: {$tipo}\n";
    echo "Título: {$titulo}\n";
    if ($contenido) {
        echo "Contenido: {$contenido}\n";
    }
    echo "-------------------------------\n";
} else {
    echo "Error: {$resultado['mensaje']}\n";
    exit(1);
}
