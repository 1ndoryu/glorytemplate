<?php

/**
 * ServicioNotificaciones — Creacion centralizada de notificaciones.
 *
 * Punto unico para generar notificaciones con excluision de auto-notificaciones,
 * campos actor_id, titulo, mensaje y datos JSONB normalizados.
 *
 * C266: sistema completo de notificaciones.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\PostgresService;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\UsuariosExtCols;

class ServicioNotificaciones
{
    /**
     * Crear una notificacion.
     * Si $actorId === $destinatarioId, no se crea (excluye auto-notificaciones).
     *
     * @param int    $destinatarioId  usuario_id que recibe la notificacion
     * @param string $tipo            tipo de notificacion (like, follow, comentario, etc.)
     * @param string $mensaje         texto descriptivo para mostrar en la UI
     * @param array  $datos           datos JSONB extra (sample_id, slug, etc.)
     * @param int|null $actorId       usuario que genera la accion (se excluye si === destinatario)
     * @param string $titulo          titulo opcional
     * @param string|null $enlace     enlace opcional para navegar al hacer click
     */
    public static function crear(
        int $destinatarioId,
        string $tipo,
        string $mensaje,
        array $datos = [],
        ?int $actorId = null,
        string $titulo = '',
        ?string $enlace = null
    ): void {
        /* Excluir auto-notificaciones */
        if ($actorId !== null && $actorId === $destinatarioId) {
            return;
        }

        try {
            PostgresService::ejecutar(
                "INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos, actor_id, enlace)
                 VALUES (:userId, :tipo, :titulo, :mensaje, :datos::jsonb, :actorId, :enlace)",
                [
                    'userId'  => $destinatarioId,
                    'tipo'    => $tipo,
                    'titulo'  => $titulo,
                    'mensaje' => $mensaje,
                    'datos'   => json_encode($datos),
                    'actorId' => $actorId,
                    'enlace'  => $enlace,
                ]
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioNotificaciones: error creando notificacion', [
                'destinatarioId' => $destinatarioId,
                'tipo'           => $tipo,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    /* Helpers de tipos comunes */

    public static function likeSample(int $destinatarioId, int $actorId, int $sampleId, string $sampleTitulo, ?string $sampleSlug = null, string $reaccion = 'like'): void
    {
        $actorNombre = self::obtenerNombreActor($actorId);
        $tipoNotif = $reaccion === 'encanta' ? 'encanta' : 'like';
        $emoji = $reaccion === 'encanta' ? 'le encanta' : 'le gusta';

        self::crear(
            $destinatarioId,
            $tipoNotif,
            "@{$actorNombre} {$emoji} tu sample \"{$sampleTitulo}\"",
            [
                'liker_id'    => $actorId,
                'sample_id'   => $sampleId,
                'sampleSlug'  => $sampleSlug,
                'sampleTitulo' => $sampleTitulo,
                'reaccion'    => $reaccion,
            ],
            $actorId,
            '',
            $sampleSlug ? "/sample/{$sampleSlug}/" : null
        );
    }

    public static function likePublicacion(int $destinatarioId, int $actorId, int $publicacionId, string $reaccion = 'like'): void
    {
        $actorNombre = self::obtenerNombreActor($actorId);
        $emoji = $reaccion === 'encanta' ? 'le encanta' : 'le gusta';

        self::crear(
            $destinatarioId,
            'like',
            "@{$actorNombre} {$emoji} tu publicacion",
            [
                'liker_id'      => $actorId,
                'publicacion_id' => $publicacionId,
                'reaccion'      => $reaccion,
            ],
            $actorId,
            '',
            "/post/{$publicacionId}/"
        );
    }

    public static function likeComentario(int $destinatarioId, int $actorId, int $comentarioId): void
    {
        $actorNombre = self::obtenerNombreActor($actorId);

        self::crear(
            $destinatarioId,
            'like',
            "@{$actorNombre} le gusta tu comentario",
            [
                'liker_id'     => $actorId,
                'comentario_id' => $comentarioId,
            ],
            $actorId
        );
    }

    public static function nuevoComentario(int $destinatarioId, int $actorId, int $sampleId, string $sampleTitulo, ?string $sampleSlug = null): void
    {
        $actorNombre = self::obtenerNombreActor($actorId);

        self::crear(
            $destinatarioId,
            'comentario',
            "@{$actorNombre} comento en tu sample \"{$sampleTitulo}\"",
            [
                'commenter_id' => $actorId,
                'sample_id'    => $sampleId,
                'sampleSlug'   => $sampleSlug,
                'sampleTitulo' => $sampleTitulo,
            ],
            $actorId,
            '',
            $sampleSlug ? "/sample/{$sampleSlug}/" : null
        );
    }

    public static function respuestaComentario(int $destinatarioId, int $actorId, int $comentarioPadreId, ?int $sampleId = null, ?string $sampleSlug = null): void
    {
        $actorNombre = self::obtenerNombreActor($actorId);

        self::crear(
            $destinatarioId,
            'comentario',
            "@{$actorNombre} respondio a tu comentario",
            [
                'replier_id'        => $actorId,
                'comentario_padre_id' => $comentarioPadreId,
                'sample_id'         => $sampleId,
                'sampleSlug'        => $sampleSlug,
            ],
            $actorId,
            '',
            $sampleSlug ? "/sample/{$sampleSlug}/" : null
        );
    }

    public static function follow(int $destinatarioId, int $seguidorId): void
    {
        $actorNombre = self::obtenerNombreActor($seguidorId);

        self::crear(
            $destinatarioId,
            'follow',
            "@{$actorNombre} te ha seguido",
            ['seguidor_id' => $seguidorId],
            $seguidorId,
            '',
            null
        );
    }

    public static function sampleVerificado(int $destinatarioId, int $sampleId, string $sampleTitulo, ?string $sampleSlug = null): void
    {
        self::crear(
            $destinatarioId,
            'sistema',
            "Tu sample \"{$sampleTitulo}\" ha sido verificado",
            [
                'sample_id'    => $sampleId,
                'sampleSlug'   => $sampleSlug,
                'sampleTitulo' => $sampleTitulo,
            ],
            null,
            'Sample verificado',
            $sampleSlug ? "/sample/{$sampleSlug}/" : null
        );
    }

    public static function publicacionEliminada(int $destinatarioId, int $publicacionId, string $razon = ''): void
    {
        self::crear(
            $destinatarioId,
            'moderacion',
            "Tu publicacion ha sido eliminada" . ($razon ? ": {$razon}" : ''),
            [
                'publicacion_id' => $publicacionId,
                'razon'          => $razon,
            ],
            null,
            'Contenido eliminado'
        );
    }

    public static function pagoExitoso(int $destinatarioId, string $plan, string $detalle = ''): void
    {
        self::crear(
            $destinatarioId,
            'pago',
            "Pago procesado exitosamente. Plan: {$plan}" . ($detalle ? " ({$detalle})" : ''),
            [
                'plan'    => $plan,
                'detalle' => $detalle,
            ],
            null,
            'Pago exitoso'
        );
    }

    public static function ascensoPlan(int $destinatarioId, string $planAnterior, string $planNuevo): void
    {
        self::crear(
            $destinatarioId,
            'pago',
            "Has ascendido a {$planNuevo}. Disfruta los nuevos beneficios.",
            [
                'planAnterior' => $planAnterior,
                'planNuevo'    => $planNuevo,
            ],
            null,
            "Ascenso a {$planNuevo}"
        );
    }

    public static function sampleEnModeracion(int $destinatarioId, int $sampleId, string $sampleTitulo): void
    {
        self::crear(
            $destinatarioId,
            'moderacion',
            "Tu sample \"{$sampleTitulo}\" esta siendo revisado por el equipo de moderacion",
            [
                'sample_id'    => $sampleId,
                'sampleTitulo' => $sampleTitulo,
            ],
            null,
            'Contenido en revision'
        );
    }

    /**
     * Obtener username para mensajes legibles.
     */
    private static function obtenerNombreActor(int $actorId): string
    {
        try {
            $row = PostgresService::consultarUno(
                "SELECT username FROM usuarios_ext WHERE id = :id",
                ['id' => $actorId]
            );
            return $row[UsuariosExtCols::USERNAME] ?? 'usuario';
        } catch (\Throwable $e) {
            return 'usuario';
        }
    }
}
