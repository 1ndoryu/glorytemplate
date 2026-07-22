/*
 * stores/recordatoriosStore.ts
 * Store Zustand para el plugin de Recordatorios
 * Persiste en localStorage (glory-recordatorios)
 */

import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import type {Recordatorio, ConfigRecordatorios, IntervaloRecordatorio, TamanoFuenteRecordatorio} from '../types/recordatorios';

interface RecordatoriosActions {
    agregar: (recordatorio: Omit<Recordatorio, 'id' | 'fechaCreacion'>) => Recordatorio;
    agregarVarios: (recordatorios: Array<Omit<Recordatorio, 'id' | 'fechaCreacion'>>) => Recordatorio[];
    actualizar: (id: string, datos: Partial<Pick<Recordatorio, 'texto' | 'adjuntos'>>) => void;
    eliminar: (id: string) => Recordatorio | undefined;
    restaurar: (recordatorio: Recordatorio) => void;
    cambiarIntervalo: (intervalo: IntervaloRecordatorio) => void;
    cambiarIntervaloMs: (ms: number) => void;
    cambiarTamanoFuente: (tamano: TamanoFuenteRecordatorio) => void;
    actualizarConfig: (config: Partial<ConfigRecordatorios>) => void;
    mostrarSiguiente: () => void;
}

type RecordatoriosStore = {
    recordatorios: Recordatorio[];
    config: ConfigRecordatorios;
    idMostradoActual: string | null;
    ultimoCambio: number;
} & RecordatoriosActions;

let _contadorId = Date.now();

function generarId(): string {
    return `rec-${++_contadorId}-${Math.random().toString(36).slice(2, 7)}`;
}

function elegirAleatorio(excluyendo: string | null, lista: Recordatorio[]): Recordatorio | null {
    if (lista.length === 0) return null;
    if (lista.length === 1) return lista[0];

    const candidatos = excluyendo ? lista.filter(r => r.id !== excluyendo) : lista;
    if (candidatos.length === 0) return lista[0];
    return candidatos[Math.floor(Math.random() * candidatos.length)];
}

export const useRecordatoriosStore = create<RecordatoriosStore>()(
    persist(
        (set, get) => ({
            recordatorios: [],
            config: {intervalo: 'hora', intervaloMs: 3_600_000, tamanoFuente: 'normal'},
            idMostradoActual: null,
            ultimoCambio: 0,

            agregar: (datos) => {
                const nuevo: Recordatorio = {
                    id: generarId(),
                    texto: datos.texto,
                    adjuntos: datos.adjuntos,
                    fechaCreacion: Date.now()
                };
                set(state => {
                    const nuevos = [...state.recordatorios, nuevo];
                    /* Si no hay ninguno mostrado, mostrar este */
                    const idMostrado = state.idMostradoActual ?? nuevo.id;
                    return {recordatorios: nuevos, idMostradoActual: idMostrado, ultimoCambio: Date.now()};
                });
                return nuevo;
            },

            agregarVarios: (lista) => {
                const nuevos = lista.map(datos => ({
                    id: generarId(),
                    texto: datos.texto,
                    adjuntos: datos.adjuntos,
                    fechaCreacion: Date.now()
                }));
                set(state => {
                    const todos = [...state.recordatorios, ...nuevos];
                    const idMostrado = state.idMostradoActual ?? nuevos[0].id;
                    return {recordatorios: todos, idMostradoActual: idMostrado, ultimoCambio: Date.now()};
                });
                return nuevos;
            },

            actualizar: (id, datos) => {
                set(state => ({
                    recordatorios: state.recordatorios.map(r =>
                        r.id === id ? {...r, ...datos} : r
                    )
                }));
            },

            eliminar: (id) => {
                const state = get();
                const eliminado = state.recordatorios.find(r => r.id === id);
                if (!eliminado) return undefined;

                const restantes = state.recordatorios.filter(r => r.id !== id);
                let nuevoMostrado = state.idMostradoActual;

                if (state.idMostradoActual === id) {
                    const siguiente = elegirAleatorio(id, restantes);
                    nuevoMostrado = siguiente?.id ?? null;
                }

                set({recordatorios: restantes, idMostradoActual: nuevoMostrado, ultimoCambio: Date.now()});
                return eliminado;
            },

            restaurar: (recordatorio) => {
                set(state => ({
                    recordatorios: [...state.recordatorios, recordatorio],
                    idMostradoActual: state.idMostradoActual ?? recordatorio.id,
                    ultimoCambio: Date.now()
                }));
            },

            cambiarIntervalo: (intervalo) => {
                set(state => ({config: {...state.config, intervalo}}));
            },

            cambiarIntervaloMs: (ms) => {
                set(state => ({config: {...state.config, intervaloMs: ms}}));
            },

            cambiarTamanoFuente: (tamano) => {
                set(state => ({config: {...state.config, tamanoFuente: tamano}}));
            },

            actualizarConfig: (parcial) => {
                set(state => ({config: {...state.config, ...parcial}}));
            },

            mostrarSiguiente: () => {
                const state = get();
                const siguiente = elegirAleatorio(state.idMostradoActual, state.recordatorios);
                if (siguiente) {
                    set({idMostradoActual: siguiente.id, ultimoCambio: Date.now()});
                }
            }
        }),
        {name: 'glory-recordatorios'}
    )
);

/* Selectores */
export const useRecordatorioActual = () => {
    return useRecordatoriosStore(state => {
        if (!state.idMostradoActual) return null;
        return state.recordatorios.find(r => r.id === state.idMostradoActual) ?? null;
    });
};

export const useTotalRecordatorios = () => useRecordatoriosStore(s => s.recordatorios.length);
