/*
 * FormularioHabitoModerno
 * Formulario con el nuevo diseno estilo Linear para habitos
 * Usado dentro de ModalHabito para la entrada de datos
 *
 * Fase 9.5: Layout moderno con titulo limpio, propiedades compactas
 * Fase 9.7.7.4: Estandarizado con FilaPropiedades
 * Fase 13: Soporte para pausar habitos
 * Fase 14.8: Soporte para tareas/metas del habito
 * SubHabitos: Hábitos anidados con frecuencia e importancia independiente
 * TAREA 4: Ventana de oportunidad para hábitos
 * Reutiliza componentes de Fase 9.2 (CampoTituloLimpio, etc.)
 */

import {Pause, Play} from 'lucide-react';
import {useState, useMemo} from 'react';
import type {NivelImportancia, FrecuenciaHabito, Habito, SubHabito, DatosNuevoSubHabito, VentanaOportunidad, Tarea, DatosEdicionTarea, ReferenciaDependencia} from '../../../types/dashboard';
import {useGruposEjecucion} from '../../../hooks/useGruposEjecucion';
import {CampoTituloLimpio, CampoSubtituloLimpio, SelectorIconoProyecto, SelectorEstadoHabitoPill, SelectorImportanciaPill, SelectorFrecuenciaPill, FilaPropiedades, SelectorVentanaOportunidad, SelectorGrupo} from '../../shared';
import type {EstadoHabito} from '../../shared';
import {Boton} from '../../ui';
import {MapaCalorHabito} from '../../shared/MapaCalorHabito';
import {ListaSubHabitos} from './ListaSubHabitos';
import {ModalDependencias} from '../ModalDependencias';

interface FormularioHabitoModernoProps {
    /* Campos principales */
    nombre: string;
    onNombreChange: (valor: string) => void;
    /* Nuevos campos esteticos */
    descripcion?: string;
    onDescripcionChange?: (valor: string) => void;
    icono?: string;
    colorIcono?: string;
    onIconoChange?: (icono: string, color: string) => void;
    /* Propiedades */
    importancia: NivelImportancia;
    onImportanciaChange: (valor: NivelImportancia) => void;
    /* Frecuencia */
    frecuencia: FrecuenciaHabito;
    onFrecuenciaChange: (frecuencia: FrecuenciaHabito) => void;
    /* Ventana de oportunidad - TAREA 4 */
    ventanaOportunidad?: VentanaOportunidad;
    onVentanaOportunidadChange?: (ventana: VentanaOportunidad | undefined) => void;
    /* Estado del dia (solo en modo edicion) */
    estadoHoy?: EstadoHabito;
    onEstadoChange?: (estado: EstadoHabito) => void;
    /* Pausa (solo en modo edicion) */
    onPausarHabito?: () => void;
    /* Habito original (para mapa de calor en modo edicion) */
    habito?: Habito;
    /* Modo */
    modoEdicion?: boolean;
    errorNombre?: string;
    /* Si es true, el nombre no se puede modificar (hábito especial generado por plugin) */
    nombreBloqueado?: boolean;
    /* SubHabitos: CRUD y toggle para hábitos anidados */
    onCrearSubHabito?: (datos: DatosNuevoSubHabito) => void;
    onEditarSubHabito?: (subHabitoId: number, datos: DatosNuevoSubHabito) => void;
    onEliminarSubHabito?: (subHabitoId: number) => void;
    onToggleSubHabito?: (subHabitoId: number) => void;
    onConfigurarSubHabito?: (subhabito: SubHabito) => void;
    /* Dependencias condicionales */
    dependencias?: ReferenciaDependencia[];
    onDependenciasChange?: (dependencias: ReferenciaDependencia[]) => void;
    tareasParaDependencias?: Tarea[];
    habitosParaDependencias?: Habito[];
    elementoId?: number;
    padreId?: number;
    tipoElemento?: 'habito' | 'subhabito';
    /* Grupo de ejecución (solo hábitos) */
    grupoEjecucion?: string | null;
    onGrupoEjecucionChange?: (grupo: string | null) => void;
    /* [217A-3] Subhábito actual (para mostrar mapa de calor en configuración de subhábito) */
    subHabito?: SubHabito | null;
    onMarcarDiaSubHabito?: (fecha: string, estado: EstadoHabito) => boolean;
    onDesmarcarDiaSubHabito?: (fecha: string) => boolean;
    /* Tareas del hábito - Fase 14.8 (props requeridas por ModalHabito pero no usadas aquí) */
    tareasHabito?: Tarea[];
    onToggleTareaHabito?: (id: number) => void;
    onCrearTareaHabito?: (datos: DatosEdicionTarea) => void;
    onEliminarTareaHabito?: (id: number) => void;
    onConfigurarTareaHabito?: (tarea: Tarea) => void;
    onReordenarTareasHabito?: (tareasIds: number[]) => void;
    onEditarTareaHabito?: (id: number, datos: DatosEdicionTarea) => void;
}

