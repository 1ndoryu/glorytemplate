<?php

/**
 * Kamples — Servicio de análisis creativo de audio con IA
 *
 * Cadena de fallback: Groq Whisper (audio→texto) → Groq LLM (texto→JSON)
 * Whisper: whisper-large-v3 → whisper-large-v3-turbo
 * LLM Groq: openai/gpt-oss-120b → qwen/qwen3-32b → openai/gpt-oss-20b
 *
 * Analiza archivos de audio para extraer metadata CREATIVA:
 * tags, emociones, instrumentos, géneros, descripción, artistas similares.
 *
 * NO analiza BPM, tonalidad ni escala — eso lo hace AnalizadorAudio.php
 * con herramientas especializadas de procesamiento de señal.
 *
 * El prompt incluye contexto enriquecido: descripción del usuario, sus tags,
 * nombre del archivo, BPM, tonalidad y duración (calculados antes de llamar a IA).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;

class ServicioIA
{
    /* Modelos Whisper para análisis de audio (Groq Speech-to-Text) */
    private const MODELOS_WHISPER = [
        'whisper-large-v3',
        'whisper-large-v3-turbo',
    ];

    /* Modelos Groq en orden de preferencia (fallback por cuota/error) */
    private const MODELOS_GROQ = [
        'openai/gpt-oss-120b',
        'qwen/qwen3-32b',
        'openai/gpt-oss-20b',
    ];

    /* Modelos para reparación de JSON roto (contexto largo, sin audio) */
    private const MODELOS_REPARACION_JSON = [
        'openai/gpt-oss-120b',
        'moonshotai/kimi-k2-instruct-0905',
        'qwen/qwen3-32b',
        'openai/gpt-oss-20b',
    ];

    private const TIMEOUT = 30;
    private const TIMEOUT_AUDIO = 45;
    private const TIMEOUT_REPARACION = 15;
    private const MAX_TAMANO_AUDIO = 25 * 1024 * 1024; /* 25 MB free tier Groq STT */
    private const CONNECT_TIMEOUT = 8;

    /*
    * Analiza un archivo de audio y retorna metadata creativa.
    * Flujo solo Groq: Whisper (audio->texto) + LLM (texto->JSON).
     * NO incluye campos técnicos (BPM, key, escala) — esos vienen de AnalizadorAudio.
     *
     * @param string $rutaArchivo Ruta absoluta al archivo de audio
     * @param string $nombreOriginal Nombre original del archivo
     * @param string $descripcionUsuario Descripción proporcionada por el usuario
     * @param array $contextoTecnico Datos técnicos calculados previamente (bpm, key, escala, duracion, tags)
     * @return array|null Metadata creativa extraída o null si falla
     */
    public static function analizarAudio(string $rutaArchivo, string $nombreOriginal, string $descripcionUsuario = '', array $contextoTecnico = []): ?array
    {
        if (!file_exists($rutaArchivo)) {
            KamplesLogger::error('ServicioIA: Archivo no encontrado', ['ruta' => $rutaArchivo]);
            return null;
        }

        $prompt = self::construirPrompt($nombreOriginal, $descripcionUsuario, $contextoTecnico);

        /* === Flujo Groq único: STT Whisper + metadata con LLM === */
        $resultadoGroq = self::intentarGroqDesdeAudio($rutaArchivo, $prompt);
        if ($resultadoGroq !== null) {
            return $resultadoGroq;
        }

        KamplesLogger::critical('ServicioIA: Flujo Groq falló (Whisper + LLM)');
        return null;
    }

    /* ===================== GROQ AUDIO ===================== */

    /*
     * Ejecuta el flujo Groq para audio:
     * 1) Whisper transcribe audio
     * 2) LLM genera metadata creativa JSON
     */
    private static function intentarGroqDesdeAudio(string $rutaArchivo, string $promptBase): ?array
    {
        $apiKey = self::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            KamplesLogger::warning('ServicioIA: API key de Groq no configurada');
            return null;
        }

        $tamano = filesize($rutaArchivo);
        if ($tamano > self::MAX_TAMANO_AUDIO) {
            KamplesLogger::warning('ServicioIA: Archivo demasiado grande para Groq STT', ['tamano' => $tamano, 'max' => self::MAX_TAMANO_AUDIO]);
            return null;
        }

        $transcripcion = self::transcribirAudioConWhisper($rutaArchivo, $apiKey);
        if ($transcripcion === null) {
            KamplesLogger::warning('ServicioIA: No se obtuvo transcripción de audio con Whisper');
            return null;
        }

        $promptAnalisis = self::construirPromptDesdeTranscripcion($promptBase, $transcripcion);
        return self::intentarGroq($promptAnalisis, $apiKey);
    }

    /*
     * Transcribe audio con endpoint oficial Groq:
     * POST /openai/v1/audio/transcriptions (multipart/form-data)
     */
    private static function transcribirAudioConWhisper(string $rutaArchivo, string $apiKey): ?string
    {
        if (!file_exists($rutaArchivo)) {
            return null;
        }

        $url = 'https://api.groq.com/openai/v1/audio/transcriptions';
        $mimeType = self::detectarMime($rutaArchivo);

        foreach (self::MODELOS_WHISPER as $modelo) {
            KamplesLogger::info('ServicioIA: Transcribiendo audio con Groq/' . $modelo);

            $campos = [
                'model' => $modelo,
                'response_format' => 'verbose_json',
                'temperature' => '0',
            ];

            $archivo = new \CURLFile($rutaArchivo, $mimeType, basename($rutaArchivo));
            $respuestaRaw = self::peticionCurlMultipart(
                $url,
                $campos,
                'file',
                $archivo,
                ['Authorization: Bearer ' . $apiKey],
                "Groq-STT/{$modelo}",
                self::TIMEOUT_AUDIO
            );

            if ($respuestaRaw === null) {
                continue;
            }

            $respuesta = json_decode($respuestaRaw, true);
            if (!is_array($respuesta)) {
                KamplesLogger::error('ServicioIA: STT devolvió JSON inválido', [
                    'modelo' => $modelo,
                    'respuesta' => mb_substr($respuestaRaw, 0, 800),
                ]);
                continue;
            }

            $texto = trim((string) ($respuesta['text'] ?? ''));
            if ($texto !== '') {
                KamplesLogger::info('ServicioIA: Transcripción obtenida con Groq/' . $modelo, [
                    'chars' => mb_strlen($texto),
                ]);
                return $texto;
            }

            KamplesLogger::warning('ServicioIA: STT sin texto útil', ['modelo' => $modelo]);
        }

        KamplesLogger::warning('ServicioIA: Todos los modelos Whisper fallaron en STT');
        return null;
    }

    /* ===================== GROQ LLM ===================== */

    /*
    * Intenta analizar con todos los modelos LLM Groq disponibles.
    * Este paso consume texto (prompt base + contexto transcrito por Whisper).
     */
    private static function intentarGroq(string $prompt, ?string $apiKey = null): ?array
    {
        $apiKey = $apiKey ?: self::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            KamplesLogger::warning('ServicioIA: API key de Groq no configurada');
            return null;
        }

        foreach (self::MODELOS_GROQ as $modelo) {
            KamplesLogger::info('ServicioIA: Intentando Groq/' . $modelo);
            $resultado = self::llamarGroq($modelo, $apiKey, $prompt);
            if ($resultado !== null) {
                KamplesLogger::info('ServicioIA: Análisis exitoso con Groq/' . $modelo);
                return $resultado;
            }
        }

        KamplesLogger::warning('ServicioIA: Todos los modelos Groq fallaron');
        return null;
    }

    /*
     * Crea prompt final para metadata incluyendo contexto transcrito por Whisper.
     */
    private static function construirPromptDesdeTranscripcion(string $promptBase, string $transcripcion): string
    {
        $textoTranscripcion = mb_substr(trim($transcripcion), 0, 3000);

        return <<<PROMPT
{$promptBase}

Contexto adicional obtenido por transcripción de audio (Whisper):
"{$textoTranscripcion}"

Debes considerar ese contexto para inferir mejor emoción, género, instrumentos y artista_vibes.
Si hay poco contenido verbal, responde igual con un JSON válido apoyándote en el resto del contexto.
PROMPT;
    }

    /*
     * Llama a la API de Groq (OpenAI-compatible) con un modelo específico.
     */
    private static function llamarGroq(string $modelo, string $apiKey, string $prompt): ?array
    {
        $url = 'https://api.groq.com/openai/v1/chat/completions';

        $payload = [
            'model'    => $modelo,
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'Eres un experto en producción musical y clasificación de audio. Responde ÚNICAMENTE con JSON válido, sin texto adicional.',
                ],
                [
                    'role'    => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature'   => 0.2,
            'max_tokens'    => 1500,
            'response_format' => ['type' => 'json_object'],
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ];

        $respuesta = self::peticionCurl($url, $payload, $headers, "Groq/{$modelo}");
        if ($respuesta === null) return null;

        return self::parsearRespuestaGroq($respuesta);
    }

    /* ===================== PROMPT ===================== */

    /*
     * Construye el prompt enriquecido para análisis creativo de audio.
     * Incluye: nombre de archivo, descripción del usuario, tags, BPM, tonalidad, duración.
     * Estos datos técnicos se calculan ANTES de llamar a la IA (AnalizadorAudio + FFprobe).
     */
    private static function construirPrompt(string $nombreArchivo, string $descripcionUsuario, array $contextoTecnico): string
    {
        $partes = [];
        $partes[] = "El archivo se subió con este nombre: \"{$nombreArchivo}\".";

        if (!empty($descripcionUsuario)) {
            $partes[] = "El usuario ha descrito el audio de esta manera: \"{$descripcionUsuario}\".";
        }

        $tagsUsuario = $contextoTecnico['tags'] ?? [];
        if (!empty($tagsUsuario)) {
            $tagsStr = implode(', ', array_map(fn($t) => "#{$t}", $tagsUsuario));
            $partes[] = "El usuario ha colocado los siguientes tags: {$tagsStr}.";
        }

        $bpm = $contextoTecnico['bpm'] ?? null;
        if ($bpm) {
            $partes[] = "El archivo tiene un BPM de {$bpm}.";
        }

        $key = $contextoTecnico['key'] ?? null;
        $escala = $contextoTecnico['escala'] ?? null;
        if ($key) {
            $tonalidad = $key . ($escala ? " {$escala}" : '');
            $partes[] = "La tonalidad detectada es {$tonalidad}.";
        }

        $duracion = $contextoTecnico['duracion'] ?? 0;
        if ($duracion > 0) {
            $partes[] = sprintf("Dura %.1f segundos.", $duracion);
        }

        $contexto = implode(' ', $partes);

        return <<<PROMPT
Analiza este audio. {$contexto}
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

    /* ===================== PARSERS ===================== */

    /*
     * Parsea la respuesta de Groq (formato OpenAI) y extrae el JSON de metadata.
     */
    private static function parsearRespuestaGroq(string $respuestaRaw): ?array
    {
        $respuesta = json_decode($respuestaRaw, true);
        if (!$respuesta) {
            KamplesLogger::error('ServicioIA: Respuesta Groq no es JSON válido', [
                'respuesta_raw' => mb_substr($respuestaRaw, 0, 1000),
            ]);
            return null;
        }

        $texto = $respuesta['choices'][0]['message']['content'] ?? null;
        if (!$texto) {
            KamplesLogger::error('ServicioIA: Sin texto en respuesta Groq', [
                'estructura' => array_keys($respuesta),
                'error_api' => $respuesta['error'] ?? null,
            ]);
            return null;
        }

        return self::extraerJsonDeTexto($texto);
    }

    /*
     * Intenta extraer JSON de metadata desde un texto (compartido entre proveedores).
     * Estrategias en orden: parseo directo → bloque ```json → regex {} → limpieza de control chars → reparación con Groq.
     */
    private static function extraerJsonDeTexto(string $texto): ?array
    {
        /* Estrategia 1: parsear directamente */
        $metadata = json_decode($texto, true);
        if ($metadata && is_array($metadata)) {
            return self::validarMetadata($metadata);
        }

        /* Estrategia 2: extraer bloque ```json ... ``` */
        if (preg_match('/```json\s*(.*?)\s*```/s', $texto, $matches)) {
            $metadata = json_decode($matches[1], true);
            if ($metadata && is_array($metadata)) {
                return self::validarMetadata($metadata);
            }
        }

        /* Estrategia 3: extraer cualquier {} */
        $jsonCandidato = null;
        if (preg_match('/\{.*\}/s', $texto, $matches)) {
            $jsonCandidato = $matches[0];
            $metadata = json_decode($jsonCandidato, true);
            if ($metadata && is_array($metadata)) {
                return self::validarMetadata($metadata);
            }
        }

        /* Estrategia 4: limpiar caracteres de control dentro de strings JSON */
        $textoLimpio = $jsonCandidato ?? $texto;
        $textoSanitizado = self::limpiarJsonControlChars($textoLimpio);
        if ($textoSanitizado !== $textoLimpio) {
            $metadata = json_decode($textoSanitizado, true);
            if ($metadata && is_array($metadata)) {
                KamplesLogger::info('ServicioIA: JSON recuperado tras limpiar caracteres de control');
                return self::validarMetadata($metadata);
            }
        }

        /* Estrategia 5: enviar JSON roto a Groq para reparación */
        KamplesLogger::warning('ServicioIA: JSON irrecuperable localmente, intentando reparación con Groq', [
            'json_error' => json_last_error_msg(),
        ]);
        $jsonReparado = self::repararJsonConGroq($textoLimpio);
        if ($jsonReparado !== null) {
            return $jsonReparado;
        }

        KamplesLogger::error('ServicioIA: No se pudo extraer JSON incluso con reparación', [
            'texto_raw' => mb_substr($texto, 0, 1500),
            'json_error' => json_last_error_msg(),
        ]);
        return null;
    }

    /*
     * Limpia caracteres de control problemáticos dentro de strings JSON.
     * Reemplaza newlines/tabs literales dentro de valores por espacios,
     * eliminando la causa principal del error "Control character error".
     */
    private static function limpiarJsonControlChars(string $json): string
    {
        /*
         * Reemplazar caracteres de control (U+0000–U+001F) excepto los
         * que JSON ya permite escapados (\n, \r, \t → se convierten a espacio).
         * Solo dentro de strings (entre comillas).
         */
        return preg_replace_callback('/"((?:[^"\\\\]|\\\\.)*)"/s', function ($m) {
            $interior = $m[1];
            /* Reemplazar newlines/tabs/control chars literales por espacio */
            $limpio = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $interior);
            /* Normalizar espacios múltiples */
            $limpio = preg_replace('/\s{2,}/', ' ', trim($limpio));
            return '"' . $limpio . '"';
        }, $json);
    }

    /*
     * Envía JSON roto a Groq para que lo repare sin cambiar el contenido.
     * Usa modelos baratos y rápidos. Solo corrige estructura JSON, no genera nuevo contenido.
     */
    private static function repararJsonConGroq(string $jsonRoto): ?array
    {
        $apiKey = self::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            return null;
        }

        /* Truncar a 4000 chars para no agotar contexto */
        $fragmento = mb_substr($jsonRoto, 0, 4000);

        $promptReparacion = <<<PROMPT
