<?php

namespace App\Handler\Form;

use Glory\Core\GloryLogger;
use Glory\Handler\Form\FormHandlerInterface;
use Glory\Services\EventBus;
use function notificarNuevaReservaCliente;
use function notificarNuevaReservaAdmin;

class CrearReservaHandler implements FormHandlerInterface
{
    public function procesar(array $postDatos, array $archivos): array
    {
        $nombreCliente = sanitize_text_field($postDatos['nombre_cliente'] ?? '');
        $telefonoCliente = sanitize_text_field($postDatos['telefono_cliente'] ?? '');
        $correoCliente = sanitize_email($postDatos['correo_cliente'] ?? '');
        $servicioId = absint($postDatos['servicio_id'] ?? 0);
        $barberoRaw = sanitize_text_field($postDatos['barbero_id'] ?? '');
        $barberoId = is_numeric($barberoRaw) ? absint($barberoRaw) : 0;
        $fechaReserva = sanitize_text_field($postDatos['fecha_reserva'] ?? '');
        $horaReserva = sanitize_text_field($postDatos['hora_reserva'] ?? '');
        // Permitir que el formulario admin/crear envie explicitamente exclusividad; si no viene, conservar la derivación automática
        $exclusividad = isset($postDatos['exclusividad']) ? (string) (absint($postDatos['exclusividad']) > 0 ? '1' : '0') : (($barberoRaw !== 'any' && $barberoId > 0) ? '1' : '0');

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
        // En creación se acepta el valor string 'any' para indicar "cualquier barbero".
        if ($barberoRaw === '') {
            $validationErrors[] = 'Selecciona un barbero o indica "any" para cualquiera.';
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

        $servicio = get_term($servicioId, 'servicio');
        if (is_wp_error($servicio) || !$servicio) {
            throw new \Exception('El servicio seleccionado no es válido.');
        }
        $duracion = get_term_meta($servicio->term_id, 'duracion', true) ?: 30;

        if ($barberoRaw === 'any') {
            $barberoId = $this->elegirBarberoAleatorioDisponible($fechaReserva, $servicioId, $horaReserva, $duracion);
            if (!$barberoId) {
                throw new \Exception('No hay barberos disponibles para ese horario y servicio.');
            }
        } else {
            // Verificar usando la zona horaria configurada en WP para evitar aceptar reservas en fecha/hora pasada
            $tz = obtenerZonaHorariaWp();
            try {
                $fechaHoraReserva = new \DateTime($fechaReserva . ' ' . $horaReserva, $tz);
            } catch (Exception $e) {
                throw new \Exception('Formato de fecha/hora inválido.');
            }
            // Reusar la función de disponibilidad (que trabaja con strings de fecha/hora)
            $disponible = $this->verificarDisponibilidadServidor($fechaReserva, $barberoId, $servicioId, $horaReserva, $duracion);
            if (!$disponible) {
                throw new \Exception('El horario seleccionado ya no está disponible. Por favor, elige otro.');
            }
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
        notificarNuevaReservaCliente($postId);
        notificarNuevaReservaAdmin($postId);

        GloryLogger::info('Reserva creada exitosamente desde el formulario público.', ['post_id' => $postId]);

        // Emitir evento realtime para reservas
        EventBus::emit('post_reserva', ['accion' => 'crear', 'postId' => $postId]);

        return ['alert' => '¡Tu reserva ha sido confirmada con éxito!', 'post_id' => $postId];
    }

    private function verificarDisponibilidadServidor($fecha, $barberoId, $servicioId, $hora, $duracion): bool
    {
        $horariosDisponibles = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion);
        return in_array($hora, $horariosDisponibles, true);
    }

    private function elegirBarberoAleatorioDisponible($fecha, $servicioId, $hora, $duracion): int
    {
        // Obtener barberos que ofrecen el servicio
        $barberos = get_terms([
            'taxonomy' => 'barbero',
            'hide_empty' => false,
        ]);
        if (is_wp_error($barberos) || empty($barberos)) {
            return 0;
        }
        $candidatos = [];
        foreach ($barberos as $barbero) {
            // Omitir barberos dados de baja
            if (get_term_meta($barbero->term_id, 'inactivo', true) === '1') continue;
            $servicesIds = get_term_meta($barbero->term_id, 'servicios', true);
            if (!is_array($servicesIds)) $servicesIds = [];
            $servicesIds = array_map('intval', $servicesIds);
            if (in_array((int)$servicioId, $servicesIds, true)) {
                $candidatos[] = (int)$barbero->term_id;
            }
        }
        if (empty($candidatos)) {
            return 0;
        }
        // Filtrar por disponibilidad en la hora solicitada
        $disponibles = [];
        foreach ($candidatos as $barberoId) {
            $slots = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion);
            if (in_array($hora, $slots, true)) {
                $disponibles[] = $barberoId;
            }
        }
        if (empty($disponibles)) {
            return 0;
        }
        shuffle($disponibles);
        return (int) $disponibles[0];
    }
}