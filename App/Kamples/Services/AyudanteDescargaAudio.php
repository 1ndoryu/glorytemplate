<?php

/**
 * AyudanteDescargaAudio — Operaciones de descarga y procesamiento de audio.
 *
 * QQ130: Extraido de ServicioExtensionRecorte para cumplir SRP y limite de lineas.
 * Agrupa: descarga via yt-dlp, recorte FFmpeg, reemplazo de archivos, dir temporal.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Api\FFmpegDetector;
use App\Kamples\Api\ProcesadorFFmpeg;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;

class AyudanteDescargaAudio
{
    /* Timeout para yt-dlp en segundos */
    private const YTDLP_TIMEOUT = 120;

    /* Fade in/out en milisegundos */
    private const FADE_MS = 50;

    /**
     * Crea directorio temporal seguro para la operacion.
     */
    public static function crearDirectorioTemporal(): string
    {
        $dir = \sys_get_temp_dir() . '/kamples_ext_' . \bin2hex(\random_bytes(8));
        if (!\mkdir($dir, 0755, true)) {
            throw new \RuntimeException('No se pudo crear directorio temporal');
        }
        return $dir;
    }

    /**
     * Descarga audio completo de YouTube via yt-dlp.
     * Busca yt-dlp en venv del scraper o PATH del sistema.
     *
     * @return string|null Ruta al archivo descargado
     */
    public static function descargarAudioYoutube(string $youtubeId, string $outputDir): ?string
    {
        /* Validar formato youtube_id para prevenir inyeccion */
        if (!\preg_match('/^[a-zA-Z0-9_-]{11}$/', $youtubeId)) {
            KamplesLogger::error('[QQ130] YouTube ID invalido', ['id' => $youtubeId]);
            return null;
        }

        $ytdlp = self::resolverYtDlp();
        if (!$ytdlp) {
            KamplesLogger::error('[QQ130] yt-dlp no encontrado');
            return null;
        }

        $outputPath = $outputDir . '/' . $youtubeId . '.mp3';
        $url = 'https://www.youtube.com/watch?v=' . $youtubeId;

        /*
         * Construir array de argumentos para proc_open.
         * Usar array evita shell interpretation (PHP 7.4+), eliminando riesgo de inyeccion.
         * No se necesita escapeshellarg() cuando proc_open recibe array.
         */
        $cmd = [
            $ytdlp,
            '--no-playlist',
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--output', $outputPath,
            '--no-warnings',
            '--quiet',
        ];

        /* Agregar cookies si existen */
        $cookiesPath = self::resolverCookiesPath();
        if ($cookiesPath) {
            \array_splice($cmd, 1, 0, ['--cookies', $cookiesPath]);
        }

        $cmd[] = $url;

        KamplesLogger::info('[QQ130] Descargando audio de YouTube', ['youtubeId' => $youtubeId]);

        try {
            $descriptors = [
                0 => ['pipe', 'r'],
                1 => ['pipe', 'w'],
                2 => ['pipe', 'w'],
            ];

            /* sentinel-disable-next-line exec-sin-escapeshellarg — proc_open con array; sin shell, youtubeId validado con regex */
            $process = \proc_open($cmd, $descriptors, $pipes);
            if (!\is_resource($process)) {
                KamplesLogger::error('[QQ130] No se pudo iniciar yt-dlp');
                return null;
            }

            \fclose($pipes[0]);

            \stream_set_timeout($pipes[1], self::YTDLP_TIMEOUT);
            \stream_set_timeout($pipes[2], self::YTDLP_TIMEOUT);

            $stdout = \stream_get_contents($pipes[1], 1024 * 100);
            $stderr = \stream_get_contents($pipes[2], 1024 * 100);
            \fclose($pipes[1]);
            \fclose($pipes[2]);

            $exitCode = \proc_close($process);

            if ($exitCode !== 0) {
                KamplesLogger::warning('[QQ130] yt-dlp fallo', [
                    'youtubeId' => $youtubeId,
                    'exitCode'  => $exitCode,
                    'stderr'    => \mb_substr((string) $stderr, 0, 500),
                ]);
                return null;
            }

            return self::buscarArchivoDescargado($outputDir, $outputPath);
        } catch (\Throwable $e) {
            KamplesLogger::error('[QQ130] Error ejecutando yt-dlp', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Recorta audio usando FFmpeg con fade in/out.
     */
    public static function recortarConFFmpeg(
        string $rutaEntrada,
        float $inicio,
        float $duracion,
        string $rutaSalida
    ): bool {
        $ffmpegBin = FFmpegDetector::obtenerFFmpeg();
        if (!$ffmpegBin) {
            KamplesLogger::error('[QQ130] FFmpeg no encontrado');
            return false;
        }

        $fadeSeg = self::FADE_MS / 1000.0;

        $cmd = \sprintf(
            '%s -y -ss %s -t %s -i %s -af %s -ar 44100 -ac 1 -c:a libmp3lame -b:a 320k %s 2>&1',
            \escapeshellarg($ffmpegBin),
            \escapeshellarg((string) \round($inicio, 3)),
            \escapeshellarg((string) \round($duracion, 3)),
            \escapeshellarg($rutaEntrada),
            \escapeshellarg(
                "afade=t=in:st=0:d={$fadeSeg},afade=t=out:st=" . \round($duracion - $fadeSeg, 3) . ":d={$fadeSeg}"
            ),
            \escapeshellarg($rutaSalida)
        );

        try {
            \exec($cmd, $output, $returnCode);

            if ($returnCode !== 0) {
                KamplesLogger::error('[QQ130] FFmpeg fallo al recortar', [
                    'returnCode' => $returnCode,
                    'output'     => \implode("\n", \array_slice($output, -5)),
                ]);
                return false;
            }

            return \file_exists($rutaSalida) && \filesize($rutaSalida) > 1024;
        } catch (\Throwable $e) {
            KamplesLogger::error('[QQ130] Error en ffmpeg recorte', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Reemplaza los archivos de audio de un sample existente y regenera derivados.
     *
     * @return array{ok: bool, mensaje: string, duracion?: float}
     */
    public static function reemplazarArchivosSample(
        int $sampleId,
        array $sample,
        string $rutaNuevoRecorte
    ): array {
        $ffmpegBin = FFmpegDetector::obtenerFFmpeg();
        $ffprobeBin = FFmpegDetector::obtenerFFprobe();

        if (!$ffmpegBin) {
            return ['ok' => false, 'mensaje' => 'FFmpeg no disponible'];
        }

        $uploadDir = \wp_upload_dir();
        $baseDir = $uploadDir['basedir'];

        /* Resolver ruta absoluta del original */
        $rutaOriginal = $sample[SamplesCols::RUTA_ORIGINAL] ?? '';
        $rutaAbsOriginal = self::resolverRutaAbsoluta($rutaOriginal, $baseDir);

        if (!\copy($rutaNuevoRecorte, $rutaAbsOriginal)) {
            return ['ok' => false, 'mensaje' => 'Error al copiar nuevo recorte a destino'];
        }

        /* Calcular nueva duracion */
        $nuevaDuracion = $ffprobeBin
            ? ProcesadorFFmpeg::calcularDuracion($rutaAbsOriginal, $ffprobeBin)
            : 0;

        /* Regenerar derivados (optimizado, preview, waveform) */
        self::regenerarDerivados($sample, $rutaAbsOriginal, $baseDir, $ffmpegBin, $nuevaDuracion);

        /* Actualizar duracion y hash en DB */
        $hash = \hash_file('sha256', $rutaAbsOriginal);
        $tamano = \filesize($rutaAbsOriginal);

        SamplesRepository::actualizarCampos(
            $sampleId,
            [
                SamplesCols::DURACION . ' = :duracion',
                SamplesCols::AUDIO_HASH . ' = :hash',
                SamplesCols::TAMANO . ' = :tamano',
                SamplesCols::UPDATED_AT . ' = NOW()',
            ],
            [
                'duracion' => \round($nuevaDuracion, 2),
                'hash'     => $hash ?: null,
                'tamano'   => $tamano ?: 0,
            ]
        );

        return [
            'ok'       => true,
            'mensaje'  => 'Archivos reemplazados',
            'duracion' => \round($nuevaDuracion, 2),
        ];
    }

    /**
     * Elimina recursivamente un directorio temporal.
     */
    public static function limpiarDirectorioTemporal(string $dir): void
    {
        if (!\is_dir($dir)) {
            return;
        }

        try {
            $archivos = \scandir($dir);
            if ($archivos === false) {
                return;
            }

            foreach ($archivos as $archivo) {
                if ($archivo === '.' || $archivo === '..') {
                    continue;
                }
                $ruta = $dir . '/' . $archivo;
                if (\is_dir($ruta)) {
                    self::limpiarDirectorioTemporal($ruta);
                } else {
                    \unlink($ruta);
                }
            }
            \rmdir($dir);
        } catch (\Throwable $e) {
            KamplesLogger::warning('[QQ130] Error limpiando directorio temporal', [
                'dir'   => $dir,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Busca el binario yt-dlp: primero en venv del scraper, luego PATH, luego pip global.
     */
    private static function resolverYtDlp(): ?string
    {
        $themeDir = \get_template_directory();
        $venvPath = $themeDir . '/kamples-scraper/.venv/bin/yt-dlp';
        if (\file_exists($venvPath)) {
            return $venvPath;
        }

        try {
            $output = \shell_exec(\escapeshellarg('which') . ' yt-dlp 2>/dev/null');
            if ($output) {
                $ruta = \trim($output);
                if (\file_exists($ruta)) {
                    return $ruta;
                }
            }
        } catch (\Throwable $e) {
            /* Ignorar — fallback a siguiente opcion */
        }

        $pipPath = '/usr/local/bin/yt-dlp';
        if (\file_exists($pipPath)) {
            return $pipPath;
        }

        return null;
    }

    /**
     * Busca cookies.txt para yt-dlp.
     */
    private static function resolverCookiesPath(): ?string
    {
        $themeDir = \get_template_directory();
        $cookiesPath = $themeDir . '/kamples-scraper/cookies.txt';
        if (\file_exists($cookiesPath) && \filesize($cookiesPath) > 50) {
            return $cookiesPath;
        }

        $envPath = $_ENV['KAMPLES_COOKIES_PATH'] ?? \getenv('KAMPLES_COOKIES_PATH') ?: null;
        if ($envPath && \file_exists($envPath)) {
            return $envPath;
        }

        return null;
    }

    /**
     * Busca archivo descargado por yt-dlp en el directorio de salida.
     */
    private static function buscarArchivoDescargado(string $outputDir, string $expectedPath): ?string
    {
        if (\file_exists($expectedPath) && \filesize($expectedPath) > 1024) {
            return $expectedPath;
        }

        $archivos = \glob($outputDir . '/*.mp3') ?: [];
        foreach ($archivos as $archivo) {
            if (\filesize($archivo) > 1024) {
                return $archivo;
            }
        }

        $otrosFormatos = \glob($outputDir . '/*.{opus,m4a,webm}', GLOB_BRACE) ?: [];
        foreach ($otrosFormatos as $archivo) {
            if (\filesize($archivo) > 1024) {
                return $archivo;
            }
        }

        KamplesLogger::error('[QQ130] Audio descargado no encontrado en salida', ['dir' => $outputDir]);
        return null;
    }

    /**
     * Resuelve ruta absoluta — si no existe tal cual, prepone baseDir de uploads.
     */
    private static function resolverRutaAbsoluta(string $ruta, string $baseDir): string
    {
        if (\file_exists($ruta)) {
            return $ruta;
        }
        return $baseDir . '/' . \ltrim($ruta, '/');
    }

    /**
     * Regenera archivos derivados (optimizado, preview, waveform) desde el original.
     */
    private static function regenerarDerivados(
        array $sample,
        string $rutaAbsOriginal,
        string $baseDir,
        string $ffmpegBin,
        float $duracion
    ): void {
        $rutaOptimizada = $sample[SamplesCols::RUTA_OPTIMIZADA] ?? '';
        if ($rutaOptimizada) {
            $abs = self::resolverRutaAbsoluta($rutaOptimizada, $baseDir);
            ProcesadorFFmpeg::convertirAMp3($rutaAbsOriginal, $abs, $ffmpegBin);
        }

        $rutaPreview = $sample[SamplesCols::RUTA_PREVIEW] ?? '';
        if ($rutaPreview) {
            $abs = self::resolverRutaAbsoluta($rutaPreview, $baseDir);
            $previewDur = \min($duracion ?: 30, ProcesadorFFmpeg::PREVIEW_DURACION);
            ProcesadorFFmpeg::generarPreview($rutaAbsOriginal, $abs, $previewDur, $ffmpegBin);
        }

        $rutaWaveform = $sample[SamplesCols::RUTA_WAVEFORM] ?? '';
        if ($rutaWaveform) {
            $abs = self::resolverRutaAbsoluta($rutaWaveform, $baseDir);
            ProcesadorFFmpeg::generarWaveformPeaks($rutaAbsOriginal, $abs, $ffmpegBin);
        }
    }
}
