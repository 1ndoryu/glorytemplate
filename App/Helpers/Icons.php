<?php

namespace App\Helpers;

/**
 * Icons Helper
 * Centralizes SVG icons for usage across the theme.
 */
class Icons
{

    /**
     * Get an SVG icon by name
     * 
     * @param string $name The name of the icon (e.g., 'sparkles')
     * @param string $class Optional extra CSS classes
     * @return string SVG HTML
     */
    public static function get($name, $class = '')
    {
        $icons = self::getAll();

        if (!isset($icons[$name])) {
            return '';
        }

        // Inject classes if provided
        $svg = $icons[$name];
        if ($class) {
            $svg = str_replace('<svg', '<svg class="' . esc_attr($class) . '"', $svg);
        }

        return $svg;
    }

    /**
     * Define all icons here
     */
    private static function getAll()
    {
        return [
            'sparkles' => '<svg id="uuid-f4e4df12-44ad-4b43-9046-7b94285dc1be" data-name="Modo de aislamiento" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26.19 26.19"><defs><style>.uuid-676f777d-f71e-4520-a559-8ed661d7300f{fill:#f3f3f0;}</style></defs><path class="uuid-676f777d-f71e-4520-a559-8ed661d7300f" d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" /></svg>',

            // Add more icons here
        ];
    }
}
