<?php

/**
 * API Controller para Adjuntos
 *
 * Maneja los endpoints REST para subida, descarga y gestión de archivos adjuntos.
 * Trabaja en conjunto con AdjuntosService para el almacenamiento físico.
 *
 * Endpoints:
 * - POST   /glory/v1/adjuntos         - Subir archivo
 * - GET    /glory/v1/adjuntos/{id}    - Descargar archivo (con token para cifrados)
 * - DELETE /glory/v1/adjuntos/{id}    - Eliminar archivo
 * - GET    /glory/v1/adjuntos         - Listar archivos del usuario
 *
 * @package App\Api
 */

namespace App\Api;

use App\Services\AdjuntosService;
use App\Services\AlmacenamientoService;

class AdjuntosApiController
{
    /* Tiempo de expiración del token en segundos (1 hora) */
    private const TOKEN_EXPIRACION = 3600;

    /**
     * Registra el controlador
     */
    public static function register(): void
    {
        add_action('rest_api_init', [new self(), 'registrarRutas']);
    }

    /**
     * Registra las rutas REST
     */
    public function registrarRutas(): void
    {
        $namespace = 'glory/v1';

        /* Subir archivo */
        register_rest_route($namespace, '/adjuntos', [
            'methods' => 'POST',
            'callback' => [$this, 'subirArchivo'],
            'permission_callback' => [$this, 'verificarAutenticacion']
        ]);

        /* Listar archivos */
        register_rest_route($namespace, '/adjuntos', [
            'methods' => 'GET',
            'callback' => [$this, 'listarArchivos'],
            'permission_callback' => [$this, 'verificarAutenticacion']
        ]);

        /* Descargar archivo - permite token O autenticación */
        register_rest_route($namespace, '/adjuntos/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'descargarArchivo'],
            'permission_callback' => [$this, 'verificarAccesoArchivo'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint'
                ],
                'file' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_file_name'
                ],
                'token' => [
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field'
                ],
                'exp' => [
                    'required' => false,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint'
                ],
                'uid' => [
                    'required' => false,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint'
                ]
            ]
        ]);

        /* Eliminar archivo */
        register_rest_route($namespace, '/adjuntos/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'eliminarArchivo'],
            'permission_callback' => [$this, 'verificarAutenticacion'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint'
                ],
                'file' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_file_name'
                ]
            ]
        ]);

        /* Verificar espacio antes de subir */
        register_rest_route($namespace, '/adjuntos/verificar', [
            'methods' => 'POST',
            'callback' => [$this, 'verificarEspacio'],
            'permission_callback' => [$this, 'verificarAutenticacion'],
            'args' => [
                'tamano' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint'
                ]
            ]
        ]);
    }

    /**
     * Verifica que el usuario esté autenticado
     */
    public function verificarAutenticacion(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Verifica acceso a archivo: autenticación normal O token válido
     */
    public function verificarAccesoArchivo(\WP_REST_Request $request): bool
    {
        /* Si está autenticado normalmente, permitir */
        if (is_user_logged_in()) {
            return true;
        }

        /* Si no está autenticado, verificar token */
        $token = $request->get_param('token');
        $exp = $request->get_param('exp');
        $userId = $request->get_param('uid');
        $file = $request->get_param('file');

        if (empty($token) || empty($exp) || empty($userId) || empty($file)) {
            return false;
        }

        /* Verificar que no haya expirado */
        if (time() > $exp) {
            return false;
        }

        /* Verificar firma del token */
        $tokenEsperado = $this->generarToken($userId, $file, $exp);

        return hash_equals($tokenEsperado, $token);
    }

    /**
     * Genera un token firmado para acceso a archivo
     */
    public static function generarToken(int $userId, string $file, int $exp): string
    {
        $clave = self::obtenerClaveToken();
        $datos = "{$userId}:{$file}:{$exp}";

        return hash_hmac('sha256', $datos, $clave);
    }

    /**
     * Genera URL con token para archivo cifrado
     */
    public static function generarUrlConToken(int $adjuntoId, int $userId, string $nombreArchivo): string
    {
        $exp = time() + self::TOKEN_EXPIRACION;
        $token = self::generarToken($userId, $nombreArchivo, $exp);

        $url = rest_url("glory/v1/adjuntos/{$adjuntoId}");
        $url .= "?file=" . urlencode($nombreArchivo);
        $url .= "&uid=" . $userId;
        $url .= "&exp=" . $exp;
        $url .= "&token=" . $token;

        return $url;
    }

    /**
     * Obtiene la clave para firmar tokens
     */
    private static function obtenerClaveToken(): string
    {
        if (defined('AUTH_KEY') && strlen(AUTH_KEY) >= 32) {
            return AUTH_KEY . '_adjuntos_token';
        }

        if (defined('SECURE_AUTH_KEY') && strlen(SECURE_AUTH_KEY) >= 32) {
            return SECURE_AUTH_KEY . '_adjuntos_token';
        }

        return hash('sha256', ABSPATH . 'glory_adjuntos_token_fallback');
    }

    /**
     * Subir un archivo
     */
    public function subirArchivo(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        /* Verificar que haya archivos */
        $files = $request->get_file_params();

        if (empty($files) || !isset($files['archivo'])) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'No se recibió ningún archivo',
                'code' => 'no_file'
            ], 400);
        }

        $archivo = $files['archivo'];

        /* Verificar errores de subida */
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            $mensajeError = $this->traducirErrorSubida($archivo['error']);
            return new \WP_REST_Response([
                'success' => false,
                'error' => $mensajeError,
                'code' => 'upload_error'
            ], 400);
        }

        /* Verificar espacio disponible primero */
        $almacenamiento = new AlmacenamientoService($userId);
        if (!$almacenamiento->puedeSubir($archivo['size'])) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Límite de almacenamiento excedido',
                'code' => 'storage_limit',
                'almacenamiento' => $almacenamiento->getInfoCompleta()
            ], 403);
        }

        /* Procesar subida */
        $adjuntosService = new AdjuntosService($userId);
        $resultado = $adjuntosService->subirArchivo($archivo);

        if ($resultado === null) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Error al procesar el archivo',
                'code' => 'processing_error'
            ], 500);
        }

        /* Actualizar información de almacenamiento */
        $almacenamientoActualizado = $almacenamiento->getInfoCompleta();

        return new \WP_REST_Response([
            'success' => true,
            'adjunto' => $resultado,
            'almacenamiento' => $almacenamientoActualizado
        ], 201);
    }

    /**
     * Descargar un archivo
     */
    public function descargarArchivo(\WP_REST_Request $request): \WP_REST_Response
    {
        /* Obtener userId de la sesión o del parámetro (si usa token) */
        $userId = is_user_logged_in()
            ? get_current_user_id()
            : $request->get_param('uid');

        $nombreArchivo = $request->get_param('file');

        if (empty($nombreArchivo) || empty($userId)) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Parámetros requeridos faltantes',
                'code' => 'missing_params'
            ], 400);
        }

        $adjuntosService = new AdjuntosService($userId);
        $contenido = $adjuntosService->obtenerArchivo($nombreArchivo);

        if ($contenido === null) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Archivo no encontrado',
                'code' => 'not_found'
            ], 404);
        }

        /* Obtener información del archivo */
        $info = $adjuntosService->obtenerInfoArchivo($nombreArchivo);

        /* Determinar tipo MIME real */
        $mimeType = $info['mimeType'] ?? 'application/octet-stream';

        /* Si está cifrado, intentar detectar el tipo real del contenido */
        if ($info['cifrado']) {
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($contenido) ?: 'application/octet-stream';
        }

        /* Enviar archivo con headers apropiados */
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . strlen($contenido));
        header('Cache-Control: private, max-age=3600');

        echo $contenido;
        exit;
    }

    /**
     * Eliminar un archivo
     */
    public function eliminarArchivo(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $nombreArchivo = $request->get_param('file');

        if (empty($nombreArchivo)) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Nombre de archivo requerido',
                'code' => 'missing_filename'
            ], 400);
        }

        $adjuntosService = new AdjuntosService($userId);
        $eliminado = $adjuntosService->eliminarArchivo($nombreArchivo);

        if (!$eliminado) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'No se pudo eliminar el archivo',
                'code' => 'delete_failed'
            ], 500);
        }

        /* Obtener almacenamiento actualizado */
        $almacenamiento = new AlmacenamientoService($userId);

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'Archivo eliminado correctamente',
            'almacenamiento' => $almacenamiento->getInfoCompleta()
        ]);
    }

    /**
     * Listar archivos del usuario
     */
    public function listarArchivos(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        $adjuntosService = new AdjuntosService($userId);
        $archivos = $adjuntosService->listarArchivos();

        return new \WP_REST_Response([
            'success' => true,
            'archivos' => $archivos,
            'total' => count($archivos)
        ]);
    }

    /**
     * Verificar espacio disponible antes de subir
     */
    public function verificarEspacio(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tamano = $request->get_param('tamano');

        $almacenamiento = new AlmacenamientoService($userId);
        $puedeSubir = $almacenamiento->puedeSubir($tamano);

        return new \WP_REST_Response([
            'success' => true,
            'puedeSubir' => $puedeSubir,
            'almacenamiento' => $almacenamiento->getInfoCompleta()
        ]);
    }

    /**
     * Traduce códigos de error de subida a mensajes legibles
     */
    private function traducirErrorSubida(int $codigo): string
    {
        $errores = [
            UPLOAD_ERR_INI_SIZE => 'El archivo excede el límite del servidor',
            UPLOAD_ERR_FORM_SIZE => 'El archivo excede el límite del formulario',
            UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente',
            UPLOAD_ERR_NO_FILE => 'No se recibió ningún archivo',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta directorio temporal del servidor',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir archivo en disco',
            UPLOAD_ERR_EXTENSION => 'Subida bloqueada por extensión'
        ];

        return $errores[$codigo] ?? 'Error desconocido en la subida';
    }
}

/* Registrar el controlador automáticamente */
AdjuntosApiController::register();
