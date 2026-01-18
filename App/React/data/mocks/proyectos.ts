import {Proyecto} from '../../components/landing';
import {refAUrl} from '../../utils/imagenUtils';

/*
 * Datos de ejemplo para el portafolio.
 * Usa sistema de referencias (alias::archivo) para imágenes.
 * Las referencias se resuelven a URLs mediante refAUrl() o el componente ImagenGlory.
 *
 * TO-DO: Cuando el endpoint REST esté disponible, se puede usar useGloryImages
 * para obtener imágenes aleatorias dinámicamente.
 */

/* Referencias de imágenes usando alias */
const IMAGENES_PROYECTOS = {
    mabuhay: 'colors::3e0929e463d330ab184b5ed72f789695.jpg',
    entretenedores: 'colors::530f61e8227db3cd4a86fc065efa7b34.jpg',
    cosmo: 'colors::717112c35b85f1c1b646356957a5ff41.jpg',
    guille: 'colors::54a33543c3431992e587bb2cd730f934.jpg',
    material: 'colors::d355e400bdebb98eeed272abbe82071a.jpg',
    autoescuela: 'colors::7cdb31d0f794ee63c20b4d19211e4f85.jpg'
};

export const proyectosEjemplo: Proyecto[] = [
    {
        id: 'mabuhay-viajes',
        nombre: 'Mabuhay Viajes',
        categoria: 'Agencia de Viajes',
        imagen: refAUrl(IMAGENES_PROYECTOS.mabuhay)!,
        imagenRef: IMAGENES_PROYECTOS.mabuhay,
        descripcion: 'Plataforma web para agencia de viajes especializada en destinos asiáticos. Diseño inmersivo con reservas en línea y blog de destinos.'
    },
    {
        id: 'entretenedores',
        nombre: 'Entretenedores',
        categoria: 'Entretenimiento',
        imagen: refAUrl(IMAGENES_PROYECTOS.entretenedores)!,
        imagenRef: IMAGENES_PROYECTOS.entretenedores,
        descripcion: 'Directorio de artistas y animadores para eventos. Sistema de búsqueda avanzada y gestión de contrataciones.'
    },
    {
        id: 'cosmo-revenue',
        nombre: 'Cosmo Revenue',
        categoria: 'Fintech',
        imagen: refAUrl(IMAGENES_PROYECTOS.cosmo)!,
        imagenRef: IMAGENES_PROYECTOS.cosmo,
        descripcion: 'Dashboard de gestión financiera con análisis en tiempo real. Integración con múltiples pasarelas de pago.'
    },
    {
        id: 'guille-chatbots',
        nombre: 'Guille Chatbots',
        categoria: 'IA & Automatización',
        imagen: refAUrl(IMAGENES_PROYECTOS.guille)!,
        imagenRef: IMAGENES_PROYECTOS.guille,
        descripcion: 'Solución de chatbots con inteligencia artificial para atención al cliente. Integración con WhatsApp y redes sociales.'
    },
    {
        id: 'material-padel',
        nombre: 'Material de Pádel',
        categoria: 'E-commerce',
        imagen: refAUrl(IMAGENES_PROYECTOS.material)!,
        imagenRef: IMAGENES_PROYECTOS.material,
        descripcion: 'Tienda online especializada en equipamiento de pádel. Catálogo extenso con filtros avanzados y comparador de productos.'
    },
    {
        id: 'autoescuela-cad',
        nombre: 'Autoescuela CAD',
        categoria: 'Educación',
        imagen: refAUrl(IMAGENES_PROYECTOS.autoescuela)!,
        imagenRef: IMAGENES_PROYECTOS.autoescuela,
        descripcion: 'Plataforma de formación vial con tests online, seguimiento de progreso y reserva de clases prácticas.'
    }
];
