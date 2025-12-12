<?php

/**
 * GeminiLogger - Sistema de logging para peticiones a la API de Gemini
 * 
 * Registra todas las peticiones y respuestas de la API de Gemini
 * para diagnostico y verificacion del grounding (fuentes de internet).
 * 
 * Logs se almacenan en la tabla de opciones de WordPress y/o archivo.
 * 
 * @package Glory\Services\ContentAI
 */

namespace App\Services\ContentAI;

class GeminiLogger
{
    // Clave para almacenar logs en opciones de WP
    private const OPTION_KEY = 'glory_ai_gemini_logs';

    // Maximo de logs a mantener en la opcion
    private const MAX_LOGS = 50;

    // Directorio de logs (relativo a wp-content)
    private const LOG_DIR = 'glory-ai-logs';

    // Si el logging esta habilitado
    private static bool $enabled = true;

    /**
     * Habilita o deshabilita el logging
     */
    public static function setEnabled(bool $enabled): void
    {
        self::$enabled = $enabled;
    }

    /**
     * Registra el inicio de una peticion
     * 
     * @param string $action Accion de la API (generateContent, etc)
     * @param array $body Body de la peticion
     * @return string ID unico del log
     */
    public static function logRequest(string $action, array $body): string
    {
        if (!self::$enabled) {
            return '';
        }

        $logId = uniqid('gemini_', true);
        $timestamp = current_time('mysql');

        $logEntry = [
            'id' => $logId,
            'type' => 'request',
            'action' => $action,
            'timestamp_start' => $timestamp,
            'model' => $body['generationConfig']['model'] ?? 'gemini-2.5-flash',
            'prompt' => self::extractPromptFromBody($body),
            'has_grounding' => isset($body['tools']),
            'system_instruction' => self::extractSystemInstruction($body),
            'config' => $body['generationConfig'] ?? null,
        ];

        // Log a archivo
        self::writeToFile($logEntry, 'REQUEST');

        // Almacenar temporalmente para asociar con respuesta
        set_transient('gemini_log_' . $logId, $logEntry, 300); // 5 minutos

        return $logId;
    }

    /**
     * Registra la respuesta de una peticion
     * 
     * @param string $logId ID del log de la peticion
     * @param array|null $response Respuesta de la API (null si error)
     * @param string|null $error Mensaje de error si aplica
     * @param int $httpStatus Codigo HTTP de respuesta
     */
    public static function logResponse(
        string $logId,
        ?array $response,
        ?string $error = null,
        int $httpStatus = 200
    ): void {
        if (!self::$enabled || empty($logId)) {
            return;
        }

        $requestLog = get_transient('gemini_log_' . $logId);
        $timestampEnd = current_time('mysql');

        $logEntry = [
            'id' => $logId,
            'type' => 'response',
            'timestamp_end' => $timestampEnd,
            'http_status' => $httpStatus,
            'success' => $error === null && $httpStatus === 200,
            'error' => $error,
        ];

        if ($response && isset($response['candidates'][0])) {
            $candidate = $response['candidates'][0];

            // Contenido generado (truncado para el log)
            $text = $candidate['content']['parts'][0]['text'] ?? '';
            $logEntry['content_preview'] = mb_substr($text, 0, 500) . (mb_strlen($text) > 500 ? '...' : '');
            $logEntry['content_length'] = mb_strlen($text);

            // Metadata de grounding (MUY IMPORTANTE para verificar busquedas)
            $groundingMetadata = $candidate['groundingMetadata'] ?? null;
            if ($groundingMetadata) {
                $logEntry['grounding'] = [
                    'search_queries' => $groundingMetadata['webSearchQueries'] ?? [],
                    'sources_count' => count($groundingMetadata['groundingChunks'] ?? []),
                    'sources' => self::extractSources($groundingMetadata),
                    'support_score' => $groundingMetadata['groundingSupport'] ?? null,
                ];
            } else {
                $logEntry['grounding'] = null;
            }

            // Token usage si esta disponible
            if (isset($response['usageMetadata'])) {
                $logEntry['tokens'] = [
                    'prompt' => $response['usageMetadata']['promptTokenCount'] ?? null,
                    'response' => $response['usageMetadata']['candidatesTokenCount'] ?? null,
                    'total' => $response['usageMetadata']['totalTokenCount'] ?? null,
                ];
            }
        }

        // Combinar con datos de la peticion si existen
        if ($requestLog) {
            $logEntry['request'] = [
                'action' => $requestLog['action'] ?? 'unknown',
                'timestamp_start' => $requestLog['timestamp_start'] ?? null,
                'prompt_preview' => mb_substr($requestLog['prompt'] ?? '', 0, 200),
                'had_grounding' => $requestLog['has_grounding'] ?? false,
            ];

            // Calcular duracion
            if (isset($requestLog['timestamp_start'])) {
                $start = strtotime($requestLog['timestamp_start']);
                $end = strtotime($timestampEnd);
                $logEntry['duration_seconds'] = $end - $start;
            }
        }

        // Log a archivo
        self::writeToFile($logEntry, 'RESPONSE');

        // Guardar en opciones de WP
        self::saveToDatabase($logEntry);

        // Limpiar transient
        delete_transient('gemini_log_' . $logId);
    }

    /**
     * Obtiene los ultimos logs
     * 
     * @param int $limit Cantidad maxima de logs a obtener
     * @return array
     */
    public static function getLogs(int $limit = 20): array
    {
        $logs = get_option(self::OPTION_KEY, []);
        return array_slice($logs, 0, $limit);
    }

