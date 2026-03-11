/*
 * Componente: TarjetaRelacionSample — Kamples
 * Muestra una relacion entre dos canciones (sample, cover, remix, interpolation).
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
    construirUrlSampleo,
} from '@app/types/cancion';
import { BotonReporteLegal } from './BotonReporteLegal';
import '../../styles/componentes/tarjetaRelacionSample.css';

interface TarjetaRelacionSampleProps {
    relacion: RelacionSample;
    /* Direccion visual: 'origen' muestra "sampled by", 'destino' muestra "samples" */
    direccion: 'origen' | 'destino';
    /* Oculta encabezado con badges de tipo cuando se agrupa en seccion */
    mostrarEncabezado?: boolean;
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

/* Construye URL SEO para un sampleo con datos disponibles */
const urlSampleo = (rel: RelacionSample, direccion: 'origen' | 'destino'): string => {
    if (rel.destinoArtista || rel.fuenteArtista) {
        return construirUrlSampleo(rel.id, rel.destinoArtista, rel.destinoTitulo, rel.fuenteArtista, rel.fuenteTitulo);
    }
    if (direccion === 'destino') {
        return construirUrlSampleo(rel.id, undefined, undefined, rel.artistaNombre, rel.cancionTitulo);
    }
    return construirUrlSampleo(rel.id, rel.artistaNombre, rel.cancionTitulo);
};

export const TarjetaRelacionSample = ({
    relacion,
    direccion,
    mostrarEncabezado = true,
}: TarjetaRelacionSampleProps): JSX.Element => {
    const navegar = useNavigationStore((s) => s.navegar);

    const handleClickRelacion = () => {
        navegar(urlSampleo(relacion, direccion));
    };

    const handleClickCancion = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (relacion.cancionSlug) {
            navegar(`/cancion/${relacion.cancionSlug}`);
        }
    };

    const handleClickArtista = (e: React.MouseEvent) => {
        e.stopPropagation();
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
        <div className="tarjetaRelacion" role="article" onClick={handleClickRelacion}>
            {mostrarEncabezado && (
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
            )}

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
                        <span className="tarjetaRelacionThroughout" style={{ display: 'none' }}>
                           
                        </span>
                    )}
                    {relacion.verificada && (
                        <Badge variante="exito" tamano="xs">
                            Verificada
                        </Badge>
                    )}
                    {relacion.contribuidorUsername && (
                        <span className="tarjetaRelacionContribuidor" title="Contribuido por la comunidad">
                            contrib. {relacion.contribuidorUsername}
                        </span>
                    )}
                </div>
            </div>

            <div className="tarjetaRelacionPie" onClick={(e) => e.stopPropagation()}>
                <BotonReporteLegal
                    tipo="legal_relacion"
                    targetId={relacion.id}
                    descripcion={`Relacion #${relacion.id}: ${relacion.fuenteTitulo ?? ''} → ${relacion.destinoTitulo ?? ''}`}
                />
            </div>
        </div>
    );
};
