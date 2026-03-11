/*
 * TarjetaCancionFeed — C812
 * Tarjeta horizontal para el feed vertical de canciones.
 * Imagen izquierda, info derecha, badge de samples.
 * Click navega a /cancion/{slug}.
 */

import { Music } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import type { Cancion } from '@app/types/cancion';

export interface TarjetaCancionFeedProps {
    cancion: Cancion;
    onClick: () => void;
}

export const TarjetaCancionFeed = ({ cancion, onClick }: TarjetaCancionFeedProps): JSX.Element => (
    <div
        className="tarjetaCancionFeed"
        role="article"
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
        tabIndex={0}
    >
        <div className="tarjetaCancionFeedImagen">
            {cancion.imagenUrl ? (
                <img src={cancion.imagenUrl} alt={cancion.titulo} loading="lazy" />
            ) : (
                <div className="tarjetaCancionFeedImagenPlaceholder">
                    <Music size={24} color="var(--textoTerciario)" />
                </div>
            )}
        </div>

        <div className="tarjetaCancionFeedInfo">
            <h3 className="tarjetaCancionFeedTitulo">{cancion.titulo}</h3>
            <p className="tarjetaCancionFeedArtista">
                {cancion.artistaNombre ?? 'Artista desconocido'}
                {cancion.anio ? ` · ${cancion.anio}` : ''}
            </p>
            <div className="tarjetaCancionFeedMeta">
                {cancion.totalSampleada > 0 && (
                    <Badge variante="acento" tamano="xs">
                        {cancion.totalSampleada} sample{cancion.totalSampleada !== 1 ? 's' : ''}
                    </Badge>
                )}
                {cancion.genero && (
                    <Badge variante="neutro" tamano="xs">{cancion.genero}</Badge>
                )}
                {cancion.bpm && (
                    <Badge variante="neutro" tamano="xs">{cancion.bpm} BPM</Badge>
                )}
            </div>
        </div>
    </div>
);
