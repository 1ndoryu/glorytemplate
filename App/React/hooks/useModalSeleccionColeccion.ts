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

export const useModalSeleccionColeccion = () => {
    const abierto = useColeccionPickerStore(s => s.abierto);
    const sample = useColeccionPickerStore(s => s.sample);
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
                    let ordenadas = respTodas.data;

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

    const manejarAgregar = useCallback(async (coleccionId: number) => {
        if (!sample || agregando !== null) return;
        setAgregando(coleccionId);
        try {
            const resp = await agregarSampleAColeccion(coleccionId, sample.id);
            if (resp.ok) {
                setAgregados(prev => new Set(prev).add(coleccionId));
                log.info('Sample anadido a coleccion', { coleccionId, sampleId: sample.id });
            }
        } catch (err) {
            log.error('Error anadiendo a coleccion', err);
        } finally {
            setAgregando(null);
        }
    }, [sample, agregando]);

    const manejarCrear = useCallback(async () => {
        if (!busqueda.trim() || !sample || existeConNombre) return;
        setAgregando(-1);
        try {
            const resp = await crearColeccion({
                nombre: busqueda.trim(),
                descripcion: '',
                esPublica: false,
            });
            if (resp.ok && resp.data) {
                await agregarSampleAColeccion(resp.data.id, sample.id);
                setColecciones(prev => [resp.data!, ...prev]);
                setAgregados(prev => new Set(prev).add(resp.data!.id));
                setBusqueda('');
                log.info('Coleccion creada y sample anadido', { id: resp.data.id });
            }
        } catch (err) {
            log.error('Error creando coleccion', err);
        } finally {
            setAgregando(null);
        }
    }, [busqueda, sample, existeConNombre]);

    return {
        abierto, sample, posicion, cerrar,
        colecciones: coleccionesFiltradas, cargando,
        agregando, agregados, yaGuardadoEn,
        busqueda, setBusqueda, existeConNombre,
        manejarAgregar, manejarCrear,
    };
};
