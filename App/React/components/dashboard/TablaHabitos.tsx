/*
 * TablaHabitos
 * Componente para mostrar la tabla de hábitos prioritarios
 * Responsabilidad única: renderizar lista de hábitos con su estado
 * Lógica extraída a useTablaHabitos y useFilaHabito hooks
 */

import React, {useMemo, useCallback} from 'react';
import {Reorder} from 'framer-motion';
import {Clock, Flame, Target, Check, Pause, AlertTriangle, Play, Square, Lock} from 'lucide-react';
import type {Habito, SubHabito, Tarea} from '../../types/dashboard';
import {obtenerFechaHoy} from '../../utils/fecha';
import {obtenerVariantePrioridad} from '../../hooks/dashboard/useTablaHabitos';
import {MenuContextualAdaptivo} from '../shared/MenuContextualAdaptivo';
import {DashboardPanel} from '../shared/DashboardPanel';
import {EstadoVacio} from '../shared/EstadoVacio';
import {BadgeInfo, BadgeGroup} from '../shared/BadgeInfo';
import {AccionesItem} from '../shared/AccionesItem';
import type {ConfiguracionHabitos} from '../../hooks/useConfiguracionHabitos';
import {CONFIG_HABITOS_POR_DEFECTO} from '../../hooks/useConfiguracionHabitos';
import {HistorialHabitoInline} from '../shared/HistorialHabito';
import {generarOpcionesMenuHabito} from '../../config/opcionesMenuHabito';
import {useTablaHabitos, useFilaHabito} from '../../hooks/dashboard/useTablaHabitos';
import {calcularUmbralInactividad} from '../../utils/frecuenciaHabitos';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import {useDependenciasElemento} from '../../hooks/useDependenciasElemento';
import {useDependenciasUIStore} from '../../stores/dependenciasUIStore';

interface TablaHabitosProps {
    habitos: Habito[];
    tareas?: Tarea[];
    onAñadirHabito?: () => void;
    onToggleHabito?: (id: number) => void;
    onEditarHabito?: (habito: Habito) => void;
    onEliminarHabito?: (id: number) => void;
    onPosponerHabito?: (id: number) => void;
    onPausarHabito?: (id: number) => void;
    onMarcarDiaHabito?: (habitoId: number, fecha: string, estado: 'completado' | 'pospuesto') => void;
    onDesmarcarDiaHabito?: (habitoId: number, fecha: string) => void;
    onActualizarHabito?: (id: number, datos: Partial<Habito>) => void;
    /* [217A-5] Callbacks para subhábitos */
    onToggleSubHabito?: (habitoId: number, subHabitoId: number) => void;
    onConfigurarSubHabito?: (habitoId: number, subHabitoId: number) => void;
    onPosponerSubHabitoConTiempo?: (habitoId: number, subHabitoId: number, hasta: string | null) => void;
    /* [218A-1] Drag & drop para orden manual */
    habilitarDrag?: boolean;
    onReordenarHabitos?: (habitos: Habito[]) => void;
    configuracion?: ConfiguracionHabitos;
}

interface FilaHabitoProps {
    habito: Habito;
    indice: number;
    onToggle?: (id: number) => void;
    onEditar?: (habito: Habito) => void;
    onEliminar?: (id: number) => void;
    onPosponer?: (id: number) => void;
    onPausar?: (id: number) => void;
    onMarcarDia?: (habitoId: number, fecha: string, estado: 'completado' | 'pospuesto') => void;
    onDesmarcarDia?: (habitoId: number, fecha: string) => void;
    onActualizar?: (id: number, datos: Partial<Habito>) => void;
    configuracion: ConfiguracionHabitos;
    estiloGrid: React.CSSProperties;
    tareas?: Tarea[];
    habitos?: Habito[];
}

