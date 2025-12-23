<?php

/**
 * CLI para Notificaciones de Glory
 * 
 * Permite crear notificaciones desde la línea de comandos para testing.
 * 
 * Uso desde la carpeta del tema:
 *   wp eval-file App/Cli/notificaciones-cli.php create <user_id> <tipo> <titulo> [contenido]
 *   wp eval-file App/Cli/notificaciones-cli.php list <user_id>
 *   wp eval-file App/Cli/notificaciones-cli.php count <user_id>
 * 
 * Tipos disponibles:
 *   - solicitud_equipo
 *   - solicitud_aceptada
 *   - tarea_vence_hoy
 *   - tarea_asignada
 *   - tarea_removida
 *   - adjunto_agregado
 *   - mensaje_chat
 *   - habito_companero
 * 
 * Ejemplos:
 *   wp eval-file App/Cli/notificaciones-cli.php create 1 solicitud_equipo "Juan quiere unirse"
 *   wp eval-file App/Cli/notificaciones-cli.php create 1 tarea_vence_hoy "Tarea vence hoy" "La tarea X vence hoy"
 *   wp eval-file App/Cli/notificaciones-cli.php list 1
 *   wp eval-file App/Cli/notificaciones-cli.php count 1
 * 
 * @package App\Cli
 */

if (!defined('ABSPATH')) {
    echo "Error: Este script debe ejecutarse con WP-CLI\n";
    echo "Uso: wp eval-file App/Cli/notificaciones-cli.php <comando> <args>\n";
    exit(1);
}

require_once get_template_directory() . '/App/Services/NotificacionesService.php';

use App\Services\NotificacionesService;

$args = $GLOBALS['argv'] ?? [];
array_shift($args);
array_shift($args);

if (empty($args)) {
    mostrarAyuda();
    exit(0);
}

$comando = array_shift($args);

switch ($comando) {
    case 'create':
        crearNotificacion($args);
        break;
    case 'list':
        listarNotificaciones($args);
        break;
    case 'count':
        contarNoLeidas($args);
        break;
    case 'help':
    default:
        mostrarAyuda();
        break;
}

function crearNotificacion(array $args): void
{
    if (count($args) < 3) {
        echo "Error: Faltan argumentos\n";
        echo "Uso: wp eval-file App/Cli/notificaciones-cli.php create <user_id> <tipo> <titulo> [contenido]\n";
        exit(1);
    }

    $userId = (int) $args[0];
    $tipo = $args[1];
    $titulo = $args[2];
    $contenido = $args[3] ?? null;

    $user = get_user_by('ID', $userId);
    if (!$user) {
        echo "Error: Usuario con ID {$userId} no encontrado\n";
        exit(1);
    }

    $service = new NotificacionesService();
    $resultado = $service->crear($userId, $tipo, $titulo, $contenido, [
        'cli' => true,
        'timestamp' => current_time('mysql')
    ]);

    if ($resultado['exito']) {
        echo "Notificación creada exitosamente\n";
        echo "ID: {$resultado['notificacion']['id']}\n";
        echo "Usuario: {$user->display_name} ({$user->user_email})\n";
        echo "Tipo: {$tipo}\n";
        echo "Título: {$titulo}\n";
        if ($contenido) {
            echo "Contenido: {$contenido}\n";
        }
    } else {
        echo "Error: {$resultado['mensaje']}\n";
        if (isset($resultado['codigo'])) {
            echo "Código: {$resultado['codigo']}\n";
        }
        exit(1);
    }
}

function listarNotificaciones(array $args): void
{
    if (empty($args)) {
        echo "Error: Falta el ID de usuario\n";
        echo "Uso: wp eval-file App/Cli/notificaciones-cli.php list <user_id>\n";
        exit(1);
    }

    $userId = (int) $args[0];

    $user = get_user_by('ID', $userId);
    if (!$user) {
        echo "Error: Usuario con ID {$userId} no encontrado\n";
        exit(1);
    }

    $service = new NotificacionesService();
    $resultado = $service->listar($userId, 1, 20);

    echo "Notificaciones de {$user->display_name} ({$user->user_email})\n";
    echo str_repeat('-', 60) . "\n";

    if (empty($resultado['notificaciones'])) {
        echo "No hay notificaciones\n";
        return;
    }

    foreach ($resultado['notificaciones'] as $notif) {
        $estado = $notif['leida'] ? '[LEÍDA]' : '[NUEVA]';
        echo "{$estado} #{$notif['id']} - {$notif['tipo']}\n";
        echo "  Título: {$notif['titulo']}\n";
        if ($notif['contenido']) {
            echo "  Contenido: {$notif['contenido']}\n";
        }
        echo "  Fecha: {$notif['fechaCreacion']}\n";
        echo "\n";
    }

    echo str_repeat('-', 60) . "\n";
    echo "Total: {$resultado['total']} notificaciones\n";
}

function contarNoLeidas(array $args): void
{
    if (empty($args)) {
        echo "Error: Falta el ID de usuario\n";
        echo "Uso: wp eval-file App/Cli/notificaciones-cli.php count <user_id>\n";
        exit(1);
    }

    $userId = (int) $args[0];

    $user = get_user_by('ID', $userId);
    if (!$user) {
        echo "Error: Usuario con ID {$userId} no encontrado\n";
        exit(1);
    }

    $service = new NotificacionesService();
    $cantidad = $service->contarNoLeidas($userId);

    echo "Usuario: {$user->display_name} ({$user->user_email})\n";
    echo "Notificaciones no leídas: {$cantidad}\n";
}

function mostrarAyuda(): void
{
    echo <<<HELP
Glory Notificaciones CLI

Uso:
  wp eval-file App/Cli/notificaciones-cli.php <comando> [argumentos]

Comandos:
  create <user_id> <tipo> <titulo> [contenido]   Crear una notificación
  list <user_id>                                  Listar notificaciones de un usuario
  count <user_id>                                 Contar notificaciones no leídas
  help                                            Mostrar esta ayuda

Tipos de notificación disponibles:
  - solicitud_equipo      Nueva solicitud de compañero
  - solicitud_aceptada    Solicitud de equipo aceptada
  - tarea_vence_hoy       Tarea con fecha límite hoy
  - tarea_asignada        Te asignaron una tarea
  - tarea_removida        Te quitaron de una tarea
  - adjunto_agregado      Nuevo adjunto en tarea
  - mensaje_chat          Nuevo mensaje
  - habito_companero      Compañero cumplió hábito

Ejemplos:
  # Crear notificación de solicitud de equipo para usuario 1
  wp eval-file App/Cli/notificaciones-cli.php create 1 solicitud_equipo "Juan quiere unirse a tu equipo"

  # Crear notificación con contenido adicional
  wp eval-file App/Cli/notificaciones-cli.php create 1 tarea_vence_hoy "Revisar código" "La tarea 'Revisar código' vence hoy"

  # Listar notificaciones del usuario 1
  wp eval-file App/Cli/notificaciones-cli.php list 1

  # Contar notificaciones no leídas del usuario 1
  wp eval-file App/Cli/notificaciones-cli.php count 1

HELP;
}
