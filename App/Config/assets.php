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
    $crearBundleCss = function (): ?string {
        $dir = get_template_directory() . '/App/Assets/css';
        if (!is_dir($dir)) return null;
        $archivos = glob($dir . '/*.css') ?: [];
        $excluir = ['task.css', 'admin-elementor.css'];
        $orden = [
            'init.css'   => 10,
            'header.css' => 20,
            'Pages.css'  => 30,
            'home.css'   => 40,
            'footer.css' => 50,
        ];
        $archivos = array_values(array_filter($archivos, function ($ruta) use ($excluir) {
            return !in_array(basename($ruta), $excluir, true);
        }));
        usort($archivos, function ($a, $b) use ($orden) {
            $pa = $orden[basename($a)] ?? 999;
            $pb = $orden[basename($b)] ?? 999;
            if ($pa === $pb) return strcmp($a, $b);
            return $pa <=> $pb;
        });
        if (!$archivos) return null;
        $destDir = get_template_directory() . '/Glory/cache';
        if (!is_dir($destDir)) { @mkdir($destDir, 0755, true); }
        $dest = $destDir . '/tema-bundle.css';
        $contenido = '';
        foreach ($archivos as $ruta) {
            $contenido .= "\n/* " . basename($ruta) . " */\n" . file_get_contents($ruta);
        }
        file_put_contents($dest, $contenido, LOCK_EX);
        return file_exists($dest) ? '/Glory/cache/tema-bundle.css' : null;
    };
    $bundleRuta = $crearBundleCss();
    if ($bundleRuta) {
        $ver = @filemtime(get_template_directory() . $bundleRuta) ?: null;
        AssetManager::define('style', 'tema-bundle', $bundleRuta, [
            'deps'  => [],
            'media' => 'all',
            'ver'   => $ver,
        ]);
    } else {
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

// Fallback: si la API de CSS crítico falla, hacer asíncronos los estilos del tema en portada
add_filter('style_loader_tag', function ($tag, $handle) {
    if (is_admin()) return $tag;
    $esLocal = defined('LOCAL') && LOCAL;
    $esDev = AssetManager::isGlobalDevMode();
    if ($esLocal || $esDev) return $tag;
    if (!is_front_page()) return $tag;
    $handlesTema = ['tema-bundle','tema-init','tema-header','tema-pages','tema-home','tema-footer'];
    if (!in_array($handle, $handlesTema, true)) return $tag;
    if (strpos($tag, "media='all'") === false) return $tag;
    $fallback = '<noscript>' . $tag . '</noscript>';
    $tag = str_replace("media='all'", "media='print' onload=\"this.media='all'; this.onload=null;\"", $tag);
    return $tag . $fallback;
}, 999, 2);

