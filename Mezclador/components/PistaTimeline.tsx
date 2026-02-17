/*
 * PistaTimeline — Una pista individual con sus bloques y controles
 * Drop zone para samples externos, contiene los BloqueSample
 */

import { Volume2, VolumeX, Trash2 } from 'lucide-react';
import type { PistaMezclador } from '../types/mezclador';
import { BloqueSample } from './BloqueSample';
import { useMezcladorStore } from '../stores/mezcladorStore';

interface PistaTimelineProps {
    pista: PistaMezclador;
    totalCompases: number;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, pistaId: string) => void;
}

export const PistaTimeline = ({
    pista,
    totalCompases,
    onIniciarDrag,
    onDragOver,
    onDrop,
}: PistaTimelineProps): JSX.Element => {
    const toggleSilenciarPista = useMezcladorStore(s => s.toggleSilenciarPista);
    const eliminarPista = useMezcladorStore(s => s.eliminarPista);
    const pistas = useMezcladorStore(s => s.pistas);
    const puedeBorrar = pistas.length > 1;

    /* Divisiones de compás */
    const divisiones = Array.from({ length: totalCompases }, (_, i) => i);

    return (
        <div className={`mezcladorPista ${pista.silenciada ? 'mezcladorPistaSilenciada' : ''}`}>
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
                {/* Líneas de división de compás */}
                {divisiones.map(i => (
                    <div
                        key={i}
                        className="mezcladorDivisionCompas"
                        style={{ left: `${(i / totalCompases) * 100}%` }}
                    />
                ))}

                {/* Bloques de samples */}
                {pista.bloques.map(bloque => (
                    <BloqueSample
                        key={bloque.id}
                        bloque={bloque}
                        totalCompases={totalCompases}
                        onIniciarDrag={onIniciarDrag}
                    />
                ))}

                {/* Placeholder cuando está vacío */}
                {pista.bloques.length === 0 && (
                    <div className="mezcladorPistaVacia">
                        Arrastra un sample aquí
                    </div>
                )}
            </div>
        </div>
    );
};
