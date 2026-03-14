/*
 * TarjetaArtista — QK18/QK22
 * Tarjeta circular para artistas en la seccion "Artistas Populares".
 * Imagen circular, nombre centrado, canciones count.
 */

import { User } from 'lucide-react';
import type { ArtistaMusicale } from '@app/types/cancion';

interface Props {
    artista: ArtistaMusicale;
    onClick: () => void;
}

export const TarjetaArtista = ({ artista, onClick }: Props): JSX.Element => (
    <div
        className="tarjetaArtista"
        role="article"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
    >
        <div className="tarjetaArtistaImagen">
            {artista.imagenUrl ? (
                <img src={artista.imagenUrl} alt={artista.nombre} loading="lazy" />
            ) : (
                <div className="tarjetaArtistaImagenPlaceholder">
                    <User size={32} color="var(--textoTerciario)" />
                </div>
            )}
        </div>
        <p className="tarjetaArtistaNombre">{artista.nombre}</p>
        {artista.totalCanciones > 0 && (
            <p className="tarjetaArtistaCanciones">
                {artista.totalCanciones} {artista.totalCanciones === 1 ? 'canción' : 'canciones'}
            </p>
        )}
    </div>
);
