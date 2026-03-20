<?php

/**
 * DesktopUpdateController — Endpoint de actualización para la app desktop (Tauri 2).
 *
 * Maneja el protocolo de auto-update de Tauri: responde 200 + JSON si hay
 * nueva versión, o 204 No Content si el cliente está al día.
 *
 * Los artefactos (instaladores firmados) se almacenan en GitHub Releases
 * y este endpoint actúa como proxy/resolver que consulta la última release.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\KamplesLogger;
use App\Kamples\Services\ServicioCache;

class DesktopUpdateController
{
    /**
     * URL base de la API de GitHub Releases para el repo de releases.
     * Se configura via constante para facilitar cambio a repo privado o CDN propio.
     */
    private const GITHUB_RELEASES_API = 'https://api.github.com/repos/AKamples/kamples-desktop-releases/releases/latest';

    /**
     * [Tarea Final] URL del archivo versions.json en kamples-sync (GitHub raw, público).
     * Para actualizar las versiones: editar este archivo en el repo 1ndoryu/kamples-sync.
     */
    private const GITHUB_VERSIONS_URL = 'https://raw.githubusercontent.com/1ndoryu/kamples-sync/main/versions.json';

    /**
     * Clave de transient para versiones de app (Windows, APK, web).
     */
    private const CACHE_VERSIONS_KEY = 'kamples_app_versions_cache';

    /**
     * Clave de WP option para override manual de versiones (vía POST admin endpoint).
     */
    private const OPCION_VERSIONS_ALL = 'kamples_app_versions_all';

    /**
     * Tiempo de caché en segundos para la respuesta de GitHub (evitar rate limit).
     * Transient de WordPress: 5 minutos.
     */
    private const CACHE_TTL = 300;

    private const TRANSIENT_KEY = 'kamples_desktop_latest_release';

    /**
     * Mapa de target Tauri -> sufijo de archivo en la release de GitHub.
     * Tauri envía el target OS como parte de la URL.
     */
    private const TARGET_MAP = [
        'windows' => [
            'x86_64' => '.nsis.zip',
        ],
        'darwin' => [
            'x86_64'  => '.app.tar.gz',
            'aarch64' => '.app.tar.gz',
        ],
        'linux' => [
            'x86_64' => '.AppImage.tar.gz',
        ],
    ];

    /**
     * Plataformas válidas para el check de versión de app móvil/desktop.
     * Extensible: añadir 'ios' cuando se soporte.
     */
    private const PLATAFORMAS_APP = ['android'];

    /**
     * Clave de WP option donde se almacena la versión más reciente por plataforma.
     * Formato JSON: { version: string, url: string, notes: string, pub_date: string }
     */
    private const OPCION_VERSION_PREFIJO = 'kamples_app_version_';

    public static function registrarRutas(string $namespace): void
    {
        /* GET /app/version/{platform}/{current_version}
         * Público: la app no requiere sesión WP, solo consulta versión */
        register_rest_route($namespace, '/app/version/(?P<platform>[a-z]+)/(?P<current_version>[0-9]+\.[0-9]+\.[0-9]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'verificarVersionApp'],
            'permission_callback' => '__return_true',
            'args'                => [
                'platform' => [
                    'required'          => true,
                    'validate_callback' => function ($valor): bool {
                        return in_array($valor, self::PLATAFORMAS_APP, true);
                    },
                ],
                'current_version' => [
                    'required'          => true,
                    'validate_callback' => function ($valor): bool {
                        return (bool) preg_match('/^\d+\.\d+\.\d+$/', $valor);
                    },
                ],
            ],
        ]);

        /* GET /desktop/update/{target}/{arch}/{current_version}
         * Público: la app desktop no tiene sesión WP, se autentica por firma del updater */
        register_rest_route($namespace, '/desktop/update/(?P<target>[a-z]+)/(?P<arch>[a-z0-9_]+)/(?P<current_version>[0-9]+\.[0-9]+\.[0-9]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'verificarActualizacion'],
            'permission_callback' => '__return_true',
            'args'                => [
                'target' => [
                    'required'          => true,
                    'validate_callback' => function ($valor): bool {
                        return in_array($valor, ['windows', 'darwin', 'linux'], true);
                    },
                ],
                'arch' => [
                    'required'          => true,
                    'validate_callback' => function ($valor): bool {
                        return in_array($valor, ['x86_64', 'aarch64'], true);
                    },
                ],
                'current_version' => [
                    'required'          => true,
                    'validate_callback' => function ($valor): bool {
                        return (bool) preg_match('/^\d+\.\d+\.\d+$/', $valor);
                    },
                ],
            ],
        ]);

        /* [Tarea Final] GET /app/versions — retorna versiones + URLs de descarga de todas las plataformas.
         * Lee desde kamples-sync GitHub raw con cache 5min. Fallback a WP option. Público. */
        register_rest_route($namespace, '/app/versions', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerVersiones'],
            'permission_callback' => '__return_true',
        ]);

        /* [Tarea Final] POST /admin/app/versions — override manual de versiones (admin).
         * Útil si GitHub raw no está disponible o para testing. */
        register_rest_route($namespace, '/admin/app/versions', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'actualizarVersionesAdmin'],
            'permission_callback' => function (): bool {
                return current_user_can('manage_options');
            },
        ]);
    }

    /**
     * GET /app/version/{platform}/{current_version}
     *
     * Check de versión para apps móviles (Android).
     * Lee la versión más reciente de una WP option configurable.
     * - 200 + JSON si hay versión más nueva
     * - 204 No Content si está al día
     */
    public static function verificarVersionApp(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $plataforma    = $request->get_param('platform');
            $versionActual = $request->get_param('current_version');

            $opcion = get_option(self::OPCION_VERSION_PREFIJO . $plataforma, '');
            if (empty($opcion)) {
                return new \WP_REST_Response(null, 204);
            }

            $data = is_string($opcion) ? json_decode($opcion, true) : $opcion;
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                return new \WP_REST_Response(null, 204);
            }

            $versionNueva = $data['version'] ?? '';
            if (!$versionNueva || version_compare($versionActual, $versionNueva, '>=')) {
                return new \WP_REST_Response(null, 204);
            }

            return new \WP_REST_Response([
                'version'    => $versionNueva,
                'url'        => $data['url'] ?? '',
                'notes'      => $data['notes'] ?? '',
                'pub_date'   => $data['pub_date'] ?? gmdate('c'),
                'obligatoria' => $data['obligatoria'] ?? false,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error verificando version app', [
                'error'      => $e->getMessage(),
                'plataforma' => $request->get_param('platform'),
                'version'    => $request->get_param('current_version'),
            ]);
            return new \WP_REST_Response(null, 204);
        }
    }

    /**
     * GET /desktop/update/{target}/{arch}/{current_version}
     *
     * Protocolo Tauri updater:
     * - 200 + JSON si hay versión más nueva
     * - 204 No Content si está al día
     */
    public static function verificarActualizacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $target         = $request->get_param('target');
            $arch           = $request->get_param('arch');
            $versionActual  = $request->get_param('current_version');

            $release = self::obtenerUltimaRelease();
            if (!$release) {
                return new \WP_REST_Response(null, 204);
            }

            $versionNueva = ltrim($release['tag_name'] ?? '', 'desktop-v');
            if (!$versionNueva || version_compare($versionActual, $versionNueva, '>=')) {
                return new \WP_REST_Response(null, 204);
            }

            $sufijo = self::TARGET_MAP[$target][$arch] ?? null;
            if (!$sufijo) {
                return new \WP_REST_Response(null, 204);
            }

            /* Buscar asset y signature en los artefactos de la release */
            $urlArtefacto = null;
            $firma        = null;

            foreach ($release['assets'] ?? [] as $asset) {
                $nombre = $asset['name'] ?? '';

                if (str_ends_with($nombre, $sufijo) && !str_ends_with($nombre, '.sig')) {
                    $urlArtefacto = $asset['browser_download_url'] ?? null;
                }

                if (str_ends_with($nombre, $sufijo . '.sig')) {
                    $firma = self::descargarContenidoAsset($asset['browser_download_url'] ?? '');
                }
            }

            if (!$urlArtefacto || !$firma) {
                return new \WP_REST_Response(null, 204);
            }

            return new \WP_REST_Response([
                'version'  => $versionNueva,
                'notes'    => $release['body'] ?? '',
                'pub_date' => $release['published_at'] ?? gmdate('c'),
                'url'      => $urlArtefacto,
                'signature' => $firma,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error verificando actualizacion desktop', [
                'error'   => $e->getMessage(),
                'target'  => $request->get_param('target'),
                'version' => $request->get_param('current_version'),
            ]);
            return new \WP_REST_Response(null, 204);
        }
    }

    /**
     * Obtiene la última release de GitHub (con caché transient).
     *
     * @return array<string, mixed>|null
     */
    private static function obtenerUltimaRelease(): ?array
    {
        $cached = ServicioCache::obtener(self::TRANSIENT_KEY);
        if ($cached !== false) {
            return $cached;
        }

        $respuesta = wp_remote_get(self::GITHUB_RELEASES_API, [
            'timeout' => 10,
            'headers' => [
                'Accept'     => 'application/vnd.github+json',
                'User-Agent' => 'Kamples-Desktop-Updater/1.0',
            ],
        ]);

        if (is_wp_error($respuesta)) {
            KamplesLogger::error('Error consultando GitHub Releases', [
                'error' => $respuesta->get_error_message(),
            ]);
            return null;
        }

        $codigo = wp_remote_retrieve_response_code($respuesta);
        if ($codigo !== 200) {
            KamplesLogger::error('GitHub Releases respondio con codigo no-200', [
                'codigo' => $codigo,
            ]);
            return null;
        }

        $body = wp_remote_retrieve_body($respuesta);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            KamplesLogger::error('Error parseando respuesta de GitHub Releases', [
                'json_error' => json_last_error_msg(),
            ]);
            return null;
        }

        ServicioCache::guardar(self::TRANSIENT_KEY, $data, self::CACHE_TTL);

        return $data;
    }

    /**
     * Descarga el contenido de un archivo .sig (firma) de GitHub.
     * La firma es texto plano base64.
     */
    private static function descargarContenidoAsset(string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        $respuesta = wp_remote_get($url, [
            'timeout' => 10,
            'headers' => [
                'User-Agent' => 'Kamples-Desktop-Updater/1.0',
            ],
        ]);

        if (is_wp_error($respuesta) || wp_remote_retrieve_response_code($respuesta) !== 200) {
            return null;
        }

        return trim(wp_remote_retrieve_body($respuesta));
    }

    /**
     * [Tarea Final] GET /app/versions
     *
     * Retorna versiones y URLs de descarga de todas las plataformas.
     * Fuente primaria: versions.json en 1ndoryu/kamples-sync (GitHub raw, público).
     * Fallback: WP option kamples_app_versions_all (configurable via POST admin endpoint).
     *
     * Formato esperado de versions.json:
     * { "windows": { "version": "0.1.0", "url": "...", "notes": "" },
     *   "apk":     { "version": "0.1.0", "url": "...", "notes": "" },
     *   "web":     { "version": "0.1.0", "notes": "" } }
     */
    public static function obtenerVersiones(): \WP_REST_Response
    {
        try {
            /* Cache transient para evitar requests repetidos a GitHub */
            $cached = get_transient(self::CACHE_VERSIONS_KEY);
            if ($cached !== false) {
                return new \WP_REST_Response($cached, 200);
            }

            /* Leer desde kamples-sync GitHub raw (sin token, repo público) */
            $respuesta = wp_remote_get(self::GITHUB_VERSIONS_URL, [
                'timeout' => 5,
                'headers' => ['User-Agent' => 'Kamples/1.0'],
            ]);

            if (!is_wp_error($respuesta) && wp_remote_retrieve_response_code($respuesta) === 200) {
                $body = json_decode(wp_remote_retrieve_body($respuesta), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($body)) {
                    set_transient(self::CACHE_VERSIONS_KEY, $body, self::CACHE_TTL);
                    return new \WP_REST_Response($body, 200);
                }
            }

            /* Fallback: WP option configurable manualmente via POST /admin/app/versions */
            $opcion = get_option(self::OPCION_VERSIONS_ALL, null);
            if ($opcion && is_array($opcion)) {
                return new \WP_REST_Response($opcion, 200);
            }

            /* Sin datos configurados: retornar vacío (no hay changelog aún) */
            return new \WP_REST_Response(['windows' => null, 'apk' => null, 'web' => null], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error obteniendo versiones app', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['windows' => null, 'apk' => null, 'web' => null], 200);
        }
    }

    /**
     * [Tarea Final] POST /admin/app/versions
     *
     * Override manual de versiones para casos donde GitHub raw no está disponible
     * o para pre-staging antes de commitear versions.json.
     * Limpia el transient para que el próximo GET lea el valor actualizado.
     */
    public static function actualizarVersionesAdmin(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $body = $request->get_json_params();
            if (!is_array($body)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Body invalido'], 400);
            }

            update_option(self::OPCION_VERSIONS_ALL, $body);
            delete_transient(self::CACHE_VERSIONS_KEY);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error actualizando versiones admin', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
