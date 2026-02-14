import { useGloryContent, useWordPressApi } from '@/hooks';
import type { CasoExito } from '@app/types/cosmo';
import type { WPPost } from '@/types/wordpress';

interface CasoWpRaw {
    id: number;
    slug: string;
    title: { rendered: string };
    excerpt: { rendered: string };
    content: { rendered: string };
    meta: Record<string, unknown>;
    acf?: Record<string, unknown>;
    _embedded?: {
        'wp:featuredmedia'?: Array<{ source_url: string }>;
    };
}

function limpiarHtml(texto: string): string {
    return texto.replace(/<[^>]+>/g, '').trim();
}

function valorMetaComoTexto(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        const primerValor = value.find((item) => item !== null && item !== undefined);
        return valorMetaComoTexto(primerValor);
    }

    return '';
}

function normalizarClaveMeta(key: string): string {
    return key.toLowerCase().replace(/^_+/, '').replace(/[^a-z0-9]/g, '');
}

function obtenerMetaTexto(meta: Record<string, unknown> | undefined, key: string): string {
    if (!meta) {
        return '';
    }

    const exacto = valorMetaComoTexto(meta[key]);
    if (exacto) {
        return exacto;
    }

    const objetivo = normalizarClaveMeta(key);
    const encontrada = Object.keys(meta).find((candidate) => normalizarClaveMeta(candidate) === objetivo);

    return encontrada ? valorMetaComoTexto(meta[encontrada]) : '';
}

function construirMetaCaso(metaOrigen: Record<string, unknown> | undefined, titulo: string, extracto: string): CasoExito['meta'] {
    const casoTipo = obtenerMetaTexto(metaOrigen, 'caso_tipo') || titulo;
    const casoDescripcion =
        obtenerMetaTexto(metaOrigen, 'caso_descripcion') ||
        extracto;

    return {
        caso_tipo: casoTipo,
        caso_ubicacion: obtenerMetaTexto(metaOrigen, 'caso_ubicacion'),
        caso_valor: obtenerMetaTexto(metaOrigen, 'caso_valor'),
        caso_descripcion: casoDescripcion,
        caso_cliente: obtenerMetaTexto(metaOrigen, 'caso_cliente'),
        caso_servicios: obtenerMetaTexto(metaOrigen, 'caso_servicios'),
        caso_duracion: obtenerMetaTexto(metaOrigen, 'caso_duracion'),
        caso_cita: obtenerMetaTexto(metaOrigen, 'caso_cita'),
        caso_cita_autor: obtenerMetaTexto(metaOrigen, 'caso_cita_autor'),
        caso_resultados: obtenerMetaTexto(metaOrigen, 'caso_resultados'),
    };
}

function mapearCasoDesdeRest(raw: CasoWpRaw): CasoExito {
    const titulo = raw.title.rendered;
    const extracto = limpiarHtml(raw.excerpt.rendered);
    const metaOrigen = raw.meta && Object.keys(raw.meta).length > 0 ? raw.meta : raw.acf;

    return {
        id: raw.id,
        slug: raw.slug,
        titulo,
        extracto,
        contenido: raw.content.rendered,
        imagen: raw._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '',
        meta: construirMetaCaso(metaOrigen, titulo, extracto),
    };
}

function mapearCasoDesdeGlory(raw: WPPost): CasoExito {
    const idNormalizado = typeof raw.id === 'number' ? raw.id : Number(raw.id);
    const titulo = typeof raw.title === 'string' ? raw.title : '';
    const extracto = limpiarHtml(raw.excerpt ?? '');
    const meta = raw.meta as Record<string, unknown>;

    return {
        id: Number.isNaN(idNormalizado) ? 0 : idNormalizado,
        slug: raw.slug,
        titulo,
        extracto,
        contenido: raw.content ?? '',
        imagen: raw.featuredImage?.url ?? '',
        meta: construirMetaCaso(meta, titulo, extracto),
    };
}

/*
 * Hook para obtener los casos de éxito desde la REST API de WordPress.
 * Transforma la respuesta WP en el tipo CasoExito del proyecto.
 */
export function useCasos(): {
    casos: CasoExito[];
    cargando: boolean;
    error: string | null;
} {
    const {
        data: dataGlory,
        isLoading: cargandoGlory,
        error: errorGlory,
    } = useGloryContent<WPPost>('casos');

    const { data: dataPlural, isLoading: cargandoPlural, error: errorPlural } = useWordPressApi<CasoWpRaw[]>(
        '/wp/v2/casos?_embed&per_page=100'
    );

    const { data: dataSingular, isLoading: cargandoSingular, error: errorSingular } = useWordPressApi<CasoWpRaw[]>(
        '/wp/v2/caso?_embed&per_page=100'
    );

    const casosGlory: CasoExito[] = (dataGlory ?? []).map(mapearCasoDesdeGlory).filter((caso) => caso.id > 0);
    const casosRest: CasoExito[] = ((dataPlural && dataPlural.length > 0) ? dataPlural : (dataSingular ?? [])).map(mapearCasoDesdeRest);
    const casos = casosGlory.length > 0 ? casosGlory : casosRest;

    const cargando = cargandoGlory || cargandoPlural || cargandoSingular;
    const error = casos.length > 0
        ? null
        : (errorGlory ?? errorPlural ?? errorSingular);

    return { casos, cargando, error };
}
