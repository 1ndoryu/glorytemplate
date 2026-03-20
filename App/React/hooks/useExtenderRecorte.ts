/*
 * Hook: useExtenderRecorte — Kamples (QQ130 + QK59)
 * Logica del modal de extension de recortes de audio.
 * Separada del componente visual (SRP).
 *
 * Gestiona: extension del recorte actual + generacion del segmento siguiente + restauracion.
 */

import { useState, useCallback } from 'react';
import { extenderRecorte, generarSiguienteSample, restaurarRecorte } from '@app/services/apiSamples';
import { useExtenderRecorteStore } from '@app/stores/extenderRecorteStore';
import { EVENTO_SAMPLE_ACTUALIZADO, EVENTO_SAMPLE_CREADO } from '@app/hooks/useMenuContextualSample';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
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
    enviarRestauracion: () => Promise<boolean>;
    puedeRestaurar: boolean;
}

export const useExtenderRecorte = (): RetornoExtenderRecorte => {
    const [segAntes, setSegAntes] = useState(0);
    const [segDespues, setSegDespues] = useState(5);
    const [duracionSiguiente, setDuracionSiguiente] = useState(15);
    const [enviando, setEnviando] = useState(false);

    const sample = useExtenderRecorteStore(s => s.sample);
    const cerrar = useExtenderRecorteStore(s => s.cerrar);

    /* QK59: Determinar si el sample fue extendido previamente (tiene timing original guardado) */
    const puedeRestaurar = Boolean(
        sample?.metadata?.timing_original_inicio_seg != null
        && sample?.metadata?.timing_original_fin_seg != null,
    );

    const enviarExtension = useCallback(async (): Promise<boolean> => {
        if (!sample || enviando) return false;

        if (segAntes === 0 && segDespues === 0) {
            toast.error(getT()('error.extensionMinima'));
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
                            cambios: {
                                duracion: resp.data.duracion,
                                audioHash: resp.data.audioHash,
                            },
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
            toast.error(getT()('error.redExtension'));
            return false;
        } finally {
            setEnviando(false);
        }
    }, [sample, segAntes, segDespues, enviando, cerrar]);

    const enviarSiguiente = useCallback(async (): Promise<boolean> => {
        if (!sample || enviando) return false;

        if (duracionSiguiente <= 0) {
            toast.error(getT()('error.duracion'));
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
            toast.error(getT()('error.redGenerarSample'));
            return false;
        } finally {
            setEnviando(false);
        }
    }, [sample, duracionSiguiente, enviando, cerrar]);

    /* QK59: Restaurar recorte al timing original */
    const enviarRestauracion = useCallback(async (): Promise<boolean> => {
        if (!sample || enviando) return false;

        setEnviando(true);

        try {
            const resp = await restaurarRecorte(sample.id);

            if (resp.ok && resp.data?.ok) {
                toast.exito(resp.data.mensaje || 'Recorte restaurado al original');
                log.info('Recorte restaurado', { sampleId: sample.id });

                window.dispatchEvent(
                    new CustomEvent(EVENTO_SAMPLE_ACTUALIZADO, {
                        detail: {
                            sampleId: sample.id,
                            cambios: {
                                duracion: resp.data.duracion,
                                audioHash: resp.data.audioHash,
                            },
                        },
                    })
                );

                cerrar();
                return true;
            }

            toast.error(resp.data?.mensaje || resp.error || 'Error al restaurar recorte');
            return false;
        } catch (err) {
            log.error('Error inesperado al restaurar recorte', err);
            toast.error(getT()('error.redRestaurar'));
            return false;
        } finally {
            setEnviando(false);
        }
    }, [sample, enviando, cerrar]);

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
        enviarRestauracion,
        puedeRestaurar,
    };
};
