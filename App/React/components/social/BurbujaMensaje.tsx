/*
 * Componente: BurbujaMensaje — Kamples (Fase 5.2)
 * Renderiza una burbuja de chat con soporte multimedia.
 * Tipos: texto, imagen, audio, sample.
 */

import { useState, useRef } from 'react';
import { Play, Pause, Music, ExternalLink } from 'lucide-react';
import type { Mensaje, MediaMetadataSample } from '@app/types';
import '../../styles/componentes/burbujaMensaje.css';

interface BurbujaMensajeProps {
    mensaje: Mensaje;
    esMio: boolean;
    compacto?: boolean;
}

/* Formatear tamaño de archivo (reservada para uso futuro con metadatos de archivos) */
const _formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
void _formatearTamano;

/* Burbuja de imagen */
const BurbujaImagen = ({ mensaje }: { mensaje: Mensaje }): JSX.Element => (
    <div className="burbujaMensajeMedia burbujaImagen">
        <img
            src={mensaje.mediaUrl ?? ''}
            alt={mensaje.contenido || 'Imagen'}
            className="burbujaImagenImg"
            loading="lazy"
            onClick={() => {
                if (mensaje.mediaUrl) window.open(mensaje.mediaUrl, '_blank');
            }}
        />
        {mensaje.contenido && (
            <p className="burbujaImagenTexto">{mensaje.contenido}</p>
        )}
    </div>
);

/* Burbuja de audio */
const BurbujaAudio = ({ mensaje }: { mensaje: Mensaje }): JSX.Element => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);

    const alternarReproduccion = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (reproduciendo) {
            audio.pause();
        } else {
            audio.play();
        }
        setReproduciendo(!reproduciendo);
    };

    const manejarProgreso = () => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        setProgreso((audio.currentTime / audio.duration) * 100);
    };

    const manejarFin = () => {
        setReproduciendo(false);
        setProgreso(0);
    };

    return (
        <div className="burbujaMensajeMedia burbujaAudio">
            <audio
                ref={audioRef}
                src={mensaje.mediaUrl ?? ''}
                onTimeUpdate={manejarProgreso}
                onEnded={manejarFin}
                preload="metadata"
            />
            <button
                className="burbujaAudioBtn"
                onClick={alternarReproduccion}
                type="button"
                aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
            >
                {reproduciendo ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="burbujaAudioProgreso">
                <div
                    className="burbujaAudioBarra"
                    style={{ width: `${progreso}%` }}
                />
            </div>
            {mensaje.contenido && (
                <span className="burbujaAudioTexto">{mensaje.contenido}</span>
            )}
        </div>
    );
};

/* Burbuja de sample compartido */
const BurbujaSample = ({ mensaje }: { mensaje: Mensaje }): JSX.Element => {
    const meta = mensaje.mediaMetadata as MediaMetadataSample | undefined;

    const navegar = () => {
        if (meta?.slug) {
            window.location.href = `/sample/${meta.slug}`;
        }
    };

    return (
        <div className="burbujaMensajeMedia burbujaSample" onClick={navegar} role="button" tabIndex={0}>
            <div className="burbujaSampleIcono">
                <Music size={20} />
            </div>
            <div className="burbujaSampleInfo">
                <span className="burbujaSampleTitulo">
                    {meta?.titulo ?? mensaje.contenido}
                </span>
                <div className="burbujaSampleDetalles">
                    {meta?.tipo && <span className="burbujaSampleTipo">{meta.tipo}</span>}
                    {meta?.bpm && <span>{meta.bpm} BPM</span>}
                    {meta?.key && <span>{meta.key}</span>}
                </div>
            </div>
            <ExternalLink size={14} className="burbujaSampleLink" />
        </div>
    );
};

/* Componente principal */
export const BurbujaMensaje = ({ mensaje, esMio, compacto = false }: BurbujaMensajeProps): JSX.Element => {
    const tipo = mensaje.tipo ?? 'texto';

    const renderContenido = () => {
        switch (tipo) {
            case 'imagen':
                return <BurbujaImagen mensaje={mensaje} />;
            case 'audio':
                return <BurbujaAudio mensaje={mensaje} />;
            case 'sample':
                return <BurbujaSample mensaje={mensaje} />;
            default:
                return <p>{mensaje.contenido}</p>;
        }
    };

    const claseBase = compacto ? 'chatFlotanteBurbuja' : 'chatBurbuja';
    const claseMia = compacto ? 'chatFlotanteBurbujaMia' : 'chatBurbujaMia';
    const claseOtra = compacto ? 'chatFlotanteBurbujaOtra' : 'chatBurbujaOtra';

    return (
        <div className={`${claseBase} ${esMio ? claseMia : claseOtra} ${tipo !== 'texto' ? 'burbujaTipoMedia' : ''}`}>
            {compacto ? (
                renderContenido()
            ) : (
                <div className="chatBurbujaContenido">
                    {renderContenido()}
                </div>
            )}
        </div>
    );
};

export default BurbujaMensaje;
