/*
 * Datos de marcas/clientes centralizados.
 * Fuente: window.GLORY_CONTEXT.marcas (PHP) -> Fallback estatico.
 * Las marcas incluyen campo logo (URL del SVG) resuelto desde el backend.
 */
import {Marca} from '../types/contenido';
import {LOGOS_CLIENTES} from '../hooks/useImagenes';

/*
 * Fallback con 12 marcas.
 * Los logos se asignan ciclicamente desde LOGOS_CLIENTES (import.meta.glob).
 */
const obtenerLogoFallback = (indice: number): string => {
    if (LOGOS_CLIENTES.length === 0) return '';
    return LOGOS_CLIENTES[indice % LOGOS_CLIENTES.length];
};

const MARCAS_FALLBACK: Marca[] = [
    {id: 'trust-keith', nombre: 'Trust Keith', url: 'https://trustkeith.com', logo: obtenerLogoFallback(0)},
    {id: 'onfolk', nombre: 'Onfolk', url: 'https://onfolk.com', logo: obtenerLogoFallback(1)},
    {id: 'techstart', nombre: 'TechStart', url: 'https://techstart.com', logo: obtenerLogoFallback(2)},
    {id: 'innovate', nombre: 'Innovate', url: 'https://innovate.io', logo: obtenerLogoFallback(3)},
    {id: 'playzone', nombre: 'PlayZone', url: 'https://playzone.com', logo: obtenerLogoFallback(4)},
    {id: 'visualdev', nombre: 'VisualDev', url: 'https://visualdev.io', logo: obtenerLogoFallback(5)},
    {id: 'sportline', nombre: 'SportLine', url: 'https://sportline.com', logo: obtenerLogoFallback(6)},
    {id: 'dribblex', nombre: 'DribbleX', url: 'https://dribblex.com', logo: obtenerLogoFallback(7)},
    {id: 'crown-sports', nombre: 'Crown Sports', url: 'https://crownsports.com', logo: obtenerLogoFallback(8)},
    {id: 'vibora-tech', nombre: 'Vibora Tech', url: 'https://viboratech.com', logo: obtenerLogoFallback(9)},
    {id: 'nox-digital', nombre: 'Nox Digital', url: 'https://noxdigital.com', logo: obtenerLogoFallback(10)},
    {id: 'wilson-brand', nombre: 'Wilson Brand', url: 'https://wilsonbrand.com', logo: obtenerLogoFallback(11)},
];

/*
 * getMarcasData: si el backend da logo vacío, asigna fallback de Vite.
 * Esto asegura que siempre se muestre un SVG si existe en el bundle.
 */
const getMarcasData = (): Marca[] => {
    if (typeof window !== 'undefined' && window.GLORY_CONTEXT?.marcas) {
        const marcasBackend = window.GLORY_CONTEXT.marcas as Marca[];
        return marcasBackend.map((marca, idx) => ({
            ...marca,
            logo: marca.logo || obtenerLogoFallback(idx),
        }));
    }
    return MARCAS_FALLBACK;
};

export const MARCAS_DATA: Marca[] = getMarcasData();
