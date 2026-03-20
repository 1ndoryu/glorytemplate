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
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { crearLogger } from '@app/services/logger';
import { esTauri } from '@app/utils/plataforma';

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
    const autenticado = useAuthStore(s => s.autenticado);

    const recargarLimites = useCallback(async () => {
        if (!autenticado) return;
        try {
            const resp = await obtenerLimites();
            if (resp.ok && resp.data) {
                setLimites(resp.data);
            }
        } catch (err) {
            log.error('Error recargando límites de descarga', err);
        }
    }, [autenticado]);

    /* Cargar límites al montar si está autenticado */
    useEffect(() => {
        recargarLimites();
    }, [recargarLimites]);

    const puedeDescargar =
        autenticado &&
        limites !== null &&
        (limites.ilimitado || limites.usadas < limites.limite);

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
                            ? { ...prev, usadas: prev.usadas + 1 }
                            : prev
                    );
                    log.info('Sample descargado', { sampleId });

                    /* Tauri (desktop/Android): fetch + write al filesystem.
                     * <a download> no funciona en Android WebView — cuelga la app
                     * porque intenta renderizar el binario como HTML. */
                    if (esTauri()) {
                        try {
                            const response = await fetch(resp.data.url);
                            if (!response.ok) throw new Error(`HTTP ${response.status}`);
                            const arrayBuffer = await response.arrayBuffer();
                            const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
                            await writeFile(resp.data.nombre, new Uint8Array(arrayBuffer), {
                                baseDir: BaseDirectory.Download,
                            });
                            toast.exito(`"${resp.data.nombre}" guardado en Descargas`);
                        } catch (dlErr) {
                            log.error('Error escribiendo descarga a disco', dlErr);
                            toast.error(getT()('error.guardarDescargas'));
                            return false;
                        }
                    } else {
                        /* Web: patron estandar que funciona en browsers */
                        const link = document.createElement('a');
                        link.href = resp.data.url;
                        link.download = resp.data.nombre;
                        link.click();
                    }

                    return true;
                }

                /* C199: Sin créditos — abrir modal de suscripción */
                if (resp.status === 429 || resp.status === 403) {
                    toast.error(resp.error ?? 'Has alcanzado el límite de descargas');
                    usePlanesModalStore.getState().abrir();
                } else {
                    toast.error(resp.error ?? 'Error al descargar');
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
