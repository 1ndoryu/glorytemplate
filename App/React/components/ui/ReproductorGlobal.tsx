/*
 * Componente: ReproductorGlobal
 * Barra inferior persistente del reproductor de audio.
 * Controles: play/pause, anterior/siguiente, seek, volumen, repetir, aleatorio.
 * Se conecta al reproductorStore via useReproductorGlobal hook.
 */

import {Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Heart, Music} from 'lucide-react';
import {useReproductorGlobal} from '../../hooks/useReproductorGlobal';
import '../../styles/componentes/reproductorGlobal.css';
import { BotonBase } from './BotonBase';

export const ReproductorGlobal = (): JSX.Element | null => {
    const {
        sampleActual,
        reproduciendo,
        volumen,
        progreso,
        duracion,
        muted,
        repetir,
        aleatorio,
        togglePlay,
        toggleMute,
        toggleRepetir,
        toggleAleatorio,
        siguiente,
        anterior,
        manejarSeekProgreso,
        manejarSeekVolumen,
        progresoBarraRef,
        volumenBarraRef,
        contenedorRef,
        formatearTiempo,
    } = useReproductorGlobal();

    /* No mostrar si no hay sample */
    if (!sampleActual) return null;

    return (
        <div className="reproductorGlobal" id="reproductorGlobal" ref={contenedorRef}>
            {/* Izquierda: info del sample */}
            <div className="reproductorInfo">
                <div className="reproductorImagen">{sampleActual.imagenUrl ? <img src={sampleActual.imagenUrl} alt={sampleActual.titulo} /> : <Music size={20} />}</div>
                <div className="reproductorTextos">
                    <span className="reproductorTitulo">{sampleActual.titulo}</span>
                    <span className="reproductorArtista">{sampleActual.creador.nombreVisible || sampleActual.creador.username}</span>
                </div>
                <BotonBase variante="ghost" className={`reproductorControlBtn ${sampleActual.liked ? 'reproductorControlBtnActivo' : ''}`} type="button" aria-label="Like">
                    <Heart size={16} fill={sampleActual.liked ? 'currentColor' : 'none'} />
                </BotonBase>
            </div>

            {/* Centro: controles + progreso */}
            <div className="reproductorCentro">
                <div className="reproductorControles">
                    <BotonBase variante="ghost" className={`reproductorControlBtn ${aleatorio ? 'reproductorControlBtnActivo' : ''}`} onClick={toggleAleatorio} type="button" aria-label="Aleatorio">
                        <Shuffle size={14} />
                    </BotonBase>
                    <BotonBase variante="ghost" className="reproductorControlBtn" onClick={anterior} type="button" aria-label="Anterior">
                        <SkipBack size={16} />
                    </BotonBase>
                    <BotonBase variante="ghost" className="reproductorPlayBtn" onClick={togglePlay} type="button" aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}>
                        {reproduciendo ? <Pause size={18} /> : <Play size={18} />}
                    </BotonBase>
                    <BotonBase variante="ghost" className="reproductorControlBtn" onClick={siguiente} type="button" aria-label="Siguiente">
                        <SkipForward size={16} />
                    </BotonBase>
                    <BotonBase variante="ghost" className={`reproductorControlBtn ${repetir ? 'reproductorControlBtnActivo' : ''}`} onClick={toggleRepetir} type="button" aria-label="Repetir">
                        <Repeat size={14} />
                    </BotonBase>
                </div>

                <div className="reproductorProgreso">
                    <span className="reproductorTiempo">{formatearTiempo(progreso * duracion)}</span>
                    <div ref={progresoBarraRef} className="reproductorBarraProgreso" onClick={manejarSeekProgreso} role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progreso * 100)} aria-label="Progreso">
                        <div className="reproductorBarraRelleno" style={{width: `${progreso * 100}%`}} />
                    </div>
                    <span className="reproductorTiempo">{formatearTiempo(duracion)}</span>
                </div>
            </div>

            {/* Derecha: volumen */}
            <div className="reproductorDerecha">
                <div className="reproductorVolumen">
                    <BotonBase variante="ghost" className="reproductorControlBtn" onClick={toggleMute} type="button" aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </BotonBase>
                    <div ref={volumenBarraRef} className="reproductorVolumenBarra" onClick={manejarSeekVolumen} role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(volumen * 100)} aria-label="Volumen">
                        <div className="reproductorVolumenRelleno" style={{width: `${(muted ? 0 : volumen) * 100}%`}} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReproductorGlobal;
