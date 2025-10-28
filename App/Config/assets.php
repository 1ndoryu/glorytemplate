<?php

use Glory\Manager\AssetManager;

/**
 * Registro de Assets Específicos del Tema
 *
 * Este archivo se encarga de definir todos los scripts (JS) y estilos (CSS)
 * que pertenecen exclusivamente al tema activo, separando las responsabilidades
 * del framework Glory.
 */

// Bundle CSS en producción (no LOCAL ni dev mode)
if ((defined('LOCAL') && LOCAL) || AssetManager::isGlobalDevMode()) {
    AssetManager::defineFolder(
        'style',
        'App/Assets/css/',
        ['deps' => [], 'media' => 'all'],
        'tema-',
        [
            'task.css',
            'admin-elementor.css'
        ]
    );
} else {
    $crearBundleCss = function (): array {
        $dir = get_template_directory() . '/App/Assets/css';
        if (!is_dir($dir)) return [null, null];
        $archivos = glob($dir . '/*.css') ?: [];
        $excluir = ['task.css', 'admin-elementor.css'];
        $orden = [
            'init.css'   => 10,
            'Pages.css'  => 20,
            'home.css'   => 30,
            'header.css' => 40,
            'footer.css' => 50,
        ];
        $criticos = ['init.css','Pages.css','home.css'];
        $archivos = array_values(array_filter($archivos, function ($ruta) use ($excluir) {
            return !in_array(basename($ruta), $excluir, true);
        }));
        usort($archivos, function ($a, $b) use ($orden) {
            $pa = $orden[basename($a)] ?? 999;
            $pb = $orden[basename($b)] ?? 999;
            if ($pa === $pb) return strcmp($a, $b);
            return $pa <=> $pb;
        });
        if (!$archivos) return [null, null];
        $destDir = get_template_directory() . '/Glory/cache';
        if (!is_dir($destDir)) { @mkdir($destDir, 0755, true); }
        $destCrit = $destDir . '/tema-critical.css';
        $destResto = $destDir . '/tema-resto.css';
        $contenidoCrit = '';
        $contenidoResto = '';
        foreach ($archivos as $ruta) {
            $base = basename($ruta);
            $bloque = "\n/* " . $base . " */\n" . file_get_contents($ruta);
            if (in_array($base, $criticos, true)) {
                $contenidoCrit .= $bloque;
            } else {
                $contenidoResto .= $bloque;
            }
        }
        if ($contenidoCrit !== '') file_put_contents($destCrit, $contenidoCrit, LOCK_EX);
        if ($contenidoResto !== '') file_put_contents($destResto, $contenidoResto, LOCK_EX);
        $rutaCrit = file_exists($destCrit) ? '/Glory/cache/tema-critical.css' : null;
        $rutaResto = file_exists($destResto) ? '/Glory/cache/tema-resto.css' : null;
        return [$rutaCrit, $rutaResto];
    };
    [$bundleCrit, $bundleResto] = $crearBundleCss();
    if ($bundleCrit) {
        $verC = @filemtime(get_template_directory() . $bundleCrit) ?: null;
        AssetManager::define('style', 'tema-critical', $bundleCrit, [
            'deps'  => [],
            'media' => 'all',
            'ver'   => $verC,
        ]);
    }
    if ($bundleResto) {
        $verR = @filemtime(get_template_directory() . $bundleResto) ?: null;
        AssetManager::define('style', 'tema-resto', $bundleResto, [
            'deps'  => [],
            'media' => 'all',
            'ver'   => $verR,
        ]);
        // Cargar el resto de estilos de forma asíncrona (onload swap)
        add_filter('style_loader_tag', function ($tag, $handle) {
            if ($handle !== 'tema-resto') return $tag;
            if (strpos($tag, "media='all'") === false) return $tag;
            $fallback = '<noscript>' . $tag . '</noscript>';
            $tag = str_replace("media='all'", "media='print' onload=\"this.media='all'; this.onload=null;\"", $tag);
            return $tag . $fallback;
        }, 999, 2);
    }
    if (!$bundleCrit && !$bundleResto) {
        // Fallback a la carga por archivos si no se pudo crear bundle
        AssetManager::defineFolder(
            'style',
            'App/Assets/css/',
            ['deps' => [], 'media' => 'all'],
            'tema-',
            ['task.css', 'admin-elementor.css']
        );
    }
}

// Registrar CSS específico de tareas sólo si la feature 'task' está activa
AssetManager::define(
    'style',
    'tema-task',
    'App/Assets/css/task.css',
    [
        'deps'    => [],
        'media'   => 'all',
        'feature' => 'task',
    ]
);

// Optimización de jQuery: quitar jquery-migrate (mantener jQuery en el head para compatibilidad)
add_action('wp_default_scripts', function ($scripts) {
    if (is_admin()) { return; }
    if (!isset($scripts->registered['jquery'])) { return; }
    $scripts->registered['jquery']->deps = array_values(array_diff(
        $scripts->registered['jquery']->deps ?? [],
        ['jquery-migrate']
    ));
});

// Hacer jQuery no bloqueante en el head (manteniendo compatibilidad)
add_filter('script_loader_tag', function ($tag, $handle) {
    if (in_array($handle, ['jquery', 'jquery-core'], true)) {
        if (strpos($tag, ' defer') === false) {
            $tag = str_replace(' src=', ' defer src=', $tag);
        }
    }
    return $tag;
}, 10, 2);

// Asegurar que estilos no necesarios no se encolen en el frontend
add_action('wp_enqueue_scripts', function () {
    if (is_admin()) return;
    wp_dequeue_style('glory-daterange');
    wp_dequeue_style('glory-admin-elementor-tweaks');
}, 1000);

