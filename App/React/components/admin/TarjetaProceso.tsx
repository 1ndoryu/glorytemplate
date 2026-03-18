/*
 * Componente: TarjetaProceso
 * Card individual de proceso de fondo con estado, progreso, log tail y acciones.
 * Extraido de TabProcesosAdmin [183A-68] para cumplir limite de lineas.
 */

import { Loader2, Play, Square, Terminal, Server } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { Badge } from '../ui/Badge';
import type { EstadoProceso } from '../../services/apiProcesos';

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

export const TarjetaProceso = ({
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
