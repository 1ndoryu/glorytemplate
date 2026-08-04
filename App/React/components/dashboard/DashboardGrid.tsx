/*
 * DashboardGrid
 * Componente que renderiza el grid de paneles del Dashboard
 * Lógica extraída a useDashboardGrid hook
 *
 * Refactor OCP - Fase 3: Obtiene componentes dinámicamente del registro
 * Refactor SOLID: Creación de tareas verifica límites de plan
 */

import {PanelArrastrable, HandleArrastre, BotonMinimizarPanel, ResizeHandlePanel, ResizeHandleColumn, PullToRefresh} from '../shared';
import {obtenerPanelOBase, panelManejaAlturaPropia, paginaMovilAPanelId, obtenerIdBase, panelPuedeMostrarse} from '../../config/registroPaneles';

import type {DashboardCompletoRetorno} from '../../hooks/useDashboardCompleto';
import type {PanelId} from '../../hooks/useConfiguracionLayout';
import {useDashboardGrid, obtenerGeneradorPropsPanel} from '../../hooks/dashboard/useDashboardGrid';

/* Tipo para pages móviles - ahora dinámico desde el registro */
type PaginaMovil = string;

interface DashboardGridProps {
    ctx: DashboardCompletoRetorno;
    esMovil?: boolean;
    paginaMovilActiva?: PaginaMovil;
}

