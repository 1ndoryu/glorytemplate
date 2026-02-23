/*
 * Hook: useTarjetaSample
 * Lógica de audio (play/pause/seek), waveform, likes, coleccionar, drag,
 * menú contextual — para una tarjeta de sample individual.
 *
 * Extraído de TarjetaSample.tsx para cumplir SRP.
 *
 * TO-DO: Este hook excede 120 líneas. Dividir en:
 *   - utils/audioWaveform.ts (extraerPicosAudio ~30 líneas)
 *   - hooks/useAudioPlayback.ts (inicializarAudio, play/pause, seek)
 *   - hooks/useTarjetaSample.ts (orquestación: likes, coleccionar, drag, menú)
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { descargarSample } from '@app/services/apiDescargas';
import { registrarReproduccion } from '@app/services/apiReproduciones';
import { useNavigationStore } from '@/core/router';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { toast } from '@app/stores/toastStore';

const EVENTO_REPRODUCCION_SAMPLE = 'kamples:reproduccion-sample';

/*
 * Detecta si estamos en el entorno desktop Tauri.
 * Lee el flag global que inyecta desktop/main.tsx.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const esDesktop = (): boolean => !!(window as any).__KAMPLES_DESKTOP__;

/*
 * Accede al servicio de drag nativo expuesto en window por desktop/main.tsx.
 * Retorna null si no estamos en desktop.
 */
const obtenerDragService = (): { iniciarDragNativo: (sampleId: number, urlRemota: string, nombreArchivo: string) => Promise<boolean> } | null => {
    const drag = (window as any).__KAMPLES_DRAG__;
    return drag ?? null;
};

/*
 * Accede al servicio de sync expuesto en window por desktop/main.tsx.
 * Retorna null si no estamos en desktop.
 */
