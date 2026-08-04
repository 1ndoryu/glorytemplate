/*
 * FormularioTareaModerno
 * Formulario con el nuevo diseno estilo Linear para tareas
 * Usado dentro de PanelConfiguracionTarea para la entrada de datos
 *
 * Fase 9.4: Layout moderno con titulo limpio, propiedades compactas
 * Reutiliza componentes de Fase 9.2 (CampoTituloLimpio, PropiedadesCompactas, etc.)
 */

import {useState, useMemo} from 'react';
import type {NivelPrioridad, NivelUrgencia, Participante, Proyecto, Adjunto, FrecuenciaHabito, CompaneroEquipo, RolCompartido, Tarea, DatosEdicionTarea} from '../../../types/dashboard';
import {useGruposEjecucion} from '../../../hooks/useGruposEjecucion';
import {CampoTituloLimpio, CampoSubtituloLimpio, PropiedadesCompactas, SelectorEstadoPill, SelectorProyectoPill, SelectorRepeticionPill, FilaPropiedades, SelectorTags, SeccionResponsables, SelectorGrupo} from '../../shared';
import {Boton} from '../../ui';
import {SeccionAdjuntos} from '../SeccionAdjuntos';
import {SelectorAsignado} from '../../compartidos/SelectorAsignado';
import {ModalDependencias} from '../ModalDependencias';

interface FormularioTareaModernoProps {
    /* Campos principales */
    texto: string;
    onTextoChange: (valor: string) => void;
    descripcion: string;
    onDescripcionChange: (valor: string) => void;
    /* Estado de la tarea */
    completado: boolean;
    onCompletadoChange?: (valor: boolean) => void;
    /* Propiedades */
    prioridad: NivelPrioridad | null;
    onPrioridadChange: (valor: NivelPrioridad) => void;
    urgencia: NivelUrgencia | null;
    onUrgenciaChange: (valor: NivelUrgencia | null) => void;
    fechaLimite: string;
    onFechaLimiteChange: (valor: string) => void;
    /* Proyecto */
    proyectoId?: number;
    proyectos?: Proyecto[];
    onProyectoChange?: (proyectoId: number | undefined) => void;
    /* Repeticion */
    tieneRepeticion: boolean;
    onTieneRepeticionChange: (valor: boolean) => void;
    frecuencia: FrecuenciaHabito;
    onFrecuenciaChange: (frecuencia: FrecuenciaHabito) => void;
    /* Asignacion */
    participantes?: Participante[];
    asignadoA: number | null;
    asignadoANombre: string;
    asignadoAAvatar: string;
    onAsignacionChange?: (usuarioId: number | null, nombre: string, avatar: string) => void;
    /* Compartir / Colaboradores */
    companeros?: CompaneroEquipo[];
    onAgregarParticipante?: (usuarioId: number, rol: RolCompartido) => void;
    onRemoverParticipante?: (participanteId: number) => void;
    onCambiarRolParticipante?: (participanteId: number, nuevoRol: RolCompartido) => void;
    /* Adjuntos */
    adjuntos?: Adjunto[];
    onAdjuntosChange?: (adjuntos: Adjunto[]) => void;
    /* Límites de suscripción para adjuntos */
    limiteAdjuntos?: number;
    onClickUpgrade?: () => void;
    /* Etiquetas (Fase 9.7.3) */
    tags?: string[];
    onTagsChange?: (tags: string[]) => void;
    /* Grupo de ejecución */
    grupoEjecucion?: string | null;
    onGrupoEjecucionChange?: (grupo: string | null) => void;
    /* Dependencias condicionales */
    dependencias?: import('../../../types/dashboard').ReferenciaDependencia[];
    onDependenciasChange?: (dependencias: import('../../../types/dashboard').ReferenciaDependencia[]) => void;
    tareasParaDependencias?: import('../../../types/dashboard').Tarea[];
    habitosParaDependencias?: import('../../../types/dashboard').Habito[];
    /* Subtareas */
    tareaId?: number;
    subtareas?: Tarea[];
    onCrearSubtarea?: (datos: DatosEdicionTarea) => void;
    onToggleSubtarea?: (id: number) => void;
    onEliminarSubtarea?: (id: number) => void;
    onConfigurarSubtarea?: (tarea: Tarea) => void;
    onEditarSubtarea?: (id: number, datos: DatosEdicionTarea) => void;
    /* Modo */
    modoEdicion?: boolean;
    errorTexto?: string;
    esSubtarea?: boolean;
}

