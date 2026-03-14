/*
 * Componente: TabProcesosAdmin — C808
 * Tab del panel admin para gestionar procesos de fondo.
 * Cards por proceso con estado, start/stop, log tail.
 */

import { useEffect } from 'react';
import { RefreshCw, Loader2, Play, Square, Terminal, Server, Cookie, Upload, Check, AlertTriangle, Youtube, Music } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { Badge } from '../ui/Badge';
import { CampoTexto } from '../ui/CampoTexto';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useTabProcesos } from '../../hooks/useTabProcesos';
import { useCookiesAdmin } from '../../hooks/useCookiesAdmin';
import type { EstadoProceso, TipoCookies } from '../../services/apiProcesos';
import '../../styles/componentes/procesosAdmin.css';

const ETIQUETAS_PROCESO: Record<string, string> = {
    scraping:   'Scraping (WhoSampled)',
    extraccion: 'Extraccion Audio',
    seed:       'Distribucion Seed',
};

const variantePorEstado = (estado: string) => {
    if (estado === 'running')  return 'exito' as const;
    if (estado === 'error')    return 'error' as const;
    return 'neutro' as const;
};

/* Card individual de proceso */
const TarjetaProceso = ({
    proceso,
    accionEnCurso,
    onIniciar,
    onDetener,
}: {
    proceso: EstadoProceso;
    accionEnCurso: string | null;
    onIniciar: (nombre: string) => void;
    onDetener: (nombre: string) => void;
}): JSX.Element => {
    const estaActuando = accionEnCurso === proceso.nombre;
    const estaRunning  = proceso.estado === 'running';
    const etiqueta     = ETIQUETAS_PROCESO[proceso.nombre] ?? proceso.nombre;

    return (
        <div className={`procesoCard ${estaRunning ? 'procesoCardActivo' : ''}`}>
            <div className="procesoCardCabecera">
                <div className="procesoCardTitulo">
                    <Server size={16} />
                    <span>{etiqueta}</span>
                </div>
                <Badge variante={variantePorEstado(proceso.estado)} tamano="sm">
                    {proceso.estado}
                </Badge>
            </div>

            {/* Metadata */}
            <div className="procesoCardMeta">
                {proceso.pid && (
                    <span className="procesoCardMetaItem">PID: {proceso.pid}</span>
                )}
                {proceso.iniciado_at && (
                    <span className="procesoCardMetaItem">
                        Inicio: {new Date(proceso.iniciado_at).toLocaleTimeString()}
                    </span>
                )}
                {proceso.ultimo_log && (
                    <span className="procesoCardMetaItem">
                        Ultimo log: {new Date(proceso.ultimo_log).toLocaleTimeString()}
                    </span>
                )}
            </div>

            {/* Barra de progreso si disponible */}
            {typeof proceso.progreso === 'number' && proceso.progreso > 0 && (
                <div className="procesoCardProgreso">
                    <div
                        className="procesoCardProgresoRelleno"
                        style={{ width: `${Math.min(100, proceso.progreso)}%` }}
                    />
                </div>
            )}

            {/* Error */}
            {proceso.error && (
                <div className="procesoCardError">{proceso.error}</div>
            )}

            {/* Resultado (para seed) */}
            {proceso.resultado && (
                <div className="procesoCardResultado">
                    {Object.entries(proceso.resultado).map(([k, v]) => (
                        <span key={k} className="procesoCardMetaItem">
                            {k}: {JSON.stringify(v)}
                        </span>
                    ))}
                </div>
            )}

            {/* Log tail */}
            {proceso.log_tail && (
                <div className="procesoCardLog">
                    <div className="procesoCardLogCabecera">
                        <Terminal size={12} />
                        <span>Log reciente</span>
                    </div>
                    <pre className="procesoCardLogContenido">{proceso.log_tail}</pre>
                </div>
            )}

            {/* Acciones */}
            <div className="procesoCardAcciones">
                {estaRunning ? (
                    <BotonBase
                        onClick={() => onDetener(proceso.nombre)}
                        variante="peligro"
                        tamano="sm"
                        disabled={estaActuando}
                    >
                        {estaActuando
                            ? <Loader2 size={14} className="adminSpinner" />
                            : <Square size={14} />}
                        Detener
                    </BotonBase>
                ) : (
                    <BotonBase
                        onClick={() => onIniciar(proceso.nombre)}
                        variante="primario"
                        tamano="sm"
                        disabled={estaActuando}
                    >
                        {estaActuando
                            ? <Loader2 size={14} className="adminSpinner" />
                            : <Play size={14} />}
                        Iniciar
                    </BotonBase>
                )}
            </div>
        </div>
    );
};

