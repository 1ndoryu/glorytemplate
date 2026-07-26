<?php
/* sentinel-disable-file directorio-abarrotado: raíz legacy de tema WordPress;
 * mover bootstrap/theme files requiere un bloque propio para no romper carga. */

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

/*
 * IMPORTANTE
 * /App son cosas especificas del proyecto.
 * /Glory debe mantener agnostico a cualquier proyecto.
 */

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
 * Cargar todos los archivos de App/ para ejecutar hooks y registros.
 * El autoload PSR-4 en composer.json sirve como respaldo.
 */
function incluirArchivos($directorio)
{
    /* Evitar escanear directorios de frontend que no contienen PHP */
    if (str_contains($directorio, 'node_modules') || str_contains($directorio, 'React')) {
        return;
    }

    $ruta_completa = get_template_directory() . "/$directorio";

    $archivos = glob($ruta_completa . "*.php");
    foreach ($archivos as $archivo) {
        include_once $archivo;
    }

    $subdirectorios = glob($ruta_completa . "*/", GLOB_ONLYDIR);
    foreach ($subdirectorios as $subdirectorio) {
        /* Extraer solo el nombre del directorio para verificar */
        $dirname = basename($subdirectorio);
        if ($dirname === 'node_modules' || $dirname === 'React') {
            continue;
        }

        $ruta_relativa = str_replace(get_template_directory() . '/', '', $subdirectorio);
        incluirArchivos($ruta_relativa);
    }
}

$directorios = [
    'App/',
];

/* 
 * PRE-CARGA CRITICA:
 * Cargar dependencias de cifrado manualmente para evitar 
 * errores de "Trait not found" o "Class not found" si el autoloader falla
 * o el orden alfabético de carga causa conflictos (App/Repository/Actividad carga antes que CifradoTrait).
 */
$preCarga = [
    'App/Services/CifradoService.php',
    /* [105C] ResearchProviderInterface debe existir antes de cargar AgentResearchService/LocalResearchProvider.
     * Gotcha: el barrido recursivo usa glob alfabetico y PHP evalua interfaces implementadas al incluir clase. */
    'App/Services/ResearchProviderInterface.php',
    'App/Repository/CifradoTrait.php'
];

foreach ($preCarga as $archivoPre) {
    $rutaPre = get_template_directory() . '/' . $archivoPre;
    if (file_exists($rutaPre)) {
        include_once $rutaPre;
    }
}

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

/* 
 * Remover site icon de WordPress y usar favicon personalizado
 */
add_action('wp_head', function () {
    $favicon_url = get_template_directory_uri() . '/Glory/assets/images/favicon.svg';
    echo '<link rel="icon" type="image/svg+xml" href="' . esc_url($favicon_url) . '">' . "\n";
}, 1);

// Remover el site icon de WordPress
remove_action('wp_head', 'wp_site_icon', 99);

/*
 * [125A-10] Capability de WhatsApp chatbot.
 * Admin tiene bypass operativo; usuarios normales reciben la capability por
 * suscripción activa, no por el rol subscriber global.
 */
add_action('init', function () {
    $role_subscriber = get_role('subscriber');
    if ($role_subscriber && $role_subscriber->has_cap('glory_whatsapp_chatbot')) {
        $role_subscriber->remove_cap('glory_whatsapp_chatbot');
    }

    $role_admin = get_role('administrator');
    if ($role_admin && !$role_admin->has_cap('glory_whatsapp_chatbot')) {
        $role_admin->add_cap('glory_whatsapp_chatbot');
    }
}, 20);

/*
 * [125B-1] Migración única: admin actual a glory_whatsapp_accounts.
 * Lee WACLI_ACCOUNT de env vars y crea la fila para el admin si no existe.
 * Se ejecuta en admin_init para evitar correr en cada request público.
 * usa option glory_whatsapp_migration_admin_done para ejecutar una sola vez.
 */
