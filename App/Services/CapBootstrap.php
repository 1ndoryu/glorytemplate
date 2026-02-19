<?php

/**
 * Bootstrap del módulo CAP
 * Maneja la inicialización de tablas y roles al activar el tema
 * 
 * @package Glory\App\Services
 */

namespace Glory\App\Services;

use Glory\App\Database\CapSchema;
use Glory\App\Models\Configuracion;

class CapBootstrap
{
    private const VERSION_OPTION = 'cap_db_version';
    private const CURRENT_VERSION = '1.0.2';

    /**
     * Inicializa el módulo CAP registrando todos los hooks necesarios
     */
    public static function init(): void
    {
        add_action('after_switch_theme', [self::class, 'onThemeActivation']);
        add_action('init', [self::class, 'verificarActualizacion']);
    }

    /**
     * Hook ejecutado cuando el tema se activa
     * Crea las tablas y registra el rol personalizado
     */
    public static function onThemeActivation(): void
    {
        self::crearInfraestructura();
    }

    /**
     * Verifica si la versión de la BD necesita actualización
     * Útil para migraciones en actualizaciones del tema
     */
    public static function verificarActualizacion(): void
    {
        $versionActual = get_option(self::VERSION_OPTION, '0');

        if (version_compare($versionActual, self::CURRENT_VERSION, '<')) {
            self::crearInfraestructura();
            update_option(self::VERSION_OPTION, self::CURRENT_VERSION);
        }
    }

    /**
     * Crea toda la infraestructura de BD y roles.
     * Envuelto en try-catch para evitar que fallos en DDL rompan la activación del tema.
     */
    private static function crearInfraestructura(): void
    {
        try {
            $schema = new CapSchema();

            /* Crear todas las tablas del módulo */
            $schema->crearTablas();

            /* Migraciones complementarias de configuración (versionadas) */
            $configuracion = new Configuracion();
            $configuracion->asegurarColumnaFlexibilidad();

            /* Registrar rol personalizado */
            CapSchema::registrarRol();

            /* Log para debugging */
            error_log('[CAP] Infraestructura de base de datos creada/actualizada');
        } catch (\Throwable $e) {
            error_log('[CAP] ERROR crítico al crear infraestructura: ' . $e->getMessage());
        }
    }

    /**
     * Elimina la infraestructura (para desinstalación)
     * No se ejecuta automáticamente, debe llamarse manualmente
     */
    public static function desinstalar(): void
    {
        CapSchema::eliminarRol();
        delete_option(self::VERSION_OPTION);

        error_log('[CAP] Módulo desinstalado');
    }
}

/* Inicializar el bootstrap */
CapBootstrap::init();
