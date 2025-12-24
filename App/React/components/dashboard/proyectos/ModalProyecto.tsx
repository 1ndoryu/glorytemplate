/*
 * ModalProyecto
 * Modal para crear/editar un proyecto con auto-guardado
 * Maneja su propio Modal interno (similar a PanelConfiguracionTarea)
 *
 * Auto-guardado: al cerrar (overlay, ESC, X)
 * Cancelar: descarta cambios y cierra
 */

import {useState, useCallback, useEffect, useRef} from 'react';
import type {NivelPrioridad, NivelUrgencia, Proyecto} from '../../../types/dashboard';
import type {DatosNuevoProyecto} from '../../../hooks/useProyectos';
import {AccionesFormulario, Modal, CampoTexto, CampoPrioridad, CampoUrgencia, CampoFechaLimite} from '../../shared';

interface ModalProyectoProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (datos: DatosNuevoProyecto) => void;
    onEliminar?: () => void;
    proyecto?: Proyecto;
}

export function ModalProyecto({estaAbierto, onCerrar, onGuardar, onEliminar, proyecto}: ModalProyectoProps): JSX.Element | null {
    const modoEdicion = !!proyecto;

    /* Estado local para edicion */
    const [nombre, setNombre] = useState(proyecto?.nombre || '');
    const [descripcion, setDescripcion] = useState(proyecto?.descripcion || '');
    const [prioridad, setPrioridad] = useState<NivelPrioridad>(proyecto?.prioridad || 'media');
    const [urgencia, setUrgencia] = useState<NivelUrgencia | null>(proyecto?.urgencia || null);
    const [fechaLimite, setFechaLimite] = useState(proyecto?.fechaLimite || '');
    const [errores, setErrores] = useState<{nombre?: string}>({});

    /* Referencia al estado inicial para detectar cambios */
    const estadoInicialRef = useRef<{
        nombre: string;
        descripcion: string;
        prioridad: NivelPrioridad;
        urgencia: NivelUrgencia | null;
        fechaLimite: string;
    } | null>(null);

    /* Sincronizar estado cuando cambia el proyecto */
    useEffect(() => {
        if (proyecto) {
            setNombre(proyecto.nombre);
            setDescripcion(proyecto.descripcion || '');
            setPrioridad(proyecto.prioridad);
            setUrgencia(proyecto.urgencia || null);
            setFechaLimite(proyecto.fechaLimite || '');

            /* Guardar estado inicial para detección de cambios */
            estadoInicialRef.current = {
                nombre: proyecto.nombre,
                descripcion: proyecto.descripcion || '',
                prioridad: proyecto.prioridad,
                urgencia: proyecto.urgencia || null,
                fechaLimite: proyecto.fechaLimite || ''
            };
        } else {
            /* Resetear si no hay proyecto (modo creacion) */
            setNombre('');
            setDescripcion('');
            setPrioridad('media');
            setUrgencia(null);
            setFechaLimite('');
            estadoInicialRef.current = null;
        }
        setErrores({});
    }, [proyecto?.id, estaAbierto]);

    /* Detectar si hubo cambios respecto al estado inicial */
    const hayCambios = useCallback((): boolean => {
        const inicial = estadoInicialRef.current;

        /* Si es modo creación, hay cambios si hay nombre */
        if (!inicial) {
            return nombre.trim().length >= 3;
        }

        /* Comparar cada campo */
        if (nombre.trim() !== inicial.nombre) return true;
        if (descripcion.trim() !== inicial.descripcion) return true;
        if (prioridad !== inicial.prioridad) return true;
        if (urgencia !== inicial.urgencia) return true;
        if (fechaLimite !== inicial.fechaLimite) return true;

        return false;
    }, [nombre, descripcion, prioridad, urgencia, fechaLimite]);

    const validarFormulario = useCallback((): boolean => {
        const nuevosErrores: {nombre?: string} = {};

        if (!nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio';
        } else if (nombre.trim().length < 3) {
            nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    }, [nombre]);

    const manejarGuardar = useCallback(() => {
        if (!validarFormulario()) return;

        onGuardar({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            prioridad,
            urgencia: urgencia || undefined,
            fechaLimite: fechaLimite || undefined
        });
        onCerrar();
    }, [nombre, descripcion, prioridad, urgencia, fechaLimite, validarFormulario, onGuardar, onCerrar]);

    /* Auto-guardado: al cerrar el modal, guardar solo si hay cambios */
    const manejarCerrarConGuardado = useCallback(() => {
        if (hayCambios() && nombre.trim().length >= 3) {
            manejarGuardar();
        } else {
            onCerrar();
        }
    }, [hayCambios, nombre, manejarGuardar, onCerrar]);

    /* Cancelar: cerrar sin guardar (descartar cambios) */
    const manejarCancelar = useCallback(() => {
        onCerrar();
    }, [onCerrar]);

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={manejarCerrarConGuardado} titulo={modoEdicion ? 'Editar Proyecto' : 'Nuevo Proyecto'}>
            <div id="modal-proyecto-contenido" className="formularioHabito">
                {/* Campo Nombre - Campo reutilizable */}
                <CampoTexto id="proyecto-nombre" titulo="Nombre del proyecto" valor={nombre} onChange={setNombre} placeholder="Ej: Lanzar Web Personal" error={errores.nombre} autoFocus />

                {/* Campo Descripcion - Campo reutilizable */}
                <CampoTexto id="proyecto-descripcion" titulo="Descripcion (opcional)" valor={descripcion} onChange={setDescripcion} placeholder="Describe brevemente el objetivo del proyecto..." tipo="textarea" filas={3} />

                {/* Campo Prioridad - Campo reutilizable */}
                <CampoPrioridad<NivelPrioridad> tipo="prioridad" valor={prioridad} onChange={val => setPrioridad(val || 'media')} permitirNulo={false} />

                {/* Campo Urgencia - Campo reutilizable */}
                <CampoUrgencia valor={urgencia} onChange={setUrgencia} permitirNulo={true} />

                {/* Campo Fecha Limite - Campo reutilizable */}
                <CampoFechaLimite titulo="Fecha limite (opcional)" valor={fechaLimite} onChange={setFechaLimite} mostrarBotonLimpiar={true} />
            </div>

            {/* Acciones */}
            <AccionesFormulario onCancelar={manejarCancelar} onGuardar={manejarGuardar} textoGuardar={modoEdicion ? 'Guardar cambios' : 'Crear proyecto'} onEliminar={modoEdicion && onEliminar ? onEliminar : undefined} textoEliminar="Eliminar proyecto" />
        </Modal>
    );
}