add_action('admin_init', function () {
    if (get_option('glory_whatsapp_migration_admin_done', false)) {
        return;
    }

    global $wpdb;

    $table = $wpdb->prefix . 'glory_whatsapp_accounts';

    /* Verificar que la tabla existe antes de migrar */
    $tableExists = $wpdb->get_var(
        $wpdb->prepare("SHOW TABLES LIKE %s", $table)
    );
    if (!$tableExists) {
        return;
    }

    /* Leer env vars del admin */
    $accountName = (string)($_ENV['WACLI_ACCOUNT'] ?? getenv('WACLI_ACCOUNT') ?: '');
    $adminPhone  = (string)($_ENV['WHATSAPP'] ?? getenv('WHATSAPP') ?: '');

    if ($accountName === '' || $adminPhone === '') {
        /* No hay admin configurado, marcar como completo igualmente */
        update_option('glory_whatsapp_migration_admin_done', true);
        return;
    }

    /* Buscar el usuario admin: el primer administrador */
    $admins = get_users(['role' => 'administrator', 'number' => 1]);
    if (empty($admins)) {
        update_option('glory_whatsapp_migration_admin_done', true);
        return;
    }
    $adminUser = $admins[0];

    /* Verificar si ya existe una fila para este usuario */
    $existing = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM $table WHERE user_id = %d",
            $adminUser->ID
        )
    );

    if ($existing) {
        update_option('glory_whatsapp_migration_admin_done', true);
        return;
    }

    /* Insertar la cuenta admin */
    $inserted = $wpdb->insert($table, [
        'user_id' => $adminUser->ID,
        'account_name' => $accountName,
        'phone_primary' => $adminPhone,
        'authenticated' => 1,
        'enabled' => 1,
        'health_status' => 'healthy',
    ]);

    if ($inserted !== false) {
        error_log('[WhatsApp] Admin migrado a glory_whatsapp_accounts: ' . $accountName);
    }

    update_option('glory_whatsapp_migration_admin_done', true);
}, 20);

/*
 * [125B-1] Worker de cola WhatsApp — hook para WP cron (fallback).
 * El método recomendado es systemd timer cada 5s. Si no está disponible,
 * WP cron ejecutará el worker cada minuto como alternativa.
 */
add_action('glory_whatsapp_event_worker', ['\App\Services\WhatsAppEventWorker', 'runCron']);
add_action('glory_whatsapp_outbound_worker', ['\App\Services\WhatsAppOutboundWorker', 'runCron']);

/* Agregar intervalo personalizado para WP cron */
add_filter('cron_schedules', function (array $schedules): array {
    if (!isset($schedules['every_minute'])) {
        $schedules['every_minute'] = [
            'interval' => MINUTE_IN_SECONDS,
            'display'  => 'Cada minuto',
        ];
    }
    if (!isset($schedules['every_15_minutes'])) {
        $schedules['every_15_minutes'] = [
            'interval' => 15 * MINUTE_IN_SECONDS,
            'display'  => 'Cada 15 minutos',
        ];
    }
    return $schedules;
});

/* [Fase-7] Health check sweep cada 15 minutos — deshabilita cuentas muertas + notifica admin */
add_action('glory_whatsapp_health_check', function () {
    try {
        $resultado = (new \App\Services\WacliManagerService())->runHealthCheckSweep();
        if ($resultado['disabled'] > 0) {
            error_log('[HealthCheck] ' . $resultado['disabled'] . ' cuenta(s) deshabilitada(s) en sweep');
        }
    } catch (\Throwable $e) {
        error_log('[HealthCheck] Error en sweep: ' . $e->getMessage());
    }
});

/* Programar health check en WP cron si no está ya programado */
add_action('admin_init', function () {
    if (!wp_next_scheduled('glory_whatsapp_health_check')) {
        wp_schedule_event(time() + 60, 'every_15_minutes', 'glory_whatsapp_health_check');
    }
}, 35);

/* Programar el worker en WP cron si no está ya programado */
add_action('admin_init', function () {
    if (!wp_next_scheduled('glory_whatsapp_event_worker')) {
        wp_schedule_event(time(), 'every_minute', 'glory_whatsapp_event_worker');
    }
}, 30);

/* [267A-5] Fallback de la outbox saliente. El runner systemd de 5s es el camino
 * primario; este cron evita pérdida durable si el runner no está disponible. */
add_action('init', function () {
    if (!wp_next_scheduled('glory_whatsapp_outbound_worker')) {
        wp_schedule_event(time(), 'every_minute', 'glory_whatsapp_outbound_worker');
    }
}, 30);
