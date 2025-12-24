/*
 * DashboardGrid
 * Componente que renderiza el grid de paneles del Dashboard
 * Extraído para reducir la complejidad de DashboardIsland
 */

import {useCallback} from 'react';
import {PanelArrastrable, HandleArrastre, BotonMinimizarPanel, ResizeHandlePanel} from '../shared';
import {PanelFocoPrioritario, PanelProyectos, PanelEjecucion, PanelScratchpad} from '../paneles';

import type {DashboardCompletoRetorno} from '../../hooks/useDashboardCompleto';
import type {PanelId} from '../../hooks/useConfiguracionLayout';

interface DashboardGridProps {
    ctx: DashboardCompletoRetorno;
}

export function DashboardGrid({ctx}: DashboardGridProps): JSX.Element {
    const {dashboard, modales, compartir, ordenHabitos, filtroTareas, ordenTareas, habitosComoTareas, configTareas, configHabitos, configProyectos, configScratchpad, layout, arrastre, opciones, acciones, valorFiltroActual} = ctx;

    /*
     * Handler que intercepta toggles de tareas-hábito
     * Si es una tarea-hábito (ID negativo), llama al toggle del hábito
     * Si es una tarea normal, llama al toggle de tarea
     */
    const manejarToggleTarea = useCallback(
        (id: number) => {
            const fueHabito = habitosComoTareas.manejarToggleTareaHabito(id);
            if (!fueHabito) {
                dashboard.toggleTarea(id);
            }
        },
        [habitosComoTareas, dashboard]
    );

    /* Handler genérico para cambiar altura de paneles */
    const manejarCambiarAlturaPanel = useCallback(
        (panelId: PanelId, altura: string) => {
            layout.cambiarAlturaPanel(panelId, altura);
        },
        [layout]
    );

    const renderizarContenidoPanel = (panelId: PanelId): JSX.Element | null => {
        const handleArrastreElement = <HandleArrastre panelId={panelId} onMouseDown={arrastre.iniciarArrastre} estaArrastrando={arrastre.panelArrastrando === panelId} />;
        const handleMinimizarElement = <BotonMinimizarPanel panelId={panelId} onMinimizar={layout.ocultarPanel} />;

        /* Scratchpad tiene su propio sistema de resize interno */
        if (panelId === 'scratchpad') {
            return <PanelScratchpad notas={dashboard.notas} configuracion={configScratchpad.configuracion} onActualizarNotas={dashboard.actualizarNotas} onLimpiarScratchpad={acciones.manejarLimpiarScratchpad} onAbrirModalConfigScratchpad={modales.abrirModalConfigScratchpad} onCambiarAltura={configScratchpad.cambiarAltura} handleArrastre={handleArrastreElement} handleMinimizar={handleMinimizarElement} />;
        }

        /* Obtener altura del panel desde configuración */
        const alturaPanel = layout.obtenerAlturaPanel(panelId);

        const panelesContenido: Partial<Record<PanelId, (alturaProps: {altura: string; isResizing: boolean; contenedorRef: React.RefObject<HTMLDivElement>; esAuto: boolean}) => JSX.Element>> = {
            focoPrioritario: ({altura, contenedorRef, esAuto}) => (
                <div ref={contenedorRef} className="panelDashboard" style={esAuto ? undefined : {height: altura}}>
                    <PanelFocoPrioritario habitos={ordenHabitos.habitosOrdenados} modoOrdenHabitos={ordenHabitos.modoActual} opcionesOrdenHabitos={opciones.opcionesOrdenHabitos} configuracion={configHabitos.configuracion} onAbrirModalCrearHabito={dashboard.abrirModalCrearHabito} onAbrirModalConfigHabitos={modales.abrirModalConfigHabitos} onToggleHabito={dashboard.toggleHabito} onEditarHabito={dashboard.abrirModalEditarHabito} onEliminarHabito={dashboard.eliminarHabito} onCambiarModoHabitos={ordenHabitos.cambiarModo} handleArrastre={handleArrastreElement} handleMinimizar={handleMinimizarElement} />
                </div>
            ),
            proyectos: ({altura, contenedorRef, esAuto}) => (
                <div ref={contenedorRef} className="panelDashboard" style={esAuto ? undefined : {height: altura}}>
                    <PanelProyectos proyectos={dashboard.proyectos || []} tareas={dashboard.tareas} configuracion={configProyectos.configuracion} opcionesOrdenProyectos={opciones.opcionesOrdenProyectos} onAbrirModalCrearProyecto={modales.abrirModalCrearProyecto} onAbrirModalEditarProyecto={modales.abrirModalEditarProyecto} onAbrirModalConfigProyectos={modales.abrirModalConfigProyectos} onEliminarProyecto={dashboard.eliminarProyecto} onCambiarEstadoProyecto={dashboard.cambiarEstadoProyecto} onCambiarOrdenProyectos={configProyectos.cambiarOrdenDefecto} onCompartirProyecto={compartir.manejarCompartirProyecto} estaCompartido={compartir.estaCompartidoProyecto} onToggleTarea={dashboard.toggleTarea} onCrearTarea={dashboard.crearTarea} onEditarTarea={dashboard.editarTarea} onEliminarTarea={dashboard.eliminarTarea} onReordenarTareas={dashboard.reordenarTareas} handleArrastre={handleArrastreElement} handleMinimizar={handleMinimizarElement} />
                </div>
            ),
            ejecucion: ({altura, contenedorRef, esAuto}) => (
                <div ref={contenedorRef} className="panelDashboard internaColumna" style={esAuto ? undefined : {height: altura}}>
                    <PanelEjecucion
                        tareas={ordenTareas.tareasOrdenadas}
                        proyectos={dashboard.proyectos || []}
                        proyectoIdActual={filtroTareas.filtroActual.tipo === 'proyecto' ? filtroTareas.filtroActual.proyectoId : undefined}
                        ocultarCompletadas={configTareas.configuracion.ocultarCompletadas}
                        ocultarBadgeProyecto={configTareas.configuracion.ocultarBadgeProyecto}
                        modoOrden={ordenTareas.modoActual}
                        valorFiltroActual={valorFiltroActual}
                        opcionesFiltro={opciones.opcionesFiltro}
                        opcionesOrdenTareas={opciones.opcionesOrdenTareas}
                        esOrdenManual={ordenTareas.esOrdenManual}
                        onAbrirModalNuevaTarea={modales.abrirModalNuevaTarea}
                        onAbrirModalConfigTareas={modales.abrirModalConfigTareas}
                        onToggleTarea={manejarToggleTarea}
                        onCrearTarea={dashboard.crearTarea}
                        onEditarTarea={dashboard.editarTarea}
                        onEliminarTarea={dashboard.eliminarTarea}
                        onReordenarTareas={dashboard.reordenarTareas}
                        onCambiarFiltro={acciones.manejarCambioFiltro}
                        onCambiarModoOrden={ordenTareas.cambiarModo}
                        onCompartirTarea={compartir.manejarCompartirTarea}
                        estaCompartida={compartir.estaCompartidaTarea}
                        obtenerParticipantes={compartir.obtenerParticipantesTarea}
                        handleArrastre={handleArrastreElement}
                        handleMinimizar={handleMinimizarElement}
                    />
                </div>
            )
        };

        const renderContenido = panelesContenido[panelId];
        if (!renderContenido) return null;

        return (
            <ResizeHandlePanel panelId={panelId} alturaInicial={alturaPanel} onCambiarAltura={manejarCambiarAlturaPanel}>
                {renderContenido}
            </ResizeHandlePanel>
        );
    };

    const renderizarPanel = (panelId: PanelId): JSX.Element => (
        <PanelArrastrable key={panelId} panelId={panelId} innerRef={el => arrastre.registrarPanel(panelId, el)} esArrastrando={arrastre.panelArrastrando === panelId} esDestino={arrastre.zonaDropActiva?.panelId === panelId} posicionDestino={arrastre.zonaDropActiva?.panelId === panelId ? arrastre.zonaDropActiva.posicion : null}>
            {renderizarContenidoPanel(panelId)}
        </PanelArrastrable>
    );

    const renderizarColumna = (columna: 1 | 2 | 3): JSX.Element[] => layout.obtenerPanelesColumna(columna).map(renderizarPanel);

    return (
        <div className={`dashboardGrid dashboardGrid--${layout.modoColumnas}col ${arrastre.panelArrastrando ? 'arrastrandoPanel' : ''}`}>
            <div className="columnaDashboard">{renderizarColumna(1)}</div>

            {layout.modoColumnas >= 2 && <div className="columnaDashboard">{renderizarColumna(2)}</div>}

            {layout.modoColumnas === 3 && <div className="columnaDashboard">{renderizarColumna(3)}</div>}
        </div>
    );
}
