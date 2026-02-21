/*
 * useVentanaFlotante — Lógica de ventana arrastreable del DAW.
 * Drag titlebar, minimizar, cerrar, z-index, escape key.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVentanasStore } from '../stores/ventanasStore';

export const useVentanaFlotante = (id: string) => {
    const ventana = useVentanasStore(s => s.ventanas.find(v => v.id === id));
    const cerrar = useVentanasStore(s => s.cerrarVentana);
    const minimizar = useVentanasStore(s => s.minimizarVentana);
    const enfocar = useVentanasStore(s => s.enfocarVentana);
    const mover = useVentanasStore(s => s.moverVentana);

    const [arrastrando, setArrastrando] = useState(false);
    const dragRef = useRef({ offsetX: 0, offsetY: 0 });
    const ventanaRef = useRef<HTMLDivElement>(null);

    /* Posición estable para useCallback — evita re-crear si ventana es null */
    const posicionRef = useRef({ x: 0, y: 0 });
    if (ventana) {
        posicionRef.current = ventana.posicion;
    }

    /* Iniciar drag desde la barra de título */
    const iniciarDrag = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        e.stopPropagation();

        dragRef.current = {
            offsetX: e.clientX - posicionRef.current.x,
            offsetY: e.clientY - posicionRef.current.y,
        };
        setArrastrando(true);
        enfocar(id);
    }, [id, enfocar]);

    /* Listeners de documento para drag suave */
    useEffect(() => {
        if (!arrastrando) return;

        const moverHandler = (ev: MouseEvent) => {
            const nuevoX = Math.max(0, Math.min(
                window.innerWidth - 100,
                ev.clientX - dragRef.current.offsetX
            ));
            const nuevoY = Math.max(0, Math.min(
                window.innerHeight - 40,
                ev.clientY - dragRef.current.offsetY
            ));
            mover(id, { x: nuevoX, y: nuevoY });
        };

        const soltarHandler = () => setArrastrando(false);

        document.addEventListener('mousemove', moverHandler);
        document.addEventListener('mouseup', soltarHandler);

        return () => {
            document.removeEventListener('mousemove', moverHandler);
            document.removeEventListener('mouseup', soltarHandler);
        };
    }, [arrastrando, id, mover]);

    /* Cerrar con Escape */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') cerrar(id);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [id, cerrar]);

    return {
        ventana,
        ventanaRef,
        arrastrando,
        cerrar,
        minimizar,
        enfocar,
        iniciarDrag,
    };
};
