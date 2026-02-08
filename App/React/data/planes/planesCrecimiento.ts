/**
 * Planes: SEO + Marketing Digital
 * Agrupados por afinidad (servicios de crecimiento digital).
 */
import {type PlanesDeServicio, incluida, noIncluida} from './tipos';

export const PLANES_SEO: PlanesDeServicio = {
    servicioSlug: 'seo',
    servicioTitulo: 'SEO',
    planes: [
        {
            id: 'seo-basico',
            nombre: 'Basico',
            precio: '$150',
            descripcion: 'Auditoria y optimizacion SEO inicial.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('Auditoria SEO completa'),
                incluida('Optimizacion de 5 paginas'),
                incluida('Configuracion Search Console'),
                incluida('Reporte mensual basico'),
                noIncluida('Link building'),
                noIncluida('Contenido optimizado'),
                noIncluida('SEO local'),
            ]
        },
        {
            id: 'seo-avanzado',
            nombre: 'Avanzado',
            precio: '$400',
            descripcion: 'Estrategia SEO completa con contenido y links.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Estrategia SEO integral'),
                incluida('Optimizacion paginas ilimitadas'),
                incluida('4 articulos SEO/mes'),
                incluida('Link building activo'),
                incluida('SEO local + Google My Business'),
                incluida('Reportes semanales'),
                incluida('Analisis de competencia'),
            ]
        },
        {
            id: 'seo-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Programa SEO enterprise.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Estrategia multi-pais'),
                incluida('Content marketing integrado'),
                incluida('Link building premium'),
                incluida('SEO tecnico avanzado'),
                incluida('CRO (optimizacion conversion)'),
                incluida('Equipo SEO dedicado'),
                incluida('Consultoria estrategica'),
            ]
        }
    ]
};

export const PLANES_MARKETING: PlanesDeServicio = {
    servicioSlug: 'marketing-digital',
    servicioTitulo: 'Marketing Digital',
    planes: [
        {
            id: 'mkt-basico',
            nombre: 'Basico',
            precio: '$150',
            descripcion: 'Gestion basica de redes sociales y ads.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('Gestion de 2 redes sociales'),
                incluida('8 publicaciones/mes'),
                incluida('1 campana de ads/mes'),
                incluida('Reporte mensual'),
                noIncluida('Email marketing'),
                noIncluida('Estrategia de contenidos'),
                noIncluida('Influencer marketing'),
            ]
        },
        {
            id: 'mkt-avanzado',
            nombre: 'Avanzado',
            precio: '$400',
            descripcion: 'Estrategia de marketing digital integral.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Gestion de 4 redes sociales'),
                incluida('20 publicaciones/mes'),
                incluida('Campanas ads ilimitadas'),
                incluida('Email marketing (newsletters)'),
                incluida('Estrategia de contenidos'),
                incluida('Reportes semanales'),
                incluida('A/B testing campanas'),
            ]
        },
        {
            id: 'mkt-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Marketing 360 para tu empresa.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Omni-canal completo'),
                incluida('Growth hacking'),
                incluida('Influencer marketing'),
                incluida('Video marketing'),
                incluida('Automation funnels'),
                incluida('Equipo dedicado'),
                incluida('Consultoria estrategica'),
            ]
        }
    ]
};
