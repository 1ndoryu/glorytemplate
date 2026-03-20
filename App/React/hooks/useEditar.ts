/*
 * Hook: useEditar — Kamples (C126)
 * Lógica de edición para samples y publicaciones.
 * Separada del componente visual (SRP).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { actualizarSample, subirSample, subirImagenSample } from '@app/services/apiSamples';
import { actualizarPublicacion, subirImagenPublicacion } from '@app/services/apiSocial';
import { actualizarColeccion } from '@app/services/apiColecciones';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { crearLogger } from '@app/services/logger';
import { useArchivosDragDrop } from '@app/hooks/useArchivosDragDrop';
import { extraerTags } from '@app/hooks/useCrearContenido';
import type { SampleResumen, Publicacion, Coleccion, TipoSample } from '@app/types';
import type { TipoEntidadEditable } from '@app/stores/editarModalStore';

const log = crearLogger('useEditar');

/* Estado interno del formulario de sample */
export interface FormularioSample {
    titulo: string;
    descripcion: string;
    tags: string;
    tipo: TipoSample;
    esPremium: boolean;
    precio: string;
    permitirDescarga: boolean;
    imagenUrl: string | null;
}

/* Estado interno del formulario de publicación */
export interface FormularioPublicacion {
    contenido: string;
    imagenesExistentes: string[];
    audioExistente: SampleResumen | null;
}

/* Estado interno del formulario de colección */
export interface FormularioColeccion {
    nombre: string;
    descripcion: string;
    esPublica: boolean;
}

interface RetornoEditar {
    formularioSample: FormularioSample;
    formularioPublicacion: FormularioPublicacion;
    formularioColeccion: FormularioColeccion;
    setFormularioSample: React.Dispatch<React.SetStateAction<FormularioSample>>;
    setFormularioPublicacion: React.Dispatch<React.SetStateAction<FormularioPublicacion>>;
    setFormularioColeccion: React.Dispatch<React.SetStateAction<FormularioColeccion>>;
    guardando: boolean;
    guardar: () => Promise<boolean>;
    archivos: ReturnType<typeof useArchivosDragDrop>;
    /* D8: Imagen de portada del sample */
    imagenSampleFile: File | null;
    imagenSamplePreview: string | null;
    seleccionarImagenSample: (archivo: File) => void;
    limpiarImagenSample: () => void;
    inputImagenSampleRef: React.RefObject<HTMLInputElement>;
}

const sampleInicial: FormularioSample = {
    titulo: '',
    descripcion: '',
    tags: '',
    tipo: 'loop',
    esPremium: false,
    precio: '',
    permitirDescarga: true,
    imagenUrl: null,
};

const publicacionInicial: FormularioPublicacion = {
    contenido: '',
    imagenesExistentes: [],
    audioExistente: null,
};

const coleccionInicial: FormularioColeccion = {
    nombre: '',
    descripcion: '',
    esPublica: true,
};

