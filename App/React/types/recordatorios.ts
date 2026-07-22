/*
 * types/recordatorios.ts
 * Tipos para el plugin de Recordatorios
 */

import type {Adjunto} from './dashboard';

/* Tipo de intervalo para mostrar recordatorios */
export type IntervaloRecordatorio = 'minuto' | 'hora' | 'dia';

/* Tamaño de fuente para el texto del recordatorio */
export type TamanoFuenteRecordatorio = 'pequeno' | 'normal' | 'grande';

/* Recordatorio individual */
export interface Recordatorio {
    id: string;
    texto: string;
    adjuntos: Adjunto[];
    fechaCreacion: number; // timestamp ms
}

/* Configuración del plugin de recordatorios */
export interface ConfigRecordatorios {
    intervalo: IntervaloRecordatorio;
    intervaloMs: number; // Intervalo en milisegundos (preciso)
    tamanoFuente: TamanoFuenteRecordatorio;
}

/* Estado completo del store */
export interface EstadoRecordatorios {
    recordatorios: Recordatorio[];
    config: ConfigRecordatorios;
    idMostradoActual: string | null;
    ultimoCambio: number; // timestamp ms del último cambio de recordatorio mostrado
}
