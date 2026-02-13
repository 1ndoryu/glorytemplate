import { useWordPressApi } from '@/hooks';
import type { CasoExito } from '@app/types/cosmo';

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

/*
 * Hook para obtener los casos de éxito desde la REST API de WordPress.
 * Transforma la respuesta WP en el tipo CasoExito del proyecto.
 */
export function useCasos(): {
    casos: CasoExito[];
    cargando: boolean;
    error: string | null;
} {
    const { data, isLoading, error } = useWordPressApi<CasoWpRaw[]>(
        '/wp/v2/casos?_embed&per_page=100'
    );

    const casos: CasoExito[] = (data ?? []).map((raw) => ({
        id: raw.id,
        slug: raw.slug,
        titulo: raw.title.rendered,
        extracto: raw.excerpt.rendered.replace(/<[^>]+>/g, '').trim(),
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
    }));

    return { casos, cargando: isLoading, error };
}
