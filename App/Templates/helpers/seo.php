<?php

namespace App\Templates\Helpers;

// Registro de canónicas y meta descriptions temporales (hasta plugin SEO)

class SeoHelper
{
    private static array $canonicalMap = [];
    private static array $metaDescriptionMap = [];

    public static function registerCanonicalMap(array $map): void
    {
        self::$canonicalMap = $map;
        add_action('wp_head', [self::class, 'printCanonical'], 1);
    }

    public static function registerMetaDescription(array $map): void
    {
        self::$metaDescriptionMap = $map;
        add_action('wp_head', [self::class, 'printMetaDescription'], 1);
    }

    public static function printCanonical(): void
    {
        if (!is_page()) {
            return;
        }
        $postId = get_queried_object_id();
        $metaCanonical = (string) get_post_meta($postId, '_glory_seo_canonical', true);
        if ($metaCanonical !== '') {
            $href = esc_url($metaCanonical);
            echo "<link rel=\"canonical\" href=\"{$href}\" />\n";
            return;
        }
        $slug = get_post_field('post_name', $postId);
        if (!empty(self::$canonicalMap[$slug])) {
            $href = esc_url(self::$canonicalMap[$slug]);
            echo "<link rel=\"canonical\" href=\"{$href}\" />\n";
        }
    }

    public static function printMetaDescription(): void
    {
        if (!is_page()) {
            return;
        }
        $postId = get_queried_object_id();
        $metaDesc = (string) get_post_meta($postId, '_glory_seo_desc', true);
        if ($metaDesc !== '') {
            $content = esc_attr($metaDesc);
            echo "<meta name=\"description\" content=\"{$content}\" />\n";
            return;
        }
        $slug = get_post_field('post_name', $postId);
        if (!empty(self::$metaDescriptionMap[$slug])) {
            $content = esc_attr(self::$metaDescriptionMap[$slug]);
            echo "<meta name=\"description\" content=\"{$content}\" />\n";
        }
    }

    public static function printJsonLd(string $json): void
    {
        // En páginas, siempre generar desde metadatos (con fallback de breadcrumb)
        if (is_page()) {
            self::printJsonLdFromMeta(get_queried_object_id());
            return;
        }
        // En otros contextos, respetar comportamiento clásico
        if (trim($json) === '') {
            return;
        }
        if (!empty($GLOBALS['gloryCopyContext'])) {
            echo '[json_ld]';
            echo $json;
            echo '[/json_ld]';
            return;
        }
        echo "<script type=\"application/ld+json\">" . $json . "</script>\n";
    }

