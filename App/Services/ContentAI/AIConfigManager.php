<?php

/**
 * AIConfigManager - Gestor de configuracion del sistema de IA
 * 
 * Maneja las opciones de configuracion almacenadas en WordPress:
 * - API Keys (Gemini, OpenAI)
 * - Preferencias de generacion (tono, frecuencia, temas)
 * - Estado del sistema
 * 
 * @package Glory\Services\ContentAI
 */

namespace App\Services\ContentAI;

class AIConfigManager
{
    // Prefijo para opciones en la base de datos
    private const OPTION_PREFIX = 'glory_ai_';

    // Opciones por defecto
    private const DEFAULTS = [
        'gemini_api_key' => '',
        'openai_api_key' => '',
        'active_provider' => 'gemini',
        'model' => 'gemini-2.5-flash',
        'tone' => 'cercano',
        'word_count' => 1000,
        'topics' => ['chatbots', 'whatsapp business', 'automatizacion', 'ia para empresas'],
        'excluded_topics' => [],
        'auto_search_enabled' => false,
        'search_frequency' => 'daily',
        'last_search' => null,
        'drafts_auto_create' => true
    ];

    /**
     * Obtiene una opcion de configuracion
     * 
     * @param string $key Clave de la opcion
     * @param mixed $default Valor por defecto si no existe
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        $fullKey = self::OPTION_PREFIX . $key;
        $value = get_option($fullKey, $default ?? (self::DEFAULTS[$key] ?? null));

        // Deserializar arrays si es necesario
        if (is_string($value) && (strpos($value, '[') === 0 || strpos($value, '{') === 0)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }

        return $value;
    }

    /**
     * Establece una opcion de configuracion
     * 
     * @param string $key Clave de la opcion
     * @param mixed $value Valor a guardar
     * @return bool
     */
    public static function set(string $key, $value): bool
    {
        $fullKey = self::OPTION_PREFIX . $key;

        // Serializar arrays
        if (is_array($value)) {
            $value = wp_json_encode($value);
        }

        return update_option($fullKey, $value);
    }

    /**
     * Elimina una opcion de configuracion
     */
    public static function delete(string $key): bool
    {
        return delete_option(self::OPTION_PREFIX . $key);
    }

    /**
     * Obtiene toda la configuracion actual
     */
    public static function getAll(): array
    {
        $config = [];

        foreach (self::DEFAULTS as $key => $default) {
            $config[$key] = self::get($key, $default);
        }

        return $config;
    }

    /**
     * Guarda multiples opciones a la vez
     */
    public static function setMultiple(array $options): bool
    {
        $success = true;

        foreach ($options as $key => $value) {
            if (!self::set($key, $value)) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Resetea la configuracion a los valores por defecto
     */
    public static function reset(): bool
    {
        foreach (self::DEFAULTS as $key => $default) {
            self::delete($key);
        }

        return true;
    }

    /**
     * Verifica si el sistema esta configurado correctamente
     */
    public static function isConfigured(): array
    {
        $provider = self::get('active_provider', 'gemini');
        $apiKey = '';

        if ($provider === 'gemini') {
            $apiKey = self::get('gemini_api_key');
        } elseif ($provider === 'openai') {
            $apiKey = self::get('openai_api_key');
        }

        $isConfigured = !empty($apiKey);

        return [
            'configured' => $isConfigured,
            'provider' => $provider,
            'hasApiKey' => !empty($apiKey),
            'model' => self::get('model'),
            'message' => $isConfigured
                ? 'Sistema configurado correctamente'
                : 'Falta configurar la API key'
        ];
    }

    /**
     * Obtiene los temas configurados para busqueda
     */
    public static function getTopics(): array
    {
        return self::get('topics', self::DEFAULTS['topics']);
    }

    /**
     * Agrega un tema a la lista
     */
    public static function addTopic(string $topic): bool
    {
        $topics = self::getTopics();

        if (!in_array($topic, $topics)) {
            $topics[] = $topic;
            return self::set('topics', $topics);
        }

        return true;
    }

    /**
     * Elimina un tema de la lista
     */
    public static function removeTopic(string $topic): bool
    {
        $topics = self::getTopics();
        $topics = array_filter($topics, fn($t) => $t !== $topic);

        return self::set('topics', array_values($topics));
    }

    /**
     * Obtiene los temas excluidos
     */
    public static function getExcludedTopics(): array
    {
        return self::get('excluded_topics', []);
    }

    /**
     * Obtiene la configuracion para el frontend (sin API keys)
     */
    public static function getPublicConfig(): array
    {
        $config = self::getAll();

        // Ocultar API keys
        $config['gemini_api_key'] = !empty($config['gemini_api_key']) ? '********' : '';
        $config['openai_api_key'] = !empty($config['openai_api_key']) ? '********' : '';

        // Agregar estado
        $config['status'] = self::isConfigured();

        return $config;
    }

    /**
     * Valida la API key de Gemini
     */
    public static function validateGeminiKey(string $apiKey): array
    {
        $client = new GeminiClient($apiKey);
        return $client->testConnection();
    }

    /**
     * Obtiene opciones de tono disponibles
     */
    public static function getToneOptions(): array
    {
        return [
            'cercano' => [
                'label' => 'Cercano',
                'description' => 'Tono amigable, como hablando con un colega'
            ],
            'profesional' => [
                'label' => 'Profesional',
                'description' => 'Formal pero accesible, con autoridad'
            ],
            'tecnico' => [
                'label' => 'Tecnico',
                'description' => 'Detallado, para audiencia especializada'
            ]
        ];
    }

    /**
     * Obtiene opciones de frecuencia de busqueda
     */
    public static function getFrequencyOptions(): array
    {
        return [
            'manual' => 'Solo manual',
            'daily' => 'Diaria',
            'weekly' => 'Semanal',
            'biweekly' => 'Cada 2 semanas'
        ];
    }
}
