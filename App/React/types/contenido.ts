/*
 * Tipos centralizados para contenido del sitio.
 * Fuente única de verdad para interfaces de datos compartidos.
 */

export interface Testimonio {
    id: number | string;
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
    link?: string;
    imagen?: string;
}

export interface Proyecto {
    id: number | string;
    titulo: string;
    cliente: string;
    categorias: string | string[];
    imagen: string;
    descripcion?: string;
    contenido?: string;
    link?: string;
    skills?: Skill[];
}

export interface CategoriaShowcase {
    titulo: string;
    proyectos: Proyecto[];
}

export interface Skill {
    id: number | string;
    titulo: string;
    descripcion?: string;
}

export interface Miembro {
    id: string;
    nombre: string;
    bio: string;
    cargo: string;
    avatar: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
}

export interface Marca {
    id: string;
    nombre: string;
    url?: string;
    logo?: string;
}
