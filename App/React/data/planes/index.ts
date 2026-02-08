/**
 * Planes de precios: indice central.
 * Re-exporta tipos, datos y helper de busqueda.
 * Precios iniciales sujetos a ajuste posterior.
 */
export type {CaracteristicaPlan, PlanServicio, PlanesDeServicio} from './tipos';
export {incluida, noIncluida} from './tipos';

import {PLANES_WEB, PLANES_APPS, PLANES_BRANDING} from './planesCreacion';
import {PLANES_IA, PLANES_CHATBOTS} from './planesIA';
import {PLANES_SEO, PLANES_MARKETING} from './planesCrecimiento';
import type {PlanesDeServicio} from './tipos';

export const PLANES_POR_SERVICIO: PlanesDeServicio[] = [
    PLANES_WEB,
    PLANES_APPS,
    PLANES_IA,
    PLANES_BRANDING,
    PLANES_CHATBOTS,
    PLANES_SEO,
    PLANES_MARKETING
];

/*
 * Obtener planes para un servicio especifico por su slug.
 * Retorna null si no se encuentran planes para el slug dado.
 */
export const obtenerPlanesServicio = (slug: string): PlanesDeServicio | null => {
    return PLANES_POR_SERVICIO.find(p => slug.includes(p.servicioSlug)) || null;
};
