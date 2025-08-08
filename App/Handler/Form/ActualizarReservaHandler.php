<?php

namespace App\Handler\Form;

use Glory\Handler\Form\FormHandlerInterface;
// use Glory\Services\NotificationService;

class ActualizarReservaHandler implements FormHandlerInterface
{
    public function procesar(array $postDatos, array $archivos): array
    {
        $postId = absint($postDatos['objectId'] ?? 0);
        if (!$postId) {
            throw new \Exception('ID de reserva inválido.');
        }

        $post = get_post($postId);
        if (!$post || $post->post_type !== 'reserva') {
            throw new \Exception('Reserva no encontrada.');
        }

        $nombreCliente = sanitize_text_field($postDatos['nombre_cliente'] ?? '');
        $telefonoCliente = sanitize_text_field($postDatos['telefono_cliente'] ?? '');
        $correoCliente = sanitize_email($postDatos['correo_cliente'] ?? '');
        $servicioId = absint($postDatos['servicio_id'] ?? 0);
        $barberoId = absint($postDatos['barbero_id'] ?? 0);
        $fechaReserva = sanitize_text_field($postDatos['fecha_reserva'] ?? '');
        $horaReserva = sanitize_text_field($postDatos['hora_reserva'] ?? '');

        if (empty($nombreCliente) || empty($telefonoCliente) || !is_email($correoCliente) || empty($servicioId) || empty($barberoId) || empty($fechaReserva) || empty($horaReserva)) {
            throw new \Exception('Por favor, completa todos los campos obligatorios.');
        }

        // Actualizar título y metadatos
        wp_update_post([
            'ID' => $postId,
            'post_title' => $nombreCliente,
        ]);

        update_post_meta($postId, 'telefono_cliente', $telefonoCliente);
        update_post_meta($postId, 'correo_cliente', $correoCliente);
        update_post_meta($postId, 'fecha_reserva', $fechaReserva);
        update_post_meta($postId, 'hora_reserva', $horaReserva);

        // Taxonomías
        wp_set_object_terms($postId, $servicioId, 'servicio', false);
        wp_set_object_terms($postId, $barberoId, 'barbero', false);

        // Notificación opcional si existe el servicio (desactivado por defecto)

        return ['alert' => 'Reserva actualizada correctamente.'];
    }
}


