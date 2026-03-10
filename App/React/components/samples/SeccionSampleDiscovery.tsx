/*
 * Componente: SeccionSampleDiscovery — Kamples
 * Si el sample fue extraído del pipeline, muestra la relación principal
 * con indicador visual (fuente/destino) + todas las relaciones adicionales
 * de ambas canciones involucradas.
 */

import { SeccionRelaciones } from '@app/components/ui/SeccionRelaciones';
import { TablaRelaciones } from '@app/components/samples/TablaRelaciones';
import { useRelacionDiscovery } from '@app/hooks/useRelacionDiscovery';
import type { RelacionSample, RelacionDetalleCompleta } from '@app/types/cancion';
import '../../styles/componentes/seccionRelaciones.css';
import '../../styles/componentes/tablaRelaciones.css';
import '../../styles/componentes/sampleDetalle.css';

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
    /* Ambos lados para URLs SEO completas */
    destinoTitulo:  relacion.destino_titulo,
    destinoArtista: relacion.destino_artista,
    fuenteTitulo:   relacion.fuente_titulo,
    fuenteArtista:  relacion.fuente_artista,
});

export const SeccionSampleDiscovery = ({ sampleId }: SeccionSampleDiscoveryProps): JSX.Element | null => {
    const { relacion, cargando } = useRelacionDiscovery(sampleId);

    if (cargando || !relacion) return null;

    const tieneFuente  = Boolean(relacion.fuente_slug);
    const tieneDestino = Boolean(relacion.destino_slug);

    if (!tieneFuente && !tieneDestino) return null;

    /* Determinar el lado de extracción para el marcador de origen */
    const esFuente = relacion.ladoExtraccion === 'fuente';
    const etiquetaOrigen = esFuente ? 'Canción sampleada (origen)' : 'Samplea a (origen)';
    const etiquetaRelacion = esFuente ? 'Sampleada en' : 'Canción sampleada';

    return (
        <>
            {/* Relación principal: la extracción directa */}
            {tieneFuente && (
                <SeccionRelaciones titulo={etiquetaOrigen}>
                    <TablaRelaciones
                        relaciones={[construirFila(relacion, 'fuente')]}
                        direccion="origen"
                        marcarOrigen={esFuente}
                    />
                </SeccionRelaciones>
            )}
            {tieneDestino && (
                <SeccionRelaciones titulo={etiquetaRelacion}>
                    <TablaRelaciones
                        relaciones={[construirFila(relacion, 'destino')]}
                        direccion="destino"
                        marcarOrigen={!esFuente}
                    />
                </SeccionRelaciones>
            )}

            {/* Relaciones adicionales de la canción destino */}
            {(relacion.destinoSamplesDe?.length ?? 0) > 0 && (
                <SeccionRelaciones
                    titulo={`${relacion.destino_titulo ?? 'Canción'} también samplea a`}
                    contador={relacion.destinoSamplesDe!.length}
                >
                    <TablaRelaciones relaciones={relacion.destinoSamplesDe!} direccion="destino" />
                </SeccionRelaciones>
            )}
            {(relacion.destinoSampleadaEn?.length ?? 0) > 0 && (
                <SeccionRelaciones
                    titulo={`${relacion.destino_titulo ?? 'Canción'} fue sampleada en`}
                    contador={relacion.destinoSampleadaEn!.length}
                >
                    <TablaRelaciones relaciones={relacion.destinoSampleadaEn!} direccion="origen" />
                </SeccionRelaciones>
            )}

            {/* Relaciones adicionales de la canción fuente */}
            {(relacion.fuenteSamplesDe?.length ?? 0) > 0 && (
                <SeccionRelaciones
                    titulo={`${relacion.fuente_titulo ?? 'Canción'} también samplea a`}
                    contador={relacion.fuenteSamplesDe!.length}
                >
                    <TablaRelaciones relaciones={relacion.fuenteSamplesDe!} direccion="destino" />
                </SeccionRelaciones>
            )}
            {(relacion.fuenteSampleadaEn?.length ?? 0) > 0 && (
                <SeccionRelaciones
                    titulo={`${relacion.fuente_titulo ?? 'Canción'} fue sampleada en`}
                    contador={relacion.fuenteSampleadaEn!.length}
                >
                    <TablaRelaciones relaciones={relacion.fuenteSampleadaEn!} direccion="origen" />
                </SeccionRelaciones>
            )}
        </>
    );
};