/* [217A-5] Fila de subhábito — mismo aspecto visual que un hábito, indentado bajo el padre */
interface FilaSubHabitoProps {
    subHabito: SubHabito;
    habitoPadreId: number;
    frecuenciaPadre: Habito['frecuencia'];
    onToggle?: (habitoId: number, subHabitoId: number) => void;
    onConfigurar?: (habitoId: number, subHabitoId: number) => void;
    onPosponerConTiempo?: (habitoId: number, subHabitoId: number, hasta: string | null) => void;
    configuracion: ConfiguracionHabitos;
    estiloGrid: React.CSSProperties;
    tareas?: Tarea[];
    habitos?: Habito[];
}

/* Reutiliza los cálculos de urgencia/inactividad del hook para mantener coherencia visual */
function useFilaSubHabito(subHabito: SubHabito, frecuenciaPadre: Habito['frecuencia']) {
    const hoy = obtenerFechaHoy();
    const completadoHoy = subHabito.ultimoCompletado === hoy || subHabito.historialCompletados?.includes(hoy);
    const pospuestoHoy = subHabito.historialPospuestos?.includes(hoy) ?? false;
    const pospuestoHasta = subHabito.pospuestoHasta ? new Date(subHabito.pospuestoHasta) > new Date() : false;
    const estaPausado = subHabito.pausado ?? false;

    const frecuencia = subHabito.frecuencia || frecuenciaPadre || FRECUENCIA_POR_DEFECTO;
    const umbralInactividad = calcularUmbralInactividad(frecuencia);
    const esUrgente = subHabito.diasInactividad > Math.floor(umbralInactividad * 0.4);
    const porcentajeUrgencia = Math.min((subHabito.diasInactividad / umbralInactividad) * 100, 100);

    const variantePrioridad = obtenerVariantePrioridad(subHabito.importancia);

    const claseUrgencia = (() => {
        if (completadoHoy) return 'barraRellenoCompletado';
        if (porcentajeUrgencia >= 80) return 'barraRellenoUrgenteCritico';
        if (esUrgente) return 'barraRellenoUrgente';
        if (porcentajeUrgencia >= 40) return 'barraRellenoAdvertencia';
        return '';
    })();

    const historialParaComponente = useMemo(() => {
        const resultado: Record<string, 'completado' | 'pospuesto'> = {};
        if (subHabito.historialCompletados) {
            for (const fecha of subHabito.historialCompletados) {
                resultado[fecha] = 'completado';
            }
        }
        if (subHabito.historialPospuestos) {
            for (const fecha of subHabito.historialPospuestos) {
                resultado[fecha] = 'pospuesto';
            }
        }
        return resultado;
    }, [subHabito.historialCompletados, subHabito.historialPospuestos]);

    return {
        hoy,
        completadoHoy,
        pospuestoHoy,
        pospuestoHasta,
        estaPausado,
        frecuencia,
        esUrgente,
        porcentajeUrgencia,
        variantePrioridad,
        claseUrgencia,
        historialParaComponente
    };
}

