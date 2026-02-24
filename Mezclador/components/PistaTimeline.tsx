/*
 * PistaTimeline — Una pista individual con sus bloques y controles.
 * Drop zone para samples externos, contiene los BloqueSample.
 * C297: Menú contextual con rename inline, color, height, duplicar, etc.
 */

import { Volume2, VolumeX, Trash2 } from 'lucide-react';
import type { PistaMezclador } from '../types/mezclador';
import { BloqueSample } from './BloqueSample';
import { usePatronesStore } from '../stores/patronesStore';
import { posicionBloquePorc, anchoBloquePorc } from '../utils/compasUtils';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { usePistaTimeline } from '../hooks/usePistaTimeline';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Input } from '@app/components/ui/Input';

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
    const {
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
    } = usePistaTimeline({
        pista,
        totalCompases,
        dragActivo,
        pistaIdHover,
        bloqueIdDrag,
        posicionDragFantasma,
        duracionBloqueDrag,
    });

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
                    <>
                        <Input
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
                    </>
                ) : (
                    <span
                        className="mezcladorPistaNombre"
                        onDoubleClick={() => { setEditandoNombre(true); setTimeout(() => inputRef.current?.select(), 0); }}
                    >
                        {pista.nombre}
                    </span>
                )}

                <div className="mezcladorPistaBotones">
                    <BotonBase variante="ghost"
                        className={`mezcladorPistaBoton ${pista.silenciada ? 'activo' : ''}`}
                        onClick={() => toggleSilenciarPista(pista.id)}
                        title={pista.silenciada ? 'Activar' : 'Silenciar'}
                    >
                        {pista.silenciada ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </BotonBase>
                    {puedeBorrar && (
                        <BotonBase variante="ghost"
                            className="mezcladorPistaBoton"
                            onClick={() => eliminarPista(pista.id)}
                            title="Eliminar pista"
                        >
                            <Trash2 size={12} />
                        </BotonBase>
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
                {lineasCuadricula.map((linea) => (
                    <div
                        key={linea.posicion}
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
