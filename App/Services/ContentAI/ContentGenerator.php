<?php

/**
 * ContentGenerator - Orquestador de generacion de contenido
 * 
 * Combina GeminiClient, AIConfigManager y DraftManager para
 * el flujo completo de generacion de articulos.
 * 
 * @package Glory\Services\ContentAI
 */

namespace App\Services\ContentAI;

class ContentGenerator
{
    private GeminiClient $client;

    /**
     * Constructor
     */
    public function __construct()
    {
        $apiKey = AIConfigManager::get('gemini_api_key');
        $model = AIConfigManager::get('model', 'gemini-2.5-flash');

        $this->client = new GeminiClient($apiKey, $model);
    }

    /**
     * Genera un articulo completo y lo guarda como borrador
     * 
     * @param string $title Titulo del articulo
     * @param string $topic Tema principal
     * @param array $options Opciones adicionales
     * @return array Resultado con el borrador creado
     */
    public function generateAndSave(string $title, string $topic, array $options = []): array
    {
        // Verificar configuracion
        $configStatus = AIConfigManager::isConfigured();
        if (!$configStatus['configured']) {
            return [
                'success' => false,
                'error' => 'Sistema de IA no configurado: ' . $configStatus['message']
            ];
        }

        // Obtener preferencias
        $tone = $options['tone'] ?? AIConfigManager::get('tone', 'cercano');
        $wordCount = $options['wordCount'] ?? AIConfigManager::get('word_count', 1000);
        $outline = $options['outline'] ?? '';

        // Generar el articulo
        $result = $this->client->generateArticle($title, $outline, $tone, $wordCount);

        if (!$result) {
            return [
                'success' => false,
                'error' => $this->client->getLastError() ?? 'Error al generar contenido'
            ];
        }

        // Crear borrador
        $draftOptions = [
            'prompt' => "Titulo: {$title}\nTema: {$topic}\nEsquema: {$outline}",
            'excerpt' => $this->generateExcerpt($result['text']),
            'category' => $options['category'] ?? null,
            'tags' => $options['tags'] ?? [$topic]
        ];

        $postId = DraftManager::createDraft($result, $title, $draftOptions);

        if (is_wp_error($postId)) {
            return [
                'success' => false,
                'error' => $postId->get_error_message()
            ];
        }

        return [
            'success' => true,
            'draft' => DraftManager::getDraft($postId),
            'sources' => $result['sources'],
            'searchQueries' => $result['searchQueries']
        ];
    }

    /**
     * Busca noticias y tendencias sobre los temas configurados
     * 
     * @return array Lista de temas encontrados con resumen
     */
    public function searchTrends(): array
    {
        $topics = AIConfigManager::getTopics();
        $excludedTopics = AIConfigManager::getExcludedTopics();
        $results = [];

        foreach ($topics as $topic) {
            // Construir prompt de busqueda
            $searchPrompt = "Busca las ultimas noticias y tendencias (ultimas 2 semanas) sobre: {$topic}

Enfocate en:
- Novedades tecnologicas
- Casos de uso en empresas
- Actualizaciones de plataformas (WhatsApp Business, Meta, etc)
- Nuevas integraciones disponibles

Excluye temas sobre: " . implode(', ', $excludedTopics) . "

Responde en formato JSON con esta estructura:
{
  \"trends\": [
    {
      \"title\": \"Titulo sugerido para articulo\",
      \"summary\": \"Resumen en 2-3 lineas\",
      \"relevance\": \"alta|media|baja\",
      \"potentialArticle\": true|false
    }
  ]
}";

            $result = $this->client->generateContent($searchPrompt, true);

            if ($result) {
                // Intentar parsear JSON de la respuesta
                $jsonMatch = [];
                if (preg_match('/\{[\s\S]*\}/m', $result['text'], $jsonMatch)) {
                    $parsed = json_decode($jsonMatch[0], true);
                    if ($parsed && isset($parsed['trends'])) {
                        $results[$topic] = [
                            'trends' => $parsed['trends'],
                            'sources' => $result['sources'],
                            'searchedAt' => current_time('mysql')
                        ];
                    }
                }
            }
        }

