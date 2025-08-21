<?php

namespace App\Handler\Form;

use Glory\Handler\Form\FormHandlerInterface;
use Glory\Services\EventBus;
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
        $exclusividad = isset($postDatos['exclusividad']) ? (string) (absint($postDatos['exclusividad']) > 0 ? '1' : '0') : null;

        $validationErrors = [];
        if ($nombreCliente === '') {
            $validationErrors[] = 'El nombre del cliente es obligatorio.';
        }
        if ($telefonoCliente === '') {
            $validationErrors[] = 'El teléfono es obligatorio.';
        }
        if ($correoCliente === '') {
            $validationErrors[] = 'El correo es obligatorio.';
        } elseif (!is_email($correoCliente)) {
            $validationErrors[] = 'El correo no es válido.';
        }
        if (empty($servicioId)) {
            $validationErrors[] = 'Selecciona un servicio válido.';
        }
        if (empty($barberoId)) {
            $validationErrors[] = 'Selecciona un barbero válido.';
        }
        if ($fechaReserva === '') {
            $validationErrors[] = 'La fecha de la reserva es obligatoria.';
        }
        if ($horaReserva === '') {
            $validationErrors[] = 'La hora de la reserva es obligatoria.';
        }

        if (!empty($validationErrors)) {
            throw new \Exception(implode(' ', $validationErrors));
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
        if ($exclusividad !== null) {
            update_post_meta($postId, 'exclusividad', $exclusividad);
        }

        // Taxonomías
        wp_set_object_terms($postId, $servicioId, 'servicio', false);
        wp_set_object_terms($postId, $barberoId, 'barbero', false);

        // Emitir evento realtime para que el front se actualice
        EventBus::emit('post_reserva', ['accion' => 'actualizar', 'postId' => $postId]);

        return ['alert' => 'Reserva actualizada correctamente.'];
    }
}


