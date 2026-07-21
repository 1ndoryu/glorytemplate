/* [233A-27] Secciones de configuración de paneles para el modal global
 * Componentes: SeccionConfigTareas, SeccionConfigHabitos, SeccionConfigProyectos,
 * SeccionConfigScratchpad, SeccionConfigActividad, SeccionConfigIAPanelChat
 * Cada sección usa su hook directamente — no depende de props del padre
 * [243A-1] Agrega SeccionConfigIAPanelChat (proveedor, modelo, preferencias) */

import {useEffect} from 'react';
import {ToggleSwitch} from '../../shared/ToggleSwitch';
import {Boton, Input, Select, Textarea} from '../../ui';
import {useConfiguracionTareas} from '../../../hooks/useConfiguracionTareas';
import {useConfiguracionHabitos} from '../../../hooks/useConfiguracionHabitos';
import {useConfiguracionProyectos} from '../../../hooks/useConfiguracionProyectos';
import {useConfiguracionScratchpad} from '../../../hooks/useConfiguracionScratchpad';
import {useConfiguracionActividad} from '../../../hooks/useConfiguracionActividad';
import {useEsDispositivoMovil} from '../../../hooks/useEsMovil';
import {useIAStore} from '../../../stores/iaStore';
import {MODELOS_IA, MODELO_FLASH_POR_PROVEEDOR, PROVEEDORES_IA} from '../../../services/iaService';
import {esUsuarioAdmin, obtenerNonceWP} from '../../../utils/dashboardRuntime';
import type {ProveedorIA} from '../../../stores/iaStore';
import type {ColumnasHabitos, ToleranciaPreset} from '../../../hooks/useConfiguracionHabitos';
import type {TamanoFuente} from '../../../hooks/useConfiguracionScratchpad';
import type {PeriodoActividad, FiltroTipoActividad, TamanoCeldaActividad} from '../../../hooks/useConfiguracionActividad';
import {SeccionPanel, SelectorNivel} from '../../shared';

/* Helper reutilizable para items toggle */
function ItemToggle({titulo, descripcion, checked, onChange}: {titulo: string; descripcion: string; checked: boolean; onChange: () => void}) {
    return (
        <>
            <div className="itemOpcionConfig">
                <div className="detallesOpcionConfig">
                    <span className="tituloOpcionConfig">{titulo}</span>
                    <span className="descripcionOpcionConfig">{descripcion}</span>
                </div>
                <ToggleSwitch checked={checked} onChange={onChange} />
            </div>
            <div className="separadorOpcionesConfig" />
        </>
    );
}

/* ── TAREAS ────────────────────────────────────────────── */
export function SeccionConfigTareas(): JSX.Element {
    const {configuracion, toggleOcultarCompletadas, toggleOcultarBadgeProyecto, toggleEliminarCompletadasDespuesDeUnDia, toggleMostrarHabitosEnEjecucion, toggleModoCompacto, toggleOcultarSubtareasAutomaticamente, toggleIgnorarUrgenciaEnPrioridad} = useConfiguracionTareas();
    return (
        <div className="contenedorOpcionesConfig">
            <ItemToggle titulo="Ocultar tareas completadas" descripcion="Las tareas finalizadas no aparecerán en la lista" checked={configuracion.ocultarCompletadas} onChange={toggleOcultarCompletadas} />
            <ItemToggle titulo="Ocultar nombre de proyecto" descripcion="No mostrar el badge del proyecto en las tareas" checked={configuracion.ocultarBadgeProyecto} onChange={toggleOcultarBadgeProyecto} />
            <ItemToggle titulo="Colapsar subtareas automáticamente" descripcion="Las subtareas estarán colapsadas por defecto" checked={configuracion.ocultarSubtareasAutomaticamente} onChange={toggleOcultarSubtareasAutomaticamente} />
            <ItemToggle titulo="Limpieza automática" descripcion="Eliminar tareas completadas después de 24 horas" checked={configuracion.eliminarCompletadasDespuesDeUnDia} onChange={toggleEliminarCompletadasDespuesDeUnDia} />
            <ItemToggle titulo="Mostrar hábitos en Ejecución" descripcion="Los hábitos de hoy aparecerán como tareas en la lista" checked={configuracion.mostrarHabitosEnEjecucion} onChange={toggleMostrarHabitosEnEjecucion} />
            <ItemToggle titulo="Modo compacto" descripcion="Reducir el tamaño de la fuente y el espaciado" checked={configuracion.modoCompacto} onChange={toggleModoCompacto} />
            <ItemToggle titulo="Ignorar urgencia en Prioridad" descripcion="Permite reordenar tareas con la misma prioridad arrastrándolas sin que la urgencia interfiera" checked={configuracion.ignorarUrgenciaEnPrioridad} onChange={toggleIgnorarUrgenciaEnPrioridad} />
        </div>
    );
}

