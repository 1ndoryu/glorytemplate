/* [233A-27] Secciones de configuración general para el modal global
 * Componentes: SeccionConfigLayout, SeccionConfigPreferencias, SeccionConfigTemas,
 * SeccionConfigPerfil, SeccionConfigSeguridad, SeccionConfigMCP, SeccionConfigBackups
 * Cada sección usa sus hooks directamente */

import {useState, type Ref} from 'react';
import {Square, Columns2, Columns3, ArrowUpDown, RotateCcw, Target, Folder, Terminal, FileText, Activity, LayoutGrid, PanelLeft} from 'lucide-react';
import {Lock, Unlock, Shield, ShieldCheck, Camera, Save, Moon, Sun, Check, Sparkles, Globe, Plug as PlugIcon, Loader2} from 'lucide-react';
import {RotateCcw as RotateCcwBackup, ShieldCheck as ShieldCheckBackup, AlertTriangle, Database, Trash2} from 'lucide-react';
import {ToggleSwitch} from '../../shared/ToggleSwitch';
import {SeccionPanel} from '../../shared';
import {Boton, Input, Textarea} from '../../ui';
import {ListaOrdenPaneles} from '../../dashboard/ListaOrdenPaneles';
import {IndicadorAlmacenamiento} from '../../shared/IndicadorAlmacenamiento';
import {SeccionTokenMCP} from '../SeccionTokenMCP';
import {InstruccionesClienteMCP} from '../InstruccionesClienteMCP';
import {ConfiguracionMCPCopiable} from '../ConfiguracionMCPCopiable';
import {MensajeBloquePremium} from '../../shared/MensajeBloquePremium';
import {useConfiguracionLayout} from '../../../hooks/useConfiguracionLayout';
import {useConfiguracionUsuario} from '../../../stores/configuracionUsuarioStore';
import {useTema, TEMAS_DISPONIBLES} from '../../../hooks/useTema';
import {useModalPerfil} from '../../../hooks/dashboard/useModalPerfil';
import {useCifrado} from '../../../hooks';
import {useSuscripcionStore} from '../../../stores/suscripcionStore';
import {useModalConfiguracionMCP} from '../../../hooks/dashboard/useModalConfiguracionMCP';
import {useModalHistorialBackups} from '../../../hooks/dashboard/useModalHistorialBackups';
import type {PanelId, ModoColumnas} from '../../../hooks/useConfiguracionLayout';

/* Info de paneles para visibilidad */
const PANELES: {id: PanelId; nombre: string; icono: JSX.Element; descripcion: string}[] = [
    {id: 'focoPrioritario', nombre: 'Foco Prioritario', icono: <Target size={14} />, descripcion: 'Panel de hábitos y racha'},
    {id: 'proyectos', nombre: 'Proyectos', icono: <Folder size={14} />, descripcion: 'Lista de proyectos'},
    {id: 'ejecucion', nombre: 'Ejecución', icono: <Terminal size={14} />, descripcion: 'Lista de tareas activas'},
    {id: 'scratchpad', nombre: 'Scratchpad', icono: <FileText size={14} />, descripcion: 'Notas rápidas'},
    {id: 'actividad', nombre: 'Actividad', icono: <Activity size={14} />, descripcion: 'Mapa de calor de actividad'}
];

