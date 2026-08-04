/*
 * ModalHabito
 * Modal para crear/editar un habito con auto-guardado
 *
 * Fase 9.5: Refactorizado para usar componentes modernos estilo Linear
 * - FormularioHabitoModerno para el formulario principal
 * - usePanelChat para la gestión del panel de chat
 * - Fase 10.8.6: Removido PestanasModal (código muerto)
 * - Fase 14.8: Soporte para tareas/metas del habito
 * - SubHabitos: Hábitos anidados con frecuencia e importancia independiente
 * - TAREA 4: Ventana de oportunidad para hábitos
 * - Lógica extraída a useModalHabito hook
 */

import {Activity, BarChart2} from 'lucide-react';
import type {DatosNuevoHabito, Habito, SubHabito, Participante, Tarea, DatosEdicionTarea} from '../../types/dashboard';
import {AccionesFormulario, Modal} from '../shared';
import {Boton} from '../ui';
import {FormularioHabitoModerno} from './habitos/FormularioHabitoModerno';
import {PanelChatHistorial} from './PanelChatHistorial';
import {useModalHabito} from '../../hooks/dashboard/useModalHabito';
import {useHabitosStore} from '../../stores/habitosStore';

type DatosFormulario = DatosNuevoHabito;

interface ModalHabitoProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (datos: DatosFormulario) => void;
    onPausarHabito?: (id: number) => void;
    habito?: Habito;
    participantes?: Participante[];
    /* Tareas del hábito - Fase 14.8 */
    tareas?: Tarea[];
    onToggleTarea?: (id: number) => void;
    onCrearTarea?: (datos: DatosEdicionTarea) => void;
    onEliminarTarea?: (id: number) => void;
    onConfigurarTarea?: (tarea: Tarea) => void;
    onActualizarOrdenTareasHabito?: (habitoId: number, tareasIds: number[]) => void;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    /* [217A-2c] Unificación: subhábitos se editan con el mismo modal */
    subHabito?: SubHabito | null;
    habitoPadre?: Habito | null;
    /** ⚙️ en lista de subhábitos → abrir ModalHabito para ese subhábito */
    onConfigurarSubHabito?: (subhabito: SubHabito) => void;
}

