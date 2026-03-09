/*
 * Hook: useArchivosDragDrop — Kamples
 * Gestión de drag & drop y selección de archivos (audio + imágenes).
 * Extraído de ModalCrear para cumplir SRP y reutilización.
 */

import { useState, useCallback, useRef, type ChangeEvent, type DragEvent } from 'react';
import {
    FORMATOS_AUDIO_PUBLICACION,
    MAX_IMAGENES_PUBLICACION,
    crearAudioAdjuntoPublicacion,
    crearImagenesPreviewPublicacion,
    esArchivoAudioPublicacion,
    type ArchivoAudioPublicacion as ArchivoAudio,
    type ImagenPreviewPublicacion as ImagenPreview,
} from '@app/services/publicacionAdjuntos';

export const useArchivosDragDrop = () => {
    const [audioAdjunto, setAudioAdjunto] = useState<ArchivoAudio | null>(null);
    const [imagenes, setImagenes] = useState<ImagenPreview[]>([]);
    const [arrastrando, setArrastrando] = useState(false);

    const contadorDrag = useRef(0);
    const inputAudioRef = useRef<HTMLInputElement>(null);
    const inputImagenRef = useRef<HTMLInputElement>(null);

    /* Adjuntar audio desde archivos */
    const manejarAudio = useCallback((archivos: File[]) => {
        const audio = archivos.find(esArchivoAudioPublicacion);
        if (audio) {
            setAudioAdjunto(crearAudioAdjuntoPublicacion(audio));
        }
    }, []);

    const agregarImagenes = useCallback((archivos: File[]) => {
        const disponibles = MAX_IMAGENES_PUBLICACION - imagenes.length;
        if (disponibles <= 0) {
            return;
        }

        const nuevas = crearImagenesPreviewPublicacion(archivos, disponibles);
        setImagenes((prev) => [...prev, ...nuevas]);
    }, [imagenes.length]);

    const adjuntarArchivos = useCallback((archivos: File[]) => {
        if (archivos.length === 0) {
            return;
        }

        const audios = archivos.filter(esArchivoAudioPublicacion);
        if (audios.length > 0) {
            manejarAudio(audios);
        }

        agregarImagenes(archivos);
    }, [agregarImagenes, manejarAudio]);

    const manejarInputAudio = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) manejarAudio(Array.from(e.target.files));
        e.target.value = '';
    }, [manejarAudio]);

    /* Adjuntar imágenes */
    const manejarInputImagen = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        agregarImagenes(Array.from(e.target.files ?? []));
        if (inputImagenRef.current) inputImagenRef.current.value = '';
    }, [agregarImagenes]);

    const quitarImagen = useCallback((i: number) => {
        setImagenes((prev) => {
            const copia = [...prev];
            URL.revokeObjectURL(copia[i].url);
            copia.splice(i, 1);
            return copia;
        });
    }, []);

    const quitarAudio = useCallback(() => {
        setAudioAdjunto(null);
    }, []);

    /*
     * C254: Inyectar archivo de audio programáticamente (desde Mezclador).
     * Usa mismo formato que manejarAudio pero sin filtrar extensiones
     * ya que el File viene del export interno (siempre WAV válido).
     */
    const setAudioExterno = useCallback((archivo: File) => {
        if (!archivo?.name) return;
        setAudioAdjunto(crearAudioAdjuntoPublicacion(archivo));
    }, []);

    /* Eventos de drag & drop */
    const manejarDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        contadorDrag.current++;
        setArrastrando(true);
    }, []);

    const manejarDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        contadorDrag.current--;
        if (contadorDrag.current === 0) setArrastrando(false);
    }, []);

    const manejarDragOver = useCallback((e: DragEvent) => { e.preventDefault(); }, []);

    const manejarDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        contadorDrag.current = 0;
        setArrastrando(false);
        adjuntarArchivos(Array.from(e.dataTransfer.files));
    }, [adjuntarArchivos]);

    /* Resetear todo */
    const resetear = useCallback(() => {
        setAudioAdjunto(null);
        imagenes.forEach((img) => URL.revokeObjectURL(img.url));
        setImagenes([]);
        setArrastrando(false);
        contadorDrag.current = 0;
    }, [imagenes]);

    return {
        audioAdjunto,
        imagenes,
        arrastrando,
        inputAudioRef,
        inputImagenRef,
        manejarInputAudio,
        manejarInputImagen,
        quitarImagen,
        quitarAudio,
        setAudioExterno,
        adjuntarArchivos,
        manejarDragEnter,
        manejarDragLeave,
        manejarDragOver,
        manejarDrop,
        resetear,
        formatosAudio: FORMATOS_AUDIO_PUBLICACION,
        maxImagenes: MAX_IMAGENES_PUBLICACION,
    };
};
