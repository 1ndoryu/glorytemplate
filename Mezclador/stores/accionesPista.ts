/*
 * accionesPista — Acciones del menú contextual de pista (C297).
 * Renombrar, color, altura, duplicar, mover, insertar, resetear.
 * Extraído del store principal por SRP.
 */

import type { PistaMezclador } from '../types/mezclador';
import { CONSTANTES_MEZCLADOR } from '../types/mezclador';
import { crearPistaVacia } from './accionesCargaAudio';
import type { SetMezclador, GetMezclador } from './tiposMezcladorStore';

export const crearAccionesPista = (set: SetMezclador, get: GetMezclador) => ({
    renombrarPista: (pistaId: string, nombre: string) => {
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === pistaId ? { ...p, nombre } : p
            ),
        }));
    },

    cambiarColorPista: (pistaId: string, color: string) => {
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === pistaId ? { ...p, color } : p
            ),
        }));
    },

    cambiarAlturaPista: (pistaId: string, altura: 'normal' | 'compacta' | 'minimizada') => {
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === pistaId ? { ...p, altura } : p
            ),
        }));
    },

    duplicarPista: (pistaId: string) => {
        get()._guardarSnapshot();
        const { pistas } = get();
        const indice = pistas.findIndex(p => p.id === pistaId);
        if (indice === -1) return;
        const original = pistas[indice];
        const clon: PistaMezclador = {
            ...original,
            id: crearPistaVacia().id,
            nombre: `${original.nombre} (copia)`,
            bloques: original.bloques.map(b => ({ ...b, id: `${b.id}_clon_${Date.now()}` })),
            clipsPatron: original.clipsPatron.map(c => ({ ...c, id: `${c.id}_clon_${Date.now()}` })),
        };
        const nuevas = [...pistas];
        nuevas.splice(indice + 1, 0, clon);
        set({ pistas: nuevas });
    },

    moverPista: (pistaId: string, direccion: 'arriba' | 'abajo') => {
        const { pistas } = get();
        const indice = pistas.findIndex(p => p.id === pistaId);
        if (indice === -1) return;
        const nuevoIndice = direccion === 'arriba' ? indice - 1 : indice + 1;
        if (nuevoIndice < 0 || nuevoIndice >= pistas.length) return;
        const nuevas = [...pistas];
        [nuevas[indice], nuevas[nuevoIndice]] = [nuevas[nuevoIndice], nuevas[indice]];
        set({ pistas: nuevas });
    },

    insertarPista: (indice: number) => {
        get()._guardarSnapshot();
        const { pistas } = get();
        if (pistas.length >= CONSTANTES_MEZCLADOR.PISTAS_MAX) return;
        const nueva = crearPistaVacia(`Pista ${pistas.length + 1}`);
        const nuevas = [...pistas];
        nuevas.splice(indice, 0, nueva);
        set({ pistas: nuevas });
    },

    silenciarTodosBloquesPista: (pistaId: string, silenciar: boolean) => {
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === pistaId
                    ? { ...p, bloques: p.bloques.map(b => ({ ...b, activo: !silenciar })) }
                    : p
            ),
        }));
    },

    resetPista: (pistaId: string) => {
        const { pistas } = get();
        const indice = pistas.findIndex(p => p.id === pistaId);
        if (indice === -1) return;
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === pistaId
                    ? { ...p, nombre: `Pista ${indice + 1}`, color: '#555', icono: null, altura: 'normal' }
                    : p
            ),
        }));
    },

    colorAleatorio: (pistaId: string) => {
        const colores = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
        const color = colores[Math.floor(Math.random() * colores.length)];
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === pistaId ? { ...p, color } : p
            ),
        }));
    },
});