export function FormularioHabitoModerno({nombre, onNombreChange, descripcion, onDescripcionChange, icono, colorIcono, onIconoChange, importancia, onImportanciaChange, frecuencia, onFrecuenciaChange, ventanaOportunidad, onVentanaOportunidadChange, estadoHoy, onEstadoChange, onPausarHabito, habito, modoEdicion = false, errorNombre, nombreBloqueado = false, onCrearSubHabito, onEditarSubHabito, onEliminarSubHabito, onToggleSubHabito, onConfigurarSubHabito, subHabito, onMarcarDiaSubHabito, onDesmarcarDiaSubHabito, dependencias = [], onDependenciasChange, tareasParaDependencias = [], habitosParaDependencias = [], elementoId, padreId, tipoElemento = 'habito', grupoEjecucion, onGrupoEjecucionChange}: FormularioHabitoModernoProps): JSX.Element {
    const estaPausado = habito?.pausado ?? false;
    const [modalDependenciasAbierto, setModalDependenciasAbierto] = useState(false);

    /* Grupos de ejecución existentes para el selector */
    const gruposDisponibles = useGruposEjecucion(tareasParaDependencias, habitosParaDependencias);

    const nombreElemento = subHabito ? subHabito.nombre : nombre || 'Hábito';
    const idElemento = subHabito ? subHabito.id : habito?.id;

    /* Determinar si mostrar la sección de subhábitos */
    const mostrarSubHabitos = modoEdicion && habito && habito.id > 0 && onCrearSubHabito && onToggleSubHabito;

    return (
        <div id="formulario-habito-moderno" className="formularioProyectoModerno">
            {/* Icono del habito */}
            {onIconoChange && (
                <div className="formularioProyectoModerno__icono">
                    <SelectorIconoProyecto iconoId={icono || 'check-circle'} colorIcono={colorIcono || '#888888'} onCambio={onIconoChange} />
                </div>
            )}

            {/* Nombre del habito */}
            <CampoTituloLimpio id="habito-nombre" valor={nombre} onChange={onNombreChange} placeholder="Ej: Leer 30 minutos" error={errorNombre} autoFocus={!modoEdicion} disabled={nombreBloqueado} />

            {/* Descripcion (Subtitulo) */}
            {onDescripcionChange && <CampoSubtituloLimpio id="habito-descripcion" valor={descripcion || ''} onChange={onDescripcionChange} placeholder="Añade una descripción..." />}

            {/* Estado (solo modo edicion) - Primero segun estandar 9.7.7 */}
            {modoEdicion && estadoHoy && onEstadoChange && (
                <FilaPropiedades etiqueta="Estado">
                    <SelectorEstadoHabitoPill estado={estadoHoy} onChange={onEstadoChange} />
                </FilaPropiedades>
            )}

            {/* Importancia */}
            <FilaPropiedades etiqueta="Importancia">
                <SelectorImportanciaPill importancia={importancia} onChange={onImportanciaChange} />
            </FilaPropiedades>

            {/* Frecuencia */}
            <FilaPropiedades etiqueta="Frecuencia">
                <SelectorFrecuenciaPill frecuencia={frecuencia} onChange={onFrecuenciaChange} />
            </FilaPropiedades>

            {/* Ventana de oportunidad - TAREA 4 */}
            {onVentanaOportunidadChange && (
                <FilaPropiedades etiqueta="Ventana">
                    <SelectorVentanaOportunidad ventana={ventanaOportunidad} onChange={onVentanaOportunidadChange} />
                </FilaPropiedades>
            )}

            {/* Dependencias (solo modo edición) */}
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

            {modalDependenciasAbierto && onDependenciasChange && typeof idElemento === 'number' && (
                <ModalDependencias
                    estaAbierto={modalDependenciasAbierto}
                    onCerrar={() => setModalDependenciasAbierto(false)}
                    tipoActual={tipoElemento}
                    idActual={idElemento}
                    padreIdActual={padreId}
                    nombreActual={nombreElemento}
                    dependencias={dependencias}
                    onGuardar={deps => {
                        onDependenciasChange(deps);
                    }}
                    tareas={tareasParaDependencias}
                    habitos={habitosParaDependencias}
                />
            )}

            {/* Grupo de ejecución (solo hábitos en modo edición) */}
            {modoEdicion && tipoElemento === 'habito' && onGrupoEjecucionChange && (
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

            {/* Pausar habito (solo modo edicion) */}
            {modoEdicion && onPausarHabito && (
                <FilaPropiedades etiqueta="Pausar">
                    <Boton type="button" claseAdicional={`botonPausaHabito ${estaPausado ? 'botonPausaHabito--activo' : ''}`} onClick={onPausarHabito} title={estaPausado ? 'Reanudar habito' : 'Pausar habito'}>
                        {estaPausado ? (
                            <>
                                <Play size={14} />
                                <span>Reanudar</span>
                            </>
                        ) : (
                            <>
                                <Pause size={14} />
                                <span>Pausar</span>
                            </>
                        )}
                    </Boton>
                    {estaPausado && habito?.fechaPausa && <span className="botonPausaHabito__fecha">desde {new Date(habito.fechaPausa).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})}</span>}
                </FilaPropiedades>
            )}

            {/* SubHabitos: hábitos anidados con frecuencia e importancia independiente */}
            {mostrarSubHabitos && habito && <ListaSubHabitos subhabitos={habito.subhabitos || []} onCrear={onCrearSubHabito!} onEditar={onEditarSubHabito} onEliminar={onEliminarSubHabito!} onToggle={onToggleSubHabito!} onConfigurarSubHabito={onConfigurarSubHabito} importanciaPadre={importancia} frecuenciaPadre={frecuencia} />}

            {/* Mapa de calor - solo en modo edicion */}
            {/* [217A-3] Mostrar heatmap tanto para hábitos como para subhábitos */}
            {modoEdicion && (
                (habito && habito.id > 0) || (subHabito && subHabito.id > 0)
            ) && (
                <>
                    {/* Separador visual antes del historial */}
                    <div className="formularioHabitoModerno__separador" />

                    <div className="formularioHabitoModerno__historial">
                        <label className="formularioHabitoModerno__historialEtiqueta">Historial de cumplimiento</label>
                        {subHabito ? (
                            <MapaCalorHabito
                                habitoId={0}
                                periodo="mes"
                                enModal={true}
                                frecuencia={subHabito.frecuencia || frecuencia}
                                fechaCreacion={subHabito.fechaCreacion}
                                historialCompletados={subHabito.historialCompletados || []}
                                historialPospuestos={subHabito.historialPospuestos || []}
                                onMarcarDia={onMarcarDiaSubHabito}
                                onDesmarcarDia={onDesmarcarDiaSubHabito}
                            />
                        ) : habito ? (
                            <MapaCalorHabito habitoId={habito.id} periodo="mes" enModal={true} frecuencia={habito.frecuencia} fechaCreacion={habito.fechaCreacion} />
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
}
