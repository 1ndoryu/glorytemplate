/*
 * Hook: useModalAdjuntarContenido — Kamples (183A-110-C)
 * Lógica de búsqueda y adjuntar samples/colecciones al artículo.
 * Extraído del componente ModalAdjuntarContenido (SRP, max 3 useState).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { busquedaRapida } from '@app/services/apiBusqueda';
import type { ResultadoSample, ResultadoColeccion } from '@app/services/apiBusqueda';
import type { AdjuntoArticulo } from '@app/types';

interface ParamsAdjuntar {
    abierto: boolean;
    adjuntosActuales: AdjuntoArticulo[];
    onAdjuntar: (adjunto: AdjuntoArticulo) => void;
}

interface ResultadosAdjuntar {
    samples: ResultadoSample[];
    colecciones: ResultadoColeccion[];
}

export const useModalAdjuntarContenido = ({ abierto, adjuntosActuales, onAdjuntar }: ParamsAdjuntar) => {
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<ResultadosAdjuntar>({ samples: [], colecciones: [] });
    const [cargando, setCargando] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    /* Buscar al escribir (debounce 300ms) */
    useEffect(() => {
        if (!abierto || query.trim().length < 2) {
            setResultados({ samples: [], colecciones: [] });
            return;
        }

        const timeout = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setCargando(true);

            try {
                const res = await busquedaRapida(query.trim(), controller.signal);
                if (res.ok && res.data) {
                    setResultados({
                        samples: res.data.samples ?? [],
                        colecciones: res.data.colecciones ?? [],
                    });
                }
            } catch {
                /* AbortError o error de red — ignorar */
            } finally {
                setCargando(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeout);
            abortRef.current?.abort();
        };
    }, [query, abierto]);

    /* Limpiar al cerrar */
    useEffect(() => {
        if (!abierto) {
            setQuery('');
            setResultados({ samples: [], colecciones: [] });
        }
    }, [abierto]);

    const estaAdjunto = useCallback((tipo: 'sample' | 'coleccion', id: number) => {
        return adjuntosActuales.some(a => a.tipo === tipo && a.id === id);
    }, [adjuntosActuales]);

    const adjuntarSample = useCallback((s: ResultadoSample) => {
        onAdjuntar({
            tipo: 'sample',
            id: s.id,
            titulo: s.titulo,
            imagenUrl: s.imagenUrl,
            creadorNombre: s.creador.nombreVisible,
            slug: s.slug,
            descargaPublica: false,
        });
    }, [onAdjuntar]);

    const adjuntarColeccion = useCallback((c: ResultadoColeccion) => {
        onAdjuntar({
            tipo: 'coleccion',
            id: c.id,
            titulo: c.nombre,
            imagenUrl: c.portadaUrl,
            creadorNombre: c.creador,
            slug: c.slug,
            totalSamples: c.totalSamples,
            descargaPublica: false,
        });
    }, [onAdjuntar]);

    const sinResultados = !cargando && query.trim().length >= 2
        && resultados.samples.length === 0 && resultados.colecciones.length === 0;

    return {
        query, setQuery,
        samples: resultados.samples,
        colecciones: resultados.colecciones,
        cargando, sinResultados,
        estaAdjunto, adjuntarSample, adjuntarColeccion,
    };
};
