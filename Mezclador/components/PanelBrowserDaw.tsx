/*
 * PanelBrowserDaw — Panel de explorador integrado en el DAW (C307/C307.1).
 * Muestra el árbol de carpetas con samples arrastrables a la timeline.
 * Se posiciona a la izquierda del contenido del mezclador.
 */

import { ChevronRight, ChevronDown, FolderOpen, FolderClosed, Music } from 'lucide-react';
import type { SampleResumen } from '@app/types';
import type { CarpetaInfo } from '@app/services/apiExplorador';
import { BotonBase } from '@app/components/ui/BotonBase';

interface PanelBrowserDawProps {
    carpetas: CarpetaInfo[];
    samplesPorCarpeta: Map<string, SampleResumen[]>;
    carpetasExpandidas: Set<string>;
    cargando: boolean;
    onToggleCarpeta: (carpeta: string) => void;
}

/* C307.1: Iniciar drag de un sample hacia la timeline */
const iniciarDragSample = (e: React.DragEvent, sample: SampleResumen) => {
    e.dataTransfer.setData('application/kamples-sample', JSON.stringify(sample));
    e.dataTransfer.effectAllowed = 'copy';
};

export const PanelBrowserDaw = ({
    carpetas,
    samplesPorCarpeta,
    carpetasExpandidas,
    cargando,
    onToggleCarpeta,
}: PanelBrowserDawProps): JSX.Element => {

    return (
        <div className="browserDaw">
            <div className="browserDawCabecera">
                <span className="browserDawTitulo">Browser</span>
            </div>

            <div className="browserDawContenido">
                {cargando && carpetas.length === 0 && (
                    <div className="browserDawVacio">Cargando...</div>
                )}

                {carpetas.length === 0 && !cargando && (
                    <div className="browserDawVacio">Sin carpetas</div>
                )}

                {carpetas.map(carpeta => {
                    const expandida = carpetasExpandidas.has(carpeta.primaria);
                    const samples = samplesPorCarpeta.get(carpeta.primaria) ?? [];

                    return (
                        <div key={carpeta.primaria} className="browserDawCarpeta">
                            <BotonBase variante="ghost"
                                className="browserDawCarpetaItem"
                                onClick={() => onToggleCarpeta(carpeta.primaria)}
                                type="button"
                            >
                                {expandida
                                    ? <ChevronDown size={12} />
                                    : <ChevronRight size={12} />
                                }
                                {expandida
                                    ? <FolderOpen size={13} />
                                    : <FolderClosed size={13} />
                                }
                                <span className="browserDawCarpetaNombre">{carpeta.primaria}</span>
                                <span className="browserDawCarpetaConteo">{carpeta.total}</span>
                            </BotonBase>

                            {/* C307.1: Samples dentro de la carpeta (arrastrables) */}
                            {expandida && (
                                <div className="browserDawSamples">
                                    {samples.length === 0 && (
                                        <div className="browserDawSampleVacio">...</div>
                                    )}
                                    {samples.map(sample => (
                                        <div
                                            key={sample.id}
                                            className="browserDawSampleItem"
                                            draggable
                                            onDragStart={(e) => iniciarDragSample(e, sample)}
                                            title={sample.titulo}
                                        >
                                            <Music size={10} />
                                            <span className="browserDawSampleNombre">
                                                {sample.titulo}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Subcarpetas */}
                                    {carpeta.subcarpetas.map(sub => (
                                        <div key={sub.nombre} className="browserDawSubcarpeta">
                                            <FolderClosed size={11} />
                                            <span>{sub.nombre}</span>
                                            <span className="browserDawCarpetaConteo">{sub.total}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
