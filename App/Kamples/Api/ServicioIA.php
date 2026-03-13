<?php

/**
 * ServicioIA — Orquestador de análisis creativo de audio con IA
 *
 * Cadena de fallback: Groq Whisper (audio→texto) → Groq LLM (texto→JSON)
 * Whisper: whisper-large-v3 → whisper-large-v3-turbo
 * LLM Groq: openai/gpt-oss-120b → llama-3.3-70b → kimi-k2 → qwen3-32b → llama-4-scout → gpt-oss-20b
 *
 * Analiza archivos de audio para extraer metadata CREATIVA:
 * tags, emociones, instrumentos, géneros, descripción, artistas similares.
 *
 * NO analiza BPM, tonalidad ni escala — eso lo hace AnalizadorAudio.php
 *
 * A06: Refactorizado — HTTP delegado a GroqHttpClient, parsing a JsonRepairer.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;
use App\Kamples\Api\GroqHttpClient;
use App\Kamples\Api\JsonRepairer;

class ServicioIA
{
    /* Modelos Whisper para análisis de audio (Groq Speech-to-Text) */
    private const MODELOS_WHISPER = [
        'whisper-large-v3',
        'whisper-large-v3-turbo',
    ];

    /*
     * QQ142: Modelos Groq en orden de inteligencia (fallback por cuota/error).
     * Si un modelo falla o esta rate-limited, se intenta el siguiente.
     * Todos los modelos utiles disponibles en la cuenta Groq.
     */
    private const MODELOS_GROQ = [
        'openai/gpt-oss-120b',                         /* 120B — mejor calidad, 200K tok/dia */
        'llama-3.3-70b-versatile',                      /* 70B — buena calidad, 100K tok/dia */
        'moonshotai/kimi-k2-instruct',                  /* Alta calidad, 300K tok/dia, 60 RPM */
        'qwen/qwen3-32b',                               /* 32B MoE, 500K tok/dia, 60 RPM */
        'meta-llama/llama-4-scout-17b-16e-instruct',    /* 17B x 16 expertos MoE, 500K tok/dia */
        'openai/gpt-oss-20b',                           /* 20B fallback, 200K tok/dia */
    ];

    private const TIMEOUT_AUDIO = 45;
    private const MAX_TAMANO_AUDIO = 25 * 1024 * 1024; /* 25 MB free tier Groq STT */

    /**
     * Analiza un archivo de audio y retorna metadata creativa.
     * Flujo solo Groq: Whisper (audio→texto) + LLM (texto→JSON).
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
        if (!\file_exists($rutaArchivo)) {
            KamplesLogger::error('ServicioIA: Archivo no encontrado', ['ruta' => $rutaArchivo]);
            return null;
        }

        $prompt = self::construirPrompt($nombreOriginal, $descripcionUsuario, $contextoTecnico);

        $resultadoGroq = self::intentarGroqDesdeAudio($rutaArchivo, $prompt);
        if ($resultadoGroq !== null) {
            return $resultadoGroq;
        }

        KamplesLogger::critical('ServicioIA: Flujo Groq falló (Whisper + LLM)');
        return null;
    }

    /**
     * Ejecuta el flujo Groq para audio:
     * 1) Whisper transcribe audio
     * 2) LLM genera metadata creativa JSON
     */
    private static function intentarGroqDesdeAudio(string $rutaArchivo, string $promptBase): ?array
    {
        $apiKey = GroqHttpClient::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            KamplesLogger::warning('ServicioIA: API key de Groq no configurada');
            return null;
        }

        $tamano = \filesize($rutaArchivo);
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

    /**
     * Transcribe audio con endpoint oficial Groq:
     * POST /openai/v1/audio/transcriptions (multipart/form-data)
     */
    private static function transcribirAudioConWhisper(string $rutaArchivo, string $apiKey): ?string
    {
        if (!\file_exists($rutaArchivo)) {
            return null;
        }

        $url = 'https://api.groq.com/openai/v1/audio/transcriptions';
        $mimeType = self::detectarMime($rutaArchivo);

        foreach (self::MODELOS_WHISPER as $modelo) {
            /* C356: Cortar cadena de fallback si Groq esta rate-limited (429 es cuenta completa, no por modelo) */
            if (GroqHttpClient::fueRateLimited()) {
                KamplesLogger::warning('ServicioIA: Rate limit Groq detectado, cancelando STT restante');
                return null;
            }

            KamplesLogger::info('ServicioIA: Transcribiendo audio con Groq/' . $modelo);

            $campos = [
                'model' => $modelo,
                'response_format' => 'verbose_json',
                'temperature' => '0',
            ];

            $archivo = new \CURLFile($rutaArchivo, $mimeType, \basename($rutaArchivo));
            $respuestaRaw = GroqHttpClient::peticionCurlMultipart(
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

            $respuesta = \json_decode($respuestaRaw, true);
            if (!\is_array($respuesta)) {
                KamplesLogger::error('ServicioIA: STT devolvió JSON inválido', [
                    'modelo' => $modelo,
                    'respuesta' => \mb_substr($respuestaRaw, 0, 800),
                ]);
                continue;
            }

            $texto = \trim((string) ($respuesta['text'] ?? ''));
            if ($texto !== '') {
                KamplesLogger::info('ServicioIA: Transcripción obtenida con Groq/' . $modelo, [
                    'chars' => \mb_strlen($texto),
                ]);
                return $texto;
            }

            KamplesLogger::warning('ServicioIA: STT sin texto útil', ['modelo' => $modelo]);
        }

        KamplesLogger::warning('ServicioIA: Todos los modelos Whisper fallaron en STT');
        return null;
    }

    /**
     * Intenta analizar con todos los modelos LLM Groq disponibles.
     */
    private static function intentarGroq(string $prompt, ?string $apiKey = null): ?array
    {
        $apiKey = $apiKey ?: GroqHttpClient::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            KamplesLogger::warning('ServicioIA: API key de Groq no configurada');
            return null;
        }

        foreach (self::MODELOS_GROQ as $modelo) {
            /* C356: Cortar cadena de fallback si Groq esta rate-limited */
            if (GroqHttpClient::fueRateLimited()) {
                KamplesLogger::warning('ServicioIA: Rate limit Groq detectado, cancelando LLM restante');
                return null;
            }

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

    /**
     * Crea prompt final para metadata incluyendo contexto transcrito por Whisper.
     */
    private static function construirPromptDesdeTranscripcion(string $promptBase, string $transcripcion): string
    {
        $textoTranscripcion = \mb_substr(\trim($transcripcion), 0, 3000);

        return <<<PROMPT
{$promptBase}

Contexto adicional obtenido por transcripción de audio (Whisper):
"{$textoTranscripcion}"

Debes considerar ese contexto para inferir mejor emoción, género, instrumentos y artista_vibes.
Si hay poco contenido verbal, responde igual con un JSON válido apoyándote en el resto del contexto.
PROMPT;
    }

    /**
     * Llama a la API de Groq (OpenAI-compatible) con un modelo específico.
     * HTTP delegado a GroqHttpClient, parsing a JsonRepairer.
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
            'max_tokens'    => 1500, /* QQ142: reducido de 2500 — JSON respuesta tipica usa ~500 tokens */
            'response_format' => ['type' => 'json_object'],
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ];

        $respuesta = GroqHttpClient::peticionCurl($url, $payload, $headers, "Groq/{$modelo}");
        if ($respuesta === null) return null;

        return JsonRepairer::parsearRespuestaGroq($respuesta);
    }

    /**
     * Construye el prompt enriquecido para análisis creativo de audio.
     * Incluye: nombre de archivo, descripción del usuario, tags, BPM, tonalidad, duración.
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
            $tagsStr = \implode(', ', \array_map(fn($t) => "#{$t}", $tagsUsuario));
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
            $partes[] = \sprintf("Dura %.1f segundos.", $duracion);
        }

        $contexto = \implode(' ', $partes);

        return <<<PROMPT
Analiza este audio. {$contexto}
Tu tarea es generar UNICAMENTE un objeto JSON valido con la siguiente estructura. Se creativo y preciso.
NO incluyas en tu respuesta los campos puramente tecnicos (bpm, tonalidad, escala), ya que esos se anadiran despues. Tu respuesta DEBE ser solo el JSON.

- "nombre_archivo_base": Un titulo corto y descriptivo para el sample, en ingles, en minusculas y usando espacios. Ej: "deep kick 808", "sad guitar melody".
- "tags": Array de strings con etiquetas descriptivas en INGLES (ej: "melodic", "dark", "808", "lo-fi").
- "tags_es": Array de strings con las mismas etiquetas que 'tags' pero traducidas al ESPANOL.
- "tipo": String, debe ser "one shot" o "loop".
- "genero": Array de strings con generos musicales en INGLES (ej: "hip hop", "trap", "electronic").
- "emocion": Array de strings con emociones que evoca en INGLES (ej: "energetic", "sad", "chill").
- "emocion_es": Array de strings con las mismas emociones que 'emocion' pero traducidas al ESPANOL.
- "instrumentos": Array de strings con los instrumentos principales que detectes en INGLES (ej: "guitar", "piano", "synth", "drums").
- "artista_vibes": Array de strings con nombres de artistas que tienen un estilo similar.
- "descripcion_corta": Una descripcion muy breve (10-15 palabras) en INGLES.
- "descripcion_corta_es": La misma 'descripcion_corta' traducida al ESPANOL.
- "descripcion": Una descripcion detallada (30-50 palabras) en INGLES.
- "descripcion_es": La misma 'descripcion' traducida al ESPANOL.
- "carpeta_primaria": Elige UNA de estas carpetas principales segun el tipo de audio: "Drums", "Loops", "Samples", "FX", "Instruments", "Vocals". Reglas: Si es un hit/golpe de bateria (kick, snare, hihat, clap, tom, perc) -> "Drums". Si es un patron ritmico o melodico que se repite -> "Loops". Si es un trozo de cancion o atmosfera con genero definido -> "Samples". Si es un efecto sonoro (riser, impact, sweep, atmos) -> "FX". Si es un one-shot de instrumento tonal (piano, guitarra, bajo, synth, pad) -> "Instruments". Si contiene voz humana -> "Vocals".
- "carpeta_secundaria": Subcarpeta dentro de carpeta_primaria. OBLIGATORIO, NUNCA null ni vacio. Opciones por carpeta: Drums: "Kicks","Snares","Claps","HiHats","Toms","Percussion". Loops: "Drum Loops","Perc Loops","Bass Loops","Melodic Loops". Samples: usa el genero principal (ej: "Hip Hop","Phonk","Trap","Lo-Fi","Jazz","R&B","Electronic","Pop","Rock","Reggaeton","Latin"). FX: "Impacts","Risers","Sweeps","Atmos". Instruments: "Bass","Chords","Leads","Pads","Keys","Strings". Vocals: "Phrases","One Shots","Chops". Si no encaja en ninguna subcarpeta, usa "General" como fallback.
PROMPT;
    }

    /**
     * C800: Corrige metadata generada por IA basandose en instrucciones del usuario.
     * Usa el LLM con un prompt de correccion que toma metadata actual + instrucciones.
     * Retorna la metadata corregida con la misma estructura que analizarAudio().
     *
     * @param array $metadataActual Metadata JSONB actual del sample
     * @param string $titulo Titulo actual del sample
     * @param string $instrucciones Instrucciones de correccion del usuario
     * @param array $contextoTecnico BPM, key, escala existentes
     * @return array|null Metadata corregida o null si falla
     */
    public static function corregirMetadata(array $metadataActual, string $titulo, string $instrucciones, array $contextoTecnico = []): ?array
    {
        $metadataJson = \json_encode($metadataActual, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($metadataJson === false) {
            KamplesLogger::error('ServicioIA::corregirMetadata: json_encode fallo');
            return null;
        }

        $bpmStr = isset($contextoTecnico['bpm']) ? "BPM: {$contextoTecnico['bpm']}" : '';
        $keyStr = isset($contextoTecnico['key']) ? "Key: {$contextoTecnico['key']}" : '';

        $prompt = <<<PROMPT
Tienes un sample musical con el titulo "{$titulo}". {$bpmStr} {$keyStr}

Su metadata actual generada por IA es:
```json
{$metadataJson}
```

El administrador solicita la siguiente CORRECCION:
"{$instrucciones}"

Tu tarea es corregir la metadata segun las instrucciones. Mantén la misma estructura JSON exacta.
Si las instrucciones mencionan un titulo o nombre correcto, actualiza "nombre_archivo_base" con ese nombre en ingles minusculas.
Si mencionan genero, artista, emocion u otros campos, actualiza los campos correspondientes.
Los campos que NO se mencionan en las instrucciones deben mantenerse IGUALES que la metadata actual.

IMPORTANTE: Responde UNICAMENTE con un JSON valido que tenga EXACTAMENTE estos campos:
- "nombre_archivo_base": string (titulo corto descriptivo en ingles, minusculas, con espacios)
- "tags": array de strings en INGLES
- "tags_es": array de strings en ESPANOL
- "tipo": "one shot" o "loop"
- "genero": array de strings en INGLES
- "emocion": array de strings en INGLES
- "emocion_es": array de strings en ESPANOL
- "instrumentos": array de strings en INGLES
- "artista_vibes": array de strings
- "descripcion_corta": string en INGLES (10-15 palabras)
- "descripcion_corta_es": string en ESPANOL
- "descripcion": string en INGLES (30-50 palabras)
- "descripcion_es": string en ESPANOL
- "carpeta_primaria": una de: "Drums", "Loops", "Samples", "FX", "Instruments", "Vocals"
- "carpeta_secundaria": subcarpeta segun carpeta_primaria (nunca null ni vacio)
PROMPT;

        $apiKey = GroqHttpClient::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            KamplesLogger::warning('ServicioIA::corregirMetadata: API key de Groq no configurada');
            return null;
        }

        return self::intentarGroq($prompt, $apiKey);
    }

    /**
     * Detecta el MIME type de un archivo de audio por extension.
     */
    private static function detectarMime(string $ruta): string
    {
        $ext = \strtolower(\pathinfo($ruta, PATHINFO_EXTENSION));
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
}

