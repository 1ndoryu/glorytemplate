import {useEffect, useCallback, useRef, useState} from 'react';
import type React from 'react';
import {useChangeDetector} from './useChangeDetector';
import {useSyncTransport} from './useSyncTransport';
import {useLocalStorage, CLAVES_LOCALSTORAGE} from '../useLocalStorage';
import {useSuscripcion} from '../useSuscripcion';
import type {DashboardData} from '../useDashboardApi';
import {tareasIniciales, notasIniciales, habitosIniciales} from '../../data/datosIniciales';

interface SyncMeta {
    lastModified: number;
    lastSync: number;
}

interface UseSyncManagerProps {
    currentData: DashboardData;
    onDataReceived: (data: DashboardData) => void;
    debounceMs?: number;
    onInitComplete?: () => void;
    isDataReady?: boolean;
  habitosInicializado?: boolean;
    /* [014A-19] Contador de cambios recibidos vía WebSocket remoto.
     * Cuando > 0, el auto-save HTTP se inhibe y el hash se actualiza
     * sin enviar datos al servidor (los cambios ya están allí). */
    contadorCambiosRemotosRef?: React.MutableRefObject<number>;
}

/*
 * Clave para detectar si ya se inicializó con datos de bienvenida
 * Esto evita subir datos iniciales múltiples veces o a usuarios que ya tenían datos
 */
const CLAVE_USUARIO_INICIALIZADO = 'glory_usuario_inicializado';

/*
 * Verifica si los datos del servidor están "vacíos" (usuario nuevo sin datos)
 * Consideramos vacío si no tiene hábitos, tareas, y notas vacías
 */
function esServidorVacio(serverData: DashboardData | null): boolean {
    if (!serverData) return true;
    
    const sinHabitos = !serverData.habitos || serverData.habitos.length === 0;
    const sinTareas = !serverData.tareas || serverData.tareas.length === 0;
    const sinNotas = !serverData.notas || serverData.notas.trim() === '';
    
    return sinHabitos && sinTareas && sinNotas;
}

/*
 * [275A-1] Safety guard contra wipeout: NUNCA subir datos si TODOS los arrays
 * principales están vacíos y ya existía una sincronización previa (lastSync > 0).
 * Esto previene la catástrofe cuando Zustand aún no ha hidratado sus stores
 * (habitos = []) pero isDataReady ya es true, causando que performInitialSync
 * o el auto-save envíen un estado vacío al servidor que soft-deletea todo.
 * Excepción: lastSync === 0 = primera sincronización (usuario nuevo), permitido.
 */
function esProbableWipeout(data: DashboardData, lastSync: number, habitosInicializado?: boolean): boolean {
  if (lastSync === 0) return false; // Primera vez = usuario nuevo, ok subir vacio
  const sinHabitos = !data.habitos || data.habitos.length === 0;
  const sinTareas = !data.tareas || data.tareas.length === 0;
  const sinProyectos = !data.proyectos || data.proyectos.length === 0;
  /* [275A-1] Si Zustand persist aun no hidrato (habitosInicializado=false),
   * los arrays de habitos SIEMPRE estan vacios. Cualquier subida en este
   * estado es peligrosa: bloquear si hay al menos 2 arrays vacios (no solo 3).
   * Si habitosInicializado=true, mantenemos el umbral estricto (3 vacios). */
  if (habitosInicializado === false) {
    const arraysVacios = [sinHabitos, sinTareas, sinProyectos].filter(Boolean).length;
    return arraysVacios >= 2;
  }
  /* Solo bloquear si TODOS los arrays estan vacios simultaneamente.
   * Que un solo array sea vacio es normal (ej: el usuario no tiene proyectos). */
  return sinHabitos && sinTareas && sinProyectos;
}

/*
 * Verifica si el usuario ya fue inicializado previamente con datos de bienvenida.
 * Esto evita que al borrar localStorage y recargar, se vuelvan a subir datos iniciales.
 */
