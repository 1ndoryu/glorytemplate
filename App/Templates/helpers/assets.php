<?php

namespace App\Templates\Helpers;

use Glory\Utility\AssetsUtility;

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
    $attrStr = '';
    foreach ($attrs as $k => $v) { $attrStr .= ' ' . esc_attr($k) . '="' . esc_attr((string)$v) . '"'; }
    echo '<img src="' . esc_url($url) . '"' . $attrStr . ' />';
}


