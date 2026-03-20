/*
 * Hook: useFavoritosPagina — Kamples (C140)
 * Lógica de la página /favoritos: carga lista y provee sugerencias.
 * Separado del componente para cumplir SRP.
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerMisFavoritos } from '@app/services/apiSamples';
import { obtenerSugerenciasFavoritos } from '@app/services/apiSugerencias';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { SampleResumen, TipoReaccion } from '@app/types';
import type { ResultadoProveedor } from '@app/components/feed/FeedSamples';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

const log = crearLogger('useFavoritosPagina');

export interface UseFavoritosPaginaResultado {
    samples: SampleResumen[];
    totalFavoritos: number;
    cargando: boolean;
    proveedorSugerencias: (pagina: number) => Promise<ResultadoProveedor>;
    manejarLike: (sampleId: number, reaccion?: TipoReaccion) => Promise<void>;
}

/* QL53: Acepta orden para ordenar favoritos server-side */
export function useFavoritosPagina(orden: string = 'recientes'): UseFavoritosPaginaResultado {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [totalFavoritos, setTotalFavoritos] = useState(0);
    const [cargando, setCargando] = useState(true);

    /* Carga inicial — refetches cuando cambia el orden */
    useEffect(() => {
        let cancelado = false;
        const cargar = async () => {
            setCargando(true);
            try {
                const resp = await obtenerMisFavoritos(1, 30, orden);
                if (!cancelado && resp.ok && resp.data) {
                    setSamples(resp.data.data ?? []);
                    setTotalFavoritos(resp.data.pagination?.total ?? 0);
                }
            } catch (err) {
                log.error('Error cargando favoritos', err);
            }
            if (!cancelado) setCargando(false);
        };
        cargar();
        return () => { cancelado = true; };
    }, [orden]);

    /* Proveedor paginado para tab "Más Ideas" */
    const proveedorSugerencias = useCallback(async (pagina: number): Promise<ResultadoProveedor> => {
        try {
            const resp = await obtenerSugerenciasFavoritos(pagina);
            return { ok: resp.ok, data: resp.ok && resp.data ? resp.data : [] };
        } catch (err) {
            log.error('Error cargando sugerencias de favoritos', err);
            return { ok: false, data: [] };
        }
    }, []);

    /* Like optimista — al quitar like, eliminar sample de la lista */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find((s) => s.id === sampleId);
        const prevSamples = samples;
        const prevTotal = totalFavoritos;
        if (reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            if (!esPositivo) {
                /* Quitar de favoritos: eliminar de la lista */
                setSamples((prev) => prev.filter((s) => s.id !== sampleId));
                setTotalFavoritos((prev) => Math.max(0, prev - 1));
            } else {
                setSamples((prev) =>
                    prev.map((s) =>
                        s.id === sampleId
                            ? { ...s, liked: true, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                            : s
                    )
                );
            }
            try {
                const resp = await darLike('sample', sampleId, reaccion);
                /* FE02: Rollback si la API rechaza */
                if (!resp.ok) {
                    setSamples(prevSamples);
                    setTotalFavoritos(prevTotal);
                    toast.error(getT()('error.reaccion'));
                }
            } catch (err) {
                setSamples(prevSamples);
                setTotalFavoritos(prevTotal);
                log.error('Error al dar like', err);
            }
        } else if (sample?.liked || sample?.reaccion) {
            /* Quitar like: eliminar de la lista de favoritos */
            setSamples((prev) => prev.filter((s) => s.id !== sampleId));
            setTotalFavoritos((prev) => Math.max(0, prev - 1));
            try {
                const resp = await quitarLike('sample', sampleId);
                if (!resp.ok) {
                    setSamples(prevSamples);
                    setTotalFavoritos(prevTotal);
                    toast.error(getT()('error.quitarReaccion'));
                }
            } catch (err) {
                setSamples(prevSamples);
                setTotalFavoritos(prevTotal);
                log.error('Error al quitar like', err);
            }
        } else {
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            try {
                const resp = await darLike('sample', sampleId, 'like');
                if (!resp.ok) {
                    setSamples(prevSamples);
                    toast.error(getT()('error.reaccion'));
                }
            } catch (err) {
                setSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        }
    }, [samples, totalFavoritos]);

    return { samples, totalFavoritos, cargando, proveedorSugerencias, manejarLike };
}