    /**
     * Obtiene un log especifico por ID
     */
    public static function getLog(string $logId): ?array
    {
        $logs = get_option(self::OPTION_KEY, []);
        foreach ($logs as $log) {
            if (($log['id'] ?? '') === $logId) {
                return $log;
            }
        }
        return null;
    }

    /**
     * Limpia todos los logs
     */
    public static function clearLogs(): bool
    {
        return delete_option(self::OPTION_KEY);
    }

    /**
     * Obtiene estadisticas de los logs
     */
    public static function getStats(): array
    {
        $logs = get_option(self::OPTION_KEY, []);

        $stats = [
            'total_requests' => count($logs),
            'successful' => 0,
            'failed' => 0,
            'with_grounding' => 0,
            'without_grounding' => 0,
            'avg_duration' => 0,
            'total_tokens' => 0,
        ];

        $durations = [];

        foreach ($logs as $log) {
            if ($log['success'] ?? false) {
                $stats['successful']++;
            } else {
                $stats['failed']++;
            }

            if (isset($log['grounding']) && $log['grounding'] !== null) {
                $stats['with_grounding']++;
            } else {
                $stats['without_grounding']++;
            }

            if (isset($log['duration_seconds'])) {
                $durations[] = $log['duration_seconds'];
            }

            if (isset($log['tokens']['total'])) {
                $stats['total_tokens'] += $log['tokens']['total'];
            }
        }

        if (!empty($durations)) {
            $stats['avg_duration'] = round(array_sum($durations) / count($durations), 2);
        }

        return $stats;
    }

    /**
     * Extrae el prompt del body de la peticion
     */
    private static function extractPromptFromBody(array $body): string
    {
        if (isset($body['contents'][0]['parts'][0]['text'])) {
            return $body['contents'][0]['parts'][0]['text'];
        }
        return '';
    }

    /**
     * Extrae las instrucciones del sistema
     */
    private static function extractSystemInstruction(array $body): ?string
    {
        if (isset($body['systemInstruction']['parts'][0]['text'])) {
            return $body['systemInstruction']['parts'][0]['text'];
        }
        return null;
    }

    /**
     * Extrae fuentes del grounding metadata
     */
    private static function extractSources(array $groundingMetadata): array
    {
        $sources = [];
        $chunks = $groundingMetadata['groundingChunks'] ?? [];

        foreach ($chunks as $chunk) {
            if (isset($chunk['web'])) {
                $sources[] = [
                    'url' => $chunk['web']['uri'] ?? '',
                    'title' => $chunk['web']['title'] ?? '',
                ];
            }
        }

        return $sources;
    }

    /**
     * Escribe log a archivo
     */
    private static function writeToFile(array $entry, string $type): void
    {
        $logDir = WP_CONTENT_DIR . '/' . self::LOG_DIR;

        // Crear directorio si no existe
        if (!file_exists($logDir)) {
            wp_mkdir_p($logDir);

            // Crear .htaccess para proteger logs
            file_put_contents($logDir . '/.htaccess', 'Deny from all');
        }

        $logFile = $logDir . '/gemini-' . date('Y-m-d') . '.log';
        $timestamp = current_time('Y-m-d H:i:s');

        // Formato de log legible
        $logLine = "[{$timestamp}] {$type} ";
        $logLine .= json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $logLine .= "\n" . str_repeat('-', 80) . "\n";

        file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    }

    /**
     * Guarda log en la base de datos (opcion de WP)
     */
    private static function saveToDatabase(array $entry): void
    {
        $logs = get_option(self::OPTION_KEY, []);

        // Agregar al inicio
        array_unshift($logs, $entry);

        // Mantener solo los ultimos N logs
        $logs = array_slice($logs, 0, self::MAX_LOGS);

        update_option(self::OPTION_KEY, $logs, false); // No autoload
    }

    /**
     * Obtiene la ruta del directorio de logs
     */
    public static function getLogDirectory(): string
    {
        return WP_CONTENT_DIR . '/' . self::LOG_DIR;
    }

    /**
     * Lista archivos de log disponibles
     */
    public static function getLogFiles(): array
    {
        $logDir = self::getLogDirectory();

        if (!file_exists($logDir)) {
            return [];
        }

        $files = glob($logDir . '/gemini-*.log');
        $result = [];

        foreach ($files as $file) {
            $result[] = [
                'name' => basename($file),
                'path' => $file,
                'size' => filesize($file),
                'modified' => filemtime($file),
            ];
        }

        // Ordenar por fecha descendente
        usort($result, fn($a, $b) => $b['modified'] - $a['modified']);

        return $result;
    }

    /**
     * Obtiene el contenido de un archivo de log
     */
    public static function getLogFileContent(string $filename, int $lines = 100): ?string
    {
        $logDir = self::getLogDirectory();
        $filePath = $logDir . '/' . basename($filename); // Sanitizar nombre

        if (!file_exists($filePath)) {
            return null;
        }

        // Leer ultimas N lineas
        $file = new \SplFileObject($filePath);
        $file->seek(PHP_INT_MAX);
        $totalLines = $file->key();

        $startLine = max(0, $totalLines - $lines);
        $content = [];

        $file->seek($startLine);
        while (!$file->eof()) {
            $content[] = $file->fgets();
        }

        return implode('', $content);
    }
}
