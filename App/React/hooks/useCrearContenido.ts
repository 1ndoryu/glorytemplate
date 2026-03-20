/*
 * Hook: useCrearContenido — Kamples (C124)
 * Lógica unificada para creación de contenido (samples + publicaciones).
 * Extraído de ModalCrear para reutilizar en SeccionPublicar (inline).
 * Gestiona: texto, audio, imágenes, waveform, condiciones, publicación.
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useArchivosDragDrop } from '@app/hooks/useArchivosDragDrop';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { subirSample } from '@app/services/apiSamples';
import { crearPublicacion, subirImagenPublicacion } from '@app/services/apiSocial';
import { EVENTO_SAMPLE_CREADO } from '@app/hooks/useMenuContextualSample';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';
import { extraerArchivosClipboard } from '@app/services/clipboardArchivos';
import { extraerTags, generarPeaks } from '@app/utils/audioUtils';

export { extraerTags, generarPeaks };

const log = crearLogger('useCrearContenido');

export const MAX_CARACTERES = 2000;
export const MIN_TAGS_AUDIO = 2;

export interface UseCrearContenidoOpciones {
    alCompletarPublicacion?: () => void;
}

export const useCrearContenido = (opciones: UseCrearContenidoOpciones = {}) => {
    const { alCompletarPublicacion } = opciones;

    const [contenido, setContenido] = useState('');
    const [publicando, setPublicando] = useState(false);
    const [permitirDescarga, setPermitirDescarga] = useState(true);
    const [esPremium, setEsPremium] = useState(false);
    /* QQ16: Toggle precio independiente de Pro */
    const [tienePrecio, setTienePrecio] = useState(false);
    /* C220: Toggle visibilidad en comunidad — por defecto sí */
    const [mostrarEnComunidad, setMostrarEnComunidad] = useState(true);
    const [precio, setPrecio] = useState('');
    const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [reproduciendoPreview, setReproduciendoPreview] = useState(false);
    const [progresoPreview, setProgresoPreview] = useState(0);
    /* L7.2: Inicio del sample en la cancion original (segundos) — solo en contexto de relacion */
    const [inicioSegundos, setInicioSegundos] = useState('');
    /* Tipo de elemento sampleado (hook_riff, vocals, etc.) */
    const [tipoElemento, setTipoElemento] = useState('');
    const [errorSubida, setErrorSubida] = useState<string | null>(null);
    const [exitoSubida, setExitoSubida] = useState(false);
    /* QQ90: Portada personalizada para el sample */
    const [portadaArchivo, setPortadaArchivo] = useState<File | null>(null);
    const [portadaPreviewUrl, setPortadaPreviewUrl] = useState<string | null>(null);
    const inputPortadaRef = useRef<HTMLInputElement>(null);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const archivos = useArchivosDragDrop();
    const { audioAdjunto, imagenes, resetear: resetearArchivos, setAudioExterno } = archivos;

    /*
     * C254: Si el modal se abrió con un archivo pre-cargado (ej. desde el Mezclador),
     * inyectarlo automáticamente en el formulario al montar.
     */
    useEffect(() => {
        const archivo = useCrearModalStore.getState().consumirArchivo();
        if (archivo instanceof File && archivo.name) {
            setAudioExterno(archivo);
            log.info('Archivo pre-cargado inyectado desde Mezclador', { nombre: archivo.name });
        }
        /* L7.2: Pre-rellenar inicioSegundos desde contextoAdjuntar si existe */
        const ctx = useCrearModalStore.getState().contextoAdjuntar;
        if (ctx?.inicioSegundos != null) {
            setInicioSegundos(String(ctx.inicioSegundos));
        }
        /* QQ30: En contexto de adjuntar, comunidad desactivada por defecto */
        if (ctx) {
            setMostrarEnComunidad(false);
        }
    }, [setAudioExterno]);

    /* Generar waveform al adjuntar audio */
    useEffect(() => {
        if (audioAdjunto?.archivo) {
            generarPeaks(audioAdjunto.archivo).then(setWaveformPeaks);
            const url = URL.createObjectURL(audioAdjunto.archivo);
            setAudioUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setWaveformPeaks([]);
        setAudioUrl(null);
        setReproduciendoPreview(false);
        setProgresoPreview(0);
    }, [audioAdjunto]);

    /* QQ90: Gestionar portada del sample */
    const adjuntarPortada = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        if (!archivo.type.startsWith('image/')) {
            setErrorSubida('La portada debe ser una imagen (JPG, PNG, WebP)');
            return;
        }
        if (archivo.size > 5 * 1024 * 1024) {
            setErrorSubida('La imagen de portada no puede superar 5 MB');
            return;
        }
        setPortadaArchivo(archivo);
        const url = URL.createObjectURL(archivo);
        setPortadaPreviewUrl(url);
        e.target.value = '';
    }, []);

    const quitarPortada = useCallback(() => {
        setPortadaArchivo(null);
        if (portadaPreviewUrl) URL.revokeObjectURL(portadaPreviewUrl);
        setPortadaPreviewUrl(null);
    }, [portadaPreviewUrl]);

    /* Limpiar objectURL de portada al desmontar */
    useEffect(() => {
        return () => {
            if (portadaPreviewUrl) URL.revokeObjectURL(portadaPreviewUrl);
        };
    }, [portadaPreviewUrl]);

    const togglePreview = useCallback(() => {
        const audio = audioPreviewRef.current;
        if (!audio || !audioUrl) return;
        if (reproduciendoPreview) { audio.pause(); setReproduciendoPreview(false); }
        else { audio.play(); setReproduciendoPreview(true); }
    }, [audioUrl, reproduciendoPreview]);

    /* Resetear todo el formulario */
    const resetear = useCallback(() => {
        setContenido('');
        resetearArchivos();
        setPermitirDescarga(true);
        setEsPremium(false);
        setTienePrecio(false);
        setPrecio('');
        setInicioSegundos('');
        setTipoElemento('');
        setWaveformPeaks([]);
        setAudioUrl(null);
        setErrorSubida(null);
        setExitoSubida(false);
        setReproduciendoPreview(false);
        setProgresoPreview(0);
        quitarPortada();
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }, [resetearArchivos]);

    /* Auto-resize textarea */
    const ajustarAltura = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const linea = 20, min = linea * 2, max = linea * 6;
        el.style.height = `${Math.min(Math.max(el.scrollHeight, min), max)}px`;
    }, []);

    const manejarCambioTexto = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= MAX_CARACTERES) setContenido(e.target.value);
        ajustarAltura();
    }, [ajustarAltura]);

    const manejarPegar = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
        const archivosPegados = extraerArchivosClipboard(e.clipboardData);
        if (archivosPegados.length === 0) {
            return;
        }

        e.preventDefault();
        archivos.adjuntarArchivos(archivosPegados);
        setErrorSubida(null);
    }, [archivos, setErrorSubida]);

    /* Publicar contenido (sample con audio o publicación texto/imágenes)
     * [193A-103] Audio: cierra modal inmediatamente y sube en background con toast.
     * Texto/imágenes: se mantiene flujo síncrono (son rápidos). */
    const manejarPublicar = useCallback(async () => {
        if (publicando) return;
        const tieneContenido = contenido.trim().length > 0 || audioAdjunto || imagenes.length > 0;
        if (!tieneContenido) return;

        setErrorSubida(null);
        setExitoSubida(false);
        const tags = extraerTags(contenido);

        if (audioAdjunto?.archivo && tags.length < MIN_TAGS_AUDIO) {
            setErrorSubida(`Se requieren al menos ${MIN_TAGS_AUDIO} tags (#hashtags) para subir un sample (${tags.length}/${MIN_TAGS_AUDIO}).`);
            return;
        }

        log.info('Publicando', { tags, tieneAudio: !!audioAdjunto, imagenes: imagenes.length });

        if (audioAdjunto?.archivo) {
            /* [193A-103] Capturar datos antes de cerrar el modal y resetear el formulario.
             * La subida continuará en background aunque el componente se desmonte. */
            const datosSubida = {
                audio: audioAdjunto.archivo,
                titulo: audioAdjunto.nombre.replace(/\.[^/.]+$/, ''),
                contenido: contenido.trim(),
                tags,
                permitirDescarga,
                licenciaLibre: permitirDescarga,
                esPremium,
                precio: tienePrecio ? parseFloat(precio) || undefined : undefined,
                mostrarEnComunidad,
                portada: portadaArchivo ?? undefined,
                ...(() => {
                    const ctx = useCrearModalStore.getState().contextoAdjuntar;
                    if (!ctx) return {};
                    return {
                        cancionOrigenId: ctx.cancionOrigenId,
                        relacionId: ctx.relacionId,
                        ladoRelacion: ctx.ladoRelacion,
                        inicioSegundos: inicioSegundos !== '' ? parseFloat(inicioSegundos) : undefined,
                        tipoElemento: tipoElemento || undefined,
                    };
                })(),
            };

            /* Cerrar modal y resetear inmediatamente */
            resetear();
            alCompletarPublicacion?.();
            toast.info('Subiendo sample en segundo plano…');

            /* Subida en background — fire and forget */
            subirSample(datosSubida).then((resp) => {
                if (resp.ok) {
                    log.info('Sample subido exitosamente', resp.data);
                    toast.exito('Tu sample fue publicado');
                    window.dispatchEvent(new CustomEvent(EVENTO_SAMPLE_CREADO));
                } else {
                    log.error('Error subiendo sample', resp);
                    toast.error(resp.error ?? 'Error al subir el sample');
                }
            }).catch((error) => {
                log.error('Error inesperado subiendo sample', error);
                toast.error('Error de conexión al subir sample');
            });
            return;
        }

        /* Publicación texto/imágenes — flujo síncrono (rápido) */
        setPublicando(true);
        try {
            const urlsReales: string[] = [];
            for (const img of imagenes) {
                const respImg = await subirImagenPublicacion(img.archivo);
                if (respImg.ok && respImg.data?.url) {
                    urlsReales.push(respImg.data.url);
                } else {
                    log.error('Error subiendo imagen', respImg);
                    toast.error(respImg.error ?? 'Error al subir imagen');
                }
            }
            const resp = await crearPublicacion({
                tipo: 'social',
                contenido: contenido.trim(),
                imagenes: urlsReales.length > 0 ? urlsReales : undefined,
            });
            if (!resp.ok) {
                setErrorSubida(resp.error ?? 'Error al publicar');
                setPublicando(false);
                return;
            }
            log.info('Publicacion creada', resp.data);

            setExitoSubida(true);
            setTimeout(() => {
                setPublicando(false);
                resetear();
                alCompletarPublicacion?.();
            }, 1500);
        } catch (error) {
            log.error('Error inesperado al publicar contenido', error);
            setErrorSubida('Error de conexión al publicar contenido');
            setPublicando(false);
        }
    }, [contenido, audioAdjunto, imagenes, publicando, permitirDescarga, esPremium, tienePrecio, precio, inicioSegundos, tipoElemento, portadaArchivo, resetear, alCompletarPublicacion]);

    /* Ctrl+Enter para publicar */
    const manejarKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); manejarPublicar(); }
    }, [manejarPublicar]);

    /* QQ16: Togglear Pro fuerza descarga activa — los samples Pro siempre se descargan */
    const togglePremium = useCallback(() => {
        const nuevo = !esPremium;
        setEsPremium(nuevo);
        if (nuevo) setPermitirDescarga(true);
    }, [esPremium]);

    /* Valores computados */
    const tags = extraerTags(contenido);
    const caracteresPendientes = MAX_CARACTERES - contenido.length;
    const tagsInsuficientes = !!audioAdjunto && tags.length < MIN_TAGS_AUDIO;
    /* QQ30: Contexto adjuntar activo (manual o desde canción — restringe condiciones) */
    const esContextoAdjuntar = !!useCrearModalStore.getState().contextoAdjuntar;
    /* L7.2: Contexto de relación activo (para mostrar campo inicioSegundos en UI) */
    const enContextoRelacion = !!useCrearModalStore.getState().contextoAdjuntar?.relacionId;
    /* QQ30: En contexto adjuntar, audio es obligatorio — sin sample no se puede publicar */
    const puedePublicar = esContextoAdjuntar
        ? !!audioAdjunto && contenido.trim().length > 0 && !publicando && !tagsInsuficientes
        : (contenido.trim().length > 0 || !!audioAdjunto || imagenes.length > 0) && !publicando && !tagsInsuficientes;

    return {
        contenido, publicando, permitirDescarga, setPermitirDescarga,
        esPremium, togglePremium, esContextoAdjuntar,
        /* QQ16: Toggle precio independiente de Pro */
        tienePrecio, setTienePrecio,
        /* C220: Toggle comunidad */
        mostrarEnComunidad, setMostrarEnComunidad,
        precio, setPrecio,
        /* L7.2: Timing */
        inicioSegundos, setInicioSegundos, enContextoRelacion,
        /* Tipo de elemento sampleado */
        tipoElemento, setTipoElemento,
        /* QQ90: Portada del sample */
        portadaPreviewUrl, adjuntarPortada, quitarPortada, inputPortadaRef,
        waveformPeaks, audioUrl,
        reproduciendoPreview, progresoPreview, setProgresoPreview,
        errorSubida, setErrorSubida, exitoSubida,
        audioPreviewRef, textareaRef,
        tags, caracteresPendientes, tagsInsuficientes, puedePublicar,
        togglePreview, manejarCambioTexto, manejarPegar, manejarKeyDown, manejarPublicar, resetear,
        /* Delegados de useArchivosDragDrop (sin resetear, usamos el propio) */
        audioAdjunto: archivos.audioAdjunto,
        imagenes: archivos.imagenes,
        arrastrando: archivos.arrastrando,
        inputAudioRef: archivos.inputAudioRef,
        inputImagenRef: archivos.inputImagenRef,
        manejarInputAudio: archivos.manejarInputAudio,
        manejarInputImagen: archivos.manejarInputImagen,
        adjuntarArchivos: archivos.adjuntarArchivos,
        quitarImagen: archivos.quitarImagen,
        quitarAudio: archivos.quitarAudio,
        manejarDragEnter: archivos.manejarDragEnter,
        manejarDragLeave: archivos.manejarDragLeave,
        manejarDragOver: archivos.manejarDragOver,
        manejarDrop: archivos.manejarDrop,
        formatosAudio: archivos.formatosAudio,
        maxImagenes: archivos.maxImagenes,
    };
};
