/*
 * Datos mock de servicios publicados por el Admin.
 * Estos son los servicios que la agencia ofrece (modelo Fiverr).
 * El servicio contratado por Guillermo referencia uno de estos.
 */

import {ServicioPublicado} from '../types/servicio';
import {refAUrl} from '../../utils/imagenUtils';

/* Referencias de imágenes de servicios */
const IMAGENES = {
    disenoWeb: 'colors::abc01eec86b754be8299e488ec926831.jpg',
    mantenimiento: 'colors::6d846dc52e919270849287a1bb6ac4e9.jpg',
    ecommerce: 'colors::993245e6afae9f50fd5ecf85fcda0039.jpg',
    automatizacion: 'colors::8b7a956d29e3938e91f819ad5fcc5ee0.jpg',
    consultoria: 'colors::855f6e6bce7563e2dc7c767ba16667ed.jpg',
    branding: 'colors::dd5d72fb4ce22a0ab1364e25710c3012.jpg'
};

/* Servicios publicados por el Admin (proveedor ID USR-001) */
export const serviciosPublicados: ServicioPublicado[] = [
    {
        id: 'SRVPUB-001',
        proveedorId: 'USR-001',
        nombre: 'Diseño Web Profesional',
        descripcion: 'Landing page o sitio web profesional con diseño moderno y responsive. Incluye hasta 5 secciones, formulario de contacto y optimización SEO básica.',
        precio: 270,
        imagenUrl: refAUrl(IMAGENES.disenoWeb) || '/wp-content/themes/glory/assets/img/servicios/diseno-web.jpg',
        categoria: 'web',
        tiempoEntregaDias: 30,
        activo: true,
        fechaCreacion: '2024-01-15'
    },
    {
        id: 'SRVPUB-002',
        proveedorId: 'USR-001',
        nombre: 'E-commerce Completo',
        descripcion: 'Tienda online con WooCommerce, pasarela de pago, gestión de inventario y diseño personalizado. Hasta 50 productos iniciales.',
        precio: 850,
        imagenUrl: refAUrl(IMAGENES.ecommerce) || '/wp-content/themes/glory/assets/img/servicios/ecommerce.jpg',
        categoria: 'web',
        tiempoEntregaDias: 45,
        activo: true,
        fechaCreacion: '2024-02-01'
    },
    {
        id: 'SRVPUB-003',
        proveedorId: 'USR-001',
        nombre: 'Mantenimiento Web Mensual',
        descripcion: 'Actualizaciones de seguridad, backups semanales, monitoreo de uptime y soporte técnico por email. Plan mensual renovable.',
        precio: 75,
        imagenUrl: refAUrl(IMAGENES.mantenimiento) || '/wp-content/themes/glory/assets/img/servicios/mantenimiento.jpg',
        categoria: 'web',
        tiempoEntregaDias: 30,
        activo: true,
        fechaCreacion: '2024-02-15'
    },
    {
        id: 'SRVPUB-004',
        proveedorId: 'USR-001',
        nombre: 'Automatización de Procesos',
        descripcion: 'Flujos automatizados con n8n o Make. Integraciones entre apps, notificaciones automáticas y reportes programados.',
        precio: 450,
        imagenUrl: refAUrl(IMAGENES.automatizacion) || '/wp-content/themes/glory/assets/img/servicios/automatizacion.jpg',
        categoria: 'desarrollo',
        tiempoEntregaDias: 21,
        activo: true,
        fechaCreacion: '2024-03-01'
    },
    {
        id: 'SRVPUB-005',
        proveedorId: 'USR-001',
        nombre: 'Consultoría Técnica',
        descripcion: 'Sesión de 2 horas para revisar tu proyecto, resolver dudas técnicas y definir roadmap de desarrollo.',
        precio: 120,
        imagenUrl: refAUrl(IMAGENES.consultoria) || '/wp-content/themes/glory/assets/img/servicios/consultoria.jpg',
        categoria: 'consultoria',
        tiempoEntregaDias: 3,
        activo: true,
        fechaCreacion: '2024-03-15'
    },
    {
        id: 'SRVPUB-006',
        proveedorId: 'USR-001',
        nombre: 'Branding Digital',
        descripcion: 'Logo, paleta de colores, tipografías y guía de estilo básica para tu marca digital.',
        precio: 350,
        imagenUrl: refAUrl(IMAGENES.branding) || '/wp-content/themes/glory/assets/img/servicios/branding.jpg',
        categoria: 'diseno',
        tiempoEntregaDias: 14,
        activo: true,
        fechaCreacion: '2024-04-01'
    }
];

/* Helper para obtener servicios de un proveedor */
export const obtenerServiciosPorProveedor = (proveedorId: string): ServicioPublicado[] => {
    return serviciosPublicados.filter(s => s.proveedorId === proveedorId);
};

/* Helper para obtener servicio por ID */
export const obtenerServicioPublicadoPorId = (id: string): ServicioPublicado | undefined => {
    return serviciosPublicados.find(s => s.id === id);
};

/* Helper para obtener servicios activos */
export const obtenerServiciosActivos = (): ServicioPublicado[] => {
    return serviciosPublicados.filter(s => s.activo);
};
