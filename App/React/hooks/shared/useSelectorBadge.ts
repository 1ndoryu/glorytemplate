/*
 * useSelectorBadge
 * Lógica extraída de SelectorBadge para cumplir SRP
 * Gestiona menú desplegable con posicionamiento inteligente
 */

import {useState, useRef, useEffect, useCallback} from 'react';
import type {OpcionBadge} from '../../components/shared/SelectorBadge';

interface UseSelectorBadgeParams<T extends string = string> {
    opciones: OpcionBadge<T>[];
    valorActual: T;
    onChange: (valor: T) => void;
}

interface UseSelectorBadgeReturn<T extends string = string> {
    menuAbierto: boolean;
    contenedorRef: React.RefObject<HTMLDivElement | null>;
    menuRef: React.RefObject<HTMLDivElement | null>;
    opcionActual: OpcionBadge<T> | undefined;
    toggleMenu: () => void;
    seleccionarOpcion: (opcion: OpcionBadge<T>) => void;
    cerrarMenu: () => void;
}

export function useSelectorBadge<T extends string = string>({opciones, valorActual, onChange}: UseSelectorBadgeParams<T>): UseSelectorBadgeReturn<T> {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const opcionActual = opciones.find(o => o.id === valorActual);

    /* Cerrar al hacer click fuera */
    const cerrarMenu = useCallback(() => {
        setMenuAbierto(false);
    }, []);

    useEffect(() => {
        if (!menuAbierto) return;

        const manejarClickFuera = (evento: MouseEvent) => {
            const target = evento.target as Node;
            /* [233A-23] Verificar tanto el contenedor como el menú portal */
            if (contenedorRef.current && !contenedorRef.current.contains(target) &&
                menuRef.current && !menuRef.current.contains(target)) {
                cerrarMenu();
            }
        };

        const manejarEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') {
                cerrarMenu();
            }
        };

        /* Delay para evitar cerrar inmediatamente */
        const timeout = setTimeout(() => {
            document.addEventListener('click', manejarClickFuera);
        }, 0);

        document.addEventListener('keydown', manejarEscape);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener('click', manejarClickFuera);
            document.removeEventListener('keydown', manejarEscape);
        };
    }, [menuAbierto, cerrarMenu]);

    /* Posicionar menú usando position: fixed para evitar que se corte por overflow: hidden */
    useEffect(() => {
        if (!menuAbierto || !menuRef.current || !contenedorRef.current) return;

        const menu = menuRef.current;
        const contenedor = contenedorRef.current;
        const rectContenedor = contenedor.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        /* Posicionamiento inicial debajo del botón */
        let top = rectContenedor.bottom + 4;
        let left = rectContenedor.left;

        /* Obtener dimensiones del menú después de renderizado */
        const rectMenu = menu.getBoundingClientRect();

        /* Ajuste Vertical: Mostrar arriba si no hay espacio abajo */
        const espacioAbajo = viewportHeight - rectContenedor.bottom;
        if (espacioAbajo < 150) {
            top = rectContenedor.top - rectMenu.height - 4;
        }

        /* Ajuste Horizontal: Evitar que se salga por la derecha */
        if (left + rectMenu.width > viewportWidth - 10) {
            left = viewportWidth - rectMenu.width - 10;
        }

        /* Evitar que se salga por la izquierda */
        if (left < 10) {
            left = 10;
        }

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    }, [menuAbierto]);

    const toggleMenu = () => setMenuAbierto(!menuAbierto);

    const seleccionarOpcion = (opcion: OpcionBadge<T>) => {
        onChange(opcion.id);
        cerrarMenu();
    };

    return {
        menuAbierto,
        contenedorRef,
        menuRef,
        opcionActual,
        toggleMenu,
        seleccionarOpcion,
        cerrarMenu
    };
}
