/*
 * Hook: useExtenderRecorte — Kamples (QQ130)
 * Logica del modal de extension de recortes de audio.
 * Separada del componente visual (SRP).
 *
 * Gestiona: extension del recorte actual + generacion del segmento siguiente.
 */

import { useState, useCallback } from 'react';
import { extenderRecorte, generarSiguienteSample } from '@app/services/apiSamples';
import { useExtenderRecorteStore } from '@app/stores/extenderRecorteStore';
import { EVENTO_SAMPLE_ACTUALIZADO, EVENTO_SAMPLE_CREADO } from '@app/hooks/useMenuContextualSample';
import { toast } from '@app/stores/toastStore';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useExtenderRecorte');

interface RetornoExtenderRecorte {
    segAntes: number;
    setSegAntes: (val: number) => void;
    segDespues: number;
    setSegDespues: (val: number) => void;
    duracionSiguiente: number;
    setDuracionSiguiente: (val: number) => void;
    enviando: boolean;
    enviarExtension: () => Promise<boolean>;
    enviarSiguiente: () => Promise<boolean>;
}

export const useExtenderRecorte = (): RetornoExtenderRecorte => {
    const [segAntes, setSegAntes] = useState(0);
    const [segDespues, setSegDespues] = useState(5);
    const [duracionSiguiente, setDuracionSiguiente] = useState(15);
    const [enviando, setEnviando] = useState(false);

    const sample = useExtenderRecorteStore(s => s.sample);
    const cerrar = useExtenderRecorteStore(s => s.cerrar);

    const enviarExtension = useCallback(async (): Promise<boolean> => {
        if (!sample || enviando) return false;

        if (segAntes === 0 && segDespues === 0) {
            toast.error('Agrega al menos 1 segundo de extension');
            return false;
        }

        setEnviando(true);

        try {
            const resp = await extenderRecorte(sample.id, segAntes, segDespues);

            if (resp.ok && resp.data?.ok) {
                toast.exito(resp.data.mensaje || 'Recorte extendido correctamente');
                log.info('Recorte extendido', { sampleId: sample.id, segAntes, segDespues });

                window.dispatchEvent(
                    new CustomEvent(EVENTO_SAMPLE_ACTUALIZADO, {
                        detail: {
                            sampleId: sample.id,
                            cambios: { duracion: resp.data.duracion },
                        },
                    })
                );

                cerrar();
                return true;
            }

            toast.error(resp.data?.mensaje || resp.error || 'Error al extender recorte');
            return false;
        } catch (err) {
            log.error('Error inesperado al extender recorte', err);
            toast.error('Error de red al enviar extension');
            return false;
        } finally {
            setEnviando(false);
        }
    }, [sample, segAntes, segDespues, enviando, cerrar]);

    const enviarSiguiente = useCallback(async (): Promise<boolean> => {
        if (!sample || enviando) return false;

        if (duracionSiguiente <= 0) {
            toast.error('La duracion debe ser mayor a 0');
            return false;
        }

        setEnviando(true);

        try {
            const resp = await generarSiguienteSample(sample.id, duracionSiguiente);

            if (resp.ok && resp.data?.ok) {
                toast.exito(resp.data.mensaje || 'Nuevo sample generado');
                log.info('Sample siguiente generado', {
                    sampleOriginal: sample.id,
                    nuevoId: resp.data.nuevoSampleId,
                });

                window.dispatchEvent(
                    new CustomEvent(EVENTO_SAMPLE_CREADO, {
                        detail: { nuevoSampleId: resp.data.nuevoSampleId },
                    })
                );

                cerrar();
                return true;
            }

            toast.error(resp.data?.mensaje || resp.error || 'Error al generar sample siguiente');
            return false;
        } catch (err) {
            log.error('Error inesperado al generar sample siguiente', err);
            toast.error('Error de red al generar sample');
            return false;
        } finally {
            setEnviando(false);
        }
    }, [sample, duracionSiguiente, enviando, cerrar]);

    return {
        segAntes,
        setSegAntes,
        segDespues,
        setSegDespues,
        duracionSiguiente,
        setDuracionSiguiente,
        enviando,
        enviarExtension,
        enviarSiguiente,
    };
};
