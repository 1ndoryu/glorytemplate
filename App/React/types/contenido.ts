/*
 * Tipos centralizados para contenido del sitio.
 * Fuente única de verdad para interfaces de datos compartidos.
 */

export interface Testimonio {
    id: number;
    texto: string;
    autor: string;
    cargo: string;
    avatar?: string;
}

export interface PostBlog {
    id: number;
    titulo: string;
    resumen: string;
    fecha: string;
    categoria: string;
}

export interface Proyecto {
    id: number;
    titulo: string;
    cliente: string;
    categorias: string;
    imagen: string;
}

export interface CategoriaShowcase {
    titulo: string;
    proyectos: Proyecto[];
}

export interface Skill {
    id: number | string;
    titulo: string;
    imagen: string;
}
