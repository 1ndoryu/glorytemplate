/*
 * Componente: TabProcesosAdmin — C808
 * Tab del panel admin para gestionar procesos de fondo.
 * Cards por proceso con estado, start/stop, log tail.
 */

import { RefreshCw, Loader2, Play, Square, Terminal, Server } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { Badge } from '../ui/Badge';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useTabProcesos } from '../../hooks/useTabProcesos';
import type { EstadoProceso } from '../../services/apiProcesos';
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
            </div>

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

export const TabProcesosAdmin = (): JSX.Element => {
    const { procesos, cargando, accionEnCurso, iniciar, detener, recargar, error } = useTabProcesos();

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
        </div>
    );
};
