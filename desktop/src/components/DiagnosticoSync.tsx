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
import { BotonBase } from '@app/components/ui/BotonBase';
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
                    <BotonBase className="diagSyncBoton" variante="ghost" tamano="ninguno" type="button" onClick={resetearCircuito}>
                        Resetear circuito
                    </BotonBase>
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
                        <BotonBase className="diagSyncBoton" variante="ghost" tamano="ninguno" type="button" onClick={reintentar}>
                            Reintentar todo
                        </BotonBase>
                    </div>
                </>
            )}
        </div>
    );
}

function SeccionUploads({ datos }: { datos: DatosDiagnostico }): JSX.Element {
    return (
        <div className="diagSyncSeccion">
            <div className="diagSyncSeccionTitulo">Uploads</div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Sesion logger</span>
                <span className="diagSyncValor">{datos.sesionLogger}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Cola total</span>
                <span className="diagSyncValor">{datos.resumenUploads.totalItems}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Pendientes / subiendo</span>
                <span className="diagSyncValor">{datos.resumenUploads.totalPendientes} / {datos.resumenUploads.totalSubiendo}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Errores / duplicados</span>
                <span className="diagSyncValor">{datos.resumenUploads.totalErrores} / {datos.resumenUploads.totalDuplicados}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Rutas en vuelo</span>
                <span className="diagSyncValor">{datos.resumenUploads.rutasEnVuelo}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Hashes conocidos / bloqueados</span>
                <span className="diagSyncValor">{datos.resumenUploads.hashesConocidos} / {datos.resumenUploads.hashesBloqueadosAntispam}</span>
            </div>
        </div>
    );
}

function SeccionTracking({ datos }: { datos: DatosDiagnostico }): JSX.Element {
    return (
        <div className="diagSyncSeccion">
            <div className="diagSyncSeccionTitulo">Tracking</div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Archivos / colecciones</span>
                <span className="diagSyncValor">{datos.resumenTracking.totalArchivos} / {datos.resumenTracking.totalColecciones}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Sin colección</span>
                <span className="diagSyncValor">{datos.resumenTracking.totalSinColeccion}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Deshabilitados</span>
                <span className="diagSyncValor">{datos.resumenTracking.totalDeshabilitados}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Historial v2</span>
                <span className="diagSyncValor">{datos.resumenTracking.totalHistorialSamples}</span>
            </div>
            <div className="diagSyncFila">
                <span className="diagSyncEtiqueta">Checkpoint / versión local</span>
                <span className="diagSyncValor">{datos.resumenTracking.checkpointVersion} / {datos.resumenTracking.versionLocalConocida}</span>
            </div>
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

function SeccionLogs({
    entradas,
    onExportar,
    onExportarReporte,
}: {
    entradas: ReadonlyArray<EntradaLog>;
    onExportar: () => void;
    onExportarReporte: () => void;
}): JSX.Element {
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
                <BotonBase className="diagSyncBoton" variante="ghost" tamano="ninguno" type="button" onClick={onExportar}>
                    Exportar logs
                </BotonBase>
                <BotonBase className="diagSyncBoton" variante="ghost" tamano="ninguno" type="button" onClick={onExportarReporte}>
                    Copiar reporte JSON
                </BotonBase>
            </div>
        </div>
    );
}

export default function DiagnosticoSync(): JSX.Element {
    const { datos, refrescar, exportarLogsCompletos, exportarReporteDiagnostico } = useDiagnosticoSync();
    const [exportando, setExportando] = useState(false);
    const [exportandoReporte, setExportandoReporte] = useState(false);

    const manejarExportar = useCallback(async () => {
        setExportando(true);
        try {
            const texto = await exportarLogsCompletos();
            /* Copiar al clipboard — disponible en Tauri WebView */
            await navigator.clipboard.writeText(texto);
        } catch { /* clipboard puede fallar en algunos entornos */ }
        setExportando(false);
    }, [exportarLogsCompletos]);

    const manejarExportarReporte = useCallback(async () => {
        setExportandoReporte(true);
        try {
            const reporte = await exportarReporteDiagnostico();
            await navigator.clipboard.writeText(reporte.contenido);
        } catch { /* clipboard puede fallar en algunos entornos */ }
        setExportandoReporte(false);
    }, [exportarReporteDiagnostico]);

    return (
        <div className="diagSyncPanel">
            <SeccionEstadoGeneral datos={datos} />
            <SeccionUploads datos={datos} />
            <SeccionTracking datos={datos} />
            <SeccionCircuitBreaker datos={datos} />
            <SeccionColaOffline datos={datos} />
            <SeccionLogs
                entradas={datos.ultimasEntradas}
                onExportar={exportando ? () => {} : manejarExportar}
                onExportarReporte={exportandoReporte ? () => {} : manejarExportarReporte}
            />
            <div className="diagSyncAcciones">
                <BotonBase className="diagSyncBoton" variante="ghost" tamano="ninguno" type="button" onClick={refrescar}>
                    Refrescar
                </BotonBase>
            </div>
        </div>
    );
}
