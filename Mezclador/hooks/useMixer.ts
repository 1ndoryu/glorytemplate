/*
 * useMixer — Hook que sincroniza el mixer store con el motor de audio.
 * Incluye loop de metering vía requestAnimationFrame para leer peaks
 * de los AnalyserNodes y pushearlos al store.
 * También sincroniza cambios de volumen/pan/EQ con los nodos Web Audio.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMixerStore } from '../stores/mixerStore';
import { motorAudio } from '../services/motorAudioService';
import { CONSTANTES_MIXER } from '../types/mezclador';

export const useMixer = () => {
    const rafRef = useRef<number>(0);
    const activoRef = useRef(true);
    const inserts = useMixerStore(s => s.inserts);
    const actualizarPeaks = useMixerStore(s => s.actualizarPeaks);

    /* Inicializar mixer en Web Audio al montar */
    useEffect(() => {
        if (motorAudio.esMixerInicializado()) return;
        motorAudio.inicializarMixer();
    }, []);

    /* Loop de metering con rAF */
    useEffect(() => {
        activoRef.current = true;

        const leerPeaks = () => {
            if (!activoRef.current) return;
            if (!motorAudio.esMixerInicializado()) {
                rafRef.current = requestAnimationFrame(leerPeaks);
                return;
            }

            for (let i = 0; i <= CONSTANTES_MIXER.TOTAL_INSERTS; i++) {
                const peaks = motorAudio.obtenerPeaks(i);
                if (peaks) {
                    actualizarPeaks(i, peaks.peakL, peaks.peakR);
                }
            }

            rafRef.current = requestAnimationFrame(leerPeaks);
        };

        rafRef.current = requestAnimationFrame(leerPeaks);

        return () => {
            activoRef.current = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, [actualizarPeaks]);

    /* Sincronizar cambios de volumen/pan/mute con Web Audio */
    const sincronizarInsert = useCallback((insertId: number) => {
        if (!motorAudio.esMixerInicializado()) return;
        const ins = useMixerStore.getState().inserts.find(i => i.id === insertId);
        if (!ins) return;
        motorAudio.actualizarInsertMixer(ins.id, ins.volumen, ins.pan, ins.silenciado);
    }, []);

    /* Sincronizar EQ con Web Audio */
    const sincronizarEQ = useCallback((insertId: number) => {
        if (!motorAudio.esMixerInicializado()) return;
        const ins = useMixerStore.getState().inserts.find(i => i.id === insertId);
        if (!ins) return;
        ins.eq.forEach((banda, idx) => {
            motorAudio.actualizarEQInsert(insertId, idx, banda.frecuencia, banda.ganancia, banda.q);
        });
    }, []);

    return {
        inserts,
        sincronizarInsert,
        sincronizarEQ,
    };
};
