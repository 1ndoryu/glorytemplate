import type { PlanServicio } from '@app/types/cosmo';

/*
 * Datos estáticos de los 6 planes de servicio de Cosmo Revenue.
 * Agrupados por categoría: marketing (3), consultoria (1), revenue (2).
 */

export const planesServicio: Record<string, PlanServicio> = {
    comet: {
        slug: 'comet',
        nombre: 'Comet',
        subtitulo: 'Impulso Inicial',
        categoria: 'marketing',
        descripcion:
            'Auditoría de redes sociales, gestión de 2 redes principales y publicaciones semanales para impulsar la visibilidad de tu hotel.',
        features: [
            'Auditoría de redes sociales',
            'Gestión de 2 redes principales',
            'Publicaciones semanales',
            'Calendario editorial mensual',
            'Reporte de métricas',
        ],
        idealPara:
            'Hoteles que empiezan a profesionalizar su presencia en redes sociales y necesitan una base sólida.',
    },
    nebula: {
        slug: 'nebula',
        nombre: 'Nebula',
        subtitulo: 'Atracción y Nutrición',
        categoria: 'marketing',
        descripcion:
            'Campañas de Ads en redes sociales, email marketing y gestión de comunidad para atraer y fidelizar huéspedes.',
        features: [
            'Todo incluido en Comet',
            'Ads en redes sociales (Meta Ads)',
            'Estrategia de email marketing',
            'Gestión de comunidad',
            'Embudo de captación de leads',
            'Reportes quincenales',
        ],
        idealPara:
            'Alojamientos que buscan crecer su base de clientes y construir relaciones duraderas con los huéspedes.',
    },
    quasar: {
        slug: 'quasar',
        nombre: 'Quasar',
        subtitulo: 'Aceleración Total',
        categoria: 'marketing',
        descripcion:
            'Google Hotel Ads, plan de comunicación anual y análisis ROI completo para máximo rendimiento de tu inversión en marketing.',
        features: [
            'Todo incluido en Nebula',
            'Google Hotel Ads',
            'Plan de comunicación anual',
            'Análisis de ROI',
            'Estrategia de contenido SEO',
            'Reportes semanales',
        ],
        idealPara:
            'Hoteles que quieren dominar todos los canales digitales y maximizar el retorno de cada euro invertido.',
    },
    orbit: {
        slug: 'orbit',
        nombre: 'Orbit',
        subtitulo: 'Empieza con Claridad',
        categoria: 'consultoria',
        descripcion:
            'Consultoría estratégica inicial con auditoría de PMS y OTAs, mapeo de canales de distribución y plan de acción personalizado.',
        features: [
            'Consultoría estratégica personalizada',
            'Auditoría completa PMS/OTAs',
            'Mapeo de canales de distribución',
            'Análisis de competitive set',
            'Plan de acción a 90 días',
            'Sesión de seguimiento mensual',
        ],
        idealPara:
            'Hoteles que necesitan una visión clara de su situación actual y un plan de mejora concreto.',
    },
    galaxy: {
        slug: 'galaxy',
        nombre: 'Galaxy',
        subtitulo: 'Gestión Externa Continua',
        categoria: 'revenue',
        descripcion:
            'Gestión de revenue management externalizada: control de channel mix, revisión de tarifas 3-5 veces por semana y optimización continua.',
        features: [
            'Control completo de channel mix',
            'Revisión de tarifas 3-5x / semana',
            'Estrategia de precios dinámicos',
            'Gestión de paridad de precios',
            'Reportes mensuales ejecutivos',
            'Reuniones quincenales de seguimiento',
        ],
        idealPara:
            'Alojamientos que quieren externalizar la gestión de revenue sin perder control sobre su negocio.',
    },
    universe: {
        slug: 'universe',
        nombre: 'Universe',
        subtitulo: 'Departamento 360',
        categoria: 'revenue',
        descripcion:
            'Tu departamento de revenue completo: estrategia de fidelización, mapeos ilimitados, formación del equipo interno y acompañamiento ejecutivo.',
        features: [
            'Todo incluido en Galaxy',
            'Estrategia de fidelización',
            'Mapeos ilimitados de canales',
            'Formación del equipo interno',
            'Acompañamiento ejecutivo',
            'Dashboard personalizado en tiempo real',
            'Revisión diaria de tarifas',
        ],
        idealPara:
            'Hoteles y cadenas que quieren la máxima dedicación y un partner estratégico integral.',
    },
};

/* Helpers para agrupar planes por categoría */
export const planesMarketing = [planesServicio.comet, planesServicio.nebula, planesServicio.quasar];
export const planesConsultoria = [planesServicio.orbit];
export const planesRevenue = [planesServicio.galaxy, planesServicio.universe];

/* Obtener plan por slug */
export function obtenerPlan(slug: string): PlanServicio | undefined {
    return planesServicio[slug];
}
