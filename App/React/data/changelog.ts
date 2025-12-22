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