function FilaSubHabito({subHabito, habitoPadreId, frecuenciaPadre, onToggle, onConfigurar, configuracion, estiloGrid, tareas = [], habitos = []}: FilaSubHabitoProps): JSX.Element {
    const {
        completadoHoy,
        pospuestoHasta,
        estaPausado,
        frecuencia,
        esUrgente,
        porcentajeUrgencia,
        variantePrioridad,
        claseUrgencia,
        historialParaComponente
    } = useFilaSubHabito(subHabito, frecuenciaPadre);

    const {bloqueado, nombresBloqueantes} = useDependenciasElemento('subhabito', subHabito.id, habitoPadreId, subHabito, tareas, habitos);
    const destello = useDependenciasUIStore(s => s.destello);
    const activarDestello = useDependenciasUIStore(s => s.activarDestello);
    const esDestello = destello?.tipo === 'subhabito' && destello.id === subHabito.id && destello.padreId === habitoPadreId;

    const manejarToggle = useCallback((e: React.MouseEvent) => {
        if (bloqueado) {
            e.stopPropagation();
            e.preventDefault();
            activarDestello({tipo: 'subhabito', id: subHabito.id, padreId: habitoPadreId});
            alert(`Debes completar primero: ${nombresBloqueantes.join(', ')}`);
            return;
        }
        e.stopPropagation();
        onToggle?.(habitoPadreId, subHabito.id);
    }, [bloqueado, nombresBloqueantes, activarDestello, subHabito.id, habitoPadreId, onToggle]);

    const manejarConfigurar = useCallback(() => {
        onConfigurar?.(habitoPadreId, subHabito.id);
    }, [onConfigurar, habitoPadreId, subHabito.id]);

    return (
        <div
            className={`tablaFila tablaFilaEditable tablaFila--subhabito ${completadoHoy ? 'tablaFilaCompletada' : ''} ${configuracion.modoCompacto ? 'tablaFilaCompacta' : ''} ${estaPausado ? 'tablaFilaPausada' : ''} ${bloqueado ? 'dependenciaBloqueada' : ''} ${esDestello ? 'dependenciaDestello' : ''}`}
            onClick={manejarConfigurar}
            style={estiloGrid}
        >
            {/* Checkbox */}
            {configuracion.columnasVisibles.indice && (
                <div className="tablaColumnaCheckbox" onClick={manejarToggle}>
                    <div className={`habitoCheckbox ${completadoHoy ? 'habitoCheckboxCompletado' : ''} ${esDestello ? 'dependenciaDestello' : ''}`}>{completadoHoy && <Check size={10} />}</div>
                </div>
            )}

            {/* Nombre con indentación visual */}
            <div className="tablaColumnaNombre">
                <div className="filaNombreContenedor">
                    <span className={`filaNombre filaNombreSubhabito ${completadoHoy ? 'filaNombreCompletado' : ''}`}>{subHabito.nombre}</span>
                    <BadgeGroup>
                        {subHabito.dependencias && subHabito.dependencias.length > 0 && (
                            <span className="dependenciaBadge" title={nombresBloqueantes.join(', ')}>
                                <Lock size={10} />
                            </span>
                        )}
                        {configuracion.columnasVisibles.tocaHoy && pospuestoHasta && <BadgeInfo tipo="personalizado" icono={<Pause size={10} />} texto="Pospuesto" variante="pospuesto" />}
                        {configuracion.columnasVisibles.tocaHoy && estaPausado && <BadgeInfo tipo="personalizado" icono={<Pause size={10} />} texto="Pausado" variante="pospuesto" />}
                    </BadgeGroup>
                </div>
            </div>

            {/* Historial 5 días - Actividad */}
            {configuracion.columnasVisibles.historial && (
                <div className="tablaColumnaHistorial">
                    <HistorialHabitoInline
                        historial={historialParaComponente}
                        frecuencia={frecuencia}
                        fechaCreacion={subHabito.fechaCreacion}
                        onClickDia={() => {}}
                    />
                </div>
            )}

            {/* Prioridad */}
            {configuracion.columnasVisibles.importancia && (
                <div className="tablaColumnaPrioridad">
                    <BadgeInfo tipo="prioridad" texto={subHabito.importancia.toUpperCase()} variante={variantePrioridad} />
                </div>
            )}

            {/* Inactividad */}
            {configuracion.columnasVisibles.inactividad && (
                <div className="tablaColumnaInactividad">
                    <div className="inactividadIndicador">
                        <Clock size={10} className={esUrgente ? 'inactividadIconoUrgente' : 'inactividadIcono'} />
                        <span className={esUrgente ? 'inactividadTextoUrgente' : 'inactividadTexto'}>{subHabito.diasInactividad}d</span>
                    </div>
                </div>
            )}

            {/* Urgencia */}
            {configuracion.columnasVisibles.urgencia && (
                <div className="tablaColumnaUrgencia">
                    <div className="urgenciaContenedor">
                        <div className="barraUrgenciaNueva">
                            <div className={`barraRellenoNueva ${claseUrgencia}`} style={{width: `${porcentajeUrgencia}%`}}></div> {/* sentinel-disable inline-style-prohibido */}
                        </div>
                        <span className={`urgenciaPorcentaje ${esUrgente ? 'urgenciaPorcentajeAlto' : ''}`}>{Math.round(porcentajeUrgencia)}%</span>
                    </div>
                </div>
            )}

            {/* Racha */}
            {configuracion.columnasVisibles.racha && (
                <div className="tablaColumnaRacha">
                    <div className="rachaContenedor">
                        <Flame size={10} className={`rachaIcono ${subHabito.racha > 0 ? 'rachaIconoActivo' : ''}`} />
                        <span className="rachaNumero">{subHabito.racha}</span>
                    </div>
                </div>
            )}

            {/* Acciones */}
            {configuracion.columnasVisibles.acciones && (
                <div className="tablaColumnaAcciones">
                    <AccionesItem mostrarConfigurar={!!onConfigurar} mostrarEliminar={false} onConfigurar={manejarConfigurar} />
                </div>
            )}
        </div>
    );
}

