/*
 * featureFlags — Configuración centralizada de funcionalidades del Mezclador.
 * Permite activar/desactivar módulos que aún no están listos.
 * Cuando una feature se complete, basta con cambiar su valor a true aquí.
 */

export const FEATURE_FLAGS = {
    /* Modo patrón vs canción — si false, siempre se usa modo "song" */
    modoPatronCancion: false,

    /* Channel Rack — ventana flotante de patrones/steps */
    channelRack: false,

    /* Mixer — consola de mezcla con inserts y envíos */
    mixer: false,

    /* Barra inferior de ventanas minimizadas (depende de channelRack/mixer) */
    ventanasFlotantes: false
} as const;

/* Tipo derivado para autocompletado */
export type FeatureFlag = keyof typeof FEATURE_FLAGS;
