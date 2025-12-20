/*
 * useDashboard
 * Hook personalizado para la logica del dashboard
 * Responsabilidad unica: manejar estado y acciones del dashboard
 * Incluye persistencia automatica en localStorage
 */

import {useState, useCallback, useEffect, useRef} from 'react';
import type {Habito, Tarea, ConfiguracionDashboard, DatosNuevoHabito, DatosNuevaTarea} from '../types/dashboard';
import {exportarDatos, importarDatos} from '../services/dataService';
import {useLocalStorage, CLAVES_LOCALSTORAGE} from './useLocalStorage';
import {useDeshacer} from './useDeshacer';

/* Utilidades extraidas a modulos separados */
import {obtenerFechaHoy, calcularDiasDesde, fueCompletadoHoy} from '../utils/fecha';
import {validarHabitos, validarTareas, validarNotas} from '../utils/validadores';
import {migrarYActualizarHabitos} from '../utils/migracionHabitos';
import {habitosIniciales, tareasIniciales, notasIniciales} from '../data/datosIniciales';

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
    crearTarea: (datos: DatosNuevaTarea) => void;
    editarTarea: (id: number, datos: DatosNuevaTarea) => void;
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

    const cargandoDatos = cargandoHabitos || cargandoTareas || cargandoNotas;

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
     * Toggle de tarea: completa o desmarca con soporte de deshacer
     */
    const toggleTarea = useCallback(
        (id: number) => {
            const tarea = tareas.find(t => t.id === id);
            if (!tarea) return;

            const estadoAnterior = tarea.completado;
            const accion = estadoAnterior ? 'pendiente' : 'completada';

            setTareas(prev => prev.map(t => (t.id === id ? {...t, completado: !t.completado} : t)));

            registrarAccion(`Tarea "${tarea.texto.substring(0, 30)}..." ${accion}`, () => {
                setTareas(prev => prev.map(t => (t.id === id ? {...t, completado: estadoAnterior} : t)));
            });
        },
        [tareas, setTareas, registrarAccion]
    );

    /*
     * Crear una nueva tarea
     */
    const crearTarea = useCallback(
        (datos: DatosNuevaTarea) => {
            const hoy = obtenerFechaHoy();
            const nuevaTarea: Tarea = {
                id: Date.now(),
                texto: datos.texto,
                completado: false,
                fechaCreacion: hoy
            };

            setTareas(prev => [nuevaTarea, ...prev]);
            mostrarMensaje(`Tarea creada`, 'exito');

            registrarAccion(`Tarea creada`, () => {
                setTareas(prev => prev.filter(t => t.id !== nuevaTarea.id));
            });
        },
        [setTareas, mostrarMensaje, registrarAccion]
    );

    /*
     * Eliminar una tarea con soporte de deshacer
     */
    const eliminarTarea = useCallback(
        (id: number) => {
            const tareaEliminada = tareas.find(t => t.id === id);
            if (!tareaEliminada) return;

            /* Guardar indice original para restaurar en la misma posicion */
            const indiceOriginal = tareas.findIndex(t => t.id === id);

            setTareas(prev => prev.filter(t => t.id !== id));
            mostrarMensaje(`Tarea eliminada`, 'exito');

            registrarAccion(`Tarea eliminada`, () => {
                setTareas(prev => {
                    const nuevaLista = [...prev];
                    nuevaLista.splice(indiceOriginal, 0, tareaEliminada);
                    return nuevaLista;
                });
            });
        },
        [tareas, setTareas, mostrarMensaje, registrarAccion]
    );

    /*
     * Editar una tarea existente con soporte de deshacer
     */
    const editarTarea = useCallback(
        (id: number, datos: DatosNuevaTarea) => {
            const tareaAnterior = tareas.find(t => t.id === id);
            if (!tareaAnterior) return;

            setTareas(prev =>
                prev.map(t => {
                    if (t.id !== id) return t;
                    return {
                        ...t,
                        texto: datos.texto
                    };
                })
            );

            mostrarMensaje(`Tarea actualizada`, 'exito');

            registrarAccion(`Tarea editada`, () => {
                setTareas(prev => prev.map(t => (t.id === id ? tareaAnterior : t)));
            });
        },
        [tareas, setTareas, mostrarMensaje, registrarAccion]
    );

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
            exportarDatos(habitos, tareas, notas);
            mostrarMensaje('Datos exportados correctamente', 'exito');
        } catch (error) {
            mostrarMensaje('Error al exportar datos', 'error');
        }
    }, [habitos, tareas, notas, mostrarMensaje]);

    const importarTodosDatos = useCallback(
        async (archivo: File) => {
            setImportando(true);
            try {
                const datos = await importarDatos(archivo);
                setHabitos(datos.habitos);
                setTareas(datos.tareas);
                setNotas(datos.notas);
                mostrarMensaje(`Datos restaurados (${datos.habitos.length} habitos, ${datos.tareas.length} tareas)`, 'exito');
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                mostrarMensaje(mensaje, 'error');
            } finally {
                setImportando(false);
            }
        },
        [mostrarMensaje, setHabitos, setTareas, setNotas]
    );

    return {
        habitos,
        tareas,
        notas,
        toggleTarea,
        crearTarea,
        editarTarea,
        eliminarTarea,
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
        descartarDeshacer
    };
}
