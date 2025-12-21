/*
 * useDashboard
 * Hook personalizado para la logica del dashboard
 * Responsabilidad unica: orquestar estado y acciones del dashboard
 * Delega lógica de tareas a useTareas
 * Incluye persistencia automatica en localStorage
 */

import {useState, useCallback, useEffect, useRef, useMemo} from 'react';
import type {Habito, Tarea, Proyecto, ConfiguracionDashboard, DatosNuevoHabito, DatosEdicionTarea} from '../types/dashboard';
import {exportarDatos, importarDatos} from '../services/dataService';
import {useLocalStorage, CLAVES_LOCALSTORAGE} from './useLocalStorage';
import {useDeshacer} from './useDeshacer';
import {useTareas} from './useTareas';
import {useProyectos, DatosNuevoProyecto} from './useProyectos';
import {useSincronizacion} from './useSincronizacion';
import type {DashboardData} from './useDashboardApi';

/* Utilidades extraidas a modulos separados */
import {obtenerFechaHoy, calcularDiasDesde, fueCompletadoHoy} from '../utils/fecha';
import {validarHabitos, validarTareas, validarNotas, validarProyectos} from '../utils/validadores';
import {migrarYActualizarHabitos} from '../utils/migracionHabitos';
import {habitosIniciales, tareasIniciales, notasIniciales, proyectosIniciales} from '../data/datosIniciales';

/*
 * Configuracion por defecto del dashboard
 * Umbral de 7 dias para resetear racha, advertencia a 2 dias
 */
const CONFIGURACION_POR_DEFECTO: ConfiguracionDashboard = {
    umbralReseteoRacha: 7,
    diasAdvertenciaRacha: 2
};

interface UseDashboardReturn {
    habitos: Habito[];
    tareas: Tarea[];
    notas: string;
    toggleTarea: (id: number) => void;
    crearTarea: (datos: DatosEdicionTarea) => void;
    editarTarea: (id: number, datos: DatosEdicionTarea) => void;
    eliminarTarea: (id: number) => void;
    actualizarNotas: (valor: string) => void;
    toggleHabito: (id: number) => void;
    crearHabito: (datos: DatosNuevoHabito) => void;
    editarHabito: (id: number, datos: DatosNuevoHabito) => void;
    eliminarHabito: (id: number) => void;
    modalCrearHabitoAbierto: boolean;
    abrirModalCrearHabito: () => void;
    cerrarModalCrearHabito: () => void;
    /* Modal de edicion */
    habitoEditando: Habito | null;
    abrirModalEditarHabito: (habito: Habito) => void;
    cerrarModalEditarHabito: () => void;
    exportarTodosDatos: () => void;
    importarTodosDatos: (archivo: File) => void;
    importando: boolean;
    mensajeEstado: string | null;
    tipoMensaje: 'exito' | 'error' | null;
    cargandoDatos: boolean;
    /* Sistema de deshacer */
    accionDeshacer: {
        mensaje: string;
        tiempoRestante: number;
    } | null;
    ejecutarDeshacer: () => void;
    descartarDeshacer: () => void;
    reordenarTareas: (tareas: Tarea[]) => void;
    /* Proyectos */
    proyectos?: Proyecto[];
    crearProyecto: (datos: DatosNuevoProyecto) => void;
    editarProyecto: (id: number, datos: Partial<Proyecto>) => void;
    eliminarProyecto: (id: number) => void;
    cambiarEstadoProyecto: (id: number, nuevoEstado: Proyecto['estado']) => void;
    /* Sincronización */
    sincronizacion: {
        sincronizado: boolean;
        pendiente: boolean;
        error: string | null;
        estaLogueado: boolean;
        sincronizarAhora: () => Promise<void>;
    };
}