export const useEditar = (
    tipo: TipoEntidadEditable | null,
    sample: SampleResumen | null,
    publicacion: Publicacion | null,
    coleccion: Coleccion | null,
    onExito?: () => void
): RetornoEditar => {
    const [formularioSample, setFormularioSample] = useState<FormularioSample>(sampleInicial);
    const [formularioPublicacion, setFormularioPublicacion] = useState<FormularioPublicacion>(publicacionInicial);
    const [formularioColeccion, setFormularioColeccion] = useState<FormularioColeccion>(coleccionInicial);
    const [guardando, setGuardando] = useState(false);
    const archivos = useArchivosDragDrop();

    /* D8: Imagen de portada del sample — archivo seleccionado + preview URL */
    const [imagenSampleFile, setImagenSampleFile] = useState<File | null>(null);
    const [imagenSamplePreview, setImagenSamplePreview] = useState<string | null>(null);
    const inputImagenSampleRef = useRef<HTMLInputElement | null>(null);

    const seleccionarImagenSample = useCallback((archivo: File) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!tiposPermitidos.includes(archivo.type)) {
            toast.error(getT()('error.imagenTipoDetallado'));
            return;
        }
        if (archivo.size > 5 * 1024 * 1024) {
            toast.error(getT()('error.imagenTamano2'));
            return;
        }
        setImagenSampleFile(archivo);
        const url = URL.createObjectURL(archivo);
        setImagenSamplePreview(url);
    }, []);

    const limpiarImagenSample = useCallback(() => {
        setImagenSampleFile(null);
        if (imagenSamplePreview) {
            URL.revokeObjectURL(imagenSamplePreview);
        }
        setImagenSamplePreview(null);
    }, [imagenSamplePreview]);

    /* Pre-rellenar formularios con datos actuales — C170: cargar descripcion real */
    useEffect(() => {
        if (tipo === 'sample' && sample) {
            /* C170: Extraer descripcion limpia (sin hashtags que ya son tags) */
            const descBruta = sample.descripcion || '';
            const descLimpia = descBruta
                .replace(/#\w+/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            setFormularioSample({
                titulo: sample.titulo || '',
                descripcion: descLimpia,
                tags: Array.isArray(sample.tags) ? sample.tags.join(', ') : '',
                tipo: sample.tipo || 'loop',
                esPremium: sample.esPremium || false,
                precio: sample.precio ? String(sample.precio) : '',
                permitirDescarga: true,
                imagenUrl: sample.imagenUrl || null,
            });
            /* Limpiar imagen previa al cambiar de sample */
            limpiarImagenSample();
        } else if (tipo === 'publicacion' && publicacion) {
            setFormularioPublicacion({
                contenido: publicacion.contenido || '',
                imagenesExistentes: publicacion.imagenes || [],
                audioExistente: publicacion.samplesAdjuntos?.[0] || null,
            });
            archivos.resetear();
        } else if (tipo === 'coleccion' && coleccion) {
            setFormularioColeccion({
                nombre: coleccion.nombre || '',
                descripcion: coleccion.descripcion || '',
                esPublica: coleccion.esPublica || false,
            });
        }
    }, [tipo, sample, publicacion, coleccion]);

    const guardar = useCallback(async (): Promise<boolean> => {
        if (guardando) return false;
        setGuardando(true);

        try {
            if (tipo === 'sample' && sample) {
                /* D8: Si hay imagen nueva, subirla primero */
                if (imagenSampleFile) {
                    const respImg = await subirImagenSample(sample.id, imagenSampleFile);
                    if (!respImg.ok) {
                        toast.error(respImg.error ?? 'Error al subir la imagen');
                        return false;
                    }
                }

                const tagsArray = formularioSample.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);

                const resp = await actualizarSample(sample.id, {
                    titulo: formularioSample.titulo.trim(),
                    descripcion: formularioSample.descripcion.trim(),
                    tags: tagsArray,
                    tipo: formularioSample.tipo,
                    esPremium: formularioSample.esPremium,
                    precio: formularioSample.precio ? parseFloat(formularioSample.precio) : null,
                    permitirDescarga: formularioSample.permitirDescarga,
                    licenciaLibre: formularioSample.permitirDescarga,
                });

                if (resp.ok) {
                    toast.exito('Sample actualizado');
                    log.info('Sample actualizado', { id: sample.id });
                    onExito?.();
                    return true;
                } else {
                    toast.error(resp.error || 'Error al actualizar sample');
                    return false;
                }
            }

            if (tipo === 'publicacion' && publicacion) {
                const urlsReales: string[] = [...formularioPublicacion.imagenesExistentes];
                for (const img of archivos.imagenes) {
                    const respImg = await subirImagenPublicacion(img.archivo);
                    if (respImg.ok && respImg.data?.url) {
                        urlsReales.push(respImg.data.url);
                    } else {
                        log.error('Error subiendo imagen', respImg);
                        toast.error(respImg.error ?? 'Error al subir imagen');
                    }
                }

                let sampleId = formularioPublicacion.audioExistente?.id;
                if (archivos.audioAdjunto?.archivo) {
                    const tags = extraerTags(formularioPublicacion.contenido);
                    const respSample = await subirSample({
                        audio: archivos.audioAdjunto.archivo,
                        titulo: archivos.audioAdjunto.nombre.replace(/\.[^/.]+$/, ''),
                        contenido: formularioPublicacion.contenido.trim(),
                        tags: tags.length >= 2 ? tags : ['kamples', 'audio'],
                        permitirDescarga: true,
                        licenciaLibre: true,
                        esPremium: false,
                        mostrarEnComunidad: false,
                    });
                    if (respSample.ok && respSample.data?.sample_id) {
                        sampleId = respSample.data.sample_id;
                    } else {
                        log.error('Error subiendo audio', respSample);
                        toast.error(respSample.error ?? 'Error al subir audio');
                    }
                }

                const resp = await actualizarPublicacion(publicacion.id, {
                    contenido: formularioPublicacion.contenido.trim(),
                    imagenes: urlsReales,
                    samplesAdjuntos: sampleId ? [sampleId] : [],
                });

                if (resp.ok) {
                    toast.exito('Publicación actualizada');
                    log.info('Publicación actualizada', { id: publicacion.id });
                    onExito?.();
                    return true;
                } else {
                    toast.error(resp.error || 'Error al actualizar publicación');
                    return false;
                }
            }

            if (tipo === 'coleccion' && coleccion) {
                const resp = await actualizarColeccion(coleccion.id, {
                    nombre: formularioColeccion.nombre.trim(),
                    descripcion: formularioColeccion.descripcion.trim(),
                    esPublica: formularioColeccion.esPublica,
                });

                if (resp.ok) {
                    toast.exito('Colección actualizada');
                    log.info('Colección actualizada', { id: coleccion.id });
                    onExito?.();
                    return true;
                } else {
                    toast.error(resp.error || 'Error al actualizar colección');
                    return false;
                }
            }

            return false;
        } catch (err) {
            log.error('Error al guardar', err);
            toast.error(getT()('error.guardar'));
            return false;
        } finally {
            setGuardando(false);
        }
    }, [tipo, sample, publicacion, coleccion, formularioSample, formularioPublicacion, formularioColeccion, guardando, onExito, imagenSampleFile]);

    return {
        formularioSample,
        formularioPublicacion,
        formularioColeccion,
        setFormularioSample,
        setFormularioPublicacion,
        setFormularioColeccion,
        guardando,
        guardar,
        archivos,
        imagenSampleFile,
        imagenSamplePreview,
        seleccionarImagenSample,
        limpiarImagenSample,
        inputImagenSampleRef,
    };
};
