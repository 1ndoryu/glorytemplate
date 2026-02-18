/*
 * Hook: useExploradorPagina — Kamples (C281)
 * Lógica de la página /explorador: carga carpetas y samples coleccionados.
 * Soporta navegación por carpetas y filtrado por carpeta_primaria.
 * Separado del componente para cumplir SRP.
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerColeccionados, obtenerCarpetas } from '@app/services/apiExplorador';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { CarpetaInfo } from '@app/services/apiExplorador';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useExploradorPagina');

export interface UseExploradorPaginaResultado {
    carpetas: CarpetaInfo[];
    samples: SampleResumen[];
    cargando: boolean;
    carpetaActiva: string;
    totalSamples: number;
    seleccionarCarpeta: (carpeta: string) => void;
    manejarLike: (sampleId: number, reaccion?: TipoReaccion) => Promise<void>;
}

export function useExploradorPagina(): UseExploradorPaginaResultado {
    const [carpetas, setCarpetas] = useState<CarpetaInfo[]>([]);
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [carpetaActiva, setCarpetaActiva] = useState('');
    const [totalSamples, setTotalSamples] = useState(0);

    /* Carga inicial: carpetas + todos los samples */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const [respCarpetas, respSamples] = await Promise.all([
                    obtenerCarpetas(),
                    obtenerColeccionados(1, 100),
                ]);
                if (respCarpetas.ok && respCarpetas.data) {
                    setCarpetas(respCarpetas.data);
                }
                if (respSamples.ok && respSamples.data) {
                    setSamples(respSamples.data.data ?? []);
                    setTotalSamples(respSamples.data.pagination?.total ?? 0);
                }
            } catch (err) {
                log.error('Error cargando explorador', err);
            }
            setCargando(false);
        };
        cargar();
    }, []);

    /* Cambiar de carpeta: recarga samples filtrados */
    const seleccionarCarpeta = useCallback(async (carpeta: string) => {
        setCarpetaActiva(carpeta);
        setCargando(true);
        try {
            const resp = await obtenerColeccionados(1, 100, carpeta);
            if (resp.ok && resp.data) {
                setSamples(resp.data.data ?? []);
                setTotalSamples(resp.data.pagination?.total ?? 0);
            }
        } catch (err) {
            log.error('Error filtrando por carpeta', err);
        }
        setCargando(false);
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

    return {
        carpetas,
        samples,
        cargando,
        carpetaActiva,
        totalSamples,
        seleccionarCarpeta,
        manejarLike,
    };
}
