<?php

/**
 * Kamples — Pipeline de procesamiento de audio
 *
 * Procesa un sample después de subirse:
 * 1. Verificar que FFmpeg esté disponible (OBLIGATORIO)
 * 2. Calcular duración real (FFprobe)
 * 3. Análisis técnico: BPM + key con AnalizadorAudio (no IA)
 * 4. Análisis creativo: tags, emociones, etc. con ServicioIA (Gemini)
 * 5. Generar waveform peaks JSON
 * 6. Generar MP3 optimizado + preview
 * 7. Renombrar archivo con formato estandarizado
 * 8. Actualizar registro en PostgreSQL + estado 'activo'
 *
 * FFmpeg es OBLIGATORIO. Si no se encuentra, el pipeline falla con error claro.
 * Detecta automáticamente Windows y Linux.
 *
 * TO-DO: mover a background con wp_schedule_single_event() cuando el volumen crezca.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\Database\PostgresService;
use App\Kamples\LogIA as KamplesLogger;

class PipelineAudio
{
    private const PREVIEW_DURACION = 30;
    private const WAVEFORM_BARRAS = 120;

    /* Cache del binario FFmpeg detectado */
    private static ?string $ffmpegBin = null;
    private static ?string $ffprobeBin = null;

    /*
     * Ejecuta el pipeline completo para un sample.
     *
     * @param int $sampleId ID del sample en PostgreSQL
     * @param string $rutaArchivo Ruta absoluta al archivo original
     * @param string $nombreOriginal Nombre original subido por el usuario
     * @param string $idCorto ID corto del sample (ej: "a3Kf9x2")
     * @param string $descripcionUsuario Descripción del usuario (para contexto IA)
     * @param array $tagsUsuario Tags proporcionados por el usuario (#hashtags)
     * @throws \RuntimeException Si FFmpeg no está disponible
     */
    public static function procesar(int $sampleId, string $rutaArchivo, string $nombreOriginal, string $idCorto, string $descripcionUsuario = '', array $tagsUsuario = []): void
    {
        KamplesLogger::info("Pipeline: Iniciando procesamiento", [
            'sampleId' => $sampleId,
            'archivo' => basename($rutaArchivo),
            'idCorto' => $idCorto,
            'tagsCount' => count($tagsUsuario),
        ]);

        /* Paso 0: Verificar FFmpeg (OBLIGATORIO) */
        $ffmpeg = self::obtenerFFmpeg();
        $ffprobe = self::obtenerFFprobe();

        if (!$ffmpeg) {
            KamplesLogger::critical('Pipeline: FFmpeg NO encontrado', [
                'os' => PHP_OS,
                'instruccion' => self::esWindows()
                    ? 'Descargar de https://ffmpeg.org/download.html y agregar al PATH'
                    : 'Instalar con: sudo apt install ffmpeg',
            ]);
            throw new \RuntimeException('FFmpeg es obligatorio para procesar audio. No se encontró en el sistema.');
        }

        $directorio = dirname($rutaArchivo);
        $extension = strtolower(pathinfo($rutaArchivo, PATHINFO_EXTENSION));
        $actualizaciones = [];

        /* Paso 1: Duración real con FFprobe */
        $duracion = self::calcularDuracion($rutaArchivo, $ffprobe ?: $ffmpeg);
        if ($duracion > 0) {
            $actualizaciones['duracion'] = $duracion;
        }

        /* Paso 2: Análisis técnico — BPM + key con herramientas de señal (NO IA) */
        $analisisTecnico = AnalizadorAudio::analizar($rutaArchivo, $ffmpeg);
        $actualizaciones['bpm'] = $analisisTecnico['bpm'];
        $actualizaciones['key'] = $analisisTecnico['key'];
        $actualizaciones['escala'] = $analisisTecnico['escala'];

        KamplesLogger::info('Pipeline: Análisis técnico completado', [
            'bpm' => $analisisTecnico['bpm'],
            'key' => $analisisTecnico['key'],
            'escala' => $analisisTecnico['escala'],
        ]);

        /* Paso 3: Análisis creativo — tags, emociones, etc. con IA (Gemini + Groq fallback) */
        $contextoTecnico = [
            'bpm'      => $analisisTecnico['bpm'],
            'key'      => $analisisTecnico['key'],
            'escala'   => $analisisTecnico['escala'],
            'duracion' => $duracion ?? 0,
            'tags'     => $tagsUsuario,
        ];
        $metadataIA = ServicioIA::analizarAudio($rutaArchivo, $nombreOriginal, $descripcionUsuario, $contextoTecnico);

        if ($metadataIA) {
            KamplesLogger::info('Pipeline: IA completada', ['tipo' => $metadataIA['tipo']]);

            /* Normalizar tipo para cumplir CHECK constraint (loop|oneshot|fx|vocal|stem|otro) */
            $tipoRaw = strtolower(str_replace([' ', '-'], '', $metadataIA['tipo'] ?? ''));
            $tiposValidos = ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'];
            $actualizaciones['tipo'] = in_array($tipoRaw, $tiposValidos, true) ? $tipoRaw : 'otro';

            /* Guardar toda la metadata creativa + confianza técnica en JSONB */
            $actualizaciones['metadata'] = json_encode([
                'nombre_archivo_base'  => $metadataIA['nombre_archivo_base'],
                'tags'                 => $metadataIA['tags'],
                'tags_es'              => $metadataIA['tags_es'],
                'genero'               => $metadataIA['genero'],
                'emocion'              => $metadataIA['emocion'],
                'emocion_es'           => $metadataIA['emocion_es'],
                'instrumentos'         => $metadataIA['instrumentos'],
                'artista_vibes'        => $metadataIA['artista_vibes'],
                'descripcion_corta'    => $metadataIA['descripcion_corta'],
                'descripcion_corta_es' => $metadataIA['descripcion_corta_es'],
                'descripcion'          => $metadataIA['descripcion'],
                'descripcion_es'       => $metadataIA['descripcion_es'],
                'bpm_confianza'        => $analisisTecnico['bpm_confianza'],
                'key_confianza'        => $analisisTecnico['key_confianza'],
            ]);
        }

        /* Paso 4: Renombrar archivo con formato estandarizado + actualizar titulo y slug */
        $nuevoNombre = self::construirNombreArchivo(
            $metadataIA,
            $analisisTecnico,
            $idCorto,
            $extension
        );

        if ($nuevoNombre) {
            $nuevaRuta = $directorio . '/' . $nuevoNombre;
            if ($nuevaRuta !== $rutaArchivo && !file_exists($nuevaRuta)) {
                if (rename($rutaArchivo, $nuevaRuta)) {
                    $rutaArchivo = $nuevaRuta;
                    $actualizaciones['ruta_original'] = $nuevaRuta;
                    KamplesLogger::info('Pipeline: Archivo renombrado', ['nombre' => $nuevoNombre]);
                }
            }

            /*
             * Actualizar titulo y slug con el nombre generado por la IA.
             * El titulo se construye legible: "Sad Guitar Melody 90bpm Am"
             * El slug se genera con sanitize_title + idCorto.
             */
            if ($metadataIA && !empty($metadataIA['nombre_archivo_base'])) {
                $tituloIA = ucwords($metadataIA['nombre_archivo_base']);
                if ($analisisTecnico['bpm']) {
                    $tituloIA .= ' ' . $analisisTecnico['bpm'] . 'bpm';
                }
                if ($analisisTecnico['key']) {
                    $keyStr = $analisisTecnico['key'];
                    if ($analisisTecnico['escala'] === 'menor') $keyStr .= 'm';
                    $tituloIA .= ' ' . $keyStr;
                }
                $actualizaciones['titulo'] = $tituloIA;
                $actualizaciones['slug'] = \sanitize_title($tituloIA) . '-' . $idCorto;
                KamplesLogger::info('Pipeline: Titulo/slug actualizados por IA', [
                    'titulo' => $tituloIA,
                    'slug' => $actualizaciones['slug'],
                ]);
            }
        }

        /* Paso 5: Generar waveform peaks */
        $rutaWaveform = $directorio . '/' . $idCorto . '_waveform.json';
        if (self::generarWaveformPeaks($rutaArchivo, $rutaWaveform, $ffmpeg)) {
            $actualizaciones['ruta_waveform'] = $rutaWaveform;
        }

        /* Paso 6: Generar MP3 optimizado (320kbps) */
        $rutaMp3 = $directorio . '/' . $idCorto . '_optimizado.mp3';
        if (self::convertirAMp3($rutaArchivo, $rutaMp3, $ffmpeg)) {
            $actualizaciones['ruta_optimizada'] = $rutaMp3;
        }

        /* Paso 7: Generar preview (30s, 128kbps, fade out) */
        $rutaPreview = $directorio . '/' . $idCorto . '_preview.mp3';
        $duracionPreview = min($duracion ?: 30, self::PREVIEW_DURACION);
        if (self::generarPreview($rutaArchivo, $rutaPreview, $duracionPreview, $ffmpeg)) {
            $actualizaciones['ruta_preview'] = $rutaPreview;
        }

        /* Paso 8: Activar sample en PostgreSQL */
        $actualizaciones['estado'] = 'activo';
        $actualizaciones['publicado_at'] = date('Y-m-d H:i:s');

        self::actualizarSample($sampleId, $actualizaciones);

        /* Paso 9: Generar embedding para el sistema de recomendación */
        try {
            \App\Kamples\Services\GeneradorEmbeddings::guardarEmbedding($sampleId);
        } catch (\Throwable $e) {
            KamplesLogger::error('Pipeline: Error al generar embedding', [
                'sampleId' => $sampleId, 'error' => $e->getMessage()
            ]);
        }

        /* Invalidar cache de feeds globalmente al publicar nuevo sample */
        \App\Kamples\Services\MotorRecomendacion::invalidarCacheGlobal();

        /* Paso 10: Programar cálculo de hash perceptual para deduplicación (background) */
        try {
            \App\Kamples\Services\DeduplicadorAudio::programarCalculo($sampleId);
            KamplesLogger::info('Pipeline: Hash perceptual programado', ['sampleId' => $sampleId]);
        } catch (\Throwable $e) {
            KamplesLogger::error('Pipeline: Error programando hash', [
                'sampleId' => $sampleId, 'error' => $e->getMessage()
            ]);
        }

        KamplesLogger::info('Pipeline: Procesamiento completado', ['sampleId' => $sampleId, 'estado' => 'activo']);
    }

    /*
     * Calcula la duración del audio con FFprobe.
     */
    private static function calcularDuracion(string $rutaArchivo, string $ffprobeBin): float
    {
        $cmd = sprintf(
            '%s -v quiet -show_entries format=duration -of csv=p=0 %s 2>&1',
            escapeshellarg($ffprobeBin),
            escapeshellarg($rutaArchivo)
        );
        $output = shell_exec($cmd);
        if ($output) {
            $duracion = (float) trim($output);
            if ($duracion > 0) return round($duracion, 2);
        }

        /* Fallback: estimar por tamaño */
        $tamano = filesize($rutaArchivo);
        $ext = strtolower(pathinfo($rutaArchivo, PATHINFO_EXTENSION));

        if ($ext === 'wav' && $tamano > 44) {
            return round(($tamano - 44) / 176400, 2);
        }
        if ($ext === 'mp3' && $tamano > 0) {
            return round($tamano / 40000, 2);
        }

        return 0;
    }

    /*
     * Genera peaks de waveform usando FFmpeg para convertir a PCM + PHP para analizar.
     * Funciona con cualquier formato de audio (no solo WAV).
     */
    private static function generarWaveformPeaks(string $rutaArchivo, string $rutaSalida, string $ffmpegBin): bool
    {
        /* Convertir a mono 8kHz signed 16-bit con FFmpeg para análisis uniforme */
        $tmpPcm = tempnam(sys_get_temp_dir(), 'kamples_wf_') . '.pcm';

        $cmd = sprintf(
            '%s -y -i %s -ac 1 -ar 8000 -f s16le %s 2>&1',
            escapeshellarg($ffmpegBin),
            escapeshellarg($rutaArchivo),
            escapeshellarg($tmpPcm)
        );

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($tmpPcm)) {
            /* Fallback: peaks visuales genéricos */
            $peaks = self::peaksFallback();
            $json = json_encode(['peaks' => $peaks, 'barras' => count($peaks)]);
            file_put_contents($rutaSalida, $json);
            @unlink($tmpPcm);
            return true;
        }

        $datosRaw = file_get_contents($tmpPcm);
        @unlink($tmpPcm);

        if (!$datosRaw || strlen($datosRaw) < 200) {
            $peaks = self::peaksFallback();
            $json = json_encode(['peaks' => $peaks, 'barras' => count($peaks)]);
            file_put_contents($rutaSalida, $json);
            return true;
        }

        $muestras = unpack('s*', $datosRaw);
        $muestras = array_values($muestras);
        $totalMuestras = count($muestras);
        $muestrasPorBarra = max(1, intdiv($totalMuestras, self::WAVEFORM_BARRAS));
        $peaks = [];

        for ($i = 0; $i < self::WAVEFORM_BARRAS; $i++) {
            $inicio = $i * $muestrasPorBarra;
            if ($inicio >= $totalMuestras) break;

            $max = 0;
            $fin = min($inicio + $muestrasPorBarra, $totalMuestras);

            /* Muestrear un subconjunto del bloque para velocidad */
            $paso = max(1, intdiv($fin - $inicio, 500));
            for ($j = $inicio; $j < $fin; $j += $paso) {
                $abs = abs($muestras[$j]);
                if ($abs > $max) $max = $abs;
            }

            $peaks[] = round($max / 32768, 4);
        }

        $json = json_encode(['peaks' => $peaks, 'barras' => count($peaks)]);
        file_put_contents($rutaSalida, $json);
        return true;
    }

    /*
     * Genera peaks de fallback visualmente agradables.
     */
    private static function peaksFallback(): array
    {
        $peaks = [];
        $base = 0.4;
        for ($i = 0; $i < self::WAVEFORM_BARRAS; $i++) {
            $variacion = sin($i * 0.3) * 0.2 + (\mt_rand(0, 100) / 500);
            $peaks[] = round(min(1, max(0.05, $base + $variacion)), 4);
        }
        return $peaks;
    }

    /* =================================================
     * Detección de FFmpeg cross-platform (Windows + Linux)
     * ================================================= */

    /*
     * Detecta si el sistema es Windows.
     */
    private static function esWindows(): bool
    {
        return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
    }

    /*
     * Obtiene la ruta al binario de FFmpeg.
     * Busca en PATH y en ubicaciones comunes según el OS.
     * Cachea el resultado para evitar búsquedas repetidas.
     */
    private static function obtenerFFmpeg(): ?string
    {
        if (self::$ffmpegBin !== null) return self::$ffmpegBin ?: null;

        self::$ffmpegBin = self::buscarBinario('ffmpeg');

        if (self::$ffmpegBin) {
            KamplesLogger::info('FFmpeg encontrado', ['ruta' => self::$ffmpegBin]);
        } else {
            KamplesLogger::warning('FFmpeg no encontrado en ninguna ubicación');
        }

        return self::$ffmpegBin ?: null;
    }

    /*
     * Obtiene la ruta al binario de FFprobe.
     */
    private static function obtenerFFprobe(): ?string
    {
        if (self::$ffprobeBin !== null) return self::$ffprobeBin ?: null;

        self::$ffprobeBin = self::buscarBinario('ffprobe');

        if (self::$ffprobeBin) {
            KamplesLogger::debug('FFprobe encontrado', ['ruta' => self::$ffprobeBin]);
        }

        return self::$ffprobeBin ?: null;
    }

    /*
     * Busca un binario (ffmpeg o ffprobe) en el sistema.
     * Prioridad: .env > PATH del sistema > ubicaciones comunes > winget.
     *
     * PHP bajo Apache/LocalWP no hereda el PATH del usuario de Windows,
     * por eso es necesario buscar en rutas explícitas.
     * Se intenta construir LOCALAPPDATA desde USERPROFILE si no está disponible.
     */
    private static function buscarBinario(string $nombre): string
    {
        $esWindows = self::esWindows();
        $ejecutable = $esWindows ? "{$nombre}.exe" : $nombre;

        /* 1. Variable de entorno del .env (prioridad máxima, siempre funciona) */
        $envVar = strtoupper($nombre) . '_PATH';
        $envRuta = $_ENV[$envVar] ?? getenv($envVar) ?: null;
        if ($envRuta && file_exists($envRuta)) {
            KamplesLogger::debug("Binario {$nombre} encontrado via .env", ['ruta' => $envRuta]);
            return $envRuta;
        }

        /* 2. Intentar desde PATH del sistema */
        if ($esWindows) {
            $output = shell_exec("where {$nombre} 2>nul");
        } else {
            $output = shell_exec("which {$nombre} 2>/dev/null");
        }

        if ($output) {
            $ruta = trim(explode("\n", $output)[0]);
            if (!empty($ruta) && file_exists($ruta)) {
                KamplesLogger::debug("Binario {$nombre} encontrado via PATH", ['ruta' => $ruta]);
                return $ruta;
            }
        }

        /* 3. Buscar en ubicaciones comunes */
        if ($esWindows) {
            $localAppData = getenv('LOCALAPPDATA') ?: '';
            $userProfile = getenv('USERPROFILE') ?: '';

            /*
             * PHP bajo Apache/LocalWP a veces no hereda LOCALAPPDATA.
             * Reconstruir desde USERPROFILE si está vacío.
             */
            if (!$localAppData && $userProfile) {
                $localAppData = $userProfile . '\\AppData\\Local';
            }

            /*
             * Último recurso: reconstruir desde SystemRoot (C:\Users\<usuario>).
             * Usamos get_current_user() que en Windows devuelve el usuario de IIS/Apache.
             */
            if (!$localAppData) {
                $systemDrive = getenv('SystemDrive') ?: 'C:';
                $currentUser = get_current_user();
                if ($currentUser) {
                    $localAppData = "{$systemDrive}\\Users\\{$currentUser}\\AppData\\Local";
                    if (!$userProfile) {
                        $userProfile = "{$systemDrive}\\Users\\{$currentUser}";
                    }
                }
            }

            KamplesLogger::debug("Buscando {$nombre} en rutas Windows", [
                'LOCALAPPDATA' => $localAppData,
                'USERPROFILE' => $userProfile,
            ]);

            $rutas = [
                "C:\\ffmpeg\\bin\\{$ejecutable}",
                "C:\\Program Files\\ffmpeg\\bin\\{$ejecutable}",
                "C:\\Program Files (x86)\\ffmpeg\\bin\\{$ejecutable}",
                "C:\\tools\\ffmpeg\\bin\\{$ejecutable}",
            ];

            /* Agregar rutas de usuario solo si se resolvió la variable */
            if ($localAppData) {
                $rutas[] = "{$localAppData}\\ffmpeg\\bin\\{$ejecutable}";
            }
            if ($userProfile) {
                $rutas[] = "{$userProfile}\\ffmpeg\\bin\\{$ejecutable}";
                $rutas[] = "{$userProfile}\\scoop\\shims\\{$ejecutable}";
            }

            /* Buscar en paquetes winget (glob para soportar versiones futuras) */
            if ($localAppData) {
                $globPatron = "{$localAppData}\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg*\\ffmpeg-*\\bin\\{$ejecutable}";
                $encontrados = glob($globPatron);
                if ($encontrados) {
                    /* Última versión alfabéticamente = más reciente */
                    sort($encontrados);
                    $rutas[] = end($encontrados);
                    KamplesLogger::debug("WinGet glob encontró {$nombre}", ['ruta' => end($encontrados)]);
                }
            }
        } else {
            $rutas = [
                "/usr/bin/{$nombre}",
                "/usr/local/bin/{$nombre}",
                "/snap/bin/{$nombre}",
                "/opt/homebrew/bin/{$nombre}",
            ];
        }

        foreach ($rutas as $ruta) {
            if (!empty($ruta) && file_exists($ruta)) {
                KamplesLogger::debug("Binario {$nombre} encontrado en ruta manual", ['ruta' => $ruta]);
                return $ruta;
            }
        }

        KamplesLogger::warning("Binario {$nombre} no encontrado en ninguna ubicación", [
            'rutasInspected' => count($rutas ?? []),
        ]);
        return '';
    }

    /*
     * Convierte un archivo de audio a MP3 320kbps con FFmpeg.
     */
    private static function convertirAMp3(string $entrada, string $salida, string $ffmpegBin): bool
    {
        $cmd = sprintf(
            '%s -y -i %s -codec:a libmp3lame -b:a 320k -ar 44100 %s 2>&1',
            escapeshellarg($ffmpegBin),
            escapeshellarg($entrada),
            escapeshellarg($salida)
        );

        exec($cmd, $output, $returnCode);
        return $returnCode === 0 && file_exists($salida);
    }

    /*
     * Genera un preview MP3 (primeros N segundos, 128kbps, fade out de 2s).
     */
    private static function generarPreview(string $entrada, string $salida, float $duracion, string $ffmpegBin): bool
    {
        $fadeStart = max(0, $duracion - 2);
        $cmd = sprintf(
            '%s -y -i %s -t %s -codec:a libmp3lame -b:a 128k -ar 44100 -af "afade=t=out:st=%s:d=2" %s 2>&1',
            escapeshellarg($ffmpegBin),
            escapeshellarg($entrada),
            $duracion,
            $fadeStart,
            escapeshellarg($salida)
        );

        exec($cmd, $output, $returnCode);
        return $returnCode === 0 && file_exists($salida);
    }

    /*
     * Construye nombre estandarizado para el archivo.
     * Formato: kamples_{tipo}_{nombre_base}_{bpm}_{key}_{idCorto}.{ext}
     * Ejemplo: kamples_loop_sad_guitar_melody_90_Am_a3Kf9x2.wav
     *
     * Combina datos creativos de la IA + datos técnicos del analizador.
     */
    private static function construirNombreArchivo(?array $metadataIA, array $analisisTecnico, string $idCorto, string $ext): ?string
    {
        if (!$metadataIA || empty($metadataIA['nombre_archivo_base'])) {
            return null;
        }

        $partes = ['kamples'];

        /* Tipo (de la IA) — normalizar espacios a guiones bajos */
        $tipo = str_replace(' ', '_', $metadataIA['tipo'] ?? 'one_shot');
        $partes[] = $tipo;

        /* Nombre base descriptivo (de la IA) — espacios a guiones bajos, solo alfanuméricos */
        $nombreBase = $metadataIA['nombre_archivo_base'];
        $nombreBase = preg_replace('/[^a-zA-Z0-9\s]/', '', $nombreBase);
        $nombreBase = str_replace(' ', '_', trim(strtolower($nombreBase)));
        if (!empty($nombreBase)) {
            $partes[] = $nombreBase;
        }

        /* BPM (del analizador técnico) */
        if ($analisisTecnico['bpm']) {
            $partes[] = (string) $analisisTecnico['bpm'];
        }

        /* Key + Escala (del analizador técnico) */
        if ($analisisTecnico['key']) {
            $keyStr = str_replace('#', 's', $analisisTecnico['key']);
            if ($analisisTecnico['escala'] === 'menor') {
                $keyStr .= 'm';
            }
            $partes[] = $keyStr;
        }

        /* ID corto al final */
        $partes[] = $idCorto;

        return implode('_', $partes) . '.' . $ext;
    }

    /*
     * Actualiza el registro de un sample en PostgreSQL con los datos procesados.
     * Detecta columnas JSONB para aplicar cast explícito.
     */
    private static function actualizarSample(int $sampleId, array $datos): void
    {
        $columnasJsonb = ['metadata', 'media_metadata', 'tags_ia'];
        $setClauses = [];
        $params = ['id' => $sampleId];

        foreach ($datos as $campo => $valor) {
            /* Cast explícito para JSONB — PDO native prepares envía como text sin esto */
            if (in_array($campo, $columnasJsonb, true)) {
                $setClauses[] = "{$campo} = :{$campo}::jsonb";
            } else {
                $setClauses[] = "{$campo} = :{$campo}";
            }
            $params[$campo] = $valor;
        }

        if (empty($setClauses)) return;

        $sql = "UPDATE samples SET " . implode(', ', $setClauses) . " WHERE id = :id";

        try {
            PostgresService::ejecutar($sql, $params);
        } catch (\Exception $e) {
            KamplesLogger::error('Pipeline: Error actualizando sample en DB', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
                'sql' => $sql,
            ]);
        }
    }
}
