<?php

namespace App\Database;

class Schema
{
    /**
     * Versión actual de la base de datos
     * v1.0.8: Tabla de mensajes_leidos para sistema de notificaciones no leídas
     */
    public const DB_VERSION = '1.0.8';

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
            self::repairTables();
            update_option(self::OPTION_DB_VERSION, self::DB_VERSION);
        }
    }

    /**
     * Repara tablas existentes añadiendo columnas faltantes
     * Necesario porque dbDelta no siempre añade nuevas columnas correctamente
     */
    private static function repairTables(): void
    {
        global $wpdb;

        $table_compartidos = $wpdb->prefix . 'glory_compartidos';

        /* Verificar si la tabla existe */
        $tabla_existe = $wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $table_compartidos)
        );

        if (!$tabla_existe) {
            return;
        }

        /* Verificar y añadir columna propietario_id si falta */
        $columna_propietario = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'propietario_id'",
                DB_NAME,
                $table_compartidos
            )
        );

        if (!$columna_propietario) {
            $wpdb->query("ALTER TABLE $table_compartidos ADD COLUMN propietario_id bigint(20) NOT NULL AFTER elemento_id");
            $wpdb->query("ALTER TABLE $table_compartidos ADD KEY propietario_id (propietario_id)");
        }

        /* Verificar y añadir columna fecha_compartido si falta */
        $columna_fecha = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'fecha_compartido'",
                DB_NAME,
                $table_compartidos
            )
        );

        if (!$columna_fecha) {
            $wpdb->query("ALTER TABLE $table_compartidos ADD COLUMN fecha_compartido datetime DEFAULT CURRENT_TIMESTAMP AFTER rol");
        }

        /* Verificar y añadir columna rol si falta */
        $columna_rol = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'rol'",
                DB_NAME,
                $table_compartidos
            )
        );

        if (!$columna_rol) {
            $wpdb->query("ALTER TABLE $table_compartidos ADD COLUMN rol varchar(50) DEFAULT 'colaborador' AFTER usuario_id");
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

        /* Tabla de Notificaciones (Sistema de Alertas In-App)
         * Tipos: solicitud_equipo, tarea_vence_hoy, tarea_asignada, tarea_removida,
         *        adjunto_agregado, mensaje_chat, habito_companero
         */
        $table_notificaciones = $wpdb->prefix . 'glory_notificaciones';
        $sql_notificaciones = "CREATE TABLE $table_notificaciones (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            usuario_id bigint(20) NOT NULL,
            tipo varchar(50) NOT NULL,
            titulo varchar(255) NOT NULL,
            contenido text,
            leida tinyint(1) DEFAULT 0,
            datos_extra longtext,
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            fecha_lectura datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY usuario_id (usuario_id),
            KEY tipo (tipo),
            KEY leida (leida),
            KEY fecha_creacion (fecha_creacion)
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
            urgencia enum('bloqueante', 'urgente', 'normal', 'chill') DEFAULT 'normal',
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
            urgencia enum('bloqueante', 'urgente', 'normal', 'chill') DEFAULT 'normal',
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at datetime DEFAULT NULL,
            data longtext,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY id_local (id_local),
            KEY estado (estado)
        ) $charset_collate;";

        /* Tabla de Compartidos (Sistema de Colaboración)
         * Gestiona qué elementos están compartidos con qué usuarios
         * tipo: 'tarea', 'proyecto', 'habito'
         * rol: 'colaborador' (puede editar), 'observador' (solo lectura)
         */
        $table_compartidos = $wpdb->prefix . 'glory_compartidos';
        $sql_compartidos = "CREATE TABLE $table_compartidos (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            tipo varchar(50) NOT NULL,
            elemento_id bigint(20) NOT NULL,
            propietario_id bigint(20) NOT NULL,
            usuario_id bigint(20) NOT NULL,
            rol varchar(50) DEFAULT 'colaborador',
            fecha_compartido datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY tipo (tipo),
            KEY elemento_id (elemento_id),
            KEY propietario_id (propietario_id),
            KEY usuario_id (usuario_id),
            UNIQUE KEY elemento_usuario (tipo, elemento_id, propietario_id, usuario_id)
        ) $charset_collate;";

        /* Tabla de Mensajes (Timeline Unificado Chat + Historial)
         * tipo_elemento: 'tarea', 'proyecto', 'habito'
         * tipo_mensaje: 'usuario' (chat), 'sistema' (historial de cambios)
         * accion_sistema: 'creado', 'editado', 'completado', 'reabierto', 'asignado', 'adjunto', 'prioridad', 'urgencia', 'fecha_limite'
         */
        $table_mensajes = $wpdb->prefix . 'glory_mensajes';
        $sql_mensajes = "CREATE TABLE $table_mensajes (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            tipo_elemento varchar(50) NOT NULL,
            elemento_id bigint(20) NOT NULL,
            usuario_id bigint(20) NOT NULL,
            tipo_mensaje varchar(50) NOT NULL DEFAULT 'usuario',
            contenido text NOT NULL,
            accion_sistema varchar(50) DEFAULT NULL,
            datos_extra longtext DEFAULT NULL,
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY tipo_elemento (tipo_elemento),
            KEY elemento_id (elemento_id),
            KEY usuario_id (usuario_id),
            KEY tipo_mensaje (tipo_mensaje),
            KEY fecha_creacion (fecha_creacion)
        ) $charset_collate;";

        /* 
         * Tabla de Mensajes Leídos (Sistema de Notificaciones No Leídas)
         * Trackea el último mensaje visto por cada usuario en cada elemento
         * Permite calcular cuántos mensajes nuevos hay sin leer
         */
        $table_mensajes_leidos = $wpdb->prefix . 'glory_mensajes_leidos';
        $sql_mensajes_leidos = "CREATE TABLE $table_mensajes_leidos (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            usuario_id bigint(20) NOT NULL,
            tipo_elemento varchar(50) NOT NULL,
            elemento_id bigint(20) NOT NULL,
            ultimo_mensaje_leido bigint(20) NOT NULL DEFAULT 0,
            fecha_lectura datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY usuario_elemento (usuario_id, tipo_elemento, elemento_id),
            KEY usuario_id (usuario_id),
            KEY tipo_elemento (tipo_elemento),
            KEY elemento_id (elemento_id)
        ) $charset_collate;";

        dbDelta($sql_habitos);
        dbDelta($sql_equipos);
        dbDelta($sql_notificaciones);
        dbDelta($sql_tareas);
        dbDelta($sql_proyectos);
        dbDelta($sql_compartidos);
        dbDelta($sql_mensajes);
        dbDelta($sql_mensajes_leidos);
    }

    /**
     * Nombres de tablas públicos
     */
    public static function getTableName(string $entity): string
    {
        global $wpdb;
        return $wpdb->prefix . 'glory_' . $entity;
    }

    /**
     * Asegura que una tabla existe, creandola si es necesario
     * Util para tablas nuevas que pueden no existir en instalaciones antiguas
     */
    public static function ensureTableExists(string $entity): bool
    {
        global $wpdb;
        $table = self::getTableName($entity);

        /* Verificar si la tabla existe */
        $tableExists = $wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $table)
        );

        if ($tableExists) {
            return true;
        }

        /* Si no existe, forzar la creacion de todas las tablas */
        self::createTables();

        /* Verificar nuevamente */
        return (bool)$wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $table)
        );
    }
}
