/*
 * Hook useAlmacenamiento
 * Gestiona el estado de almacenamiento del usuario.
 * Consulta uso de espacio y valida antes de subir archivos.
 */

import {useState, useEffect, useCallback} from 'react';
import type {InfoAlmacenamiento} from '../types/dashboard';

interface EstadoAlmacenamiento {
    info: InfoAlmacenamiento | null;
    cargando: boolean;
    error: string | null;
}

const ALMACENAMIENTO_INICIAL: InfoAlmacenamiento = {
    usado: 0,
    usadoFormateado: '0 B',
    limite: 52428800,
    limiteFormateado: '50 MB',
    disponible: 52428800,
    disponibleFormateado: '50 MB',
    porcentaje: 0,
    cercaDelLimite: false,
    limiteExcedido: false,
    esPremium: false
};

interface RespuestaApi {
    success: boolean;
    data?: InfoAlmacenamiento;
    message?: string;
}

interface RespuestaVerificacion extends RespuestaApi {
    puedeSubir: boolean;
}

export function useAlmacenamiento() {
    const [estado, setEstado] = useState<EstadoAlmacenamiento>({
        info: null,
        cargando: false,
        error: null
    });

    /* Cargar información de almacenamiento */
    const cargar = useCallback(async () => {
        setEstado(prev => ({...prev, cargando: true, error: null}));

        try {
            const nonce = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce;

            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (nonce) {
                headers['X-WP-Nonce'] = nonce;
            }

            const response = await fetch('/wp-json/glory/v1/almacenamiento', {
                method: 'GET',
                credentials: 'include',
                headers
            });

            const data: RespuestaApi = await response.json();

            if (data.success && data.data) {
                setEstado({
                    info: data.data,
                    cargando: false,
                    error: null
                });
            } else {
                setEstado({
                    info: ALMACENAMIENTO_INICIAL,
                    cargando: false,
                    error: data.message || 'Error al cargar almacenamiento'
                });
            }
        } catch (err) {
            setEstado({
                info: ALMACENAMIENTO_INICIAL,
                cargando: false,
                error: 'Error de conexión'
            });
        }
    }, []);

    /* Verificar si se puede subir un archivo de X bytes */
    const verificarEspacio = useCallback(async (tamanoBytes: number): Promise<{puedeSubir: boolean; mensaje: string; info: InfoAlmacenamiento | null}> => {
        try {
            const nonce = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce;

            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (nonce) {
                headers['X-WP-Nonce'] = nonce;
            }

            const response = await fetch('/wp-json/glory/v1/almacenamiento', {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({tamano: tamanoBytes})
            });

            const data: RespuestaVerificacion = await response.json();

            if (data.data) {
                setEstado(prev => ({...prev, info: data.data as InfoAlmacenamiento}));
            }

            return {
                puedeSubir: data.puedeSubir ?? false,
                mensaje: data.message || (data.puedeSubir ? 'Espacio disponible' : 'Sin espacio suficiente'),
                info: data.data || null
            };
        } catch {
            return {
                puedeSubir: false,
                mensaje: 'Error al verificar espacio',
                info: null
            };
        }
    }, []);

    /* Cargar al montar */
    useEffect(() => {
        cargar();
    }, [cargar]);

    /* Calcular color de la barra de progreso */
    const colorBarra = estado.info ? (estado.info.limiteExcedido ? 'var(--dashboard-estadoAlta)' : estado.info.cercaDelLimite ? 'var(--dashboard-estadoAdvertencia)' : 'var(--dashboard-estadoActivo)') : 'var(--dashboard-estadoActivo)';

    return {
        ...estado,
        cargar,
        verificarEspacio,
        colorBarra,
        /* Helpers */
        porcentaje: estado.info?.porcentaje ?? 0,
        cercaDelLimite: estado.info?.cercaDelLimite ?? false,
        limiteExcedido: estado.info?.limiteExcedido ?? false
    };
}
