/*
 * useModalesDashboard
 * Hook para gestionar el estado de todos los modales del dashboard
 * Responsabilidad única: centralizar apertura/cierre de modales
 */

import {useState, useCallback} from 'react';
import type {Proyecto, Habito, Tarea} from '../types/dashboard';

/* [233A-27] Secciones disponibles en el modal de configuración global */
/* [243A-1] Agrega 'panelIA' para la config del chat IA (API key, modelo, preferencias) */
/* [263A-5] Agrega 'gruposFb' para config del panel de grupos FB (token, API URL) */
/* [105A-1] Agrega 'deficitCalorico' para centralizar el formulario de calorías. */
export type SeccionConfigGlobal = 'tareas' | 'habitos' | 'proyectos' | 'notas' | 'actividad' | 'deficitCalorico' | 'panelIA' | 'gruposFb' | 'layout' | 'perfil' | 'preferencias' | 'temas' | 'seguridad' | 'ia' | 'backups' | 'plugins';

interface PosicionModal {
    x: number;
    y: number;
}

interface ValoresCreacionRapida {
    proyectoId?: number;
    prioridad?: string;
    urgencia?: string;
    grupoEjecucion?: string | null;
}

interface UseModalesDashboardReturn {
    modalLoginAbierto: boolean;
    abrirModalLogin: () => void;
    cerrarModalLogin: () => void;
    modalUpgradeAbierto: boolean;
    abrirModalUpgrade: () => void;
    cerrarModalUpgrade: () => void;
    panelSeguridadAbierto: boolean;
    abrirPanelSeguridad: () => void;
    cerrarPanelSeguridad: () => void;
    panelAdminAbierto: boolean;
    abrirPanelAdmin: () => void;
    cerrarPanelAdmin: () => void;
    modalPerfilAbierto: boolean;
    abrirModalPerfil: () => void;
    cerrarModalPerfil: () => void;
    modalEquiposAbierto: boolean;
    abrirModalEquipos: () => void;
    cerrarModalEquipos: () => void;
    modalNotificacionesAbierto: boolean;
    posicionModalNotificaciones: PosicionModal;
    abrirModalNotificaciones: (evento: React.MouseEvent) => void;
    cerrarModalNotificaciones: () => void;
    modalExperimentosAbierto: boolean;
    abrirModalExperimentos: () => void;
    cerrarModalExperimentos: () => void;
    modalCrearProyectoAbierto: boolean;
    abrirModalCrearProyecto: () => void;
    cerrarModalCrearProyecto: () => void;
    proyectoEditando: Proyecto | null;
    abrirModalEditarProyecto: (proyecto: Proyecto) => void;
    cerrarModalEditarProyecto: () => void;
    modalConfigTareasAbierto: boolean;
    abrirModalConfigTareas: () => void;
    cerrarModalConfigTareas: () => void;
    modalConfigHabitosAbierto: boolean;
    abrirModalConfigHabitos: () => void;
    cerrarModalConfigHabitos: () => void;
    modalConfigProyectosAbierto: boolean;
    abrirModalConfigProyectos: () => void;
    cerrarModalConfigProyectos: () => void;
    modalConfigScratchpadAbierto: boolean;
    abrirModalConfigScratchpad: () => void;
    cerrarModalConfigScratchpad: () => void;
    modalConfigActividadAbierto: boolean;
    abrirModalConfigActividad: () => void;
    cerrarModalConfigActividad: () => void;
    modalConfigLayoutAbierto: boolean;
    abrirModalConfigLayout: () => void;
    cerrarModalConfigLayout: () => void;
    modalVersionesAbierto: boolean;
    abrirModalVersiones: () => void;
    cerrarModalVersiones: () => void;
    modalNuevaTareaAbierto: boolean;
    abrirModalNuevaTarea: () => void;
    cerrarModalNuevaTarea: () => void;
    tareaEditando: Tarea | null;
    abrirModalEditarTarea: (tarea: Tarea) => void;
    cerrarModalEditarTarea: () => void;
    tareaEditandoMovil: Tarea | null;
    abrirEdicionTareaMovil: (tarea: Tarea) => void;
    cerrarEdicionTareaMovil: () => void;
    habitoEditandoMovil: Habito | null;
    abrirEdicionHabitoMovil: (habito: Habito) => void;
    cerrarEdicionHabitoMovil: () => void;
    modalCreacionRapida: 'tarea' | 'habito' | 'proyecto' | null;
    valoresCreacionRapida: ValoresCreacionRapida;
    abrirCreacionRapida: (tipo: 'tarea' | 'habito' | 'proyecto', valores?: ValoresCreacionRapida) => void;
    cerrarCreacionRapida: () => void;
    modalTemasAbierto: boolean;
    abrirModalTemas: () => void;
    cerrarModalTemas: () => void;
    modalConfigMCPAbierto: boolean;
    abrirModalConfigMCP: () => void;
    cerrarModalConfigMCP: () => void;
    modalConfigUsuarioAbierto: boolean;
    abrirModalConfigUsuario: () => void;
    cerrarModalConfigUsuario: () => void;
    modalBackupsAbierto: boolean;
    abrirModalBackups: () => void;
    cerrarModalBackups: () => void;
    modalFeedbackAbierto: boolean;
    abrirModalFeedback: () => void;
    cerrarModalFeedback: () => void;
    modalPluginsAbierto: boolean;
    pluginConfigInicial: string | null;
    abrirModalPlugins: () => void;
    abrirModalPluginsConConfig: (pluginId: string) => void;
    cerrarModalPlugins: () => void;
    modalConfigDeficitCaloricoAbierto: boolean;
    abrirModalConfigDeficitCalorico: () => void;
    cerrarModalConfigDeficitCalorico: () => void;
    /* [233A-27] Modal de configuración global */
    modalConfigGlobalAbierto: boolean;
    seccionConfigGlobal: SeccionConfigGlobal | null;
    abrirModalConfigGlobal: (seccion?: SeccionConfigGlobal | null) => void;
    cerrarModalConfigGlobal: () => void;
}

