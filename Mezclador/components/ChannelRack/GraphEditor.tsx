/*
 * GraphEditor — Panel overlay para editar velocity/pitch/pan por paso.
 * Muestra barras verticales editables con drag. Se despliega bajo el grid.
 */

import { useCallback, useRef, useState } from 'react';
import type { CanalRack, Paso } from '../../types/mezclador';
import { BotonBase } from '@app/components/ui/BotonBase';

type ModoEditor = 'velocity' | 'pan' | 'pitch';

interface GraphEditorProps {
    canal: CanalRack;
    patronId: string;
    onSetPaso: (patronId: string, canalId: string, pasoIndex: number, paso: Partial<Paso>) => void;
}

export const GraphEditor = ({
    canal,
    patronId,
    onSetPaso,
}: GraphEditorProps): JSX.Element => {
    const [modo, setModo] = useState<ModoEditor>('velocity');
    const containerRef = useRef<HTMLDivElement>(null);

    /* Obtener valor normalizado 0-1 según el modo */
    const obtenerValorNormalizado = (paso: Paso): number => {
        switch (modo) {
            case 'velocity': return paso.velocity;
            case 'pan': return (paso.pan + 1) / 2;
            case 'pitch': return (paso.pitch + 12) / 24;
        }
    };

    /* Convertir posición Y (0-1) a valor según modo */
    const yAValor = (y: number): Partial<Paso> => {
        const clamped = Math.max(0, Math.min(1, y));
        switch (modo) {
            case 'velocity': return { velocity: clamped };
            case 'pan': return { pan: clamped * 2 - 1 };
            case 'pitch': return { pitch: Math.round(clamped * 24 - 12) };
        }
    };

    /* Handler de click/drag en una barra */
    const alClick = useCallback((e: React.MouseEvent, indice: number) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = 1 - (e.clientY - rect.top) / rect.height;
        onSetPaso(patronId, canal.id, indice, yAValor(y));
    }, [patronId, canal.id, onSetPaso, modo]);

    return (
        <div className="graphEditor">
            {/* Selector de modo */}
            <div className="graphEditorModos">
                {(['velocity', 'pan', 'pitch'] as ModoEditor[]).map(m => (
                    <BotonBase variante="ghost"
                        key={m}
                        className={`graphEditorModoBoton ${modo === m ? 'graphEditorModoActivo' : ''}`}
                        onClick={() => setModo(m)}
                    >
                        {m === 'velocity' ? 'Vel' : m === 'pan' ? 'Pan' : 'Pitch'}
                    </BotonBase>
                ))}
            </div>

            {/* Barras */}
            {/* sentinel-disable-next-line key-index-lista */}
            <div className="graphEditorBarras" ref={containerRef}>
                {canal.pasos.map((paso, i) => {
                    const valor = obtenerValorNormalizado(paso);
                    const esBipolar = modo === 'pan' || modo === 'pitch';

                    return (
                        <div
                            key={`graph-paso-${i}`}
                            className={`graphEditorColumna ${Math.floor(i / 4) % 2 === 1 ? 'graphEditorColumnaImpar' : ''}`}
                            onClick={(e) => alClick(e, i)}
                        >
                            {esBipolar ? (
                                /* Barra bipolar: desde el centro */
                                <div
                                    className="graphEditorBarra graphEditorBarraBipolar"
                                    style={{
                                        height: `${Math.abs(valor - 0.5) * 100}%`,
                                        bottom: valor >= 0.5 ? '50%' : `${valor * 100}%`,
                                        backgroundColor: canal.color,
                                    }}
                                />
                            ) : (
                                /* Barra unipolar: desde abajo */
                                <div
                                    className="graphEditorBarra"
                                    style={{
                                        height: `${valor * 100}%`,
                                        backgroundColor: canal.color,
                                        opacity: paso.activo ? 1 : 0.3,
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Línea central para modos bipolares */}
            {(modo === 'pan' || modo === 'pitch') && (
                <div className="graphEditorLineaCentral" />
            )}
        </div>
    );
};
