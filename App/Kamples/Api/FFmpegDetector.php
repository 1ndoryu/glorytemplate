<?php

/**
 * FFmpegDetector — Detección cross-platform de binarios FFmpeg/FFprobe
 *
 * Extraído de PipelineAudio.php (A12).
 * Busca binarios en: .env → PATH → rutas comunes Windows/Linux → winget.
 * PHP bajo Apache/LocalWP no hereda el PATH del usuario de Windows,
 * por eso es necesario buscar en rutas explícitas.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;

class FFmpegDetector
{
    /* Cache de binarios detectados */
    private static ?string $ffmpegBin = null;
    private static ?string $ffprobeBin = null;

    /**
     * Detecta si el sistema es Windows.
     */
    public static function esWindows(): bool
    {
        return \strtoupper(\substr(PHP_OS, 0, 3)) === 'WIN';
    }

    /**
     * Obtiene la ruta al binario de FFmpeg.
     * Cachea el resultado para evitar búsquedas repetidas.
     */
    public static function obtenerFFmpeg(): ?string
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

    /**
     * Obtiene la ruta al binario de FFprobe.
     */
    public static function obtenerFFprobe(): ?string
    {
        if (self::$ffprobeBin !== null) return self::$ffprobeBin ?: null;

        self::$ffprobeBin = self::buscarBinario('ffprobe');

        if (self::$ffprobeBin) {
            KamplesLogger::debug('FFprobe encontrado', ['ruta' => self::$ffprobeBin]);
        }

        return self::$ffprobeBin ?: null;
    }

    /**
     * Busca un binario (ffmpeg o ffprobe) en el sistema.
     * Prioridad: .env > PATH > ubicaciones comunes > winget.
     */
    private static function buscarBinario(string $nombre): string
    {
        $esWindows = self::esWindows();
        $ejecutable = $esWindows ? "{$nombre}.exe" : $nombre;

        /* 1. Variable de entorno del .env (prioridad máxima) */
        $envVar = \strtoupper($nombre) . '_PATH';
        $envRuta = $_ENV[$envVar] ?? getenv($envVar) ?: null;
        if ($envRuta && \file_exists($envRuta)) {
            KamplesLogger::debug("Binario {$nombre} encontrado via .env", ['ruta' => $envRuta]);
            return $envRuta;
        }

        /* 2. Intentar desde PATH del sistema — S38 fix: escapeshellarg */
        try {
            if ($esWindows) {
                $output = \shell_exec(\sprintf('where %s 2>nul', \escapeshellarg($nombre)));
            } else {
                $output = \shell_exec(\sprintf('which %s 2>/dev/null', \escapeshellarg($nombre)));
            }

            if ($output) {
                $ruta = \trim(\explode("\n", $output)[0]);
                if (!empty($ruta) && \file_exists($ruta)) {
                    KamplesLogger::debug("Binario {$nombre} encontrado via PATH", ['ruta' => $ruta]);
                    return $ruta;
                }
            }
        } catch (\Throwable $e) {
            KamplesLogger::error("FFmpegDetector: error buscando {$nombre} en PATH", ['error' => $e->getMessage()]);
        }

        /* 3. Buscar en ubicaciones comunes */
        if ($esWindows) {
            $localAppData = getenv('LOCALAPPDATA') ?: '';
            $userProfile = getenv('USERPROFILE') ?: '';

            /* Reconstruir LOCALAPPDATA desde USERPROFILE si está vacío */
            if (!$localAppData && $userProfile) {
                $localAppData = $userProfile . '\\AppData\\Local';
            }

            /* Último recurso: reconstruir desde SystemRoot */
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

            if ($localAppData) {
                $rutas[] = "{$localAppData}\\ffmpeg\\bin\\{$ejecutable}";
            }
            if ($userProfile) {
                $rutas[] = "{$userProfile}\\ffmpeg\\bin\\{$ejecutable}";
                $rutas[] = "{$userProfile}\\scoop\\shims\\{$ejecutable}";
            }

            /* Buscar en paquetes winget */
            if ($localAppData) {
                $globPatron = "{$localAppData}\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg*\\ffmpeg-*\\bin\\{$ejecutable}";
                $encontrados = \glob($globPatron);
                if ($encontrados) {
                    \sort($encontrados);
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
            if (!empty($ruta) && \file_exists($ruta)) {
                KamplesLogger::debug("Binario {$nombre} encontrado en ruta manual", ['ruta' => $ruta]);
                return $ruta;
            }
        }

        KamplesLogger::warning("Binario {$nombre} no encontrado en ninguna ubicación", [
            'rutasInspected' => \count($rutas ?? []),
        ]);
        return '';
    }
}