import {ListaSubtareas} from './ListaSubtareas';

export function FormularioTareaModerno({texto, onTextoChange, descripcion, onDescripcionChange, completado, onCompletadoChange, prioridad, onPrioridadChange, urgencia, onUrgenciaChange, fechaLimite, onFechaLimiteChange, proyectoId, proyectos = [], onProyectoChange, tieneRepeticion, onTieneRepeticionChange, frecuencia, onFrecuenciaChange, participantes = [], asignadoA, asignadoANombre: _asignadoANombre, asignadoAAvatar: _asignadoAAvatar, onAsignacionChange, companeros = [], onAgregarParticipante, onRemoverParticipante, onCambiarRolParticipante, adjuntos = [], onAdjuntosChange, limiteAdjuntos = 0, onClickUpgrade, tags = [],        onTagsChange,
        modoEdicion = false, errorTexto, tareaId, subtareas, onCrearSubtarea, onToggleSubtarea, onEliminarSubtarea, onConfigurarSubtarea, onEditarSubtarea, esSubtarea = false,
        dependencias = [],
        onDependenciasChange,
        tareasParaDependencias = [],
        habitosParaDependencias = [],
        grupoEjecucion,
        onGrupoEjecucionChange}: FormularioTareaModernoProps): JSX.Element {    const [modalDependenciasAbierto, setModalDependenciasAbierto] = useState(false);

    /* Grupos de ejecución existentes para el selector */
    const gruposDisponibles = useGruposEjecucion(tareasParaDependencias, habitosParaDependencias);

    /* Mostrar selector de proyecto solo si hay proyectos y callback */

    const mostrarProyecto = proyectos.length > 0 && onProyectoChange;

    /* Mostrar asignacion solo si hay participantes */
    const mostrarAsignacion = participantes.length > 0 && onAsignacionChange;

    /* Handler de asignacion adaptado al formato de SelectorAsignado */
    const manejarAsignacion = (usuarioId: number | null, nombre: string, avatar: string) => {
        onAsignacionChange?.(usuarioId, nombre, avatar);
    };
    return (
        <div id="formulario-tarea-moderno" className="formularioProyectoModerno">
            {/* Titulo */}
            <CampoTituloLimpio id="tarea-nombre" valor={texto} onChange={onTextoChange} placeholder="Nombre de la tarea..." error={errorTexto} autoFocus={!modoEdicion} />

            {/* Descripcion */}
            <CampoSubtituloLimpio id="tarea-descripcion" valor={descripcion} onChange={onDescripcionChange} placeholder="Notas adicionales sobre esta tarea..." />

            {/* Grupo 1: Estado (Standalone if needed, or row) */}
            {modoEdicion && onCompletadoChange && (
                <FilaPropiedades etiqueta="Estado">
                    <SelectorEstadoPill completada={completado} onChange={onCompletadoChange} />
                </FilaPropiedades>
            )}

            {/* Grupo 2: Propiedades (Prioridad, Urgencia, Fecha) */}
            <FilaPropiedades etiqueta="Propiedades">
                <PropiedadesCompactas prioridad={prioridad || 'media'} onPrioridadChange={onPrioridadChange} urgencia={urgencia} onUrgenciaChange={onUrgenciaChange} fechaLimite={fechaLimite} onFechaLimiteChange={onFechaLimiteChange} mostrarEtiqueta={false} />
            </FilaPropiedades>

            {/* Dependencias */}
            {modoEdicion && onDependenciasChange && (
                <FilaPropiedades etiqueta="Dependencias">
                    <Boton
                        type="button"
                        variante="ghost"
                        claseAdicional={`pillOpcion ${dependencias.length === 0 ? 'pillOpcion--vacio' : ''}`}
                        onClick={() => setModalDependenciasAbierto(true)}
                        title="Configurar dependencias">
                        <span>{dependencias.length > 0 ? `${dependencias.length} dependencia(s)` : 'Sin dependencias'}</span>
                    </Boton>
                </FilaPropiedades>
            )}

            {modalDependenciasAbierto && onDependenciasChange && (
                <ModalDependencias
                    estaAbierto={modalDependenciasAbierto}
                    onCerrar={() => setModalDependenciasAbierto(false)}
                    tipoActual="tarea"
                    idActual={tareaId || 0}
                    nombreActual={texto || 'Tarea'}
                    dependencias={dependencias}
                    onGuardar={deps => {
                        onDependenciasChange(deps);
                    }}
                    tareas={tareasParaDependencias}
                    habitos={habitosParaDependencias}
                />
            )}

            {/* Proyecto - Solo si hay proyectos disponibles */}
            {mostrarProyecto && (
                <FilaPropiedades etiqueta="Proyecto">
                    <SelectorProyectoPill proyectos={proyectos} proyectoActualId={proyectoId} onChange={onProyectoChange} />
                </FilaPropiedades>
            )}

            {/* Asignado - Solo si hay participantes */}
            {mostrarAsignacion && (
                <FilaPropiedades etiqueta="Asignado">
                    <SelectorAsignado participantes={participantes} asignadoActual={asignadoA} onAsignar={manejarAsignacion} />
                </FilaPropiedades>
            )}

            {/* Repetición - Siempre visible */}
            <FilaPropiedades etiqueta="Repetición">
                <SelectorRepeticionPill tieneRepeticion={tieneRepeticion} onTieneRepeticionChange={onTieneRepeticionChange} frecuencia={frecuencia} onFrecuenciaChange={onFrecuenciaChange} />
            </FilaPropiedades>

            {/* Grupo 2b: Compartido con (Colaboradores) - Solo en modo edición */}
            {modoEdicion && onAgregarParticipante && (
                <FilaPropiedades etiqueta="Colaboradores">
                    <SeccionResponsables participantes={participantes} companeros={companeros} onAgregar={onAgregarParticipante} onRemover={onRemoverParticipante} onCambiarRol={onCambiarRolParticipante} puedeGestionar={true} etiqueta="" modoCompacto={true} />
                </FilaPropiedades>
            )}

            {/* Grupo 3: Etiquetas (Tags) */}
            {onTagsChange && (
                <FilaPropiedades etiqueta="Etiquetas">
                    <SelectorTags tags={tags} onTagsChange={onTagsChange} />
                </FilaPropiedades>
            )}

            {/* Grupo de ejecución */}
            {onGrupoEjecucionChange && (
                <FilaPropiedades etiqueta="Grupo">
                    <SelectorGrupo
                        grupos={gruposDisponibles}
                        grupoActual={grupoEjecucion || null}
                        onChange={onGrupoEjecucionChange}
                        placeholder="Sin grupo"
                        titulo="Grupo de ejecución"
                    />
                </FilaPropiedades>
            )}

            {/* Adjuntos */}
            {onAdjuntosChange && <SeccionAdjuntos adjuntos={adjuntos} onChange={onAdjuntosChange} estilo="moderno" limiteAdjuntos={limiteAdjuntos} onClickUpgrade={onClickUpgrade} />}

            {/* Subtareas: Solo si no es ya una subtarea (evitar anidado infinito) */}
            {modoEdicion && !esSubtarea && typeof tareaId === 'number' && (
                <div className="panelConfiguracionSubtareas">
                    <ListaSubtareas tareas={subtareas || []} parentId={tareaId} prioridadPadre={prioridad || undefined} onToggleTarea={onToggleSubtarea || (() => {})} onCrearTarea={onCrearSubtarea || (() => {})} onEliminarTarea={onEliminarSubtarea || (() => {})} onConfigurarTarea={onConfigurarSubtarea} onEditarTarea={onEditarSubtarea} />
                </div>
            )}
        </div>
    );
}
