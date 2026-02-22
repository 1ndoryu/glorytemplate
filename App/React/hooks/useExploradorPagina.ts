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
import { toast } from '@app/stores/toastStore';

const log = crearLogger('useExploradorPagina');

export interface UseExploradorPaginaResultado {
    carpetas: CarpetaInfo[];
    samples: SampleResumen[];
    cargando: boolean;
    carpetaActiva: string;
    subcarpetaActiva: string;
    totalSamples: number;
    carpetasDesplegadas: Set<string>;
    seleccionarCarpeta: (carpeta: string) => void;
    seleccionarSubcarpeta: (primaria: string, subcarpeta: string) => void;
    toggleDesplegada: (carpeta: string) => void;
    manejarLike: (sampleId: number, reaccion?: TipoReaccion) => Promise<void>;
}

export function useExploradorPagina(): UseExploradorPaginaResultado {
    const [carpetas, setCarpetas] = useState<CarpetaInfo[]>([]);
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [carpetaActiva, setCarpetaActiva] = useState('');
    const [subcarpetaActiva, setSubcarpetaActiva] = useState('');
    const [totalSamples, setTotalSamples] = useState(0);
    /* Todas las carpetas desplegadas por defecto */
    const [carpetasDesplegadas, setCarpetasDesplegadas] = useState<Set<string>>(new Set());

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
                    /* Desplegar todas las carpetas que tienen subcarpetas por defecto */
                    const todasDesplegadas = new Set<string>();
                    for (const c of respCarpetas.data) {
                        if (c.subcarpetas.length > 0) {
                            todasDesplegadas.add(c.primaria);
                        }
                    }
                    setCarpetasDesplegadas(todasDesplegadas);
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
        setSubcarpetaActiva('');
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

    /* Seleccionar subcarpeta: filtra por "primaria/subcarpeta" */
    const seleccionarSubcarpeta = useCallback(async (primaria: string, subcarpeta: string) => {
        setCarpetaActiva(primaria);
        setSubcarpetaActiva(subcarpeta);
        setCargando(true);
        try {
            const filtro = `${primaria}/${subcarpeta}`;
            const resp = await obtenerColeccionados(1, 100, filtro);
            if (resp.ok && resp.data) {
                setSamples(resp.data.data ?? []);
                setTotalSamples(resp.data.pagination?.total ?? 0);
            }
        } catch (err) {
            log.error('Error filtrando por subcarpeta', err);
        }
        setCargando(false);
    }, []);

    /* Toggle despliegue de carpeta (mostrar/ocultar subcarpetas) */
    const toggleDesplegada = useCallback((carpeta: string) => {
        setCarpetasDesplegadas(prev => {
            const next = new Set(prev);
            if (next.has(carpeta)) {
                next.delete(carpeta);
            } else {
                next.add(carpeta);
            }
            return next;
        });
    }, []);

    /* Like optimista sincronizado con la lista local */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find((s) => s.id === sampleId);
        const prevSamples = samples;
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
            try {
                const resp = await darLike('sample', sampleId, reaccion);
                /* FE02: Rollback si la API rechaza */
                if (!resp.ok) {
                    setSamples(prevSamples);
                    toast.error('Error al procesar la reacción');
                }
            } catch (err) {
                setSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        } else if (sample?.liked || sample?.reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            try {
                const resp = await quitarLike('sample', sampleId);
                if (!resp.ok) {
                    setSamples(prevSamples);
                    toast.error('Error al quitar la reacción');
                }
            } catch (err) {
                setSamples(prevSamples);
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
                    toast.error('Error al procesar la reacción');
                }
            } catch (err) {
                setSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        }
    }, [samples]);

    return {
        carpetas,
        samples,
        cargando,
        carpetaActiva,
        subcarpetaActiva,
        totalSamples,
        carpetasDesplegadas,
        seleccionarCarpeta,
        seleccionarSubcarpeta,
        toggleDesplegada,
        manejarLike,
    };
}
