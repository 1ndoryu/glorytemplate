/*
 * PistaTimeline — Una pista individual con sus bloques y controles.
 * Drop zone para samples externos, contiene los BloqueSample.
 * C297: Menú contextual con rename inline, color, height, duplicar, etc.
 */

import { useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Trash2, Copy, ArrowUp, ArrowDown, Palette, RotateCcw } from 'lucide-react';
import type { PistaMezclador, ClipPatron } from '../types/mezclador';
import { BloqueSample } from './BloqueSample';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { usePatronesStore } from '../stores/patronesStore';
import { calcularLineasCuadricula, anchoBloquePorc, posicionBloquePorc } from '../utils/compasUtils';
import { MenuContextual, type MenuItemDef } from '@app/components/ui/MenuContextual';

interface PistaTimelineProps {
    pista: PistaMezclador;
    totalCompases: number;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, pistaId: string) => void;
    pistaIdHover?: string | null;
    dragActivo?: boolean;
    bloqueIdDrag?: string | null;
    modoCortarActivo?: boolean;
    onCortar?: (bloqueId: string, compas: number) => void;
    /* C242: Ghost preview durante drag */
    posicionDragFantasma?: number | null;
    duracionBloqueDrag?: number;
}

export const PistaTimeline = ({
    pista,
    totalCompases,
    onIniciarDrag,
    onDragOver,
    onDrop,
    pistaIdHover,
    dragActivo,
    bloqueIdDrag,
    modoCortarActivo,
    onCortar,
    posicionDragFantasma,
    duracionBloqueDrag,
}: PistaTimelineProps): JSX.Element => {
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

    /* Ciclar altura: normal → compacta → minimizada → normal */
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

    /* C216: Líneas de cuadrícula según resolución de snap */
    const lineasCuadricula = calcularLineasCuadricula(totalCompases, compasProyecto, snapResolucion);

    /* Resaltar pista activa durante drag */
    const esHover = dragActivo && pistaIdHover === pista.id;

    /* C242: Calcular posición y ancho del ghost preview */
    const mostrarGhost = esHover && posicionDragFantasma !== null && duracionBloqueDrag && duracionBloqueDrag > 0;
    const ghostIzquierda = mostrarGhost ? posicionBloquePorc(posicionDragFantasma!, totalCompases) : 0;
    const ghostAncho = mostrarGhost ? anchoBloquePorc(duracionBloqueDrag!, totalCompases) : 0;

    /*
     * C258(2): Calcular ghosts para TODOS los bloques seleccionados durante multi-drag.
     * Cada ghost se posiciona con el delta relativo al bloque principal arrastrado.
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

    return (
        <div
            className={`mezcladorPista mezcladorPistaAltura${(pista.altura ?? 'normal').charAt(0).toUpperCase() + (pista.altura ?? 'normal').slice(1)} ${pista.silenciada ? 'mezcladorPistaSilenciada' : ''} ${esHover ? 'mezcladorPistaDragHover' : ''}`}
            data-pista-id={pista.id}
        >
            {/* Controles laterales — click derecho abre menú contextual */}
            {/* C312: Color de pista como fondo de controles con opacidad */}
            <div
                className="mezcladorPistaControles"
                onContextMenu={abrirMenu}
            >
                {/* Nombre editable inline */}
                {editandoNombre ? (
                    <input
                        ref={inputRef}
                        className="mezcladorPistaNombreInput"
                        defaultValue={pista.nombre}
                        onBlur={confirmarRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmarRename();
                            if (e.key === 'Escape') setEditandoNombre(false);
                        }}
                        autoFocus
                    />
                ) : (
                    <span
                        className="mezcladorPistaNombre"
                        onDoubleClick={() => { setEditandoNombre(true); setTimeout(() => inputRef.current?.select(), 0); }}
                    >
                        {pista.nombre}
                    </span>
                )}

                <div className="mezcladorPistaBotones">
                    <button
                        className={`mezcladorPistaBoton ${pista.silenciada ? 'activo' : ''}`}
                        onClick={() => toggleSilenciarPista(pista.id)}
                        title={pista.silenciada ? 'Activar' : 'Silenciar'}
                    >
                        {pista.silenciada ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    {puedeBorrar && (
                        <button
                            className="mezcladorPistaBoton"
                            onClick={() => eliminarPista(pista.id)}
                            title="Eliminar pista"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Área de la timeline — drop zone */}
            <div
                className="mezcladorPistaContenido"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, pista.id)}
                onClick={(e) => {
                    /* C272: Deseleccionar bloques al hacer click en zona vacía */
                    const target = e.target as HTMLElement;
                    if (target.classList.contains('mezcladorPistaContenido') && bloquesSeleccionados.size > 0) {
                        limpiarSeleccion();
                    }
                }}
            >
                {/* C216: Líneas de cuadrícula según snap */}
                {lineasCuadricula.map((linea, i) => (
                    <div
                        key={i}
                        className={`mezcladorDivisionCompas ${linea.esPrincipal ? 'mezcladorDivisionPrincipal' : 'mezcladorDivisionSecundaria'}`}
                        style={{ left: `${(linea.posicion / totalCompases) * 100}%` }}
                    />
                ))}

                {/* Bloques de samples */}
                {pista.bloques.map(bloque => (
                    <BloqueSample
                        key={bloque.id}
                        bloque={bloque}
                        totalCompases={totalCompases}
                        onIniciarDrag={onIniciarDrag}
                        estaSiendoArrastrado={dragActivo && bloqueIdDrag === bloque.id}
                        estaSeleccionado={bloquesSeleccionados.has(bloque.id)}
                        modoCortarActivo={modoCortarActivo}
                        onCortar={onCortar}
                    />
                ))}

                {/* Clips de patrón en la playlist */}
                {pista.clipsPatron?.map(clip => {
                    const patron = usePatronesStore.getState().obtenerPatron(clip.patronId);
                    if (!patron) return null;
                    const izquierda = posicionBloquePorc(clip.compasInicio, totalCompases);
                    const ancho = anchoBloquePorc(clip.duracionCompases, totalCompases);
                    return (
                        <div
                            key={clip.id}
                            className="clipPatron"
                            style={{
                                left: `${izquierda}%`,
                                width: `${ancho}%`,
                                backgroundColor: patron.color,
                            }}
                            title={patron.nombre}
                        >
                            <span className="clipPatronNombre">{patron.nombre}</span>
                        </div>
                    );
                })}

                {/* C242: Ghost preview — muestra dónde aterrizará el bloque */}
                {mostrarGhost && (
                    <div
                        className="mezcladorBloqueGhost"
                        style={{
                            left: `${ghostIzquierda}%`,
                            width: `${ghostAncho}%`,
                        }}
                    />
                )}

                {/* C258(2): Ghosts adicionales para bloques seleccionados */}
                {ghostsMultiSelect.map((g, i) => (
                    <div
                        key={`ghost-sel-${i}`}
                        className="mezcladorBloqueGhost"
                        style={{
                            left: `${g.izquierda}%`,
                            width: `${g.ancho}%`,
                        }}
                    />
                ))}

                {/* Placeholder cuando está vacío — C250: sin texto */}
            </div>

            {/* C297: Menú contextual de pista */}
            <MenuContextual
                abierto={menu !== null}
                onCerrar={cerrarMenu}
                items={itemsMenu}
                x={menu?.x ?? 0}
                y={menu?.y ?? 0}
            />
        </div>
    );
};
