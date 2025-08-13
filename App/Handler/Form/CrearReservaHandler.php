<?php

namespace App\Handler\Form;

use Glory\Core\GloryLogger;
use Glory\Handler\Form\FormHandlerInterface;
use Glory\Services\NotificationService;
use Glory\Services\EventBus;

class CrearReservaHandler implements FormHandlerInterface
{
    public function procesar(array $postDatos, array $archivos): array
    {
        $nombreCliente = sanitize_text_field($postDatos['nombre_cliente'] ?? '');
        $telefonoCliente = sanitize_text_field($postDatos['telefono_cliente'] ?? '');
        $correoCliente = sanitize_email($postDatos['correo_cliente'] ?? '');
        $servicioId = absint($postDatos['servicio_id'] ?? 0);
        $barberoId = absint($postDatos['barbero_id'] ?? 0);
        $fechaReserva = sanitize_text_field($postDatos['fecha_reserva'] ?? '');
        $horaReserva = sanitize_text_field($postDatos['hora_reserva'] ?? '');
        $exclusividad = isset($postDatos['exclusividad']) && $postDatos['exclusividad'] === '1' ? '1' : '0';

        if (empty($nombreCliente) || empty($telefonoCliente) || !is_email($correoCliente) || empty($servicioId) || empty($barberoId) || empty($fechaReserva) || empty($horaReserva)) {
            throw new \Exception('Por favor, completa todos los campos obligatorios.');
        }

        $servicio = get_term($servicioId, 'servicio');
        if (is_wp_error($servicio) || !$servicio) {
            throw new \Exception('El servicio seleccionado no es válido.');
        }
        $duracion = get_term_meta($servicio->term_id, 'duracion', true) ?: 30;

        $disponible = $this->verificarDisponibilidadServidor($fechaReserva, $barberoId, $servicioId, $horaReserva, $duracion);
        if (!$disponible) {
            throw new \Exception('El horario seleccionado ya no está disponible. Por favor, elige otro.');
        }

        $datosPost = [
            'post_title'    => $nombreCliente,
            'post_status'   => 'publish',
            'post_type'     => 'reserva',
            'post_author'   => 1,
        ];
        $postId = wp_insert_post($datosPost);

        if (is_wp_error($postId) || $postId === 0) {
            throw new \Exception('Ocurrió un error al guardar la reserva. Inténtalo de nuevo.');
        }

        update_post_meta($postId, 'telefono_cliente', $telefonoCliente);
        update_post_meta($postId, 'correo_cliente', $correoCliente);
        update_post_meta($postId, 'fecha_reserva', $fechaReserva);
        update_post_meta($postId, 'hora_reserva', $horaReserva);
        update_post_meta($postId, 'exclusividad', $exclusividad);

        wp_set_object_terms($postId, $servicioId, 'servicio', false);
        wp_set_object_terms($postId, $barberoId, 'barbero', false);

        // Enviar notificaciones
        NotificationService::notificarNuevaReservaCliente($postId);
        NotificationService::notificarNuevaReservaAdmin($postId);

        GloryLogger::info('Reserva creada exitosamente desde el formulario público.', ['post_id' => $postId]);

        // Emitir evento realtime para reservas
        EventBus::emit('post_reserva', ['accion' => 'crear', 'postId' => $postId]);

        return ['alert' => '¡Tu reserva ha sido confirmada con éxito!'];
    }

    private function verificarDisponibilidadServidor($fecha, $barberoId, $servicioId, $hora, $duracion): bool
    {
        $horariosDisponibles = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion);
        return in_array($hora, $horariosDisponibles, true);
    }
}