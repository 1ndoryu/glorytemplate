<?php

/**
 * ServicioEliminacionUsuario — Eliminacion en cascada de todo el contenido de un usuario.
 *
 * QL112: Cuando un usuario es eliminado (o su deadline sera_eliminado_en pasa),
 * se eliminan TODOS los registros asociados en orden de dependencia inversa
 * (FK internas primero, tablas principales despues).
 *
 * Orden de eliminacion:
 * 1. FCM tokens + Push subscriptions (dispositivos)
 * 2. Notificaciones
 * 3. Mensajes
 * 4. Conversaciones (donde es participante)
 * 5. Likes (emitidos por el usuario)
 * 6. Follows (ambas direcciones)
 * 7. Bloqueos (ambas direcciones)
 * 8. Comentarios
 * 9. Colecciones guardadas
 * 10. ColeccionSamples (items de colecciones del usuario)
 * 11. Colecciones
 * 12. Reproducciones
 * 13. Descargas
 * 14. Transacciones
 * 15. Reportes (como emisor)
 * 16. Sync + SyncChangelog
 * 17. AlgoritmoEstado
 * 18. Suscripciones
 * 19. Samples (con cascada individual: likes, coleccion_samples ajenos, reproducciones, descargas)
 * 20. Publicaciones (con cascada individual: likes, comentarios)
 * 21. DuplicadosPendientes
 * 22. UsuariosExt
 * 23. wp_delete_user() (WordPress core)
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\BaseRepository;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\ColeccionesGuardadasCols;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\FollowsCols;
use App\Config\Schema\_generated\BloqueoCols;
use App\Config\Schema\_generated\NotificacionesCols;
use App\Config\Schema\_generated\MensajesCols;
use App\Config\Schema\_generated\FcmTokensCols;
use App\Config\Schema\_generated\PushSubscriptionsCols;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\TransaccionesCols;
use App\Config\Schema\_generated\SyncChangelogCols;
use App\Config\Schema\_generated\AlgoritmoEstadoCols;
use App\Config\Schema\_generated\SuscripcionesCols;
use App\Config\Schema\_generated\DuplicadosPendientesCols;

class ServicioEliminacionUsuario
{
    private const CRON_HOOK = 'kamples_purgar_usuarios_eliminados';

    /**
     * Registrar cron diario para ejecutar eliminaciones pendientes.
     * Llamado desde KamplesInit::init().
     */
    public static function registrarCron(): void
    {
        add_action(self::CRON_HOOK, [self::class, 'procesarEliminacionesPendientes']);

        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), 'daily', self::CRON_HOOK);
        }
    }

    /**
     * Eliminar TODO el contenido de un usuario y su cuenta.
     *
     * @param int $usuarioId ID en usuarios_ext (PK interna, no wp_user_id)
     * @return bool true si se completo sin errores criticos
     */
    public static function eliminarConCascada(int $usuarioId): bool
    {
        $usuario = UsuariosExtRepository::buscarPorId($usuarioId);
        if (!$usuario) {
            KamplesLogger::warning('EliminacionUsuario: usuario no encontrado', ['id' => $usuarioId]);
            return false;
        }

        $wpUserId = (int) ($usuario[UsuariosExtCols::WP_USER_ID] ?? 0);
        $username = $usuario[UsuariosExtCols::USERNAME] ?? 'desconocido';

        KamplesLogger::info('EliminacionUsuario: Iniciando cascada', [
            'usuarioId' => $usuarioId,
            'wpUserId' => $wpUserId,
            'username' => $username,
        ]);

        $errores = 0;

        /* 1. Dispositivos: FCM tokens + Push subscriptions */
        $errores += self::eliminarTabla(FcmTokensCols::TABLA, FcmTokensCols::USUARIO_ID, $usuarioId, 'fcm_tokens');
        $errores += self::eliminarTabla(PushSubscriptionsCols::TABLA, PushSubscriptionsCols::USUARIO_ID, $usuarioId, 'push_subscriptions');

        /* 2. Notificaciones (emitidas Y recibidas) */
        $errores += self::eliminarTabla(NotificacionesCols::TABLA, NotificacionesCols::USUARIO_ID, $usuarioId, 'notificaciones');

        /* 3. Mensajes del usuario */
        $errores += self::eliminarTabla(MensajesCols::TABLA, MensajesCols::AUTOR_ID, $usuarioId, 'mensajes');

        /* 4. Likes emitidos */
        $errores += self::eliminarTabla(LikesCols::TABLA, LikesCols::USUARIO_ID, $usuarioId, 'likes');

        /* 5. Follows (ambas direcciones) */
        $errores += self::eliminarTabla(FollowsCols::TABLA, FollowsCols::SEGUIDOR_ID, $usuarioId, 'follows_seguidor');
        $errores += self::eliminarTabla(FollowsCols::TABLA, FollowsCols::SEGUIDO_ID, $usuarioId, 'follows_seguido');

        /* 6. Bloqueos (ambas direcciones) */
        $errores += self::eliminarTabla(BloqueoCols::TABLA, BloqueoCols::BLOQUEADOR_ID, $usuarioId, 'bloqueos_emisor');
        $errores += self::eliminarTabla(BloqueoCols::TABLA, BloqueoCols::BLOQUEADO_ID, $usuarioId, 'bloqueos_receptor');

        /* 7. Comentarios del usuario */
        $errores += self::eliminarTabla(ComentariosCols::TABLA, ComentariosCols::AUTOR_ID, $usuarioId, 'comentarios');

        /* 8. Colecciones guardadas */
        $errores += self::eliminarTabla(ColeccionesGuardadasCols::TABLA, ColeccionesGuardadasCols::USUARIO_ID, $usuarioId, 'colecciones_guardadas');

        /* 9. Items de colecciones del usuario */
        $errores += self::eliminarTabla(ColeccionSamplesCols::TABLA, ColeccionSamplesCols::USUARIO_ID, $usuarioId, 'coleccion_samples');

        /* 10. Colecciones */
        $errores += self::eliminarTabla(ColeccionesCols::TABLA, ColeccionesCols::USUARIO_ID, $usuarioId, 'colecciones');

        /* 11. Reproducciones + Descargas */
        $errores += self::eliminarTabla(ReproduccionesCols::TABLA, ReproduccionesCols::USUARIO_ID, $usuarioId, 'reproducciones');
        $errores += self::eliminarTabla(DescargasCols::TABLA, DescargasCols::USUARIO_ID, $usuarioId, 'descargas');

        /* 12. Transacciones */
        $errores += self::eliminarTabla(TransaccionesCols::TABLA, TransaccionesCols::CREADOR_ID, $usuarioId, 'transacciones');

        /* 13. Sync + SyncChangelog */
        $errores += self::eliminarTabla(SyncChangelogCols::TABLA, SyncChangelogCols::USUARIO_ID, $usuarioId, 'sync_changelog');

        /* 14. AlgoritmoEstado */
        $errores += self::eliminarTabla(AlgoritmoEstadoCols::TABLA, AlgoritmoEstadoCols::USUARIO_ID, $usuarioId, 'algoritmo_estado');

        /* 15. Suscripciones */
        $errores += self::eliminarTabla(SuscripcionesCols::TABLA, SuscripcionesCols::USUARIO_ID, $usuarioId, 'suscripciones');

        /* 16. Samples — cascada individual (limpia likes, coleccion_samples de otros usuarios, repros, descargas) */
        $errores += self::eliminarSamplesDeUsuario($usuarioId);

        /* 17. Publicaciones — cascada individual (limpia likes, comentarios) */
        $errores += self::eliminarPublicacionesDeUsuario($usuarioId);

        /* 18. DuplicadosPendientes que referencian samples del usuario (ya borrados, solo cleanup) */
        try {
            $td = DuplicadosPendientesCols::TABLA;
            BaseRepository::ejecutar(
                "DELETE FROM {$td} WHERE " . DuplicadosPendientesCols::SAMPLE_ORIGINAL_ID . " NOT IN (SELECT " . SamplesCols::ID . " FROM " . SamplesCols::TABLA . ")"
                . " OR " . DuplicadosPendientesCols::SAMPLE_DUPLICADO_ID . " NOT IN (SELECT " . SamplesCols::ID . " FROM " . SamplesCols::TABLA . ")"
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('EliminacionUsuario: Error limpiando duplicados_pendientes huerfanos', ['error' => $e->getMessage()]);
            $errores++;
        }

        /* 19. UsuariosExt */
        $errores += self::eliminarTabla(UsuariosExtCols::TABLA, UsuariosExtCols::ID, $usuarioId, 'usuarios_ext');

        /* 20. WordPress core user */
        if ($wpUserId > 0 && function_exists('wp_delete_user')) {
            try {
                \wp_delete_user($wpUserId);
                KamplesLogger::info('EliminacionUsuario: wp_delete_user completado', ['wpUserId' => $wpUserId]);
            } catch (\Throwable $e) {
                KamplesLogger::error('EliminacionUsuario: Error en wp_delete_user', [
                    'wpUserId' => $wpUserId, 'error' => $e->getMessage(),
                ]);
                $errores++;
            }
        }

        KamplesLogger::info('EliminacionUsuario: Cascada completada', [
            'usuarioId' => $usuarioId,
            'username' => $username,
            'errores' => $errores,
        ]);

        return $errores === 0;
    }

    /**
     * Procesar usuarios cuyo deadline de eliminacion ya paso.
     * Diseñado para ejecutarse desde un cron job.
     *
     * @return int Numero de usuarios eliminados
     */
    public static function procesarEliminacionesPendientes(): int
    {
        $tu = UsuariosExtCols::TABLA;

        try {
            $pendientes = BaseRepository::consultar(
                "SELECT " . UsuariosExtCols::ID . " FROM {$tu}"
                . " WHERE " . UsuariosExtCols::ESTADO . " = '" . UsuariosExtEnums::ESTADO_EN_ELIMINACION . "'"
                . " AND " . UsuariosExtCols::SERA_ELIMINADO_EN . " <= NOW()",
                []
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('EliminacionUsuario: Error buscando pendientes de eliminacion', ['error' => $e->getMessage()]);
            return 0;
        }

        $eliminados = 0;
        foreach ($pendientes as $fila) {
            $id = (int) $fila[UsuariosExtCols::ID];
            if (self::eliminarConCascada($id)) {
                $eliminados++;
            }
        }

        if ($eliminados > 0) {
            KamplesLogger::info('EliminacionUsuario: Cron completado', ['eliminados' => $eliminados, 'total' => count($pendientes)]);
        }

        return $eliminados;
    }

    /**
     * Eliminar registros de una tabla por columna de usuario.
     *
     * @return int 0 si ok, 1 si error
     */
    private static function eliminarTabla(string $tabla, string $columnaUsuario, int $usuarioId, string $etiqueta): int
    {
        try {
            $eliminados = BaseRepository::ejecutar(
                "DELETE FROM {$tabla} WHERE {$columnaUsuario} = :uid",
                ['uid' => $usuarioId]
            );
            if ($eliminados > 0) {
                KamplesLogger::info("EliminacionUsuario: {$etiqueta} limpiados", [
                    'usuarioId' => $usuarioId,
                    'eliminados' => $eliminados,
                ]);
            }
            return 0;
        } catch (\Throwable $e) {
            KamplesLogger::error("EliminacionUsuario: Error en {$etiqueta}", [
                'usuarioId' => $usuarioId,
                'error' => $e->getMessage(),
            ]);
            return 1;
        }
    }

    /**
     * Eliminar todos los samples del usuario con cascada individual.
     * Usa SamplesRepository::eliminarConCascada() que limpia likes,
     * coleccion_samples de otros usuarios, reproducciones y descargas.
     *
     * @return int 0 si ok, 1+ si errores
     */
    private static function eliminarSamplesDeUsuario(int $usuarioId): int
    {
        $ts = SamplesCols::TABLA;
        $errores = 0;

        try {
            $samples = BaseRepository::consultar(
                "SELECT " . SamplesCols::ID . " FROM {$ts} WHERE " . SamplesCols::CREADOR_ID . " = :uid",
                ['uid' => $usuarioId]
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('EliminacionUsuario: Error listando samples', ['error' => $e->getMessage()]);
            return 1;
        }

        foreach ($samples as $row) {
            try {
                SamplesRepository::eliminarConCascada((int) $row[SamplesCols::ID]);
            } catch (\Throwable $e) {
                KamplesLogger::error('EliminacionUsuario: Error eliminando sample', [
                    'sampleId' => $row[SamplesCols::ID], 'error' => $e->getMessage(),
                ]);
                $errores++;
            }
        }

        if (count($samples) > 0) {
            KamplesLogger::info('EliminacionUsuario: Samples eliminados', [
                'usuarioId' => $usuarioId, 'total' => count($samples), 'errores' => $errores,
            ]);
        }

        /* TO-DO: Eliminar archivos fisicos del sample en wp-uploads/kamples/{userId}/ */

        return $errores;
    }

    /**
     * Eliminar todas las publicaciones del usuario con cascada individual.
     *
     * @return int 0 si ok, 1+ si errores
     */
    private static function eliminarPublicacionesDeUsuario(int $usuarioId): int
    {
        $tp = PublicacionesCols::TABLA;
        $errores = 0;

        try {
            $pubs = BaseRepository::consultar(
                "SELECT " . PublicacionesCols::ID . " FROM {$tp} WHERE " . PublicacionesCols::AUTOR_ID . " = :uid",
                ['uid' => $usuarioId]
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('EliminacionUsuario: Error listando publicaciones', ['error' => $e->getMessage()]);
            return 1;
        }

        foreach ($pubs as $row) {
            try {
                PublicacionesRepository::eliminarConCascada((int) $row[PublicacionesCols::ID]);
            } catch (\Throwable $e) {
                KamplesLogger::error('EliminacionUsuario: Error eliminando publicacion', [
                    'pubId' => $row[PublicacionesCols::ID], 'error' => $e->getMessage(),
                ]);
                $errores++;
            }
        }

        if (count($pubs) > 0) {
            KamplesLogger::info('EliminacionUsuario: Publicaciones eliminadas', [
                'usuarioId' => $usuarioId, 'total' => count($pubs), 'errores' => $errores,
            ]);
        }

        return $errores;
    }
}
