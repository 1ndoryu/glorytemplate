<?php

namespace App\Seo;

use Glory\Manager\OpcionManager;

/**
 * Datos estructurados JSON-LD específicos de Cresta Campers.
 *
 * Añade:
 * - LocalBusiness en la página home
 * - Product para cada ficha de vehículo
 * - BreadcrumbList en todas las páginas gestionadas
 */
class CrestaSeo
{
    public static function register(): void
    {
        add_action('wp_head', [self::class, 'printLocalBusiness'], 3);
        add_action('wp_head', [self::class, 'printVehiculoProduct'], 3);
        add_action('wp_head', [self::class, 'printBreadcrumbs'], 3);
    }

    /**
     * Schema LocalBusiness — solo en la página home.
     */
    public static function printLocalBusiness(): void
    {
        if (!is_front_page() && !is_page('home')) {
            return;
        }

        $empresa = OpcionManager::get('empresa', []);
        $nombre  = $empresa['nombre'] ?? 'Cresta Campers';
        $email   = $empresa['email'] ?? '';
        $tel     = $empresa['telefono'] ?? '';
        $dir     = $empresa['direccion'] ?? '';

        $schema = [
            '@context'    => 'https://schema.org',
            '@type'       => 'LocalBusiness',
            'name'        => $nombre,
            'description' => 'Alquiler de camper vans totalmente equipadas en Barcelona. Recorre España a tu ritmo.',
            'url'         => home_url('/'),
            'telephone'   => $tel,
            'email'       => $email,
            'address'     => [
                '@type'           => 'PostalAddress',
                'streetAddress'   => $dir,
                'addressLocality' => 'Barcelona',
                'addressRegion'   => 'Cataluña',
                'addressCountry'  => 'ES',
            ],
            'priceRange'  => '€€',
            'sameAs'      => array_filter([
                $empresa['instagram'] ?? '',
                $empresa['facebook'] ?? '',
            ]),
        ];

        $logo = $empresa['logo'] ?? '';
        if ($logo) {
            $schema['logo'] = $logo;
            $schema['image'] = $logo;
        }

        self::printScript($schema);
    }

    /**
     * Schema Product — en fichas de vehículo (/flota/{slug}/).
     */
    public static function printVehiculoProduct(): void
    {
        // Detectar si estamos en /flota/{slug}/
        $path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
        $segments = explode('/', $path);

        if (count($segments) < 2 || $segments[0] !== 'flota' || empty($segments[1])) {
            return;
        }

        $slug = sanitize_title($segments[1]);
        $posts = get_posts([
            'post_type'   => 'vehiculo',
            'post_status' => 'publish',
            'name'        => $slug,
            'numberposts' => 1,
        ]);

        if (empty($posts)) {
            return;
        }

        $post = $posts[0];
        $id   = $post->ID;

        $nombre      = get_post_meta($id, '_vehiculo_nombre', true) ?: $post->post_title;
        $descripcion = get_post_meta($id, '_vehiculo_descripcion_corta', true) ?: '';
        $precio      = (float) get_post_meta($id, '_vehiculo_precio_base', true);
        $imagen      = get_the_post_thumbnail_url($id, 'large');

        $schema = [
            '@context'    => 'https://schema.org',
            '@type'       => 'Product',
            'name'        => $nombre,
            'description' => $descripcion,
            'url'         => home_url("/flota/{$slug}/"),
            'category'    => 'Camper Van Rental',
            'offers'      => [
                '@type'         => 'Offer',
                'priceCurrency' => 'EUR',
                'price'         => number_format($precio, 2, '.', ''),
                'unitCode'      => 'DAY',
                'availability'  => 'https://schema.org/InStock',
                'url'           => home_url("/flota/{$slug}/"),
            ],
        ];

        if ($imagen) {
            $schema['image'] = $imagen;
        }

        self::printScript($schema);
    }

    /**
     * BreadcrumbList — en todas las páginas excepto home.
     */
    public static function printBreadcrumbs(): void
    {
        if (is_front_page()) {
            return;
        }

        $path     = trim(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
        $segments = array_filter(explode('/', $path));

        if (empty($segments)) {
            return;
        }

        $items   = [];
        $items[] = [
            '@type'    => 'ListItem',
            'position' => 1,
            'name'     => 'Inicio',
            'item'     => home_url('/'),
        ];

        $acum = '';
        $pos  = 2;
        foreach ($segments as $seg) {
            $acum .= '/' . $seg;
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $pos,
                'name'     => ucfirst(str_replace('-', ' ', $seg)),
                'item'     => home_url($acum . '/'),
            ];
            $pos++;
        }

        self::printScript([
            '@context'        => 'https://schema.org',
            '@type'           => 'BreadcrumbList',
            'itemListElement' => $items,
        ]);
    }

    private static function printScript(array $data): void
    {
        echo '<script type="application/ld+json">';
        echo wp_json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        echo '</script>' . "\n";
    }
}
