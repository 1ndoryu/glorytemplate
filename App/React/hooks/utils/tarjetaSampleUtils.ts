/*
 * Utilidades para TarjetaSample y hooks relacionados.
 * Extraido de useTarjetaSample.ts para cumplir SRP y limite de lineas.
 */

/* Evento para coordinar reproduccion entre tarjetas */
export const EVENTO_REPRODUCCION_SAMPLE = 'kamples:reproduccion-sample';

/* Detecta entorno desktop Tauri (flag inyectado por desktop/main.tsx) */
export const esDesktop = (): boolean => !!window.__KAMPLES_DESKTOP__;

/*
 * Accede al servicio de drag nativo expuesto en window por desktop/main.tsx.
 * Retorna null si no estamos en desktop.
 * [2003A-37] iniciarDragNativo y descargarYArrastrar aceptan iconoPersonalizado opcional.
 * generarPreviewDrag genera preview verde con nombre del sample.
 */
export const obtenerDragService = (): {
    iniciarDragNativo: (sampleId: number, nombreArchivo: string, iconoPersonalizado?: string) => Promise<boolean>;
    descargarYArrastrar: (sampleId: number, urlDescarga: string, nombreArchivo: string, iconoPersonalizado?: string) => Promise<boolean>;
    prepararDragNativo: (sampleId: number, urlRemota: string, nombreArchivo: string) => Promise<void>;
    estaListoParaDrag: (sampleId: number) => boolean;
    generarPreviewDrag: (nombre: string) => Promise<string>;
} | null => {
    const drag = window.__KAMPLES_DRAG__;
    return drag ?? null;
};

/*
 * Accede al servicio de sync expuesto en window por desktop/main.tsx.
 * Retorna null si no estamos en desktop.
 */
export const obtenerSyncService = (): {
    sincronizarSampleIndividual: (sampleId: number, carpetaPrimaria?: string, carpetaSecundaria?: string, coleccionId?: number) => Promise<string | null>;
    obtenerRutaLocal: (sampleId: number) => string | null;
} | null => {
    const sync = window.__KAMPLES_SYNC__;
    return sync?.sincronizarSampleIndividual ? sync : null;
};

/*
 * Extrae picos de audio desde un AudioBuffer para visualizacion mini-waveform.
 * Combina maximo absoluto (65%) con RMS (35%) para waveform suave.
 */
export const extraerPicosAudio = (buffer: AudioBuffer, totalBarras = 96): number[] => {
    const datos = buffer.getChannelData(0);
    const tamanoBloque = Math.max(1, Math.floor(datos.length / totalBarras));
    const picos: number[] = [];

    for (let i = 0; i < totalBarras; i++) {
        const inicio = i * tamanoBloque;
        const fin = Math.min(datos.length, inicio + tamanoBloque);
        let maximo = 0;
        let energia = 0;
        let muestras = 0;

        for (let indice = inicio; indice < fin; indice++) {
            const valor = Math.abs(datos[indice]);
            if (valor > maximo) maximo = valor;
            energia += valor * valor;
            muestras++;
        }

        const rms = muestras > 0 ? Math.sqrt(energia / muestras) : 0;
        picos.push((maximo * 0.65) + (rms * 0.35));
    }

    /* Suavizado: media ponderada con vecinos */
    const suavizados = picos.map((_, indice) => {
        const anterior = picos[indice - 1] ?? picos[indice];
        const actual = picos[indice];
        const siguiente = picos[indice + 1] ?? picos[indice];
        return (anterior * 0.25) + (actual * 0.5) + (siguiente * 0.25);
    });

    const picoGlobal = Math.max(...suavizados, 0.001);
    return suavizados.map(pico => Math.max(0.03, Math.min(1, pico / picoGlobal)));
};

/* Formatear nota musical con escala */
export const formatearKey = (key: string | null, escala: string | null): string => {
    if (!key) return '';
    const esc = escala === 'menor' ? 'm' : '';
    return `${key}${esc}`;
};
