<?php

declare(strict_types=1);

/* [267A-7] El runner no presupone la profundidad del tema: busca wp-load.php
 * hacia arriba y admite un override explicito para instalaciones no estandar. */
$wpLoad = '';
foreach ($_SERVER['argv'] ?? [] as $argument) {
    if (str_starts_with($argument, '--wp-path=')) {
        $wpLoad = substr($argument, 10);
        break;
    }
}

if ($wpLoad === '' || !file_exists($wpLoad)) {
    $searchDirectory = dirname(__DIR__);
    for ($level = 0; $level < 10; $level++) {
        $candidate = $searchDirectory . '/wp-load.php';
        if (file_exists($candidate)) {
            $wpLoad = $candidate;
            break;
        }
        $parent = dirname($searchDirectory);
        if ($parent === $searchDirectory) {
            break;
        }
        $searchDirectory = $parent;
    }
}

if ($wpLoad === '' || !file_exists($wpLoad)) {
    fwrite(STDERR, "ERROR: No se encontro wp-load.php. Usa --wp-path=/ruta/a/wp-load.php\n");
    exit(1);
}

require_once $wpLoad;

if (!class_exists('\App\Services\WhatsAppOutboundWorker')) {
    fwrite(STDERR, "ERROR: WhatsAppOutboundWorker no esta cargado.\n");
    exit(1);
}

try {
    \App\Services\WhatsAppOutboundWorker::runCron();
} catch (\Throwable $error) {
    fwrite(STDERR, "ERROR en worker saliente: " . $error->getMessage() . "\n");
    exit(1);
}
