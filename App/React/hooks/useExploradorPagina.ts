/*
 * Hook: useExploradorPagina — Kamples (C281)
 * Lógica de la página /explorador: carga carpetas y samples coleccionados.
 * Filtrado 100% client-side para navegación fluida (sin recargas por cambio de carpeta).
 * Separado del componente para cumplir SRP.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { obtenerColeccionados, obtenerCarpetas, moverSampleACarpeta } from '@app/services/apiExplorador';
import type { CarpetaInfo } from '@app/services/apiExplorador';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { obtenerCarpetaPrimaria, obtenerCarpetaSecundaria, recalcularCarpetas } from './utils/exploradorPaginaUtils';
import { useLikeExplorador } from './useLikeExplorador';
import { useRestaurarUbicacion } from './useRestaurarUbicacion';

const log = crearLogger('useExploradorPagina');

export interface UseExploradorPaginaResultado {
    carpetas: CarpetaInfo[];
    samples: SampleResumen[];
    cargando: boolean;
    carpetaActiva: string;
    subcarpetaActiva: string;
    totalSamples: number;
    carpetasDesplegadas: Set<string>;
    /* C338: Carpetas creadas localmente (aun sin samples) */
    carpetasLocales: CarpetaInfo[];
    seleccionarCarpeta: (carpeta: string) => void;
    seleccionarSubcarpeta: (primaria: string, subcarpeta: string) => void;
    toggleDesplegada: (carpeta: string) => void;
    manejarLike: (sampleId: number, reaccion?: TipoReaccion) => Promise<void>;
    /* C338: Mover sample a otra carpeta */
    moverSample: (sampleId: number, carpetaPrimaria: string, carpetaSecundaria?: string) => Promise<boolean>;
    /* C338: Crear carpeta nueva (local hasta que se mueva un sample) */
    crearCarpeta: (nombre: string, parent?: string) => void;
    /* C338: Drag state */
    sampleArrastrado: number | null;
    setSampleArrastrado: (id: number | null) => void;
    /* Restaurar sample a su carpeta original asignada por IA */
    restaurarUbicacionOriginal: (sampleId: number) => Promise<boolean>;
    /* Restaurar TODOS los samples visibles a su carpeta IA original */
    restaurarTodosAOriginal: () => Promise<void>;
}

