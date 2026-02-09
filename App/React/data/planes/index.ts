/**
 * Planes de precios: indice central.
 * Re-exporta tipos, datos y helper de busqueda.
 * Todos los 9 servicios tienen planes definidos.
 */
export type {CaracteristicaPlan, PlanServicio, PlanesDeServicio} from './tipos';
export {incluida, noIncluida} from './tipos';

import {PLANES_WEB, PLANES_APPS, PLANES_BRANDING} from './planesCreacion';
import {PLANES_IA, PLANES_CHATBOTS} from './planesIA';
import {PLANES_SEO, PLANES_MARKETING} from './planesCrecimiento';
import {PLANES_ECOMMERCE, PLANES_UXUI, PLANES_AUTOMATIZACION, PLANES_CONSULTORIA} from './planesExtras';
import type {PlanesDeServicio} from './tipos';

export const PLANES_POR_SERVICIO: PlanesDeServicio[] = [PLANES_WEB, PLANES_APPS, PLANES_IA, PLANES_BRANDING, PLANES_CHATBOTS, PLANES_SEO, PLANES_MARKETING, PLANES_ECOMMERCE, PLANES_UXUI, PLANES_AUTOMATIZACION, PLANES_CONSULTORIA];

/*
 * Mapeo de slugs generados por WP (desde titulos) a slugs esperados por los planes.
 * Esto asegura compatibilidad si el slug no se sincronizó correctamente como 'diseno-web'.
 */
const ALIAS_SERVICIOS: Record<string, string> = {
    'diseno-de-sitios-web': 'diseno-web',
    'desarrollo-de-aplicaciones': 'desarrollo-apps',
    'agentes-de-ia': 'agentes-ia',
    'identidad-de-marca': 'branding',
    'e-commerce': 'ecommerce',
    'chatbots-personalizados': 'chatbots',
    'automatizacion-de-procesos': 'automatizacion',
    'consultoria-digital': 'consultoria'
};

/*
 * Obtener planes para un servicio especifico por su slug.
 * Busca coincidencia parcial (slug.includes) para flexibilidad con slugs de WP.
 * Retorna null si no se encuentran planes para el slug dado.
 */
export const obtenerPlanesServicio = (slug: string): PlanesDeServicio | null => {
    if (!slug) return null;

    // Normalizar slug si coincide con uno de los alias conocidos
    const slugNormalizado = ALIAS_SERVICIOS[slug] || slug;

    return PLANES_POR_SERVICIO.find(p => slugNormalizado.includes(p.servicioSlug)) || null;
};
