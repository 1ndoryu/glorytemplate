/*
 * DashboardGrid
 * Componente que renderiza el grid de paneles del Dashboard
 * Extraído para reducir la complejidad de DashboardIsland
 */

import {useCallback, useMemo, CSSProperties} from 'react';
import {PanelArrastrable, HandleArrastre, BotonMinimizarPanel, ResizeHandlePanel, ResizeHandleColumn} from '../shared';
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

        /* Scratchpad tiene su propio sistema de resize interno y gestiona sus notas */
        if (panelId === 'scratchpad') {
            return <PanelScratchpad configuracion={configScratchpad.configuracion} onAbrirModalConfigScratchpad={modales.abrirModalConfigScratchpad} onCambiarAltura={configScratchpad.cambiarAltura} handleArrastre={handleArrastreElement} handleMinimizar={handleMinimizarElement} />;
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

    /* Calcular estilos dinámicos con CSS variables para anchos de columna (fr units) */
    const estiloGrid = useMemo((): CSSProperties => {
        const anchos = layout.anchos;
        return {
            '--col1-ancho': `${anchos.columna1}%`,
            '--col2-ancho': `${anchos.columna2}%`,
            '--col3-ancho': `${anchos.columna3}%`,
            '--col1-fr': `${anchos.columna1}fr`,
            '--col2-fr': `${anchos.columna2}fr`,
            '--col3-fr': `${anchos.columna3}fr`
        } as CSSProperties;
    }, [layout.anchos]);

    return (
        <div className="dashboardGridContenedor" style={{width: `${layout.anchoTotal}%`}}>
            <div className={`dashboardGridColumnas dashboardGridColumnas--${layout.modoColumnas}col ${arrastre.panelArrastrando ? 'arrastrandoPanel' : ''}`} style={estiloGrid}>
                {/* Columna 1 con handle al final si hay más columnas */}
                <div className="dashboardGridColumna dashboardGridColumna--conHandle">
                    {renderizarColumna(1)}
                    {layout.modoColumnas >= 2 && <ResizeHandleColumn tipo="interno" posicion={1} modoColumnas={layout.modoColumnas} anchos={layout.anchos} anchoTotal={layout.anchoTotal} onCambiarAnchos={layout.ajustarAnchos} onCambiarAnchoTotal={layout.cambiarAnchoTotal} />}
                </div>

                {/* Columna 2 con handle al final si hay 3 columnas */}
                {layout.modoColumnas >= 2 && (
                    <div className="dashboardGridColumna dashboardGridColumna--conHandle">
                        {renderizarColumna(2)}
                        {layout.modoColumnas === 3 && <ResizeHandleColumn tipo="interno" posicion={2} modoColumnas={layout.modoColumnas} anchos={layout.anchos} anchoTotal={layout.anchoTotal} onCambiarAnchos={layout.ajustarAnchos} onCambiarAnchoTotal={layout.cambiarAnchoTotal} />}
                    </div>
                )}

                {/* Columna 3 sin handle */}
                {layout.modoColumnas === 3 && <div className="dashboardGridColumna">{renderizarColumna(3)}</div>}
            </div>

            {/* Handle externo para ancho total */}
            <ResizeHandleColumn tipo="externo" modoColumnas={layout.modoColumnas} anchos={layout.anchos} anchoTotal={layout.anchoTotal} onCambiarAnchos={layout.ajustarAnchos} onCambiarAnchoTotal={layout.cambiarAnchoTotal} />
        </div>
    );
}
