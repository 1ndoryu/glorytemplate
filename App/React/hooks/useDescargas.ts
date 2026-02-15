/*
 * Hook: useDescargas — Kamples (Fase 2.10)
 * Gestión de descargas con límites, estado y UI feedback.
 * Se le pasa al componente que necesite descargar (SampleDetalle, menú contextual).
 */

import { useState, useCallback, useEffect } from 'react';
import {
    obtenerLimites,
    descargarSample,
    type LimitesDescarga,
} from '@app/services/apiDescargas';
import { useAuthStore } from '@app/stores/authStore';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useDescargas');

interface RetornoDescargas {
    limites: LimitesDescarga | null;
    descargando: boolean;
    puedeDescargar: boolean;
    descargar: (sampleId: number) => Promise<boolean>;
    recargarLimites: () => Promise<void>;
}

export const useDescargas = (): RetornoDescargas => {
    const [limites, setLimites] = useState<LimitesDescarga | null>(null);
    const [descargando, setDescargando] = useState(false);
    const { autenticado } = useAuthStore();

    const recargarLimites = useCallback(async () => {
        if (!autenticado) return;
        const resp = await obtenerLimites();
        if (resp.ok && resp.data) {
            setLimites(resp.data);
        }
    }, [autenticado]);

    /* Cargar límites al montar si está autenticado */
    useEffect(() => {
        recargarLimites();
    }, [recargarLimites]);

    const puedeDescargar =
        autenticado &&
        limites !== null &&
        (limites.ilimitado || limites.descargasHoy < limites.limitesDiarios);

    const descargar = useCallback(
        async (sampleId: number): Promise<boolean> => {
            if (!puedeDescargar || descargando) return false;

            setDescargando(true);
            try {
                const resp = await descargarSample(sampleId);
                if (resp.ok && resp.data) {
                    /* Actualizar contador local */
                    setLimites((prev) =>
                        prev
                            ? { ...prev, descargasHoy: prev.descargasHoy + 1 }
                            : prev
                    );
                    log.info('Sample descargado', { sampleId });

                    /* Trigger descarga en el navegador */
                    const link = document.createElement('a');
                    link.href = resp.data.url;
                    link.download = resp.data.nombre;
                    link.click();

                    return true;
                }
                log.warn('Descarga rechazada', { sampleId, status: resp.status });
                return false;
            } catch (err) {
                log.error('Error descargando', err);
                return false;
            } finally {
                setDescargando(false);
            }
        },
        [puedeDescargar, descargando]
    );

    return {
        limites,
        descargando,
        puedeDescargar,
        descargar,
        recargarLimites,
    };
};