function FilaHabito({habito, indice: _indice, onToggle, onEditar, onEliminar, onPosponer, onPausar, onMarcarDia, onDesmarcarDia, onActualizar, configuracion, estiloGrid, tareas = [], habitos = []}: FilaHabitoProps): JSX.Element {
    const {
        mostrarAcciones, setMostrarAcciones,
        menuContextual,
        frecuencia, esUrgente, porcentajeUrgencia,
        completadoHoy, habitoTocaHoy, pospuestoHoy,
        textoFrecuencia, intervaloFrecuencia,
        rachaEnPeligro, rachaPerdida, diasAntesDePerder,
        estaPausado, estaEnTracking,
        historialParaComponente,
        variantePrioridad, claseUrgencia,
        manejarToggle, manejarEditar, manejarClickDerecho, manejarOpcionMenu
    } = useFilaHabito({habito, onToggle, onEditar, onEliminar, onPosponer, onPausar, onActualizar});

    const {bloqueado, nombresBloqueantes} = useDependenciasElemento('habito', habito.id, undefined, habito, tareas, habitos);
    const destello = useDependenciasUIStore(s => s.destello);
    const activarDestello = useDependenciasUIStore(s => s.activarDestello);
    const esDestello = destello?.tipo === 'habito' && destello.id === habito.id;

    const manejarToggleConDependencias = useCallback((e: React.MouseEvent) => {
        if (bloqueado) {
            e.stopPropagation();
            e.preventDefault();
            activarDestello({tipo: 'habito', id: habito.id});
            alert(`Debes completar primero: ${nombresBloqueantes.join(', ')}`);
            return;
        }
        manejarToggle(e);
    }, [bloqueado, nombresBloqueantes, activarDestello, habito.id, manejarToggle]);

    /* Opciones del menú contextual (requiere JSX, se mantiene en el componente) */
    const opcionesMenu = useMemo(() => {
        const base = generarOpcionesMenuHabito({
            completadoHoy,
            estaPausado,
            tieneActualizar: !!onActualizar,
            pospuestoHoy
        });

        const indiceEliminar = base.findIndex(o => o.id === 'eliminar');
        const opcionTracking = estaEnTracking
            ? {id: 'detener-tracking', etiqueta: 'Detener tracking', icono: <Square size={12} />, separadorDespues: true}
            : {id: 'iniciar-tracking', etiqueta: 'Iniciar tracking', icono: <Play size={12} />, separadorDespues: true};

        if (indiceEliminar >= 0) {
            return [...base.slice(0, indiceEliminar), opcionTracking, ...base.slice(indiceEliminar)];
        }

        return [...base, opcionTracking];
    }, [completadoHoy, estaPausado, onActualizar, pospuestoHoy, estaEnTracking]);

    return (
        <>
            <div className={`tablaFila tablaFilaEditable ${completadoHoy ? 'tablaFilaCompletada' : ''} ${configuracion.modoCompacto ? 'tablaFilaCompacta' : ''} ${habitoTocaHoy && !completadoHoy ? 'tablaFilaTocaHoy' : ''} ${estaPausado ? 'tablaFilaPausada' : ''} ${bloqueado ? 'dependenciaBloqueada' : ''} ${esDestello ? 'dependenciaDestello' : ''}`} onClick={manejarEditar} onContextMenu={manejarClickDerecho} onMouseEnter={() => setMostrarAcciones(true)} onMouseLeave={() => setMostrarAcciones(false)} style={estiloGrid}>
                {/* Checkbox */}
                {configuracion.columnasVisibles.indice && (
                    <div className="tablaColumnaCheckbox" onClick={manejarToggleConDependencias}>
                        <div className={`habitoCheckbox ${completadoHoy ? 'habitoCheckboxCompletado' : ''} ${esDestello ? 'dependenciaDestello' : ''}`}>{completadoHoy && <Check size={10} />}</div>
                    </div>
                )}

                {/* Nombre y Tags */}
                <div className="tablaColumnaNombre">
                    <div className="filaNombreContenedor">
                        <span className={`filaNombre ${completadoHoy ? 'filaNombreCompletado' : ''}`}>{habito.nombre}</span>
                        <BadgeGroup>
                            {habito.dependencias && habito.dependencias.length > 0 && (
                                <span className="dependenciaBadge" title={nombresBloqueantes.join(', ')}>
                                    <Lock size={10} />
                                </span>
                            )}
                            {configuracion.columnasVisibles.frecuencia && intervaloFrecuencia !== null && <BadgeInfo tipo="frecuencia" icono={<Clock size={10} />} texto={intervaloFrecuencia.toString()} titulo={`Frecuencia: ${textoFrecuencia}`} variante="frecuencia" />}
                            {configuracion.columnasVisibles.tocaHoy && pospuestoHoy && <BadgeInfo tipo="personalizado" icono={<Pause size={10} />} texto="Pospuesto" variante="pospuesto" />}
                            {configuracion.columnasVisibles.tocaHoy && habitoTocaHoy && !completadoHoy && !pospuestoHoy && <BadgeInfo tipo="destacado" texto="Hoy" variante="destacado" />}
                        </BadgeGroup>
                    </div>
                </div>

                {/* Historial 5 dias - Actividad */}
                {configuracion.columnasVisibles.historial && (
                    <div className="tablaColumnaHistorial">
                        <HistorialHabitoInline
                            historial={historialParaComponente}
                            frecuencia={frecuencia}
                            fechaCreacion={habito.fechaCreacion}
                            onClickDia={(fecha, estadoActual) => {
                                if (estadoActual) {
                                    onDesmarcarDia?.(habito.id, fecha);
                                } else {
                                    onMarcarDia?.(habito.id, fecha, 'completado');
                                }
                            }}
                        />
                    </div>
                )}

                {/* Prioridad */}
                {configuracion.columnasVisibles.importancia && (
                    <div className="tablaColumnaPrioridad">
                        <BadgeInfo tipo="prioridad" texto={habito.importancia.toUpperCase()} variante={variantePrioridad} />
                    </div>
                )}

                {/* Inactividad - dias sin hacer */}
                {configuracion.columnasVisibles.inactividad && (
                    <div className="tablaColumnaInactividad">
                        <div className="inactividadIndicador">
                            <Clock size={10} className={esUrgente ? 'inactividadIconoUrgente' : 'inactividadIcono'} />
                            <span className={esUrgente ? 'inactividadTextoUrgente' : 'inactividadTexto'}>{habito.diasInactividad}d</span>
                        </div>
                    </div>
                )}

                {/* Urgencia - barra de progreso visual */}
                {configuracion.columnasVisibles.urgencia && (
                    <div className="tablaColumnaUrgencia">
                        <div className="urgenciaContenedor">
                            <div className="barraUrgenciaNueva">
                                <div className={`barraRellenoNueva ${claseUrgencia}`} style={{width: `${porcentajeUrgencia}%`}}></div> {/* sentinel-disable inline-style-prohibido */}
                            </div>
                            <span className={`urgenciaPorcentaje ${esUrgente ? 'urgenciaPorcentajeAlto' : ''}`}>{Math.round(porcentajeUrgencia)}%</span>
                        </div>
                    </div>
                )}

                {/* Racha - indicador separado */}
                {configuracion.columnasVisibles.racha && (
                    <div className="tablaColumnaRacha">
                        <div className={`rachaContenedor ${rachaEnPeligro && !completadoHoy ? 'rachaContenedorPeligro' : ''} ${completadoHoy ? 'rachaContenedorCompletado' : ''}`}>
                            {rachaEnPeligro && !completadoHoy && <AlertTriangle size={10} className="rachaIconoAdvertencia" />}
                            {rachaPerdida && habito.racha === 0 ? <Flame size={10} className="rachaIconoPerdida" /> : <Flame size={10} className={`rachaIcono ${habito.racha > 0 ? 'rachaIconoActivo' : ''}`} />}
                            <span className="rachaNumero">{habito.racha}</span>
                            {rachaEnPeligro && !completadoHoy && <span className="rachaTiempoRestante">({diasAntesDePerder}d)</span>}
                        </div>
                    </div>
                )}

                {/* Acciones inline (hover) */}
                {configuracion.columnasVisibles.acciones && <div className="tablaColumnaAcciones">{mostrarAcciones && <AccionesItem mostrarConfigurar={true} mostrarEliminar={true} onConfigurar={manejarEditar} onEliminar={() => onEliminar?.(habito.id)} />}</div>}
            </div>

            {/* Menu contextual */}
            {menuContextual.visible && <MenuContextualAdaptivo opciones={opcionesMenu} posicionX={menuContextual.posicion.x} posicionY={menuContextual.posicion.y} onSeleccionar={manejarOpcionMenu} onCerrar={menuContextual.cerrar} titulo={habito.nombre} />}
        </>
    );
}