/* ── HÁBITOS ───────────────────────────────────────────── */
const PRESETS_INFO: Record<Exclude<ToleranciaPreset, 'personalizado'>, {etiqueta: string; descripcion: string}> = {
    muyEstricto: {etiqueta: 'Muy Estricto', descripcion: '1 día = urgente, 2+ = bloqueante'},
    estricto: {etiqueta: 'Estricto', descripcion: '2 días = urgente, 4+ = bloqueante'},
    moderado: {etiqueta: 'Moderado', descripcion: '3 días = urgente, 5+ = bloqueante'},
    relajado: {etiqueta: 'Relajado', descripcion: '1 semana = urgente, 2+ = bloqueante'}
};

const INFO_COLUMNAS: Record<keyof ColumnasHabitos, {etiqueta: string; descripcion: string}> = {
    indice: {etiqueta: 'Índice (#)', descripcion: 'Checkbox para completar'},
    nombre: {etiqueta: 'Nombre', descripcion: 'Nombre del hábito (fijo)'},
    historial: {etiqueta: 'Actividad (5 días)', descripcion: 'Historial visual reciente'},
    racha: {etiqueta: 'Racha', descripcion: 'Contador de días seguidos'},
    frecuencia: {etiqueta: 'Frecuencia', descripcion: 'Si es diario, semanal...'},
    importancia: {etiqueta: 'Importancia', descripcion: 'Badge de prioridad'},
    tocaHoy: {etiqueta: 'Toca Hoy', descripcion: 'Indicador visual'},
    acciones: {etiqueta: 'Acciones', descripcion: 'Botones rápidos'},
    urgencia: {etiqueta: 'Urgencia', descripcion: 'Barra de progreso visual'},
    inactividad: {etiqueta: 'Inactividad', descripcion: 'Días sin realizar'}
};

const COLUMNAS_MOVIL: Array<keyof ColumnasHabitos> = ['indice', 'historial', 'importancia'];

