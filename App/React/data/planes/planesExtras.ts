/**
 * Planes: E-commerce + UX/UI + Automatizacion + Consultoria
 * Servicios que no tenian planes definidos.
 */
import {type PlanesDeServicio, incluida, noIncluida} from './tipos';

export const PLANES_ECOMMERCE: PlanesDeServicio = {
    servicioSlug: 'ecommerce',
    servicioTitulo: 'E-commerce',
    planes: [
        {
            id: 'ecommerce-basico',
            nombre: 'Basico',
            precio: '$200',
            descripcion: 'Tienda online funcional con lo esencial para vender.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('Hasta 50 productos'),
                incluida('Pasarela de pago (Stripe)'),
                incluida('Carrito de compras'),
                incluida('Diseno responsive'),
                noIncluida('Gestion de inventario'),
                noIncluida('Integraciones avanzadas'),
                noIncluida('Marketing automatizado'),
            ]
        },
        {
            id: 'ecommerce-avanzado',
            nombre: 'Avanzado',
            precio: '$500',
            descripcion: 'Tienda completa con inventario y marketing integrado.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Productos ilimitados'),
                incluida('Multi-pasarela de pago'),
                incluida('Gestion de inventario'),
                incluida('Panel de analytics'),
                incluida('Email marketing integrado'),
                incluida('Cupones y descuentos'),
                noIncluida('Marketplace multi-vendor'),
            ]
        },
        {
            id: 'ecommerce-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Solucion e-commerce a medida para operaciones complejas.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Arquitectura personalizada'),
                incluida('Integraciones ERP/CRM'),
                incluida('Multi-idioma y multi-moneda'),
                incluida('Marketplace multi-vendor'),
                incluida('Analytics avanzado'),
                incluida('Soporte prioritario 24/7'),
                incluida('Migracion de datos'),
            ]
        }
    ]
};

export const PLANES_UXUI: PlanesDeServicio = {
    servicioSlug: 'diseno-ux-ui',
    servicioTitulo: 'Diseno UX/UI',
    planes: [
        {
            id: 'uxui-basico',
            nombre: 'Basico',
            precio: '$120',
            descripcion: 'Diseno de interfaz para proyectos simples.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('Wireframes de 3 pantallas'),
                incluida('Diseno UI con Figma'),
                incluida('Prototipo navegable'),
                incluida('1 ronda de revision'),
                noIncluida('User research'),
                noIncluida('Sistema de diseno'),
                noIncluida('Testing con usuarios'),
            ]
        },
        {
            id: 'uxui-avanzado',
            nombre: 'Avanzado',
            precio: '$350',
            descripcion: 'UX research completo y sistema de diseno escalable.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('User research y personas'),
                incluida('Wireframes completos'),
                incluida('Diseno UI premium'),
                incluida('Sistema de diseno (tokens)'),
                incluida('Prototipo interactivo'),
                incluida('3 rondas de revision'),
                noIncluida('Testing con usuarios'),
            ]
        },
        {
            id: 'uxui-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Proceso completo de UX desde research hasta validacion.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Discovery workshop'),
                incluida('User research exhaustivo'),
                incluida('Diseno de producto completo'),
                incluida('Design system documentado'),
                incluida('Testing A/B'),
                incluida('User testing con reportes'),
                incluida('Iteraciones post-lanzamiento'),
            ]
        }
    ]
};

export const PLANES_AUTOMATIZACION: PlanesDeServicio = {
    servicioSlug: 'automatizacion',
    servicioTitulo: 'Automatizacion',
    planes: [
        {
            id: 'auto-basico',
            nombre: 'Basico',
            precio: '$80',
            periodo: '/mes',
            descripcion: 'Automatizaciones simples para ahorrarte tiempo.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('3 flujos automatizados'),
                incluida('Integracion con 2 apps'),
                incluida('Notificaciones por email'),
                incluida('Soporte basico'),
                noIncluida('Webhooks personalizados'),
                noIncluida('Procesamiento de datos'),
                noIncluida('API propia'),
            ]
        },
        {
            id: 'auto-avanzado',
            nombre: 'Avanzado',
            precio: '$200',
            periodo: '/mes',
            descripcion: 'Automatizacion integral con integraciones ilimitadas.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Flujos ilimitados'),
                incluida('Integraciones ilimitadas'),
                incluida('Webhooks personalizados'),
                incluida('Procesamiento de datos'),
                incluida('Dashboard de monitoreo'),
                incluida('Soporte prioritario'),
                noIncluida('Desarrollo custom'),
            ]
        },
        {
            id: 'auto-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Soluciones de automatizacion a medida para tu negocio.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Arquitectura de automatizacion'),
                incluida('Desarrollo custom'),
                incluida('API personalizada'),
                incluida('Integracion con legacy systems'),
                incluida('Machine learning pipelines'),
                incluida('Soporte dedicado 24/7'),
                incluida('SLA garantizado'),
            ]
        }
    ]
};

export const PLANES_CONSULTORIA: PlanesDeServicio = {
    servicioSlug: 'consultoria',
    servicioTitulo: 'Consultoria Digital',
    planes: [
        {
            id: 'consul-basico',
            nombre: 'Basico',
            precio: '$100',
            descripcion: 'Sesion de consultoria para orientar tu proyecto.',
            ctaTexto: 'Agendar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('Sesion de 2 horas'),
                incluida('Analisis de situacion actual'),
                incluida('Recomendaciones basicas'),
                incluida('Documento de hallazgos'),
                noIncluida('Plan de accion detallado'),
                noIncluida('Seguimiento mensual'),
                noIncluida('Implementacion'),
            ]
        },
        {
            id: 'consul-avanzado',
            nombre: 'Avanzado',
            precio: '$300',
            descripcion: 'Consultoria completa con plan de accion y seguimiento.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('4 sesiones de 2 horas'),
                incluida('Auditoria digital completa'),
                incluida('Plan de accion detallado'),
                incluida('Stack tecnologico recomendado'),
                incluida('Seguimiento mensual (3 meses)'),
                incluida('Prioridades y roadmap'),
                noIncluida('Implementacion directa'),
            ]
        },
        {
            id: 'consul-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Consultoria continua con implementacion asistida.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Consultoria on-demand'),
                incluida('CTO as a Service'),
                incluida('Implementacion asistida'),
                incluida('Revisiones de arquitectura'),
                incluida('Contratacion de equipo'),
                incluida('KPIs y reportes'),
                incluida('Acceso directo ilimitado'),
            ]
        }
    ]
};
