/*
 * Hook: useDescargasPagina — Kamples (C140)
 * Lógica de la página /descargas: carga lista, límites y provee sugerencias.
 * Separado del componente para cumplir SRP.
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerMisDescargas } from '@app/services/apiSamples';
import { obtenerLimites, type LimitesDescarga } from '@app/services/apiDescargas';
import { obtenerSugerenciasDescargas } from '@app/services/apiSugerencias';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useDescargasPagina');

export interface UseDescargasPaginaResultado {
    samples: SampleResumen[];
    limites: LimitesDescarga | null;
    cargando: boolean;
    proveedorSugerencias: (pagina: number) => Promise<SampleResumen[]>;
    manejarLike: (sampleId: number, reaccion?: TipoReaccion) => Promise<void>;
}

export function useDescargasPagina(): UseDescargasPaginaResultado {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [limites, setLimites] = useState<LimitesDescarga | null>(null);
    const [cargando, setCargando] = useState(true);

    /* Carga inicial: descargas + límites en paralelo */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const [respDescargas, respLimites] = await Promise.all([
                    obtenerMisDescargas(1, 30),
                    obtenerLimites(),
                ]);
                if (respDescargas.ok && respDescargas.data) {
                    setSamples(respDescargas.data.data ?? []);
                }
                if (respLimites.ok && respLimites.data) {
                    setLimites(respLimites.data);
                }
            } catch (err) {
                log.error('Error cargando descargas', err);
            }
            setCargando(false);
        };
        cargar();
    }, []);

    /* Proveedor paginado para tab "Más Ideas" */
    const proveedorSugerencias = useCallback(async (pagina: number): Promise<SampleResumen[]> => {
        const resp = await obtenerSugerenciasDescargas(pagina);
        return resp.ok && resp.data ? resp.data : [];
    }, []);

    /* Like optimista sincronizado con la lista local */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                        : s
                )
            );
            await darLike('sample', sampleId, reaccion);
        } else if (sample?.liked || sample?.reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            await quitarLike('sample', sampleId);
        } else {
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            await darLike('sample', sampleId, 'like');
        }
    }, [samples]);

    return { samples, limites, cargando, proveedorSugerencias, manejarLike };
}