export function SeccionConfigHabitos(): JSX.Element {
    const {configuracion, toggleOcultarCompletadosHoy, toggleModoCompacto, toggleMostrarPausados, toggleColumnaVisible, cambiarToleranciaPreset} = useConfiguracionHabitos();
    const esMovil = useEsDispositivoMovil();
    const columnas = esMovil ? (Object.keys(configuracion.columnasVisibles) as Array<keyof ColumnasHabitos>).filter(c => COLUMNAS_MOVIL.includes(c)) : (Object.keys(configuracion.columnasVisibles) as Array<keyof ColumnasHabitos>);

    return (
        <div className="contenedorOpcionesConfig">
            <ItemToggle titulo="Ocultar hábitos completados hoy" descripcion="Los hábitos realizados desaparecerán hasta mañana" checked={configuracion.ocultarCompletadosHoy} onChange={toggleOcultarCompletadosHoy} />
            {/* [014A-13] Modo compacto siempre activo en móvil — ocultar toggle */}
            {!esMovil && <ItemToggle titulo="Modo Compacto" descripcion="Reducir el espaciado vertical de las filas" checked={configuracion.modoCompacto} onChange={toggleModoCompacto} />}
            <ItemToggle titulo="Mostrar hábitos pausados" descripcion="Incluye sección separada con hábitos en pausa" checked={configuracion.mostrarPausados} onChange={toggleMostrarPausados} />

            {!esMovil && (
                <div className="seccionConfiguracion">
                    <h4 className="tituloSeccionConfig">Tolerancia de Urgencia</h4>
                    <span className="descripcionSeccionConfig">Define qué tan estricto es el sistema al marcar hábitos como urgentes</span>
                    <div className="gridOpcionesTolerancia">
                        {(Object.keys(PRESETS_INFO) as Array<Exclude<ToleranciaPreset, 'personalizado'>>).map(preset => (
                            <Boton key={preset} type="button" claseAdicional={`botonPresetTolerancia ${configuracion.toleranciaPreset === preset ? 'botonPresetTolerancia--activo' : ''}`} onClick={() => cambiarToleranciaPreset(preset)}>
                                <span className="etiquetaPreset">{PRESETS_INFO[preset].etiqueta}</span>
                                <span className="descripcionPreset">{PRESETS_INFO[preset].descripcion}</span>
                            </Boton>
                        ))}
                    </div>
                    <div className="separadorOpcionesConfig" />
                </div>
            )}

            <div className="seccionConfiguracion">
                <h4 className="tituloSeccionConfig">Columnas Visibles</h4>
                <div className="gridOpcionesColumnas">
                    {columnas.map(col => col === 'nombre' ? null : (
                        <div key={col} className="itemColumnaConfig">
                            <div className="infoColumnaConfig">
                                <span className="etiquetaColumna">{INFO_COLUMNAS[col].etiqueta}</span>
                                <span className="descripcionColumna">{INFO_COLUMNAS[col].descripcion}</span>
                            </div>
                            <ToggleSwitch checked={configuracion.columnasVisibles[col]} onChange={() => toggleColumnaVisible(col)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── PROYECTOS ─────────────────────────────────────────── */
export function SeccionConfigProyectos(): JSX.Element {
    const {configuracion, toggleOcultarCompletados, toggleOcultarTareasCompletadas, toggleMostrarProgreso, toggleModoCompacto} = useConfiguracionProyectos();
    return (
        <div className="contenedorOpcionesConfig">
            <ItemToggle titulo="Ocultar proyectos completados" descripcion="Los proyectos finalizados no aparecerán en la lista" checked={configuracion.ocultarCompletados} onChange={toggleOcultarCompletados} />
            <ItemToggle titulo="Ocultar tareas completadas" descripcion="Las tareas finalizadas no aparecerán dentro de los proyectos" checked={configuracion.ocultarTareasCompletadas} onChange={toggleOcultarTareasCompletadas} />
            <ItemToggle titulo="Mostrar progreso" descripcion="Visualizar la barra de progreso de tareas" checked={configuracion.mostrarProgreso} onChange={toggleMostrarProgreso} />
            <ItemToggle titulo="Modo Compacto" descripcion="Reducir el tamaño de la fuente y el espaciado" checked={configuracion.modoCompacto} onChange={toggleModoCompacto} />
        </div>
    );
}

/* ── SCRATCHPAD ────────────────────────────────────────── */
export function SeccionConfigScratchpad(): JSX.Element {
    const {configuracion, cambiarTamanoFuente, cambiarAutoGuardado} = useConfiguracionScratchpad();
    return (
        <div className="contenedorOpcionesConfig">
            <div className="itemOpcionConfig">
                <div className="detallesOpcionConfig">
                    <span className="tituloOpcionConfig">Tamaño de fuente</span>
                    <span className="descripcionOpcionConfig">Ajustar legibilidad del texto</span>
                </div>
                <Select claseAdicional="selectOpcionConfig" value={configuracion.tamanoFuente} onChange={e => cambiarTamanoFuente(e.target.value as TamanoFuente)} opciones={[{valor: 'pequeno', etiqueta: 'Pequeño'}, {valor: 'normal', etiqueta: 'Normal'}, {valor: 'grande', etiqueta: 'Grande'}]} />
            </div>
            <div className="separadorOpcionesConfig" />
            <div className="itemOpcionConfig">
                <div className="detallesOpcionConfig">
                    <span className="tituloOpcionConfig">Auto-guardado</span>
                    <span className="descripcionOpcionConfig">Tiempo de espera antes de guardar</span>
                </div>
                <Select claseAdicional="selectOpcionConfig" value={configuracion.autoGuardadoIntervalo} onChange={e => cambiarAutoGuardado(Number(e.target.value))} opciones={[{valor: 500, etiqueta: 'Rápido (0.5s)'}, {valor: 1500, etiqueta: 'Normal (1.5s)'}, {valor: 3000, etiqueta: 'Relax (3s)'}]} />
            </div>
        </div>
    );
}

/* ── ACTIVIDAD ────────────────────────────────────────── */
const PERIODOS: {valor: PeriodoActividad; etiqueta: string}[] = [
    {valor: 'auto', etiqueta: 'Automático'},
    {valor: 'semana', etiqueta: '7 días'},
    {valor: 'mes', etiqueta: '30 días'},
    {valor: 'trimestre', etiqueta: '3 meses'},
    {valor: 'anio', etiqueta: '1 año'}
];

const FILTROS_TIPO: {valor: FiltroTipoActividad; etiqueta: string}[] = [
    {valor: 'todo', etiqueta: 'Todas'},
    {valor: 'tarea_completada', etiqueta: 'Solo tareas'},
    {valor: 'habito_cumplido', etiqueta: 'Solo hábitos'}
];

const TAMANOS: TamanoCeldaActividad[] = ['pequeno', 'normal', 'grande'];

export function SeccionConfigActividad(): JSX.Element {
    const {configuracion, cambiarPeriodo, cambiarFiltroTipo, cambiarTamanoCelda, toggleLeyenda} = useConfiguracionActividad();
    return (
        <div className="formularioHabito">
            <SeccionPanel titulo="Periodo de visualización">
                <div className="selectorPeriodoActividad">
                    {PERIODOS.map(({valor, etiqueta}) => (
                        <Boton key={valor} type="button" claseAdicional={`selectorPeriodoBoton ${configuracion.periodo === valor ? 'selectorPeriodoBoton--activo' : ''}`} onClick={() => cambiarPeriodo(valor)}>
                            {etiqueta}
                        </Boton>
                    ))}
                </div>
            </SeccionPanel>
            <SeccionPanel titulo="Tipo de actividad">
                <div className="selectorPeriodoActividad">
                    {FILTROS_TIPO.map(({valor, etiqueta}) => (
                        <Boton key={valor} type="button" claseAdicional={`selectorPeriodoBoton ${configuracion.filtroTipo === valor ? 'selectorPeriodoBoton--activo' : ''}`} onClick={() => cambiarFiltroTipo(valor)}>
                            {etiqueta}
                        </Boton>
                    ))}
                </div>
            </SeccionPanel>
            <SeccionPanel titulo="Tamaño de celdas">
                <SelectorNivel<TamanoCeldaActividad> niveles={TAMANOS} seleccionado={configuracion.tamanoCelda} onSeleccionar={cambiarTamanoCelda} />
            </SeccionPanel>
            <SeccionPanel titulo="Opciones visuales">
                <ItemToggle titulo="Mostrar Leyenda" descripcion="Muestra la leyenda de colores del mapa" checked={configuracion.mostrarLeyenda} onChange={toggleLeyenda} />
            </SeccionPanel>
        </div>
    );
}

/* ── ASISTENTE IA ──────────────────────────────────────── */
/* [105A-2] Config del chat IA: proveedor, modelo, keys de usuario y prompt system.
 * Admin usa backend con env rotation para no exponer claves del entorno. */
export function SeccionConfigIAPanelChat(): JSX.Element {
    const proveedor = useIAStore(s => s.proveedor);
    const apiKey = useIAStore(s => s.apiKey);
    const apiKeyDeepseek = useIAStore(s => s.apiKeyDeepseek);
    const apiKeyCerebras = useIAStore(s => s.apiKeyCerebras);
    const modelo = useIAStore(s => s.modelo);
    const preferencias = useIAStore(s => s.preferenciasUsuario);
    const promptSistema = useIAStore(s => s.promptSistema);
    const setProveedor = useIAStore(s => s.setProveedor);
    const setApiKey = useIAStore(s => s.setApiKey);
    const setApiKeyDeepseek = useIAStore(s => s.setApiKeyDeepseek);
    const setApiKeyCerebras = useIAStore(s => s.setApiKeyCerebras);
    const setModelo = useIAStore(s => s.setModelo);
    const setPreferencias = useIAStore(s => s.setPreferencias);
    const setPromptSistema = useIAStore(s => s.setPromptSistema);
    const esAdmin = esUsuarioAdmin();
    const modelosProveedor = MODELOS_IA.filter(m => m.proveedor === proveedor);

    /* [115A-1] Sincronizar proveedor+modelo al servidor (WP options) para que
     * AgentChatProcessor.php los use en el chatbot WhatsApp sin leer localStorage. */
    useEffect(() => {
        if (!esAdmin) return;
        const nonce = obtenerNonceWP();
        if (!nonce) return;
        const ctrl = new AbortController();
        fetch('/wp-json/glory/v1/admin/chatbot-config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-WP-Nonce': nonce},
            credentials: 'same-origin',
            signal: ctrl.signal,
            body: JSON.stringify({proveedor, modelo}),
        }).catch(() => {/* ignorar errores de red — localStorage es la fuente de verdad */});
        return () => ctrl.abort();
    }, [proveedor, modelo, esAdmin]);

    const manejarProveedor = (valor: string) => {
        const proveedorNuevo = valor as ProveedorIA;
        setProveedor(proveedorNuevo);
        if (!MODELOS_IA.some(m => m.proveedor === proveedorNuevo && m.id === modelo)) {
            setModelo(MODELO_FLASH_POR_PROVEEDOR[proveedorNuevo]);
        }
    };

    return (
        <div className="contenedorOpcionesConfig">
            <div className="itemOpcionConfig">
                <div className="detallesOpcionConfig">
                    <span className="tituloOpcionConfig">Proveedor de IA</span>
                    <span className="descripcionOpcionConfig">El admin usa las claves del entorno; los usuarios normales configuran sus propias claves aquí.</span>
                </div>
            </div>
            <Select
                value={proveedor}
                onChange={e => manejarProveedor(e.target.value)}
                opciones={PROVEEDORES_IA.map(p => ({valor: p.id, etiqueta: p.nombre}))}
            />
            <div className="separadorOpcionesConfig" />
            {!esAdmin && proveedor === 'groq' && (
                <Input
                    tipo="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="gsk_..."
                />
            )}
            {!esAdmin && proveedor === 'deepseek' && (
                <Input
                    tipo="password"
                    value={apiKeyDeepseek}
                    onChange={e => setApiKeyDeepseek(e.target.value)}
                    placeholder="sk-..."
                />
            )}
            {!esAdmin && proveedor === 'cerebras' && (
                <Input
                    tipo="password"
                    value={apiKeyCerebras}
                    onChange={e => setApiKeyCerebras(e.target.value)}
                    placeholder="csk-..."
                />
            )}
            {esAdmin && (
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">API del entorno activa</span>
                        <span className="descripcionOpcionConfig">Se usarán CEREBRAS_API_KEY, GROQ_API/GROQ_API_1..3 o DEEPSEEK_API/DEEPSEEK-API desde WordPress/Coolify.</span>
                    </div>
                </div>
            )}
            <div className="separadorOpcionesConfig" />
            <div className="itemOpcionConfig">
                <div className="detallesOpcionConfig">
                    <span className="tituloOpcionConfig">Modelo de IA</span>
                    <span className="descripcionOpcionConfig">Modelo de lenguaje a usar en el chat</span>
                </div>
            </div>
            <Select
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                opciones={modelosProveedor.map(m => ({valor: m.id, etiqueta: m.nombre}))}
            />
            <div className="separadorOpcionesConfig" />
            <div className="itemOpcionConfig">
                <div className="detallesOpcionConfig">
                    <span className="tituloOpcionConfig">Prompt system</span>
                    <span className="descripcionOpcionConfig">Instrucciones persistentes que se añaden al sistema del asistente sin reemplazar sus permisos seguros.</span>
                </div>
            </div>
            <Textarea
                value={promptSistema}
                onChange={e => setPromptSistema(e.target.value)}
                placeholder="Ej: Sé directo, prioriza tareas bloqueantes, pregunta antes de acciones externas..."
                filas={3}
            />
            <div className="separadorOpcionesConfig" />
            <div className="itemOpcionConfig">
                <div className="detallesOpcionConfig">
                    <span className="tituloOpcionConfig">Preferencias personales</span>
                    <span className="descripcionOpcionConfig">Contexto extra que la IA tendrá en cuenta (horarios, estilo de trabajo, etc.)</span>
                </div>
            </div>
            <Textarea
                value={preferencias}
                onChange={e => setPreferencias(e.target.value)}
                placeholder="Ej: Prefiero tareas cortas. Trabajo mejor de 9 a 14. Evitar notificaciones tarde..."
                filas={3}
            />
        </div>
    );
}
