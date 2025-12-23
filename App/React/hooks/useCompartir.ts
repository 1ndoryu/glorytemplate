/*
 * Hook useCompartir
 *
 * Gestiona la comunicación con la API de compartición (Fase 4)
 * Permite compartir elementos, eliminar accesos y listar participantes.
 */

import {useState, useCallback} from 'react';
import type {Participante, RolCompartido, MetadatosCompartido} from '../types/dashboard';

interface AccionResultado {
    exito: boolean;
    mensaje: string;
}

const obtenerNonce = (): string => {
    return (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce || '';
};

const obtenerHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    'X-WP-Nonce': obtenerNonce()
});

export function useCompartir() {
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Comparte un elemento con un compañero
     */
    const compartirElemento = useCallback(async (tipo: 'tarea' | 'proyecto' | 'habito', elementoId: number, companeroId: number, rol: RolCompartido): Promise<AccionResultado> => {
        setCargando(true);
        setError(null);
        try {
            const response = await fetch('/wp-json/glory/v1/compartir', {
                method: 'POST',
                headers: obtenerHeaders(),
                body: JSON.stringify({
                    tipo,
                    elemento_id: elementoId,
                    companero_id: companeroId,
                    rol
                })
            });

            const data = await response.json();

            if (!data.success) throw new Error(data.message || 'Error al compartir');

            return {exito: true, mensaje: data.message};
        } catch (e: any) {
            const mensaje = e.message || 'Error desconocido';
            setError(mensaje);
            return {exito: false, mensaje};
        } finally {
            setCargando(false);
        }
    }, []);

    /**
     * Elimina el acceso compartido (ya sea el propietario revocando o el colaborador saliendo)
     */
    const dejarDeCompartir = useCallback(async (compartidoId: number): Promise<AccionResultado> => {
        setCargando(true);
        setError(null);
        try {
            const response = await fetch(`/wp-json/glory/v1/compartir/${compartidoId}`, {
                method: 'DELETE',
                headers: obtenerHeaders()
            });

            const data = await response.json();

            if (!data.success) throw new Error(data.message || 'Error al dejar de compartir');

            return {exito: true, mensaje: data.message};
        } catch (e: any) {
            const mensaje = e.message || 'Error desconocido';
            setError(mensaje);
            return {exito: false, mensaje};
        } finally {
            setCargando(false);
        }
    }, []);

    /**
     * Obtiene la lista de usuarios que tienen acceso al elemento
     */
    const obtenerParticipantes = useCallback(async (tipo: 'tarea' | 'proyecto' | 'habito', elementoId: number): Promise<Participante[]> => {
        setCargando(true);
        setError(null);
        try {
            const response = await fetch(`/wp-json/glory/v1/compartir/${tipo}/${elementoId}`, {
                method: 'GET',
                headers: obtenerHeaders()
            });

            const data = await response.json();

            if (!data.success) throw new Error(data.message || 'Error al obtener participantes');

            return data.participantes;
        } catch (e: any) {
            setError(e.message || 'Error desconocido');
            return [];
        } finally {
            setCargando(false);
        }
    }, []);

    /**
     * Obtiene los elementos compartidos conmigo de cierto tipo
     * Retorna el objeto del elemento con metadatos de compartición
     */
    const obtenerCompartidosConmigo = useCallback(async (tipo: 'tarea' | 'proyecto' | 'habito'): Promise<any[]> => {
        setCargando(true);
        setError(null);
        try {
            const response = await fetch(`/wp-json/glory/v1/compartir/conmigo/${tipo}`, {
                method: 'GET',
                headers: obtenerHeaders()
            });

            const data = await response.json();

            if (!data.success) throw new Error(data.message || 'Error al obtener compartidos');

            return data.items;
        } catch (e: any) {
            setError(e.message || 'Error desconocido');
            return [];
        } finally {
            setCargando(false);
        }
    }, []);

    return {
        cargando,
        error,
        compartirElemento,
        dejarDeCompartir,
        obtenerParticipantes,
        obtenerCompartidosConmigo
    };
}
