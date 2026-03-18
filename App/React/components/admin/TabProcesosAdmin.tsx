/*
 * Componente: TabProcesosAdmin — C808
 * Tab del panel admin para gestionar procesos de fondo.
 * Cards por proceso con estado, start/stop, log tail.
 */

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Loader2, Play, Terminal, Cookie, Upload, Check, AlertTriangle, Youtube, Music, Gauge, Server } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { Badge } from '../ui/Badge';
import { CampoTexto } from '../ui/CampoTexto';
import { EstadoVacio } from '../ui/EstadoVacio';
import { TarjetaProceso } from './TarjetaProceso';
import { useTabProcesos } from '../../hooks/useTabProcesos';
import { useCookiesAdmin } from '../../hooks/useCookiesAdmin';
import type { TipoCookies } from '../../services/apiProcesos';
import { ejecutarBenchmark } from '../../services/apiProcesos';
import '../../styles/componentes/procesosAdmin.css';

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

/* [183A-68] Seccion Benchmark — subcomponente propio para mantener el limite de lineas del padre */
const SeccionBenchmark = (): JSX.Element => {
    const [cargando, setCargando] = useState(false);
    const [output, setOutput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const correr = useCallback(async () => {
        setCargando(true);
        setOutput('');
        setErrorMsg('');
        try {
            const res = await ejecutarBenchmark(1, 30);
            if (res.ok && res.data) {
                setOutput(res.data.output ?? '');
            } else {
                setErrorMsg(res.data?.error ?? res.data?.stderr ?? res.error ?? 'Error desconocido');
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Error de red');
        } finally {
            setCargando(false);
        }
    }, []);

    return (
        <div className="benchmarkSeccion">
            <div className="benchmarkCabecera">
                <Gauge size={16} />
                <h4 className="benchmarkTitulo">Benchmark Algoritmo</h4>
            </div>
            <p className="benchmarkDescripcion">
                Ejecuta el benchmark completo del algoritmo de recomendacion en produccion: feed, similares, secciones de musica y mas ideas. Puede tardar hasta 2 minutos.
            </p>
            <BotonBase
                onClick={correr}
                variante="secundario"
                tamano="sm"
                disabled={cargando}
            >
                {cargando ? <Loader2 size={14} className="adminSpinner" /> : <Play size={14} />}
                {cargando ? 'Ejecutando...' : 'Ejecutar Benchmark'}
            </BotonBase>

            {errorMsg && <div className="benchmarkError">{errorMsg}</div>}

            {output && (
                <div className="benchmarkOutputContenedor">
                    <div className="benchmarkOutputCabecera">
                        <Terminal size={12} />
                        <span>Resultado</span>
                    </div>
                    <pre className="benchmarkOutput">{output}</pre>
                </div>
            )}
        </div>
    );
};

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

            {/* [183A-68] Seccion Benchmark */}
            <SeccionBenchmark />
        </div>
    );
};
