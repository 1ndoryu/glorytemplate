/**
 * useClientes
 *
 * [2003A-3] Hook para listar clientes/suscripciones desde el endpoint admin.
 * Solo se usa en la sección de clientes visible para admin.
 */

import {useState, useEffect, useCallback} from 'react';
import {API_BASE} from '../constants/cap-constants';

export interface Cliente {
    id: number;
    centro_id: number;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    estado: 'activa' | 'expirada' | 'cancelada' | 'pago_fallido';
    fecha_inicio: string | null;
    fecha_fin: string | null;
    created_at: string;
    updated_at: string;
    centro_nombre: string;
    centro_email: string;
    centro_telefono: string;
    user_id: number;
    wp_user_login: string;
    wp_user_email: string;
    wp_display_name: string;
}

export interface FiltrosClientes {
    busqueda: string;
    pagina: number;
    porPagina: number;
}

interface EstadoClientes {
    clientes: Cliente[];
    total: number;
    cargando: boolean;
    error: string | null;
    filtros: FiltrosClientes;
}

interface UseClientesReturn extends EstadoClientes {
    cargarClientes: () => Promise<void>;
    cambiarFiltros: (nuevosFiltros: Partial<FiltrosClientes>) => void;
}

export function useClientes(): UseClientesReturn {
    const [estado, setEstado] = useState<EstadoClientes>({
        clientes: [],
        total: 0,
        cargando: true,
        error: null,
        filtros: {
            busqueda: '',
            pagina: 1,
            porPagina: 20,
        },
    });

    const cargarClientes = useCallback(async (signal?: AbortSignal) => {
        setEstado(prev => ({...prev, cargando: true, error: null}));

        try {
            const {filtros} = estado;
            const params = new URLSearchParams({
                limite: filtros.porPagina.toString(),
                offset: ((filtros.pagina - 1) * filtros.porPagina).toString(),
            });

            const respuesta = await fetch(`${API_BASE}/admin/clientes?${params}`, {
                credentials: 'same-origin',
                headers: {'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''},
                signal,
            });

            if (!respuesta.ok) {
                throw new Error(`Error al cargar clientes (${respuesta.status})`);
            }

            const datos = await respuesta.json();
            let clientes: Cliente[] = datos.clientes || [];

            /* Filtro local por búsqueda (nombre, email, login) */
            if (filtros.busqueda.trim()) {
                const busqueda = filtros.busqueda.toLowerCase();
                clientes = clientes.filter(c =>
                    (c.centro_nombre || '').toLowerCase().includes(busqueda)
                    || (c.centro_email || '').toLowerCase().includes(busqueda)
                    || (c.wp_user_login || '').toLowerCase().includes(busqueda)
                    || (c.wp_display_name || '').toLowerCase().includes(busqueda)
                );
            }

            setEstado(prev => ({
                ...prev,
                clientes,
                total: datos.total || 0,
                cargando: false,
            }));
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setEstado(prev => ({
                ...prev,
                cargando: false,
                error: err instanceof Error ? err.message : 'Error al cargar clientes.',
            }));
        }
    }, [estado.filtros]);

    const cambiarFiltros = useCallback((nuevosFiltros: Partial<FiltrosClientes>) => {
        setEstado(prev => ({
            ...prev,
            filtros: {...prev.filtros, ...nuevosFiltros},
        }));
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        cargarClientes(controller.signal);
        return () => controller.abort();
    }, [cargarClientes]);

    return {
        ...estado,
        cargarClientes,
        cambiarFiltros,
    };
}
