<?php

namespace App\Services;

class SeoManager
{
    private static array $config = [
        'home' => [
            'title' => 'Chatbot para empresas | Hablame y arrancamos hoy',
            'description' => 'Implanta un chatbot IA que atiende clientes 24/7, agenda citas y vende por WhatsApp. Consultoría 1:1 sin agencias. Empieza hoy.',
        ],
        'servicios' => [
            'title' => 'Servicios de chatbots y automatizacion | Trabaja 1:1 contigo',
            'description' => 'Servicios de automatización y chatbots para WhatsApp, Instagram y Web. Desarrollo a medida, integraciones y consultoría 1:1 para pymes.',
        ],
        'planes' => [
            'title' => 'Precio chatbot: planes con mantenimiento | Primer mes gratis',
            'description' => 'Precios claros para tu chatbot. Planes Básico, Avanzado y Total con mantenimiento incluido. Empieza con un mes gratis.',
        ],
        'demos' => [
            'title' => 'Demo Chatbot WhatsApp | Pruebalo con tu caso (gratis)',
            'description' => 'Prueba gratis mis demos de chatbot para WhatsApp, Instagram y Web. Mira ejemplos reales para restaurantes, barberías y clínicas en vivo.',
        ],
        'blog' => [
            'title' => 'Mejores chatbots para WhatsApp Business | Casos y noticias',
            'description' => 'Noticias y casos de éxito sobre chatbots para WhatsApp Business. Aprende cómo la automatización ayuda a empresas reales.',
        ],
        'sobre-mi' => [
            'title' => 'Consultor de chatbots en Madrid | Trabajo 1:1 contigo',
            'description' => 'Soy Guillermo García, consultor de chatbots y automatización. Ayudo a empresas a ahorrar tiempo y vender más con tecnología 1:1.',
        ],
        'contacto' => [
            'title' => 'Solicitar presupuesto chatbot WhatsApp | Contacto (Guillermo)',
            'description' => 'Contacta conmigo para presupuesto de chatbot o automatización. Agenda una reunión o charlemos por WhatsApp. Respuesta en <30 min.',
        ],
        'privacidad' => [
            'title' => 'Politica de privacidad',
            'description' => 'Consulta nuestra política de privacidad. Transparencia total sobre cómo tratamos tus datos personales y tus derechos.',
        ],
        'cookies' => [
            'title' => 'Politica de cookies',
            'description' => 'Información sobre las cookies que utilizamos para mejorar tu experiencia y cómo puedes configurarlas o desactivarlas.',
        ],
    ];

    public static function register(): void
    {
        // Title filters
        add_filter('pre_get_document_title', [self::class, 'filterTitle'], 999);
        add_filter('document_title_parts', [self::class, 'filterTitleParts'], 999);

        // Meta tags and JSON-LD
        add_action('wp_head', [self::class, 'outputMetaTags'], 1);
        add_action('wp_head', [self::class, 'outputJsonLd'], 2);
    }

    private static function getCurrentSlug(): string
    {
        if (is_front_page() || is_home()) {
            return 'home';
        }

        // Try to get from global post
        $post = get_post();
        if ($post) {
            return $post->post_name;
        }

        return '';
    }

    public static function filterTitle($title)
    {
        $slug = self::getCurrentSlug();
        if (isset(self::$config[$slug])) {
            return self::$config[$slug]['title'];
        }
        return $title;
    }

    public static function filterTitleParts($parts)
    {
        $slug = self::getCurrentSlug();
        if (isset(self::$config[$slug])) {
            $parts['title'] = self::$config[$slug]['title'];
            // Keep tagline/site if wanted, or override. 
            // Usually just setting title is enough if WP handles the site name appending.
            // But usually custom SEO overrides everything.
        }
        return $parts;
    }

    public static function outputMetaTags(): void
    {
        // Handle Single Posts
        if (is_single()) {
            $post = get_post();
            $excerpt = class_exists('WP_Post') ? get_the_excerpt($post) : '';
            if (empty($excerpt) && !empty($post->post_content)) {
                $excerpt = wp_trim_words(strip_shortcodes($post->post_content), 25);
            }
            if (empty($excerpt)) {
                $excerpt = 'Artículo sobre chatbots y automatización.';
            }

            echo "\n<!-- SEO Manager (Single) -->\n";
            echo '<meta name="description" content="' . esc_attr($excerpt) . '">' . "\n";
            echo '<link rel="canonical" href="' . esc_url(get_permalink($post)) . '">' . "\n";

            // Open Graph
            echo '<meta property="og:type" content="article">' . "\n";
            echo '<meta property="og:title" content="' . esc_attr(get_the_title($post)) . '">' . "\n";
            echo '<meta property="og:description" content="' . esc_attr($excerpt) . '">' . "\n";
            echo '<meta property="og:url" content="' . esc_url(get_permalink($post)) . '">' . "\n";
            if (has_post_thumbnail($post)) {
                echo '<meta property="og:image" content="' . esc_url(get_the_post_thumbnail_url($post, 'large')) . '">' . "\n";
            }
            return;
        }

        $slug = self::getCurrentSlug();
        if (!isset(self::$config[$slug])) {
            return;
        }

        $data = self::$config[$slug];
        echo "\n<!-- SEO Manager -->\n";
        echo '<meta name="description" content="' . esc_attr($data['description']) . '">' . "\n";

        // Canonical
        $url = home_url($slug === 'home' ? '/' : '/' . $slug);
        echo '<link rel="canonical" href="' . esc_url($url) . '">' . "\n";

        // Open Graph basics (optional but good)
        echo '<meta property="og:title" content="' . esc_attr($data['title']) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($data['description']) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
        echo '<meta property="og:type" content="website">' . "\n";
    }

