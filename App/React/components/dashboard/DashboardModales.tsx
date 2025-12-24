/*
 * DashboardModales
 * Componente que agrupa todos los modales del Dashboard
 * Extraído para reducir la complejidad de DashboardIsland
 */

import {Bell} from 'lucide-react';
import {ModalHabito} from './ModalHabito';
import {ModalProyecto} from './proyectos/ModalProyecto';
import {ModalLogin} from './ModalLogin';
import {PanelSeguridad} from './PanelSeguridad';
import {ModalConfiguracionLayout} from './ModalConfiguracionLayout';
import {PanelConfiguracionTarea} from './PanelConfiguracionTarea';
import {ModalConfiguracionProyectos} from './proyectos/ModalConfiguracionProyectos';
import {ModalPerfil} from './ModalPerfil';
import {ModalConfiguracionTareas} from './ModalConfiguracionTareas';
import {ModalConfiguracionHabitos} from './ModalConfiguracionHabitos';
import {ModalConfiguracionScratchpad} from './ModalConfiguracionScratchpad';

import {ToastDeshacer, ModalUpgrade, TooltipSystem, BarraPanelesOcultos, IndicadorArrastre, ModalVersiones} from '../shared';
import {PanelAdministracion} from '../admin';
import {ModalEquipos} from '../equipos';
import {ModalNotificaciones} from '../notificaciones';
import {ModalCompartir} from '../compartidos';
import {ModalExperimentos} from '../experimentos/ModalExperimentos';

import type {DashboardCompletoRetorno} from '../../hooks/useDashboardCompleto';
import type {AccionExperimento} from '../experimentos/ModalExperimentos';

interface DashboardModalesProps {
    ctx: DashboardCompletoRetorno;
}

