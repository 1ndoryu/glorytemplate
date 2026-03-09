/*
 * Componente: TarjetaRelacionSample — Kamples
 * Muestra una relación entre dos canciones (sample, cover, remix, interpolation).
 * Par de canciones con tipo, timing y badge de elemento.
 * Reutilizable en CancionDetalleIsland, ExplorarCancionesIsland, etc.
 */

import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useNavigationStore } from '@/core/router';
import type { RelacionSample } from '@app/types/cancion';
import {
    ETIQUETAS_TIPO_RELACION,
    ETIQUETAS_TIPO_ELEMENTO,
} from '@app/types/cancion';
import '../../styles/componentes/tarjetaRelacionSample.css';

interface TarjetaRelacionSampleProps {
    relacion: RelacionSample;
    /* Dirección visual: 'origen' muestra "sampled by", 'destino' muestra "samples" */
    direccion: 'origen' | 'destino';
}

const formatearTimings = (timings: number[]): string => {
    if (!timings || timings.length === 0) return '';
    return timings
        .map((t) => {
            const min = Math.floor(t / 60);
            const seg = t % 60;
            return `${min}:${String(seg).padStart(2, '0')}`;
        })
        .join(', ');
};

export const TarjetaRelacionSample = ({
    relacion,
    direccion,
}: TarjetaRelacionSampleProps): JSX.Element => {
    const navegar = useNavigationStore((s) => s.navegar);

    const handleClickCancion = () => {
        if (relacion.cancionSlug) {
            navegar(`/cancion/${relacion.cancionSlug}`);
        }
    };

    const handleClickArtista = () => {
        if (relacion.artistaSlug) {
            navegar(`/artista/${relacion.artistaSlug}`);
        }
    };

    const timings =
        direccion === 'destino'
            ? relacion.timingsDestino
            : relacion.timingsFuente;

    const etiquetaDireccion =
        direccion === 'destino' ? 'Samplea a' : 'Sampleada por';

    return (
        <div className="tarjetaRelacion" role="article">
            <div className="tarjetaRelacionEncabezado">
                <Badge variante="acento" tamano="xs">
                    {ETIQUETAS_TIPO_RELACION[relacion.tipoRelacion]}
                </Badge>
                {relacion.tipoElemento && (
                    <Badge variante="neutro" tamano="xs">
                        {ETIQUETAS_TIPO_ELEMENTO[relacion.tipoElemento]}
                    </Badge>
                )}
                <span className="tarjetaRelacionDireccion">
                    {etiquetaDireccion}
                </span>
            </div>

            <div className="tarjetaRelacionCuerpo">
                {relacion.cancionImagenUrl && (
                    <img
                        className="tarjetaRelacionImagen"
                        src={relacion.cancionImagenUrl}
                        alt={relacion.cancionTitulo ?? ''}
                        loading="lazy"
                    />
                )}

                <div className="tarjetaRelacionInfo">
                    <BotonBase
                        variante="ghost"
                        className="tarjetaRelacionTitulo"
                        onClick={handleClickCancion}
                    >
                        {relacion.cancionTitulo ?? `Canción #${direccion === 'destino' ? relacion.cancionDestinoId : relacion.cancionFuenteId}`}
                    </BotonBase>
                    {relacion.artistaNombre && (
                        <BotonBase
                            variante="ghost"
                            className="tarjetaRelacionArtista"
                            onClick={handleClickArtista}
                        >
                            {relacion.artistaNombre}
                        </BotonBase>
                    )}
                    {relacion.cancionAnio && (
                        <span className="tarjetaRelacionAnio">
                            {relacion.cancionAnio}
                        </span>
                    )}
                </div>

                <div className="tarjetaRelacionMeta">
                    {timings.length > 0 && (
                        <span className="tarjetaRelacionTiming">
                            {formatearTimings(timings)}
                        </span>
                    )}
                    {relacion.apareceEnTodo && (
                        <span className="tarjetaRelacionThroughout">
                            y en toda la canción
                        </span>
                    )}
                    {relacion.verificada && (
                        <Badge variante="exito" tamano="xs">
                            Verificada
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
};
