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
        'custom_model' => '',
        'temperature' => 0.7,
        'system_prompt' => '',
        'excluded_sources' => [],
        'tone' => 'cercano',
        'word_count' => 1000,
        'topics' => ['chatbots', 'whatsapp business', 'automatizacion', 'ia para empresas'],
        'excluded_topics' => [],
        'auto_search_enabled' => false,
        'search_frequency' => 'daily',
        'schedule_hour' => 9,
        'schedule_minute' => 0,
        'schedule_day_of_week' => 1,
        'schedule_day_of_month' => 1,
        'notification_enabled' => false,
        'notification_email' => '',
        'notification_on_error' => true,
        'notification_on_success' => true,
        'last_search' => null,
        'last_execution' => null,
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

        // Agregar proxima ejecucion si la programacion esta habilitada
        if ($config['auto_search_enabled']) {
            $config['next_execution'] = self::getNextScheduledExecution();
        } else {
            $config['next_execution'] = null;
        }

        return $config;
    }

    /**
     * Calcula la proxima ejecucion programada
     */
    public static function getNextScheduledExecution(): ?string
    {
        $enabled = self::get('auto_search_enabled', false);
        if (!$enabled) {
            return null;
        }

        $frequency = self::get('search_frequency', 'daily');
        $hour = (int) self::get('schedule_hour', 9);
        $minute = (int) self::get('schedule_minute', 0);
        $dayOfWeek = (int) self::get('schedule_day_of_week', 1);
        $dayOfMonth = (int) self::get('schedule_day_of_month', 1);

        $timezone = wp_timezone();
        $now = new \DateTime('now', $timezone);

        switch ($frequency) {
            case 'hourly':
                $next = clone $now;
                $next->modify('+1 hour');
                $next->setTime((int)$next->format('H'), 0, 0);
                break;

            case 'twice_daily':
                $next = clone $now;
                $currentHour = (int) $now->format('H');
                if ($currentHour < $hour) {
                    $next->setTime($hour, $minute, 0);
                } elseif ($currentHour < ($hour + 12)) {
                    $next->setTime($hour + 12, $minute, 0);
                } else {
                    $next->modify('+1 day');
                    $next->setTime($hour, $minute, 0);
                }
                break;

            case 'daily':
                $next = clone $now;
                $next->setTime($hour, $minute, 0);
                if ($next <= $now) {
                    $next->modify('+1 day');
                }
                break;

            case 'weekly':
                $next = clone $now;
                $next->setTime($hour, $minute, 0);
                $currentDow = (int) $now->format('N');
                $daysUntil = ($dayOfWeek - $currentDow + 7) % 7;
                if ($daysUntil === 0 && $next <= $now) {
                    $daysUntil = 7;
                }
                $next->modify("+{$daysUntil} days");
                break;

            case 'biweekly':
                $next = clone $now;
                $next->setTime($hour, $minute, 0);
                $currentDow = (int) $now->format('N');
                $daysUntil = ($dayOfWeek - $currentDow + 7) % 7;
                if ($daysUntil === 0 && $next <= $now) {
                    $daysUntil = 14;
                }
                $next->modify("+{$daysUntil} days");
                break;

            case 'monthly':
                $next = clone $now;
                $next->setDate((int)$next->format('Y'), (int)$next->format('m'), $dayOfMonth);
                $next->setTime($hour, $minute, 0);
                if ($next <= $now) {
                    $next->modify('+1 month');
                }
                break;

            default:
                return null;
        }

        return $next->format('Y-m-d H:i:s');
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