export function useDashboard(): UseDashboardReturn {
    /*
     * Hooks de localStorage para persistencia automática
     * Los datos se cargan al montar y se guardan automáticamente al cambiar
     */
    const {
        valor: habitosRaw,
        setValor: setHabitos,
        cargando: cargandoHabitos
    } = useLocalStorage<Habito[]>(CLAVES_LOCALSTORAGE.habitos, {
        valorPorDefecto: habitosIniciales,
        validarValor: validarHabitos
    });

    /* Configuracion del dashboard (por ahora usa valores por defecto) */
    const configuracion = CONFIGURACION_POR_DEFECTO;

    /* Habitos migrados, con dias de inactividad actualizados y rachas reseteadas si aplica */
    const habitos = migrarYActualizarHabitos(habitosRaw, configuracion);

    const {
        valor: tareas,
        setValor: setTareas,
        cargando: cargandoTareas
    } = useLocalStorage<Tarea[]>(CLAVES_LOCALSTORAGE.tareas, {
        valorPorDefecto: tareasIniciales,
        validarValor: validarTareas
    });

    const {
        valor: notas,
        setValor: setNotas,
        cargando: cargandoNotas
    } = useLocalStorage<string>(CLAVES_LOCALSTORAGE.notas, {
        valorPorDefecto: notasIniciales,
        validarValor: validarNotas
    });

    /*
     * Hook de proyectos - delega logica CRUD a useProyectos
     */
    const {
        valor: proyectos,
        setValor: setProyectos,
        cargando: cargandoProyectos
    } = useLocalStorage<Proyecto[]>(CLAVES_LOCALSTORAGE.proyectos, {
        valorPorDefecto: proyectosIniciales,
        validarValor: validarProyectos
    });

    const cargandoDatos = cargandoHabitos || cargandoTareas || cargandoNotas || cargandoProyectos;

    /*
     * Sincronización con servidor WordPress
     * Solo activa si el usuario está logueado
     */
    const datosParaSync = useMemo(
        () => ({
            habitos,
            tareas,
            proyectos,
            notas
        }),
        [habitos, tareas, proyectos, notas]
    );

    const handleDatosServidor = useCallback(
        (datos: DashboardData) => {
            if (datos.habitos?.length) setHabitos(datos.habitos);
            if (datos.tareas?.length) setTareas(datos.tareas);
            if (datos.proyectos?.length) setProyectos(datos.proyectos);
            if (datos.notas) setNotas(datos.notas);
        },
        [setHabitos, setTareas, setProyectos, setNotas]
    );

    const {estado: estadoSync, sincronizarAhora, marcarCambiosPendientes, estaLogueado} = useSincronizacion(datosParaSync, handleDatosServidor);

    /* Marcar cambios pendientes cuando los datos cambian */
    const datosVersion = useRef({habitos: 0, tareas: 0, proyectos: 0, notas: ''});

    useEffect(() => {
        const nuevaVersion = {
            habitos: habitos.length,
            tareas: tareas.length,
            proyectos: proyectos.length,
            notas: notas.slice(0, 50)
        };

        /* Solo sincronizar si hubo cambios reales después de la carga inicial */
        if (!cargandoDatos && JSON.stringify(nuevaVersion) !== JSON.stringify(datosVersion.current)) {
            datosVersion.current = nuevaVersion;
            marcarCambiosPendientes();
        }
    }, [habitos, tareas, proyectos, notas, cargandoDatos, marcarCambiosPendientes]);

    const [importando, setImportando] = useState(false);
    const [mensajeEstado, setMensajeEstado] = useState<string | null>(null);
    const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error' | null>(null);
    const [modalCrearHabitoAbierto, setModalCrearHabitoAbierto] = useState(false);
    const [habitoEditando, setHabitoEditando] = useState<Habito | null>(null);

    /* Sistema de deshacer */
    const {accionActual, registrarAccion, deshacer: ejecutarDeshacer, descartarAccion: descartarDeshacer, tiempoRestante} = useDeshacer();

    /*
     * Ref para el timeout de mensajes
     * Permite limpiar correctamente al desmontar
     */
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const mostrarMensaje = useCallback((mensaje: string, tipo: 'exito' | 'error') => {
        setMensajeEstado(mensaje);
        setTipoMensaje(tipo);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setMensajeEstado(null);
            setTipoMensaje(null);
        }, 4000);
    }, []);

    /*
     * Hook de proyectos - delega logica CRUD a useProyectos
     */
    const {crearProyecto, editarProyecto, eliminarProyecto, cambiarEstadoProyecto} = useProyectos({
        proyectos,
        setProyectos,
        registrarAccion,
        mostrarMensaje
    });

    /*
     * Hook de tareas - delega toda la lógica CRUD a useTareas
     */
    const {toggleTarea, crearTarea, editarTarea, eliminarTarea, reordenarTareas} = useTareas({
        tareas,
        setTareas,
        registrarAccion,
        mostrarMensaje
    });

    const actualizarNotas = useCallback(
        (valor: string) => {
            setNotas(valor);
        },
        [setNotas]
    );

    /*
     * Control del modal de crear hábito
     */
    const abrirModalCrearHabito = useCallback(() => {
        setModalCrearHabitoAbierto(true);
    }, []);

    const cerrarModalCrearHabito = useCallback(() => {
        setModalCrearHabitoAbierto(false);
    }, []);

    /*
     * Control del modal de editar habito
     */
    const abrirModalEditarHabito = useCallback((habito: Habito) => {
        setHabitoEditando(habito);
    }, []);

    const cerrarModalEditarHabito = useCallback(() => {
        setHabitoEditando(null);
    }, []);

    /*
     * Crea un nuevo habito con los datos proporcionados
     * Genera un ID unico basado en timestamp
     */
    const crearHabito = useCallback(
        (datos: DatosNuevoHabito) => {
            const hoy = obtenerFechaHoy();
            const nuevoHabito: Habito = {
                id: Date.now(),
                nombre: datos.nombre,
                importancia: datos.importancia,
                tags: datos.tags,
                frecuencia: datos.frecuencia,
                diasInactividad: 0,
                racha: 0,
                historialCompletados: [],
                ultimoCompletado: undefined,
                fechaCreacion: hoy
            };

            setHabitos(prev => [...prev, nuevoHabito]);
            setModalCrearHabitoAbierto(false);
            mostrarMensaje(`Habito "${datos.nombre}" creado`, 'exito');
        },
        [setHabitos, mostrarMensaje]
    );

    /*
     * Edita un habito existente
     * Mantiene los datos que no se modifican (racha, historial, etc)
     */
    const editarHabito = useCallback(
        (id: number, datos: DatosNuevoHabito) => {
            const habitoAnterior = habitos.find(h => h.id === id);
            if (!habitoAnterior) return;

            setHabitos(prev =>
                prev.map(h => {
                    if (h.id !== id) return h;
                    return {
                        ...h,
                        nombre: datos.nombre,
                        importancia: datos.importancia,
                        tags: datos.tags,
                        frecuencia: datos.frecuencia
                    };
                })
            );

            setHabitoEditando(null);
            mostrarMensaje(`Habito "${datos.nombre}" actualizado`, 'exito');

            registrarAccion(`"${datos.nombre}" editado`, () => {
                setHabitos(prev => prev.map(h => (h.id === id ? habitoAnterior : h)));
            });
        },
        [habitos, setHabitos, mostrarMensaje, registrarAccion]
    );

    /*
     * Elimina un habito
     * Registra accion para poder deshacer
     */
    const eliminarHabito = useCallback(
        (id: number) => {
            const habitoEliminado = habitos.find(h => h.id === id);
            if (!habitoEliminado) return;

            setHabitos(prev => prev.filter(h => h.id !== id));
            setHabitoEditando(null);
            mostrarMensaje(`Habito "${habitoEliminado.nombre}" eliminado`, 'exito');

            registrarAccion(`"${habitoEliminado.nombre}" eliminado`, () => {
                setHabitos(prev => [...prev, habitoEliminado]);
            });
        },
        [habitos, setHabitos, mostrarMensaje, registrarAccion]
    );

    /*
     * Toggle de habito: completa o desmarca segun estado actual
     * Registra accion para deshacer
     */
    const toggleHabito = useCallback(
        (id: number) => {
            const hoy = obtenerFechaHoy();
            const habito = habitos.find(h => h.id === id);

            if (!habito) return;

            const estabaCompletadoHoy = fueCompletadoHoy(habito.ultimoCompletado);

            if (estabaCompletadoHoy) {
                /* Desmarcar: remover del historial y restaurar estado anterior */
                const estadoAnterior = {...habito};

                setHabitos(prev =>
                    prev.map(h => {
                        if (h.id !== id) return h;

                        /* Remover la fecha de hoy del historial */
                        const historialSinHoy = (h.historialCompletados || []).filter(f => f !== hoy);
                        const ultimoAnterior = historialSinHoy.length > 0 ? historialSinHoy[historialSinHoy.length - 1] : undefined;

                        /* Si no hay historial previo, usar fechaCreacion */
                        const diasInactividadCalculado = ultimoAnterior ? calcularDiasDesde(ultimoAnterior) : calcularDiasDesde(h.fechaCreacion);

                        return {
                            ...h,
                            diasInactividad: diasInactividadCalculado,
                            racha: Math.max(0, h.racha - 1),
                            ultimoCompletado: ultimoAnterior,
                            historialCompletados: historialSinHoy
                        };
                    })
                );

                registrarAccion(`"${habito.nombre}" desmarcado`, () => {
                    setHabitos(prev => prev.map(h => (h.id === id ? estadoAnterior : h)));
                });
            } else {
                /* Completar: marcar como completado hoy */
                const estadoAnterior = {...habito};
                const diasDesdeUltimo = calcularDiasDesde(habito.ultimoCompletado);
                const nuevaRacha = diasDesdeUltimo <= 1 ? habito.racha + 1 : 1;
                const nuevoHistorial = [...(habito.historialCompletados || []), hoy].slice(-365);

                setHabitos(prev =>
                    prev.map(h => {
                        if (h.id !== id) return h;
                        return {
                            ...h,
                            diasInactividad: 0,
                            racha: nuevaRacha,
                            ultimoCompletado: hoy,
                            historialCompletados: nuevoHistorial
                        };
                    })
                );

                registrarAccion(`"${habito.nombre}" completado`, () => {
                    setHabitos(prev => prev.map(h => (h.id === id ? estadoAnterior : h)));
                });
            }
        },
        [habitos, setHabitos, registrarAccion]
    );

    const exportarTodosDatos = useCallback(() => {
        try {
            exportarDatos(habitos, tareas, notas, proyectos);
            mostrarMensaje('Datos exportados correctamente', 'exito');
        } catch (error) {
            mostrarMensaje('Error al exportar datos', 'error');
        }
    }, [habitos, tareas, notas, proyectos, mostrarMensaje]);

    const importarTodosDatos = useCallback(
        async (archivo: File) => {
            setImportando(true);
            try {
                const datos = await importarDatos(archivo);
                setHabitos(datos.habitos);
                setTareas(datos.tareas);
                if (datos.proyectos) setProyectos(datos.proyectos);
                setNotas(datos.notas || '');
                mostrarMensaje(`Datos restaurados (${datos.habitos.length} habitos, ${datos.tareas.length} tareas, ${datos.proyectos?.length || 0} proyectos)`, 'exito');
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                mostrarMensaje(mensaje, 'error');
            } finally {
                setImportando(false);
            }
        },
        [mostrarMensaje, setHabitos, setTareas, setProyectos, setNotas]
    );

    return {
        habitos,
        tareas,
        proyectos,
        notas,
        toggleTarea,
        crearTarea,
        editarTarea,
        eliminarTarea,
        crearProyecto,
        editarProyecto,
        eliminarProyecto,
        cambiarEstadoProyecto,
        actualizarNotas,
        toggleHabito,
        crearHabito,
        editarHabito,
        eliminarHabito,
        modalCrearHabitoAbierto,
        abrirModalCrearHabito,
        cerrarModalCrearHabito,
        /* Modal de edicion */
        habitoEditando,
        abrirModalEditarHabito,
        cerrarModalEditarHabito,
        exportarTodosDatos,
        importarTodosDatos,
        importando,
        mensajeEstado,
        tipoMensaje,
        cargandoDatos,
        /* Sistema de deshacer */
        accionDeshacer: accionActual
            ? {
                  mensaje: accionActual.mensaje,
                  tiempoRestante
              }
            : null,
        ejecutarDeshacer,
        descartarDeshacer,
        reordenarTareas,
        /* Sincronización */
        sincronizacion: {
            sincronizado: estadoSync.sincronizado,
            pendiente: estadoSync.pendiente,
            error: estadoSync.error,
            estaLogueado,
            sincronizarAhora
        }
    };
}
