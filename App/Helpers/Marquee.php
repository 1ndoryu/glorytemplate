<?php

namespace App\Helpers;

/**
 * Marquee Helper
 * Centralizes the generation of animated marquee elements with icons.
 * 
 * Supports automatic contrast adaptation based on background color scheme.
 * Uses the Icons helper internally for consistent icon rendering.
 */
class Marquee
{
    /**
     * Number of repetitions for the marquee text (duplicated for seamless loop)
     */
    private const REPEAT_COUNT = 4;

    /**
     * Render a marquee element
     * 
     * @param string $text The text to display in the marquee
     * @param string $scheme Color scheme: 'light' (dark text on light bg) or 'dark' (light text on dark bg)
     * @param string $wrapperClass Additional CSS class for the wrapper element (e.g., 'hero-marquee')
     * @param string $icon Icon name from Icons helper (default: 'sparkles')
     * @return string HTML for the marquee
     */
    public static function render($text, $scheme = 'light', $wrapperClass = '', $icon = 'sparkles')
    {
        $schemeClass = 'marquee--' . $scheme;
        $wrapperClasses = trim('marquee ' . $schemeClass . ' ' . $wrapperClass);

        $iconHtml = Icons::get($icon, 'marquee-icon');

        $trackContent = '';

        // Generate the repeated content (2 sets for seamless loop animation)
        for ($set = 0; $set < 2; $set++) {
            for ($i = 0; $i < self::REPEAT_COUNT; $i++) {
                $trackContent .= '<span class="marquee-text">' . esc_html($text) . '</span>';
                $trackContent .= $iconHtml;
            }
        }

        $html = '<div class="' . esc_attr($wrapperClasses) . '">';
        $html .= '<div class="marquee-track">';
        $html .= $trackContent;
        $html .= '</div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * Echo a marquee element directly
     * 
     * Convenience method that outputs the marquee HTML directly.
     * 
     * @param string $text The text to display in the marquee
     * @param string $scheme Color scheme: 'light' or 'dark'
     * @param string $wrapperClass Additional CSS class for the wrapper element
     * @param string $icon Icon name from Icons helper (default: 'sparkles')
     */
    public static function echo($text, $scheme = 'light', $wrapperClass = '', $icon = 'sparkles')
    {
        echo self::render($text, $scheme, $wrapperClass, $icon);
    }
}
