/**
 * Hook para gestionar el cifrado de datos del usuario
 *
 * Proporciona estado y acciones para habilitar/deshabilitar
 * el cifrado end-to-end de los datos del dashboard.
 */

import {useState, useEffect, useCallback} from 'react';

export interface EstadoCifrado {
    habilitado: boolean;
    algoritmo: string;
    tipoClaveDerivacion: string;
}

interface UseCifradoReturn {
    estadoCifrado: EstadoCifrado | null;
    cargando: boolean;
    error: string | null;
    toggleCifrado: (habilitar: boolean) => Promise<boolean>;
    recargar: () => Promise<void>;
}

/*
 * Obtiene la configuracion de WordPress inyectada en el frontend
 */
function obtenerConfigWP(): {nonce: string; apiBase: string} | null {
    const wpData = (
        window as unknown as {
            gloryDashboard?: {nonce?: string; apiBase?: string};
        }
    ).gloryDashboard;

    if (!wpData?.nonce) {
        return null;
    }

    return {
        nonce: wpData.nonce,
        apiBase: wpData.apiBase || '/wp-json/glory/v1'
    };
}

export function useCifrado(): UseCifradoReturn {
    const [estadoCifrado, setEstadoCifrado] = useState<EstadoCifrado | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarEstado = useCallback(async () => {
        setCargando(true);
        setError(null);

        const config = obtenerConfigWP();
        if (!config) {
            setError('No se pudo obtener la configuración de autenticación');
            setCargando(false);
            return;
        }

        try {
            const response = await fetch(`${config.apiBase}/seguridad/cifrado`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': config.nonce
                }
            });

            const data = await response.json();

            if (data.success) {
                setEstadoCifrado(data.data);
            } else {
                setError(data.message || 'Error al cargar estado de cifrado');
            }
        } catch (err) {
            setError('Error de conexión al verificar cifrado');
            console.error('[useCifrado] Error:', err);
        } finally {
            setCargando(false);
        }
    }, []);

    const toggleCifrado = useCallback(async (habilitar: boolean): Promise<boolean> => {
        setCargando(true);
        setError(null);

        const config = obtenerConfigWP();
        if (!config) {
            setError('No se pudo obtener la configuración de autenticación');
            setCargando(false);
            return false;
        }

        try {
            const response = await fetch(`${config.apiBase}/seguridad/cifrado`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': config.nonce
                },
                body: JSON.stringify({habilitar})
            });

            const data = await response.json();

            if (data.success) {
                setEstadoCifrado(prev => (prev ? {...prev, habilitado: data.data.habilitado} : null));
                return true;
            } else {
                setError(data.message || 'Error al cambiar estado de cifrado');
                return false;
            }
        } catch (err) {
            setError('Error de conexión al cambiar cifrado');
            console.error('[useCifrado] Error toggle:', err);
            return false;
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarEstado();
    }, [cargarEstado]);

    return {
        estadoCifrado,
        cargando,
        error,
        toggleCifrado,
        recargar: cargarEstado
    };
}

export default useCifrado;
