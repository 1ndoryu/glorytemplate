/*
 * Componente: ReproductorGlobal
 * Reproductor minimalista flotante centrado abajo.
 * Pill shape, portada circular, controles inline, barra de progreso.
 * QQ49: Rediseño completo.
 */

import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Music } from 'lucide-react';
import { useReproductorGlobal } from '../../hooks/useReproductorGlobal';
import { BotonBase } from './BotonBase';
import '../../styles/componentes/reproductorGlobal.css';

export const ReproductorGlobal = (): JSX.Element | null => {
    const {
        sampleActual,
        reproduciendo,
        progreso,
        duracion,
        aleatorio,
        liked,
        togglePlay,
        toggleAleatorio,
        siguiente,
        anterior,
        manejarLike,
        manejarSeekProgreso,
        progresoBarraRef,
        formatearTiempo,
    } = useReproductorGlobal();

    if (!sampleActual) return null;

    return (
        <div className="reproductorGlobal" id="reproductorGlobal">
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

            {/* Barra de progreso */}
            <div className="reproductorProgreso">
                <span className="reproductorTiempo">{formatearTiempo(progreso * duracion)}</span>
                <div
                    ref={progresoBarraRef}
                    className="reproductorBarra"
                    onClick={manejarSeekProgreso}
                    role="slider"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progreso * 100)}
                    aria-label="Progreso"
                >
                    <div className="reproductorBarraRelleno" style={{ width: `${progreso * 100}%` }} />
                </div>
                <span className="reproductorTiempo">{formatearTiempo(duracion)}</span>
            </div>

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

            {/* Aleatorio */}
            <BotonBase
                variante="ghost"
                tamano="ninguno"
                soloIcono
                className={`reproductorBtn ${aleatorio ? 'reproductorBtnActivo' : ''}`}
                onClick={toggleAleatorio}
                aria-label="Aleatorio"
            >
                <Shuffle size={14} />
            </BotonBase>
        </div>
    );
};

export default ReproductorGlobal;