export function DashboardGrid({ctx, esMovil = false, paginaMovilActiva = 'ejecucion'}: DashboardGridProps): JSX.Element {
    const {layout, arrastre} = ctx;
    const {refMovilNula, propsContexto, manejarToggleTarea, manejarEditarHabitoPorId, manejarCambiarAlturaPanel, estiloGrid, manejarRefreshMovil} = useDashboardGrid(ctx, esMovil);

    /*
     * Renderiza el contenido de un panel usando el registro
     * [263A-3] Resuelve instancias duplicadas (e.g., scratchpad-1 → scratchpad) al componente base
     */
    const renderizarContenidoPanel = (panelId: PanelId): JSX.Element | null => {
        const baseId = obtenerIdBase(panelId);
        if (!panelPuedeMostrarse(baseId)) return null;

        const definicionPanel = obtenerPanelOBase(panelId);
        if (!definicionPanel) {
            console.warn(`Panel "${panelId}" no encontrado en el registro`);
            return null;
        }

        /* En móvil, no renderizamos handle de arrastre ni botón minimizar */
        const renderHandleArrastre = (titulo?: string) => (esMovil ? <></> : <HandleArrastre panelId={panelId} onMouseDown={arrastre.iniciarArrastre} estaArrastrando={arrastre.panelArrastrando === panelId} titulo={titulo} />);
        const handleMinimizarElement = esMovil ? <></> : <BotonMinimizarPanel panelId={panelId} onMinimizar={layout.ocultarPanel} />;

        /* [263A-3] Buscar generador por ID exacto primero, luego por base */
        const generadorProps = obtenerGeneradorPropsPanel(panelId, baseId);

        /* Generar props según el tipo de panel - any necesario: dispatch dinámico por registro de paneles */
        // sentinel-disable-next-line any-type-explicito — props varían por tipo de panel via generadorProps
        let props: any;
        if (baseId === 'ejecucion') {
            props = generadorProps(propsContexto, renderHandleArrastre, handleMinimizarElement, manejarToggleTarea, manejarEditarHabitoPorId, esMovil);
        } else if (baseId === 'focoPrioritario') {
            props = generadorProps(propsContexto, renderHandleArrastre, handleMinimizarElement, esMovil);
        } else {
            props = generadorProps(propsContexto, renderHandleArrastre, handleMinimizarElement, esMovil);
        }

        /* Inyectar panelId a todos los paneles para permitir estado por instancia */
        props.panelId = panelId;

        /* [263A-3][263A-12] Inyectar props de duplicación a paneles scratchpad.
         * La nota se inicializa automáticamente al montar el nuevo panel (usePanelScratchpad). */
        if (baseId === 'scratchpad') {
            props.onDuplicarPanel = () => {
                layout.duplicarPanel(baseId);
            };
        }

        /* Cerrar solo para paneles duplicados o divididos (ids con sufijo) */
        if (panelId !== baseId) {
            props.onCerrarPanel = () => layout.cerrarPanelDuplicado(panelId);
        }

        /* Inyectar opción de dividir panel para ejecución y scratchpad */
        if (baseId === 'ejecucion' || baseId === 'scratchpad') {
            props.onDividirPanel = () => {
                layout.dividirPanel(baseId);
            };
        }

        const Componente = definicionPanel.componente;
        const manejaAltura = panelManejaAlturaPropia(panelId);

        /* [024A-32] Paneles que manejan su propia altura (scratchpad, actividad)
         * siguen recibiendo el wrapper panelDashboard para mantener borde/fondo/radio,
         * pero no se envuelven en ResizeHandlePanel. */
        if (manejaAltura) {
            return (
                <div className={`panelDashboard ${esMovil ? 'panelDashboard--movil' : ''}`}>
                    <Componente {...props} />
                </div>
            );
        }

        /* Obtener altura del panel desde configuración */
        const alturaPanel = layout.obtenerAlturaPanel(panelId);

        /* Función de renderizado para ResizeHandlePanel */
        const renderConContenedor = ({altura, contenedorRef, esAuto}: {altura: string; isResizing: boolean; contenedorRef: React.RefObject<HTMLDivElement | null>; esAuto: boolean}) => (
            <div ref={contenedorRef as React.RefObject<HTMLDivElement>} className={`panelDashboard ${esMovil ? 'panelDashboard--movil' : ''}`} style={esAuto || esMovil ? undefined : {height: altura}}>
                <Componente {...props} />
            </div>
        );

        /* En móvil no usamos ResizeHandlePanel */
        if (esMovil) {
            return renderConContenedor({altura: 'auto', isResizing: false, contenedorRef: refMovilNula, esAuto: true});
        }

        return (
            <ResizeHandlePanel panelId={panelId} alturaInicial={alturaPanel} onCambiarAltura={manejarCambiarAlturaPanel}>
                {renderConContenedor}
            </ResizeHandlePanel>
        );
    };

    const renderizarPanel = (panelId: PanelId): JSX.Element => (
        <PanelArrastrable key={panelId} panelId={panelId} innerRef={el => arrastre.registrarPanel(panelId, el)} esArrastrando={arrastre.panelArrastrando === panelId} esDestino={arrastre.zonaDropActiva?.panelId === panelId} posicionDestino={arrastre.zonaDropActiva?.panelId === panelId ? arrastre.zonaDropActiva.posicion : null}>
            {renderizarContenidoPanel(panelId)}
        </PanelArrastrable>
    );

    const renderizarColumna = (columna: 1 | 2 | 3): JSX.Element[] => {
        const ids = layout.obtenerPanelesColumna(columna).filter(panelPuedeMostrarse);
        const orden = layout.ordenPaneles || [];

        const resultados: JSX.Element[] = [];
        let i = 0;
        while (i < ids.length) {
            const panelId = ids[i];
            const config = orden.find(p => p.id === panelId);

            /* Si tiene panelDivisionId, agrupar todos los paneles de esa división consecutivos */
            if (config?.panelDivisionId) {
                const miembros: PanelId[] = [panelId];
                let j = i + 1;
                while (j < ids.length) {
                    const siguienteConfig = orden.find(p => p.id === ids[j]);
                    if (siguienteConfig?.panelDivisionId === config.panelDivisionId) {
                        miembros.push(ids[j]);
                        j++;
                    } else {
                        break;
                    }
                }

                if (miembros.length > 1) {
                    resultados.push(
                        <div key={`split-${config.panelDivisionId}`} className="dashboardPanelDivision">
                            {miembros.map(id => renderizarPanel(id))}
                        </div>
                    );
                    i = j;
                    continue;
                }
            }

            resultados.push(renderizarPanel(panelId));
            i++;
        }

        return resultados;
    };

    /*
     * MODO MÓVIL: Renderizamos solo el panel correspondiente a la página activa
     * Layout simplificado sin columnas, handles ni arrastre
     * Envuelto en PullToRefresh para gesto nativo de recarga
     */
    if (esMovil) {
        /* Obtener el panelId desde la página móvil usando el registro */
        const panelActivo = paginaMovilAPanelId(paginaMovilActiva) || 'ejecucion';

        return (
            <PullToRefresh onRefresh={manejarRefreshMovil}>
                <div className="dashboardGridContenedor dashboardGridContenedor--movil">
                    <div className="dashboardGridMovil">{renderizarContenidoPanel(panelActivo)}</div>
                </div>
            </PullToRefresh>
        );
    }

    /* MODO DESKTOP: Grid normal con columnas y handles */
    return (
        <div className="dashboardGridContenedor" style={{/* sentinel-disable inline-style-prohibido */ width: `${layout.anchoTotal}%`}}>
            {/* sentinel-disable inline-style-prohibido */}
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
