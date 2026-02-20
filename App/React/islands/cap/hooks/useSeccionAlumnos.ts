/**
 * useSeccionAlumnos
 *
 * Hook que encapsula la logica de modales, confirmaciones y handlers
 * de la seccion de alumnos. Gestiona estados de visibilidad de modales
 * (formulario, disponibilidad, progreso) y la descarga de planes.
 */

import {useState, useCallback, useEffect, useRef} from 'react';
import type {Alumno} from '../hooks/useAlumnos';
import {useAlumnos} from '../hooks/useAlumnos';
import {useReportes} from '../hooks/useReportes';
import {useConfiguracion} from '../hooks/useConfiguracion';
import {calcularRangoHoras} from '../utils/horariosUtils';

export function useSeccionAlumnos() {
    const alumnosHook = useAlumnos();
    const {descargarPlanAlumno} = useReportes();
    const {config} = useConfiguracion();
    const rangoHoras = calcularRangoHoras(config);

    /* Estado para modal de creacion/edicion */
    const [modalVisible, setModalVisible] = useState(false);
    const [alumnoEditar, setAlumnoEditar] = useState<Alumno | null>(null);
    const [confirmandoEliminar, setConfirmandoEliminar] = useState<number | null>(null);

    /* Estado para modal de disponibilidad */
    const [modalDisponibilidadVisible, setModalDisponibilidadVisible] = useState(false);
    const [alumnoDisponibilidad, setAlumnoDisponibilidad] = useState<Alumno | null>(null);

    /* Estado para modal de progreso por asignatura */
    const [modalProgresoVisible, setModalProgresoVisible] = useState(false);
    const [alumnoProgreso, setAlumnoProgreso] = useState<Alumno | null>(null);

    /* Estado para descarga individual de plan de formacion */
    const [descargandoAlumno, setDescargandoAlumno] = useState<number | null>(null);

    /* Limpiar mensajes automaticamente despues de 4 segundos */
    useEffect(() => {
        if (alumnosHook.exito || alumnosHook.error) {
            const timer = setTimeout(alumnosHook.limpiarMensajes, 4000);
            return () => clearTimeout(timer);
        }
    }, [alumnosHook.exito, alumnosHook.error, alumnosHook.limpiarMensajes]);

    /* Ref para timer de confirmacion de eliminacion */
    const timerConfirmacionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNuevoAlumno = () => {
        setAlumnoEditar(null);
        setModalVisible(true);
    };

    const handleEditar = (alumno: Alumno) => {
        setAlumnoEditar(alumno);
        setModalVisible(true);
    };

    const handleEliminar = async (id: number) => {
        if (confirmandoEliminar !== id) {
            setConfirmandoEliminar(id);
            if (timerConfirmacionRef.current) clearTimeout(timerConfirmacionRef.current);
            timerConfirmacionRef.current = setTimeout(() => setConfirmandoEliminar(null), 3000);
            return;
        }
        setConfirmandoEliminar(null);
        await alumnosHook.eliminarAlumno(id);
    };

    const handleGuardar = async (datos: Partial<Alumno>): Promise<boolean> => {
        if (alumnoEditar) {
            return await alumnosHook.actualizarAlumno(alumnoEditar.id, datos);
        }
        return await alumnosHook.crearAlumno(datos);
    };

    const handleCerrarModal = () => {
        setModalVisible(false);
        setAlumnoEditar(null);
    };

    const handleAbrirDisponibilidad = (alumno: Alumno) => {
        setAlumnoDisponibilidad(alumno);
        setModalDisponibilidadVisible(true);
    };

    const handleCerrarDisponibilidad = () => {
        setModalDisponibilidadVisible(false);
        setAlumnoDisponibilidad(null);
    };

    const handleVerProgreso = (alumno: Alumno) => {
        setAlumnoProgreso(alumno);
        setModalProgresoVisible(true);
    };

    const handleCerrarProgreso = () => {
        setModalProgresoVisible(false);
        setAlumnoProgreso(null);
    };

    const handleDescargarPlan = useCallback(async (alumno: Alumno) => {
        setDescargandoAlumno(alumno.id);
        try {
            await descargarPlanAlumno(alumno.id, alumno.nombre);
        } finally {
            setDescargandoAlumno(null);
        }
    }, [descargarPlanAlumno]);

    return {
        /* Datos de alumnos */
        ...alumnosHook,
        rangoHoras,
        /* Modales */
        modalVisible, alumnoEditar, confirmandoEliminar,
        modalDisponibilidadVisible, alumnoDisponibilidad,
        modalProgresoVisible, alumnoProgreso,
        descargandoAlumno,
        /* Handlers */
        handleNuevoAlumno, handleEditar, handleEliminar, handleGuardar, handleCerrarModal,
        handleAbrirDisponibilidad, handleCerrarDisponibilidad,
        handleVerProgreso, handleCerrarProgreso,
        handleDescargarPlan,
    };
}
