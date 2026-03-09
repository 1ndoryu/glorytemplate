/*
 * Componente: SeccionSampleDiscovery — Kamples
 * Muestra info de Sample Discovery dentro de SampleDetalleIsland.
 * Si el sample fue extraído del pipeline, vincula a canciones fuente/destino.
 */

import { Music, ExternalLink } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useNavigationStore } from '@/core/router';
import { useRelacionDiscovery } from '@app/hooks/useRelacionDiscovery';
import { ETIQUETAS_TIPO_RELACION, ETIQUETAS_TIPO_ELEMENTO } from '@app/types/cancion';
import type { RelacionSample } from '@app/types/cancion';

interface SeccionSampleDiscoveryProps {
    sampleId: number;
}

/* Componente interno: enlace a canción */
const EnlaceCancion = ({
    titulo,
    slug,
    artista,
    anio,
}: {
    titulo: string;
    slug: string;
    artista?: string;
    anio?: number | null;
}): JSX.Element => {
    const navegar = useNavigationStore((s) => s.navegar);

    return (
        <BotonBase
            variante="ghost"
            tamano="ninguno"
            className="discoveryEnlaceCancion"
            onClick={() => navegar(`/cancion/${slug}`)}
        >
            <Music size={14} />
            <span className="discoveryEnlaceTitulo">{titulo}</span>
            {artista && <span className="discoveryEnlaceArtista">— {artista}</span>}
            {anio && <span className="discoveryEnlaceAnio">({anio})</span>}
            <ExternalLink size={12} />
        </BotonBase>
    );
};

/* Renderizar la info de la relación */
const RenderRelacion = ({ relacion }: { relacion: RelacionSample }): JSX.Element => {
    /* Los campos fuente_* y destino_* vienen del JOIN del repo PHP */
    const datos = relacion as RelacionSample & {
        fuente_titulo?: string;
        fuente_slug?: string;
        fuente_artista?: string;
        fuente_artista_slug?: string;
        fuente_anio?: number;
        fuente_imagen?: string;
        destino_titulo?: string;
        destino_slug?: string;
        destino_artista?: string;
        destino_artista_slug?: string;
        destino_anio?: number;
        destino_imagen?: string;
    };

    return (
        <div className="discoveryContenido">
            <div className="discoveryBadges">
                <Badge variante="acento" tamano="xs">
                    {ETIQUETAS_TIPO_RELACION[relacion.tipoRelacion]}
                </Badge>
                {relacion.tipoElemento && (
                    <Badge variante="neutro" tamano="xs">
                        {ETIQUETAS_TIPO_ELEMENTO[relacion.tipoElemento]}
                    </Badge>
                )}
                {relacion.verificada && (
                    <Badge variante="exito" tamano="xs">Verificada</Badge>
                )}
            </div>

            <div className="discoveryCanciones">
                {datos.fuente_titulo && datos.fuente_slug && (
                    <div className="discoveryFila">
                        <span className="discoveryEtiqueta">Fuente:</span>
                        <EnlaceCancion
                            titulo={datos.fuente_titulo}
                            slug={datos.fuente_slug}
                            artista={datos.fuente_artista}
                            anio={datos.fuente_anio}
                        />
                    </div>
                )}
                {datos.destino_titulo && datos.destino_slug && (
                    <div className="discoveryFila">
                        <span className="discoveryEtiqueta">Destino:</span>
                        <EnlaceCancion
                            titulo={datos.destino_titulo}
                            slug={datos.destino_slug}
                            artista={datos.destino_artista}
                            anio={datos.destino_anio}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export const SeccionSampleDiscovery = ({ sampleId }: SeccionSampleDiscoveryProps): JSX.Element | null => {
    const { relacion, cargando } = useRelacionDiscovery(sampleId);

    if (cargando || !relacion) return null;

    return (
        <div className="discoverySeccion">
            <h3 className="discoveryTitulo">
                <Music size={16} />
                Sample Discovery
            </h3>
            <RenderRelacion relacion={relacion} />
        </div>
    );
};
