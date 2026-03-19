/*
 * Store: articuloEditorStore — Kamples (183A-109 Fase 3)
 * Controla el modal del editor de artículos del blog.
 * Separado de crearModalStore porque el flujo de artículos es distinto
 * al de publicaciones sociales (rich text, categorías, portada, embeds).
 */

import { create } from 'zustand';
import type { CategoriaArticulo, EmbedArticulo } from '../types';

interface EstadoArticuloEditor {
    abierto: boolean;
    editandoId: number | null;

    /* Campos del artículo */
    titulo: string;
    contenido: string;
    extracto: string;
    categoria: CategoriaArticulo;
    portada: File | null;
    portadaPreviewUrl: string | null;
    embeds: EmbedArticulo[];
    descargaPublica: boolean;

    /* UI */
    vistaHtml: boolean;
    publicando: boolean;

    /* Acciones */
    abrir: () => void;
    abrirEdicion: (id: number, datos: {
        titulo: string;
        contenido: string;
        extracto: string;
        categoria: CategoriaArticulo;
        portadaUrl: string | null;
        embeds: EmbedArticulo[];
        descargaPublica: boolean;
    }) => void;
    cerrar: () => void;
    setTitulo: (v: string) => void;
    setContenido: (v: string) => void;
    setExtracto: (v: string) => void;
    setCategoria: (v: CategoriaArticulo) => void;
    setPortada: (file: File | null) => void;
    agregarEmbed: (embed: EmbedArticulo) => void;
    quitarEmbed: (index: number) => void;
    toggleDescargaPublica: () => void;
    toggleVistaHtml: () => void;
    setPublicando: (v: boolean) => void;
}

const estadoInicial = {
    abierto: false,
    editandoId: null,
    titulo: '',
    contenido: '',
    extracto: '',
    categoria: 'inspiracion' as CategoriaArticulo,
    portada: null,
    portadaPreviewUrl: null,
    embeds: [] as EmbedArticulo[],
    descargaPublica: false,
    vistaHtml: false,
    publicando: false,
};

export const useArticuloEditorStore = create<EstadoArticuloEditor>((set) => ({
    ...estadoInicial,

    abrir: () => set({ ...estadoInicial, abierto: true }),

    abrirEdicion: (id, datos) => set({
        ...estadoInicial,
        abierto: true,
        editandoId: id,
        titulo: datos.titulo,
        contenido: datos.contenido,
        extracto: datos.extracto,
        categoria: datos.categoria,
        portadaPreviewUrl: datos.portadaUrl,
        embeds: datos.embeds,
        descargaPublica: datos.descargaPublica,
    }),

    cerrar: () => set(estadoInicial),

    setTitulo: (v) => set({ titulo: v }),
    setContenido: (v) => set({ contenido: v }),
    setExtracto: (v) => set({ extracto: v }),
    setCategoria: (v) => set({ categoria: v }),

    setPortada: (file) => {
        /* Liberar URL anterior si existe */
        set((prev) => {
            if (prev.portadaPreviewUrl && prev.portada) {
                URL.revokeObjectURL(prev.portadaPreviewUrl);
            }
            return {
                portada: file,
                portadaPreviewUrl: file ? URL.createObjectURL(file) : null,
            };
        });
    },

    agregarEmbed: (embed) => set((prev) => ({
        embeds: [...prev.embeds, embed],
    })),

    quitarEmbed: (index) => set((prev) => ({
        embeds: prev.embeds.filter((_, i) => i !== index),
    })),

    toggleDescargaPublica: () => set((prev) => ({
        descargaPublica: !prev.descargaPublica,
    })),

    toggleVistaHtml: () => set((prev) => ({
        vistaHtml: !prev.vistaHtml,
    })),

    setPublicando: (v) => set({ publicando: v }),
}));