export function useExploradorPagina(): UseExploradorPaginaResultado {
    const [carpetas, setCarpetas] = useState<CarpetaInfo[]>([]);
    /* todosSamples: todos los samples del usuario, se cargan una sola vez */
    const [todosSamples, setTodosSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [carpetaActiva, setCarpetaActiva] = useState('');
    const [subcarpetaActiva, setSubcarpetaActiva] = useState('');
    /* Todas las carpetas desplegadas por defecto */
    const [carpetasDesplegadas, setCarpetasDesplegadas] = useState<Set<string>>(new Set());
    /* C338: Carpetas creadas localmente sin samples aún */
    const [carpetasLocales, setCarpetasLocales] = useState<CarpetaInfo[]>([]);
    /* C338: Drag state */
    const [sampleArrastrado, setSampleArrastrado] = useState<number | null>(null);

    /* Carga inicial unica: carpetas + todos los samples (sin filtro de carpeta) */
    useEffect(() => {
        let cancelado = false;
        const cargar = async () => {
            setCargando(true);
            try {
                const [respCarpetas, respSamples] = await Promise.all([
                    obtenerCarpetas(),
                    obtenerColeccionados(1, 500),
                ]);
                if (cancelado) return;
                if (respCarpetas.ok && respCarpetas.data) {
                    setCarpetas(respCarpetas.data);
                    /* Desplegar todas las carpetas que tienen subcarpetas por defecto */
                    const todasDesplegadas = new Set<string>();
                    for (const c of respCarpetas.data) {
                        if (c.subcarpetas.length > 0) {
                            todasDesplegadas.add(c.primaria);
                        }
                    }
                    setCarpetasDesplegadas(todasDesplegadas);
                }
                if (respSamples.ok && respSamples.data) {
                    setTodosSamples(respSamples.data.data ?? []);
                }
            } catch (err) {
                log.error('Error cargando explorador', err);
            }
            if (!cancelado) setCargando(false);
        };
        cargar();
        return () => { cancelado = true; };
    }, []);

    /*
     * Filtrado client-side tipo file manager:
     * - Raiz (sin carpeta activa): solo samples sueltos (sin carpeta asignada)
     * - Dentro de carpeta: samples de ese nivel (sin subcarpeta)
     * - Dentro de subcarpeta: samples con carpeta+subcarpeta exacta
     */
    const samples = useMemo(() => {
        if (!carpetaActiva) {
            /* Raiz: solo archivos sueltos (sin carpeta) */
            return todosSamples.filter((s) => {
                const primaria = obtenerCarpetaPrimaria(s);
                return !primaria;
            });
        }

        return todosSamples.filter((s) => {
            const primaria = obtenerCarpetaPrimaria(s);
            if (primaria !== carpetaActiva) return false;
            if (subcarpetaActiva) {
                const secundaria = obtenerCarpetaSecundaria(s);
                return secundaria === subcarpetaActiva;
            }
            /* Dentro de carpeta: solo samples sin subcarpeta */
            const secundaria = obtenerCarpetaSecundaria(s);
            return !secundaria;
        });
    }, [todosSamples, carpetaActiva, subcarpetaActiva]);

    /* Total de samples real (todos los coleccionados) */
    const totalSamples = todosSamples.length;

    /* Cambiar de carpeta: solo cambia estado local, sin API call */
    const seleccionarCarpeta = useCallback((carpeta: string) => {
        setCarpetaActiva(carpeta);
        setSubcarpetaActiva('');
    }, []);

    /* Seleccionar subcarpeta: solo cambia estado local */
    const seleccionarSubcarpeta = useCallback((primaria: string, subcarpeta: string) => {
        setCarpetaActiva(primaria);
        setSubcarpetaActiva(subcarpeta);
    }, []);

    /* Toggle despliegue de carpeta (mostrar/ocultar subcarpetas en el arbol) */
    const toggleDesplegada = useCallback((carpeta: string) => {
        setCarpetasDesplegadas(prev => {
            const next = new Set(prev);
            if (next.has(carpeta)) {
                next.delete(carpeta);
            } else {
                next.add(carpeta);
            }
            return next;
        });
    }, []);

    /* Like optimista — lógica delegada a useLikeExplorador */
    const manejarLike = useLikeExplorador(todosSamples, setTodosSamples);

    /*
     * C338: Mover sample a otra carpeta.
     * Actualiza metadata via API y refresca lista local de forma optimista.
     */
    const moverSample = useCallback(async (
        sampleId: number,
        carpetaPrimaria: string,
        carpetaSecundaria = ''
    ): Promise<boolean> => {
        const prevSamples = todosSamples;
        const prevCarpetas = carpetas;

        /* Update optimista: cambiar metadata local */
        setTodosSamples(prev =>
            prev.map(s =>
                s.id === sampleId
                    ? {
                        ...s,
                        metadata: {
                            ...s.metadata,
                            carpeta_primaria: carpetaPrimaria,
                            carpetaPrimaria,
                            carpeta_secundaria: carpetaSecundaria,
                            carpetaSecundaria,
                        },
                    }
                    : s
            )
        );

        /* Aplicar a samples modificados optimisticamente */
        const samplesModificados = prevSamples.map(s =>
            s.id === sampleId
                ? {
                    ...s,
                    metadata: {
                        ...s.metadata,
                        carpeta_primaria: carpetaPrimaria,
                        carpeta_secundaria: carpetaSecundaria,
                    },
                }
                : s
        );
        setCarpetas(recalcularCarpetas(samplesModificados));

        /* Eliminar carpeta local vacía si el sample fue el primero en usarla */
        setCarpetasLocales(prev => prev.filter(c =>
            samplesModificados.some(s => obtenerCarpetaPrimaria(s) === c.primaria)
                ? false
                : c.primaria !== carpetaPrimaria
        ));

        try {
            const resp = await moverSampleACarpeta(sampleId, carpetaPrimaria, carpetaSecundaria);
            if (!resp.ok) {
                setTodosSamples(prevSamples);
                setCarpetas(prevCarpetas);
                toast.error(getT()('error.moverSample'));
                return false;
            }
            toast.exito(`Sample movido a ${carpetaPrimaria}${carpetaSecundaria ? '/' + carpetaSecundaria : ''}`);
            return true;
        } catch (err) {
            setTodosSamples(prevSamples);
            setCarpetas(prevCarpetas);
            log.error('Error al mover sample', err);
            toast.error('Error al mover el sample');
            return false;
        }
    }, [todosSamples, carpetas]);

    /*
     * C338: Crear carpeta nueva (aparece en el árbol localmente).
     * Se persiste cuando un sample se mueve ahí.
     */
    const crearCarpeta = useCallback((nombre: string, parent?: string) => {
        if (!nombre.trim()) return;

        if (parent) {
            /* Crear subcarpeta bajo una carpeta primaria existente */
            const existeEnCarpetas = carpetas.some(c =>
                c.primaria === parent && c.subcarpetas.some(s => s.nombre === nombre)
            );
            if (existeEnCarpetas) {
                toast.error(`La subcarpeta "${nombre}" ya existe en "${parent}".`);
                return;
            }
            /* Agregar subcarpeta al árbol */
            setCarpetas(prev =>
                prev.map(c =>
                    c.primaria === parent
                        ? { ...c, subcarpetas: [...c.subcarpetas, { nombre, total: 0 }] }
                        : c
                )
            );
        } else {
            /* Crear carpeta primaria */
            const existeEnCarpetas = carpetas.some(c => c.primaria === nombre);
            const existeLocal = carpetasLocales.some(c => c.primaria === nombre);
            if (existeEnCarpetas || existeLocal) {
                toast.error(`La carpeta "${nombre}" ya existe.`);
                return;
            }
            setCarpetasLocales(prev => [
                ...prev,
                { primaria: nombre, total: 0, subcarpetas: [] },
            ]);
        }
        toast.exito(`Carpeta "${nombre}" creada.`);
    }, [carpetas, carpetasLocales]);

    /* Restaurar ubicación IA — lógica delegada a useRestaurarUbicacion */
    const { restaurarUbicacionOriginal, restaurarTodosAOriginal } = useRestaurarUbicacion({
        todosSamples,
        moverSample,
    });

    return {
        carpetas,
        samples,
        cargando,
        carpetaActiva,
        subcarpetaActiva,
        totalSamples,
        carpetasDesplegadas,
        carpetasLocales,
        seleccionarCarpeta,
        seleccionarSubcarpeta,
        toggleDesplegada,
        manejarLike,
        moverSample,
        crearCarpeta,
        sampleArrastrado,
        setSampleArrastrado,
        restaurarUbicacionOriginal,
        restaurarTodosAOriginal,
    };
}
