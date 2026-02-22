/*
 * tiposMezcladorStore — Tipos e interfaces del store del Mezclador.
 * Separado para evitar dependencias circulares entre slices.
 */

import type { SampleResumen } from '@app/types';
import type { BloqueMezclador, PistaMezclador, Compas, ConfigBloque, SnapResolucion } from '../types/mezclador';

/* Snapshot para historial de undo/redo */
export interface SnapshotMezclador {
    pistas: PistaMezclador[];
    totalCompases: number;
}

export const MAX_HISTORIAL = 30;
export const LS_KEY_BPM = 'kamples:mezclador:bpm';

/* Tipos de set/get para pasar a slices sin acoplar a Zustand directamente */
export type SetMezclador = (
    partial:
        | Partial<MezcladorState>
        | ((state: MezcladorState) => Partial<MezcladorState>)
) => void;
export type GetMezclador = () => MezcladorState;

export interface MezcladorState {
    /* Estado UI */
    abierto: boolean;
    reproduciendo: boolean;
    tiempoActual: number;
    posicionCursor: number;
    exportando: boolean;
    modoCortarActivo: boolean;
    nivelZoom: number;
    snapResolucion: SnapResolucion;

    /* Proyecto */
    pistas: PistaMezclador[];
    bpmProyecto: number;
    compasProyecto: Compas;
    totalCompases: number;

    /* Carga de audio */
    cargandoBuffers: Set<string>;

    /* Selección múltiple */
    bloquesSeleccionados: Set<string>;
    toggleSeleccionBloque: (bloqueId: string, ctrlKey: boolean) => void;
    limpiarSeleccion: () => void;
    moverBloquesSeleccionados: (pistaIdDestino: string, deltaCompas: number) => void;

    /* Modo resize global */
    modoResizeGlobal: 'stretch' | 'clip';
    setModoResizeGlobal: (modo: 'stretch' | 'clip') => void;

    /* C296: Total extendido congelado durante resize para evitar saltos visuales */
    _totalExtendidoFijado: number | null;

    /* Historial undo/redo */
    _historial: SnapshotMezclador[];
    _posicionHistorial: number;
    _guardarSnapshot: () => void;
    deshacer: () => void;
    rehacer: () => void;
    puedeDeshacer: () => boolean;
    puedeRehacer: () => boolean;

    /* Lifecycle UI */
    abrir: () => void;
    cerrar: () => void;
    toggle: () => void;

    /* Proyecto */
    setBpm: (bpm: number) => void;
    setCompas: (compas: Compas) => void;
    setTotalCompases: (total: number) => void;
    agregarCompas: () => void;
    quitarCompas: () => void;

    /* Pistas */
    agregarPista: () => void;
    eliminarPista: (pistaId: string) => void;
    setVolumenPista: (pistaId: string, volumen: number) => void;
    toggleSilenciarPista: (pistaId: string) => void;
    renombrarPista: (pistaId: string, nombre: string) => void;
    cambiarColorPista: (pistaId: string, color: string) => void;
    cambiarAlturaPista: (pistaId: string, altura: 'normal' | 'compacta' | 'minimizada') => void;
    duplicarPista: (pistaId: string) => void;
    moverPista: (pistaId: string, direccion: 'arriba' | 'abajo') => void;
    insertarPista: (indice: number) => void;
    silenciarTodosBloquesPista: (pistaId: string, silenciar: boolean) => void;
    resetPista: (pistaId: string) => void;
    colorAleatorio: (pistaId: string) => void;

    /* Bloques */
    agregarSample: (sample: SampleResumen, pistaId?: string) => Promise<void>;
    agregarAudioLocal: (archivo: File, pistaId?: string) => Promise<void>;
    moverBloque: (bloqueId: string, pistaIdDestino: string, compasInicio: number) => void;
    eliminarBloque: (bloqueId: string) => void;
    setDuracionBloque: (bloqueId: string, nuevaDuracion: number) => void;
    duplicarBloque: (bloqueId: string) => void;
    dividirBloque: (bloqueId: string, posicionCompas: number) => void;
    actualizarConfigBloque: (bloqueId: string, config: ConfigBloque) => void;

    /* Reproduccion */
    setReproduciendo: (valor: boolean) => void;
    setTiempoActual: (tiempo: number) => void;
    setPosicionCursor: (posicion: number) => void;
    setExportando: (valor: boolean) => void;
    toggleModoCortar: () => void;

    /* Zoom y snap */
    setSnapResolucion: (snap: SnapResolucion) => void;
    setNivelZoom: (zoom: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    obtenerSnapCompas: () => number | null;

    /* Misc */
    limpiarProyecto: () => void;
    obtenerDuracionTotal: () => number;
    obtenerTodosBloques: () => BloqueMezclador[];
    /* C285: Total de compases extendido (dinámico basado en contenido + padding) */
    obtenerTotalExtendido: () => number;
    /* C296: Congelar/descongelar total extendido durante resize para evitar saltos */
    fijarTotalExtendido: () => void;
    desfijarTotalExtendido: () => void;
}
