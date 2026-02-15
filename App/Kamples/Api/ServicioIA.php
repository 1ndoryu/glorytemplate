<?php

/**
 * Kamples — Servicio de análisis de audio con IA (Gemini)
 *
 * Cadena de fallback: Gemini Flash 3.0 → Pro 2.5 → Flash 2.5 → Flash 2.0
 * Analiza archivos de audio para extraer: BPM, key, escala, tipo, género,
 * instrumentos, sentimiento, descripción y nombre estandarizado.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

class ServicioIA
{
    /*
     * Modelos en orden de preferencia (fallback por cuota/error).
     * Gemini Flash 3.0 es el más reciente y capaz.
     */
    private const MODELOS = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
    ];

    private const TIMEOUT = 60;
    private const MAX_TAMANO_AUDIO = 20 * 1024 * 1024; /* 20 MB para API */

    /*
     * Analiza un archivo de audio y retorna metadata estructurada.
     * Envía el audio como base64 a Gemini y parsea la respuesta JSON.
     *
     * @param string $rutaArchivo Ruta absoluta al archivo de audio
     * @param string $nombreOriginal Nombre original del archivo
     * @return array|null Metadata extraída o null si falla
     */
    public static function analizarAudio(string $rutaArchivo, string $nombreOriginal): ?array
    {
        $apiKey = self::obtenerApiKey();
        if (!$apiKey) {
            error_log('[Kamples] ServicioIA: API key de Gemini no configurada');
            return null;
        }

        if (!file_exists($rutaArchivo)) {
            error_log('[Kamples] ServicioIA: Archivo no encontrado — ' . $rutaArchivo);
            return null;
        }

        $tamano = filesize($rutaArchivo);
        if ($tamano > self::MAX_TAMANO_AUDIO) {
            error_log('[Kamples] ServicioIA: Archivo demasiado grande para análisis IA — ' . $tamano . ' bytes');
            return null;
        }

        /* Leer y codificar audio en base64 */
        $audioBytes = file_get_contents($rutaArchivo);
        if ($audioBytes === false) {
            error_log('[Kamples] ServicioIA: No se pudo leer el archivo');
            return null;
        }

        $audioBase64 = base64_encode($audioBytes);
        $mimeType = self::detectarMime($rutaArchivo);

        /* Intentar con cada modelo hasta que uno funcione */
        foreach (self::MODELOS as $modelo) {
            $resultado = self::llamarGemini($modelo, $apiKey, $audioBase64, $mimeType, $nombreOriginal);
            if ($resultado !== null) {
                error_log('[Kamples] ServicioIA: Análisis exitoso con modelo ' . $modelo);
                return $resultado;
            }
        }

        error_log('[Kamples] ServicioIA: Todos los modelos fallaron');
        return null;
    }

    /*
     * Llama a la API de Gemini con un modelo específico.
     * Retorna la metadata parseada o null si falla.
     */
    private static function llamarGemini(
        string $modelo,
        string $apiKey,
        string $audioBase64,
        string $mimeType,
        string $nombreOriginal
    ): ?array {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelo}:generateContent?key={$apiKey}";

        $prompt = self::construirPrompt($nombreOriginal);

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data'      => $audioBase64,
                            ],
                        ],
                        [
                            'text' => $prompt,
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature'     => 0.1,
                'maxOutputTokens' => 1024,
                'responseMimeType' => 'application/json',
            ],
        ];

        $json = json_encode($payload);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => self::TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $respuesta = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            error_log("[Kamples] ServicioIA: cURL error ({$modelo}) — {$curlError}");
            return null;
        }

        if ($httpCode !== 200) {
            error_log("[Kamples] ServicioIA: HTTP {$httpCode} ({$modelo}) — " . substr($respuesta, 0, 500));
            return null;
        }

        return self::parsearRespuesta($respuesta);
    }

    /*
     * Construye el prompt para el análisis de audio.
     * Pide respuesta en JSON estricto con los campos necesarios.
     */
    private static function construirPrompt(string $nombreArchivo): string
    {
        return <<<PROMPT
Analiza este archivo de audio "{$nombreArchivo}" y responde EXCLUSIVAMENTE con un JSON válido con esta estructura exacta:

{
  "bpm": (número entero o null si no aplica),
  "key": (nota musical: "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" o null),
  "escala": ("mayor" o "menor" o null),
  "tipo": ("loop", "oneshot", "fx", "vocal", "stem" o "otro"),
  "genero": (array de strings, máx 3 géneros musicales),
  "instrumentos": (array de strings, instrumentos detectados),
  "sentimiento": (array de strings, máx 3 sentimientos/moods),
  "descripcion": (string, descripción breve en español, máx 100 chars),
  "nombreSugerido": (string, nombre estandarizado formato: "Tipo_Genero_BPM_Key_Descriptor", ej: "Loop_Trap_140_Cm_DarkPad")
}

Reglas:
- BPM debe ser preciso (si es rítmico). Si es ambiental/pad sin ritmo claro, null.
- Key y escala: detectar la tonalidad principal. Si no es tonal, null.
- Tipo: "loop" si se repite, "oneshot" si es un golpe/nota, "fx" si es efecto, "vocal" si tiene voz, "stem" si es una pista aislada.
- Géneros en minúsculas y en español cuando haya traducción directa (ej: "trap", "house", "hip hop", "electrónica").
- Instrumentos en español (ej: "bajo", "batería", "sintetizador", "guitarra", "piano").
- Sentimientos en español (ej: "oscuro", "energético", "melancólico", "alegre").
- El nombreSugerido usa PascalCase sin espacios, con guiones bajos separando secciones.
PROMPT;
    }

    /*
     * Parsea la respuesta de Gemini y extrae el JSON de metadata.
     */
    private static function parsearRespuesta(string $respuestaRaw): ?array
    {
        $respuesta = json_decode($respuestaRaw, true);
        if (!$respuesta) {
            error_log('[Kamples] ServicioIA: Respuesta no es JSON válido');
            return null;
        }

        /* Extraer texto de la respuesta */
        $texto = $respuesta['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (!$texto) {
            error_log('[Kamples] ServicioIA: Sin texto en respuesta');
            return null;
        }

        /* Intentar parsear directamente */
        $metadata = json_decode($texto, true);
        if ($metadata && is_array($metadata)) {
            return self::validarMetadata($metadata);
        }

        /* Intentar extraer JSON de un bloque ```json ... ``` */
        if (preg_match('/```json\s*(.*?)\s*```/s', $texto, $matches)) {
            $metadata = json_decode($matches[1], true);
            if ($metadata && is_array($metadata)) {
                return self::validarMetadata($metadata);
            }
        }

        /* Intentar extraer cualquier {} */
        if (preg_match('/\{.*\}/s', $texto, $matches)) {
            $metadata = json_decode($matches[0], true);
            if ($metadata && is_array($metadata)) {
                return self::validarMetadata($metadata);
            }
        }

        error_log('[Kamples] ServicioIA: No se pudo extraer JSON de la respuesta');
        return null;
    }

    /*
     * Valida y normaliza la metadata extraída por la IA.
     * Asegura que los campos existan con tipos correctos.
     */
    private static function validarMetadata(array $data): array
    {
        $notasValidas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        $tiposValidos = ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'];
        $escalasValidas = ['mayor', 'menor'];

        $bpm = isset($data['bpm']) && is_numeric($data['bpm']) ? (int) $data['bpm'] : null;
        if ($bpm !== null && ($bpm < 20 || $bpm > 300)) {
            $bpm = null;
        }

        $key = isset($data['key']) && in_array($data['key'], $notasValidas, true)
            ? $data['key'] : null;

        $escala = isset($data['escala']) && in_array($data['escala'], $escalasValidas, true)
            ? $data['escala'] : null;

        $tipo = isset($data['tipo']) && in_array($data['tipo'], $tiposValidos, true)
            ? $data['tipo'] : 'otro';

        return [
            'bpm'             => $bpm,
            'key'             => $key,
            'escala'          => $escala,
            'tipo'            => $tipo,
            'genero'          => self::validarArrayStrings($data['genero'] ?? [], 3),
            'instrumentos'    => self::validarArrayStrings($data['instrumentos'] ?? [], 10),
            'sentimiento'     => self::validarArrayStrings($data['sentimiento'] ?? [], 3),
            'descripcion'     => substr(sanitize_text_field($data['descripcion'] ?? ''), 0, 200),
            'nombreSugerido'  => sanitize_file_name($data['nombreSugerido'] ?? ''),
        ];
    }

    /*
     * Valida un array de strings: filtra no-strings y limita tamaño.
     */
    private static function validarArrayStrings(mixed $arr, int $max): array
    {
        if (!is_array($arr)) return [];
        return array_slice(
            array_map('sanitize_text_field', array_filter($arr, 'is_string')),
            0,
            $max
        );
    }

    /*
     * Detecta el MIME type de un archivo de audio.
     */
    private static function detectarMime(string $ruta): string
    {
        $ext = strtolower(pathinfo($ruta, PATHINFO_EXTENSION));
        return match ($ext) {
            'wav'        => 'audio/wav',
            'mp3'        => 'audio/mpeg',
            'flac'       => 'audio/flac',
            'aiff', 'aif' => 'audio/aiff',
            default      => 'audio/wav',
        };
    }

    /*
     * Obtiene la API key de Gemini desde variables de entorno.
     */
    private static function obtenerApiKey(): ?string
    {
        $key = $_ENV['GOOGLE_GEMINI_API'] ?? getenv('GOOGLE_GEMINI_API') ?: null;
        if (!$key || $key === '') {
            return null;
        }
        return $key;
    }
}
