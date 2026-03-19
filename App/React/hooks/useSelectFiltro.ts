/*
 * Hook: useSelectFiltro
 * Lógica de dropdown con incluir/excluir tags, click fuera, Escape.
 * Extraído de SelectFiltro para cumplir SRP.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSelectFiltroParams {
    opciones: string[];
    tagsIncluidos: string[];
    tagsExcluidos: string[];
    onIncluir: (tag: string) => void;
    onExcluir: (tag: string) => void;
    onQuitar: (tag: string) => void;
    /* [193A-30] Búsqueda server-side: si existe, click en opción busca en vez de filtrar */
    onBuscar?: (tag: string) => void;
}

export const useSelectFiltro = ({
    opciones,
    tagsIncluidos,
    tagsExcluidos,
    onIncluir,
    onExcluir,
    onQuitar,
    onBuscar,
}: UseSelectFiltroParams) => {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Cantidad de tags activos en esta categoría */
    const activos = opciones.filter(
        (o) => tagsIncluidos.includes(o) || tagsExcluidos.includes(o)
    ).length;

    /* Cerrar al hacer click fuera */
    useEffect(() => {
        if (!abierto) return;
        const cerrar = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', cerrar);
        return () => document.removeEventListener('mousedown', cerrar);
    }, [abierto]);

    /* Cerrar con Escape */
    useEffect(() => {
        if (!abierto) return;
        const manejarEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        document.addEventListener('keydown', manejarEscape);
        return () => document.removeEventListener('keydown', manejarEscape);
    }, [abierto]);

    const manejarClickOpcion = useCallback((tag: string) => {
        /* [193A-30] Si hay búsqueda, buscar y cerrar dropdown */
        if (onBuscar) {
            onBuscar(tag);
            setAbierto(false);
            return;
        }
        if (tagsIncluidos.includes(tag)) {
            onQuitar(tag);
        } else {
            onIncluir(tag);
        }
    }, [tagsIncluidos, onIncluir, onQuitar, onBuscar]);

    const manejarExcluir = useCallback((e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        /* [193A-30] Si hay búsqueda, buscar negativo y cerrar dropdown */
        if (onBuscar) {
            onBuscar('-' + tag);
            setAbierto(false);
            return;
        }
        if (tagsExcluidos.includes(tag)) {
            onQuitar(tag);
        } else {
            onExcluir(tag);
        }
    }, [tagsExcluidos, onExcluir, onQuitar, onBuscar]);

    const toggleAbierto = () => setAbierto(!abierto);

    return {
        abierto,
        activos,
        contenedorRef,
        toggleAbierto,
        manejarClickOpcion,
        manejarExcluir,
    };
};
