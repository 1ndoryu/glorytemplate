/*
 * Componente: ReproductorGlobal
 * Barra inferior persistente del reproductor de audio.
 * Controles: play/pause, anterior/siguiente, seek, volumen, repetir, aleatorio.
 * Se conecta al reproductorStore (Zustand).
 */

import {useCallback, useRef, useEffect, type MouseEvent} from 'react';
import {Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Heart, Music} from 'lucide-react';
import {useReproductorStore} from '../../stores/reproductorStore';
import '../../styles/componentes/reproductorGlobal.css';

/* Formatear segundos a mm:ss */
const formatearTiempo = (segundos: number): string => {
    if (!segundos || isNaN(segundos)) return '0:00';
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const ReproductorGlobal = (): JSX.Element | null => {
    const {sampleActual, reproduciendo, volumen, progreso, duracion, muted, repetir, aleatorio, play, pause, togglePlay, setVolumen, toggleMute, setProgreso, setDuracion, toggleRepetir, toggleAleatorio, siguiente, anterior, cerrar} = useReproductorStore();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progresoBarraRef = useRef<HTMLDivElement>(null);
    const volumenBarraRef = useRef<HTMLDivElement>(null);
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Cerrar reproductor al hacer click fuera */
    useEffect(() => {
        if (!sampleActual) return;

        const manejarClickFuera = (e: globalThis.MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                cerrar();
            }
        };

        document.addEventListener('mousedown', manejarClickFuera);
        return () => document.removeEventListener('mousedown', manejarClickFuera);
    }, [sampleActual, cerrar]);

    /* Crear/actualizar elemento de audio */
    useEffect(() => {
        if (!sampleActual) return;

        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        const audio = audioRef.current;

        /* Solo cambiar src si es diferente */
        if (audio.src !== sampleActual.rutaPreview) {
            audio.src = sampleActual.rutaPreview;
            audio.load();
        }
    }, [sampleActual]);

    /* Controlar play/pause */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (reproduciendo) {
            audio.play().catch(() => pause());
        } else {
            audio.pause();
        }
    }, [reproduciendo, pause]);

    /* Configurar volumen */
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volumen;
        }
    }, [volumen, muted]);

    /* Eventos del audio */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const actualizarProgreso = () => {
            if (audio.duration) {
                setProgreso(audio.currentTime / audio.duration);
            }
        };

        const finAudio = () => {
            if (repetir) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
            } else {
                siguiente();
            }
        };

        const cargarMetadata = () => {
            setDuracion(audio.duration);
        };

        audio.addEventListener('timeupdate', actualizarProgreso);
        audio.addEventListener('ended', finAudio);
        audio.addEventListener('loadedmetadata', cargarMetadata);

        return () => {
            audio.removeEventListener('timeupdate', actualizarProgreso);
            audio.removeEventListener('ended', finAudio);
            audio.removeEventListener('loadedmetadata', cargarMetadata);
        };
    }, [setProgreso, setDuracion, repetir, siguiente]);

    /* Seek en barra de progreso */
    const manejarSeekProgreso = useCallback(
        (e: MouseEvent) => {
            const barra = progresoBarraRef.current;
            const audio = audioRef.current;
            if (!barra || !audio || !audio.duration) return;

            const rect = barra.getBoundingClientRect();
            const posicion = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audio.currentTime = posicion * audio.duration;
            setProgreso(posicion);
        },
        [setProgreso]
    );

    /* Seek en barra de volumen */
    const manejarSeekVolumen = useCallback(
        (e: MouseEvent) => {
            const barra = volumenBarraRef.current;
            if (!barra) return;

            const rect = barra.getBoundingClientRect();
            const nuevoVol = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setVolumen(nuevoVol);
        },
        [setVolumen]
    );

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
                <button className={`reproductorControlBtn ${sampleActual.liked ? 'reproductorControlBtnActivo' : ''}`} type="button" aria-label="Like">
                    <Heart size={16} fill={sampleActual.liked ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Centro: controles + progreso */}
            <div className="reproductorCentro">
                <div className="reproductorControles">
                    <button className={`reproductorControlBtn ${aleatorio ? 'reproductorControlBtnActivo' : ''}`} onClick={toggleAleatorio} type="button" aria-label="Aleatorio">
                        <Shuffle size={14} />
                    </button>
                    <button className="reproductorControlBtn" onClick={anterior} type="button" aria-label="Anterior">
                        <SkipBack size={16} />
                    </button>
                    <button className="reproductorPlayBtn" onClick={togglePlay} type="button" aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}>
                        {reproduciendo ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button className="reproductorControlBtn" onClick={siguiente} type="button" aria-label="Siguiente">
                        <SkipForward size={16} />
                    </button>
                    <button className={`reproductorControlBtn ${repetir ? 'reproductorControlBtnActivo' : ''}`} onClick={toggleRepetir} type="button" aria-label="Repetir">
                        <Repeat size={14} />
                    </button>
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
                    <button className="reproductorControlBtn" onClick={toggleMute} type="button" aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <div ref={volumenBarraRef} className="reproductorVolumenBarra" onClick={manejarSeekVolumen} role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(volumen * 100)} aria-label="Volumen">
                        <div className="reproductorVolumenRelleno" style={{width: `${(muted ? 0 : volumen) * 100}%`}} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReproductorGlobal;
