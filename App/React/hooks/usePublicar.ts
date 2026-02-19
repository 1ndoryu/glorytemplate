/*
 * Hook: usePublicar — Kamples
 * Encapsula toda la lógica de publicación: estado del formulario,
 * subida de imágenes, envío al backend y limpieza.
 * Extraído de ModalPublicar para reutilizar en SeccionPublicar (inline).
 */

import { useState, useCallback, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { crearPublicacion, subirImagenPublicacion } from '@app/services/apiSocial';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';

const log = crearLogger('usePublicar');

export const MAX_CARACTERES = 500;
export const MAX_IMAGENES = 4;

export interface ImagenPreview {
    archivo: File;
    url: string;
}

interface OpcionesPublicar {
    modo?: 'social' | 'sample';
    alPublicar?: () => void;
}

export const usePublicar = (opciones: OpcionesPublicar = {}) => {
    const { modo = 'social', alPublicar } = opciones;

    const [contenido, setContenido] = useState('');
    const [imagenes, setImagenes] = useState<ImagenPreview[]>([]);
    const [publicando, setPublicando] = useState(false);
    const inputImagenRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const limpiar = useCallback(() => {
        setContenido('');
        imagenes.forEach(img => URL.revokeObjectURL(img.url));
        setImagenes([]);
        setPublicando(false);
        /* Resetear altura del textarea */
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [imagenes]);

    const manejarCambioTexto = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        const valor = e.target.value;
        if (valor.length <= MAX_CARACTERES) {
            setContenido(valor);
        }
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, []);

    const manejarSeleccionImagenes = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivos = Array.from(e.target.files ?? []);
        const disponibles = MAX_IMAGENES - imagenes.length;
        const nuevas: ImagenPreview[] = archivos.slice(0, disponibles).map((archivo) => ({
            archivo,
            url: URL.createObjectURL(archivo),
        }));
        setImagenes((prev) => [...prev, ...nuevas]);
        if (inputImagenRef.current) {
            inputImagenRef.current.value = '';
        }
    }, [imagenes.length]);

    const quitarImagen = useCallback((indice: number) => {
        setImagenes((prev) => {
            const copia = [...prev];
            URL.revokeObjectURL(copia[indice].url);
            copia.splice(indice, 1);
            return copia;
        });
    }, []);

    const publicar = useCallback(async () => {
        if (!contenido.trim() || publicando) return;

        setPublicando(true);
        try {
            const urlsReales: string[] = [];
            for (const img of imagenes) {
                const resp = await subirImagenPublicacion(img.archivo);
                if (resp.ok && resp.data?.url) {
                    urlsReales.push(resp.data.url);
                } else {
                    log.error('Error subiendo imagen', resp);
                    toast.error(resp.error ?? 'Error al subir imagen');
                }
            }

            await crearPublicacion({
                tipo: modo,
                contenido: contenido.trim(),
                imagenes: urlsReales,
            });
            log.info('Publicación creada', { modo, largo: contenido.length, imagenes: urlsReales.length });
            limpiar();
            alPublicar?.();
        } catch (err) {
            log.error('Error al publicar', err);
        } finally {
            setPublicando(false);
        }
    }, [contenido, modo, imagenes, publicando, limpiar, alPublicar]);

    const manejarKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            publicar();
        }
    }, [publicar]);

    const caracteresPendientes = MAX_CARACTERES - contenido.length;
    const puedePublicar = contenido.trim().length > 0 && !publicando;

    return {
        contenido,
        imagenes,
        publicando,
        caracteresPendientes,
        puedePublicar,
        inputImagenRef,
        textareaRef,
        manejarCambioTexto,
        manejarKeyDown,
        manejarSeleccionImagenes,
        quitarImagen,
        publicar,
        limpiar,
    };
};
