/*
 * Componente: SeccionSampleDiscovery — Kamples
 * Si el sample fue extraído del pipeline, muestra el sampleo de origen
 * y sus dos canciones en el mismo formato de tabla que CancionDetalleIsland.
 */

import { SeccionRelaciones } from '@app/components/ui/SeccionRelaciones';
import { TablaRelaciones } from '@app/components/samples/TablaRelaciones';
import { useRelacionDiscovery } from '@app/hooks/useRelacionDiscovery';
import type { RelacionSample } from '@app/types/cancion';
import type { RelacionDetalleCompleta } from '@app/types/cancion';
import '../../styles/componentes/seccionRelaciones.css';
import '../../styles/componentes/tablaRelaciones.css';

interface SeccionSampleDiscoveryProps {
    sampleId: number;
}

/* Construye un RelacionSample desde los campos fuente_* o destino_* de una RelacionDetalleCompleta */
const construirFila = (
    relacion: RelacionDetalleCompleta,
    lado: 'fuente' | 'destino'
): RelacionSample => ({
    id: relacion.id,
    cancionDestinoId: relacion.cancionDestinoId,
    cancionFuenteId: relacion.cancionFuenteId,
    whosampledId: relacion.whosampledId,
    tipoRelacion: relacion.tipoRelacion,
    tipoElemento: relacion.tipoElemento,
    timingsDestino: relacion.timingsDestino,
    timingsFuente: relacion.timingsFuente,
    apareceEnTodo: relacion.apareceEnTodo,
    sampleId: relacion.sampleId,
    votosTotal: relacion.votosTotal,
    votosPromedio: relacion.votosPromedio,
    fuente: relacion.fuente,
    verificada: relacion.verificada,
    creadoAt: relacion.creadoAt,
    cancionTitulo:    lado === 'fuente' ? (relacion.fuente_titulo ?? undefined)  : (relacion.destino_titulo ?? undefined),
    cancionSlug:      lado === 'fuente' ? (relacion.fuente_slug ?? undefined)    : (relacion.destino_slug ?? undefined),
    artistaNombre:    lado === 'fuente' ? (relacion.fuente_artista ?? undefined) : (relacion.destino_artista ?? undefined),
    artistaSlug:      lado === 'fuente' ? (relacion.fuente_artistaSlug ?? undefined) : (relacion.destino_artistaSlug ?? undefined),
    cancionAnio:      lado === 'fuente' ? relacion.fuente_anio : relacion.destino_anio,
    cancionImagenUrl: lado === 'fuente' ? relacion.fuente_imagen : relacion.destino_imagen,
});

export const SeccionSampleDiscovery = ({ sampleId }: SeccionSampleDiscoveryProps): JSX.Element | null => {
    const { relacion, cargando } = useRelacionDiscovery(sampleId);

    if (cargando || !relacion) return null;

    const tieneFuente  = Boolean(relacion.fuente_slug);
    const tieneDestino = Boolean(relacion.destino_slug);

    if (!tieneFuente && !tieneDestino) return null;

    return (
        <>
            {tieneFuente && (
                <SeccionRelaciones titulo="Canción sampleada">
                    <TablaRelaciones
                        relaciones={[construirFila(relacion, 'fuente')]}
                        direccion="origen"
                    />
                </SeccionRelaciones>
            )}
            {tieneDestino && (
                <SeccionRelaciones titulo="Sampleada en">
                    <TablaRelaciones
                        relaciones={[construirFila(relacion, 'destino')]}
                        direccion="destino"
                    />
                </SeccionRelaciones>
            )}
        </>
    );
};
