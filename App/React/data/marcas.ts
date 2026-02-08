/*
 * Datos de marcas/clientes centralizados.
 * Fuente: window.GLORY_CONTEXT.marcas (PHP) → Fallback estático.
 */
import {Marca} from '../types/contenido';

const MARCAS_FALLBACK: Marca[] = [
    {id: 'trust-keith', nombre: 'Trust Keith', url: 'https://trustkeith.com'},
    {id: 'onfolk', nombre: 'Onfolk', url: 'https://onfolk.com'},
    {id: 'techstart', nombre: 'TechStart', url: 'https://techstart.com'},
    {id: 'innovate', nombre: 'Innovate', url: 'https://innovate.io'},
];

const getMarcasData = (): Marca[] => {
    if (typeof window !== 'undefined' && window.GLORY_CONTEXT?.marcas) {
        return window.GLORY_CONTEXT.marcas as Marca[];
    }
    return MARCAS_FALLBACK;
};

export const MARCAS_DATA: Marca[] = getMarcasData();
