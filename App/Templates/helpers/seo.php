<?php

namespace App\Templates\Helpers;

// Registro de canónicas y meta descriptions temporales (hasta plugin SEO)

class SeoHelper
{
    private static array $canonicalMap = [];
    private static array $metaDescriptionMap = [];
    private static array $titleMap = [];

    private static function ensureTrailingSlash(string $url): string
    {
        if ($url === '') { return $url; }
        return substr($url, -1) === '/' ? $url : ($url . '/');
    }

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

    public static function registerTitleMap(array $map): void
    {
        self::$titleMap = $map;
    }

    public static function filterDocumentTitle(array $parts): array
    {
        if (!is_page()) {
            return $parts;
        }
        $postId = get_queried_object_id();
        $seoTitle = (string) get_post_meta($postId, '_glory_seo_title', true);
        if ($seoTitle === '') {
            $slug = get_post_field('post_name', $postId);
            if (!empty(self::$titleMap[$slug])) {
                $seoTitle = (string) self::$titleMap[$slug];
            }
        }
        if ($seoTitle !== '') {
            $parts['title'] = $seoTitle;
            // Eliminar nombre del sitio y tagline para que quede exactamente el título SEO
            unset($parts['site'], $parts['tagline']);
        }
        return $parts;
    }

    public static function printCanonical(): void
    {
        if (!is_page()) {
            return;
        }
        $postId = get_queried_object_id();
        $metaCanonical = (string) get_post_meta($postId, '_glory_seo_canonical', true);
        if ($metaCanonical !== '') {
            $href = esc_url(self::ensureTrailingSlash($metaCanonical));
            echo "<link rel=\"canonical\" href=\"{$href}\" />\n";
            return;
        }
        $slug = get_post_field('post_name', $postId);
        if (!empty(self::$canonicalMap[$slug])) {
            $href = esc_url(self::ensureTrailingSlash((string) self::$canonicalMap[$slug]));
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
        $canonicalMeta = (string) get_post_meta($postId, '_glory_seo_canonical', true);
        $lang = str_replace('_', '-', get_locale());
        // Normalizar posibles literales unicode sin barra invertida (uXXXX -> \uXXXX)
        $tmpFaq = preg_replace('/(?<!\\\\)u([0-9a-fA-F]{4})/', '\\\\u$1', $faqMeta);
        $faqMeta = is_string($tmpFaq) ? $tmpFaq : '';
        $tmpBc  = preg_replace('/(?<!\\\\)u([0-9a-fA-F]{4})/', '\\\\u$1', $bcMeta);
        $bcMeta  = is_string($tmpBc) ? $tmpBc : '';
        $graph = [];
        // Intentar usar SEO por defecto del mapa si no hay metadatos
        $slug = get_post_field('post_name', $postId);
        $defaultSeo = \Glory\Manager\PageManager::getDefaultSeoForSlug(is_string($slug) ? $slug : '');

        // Base ID (usar canónica si existe, luego defaultSeo canonical, luego permalink local)
        $idBase = '';
        if ($canonicalMeta !== '') {
            $idBase = self::ensureTrailingSlash((string) esc_url_raw($canonicalMeta));
        } elseif (!empty($defaultSeo['canonical'])) {
            $idBase = self::ensureTrailingSlash((string) $defaultSeo['canonical']);
        } else {
            $idBase = self::ensureTrailingSlash((string) get_permalink($postId));
        }

        $bcHandled = false;
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
                        '@id' => $idBase . '#breadcrumb',
                        'itemListElement' => $items,
                    ];
                    $bcHandled = true;
                }
            }
        }
        if (!$bcHandled && !empty($defaultSeo['breadcrumb']) && is_array($defaultSeo['breadcrumb'])) {
            $items = [];
            $pos = 1;
            foreach ($defaultSeo['breadcrumb'] as $item) {
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
                    '@id' => $idBase . '#breadcrumb',
                    'itemListElement' => $items,
                ];
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
                '@id' => $idBase . '#breadcrumb',
                'itemListElement' => $items,
            ];
        }
        $faqHandled = false;
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
                        '@id' => $idBase . '#faq',
                        'inLanguage' => $lang,
                        'mainEntity' => $main,
                    ];
                    $faqHandled = true;
                }
            }
        }
        if (!$faqHandled && !empty($defaultSeo['faq']) && is_array($defaultSeo['faq'])) {
            $main = [];
            foreach ($defaultSeo['faq'] as $qa) {
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
                    '@id' => $idBase . '#faq',
                    'inLanguage' => $lang,
                    'mainEntity' => $main,
                ];
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

// Activa el soporte de title-tag y el filtro del título sin depender de config.php
\add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
});
\add_filter('document_title_parts', [SeoHelper::class, 'filterDocumentTitle'], 20);

// Imprimir canónico y meta description desde el tema (evitar duplicados con el core)
\add_action('init', function () {
    remove_action('wp_head', 'rel_canonical');
});
\add_action('wp_head', [\App\Templates\Helpers\SeoHelper::class, 'printCanonical'], 1);
\add_action('wp_head', [\App\Templates\Helpers\SeoHelper::class, 'printMetaDescription'], 1);
\add_action('wp_head', function () {
    if (is_page()) {
        \App\Templates\Helpers\SeoHelper::printJsonLdFromMeta(get_queried_object_id());
    }
}, 2);


