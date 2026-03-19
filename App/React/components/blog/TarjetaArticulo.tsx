/*
 * TarjetaArticulo.tsx — Kamples (183A-109)
 * Card de artículo del blog. Imagen, título, extracto, autor, fecha, like y comentarios.
 */

import { Heart, MessageCircle, MoreHorizontal, FileText } from 'lucide-react';
import { EnlaceNavegacion } from '@app/components/ui/EnlaceNavegacion';
import { ImgOptimizada } from '@app/components/ui/ImgOptimizada';
import { BotonBase } from '@app/components/ui/BotonBase';
import { formatearTiempoRelativo } from '@app/utils/tiempo';
import type { ArticuloResumen } from '@app/types';
import '@app/styles/componentes/tarjetaArticulo.css';

/* [183A-109] Mapa de categoría slug → etiqueta legible */
const etiquetasCategoria: Record<string, string> = {
    'inspiracion': 'Inspiración',
    'mastering': 'Mastering',
    'mezcla': 'Mezcla',
    'promocion-musical': 'Promoción Musical',
    'teoria-musical': 'Teoría Musical',
    'grabacion': 'Grabación',
    'sampling': 'Sampling',
    'diseno-sonoro': 'Diseño Sonoro',
    'herramientas': 'Herramientas',
    'ableton-live': 'Ableton Live',
    'bitwig-studio': 'Bitwig Studio',
    'cubase': 'Cubase',
    'fl-studio': 'FL Studio',
    'garageband': 'GarageBand',
    'logic-pro': 'Logic Pro',
    'pro-tools': 'Pro Tools',
    'studio-one': 'Studio One',
    'drops-gratis': 'Drops Gratis',
    'midi-gratis': 'MIDI Gratis',
    'plugins-gratis': 'Plugins Gratis',
    'presets-gratis': 'Presets Gratis',
    'proyectos-gratis': 'Proyectos Gratis',
    'sonidos-gratis': 'Sonidos Gratis',
    'entrevistas': 'Entrevistas',
    'destacados': 'Destacados',
    'noticias': 'Noticias',
};

export const obtenerEtiquetaCategoria = (slug: string): string =>
    etiquetasCategoria[slug] ?? slug;

interface TarjetaArticuloProps {
    articulo: ArticuloResumen;
    onLike?: (id: number) => void;
    onMenu?: (id: number, e: React.MouseEvent) => void;
}

export const TarjetaArticulo: React.FC<TarjetaArticuloProps> = ({ articulo, onLike, onMenu }) => {
    const fechaTexto = articulo.publicadoEn
        ? formatearTiempoRelativo(articulo.publicadoEn)
        : '';

    const manejarLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onLike?.(articulo.id);
    };

    const manejarMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMenu?.(articulo.id, e);
    };

    return (
        <EnlaceNavegacion href={`/blog/${articulo.slug}`} className="tarjetaArticulo">
            {/* Portada */}
            <div className="tarjetaArticuloPortada">
                {articulo.portadaUrl ? (
                    <ImgOptimizada
                        src={articulo.portadaUrl}
                        alt={articulo.titulo}
                        w={400}
                        h={225}
                    />
                ) : (
                    <div className="tarjetaArticuloPortadaVacia">
                        <FileText size={32} />
                    </div>
                )}
                <span className="tarjetaArticuloCategoria">
                    {obtenerEtiquetaCategoria(articulo.categoria)}
                </span>
            </div>

            {/* Info */}
            <div className="tarjetaArticuloInfo">
                <h3 className="tarjetaArticuloTitulo">{articulo.titulo}</h3>
                {articulo.extracto && (
                    <p className="tarjetaArticuloExtracto">{articulo.extracto}</p>
                )}

                <div className="tarjetaArticuloMeta">
                    <span className="tarjetaArticuloAutor">
                        {articulo.autor?.nombreVisible ?? articulo.autor?.username ?? ''}
                    </span>
                    <span className="tarjetaArticuloSeparadorMeta">·</span>
                    <span className="tarjetaArticuloFecha">{fechaTexto}</span>
                </div>
            </div>

            {/* Acciones */}
            <div className="tarjetaArticuloAcciones">
                <BotonBase
                    variante="ghost"
                    tamano="ninguno"
                    soloIcono
                    className={`tarjetaArticuloAccionBtn ${articulo.liked ? 'tarjetaArticuloAccionLiked' : ''}`}
                    onClick={manejarLike}
                    aria-label="Me gusta"
                >
                    <Heart size={14} fill={articulo.liked ? 'currentColor' : 'none'} />
                    {articulo.totalLikes > 0 && <span>{articulo.totalLikes}</span>}
                </BotonBase>

                <BotonBase
                    variante="ghost"
                    tamano="ninguno"
                    soloIcono
                    className="tarjetaArticuloAccionBtn"
                    aria-label="Comentarios"
                >
                    <MessageCircle size={14} />
                    {articulo.totalComentarios > 0 && <span>{articulo.totalComentarios}</span>}
                </BotonBase>

                <BotonBase
                    variante="ghost"
                    tamano="ninguno"
                    soloIcono
                    className="tarjetaArticuloAccionBtn tarjetaArticuloMenuBtn"
                    onClick={manejarMenu}
                    aria-label="Más opciones"
                >
                    <MoreHorizontal size={14} />
                </BotonBase>
            </div>
        </EnlaceNavegacion>
    );
};
