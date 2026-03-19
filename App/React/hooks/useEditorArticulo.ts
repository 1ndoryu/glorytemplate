/*
 * Hook: useEditorArticulo — Kamples (183A-109 Fase 3)
 * Lógica del editor de artículos: publicar, actualizar, validar.
 */

import { useCallback, useRef } from 'react';
import { useArticuloEditorStore } from '@app/stores/articuloEditorStore';
import { crearArticulo, actualizarArticulo } from '@app/services/apiArticulos';
import { toast } from '@app/stores/toastStore';

export const useEditorArticulo = () => {
    const store = useArticuloEditorStore();
    const inputPortadaRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const validar = useCallback((): string | null => {
        if (!store.titulo.trim()) return 'El título es obligatorio';
        if (store.titulo.trim().length < 5) return 'El título debe tener al menos 5 caracteres';
        if (!store.contenido.trim() && !store.vistaHtml) return 'El contenido no puede estar vacío';
        if (!store.extracto.trim()) return 'El extracto es obligatorio';
        if (store.extracto.trim().length > 300) return 'El extracto no puede superar 300 caracteres';
        return null;
    }, [store.titulo, store.contenido, store.extracto, store.vistaHtml]);

    const publicar = useCallback(async () => {
        const error = validar();
        if (error) {
            toast.error(error);
            return;
        }

        store.setPublicando(true);

        try {
            /* Obtener contenido HTML del editor contentEditable */
            const contenidoHtml = editorRef.current?.innerHTML ?? store.contenido;

            if (store.editandoId) {
                /* Actualizar artículo existente */
                const res = await actualizarArticulo(store.editandoId, {
                    titulo: store.titulo.trim(),
                    contenido: contenidoHtml,
                    extracto: store.extracto.trim(),
                    categoria: store.categoria,
                    embeds: JSON.stringify(store.embeds),
                    descargaPublica: store.descargaPublica,
                });

                if (res.ok) {
                    toast.exito('Artículo actualizado');
                    store.cerrar();
                } else {
                    toast.error(res.error ?? 'Error al actualizar');
                }
            } else {
                /* Crear nuevo artículo */
                const res = await crearArticulo({
                    titulo: store.titulo.trim(),
                    contenido: contenidoHtml,
                    extracto: store.extracto.trim(),
                    categoria: store.categoria,
                    portada: store.portada ?? undefined,
                    embeds: store.embeds.length > 0 ? JSON.stringify(store.embeds) : undefined,
                    descargaPublica: store.descargaPublica,
                });

                if (res.ok) {
                    toast.exito('Artículo enviado a moderación');
                    store.cerrar();
                } else {
                    toast.error(res.error ?? 'Error al publicar');
                }
            }
        } catch {
            toast.error('Error de red al publicar');
        } finally {
            store.setPublicando(false);
        }
    }, [store, validar, toast]);

    const seleccionarPortada = useCallback(() => {
        inputPortadaRef.current?.click();
    }, []);

    const manejarPortada = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no debe superar 5 MB');
            return;
        }
        store.setPortada(file);
    }, [store, toast]);

    /* Comandos de formato para el editor rich text */
    const formatear = useCallback((comando: string, valor?: string) => {
        document.execCommand(comando, false, valor);
        editorRef.current?.focus();
    }, []);

    const insertarImagen = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    document.execCommand('insertImage', false, reader.result);
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }, []);

    return {
        ...store,
        inputPortadaRef,
        editorRef,
        publicar,
        seleccionarPortada,
        manejarPortada,
        formatear,
        insertarImagen,
    };
};