function usuarioYaInicializado(): boolean {
    try {
        return localStorage.getItem(CLAVE_USUARIO_INICIALIZADO) === 'true';
    } catch {
        return false;
    }
}

/*
 * Marca al usuario como inicializado después de subir datos de bienvenida.
 * Esta marca persiste incluso si se borra el resto del localStorage.
 */
function marcarUsuarioComoInicializado(): void {
    try {
        localStorage.setItem(CLAVE_USUARIO_INICIALIZADO, 'true');
    } catch {
        console.warn('[SyncManager] No se pudo guardar marca de inicialización');
    }
}

/*
 * Genera datos iniciales completos para usuarios nuevos.
 * Combina datos base con los datos de bienvenida de datosIniciales.ts
 * 
 * IMPORTANTE: Esta función NO depende de currentData para evitar
 * condiciones de carrera con stores que se hidratan vacíos.
 */
function generarDatosInicialesUsuarioNuevo(baseData: DashboardData): DashboardData {
    return {
        ...baseData,
        habitos: habitosIniciales,
        tareas: tareasIniciales,
        notas: notasIniciales,
        proyectos: []
    };
}

export function useSyncManager({currentData, onDataReceived, debounceMs = 2000, onInitComplete, isDataReady = true, habitosInicializado, contadorCambiosRemotosRef}: UseSyncManagerProps) {
    const {esPremium} = useSuscripcion();

    // 1. Detector de Cambios
    const {hasChanges, updateVersion: markChangesAsSynced, resetVersion} = useChangeDetector(currentData, true);

    // 2. Transporte (Comunicación API)
    const {saveData, loadData, transportState, cancelPendingRequests} = useSyncTransport();

    // 3. Estado de Sincronización Local (Meta)
    const {
        valor: syncMeta,
        setValor: setSyncMeta,
        cargando: loadingMeta
    } = useLocalStorage<SyncMeta>(CLAVES_LOCALSTORAGE.sync, {
        valorPorDefecto: {lastModified: 0, lastSync: 0}
    });

    const [isInitialized, setIsInitialized] = useState(false);
    const initializationStarted = useRef(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Lógica de Inicialización (Load Strategy) ---

    const performInitialSync = useCallback(async () => {
        if (!syncMeta) return;

        const {lastModified, lastSync} = syncMeta;
        const hasUnsyncedLocalChanges = lastModified > lastSync;
        const RETRY_KEY = 'glory_sync_init_retries';

        console.log('[SyncManager] Inicializando. Cambios locales pendientes:', hasUnsyncedLocalChanges);

        try {
            if (hasUnsyncedLocalChanges) {
                // Check safety breaker
                const retries = parseInt(sessionStorage.getItem(RETRY_KEY) || '0');
                if (retries >= 3) {
                    console.warn('[SyncManager] Loop detectado. Saltando subida inicial para estabilizar.');
                    // No subimos ahora. El loop de auto-guardado lo intentará después (con debounce).
                } else {
                    sessionStorage.setItem(RETRY_KEY, (retries + 1).toString());

                    // Prioridad a local: Intentar subir primero
                    console.log('[SyncManager] Subiendo cambios locales pendientes...');
                    /* [275A-1] Safety guard: abortar si los datos están vacíos
                     * pero ya hubo una sync previa (race condition de hidratación). */
                    if (esProbableWipeout(currentData, lastSync, habitosInicializado)) {
                        console.error('[SyncManager] ABORTADO: Se intentó subir datos completamente vacíos. Posible race condition de hidratación.');
                        sessionStorage.removeItem(RETRY_KEY);
                        return;
                    }
                    const success = await saveData({
                        ...currentData,
                        // @ts-ignore - Flag opcional para backend
                        generateBackup: esPremium
                    });

                    if (success) {
                        setSyncMeta(prev => ({...prev, lastSync: Date.now()}));
                        markChangesAsSynced(); // Actualizar hash base
                        sessionStorage.removeItem(RETRY_KEY); // Éxito -> Resetear contador
                    }
                }
            } else {
                // Prioridad a servidor: Descargar
                const serverData = await loadData();
                
                /*
                 * Caso especial: Usuario nuevo sin datos en servidor
                 * 
                 * Criterio para determinar usuario nuevo que necesita datos de bienvenida:
                 * 1. El servidor NO tiene datos (esServidorVacio)
                 * 2. El usuario NO ha sido inicializado previamente (evita re-inicializar si borró datos)
                 * 
                 * Cuando se cumple, generamos datos completos de bienvenida usando datosIniciales.ts
                 * directamente, sin depender del estado de currentData (que puede estar vacío
                 * debido a la hidratación de Zustand).
                 */
                if (esServidorVacio(serverData) && !usuarioYaInicializado()) {
                    /*
                     * Generar datos iniciales completos.
                     * IMPORTANTE: NO usamos currentData para los datos de contenido,
                     * solo para mantener la estructura base (version, configuracion, etc.)
                     */
                    const datosIniciales = generarDatosInicialesUsuarioNuevo(currentData);
                    
                    console.log('[SyncManager] Usuario nuevo detectado. Generando datos de bienvenida...');
                    console.log('[SyncManager] Datos a subir:', {
                        habitos: datosIniciales.habitos?.length,
                        tareas: datosIniciales.tareas?.length,
                        notasLength: datosIniciales.notas?.length
                    });
                    
                    const success = await saveData({
                        ...datosIniciales,
                        // @ts-ignore - Flag opcional para backend
                        generateBackup: false
                    });
                    
                    if (success) {
                        console.log('[SyncManager] Datos iniciales sincronizados correctamente.');
                        
                        /* 
                         * Marcar usuario como inicializado para evitar repetir
                         * este proceso si el usuario limpia su localStorage
                         */
                        marcarUsuarioComoInicializado();
                        
                        /*
                         * CRÍTICO: Notificar al frontend con los datos iniciales completos.
                         * Esto actualiza tanto el store de Zustand (hábitos) como el estado local (tareas, notas).
                         */
                        onDataReceived(datosIniciales);
                        
                        setSyncMeta(prev => ({...prev, lastSync: Date.now()}));
                        markChangesAsSynced();
                    }
                } else if (serverData) {
                    console.log('[SyncManager] Datos descargados del servidor.');
                    onDataReceived(serverData);
                    resetVersion(serverData); // Resetear hash base a lo nuevo
                    setSyncMeta(prev => ({...prev, lastSync: Date.now()}));
                }
            }
        } catch (e) {
            console.error('[SyncManager] Error en sincronización inicial:', e);
        } finally {
            setIsInitialized(true);
            if (onInitComplete) onInitComplete();

            // Si llegamos aquí y nos mantenemos vivos por 5s, resetear el contador
            setTimeout(() => {
                sessionStorage.removeItem(RETRY_KEY);
            }, 5000);
        }
    }, [syncMeta, saveData, loadData, currentData, markChangesAsSynced, resetVersion, onDataReceived, setSyncMeta, esPremium, onInitComplete]);

    // Ejecutar inicialización una vez cargado el Meta y los datos externos
    useEffect(() => {
        if (!loadingMeta && !isInitialized && isDataReady && !initializationStarted.current) {
            initializationStarted.current = true;
            performInitialSync();
        }
    }, [loadingMeta, isInitialized, isDataReady, performInitialSync]);

    useEffect(() => {
        if (!isInitialized) return;

        const refrescarDesdeServidor = async () => {
            if (document.visibilityState !== 'visible' || hasChanges || transportState.isSaving) return;
            const serverData = await loadData();
            if (!serverData) return;
            onDataReceived(serverData);
            resetVersion(serverData);
            setSyncMeta(prev => ({...prev, lastSync: Date.now()}));
        };

        const intervalo = window.setInterval(() => {
            refrescarDesdeServidor().catch(error => console.warn('[SyncManager] Refresh servidor falló:', error));
        }, 30000);

        const manejarFoco = () => {
            refrescarDesdeServidor().catch(error => console.warn('[SyncManager] Refresh en foco falló:', error));
        };

        window.addEventListener('focus', manejarFoco);
        document.addEventListener('visibilitychange', manejarFoco);

        return () => {
            window.clearInterval(intervalo);
            window.removeEventListener('focus', manejarFoco);
            document.removeEventListener('visibilitychange', manejarFoco);
        };
    }, [isInitialized, hasChanges, transportState.isSaving, loadData, onDataReceived, resetVersion, setSyncMeta]);

    // --- Lógica de Sincronización Continua (Save Loop) ---

    // Detectar cambios y programar guardado
    useEffect(() => {
        if (!isInitialized) return; // Esperar a que termine la carga inicial

        if (hasChanges) {
            /* [014A-19] Si el cambio fue originado por WebSocket remoto, actualizar
             * hash baseline sin disparar HTTP auto-save. El dato ya está en servidor
             * (vino de ahí) así que reenviarlo sería redundante.
             * Tradeoff: si un cambio local coincide exactamente con uno remoto en el
             * mismo ciclo de render, el save se retrasa hasta la siguiente interacción.
             * Esto es aceptable dado lo estrecho de la ventana temporal. */
            if (contadorCambiosRemotosRef?.current && contadorCambiosRemotosRef.current > 0) {
                contadorCambiosRemotosRef.current = 0;
                markChangesAsSynced();
                console.log('[SyncManager] Cambio remoto WS absorbido — hash actualizado sin HTTP auto-save');
                return;
            }

            // Check Safety Breaker for Auto-Save too
            const retries = parseInt(sessionStorage.getItem('glory_sync_init_retries') || '0');
            if (retries >= 3) {
                console.warn('[SyncManager] Auto-save pausado por inestabilidad (Safety Breaker activo).');
                return;
            }

            // 2. Debounce Save
            if (debounceTimer.current) clearTimeout(debounceTimer.current);

            debounceTimer.current = setTimeout(async () => {
                console.log('[SyncManager] Auto-guardando cambios...');
                /* [275A-1] Safety guard: abortar auto-save si los datos estan vacios.
                 * Esto atrapa el caso donde la hidratacion se completa tarde
                 * y el auto-save se dispara con datos parciales. */
                if (syncMeta && esProbableWipeout(currentData, syncMeta.lastSync, habitosInicializado)) {
                    console.error('[SyncManager] Auto-save ABORTADO: datos completamente vacios. Posible race condition.');
                    markChangesAsSynced(); // Resetear hash para evitar loop
                    return;
                }

                // Actualizar meta justo antes de guardar o al intentar guardar
                setSyncMeta(prev => ({...prev, lastModified: Date.now()}));

                const success = await saveData({
                    ...currentData,
                    // @ts-ignore
                    generateBackup: esPremium
                });

                if (success) {
                    setSyncMeta(prev => ({...prev, lastSync: Date.now()}));
                    markChangesAsSynced();
                }
            }, debounceMs);
        }

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [hasChanges, isInitialized, debounceMs, currentData, saveData, setSyncMeta, markChangesAsSynced, esPremium]);

    // Cleanup
    useEffect(() => {
        return () => cancelPendingRequests();
    }, [cancelPendingRequests]);

    // Exponer estado unificado
    const syncState = {
        isSynced: !transportState.isSaving && !hasChanges,
        isSaving: transportState.isSaving,
        isLoading: transportState.isLoading || !isInitialized,
        error: transportState.error,
        pendingChanges: hasChanges
    };

    return {
        syncState,
        forceSync: async () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            return await saveData(currentData);
        },
        resetSafetyBreaker: () => sessionStorage.removeItem('glory_sync_init_retries')
    };
}
