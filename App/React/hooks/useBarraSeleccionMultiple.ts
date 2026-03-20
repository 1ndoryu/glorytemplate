/*
 * useBarraSeleccionMultiple — Lógica para acciones en batch sobre samples.
 * QL116: Like, guardar, descargar, eliminar múltiples samples.
 * [183A-50] Emitir eventos CRUD para actualizar UI en tiempo real.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from '@app/stores/toastStore';
import { useSeleccionSamplesStore } from '@app/stores/seleccionSamplesStore';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { descargarSample } from '@app/services/apiDescargas';
import { descargarArchivo } from '@app/utils/descargarArchivo';
import { eliminarSample } from '@app/services/apiSamples';
import { EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO } from '@app/hooks/useMenuContextualSample';
import { EVENTO_LIKE_CAMBIADO } from '@app/hooks/useFeedLikes';

export function useBarraSeleccionMultiple() {
    const seleccionados = useSeleccionSamplesStore(s => s.seleccionados);
    const limpiarSeleccion = useSeleccionSamplesStore(s => s.limpiarSeleccion);
    const abrirPicker = useColeccionPickerStore(s => s.abrir);
    const [procesando, setProcesando] = useState(false);

    const cantidad = seleccionados.size;
    const samplesArr = useMemo(() => Array.from(seleccionados.values()), [seleccionados]);

    /* [2003A-19] Detectar si todos los seleccionados tienen like para toggle */
    const todosConLike = useMemo(() => {
        return samplesArr.length > 0 && samplesArr.every(s => s.liked);
    }, [samplesArr]);

    const emitir = (nombre: string, detail: unknown) =>
        window.dispatchEvent(new CustomEvent(nombre, { detail }));

    /* [183A-50] Dar like a todos — emite EVENTO_LIKE_CAMBIADO por cada éxito */
    const manejarLikeTodos = useCallback(async () => {
        if (procesando) return;
        setProcesando(true);
        let exitos = 0;
        for (const s of samplesArr) {
            if (!s.liked) {
                const resp = await darLike('sample', s.id);
                if (resp.ok) {
                    exitos++;
                    emitir(EVENTO_LIKE_CAMBIADO, { sampleId: s.id, liked: true, reaccion: 'like' });
                }
            }
        }
        toast.exito(`Like dado a ${exitos} samples`);
        limpiarSeleccion();
        setProcesando(false);
    }, [samplesArr, procesando, limpiarSeleccion]);

    /* [183A-50] Quitar like — emite EVENTO_LIKE_CAMBIADO por cada éxito */
    const manejarQuitarLikeTodos = useCallback(async () => {
        if (procesando) return;
        setProcesando(true);
        let exitos = 0;
        for (const s of samplesArr) {
            if (s.liked) {
                const resp = await quitarLike('sample', s.id);
                if (resp.ok) {
                    exitos++;
                    emitir(EVENTO_LIKE_CAMBIADO, { sampleId: s.id, liked: false, reaccion: null });
                }
            }
        }
        toast.exito(`Like quitado de ${exitos} samples`);
        limpiarSeleccion();
        setProcesando(false);
    }, [samplesArr, procesando, limpiarSeleccion]);

    /* [2003A-19] Guardar en colección — abre picker con todos los seleccionados */
    const manejarGuardarEnColeccion = useCallback(() => {
        if (samplesArr.length === 0) return;
        abrirPicker(samplesArr);
    }, [samplesArr, abrirPicker]);

    /* [183A-73] Descargar todos los seleccionados — cross-platform */
    const manejarDescargarTodos = useCallback(async () => {
        if (procesando) return;
        setProcesando(true);
        let exitos = 0;
        for (const s of samplesArr) {
            const resp = await descargarSample(s.id);
            if (resp.ok && resp.data?.url) {
                try {
                    await descargarArchivo(resp.data.url, resp.data.nombre || s.titulo || 'sample');
                    exitos++;
                } catch {
                    /* seguir con los siguientes aunque uno falle */
                }
            }
        }
        toast.exito(`${exitos} samples descargados`);
        limpiarSeleccion();
        setProcesando(false);
    }, [samplesArr, procesando, limpiarSeleccion]);

    /* [183A-50] Eliminar todos (solo samples propios) — emite eventos optimistas con rollback */
    const puedeEliminar = useMemo(() => {
        if (cantidad === 0) return false;
        return samplesArr.every(s => s.esMio === true);
    }, [samplesArr, cantidad]);

    const manejarEliminarTodos = useCallback(async () => {
        if (procesando || !puedeEliminar) return;
        setProcesando(true);
        let exitos = 0;
        const fallidos: typeof samplesArr = [];

        for (const s of samplesArr) {
            emitir(EVENTO_SAMPLE_ELIMINADO, { sampleId: s.id });
            const resp = await eliminarSample(s.id);
            if (resp.ok) {
                exitos++;
            } else {
                fallidos.push(s);
                emitir(EVENTO_SAMPLE_RESTAURADO, { sample: s });
            }
        }

        if (fallidos.length > 0) {
            toast.error(`${fallidos.length} samples no se pudieron eliminar`);
        }
        if (exitos > 0) {
            toast.exito(`${exitos} samples eliminados`);
        }
        limpiarSeleccion();
        setProcesando(false);
    }, [samplesArr, procesando, puedeEliminar, limpiarSeleccion]);

    return {
        cantidad,
        procesando,
        puedeEliminar,
        todosConLike,
        manejarLikeTodos,
        manejarQuitarLikeTodos,
        manejarGuardarEnColeccion,
        manejarDescargarTodos,
        manejarEliminarTodos,
        limpiarSeleccion,
    };
}