/* Helper: encapsula useState + useCallback para modales booleanos simples */
function useModalSimple(initial = false) {
    const [abierto, setAbierto] = useState(initial);
    const abrir = useCallback(() => setAbierto(true), []);
    const cerrar = useCallback(() => setAbierto(false), []);
    return {abierto, abrir, cerrar};
}

export function useModalesDashboard(): UseModalesDashboardReturn {
    /* Modales simples (booleanos) */
    const login = useModalSimple();
    const upgrade = useModalSimple();
    const seguridad = useModalSimple();
    const admin = useModalSimple();
    const perfil = useModalSimple();
    const equipos = useModalSimple();
    const experimentos = useModalSimple();
    const crearProyecto = useModalSimple();
    const configTareas = useModalSimple();
    const configHabitos = useModalSimple();
    const configProyectos = useModalSimple();
    const configScratchpad = useModalSimple();
    const configActividad = useModalSimple();
    const configLayout = useModalSimple();
    const versiones = useModalSimple();
    const nuevaTarea = useModalSimple();
    const temas = useModalSimple();
    const configMCP = useModalSimple();
    const configUsuario = useModalSimple();
    const backups = useModalSimple();
    const feedback = useModalSimple();
    const configDeficitCalorico = useModalSimple();

    /* [233A-27] Modal de configuración global con sidebar */
    const configGlobal = useModalSimple();
    const [seccionConfigGlobal, setSeccionConfigGlobal] = useState<SeccionConfigGlobal | null>('tareas');
    /* [024A-3] Acepta null para abrir el modal mostrando la lista de secciones en móvil */
    const abrirModalConfigGlobal = useCallback((seccion?: SeccionConfigGlobal | null) => {
        setSeccionConfigGlobal(seccion ?? null);
        configGlobal.abrir();
    }, [configGlobal.abrir]);

    /* Notificaciones (posición custom) */
    const [modalNotificacionesAbierto, setModalNotificacionesAbierto] = useState(false);
    const [posicionModalNotificaciones, setPosicionModalNotificaciones] = useState<PosicionModal>({x: 0, y: 0});

    /* Proyectos (edición con dato) */
    const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null);

    /* Editar Tarea / Tarea Móvil / Hábito Móvil */
    const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
    const [tareaEditandoMovil, setTareaEditandoMovil] = useState<Tarea | null>(null);
    const [habitoEditandoMovil, setHabitoEditandoMovil] = useState<Habito | null>(null);

    /* Creación Rápida */
    const [modalCreacionRapida, setModalCreacionRapida] = useState<'tarea' | 'habito' | 'proyecto' | null>(null);
    const [valoresCreacionRapida, setValoresCreacionRapida] = useState<ValoresCreacionRapida>({});

    /* Plugins */
    const [modalPluginsAbierto, setModalPluginsAbierto] = useState(false);
    const [pluginConfigInicial, setPluginConfigInicial] = useState<string | null>(null);

    /* Handlers complejos (no cubiertos por useModalSimple) */
    const abrirModalNotificaciones = useCallback((evento: React.MouseEvent) => {
        const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
        setPosicionModalNotificaciones({x: rect.right - 360, y: rect.bottom + 10});
        setModalNotificacionesAbierto(prev => !prev);
    }, []);
    const cerrarModalNotificaciones = useCallback(() => setModalNotificacionesAbierto(false), []);
    const abrirModalEditarProyecto = useCallback((proyecto: Proyecto) => setProyectoEditando(proyecto), []);
    const cerrarModalEditarProyecto = useCallback(() => setProyectoEditando(null), []);
    const abrirModalEditarTarea = useCallback((tarea: Tarea) => setTareaEditando(tarea), []);
    const cerrarModalEditarTarea = useCallback(() => setTareaEditando(null), []);
    const abrirEdicionTareaMovil = useCallback((tarea: Tarea) => setTareaEditandoMovil(tarea), []);
    const cerrarEdicionTareaMovil = useCallback(() => setTareaEditandoMovil(null), []);
    const abrirEdicionHabitoMovil = useCallback((habito: Habito) => setHabitoEditandoMovil(habito), []);
    const cerrarEdicionHabitoMovil = useCallback(() => setHabitoEditandoMovil(null), []);
    const abrirCreacionRapida = useCallback((tipo: 'tarea' | 'habito' | 'proyecto', valores?: ValoresCreacionRapida) => {
        setValoresCreacionRapida(valores || {});
        setModalCreacionRapida(tipo);
    }, []);
    const cerrarCreacionRapida = useCallback(() => {
        setModalCreacionRapida(null);
        setValoresCreacionRapida({});
    }, []);
    const abrirModalPlugins = useCallback(() => {
        setPluginConfigInicial(null);
        setModalPluginsAbierto(true);
    }, []);
    const abrirModalPluginsConConfig = useCallback((pluginId: string) => {
        setPluginConfigInicial(pluginId);
        setModalPluginsAbierto(true);
    }, []);
    const cerrarModalPlugins = useCallback(() => {
        setModalPluginsAbierto(false);
        setPluginConfigInicial(null);
    }, []);

    return {
        modalLoginAbierto: login.abierto,
        abrirModalLogin: login.abrir,
        cerrarModalLogin: login.cerrar,
        modalUpgradeAbierto: upgrade.abierto,
        abrirModalUpgrade: upgrade.abrir,
        cerrarModalUpgrade: upgrade.cerrar,
        panelSeguridadAbierto: seguridad.abierto,
        abrirPanelSeguridad: seguridad.abrir,
        cerrarPanelSeguridad: seguridad.cerrar,
        panelAdminAbierto: admin.abierto,
        abrirPanelAdmin: admin.abrir,
        cerrarPanelAdmin: admin.cerrar,
        modalPerfilAbierto: perfil.abierto,
        abrirModalPerfil: perfil.abrir,
        cerrarModalPerfil: perfil.cerrar,
        modalEquiposAbierto: equipos.abierto,
        abrirModalEquipos: equipos.abrir,
        cerrarModalEquipos: equipos.cerrar,
        modalNotificacionesAbierto,
        posicionModalNotificaciones,
        abrirModalNotificaciones,
        cerrarModalNotificaciones,
        modalExperimentosAbierto: experimentos.abierto,
        abrirModalExperimentos: experimentos.abrir,
        cerrarModalExperimentos: experimentos.cerrar,
        modalCrearProyectoAbierto: crearProyecto.abierto,
        abrirModalCrearProyecto: crearProyecto.abrir,
        cerrarModalCrearProyecto: crearProyecto.cerrar,
        proyectoEditando,
        abrirModalEditarProyecto,
        cerrarModalEditarProyecto,
        modalConfigTareasAbierto: configTareas.abierto,
        abrirModalConfigTareas: configTareas.abrir,
        cerrarModalConfigTareas: configTareas.cerrar,
        modalConfigHabitosAbierto: configHabitos.abierto,
        abrirModalConfigHabitos: configHabitos.abrir,
        cerrarModalConfigHabitos: configHabitos.cerrar,
        modalConfigProyectosAbierto: configProyectos.abierto,
        abrirModalConfigProyectos: configProyectos.abrir,
        cerrarModalConfigProyectos: configProyectos.cerrar,
        modalConfigScratchpadAbierto: configScratchpad.abierto,
        abrirModalConfigScratchpad: configScratchpad.abrir,
        cerrarModalConfigScratchpad: configScratchpad.cerrar,
        modalConfigActividadAbierto: configActividad.abierto,
        abrirModalConfigActividad: configActividad.abrir,
        cerrarModalConfigActividad: configActividad.cerrar,
        modalConfigLayoutAbierto: configLayout.abierto,
        abrirModalConfigLayout: configLayout.abrir,
        cerrarModalConfigLayout: configLayout.cerrar,
        modalVersionesAbierto: versiones.abierto,
        abrirModalVersiones: versiones.abrir,
        cerrarModalVersiones: versiones.cerrar,
        modalNuevaTareaAbierto: nuevaTarea.abierto,
        abrirModalNuevaTarea: nuevaTarea.abrir,
        cerrarModalNuevaTarea: nuevaTarea.cerrar,
        tareaEditando,
        abrirModalEditarTarea,
        cerrarModalEditarTarea,
        tareaEditandoMovil,
        abrirEdicionTareaMovil,
        cerrarEdicionTareaMovil,
        habitoEditandoMovil,
        abrirEdicionHabitoMovil,
        cerrarEdicionHabitoMovil,
        modalCreacionRapida,
        valoresCreacionRapida,
        abrirCreacionRapida,
        cerrarCreacionRapida,
        modalTemasAbierto: temas.abierto,
        abrirModalTemas: temas.abrir,
        cerrarModalTemas: temas.cerrar,
        modalConfigMCPAbierto: configMCP.abierto,
        abrirModalConfigMCP: configMCP.abrir,
        cerrarModalConfigMCP: configMCP.cerrar,
        modalConfigUsuarioAbierto: configUsuario.abierto,
        abrirModalConfigUsuario: configUsuario.abrir,
        cerrarModalConfigUsuario: configUsuario.cerrar,
        modalBackupsAbierto: backups.abierto,
        abrirModalBackups: backups.abrir,
        cerrarModalBackups: backups.cerrar,
        modalFeedbackAbierto: feedback.abierto,
        abrirModalFeedback: feedback.abrir,
        cerrarModalFeedback: feedback.cerrar,
        modalPluginsAbierto,
        pluginConfigInicial,
        abrirModalPlugins,
        abrirModalPluginsConConfig,
        cerrarModalPlugins,
        modalConfigDeficitCaloricoAbierto: configDeficitCalorico.abierto,
        abrirModalConfigDeficitCalorico: configDeficitCalorico.abrir,
        cerrarModalConfigDeficitCalorico: configDeficitCalorico.cerrar,
        /* [233A-27] Modal de configuración global */
        modalConfigGlobalAbierto: configGlobal.abierto,
        seccionConfigGlobal,
        abrirModalConfigGlobal,
        cerrarModalConfigGlobal: configGlobal.cerrar
    };
}
