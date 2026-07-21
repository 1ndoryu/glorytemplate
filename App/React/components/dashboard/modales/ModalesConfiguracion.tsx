/*
 * ModalesConfiguracion
 * Agrupa todos los modales de configuración de paneles
 * [233A-27] Incluye el modal de configuración global centralizado
 */

import {ModalConfiguracionLayout} from '../ModalConfiguracionLayout';
import {ModalConfiguracionTareas} from '../ModalConfiguracionTareas';
import {ModalConfiguracionHabitos} from '../ModalConfiguracionHabitos';
import {ModalConfiguracionScratchpad} from '../ModalConfiguracionScratchpad';
import {ModalConfiguracionActividad} from '../ModalConfiguracionActividad';
import {ModalConfiguracionProyectos} from '../proyectos/ModalConfiguracionProyectos';
import {ModalVersiones, ModalTemas} from '../../shared';
import {ModalFeedback} from '../../shared/ModalFeedback';
import {ModalConfiguracionMCP, ModalConfiguracionUsuario, ModalConfiguracionGlobal} from '../../configuracion';
import {ModalHistorialBackups} from '../ModalHistorialBackups';

import type {DashboardCompletoRetorno} from '../../../hooks/useDashboardCompleto';

interface ModalesConfiguracionProps {
    modales: DashboardCompletoRetorno['modales'];
    configTareas: DashboardCompletoRetorno['configTareas'];
    configHabitos: DashboardCompletoRetorno['configHabitos'];
    configProyectos: DashboardCompletoRetorno['configProyectos'];
    configScratchpad: DashboardCompletoRetorno['configScratchpad'];
    configActividad: DashboardCompletoRetorno['configActividad'];
    layout: DashboardCompletoRetorno['layout'];
    temas: DashboardCompletoRetorno['temas'];
}

export function ModalesConfiguracion({modales, configTareas, configHabitos, configProyectos, configScratchpad, configActividad, layout, temas}: ModalesConfiguracionProps): JSX.Element {
    return (
        <>
            {/* Configuración de Paneles */}
            <ModalConfiguracionTareas estaAbierto={modales.modalConfigTareasAbierto} onCerrar={modales.cerrarModalConfigTareas} configuracion={configTareas.configuracion} onToggleCompletadas={configTareas.toggleOcultarCompletadas} onToggleBadgeProyecto={configTareas.toggleOcultarBadgeProyecto} onToggleEliminarCompletadas={configTareas.toggleEliminarCompletadasDespuesDeUnDia} onToggleMostrarHabitos={configTareas.toggleMostrarHabitosEnEjecucion} onToggleModoCompacto={configTareas.toggleModoCompacto} onToggleOcultarSubtareas={configTareas.toggleOcultarSubtareasAutomaticamente} onToggleIgnorarUrgencia={configTareas.toggleIgnorarUrgenciaEnPrioridad} />
            <ModalConfiguracionHabitos estaAbierto={modales.modalConfigHabitosAbierto} onCerrar={modales.cerrarModalConfigHabitos} configuracion={configHabitos.configuracion} esMovil={configHabitos.esMovil} onToggleCompletadosHoy={configHabitos.toggleOcultarCompletadosHoy} onToggleModoCompacto={configHabitos.toggleModoCompacto} onToggleMostrarPausados={configHabitos.toggleMostrarPausados} onToggleColumna={configHabitos.toggleColumnaVisible} onCambiarTolerancia={configHabitos.cambiarToleranciaPreset} />
            <ModalConfiguracionProyectos estaAbierto={modales.modalConfigProyectosAbierto} onCerrar={modales.cerrarModalConfigProyectos} configuracion={configProyectos.configuracion} onToggleCompletados={configProyectos.toggleOcultarCompletados} onToggleTareasCompletadas={configProyectos.toggleOcultarTareasCompletadas} onToggleProgreso={configProyectos.toggleMostrarProgreso} onToggleModoCompacto={configProyectos.toggleModoCompacto} />
            <ModalConfiguracionScratchpad estaAbierto={modales.modalConfigScratchpadAbierto} onCerrar={modales.cerrarModalConfigScratchpad} configuracion={configScratchpad.configuracion} onCambiarFuente={configScratchpad.cambiarTamanoFuente} onCambiarAltura={configScratchpad.cambiarAltura} onCambiarIntervalo={configScratchpad.cambiarAutoGuardado} />
            <ModalConfiguracionActividad estaAbierto={modales.modalConfigActividadAbierto} onCerrar={modales.cerrarModalConfigActividad} configuracion={configActividad.configuracion} onCambiarPeriodo={configActividad.cambiarPeriodo} onCambiarFiltroTipo={configActividad.cambiarFiltroTipo} onCambiarTamanoCelda={configActividad.cambiarTamanoCelda} onToggleLeyenda={configActividad.toggleLeyenda} />
            <ModalConfiguracionLayout estaAbierto={modales.modalConfigLayoutAbierto} onCerrar={modales.cerrarModalConfigLayout} tipoLayout={layout.tipoLayout} modoColumnas={layout.modoColumnas} visibilidad={layout.visibilidad} ordenPaneles={layout.ordenPaneles} onCambiarTipoLayout={layout.cambiarTipoLayout} onCambiarModo={layout.cambiarModoColumnas} onTogglePanel={layout.toggleVisibilidadPanel} onMoverPanelArriba={layout.moverPanelArriba} onMoverPanelAbajo={layout.moverPanelAbajo} onMoverPanelAColumna={layout.moverPanelAColumna} onResetearOrden={layout.resetearOrdenPaneles} onResetear={layout.resetearLayout} />

            {/* Modales Generales */}
            <ModalVersiones estaAbierto={modales.modalVersionesAbierto} onCerrar={modales.cerrarModalVersiones} />
            <ModalFeedback estaAbierto={modales.modalFeedbackAbierto} onCerrar={modales.cerrarModalFeedback} />
            <ModalTemas estaAbierto={modales.modalTemasAbierto} onCerrar={modales.cerrarModalTemas} temaActual={temas.tema} onCambiarTema={temas.cambiarTema} />
            <ModalConfiguracionMCP estaAbierto={modales.modalConfigMCPAbierto} onCerrar={modales.cerrarModalConfigMCP} onAbrirUpgrade={modales.abrirModalUpgrade} />
            <ModalConfiguracionUsuario estaAbierto={modales.modalConfigUsuarioAbierto} onCerrar={modales.cerrarModalConfigUsuario} />
            <ModalHistorialBackups estaAbierto={modales.modalBackupsAbierto} onCerrar={modales.cerrarModalBackups} onAbrirUpgrade={modales.abrirModalUpgrade} />

            {/* [233A-27] Modal de configuración global centralizado */}
            <ModalConfiguracionGlobal estaAbierto={modales.modalConfigGlobalAbierto} onCerrar={modales.cerrarModalConfigGlobal} seccionInicial={modales.seccionConfigGlobal} onAbrirUpgrade={modales.abrirModalUpgrade} />
        </>
    );
}
