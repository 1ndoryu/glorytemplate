/**
 * useAdminPanel — Hook de lógica para el panel de administración.
 * Gestiona la sección activa y carga de datos según contexto.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGloryContext } from '@/hooks';
import {
    MOCK_ESTADISTICAS,
    MOCK_RESERVAS,
    MOCK_CLIENTES,
    MOCK_VEHICULOS,
    MOCK_ACTIVIDAD,
} from '@app/dev/mockAdmin';
import type {
    SeccionPanel,
    AdminReserva,
    AdminEstadisticas,
    AdminCliente,
    AdminVehiculoEditable,
    AdminConfiguracion,
    EstadoReserva,
    EventoActividad,
} from '@app/types/cresta';

interface UseAdminPanelResult {
    seccion: SeccionPanel;
    setSeccion: (s: SeccionPanel) => void;
    isAdmin: boolean;

    /* Dashboard */
    estadisticas: AdminEstadisticas | null;
    loadingEstadisticas: boolean;
    actividad: EventoActividad[];
    loadingActividad: boolean;

    /* Reservas */
    reservas: AdminReserva[];
    loadingReservas: boolean;
    filtroEstadoReserva: EstadoReserva | 'todas';
    setFiltroEstadoReserva: (f: EstadoReserva | 'todas') => void;
    cambiarEstadoReserva: (id: number, estado: EstadoReserva) => Promise<boolean>;

    /* Flota */
    vehiculos: AdminVehiculoEditable[];
    loadingVehiculos: boolean;
    guardarVehiculo: (v: AdminVehiculoEditable) => Promise<boolean>;
    toggleActivoVehiculo: (id: number) => Promise<boolean>;
    eliminarVehiculo: (id: number) => Promise<boolean>;

    /* Clientes */
    clientes: AdminCliente[];
    loadingClientes: boolean;

    /* Configuración */
    configuracion: AdminConfiguracion | null;
    loadingConfiguracion: boolean;
    guardarConfiguracion: (c: AdminConfiguracion) => Promise<boolean>;

    /* Errores */
    error: string | null;
    limpiarError: () => void;
}

const ESTADISTICAS_INICIAL: AdminEstadisticas = {
    totalReservas: 0,
    reservasConfirmadas: 0,
    reservasPendientes: 0,
    ingresosMes: 0,
    ingresosTotales: 0,
    vehiculosActivos: 0,
    clientesUnicos: 0,
};