export function ModalHabito({estaAbierto, onCerrar, onGuardar, onPausarHabito, habito, participantes = [], tareas = [], onToggleTarea, onCrearTarea, onEliminarTarea, onConfigurarTarea, onActualizarOrdenTareasHabito, onEditarTarea, subHabito, habitoPadre, onConfigurarSubHabito}: ModalHabitoProps): JSX.Element | null {
    const habitos = useHabitosStore(state => state.habitos);
    const {
        modoEdicion, nombre, setNombre, descripcion, setDescripcion,
        icono, setIcono, colorIcono, setColorIcono,
        importancia, setImportancia, frecuencia, setFrecuencia,
        ventanaOportunidad, setVentanaOportunidad, dependencias, setDependencias, grupoEjecucion, setGrupoEjecucion, errores, esHabitoEspecialAyuno, esModoSubHabito,
        estadoHoy, manejarCambioEstado,
        chatVisible, toggleChat, tieneMensajesSinLeer, participantesChat, mostrarChatColumna,
        tareasDelHabito, manejarReordenarTareas,
        manejarCrearSubHabito, manejarEditarSubHabito, manejarEliminarSubHabito, manejarToggleSubHabito,
        manejarMarcarDiaSubHabito, manejarDesmarcarDiaSubHabito,
        manejarGuardar, manejarCerrarConGuardado, manejarPausarHabito
    } = useModalHabito({estaAbierto, onCerrar, onGuardar, onPausarHabito, habito, participantes, tareas, onToggleTarea, onCrearTarea, onEliminarTarea, onConfigurarTarea, onActualizarOrdenTareasHabito, onEditarTarea, subHabito, habitoPadre});

    /* Header Icons — ocultos en modo subhábito */
    const accionesHeader = (modoEdicion && !esModoSubHabito) ? (
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

    /* Título dinámico según modo */
    const titulo = esModoSubHabito ? 'Configurar subhábito' : (modoEdicion ? 'Modificar habito' : 'Nuevo habito');

    /* Clase del modal */
    const claseModal = (modoEdicion || esModoSubHabito) ? 'panelConfiguracionContenedor modalContenedor--expandido' : 'modalContenedor--moderno';

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={manejarCerrarConGuardado} titulo={titulo} claseExtra={claseModal} accionesEncabezado={accionesHeader} ocultarBotonCerrar={modoEdicion || esModoSubHabito}>
            {esModoSubHabito ? (
                /* [217A-2c] Modo subhábito: formulario simplificado, sin chat, sin sub-subhábitos */
                <div className="panelConfiguracionDosColumnas panelConfiguracionDosColumnas--sinChat">
                    <div className="panelConfiguracionColumnaIzquierda panelConfiguracionColumnaIzquierda--activa">
                        <div className="panelConfiguracionColumnaScroll">
                            <FormularioHabitoModerno
                                nombre={nombre}
                                onNombreChange={setNombre}
                                importancia={importancia}
                                onImportanciaChange={setImportancia}
                                frecuencia={frecuencia}
                                onFrecuenciaChange={setFrecuencia}
                                ventanaOportunidad={ventanaOportunidad}
                                onVentanaOportunidadChange={setVentanaOportunidad}
                                estadoHoy={estadoHoy}
                                onEstadoChange={manejarCambioEstado}
                                onPausarHabito={manejarPausarHabito}
                                modoEdicion={true}
                                errorNombre={errores.nombre}
                                /* [217A-3] Historial retroactivo de subhábitos */
                                subHabito={subHabito}
                                onMarcarDiaSubHabito={manejarMarcarDiaSubHabito}
                                onDesmarcarDiaSubHabito={manejarDesmarcarDiaSubHabito}
                                dependencias={dependencias}
                                onDependenciasChange={setDependencias}
                                tareasParaDependencias={tareas}
                                habitosParaDependencias={habitos}
                                tipoElemento="subhabito"
                                elementoId={subHabito?.id}
                                padreId={habitoPadre?.id}
                            />
                        </div>
                    </div>
                </div>
            ) : modoEdicion ? (
                <>
                    {/* Layout de 2 columnas (en móvil solo se muestra configuración) */}
                    <div className={`panelConfiguracionDosColumnas ${!mostrarChatColumna ? 'panelConfiguracionDosColumnas--sinChat' : ''}`}>
                        {/* Columna Izquierda: Formulario */}
                        <div className="panelConfiguracionColumnaIzquierda panelConfiguracionColumnaIzquierda--activa">
                            <div className="panelConfiguracionColumnaScroll">
                                <FormularioHabitoModerno
                                    nombre={nombre}
                                    onNombreChange={setNombre}
                                    descripcion={descripcion}
                                    onDescripcionChange={setDescripcion}
                                    icono={icono}
                                    colorIcono={colorIcono}
                                    onIconoChange={(i, c) => {
                                        setIcono(i);
                                        setColorIcono(c);
                                    }}
                                    importancia={importancia}
                                    onImportanciaChange={setImportancia}
                                    frecuencia={frecuencia}
                                    onFrecuenciaChange={setFrecuencia}
                                    ventanaOportunidad={esHabitoEspecialAyuno ? undefined : ventanaOportunidad}
                                    onVentanaOportunidadChange={esHabitoEspecialAyuno ? undefined : setVentanaOportunidad}
                                    estadoHoy={estadoHoy}
                                    onEstadoChange={esHabitoEspecialAyuno ? undefined : manejarCambioEstado}
                                    onPausarHabito={manejarPausarHabito}
                                    habito={habito}
                                    modoEdicion={true}
                                    errorNombre={errores.nombre}
                                    nombreBloqueado={esHabitoEspecialAyuno}
                                    /* Props para tareas del hábito - Fase 14.8 */
                                    tareasHabito={tareasDelHabito}
                                    onToggleTareaHabito={onToggleTarea}
                                    onCrearTareaHabito={onCrearTarea}
                                    onEliminarTareaHabito={onEliminarTarea}
                                    onConfigurarTareaHabito={onConfigurarTarea}
                                    onReordenarTareasHabito={manejarReordenarTareas}
                                    onEditarTareaHabito={onEditarTarea}
                                    /* Props para subhábitos */
                                    onCrearSubHabito={esHabitoEspecialAyuno ? undefined : manejarCrearSubHabito}
                                    onEditarSubHabito={esHabitoEspecialAyuno ? undefined : manejarEditarSubHabito}
                                onEliminarSubHabito={esHabitoEspecialAyuno ? undefined : manejarEliminarSubHabito}
                                onToggleSubHabito={esHabitoEspecialAyuno ? undefined : manejarToggleSubHabito}
                                onConfigurarSubHabito={onConfigurarSubHabito}
                                dependencias={dependencias}
                                onDependenciasChange={setDependencias}
                                tareasParaDependencias={tareas}
                                habitosParaDependencias={habitos}
                                tipoElemento="habito"
                                elementoId={habito?.id}
                                grupoEjecucion={grupoEjecucion}
                                onGrupoEjecucionChange={setGrupoEjecucion}
                            />
                            </div>
                            {/* Input de comentario cuando el chat esta oculto */}
                            {!mostrarChatColumna && habito && <PanelChatHistorial elementoId={habito.id} elementoTipo="habito" participantes={participantesChat} soloInput />}
                        </div>

                        {/* Columna Derecha: Chat e Historial (oculto en móvil) */}
                        {mostrarChatColumna && habito && (
                            <div className="panelConfiguracionColumnaDerecha panelConfiguracionColumnaDerecha--activa ocultarEnMovil">
                                <PanelChatHistorial elementoId={habito.id} elementoTipo="habito" participantes={participantesChat} />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Modo creación simple */
                <>
                    <div id="modal-habito-contenido" className="formularioHabito">
                        <FormularioHabitoModerno
                            nombre={nombre}
                            onNombreChange={setNombre}
                            descripcion={descripcion}
                            onDescripcionChange={setDescripcion}
                            icono={icono}
                            colorIcono={colorIcono}
                            onIconoChange={(i, c) => {
                                setIcono(i);
                                setColorIcono(c);
                            }}
                            importancia={importancia}
                            onImportanciaChange={setImportancia}
                            frecuencia={frecuencia}
                            onFrecuenciaChange={setFrecuencia}
                            ventanaOportunidad={ventanaOportunidad}
                            onVentanaOportunidadChange={setVentanaOportunidad}
                            nombreBloqueado={false}
                            modoEdicion={false}
                            errorNombre={errores.nombre}
                        />
                    </div>
                    <AccionesFormulario onCancelar={onCerrar} onGuardar={manejarGuardar} textoGuardar="Crear hábito" />
                </>
            )}
        </Modal>
    );
}