    public static function printJsonLdFromMeta(int $postId): void
    {
        $faqMeta = (string) get_post_meta($postId, '_glory_seo_faq', true);
        $bcMeta = (string) get_post_meta($postId, '_glory_seo_breadcrumb', true);
        // Normalizar posibles literales unicode sin barra invertida
        $faqMeta = preg_replace('/(?<!\\)u([0-9a-fA-F]{4})/', '\\u$1', $faqMeta);
        $bcMeta  = preg_replace('/(?<!\\)u([0-9a-fA-F]{4})/', '\\u$1', $bcMeta);
        $graph = [];
        if ($bcMeta !== '') {
            $bcArr = json_decode($bcMeta, true);
            if (is_array($bcArr) && !empty($bcArr)) {
                $items = [];
                $pos = 1;
                foreach ($bcArr as $item) {
                    $name = isset($item['name']) ? (string) $item['name'] : '';
                    $url = isset($item['url']) ? (string) $item['url'] : '';
                    if ($name !== '') {
                        $entry = [
                            '@type' => 'ListItem',
                            'position' => $pos++,
                            'name' => $name,
                        ];
                        if ($url !== '') { $entry['item'] = $url; }
                        $items[] = $entry;
                    }
                }
                if (!empty($items)) {
                    $graph[] = [
                        '@type' => 'BreadcrumbList',
                        '@id' => get_permalink($postId) . '#breadcrumb',
                        'itemListElement' => $items,
                    ];
                }
            }
        }
        // Fallback de breadcrumb si no hay metadatos
        if (empty($graph)) {
            $items = [];
            $items[] = [
                '@type' => 'ListItem',
                'position' => 1,
                'name' => 'Inicio',
                'item' => home_url('/'),
            ];
            $items[] = [
                '@type' => 'ListItem',
                'position' => 2,
                'name' => get_the_title($postId),
                'item' => get_permalink($postId),
            ];
            $graph[] = [
                '@type' => 'BreadcrumbList',
                '@id' => get_permalink($postId) . '#breadcrumb',
                'itemListElement' => $items,
            ];
        }
        if ($faqMeta !== '') {
            $faqArr = json_decode($faqMeta, true);
            if (is_array($faqArr) && !empty($faqArr)) {
                $main = [];
                foreach ($faqArr as $qa) {
                    $q = isset($qa['q']) ? (string) $qa['q'] : '';
                    $a = isset($qa['a']) ? (string) $qa['a'] : '';
                    if ($q !== '' && $a !== '') {
                        $main[] = [
                            '@type' => 'Question',
                            'name' => $q,
                            'acceptedAnswer' => [
                                '@type' => 'Answer',
                                'text' => $a,
                            ],
                        ];
                    }
                }
                if (!empty($main)) {
                    $graph[] = [
                        '@type' => 'FAQPage',
                        '@id' => get_permalink($postId) . '#faq',
                        'mainEntity' => $main,
                    ];
                }
            }
        }
        if (!empty($graph)) {
            $json = [
                '@context' => 'https://schema.org',
                '@graph' => $graph,
            ];
            echo '<script type="application/ld+json">' . wp_json_encode($json, JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
        }
    }
}

// Registro por defecto (puede ajustarse luego)
\add_action('init', function () {
    $canonical = [
        'palas-de-padel' => 'https://materialdepadel.com/palas-de-padel/',
        'zapatillas-padel' => 'https://materialdepadel.com/zapatillas-padel/',
        'ropa-padel' => 'https://materialdepadel.com/ropa-padel/',
        'pelotas-de-padel' => 'https://materialdepadel.com/pelotas-de-padel/',
        'accesorios-padel' => 'https://materialdepadel.com/accesorios-padel/',
        'bolsas-y-paleteros' => 'https://materialdepadel.com/bolsas-y-paleteros/',
        'adidas' => 'https://materialdepadel.com/marcas/adidas/',
        'bullpadel' => 'https://materialdepadel.com/marcas/bullpadel/',
        'nox' => 'https://materialdepadel.com/marcas/nox/',
        'babolat' => 'https://materialdepadel.com/marcas/babolat/',
        'head' => 'https://materialdepadel.com/marcas/head/',
        'siux' => 'https://materialdepadel.com/marcas/siux/',
        'black-crown' => 'https://materialdepadel.com/marcas/black-crown/',
        'star-vie' => 'https://materialdepadel.com/marcas/star-vie/',
        'vibor-a' => 'https://materialdepadel.com/marcas/vibor-a/',
        'wilson' => 'https://materialdepadel.com/marcas/wilson/',
        'ofertas' => 'https://materialdepadel.com/ofertas/',
    ];
    SeoHelper::registerCanonicalMap($canonical);

    $descriptions = [
        'palas-de-padel' => 'Compra palas de pádel baratas o de gama alta. Guía por nivel y forma. Consulta precio y ofertas 2025 en Amazon.',
        'zapatillas-padel' => 'Compra zapatillas de pádel baratas o de gama alta. Guía por suela, amortiguación y ajuste. Consulta precio y ofertas 2025 en Amazon.',
        'ropa-padel' => 'Compra ropa de pádel hombre y mujer. Guía por prendas, tejidos y temporada: transpirable o térmica. Consulta precio y ofertas 2025 en Amazon.',
        'pelotas-de-padel' => 'Compra pelotas de pádel baratas o homologadas. Guía por bote, velocidad y clima. Consulta precio y ofertas 2025 en Amazon.',
        'accesorios-padel' => 'Compra accesorios de pádel baratos: overgrips, protectores, muñequeras, calcetines y presurizadores. Consulta precio y ofertas 2025 en Amazon.',
        'bolsas-y-paleteros' => 'Compra bolsas y paleteros de pádel: térmicos, con compartimento de calzado y mochilas. Consulta precio y ofertas 2025 en Amazon.',
        'ofertas' => 'Ofertas de pádel 2025: palas, zapatillas, ropa, pelotas y accesorios con descuento. Consulta precio y valoraciones en Amazon.',
        // Marcas (provisional hasta plugin SEO)
        'adidas' => 'Palas de pádel Adidas: guía rápida por nivel y forma. Consulta precio y ofertas 2025 en Amazon.',
        'bullpadel' => 'Palas de pádel Bullpadel: control, potencia o polivalentes. Consulta precio y ofertas 2025 en Amazon.',
        'nox' => 'Palas de pádel NOX: elige por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
        'babolat' => 'Palas de pádel Babolat: control, potencia y polivalentes. Consulta precio y ofertas 2025 en Amazon.',
        'head' => 'Palas de pádel Head: guía por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
        'siux' => 'Palas de pádel Siux: opciones de control, potencia y polivalentes. Consulta precio y ofertas 2025 en Amazon.',
        'black-crown' => 'Palas de pádel Black Crown: control, potencia y polivalentes. Consulta precio y ofertas 2025 en Amazon.',
        'star-vie' => 'Palas de pádel Star Vie: guía por nivel y forma. Consulta precio y ofertas 2025 en Amazon.',
        'vibor-a' => 'Palas de pádel Vibor-A: control, potencia o polivalentes. Consulta precio y ofertas 2025 en Amazon.',
        'wilson' => 'Palas de pádel Wilson: guía por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
    ];
    SeoHelper::registerMetaDescription($descriptions);
});