export function TablaHabitos({habitos, tareas = [], onAñadirHabito, onToggleHabito, onEditarHabito, onEliminarHabito, onPosponerHabito, onPausarHabito, onMarcarDiaHabito, onDesmarcarDiaHabito, onActualizarHabito, onToggleSubHabito, onConfigurarSubHabito, onPosponerSubHabitoConTiempo, habilitarDrag = false, onReordenarHabitos, configuracion = CONFIG_HABITOS_POR_DEFECTO}: TablaHabitosProps): JSX.Element {
    const {habitosVisibles, habitosPausados, estiloGrid} = useTablaHabitos(habitos, configuracion);

    return (
        <DashboardPanel id="tabla-habitos">
            {habitos.length === 0 ? (
                <EstadoVacio icono={<Target size={32} />} mensaje="No hay hábitos creados" textoBoton="+ Crear hábito" onAccion={onAñadirHabito} />
            ) : (
                <>
                    {/* Encabezado de tabla */}
                    <div className="tablaEncabezado" style={estiloGrid}>
                        {configuracion.columnasVisibles.indice && <div className="tablaColumnaCheckbox"></div>}
                        <div className="tablaColumnaNombre">HABITO</div>
                        {configuracion.columnasVisibles.historial && <div className="tablaColumnaHistorial">ACTIVIDAD</div>}
                        {configuracion.columnasVisibles.importancia && <div className="tablaColumnaPrioridad">PRIO</div>}
                        {configuracion.columnasVisibles.inactividad && <div className="tablaColumnaInactividad">DIAS</div>}
                        {configuracion.columnasVisibles.urgencia && <div className="tablaColumnaUrgencia">URGENCIA</div>}
                        {configuracion.columnasVisibles.racha && <div className="tablaColumnaRacha">RACHA</div>}
                        {configuracion.columnasVisibles.acciones && <div className="tablaColumnaAcciones"></div>}
                    </div>

                    {/* [218A-1] Filas de hábitos activos — con o sin drag & drop */}
                    {habilitarDrag && onReordenarHabitos ? (
                        <Reorder.Group axis="y" values={habitosVisibles} onReorder={onReordenarHabitos} className="listaHabitosReorder" as="div">
                            {habitosVisibles.map((habito, index) => (
                                <Reorder.Item key={habito.id} value={habito} as="div" className="habitoReorderItem">
                                    <FilaHabito habito={habito} indice={index} onToggle={onToggleHabito} onEditar={onEditarHabito} onEliminar={onEliminarHabito} onPosponer={onPosponerHabito} onPausar={onPausarHabito} onMarcarDia={onMarcarDiaHabito} onDesmarcarDia={onDesmarcarDiaHabito} onActualizar={onActualizarHabito} configuracion={configuracion} estiloGrid={estiloGrid} tareas={tareas} habitos={habitos} />
                                    {habito.subhabitos && habito.subhabitos.length > 0 && habito.subhabitos.map(sub => (
                                        <FilaSubHabito key={`sub-${sub.id}`} subHabito={sub} habitoPadreId={habito.id} frecuenciaPadre={habito.frecuencia} onToggle={onToggleSubHabito} onConfigurar={onConfigurarSubHabito} onPosponerConTiempo={onPosponerSubHabitoConTiempo} configuracion={configuracion} estiloGrid={estiloGrid} tareas={tareas} habitos={habitos} />
                                    ))}
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    ) : (
                        habitosVisibles.map((habito, index) => (
                            <React.Fragment key={habito.id}>
                                <FilaHabito habito={habito} indice={index} onToggle={onToggleHabito} onEditar={onEditarHabito} onEliminar={onEliminarHabito} onPosponer={onPosponerHabito} onPausar={onPausarHabito} onMarcarDia={onMarcarDiaHabito} onDesmarcarDia={onDesmarcarDiaHabito} onActualizar={onActualizarHabito} configuracion={configuracion} estiloGrid={estiloGrid} tareas={tareas} habitos={habitos} />
                                {habito.subhabitos && habito.subhabitos.length > 0 && habito.subhabitos.map(sub => (
                                    <FilaSubHabito key={`sub-${sub.id}`} subHabito={sub} habitoPadreId={habito.id} frecuenciaPadre={habito.frecuencia} onToggle={onToggleSubHabito} onConfigurar={onConfigurarSubHabito} onPosponerConTiempo={onPosponerSubHabitoConTiempo} configuracion={configuracion} estiloGrid={estiloGrid} tareas={tareas} habitos={habitos} />
                                ))}
                            </React.Fragment>
                        ))
                    )}

                    {/* Seccion de habitos pausados */}
                    {configuracion.mostrarPausados && habitosPausados.length > 0 && (
                        <>
                            <div className="tablaSeparadorPausados">
                                <span className="tablaSeparadorPausados__texto">Pausados ({habitosPausados.length})</span>
                            </div>
                            {habitosPausados.map((habito, index) => (
                                <FilaHabito key={habito.id} habito={habito} indice={index} onToggle={onToggleHabito} onEditar={onEditarHabito} onEliminar={onEliminarHabito} onPosponer={onPosponerHabito} onPausar={onPausarHabito} onMarcarDia={onMarcarDiaHabito} onDesmarcarDia={onDesmarcarDiaHabito} onActualizar={onActualizarHabito} configuracion={configuracion} estiloGrid={estiloGrid} tareas={tareas} habitos={habitos} />
                            ))}
                        </>
                    )}

                    {/* Añadir habito */}
                    <div className="añadirHabito" onClick={onAñadirHabito}>
                        + Añadir
                    </div>
                </>
            )}
        </DashboardPanel>
    );
}
