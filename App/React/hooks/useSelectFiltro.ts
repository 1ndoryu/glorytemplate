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
}

export const useSelectFiltro = ({
    opciones,
    tagsIncluidos,
    tagsExcluidos,
    onIncluir,
    onExcluir,
    onQuitar,
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
        if (tagsIncluidos.includes(tag)) {
            onQuitar(tag);
        } else {
            onIncluir(tag);
        }
    }, [tagsIncluidos, onIncluir, onQuitar]);

    const manejarExcluir = useCallback((e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        if (tagsExcluidos.includes(tag)) {
            onQuitar(tag);
        } else {
            onExcluir(tag);
        }
    }, [tagsExcluidos, onExcluir, onQuitar]);

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
