<?php

/**
 * Esquema de base de datos para el módulo CAP
 * Crea todas las tablas necesarias al activar el tema/plugin
 * 
 * @package Glory\App\Database
 */

namespace Glory\App\Database;

class CapSchema
{
    private string $charsetCollate;
    private string $prefix;

    public function __construct()
    {
        global $wpdb;
        $this->charsetCollate = $wpdb->get_charset_collate();
        $this->prefix = $wpdb->prefix . 'cap_';
    }

    /**
     * Crea todas las tablas del módulo CAP
     */
    public function crearTablas(): void
    {
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $this->crearTablaCentros();
        $this->crearTablaAlumnos();
        $this->crearTablaDisponibilidad();
        $this->crearTablaClases();
        $this->crearTablaAsistencia();
        $this->crearTablaConfiguracion();
        $this->crearTablaSuscripciones();
    }

    private function crearTablaCentros(): void
    {
        $tabla = $this->prefix . 'centros';
        $sql = "CREATE TABLE {$tabla} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            nombre varchar(200) NOT NULL,
            direccion varchar(255) DEFAULT '',
            telefono varchar(50) DEFAULT '',
            email varchar(100) DEFAULT '',
            logo_url varchar(255) DEFAULT '',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) {$this->charsetCollate};";

        dbDelta($sql);
    }

    private function crearTablaAlumnos(): void
    {
        $tabla = $this->prefix . 'alumnos';
        $sql = "CREATE TABLE {$tabla} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            centro_id bigint(20) UNSIGNED NOT NULL,
            nombre varchar(200) NOT NULL,
            email varchar(100) DEFAULT '',
            telefono varchar(50) DEFAULT '',
            dni varchar(20) DEFAULT '',
            horas_completadas decimal(5,2) DEFAULT 0,
            estado enum('activo','completado','pausado') DEFAULT 'activo',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY centro_id (centro_id),
            KEY estado (estado)
        ) {$this->charsetCollate};";

        dbDelta($sql);
    }

    private function crearTablaDisponibilidad(): void
    {
        $tabla = $this->prefix . 'disponibilidad';
        $sql = "CREATE TABLE {$tabla} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            alumno_id bigint(20) UNSIGNED NOT NULL,
            dia varchar(20) NOT NULL COMMENT 'lunes, martes...',
            hora varchar(10) NOT NULL COMMENT '08:00',
            disponible tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY alumno_id (alumno_id),
            KEY dia_hora (dia, hora)
        ) {$this->charsetCollate};";

        dbDelta($sql);
    }

    private function crearTablaClases(): void
    {
        $tabla = $this->prefix . 'clases';
        $sql = "CREATE TABLE {$tabla} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            centro_id bigint(20) UNSIGNED NOT NULL,
            fecha date NOT NULL,
            hora_inicio time NOT NULL,
            hora_fin time NOT NULL,
            asignatura varchar(100) NOT NULL,
            duracion_minutos int(11) DEFAULT 60,
            bloqueada tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY centro_id (centro_id),
            KEY fecha (fecha),
            KEY bloqueada (bloqueada)
        ) {$this->charsetCollate};";

        dbDelta($sql);
    }

    private function crearTablaAsistencia(): void
    {
        $tabla = $this->prefix . 'asistencia';
        $sql = "CREATE TABLE {$tabla} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            clase_id bigint(20) UNSIGNED NOT NULL,
            alumno_id bigint(20) UNSIGNED NOT NULL,
            asistio tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY clase_alumno (clase_id, alumno_id),
            KEY alumno_id (alumno_id)
        ) {$this->charsetCollate};";

        dbDelta($sql);
    }

    private function crearTablaConfiguracion(): void
    {
        $tabla = $this->prefix . 'configuracion';
        $sql = "CREATE TABLE {$tabla} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            centro_id bigint(20) UNSIGNED NOT NULL,
            timezone varchar(100) DEFAULT 'Europe/Madrid',
            hora_inicio_manana time DEFAULT '09:00:00',
            hora_fin_manana time DEFAULT '14:00:00',
            hora_inicio_tarde time DEFAULT '16:00:00',
            hora_fin_tarde time DEFAULT '21:00:00',
            viernes_especial tinyint(1) DEFAULT 0,
            hora_fin_viernes time DEFAULT '15:00:00',
            alumnos_max_clase int(11) DEFAULT 20,
            duracion_clase int(11) DEFAULT 60 COMMENT 'en minutos',
            duracion_descanso int(11) DEFAULT 15 COMMENT 'en minutos',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY centro_id (centro_id)
        ) {$this->charsetCollate};";

        dbDelta($sql);
    }

    private function crearTablaSuscripciones(): void
    {
        $tabla = $this->prefix . 'suscripciones';
        $sql = "CREATE TABLE {$tabla} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            centro_id bigint(20) UNSIGNED NOT NULL,
            stripe_customer_id varchar(100) DEFAULT '',
            stripe_subscription_id varchar(100) DEFAULT '',
            estado enum('activa','expirada','cancelada','pago_fallido') DEFAULT 'activa',
            fecha_inicio date DEFAULT NULL,
            fecha_fin date DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY centro_id (centro_id),
            KEY estado (estado)
        ) {$this->charsetCollate};";

        dbDelta($sql);
    }

    /**
     * Registra el rol personalizado cap_admin
     */
    public static function registrarRol(): void
    {
        add_role('cap_admin', 'Administrador CAP', [
            'read' => true,
            'cap_access' => true,
            'cap_manage_students' => true,
            'cap_manage_calendar' => true,
            'cap_view_reports' => true,
        ]);
    }

    /**
     * Elimina el rol personalizado (para desinstalación)
     */
    public static function eliminarRol(): void
    {
        remove_role('cap_admin');
    }
}
