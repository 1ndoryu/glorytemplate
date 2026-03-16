/*
 * trackingReproduccion — Utilidad centralizada para tracking de reproducciones.
 * Encapsula la lógica de cuándo y cómo enviar datos de duración al backend.
 *
 * El backend tiene debounce (30s): si ya existe reproducción reciente del mismo
 * user+sample, actualiza la existente. Esto permite múltiples señales (pause, ended,
 * track-change) sin crear duplicados.
 *
 * S4: Creado para reemplazar el patrón anterior de registrar en play-start
 * sin datos de duración. Ahora solo se envía cuando hay duración real.
 */

import { registrarReproduccion } from '../services/apiReproduciones';
import { useReproducidosStore } from '../stores/reproducidosStore';

/*
 * QL86: Umbral reducido a 0 — todos los audios se marcan como reproducidos
 * independientemente de su duración. El backend ya tiene debounce de 30s.
 */
const UMBRAL_MINIMO_SEG = 0;

/*
 * Envía tracking de reproducción al backend con duración real.
 * Solo envía si la duración supera el umbral mínimo.
 * QQ46: También marca el sample como reproducido en el store global
 * para que el indicador de punto rojo se actualice en tiempo real.
 * Best-effort: errores de red no bloquean la UX.
 */
export const enviarTrackingReproduccion = (
    sampleId: number,
    duracionEscuchada: number,
    completada: boolean
): void => {
    if (!sampleId || duracionEscuchada < UMBRAL_MINIMO_SEG) return;

    /* Actualizar store inmediatamente (optimista) */
    useReproducidosStore.getState().marcarReproducido(sampleId);

    registrarReproduccion(sampleId, {
        duracionEscuchada: Math.round(duracionEscuchada * 100) / 100,
        completada,
    }).catch(() => {
        /* Best-effort: tracking no bloquea UX */
    });
};
