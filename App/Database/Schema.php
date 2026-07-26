<?php

namespace App\Database;

class Schema
{
    /**
     * Versión actual de la base de datos
     * v1.0.15: Chat persistente, acciones programadas y observabilidad del agente
     * v1.0.16: Multi-usuario WhatsApp — glory_whatsapp_accounts + glory_whatsapp_event_queue
     * v1.0.17: Gateway interno y outbox saliente de alertas WhatsApp
     */
    public const DB_VERSION = '1.0.17';

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

        /* Reparar tabla compartidos */
        self::repairCompartidosTable($wpdb);

        /* Reparar tabla notas (añadir carpeta_id) */
        self::repairNotasTable($wpdb);
    }

    /**
     * Repara la tabla de compartidos
     */
    private static function repairCompartidosTable(\wpdb $wpdb): void
    {
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
     * Repara la tabla de notas (añadir carpeta_id)
     */
    private static function repairNotasTable(\wpdb $wpdb): void
    {
        $table_notas = $wpdb->prefix . 'glory_notas';

        /* Verificar si la tabla existe */
        $tabla_existe = $wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $table_notas)
        );

        if (!$tabla_existe) {
            return;
        }

        /* Verificar y añadir columna carpeta_id si falta */
        $columna_carpeta = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'carpeta_id'",
                DB_NAME,
                $table_notas
            )
        );

        if (!$columna_carpeta) {
            $wpdb->query("ALTER TABLE $table_notas ADD COLUMN carpeta_id bigint(20) DEFAULT NULL AFTER user_id");
            $wpdb->query("ALTER TABLE $table_notas ADD KEY carpeta_id (carpeta_id)");
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
            prioridad enum('muy_alta', 'alta', 'media', 'baja', 'muy_baja') DEFAULT NULL,
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
            prioridad enum('muy_alta', 'alta', 'media', 'baja', 'muy_baja') DEFAULT NULL,
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

        /* 
         * Tabla de Notas (Sistema de Guardado del Scratchpad)
         * Permite guardar notas del scratchpad con título automático
         * carpeta_id: Referencia a la carpeta (NULL = General)
         */
        $table_notas = $wpdb->prefix . 'glory_notas';
        $sql_notas = "CREATE TABLE $table_notas (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            carpeta_id bigint(20) DEFAULT NULL,
            titulo varchar(255) NOT NULL,
            contenido longtext NOT NULL,
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            fecha_modificacion datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY carpeta_id (carpeta_id),
            KEY fecha_creacion (fecha_creacion)
        ) $charset_collate;";

        /* 
         * Tabla de Carpetas de Notas (Organización jerárquica)
         * Permite organizar notas en carpetas
         */
        $table_carpetas_notas = $wpdb->prefix . 'glory_carpetas_notas';
        $sql_carpetas_notas = "CREATE TABLE $table_carpetas_notas (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            nombre varchar(255) NOT NULL,
            orden int(11) DEFAULT 0,
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY orden (orden)
        ) $charset_collate;";

        /* 
         * Tabla de Actividad (Mapa de Calor)
         * Registra cada acción completada para visualización en heatmap
         * tipo: 'tarea_completada', 'habito_cumplido', 'nota_creada', 'adjunto_subido'
         */
        $table_actividad = $wpdb->prefix . 'glory_actividad';
        $sql_actividad = "CREATE TABLE $table_actividad (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            tipo varchar(50) NOT NULL,
            elemento_id bigint(20) DEFAULT NULL,
            elemento_tipo varchar(50) DEFAULT NULL,
            proyecto_id bigint(20) DEFAULT NULL,
            fecha date NOT NULL,
            hora time DEFAULT NULL,
            detalles longtext DEFAULT NULL,
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY tipo (tipo),
            KEY elemento_id (elemento_id),
            KEY proyecto_id (proyecto_id),
            KEY fecha (fecha),
            KEY user_fecha (user_id, fecha)
        ) $charset_collate;";

        /* 
         * Tabla de Historial de Hábitos (Retroactivo)
         * Permite marcar días pasados como completados/pospuestos
         * estado: 'completado', 'pospuesto', 'omitido'
         */
        $table_habitos_historial = $wpdb->prefix . 'glory_habitos_historial';
        $sql_habitos_historial = "CREATE TABLE $table_habitos_historial (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            habito_id bigint(20) NOT NULL,
            fecha date NOT NULL,
            estado varchar(50) NOT NULL DEFAULT 'completado',
            notas text DEFAULT NULL,
            fecha_registro datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY habito_id (habito_id),
            KEY fecha (fecha),
            KEY habito_fecha (habito_id, fecha),
            UNIQUE KEY habito_fecha_unico (habito_id, fecha)
        ) $charset_collate;";

        /* 
         * Tabla de Backups (Snapshots completos del estado)
         * Almacena copias de seguridad comprimidas (gzip + base64)
         */
        $table_backups = $wpdb->prefix . 'glory_backups';
        $sql_backups = "CREATE TABLE $table_backups (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            hash varchar(64) NOT NULL,
            size_bytes bigint(20) NOT NULL DEFAULT 0,
            device varchar(255) DEFAULT NULL,
            trigger_source varchar(50) DEFAULT 'sync',
            data longtext NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY created_at (created_at)
        ) $charset_collate;";

        /* 
         * Tabla de Feedback (Comentarios de usuarios Premium)
         * Los usuarios Premium pueden enviar hasta 3 comentarios por día
         */
        $table_feedback = $wpdb->prefix . 'glory_feedback';
        $sql_feedback = "CREATE TABLE $table_feedback (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            usuario_nombre varchar(255) NOT NULL,
            usuario_email varchar(255) NOT NULL,
            tipo varchar(50) NOT NULL DEFAULT 'sugerencia',
            mensaje text NOT NULL,
            leido tinyint(1) NOT NULL DEFAULT 0,
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY tipo (tipo),
            KEY leido (leido),
            KEY fecha_creacion (fecha_creacion)
        ) $charset_collate;";

        $table_agent_actions = $wpdb->prefix . 'glory_agent_actions';
        $sql_agent_actions = "CREATE TABLE $table_agent_actions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            correlation_id varchar(80) DEFAULT NULL,
            tipo varchar(80) NOT NULL,
            titulo varchar(255) NOT NULL,
            estado varchar(50) NOT NULL DEFAULT 'requiere_aprobacion',
            requiere_aprobacion tinyint(1) NOT NULL DEFAULT 1,
            payload longtext DEFAULT NULL,
            resultado longtext DEFAULT NULL,
            logs longtext DEFAULT NULL,
            aprobado_por bigint(20) DEFAULT NULL,
            fecha_programada datetime DEFAULT NULL,
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            fecha_aprobacion datetime DEFAULT NULL,
            fecha_ejecucion datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY correlation_id (correlation_id),
            KEY tipo (tipo),
            KEY estado (estado),
            KEY fecha_programada (fecha_programada),
            KEY fecha_creacion (fecha_creacion)
        ) $charset_collate;";

        $table_agent_chat = $wpdb->prefix . 'glory_agent_chat_messages';
        $sql_agent_chat = "CREATE TABLE $table_agent_chat (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            session_id varchar(80) NOT NULL,
            rol varchar(20) NOT NULL,
            contenido longtext NOT NULL,
            acciones longtext DEFAULT NULL,
            tokens int(11) NOT NULL DEFAULT 0,
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_session (user_id, session_id),
            KEY fecha_creacion (fecha_creacion)
        ) $charset_collate;";

        dbDelta($sql_habitos);
        dbDelta($sql_equipos);
        dbDelta($sql_notificaciones);
        dbDelta($sql_tareas);
        dbDelta($sql_proyectos);
        dbDelta($sql_compartidos);
        dbDelta($sql_mensajes);
        dbDelta($sql_mensajes_leidos);
        dbDelta($sql_carpetas_notas);
        dbDelta($sql_notas);
        dbDelta($sql_actividad);
        dbDelta($sql_habitos_historial);
        dbDelta($sql_backups);
        dbDelta($sql_feedback);
        dbDelta($sql_agent_actions);
        dbDelta($sql_agent_chat);

        /* [253A-11] Tabla de Grupos de Facebook (extensión fb-group-manager)
         * Almacena grupos detectados por la extensión Chrome.
         * fb_group_id: ID del grupo en Facebook (string, puede ser numérico o slug).
         * fuente: cómo se detectó (group-page, group-list, discover, link-scan, hover-popup).
         * datos_extra: JSON con campos opcionales (friendsInGroup, postsPerDay, tags, etc.).
         */
        $table_grupos_fb = $wpdb->prefix . 'glory_grupos_fb';
        $sql_grupos_fb = "CREATE TABLE $table_grupos_fb (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            fb_group_id varchar(100) NOT NULL,
            nombre varchar(500) NOT NULL,
            url varchar(500) NOT NULL,
            tipo varchar(20) DEFAULT 'unknown',
            cantidad_miembros varchar(100) DEFAULT '',
            imagen_url varchar(1000) DEFAULT '',
            fuente varchar(50) DEFAULT 'link-scan',
            categoria varchar(100) DEFAULT NULL,
            importancia tinyint DEFAULT 0,
            notas text,
            oculto tinyint(1) DEFAULT 0,
            ultima_publicacion datetime DEFAULT NULL,
            datos_extra longtext DEFAULT NULL,
            fecha_deteccion datetime DEFAULT CURRENT_TIMESTAMP,
            ultima_deteccion datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY categoria (categoria),
            KEY oculto (oculto),
            UNIQUE KEY user_fb_group (user_id, fb_group_id)
        ) $charset_collate;";

        /* [253A-11] Tabla de Categorías de Grupos FB
         * Permite personalizar categorías con icono y color.
         */
        $table_categorias_fb = $wpdb->prefix . 'glory_categorias_grupos_fb';
        $sql_categorias_fb = "CREATE TABLE $table_categorias_fb (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            nombre varchar(100) NOT NULL,
            icono varchar(50) DEFAULT 'folder',
            color varchar(20) DEFAULT '#6366f1',
            orden int(11) DEFAULT 0,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            UNIQUE KEY user_nombre (user_id, nombre)
        ) $charset_collate;";

        dbDelta($sql_grupos_fb);
        dbDelta($sql_categorias_fb);

        /* [034A-14] Tabla de entornos para grupos de Facebook.
         * Cada usuario puede tener múltiples entornos (ej: "Negocios", "Música").
         * Un entorno activo filtra la vista de grupos con overrides por grupo. */
        $table_entornos = $wpdb->prefix . 'glory_entornos_grupos_fb';
        $sql_entornos = "CREATE TABLE $table_entornos (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            nombre varchar(100) NOT NULL,
            icono varchar(50) DEFAULT 'layers',
            color varchar(20) DEFAULT '#6366f1',
            activo tinyint(1) DEFAULT 0,
            orden int(11) DEFAULT 0,
            ai_prompt text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            UNIQUE KEY user_nombre (user_id, nombre)
        ) $charset_collate;";

        /* [034A-14] Overrides de grupo por entorno.
         * Permite que cada grupo tenga categoría, importancia y oculto diferentes
         * según el entorno activo. Los valores NULL significan "usar dato base del grupo". */
        $table_overrides = $wpdb->prefix . 'glory_grupos_fb_entorno_overrides';
        $sql_overrides = "CREATE TABLE $table_overrides (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            grupo_id bigint(20) NOT NULL,
            entorno_id bigint(20) NOT NULL,
            categoria varchar(100) DEFAULT NULL,
            importancia tinyint DEFAULT NULL,
            oculto tinyint(1) DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY grupo_id (grupo_id),
            KEY entorno_id (entorno_id),
            UNIQUE KEY grupo_entorno (grupo_id, entorno_id)
        ) $charset_collate;";

        /* [034A-17] Configuración por usuario para grupos FB (duración publicado, etc.) */
        $table_config = $wpdb->prefix . 'glory_grupos_fb_config';
        $sql_config = "CREATE TABLE $table_config (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            clave varchar(100) NOT NULL,
            valor text NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY user_clave (user_id, clave)
        ) $charset_collate;";

        dbDelta($sql_entornos);
        dbDelta($sql_overrides);
        dbDelta($sql_config);

        /* [125B-1] Tabla de Cuentas WhatsApp (multi-usuario)
         * Almacena una cuenta por usuario, con estado de autenticación y métricas diarias.
         * account_name: correlaciona con --account de wacli (ej: user_3, user_7).
         * phone_primary: número de teléfono del usuario (E.164).
         * jid_primary: JID de WhatsApp cuando está autenticado.
         * authenticated: 0 = pendiente de escanear QR, 1 = vinculado.
         * blocked: bloqueado manualmente por admin (spam/abuso).
         * daily_msg_count: mensajes procesados hoy (reset diario vía daily_msg_date).
         * health_status: 'unknown', 'healthy', 'degraded', 'dead'.
         */
        $table_wa_accounts = $wpdb->prefix . 'glory_whatsapp_accounts';
        $sql_wa_accounts = "CREATE TABLE $table_wa_accounts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL UNIQUE,
            account_name varchar(32) NOT NULL UNIQUE,
            phone_primary varchar(20) NOT NULL UNIQUE,
            jid_primary varchar(64) DEFAULT NULL,
            authenticated tinyint(1) DEFAULT 0,
            linked_jid varchar(64) DEFAULT NULL,
            store_path varchar(255) DEFAULT NULL,
            enabled tinyint(1) DEFAULT 1,
            blocked tinyint(1) DEFAULT 0,
            status_transition varchar(20) DEFAULT NULL,
            daily_msg_count int(11) DEFAULT 0,
            daily_msg_date date DEFAULT NULL,
            last_sync datetime DEFAULT NULL,
            last_health_check datetime DEFAULT NULL,
            health_status varchar(20) DEFAULT 'unknown',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_account_name (account_name),
            KEY idx_jid_primary (jid_primary),
            KEY idx_enabled (enabled),
            KEY idx_health_status (health_status)
        ) $charset_collate;";

        /* [125B-1] Tabla de Cola de Eventos WhatsApp (webhook asíncrono)
         * Almacena eventos NDJSON entrantes de wacli para procesamiento diferido.
         * account_name: correlaciona con glory_whatsapp_accounts.account_name.
         * event_body: JSON completo del evento.
         * signature: HMAC-SHA256 recibido (verificación de integridad).
         * status: pending | processing | completed | failed.
         * locked_until: evita que dos workers procesen el mismo evento.
         * attempts: contador de reintentos (max_attempts default 3).
         */
        $table_wa_events = $wpdb->prefix . 'glory_whatsapp_event_queue';
        $sql_wa_events = "CREATE TABLE $table_wa_events (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            account_name varchar(32) NOT NULL,
            event_body longtext NOT NULL,
            signature varchar(128) NOT NULL,
            status varchar(20) DEFAULT 'pending',
            attempts int(11) DEFAULT 0,
            max_attempts int(11) DEFAULT 3,
            locked_until datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            processed_at datetime DEFAULT NULL,
            PRIMARY KEY (id),
            KEY idx_status (status),
            KEY idx_locked (locked_until),
            KEY idx_created (created_at)
        ) $charset_collate;";

        /* [267A-5] Gateway Nakomi: nonces anti-replay y outbox saliente aislada
         * de la cola entrante multiusuario. */
        $table_internal_nonces = $wpdb->prefix . 'glory_internal_alert_nonces';
        $sql_internal_nonces = "CREATE TABLE $table_internal_nonces (
            nonce varchar(128) NOT NULL,
            expires_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (nonce),
            KEY idx_expires_at (expires_at)
        ) $charset_collate;";

        $table_outbound_alerts = $wpdb->prefix . 'glory_whatsapp_outbound_alerts';
        $sql_outbound_alerts = "CREATE TABLE $table_outbound_alerts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            idempotency_key varchar(191) NOT NULL,
            event_type varchar(64) NOT NULL,
            payload longtext NOT NULL,
            rendered_message text NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'pending',
            attempts int(11) NOT NULL DEFAULT 0,
            available_at datetime NOT NULL,
            locked_until datetime DEFAULT NULL,
            last_error varchar(500) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            sent_at datetime DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_idempotency_key (idempotency_key),
            KEY idx_claim (status, available_at, created_at)
        ) $charset_collate;";

        dbDelta($sql_wa_accounts);
        dbDelta($sql_wa_events);
        dbDelta($sql_internal_nonces);
        dbDelta($sql_outbound_alerts);
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
     * Verifica si una tabla existe
     */
    public static function tableExists(string $entity): bool
    {
        global $wpdb;
        $table = self::getTableName($entity);
        return (bool)$wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $table)
        );
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
