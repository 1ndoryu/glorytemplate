/*
 * Hook: useTarjetaSample
 * Orquestacion de una tarjeta de sample: likes, coleccionar, drag, menu.
 * Audio (play/pause/seek/waveform) delegado a useAudioPlayback.
 * Utilidades desktop delegadas a utils/tarjetaSampleUtils.
 *
 * TERMINOLOGIA IMPORTANTE (no confundir):
 * - "Coleccionar" (boton +): consume credito, registra descarga en tabla descargas.
 *   Si el usuario tiene app desktop, sincroniza archivo. Si no, descarga.
 *   Estado: descargado/yaColeccionado. Tambien true si esMio (sample propio).
 * - "Guardar en coleccion" (boton Bookmark): agrega sample a una coleccion/playlist.
 *   Tabla: coleccion_samples. Accion DISTINTA de coleccionar. Estado: guardado/yaGuardadoEnColeccion.
 * - "Comentar" (boton MessageCircle): el usuario dejo al menos 1 comentario. Estado: comentado/yaComentado.
 *
 * Los estados yaColeccionado, yaGuardadoEnColeccion, yaComentado y esMio vienen PRE-CARGADOS
 * del backend via subqueries en NormalizadorSample (igual que liked/reaccion).
 * NO se necesitan API calls adicionales por cada tarjeta.
 */

import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { descargarSample } from '@app/services/apiDescargas';
import { useNavigationStore } from '@/core/router';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { toast } from '@app/stores/toastStore';
import { useAudioPlayback } from './useAudioPlayback';
import { esDesktop, obtenerDragService, obtenerSyncService } from './utils/tarjetaSampleUtils';
import { EVENTO_SAMPLE_GUARDADO_EN_COLECCION } from './useModalSeleccionColeccion';
import { EVENTO_SAMPLE_COMENTADO } from './useComentarios';

export { formatearKey } from './utils/tarjetaSampleUtils';

interface UseTarjetaSampleOpciones {
    sample: SampleResumen;
    activa?: boolean;
    reproduciendo?: boolean;
    progreso?: number;
    onPlay?: (sample: SampleResumen) => void;
    onPause?: () => void;
    onSeek?: (posicion: number) => void;
    onLike?: (sampleId: number, reaccion?: TipoReaccion) => void;
    onDescargar?: (sampleId: number) => void;
    onMenu?: (e: MouseEvent, sample: SampleResumen) => void;
    onComentar?: (sampleId: number) => void;
    onClickTitulo?: (sample: SampleResumen) => void;
    className?: string;
}

