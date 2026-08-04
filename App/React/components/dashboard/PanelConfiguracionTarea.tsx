/*
 * PanelConfiguracionTarea
 * Panel modal para configurar opciones avanzadas de una tarea
 *
 * Fase 9.4: Refactorizado para usar componentes modernos estilo Linear
 * - FormularioTareaModerno para el formulario principal
 * - usePanelConfiguracionTarea para toda la lógica y estado
 * - Fase 10.8.6: Removido PestanasModal (código muerto)
 */

import type {Tarea, TareaConfiguracion, NivelPrioridad, NivelUrgencia, Participante, Proyecto, CompaneroEquipo, RolCompartido, DatosEdicionTarea, ReferenciaDependencia} from '../../types/dashboard';
import {AccionesFormulario, Modal} from '../shared';
import {Boton} from '../ui';
import {FormularioTareaModerno} from './tareas/FormularioTareaModerno';
import {PanelChatHistorial} from './PanelChatHistorial';
import {usePanelConfiguracionTarea} from '../../hooks/dashboard/usePanelConfiguracionTarea';
import {Activity, BarChart2} from 'lucide-react';

export interface PanelConfiguracionTareaProps {
    tarea?: Tarea;
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string, asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null, tags?: string[], dependencias?: ReferenciaDependencia[], grupoEjecucion?: string | null) => void;
    tareas?: Tarea[];
    habitos?: import('../../types/dashboard').Habito[];
    participantes?: Participante[];
    /* Gestión de participantes (Compartir) */
    companeros?: CompaneroEquipo[];
    onAgregarParticipante?: (usuarioId: number, rol: RolCompartido) => void;
    onRemoverParticipante?: (participanteId: number) => void;
    onCambiarRolParticipante?: (participanteId: number, nuevoRol: RolCompartido) => void;
    proyectos?: Proyecto[];
    onCambiarProyecto?: (proyectoId: number | undefined) => void;
    onToggleCompletado?: (completado: boolean) => void;
    /* Subtareas - Fase 14.9 */
    subtareas?: Tarea[];
    onCrearSubtarea?: (datos: DatosEdicionTarea) => void;
    onToggleSubtarea?: (id: number) => void;
    onEliminarSubtarea?: (id: number) => void;
    onConfigurarSubtarea?: (tarea: Tarea) => void;
    onEditarSubtarea?: (id: number, datos: DatosEdicionTarea) => void;
}export function PanelConfiguracionTarea({tarea, estaAbierto, onCerrar, onGuardar, tareas = [], habitos = [], participantes = [], companeros = [], onAgregarParticipante, onRemoverParticipante, onCambiarRolParticipante, proyectos = [], onCambiarProyecto, onToggleCompletado, subtareas, onCrearSubtarea, onToggleSubtarea, onEliminarSubtarea, onConfigurarSubtarea, onEditarSubtarea}: PanelConfiguracionTareaProps): JSX.Element | null {
    /* Toda la lógica delegada al hook dedicado */
    const {
        texto, setTexto, descripcion, setDescripcion,
        prioridad, setPrioridad, urgencia, setUrgencia,
        fechaMaxima, setFechaMaxima, tieneRepeticion, setTieneRepeticion,
        frecuencia, setFrecuencia, adjuntos, setAdjuntos, tags, setTags,
        dependencias, setDependencias, grupoEjecucion, setGrupoEjecucion,
        asignadoA, asignadoANombre, asignadoAAvatar,
        proyectoIdLocal, completadoLocal,
        modoEdicion, esMovil, claseModal,
        panelChat,
        manejarGuardar, manejarCerrarConGuardado,
        manejarAsignacion, manejarCambioProyecto, manejarCambioCompletado
    } = usePanelConfiguracionTarea({tarea, onCerrar, onGuardar, participantes, onCambiarProyecto, onToggleCompletado});

    const {chatVisible, toggleChat, tieneMensajesSinLeer, participantesChat, mostrarChatColumna} = panelChat;

    /*
     * Header Icons (similar a ModalProyecto)
     * Fase 10.8.11: En móvil no mostramos estos iconos,
     * el chat se muestra inline al final del modal
     */
    const accionesHeader =
        modoEdicion && !esMovil ? (
            <div className="accionesHeaderFlex">
                {/* Estadisticas (Placeholder) */}
                <Boton type="button" variante="icono" title="Estadísticas (Próximamente)" claseAdicional="botonIcono--deshabilitado">
                    <BarChart2 size={16} />
                </Boton>

                {/* Actividad / Chat */}
                <Boton type="button" variante="icono" onClick={toggleChat} title={chatVisible ? 'Ocultar chat' : 'Mostrar chat e historial'} claseAdicional="botonIcono--clickable">
                    {tieneMensajesSinLeer ? (
                        <div className="posicionRelativa">
                            <Activity size={16} />
                            <span className="indicadorBadge" />
                        </div>
                    ) : (
                        <Activity size={16} />
                    )}
                </Boton>
            </div>
        ) : undefined;

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={manejarCerrarConGuardado} titulo={modoEdicion ? 'Modificar tarea' : 'Nueva tarea'} claseExtra={claseModal} accionesEncabezado={accionesHeader} ocultarBotonCerrar={modoEdicion}>
            {modoEdicion ? (
                <>
                    {/* Layout de 2 columnas (en móvil solo se muestra configuración) */}
                    <div className={`panelConfiguracionDosColumnas ${!mostrarChatColumna ? 'panelConfiguracionDosColumnas--sinChat' : ''}`}>
                        {/* Columna Izquierda: Formulario */}
                        <div className="panelConfiguracionColumnaIzquierda panelConfiguracionColumnaIzquierda--activa">
                            <div className="panelConfiguracionColumnaScroll">
                                <FormularioTareaModerno
                                    texto={texto}
                                    onTextoChange={setTexto}
                                    descripcion={descripcion}
                                    onDescripcionChange={setDescripcion}
                                    completado={completadoLocal}
                                    onCompletadoChange={onToggleCompletado ? manejarCambioCompletado : undefined}
                                    prioridad={prioridad}
                                    onPrioridadChange={setPrioridad}
                                    urgencia={urgencia}
                                    onUrgenciaChange={setUrgencia}
                                    fechaLimite={fechaMaxima}
                                    onFechaLimiteChange={setFechaMaxima}
                                    proyectoId={proyectoIdLocal}
                                    proyectos={proyectos}
                                    onProyectoChange={onCambiarProyecto ? manejarCambioProyecto : undefined}
                                    tieneRepeticion={tieneRepeticion}
                                    onTieneRepeticionChange={setTieneRepeticion}
                                    frecuencia={frecuencia}
                                    onFrecuenciaChange={setFrecuencia}
                                    participantes={participantes}
                                    asignadoA={asignadoA}
                                    asignadoANombre={asignadoANombre}
                                    asignadoAAvatar={asignadoAAvatar}
                                    onAsignacionChange={participantes.length > 0 ? manejarAsignacion : undefined}
                                    companeros={companeros}
                                    onAgregarParticipante={onAgregarParticipante}
                                    onRemoverParticipante={onRemoverParticipante}
                                    onCambiarRolParticipante={onCambiarRolParticipante}
                                    adjuntos={adjuntos}
                                    onAdjuntosChange={setAdjuntos}
                                    tags={tags}
                                    onTagsChange={setTags}
                                    dependencias={dependencias}
                                    onDependenciasChange={setDependencias}
                                    tareasParaDependencias={tareas}
                                    habitosParaDependencias={habitos}
                                    grupoEjecucion={grupoEjecucion}
                                    onGrupoEjecucionChange={setGrupoEjecucion}
                                    modoEdicion={true}
                                    /* Subtareas */
                                    tareaId={tarea?.id}
                                    subtareas={subtareas}
                                    onCrearSubtarea={onCrearSubtarea}
                                    onToggleSubtarea={onToggleSubtarea}
                                    onEliminarSubtarea={onEliminarSubtarea}
                                    onConfigurarSubtarea={onConfigurarSubtarea}
                                    onEditarSubtarea={onEditarSubtarea}
                                    esSubtarea={!!tarea?.parentId}
                                />

                                {/* Fase 10.8.11: Chat inline en móvil */}
                                {esMovil && tarea && (
                                    <div className="chatInlineMovil">
                                        <PanelChatHistorial elementoId={tarea.id} elementoTipo="tarea" participantes={participantesChat} compacto />
                                    </div>
                                )}
                            </div>
                            {/* Input de comentario cuando el chat esta oculto (solo desktop) */}
                            {!esMovil && !mostrarChatColumna && tarea && <PanelChatHistorial elementoId={tarea.id} elementoTipo="tarea" participantes={participantesChat} soloInput />}
                        </div>

                        {/* Columna Derecha: Chat e Historial (oculto en móvil) */}
                        {mostrarChatColumna && tarea && (
                            <div className="panelConfiguracionColumnaDerecha panelConfiguracionColumnaDerecha--activa ocultarEnMovil">
                                <PanelChatHistorial elementoId={tarea.id} elementoTipo="tarea" participantes={participantesChat} />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Modo creación simple */
                <>
                    <div id="panel-tarea-contenido" className="formularioHabito">
                        <FormularioTareaModerno texto={texto} onTextoChange={setTexto} descripcion={descripcion} onDescripcionChange={setDescripcion} completado={false} prioridad={prioridad} onPrioridadChange={setPrioridad} urgencia={urgencia} onUrgenciaChange={setUrgencia} fechaLimite={fechaMaxima} onFechaLimiteChange={setFechaMaxima} tieneRepeticion={tieneRepeticion} onTieneRepeticionChange={setTieneRepeticion} frecuencia={frecuencia} onFrecuenciaChange={setFrecuencia} adjuntos={adjuntos} onAdjuntosChange={setAdjuntos} tags={tags} onTagsChange={setTags} modoEdicion={false} asignadoA={null} asignadoANombre="" asignadoAAvatar="" />
                    </div>
                    <AccionesFormulario onCancelar={onCerrar} onGuardar={manejarGuardar} textoGuardar="Crear tarea" />
                </>
            )}
        </Modal>
    );
}
