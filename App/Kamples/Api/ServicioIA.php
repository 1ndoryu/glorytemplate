<?php

/**
 * Kamples — Servicio de análisis creativo de audio con IA (Gemini)
 *
 * Cadena de fallback: gemini-2.5-flash → gemini-2.5-pro → gemini-2.0-flash
 * Analiza archivos de audio para extraer metadata CREATIVA:
 * tags, emociones, instrumentos, géneros, descripción, artistas similares.
 *
 * NO analiza BPM, tonalidad ni escala — eso lo hace AnalizadorAudio.php
 * con herramientas especializadas de procesamiento de señal.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

class ServicioIA
{
    /*
     * Modelos en orden de preferencia (fallback por cuota/error).
     */
    private const MODELOS = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
    ];

    private const TIMEOUT = 60;
    private const MAX_TAMANO_AUDIO = 20 * 1024 * 1024; /* 20 MB para API */

    /*
     * Analiza un archivo de audio y retorna metadata creativa.
     * Envía el audio como base64 a Gemini y parsea la respuesta JSON.
     * NO incluye campos técnicos (BPM, key, escala) — esos vienen de AnalizadorAudio.
     *
     * @param string $rutaArchivo Ruta absoluta al archivo de audio
     * @param string $nombreOriginal Nombre original del archivo
     * @param string $descripcionUsuario Descripción proporcionada por el usuario (opcional)
     * @return array|null Metadata creativa extraída o null si falla
     */
    public static function analizarAudio(string $rutaArchivo, string $nombreOriginal, string $descripcionUsuario = ''): ?array
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

        $audioBytes = file_get_contents($rutaArchivo);
        if ($audioBytes === false) {
            error_log('[Kamples] ServicioIA: No se pudo leer el archivo');
            return null;
        }

        $audioBase64 = base64_encode($audioBytes);
        $mimeType = self::detectarMime($rutaArchivo);

        /* Intentar con cada modelo hasta que uno funcione */
        foreach (self::MODELOS as $modelo) {
            $resultado = self::llamarGemini($modelo, $apiKey, $audioBase64, $mimeType, $nombreOriginal, $descripcionUsuario);
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
     */
    private static function llamarGemini(
        string $modelo,
        string $apiKey,
        string $audioBase64,
        string $mimeType,
        string $nombreOriginal,
        string $descripcionUsuario
    ): ?array {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelo}:generateContent?key={$apiKey}";

        $prompt = self::construirPrompt($nombreOriginal, $descripcionUsuario);

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
                'temperature'      => 0.2,
                'maxOutputTokens'  => 1500,
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
     * Construye el prompt para análisis creativo de audio.
     * Excluye campos técnicos (BPM, tonalidad, escala) que se calculan aparte.
     */
    private static function construirPrompt(string $nombreArchivo, string $descripcionUsuario): string
    {
        $promptContext = "Archivo: \"{$nombreArchivo}\".";
        if (!empty($descripcionUsuario)) {
            $promptContext .= " Contexto del usuario: \"{$descripcionUsuario}\".";
        }

        return <<<PROMPT
Analiza este audio. {$promptContext}
Tu tarea es generar ÚNICAMENTE un objeto JSON válido con la siguiente estructura. Sé creativo y preciso.
NO incluyas en tu respuesta los campos puramente técnicos (bpm, tonalidad, escala), ya que esos se añadirán después. Tu respuesta DEBE ser solo el JSON.

- "nombre_archivo_base": Un título corto y descriptivo para el sample, en inglés, en minúsculas y usando espacios. Ej: "deep kick 808", "sad guitar melody".
- "tags": Array de strings con etiquetas descriptivas en INGLÉS (ej: "melodic", "dark", "808", "lo-fi").
- "tags_es": Array de strings con las mismas etiquetas que 'tags' pero traducidas al ESPAÑOL.
- "tipo": String, debe ser "one shot" o "loop".
- "genero": Array de strings con géneros musicales en INGLÉS (ej: "hip hop", "trap", "electronic").
- "emocion": Array de strings con emociones que evoca en INGLÉS (ej: "energetic", "sad", "chill").
- "emocion_es": Array de strings con las mismas emociones que 'emocion' pero traducidas al ESPAÑOL.
- "instrumentos": Array de strings con los instrumentos principales que detectes en INGLÉS (ej: "guitar", "piano", "synth", "drums").
- "artista_vibes": Array de strings con nombres de artistas que tienen un estilo similar.
- "descripcion_corta": Una descripción muy breve (10-15 palabras) en INGLÉS.
- "descripcion_corta_es": La misma 'descripcion_corta' traducida al ESPAÑOL.
- "descripcion": Una descripción detallada (30-50 palabras) en INGLÉS.
- "descripcion_es": La misma 'descripcion' traducida al ESPAÑOL.
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
     * Valida y normaliza la metadata creativa extraída por la IA.
     * Solo valida campos creativos, NO campos técnicos.
     */
    private static function validarMetadata(array $data): array
    {
        $tiposValidos = ['one shot', 'loop'];

        $tipo = isset($data['tipo']) && in_array(strtolower($data['tipo']), $tiposValidos, true)
            ? strtolower($data['tipo'])
            : 'one shot';

        return [
            'nombre_archivo_base'  => self::sanitizarTexto($data['nombre_archivo_base'] ?? '', 80),
            'tags'                 => self::validarArrayStrings($data['tags'] ?? [], 15),
            'tags_es'              => self::validarArrayStrings($data['tags_es'] ?? [], 15),
            'tipo'                 => $tipo,
            'genero'               => self::validarArrayStrings($data['genero'] ?? [], 5),
            'emocion'              => self::validarArrayStrings($data['emocion'] ?? [], 5),
            'emocion_es'           => self::validarArrayStrings($data['emocion_es'] ?? [], 5),
            'instrumentos'         => self::validarArrayStrings($data['instrumentos'] ?? [], 10),
            'artista_vibes'        => self::validarArrayStrings($data['artista_vibes'] ?? [], 5),
            'descripcion_corta'    => self::sanitizarTexto($data['descripcion_corta'] ?? '', 150),
            'descripcion_corta_es' => self::sanitizarTexto($data['descripcion_corta_es'] ?? '', 150),
            'descripcion'          => self::sanitizarTexto($data['descripcion'] ?? '', 500),
            'descripcion_es'       => self::sanitizarTexto($data['descripcion_es'] ?? '', 500),
        ];
    }

    /*
     * Sanitiza un string de texto: recorta, limpia HTML y limita longitud.
     */
    private static function sanitizarTexto(mixed $texto, int $maxLen): string
    {
        if (!is_string($texto)) return '';
        $limpio = sanitize_text_field(trim($texto));
        return mb_substr($limpio, 0, $maxLen);
    }

    /*
     * Valida un array de strings: filtra no-strings y limita tamaño.
     */
    private static function validarArrayStrings(mixed $arr, int $max): array
    {
        if (!is_array($arr)) return [];
        return array_slice(
            array_map(fn($s) => sanitize_text_field(trim($s)), array_filter($arr, 'is_string')),
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
            'wav'          => 'audio/wav',
            'mp3'          => 'audio/mpeg',
            'flac'         => 'audio/flac',
            'aiff', 'aif'  => 'audio/aiff',
            'ogg'          => 'audio/ogg',
            'm4a'          => 'audio/mp4',
            default        => 'audio/wav',
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