        // Actualizar fecha de ultima busqueda
        AIConfigManager::set('last_search', current_time('mysql'));

        return $results;
    }

    /**
     * Genera ideas de articulos basadas en tendencias
     * 
     * @param int $count Numero de ideas a generar
     * @return array Lista de ideas
     */
    public function generateArticleIdeas(int $count = 5): array
    {
        $topics = AIConfigManager::getTopics();
        $topicsStr = implode(', ', $topics);

        $prompt = "Genera {$count} ideas de articulos de blog sobre: {$topicsStr}

Cada idea debe:
- Ser relevante para empresas que quieren automatizar atencion al cliente
- Tener potencial SEO (busquedas reales)
- Poder desarrollarse en 1000-1500 palabras

Responde en JSON:
{
  \"ideas\": [
    {
      \"title\": \"Titulo optimizado para SEO\",
      \"description\": \"Descripcion en 1-2 lineas\",
      \"keywords\": [\"palabra1\", \"palabra2\"],
      \"outline\": [\"Punto 1\", \"Punto 2\", \"Punto 3\"]
    }
  ]
}";

        $result = $this->client->generateContent($prompt, true);

        if (!$result) {
            return [
                'success' => false,
                'error' => $this->client->getLastError()
            ];
        }

        // Parsear JSON
        $jsonMatch = [];
        if (preg_match('/\{[\s\S]*\}/m', $result['text'], $jsonMatch)) {
            $parsed = json_decode($jsonMatch[0], true);
            if ($parsed && isset($parsed['ideas'])) {
                return [
                    'success' => true,
                    'ideas' => $parsed['ideas'],
                    'sources' => $result['sources']
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'No se pudo parsear la respuesta',
            'raw' => $result['text']
        ];
    }

    /**
     * Genera un extracto a partir del contenido
     */
    private function generateExcerpt(string $content, int $length = 160): string
    {
        // Remover HTML
        $text = wp_strip_all_tags($content);

        // Tomar los primeros caracteres
        if (strlen($text) > $length) {
            $text = substr($text, 0, $length);
            $text = substr($text, 0, strrpos($text, ' ')) . '...';
        }

        return $text;
    }

    /**
     * Regenera el contenido de un borrador existente
     */
    public function regenerateDraft(int $postId, array $options = []): array
    {
        $draft = DraftManager::getDraft($postId);

        if (!$draft) {
            return [
                'success' => false,
                'error' => 'Borrador no encontrado'
            ];
        }

        // Obtener prompt original o generar uno nuevo
        $prompt = $draft['ai']['prompt'] ?? '';
        $title = $options['title'] ?? $draft['title'];
        $tone = $options['tone'] ?? AIConfigManager::get('tone', 'cercano');
        $wordCount = $options['wordCount'] ?? AIConfigManager::get('word_count', 1000);

        // Regenerar contenido
        $result = $this->client->generateArticle($title, '', $tone, $wordCount);

        if (!$result) {
            return [
                'success' => false,
                'error' => $this->client->getLastError()
            ];
        }

        // Actualizar borrador
        $updated = DraftManager::updateContent($postId, $title, $result['text']);

        if (!$updated) {
            return [
                'success' => false,
                'error' => 'Error al actualizar el borrador'
            ];
        }

        // Actualizar metadata de fuentes
        update_post_meta($postId, '_glory_ai_sources', $result['sources']);
        update_post_meta($postId, '_glory_ai_model', $result['model']);

        return [
            'success' => true,
            'draft' => DraftManager::getDraft($postId),
            'sources' => $result['sources']
        ];
    }

    /**
     * Prueba la conexion con la API
     */
    public function testConnection(): array
    {
        return $this->client->testConnection();
    }

    /**
     * Obtiene el ultimo error del cliente
     */
    public function getLastError(): ?string
    {
        return $this->client->getLastError();
    }
}
