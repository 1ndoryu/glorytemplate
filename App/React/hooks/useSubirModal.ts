/*
 * Hook: useSubirModal
 * Lógica del modal de subida de samples (estado de pasos, archivos, metadata).
 * Extraído de SubirModal.tsx para cumplir SRP.
 */

import { useState, useCallback } from 'react';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { metadataInicial } from '@app/components/ui/subir';
import type { MetadataSample } from '@app/components/ui/subir';

export interface ArchivoSubida {
    archivo: File;
    nombre: string;
    tamano: string;
    formato: string;
}

const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extraerFormato = (nombre: string): string => {
    return nombre.split('.').pop()?.toLowerCase() ?? '';
};

export const useSubirModal = () => {
    const abierto = useSubirModalStore(s => s.abierto);
    const cerrar = useSubirModalStore(s => s.cerrar);
    const autenticado = useAuthStore(s => s.autenticado);

    const [paso, setPaso] = useState<1 | 2 | 3>(1);
    const [archivos, setArchivos] = useState<ArchivoSubida[]>([]);
    const [archivoActual, setArchivoActual] = useState(0);
    const [progresoCarga, setProgresoCarga] = useState(0);
    const [subiendo, setSubiendo] = useState(false);
    const [metadata, setMetadata] = useState<MetadataSample>({ ...metadataInicial });

    const resetearFormulario = useCallback(() => {
        setPaso(1);
        setArchivos([]);
        setArchivoActual(0);
        setProgresoCarga(0);
        setMetadata({ ...metadataInicial });
    }, []);

    const manejarCerrar = useCallback(() => {
        if (subiendo) return;
        cerrar();
        setTimeout(resetearFormulario, 200);
    }, [cerrar, subiendo, resetearFormulario]);

    /* Paso 1: Recibir archivos */
    const manejarArchivos = useCallback((files: File[]) => {
        const nuevos: ArchivoSubida[] = files.map((f) => ({
            archivo: f,
            nombre: f.name,
            tamano: formatearTamano(f.size),
            formato: extraerFormato(f.name),
        }));
        setArchivos((prev) => [...prev, ...nuevos]);

        if (archivos.length === 0 && nuevos.length > 0) {
            const nombreSinExt = nuevos[0].nombre.replace(/\.[^/.]+$/, '');
            setMetadata((prev) => ({
                ...prev,
                titulo: prev.titulo || nombreSinExt,
            }));
        }
        setPaso(2);
    }, [archivos.length]);

    const eliminarArchivo = useCallback((indice: number) => {
        setArchivos((prev) => prev.filter((_, i) => i !== indice));
        if (archivos.length <= 1) setPaso(1);
    }, [archivos.length]);

    /* Paso 3: Subir */
    const manejarSubida = useCallback(async () => {
        setSubiendo(true);
        setPaso(3);

        for (let i = 0; i < archivos.length; i++) {
            setArchivoActual(i);
            for (let pct = 0; pct <= 100; pct += 10) {
                setProgresoCarga(pct);
                await new Promise((r) => setTimeout(r, 100));
            }
        }

        setSubiendo(false);
        /* TO-DO: llamar a subirSample con FormData real */
    }, [archivos.length]);

    const volverPaso1 = useCallback(() => setPaso(1), []);

    return {
        abierto,
        autenticado,
        paso,
        archivos,
        archivoActual,
        progresoCarga,
        subiendo,
        metadata,
        setMetadata,
        manejarCerrar,
        manejarArchivos,
        eliminarArchivo,
        manejarSubida,
        resetearFormulario,
        volverPaso1,
    };
};
