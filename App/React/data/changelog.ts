export interface Cambio {
    tipo: 'nuevo' | 'mejora' | 'arreglo';
    descripcion: string;
}

export interface Version {
    version: string;
    fecha: string;
    cambios: Cambio[];
}

export const HISTORIAL_VERSIONES: Version[] = [
    {
        version: 'v1.0.3-beta',
        fecha: '2025-12-24',
        cambios: [
            {tipo: 'nuevo', descripcion: 'Sistema de Urgencia: niveles bloqueante, urgente, normal, chill'},
            {tipo: 'nuevo', descripcion: 'Ordenamiento inteligente mejorado: urgencia + prioridad + fecha'},
            {tipo: 'nuevo', descripcion: 'Hábitos en Ejecución: aparecen como tareas con urgencia automática'},
            {tipo: 'nuevo', descripcion: 'Modal expandido con Chat e Historial para tareas compartidas'},
            {tipo: 'nuevo', descripcion: 'Timeline unificado: mensajes + eventos del sistema'},
            {tipo: 'nuevo', descripcion: 'Notificaciones de mensajes de chat a participantes'},
            {tipo: 'nuevo', descripcion: 'Indicador de mensajes sin leer en tareas'},
            {tipo: 'nuevo', descripcion: 'Botón minimizar en todos los paneles'},
            {tipo: 'mejora', descripcion: 'Auto-guardado en modales de Tareas, Hábitos y Proyectos'},
            {tipo: 'mejora', descripcion: 'Toggle para ocultar/mostrar panel de chat (persistente)'},
            {tipo: 'mejora', descripcion: 'Columnas por defecto optimizadas en tabla de hábitos'},
            {tipo: 'mejora', descripcion: 'Orden de paneles por defecto mejorado'},
            {tipo: 'arreglo', descripcion: 'Modal de creación sin chat innecesario'},
            {tipo: 'arreglo', descripcion: 'Filtro Mis Asignadas excluye hábitos correctamente'},
            {tipo: 'arreglo', descripcion: 'Scroll unificado sin parpadeo'},
            {tipo: 'arreglo', descripcion: 'Tamaño de fuente pequeña en Scratchpad visible'}
        ]
    },
    {
        version: 'v1.0.2-beta',
        fecha: '2025-12-23',
        cambios: [
            {tipo: 'nuevo', descripcion: 'Sistema de Equipos: solicitudes, compañeros, estados pendientes'},
            {tipo: 'nuevo', descripcion: 'Sistema de Notificaciones: alertas en tiempo real, polling automático'},
            {tipo: 'nuevo', descripcion: 'Compartir Proyectos y Tareas con miembros del equipo'},
            {tipo: 'nuevo', descripcion: 'Asignación de tareas a participantes específicos'},
            {tipo: 'nuevo', descripcion: 'Límites de almacenamiento (50MB Free / 10GB Premium)'},
            {tipo: 'nuevo', descripcion: 'Archivos físicos con cifrado para usuarios Premium'},
            {tipo: 'nuevo', descripcion: 'Thumbnails para imágenes adjuntas'},
            {tipo: 'nuevo', descripcion: 'Sistema de alertas personalizadas (toasts y confirmaciones)'},
            {tipo: 'mejora', descripcion: 'Header compactado: iconos con tooltips'},
            {tipo: 'mejora', descripcion: 'Cache de archivos descifrados (5 min TTL)'},
            {tipo: 'arreglo', descripcion: 'Badges de solicitudes y notificaciones sincronizados'}
        ]
    },
    {
        version: 'v1.0.1-beta',
        fecha: '2025-12-22',
        cambios: [
            {tipo: 'nuevo', descripcion: 'Perfil de usuario con foto, bio y cambio de contraseña'},
            {tipo: 'nuevo', descripcion: 'Avatar del usuario visible en el header'},
            {tipo: 'nuevo', descripcion: 'Recuperación de contraseña desde el login'},
            {tipo: 'nuevo', descripcion: 'Configuración individual por panel (Hábitos, Tareas, Proyectos, Scratchpad)'},
            {tipo: 'nuevo', descripcion: 'Filtros inteligentes en panel de Ejecución'},
            {tipo: 'nuevo', descripcion: 'Sistema de tooltips personalizados'},
            {tipo: 'nuevo', descripcion: 'Mover tareas entre proyectos'},
            {tipo: 'nuevo', descripcion: 'Ordenamiento inteligente de tareas'},
            {tipo: 'nuevo', descripcion: 'Modal de historial de versiones'},
            {tipo: 'mejora', descripcion: 'Scratchpad con límite de caracteres y contador'},
            {tipo: 'mejora', descripcion: 'Botones de creación unificados en todos los paneles'},
            {tipo: 'mejora', descripcion: 'Controles de layout y visibilidad de paneles'},
            {tipo: 'arreglo', descripcion: 'Cifrado E2E ahora incluye datos del Scratchpad'}
        ]
    },
    {
        version: 'v1.0.0-beta',
        fecha: '2025-12-22',
        cambios: [
            {tipo: 'nuevo', descripcion: 'Sistema de reordenamiento de paneles (Drag & Drop)'},
            {tipo: 'nuevo', descripcion: 'Configuración de layout personalizable (columnas)'},
            {tipo: 'nuevo', descripcion: 'Foco Prioritario (Hábitos) con rachas y frecuencias'},
            {tipo: 'nuevo', descripcion: 'Gestión de Proyectos con jerarquía'},
            {tipo: 'nuevo', descripcion: 'Sistema de Tareas con subtareas y adjuntos'},
            {tipo: 'nuevo', descripcion: 'Scratchpad cifrado E2E'},
            {tipo: 'nuevo', descripcion: 'Integración con Stripe (Pagos y Suscripciones)'},
            {tipo: 'nuevo', descripcion: 'Panel de Administración'},
            {tipo: 'mejora', descripcion: 'Interfaz estilo terminal minimalista'},
            {tipo: 'mejora', descripcion: 'Sincronización robusta offline-first'}
        ]
    }
];
