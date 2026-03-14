/*
 * Tipos: Sample Discovery — Kamples
 * Canciones, artistas musicales y relaciones de samples.
 * Datos provenientes del scraping de WhoSampled + extracción de audio.
 */

/* Canción con metadata completa */
export interface Cancion {
    id: number;
    titulo: string;
    slug: string;
    artistaId: number;
    album: string | null;
    sello: string | null;
    anio: number | null;
    duracionSegundos: number | null;
    genero: string | null;
    youtubeId: string | null;
    spotifyId: string | null;
    imagenUrl: string | null;
    whosampledUrl: string | null;
    bpm: number | null;
    tonalidad: string | null;
    metadata: Record<string, unknown>;
    totalSampleada: number;
    totalSamplea: number;
    creadoAt: string;
    actualizadoAt: string;
    /* Relación con artista principal (join del repo) */
    artistaNombre?: string;
    artistaSlug?: string;
    /* Liked status (subquery correlacionada en feed, opcional si no hay sesion) */
    liked?: boolean;
    totalLikes?: number;
    reaccion?: string | null;
    /* Primer sample Kamples vinculado a esta cancion (subquery JSON en feed) */
    sampleAdjunto?: SampleAdjuntoCancion | null;
}

/*
 * Subset minimo de un sample Kamples vinculado a una cancion.
 * Campos necesarios para reproducir desde la TarjetaCancionFeed.
 */
export interface SampleAdjuntoCancion {
    id: number;
    titulo: string;
    slug: string;
    rutaPreview: string;
    imagenUrl: string | null;
    creadorId: number;
    idCorto: string;
    duracion: number;
    tipo: string;
}

/* Versión compacta para listas */
export interface CancionResumen {
    id: number;
    titulo: string;
    slug: string;
    anio: number | null;
    genero: string | null;
    imagenUrl: string | null;
    totalSampleada: number;
    totalSamplea: number;
    artistaNombre?: string;
    artistaSlug?: string;
}

/* Artista musical (no confundir con usuario de Kamples) */
export interface ArtistaMusicale {
    id: number;
    nombre: string;
    slug: string;
    imagenUrl: string | null;
    whosampledSlug: string | null;
    metadata: Record<string, unknown>;
    totalCanciones: number;
    creadoAt: string;
}

/* QK18/QK22: Seccion de la pagina de musica estilo Spotify */
export interface SeccionMusica {
    tipo: 'para_ti' | 'tendencia' | 'top' | 'genero' | 'artistas';
    titulo: string;
    genero?: string;
    canciones?: Cancion[];
    artistas?: ArtistaMusicale[];
}

/* Relación entre dos canciones (sample, cover, remix, interpolation) */
export interface RelacionSample {
    id: number;
    cancionDestinoId: number;
    cancionFuenteId: number;
    whosampledId: number | null;
    tipoRelacion: TipoRelacion;
    tipoElemento: TipoElemento | null;
    timingsDestino: number[];
    timingsFuente: number[];
    apareceEnTodo: boolean;
    sampleId: number | null;
    votosTotal: number;
    votosPromedio: number;
    fuente: FuenteRelacion;
    verificada: boolean;
    creadoAt: string;
    /* Joins opcionales — datos del lado mostrado */
    cancionTitulo?: string;
    cancionSlug?: string;
    artistaNombre?: string;
    artistaSlug?: string;
    cancionAnio?: number | null;
    cancionImagenUrl?: string | null;
    /* Datos del lado opuesto para construir URLs SEO completas */
    destinoTitulo?: string | null;
    destinoArtista?: string | null;
    fuenteTitulo?: string | null;
    fuenteArtista?: string | null;
    /* Contribuidor que propuso la relacion (seed o comunidad) */
    contribuidorId?: number | null;
    contribuidorUsername?: string | null;
}

/* Artista asociado a canción con rol */
export interface CancionArtista {
    artistaId: number;
    nombre: string;
    slug: string;
    rol: RolCancionArtista;
}

/* Detalle completo de canción con todas las relaciones */
export interface CancionDetalle {
    cancion: Cancion;
    artistas: CancionArtista[];
    samplesDe: RelacionSample[];
    sampleadaEn: RelacionSample[];
}

