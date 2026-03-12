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

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            if (slug) navegar(`/cancion/${slug}`);
        }
    };

    const Contenedor = slug ? 'a' : 'div';
    const containerProps = slug
        ? { href: `/cancion/${slug}`, onClick: handleClick as React.MouseEventHandler }
        : {};

    return (
        <Contenedor
            className={`tarjetaCancionMini${slug ? ' tarjetaCancionMiniClickable' : ''}`}
            {...containerProps}
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
                <span className="tarjetaCancionMiniTitulo">
                    {titulo ?? '—'}
                    {etiqueta && (
                        <span className={`tarjetaCancionMiniEtiquetaInline${esOrigen ? ' tarjetaCancionMiniEtiquetaInlineOrigen' : ''}`}>
                            {' — '}{etiqueta}
                        </span>
                    )}
                </span>
                <span className="tarjetaCancionMiniArtista">
                    {artista ?? '—'}
                    {anio ? <span className="tarjetaCancionMiniAnio"> · {anio}</span> : null}
                </span>
            </div>
        </Contenedor>
    );
};
