<?php

/**
 * ExperimentosController — Genera contenido de test realista (solo admin).
 *
 * Crea usuario test, notificaciones y mensajes reales para validar
 * la interacción social sin mockups.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\ConversacionesCols;
use App\Config\Schema\_generated\MensajesEnums;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\NotificacionesRepository;
use App\Kamples\Database\Repositories\ConversacionesRepository;
use App\Kamples\Database\Repositories\MensajesRepository;

class ExperimentosController
{
    /* Username y email fijos del usuario de prueba */
    private const TEST_USERNAME = 'alice_test';
    private const TEST_EMAIL    = 'alice_test@glory.local';
    private const TEST_DISPLAY  = 'Alice Test';
    private const TEST_PASS     = 'GloryTest2026!';
    private const TEST_BIO      = 'Productora de test para validar interacciones sociales.';

    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/admin/experimentos/generar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'generar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * POST /admin/experimentos/generar
     *
     * Acciones disponibles (body JSON):
     *   { "acciones": ["usuario", "notificacion", "mensaje"] }
     *   Si no se envía acciones, ejecuta todas.
     *
     * Retorna resumen de lo creado.
     */
    public static function generar(\WP_REST_Request $request): \WP_REST_Response
    {
        KamplesLogger::info('Experimentos: Solicitud recibida', [
            'wpUserId' => \get_current_user_id(),
        ]);

        /* Solo admin */
        if (!UsuarioHelper::esAdmin()) {
            KamplesLogger::warning('Experimentos: Acceso denegado, no es admin', [
                'wpUserId' => \get_current_user_id(),
            ]);
            return new \WP_REST_Response([
                'code' => 'sin_permisos',
                'message' => 'Solo administradores pueden generar experimentos.',
            ], 403);
        }

        $adminPgId = UsuarioHelper::obtenerIdPg();
        if (!$adminPgId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        $body     = $request->get_json_params();
        $acciones = $body['acciones'] ?? ['usuario', 'notificacion', 'mensaje'];
        $resumen  = [];

        /* 1. Crear o recuperar usuario de test */
        $testUserId = null;
        if (in_array('usuario', $acciones, true) || in_array('notificacion', $acciones, true) || in_array('mensaje', $acciones, true)) {
            $testUserId = self::obtenerOcrearUsuarioTest();
            $resumen['usuario'] = [
                'pgId'     => $testUserId,
                'username' => self::TEST_USERNAME,
                'nombre'   => self::TEST_DISPLAY,
                'mensaje'  => $testUserId ? 'Usuario de test listo' : 'Error al crear usuario',
            ];

            if (!$testUserId) {
                return new \WP_REST_Response([
                    'ok'   => false,
                    'data' => $resumen,
                    'message' => 'No se pudo crear el usuario de test.',
                ], 500);
            }
        }

        /* 2. Generar notificación de follow del test user al admin */
        if (in_array('notificacion', $acciones, true) && $testUserId) {
            $notifResult = self::generarNotificacion($adminPgId, $testUserId);
            $resumen['notificacion'] = $notifResult;
            KamplesLogger::info('Experimentos: Notificación generada', $notifResult);
        }

        /* 3. Generar mensaje del test user al admin */
        if (in_array('mensaje', $acciones, true) && $testUserId) {
            $msgResult = self::generarMensaje($adminPgId, $testUserId);
            $resumen['mensaje'] = $msgResult;
            KamplesLogger::info('Experimentos: Mensaje generado', $msgResult);
        }

        return new \WP_REST_Response([
            'ok'   => true,
            'data' => $resumen,
        ], 200);
    }

    /**
     * Crea el usuario WP + fila en usuarios_ext si no existe.
     * Retorna el ID PG del usuario de test, o null en caso de error.
     */
    private static function obtenerOcrearUsuarioTest(): ?int
    {
        /* Buscar si ya existe en usuarios_ext */
        $existente = UsuariosExtRepository::buscarPorUsername(self::TEST_USERNAME);

        if ($existente) {
            return (int) $existente[UsuariosExtCols::ID];
        }

        /* Crear usuario WordPress */
        $wpUserId = \username_exists(self::TEST_USERNAME);

        if (!$wpUserId) {
            $wpUserId = \wp_insert_user([
                'user_login'   => self::TEST_USERNAME,
                'user_pass'    => self::TEST_PASS,
                'user_email'   => self::TEST_EMAIL,
                'display_name' => self::TEST_DISPLAY,
                'role'         => 'subscriber',
            ]);

            if (\is_wp_error($wpUserId)) {
                return null;
            }
        }

        /* Avatar por defecto de Gravatar/UI Avatars */
        $avatarUrl = 'https://ui-avatars.com/api/?name=' . urlencode(self::TEST_DISPLAY)
            . '&background=6366f1&color=fff&size=128&bold=true';

        /* Insertar en usuarios_ext */
        $id = UsuariosExtRepository::crearConConflict([
            'wpId'     => $wpUserId,
            'username' => self::TEST_USERNAME,
            'email'    => self::TEST_EMAIL,
            'nombre'   => self::TEST_DISPLAY,
            'bio'      => self::TEST_BIO,
            'avatar'   => $avatarUrl,
        ]);

        return $id;
    }

    /**
     * Crea una notificación realista del test user hacia el admin.
     * Alterna entre tipos: follow, like, mensaje.
     */
    private static function generarNotificacion(int $adminPgId, int $testUserId): array
    {
        /* Elegir tipo aleatorio para variedad */
        $tipos = ['follow', 'like', 'mensaje'];
        $tipo  = $tipos[array_rand($tipos)];

        switch ($tipo) {
            case 'follow':
                $datos = json_encode(['seguidor_id' => $testUserId]);
                break;

            case 'like':
                /* Buscar un sample del admin para simular like */
                $sample = SamplesRepository::obtenerUltimoDelCreador($adminPgId);
                $sampleId = $sample ? (int) $sample[SamplesCols::ID] : 1;
                $datos = json_encode([
                    'liker_id'  => $testUserId,
                    'sample_id' => $sampleId,
                ]);
                break;

            case 'mensaje':
                $datos = json_encode([
                    'remitente_id' => $testUserId,
                    'preview'      => 'Hey! Me encantaron tus beats.',
                ]);
                break;

            default:
                $datos = json_encode(['actor_id' => $testUserId]);
        }

        NotificacionesRepository::crear($adminPgId, $tipo, $datos);

        return [
            'tipo'    => $tipo,
            'destino' => $adminPgId,
            'actor'   => $testUserId,
            'mensaje' => "Notificación tipo '$tipo' creada",
        ];
    }

    /**
     * Crea una conversación (si no existe) y envía un mensaje real del test user al admin.
     */
    private static function generarMensaje(int $adminPgId, int $testUserId): array
    {
        /* Mensajes variados para que cada experimento sea diferente */
        $mensajes = [
            'Hey! Escuché tus últimos samples y están increíbles. Me gustaría colaborar contigo en un proyecto.',
            'Bro, ese loop de guitarra que subiste ayer es de otro nivel. Tienes más en ese estilo?',
            'Hola! Vi que eres productor por acá también. Yo trabajo principalmente con trap y R&B, estemos en contacto!',
            'Acabo de descargar tu pack y lo estoy usando en un beat, quedó fuego. Te mando el resultado cuando termine.',
            'Qué ondaa, me recomendaron tu perfil. Tienes algún sample tipo lo-fi chill? Estoy buscando para un proyecto.',
            'Hey, quería preguntarte si haces collabs. Tengo unas ideas que podrían quedar bien con tu estilo.',
        ];

        $contenido = $mensajes[array_rand($mensajes)];

        /* Crear o encontrar conversación */
        $p1 = min($adminPgId, $testUserId);
        $p2 = max($adminPgId, $testUserId);

        $conv = ConversacionesRepository::buscarEntreUsuarios($p1, $p2);

        if ($conv) {
            $convId = (int) $conv[ConversacionesCols::ID];
        } else {
            $convId = ConversacionesRepository::crear($p1, $p2);

            if (!$convId) {
                return ['error' => 'No se pudo crear la conversación'];
            }
        }

        /* Insertar mensaje del test user */
        MensajesRepository::insertarMensaje($convId, $testUserId, $contenido, MensajesEnums::TIPO_TEXTO, null, null);

        /* Actualizar timestamp de la conversación */
        ConversacionesRepository::actualizarUltimoMensaje($convId);

        return [
            'conversacionId' => $convId,
            'contenido'      => $contenido,
            'remitente'      => self::TEST_USERNAME,
            'mensaje'        => 'Mensaje enviado desde ' . self::TEST_DISPLAY,
        ];
    }
}
