/*
 * Hook: useExploradorPagina — Kamples (C281)
 * Lógica de la página /explorador: carga carpetas y samples coleccionados.
 * Filtrado 100% client-side para navegación fluida (sin recargas por cambio de carpeta).
 * Separado del componente para cumplir SRP.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { obtenerColeccionados, obtenerCarpetas } from '@app/services/apiExplorador';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { CarpetaInfo } from '@app/services/apiExplorador';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';

const log = crearLogger('useExploradorPagina');

/* Carpeta por defecto cuando el sample no tiene carpeta_primaria en metadata */
const CARPETA_DEFAULT = 'Samples';

/* Extrae carpeta_primaria del metadata de un sample (soporta snake_case y camelCase) */
function obtenerCarpetaPrimaria(sample: SampleResumen): string {
    return sample.metadata?.carpeta_primaria
        ?? sample.metadata?.carpetaPrimaria
        ?? CARPETA_DEFAULT;
}

/* Extrae carpeta_secundaria del metadata de un sample */
function obtenerCarpetaSecundaria(sample: SampleResumen): string {
    return sample.metadata?.carpeta_secundaria
        ?? sample.metadata?.carpetaSecundaria
        ?? '';
}

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
    /* todosSamples: todos los samples del usuario, se cargan una sola vez */
    const [todosSamples, setTodosSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [carpetaActiva, setCarpetaActiva] = useState('');
    const [subcarpetaActiva, setSubcarpetaActiva] = useState('');
    /* Todas las carpetas desplegadas por defecto */
    const [carpetasDesplegadas, setCarpetasDesplegadas] = useState<Set<string>>(new Set());

    /* Carga inicial unica: carpetas + todos los samples (sin filtro de carpeta) */
    useEffect(() => {
        let cancelado = false;
        const cargar = async () => {
            setCargando(true);
            try {
                const [respCarpetas, respSamples] = await Promise.all([
                    obtenerCarpetas(),
                    obtenerColeccionados(1, 500),
                ]);
                if (cancelado) return;
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
                    setTodosSamples(respSamples.data.data ?? []);
                }
            } catch (err) {
                log.error('Error cargando explorador', err);
            }
            if (!cancelado) setCargando(false);
        };
        cargar();
        return () => { cancelado = true; };
    }, []);

    /*
     * Filtrado client-side: samples visibles segun carpeta y subcarpeta activas.
     * Sin API calls al navegar = transiciones instantaneas.
     */
    const samples = useMemo(() => {
        if (!carpetaActiva) return todosSamples;

        return todosSamples.filter((s) => {
            const primaria = obtenerCarpetaPrimaria(s);
            if (primaria !== carpetaActiva) return false;
            if (subcarpetaActiva) {
                const secundaria = obtenerCarpetaSecundaria(s);
                return secundaria === subcarpetaActiva;
            }
            return true;
        });
    }, [todosSamples, carpetaActiva, subcarpetaActiva]);

    /* Total de samples real (todos los coleccionados) */
    const totalSamples = todosSamples.length;

    /* Cambiar de carpeta: solo cambia estado local, sin API call */
    const seleccionarCarpeta = useCallback((carpeta: string) => {
        setCarpetaActiva(carpeta);
        setSubcarpetaActiva('');
    }, []);

    /* Seleccionar subcarpeta: solo cambia estado local */
    const seleccionarSubcarpeta = useCallback((primaria: string, subcarpeta: string) => {
        setCarpetaActiva(primaria);
        setSubcarpetaActiva(subcarpeta);
    }, []);

    /* Toggle despliegue de carpeta (mostrar/ocultar subcarpetas en el arbol) */
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

    /* Like optimista sincronizado con la lista completa */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = todosSamples.find((s) => s.id === sampleId);
        const prevSamples = todosSamples;
        if (reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            setTodosSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                        : s
                )
            );
            try {
                const resp = await darLike('sample', sampleId, reaccion);
                if (!resp.ok) {
                    setTodosSamples(prevSamples);
                    toast.error('Error al procesar la reacción');
                }
            } catch (err) {
                setTodosSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        } else if (sample?.liked || sample?.reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            setTodosSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            try {
                const resp = await quitarLike('sample', sampleId);
                if (!resp.ok) {
                    setTodosSamples(prevSamples);
                    toast.error('Error al quitar la reacción');
                }
            } catch (err) {
                setTodosSamples(prevSamples);
                log.error('Error al quitar like', err);
            }
        } else {
            setTodosSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            try {
                const resp = await darLike('sample', sampleId, 'like');
                if (!resp.ok) {
                    setTodosSamples(prevSamples);
                    toast.error('Error al procesar la reacción');
                }
            } catch (err) {
                setTodosSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        }
    }, [todosSamples]);

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