    public static function outputJsonLd(): void
    {
        $slug = self::getCurrentSlug();
        $homeUrl = home_url();
        $data = [];

        // Common
        $org = [
            '@type' => 'Organization',
            'name' => 'Guillermo Garcia',
            'url' => $homeUrl,
            // 'logo' => '...' // TODO: Add Logo URL
        ];

        $breadList = function ($name) use ($homeUrl, $slug) {
            $path = $slug;
            if (is_single()) {
                // For single posts, point to correct parent if needed, or just root > post
                // Assuming /blog/ is the parent for posts conceptually, although slug checks usually fail on single 
                $path = 'blog/' . basename(get_permalink());
            }

            return [
                '@type' => 'BreadcrumbList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'Inicio',
                        'item' => $homeUrl
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => $name,
                        'item' => $homeUrl . '/' . ($slug === 'home' ? '' : $path)
                    ]
                ]
            ];
        };

        if (is_single()) {
            $post = get_post();
            $authorName = get_the_author_meta('display_name', $post->post_author);

            $data = [
                '@context' => 'https://schema.org',
                '@graph' => [
                    $breadList(get_the_title($post)),
                    [
                        '@type' => 'BlogPosting',
                        'headline' => get_the_title($post),
                        'datePublished' => get_the_date('c', $post),
                        'dateModified' => get_the_modified_date('c', $post),
                        'author' => [
                            '@type' => 'Person',
                            'name' => $authorName ?: 'Guillermo Garcia'
                        ],
                        'publisher' => $org,
                        'description' => get_the_excerpt($post),
                        'mainEntityOfPage' => [
                            '@type' => 'WebPage',
                            '@id' => get_permalink($post)
                        ]
                    ]
                ]
            ];

            if (has_post_thumbnail($post)) {
                $data['@graph'][1]['image'] = get_the_post_thumbnail_url($post, 'full');
            }

            echo '<script type="application/ld+json">' . json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
            return;
        }

        switch ($slug) {
            case 'home':
                $data = [
                    '@context' => 'https://schema.org',
                    '@graph' => [
                        $org,
                        [
                            '@type' => 'WebSite',
                            'name' => 'Guillermo Garcia',
                            'url' => $homeUrl,
                            'potentialAction' => [
                                '@type' => 'SearchAction',
                                'target' => $homeUrl . '/?s={search_term_string}',
                                'query-input' => 'required name=search_term_string'
                            ]
                        ],
                        [
                            '@type' => 'ProfessionalService',
                            'name' => 'Guillermo Garcia - Chatbots y Automatizacion',
                            'image' => '', // TODO: Add hero image
                            'priceRange' => '$$',
                            'address' => [
                                '@type' => 'PostalAddress',
                                'addressLocality' => 'Madrid',
                                'addressCountry' => 'ES'
                            ],
                            'url' => $homeUrl
                        ]
                    ]
                ];
                break;

            case 'servicios':
                $data = [
                    '@context' => 'https://schema.org',
                    '@graph' => [
                        $breadList('Servicios'),
                        [
                            '@type' => 'Service',
                            'name' => 'Desarrollo de Chatbots y Automatización',
                            'provider' => $org,
                            'hasOfferCatalog' => [
                                '@type' => 'OfferCatalog',
                                'name' => 'Servicios de Consultoría',
                                'itemListElement' => [
                                    ['@type' => 'Offer', 'name' => 'Chatbots WhatsApp'],
                                    ['@type' => 'Offer', 'name' => 'Automatización de Procesos'],
                                    ['@type' => 'Offer', 'name' => 'Consultoría 1:1']
                                ]
                            ]
                        ]
                    ]
                ];
                break;

            case 'planes':
                $data = [
                    '@context' => 'https://schema.org',
                    '@graph' => [
                        $breadList('Planes'),
                        [
                            '@type' => 'ItemList',
                            'numberOfItems' => 3,
                            'itemListElement' => [
                                ['@type' => 'Product', 'name' => 'Plan Basico', 'position' => 1],
                                ['@type' => 'Product', 'name' => 'Plan Avanzado', 'position' => 2],
                                ['@type' => 'Product', 'name' => 'Plan Total', 'position' => 3],
                            ]
                        ]
                    ]
                ];
                break;

            case 'demos':
                $data = [
                    '@context' => 'https://schema.org',
                    '@graph' => [
                        $breadList('Demos'),
                        [
                            '@type' => 'Service',
                            'name' => 'Demo Chatbot WhatsApp',
                            'provider' => $org,
                            'potentialAction' => [
                                '@type' => 'ScheduleAction',
                                'target' => $homeUrl . '/demos'
                            ]
                        ]
                    ]
                ];
                break;

            case 'contacto':
                $data = [
                    '@context' => 'https://schema.org',
                    '@graph' => [
                        $breadList('Contacto'),
                        [
                            '@type' => 'ProfessionalService',
                            'name' => 'Contacto Guillermo Garcia',
                            'url' => $homeUrl . '/contacto',
                            'potentialAction' => [
                                '@type' => 'ScheduleAction',
                                'target' => 'https://calendly.com/andoryyu'
                            ]
                        ]
                    ]
                ];
                break;

            default:
                if (!empty($slug)) {
                    $data = [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            $breadList(ucfirst(str_replace('-', ' ', $slug)))
                        ]
                    ];
                }
                break;
        }

        if (!empty($data)) {
            echo '<script type="application/ld+json">' . json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
        }
    }
}