const obtenerSyncService = (): {
    sincronizarSampleIndividual: (sampleId: number, carpetaPrimaria?: string, carpetaSecundaria?: string) => Promise<string | null>;
    obtenerRutaLocal: (sampleId: number) => string | null;
} | null => {
    const sync = (window as any).__KAMPLES_SYNC__;
    return sync?.sincronizarSampleIndividual ? sync : null;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/* Extraer picos de audio desde un AudioBuffer para mini-waveform */
const extraerPicosAudio = (buffer: AudioBuffer, totalBarras = 96): number[] => {
    const datos = buffer.getChannelData(0);
    const tamanoBloque = Math.max(1, Math.floor(datos.length / totalBarras));
    const picos: number[] = [];

    for (let i = 0; i < totalBarras; i++) {
        const inicio = i * tamanoBloque;
        const fin = Math.min(datos.length, inicio + tamanoBloque);
        let maximo = 0;
        let energia = 0;
        let muestras = 0;

        for (let indice = inicio; indice < fin; indice++) {
            const valor = Math.abs(datos[indice]);
            if (valor > maximo) maximo = valor;
            energia += valor * valor;
            muestras++;
        }

        const rms = muestras > 0 ? Math.sqrt(energia / muestras) : 0;
        picos.push((maximo * 0.65) + (rms * 0.35));
    }

    const suavizados = picos.map((_, indice) => {
        const anterior = picos[indice - 1] ?? picos[indice];
        const actual = picos[indice];
        const siguiente = picos[indice + 1] ?? picos[indice];
        return (anterior * 0.25) + (actual * 0.5) + (siguiente * 0.25);
    });

    const picoGlobal = Math.max(...suavizados, 0.001);
    return suavizados.map(pico => Math.max(0.03, Math.min(1, pico / picoGlobal)));
};

/* Formatear nota musical con escala */
export const formatearKey = (key: string | null, escala: string | null): string => {
    if (!key) return '';
    const esc = escala === 'menor' ? 'm' : '';
    return `${key}${esc}`;
};

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

    const [reproduciendoLocal, setReproduciendoLocal] = useState(false);
    const [progresoLocal, setProgresoLocal] = useState(0);
    const [picosAudio, setPicosAudio] = useState<number[] | null>(null);
    const [descargado, setDescargado] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rutaPreviewRef = useRef(sample.rutaPreview);
    const navegar = useNavigationStore(s => s.navegar);

    /* Cargar waveform: servidor (JSON) o fallback AudioContext */
    useEffect(() => {
        let activo = true;

        const cargarWaveform = async () => {
            if (sample.rutaWaveform) {
                try {
                    const respWf = await fetch(sample.rutaWaveform);
                    if (respWf.ok) {
                        const json = await respWf.json();
                        if (!activo) return;
                        const picosServidor = Array.isArray(json)
                            ? json
                            : (json.peaks ?? json.picos ?? json.data ?? null);
                        if (Array.isArray(picosServidor) && picosServidor.length > 0) {
                            const maximo = Math.max(...picosServidor, 0.001);
                            const normalizados = maximo > 1
                                ? picosServidor.map((p: number) => Math.max(0.03, p / maximo))
                                : picosServidor;
                            setPicosAudio(normalizados);
                            return;
                        }
                    }
                } catch {
                    /* Fallo silencioso, se usa fallback AudioContext */
                }
            }

            if (!sample.rutaPreview) {
                if (activo) setPicosAudio(null);
                return;
            }

            if (typeof window === 'undefined' || !window.AudioContext) {
                if (activo) setPicosAudio(null);
                return;
            }

            const contexto = new window.AudioContext();
            try {
                const respuesta = await fetch(sample.rutaPreview);
                if (!respuesta.ok) throw new Error('No se pudo cargar el audio de preview');

                const bufferAudio = await respuesta.arrayBuffer();
                const audioDecodificado = await contexto.decodeAudioData(bufferAudio.slice(0));
                if (!activo) return;
                setPicosAudio(extraerPicosAudio(audioDecodificado));
            } catch {
                if (activo) setPicosAudio(null);
            } finally {
                contexto.close().catch(() => undefined);
            }
        };

        cargarWaveform();
        return () => { activo = false; };
    }, [sample.rutaWaveform, sample.rutaPreview]);

    /* Inicializar elemento de audio con event listeners */
    const inicializarAudio = useCallback((): HTMLAudioElement => {
        if (audioRef.current) return audioRef.current;

        const audio = new Audio(sample.rutaPreview);
        audio.preload = 'metadata';

        audio.addEventListener('timeupdate', () => {
            if (!audio.duration) return;
            setProgresoLocal(audio.currentTime / audio.duration);
        });
        audio.addEventListener('play', () => setReproduciendoLocal(true));
        audio.addEventListener('pause', () => setReproduciendoLocal(false));
        audio.addEventListener('ended', () => {
            setReproduciendoLocal(false);
            setProgresoLocal(0);
            audio.currentTime = 0;
        });

        audioRef.current = audio;
        return audio;
    }, [sample.rutaPreview]);

    /* Actualizar src si cambia rutaPreview */
    useEffect(() => {
        if (rutaPreviewRef.current === sample.rutaPreview) return;
        rutaPreviewRef.current = sample.rutaPreview;
        if (!audioRef.current) return;

        audioRef.current.pause();
        audioRef.current.src = sample.rutaPreview;
        audioRef.current.load();
        setProgresoLocal(0);
        setReproduciendoLocal(false);
    }, [sample.rutaPreview]);

    /* Pausar si otro sample inicia reproducción */
    useEffect(() => {
        const pausarSiEsOtro = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId === sample.id) return;
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        };

        window.addEventListener(EVENTO_REPRODUCCION_SAMPLE, pausarSiEsOtro as EventListener);
        return () => {
            window.removeEventListener(EVENTO_REPRODUCCION_SAMPLE, pausarSiEsOtro as EventListener);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [sample.id]);

    /* Play/Pause */
    const manejarPlayPause = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        const audio = inicializarAudio();
        if (!audio.paused) {
            audio.pause();
            onPause?.();
            return;
        }

        window.dispatchEvent(
            new CustomEvent(EVENTO_REPRODUCCION_SAMPLE, { detail: { sampleId: sample.id } }),
        );
        audio.play().catch(() => setReproduciendoLocal(false));
        onPlay?.(sample);
        registrarReproduccion(sample.id).catch(() => { /* silencioso */ });
    }, [inicializarAudio, onPlay, onPause, sample]);

    /* Like / Reacción */
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

    /* Coleccionar (consume crédito, no descarga archivo) + auto-sync en desktop */
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
             * Si yaExistia = true, el backend indica que ya lo tenía (propietario
             * o descarga previa). No consumió crédito ni debe aparecer el toast.
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

    /* Guardar en colección (picker modal) */
    const abrirPicker = useColeccionPickerStore(s => s.abrir);
    const manejarGuardar = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        abrirPicker(sample, { x: e.clientX, y: e.clientY });
    }, [abrirPicker, sample]);

    /* Seek en waveform */
    const manejarSeek = useCallback((posicion: number) => {
        const audio = inicializarAudio();

        const aplicarSeekYReproducir = () => {
            if (!audio.duration) return;
            audio.currentTime = posicion * audio.duration;
            setProgresoLocal(posicion);
            window.dispatchEvent(
                new CustomEvent(EVENTO_REPRODUCCION_SAMPLE, { detail: { sampleId: sample.id } }),
            );
            audio.play().catch(() => setReproduciendoLocal(false));
        };

        if (audio.duration && Number.isFinite(audio.duration)) {
            aplicarSeekYReproducir();
        } else {
            const manejarMetadata = () => {
                aplicarSeekYReproducir();
                audio.removeEventListener('loadedmetadata', manejarMetadata);
            };
            audio.addEventListener('loadedmetadata', manejarMetadata);
            audio.load();
        }

        onSeek?.(posicion);
    }, [inicializarAudio, onSeek, sample.id]);

    /*
     * Drag handler unificado: bifurca entre drag nativo OS-level y drag
     * in-app para el mezclador.
     *
     * Desktop con archivo local: cancela el drag del browser (preventDefault)
     * y lanza startDrag() nativo de Tauri → el OS captura el mouse y
     * el usuario puede soltar en DAW, escritorio o cualquier carpeta.
     *
     * Desktop sin archivo local / Web: dataTransfer in-app para mezclador.
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

    /* Valores computados */
    const estaActiva = activa || reproduciendoLocal;
    const estaReproduciendo = reproduciendoLocal || (activa && reproduciendo);
    const progresoActual = estaActiva
        ? reproduciendoLocal ? progresoLocal : progreso
        : 0;
    const clases = ['tarjetaSample', estaActiva ? 'tarjetaSampleActiva' : '', className].filter(Boolean).join(' ');
    const imagenPortada = sample.imagenUrl || obtenerImagenColor(sample.id);

    return {
        /* Estado */
        picosAudio,
        descargado,
        estaActiva,
        estaReproduciendo,
        progresoActual,
        clases,
        imagenPortada,

        /* Handlers */
        manejarPlayPause,
        manejarLike,
        manejarReaccion,
        manejarQuitarReaccion,
        manejarColeccionar,
        manejarMenu,
        manejarGuardar,
        manejarSeek,
        manejarDragStart,

        /* Navegación */
        navegar,

        /* Props passthrough para JSX */
        onClickTitulo,
        onComentar,
    };
}
