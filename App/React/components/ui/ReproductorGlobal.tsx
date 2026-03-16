/*
 * Componente: ReproductorGlobal
 * Reproductor minimalista flotante centrado abajo.
 * Pill shape, portada circular, controles inline, barra de progreso.
 * QQ49: Rediseño completo.
 */

import { Play, Pause, SkipBack, SkipForward, Heart, Music, X } from 'lucide-react';
import { useReproductorGlobal } from '../../hooks/useReproductorGlobal';
import { BotonBase } from './BotonBase';
import '../../styles/componentes/reproductorGlobal.css';

export const ReproductorGlobal = (): JSX.Element | null => {
    const {
        sampleActual,
        reproduciendo,
        progreso,
        duracion,
        liked,
        togglePlay,
        siguiente,
        anterior,
        cerrar,
        manejarLike,
        manejarSeekProgreso,
        progresoBarraRef,
        formatearTiempo,
    } = useReproductorGlobal();

    if (!sampleActual) return null;

    return (
        <div className="reproductorGlobal" id="reproductorGlobal">
            {/* QK73: Linea de tiempo como borde superior con color acento */}
            <div
                ref={progresoBarraRef}
                className="reproductorTimelineSuperior"
                onClick={manejarSeekProgreso}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progreso * 100)}
                aria-label="Progreso"
            >
                <div className="reproductorTimelineRelleno" style={{ width: `${progreso * 100}%` }} />
            </div>

            {/* Portada circular */}
            <div className="reproductorPortada">
                {sampleActual.imagenUrl
                    ? <img src={sampleActual.imagenUrl} alt={sampleActual.titulo} />
                    : <Music size={16} className="reproductorPortadaIcono" />
                }
            </div>

            {/* Info */}
            <div className="reproductorInfo">
                <span className="reproductorTitulo">{sampleActual.titulo}</span>
                <span className="reproductorArtista">
                    {sampleActual.creador.nombreVisible || sampleActual.creador.username}
                </span>
            </div>

            {/* Controles */}
            <div className="reproductorControles">
                <BotonBase variante="ghost" tamano="ninguno" soloIcono className="reproductorBtn" onClick={anterior} aria-label="Anterior">
                    <SkipBack size={14} />
                </BotonBase>
                <BotonBase variante="ghost" tamano="ninguno" soloIcono className="reproductorPlayBtn" onClick={togglePlay} aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}>
                    {reproduciendo ? <Pause size={16} /> : <Play size={16} />}
                </BotonBase>
                <BotonBase variante="ghost" tamano="ninguno" soloIcono className="reproductorBtn" onClick={siguiente} aria-label="Siguiente">
                    <SkipForward size={14} />
                </BotonBase>
            </div>

            {/* QK73: Tiempo compacto sin barra (la barra ahora es el borde superior) */}
            <span className="reproductorTiempoCompacto">
                {formatearTiempo(progreso * duracion)} / {formatearTiempo(duracion)}
            </span>

            {/* Like */}
            <BotonBase
                variante="ghost"
                tamano="ninguno"
                soloIcono
                className={`reproductorBtn ${liked ? 'reproductorBtnActivo' : ''}`}
                onClick={manejarLike}
                aria-label="Like"
            >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            </BotonBase>

            {/* QK102: Cerrar reproductor */}
            <BotonBase
                variante="ghost"
                tamano="ninguno"
                soloIcono
                className="reproductorBtn reproductorBtnCerrar"
                onClick={cerrar}
                aria-label="Cerrar reproductor"
            >
                <X size={14} />
            </BotonBase>
        </div>
    );
};

export default ReproductorGlobal;
