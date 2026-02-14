import { useGloryContent, useWordPressApi } from '@/hooks';
import type { CasoExito } from '@app/types/cosmo';
import type { WPPost } from '@/types/wordpress';

interface CasoWpRaw {
    id: number;
    slug: string;
    title: { rendered: string };
    excerpt: { rendered: string };
    content: { rendered: string };
    meta: Record<string, string>;
    _embedded?: {
        'wp:featuredmedia'?: Array<{ source_url: string }>;
    };
}

function limpiarHtml(texto: string): string {
    return texto.replace(/<[^>]+>/g, '').trim();
}

function mapearCasoDesdeRest(raw: CasoWpRaw): CasoExito {
    return {
        id: raw.id,
        slug: raw.slug,
        titulo: raw.title.rendered,
        extracto: limpiarHtml(raw.excerpt.rendered),
        contenido: raw.content.rendered,
        imagen: raw._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '',
        meta: {
            caso_tipo: raw.meta?.caso_tipo ?? '',
            caso_ubicacion: raw.meta?.caso_ubicacion ?? '',
            caso_valor: raw.meta?.caso_valor ?? '',
            caso_descripcion: raw.meta?.caso_descripcion ?? '',
            caso_cliente: raw.meta?.caso_cliente ?? '',
            caso_servicios: raw.meta?.caso_servicios ?? '',
            caso_duracion: raw.meta?.caso_duracion ?? '',
            caso_cita: raw.meta?.caso_cita ?? '',
            caso_cita_autor: raw.meta?.caso_cita_autor ?? '',
            caso_resultados: raw.meta?.caso_resultados ?? '',
        },
    };
}

function mapearCasoDesdeGlory(raw: WPPost): CasoExito {
    const idNormalizado = typeof raw.id === 'number' ? raw.id : Number(raw.id);
    const meta = raw.meta as Record<string, string>;
    return {
        id: Number.isNaN(idNormalizado) ? 0 : idNormalizado,
        slug: raw.slug,
        titulo: raw.title,
        extracto: limpiarHtml(raw.excerpt ?? ''),
        contenido: raw.content ?? '',
        imagen: raw.featuredImage?.url ?? '',
        meta: {
            caso_tipo: meta?.caso_tipo ?? '',
            caso_ubicacion: meta?.caso_ubicacion ?? '',
            caso_valor: meta?.caso_valor ?? '',
            caso_descripcion: meta?.caso_descripcion ?? '',
            caso_cliente: meta?.caso_cliente ?? '',
            caso_servicios: meta?.caso_servicios ?? '',
            caso_duracion: meta?.caso_duracion ?? '',
            caso_cita: meta?.caso_cita ?? '',
            caso_cita_autor: meta?.caso_cita_autor ?? '',
            caso_resultados: meta?.caso_resultados ?? '',
        },
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
