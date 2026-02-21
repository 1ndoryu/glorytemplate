/*
 * usePistaTimeline — Lógica de una pista en el timeline del DAW.
 * Store access, menú contextual, ghost previews, rename inline.
 */

import { useState, useRef, useCallback } from 'react';
import { Trash2, Copy, ArrowUp, ArrowDown, Palette, RotateCcw } from 'lucide-react';
import type { PistaMezclador } from '../types/mezclador';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { calcularLineasCuadricula, anchoBloquePorc, posicionBloquePorc } from '../utils/compasUtils';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';

interface UsePistaTimelineParams {
    pista: PistaMezclador;
    totalCompases: number;
    dragActivo?: boolean;
    pistaIdHover?: string | null;
    bloqueIdDrag?: string | null;
    posicionDragFantasma?: number | null;
    duracionBloqueDrag?: number;
}

export const usePistaTimeline = ({
    pista,
    totalCompases,
    dragActivo,
    pistaIdHover,
    bloqueIdDrag,
    posicionDragFantasma,
    duracionBloqueDrag,
}: UsePistaTimelineParams) => {
    const toggleSilenciarPista = useMezcladorStore(s => s.toggleSilenciarPista);
    const eliminarPista = useMezcladorStore(s => s.eliminarPista);
    const renombrarPista = useMezcladorStore(s => s.renombrarPista);
    const colorAleatorio = useMezcladorStore(s => s.colorAleatorio);
    const duplicarPista = useMezcladorStore(s => s.duplicarPista);
    const moverPista = useMezcladorStore(s => s.moverPista);
    const insertarPista = useMezcladorStore(s => s.insertarPista);
    const cambiarAlturaPista = useMezcladorStore(s => s.cambiarAlturaPista);
    const resetPista = useMezcladorStore(s => s.resetPista);
    const pistas = useMezcladorStore(s => s.pistas);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const snapResolucion = useMezcladorStore(s => s.snapResolucion);
    const bloquesSeleccionados = useMezcladorStore(s => s.bloquesSeleccionados);
    const limpiarSeleccion = useMezcladorStore(s => s.limpiarSeleccion);
    const puedeBorrar = pistas.length > 1;

    /* C297: Estado del menú contextual y rename inline */
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const [editandoNombre, setEditandoNombre] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const indicePista = pistas.findIndex(p => p.id === pista.id);

    const abrirMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenu({ x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenu = useCallback(() => setMenu(null), []);

    const confirmarRename = useCallback(() => {
        if (!inputRef.current) return;
        const nuevo = inputRef.current.value.trim();
        if (nuevo && nuevo !== pista.nombre) renombrarPista(pista.id, nuevo);
        setEditandoNombre(false);
    }, [pista.id, pista.nombre, renombrarPista]);

    /* Ciclar altura: normal -> compacta -> minimizada -> normal */
    const ciclarAltura = useCallback(() => {
        const mapa = { normal: 'compacta', compacta: 'minimizada', minimizada: 'normal' } as const;
        cambiarAlturaPista(pista.id, mapa[pista.altura ?? 'normal']);
    }, [pista.id, pista.altura, cambiarAlturaPista]);

    const itemsMenu: MenuItemDef[] = [
        { id: 'renombrar', etiqueta: 'Renombrar', onClick: () => { setEditandoNombre(true); setTimeout(() => inputRef.current?.select(), 0); } },
        { id: 'color', etiqueta: 'Color aleatorio', icono: <Palette size={12} />, onClick: () => colorAleatorio(pista.id), separadorDespues: true },
        { id: 'altura', etiqueta: `Altura: ${pista.altura ?? 'normal'}`, onClick: ciclarAltura },
        { id: 'duplicar', etiqueta: 'Duplicar', icono: <Copy size={12} />, onClick: () => duplicarPista(pista.id), separadorDespues: true },
        { id: 'arriba', etiqueta: 'Mover arriba', icono: <ArrowUp size={12} />, onClick: () => moverPista(pista.id, 'arriba') },
        { id: 'abajo', etiqueta: 'Mover abajo', icono: <ArrowDown size={12} />, onClick: () => moverPista(pista.id, 'abajo') },
        { id: 'insertar', etiqueta: 'Insertar debajo', onClick: () => insertarPista(indicePista + 1), separadorDespues: true },
        { id: 'reset', etiqueta: 'Resetear pista', icono: <RotateCcw size={12} />, onClick: () => resetPista(pista.id) },
        ...(puedeBorrar ? [{ id: 'eliminar', etiqueta: 'Eliminar', icono: <Trash2 size={12} />, peligro: true, onClick: () => eliminarPista(pista.id) }] : []),
    ];

    /* C216: Lineas de cuadricula segun resolucion de snap */
    const lineasCuadricula = calcularLineasCuadricula(totalCompases, compasProyecto, snapResolucion);

    /* Resaltar pista activa durante drag */
    const esHover = dragActivo && pistaIdHover === pista.id;

    /* C242: Ghost preview */
    const mostrarGhost = esHover && posicionDragFantasma !== null && duracionBloqueDrag && duracionBloqueDrag > 0;
    const ghostIzquierda = mostrarGhost ? posicionBloquePorc(posicionDragFantasma!, totalCompases) : 0;
    const ghostAncho = mostrarGhost ? anchoBloquePorc(duracionBloqueDrag!, totalCompases) : 0;

    /*
     * C258(2): Ghosts para bloques seleccionados durante multi-drag.
     * Cada ghost se posiciona con delta relativo al bloque principal.
     */
    const ghostsMultiSelect: Array<{ izquierda: number; ancho: number }> = [];
    if (mostrarGhost && bloquesSeleccionados.size > 1 && bloqueIdDrag && bloquesSeleccionados.has(bloqueIdDrag)) {
        const bloqueDrag = pista.bloques.find(b => b.id === bloqueIdDrag)
            ?? pistas.flatMap(p => p.bloques).find(b => b.id === bloqueIdDrag);
        if (bloqueDrag) {
            const delta = posicionDragFantasma! - bloqueDrag.compasInicio;
            for (const sel of bloquesSeleccionados) {
                if (sel === bloqueIdDrag) continue;
                const bloqueOtro = pistas.flatMap(p => p.bloques).find(b => b.id === sel);
                if (!bloqueOtro) continue;
                const nuevaPosicion = Math.max(0, bloqueOtro.compasInicio + delta);
                ghostsMultiSelect.push({
                    izquierda: posicionBloquePorc(nuevaPosicion, totalCompases),
                    ancho: anchoBloquePorc(bloqueOtro.duracionCompases, totalCompases),
                });
            }
        }
    }

    return {
        toggleSilenciarPista,
        eliminarPista,
        puedeBorrar,
        bloquesSeleccionados,
        limpiarSeleccion,
        menu,
        editandoNombre,
        setEditandoNombre,
        inputRef,
        abrirMenu,
        cerrarMenu,
        confirmarRename,
        itemsMenu,
        lineasCuadricula,
        esHover,
        mostrarGhost,
        ghostIzquierda,
        ghostAncho,
        ghostsMultiSelect,
    };
};
