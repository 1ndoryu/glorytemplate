/*
 * Hook: useArchivosDragDrop — Kamples
 * Gestión de drag & drop y selección de archivos (audio + imágenes).
 * Extraído de ModalCrear para cumplir SRP y reutilización.
 */

import { useState, useCallback, useRef, type ChangeEvent, type DragEvent } from 'react';

const FORMATOS_AUDIO = ['.wav', '.mp3', '.flac', '.aiff', '.aif'];
const MAX_IMAGENES = 4;
const MAX_MB = 100;

export interface ArchivoAudio {
    archivo: File;
    nombre: string;
    tamano: string;
    formato: string;
}

export interface ImagenPreview {
    archivo: File;
    url: string;
}

const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const useArchivosDragDrop = () => {
    const [audioAdjunto, setAudioAdjunto] = useState<ArchivoAudio | null>(null);
    const [imagenes, setImagenes] = useState<ImagenPreview[]>([]);
    const [arrastrando, setArrastrando] = useState(false);

    const contadorDrag = useRef(0);
    const inputAudioRef = useRef<HTMLInputElement>(null);
    const inputImagenRef = useRef<HTMLInputElement>(null);

    /* Adjuntar audio desde archivos */
    const manejarAudio = useCallback((archivos: File[]) => {
        const audio = archivos.find((f) => {
            const ext = '.' + f.name.split('.').pop()?.toLowerCase();
            return FORMATOS_AUDIO.includes(ext) && f.size <= MAX_MB * 1024 * 1024;
        });
        if (audio) {
            setAudioAdjunto({
                archivo: audio,
                nombre: audio.name,
                tamano: formatearTamano(audio.size),
                formato: audio.name.split('.').pop()?.toUpperCase() ?? '',
            });
        }
    }, []);

    const manejarInputAudio = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) manejarAudio(Array.from(e.target.files));
        e.target.value = '';
    }, [manejarAudio]);

    /* Adjuntar imágenes */
    const manejarInputImagen = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivos = Array.from(e.target.files ?? []);
        const disponibles = MAX_IMAGENES - imagenes.length;
        const nuevas = archivos.slice(0, disponibles).map((f) => ({
            archivo: f,
            url: URL.createObjectURL(f),
        }));
        setImagenes((prev) => [...prev, ...nuevas]);
        if (inputImagenRef.current) inputImagenRef.current.value = '';
    }, [imagenes.length]);

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
        const archivos = Array.from(e.dataTransfer.files);
        const audios = archivos.filter((f) => {
            const ext = '.' + f.name.split('.').pop()?.toLowerCase();
            return FORMATOS_AUDIO.includes(ext);
        });
        const imgs = archivos.filter((f) => f.type.startsWith('image/'));
        if (audios.length > 0) manejarAudio(audios);
        if (imgs.length > 0) {
            const disponibles = MAX_IMAGENES - imagenes.length;
            const nuevas = imgs.slice(0, disponibles).map((f) => ({
                archivo: f,
                url: URL.createObjectURL(f),
            }));
            setImagenes((prev) => [...prev, ...nuevas]);
        }
    }, [manejarAudio, imagenes.length]);

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
        manejarDragEnter,
        manejarDragLeave,
        manejarDragOver,
        manejarDrop,
        resetear,
        formatosAudio: FORMATOS_AUDIO,
        maxImagenes: MAX_IMAGENES,
    };
};
