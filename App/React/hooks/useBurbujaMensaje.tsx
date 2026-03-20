/*
 * Hook: useBurbujaMensaje
 * Lógica extraída de BurbujaMensaje (SRP).
 * Contiene sub-componentes privados (BurbujaImagen, BurbujaAudio, BurbujaSample)
 * y retorna el contenido renderizado junto con las clases CSS.
 */

import { useState, useRef } from 'react';
import { Play, Pause, Music, ExternalLink } from 'lucide-react';
import type { Mensaje, MediaMetadataSample } from '@app/types';
import { useT } from '@app/utils/i18n/useT';
import { BotonBase } from '../components/ui/BotonBase';
import { useVisorImagenStore } from '../stores/visorImagenStore';

/* Formatear tamaño de archivo (reservada para uso futuro con metadatos de archivos) */
const _formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
void _formatearTamano;

/* Burbuja de imagen — QQ52: visor inline en vez de window.open */
const BurbujaImagen = ({ mensaje }: { mensaje: Mensaje }): JSX.Element => {
    const abrirVisor = useVisorImagenStore(s => s.abrir);

    return (
        <div className="burbujaMensajeMedia burbujaImagen">
            <img
                src={mensaje.mediaUrl ?? ''}
                alt={mensaje.contenido || 'Imagen'}
                className="burbujaImagenImg"
                loading="lazy"
                onClick={() => {
                    if (mensaje.mediaUrl) abrirVisor(mensaje.mediaUrl, mensaje.contenido || 'Imagen');
                }}
            />
            {mensaje.contenido && (
                <p className="burbujaImagenTexto">{mensaje.contenido}</p>
            )}
        </div>
    );
};

/* Burbuja de audio */
const BurbujaAudio = ({ mensaje }: { mensaje: Mensaje }): JSX.Element => {
    const { t } = useT();
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
            <BotonBase variante="ghost"
                className="burbujaAudioBtn"
                onClick={alternarReproduccion} 
                tamano="ninguno"
                type="button"
                aria-label={reproduciendo ? t('sample.pausar') : t('sample.reproducir')}
            >
                {reproduciendo ? <Pause size={16} /> : <Play size={16} />}
            </BotonBase>
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

interface UseBurbujaMensajeParams {
    mensaje: Mensaje;
    esMio: boolean;
    compacto: boolean;
}

export const useBurbujaMensaje = ({ mensaje, esMio, compacto }: UseBurbujaMensajeParams) => {
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

    return {
        tipo,
        renderContenido,
        claseBase,
        claseMia,
        claseOtra,
        esMio,
    };
};
