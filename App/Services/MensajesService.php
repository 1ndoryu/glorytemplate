<?php

/**
 * Servicio de Mensajes
 *
 * Proporciona una interfaz de alto nivel para el sistema de timeline.
 * Incluye metodos para generar mensajes de sistema automaticamente.
 *
 * @package App\Services
 */

namespace App\Services;

use App\Repository\MensajesRepository;

class MensajesService
{
    /**
     * Descripciones legibles para acciones del sistema
     */
    private const DESCRIPCIONES_ACCIONES = [
        'creado' => 'creo este elemento',
        'editado' => 'edito',
        'completado' => 'marco como completado',
        'reabierto' => 'reabrio el elemento',
        'asignado' => 'asigno a',
        'desasignado' => 'quito la asignacion de',
        'adjunto_agregado' => 'agrego un adjunto',
        'adjunto_eliminado' => 'elimino un adjunto',
        'prioridad' => 'cambio la prioridad a',
        'urgencia' => 'cambio la urgencia a',
        'fecha_limite' => 'cambio la fecha limite',
        'participante_agregado' => 'agrego a',
        'participante_removido' => 'removio a',
        'compartido' => 'compartio el elemento',
        'descripcion' => 'modifico la descripcion',
        'nombre' => 'cambio el nombre a'
    ];

    /**
     * Registra un evento generico en el timeline
     */
    public static function registrarEvento(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        string $accion,
        ?string $detalle = null,
        ?array $datosExtra = null
    ): bool {
        $usuario = get_userdata($usuarioId);
        $nombreUsuario = $usuario ? $usuario->display_name : 'Usuario';

        $descripcionAccion = self::DESCRIPCIONES_ACCIONES[$accion] ?? $accion;

        $contenido = $detalle
            ? "{$nombreUsuario} {$descripcionAccion}: {$detalle}"
            : "{$nombreUsuario} {$descripcionAccion}";

        return MensajesRepository::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            $accion,
            $contenido,
            $datosExtra
        );
    }

    /**
     * Registra la creacion de un elemento
     */
    public static function registrarCreacion(string $tipoElemento, int $elementoId, int $usuarioId): bool
    {
        return self::registrarEvento($tipoElemento, $elementoId, $usuarioId, 'creado');
    }

    /**
     * Registra que se completo una tarea/habito
     */
    public static function registrarCompletado(string $tipoElemento, int $elementoId, int $usuarioId): bool
    {
        return self::registrarEvento($tipoElemento, $elementoId, $usuarioId, 'completado');
    }

    /**
     * Registra que se reabrio una tarea/habito
     */
    public static function registrarReabierto(string $tipoElemento, int $elementoId, int $usuarioId): bool
    {
        return self::registrarEvento($tipoElemento, $elementoId, $usuarioId, 'reabierto');
    }

    /**
     * Registra cambio de prioridad
     */
    public static function registrarCambioPrioridad(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        string $nuevaPrioridad
    ): bool {
        $prioridadesLegibles = [
            'alta' => 'Alta',
            'media' => 'Media',
            'baja' => 'Baja'
        ];
        $prioridadLegible = $prioridadesLegibles[$nuevaPrioridad] ?? $nuevaPrioridad;

        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'prioridad',
            $prioridadLegible
        );
    }

    /**
     * Registra cambio de urgencia
     */
    public static function registrarCambioUrgencia(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        string $nuevaUrgencia
    ): bool {
        $urgenciasLegibles = [
            'bloqueante' => 'Bloqueante',
            'urgente' => 'Urgente',
            'normal' => 'Normal',
            'chill' => 'Sin prisa'
        ];
        $urgenciaLegible = $urgenciasLegibles[$nuevaUrgencia] ?? $nuevaUrgencia;

        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'urgencia',
            $urgenciaLegible
        );
    }

    /**
     * Registra cambio de nombre
     */
    public static function registrarCambioNombre(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        string $nuevoNombre
    ): bool {
        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'nombre',
            $nuevoNombre
        );
    }

    /**
     * Registra cambio de fecha limite
     */
    public static function registrarCambioFechaLimite(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        ?string $nuevaFecha
    ): bool {
        $detalle = $nuevaFecha
            ? date_i18n('d M Y', strtotime($nuevaFecha))
            : 'sin fecha';

        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'fecha_limite',
            $detalle
        );
    }

    /**
     * Registra que se agrego un adjunto
     */
    public static function registrarAdjuntoAgregado(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        string $nombreArchivo
    ): bool {
        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'adjunto_agregado',
            $nombreArchivo
        );
    }

    /**
     * Registra que se elimino un adjunto
     */
    public static function registrarAdjuntoEliminado(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        string $nombreArchivo
    ): bool {
        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'adjunto_eliminado',
            $nombreArchivo
        );
    }

    /**
     * Registra que se asigno a un usuario
     */
    public static function registrarAsignacion(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        int $asignadoId
    ): bool {
        $asignado = get_userdata($asignadoId);
        $nombreAsignado = $asignado ? $asignado->display_name : 'Usuario';

        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'asignado',
            $nombreAsignado
        );
    }

    /**
     * Registra que se agrego un participante
     */
    public static function registrarParticipanteAgregado(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        int $participanteId
    ): bool {
        $participante = get_userdata($participanteId);
        $nombreParticipante = $participante ? $participante->display_name : 'Usuario';

        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'participante_agregado',
            $nombreParticipante
        );
    }

    /**
     * Registra que se removio un participante
     */
    public static function registrarParticipanteRemovido(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        int $participanteId
    ): bool {
        $participante = get_userdata($participanteId);
        $nombreParticipante = $participante ? $participante->display_name : 'Usuario';

        return self::registrarEvento(
            $tipoElemento,
            $elementoId,
            $usuarioId,
            'participante_removido',
            $nombreParticipante
        );
    }
}
