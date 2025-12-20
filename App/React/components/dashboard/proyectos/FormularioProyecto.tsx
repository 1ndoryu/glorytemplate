/*
 * FormularioProyecto
 * Formulario para crear/editar un proyecto
 * Responsabilidad unica: capturar datos del proyecto con validacion
 */

import {useState, useCallback} from 'react';
import type {NivelPrioridad} from '../../../types/dashboard';
import type {DatosNuevoProyecto} from '../../../hooks/useProyectos';
import {AccionesFormulario, SeccionPanel, SelectorNivel} from '../../shared';

interface FormularioProyectoProps {
    onGuardar: (datos: DatosNuevoProyecto) => void;
    onCancelar: () => void;
    onEliminar?: () => void;
    datosIniciales?: DatosNuevoProyecto;
    guardando?: boolean;
    modoEdicion?: boolean;
}

const PRIORIDADES: NivelPrioridad[] = ['alta', 'media', 'baja'];

export function FormularioProyecto({onGuardar, onCancelar, onEliminar, datosIniciales, guardando = false, modoEdicion = false}: FormularioProyectoProps): JSX.Element {
    const [nombre, setNombre] = useState(datosIniciales?.nombre || '');
    const [descripcion, setDescripcion] = useState(datosIniciales?.descripcion || '');
    const [prioridad, setPrioridad] = useState<NivelPrioridad>(datosIniciales?.prioridad || 'media');
    const [fechaLimite, setFechaLimite] = useState(datosIniciales?.fechaLimite || '');
    const [errores, setErrores] = useState<{nombre?: string}>({});

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

    const manejarSubmit = (evento: React.FormEvent) => {
        evento.preventDefault();

        if (!validarFormulario()) return;

        onGuardar({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            prioridad,
            fechaLimite: fechaLimite || undefined
        });
    };

    return (
        <form id="formulario-proyecto" className="formularioHabito" onSubmit={manejarSubmit}>
            {/* Campo Nombre */}
            <SeccionPanel titulo="Nombre del proyecto">
                <input id="proyecto-nombre" type="text" className={`formularioInput ${errores.nombre ? 'formularioInputError' : ''}`} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Lanzar Web Personal" autoFocus disabled={guardando} />
                {errores.nombre && <span className="formularioMensajeError">{errores.nombre}</span>}
            </SeccionPanel>

            {/* Campo Descripcion */}
            <SeccionPanel titulo="Descripcion (opcional)">
                <textarea id="proyecto-descripcion" className="formularioInput formularioTextarea" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe brevemente el objetivo del proyecto..." rows={3} disabled={guardando} />
            </SeccionPanel>

            {/* Campo Prioridad */}
            <SeccionPanel titulo="Prioridad">
                <SelectorNivel<NivelPrioridad> niveles={PRIORIDADES} seleccionado={prioridad} onSeleccionar={setPrioridad} disabled={guardando} />
            </SeccionPanel>

            {/* Campo Fecha Limite */}
            <SeccionPanel titulo="Fecha limite (opcional)">
                <input id="proyecto-fecha-limite" type="date" className="formularioInput" value={fechaLimite} onChange={e => setFechaLimite(e.target.value)} disabled={guardando} />
            </SeccionPanel>

            {/* Acciones */}
            <AccionesFormulario onCancelar={onCancelar} textoGuardar={modoEdicion ? 'Guardar cambios' : 'Crear proyecto'} guardando={guardando} onEliminar={modoEdicion && onEliminar ? onEliminar : undefined} textoEliminar="Eliminar proyecto" />
        </form>
    );
}
