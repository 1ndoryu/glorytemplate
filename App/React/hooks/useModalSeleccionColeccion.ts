/*
 * Hook: useModalSeleccionColeccion
 * Lógica de selección de colección: carga, búsqueda, agregar sample,
 * crear colección inline.
 * Extraído de ModalSeleccionColeccion para cumplir SRP.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import {
    listarColecciones,
    crearColeccion,
    agregarSampleAColeccion,
    obtenerRelevantesParaSample,
} from '@app/services/apiColecciones';
import { crearLogger } from '@app/services/logger';
import type { Coleccion } from '@app/types';

const log = crearLogger('useModalSeleccionColeccion');

/* Evento global para notificar que un sample fue guardado en una coleccion */
export const EVENTO_SAMPLE_GUARDADO_EN_COLECCION = 'kamples:sample-guardado-en-coleccion';

export const useModalSeleccionColeccion = () => {
    const abierto = useColeccionPickerStore(s => s.abierto);
    const sample = useColeccionPickerStore(s => s.sample);
    const samples = useColeccionPickerStore(s => s.samples);
    const posicion = useColeccionPickerStore(s => s.posicion);
    const cerrar = useColeccionPickerStore(s => s.cerrar);

    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [agregando, setAgregando] = useState<number | null>(null);
    const [agregados, setAgregados] = useState<Set<number>>(new Set());
    const [yaGuardadoEn, setYaGuardadoEn] = useState<Set<number>>(new Set());
    const [busqueda, setBusqueda] = useState('');

    /* Cargar colecciones al abrir con cleanup */
    useEffect(() => {
        if (!abierto) {
            setAgregados(new Set());
            setYaGuardadoEn(new Set());
            setBusqueda('');
            return;
        }

        let activo = true;

        const cargar = async () => {
            setCargando(true);
            try {
                const [respTodas, respRelevantes] = await Promise.all([
                    listarColecciones(),
                    sample ? obtenerRelevantesParaSample(sample.id) : Promise.resolve(null),
                ]);

                if (!activo) return;

                if (respTodas.ok && respTodas.data) {
                    let ordenadas = respTodas.data.colecciones;

                    if (respRelevantes?.ok && respRelevantes.data?.length) {
                        const idsRelevantes = new Set(respRelevantes.data.map(c => c.id));
                        const relevantes = ordenadas.filter(c => idsRelevantes.has(c.id));
                        const resto = ordenadas.filter(c => !idsRelevantes.has(c.id));
                        ordenadas = [...relevantes, ...resto];
                    }

                    setColecciones(ordenadas);

                    if (sample && respRelevantes?.ok && respRelevantes.data) {
                        const guardados = new Set<number>();
                        for (const col of respRelevantes.data) {
                            if (col.contieneElSample) guardados.add(col.id);
                        }
                        setYaGuardadoEn(guardados);
                    }
                }
            } catch (err) {
                if (activo) log.error('Error cargando colecciones', err);
            } finally {
                if (activo) setCargando(false);
            }
        };
        cargar();

        return () => { activo = false; };
    }, [abierto, sample]);

    const coleccionesFiltradas = useMemo(() => {
        if (!busqueda.trim()) return colecciones;
        const termino = busqueda.toLowerCase().trim();
        return colecciones.filter(c => c.nombre.toLowerCase().includes(termino));
    }, [colecciones, busqueda]);

    const existeConNombre = useMemo(() => {
        if (!busqueda.trim()) return false;
        return colecciones.some(c => c.nombre.toLowerCase() === busqueda.trim().toLowerCase());
    }, [colecciones, busqueda]);

    /* [2003A-19] Agregar todos los samples seleccionados a la colección */
    const manejarAgregar = useCallback(async (coleccionId: number) => {
        if (!sample || agregando !== null) return;
        setAgregando(coleccionId);
        try {
            const targets = samples.length > 0 ? samples : [sample];
            let exitos = 0;
            for (const s of targets) {
                const resp = await agregarSampleAColeccion(coleccionId, s.id);
                if (resp.ok) exitos++;
            }
            if (exitos > 0) {
                setAgregados(prev => new Set(prev).add(coleccionId));
                log.info('Samples anadidos a coleccion', { coleccionId, cantidad: exitos });
                for (const s of targets) {
                    window.dispatchEvent(new CustomEvent(EVENTO_SAMPLE_GUARDADO_EN_COLECCION, { detail: { sampleId: s.id } }));
                }
            }
        } catch (err) {
            log.error('Error anadiendo a coleccion', err);
        } finally {
            setAgregando(null);
        }
    }, [sample, samples, agregando]);

    const manejarCrear = useCallback(async () => {
        if (!busqueda.trim() || !sample || existeConNombre) return;
        setAgregando(-1);
        try {
            const resp = await crearColeccion({
                nombre: busqueda.trim(),
                descripcion: '',
                esPublica: true,
            });
            if (resp.ok && resp.data) {
                const targets = samples.length > 0 ? samples : [sample];
                for (const s of targets) {
                    await agregarSampleAColeccion(resp.data!.id, s.id);
                    window.dispatchEvent(new CustomEvent(EVENTO_SAMPLE_GUARDADO_EN_COLECCION, { detail: { sampleId: s.id } }));
                }
                setColecciones(prev => [resp.data!, ...prev]);
                setAgregados(prev => new Set(prev).add(resp.data!.id));
                setBusqueda('');
                log.info('Coleccion creada y samples anadidos', { id: resp.data.id, cantidad: targets.length });
            }
        } catch (err) {
            log.error('Error creando coleccion', err);
        } finally {
            setAgregando(null);
        }
    }, [busqueda, sample, samples, existeConNombre]);

    return {
        abierto, sample, posicion, cerrar,
        colecciones: coleccionesFiltradas, cargando,
        agregando, agregados, yaGuardadoEn,
        busqueda, setBusqueda, existeConNombre,
        manejarAgregar, manejarCrear,
    };
};
