/*
 * accionesBloques — Operaciones sobre bloques del timeline.
 * Mover, eliminar, resize (stretch/clip), duplicar, dividir, config avanzada.
 */

import type { BloqueMezclador } from '../types/mezclador';
import { EVENTO_REPROGRAMAR_AUDIO } from '../types/mezclador';
import { generarIdBloque, extraerPeaks } from '../utils/audioBufferUtils';
import type { SetMezclador, GetMezclador } from './tiposMezcladorStore';

export function crearAccionesBloques(set: SetMezclador, get: GetMezclador) {
    return {
        moverBloque: (bloqueId: string, pistaIdDestino: string, compasInicio: number) => {
            get()._guardarSnapshot();
            set(prev => {
                let bloque: BloqueMezclador | null = null;

                const pistasActualizadas = prev.pistas.map(p => {
                    const idx = p.bloques.findIndex(b => b.id === bloqueId);
                    if (idx !== -1) {
                        bloque = { ...p.bloques[idx] };
                        return { ...p, bloques: p.bloques.filter(b => b.id !== bloqueId) };
                    }
                    return p;
                });

                if (!bloque) return prev;

                (bloque as BloqueMezclador).pistaId = pistaIdDestino;
                (bloque as BloqueMezclador).compasInicio = Math.max(0, compasInicio);

                return {
                    pistas: pistasActualizadas.map(p =>
                        p.id === pistaIdDestino
                            ? { ...p, bloques: [...p.bloques, bloque!] }
                            : p
                    ),
                };
            });
        },

        eliminarBloque: (bloqueId: string) => {
            get()._guardarSnapshot();
            set(prev => ({
                pistas: prev.pistas.map(p => ({
                    ...p,
                    bloques: p.bloques.filter(b => b.id !== bloqueId),
                })),
            }));
        },

        /*
         * Cambiar duración de un bloque (stretch/clip).
         * Recalcula playbackRate en stretch; aplica recorteFin en clip.
         * C284 fix: stretch resetea recorteFin; clip account recorteInicio.
         */
        setDuracionBloque: (bloqueId: string, nuevaDuracion: number) => {
            const { bpmProyecto, compasProyecto, modoResizeGlobal } = get();
            set(prev => ({
                pistas: prev.pistas.map(p => ({
                    ...p,
                    bloques: p.bloques.map(b => {
                        if (b.id !== bloqueId || !b.audioBuffer) return b;
                        const durCompas = (60 / bpmProyecto) * compasProyecto.numerador;
                        const recorteInicioActual = b.recorteInicio ?? 0;

                        if (modoResizeGlobal === 'clip') {
                            /*
                             * C284: La duración máxima en clip depende del buffer disponible
                             * descontando recorteInicio (ej: bloque dividido).
                             * recorteFin es posición absoluta en el buffer (no relativa).
                             */
                            const bufferDisponible = b.audioBuffer.duration - recorteInicioActual;
                            const durMaxCompases = bufferDisponible / (durCompas * b.playbackRate);
                            const durClamped = Math.max(0.25, Math.min(nuevaDuracion, durMaxCompases));
                            const recorteFin = recorteInicioActual + durClamped * durCompas * b.playbackRate;
                            const numPeaks = Math.max(60, Math.round(durClamped * 60));
                            const waveformPeaks = extraerPeaks(
                                b.audioBuffer, numPeaks,
                                recorteInicioActual, recorteFin - recorteInicioActual
                            );
                            return { ...b, duracionCompases: durClamped, recorteFin, waveformPeaks };
                        }

                        /*
                         * Modo stretch: recalcular playbackRate.
                         * C284 fix: resetear recorteFin a null para usar buffer completo
                         * (desde recorteInicio). El stretch controla duración via playbackRate.
                         */
                        const bufferDisponible = b.audioBuffer.duration - recorteInicioActual;
                        const durClamped = Math.max(0.25, nuevaDuracion);
                        const durWall = durClamped * durCompas;
                        const nuevoRate = Math.round(
                            Math.max(0.25, Math.min(4, bufferDisponible / durWall)) * 1e6
                        ) / 1e6;
                        return { ...b, duracionCompases: durClamped, playbackRate: nuevoRate, recorteFin: null };
                    }),
                })),
            }));
            if (get().reproduciendo) {
                window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
            }
        },

        /*
         * Duplicar un bloque existente.
         * Crea una copia justo despues del original; si hay colisión, al final de la pista.
         */
        duplicarBloque: (bloqueId: string) => {
            get()._guardarSnapshot();
            set(prev => {
                let bloqueOriginal: BloqueMezclador | null = null;
                let pistaId = '';

                for (const pista of prev.pistas) {
                    const encontrado = pista.bloques.find(b => b.id === bloqueId);
                    if (encontrado) {
                        bloqueOriginal = encontrado;
                        pistaId = pista.id;
                        break;
                    }
                }

                if (!bloqueOriginal) return prev;

                const pistaActual = prev.pistas.find(p => p.id === pistaId);
                if (!pistaActual) return prev;

                let nuevaPosicion = bloqueOriginal.compasInicio + bloqueOriginal.duracionCompases;
                const duracion = bloqueOriginal.duracionCompases;

                const bloquesOrdenados = [...pistaActual.bloques]
                    .filter(b => b.id !== bloqueId)
                    .sort((a, b2) => a.compasInicio - b2.compasInicio);

                const hayColision = (pos: number) =>
                    bloquesOrdenados.some(b => {
                        const inicioB = b.compasInicio;
                        const finB = inicioB + b.duracionCompases;
                        return pos < finB && (pos + duracion) > inicioB;
                    });

                if (hayColision(nuevaPosicion)) {
                    let finMax = 0;
                    for (const b of pistaActual.bloques) {
                        const fin = b.compasInicio + b.duracionCompases;
                        if (fin > finMax) finMax = fin;
                    }
                    nuevaPosicion = finMax;
                }

                const copia: BloqueMezclador = {
                    ...bloqueOriginal,
                    id: generarIdBloque(),
                    compasInicio: nuevaPosicion,
                };

                const finBloque = nuevaPosicion + duracion;

                return {
                    pistas: prev.pistas.map(p =>
                        p.id === pistaId
                            ? { ...p, bloques: [...p.bloques, copia] }
                            : p
                    ),
                    totalCompases: Math.max(prev.totalCompases, finBloque),
                };
            });
        },

        /*
         * Dividir un bloque en dos en una posición dada (en compases).
         * Bloque A conserva inicio, bloque B arranca desde posición de corte.
         */
        dividirBloque: (bloqueId: string, posicionCompas: number) => {
            get()._guardarSnapshot();
            const { bpmProyecto, compasProyecto } = get();
            set(prev => {
                let bloqueOriginal: BloqueMezclador | null = null;
                let pistaId = '';

                for (const pista of prev.pistas) {
                    const encontrado = pista.bloques.find(b => b.id === bloqueId);
                    if (encontrado) {
                        bloqueOriginal = encontrado;
                        pistaId = pista.id;
                        break;
                    }
                }

                if (!bloqueOriginal || !bloqueOriginal.audioBuffer) return prev;

                const posRelativa = posicionCompas - bloqueOriginal.compasInicio;
                if (posRelativa <= 0.1 || posRelativa >= bloqueOriginal.duracionCompases - 0.1) {
                    return prev;
                }

                const durCompas = (60 / bpmProyecto) * compasProyecto.numerador;
                const tiempoCorte = posRelativa * durCompas * bloqueOriginal.playbackRate;
                const recorteInicioOriginal = bloqueOriginal.recorteInicio ?? 0;

                /* Dividir waveformPeaks proporcionalmente */
                const ratioPeaks = posRelativa / bloqueOriginal.duracionCompases;
                const totalPeaks = bloqueOriginal.waveformPeaks.length;
                const cortePeaks = Math.round(totalPeaks * ratioPeaks);

                const ratioOriginal = bloqueOriginal.duracionOriginalCompases
                    ? bloqueOriginal.duracionOriginalCompases / bloqueOriginal.duracionCompases
                    : 1;

                const bloqueA: BloqueMezclador = {
                    ...bloqueOriginal,
                    duracionCompases: posRelativa,
                    waveformPeaks: bloqueOriginal.waveformPeaks.slice(0, cortePeaks),
                    duracionOriginalCompases: bloqueOriginal.duracionOriginalCompases
                        ? posRelativa * ratioOriginal
                        : posRelativa,
                };

                const durSegundaParte = bloqueOriginal.duracionCompases - posRelativa;
                const bloqueB: BloqueMezclador = {
                    ...bloqueOriginal,
                    id: generarIdBloque(),
                    compasInicio: posicionCompas,
                    duracionCompases: durSegundaParte,
                    recorteInicio: recorteInicioOriginal + tiempoCorte,
                    waveformPeaks: bloqueOriginal.waveformPeaks.slice(cortePeaks),
                    duracionOriginalCompases: bloqueOriginal.duracionOriginalCompases
                        ? durSegundaParte * ratioOriginal
                        : durSegundaParte,
                };

                return {
                    pistas: prev.pistas.map(p =>
                        p.id === pistaId
                            ? {
                                ...p,
                                bloques: p.bloques.map(b =>
                                    b.id === bloqueId ? bloqueA : b
                                ).concat(bloqueB),
                            }
                            : p
                    ),
                };
            });

            if (get().reproduciendo) {
                window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
            }
        },

        /*
         * Actualizar configuración avanzada de un bloque.
         * Recalcula duracionCompases si cambia playbackRate. Resuelve colisiones.
         */
        actualizarConfigBloque: (bloqueId: string, config: Partial<BloqueMezclador>) => {
            get()._guardarSnapshot();
            const { bpmProyecto, compasProyecto } = get();

            set(prev => {
                let totalCompases = prev.totalCompases;

                const pistas = prev.pistas.map(p => {
                    const idxBloque = p.bloques.findIndex(b => b.id === bloqueId);
                    if (idxBloque === -1) return p;

                    const bloques = p.bloques.map(b => {
                        if (b.id !== bloqueId) return b;

                        const actualizado = { ...b, ...config };

                        /* Si se cambió playbackRate, recalcular duracionCompases */
                        if (config.playbackRate !== undefined && b.audioBuffer) {
                            const recorteInicio = actualizado.recorteInicio ?? 0;
                            const finRecorte = actualizado.recorteFin ?? b.audioBuffer.duration;
                            const duracionUtil = finRecorte - recorteInicio;
                            const durCompasSegundos = (60 / bpmProyecto) * compasProyecto.numerador;
                            const nuevosDurCompases = duracionUtil / (config.playbackRate * durCompasSegundos);
                            actualizado.duracionCompases = Math.max(0.25, Math.round(nuevosDurCompases * 4) / 4);
                        }

                        return actualizado;
                    });

                    /* Resolver colisiones: empujar bloques siguientes si hay solapamiento */
                    bloques.sort((a, b2) => a.compasInicio - b2.compasInicio);
                    for (let i = 0; i < bloques.length - 1; i++) {
                        const finActual = bloques[i].compasInicio + bloques[i].duracionCompases;
                        if (finActual > bloques[i + 1].compasInicio) {
                            bloques[i + 1] = { ...bloques[i + 1], compasInicio: finActual };
                        }
                    }

                    const finUltimo = bloques.length > 0
                        ? bloques[bloques.length - 1].compasInicio + bloques[bloques.length - 1].duracionCompases
                        : 0;
                    if (finUltimo > totalCompases) totalCompases = Math.ceil(finUltimo);

                    return { ...p, bloques };
                });

                return { pistas, totalCompases };
            });

            if (get().reproduciendo) {
                window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
            }
        },
    };
}
