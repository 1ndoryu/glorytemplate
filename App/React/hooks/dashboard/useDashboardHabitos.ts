import {useState, useCallback, useMemo} from 'react';
import {useHabitosStore} from '../../stores/habitosStore';
import {migrarYActualizarHabitos} from '../../utils/migracionHabitos';
import type {Habito, ConfiguracionDashboard, DatosNuevoHabito} from '../../types/dashboard';

const CONFIGURACION_POR_DEFECTO: ConfiguracionDashboard = {
    umbralReseteoRacha: 7,
    diasAdvertenciaRacha: 2
};

interface UseDashboardHabitosProps {
    registrarAccion: (mensaje: string, accionDeshacer: () => void) => void;
    mostrarMensaje: (mensaje: string, tipo: 'exito' | 'error') => void;
}

export function useDashboardHabitos({registrarAccion, mostrarMensaje}: UseDashboardHabitosProps) {
    const habitosRaw = useHabitosStore(state => state.habitos);
    const storeToggleHabito = useHabitosStore(state => state.toggleHabito);
    const storePosponerHabito = useHabitosStore(state => state.posponerHabito);
    const storePosponerHabitoConTiempo = useHabitosStore(state => state.posponerHabitoConTiempo);
    const storePausarHabito = useHabitosStore(state => state.pausarHabito);
    const storeCrearHabito = useHabitosStore(state => state.crearHabito);
    const storeEditarHabito = useHabitosStore(state => state.editarHabito);
    const storeEliminarHabito = useHabitosStore(state => state.eliminarHabito);
    const storeActualizarHistorial = useHabitosStore(state => state.actualizarHistorialHabito);
    const storeActualizarOrdenTareasHabito = useHabitosStore(state => state.actualizarOrdenTareasHabito);
    const storeRestaurarHabito = useHabitosStore(state => state.restaurarHabito);
    const storeReordenarHabitos = useHabitosStore(state => state.reordenarHabitos);
    const storeInicializado = useHabitosStore(state => state.inicializado);

    /* Flag de cargando para hábitos desde store */
    const cargandoHabitos = !storeInicializado;

    /* Habitos migrados, con dias de inactividad actualizados y rachas reseteadas si aplica */
    const habitos = useMemo(() => migrarYActualizarHabitos(habitosRaw, CONFIGURACION_POR_DEFECTO), [habitosRaw]);

    const [modalCrearHabitoAbierto, setModalCrearHabitoAbierto] = useState(false);
    /*
     * Guardamos solo el ID del hábito editando, no una copia del objeto.
     * Esto permite que cuando el store se actualice (ej: al pausar),
     * el hábito derivado siempre refleje el estado actual del store.
     */
    const [habitoEditandoId, setHabitoEditandoId] = useState<number | null>(null);

    /* Derivar el hábito editando del array de hábitos actual (reactivo al store) */
    const habitoEditando = useMemo(() => {
        if (habitoEditandoId === null) return null;
        return habitos.find(h => h.id === habitoEditandoId) ?? null;
    }, [habitos, habitoEditandoId]);

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
        setHabitoEditandoId(habito.id);
    }, []);

    const cerrarModalEditarHabito = useCallback(() => {
        setHabitoEditandoId(null);
    }, []);

    /*
     * Crea un nuevo habito usando el store de Zustand
     */
    const crearHabito = useCallback(
        (datos: DatosNuevoHabito) => {
            storeCrearHabito(datos);
            setModalCrearHabitoAbierto(false);
            mostrarMensaje(`Habito "${datos.nombre}" creado`, 'exito');
        },
        [storeCrearHabito, mostrarMensaje]
    );

    /*
     * Edita un habito existente usando el store de Zustand
     * Solo guarda y registra acción si hubo cambios reales
     */
    const editarHabito = useCallback(
        (id: number, datos: DatosNuevoHabito) => {
            const habitoAnterior = habitos.find(h => h.id === id);
            if (!habitoAnterior) return;

            /* Verificar si hubo cambios reales comparando campos relevantes */
            /* Normalizamos valores para evitar falsos positivos (undefined vs '') */
            const descripcionAnterior = habitoAnterior.descripcion || '';
            const descripcionNueva = datos.descripcion || '';
            const iconoAnterior = habitoAnterior.icono || 'check-circle';
            const iconoNuevo = datos.icono || 'check-circle';
            const colorAnterior = habitoAnterior.colorIcono || '#888888';
            const colorNuevo = datos.colorIcono || '#888888';

            /* Normalizamos frecuencia (puede ser undefined en hábitos antiguos) */
            const frecuenciaAnterior = habitoAnterior.frecuencia || {tipo: 'diario'};
            const frecuenciaNueva = datos.frecuencia || {tipo: 'diario'};

            /* TAREA 4: Comparar ventana de oportunidad */
            const ventanaAnterior = habitoAnterior.ventanaOportunidad;
            const ventanaNueva = datos.ventanaOportunidad;

            const huboCambios = habitoAnterior.nombre !== datos.nombre || habitoAnterior.importancia !== datos.importancia || descripcionAnterior !== descripcionNueva || iconoAnterior !== iconoNuevo || colorAnterior !== colorNuevo || JSON.stringify(frecuenciaAnterior) !== JSON.stringify(frecuenciaNueva) || JSON.stringify(ventanaAnterior) !== JSON.stringify(ventanaNueva);

            /* Si no hubo cambios, solo cerrar el modal sin guardar ni registrar acción */
            if (!huboCambios) {
                setHabitoEditandoId(null);
                return;
            }

            storeEditarHabito(id, datos);
            setHabitoEditandoId(null);
            mostrarMensaje(`Habito "${datos.nombre}" actualizado`, 'exito');

            registrarAccion(`"${datos.nombre}" editado`, () => {
                storeRestaurarHabito(habitoAnterior);
            });
        },
        [habitos, storeEditarHabito, storeRestaurarHabito, mostrarMensaje, registrarAccion]
    );

    /*
     * Elimina un habito usando el store de Zustand
     */
    const eliminarHabito = useCallback(
        (id: number) => {
            const habitoEliminado = storeEliminarHabito(id);
            if (!habitoEliminado) return;

            setHabitoEditandoId(null);
            mostrarMensaje(`Habito "${habitoEliminado.nombre}" eliminado`, 'exito');

            registrarAccion(`"${habitoEliminado.nombre}" eliminado`, () => {
                storeRestaurarHabito(habitoEliminado);
            });
        },
        [storeEliminarHabito, storeRestaurarHabito, mostrarMensaje, registrarAccion]
    );

    /*
     * Toggle de habito usando el store de Zustand
     */
    const toggleHabito = useCallback(
        (id: number) => {
            const resultado = storeToggleHabito(id);
            if (!resultado) return;

            const {accion, estadoAnterior} = resultado;
            const mensaje = accion === 'completado' ? `"${estadoAnterior.nombre}" completado` : `"${estadoAnterior.nombre}" desmarcado`;

            registrarAccion(mensaje, () => {
                storeRestaurarHabito(estadoAnterior);
            });
        },
        [storeToggleHabito, storeRestaurarHabito, registrarAccion]
    );

    /*
     * Posponer hábito usando el store de Zustand
     */
    const posponerHabito = useCallback(
        (id: number) => {
            const resultado = storePosponerHabito(id);
            if (!resultado) return;

            const {accion, estadoAnterior} = resultado;

            if (accion === 'pospuesto') {
                mostrarMensaje(`"${estadoAnterior.nombre}" pospuesto para hoy`, 'exito');
            }

            const mensaje = accion === 'pospuesto' ? `"${estadoAnterior.nombre}" pospuesto` : `"${estadoAnterior.nombre}" ya no está pospuesto`;

            registrarAccion(mensaje, () => {
                storeRestaurarHabito(estadoAnterior);
            });
        },
        [storePosponerHabito, storeRestaurarHabito, registrarAccion, mostrarMensaje]
    );

    /* [2303A-41] Posponer hábito por tiempo (con fecha ISO) */
    const posponerHabitoConTiempo = useCallback(
        (id: number, hasta: string | null) => {
            const habito = habitos.find(h => h.id === id);
            if (!habito) return;

            /* Guardar snapshot para undo */
            const habitoAnterior = {...habito, historialPospuestos: [...(habito.historialPospuestos || [])]};

            storePosponerHabitoConTiempo(id, hasta);
            if (hasta) {
                mostrarMensaje(`"${habito.nombre}" pospuesto`, 'exito');
            } else {
                mostrarMensaje(`"${habito.nombre}" ya no está pospuesto`, 'exito');
            }

            registrarAccion(`"${habito.nombre}" ${hasta ? 'pospuesto' : 'reanudado'}`, () => {
                storeRestaurarHabito(habitoAnterior);
            });
        },
        [habitos, storePosponerHabitoConTiempo, storeRestaurarHabito, mostrarMensaje, registrarAccion]
    );

    /*
     * Pausar/Reanudar hábito usando el store de Zustand
     */
    const pausarHabito = useCallback(
        (id: number) => {
            const resultado = storePausarHabito(id);
            if (!resultado) return;

            const {accion, estadoAnterior} = resultado;

            if (accion === 'pausado') {
                mostrarMensaje(`"${estadoAnterior.nombre}" pausado`, 'exito');
            } else {
                mostrarMensaje(`"${estadoAnterior.nombre}" reanudado`, 'exito');
            }

            const mensaje = accion === 'pausado' ? `"${estadoAnterior.nombre}" pausado` : `"${estadoAnterior.nombre}" reanudado`;

            registrarAccion(mensaje, () => {
                storeRestaurarHabito(estadoAnterior);
            });
        },
        [storePausarHabito, storeRestaurarHabito, registrarAccion, mostrarMensaje]
    );

    /*
     * Actualizar historial de hábito usando el store de Zustand
     */
    const actualizarHistorialHabito = useCallback(
        (id: number, fecha: string, estado: 'completado' | 'pospuesto' | null) => {
            storeActualizarHistorial(id, fecha, estado);
        },
        [storeActualizarHistorial]
    );

    /*
     * Actualizar orden de tareas del hábito - Fase 14.8
     * Delega al store de Zustand
     */
    const actualizarOrdenTareasHabito = useCallback(
        (habitoId: number, tareasIds: number[]) => {
            storeActualizarOrdenTareasHabito(habitoId, tareasIds);
        },
        [storeActualizarOrdenTareasHabito]
    );

    /*
     * Estado del modal de editar subhábito
     * [217A-2c] Unificado con ModalHabito: cuando se edita un subhábito,
     * habitoEditandoId = hábito padre, subHabitoEditandoId = subhábito.
     * ModalHabito recibe ambos y opera en modo subhábito.
     */
    const [subHabitoEditandoId, setSubHabitoEditandoId] = useState<number | null>(null);

    const subHabitoEditando = useMemo(() => {
        if (subHabitoEditandoId === null || habitoEditandoId === null) return null;
        const padre = habitos.find(h => h.id === habitoEditandoId);
        if (!padre) return null;
        return padre.subhabitos?.find(sh => sh.id === subHabitoEditandoId) ?? null;
    }, [habitos, habitoEditandoId, subHabitoEditandoId]);

    const abrirModalEditarSubHabito = useCallback((habitoId: number, subHabitoId: number) => {
        setHabitoEditandoId(habitoId);
        setSubHabitoEditandoId(subHabitoId);
    }, []);

    const cerrarModalEditarSubHabito = useCallback(() => {
        setHabitoEditandoId(null);
        setSubHabitoEditandoId(null);
    }, []);

    /* [217A-4] Posponer subhábito por tiempo — con mensaje y undo.
     * Guardamos el subhábito anterior antes de modificarlo para poder restaurar. */
    const storePosponerSubHabitoConTiempo = useHabitosStore(state => state.posponerSubHabitoConTiempo);
    const posponerSubHabitoConTiempo = useCallback(
        (habitoId: number, subHabitoId: number, hasta: string | null) => {
            const padre = habitos.find(h => h.id === habitoId);
            const subAnterior = padre?.subhabitos?.find(sh => sh.id === subHabitoId);
            if (!subAnterior || !padre) return;

            /* Guardar snapshot completo del padre para undo */
            const padreAnterior = {...padre};

            storePosponerSubHabitoConTiempo(habitoId, subHabitoId, hasta);

            if (hasta) {
                mostrarMensaje(`"${subAnterior.nombre}" pospuesto`, 'exito');
            } else {
                mostrarMensaje(`"${subAnterior.nombre}" ya no está pospuesto`, 'exito');
            }

            registrarAccion(`"${subAnterior.nombre}" ${hasta ? 'pospuesto' : 'reanudado'}`, () => {
                storeRestaurarHabito(padreAnterior);
            });
        },
        [habitos, storePosponerSubHabitoConTiempo, storeRestaurarHabito, mostrarMensaje, registrarAccion]
    );

    return {
        habitos,
        cargandoHabitos,
        /* Acciones */
        toggleHabito,
        posponerHabito,
        posponerHabitoConTiempo,
        pausarHabito,
        actualizarHistorialHabito,
        actualizarOrdenTareasHabito,
        crearHabito,
        editarHabito,
        eliminarHabito,
        /* Estado de Modales */
        modalCrearHabitoAbierto,
        abrirModalCrearHabito,
        cerrarModalCrearHabito,
        habitoEditando,
        abrirModalEditarHabito,
        cerrarModalEditarHabito,
        /* Modal subhábito [217A-2c: unificado con ModalHabito] */
        subHabitoEditando,
        abrirModalEditarSubHabito,
        cerrarModalEditarSubHabito,
        posponerSubHabitoConTiempo,
        /* [218A-1] Reordenar hábitos (drag & drop manual) */
        reordenarHabitos: storeReordenarHabitos,
        /* Utilidades de sistema */
        setHabitos: useHabitosStore.getState().setHabitos
    };
}
