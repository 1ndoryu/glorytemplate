import {Servicio} from '../../components/landing';
import {refAUrl} from '../../utils/imagenUtils';

/*
 * Datos de ejemplo para los servicios.
 * Usa sistema de referencias (alias::archivo) para imágenes.
 */

/* Referencias de imágenes usando alias */
const IMAGENES_SERVICIOS = {
    diseno: 'colors::abc01eec86b754be8299e488ec926831.jpg',
    aplicaciones: 'colors::bc2241ad92399a7545184ea5856f3fc6.jpg',
    ecommerce: 'colors::993245e6afae9f50fd5ecf85fcda0039.jpg',
    branding: 'colors::dd5d72fb4ce22a0ab1364e25710c3012.jpg',
    automatizacion: 'colors::8b7a956d29e3938e91f819ad5fcc5ee0.jpg',
    consultoria: 'colors::855f6e6bce7563e2dc7c767ba16667ed.jpg',
    mantenimiento: 'colors::6d846dc52e919270849287a1bb6ac4e9.jpg',
    seo: 'colors::71957e4101580f3a8a6838b5bf5fbc24.jpg'
};

export const serviciosEjemplo: Servicio[] = [
    {
        id: 'diseno-web',
        nombre: 'Diseño Web Premium',
        descripcionCorta: 'Sitios web únicos con atención al detalle',
        precioDesde: 2500,
        imagen: refAUrl(IMAGENES_SERVICIOS.diseno)!,
        imagenRef: IMAGENES_SERVICIOS.diseno
    },
    {
        id: 'aplicaciones',
        nombre: 'Aplicaciones a Medida',
        descripcionCorta: 'Software personalizado para tu negocio',
        precioDesde: 5000,
        imagen: refAUrl(IMAGENES_SERVICIOS.aplicaciones)!,
        imagenRef: IMAGENES_SERVICIOS.aplicaciones
    },
    {
        id: 'ecommerce',
        nombre: 'E-commerce Avanzado',
        descripcionCorta: 'Tiendas online optimizadas para conversión',
        precioDesde: 3500,
        imagen: refAUrl(IMAGENES_SERVICIOS.ecommerce)!,
        imagenRef: IMAGENES_SERVICIOS.ecommerce
    },
    {
        id: 'branding',
        nombre: 'Branding Digital',
        descripcionCorta: 'Identidad visual que perdura',
        precioDesde: 1500,
        imagen: refAUrl(IMAGENES_SERVICIOS.branding)!,
        imagenRef: IMAGENES_SERVICIOS.branding
    },
    {
        id: 'automatizacion',
        nombre: 'Automatización',
        descripcionCorta: 'Flujos inteligentes que optimizan tu tiempo',
        precioDesde: 2000,
        imagen: refAUrl(IMAGENES_SERVICIOS.automatizacion)!,
        imagenRef: IMAGENES_SERVICIOS.automatizacion
    },
    {
        id: 'consultoria',
        nombre: 'Consultoría Tech',
        descripcionCorta: 'Asesoría estratégica para tu transformación digital',
        precioDesde: 800,
        imagen: refAUrl(IMAGENES_SERVICIOS.consultoria)!,
        imagenRef: IMAGENES_SERVICIOS.consultoria
    },
    {
        id: 'mantenimiento',
        nombre: 'Mantenimiento',
        descripcionCorta: 'Soporte continuo y actualizaciones',
        precioDesde: 500,
        imagen: refAUrl(IMAGENES_SERVICIOS.mantenimiento)!,
        imagenRef: IMAGENES_SERVICIOS.mantenimiento
    },
    {
        id: 'seo',
        nombre: 'SEO & Analytics',
        descripcionCorta: 'Posicionamiento y análisis de datos',
        precioDesde: 1200,
        imagen: refAUrl(IMAGENES_SERVICIOS.seo)!,
        imagenRef: IMAGENES_SERVICIOS.seo
    }
];