export function DashboardModales({ctx}: DashboardModalesProps): JSX.Element {
    const {dashboard, auth, suscripcion, esAdmin, modales, equipos, notificaciones, compartir, configTareas, configHabitos, configProyectos, configScratchpad, layout, arrastre, acciones} = ctx;

    const accionesExperimentos: AccionExperimento[] = [
        {
            id: 'notificacion-prueba',
            nombre: 'Crear Notificación de Prueba',
            descripcion: 'Crea una notificación de tipo solicitud_equipo para probar el sistema.',
            icono: <Bell size={20} />,
            ejecutar: acciones.crearNotificacionPrueba
        }
    ];

    return (
        <>
            {/* Modales de Autenticación y Usuario */}
            <ModalLogin estaAbierto={modales.modalLoginAbierto} onCerrar={modales.cerrarModalLogin} onLoginGoogle={auth.loginWithGoogle} onLoginCredentials={auth.loginWithCredentials} onRegister={auth.register} loading={auth.loading} error={auth.error} />
            <ModalUpgrade visible={modales.modalUpgradeAbierto} onCerrar={modales.cerrarModalUpgrade} suscripcion={suscripcion} />
            <PanelSeguridad visible={modales.panelSeguridadAbierto} onCerrar={modales.cerrarPanelSeguridad} />
            <ModalPerfil estaAbierto={modales.modalPerfilAbierto} onCerrar={modales.cerrarModalPerfil} />

            {/* Modales Sociales */}
            {modales.modalNotificacionesAbierto && <ModalNotificaciones notificaciones={notificaciones.notificaciones} noLeidas={notificaciones.noLeidas} total={notificaciones.total} cargando={notificaciones.cargando} cargandoPrimeraVez={notificaciones.cargandoPrimeraVez} posicionX={modales.posicionModalNotificaciones.x} posicionY={modales.posicionModalNotificaciones.y} onMarcarLeida={notificaciones.marcarLeida} onMarcarTodasLeidas={notificaciones.marcarTodasLeidas} onEliminar={notificaciones.eliminar} onClickNotificacion={acciones.manejarClickNotificacionIndividual} onCerrar={modales.cerrarModalNotificaciones} />}
            <ModalEquipos estaAbierto={modales.modalEquiposAbierto} onCerrar={modales.cerrarModalEquipos} />

            {/* Modales de Hábitos */}
            <ModalHabito estaAbierto={dashboard.modalCrearHabitoAbierto} onCerrar={dashboard.cerrarModalCrearHabito} onGuardar={dashboard.crearHabito} />
            <ModalHabito estaAbierto={dashboard.habitoEditando !== null} onCerrar={dashboard.cerrarModalEditarHabito} onGuardar={datos => dashboard.editarHabito(dashboard.habitoEditando!.id, datos)} habito={dashboard.habitoEditando ?? undefined} />

            {/* Modales de Proyectos */}
            <ModalProyecto estaAbierto={modales.modalCrearProyectoAbierto} onCerrar={modales.cerrarModalCrearProyecto} onGuardar={acciones.manejarGuardarNuevoProyecto} />
            <ModalProyecto estaAbierto={modales.proyectoEditando !== null} onCerrar={modales.cerrarModalEditarProyecto} onGuardar={acciones.manejarGuardarEdicionProyecto} proyecto={modales.proyectoEditando ?? undefined} participantes={modales.proyectoEditando ? compartir.cacheParticipantesProyecto.get(modales.proyectoEditando.id) ?? [] : []} />

            {/* Modales de Configuración */}
            <ModalConfiguracionTareas estaAbierto={modales.modalConfigTareasAbierto} onCerrar={modales.cerrarModalConfigTareas} configuracion={configTareas.configuracion} onToggleCompletadas={configTareas.toggleOcultarCompletadas} onToggleBadgeProyecto={configTareas.toggleOcultarBadgeProyecto} onToggleEliminarCompletadas={configTareas.toggleEliminarCompletadasDespuesDeUnDia} onToggleMostrarHabitos={configTareas.toggleMostrarHabitosEnEjecucion} />
            <ModalConfiguracionHabitos estaAbierto={modales.modalConfigHabitosAbierto} onCerrar={modales.cerrarModalConfigHabitos} configuracion={configHabitos.configuracion} onToggleCompletadosHoy={configHabitos.toggleOcultarCompletadosHoy} onToggleModoCompacto={configHabitos.toggleModoCompacto} onToggleColumna={configHabitos.toggleColumnaVisible} />
            <ModalConfiguracionProyectos estaAbierto={modales.modalConfigProyectosAbierto} onCerrar={modales.cerrarModalConfigProyectos} configuracion={configProyectos.configuracion} onToggleCompletados={configProyectos.toggleOcultarCompletados} onToggleProgreso={configProyectos.toggleMostrarProgreso} />
            <ModalConfiguracionScratchpad estaAbierto={modales.modalConfigScratchpadAbierto} onCerrar={modales.cerrarModalConfigScratchpad} configuracion={configScratchpad.configuracion} onCambiarFuente={configScratchpad.cambiarTamanoFuente} onCambiarAltura={configScratchpad.cambiarAltura} onCambiarIntervalo={configScratchpad.cambiarAutoGuardado} />
            <ModalConfiguracionLayout estaAbierto={modales.modalConfigLayoutAbierto} onCerrar={modales.cerrarModalConfigLayout} modoColumnas={layout.modoColumnas} visibilidad={layout.visibilidad} ordenPaneles={layout.ordenPaneles} onCambiarModo={layout.cambiarModoColumnas} onTogglePanel={layout.toggleVisibilidadPanel} onMoverPanelArriba={layout.moverPanelArriba} onMoverPanelAbajo={layout.moverPanelAbajo} onMoverPanelAColumna={layout.moverPanelAColumna} onResetearOrden={layout.resetearOrdenPaneles} onResetear={layout.resetearLayout} />

            {/* Modales Misceláneos */}
            <ModalVersiones estaAbierto={modales.modalVersionesAbierto} onCerrar={modales.cerrarModalVersiones} />
            {esAdmin && <PanelAdministracion estaAbierto={modales.panelAdminAbierto} onCerrar={modales.cerrarPanelAdmin} />}
            <ModalExperimentos abierto={modales.modalExperimentosAbierto} onCerrar={modales.cerrarModalExperimentos} acciones={accionesExperimentos} />

            {/* Modales de Compartir */}
            <ModalCompartir visible={compartir.proyectoCompartiendo !== null} onCerrar={compartir.cerrarModalCompartirProyecto} tipo="proyecto" elementoId={compartir.proyectoCompartiendo?.id ?? 0} elementoNombre={compartir.proyectoCompartiendo?.nombre ?? ''} companeros={equipos.companeros} participantes={compartir.participantesProyecto} cifradoActivo={false} onCompartir={compartir.manejarCompartirElemento} onCambiarRol={compartir.manejarCambiarRolCompartido} onDejarDeCompartir={compartir.manejarDejarDeCompartir} cargandoParticipantes={compartir.cargando} />
            <ModalCompartir visible={compartir.tareaCompartiendo !== null} onCerrar={compartir.cerrarModalCompartirTarea} tipo="tarea" elementoId={compartir.tareaCompartiendo?.id ?? 0} elementoNombre={compartir.tareaCompartiendo?.texto ?? ''} companeros={equipos.companeros} participantes={compartir.participantesTarea} cifradoActivo={false} onCompartir={compartir.manejarCompartirTareaElemento} onCambiarRol={compartir.manejarCambiarRolTareaCompartida} onDejarDeCompartir={compartir.manejarDejarDeCompartir} cargandoParticipantes={compartir.cargando} />

            {/* Modal Nueva Tarea */}
            {modales.modalNuevaTareaAbierto && <PanelConfiguracionTarea estaAbierto={modales.modalNuevaTareaAbierto} onCerrar={modales.cerrarModalNuevaTarea} onGuardar={acciones.manejarCrearNuevaTareaGlobal} />}

            {/* Componentes Auxiliares */}
            {dashboard.accionDeshacer && <ToastDeshacer mensaje={dashboard.accionDeshacer.mensaje} tiempoRestante={dashboard.accionDeshacer.tiempoRestante} tiempoTotal={5000} onDeshacer={dashboard.ejecutarDeshacer} onDescartar={dashboard.descartarDeshacer} />}
            <BarraPanelesOcultos panelesOcultos={layout.panelesOcultos} onMostrarPanel={layout.mostrarPanel} />
            <TooltipSystem />
            <IndicadorArrastre panelArrastrando={arrastre.panelArrastrando} posicionMouse={arrastre.posicionMouse} />
        </>
    );
}