/* Detalle completo de una relación con info de ambas canciones */
export interface RelacionDetalleCompleta {
    id: number;
    cancionDestinoId: number;
    cancionFuenteId: number;
    whosampledId: number | null;
    tipoRelacion: TipoRelacion;
    tipoElemento: TipoElemento | null;
    timingsDestino: number[];
    timingsFuente: number[];
    apareceEnTodo: boolean;
    sampleId: number | null;
    votosTotal: number;
    votosPromedio: number;
    fuente: FuenteRelacion;
    verificada: boolean;
    creadoAt: string;
    totalLikes: number;
    totalComentarios: number;
    liked?: boolean;
    reaccion?: string | null;
    /* Canción fuente (sampleada) */
    fuente_titulo: string | null;
    fuente_slug: string | null;
    fuente_anio: number | null;
    fuente_imagen: string | null;
    fuente_youtubeId: string | null;
    fuente_spotifyId: string | null;
    fuente_album: string | null;
    fuente_genero: string | null;
    fuente_artista: string | null;
    fuente_artistaSlug: string | null;
    /* Canción destino (que samplea) */
    destino_titulo: string | null;
    destino_slug: string | null;
    destino_anio: number | null;
    destino_imagen: string | null;
    destino_youtubeId: string | null;
    destino_spotifyId: string | null;
    destino_album: string | null;
    destino_genero: string | null;
    destino_artista: string | null;
    destino_artistaSlug: string | null;
    /* Relaciones adicionales de cada canción (enriquecimiento) */
    destinoSamplesDe?: RelacionSample[];
    destinoSampleadaEn?: RelacionSample[];
    fuenteSamplesDe?: RelacionSample[];
    fuenteSampleadaEn?: RelacionSample[];
    /* Lado del que se extrajo el sample (solo en respuesta de relacionPorSampleId) */
    ladoExtraccion?: 'fuente' | 'destino' | null;
    /* Contribuidor que propuso la relacion (seed o comunidad) */
    contribuidorId?: number | null;
    contribuidorUsername?: string | null;
    /* Cantidad de samples publicados vinculados a esta relacion */
    totalSamples: number;
}

/* Detalle de artista con canciones, relaciones y estadísticas */
export interface ArtistaDetalle {
    artista: ArtistaMusicale;
    canciones: Cancion[];
    sampleadoPor: RelacionSample[];
    sampleaA: RelacionSample[];
    estadisticas: {
        totalSampleadoPor: number;
        totalSampleaA: number;
        generos: string[];
    };
}

/* Estadísticas de relaciones por tipo */
export interface EstadisticaRelaciones {
    relacionesPorTipo: Array<{
        tipoRelacion: string;
        total: number;
    }>;
}

/* Tipos de relación */
export type TipoRelacion = 'sample' | 'cover' | 'remix' | 'interpolation';

export type TipoElemento =
    | 'hook_riff'
    | 'vocals_lyrics'
    | 'drums'
    | 'bass'
    | 'keys_synth'
    | 'sound_effect'
    | 'multiple_elements'
    | 'other';

export type FuenteRelacion = 'scraping' | 'comunidad' | 'musicbrainz' | 'import';

export type RolCancionArtista = 'principal' | 'featuring' | 'producer';

/* Labels legibles para UI */
export const ETIQUETAS_TIPO_RELACION: Record<TipoRelacion, string> = {
    sample: 'Sample',
    cover: 'Cover',
    remix: 'Remix',
    interpolation: 'Interpolación',
};

export const ETIQUETAS_TIPO_ELEMENTO: Record<TipoElemento, string> = {
    hook_riff: 'Hook / Riff',
    vocals_lyrics: 'Vocales / Letra',
    drums: 'Batería',
    bass: 'Bajo',
    keys_synth: 'Teclados / Synth',
    sound_effect: 'Efecto de sonido',
    multiple_elements: 'Múltiples elementos',
    other: 'Otro',
};

export const ETIQUETAS_ROL: Record<RolCancionArtista, string> = {
    principal: 'Principal',
    featuring: 'Feat.',
    producer: 'Productor',
};

/*
 * Construye slug descriptivo para URLs SEO de sampleos.
 * Formato: /sampleo/{id}/{artista-titulo-samplea-artista-titulo}
 * Solo usa caracteres URL-safe; trunca a 80 chars para evitar URLs excesivas.
 */
const slugificar = (texto: string): string =>
    texto
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const construirUrlSampleo = (
    id: number,
    destinoArtista?: string | null,
    destinoTitulo?: string | null,
    fuenteArtista?: string | null,
    fuenteTitulo?: string | null,
): string => {
    const partes = [
        destinoArtista, destinoTitulo, 'samplea', fuenteArtista, fuenteTitulo,
    ].filter(Boolean).map(p => slugificar(p as string));

    const slugSeo = partes.join('-').slice(0, 80).replace(/-+$/, '');
    return slugSeo ? `/sampleo/${id}/${slugSeo}` : `/sampleo/${id}`;
};
