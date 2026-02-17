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
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useFavoritosPagina');

export interface UseFavoritosPaginaResultado {
    samples: SampleResumen[];
    totalFavoritos: number;
    cargando: boolean;
    proveedorSugerencias: (pagina: number) => Promise<SampleResumen[]>;
    manejarLike: (sampleId: number, reaccion?: TipoReaccion) => Promise<void>;
}

export function useFavoritosPagina(): UseFavoritosPaginaResultado {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [totalFavoritos, setTotalFavoritos] = useState(0);
    const [cargando, setCargando] = useState(true);

    /* Carga inicial */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const resp = await obtenerMisFavoritos(1, 30);
                if (resp.ok && resp.data) {
                    setSamples(resp.data.data ?? []);
                    setTotalFavoritos(resp.data.pagination?.total ?? 0);
                }
            } catch (err) {
                log.error('Error cargando favoritos', err);
            }
            setCargando(false);
        };
        cargar();
    }, []);

    /* Proveedor paginado para tab "Más Ideas" */
    const proveedorSugerencias = useCallback(async (pagina: number): Promise<SampleResumen[]> => {
        const resp = await obtenerSugerenciasFavoritos(pagina);
        return resp.ok && resp.data ? resp.data : [];
    }, []);

    /* Like optimista — al quitar like, eliminar sample de la lista */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find((s) => s.id === sampleId);
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
            await darLike('sample', sampleId, reaccion);
        } else if (sample?.liked || sample?.reaccion) {
            /* Quitar like: eliminar de la lista de favoritos */
            setSamples((prev) => prev.filter((s) => s.id !== sampleId));
            setTotalFavoritos((prev) => Math.max(0, prev - 1));
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

    return { samples, totalFavoritos, cargando, proveedorSugerencias, manejarLike };
}
