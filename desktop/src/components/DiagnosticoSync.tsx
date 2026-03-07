/*
 * Componente: DiagnosticoSync — F6.2
 * Panel expandible de diagnostico interno del sistema de sync.
 *
 * Muestra: estado circuit breaker, cola offline, journal,
 * cursor delta, intervalo polling, ultimas entradas de log.
 *
 * Solo vista — la logica viene del hook useDiagnosticoSync.
 */

import { useCallback, useState } from 'react';
import { useDiagnosticoSync, type DatosDiagnostico } from '../hooks/useDiagnosticoSync';
import { circuitoSync } from '../services/syncGuards';
import { reintentarErroresOffline } from '../services/offlineQueueService';
import type { EntradaLog } from '../services/syncLogger';
import '@app/styles/componentes/diagnosticoSync.css';

function formatearMs(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seg = Math.round(ms / 1000);
    if (seg < 60) return `${seg}s`;
    return `${Math.floor(seg / 60)}m ${seg % 60}s`;
}

function formatearTimestamp(ts: number): string {
    if (!ts) return 'nunca';
    const ahora = Date.now();
    const diff = ahora - ts;
    if (diff < 60_000) return 'hace menos de 1 min';
    if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)} min`;
    return new Date(ts).toLocaleTimeString();
}

function claseNivelLog(nivel: string): string {
    switch (nivel) {
        case 'error': return 'diagSyncLogEntrada diagSyncLogEntrada--error';
        case 'warn': return 'diagSyncLogEntrada diagSyncLogEntrada--warn';
        case 'info': return 'diagSyncLogEntrada diagSyncLogEntrada--info';
        default: return 'diagSyncLogEntrada diagSyncLogEntrada--debug';
    }
}

function claseEstadoCircuito(estado: string): string {
    if (estado === 'cerrado') return 'diagSyncEstado--cerrado';
    if (estado === 'abierto') return 'diagSyncEstado--abierto';
    return 'diagSyncEstado--semiAbierto';
}

function SeccionCircuitBreaker({ datos }: { datos: DatosDiagnostico }): JSX.Element {
    const resetearCircuito = useCallback(() => {
        try { circuitoSync.resetear(); } catch { /* sin inicializar */ }
    }, []);

    return (
        <div className="diagSyncSeccion">
            <div className="diagSyncSeccionTitulo">Circuit Breaker</div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Estado</span>
                <span className={`diagSyncValor ${claseEstadoCircuito(datos.circuitoSyncEstado)}`}>
                    {datos.circuitoSyncEstado}
                </span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Fallos consecutivos</span>
                <span className="diagSyncValor">{datos.circuitoSyncFallos}</span>
            </div>
            {datos.circuitoSyncEstado !== 'cerrado' && (
                <div className="diagSyncAcciones">
                    <button className="diagSyncBoton" onClick={resetearCircuito}>
                        Resetear circuito
                    </button>
                </div>
            )}
        </div>
    );
}

function SeccionColaOffline({ datos }: { datos: DatosDiagnostico }): JSX.Element {
    const reintentar = useCallback(() => {
        reintentarErroresOffline().catch(() => {});
    }, []);

    return (
        <div className="diagSyncSeccion">
            <div className="diagSyncSeccionTitulo">Cola Offline</div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Pendientes</span>
                <span className="diagSyncValor">{datos.colaOfflinePendientes}</span>
            </div>
            {datos.colaOfflinePendientes > 0 && (
                <>
                    <div className="diagSyncCola">
                        {datos.colaOfflineDetalle.map(op => (
                            <div key={op.id} className="diagSyncColaItem">
                                <span>{op.tipo}</span>
                                <span>intentos: {op.intentos}</span>
                            </div>
                        ))}
                    </div>
                    <div className="diagSyncAcciones">
                        <button className="diagSyncBoton" onClick={reintentar}>
                            Reintentar todo
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function SeccionEstadoGeneral({ datos }: { datos: DatosDiagnostico }): JSX.Element {
    return (
        <div className="diagSyncSeccion">
            <div className="diagSyncSeccionTitulo">Estado General</div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Cursor delta</span>
                <span className="diagSyncValor">{datos.cursorDelta || 'sin inicializar'}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Intervalo polling</span>
                <span className="diagSyncValor">{formatearMs(datos.intervaloPollingMs)}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Ultima sync</span>
                <span className="diagSyncValor">{formatearTimestamp(datos.ultimaSyncMs)}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Journal</span>
                <span className="diagSyncValor">
                    {datos.journalActivo ? `activo (${datos.journalPendientes} pend.)` : 'inactivo'}
                </span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Nivel log</span>
                <span className="diagSyncValor">{datos.nivelLog}</span>
            </div>
        </div>
    );
}

function SeccionLogs({ entradas, onExportar }: { entradas: ReadonlyArray<EntradaLog>; onExportar: () => void }): JSX.Element {
    return (
        <div className="diagSyncSeccion">
            <div className="diagSyncSeccionTitulo">Logs recientes</div>
            <div className="diagSyncLogs">
                {entradas.length === 0 && <div className="diagSyncLogEntrada--debug">Sin entradas</div>}
                {entradas.map((e, i) => (
                    <div key={`${e.ts}-${i}`} className={claseNivelLog(e.nivel)}>
                        [{new Date(e.ts).toLocaleTimeString()}] [{e.nivel}] [{e.modulo}] {e.msg}
                    </div>
                ))}
            </div>
            <div className="diagSyncAcciones">
                <button className="diagSyncBoton" onClick={onExportar}>
                    Exportar logs
                </button>
            </div>
        </div>
    );
}

export default function DiagnosticoSync(): JSX.Element {
    const { datos, refrescar, exportarLogsCompletos } = useDiagnosticoSync();
    const [exportando, setExportando] = useState(false);

    const manejarExportar = useCallback(async () => {
        setExportando(true);
        try {
            const texto = await exportarLogsCompletos();
            /* Copiar al clipboard — disponible en Tauri WebView */
            await navigator.clipboard.writeText(texto);
        } catch { /* clipboard puede fallar en algunos entornos */ }
        setExportando(false);
    }, [exportarLogsCompletos]);

    return (
        <div className="diagSyncPanel">
            <SeccionEstadoGeneral datos={datos} />
            <SeccionCircuitBreaker datos={datos} />
            <SeccionColaOffline datos={datos} />
            <SeccionLogs
                entradas={datos.ultimasEntradas}
                onExportar={exportando ? () => {} : manejarExportar}
            />
            <div className="diagSyncAcciones">
                <button className="diagSyncBoton" onClick={refrescar}>
                    Refrescar
                </button>
            </div>
        </div>
    );
}
