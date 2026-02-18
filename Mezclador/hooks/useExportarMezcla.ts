/*
 * useExportarMezcla — Renderizado offline y descarga/publicación de mezcla
 * Usa OfflineAudioContext para generar WAV y descargar o pasar a ModalCrear
 */

import { useCallback } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { motorAudio } from '../services/motorAudioService';
import { codificarWav } from '../utils/audioBufferUtils';
import { compasesASegundos } from '../utils/compasUtils';
import { CONSTANTES_MEZCLADOR } from '../types/mezclador';

export const useExportarMezcla = () => {
    const pistas = useMezcladorStore(s => s.pistas);
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const setExportando = useMezcladorStore(s => s.setExportando);

    /* Renderizar mezcla a AudioBuffer */
    const renderizarMezcla = useCallback(async (): Promise<AudioBuffer | null> => {
        const duracionTotal = compasesASegundos(totalCompases, bpmProyecto, compasProyecto);

        /* Verificar límite 5 minutos */
        if (duracionTotal > CONSTANTES_MEZCLADOR.DURACION_MAXIMA_SEGUNDOS) {
            console.error('[Mezclador] Duración excede 5 minutos');
            return null;
        }

        /* Recoger todos los bloques con buffers válidos */
        const bloquesParaRenderizar = [];

        for (const pista of pistas) {
            if (pista.silenciada) continue;

            for (const bloque of pista.bloques) {
                if (!bloque.audioBuffer || bloque.silenciado) continue;

                const inicioSegundos = compasesASegundos(
                    bloque.compasInicio, bpmProyecto, compasProyecto
                );
                const duracionSegundos = compasesASegundos(
                    bloque.duracionCompases, bpmProyecto, compasProyecto
                );

                /* C215: Respetar recorte y config avanzada en export */
                const recorteInicio = bloque.recorteInicio ?? 0;
                const finRecorte = bloque.recorteFin ?? bloque.audioBuffer.duration;
                const duracionUtilBuffer = finRecorte - recorteInicio;
                const duracionBufferAjustada = duracionUtilBuffer / bloque.playbackRate;
                const duracionFinal = Math.min(duracionSegundos, duracionBufferAjustada);

                bloquesParaRenderizar.push({
                    buffer: bloque.audioBuffer,
                    cuando: inicioSegundos,
                    offset: recorteInicio,
                    duracion: duracionFinal,
                    playbackRate: bloque.playbackRate,
                    volumen: bloque.volumen * pista.volumen,
                    invertido: bloque.invertido,
                    fadeIn: bloque.fadeIn,
                    fadeOut: bloque.fadeOut,
                    /* C240: Tonalidad para export */
                    detune: bloque.detune ?? 0,
                    /* C271: Modo tonal para export */
                    modoTonalidad: bloque.modoTonalidad ?? 'resample',
                    bloqueId: bloque.id,
                });
            }
        }

        if (bloquesParaRenderizar.length === 0) return null;

        return motorAudio.renderizarOffline(bloquesParaRenderizar, duracionTotal);
    }, [pistas, bpmProyecto, compasProyecto, totalCompases]);

    /* Descargar como WAV */
    const descargarMezcla = useCallback(async (): Promise<boolean> => {
        setExportando(true);
        try {
            const buffer = await renderizarMezcla();
            if (!buffer) return false;

            const wavData = codificarWav(buffer);
            const blob = new Blob([wavData], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);

            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `kamples_mezcla_${Date.now()}.wav`;
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('[Mezclador] Error al exportar:', error);
            return false;
        } finally {
            setExportando(false);
        }
    }, [renderizarMezcla, setExportando]);

    /* Obtener File para publicar con ModalCrear */
    const obtenerArchivoParaPublicar = useCallback(async (): Promise<File | null> => {
        setExportando(true);
        try {
            const buffer = await renderizarMezcla();
            if (!buffer) return null;

            const wavData = codificarWav(buffer);
            const blob = new Blob([wavData], { type: 'audio/wav' });
            const archivo = new File(
                [blob],
                `kamples_mezcla_${Date.now()}.wav`,
                { type: 'audio/wav' }
            );

            return archivo;
        } catch (error) {
            console.error('[Mezclador] Error al preparar para publicar:', error);
            return null;
        } finally {
            setExportando(false);
        }
    }, [renderizarMezcla, setExportando]);

    /* Verificar si hay contenido para exportar */
    const puedeExportar = pistas.some(p => p.bloques.length > 0 && !p.silenciada);

    return {
        descargarMezcla,
        obtenerArchivoParaPublicar,
        puedeExportar,
    };
};