El siguiente texto es un JSON roto generado por una IA de análisis de audio. 
Tu ÚNICA tarea es reparar la estructura JSON para que sea válido.
NO cambies el contenido, NO agregues campos, NO traduzcas. Solo repara:
- Comillas sin cerrar
- Comas sobrantes (trailing commas)
- Caracteres de control
- Strings truncados (ciérralos con texto razonable)
- Arrays/objetos sin cerrar

Responde SOLO con el JSON reparado, sin explicaciones.

JSON roto:
{$fragmento}
PROMPT;

        $url = 'https://api.groq.com/openai/v1/chat/completions';

        foreach (self::MODELOS_REPARACION_JSON as $modelo) {
            KamplesLogger::info('ServicioIA: Intentando reparación JSON con Groq/' . $modelo);

            $payload = [
                'model'    => $modelo,
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'Eres un reparador de JSON. Solo corrige la estructura, no modifiques el contenido.',
                    ],
                    [
                        'role'    => 'user',
                        'content' => $promptReparacion,
                    ],
                ],
                'temperature'     => 0.0,
                'max_tokens'      => 2000,
                'response_format' => ['type' => 'json_object'],
            ];

            $headers = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ];

            $respuesta = self::peticionCurl($url, $payload, $headers, "Groq-Reparar/{$modelo}", self::TIMEOUT_REPARACION);
            if ($respuesta === null) continue;

            $decodificado = json_decode($respuesta, true);
            $textoReparado = $decodificado['choices'][0]['message']['content'] ?? null;
            if (!$textoReparado) continue;

            $metadata = json_decode($textoReparado, true);
            if ($metadata && is_array($metadata)) {
                KamplesLogger::info('ServicioIA: JSON reparado exitosamente con Groq/' . $modelo);
                return self::validarMetadata($metadata);
            }

            /* Intentar extraer {} del texto reparado */
            if (preg_match('/\{.*\}/s', $textoReparado, $matches)) {
                $metadata = json_decode($matches[0], true);
                if ($metadata && is_array($metadata)) {
                    KamplesLogger::info('ServicioIA: JSON reparado (extraído) con Groq/' . $modelo);
                    return self::validarMetadata($metadata);
                }
            }
        }

        KamplesLogger::warning('ServicioIA: Reparación JSON con Groq falló en todos los modelos');
        return null;
    }

    /* ===================== HTTP ===================== */

    /*
    * Ejecuta una petición cURL POST con JSON.
     * Retorna el body de la respuesta o null si falla.
     */
    private static function peticionCurl(
        string $url,
        array $payload,
        array $headers,
        string $etiqueta,
        int $timeout = 0,
        ?int &$httpCodeOut = null,
        ?float &$retryAfterOut = null,
        ?string &$curlErrorOut = null
    ): ?string
    {
        $json = json_encode($payload);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
            CURLOPT_TIMEOUT        => $timeout > 0 ? $timeout : self::TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $respuesta = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $httpCodeOut = $httpCode;
        $retryAfterOut = 0.0;
        $curlErrorOut = $curlError;

        if ($curlError) {
            KamplesLogger::error("ServicioIA: cURL error ({$etiqueta})", ['error' => $curlError]);
            return null;
        }

        if ($httpCode !== 200) {
            $respuestaTexto = is_string($respuesta) ? $respuesta : '';
            $retryAfterOut = self::extraerRetryAfter($respuestaTexto);
            KamplesLogger::error("ServicioIA: HTTP {$httpCode} ({$etiqueta})", [
                'respuesta' => mb_substr($respuestaTexto, 0, 1000),
                'retryAfterSugerido' => $retryAfterOut,
                'url' => preg_replace('/key=[^&]+/', 'key=***', $url),
            ]);
            return null;
        }

        return $respuesta;
    }

    /*
     * Ejecuta POST multipart/form-data para endpoints de audio de Groq.
     */
    private static function peticionCurlMultipart(
        string $url,
        array $campos,
        string $campoArchivo,
        \CURLFile $archivo,
        array $headers,
        string $etiqueta,
        int $timeout = 0
    ): ?string {
        $payload = $campos;
        $payload[$campoArchivo] = $archivo;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
            CURLOPT_TIMEOUT => $timeout > 0 ? $timeout : self::TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $respuesta = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            KamplesLogger::error("ServicioIA: cURL error ({$etiqueta})", ['error' => $curlError]);
            return null;
        }

        if ($httpCode !== 200) {
            $respuestaTexto = is_string($respuesta) ? $respuesta : '';
            KamplesLogger::error("ServicioIA: HTTP {$httpCode} ({$etiqueta})", [
                'respuesta' => mb_substr($respuestaTexto, 0, 1000),
                'url' => $url,
            ]);
            return null;
        }

        return is_string($respuesta) ? $respuesta : null;
    }

    /*
     * Extrae segundos sugeridos de reintento desde mensaje de error API.
     * Ejemplo esperado: "Please retry in 23.71s.".
     */
    private static function extraerRetryAfter(string $respuestaRaw): float
    {
        if ($respuestaRaw === '') {
            return 0.0;
        }

        if (preg_match('/Please retry in\s*([0-9]+(?:\.[0-9]+)?)s\.?/i', $respuestaRaw, $match)) {
            return (float) $match[1];
        }

        return 0.0;
    }

    /* ===================== VALIDACIÓN ===================== */

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

    /* ===================== UTILIDADES ===================== */

    /*
     * Sanitiza un string de texto: recorta, limpia HTML y limita longitud.
     */
    private static function sanitizarTexto(mixed $texto, int $maxLen): string
    {
        if (!is_string($texto)) return '';
        $limpio = \sanitize_text_field(trim($texto));
        return mb_substr($limpio, 0, $maxLen);
    }

    /*
     * Valida un array de strings: filtra no-strings y limita tamaño.
     */
    private static function validarArrayStrings(mixed $arr, int $max): array
    {
        if (!is_array($arr)) return [];
        return array_slice(
            array_map(fn($s) => \sanitize_text_field(trim($s)), array_filter($arr, 'is_string')),
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
     * Obtiene una API key desde variables de entorno.
    * Soporta GROQ_API.
    * Valida formato de key conocida y logea advertencias.
     */
    private static function obtenerApiKey(string $nombre): ?string
    {
        $key = $_ENV[$nombre] ?? getenv($nombre) ?: null;
        if (!$key || $key === '') {
            KamplesLogger::warning("ServicioIA: API key '{$nombre}' no configurada en .env");
            return null;
        }

        /* Validar formato de keys conocidas */
        if ($nombre === 'GROQ_API' && !str_starts_with($key, 'gsk_')) {
            KamplesLogger::warning("ServicioIA: GROQ_API no tiene formato válido (debe empezar con 'gsk_')", [
                'keyPreview' => substr($key, 0, 8) . '***',
            ]);
        }

        return $key;
    }
}
