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
    /* Joins opcionales */
    cancionTitulo?: string;
    cancionSlug?: string;
    artistaNombre?: string;
    artistaSlug?: string;
    cancionAnio?: number | null;
    cancionImagenUrl?: string | null;
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
    /* Canción fuente (sampleada) */
    fuente_titulo: string | null;
    fuente_slug: string | null;
    fuente_anio: number | null;
    fuente_imagen: string | null;
    fuente_youtubeId: string | null;
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
    destino_album: string | null;
    destino_genero: string | null;
    destino_artista: string | null;
    destino_artistaSlug: string | null;
}

/* Detalle de artista con canciones */
export interface ArtistaDetalle {
    artista: ArtistaMusicale;
    canciones: Cancion[];
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
