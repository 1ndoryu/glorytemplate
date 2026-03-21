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
import { useCompraModalStore } from '@app/stores/compraModalStore';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { useAudioPlayback } from './useAudioPlayback';
import { esDesktop, obtenerDragService, obtenerSyncService } from './utils/tarjetaSampleUtils';
import { requiereAuth } from '@app/utils/requiereAuth';
import { EVENTO_SAMPLE_GUARDADO_EN_COLECCION } from './useModalSeleccionColeccion';
import { EVENTO_SAMPLE_COMENTADO } from './useComentarios';

export { formatearKey } from './utils/tarjetaSampleUtils';

interface UseTarjetaSampleOpciones {
    sample: SampleResumen;
    contexto?: SampleResumen[];
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
        sample, contexto,
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

    /* [193A-104] Pendiente: sistema de precios y PRO desactivado temporalmente.
     * Cuando se reactive, restaurar la lógica original:
     * requiereCompra = (sample.precio ?? 0) > 0 && !sample.yaComprado && !sample.esMio;
     * esSoloPro = !!sample.esPremium && (sample.precio ?? 0) === 0 && !sample.esMio; */
    const requiereCompra = false;
    const esSoloPro = false;

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
    } = useAudioPlayback({ sample, contexto, onPlay, onPause, onSeek });

    /* Like / Reaccion
     * [193A-32] Toast de feedback al dar like/dislike en samples.
     * Solo aplica a samples (no colecciones ni publicaciones de comunidad).
     * manejarLike (click directo): toggle — toast solo al dar like nuevo (no al quitar).
     * manejarReaccion (tooltip): toast segun tipo de reaccion. */
    const manejarLike = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        if (!sample.liked && !sample.reaccion) {
            toast.info(getT()('toast.masComoEste'));
        }
        onLike?.(sample.id);
    }, [onLike, sample.id, sample.liked, sample.reaccion]);

    const manejarReaccion = useCallback((reaccion: TipoReaccion) => {
        onLike?.(sample.id, reaccion);
        if (reaccion === 'dislike') {
            toast.info(getT()('toast.menosComoEsto'));
        } else {
            toast.info(getT()('toast.masComoEste'));
        }
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
        if (!requiereAuth()) return;

        /* QQ60: Sample con precio: abrir modal de confirmacion de compra */
        if (requiereCompra) {
            useCompraModalStore.getState().abrir(sample);
            return;
        }

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
             * [2003A-18] Si sync no está disponible, cachear para drag nativo.
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
            } else if (esDesktop() && resp.data?.url) {
                const dragService = obtenerDragService();
                if (dragService) {
                    const nombre = resp.data.nombre || `${sample.titulo}.${resp.data.formato || 'wav'}`;
                    dragService.prepararDragNativo(sample.id, resp.data.url, nombre).catch(() => void 0);
                }
            }
        } else if (resp.status === 429 || resp.status === 403) {
            toast.error(resp.error ?? 'Has alcanzado el límite de descargas');
            usePlanesModalStore.getState().abrir();
        }
    }, [onDescargar, sample.id, sample.metadata, descargado, requiereCompra]);

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
        if (!requiereAuth()) return;
        abrirPicker(sample, { x: e.clientX, y: e.clientY });
        /* guardado se actualiza via EVENTO_SAMPLE_GUARDADO_EN_COLECCION cuando el picker confirma */
    }, [abrirPicker, sample]);

/* [2003A-37] Espera a que el mouse se mueva más allá del umbral indicado (px).
 * Resuelve true si se supera, false si se suelta el botón antes.
 * Evita consumir créditos en mini-drags accidentales. */
function esperarUmbralDrag(origenX: number, origenY: number, umbral: number): Promise<boolean> {
    return new Promise((resolve) => {
        const onMove = (ev: globalThis.MouseEvent) => {
            if (Math.hypot(ev.clientX - origenX, ev.clientY - origenY) >= umbral) {
                cleanup();
                resolve(true);
            }
        };
        const onUp = () => {
            cleanup();
            resolve(false);
        };
        const cleanup = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

    /* [2003A-37] Drag handler con umbral para desktop.
     * Desktop: intenta archivo local/cache primero (sin crédito).
     * Si no hay → espera umbral de 20px antes de consumir crédito.
     * Muestra preview verde con nombre del sample (replica web).
     * Web: browser drag para mezclador. */
    const manejarDragStart = useCallback((e: React.DragEvent) => {
        if (esDesktop()) {
            const dragService = obtenerDragService();
            if (dragService) {
                e.preventDefault();
                const nombre = `${sample.titulo}.wav`;
                const origenX = e.clientX;
                const origenY = e.clientY;

                (async () => {
                    /* [2003A-37] Generar preview verde con nombre del sample
                     * (réplica del .dragPreviewSample de la web) */
                    let iconoPreview: string | undefined;
                    try {
                        iconoPreview = await dragService.generarPreviewDrag(sample.titulo);
                    } catch {
                        /* Fallback: icono genérico si falla la generación */
                    }

                    /* 1. Intentar con archivo existente (local sync o cache, sin crédito) */
                    const exitoLocal = await dragService.iniciarDragNativo(sample.id, nombre, iconoPreview);
                    if (exitoLocal) return;

                    /* [2003A-37] 2. No hay archivo local → esperar umbral de 20px.
                     * Evita consumir crédito en mini-drags accidentales. */
                    const pasaUmbral = await esperarUmbralDrag(origenX, origenY, 20);
                    if (!pasaUmbral) return;

                    /* 3. Umbral superado → consumir crédito via API */
                    const resp = await descargarSample(sample.id);
                    if (!resp.ok) {
                        if (resp.status === 429 || resp.status === 403) {
                            toast.error(resp.error ?? getT()('error.limiteDescargas'));
                            usePlanesModalStore.getState().abrir();
                        } else {
                            toast.error(getT()('error.descarga'));
                        }
                        return;
                    }

                    setDescargado(true);
                    if (!resp.data?.yaExistia) {
                        toast.exito('Sample coleccionado');
                    }

                    if (resp.data?.url) {
                        const nombreFinal = resp.data.nombre || nombre;
                        await dragService.descargarYArrastrar(sample.id, resp.data.url, nombreFinal, iconoPreview);
                    }
                })().catch((err: unknown) => {
                    console.error('[DragNativo] Error:', err);
                });
                return;
            }
        }

        /*
         * Fallback: drag in-app para mezclador (web y desktop sin drag service).
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
        requiereCompra,
        esSoloPro,
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
