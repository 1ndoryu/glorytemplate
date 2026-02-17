/*
 * PistaTimeline — Una pista individual con sus bloques y controles
 * Drop zone para samples externos, contiene los BloqueSample
 */

import { Volume2, VolumeX, Trash2 } from 'lucide-react';
import type { PistaMezclador } from '../types/mezclador';
import { BloqueSample } from './BloqueSample';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { calcularLineasCuadricula, anchoBloquePorc, posicionBloquePorc } from '../utils/compasUtils';

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
    const pistas = useMezcladorStore(s => s.pistas);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const snapResolucion = useMezcladorStore(s => s.snapResolucion);
    const bloquesSeleccionados = useMezcladorStore(s => s.bloquesSeleccionados);
    const puedeBorrar = pistas.length > 1;

    /* C216: Líneas de cuadrícula según resolución de snap */
    const lineasCuadricula = calcularLineasCuadricula(totalCompases, compasProyecto, snapResolucion);

    /* Resaltar pista activa durante drag */
    const esHover = dragActivo && pistaIdHover === pista.id;

    /* C242: Calcular posición y ancho del ghost preview */
    const mostrarGhost = esHover && posicionDragFantasma !== null && duracionBloqueDrag && duracionBloqueDrag > 0;
    const ghostIzquierda = mostrarGhost ? posicionBloquePorc(posicionDragFantasma!, totalCompases) : 0;
    const ghostAncho = mostrarGhost ? anchoBloquePorc(duracionBloqueDrag!, totalCompases) : 0;

    return (
        <div
            className={`mezcladorPista ${pista.silenciada ? 'mezcladorPistaSilenciada' : ''} ${esHover ? 'mezcladorPistaDragHover' : ''}`}
            data-pista-id={pista.id}
        >
            {/* Controles laterales de la pista */}
            <div className="mezcladorPistaControles">
                <span className="mezcladorPistaNombre">{pista.nombre}</span>
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

                {/* Placeholder cuando está vacío — C250: sin texto */}
            </div>
        </div>
    );
};
