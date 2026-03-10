/*
 * TarjetaCancionMini — Kamples
 * Tarjeta compacta de canción para el panel lateral: portada + título + artista.
 * Misma compacidad visual que panelDetalleTarjetaMini pero para canciones musicales.
 * Clickable: navega a /cancion/{slug}.
 */

import { Music } from 'lucide-react';
import { useNavigationStore } from '@/core/router';
import '../../styles/componentes/tarjetaCancionMini.css';

interface TarjetaCancionMiniProps {
    titulo: string | null;
    artista: string | null;
    slug: string | null;
    imagen: string | null;
    anio?: number | null;
    /* Etiqueta opcional sobre la tarjeta — ej: "Canción sampleada", "Sampleada en" */
    etiqueta?: string;
    /* Marca visual de que este lado es el origen de la extracción */
    esOrigen?: boolean;
}

export const TarjetaCancionMini = ({
    titulo, artista, slug, imagen, anio, etiqueta, esOrigen,
}: TarjetaCancionMiniProps): JSX.Element => {
    const navegar = useNavigationStore((s) => s.navegar);

    const handleClick = () => {
        if (slug) navegar(`/cancion/${slug}`);
    };

    return (
        <div className="tarjetaCancionMiniContenedor">
            {etiqueta && (
                <span className={`tarjetaCancionMiniEtiqueta${esOrigen ? ' tarjetaCancionMiniEtiquetaOrigen' : ''}`}>
                    {etiqueta}
                </span>
            )}
            <div
                className={`tarjetaCancionMini${slug ? ' tarjetaCancionMiniClickable' : ''}`}
                role={slug ? 'button' : undefined}
                tabIndex={slug ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && slug) {
                        e.preventDefault();
                        handleClick();
                    }
                }}
            >
                <div className="tarjetaCancionMiniPortada">
                    {imagen ? (
                        <img
                            src={imagen}
                            alt=""
                            className="tarjetaCancionMiniImagen"
                            loading="lazy"
                        />
                    ) : (
                        <div className="tarjetaCancionMiniImagenVacia">
                            <Music size={18} />
                        </div>
                    )}
                </div>
                <div className="tarjetaCancionMiniInfo">
                    <span className="tarjetaCancionMiniTitulo">{titulo ?? '—'}</span>
                    <span className="tarjetaCancionMiniArtista">
                        {artista ?? '—'}
                        {anio ? <span className="tarjetaCancionMiniAnio"> · {anio}</span> : null}
                    </span>
                </div>
            </div>
        </div>
    );
};