/* Configuracion de plataformas de cookies para renderizado */
const PLATAFORMAS_COOKIES: {
    tipo: TipoCookies;
    titulo: string;
    descripcion: string;
    icono: typeof Youtube;
    placeholder: string;
}[] = [
    {
        tipo: 'youtube',
        titulo: 'Cookies YouTube',
        descripcion: 'Cookies de YouTube en formato Netscape para yt-dlp. Necesario cuando YouTube reporta "sign in to confirm" o errores de autenticacion.',
        icono: Youtube,
        placeholder: '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tname\tvalue',
    },
    {
        tipo: 'soundcloud',
        titulo: 'Cookies SoundCloud',
        descripcion: 'Cookies de SoundCloud en formato Netscape para yt-dlp (fallback). Si SoundCloud bloquea peticiones, yt-dlp las usa como respaldo.',
        icono: Music,
        placeholder: '# Netscape HTTP Cookie File\n.soundcloud.com\tTRUE\t/\tTRUE\t0\tname\tvalue',
    },
];

export const TabProcesosAdmin = (): JSX.Element => {
    const { procesos, cargando, accionEnCurso, iniciar, detener, recargar, error, cookiesInfo } = useTabProcesos();
    const {
        plataformas, setContenido, guardar, actualizarInfo,
    } = useCookiesAdmin();

    /* Sincronizar info de cookies desde useTabProcesos a useCookiesAdmin */
    useEffect(() => {
        if (cookiesInfo) {
            actualizarInfo(cookiesInfo);
        }
    }, [cookiesInfo, actualizarInfo]);

    return (
        <div className="tabProcesos">
            <div className="procesosBarraSuperior">
                <h3 className="procesosTitulo">Procesos de Fondo</h3>
                <BotonBase
                    onClick={recargar}
                    variante="secundario"
                    tamano="sm"
                    disabled={cargando}
                >
                    <RefreshCw size={14} />
                    Recargar
                </BotonBase>
            </div>

            {error && (
                <div className="procesosError">{error}</div>
            )}

            {cargando && procesos.length === 0 && (
                <div className="procesosCargando">
                    <Loader2 size={20} className="adminSpinner" />
                </div>
            )}

            {!cargando && procesos.length === 0 && (
                <EstadoVacio
                    mensaje="No se encontraron procesos configurados."
                    icono={<Server size={24} />}
                />
            )}

            <div className="procesosGrid">
                {procesos.map(p => (
                    <TarjetaProceso
                        key={p.nombre}
                        proceso={p}
                        accionEnCurso={accionEnCurso}
                        onIniciar={iniciar}
                        onDetener={detener}
                    />
                ))}
            </div>

            {/* Seccion Cookies — una por plataforma */}
            <div className="cookiesSeccionGrupo">
                <div className="cookiesGrupoCabecera">
                    <Cookie size={16} />
                    <h4 className="cookiesTitulo">Cookies yt-dlp</h4>
                </div>

                {PLATAFORMAS_COOKIES.map(({ tipo, titulo, descripcion, icono: Icono, placeholder }) => {
                    const estado = plataformas[tipo];
                    const info = cookiesInfo?.[tipo];

                    return (
                        <div key={tipo} className="cookiesSeccion">
                            <div className="cookiesCabecera">
                                <Icono size={16} />
                                <h4 className="cookiesSubtitulo">{titulo}</h4>
                                {info?.existe && (
                                    <Badge variante="exito" tamano="sm">
                                        <Check size={10} />
                                        Activo
                                    </Badge>
                                )}
                                {info && !info.existe && (
                                    <Badge variante="advertencia" tamano="sm">
                                        <AlertTriangle size={10} />
                                        Sin cookies
                                    </Badge>
                                )}
                            </div>

                            {info?.existe && info.modificado && (
                                <p className="cookiesInfo">
                                    Ultimo update: {new Date(info.modificado).toLocaleString()}
                                    {info.tamano ? ` (${(Number(info.tamano) / 1024).toFixed(1)} KB)` : ''}
                                </p>
                            )}

                            <p className="cookiesDescripcion">{descripcion}</p>

                            <CampoTexto
                                multilínea
                                variante="desnudo"
                                className="cookiesTextarea"
                                placeholder={placeholder}
                                value={estado.contenido}
                                onChange={e => setContenido(tipo, e.target.value)}
                                rows={6}
                                disabled={estado.guardando}
                            />

                            <div className="cookiesAcciones">
                                <BotonBase
                                    onClick={() => guardar(tipo)}
                                    variante="primario"
                                    tamano="sm"
                                    disabled={estado.guardando || estado.contenido.trim() === ''}
                                >
                                    {estado.guardando
                                        ? <Loader2 size={14} className="adminSpinner" />
                                        : <Upload size={14} />}
                                    Actualizar
                                </BotonBase>
                            </div>

                            {estado.mensaje && <div className="cookiesMensajeExito">{estado.mensaje}</div>}
                            {estado.error && <div className="cookiesMensajeError">{estado.error}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
