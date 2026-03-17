/*
 * Hook: useDiagnosticoSync — F6.2
 * Provee datos de diagnóstico internos del sistema de sync.
 *
 * Recopila estado de: circuit breaker, offline queue, journal,
 * delta cursor, logger, polling interval.
 *
 * El componente DiagnosticoSync consume este hook para mostrar
 * un panel expandible de inspección técnica.
 */

import { useCallback, useEffect, useState } from 'react';
import { circuitoSync } from '../services/syncGuards';
import { obtenerPendientes, obtenerCola, type OperacionPendiente } from '../services/offlineQueueService';
import { operacionesPendientesCount, estaInicializado as journalInicializado } from '../services/syncJournal';
import {
    obtenerNivelLog,
    obtenerSesionLogger,
    obtenerUltimasEntradas,
    exportarLogs,
    generarReporteDiagnosticoSync,
    type EntradaLog,
} from '../services/syncLogger';
import { estado as syncEstado } from '../services/syncState';
import { obtenerResumenDebugUploadQueue, type ResumenDebugUploadQueue } from '../services/uploadQueueService';
import { obtenerResumenDebugTracking, type ResumenDebugTracking } from '../services/syncTrackingService';

export interface DatosDiagnostico {
    /* Circuit breakers */
    circuitoSyncEstado: string;
    circuitoSyncFallos: number;
    /* Offline queue */
    colaOfflinePendientes: number;
    colaOfflineDetalle: ReadonlyArray<OperacionPendiente>;
    /* Journal */
    journalActivo: boolean;
    journalPendientes: number;
    /* Delta sync */
    cursorDelta: number;
    /* Polling */
    intervaloPollingMs: number;
    /* Logger */
    nivelLog: string;
    sesionLogger: string;
    ultimasEntradas: ReadonlyArray<EntradaLog>;
    resumenUploads: ResumenDebugUploadQueue;
    resumenTracking: ResumenDebugTracking;
    /* Ultima sync */
    ultimaSyncMs: number;
}

const INTERVALO_REFRESH_MS = 3000;

export function useDiagnosticoSync(): {
    datos: DatosDiagnostico;
    refrescar: () => void;
    exportarLogsCompletos: () => Promise<string>;
    exportarReporteDiagnostico: () => Promise<{ nombreArchivo: string; contenido: string }>;
} {
    const recopilar = useCallback((): DatosDiagnostico => {
        let circuitoSyncEstado = 'desconocido';
        let circuitoSyncFallos = 0;
        try {
            circuitoSyncEstado = circuitoSync.obtenerEstado();
            circuitoSyncFallos = circuitoSync.obtenerFallosConsecutivos();
        } catch { /* circuito no inicializado */ }

        return {
            circuitoSyncEstado,
            circuitoSyncFallos,
            colaOfflinePendientes: obtenerPendientes(),
            colaOfflineDetalle: obtenerCola(),
            journalActivo: journalInicializado(),
            journalPendientes: operacionesPendientesCount(),
            cursorDelta: syncEstado.ultimoCursorDelta,
            intervaloPollingMs: syncEstado.intervaloPollingMs,
            nivelLog: obtenerNivelLog(),
            sesionLogger: obtenerSesionLogger(),
            ultimasEntradas: obtenerUltimasEntradas(30),
            resumenUploads: obtenerResumenDebugUploadQueue(),
            resumenTracking: obtenerResumenDebugTracking(),
            ultimaSyncMs: syncEstado.config.ultimaSync,
        };
    }, []);

    const [datos, setDatos] = useState<DatosDiagnostico>(recopilar);

    const refrescar = useCallback(() => {
        setDatos(recopilar());
    }, [recopilar]);

    useEffect(() => {
        const timer = setInterval(refrescar, INTERVALO_REFRESH_MS);
        return () => clearInterval(timer);
    }, [refrescar]);

    return {
        datos,
        refrescar,
        exportarLogsCompletos: exportarLogs,
        exportarReporteDiagnostico: generarReporteDiagnosticoSync,
    };
}
