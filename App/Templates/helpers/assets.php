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
    // Optimización: srcset + sizes + WebP (Photon)
    $quality = isset($attrs['quality']) ? (int) $attrs['quality'] : 60;
    $strip   = isset($attrs['strip']) ? (string) $attrs['strip'] : 'all';

    $providedSizes = isset($attrs['sizes']) ? (string)$attrs['sizes'] : '100vw';
    $widths = isset($attrs['srcset_widths']) && is_array($attrs['srcset_widths']) && !empty($attrs['srcset_widths'])
        ? array_map('intval', $attrs['srcset_widths'])
        : [480, 735, 1024, 1280];

    // Construir srcset con WebP
    $srcsetParts = [];
    foreach ($widths as $w) {
        if ($w <= 0) { continue; }
        $srcUrl = ImageUtility::jetpack_photon_url($url, [
            'w'       => $w,
            'quality' => $quality,
            'strip'   => $strip,
            'format'  => 'webp',
        ]);
        $srcsetParts[] = esc_url($srcUrl) . ' ' . (int)$w . 'w';
    }
    $srcset = implode(', ', $srcsetParts);

    // src de fallback (escoge el menor ancho de la lista)
    $baseWidth = min($widths);
    if (isset($attrs['width']) && is_numeric($attrs['width'])) {
        $baseWidth = (int)$attrs['width'];
    }
    $src = ImageUtility::jetpack_photon_url($url, [
        'w'       => $baseWidth,
        'quality' => $quality,
        'strip'   => $strip,
        'format'  => 'webp',
    ]);

    if (!isset($attrs['loading'])) { $attrs['loading'] = 'lazy'; }
    if (!isset($attrs['decoding'])) { $attrs['decoding'] = 'async'; }

    // Atributos restantes (excluye claves internas que no deben imprimirse)
    $exclude = ['quality','strip','resize','srcset_widths','sizes','width'];
    $attrStr = ' sizes="' . esc_attr($providedSizes) . '" srcset="' . esc_attr($srcset) . '"';
    foreach ($attrs as $k => $v) {
        if (in_array($k, $exclude, true)) { continue; }
        $attrStr .= ' ' . esc_attr($k) . '="' . esc_attr((string)$v) . '"';
    }
    echo '<img src="' . esc_url($src) . '"' . $attrStr . ' />';
}


