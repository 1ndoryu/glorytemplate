/*
 * Hook: useCorregirIA — Kamples (C800)
 * Logica del modal de correccion de metadata IA.
 * Separada del componente visual (SRP).
 */

import { useState, useCallback } from 'react';
import { corregirMetadataIA } from '@app/services/apiSamples';
import { useCorregirIAStore } from '@app/stores/corregirIAStore';
import { EVENTO_SAMPLE_ACTUALIZADO } from '@app/hooks/useMenuContextualSample';
import { toast } from '@app/stores/toastStore';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useCorregirIA');

interface RetornoCorregirIA {
    instrucciones: string;
    setInstrucciones: (val: string) => void;
    enviando: boolean;
    enviar: () => Promise<boolean>;
}

export const useCorregirIA = (): RetornoCorregirIA => {
    const [instrucciones, setInstrucciones] = useState('');
    const [enviando, setEnviando] = useState(false);
    const sample = useCorregirIAStore(s => s.sample);
    const cerrar = useCorregirIAStore(s => s.cerrar);

    const enviar = useCallback(async (): Promise<boolean> => {
        if (!sample || enviando) return false;

        const textoLimpio = instrucciones.trim();
        if (textoLimpio.length < 5) {
            toast.error('Escribe instrucciones mas detalladas (minimo 5 caracteres)');
            return false;
        }

        setEnviando(true);

        try {
            const resp = await corregirMetadataIA(sample.id, textoLimpio);

            if (resp.ok && resp.data?.ok) {
                toast.exito(resp.data.mensaje || 'Metadata corregida correctamente');
                log.info('Metadata IA corregida', { sampleId: sample.id });

                /* Notificar al UI para refrescar datos del sample */
                window.dispatchEvent(
                    new CustomEvent(EVENTO_SAMPLE_ACTUALIZADO, {
                        detail: { sampleId: sample.id, cambios: resp.data.cambios ?? {} },
                    })
                );

                setInstrucciones('');
                cerrar();
                return true;
            }

            toast.error(resp.data?.mensaje || resp.error || 'Error al corregir metadata');
            return false;
        } catch (err) {
            log.error('Error inesperado al corregir metadata IA', err);
            toast.error('Error de red al enviar correccion');
            return false;
        } finally {
            setEnviando(false);
        }
    }, [sample, instrucciones, enviando, cerrar]);

    return { instrucciones, setInstrucciones, enviando, enviar };
};
