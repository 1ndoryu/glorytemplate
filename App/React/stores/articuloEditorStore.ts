/*
 * Store: articuloEditorStore — Kamples (183A-109 Fase 3 + 183A-110-C)
 * Controla el modal del editor de artículos del blog.
 * [183A-110-C] Adjuntos en vez de embeds, persistencia localStorage,
 * cerrar sin perder contenido, descarga pública por adjunto.
 */

import { create } from 'zustand';
import type { CategoriaArticulo, AdjuntoArticulo } from '../types';

const CLAVE_BORRADOR = 'kamples_borrador_articulo';

interface EstadoArticuloEditor {
    abierto: boolean;
    editandoId: number | null;

    /* Campos del artículo */
    titulo: string;
    contenido: string;
    extracto: string;
    categoria: CategoriaArticulo;
    /* [183A-110-E] Estado del artículo: publicado lo envía a moderación, borrador lo guarda solo en localStorage */
    estado: 'borrador' | 'publicado';
    portada: File | null;
    portadaPreviewUrl: string | null;
    adjuntos: AdjuntoArticulo[];

    /* UI */
    vistaHtml: boolean;
    publicando: boolean;
    modalAdjuntarAbierto: boolean;

    /* Acciones */
    abrir: () => void;
    abrirEdicion: (id: number, datos: {
        titulo: string;
        contenido: string;
        extracto: string;
        categoria: CategoriaArticulo;
        portadaUrl: string | null;
        adjuntos: AdjuntoArticulo[];
    }) => void;
    cerrar: () => void;
    limpiar: () => void;
    setTitulo: (v: string) => void;
    setContenido: (v: string) => void;
    setExtracto: (v: string) => void;
    setCategoria: (v: CategoriaArticulo) => void;
    setEstado: (v: 'borrador' | 'publicado') => void;
    setPortada: (file: File | null) => void;
    agregarAdjunto: (adjunto: AdjuntoArticulo) => void;
    quitarAdjunto: (index: number) => void;
    toggleDescargaAdjunto: (index: number) => void;
    toggleVistaHtml: () => void;
    setPublicando: (v: boolean) => void;
    setModalAdjuntar: (v: boolean) => void;
}

const estadoInicial = {
    abierto: false,
    editandoId: null,
    titulo: '',
    contenido: '',
    extracto: '',
    categoria: 'inspiracion' as CategoriaArticulo,
    estado: 'publicado' as 'borrador' | 'publicado',
    portada: null,
    portadaPreviewUrl: null,
    adjuntos: [] as AdjuntoArticulo[],
    vistaHtml: false,
    publicando: false,
    modalAdjuntarAbierto: false,
};

/* [183A-110-C] Restaura borrador del localStorage si existe */
function restaurarBorrador(): Partial<typeof estadoInicial> {
    try {
        const raw = localStorage.getItem(CLAVE_BORRADOR);
        if (!raw) return {};
        const datos = JSON.parse(raw);
        return {
            titulo: datos.titulo || '',
            contenido: datos.contenido || '',
            extracto: datos.extracto || '',
            categoria: datos.categoria || 'inspiracion',
            estado: datos.estado || 'publicado',
            adjuntos: Array.isArray(datos.adjuntos) ? datos.adjuntos : [],
        };
    } catch {
        return {};
    }
}

export const useArticuloEditorStore = create<EstadoArticuloEditor>((set) => ({
    ...estadoInicial,

    /* [183A-110-C] Restaura borrador al abrir — contenido no se pierde.
     * [193A-9] Preservar portada/portadaPreviewUrl si ya existen (no se pueden serializar). */
    abrir: () => {
        const borrador = restaurarBorrador();
        set((prev) => ({
            ...estadoInicial,
            ...borrador,
            abierto: true,
            portada: prev.portada,
            portadaPreviewUrl: prev.portadaPreviewUrl,
        }));
    },

    abrirEdicion: (id, datos) => set({
        ...estadoInicial,
        abierto: true,
        editandoId: id,
        titulo: datos.titulo,
        contenido: datos.contenido,
        extracto: datos.extracto,
        categoria: datos.categoria,
        portadaPreviewUrl: datos.portadaUrl,
        adjuntos: datos.adjuntos,
    }),

    /* [183A-110-C] Cerrar sin perder contenido — solo oculta el modal */
    cerrar: () => set({ abierto: false, modalAdjuntarAbierto: false }),

    /* Limpia todo y borra borrador de localStorage (usar tras publicar) */
    limpiar: () => {
        localStorage.removeItem(CLAVE_BORRADOR);
        set(estadoInicial);
    },

    setTitulo: (v) => set({ titulo: v }),
    setContenido: (v) => set({ contenido: v }),
    setExtracto: (v) => set({ extracto: v }),
    setCategoria: (v) => set({ categoria: v }),
    setEstado: (v) => set({ estado: v }),

    setPortada: (file) => {
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

    agregarAdjunto: (adjunto) => set((prev) => {
        /* No duplicar — mismo tipo+id ya existe */
        if (prev.adjuntos.some(a => a.tipo === adjunto.tipo && a.id === adjunto.id)) return prev;
        return { adjuntos: [...prev.adjuntos, adjunto] };
    }),

    quitarAdjunto: (index) => set((prev) => ({
        adjuntos: prev.adjuntos.filter((_, i) => i !== index),
    })),

    toggleDescargaAdjunto: (index) => set((prev) => ({
        adjuntos: prev.adjuntos.map((a, i) =>
            i === index ? { ...a, descargaPublica: !a.descargaPublica } : a
        ),
    })),

    toggleVistaHtml: () => set((prev) => ({
        vistaHtml: !prev.vistaHtml,
    })),

    setPublicando: (v) => set({ publicando: v }),
    setModalAdjuntar: (v) => set({ modalAdjuntarAbierto: v }),
}));

/* [183A-110-C] Persistir borrador en localStorage al cambiar contenido.
 * Debounced 500ms para no saturar escrituras. Solo campos de contenido. */
let temporizadorGuardado: ReturnType<typeof setTimeout> | null = null;

useArticuloEditorStore.subscribe((state) => {
    if (temporizadorGuardado) clearTimeout(temporizadorGuardado);
    temporizadorGuardado = setTimeout(() => {
        const hayContenido = state.titulo || state.contenido || state.extracto || state.adjuntos.length > 0;
        if (hayContenido && !state.editandoId) {
            const borrador = {
                titulo: state.titulo,
                contenido: state.contenido,
                extracto: state.extracto,
                categoria: state.categoria,
                estado: state.estado,
                adjuntos: state.adjuntos,
            };
            localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
        }
    }, 500);
});
