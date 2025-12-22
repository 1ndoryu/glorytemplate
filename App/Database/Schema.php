<?php

namespace App\Database;

class Schema
{
    /**
     * Versión actual de la base de datos
     * v1.0.2: Añadida tabla de equipos para sistema social
     */
    public const DB_VERSION = '1.0.2';

    /**
     * Nombre de la opción donde guardamos la versión instalada
     */
    private const OPTION_DB_VERSION = 'glory_db_version';

    /**
     * Inicializa las tablas de la base de datos
     */
    public static function init(): void
    {
        $installed_ver = get_option(self::OPTION_DB_VERSION);

        if ($installed_ver !== self::DB_VERSION) {
            self::createTables();
            update_option(self::OPTION_DB_VERSION, self::DB_VERSION);
        }
    }

    /**
     * Crea o actualiza las tablas usando dbDelta
     */
    private static function createTables(): void
    {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        /* Tabla de Hábitos
         * Usamos id_local para el ID generado por el cliente (timestamp)
         * El ID primario es auto-increment para gestión interna
         */
        $table_habitos = $wpdb->prefix . 'glory_habitos';
        $sql_habitos = "CREATE TABLE $table_habitos (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            id_local bigint(20) NOT NULL,
            nombre varchar(255) NOT NULL,
            frecuencia_tipo varchar(50) DEFAULT 'diario',
            orden int(11) DEFAULT 0,
            completado_hoy tinyint(1) DEFAULT 0,
            fecha_creacion datetime DEFAULT '0000-00-00 00:00:00',
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at datetime DEFAULT NULL,
            data longtext,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY id_local (id_local),
            KEY updated_at (updated_at)
        ) $charset_collate;";

        /* Tabla de Equipos (Sistema Social)
         * Gestiona las conexiones entre usuarios para colaboración
         * Estados: pendiente, aceptada, rechazada, pendiente_registro
         */
        $table_equipos = $wpdb->prefix . 'glory_equipos';
        $sql_equipos = "CREATE TABLE $table_equipos (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            usuario_id bigint(20) NOT NULL,
            companero_id bigint(20) DEFAULT NULL,
            companero_email varchar(255) DEFAULT NULL,
            estado varchar(50) DEFAULT 'pendiente',
            fecha_solicitud datetime DEFAULT CURRENT_TIMESTAMP,
            fecha_respuesta datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY usuario_id (usuario_id),
            KEY companero_id (companero_id),
            KEY companero_email (companero_email),
            KEY estado (estado)
        ) $charset_collate;";

        /* Tabla de Tareas */
        $table_tareas = $wpdb->prefix . 'glory_tareas';
        $sql_tareas = "CREATE TABLE $table_tareas (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            id_local bigint(20) NOT NULL,
            proyecto_id bigint(20) DEFAULT NULL,
            padre_id bigint(20) DEFAULT NULL,
            texto text NOT NULL,
            completada tinyint(1) DEFAULT 0,
            fecha_limite datetime DEFAULT NULL,
            prioridad enum('alta', 'media', 'baja') DEFAULT NULL,
            orden int(11) DEFAULT 0,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at datetime DEFAULT NULL,
            data longtext,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY id_local (id_local),
            KEY proyecto_id (proyecto_id),
            KEY completada (completada)
        ) $charset_collate;";

        /* Tabla de Proyectos */
        $table_proyectos = $wpdb->prefix . 'glory_proyectos';
        $sql_proyectos = "CREATE TABLE $table_proyectos (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            id_local bigint(20) NOT NULL,
            nombre varchar(255) NOT NULL,
            estado varchar(50) DEFAULT 'activo',
            fecha_limite datetime DEFAULT NULL,
            prioridad enum('alta', 'media', 'baja') DEFAULT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at datetime DEFAULT NULL,
            data longtext,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY id_local (id_local),
            KEY estado (estado)
        ) $charset_collate;";

        dbDelta($sql_habitos);
        dbDelta($sql_equipos);
        dbDelta($sql_tareas);
        dbDelta($sql_proyectos);
    }

    /**
     * Nombres de tablas públicos
     */
    public static function getTableName(string $entity): string
    {
        global $wpdb;
        return $wpdb->prefix . 'glory_' . $entity;
    }
}
