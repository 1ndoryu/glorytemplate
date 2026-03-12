<?php

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ColeccionesCols;

/**
 * SeoSitemapProvider
 *
 * Registra proveedores de sitemap custom en el sistema nativo de WordPress (5.5+)
 * para incluir contenido dinamico de Kamples (samples, perfiles, colecciones publicas)
 * en el sitemap XML que Google y otros buscadores consultan.
 *
 * Registrar llamando SeoSitemapProvider::register() durante init de la app.
 */
class SeoSitemapProvider
{
    /**
     * Registra los proveedores de sitemap en WordPress.
     */
    public static function register(): void
    {
        add_filter('wp_sitemaps_add_provider', [self::class, 'filtrarProveedores'], 10, 2);
        add_filter('init', [self::class, 'registrarProveedores']);
    }

    /**
     * Registra proveedores custom de sitemap.
     */
    public static function registrarProveedores(): void
    {
        $sitemaps = wp_sitemaps_get_server();
        if ($sitemaps === null) {
            return;
        }

        $sitemaps->registry->add_provider(
            'kamples-samples',
            new SitemapSamplesProvider()
        );
        $sitemaps->registry->add_provider(
            'kamples-perfiles',
            new SitemapPerfilesProvider()
        );
        $sitemaps->registry->add_provider(
            'kamples-colecciones',
            new SitemapColeccionesProvider()
        );
    }

    /**
     * Filtra proveedores innecesarios del sitemap core de WP.
     * Evita que paginas de admin o endpoints aparezcan en el sitemap.
     */
    public static function filtrarProveedores($provider, string $name)
    {
        /* Remover el sitemap de usuarios de WP (usamos el de Kamples) */
        if ($name === 'users') {
            return false;
        }
        return $provider;
    }
}

/**
 * Proveedor de sitemap para samples activos.
 */
class SitemapSamplesProvider extends \WP_Sitemaps_Provider
{
    /** @var string */
    public $name = 'kamples-samples';
    /** @var string */
    public $object_type = 'kamples-samples';

    private const POR_PAGINA = 2000;

    public function get_url_list($page_num, $object_subtype = '')
    {
        $offset = ((int) $page_num - 1) * self::POR_PAGINA;

        try {
            $samples = SamplesRepository::listarParaSitemap(self::POR_PAGINA, $offset);
        } catch (\Throwable $e) {
            return [];
        }

        $siteUrl = home_url();
        $urls = [];
        foreach ($samples as $sample) {
            $slug = $sample[SamplesCols::SLUG] ?? '';
            if ($slug === '') {
                continue;
            }
            $entry = [
                'loc' => $siteUrl . '/sample/' . $slug . '/',
            ];

            $updatedAt = $sample[SamplesCols::UPDATED_AT] ?? $sample[SamplesCols::PUBLICADO_AT] ?? '';
            if ($updatedAt !== '') {
                $entry['lastmod'] = date('Y-m-d\TH:i:sP', strtotime($updatedAt));
            }

            $urls[] = $entry;
        }
        return $urls;
    }

    public function get_max_num_pages($object_subtype = '')
    {
        try {
            $total = SamplesRepository::contarParaSitemap();
        } catch (\Throwable $e) {
            return 0;
        }
        return (int) ceil($total / self::POR_PAGINA);
    }
}

/**
 * Proveedor de sitemap para perfiles publicos.
 */
class SitemapPerfilesProvider extends \WP_Sitemaps_Provider
{
    /** @var string */
    public $name = 'kamples-perfiles';
    /** @var string */
    public $object_type = 'kamples-perfiles';

    private const POR_PAGINA = 2000;

    public function get_url_list($page_num, $object_subtype = '')
    {
        $offset = ((int) $page_num - 1) * self::POR_PAGINA;

        try {
            $perfiles = UsuariosExtRepository::listarParaSitemap(self::POR_PAGINA, $offset);
        } catch (\Throwable $e) {
            return [];
        }

        $siteUrl = home_url();
        $urls = [];
        foreach ($perfiles as $perfil) {
            $username = $perfil[UsuariosExtCols::USERNAME] ?? '';
            if ($username === '') {
                continue;
            }
            $entry = [
                'loc' => $siteUrl . '/perfil/' . $username . '/',
            ];

            $updatedAt = $perfil[UsuariosExtCols::UPDATED_AT] ?? $perfil[UsuariosExtCols::CREATED_AT] ?? '';
            if ($updatedAt !== '') {
                $entry['lastmod'] = date('Y-m-d\TH:i:sP', strtotime($updatedAt));
            }

            $urls[] = $entry;
        }
        return $urls;
    }

    public function get_max_num_pages($object_subtype = '')
    {
        try {
            $total = UsuariosExtRepository::contarParaSitemap();
        } catch (\Throwable $e) {
            return 0;
        }
        return (int) ceil($total / self::POR_PAGINA);
    }
}

/**
 * Proveedor de sitemap para colecciones publicas.
 */
class SitemapColeccionesProvider extends \WP_Sitemaps_Provider
{
    /** @var string */
    public $name = 'kamples-colecciones';
    /** @var string */
    public $object_type = 'kamples-colecciones';

    private const POR_PAGINA = 2000;

    public function get_url_list($page_num, $object_subtype = '')
    {
        $offset = ((int) $page_num - 1) * self::POR_PAGINA;

        try {
            $colecciones = ColeccionesRepository::listarParaSitemap(self::POR_PAGINA, $offset);
        } catch (\Throwable $e) {
            return [];
        }

        $siteUrl = home_url();
        $urls = [];
        foreach ($colecciones as $col) {
            $slug = $col[ColeccionesCols::SLUG] ?? null;
            $id = $col[ColeccionesCols::ID] ?? 0;
            $identificador = $slug !== null && $slug !== '' ? $slug : $id;
            if ($id <= 0) {
                continue;
            }
            $entry = [
                'loc' => $siteUrl . '/coleccion/' . $identificador . '/',
            ];

            $updatedAt = $col[ColeccionesCols::UPDATED_AT] ?? $col[ColeccionesCols::CREATED_AT] ?? '';
            if ($updatedAt !== '') {
                $entry['lastmod'] = date('Y-m-d\TH:i:sP', strtotime($updatedAt));
            }

            $urls[] = $entry;
        }
        return $urls;
    }

    public function get_max_num_pages($object_subtype = '')
    {
        try {
            $total = ColeccionesRepository::contarParaSitemap();
        } catch (\Throwable $e) {
            return 0;
        }
        return (int) ceil($total / self::POR_PAGINA);
    }
}