export function useAdminPanel(): UseAdminPanelResult {
    const { restUrl, nonce, isAdmin } = useGloryContext();
    const baseUrl = restUrl?.replace(/\/$/, '') ?? '/wp-json';

    const [seccion, setSeccion] = useState<SeccionPanel>('dashboard');
    const [error, setError] = useState<string | null>(null);

    /* Dashboard */
    const [estadisticas, setEstadisticas] = useState<AdminEstadisticas | null>(null);
    const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
    const [actividad, setActividad] = useState<EventoActividad[]>([]);
    const [loadingActividad, setLoadingActividad] = useState(false);

    /* Reservas */
    const [reservas, setReservas] = useState<AdminReserva[]>([]);
    const [loadingReservas, setLoadingReservas] = useState(false);
    const [filtroEstadoReserva, setFiltroEstadoReserva] = useState<EstadoReserva | 'todas'>('todas');

    /* Flota */
    const [vehiculos, setVehiculos] = useState<AdminVehiculoEditable[]>([]);
    const [loadingVehiculos, setLoadingVehiculos] = useState(false);

    /* Clientes */
    const [clientes, setClientes] = useState<AdminCliente[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);

    /* Configuración */
    const [configuracion, setConfiguracion] = useState<AdminConfiguracion | null>(null);
    const [loadingConfiguracion, setLoadingConfiguracion] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    const headers = useCallback((): Record<string, string> => {
        const h: Record<string, string> = { 'Content-Type': 'application/json' };
        if (nonce) h['X-WP-Nonce'] = nonce;
        return h;
    }, [nonce]);

    const limpiarError = useCallback(() => setError(null), []);

    /* Fetch genérico con AbortController */
    const fetchAdmin = useCallback(async <T>(
        endpoint: string,
        opciones?: RequestInit
    ): Promise<T | null> => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch(`${baseUrl}/glory/v1/admin/${endpoint}`, {
                headers: headers(),
                signal: controller.signal,
                ...opciones,
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error ?? data.message ?? 'Error en la operación');
                return null;
            }
            return data as T;
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return null;
            setError('Error de conexión con el servidor');
            return null;
        }
    }, [baseUrl, headers]);

    /* Sin contexto WP (desarrollo) — usar datos de previsualización */
    const esModoPreview = !nonce;

    /* Cargar estadísticas */
    const cargarEstadisticas = useCallback(async () => {
        if (esModoPreview) { setEstadisticas(MOCK_ESTADISTICAS); return; }
        setLoadingEstadisticas(true);
        const data = await fetchAdmin<{ success: boolean; estadisticas: AdminEstadisticas }>('estadisticas');
        if (data) setEstadisticas(data.estadisticas);
        else setEstadisticas(ESTADISTICAS_INICIAL);
        setLoadingEstadisticas(false);
    }, [fetchAdmin, esModoPreview]);

    /* Cargar actividad reciente */
    const cargarActividad = useCallback(async () => {
        if (esModoPreview) { setActividad(MOCK_ACTIVIDAD); return; }
        setLoadingActividad(true);
        const data = await fetchAdmin<{ success: boolean; actividad: EventoActividad[] }>('actividad');
        if (data) setActividad(data.actividad);
        else setActividad([]);
        setLoadingActividad(false);
    }, [fetchAdmin, esModoPreview]);

    /* Cargar reservas */
    const cargarReservas = useCallback(async () => {
        if (esModoPreview) {
            const filtradas = filtroEstadoReserva !== 'todas'
                ? MOCK_RESERVAS.filter(r => r.estado === filtroEstadoReserva)
                : MOCK_RESERVAS;
            setReservas(filtradas);
            return;
        }
        setLoadingReservas(true);
        const filtro = filtroEstadoReserva !== 'todas' ? `?estado=${filtroEstadoReserva}` : '';
        const data = await fetchAdmin<{ success: boolean; reservas: AdminReserva[] }>(`reservas${filtro}`);
        if (data) {
            /* Si no hay datos reales aún, mostrar mocks como previsualización */
            setReservas(data.reservas.length > 0 ? data.reservas : MOCK_RESERVAS);
        }
        setLoadingReservas(false);
    }, [fetchAdmin, filtroEstadoReserva, esModoPreview]);

    /* Cambiar estado de reserva */
    const cambiarEstadoReserva = useCallback(async (id: number, estado: EstadoReserva): Promise<boolean> => {
        const data = await fetchAdmin<{ success: boolean }>(`reservas/${id}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado }),
        });
        if (data) {
            setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
            return true;
        }
        return false;
    }, [fetchAdmin]);

    /* Cargar vehículos */
    const cargarVehiculos = useCallback(async () => {
        if (esModoPreview) { setVehiculos(MOCK_VEHICULOS); return; }
        setLoadingVehiculos(true);
        const data = await fetchAdmin<{ success: boolean; vehiculos: AdminVehiculoEditable[] }>('vehiculos');
        if (data) setVehiculos(data.vehiculos);
        setLoadingVehiculos(false);
    }, [fetchAdmin, esModoPreview]);

    /* Guardar vehículo */
    const guardarVehiculo = useCallback(async (v: AdminVehiculoEditable): Promise<boolean> => {
        const method = v.id ? 'PUT' : 'POST';
        const endpoint = v.id ? `vehiculos/${v.id}` : 'vehiculos';
        const data = await fetchAdmin<{ success: boolean; vehiculo: AdminVehiculoEditable }>(endpoint, {
            method,
            body: JSON.stringify(v),
        });
        if (data) {
            if (v.id) {
                setVehiculos(prev => prev.map(x => x.id === v.id ? data.vehiculo : x));
            } else {
                setVehiculos(prev => [...prev, data.vehiculo]);
            }
            return true;
        }
        return false;
    }, [fetchAdmin]);

    /* Toggle activo */
    const toggleActivoVehiculo = useCallback(async (id: number): Promise<boolean> => {
        const vehiculo = vehiculos.find(v => v.id === id);
        if (!vehiculo) return false;
        const data = await fetchAdmin<{ success: boolean }>(`vehiculos/${id}/toggle`, {
            method: 'PUT',
        });
        if (data) {
            setVehiculos(prev => prev.map(v => v.id === id ? { ...v, activo: !v.activo } : v));
            return true;
        }
        return false;
    }, [fetchAdmin, vehiculos]);

    /* Eliminar vehículo */
    const eliminarVehiculo = useCallback(async (id: number): Promise<boolean> => {
        const data = await fetchAdmin<{ success: boolean }>(`vehiculos/${id}`, {
            method: 'DELETE',
        });
        if (data) {
            setVehiculos(prev => prev.filter(v => v.id !== id));
            return true;
        }
        return false;
    }, [fetchAdmin]);

    /* Cargar clientes */
    const cargarClientes = useCallback(async () => {
        if (esModoPreview) { setClientes(MOCK_CLIENTES); return; }
        setLoadingClientes(true);
        const data = await fetchAdmin<{ success: boolean; clientes: AdminCliente[] }>('clientes');
        if (data) {
            /* Si no hay datos reales aún, mostrar mocks como previsualización */
            setClientes(data.clientes.length > 0 ? data.clientes : MOCK_CLIENTES);
        }
        setLoadingClientes(false);
    }, [fetchAdmin, esModoPreview]);

    /* Cargar configuración */
    const cargarConfiguracion = useCallback(async () => {
        setLoadingConfiguracion(true);
        const data = await fetchAdmin<{ success: boolean; configuracion: AdminConfiguracion }>('configuracion');
        if (data) setConfiguracion(data.configuracion);
        setLoadingConfiguracion(false);
    }, [fetchAdmin]);

    /* Guardar configuración */
    const guardarConfiguracion = useCallback(async (c: AdminConfiguracion): Promise<boolean> => {
        const data = await fetchAdmin<{ success: boolean }>('configuracion', {
            method: 'PUT',
            body: JSON.stringify(c),
        });
        if (data) {
            setConfiguracion(c);
            return true;
        }
        return false;
    }, [fetchAdmin]);

    /* Carga según sección activa */
    useEffect(() => {
        if (!isAdmin && !esModoPreview) return;
        setError(null);
        switch (seccion) {
            case 'dashboard':
                cargarEstadisticas();
                cargarActividad();
                break;
            case 'reservas':
                cargarReservas();
                break;
            case 'flota':
                cargarVehiculos();
                break;
            case 'clientes':
                cargarClientes();
                break;
            case 'configuracion':
                cargarConfiguracion();
                break;
        }
    }, [seccion, isAdmin, esModoPreview, cargarEstadisticas, cargarActividad, cargarReservas, cargarVehiculos, cargarClientes, cargarConfiguracion]);

    /* Recargar reservas cuando cambia el filtro */
    useEffect(() => {
        if (seccion === 'reservas' && (isAdmin || esModoPreview)) {
            cargarReservas();
        }
    }, [filtroEstadoReserva, seccion, isAdmin, esModoPreview, cargarReservas]);

    /* Cleanup */
    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    return {
        seccion, setSeccion, isAdmin,
        estadisticas, loadingEstadisticas,
        actividad, loadingActividad,
        reservas, loadingReservas, filtroEstadoReserva, setFiltroEstadoReserva, cambiarEstadoReserva,
        vehiculos, loadingVehiculos, guardarVehiculo, toggleActivoVehiculo, eliminarVehiculo,
        clientes, loadingClientes,
        configuracion, loadingConfiguracion, guardarConfiguracion,
        error, limpiarError,
    };
}
