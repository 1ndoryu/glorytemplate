/*
 * BloqueSample — Bloque visual de un sample en la timeline
 * Muestra mini waveform + titulo. Draggeable + resize handles (C204 stretch/pitch).
 * C215: Botones de 3 puntos (config), duplicar y eliminar en cabecera.
 * C214: Click derecho o herramienta de corte para dividir el bloque.
 */

import { createPortal } from 'react-dom';
import { X, MoreHorizontal, Copy } from 'lucide-react';
import type { BloqueMezclador } from '../types/mezclador';
import { ModalConfigBloque } from './ModalConfigBloque';
import { useBloqueSample } from '../hooks/useBloqueSample';
import { BotonBase } from '@app/components/ui/BotonBase';

interface BloqueSampleProps {
    bloque: BloqueMezclador;
    totalCompases: number;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
    estaSiendoArrastrado?: boolean;
    estaSeleccionado?: boolean;
    modoCortarActivo?: boolean;
    onCortar?: (bloqueId: string, compas: number) => void;
}

export const BloqueSample = ({
    bloque,
    totalCompases,
    onIniciarDrag,
    estaSiendoArrastrado,
    estaSeleccionado,
    modoCortarActivo,
    onCortar,
}: BloqueSampleProps): JSX.Element => {
    const {
        eliminarBloque,
        duplicarBloque,
        ancho,
        izquierda,
        resizing,
        modalConfigAbierto,
        cerrarConfig,
        setModalConfigAbierto,
        lineaCortePorc,
        waveformPath,
        iniciarResize,
        alMoverMouse,
        alSalirMouse,
        alClickBloque,
        alMouseDown,
        alDobleClick,
        alContextMenu,
    } = useBloqueSample({ bloque, totalCompases, onIniciarDrag, modoCortarActivo, onCortar });

    return (
        <div
            className={`mezcladorBloque ${estaSiendoArrastrado ? 'mezcladorBloqueDragging' : ''} ${estaSeleccionado ? 'mezcladorBloqueSeleccionado' : ''} ${resizing ? 'mezcladorBloqueResizing' : ''} ${modoCortarActivo ? 'mezcladorBloqueCortando' : ''}`}
            style={{
                left: `${izquierda}%`,
                width: `${ancho}%`,
                '--colorBloque': bloque.color,
            } as React.CSSProperties}
            onMouseDown={alMouseDown}
            /* C286: Doble click abre la configuración avanzada del bloque */
            onDoubleClick={alDobleClick}
            onClick={alClickBloque}
            onMouseMove={alMoverMouse}
            onMouseLeave={alSalirMouse}
            onContextMenu={alContextMenu}
            title={`${bloque.sample.titulo} (x${bloque.playbackRate.toFixed(2)}${bloque.invertido ? ' REV' : ''})`}
        >
            <div className="mezcladorBloqueCabecera">
                <span className="mezcladorBloqueTitulo">
                    {bloque.sample.titulo}
                </span>
                <div className="mezcladorBloqueBotones">
                    {/* C215: Botón de duplicar */}
                    <BotonBase variante="ghost"
                        className="mezcladorBloqueBoton"
                        onClick={(e) => {
                            e.stopPropagation();
                            duplicarBloque(bloque.id);
                        }}
                        title="Duplicar bloque"
                    >
                        <Copy size={11} />
                    </BotonBase>
                    {/* C215: Botón de 3 puntos — abre modal config */}
                    <BotonBase variante="ghost"
                        className="mezcladorBloqueBoton"
                        onClick={(e) => {
                            e.stopPropagation();
                            setModalConfigAbierto(true);
                        }}
                        title="Configuración de audio"
                    >
                        <MoreHorizontal size={12} />
                    </BotonBase>
                    {/* Botón eliminar */}
                    <BotonBase variante="ghost"
                        className="mezcladorBloqueBoton mezcladorBloqueEliminar"
                        onClick={(e) => {
                            e.stopPropagation();
                            eliminarBloque(bloque.id);
                        }}
                        title="Eliminar"
                    >
                        <X size={11} />
                    </BotonBase>
                </div>
            </div>

            {/* Indicadores visuales de config activa */}
            {(bloque.invertido || bloque.fadeIn > 0 || bloque.fadeOut > 0 || bloque.modoResize === 'clip') && (
                <div className="mezcladorBloqueIndicadores">
                    {bloque.invertido && <span className="mezcladorBloqueTag">REV</span>}
                    {bloque.fadeIn > 0 && <span className="mezcladorBloqueTag">IN</span>}
                    {bloque.fadeOut > 0 && <span className="mezcladorBloqueTag">OUT</span>}
                    {bloque.modoResize === 'clip' && <span className="mezcladorBloqueTag">CLIP</span>}
                </div>
            )}

            {bloque.waveformPeaks.length > 0 && (
                <svg className="mezcladorBloqueWaveform" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                        d={waveformPath}
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                        opacity="0.7"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            )}

            {/* C232: Línea preview de corte */}
            {modoCortarActivo && lineaCortePorc !== null && (
                <div
                    className="mezcladorBloqueLineaCorte"
                    style={{ left: `${lineaCortePorc}%` }}
                />
            )}

            {/* Handle derecho para resize — C204 stretch/pitch */}
            <div
                className="mezcladorBloqueResizeHandle"
                onMouseDown={iniciarResize}
            />

            {/* C215: Modal de configuración avanzada — C292: Portal para evitar bubbling de eventos al bloque */}
            {modalConfigAbierto && createPortal(
                <ModalConfigBloque
                    bloque={bloque}
                    onCerrar={cerrarConfig}
                />,
                document.body
            )}
        </div>
    );
};