export function useTarjetaSample(opciones: UseTarjetaSampleOpciones) {
    const {
        sample, activa = false, reproduciendo = false, progreso = 0,
        onPlay, onPause, onSeek, onLike, onDescargar, onMenu,
        onComentar, onClickTitulo, className = '',
    } = opciones;

    /*
     * Estados pre-cargados del backend (subqueries en NormalizadorSample).
     * - descargado = yaColeccionado (boton +, tabla descargas) || esMio (sample propio)
     * - guardado = yaGuardadoEnColeccion (boton Bookmark, tabla coleccion_samples)
     * - comentado = yaComentado (al menos 1 comentario del usuario)
     * Se actualizan en tiempo real via eventos cuando el usuario realiza acciones.
     */
    const [descargado, setDescargado] = useState(() => !!sample.yaColeccionado || !!sample.esMio);
    const [guardado, setGuardado] = useState(() => !!sample.yaGuardadoEnColeccion);
    const [comentado, setComentado] = useState(() => !!sample.yaComentado);
    const navegar = useNavigationStore(s => s.navegar);

    /*
     * Escucha evento global cuando este sample es guardado en una coleccion (boton Bookmark).
     * NO confundir con "coleccionar" (boton +) que es descargar.
     */
    useEffect(() => {
        const manejar = (e: Event) => {
            const { sampleId } = (e as CustomEvent<{ sampleId: number }>).detail;
            if (sampleId === sample.id) setGuardado(true);
        };
        window.addEventListener(EVENTO_SAMPLE_GUARDADO_EN_COLECCION, manejar);
        return () => window.removeEventListener(EVENTO_SAMPLE_GUARDADO_EN_COLECCION, manejar);
    }, [sample.id]);

    /* Escucha evento global cuando el usuario comenta en este sample */
    useEffect(() => {
        const manejar = (e: Event) => {
            const { sampleId } = (e as CustomEvent<{ sampleId: number }>).detail;
            if (sampleId === sample.id) setComentado(true);
        };
        window.addEventListener(EVENTO_SAMPLE_COMENTADO, manejar);
        return () => window.removeEventListener(EVENTO_SAMPLE_COMENTADO, manejar);
    }, [sample.id]);

    /* Audio: play/pause/seek/waveform delegado a hook dedicado */
    const {
        picosAudio,
        estaActiva,
        estaReproduciendo,
        progresoActual,
        manejarPlayPause,
        manejarSeek,
    } = useAudioPlayback({ sample, activa, reproduciendo, progreso, onPlay, onPause, onSeek });

    /* Like / Reaccion */
    const manejarLike = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        onLike?.(sample.id);
    }, [onLike, sample.id]);

    const manejarReaccion = useCallback((reaccion: TipoReaccion) => {
        onLike?.(sample.id, reaccion);
    }, [onLike, sample.id]);

    const manejarQuitarReaccion = useCallback(() => {
        onLike?.(sample.id);
    }, [onLike, sample.id]);

    /*
     * Coleccionar (boton +): consume credito y registra descarga.
     * NO confundir con "Guardar en coleccion" (boton Bookmark, ver manejarGuardar).
     * En desktop con app: sincroniza el archivo a carpeta local.
     * Sin app: descarga directa del archivo.
     */
    const manejarColeccionar = useCallback(async (e: MouseEvent) => {
        e.stopPropagation();
        if (descargado) return;
        if (onDescargar) {
            onDescargar(sample.id);
            setDescargado(true);
            return;
        }
        const resp = await descargarSample(sample.id);
        if (resp.ok) {
            setDescargado(true);

            /*
             * Solo mostrar "Sample coleccionado" si es la primera vez.
             * Si yaExistia = true, el backend indica que ya lo tenia (propietario
             * o descarga previa). No consumio credito ni debe aparecer el toast.
             */
            if (!resp.data?.yaExistia) {
                toast.exito('Sample coleccionado');
            }

            /*
             * Auto-sync: si estamos en desktop con sync activa,
             * descarga el archivo a la carpeta local inmediatamente.
             * Se ejecuta en background sin bloquear la UI.
             */
            const syncService = obtenerSyncService();
            if (syncService) {
                syncService.sincronizarSampleIndividual(
                    sample.id,
                    sample.metadata?.carpeta_primaria as string | undefined,
                    sample.metadata?.carpeta_secundaria as string | undefined,
                ).catch((err: unknown) => {
                    console.error('[AutoSync] Error sincronizando sample recién coleccionado:', err);
                });
            }
        } else if (resp.status === 429 || resp.status === 403) {
            toast.error(resp.error ?? 'Has alcanzado el límite de descargas');
            usePlanesModalStore.getState().abrir();
        }
    }, [onDescargar, sample.id, sample.metadata, descargado]);

    /* Menú contextual */
    const manejarMenu = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onMenu?.(e, sample);
    }, [onMenu, sample]);

    /*
     * Guardar en coleccion (boton Bookmark): abre el picker modal para elegir coleccion.
     * NO confundir con "Coleccionar" (boton +, ver manejarColeccionar).
     * El estado guardado se actualiza via EVENTO_SAMPLE_GUARDADO_EN_COLECCION
     * cuando el picker confirma la accion.
     */
    const abrirPicker = useColeccionPickerStore(s => s.abrir);
    const manejarGuardar = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        abrirPicker(sample, { x: e.clientX, y: e.clientY });
        /* guardado se actualiza via EVENTO_SAMPLE_GUARDADO_EN_COLECCION cuando el picker confirma */
    }, [abrirPicker, sample]);

    /*
     * Drag handler unificado: bifurca entre drag nativo OS-level y drag
     * in-app para el mezclador.
     */
    const manejarDragStart = useCallback((e: React.DragEvent) => {
        /*
         * En desktop, si hay archivo local sincronizado: cancelar drag del
         * browser y delegar al drag nativo OS-level de Tauri.
         * El browser suelta el mouse → startDrag() lo captura para el OS.
         */
        if (esDesktop()) {
            const dragService = obtenerDragService();
            const syncService = obtenerSyncService();

            if (dragService) {
                /* Verificacion sincrona: hay copia local? */
                const rutaLocal = syncService?.obtenerRutaLocal(sample.id);

                if (rutaLocal) {
                    /* Cancelar drag browser para que no compita con el nativo */
                    e.preventDefault();

                    dragService.iniciarDragNativo(
                        sample.id,
                        sample.rutaPreview || '',
                        `${sample.titulo}.wav`,
                    ).catch((err: unknown) => {
                        console.error('[DragNativo] Error:', err);
                    });
                    return;
                }

                /*
                 * Sin archivo local pero en desktop: descargar a temp y drag.
                 * Cancelamos el drag del browser y usamos el fallback de temp.
                 */
                if (sample.rutaPreview) {
                    e.preventDefault();

                    dragService.iniciarDragNativo(
                        sample.id,
                        sample.rutaPreview,
                        `${sample.titulo}.wav`,
                    ).catch((err: unknown) => {
                        console.error('[DragNativo] Error (temp):', err);
                    });
                    return;
                }
            }
        }

        /*
         * Fallback: drag in-app para mezclador (web y desktop sin drag nativo).
         * Setea dataTransfer para que las pistas del mezclador reciban el drop.
         */
        e.dataTransfer.setData('application/kamples-sample', JSON.stringify(sample));
        e.dataTransfer.effectAllowed = 'copy';

        /* Preview visual personalizado */
        const preview = document.createElement('div');
        preview.className = 'dragPreviewSample';
        preview.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
            </svg>
            <span>${sample.titulo.length > 25 ? sample.titulo.slice(0, 25) + '...' : sample.titulo}</span>
        `;
        document.body.appendChild(preview);
        preview.style.position = 'fixed';
        preview.style.top = '-200px';
        preview.style.left = '-200px';
        e.dataTransfer.setDragImage(preview, 20, 16);
        requestAnimationFrame(() => document.body.removeChild(preview));
    }, [sample]);

    /* Comentar: solo abrir panel, sin marcar como comentado prematuramente.
     * El estado comentado se actualiza via EVENTO_SAMPLE_COMENTADO al enviar un comentario real. */
    const manejarComentar = useCallback((sampleId: number) => {
        onComentar?.(sampleId);
    }, [onComentar]);

    /* Valores computados */
    const clases = ['tarjetaSample', estaActiva ? 'tarjetaSampleActiva' : '', className].filter(Boolean).join(' ');
    const imagenPortada = sample.imagenUrl || obtenerImagenColor(sample.id);

    return {
        picosAudio,
        descargado,
        guardado,
        comentado,
        estaActiva,
        estaReproduciendo,
        progresoActual,
        clases,
        imagenPortada,
        manejarPlayPause,
        manejarLike,
        manejarReaccion,
        manejarQuitarReaccion,
        manejarColeccionar,
        manejarMenu,
        manejarGuardar,
        manejarSeek,
        manejarDragStart,
        navegar,
        onClickTitulo,
        manejarComentar,
    };
}
