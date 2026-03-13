/*
 * Hook: useResultadosBusquedaRapida
 * Lógica de interacción del dropdown: click fuera, tecla Escape, navegación.
 * Extraído de ResultadosBusquedaRapida para cumplir SRP.
 */

import { useRef, useEffect, useCallback } from 'react';
import { useNavigationStore } from '@/core/router';

interface Params {
    visible: boolean;
    onCerrar: () => void;
}

export const useResultadosBusquedaRapida = ({ visible, onCerrar }: Params) => {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const navegar = useNavigationStore(s => s.navegar);

    /* Cerrar al hacer click fuera */
    useEffect(() => {
        if (!visible) return;

        const manejarClickFuera = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                onCerrar();
            }
        };

        /* Delay para evitar que el click que abrió el dropdown lo cierre */
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', manejarClickFuera);
        }, 50);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', manejarClickFuera);
        };
    }, [visible, onCerrar]);

    /* Cerrar con Escape */
    useEffect(() => {
        if (!visible) return;

        const manejarTecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar();
        };

        document.addEventListener('keydown', manejarTecla);
        return () => document.removeEventListener('keydown', manejarTecla);
    }, [visible, onCerrar]);

    const irA = useCallback((ruta: string) => {
        navegar(ruta);
        onCerrar();
    }, [navegar, onCerrar]);

    return { contenedorRef, irA };
};
