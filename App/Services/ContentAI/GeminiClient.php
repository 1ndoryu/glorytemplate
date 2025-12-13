<?php

/**
 * GeminiClient - Cliente REST para la API de Gemini
 * 
 * Utiliza Gemini 2.5 Flash con grounding de Google Search
 * para generar contenido basado en informacion actualizada de internet.
 * 
 * @package Glory\Services\ContentAI
 */

namespace App\Services\ContentAI;

class GeminiClient
{
    // API endpoint base
    private const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

    // Modelo por defecto
    private const DEFAULT_MODEL = 'gemini-2.5-flash';

    // API Key
    private string $apiKey;

    // Modelo a usar
    private string $model;

    // Ultimo error
    private ?string $lastError = null;

    // Ultima respuesta raw
    private ?array $lastResponse = null;

    /**
     * Constructor
     * 
     * @param string|null $apiKey API key de Gemini (opcional, usa la guardada en opciones)
     * @param string $model Modelo a usar (por defecto gemini-2.5-flash)
     */
    public function __construct(?string $apiKey = null, string $model = self::DEFAULT_MODEL)
    {
        $this->apiKey = $apiKey ?? get_option('glory_ai_gemini_api_key', '');
        $this->model = $model;
    }

    /**
     * Verifica si el cliente esta configurado correctamente
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Genera contenido usando Gemini
     * 
     * @param string $prompt El prompt para generar contenido
     * @param bool $useGrounding Si debe usar Google Search para grounding
     * @param array $systemInstruction Instrucciones del sistema (opcional)
     * @return array|null Respuesta con contenido y fuentes, o null si falla
     */
    public function generateContent(
        string $prompt,
        bool $useGrounding = true,
        ?string $systemInstruction = null
    ): ?array {
        if (!$this->isConfigured()) {
            $this->lastError = 'API key no configurada';
            return null;
        }

        // Construir el body de la peticion
        $body = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ]
        ];

        // Agregar instrucciones del sistema si existen
        if ($systemInstruction) {
            $body['systemInstruction'] = [
                'parts' => [
                    ['text' => $systemInstruction]
                ]
            ];
        }

        // Agregar tool de Google Search si se requiere grounding
        if ($useGrounding) {
            $body['tools'] = [
                ['google_search' => new \stdClass()]
            ];
        }

        // Configuracion de generacion
        $body['generationConfig'] = [
            'temperature' => 0.7,
            'topP' => 0.95,
            'topK' => 40,
            'maxOutputTokens' => 8192,
        ];

        // Realizar la peticion
        $response = $this->makeRequest('generateContent', $body);

        if (!$response) {
            return null;
        }

        // Extraer el contenido generado
        $text = $response['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (!$text) {
            $this->lastError = 'Respuesta sin contenido de texto';
            return null;
        }

        // Extraer metadata de grounding (fuentes)
        $groundingMetadata = $response['candidates'][0]['groundingMetadata'] ?? null;
        $sources = [];

        if ($groundingMetadata && isset($groundingMetadata['groundingChunks'])) {
            foreach ($groundingMetadata['groundingChunks'] as $chunk) {
                if (isset($chunk['web'])) {
                    $sources[] = [
                        'url' => $chunk['web']['uri'] ?? '',
                        'title' => $chunk['web']['title'] ?? ''
                    ];
                }
            }
        }

        return [
            'text' => $text,
            'sources' => $sources,
            'searchQueries' => $groundingMetadata['webSearchQueries'] ?? [],
            'model' => $this->model,
            'timestamp' => current_time('mysql')
        ];
    }

    /**
     * Busca informacion sobre un tema especifico
     * 
     * @param string $topic Tema a buscar
     * @param string $context Contexto adicional
     * @return array|null Informacion encontrada con fuentes
     */
    public function searchTopic(string $topic, string $context = ''): ?array
    {
        $prompt = "Busca informacion reciente (ultimas 2 semanas) sobre: {$topic}";

        if ($context) {
            $prompt .= "\n\nContexto adicional: {$context}";
        }

        $prompt .= "\n\nProporciona un resumen estructurado de las noticias y tendencias mas relevantes encontradas.";

        return $this->generateContent($prompt, true);
    }

    /**
     * Genera un articulo completo de blog
     * 
     * @param string $title Titulo del articulo
     * @param string $outline Esquema o puntos a cubrir
     * @param string $tone Tono del articulo (profesional, cercano, tecnico)
     * @param int $wordCount Numero aproximado de palabras
     * @return array|null Articulo generado con fuentes
     */
    public function generateArticle(
        string $title,
        string $outline = '',
        string $tone = 'cercano',
        int $wordCount = 1000
    ): ?array {
        $systemInstruction = $this->getArticleSystemPrompt($tone);

        $prompt = "Escribe un articulo de blog titulado: \"{$title}\"\n\n";

        if ($outline) {
            $prompt .= "Estructura a seguir:\n{$outline}\n\n";
        }

        $prompt .= "Requisitos:
- Aproximadamente {$wordCount} palabras
- Formato HTML con etiquetas semanticas (h2, h3, p, ul, li, strong)
- Incluye introduccion y conclusion
- Tono {$tone}, en primera persona
- Busca informacion actual y relevante
- NO uses emojis
- Incluye datos y ejemplos concretos";

        return $this->generateContent($prompt, true, $systemInstruction);
    }

    /**
     * Obtiene el prompt del sistema para generar articulos
     */
    private function getArticleSystemPrompt(string $tone): string
    {
        $toneDescriptions = [
            'cercano' => 'cercano y amigable, como hablando con un colega',
            'profesional' => 'profesional pero accesible, con autoridad en el tema',
            'tecnico' => 'tecnico y detallado, para una audiencia especializada'
        ];

        $toneDesc = $toneDescriptions[$tone] ?? $toneDescriptions['cercano'];

        return "Eres un experto en chatbots, automatizacion y WhatsApp Business API. 
Escribes contenido para el blog de un consultor que ayuda a empresas a implementar estas soluciones.

Tu estilo es {$toneDesc}.

Reglas:
- Usa primera persona (yo, mi experiencia, trabajo con mis clientes)
- Evita jerga excesiva, explica conceptos complejos de forma simple
- Incluye ejemplos practicos de negocios reales (restaurantes, clinicas, hoteles)
- NO uses emojis en ningun caso
- Formato HTML limpio, sin clases CSS
- Estructura clara con H2 para secciones principales y H3 para subsecciones";
    }

    /**
     * Realiza una peticion HTTP a la API de Gemini
     */
    private function makeRequest(string $action, array $body): ?array
    {
        // Log de la peticion
        $logId = GeminiLogger::logRequest($action, $body);

        // Usar API key como query param segun documentacion oficial
        $url = self::API_BASE . $this->model . ':' . $action . '?key=' . urlencode($this->apiKey);

        $args = [
            'method' => 'POST',
            'timeout' => 120, // Aumentar timeout para generacion de contenido largo
            'headers' => [
                'Content-Type' => 'application/json'
            ],
            'body' => wp_json_encode($body)
        ];

        $response = wp_remote_post($url, $args);

        if (is_wp_error($response)) {
            $this->lastError = $response->get_error_message();

            // Log del error
            GeminiLogger::logResponse($logId, null, $this->lastError, 0);

            return null;
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        $responseBody = wp_remote_retrieve_body($response);
        $this->lastResponse = json_decode($responseBody, true);

        if ($statusCode !== 200) {
            $errorMessage = $this->lastResponse['error']['message'] ?? 'Error desconocido';
            $this->lastError = "Error {$statusCode}: {$errorMessage}";

            // Log del error
            GeminiLogger::logResponse($logId, $this->lastResponse, $this->lastError, $statusCode);

            return null;
        }

        // Log de la respuesta exitosa
        GeminiLogger::logResponse($logId, $this->lastResponse, null, $statusCode);

        return $this->lastResponse;
    }

    /**
     * Obtiene el ultimo error
     */
    public function getLastError(): ?string
    {
        return $this->lastError;
    }

    /**
     * Obtiene la ultima respuesta raw
     */
    public function getLastResponse(): ?array
    {
        return $this->lastResponse;
    }

    /**
     * Obtiene los modelos disponibles de Gemini
     * Actualizado: 2025-12-13
     */
    public static function getAvailableModels(): array
    {
        return [
            // Modelos actuales
            'gemini-3-pro' => 'Gemini 3 Pro (Mejor modelo, agentes y codigo)',
            'gemini-2.5-flash' => 'Gemini 2.5 Flash (Rapido e inteligente)',
            'gemini-2.5-flash-lite' => 'Gemini 2.5 Flash-Lite (Ultra rapido)',
            'gemini-2.5-pro' => 'Gemini 2.5 Pro (Pensamiento avanzado)',
            // Modelos anteriores
            'gemini-2.0-flash' => 'Gemini 2.0 Flash (Segunda generacion)',
            'gemini-2.0-flash-lite' => 'Gemini 2.0 Flash-Lite (Rapido y ligero)'
        ];
    }

    /**
     * Prueba la conexion con la API
     */
    public function testConnection(): array
    {
        $result = $this->generateContent('Di "Conexion exitosa" en espanol.', false);

        if ($result) {
            return [
                'success' => true,
                'message' => 'Conexion exitosa con Gemini API',
                'model' => $this->model
            ];
        }

        return [
            'success' => false,
            'message' => $this->lastError ?? 'Error desconocido',
            'model' => $this->model
        ];
    }
}
