/**
 * Planes: Diseno Web + Desarrollo Apps + Branding
 * Agrupados por afinidad (servicios de creacion).
 */
import {type PlanesDeServicio, incluida, noIncluida} from './tipos';

export const PLANES_WEB: PlanesDeServicio = {
    servicioSlug: 'diseno-web',
    servicioTitulo: 'Diseno de Sitios Web',
    planes: [
        {
            id: 'web-basico',
            nombre: 'Basico',
            precio: '$100',
            descripcion: 'Ideal para landing pages y presencia online basica.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('1 pagina principal'),
                incluida('Diseno responsive'),
                incluida('Formulario de contacto'),
                incluida('Hosting 3 meses incluido'),
                noIncluida('Blog integrado'),
                noIncluida('SEO avanzado'),
                noIncluida('Panel administrable'),
            ]
        },
        {
            id: 'web-avanzado',
            nombre: 'Avanzado',
            precio: '$250',
            descripcion: 'Sitio completo con CMS, blog y optimizacion SEO.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Hasta 5 paginas'),
                incluida('Diseno responsive premium'),
                incluida('Formulario de contacto'),
                incluida('Hosting 6 meses incluido'),
                incluida('Blog integrado'),
                incluida('SEO on-page completo'),
                incluida('Panel administrable (CMS)'),
            ]
        },
        {
            id: 'web-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Definimos juntos el alcance y funcionalidades.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Paginas ilimitadas'),
                incluida('Diseno a medida'),
                incluida('Integraciones custom'),
                incluida('E-commerce opcional'),
                incluida('Soporte prioritario'),
                incluida('Mantenimiento mensual'),
                incluida('Estrategia SEO completa'),
            ]
        }
    ]
};

export const PLANES_APPS: PlanesDeServicio = {
    servicioSlug: 'desarrollo-apps',
    servicioTitulo: 'Desarrollo de Aplicaciones',
    planes: [
        {
            id: 'apps-basico',
            nombre: 'Basico',
            precio: '$200',
            descripcion: 'MVP o aplicacion sencilla con funcionalidades core.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('1 plataforma (web o movil)'),
                incluida('Hasta 3 funcionalidades'),
                incluida('Autenticacion basica'),
                incluida('API REST simple'),
                noIncluida('Panel de administracion'),
                noIncluida('Integraciones externas'),
                noIncluida('Soporte post-lanzamiento'),
            ]
        },
        {
            id: 'apps-avanzado',
            nombre: 'Avanzado',
            precio: '$500',
            descripcion: 'App completa multi-plataforma con backend robusto.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Web + Movil (React Native)'),
                incluida('Hasta 8 funcionalidades'),
                incluida('Auth + roles de usuario'),
                incluida('API REST + GraphQL'),
                incluida('Panel de administracion'),
                incluida('2 integraciones externas'),
                incluida('1 mes soporte post-lanzamiento'),
            ]
        },
        {
            id: 'apps-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Arquitectura y funcionalidades a tu medida.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Multiplataforma'),
                incluida('Funcionalidades ilimitadas'),
                incluida('Arquitectura escalable'),
                incluida('CI/CD y testing'),
                incluida('Integraciones ilimitadas'),
                incluida('Soporte y mantenimiento'),
                incluida('Consultoria tecnica'),
            ]
        }
    ]
};

export const PLANES_BRANDING: PlanesDeServicio = {
    servicioSlug: 'branding',
    servicioTitulo: 'Identidad de Marca',
    planes: [
        {
            id: 'branding-basico',
            nombre: 'Basico',
            precio: '$150',
            descripcion: 'Logo y paleta de colores para tu marca.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('Diseno de logo (3 propuestas)'),
                incluida('Paleta de colores'),
                incluida('Tipografia principal'),
                incluida('Archivo en formatos digitales'),
                noIncluida('Manual de marca'),
                noIncluida('Papeleria corporativa'),
                noIncluida('Redes sociales kit'),
            ]
        },
        {
            id: 'branding-avanzado',
            nombre: 'Avanzado',
            precio: '$400',
            descripcion: 'Identidad visual completa con manual de marca.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Diseno de logo (5 propuestas)'),
                incluida('Paleta de colores extendida'),
                incluida('Sistema tipografico completo'),
                incluida('Manual de marca (PDF)'),
                incluida('Papeleria corporativa'),
                incluida('Kit redes sociales'),
                incluida('Iconografia personalizada'),
            ]
        },
        {
            id: 'branding-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Estrategia de marca integral.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Brand strategy completa'),
                incluida('Naming y tagline'),
                incluida('Identidad visual total'),
                incluida('Guia de voz y tono'),
                incluida('Templates editables'),
                incluida('Fotografias de marca'),
                incluida('Consultoria continua'),
            ]
        }
    ]
};
