/*
 * accionesHistorial — Undo/redo del mezclador.
 * Snapshots inmutables de pistas + totalCompases.
 */

import type { SetMezclador, GetMezclador, SnapshotMezclador } from './tiposMezcladorStore';
import { MAX_HISTORIAL } from './tiposMezcladorStore';
import { EVENTO_REPROGRAMAR_AUDIO } from '../types/mezclador';

export function crearAccionesHistorial(set: SetMezclador, get: GetMezclador) {
    return {
        _historial: [] as SnapshotMezclador[],
        _posicionHistorial: -1,

        _guardarSnapshot: () => {
            const { pistas, totalCompases, _historial, _posicionHistorial } = get();
            /* Descartar historial futuro si hicimos undo y luego una acción nueva */
            const histRecortado = _historial.slice(0, _posicionHistorial + 1);
            const nuevoSnapshot: SnapshotMezclador = { pistas, totalCompases };
            const nuevoHistorial = [...histRecortado, nuevoSnapshot].slice(-MAX_HISTORIAL);
            set({
                _historial: nuevoHistorial,
                _posicionHistorial: nuevoHistorial.length - 1,
            });
        },

        deshacer: () => {
            const { _historial, _posicionHistorial } = get();
            if (_posicionHistorial <= 0) return;
            const anterior = _historial[_posicionHistorial - 1];
            if (!anterior) return;
            set({
                pistas: anterior.pistas,
                totalCompases: anterior.totalCompases,
                _posicionHistorial: _posicionHistorial - 1,
            });
            if (get().reproduciendo) {
                window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
            }
        },

        rehacer: () => {
            const { _historial, _posicionHistorial } = get();
            if (_posicionHistorial >= _historial.length - 1) return;
            const siguiente = _historial[_posicionHistorial + 1];
            if (!siguiente) return;
            set({
                pistas: siguiente.pistas,
                totalCompases: siguiente.totalCompases,
                _posicionHistorial: _posicionHistorial + 1,
            });
            if (get().reproduciendo) {
                window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
            }
        },

        puedeDeshacer: () => get()._posicionHistorial > 0,
        puedeRehacer: () => get()._posicionHistorial < get()._historial.length - 1,
    };
}
