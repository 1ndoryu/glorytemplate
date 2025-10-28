<?php

namespace App\Templates\Helpers;

use Glory\Utility\AssetsUtility;
use Glory\Utility\ImageUtility;

function renderAssetImage(string $ref, array $attrs = []): void
{
    if (!empty($GLOBALS['gloryCopyContext'])) {
        $atts = ['ref' => $ref];
        foreach (['alt','class','style','width','height','loading','decoding','fetchpriority'] as $key) {
            if (!empty($attrs[$key])) $atts[$key] = (string) $attrs[$key];
        }
        $parts = [];
        foreach ($atts as $k => $v) { $parts[] = $k . '="' . esc_attr($v) . '"'; }
        echo '[glory_image ' . implode(' ', $parts) . ']';
        return;
    }
    $url = AssetsUtility::imagenUrl($ref);
    if (!$url) return;
    // Optimización básica vía Jetpack Photon
    $quality = isset($attrs['quality']) ? (int) $attrs['quality'] : 60;
    $strip = isset($attrs['strip']) ? (string) $attrs['strip'] : 'all';
    $args = ['quality' => $quality, 'strip' => $strip];
    if (isset($attrs['resize']) && is_string($attrs['resize'])) {
        $args['resize'] = $attrs['resize'];
    } else {
        if (isset($attrs['width']) && is_numeric($attrs['width'])) { $args['w'] = (int) $attrs['width']; }
        if (isset($attrs['height']) && is_numeric($attrs['height'])) { $args['h'] = (int) $attrs['height']; }
        if (!isset($args['w']) && !isset($args['h'])) { $args['w'] = 1280; }
    }
    $optUrl = ImageUtility::jetpack_photon_url($url, $args);

    if (!isset($attrs['loading'])) { $attrs['loading'] = 'lazy'; }
    if (!isset($attrs['decoding'])) { $attrs['decoding'] = 'async'; }
    $attrStr = '';
    foreach ($attrs as $k => $v) { $attrStr .= ' ' . esc_attr($k) . '="' . esc_attr((string)$v) . '"'; }
    echo '<img src="' . esc_url($optUrl) . '"' . $attrStr . ' />';
}


