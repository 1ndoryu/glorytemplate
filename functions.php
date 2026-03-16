<?php

$directorioTemaActivo = get_stylesheet_directory();

$autoloader = get_template_directory() . '/vendor/autoload.php';
if (file_exists($autoloader)) {
    require_once $autoloader;
} else {
    error_log('Error: Composer autoload no encontrado. Ejecuta "composer install".');
}

/*
 * IMPORTANTE: Cargar dotenv ANTES de Glory Framework
 * para que las variables de entorno esten disponibles
 * cuando los plugins se inicialicen.
 */
try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    error_log('Error al cargar el archivo .env: ' . $e->getMessage());
}

$glory_loader = get_template_directory() . '/Glory/load.php';
if (file_exists($glory_loader)) {
    require_once $glory_loader;
} else {
    error_log('Error: Glory Framework loader no encontrado.');
}


// Asegurar que los feature flags se establecen primero
$control_config = get_template_directory() . '/App/Config/control.php';
if (file_exists($control_config)) {
    include_once $control_config;
}

/*
 * Directorios excluidos del auto-include: scripts CLI que hacen exit()
 * fuera de contexto web, y directorios no-PHP (logs, docs, ref, etc).
 */
$directoriosExcluidos = ['Cli', 'logs', 'docs', 'ref'];

function incluirArchivos($directorio)
{
    global $directoriosExcluidos;
    $ruta_completa = get_template_directory() . "/$directorio";

    $archivos = glob($ruta_completa . "*.php");
    if (\is_array($archivos)) {
        foreach ($archivos as $archivo) {
            include_once $archivo;
        }
    }

    $subdirectorios = glob($ruta_completa . "*/", GLOB_ONLYDIR);
    if (\is_array($subdirectorios)) {
        foreach ($subdirectorios as $subdirectorio) {
            $nombreDir = basename($subdirectorio);
            if (\in_array($nombreDir, $directoriosExcluidos, true)) {
                continue;
            }
            $ruta_relativa = str_replace(get_template_directory() . '/', '', $subdirectorio);
            incluirArchivos($ruta_relativa);
        }
    }
}

$directorios = [
    'App/',
];

foreach ($directorios as $directorio) {
    incluirArchivos($directorio);
}


// Fix SVG MIME type support
add_filter('upload_mimes', function ($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
});
add_filter('mime_types', function ($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
});
