<?php

/**
 * PromptsIA — Construcción de prompts para análisis de audio con IA.
 *
 * Extraído de ServicioIA (SRP) para mantener archivos dentro del límite de 300 líneas.
 * Construye prompts enriquecidos con contexto técnico y de extracción para que los
 * modelos LLM generen metadata creativa de samples de audio.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

class PromptsIA
{
    /**
     * Construye el prompt de análisis creativo para clasificación de audio.
     * Incluye: nombre de archivo, descripción del usuario, tags, BPM, tonalidad, duración.
     */
    public static function construirAnalisis(string $nombreArchivo, string $descripcionUsuario, array $contextoTecnico): string
    {
        $partes = [];

        /* QK72: contexto de extraccion (recortes scraper) para que la IA tenga info del sample original */
        $ext = $contextoTecnico['extraccion'] ?? null;
        if (\is_array($ext) && !empty($ext)) {
            $frag = [];
            $ft = $ext['fuente_titulo'] ?? '';
            $fa = $ext['fuente_artista'] ?? '';
            if ($ft !== '') $frag[] = $fa !== '' ? "Sampled from \"{$ft}\" by {$fa}" : "Sampled from \"{$ft}\"";
            $dt = $ext['destino_titulo'] ?? '';
            $da = $ext['destino_artista'] ?? '';
            if ($dt !== '') $frag[] = $da !== '' ? "Used in \"{$dt}\" by {$da}" : "Used in \"{$dt}\"";
            if (!empty($ext['tipo_elemento'])) $frag[] = "Element: {$ext['tipo_elemento']}";
            if (!empty($ext['votos_total'])) $frag[] = "Confidence: {$ext['votos_total']} votes";
            if (!empty($frag)) {
                $partes[] = \implode(' | ', $frag) . '. This is a sample extracted from another track — analyze considering origin genre/style.';
            }
        } else {
            $partes[] = "El archivo se subió con este nombre: \"{$nombreArchivo}\".";
        }

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

{${\self::INSTRUCCIONES_CAMPOS_JSON}}
PROMPT;
    }

    /**
     * Agrega contexto de transcripción Whisper al prompt base.
     */
    public static function conTranscripcion(string $promptBase, string $transcripcion): string
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
     * C800: Prompt de corrección de metadata basado en instrucciones del admin.
     */
    public static function construirCorreccion(string $metadataJson, string $titulo, string $instrucciones, array $contextoTecnico): string
    {
        $bpmStr = isset($contextoTecnico['bpm']) ? "BPM: {$contextoTecnico['bpm']}" : '';
        $keyStr = isset($contextoTecnico['key']) ? "Key: {$contextoTecnico['key']}" : '';

        $campos = self::INSTRUCCIONES_CAMPOS_JSON;

        return <<<PROMPT
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
{$campos}
PROMPT;
    }

    /**
     * Instrucciones de campos JSON compartidas entre prompts de análisis y corrección.
     * Centralizado para evitar drift entre los dos prompts.
     */
    private const INSTRUCCIONES_CAMPOS_JSON = <<<'CAMPOS'
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
CAMPOS;
}