/* ── LAYOUT ────────────────────────────────────────────── */
export function SeccionConfigLayout(): JSX.Element {
    const {tipoLayout, modoColumnas, visibilidad, ordenPaneles, cambiarTipoLayout, cambiarModoColumnas, toggleVisibilidadPanel, moverPanelArriba, moverPanelAbajo, moverPanelAColumna, resetearOrdenPaneles, resetearLayout} = useConfiguracionLayout();
    const esGrid = tipoLayout === 'grid';

    return (
        <div className="configLayoutContenido">
            {/* [300A-2] Selector de modo: Grid ↔ Sidebar */}
            <div className="configLayoutSeccion">
                <h4 className="configLayoutSeccionTitulo">Modo de Visualización</h4>
                <p className="configLayoutSeccionDescripcion">Grid muestra todos los paneles a la vez. Sidebar los muestra uno por uno.</p>
                <div className="configLayoutColumnasOpciones">
                    <Boton
                        variante={esGrid ? 'primario' : 'ghost'}
                        onClick={() => cambiarTipoLayout('grid')}
                        title="Modo grid"
                        claseAdicional={`configLayoutColumnaOpcion ${esGrid ? 'activo' : ''}`}
                        icono={<LayoutGrid size={20} />}
                    >
                        Grid
                    </Boton>
                    <Boton
                        variante={!esGrid ? 'primario' : 'ghost'}
                        onClick={() => cambiarTipoLayout('sidebar')}
                        title="Modo sidebar"
                        claseAdicional={`configLayoutColumnaOpcion ${!esGrid ? 'activo' : ''}`}
                        icono={<PanelLeft size={20} />}
                    >
                        Sidebar
                    </Boton>
                </div>
            </div>

            {/* Columnas + Orden: solo en modo grid */}
            {esGrid && (
                <>
                    <div className="configLayoutSeccion">
                        <h4 className="configLayoutSeccionTitulo">Distribución de Columnas</h4>
                        <p className="configLayoutSeccionDescripcion">Selecciona cuántas columnas quieres en el dashboard</p>
                        <div className="configLayoutColumnasOpciones">
                            {([1, 2, 3] as ModoColumnas[]).map(modo => (
                                <Boton key={modo} variante={modoColumnas === modo ? 'primario' : 'ghost'} onClick={() => cambiarModoColumnas(modo)} claseAdicional={`configLayoutColumnaOpcion ${modoColumnas === modo ? 'activo' : ''}`} icono={modo === 1 ? <Square size={20} /> : modo === 2 ? <Columns2 size={20} /> : <Columns3 size={20} />}>
                                    {modo} Columna{modo > 1 ? 's' : ''}
                                </Boton>
                            ))}
                        </div>
                    </div>
                    <div className="configLayoutSeccion">
                        <div className="configLayoutSeccionHeader">
                            <div>
                                <h4 className="configLayoutSeccionTitulo"><ArrowUpDown size={14} /> <span>Orden de Paneles</span></h4>
                                <p className="configLayoutSeccionDescripcion">Reordena los paneles usando los botones o cambia su columna</p>
                            </div>
                            <Boton variante="icono" onClick={resetearOrdenPaneles} title="Restaurar orden por defecto" icono={<RotateCcw size={12} />} claseAdicional="configLayoutBotonResetPequeno" />
                        </div>
                        <ListaOrdenPaneles ordenPaneles={ordenPaneles} modoColumnas={modoColumnas} onMoverArriba={moverPanelArriba} onMoverAbajo={moverPanelAbajo} onCambiarColumna={moverPanelAColumna} />
                    </div>
                </>
            )}

            {/* Visibilidad: siempre visible */}
            <div className="configLayoutSeccion">
                <h4 className="configLayoutSeccionTitulo">Visibilidad de Paneles</h4>
                <p className="configLayoutSeccionDescripcion">{esGrid ? 'Oculta paneles que no necesites' : 'Selecciona qué paneles aparecen en el menú lateral'}</p>
                <div className="configLayoutPaneles">
                    {PANELES.map(panel => (
                        <div key={panel.id} className="configLayoutPanelItem">
                            <div className="configLayoutPanelInfo">
                                <span className="configLayoutPanelIcono">{panel.icono}</span>
                                <div className="configLayoutPanelTexto">
                                    <span className="configLayoutPanelNombre">{panel.nombre}</span>
                                    <span className="configLayoutPanelDescripcion">{panel.descripcion}</span>
                                </div>
                            </div>
                            <ToggleSwitch checked={visibilidad[panel.id]} onChange={() => toggleVisibilidadPanel(panel.id)} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="configLayoutAcciones">
                <Boton variante="secundario" onClick={resetearLayout} title="Restaurar todo" icono={<RotateCcw size={12} />} claseAdicional="configLayoutBotonReset">
                    Restaurar todo por defecto
                </Boton>
            </div>
        </div>
    );
}

/* ── PREFERENCIAS ──────────────────────────────────────── */
export function SeccionConfigPreferencias(): JSX.Element {
    const {horaFinDia, setHoraFinDia} = useConfiguracionUsuario();
    return (
        <div className="formularioConfiguracion">
            <SeccionPanel titulo="Fin del día (Jornada)">
                <p className="configuracionUsuarioDescripcion">Define a qué hora termina realmente tu día.</p>
                <div className="configuracionUsuarioControles">
                    <div className="configuracionUsuarioInputContenedor">
                        <Input tipo="number" claseAdicional="configuracionUsuarioInput" value={horaFinDia} onChange={e => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 0 && val <= 23) setHoraFinDia(val); }} min={0} max={23} />
                        <span className="configuracionUsuarioIcono"><Moon size={14} /></span>
                        <span className="configuracionUsuarioSufijo">:00</span>
                    </div>
                </div>
                <div className="configuracionUsuarioInfo">
                    <Sun size={14} className="configuracionUsuarioInfoIcono" />
                    <span className="configuracionUsuarioInfoTexto">Tu nuevo día iniciará a las <strong>{String(horaFinDia).padStart(2, '0')}:00</strong>.</span>
                </div>
            </SeccionPanel>
        </div>
    );
}

/* ── TEMAS ─────────────────────────────────────────────── */
export function SeccionConfigTemas(): JSX.Element {
    const {tema, cambiarTema} = useTema();
    return (
        <div className="selectorTemas">
            {TEMAS_DISPONIBLES.map(t => (
                <Boton key={t.id} type="button" claseAdicional={`selectorTemas__opcion ${tema === t.id ? 'selectorTemas__opcion--activa' : ''}`} onClick={() => cambiarTema(t.id)}>
                    <span className="selectorTemas__nombre">{t.nombre}</span>
                    {tema === t.id && <Check size={14} className="selectorTemas__check" />}
                </Boton>
            ))}
        </div>
    );
}

/* ── PERFIL ────────────────────────────────────────────── */
export function SeccionConfigPerfil({onCerrar}: {onCerrar: () => void}): JSX.Element {
    const {datos, cargando, mensaje, fileInputRef, handleChange, handleAvatarClick, handleFileChange, handleSubmit} = useModalPerfil({estaAbierto: true, onCerrar});
    return (
        <div className="contenedorPerfil">
            <div className="avatarContainer">
                <div className="avatarPreview">{datos.avatarUrl ? <img src={datos.avatarUrl} alt="Avatar" /> : <span className="avatarInicial">{datos.nombre.charAt(0).toUpperCase()}</span>}</div>
                <Boton claseAdicional="botonPerfil botonCambiarFoto" onClick={handleAvatarClick}><Camera size={14} /> Cambiar Foto</Boton>
                <Input tipo="file" ref={fileInputRef as Ref<HTMLInputElement>} claseAdicional="inputArchivoPerfil" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="seccionPerfil">
                <div className="tituloSeccionPerfil">Información Personal</div>
                <div className="grupoInputPerfil">
                    <label className="labelPerfil">Nombre de Usuario</label>
                    <Input tipo="text" claseAdicional="inputPerfil" value={datos.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="Tu nombre visible" />
                </div>
                <div className="grupoInputPerfil">
                    <label className="labelPerfil">Descripción</label>
                    <Textarea claseAdicional="inputPerfil inputPerfil--descripcion" value={datos.descripcion} onChange={e => handleChange('descripcion', (e.target as HTMLTextAreaElement).value)} placeholder="Developer, Designer, etc." filas={2} />
                </div>
            </div>
            <div className="seccionPerfil">
                <div className="tituloSeccionPerfil">Seguridad</div>
                <div className="grupoInputPerfil">
                    <label className="labelPerfil">Contraseña Actual</label>
                    <Input tipo="password" claseAdicional="inputPerfil" value={datos.passwordActual} onChange={e => handleChange('passwordActual', e.target.value)} placeholder="Necesaria para cambios sensibles" />
                </div>
                <div className="grupoInputPerfil">
                    <label className="labelPerfil">Nueva Contraseña</label>
                    <Input tipo="password" claseAdicional="inputPerfil" value={datos.passwordNueva} onChange={e => handleChange('passwordNueva', e.target.value)} placeholder="Dejar en blanco para mantener" />
                </div>
                <div className="grupoInputPerfil">
                    <label className="labelPerfil">Confirmar Nueva Contraseña</label>
                    <Input tipo="password" claseAdicional="inputPerfil" value={datos.passwordConfirmar} onChange={e => handleChange('passwordConfirmar', e.target.value)} placeholder="Repite la nueva contraseña" />
                </div>
            </div>
            <div className="seccionPerfil">
                <div className="tituloSeccionPerfil">Uso de Espacio</div>
                <IndicadorAlmacenamiento mostrarDetalles={true} />
            </div>
            {mensaje && <div className={`mensajePerfil mensajePerfil--${mensaje.tipo}`}>{mensaje.texto}</div>}
            <div className="accionesPerfil">
                <Boton claseAdicional="botonPerfil botonGuardar" onClick={handleSubmit} disabled={cargando}>
                    <div className="botonPerfilContenido">{cargando ? <span className="cargandoSpinner cargandoSpinner--pequeno"></span> : <Save size={14} />} Guardar Cambios</div>
                </Boton>
            </div>
        </div>
    );
}

/* ── SEGURIDAD ─────────────────────────────────────────── */
export function SeccionConfigSeguridad(): JSX.Element {
    const {estadoCifrado, cargando, error, toggleCifrado} = useCifrado();
    const [procesando, setProcesando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);
    const esHttps = window.location.protocol === 'https:';
    const esPremium = useSuscripcionStore((s: {esPremium: () => boolean}) => s.esPremium());

    const handleToggle = async (nuevoValor: boolean) => {
        setProcesando(true);
        setMensajeExito(null);
        const exito = await toggleCifrado(nuevoValor);
        if (exito) {
            setMensajeExito(nuevoValor ? 'Cifrado activado' : 'Cifrado desactivado');
            setTimeout(() => setMensajeExito(null), 3000);
        }
        setProcesando(false);
    };

    return (
        <div className="panelSeguridadContenido">
            <section className="seccionSeguridad">
                <div className="seccionSeguridadEncabezado">
                    <span className={`iconoSeguridad ${esHttps ? 'seguro' : 'advertencia'}`}>{esHttps ? <Lock size={18} /> : <Unlock size={18} />}</span>
                    <div className="seccionSeguridadInfo">
                        <h3>Conexión HTTPS</h3>
                        <p className="descripcionSeguridad">{esHttps ? 'Conexión cifrada. Los datos viajan de forma segura.' : 'Conexión no segura. Configura HTTPS para proteger los datos.'}</p>
                    </div>
                    <span className={`estadoIndicador ${esHttps ? 'activo' : 'inactivo'}`}>{esHttps ? 'Seguro' : 'Inseguro'}</span>
                </div>
            </section>
            <section className="seccionSeguridad">
                <div className="seccionSeguridadEncabezado">
                    <span className={`iconoSeguridad ${estadoCifrado?.habilitado ? 'seguro' : ''}`}>{estadoCifrado?.habilitado ? <ShieldCheck size={18} /> : <Shield size={18} />}</span>
                    <div className="seccionSeguridadInfo">
                        <h3>Cifrado E2E</h3>
                        <p className="descripcionSeguridad">
                            Protege tus datos con cifrado AES-256-GCM.
                            {!esPremium && <span className="notaFree"> (FREE: solo texto. Premium: completo)</span>}
                        </p>
                    </div>
                </div>
                <div className="controlCifrado">
                    {cargando ? <span className="cargandoIndicador">verificando...</span> : error ? <span className="errorIndicador">{error}</span> : (
                        <>
                            <ToggleSwitch checked={estadoCifrado?.habilitado ?? false} onChange={handleToggle} disabled={procesando} />
                            <span className="etiquetaCifrado">{estadoCifrado?.habilitado ? 'ENABLED' : 'DISABLED'}</span>
                            {procesando && <span className="procesandoIndicador">procesando...</span>}
                            {mensajeExito && <span className="exitoIndicador">{mensajeExito}</span>}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

/* ── CONECTAR IA (MCP) ─────────────────────────────────── */
export function SeccionConfigMCP({onAbrirUpgrade}: {onAbrirUpgrade?: () => void}): JSX.Element {
    const {clienteActivo, setClienteActivo, tokenExiste, tokenGenerado, fechaCreacion, cargando, verificando, esPremium, manejarGenerarToken, manejarRevocarToken, obtenerConfiguracion} = useModalConfiguracionMCP({estaAbierto: true});
    if (!esPremium) return <MensajeBloquePremium titulo="Conexión con IA Premium" descripcion="La integración con asistentes de IA está disponible para usuarios Premium." onAbrirUpgrade={onAbrirUpgrade} />;
    return (
        <div className="contenedorMcp">
            <div className="mcpIntroduccion">
                <h3 className="mcpIntroduccion__titulo"><Sparkles size={16} /> Conecta con tu asistente de IA</h3>
                <p className="mcpIntroduccion__descripcion">Gestiona tus tareas usando lenguaje natural desde Claude, Cursor, Antigravity o cualquier asistente de IA.</p>
            </div>
            {verificando ? (
                <div className="mcpCargando"><Loader2 size={24} className="iconoGirando" /><span>Verificando configuración...</span></div>
            ) : (
                <>
                    <SeccionTokenMCP tokenExiste={tokenExiste} tokenGenerado={tokenGenerado} fechaCreacion={fechaCreacion} cargando={cargando} onGenerarToken={manejarGenerarToken} onRevocarToken={manejarRevocarToken} />
                    {tokenExiste && (
                        <>
                            <div className="mcpPestanas">
                                <Boton type="button" variante="pestaña" activo={clienteActivo === 'apirest'} onClick={() => setClienteActivo('apirest')}><Globe size={12} /> API REST</Boton>
                                <Boton type="button" variante="pestaña" activo={clienteActivo === 'claude'} onClick={() => setClienteActivo('claude')}><PlugIcon size={12} /> Claude</Boton>
                                <Boton type="button" variante="pestaña" activo={clienteActivo === 'cursor'} onClick={() => setClienteActivo('cursor')}><PlugIcon size={12} /> Cursor</Boton>
                            </div>
                            {clienteActivo === 'apirest' ? (
                                <div className="mcpApiRest">
                                    <p className="mcpApiRest__descripcion">Copia este contexto para tu asistente de IA:</p>
                                    <ConfiguracionMCPCopiable codigo={obtenerConfiguracion('apirest')} titulo="Contexto para IA" />
                                </div>
                            ) : (
                                <InstruccionesClienteMCP cliente={clienteActivo} jsonConfiguracion={obtenerConfiguracion(clienteActivo)} token={tokenGenerado || ''} />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

/* ── COPIAS DE SEGURIDAD ───────────────────────────────── */
export function SeccionConfigBackups({onAbrirUpgrade}: {onAbrirUpgrade?: () => void}): JSX.Element {
    const {backups, cargando, error, esPremium, handleRestaurar, handleEliminar, formatBytes, formatDate, formatTrigger} = useModalHistorialBackups({estaAbierto: true});
    if (!esPremium) return <MensajeBloquePremium titulo="Copias de Seguridad Premium" descripcion="Las copias automáticas están disponibles para usuarios Premium." onAbrirUpgrade={onAbrirUpgrade} />;
    return (
        <div className="contenedorBackups">
            <div className="panelInfoBackup"><ShieldCheckBackup size={18} className="iconoInfo" /><p className="textoInfo">Copias automáticas con cada cambio importante.</p></div>
            {error && <div className="mensajeError"><AlertTriangle size={14} /><span>{error}</span></div>}
            {cargando && <div className="spinnerCarga">Cargando copias...</div>}
            {!cargando && backups.length === 0 && <div className="estadoVacio"><Database size={32} /><p>No tienes copias de seguridad aún.</p></div>}
            {!cargando && backups.length > 0 && (
                <div className="listaBackups">
                    {backups.map(backup => (
                        <div key={backup.id} className="itemBackup">
                            <div className="infoBackup">
                                <span className="fechaBackup">{formatDate(backup.timestamp)}</span>
                                <div className="metaBackup">
                                    {formatTrigger(backup.trigger) && <span className="badgeTrigger">{formatTrigger(backup.trigger)}</span>}
                                    <span className="tamanoBackup">{formatBytes(backup.sizeBytes)}</span>
                                    <span className="dispositivoBackup">{backup.device}</span>
                                </div>
                            </div>
                            <div className="accionesBackup">
                                <Boton claseAdicional="botonRestaurar" onClick={() => handleRestaurar(backup.id)} title="Restaurar"><RotateCcwBackup size={14} /><span>Restaurar</span></Boton>
                                <Boton claseAdicional="botonEliminar" onClick={() => handleEliminar(backup.id)} title="Eliminar"><Trash2 size={14} /><span>Eliminar</span></Boton>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
