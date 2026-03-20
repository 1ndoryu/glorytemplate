/*
 * Hook: useEditorArticulo — Kamples (183A-109 Fase 3 + 183A-110-C)
 * Lógica del editor de artículos: publicar, actualizar, validar.
 * [183A-110-C] Adjuntos reemplazan embeds, persistencia localStorage,
 * limpiar store tras publicar exitoso.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useArticuloEditorStore } from '@app/stores/articuloEditorStore';
import { crearArticulo, actualizarArticulo } from '@app/services/apiArticulos';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { sanitizarHtml } from '@app/utils/sanitizarHtml';
import type { EmbedArticulo } from '@app/types';

export const useEditorArticulo = () => {
    const store = useArticuloEditorStore();
    const inputPortadaRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    /* [193A-8] Inicializar contenido del editor via ref al abrir el modal.
     * Sin dangerouslySetInnerHTML para evitar que el cursor se resetee en cada keystroke.
     * [193A-99] Sanitizar HTML restaurado de localStorage para prevenir XSS persistido. */
    useEffect(() => {
        if (editorRef.current && store.abierto) {
            /* sentinel-disable-next-line innerHTML — sanitizado con sanitizarHtml() antes de asignar */
            editorRef.current.innerHTML = sanitizarHtml(store.contenido);
        }
    }, [store.abierto]);

    const validar = useCallback((): string | null => {
        if (!store.titulo.trim()) return 'El título es obligatorio';
        if (store.titulo.trim().length < 5) return 'El título debe tener al menos 5 caracteres';
        if (!store.contenido.trim() && !store.vistaHtml) return 'El contenido no puede estar vacío';
        if (!store.extracto.trim()) return 'El extracto es obligatorio';
        if (store.extracto.trim().length > 300) return 'El extracto no puede superar 300 caracteres';
        return null;
    }, [store.titulo, store.contenido, store.extracto, store.vistaHtml]);

    const publicar = useCallback(async () => {
        /* [183A-110-E] Si el usuario elige borrador, solo cerrar el modal.
         * El contenido ya está persistido en localStorage automáticamente. */
        if (store.estado === 'borrador') {
            toast.exito('Borrador guardado');
            store.cerrar();
            return;
        }

        const error = validar();
        if (error) {
            toast.error(error);
            return;
        }

        store.setPublicando(true);

        try {
            const contenidoHtml = editorRef.current?.innerHTML ?? store.contenido;

            /* [183A-110-C] Mapear adjuntos a EmbedArticulo para el backend */
            const embeds: EmbedArticulo[] = store.adjuntos.map(a => ({
                tipo: a.tipo,
                id: a.id,
                descargaPublica: a.descargaPublica,
            }));
            const embedsJson = embeds.length > 0 ? JSON.stringify(embeds) : undefined;

            /* descargaPublica global = true si al menos 1 adjunto lo tiene */
            const descargaPublica = store.adjuntos.some(a => a.descargaPublica);

            if (store.editandoId) {
                const res = await actualizarArticulo(store.editandoId, {
                    titulo: store.titulo.trim(),
                    contenido: contenidoHtml,
                    extracto: store.extracto.trim(),
                    categoria: store.categoria,
                    embeds: embedsJson,
                    descargaPublica,
                });

                if (res.ok) {
                    toast.exito('Artículo actualizado');
                    store.limpiar();
                } else {
                    toast.error(res.error ?? 'Error al actualizar');
                }
            } else {
                const res = await crearArticulo({
                    titulo: store.titulo.trim(),
                    contenido: contenidoHtml,
                    extracto: store.extracto.trim(),
                    categoria: store.categoria,
                    portada: store.portada ?? undefined,
                    embeds: embedsJson,
                    descargaPublica,
                });

                /* [193A-9-D] Si el usuario es admin, el artículo se aprueba automáticamente.
                 * El backend retorna moderacionEstado para distinguir el caso. */
                if (res.ok) {
                    if (res.data?.moderacionEstado === 'aprobado') {
                        toast.exito('Artículo publicado exitosamente');
                    } else {
                        toast.exito('Artículo enviado a moderación');
                    }
                    store.limpiar();
                } else {
                    toast.error(res.error ?? 'Error al publicar');
                }
            }
        } catch {
            toast.error(getT()('error.redPublicar'));
        } finally {
            store.setPublicando(false);
        }
    }, [store, validar]);

    const seleccionarPortada = useCallback(() => {
        inputPortadaRef.current?.click();
    }, []);

    const manejarPortada = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(getT()('error.imagenTipo'));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error(getT()('error.imagenTamano'));
            return;
        }
        store.setPortada(file);
    }, [store]);

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
