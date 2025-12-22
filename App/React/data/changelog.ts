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
