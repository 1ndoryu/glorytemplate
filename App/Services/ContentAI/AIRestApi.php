<?php

/**
 * AIRestApi - Endpoints REST para el sistema de IA
 * 
 * Proporciona endpoints para:
 * - Configuracion del sistema
 * - Generacion de contenido
 * - Gestion de borradores
 * - Estadisticas
 * 
 * IMPORTANTE: Todos los endpoints requieren autenticacion de administrador.
 * 
 * @package Glory\Services\ContentAI
 */

namespace App\Services\ContentAI;

class AIRestApi
{
    private const NAMESPACE = 'glory/v1';
    private const BASE = 'ai';

    /**
     * Registra los endpoints REST
     */
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    /**
     * Registra las rutas
     */
    public static function registerRoutes(): void
    {
        // === CONFIGURACION ===

        // GET /glory/v1/ai/config - Obtiene configuracion
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/config', [
            'methods' => 'GET',
            'callback' => [self::class, 'getConfig'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // POST /glory/v1/ai/config - Guarda configuracion
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/config', [
            'methods' => 'POST',
            'callback' => [self::class, 'saveConfig'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // POST /glory/v1/ai/config/test - Prueba conexion
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/config/test', [
            'methods' => 'POST',
            'callback' => [self::class, 'testConnection'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // === GENERACION ===

        // POST /glory/v1/ai/generate - Genera articulo
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/generate', [
            'methods' => 'POST',
            'callback' => [self::class, 'generateArticle'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // POST /glory/v1/ai/ideas - Genera ideas de articulos
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/ideas', [
            'methods' => 'POST',
            'callback' => [self::class, 'generateIdeas'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // POST /glory/v1/ai/search - Busca tendencias
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/search', [
            'methods' => 'POST',
            'callback' => [self::class, 'searchTrends'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // === BORRADORES ===

        // GET /glory/v1/ai/drafts - Lista borradores
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/drafts', [
            'methods' => 'GET',
            'callback' => [self::class, 'getDrafts'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // GET /glory/v1/ai/drafts/{id} - Obtiene un borrador
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/drafts/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'getDraft'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // PUT /glory/v1/ai/drafts/{id} - Actualiza borrador
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/drafts/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [self::class, 'updateDraft'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // POST /glory/v1/ai/drafts/{id}/approve - Aprueba borrador
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/drafts/(?P<id>\d+)/approve', [
            'methods' => 'POST',
            'callback' => [self::class, 'approveDraft'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // POST /glory/v1/ai/drafts/{id}/publish - Publica borrador
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/drafts/(?P<id>\d+)/publish', [
            'methods' => 'POST',
            'callback' => [self::class, 'publishDraft'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // POST /glory/v1/ai/drafts/{id}/reject - Rechaza borrador
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/drafts/(?P<id>\d+)/reject', [
            'methods' => 'POST',
            'callback' => [self::class, 'rejectDraft'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // POST /glory/v1/ai/drafts/{id}/regenerate - Regenera borrador
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/drafts/(?P<id>\d+)/regenerate', [
            'methods' => 'POST',
            'callback' => [self::class, 'regenerateDraft'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);

        // === ESTADISTICAS ===

        // GET /glory/v1/ai/stats - Obtiene estadisticas
        register_rest_route(self::NAMESPACE, '/' . self::BASE . '/stats', [
            'methods' => 'GET',
            'callback' => [self::class, 'getStats'],
            'permission_callback' => [self::class, 'checkAdminPermission']
        ]);
    }

    /**
     * Verifica permisos de administrador
     */
    public static function checkAdminPermission(): bool
    {
        return current_user_can('manage_options');
    }

    // === HANDLERS DE CONFIGURACION ===

    public static function getConfig(\WP_REST_Request $request): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'success' => true,
            'config' => AIConfigManager::getPublicConfig(),
            'toneOptions' => AIConfigManager::getToneOptions(),
            'frequencyOptions' => AIConfigManager::getFrequencyOptions(),
            'models' => GeminiClient::getAvailableModels()
        ]);
    }

    public static function saveConfig(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params();
        $allowedKeys = [
            'gemini_api_key',
            'openai_api_key',
            'active_provider',
            'model',
            'tone',
            'word_count',
            'topics',
            'excluded_topics',
            'auto_search_enabled',
            'search_frequency',
            'drafts_auto_create'
        ];

        $saved = [];
        foreach ($allowedKeys as $key) {
            if (isset($params[$key])) {
                AIConfigManager::set($key, $params[$key]);
                $saved[] = $key;
            }
        }

        return new \WP_REST_Response([
            'success' => true,
            'saved' => $saved,
            'config' => AIConfigManager::getPublicConfig()
        ]);
    }

    public static function testConnection(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params();

        // Usar API key del request o la guardada
        $apiKey = $params['apiKey'] ?? AIConfigManager::get('gemini_api_key');
        $model = $params['model'] ?? AIConfigManager::get('model', 'gemini-2.5-flash');

        $client = new GeminiClient($apiKey, $model);
        $result = $client->testConnection();

        return new \WP_REST_Response([
            'success' => $result['success'],
            'message' => $result['message'],
            'model' => $result['model']
        ]);
    }

    // === HANDLERS DE GENERACION ===

    public static function generateArticle(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $params = $request->get_json_params();

            if (empty($params['title'])) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'El titulo es requerido'
                ], 400);
            }

            $generator = new ContentGenerator();
            $result = $generator->generateAndSave(
                $params['title'],
                $params['topic'] ?? $params['title'],
                [
                    'outline' => $params['outline'] ?? '',
                    'tone' => $params['tone'] ?? null,
                    'wordCount' => $params['wordCount'] ?? null,
                    'category' => $params['category'] ?? null,
                    'tags' => $params['tags'] ?? []
                ]
            );

            $statusCode = $result['success'] ? 200 : 500;
            return new \WP_REST_Response($result, $statusCode);
        } catch (\Throwable $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Error interno: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    public static function generateIdeas(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params();
        $count = $params['count'] ?? 5;

        $generator = new ContentGenerator();
        $result = $generator->generateArticleIdeas($count);

        $statusCode = $result['success'] ? 200 : 500;
        return new \WP_REST_Response($result, $statusCode);
    }

    public static function searchTrends(\WP_REST_Request $request): \WP_REST_Response
    {
        $generator = new ContentGenerator();
        $result = $generator->searchTrends();

        return new \WP_REST_Response([
            'success' => true,
            'trends' => $result,
            'searchedAt' => current_time('mysql')
        ]);
    }

    // === HANDLERS DE BORRADORES ===

    public static function getDrafts(\WP_REST_Request $request): \WP_REST_Response
    {
        $status = $request->get_param('status') ?? 'all';
        $limit = $request->get_param('limit') ?? 50;

        $drafts = DraftManager::getDrafts($status, $limit);

        return new \WP_REST_Response([
            'success' => true,
            'drafts' => $drafts,
            'count' => count($drafts)
        ]);
    }

    public static function getDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $draft = DraftManager::getDraft($id);

        if (!$draft) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Borrador no encontrado'
            ], 404);
        }

        return new \WP_REST_Response([
            'success' => true,
            'draft' => $draft
        ]);
    }

    public static function updateDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $params = $request->get_json_params();

        if (empty($params['title']) || empty($params['content'])) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Titulo y contenido son requeridos'
            ], 400);
        }

        $updated = DraftManager::updateContent($id, $params['title'], $params['content']);

        if (!$updated) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Error al actualizar borrador'
            ], 500);
        }

        return new \WP_REST_Response([
            'success' => true,
            'draft' => DraftManager::getDraft($id)
        ]);
    }

    public static function approveDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $success = DraftManager::approve($id);

        return new \WP_REST_Response([
            'success' => $success,
            'draft' => $success ? DraftManager::getDraft($id) : null
        ]);
    }

    public static function publishDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $success = DraftManager::publish($id);

        return new \WP_REST_Response([
            'success' => $success,
            'draft' => $success ? DraftManager::getDraft($id) : null
        ]);
    }

    public static function rejectDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $success = DraftManager::reject($id);

        return new \WP_REST_Response([
            'success' => $success
        ]);
    }

    public static function regenerateDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $params = $request->get_json_params();

        $generator = new ContentGenerator();
        $result = $generator->regenerateDraft($id, $params);

        $statusCode = $result['success'] ? 200 : 500;
        return new \WP_REST_Response($result, $statusCode);
    }

    // === HANDLERS DE ESTADISTICAS ===

    public static function getStats(\WP_REST_Request $request): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'success' => true,
            'stats' => DraftManager::getStats(),
            'config' => AIConfigManager::isConfigured(),
            'lastSearch' => AIConfigManager::get('last_search')
        ]);
    }
}
