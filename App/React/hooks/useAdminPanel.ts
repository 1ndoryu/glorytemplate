/*
 * Hook: useAdminPanel — Kamples (FASE 13)
 * Lógica de datos del panel de administración.
 * Carga KPIs, actividad, usuarios y moderación.
 * D4: tabActiva viene del store global (TopBar) via useTabsTopBarStore.
 * Separación vista-lógica (SRP).
 */

import { useState, useEffect, useCallback } from 'react';
import {
    obtenerResumenAdmin,
    obtenerActividadAdmin,
    listarUsuariosAdmin,
    actualizarUsuarioAdmin,
    listarModeracion,
    moderarContenido,
    resolverReporte,
    obtenerHistorialModeracion,
    rechazarTodosPendientes,
    banearUsuarioAdmin,
    rechazarPublicacionesDeUsuarioAdmin,
    type KpisAdmin,
    type DatosActividad,
    type UsuarioAdmin,
    type DatosModeracion,
    type PublicacionModeracion,
} from '../services/apiAdmin';
import {
    listarColaIa,
    obtenerEstadisticasColaIa,
    type ItemColaIa,
    type EstadisticasColaIa,
} from '../services/apiColaIa';
import { useTabsTopBarStore } from '../stores/tabsTopBarStore';
import { useIslaActiva } from './useIslaActiva';
import { useValorCongelado } from './useValorCongelado';
import { crearLogger } from '../services/logger';

const log = crearLogger('useAdminPanel');

export function useAdminPanel() {
    const [kpis, setKpis] = useState<KpisAdmin | null>(null);
    const [actividad, setActividad] = useState<DatosActividad | null>(null);
    const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [paginaUsuarios, setPaginaUsuarios] = useState(1);
    const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
    const [filtroPlannUsuarios, setFiltroPlannUsuarios] = useState('');
    const [moderacion, setModeracion] = useState<DatosModeracion | null>(null);
    const [historialModeracion, setHistorialModeracion] = useState<PublicacionModeracion[]>([]);
    const [colaIaStats, setColaIaStats] = useState<EstadisticasColaIa | null>(null);
    const [colaIaRecientes, setColaIaRecientes] = useState<ItemColaIa[]>([]);
    const [cargando, setCargando] = useState(true);

    /* D4: Tab viene del store global (TopBar), congelada cuando la isla está oculta */
    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);
    const activa = useIslaActiva('AdminPanelIsland');
    const tabActiva = useValorCongelado(tabActivaGlobal, !activa);

    /* Carga inicial: KPIs + actividad + cola IA resumen */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const [resKpis, resActividad, resColaStats, resColaItems] = await Promise.all([
                    obtenerResumenAdmin(),
                    obtenerActividadAdmin(14),
                    obtenerEstadisticasColaIa(),
                    listarColaIa(1, 10),
                ]);

                if (resKpis.ok && resKpis.data) setKpis(resKpis.data);
                if (resActividad.ok && resActividad.data) setActividad(resActividad.data);
                if (resColaStats.ok && resColaStats.data) setColaIaStats(resColaStats.data);
                if (resColaItems.ok && resColaItems.data) setColaIaRecientes(resColaItems.data);
            } catch (err) {
                log.error('Error cargando KPIs y actividad', err);
            }
            setCargando(false);
        };
        cargar();
    }, []);

    /* Cargar usuarios cuando cambia la pestaña, búsqueda, filtro o página */
    const cargarUsuarios = useCallback(async () => {
        try {
            const res = await listarUsuariosAdmin(
                paginaUsuarios,
                busquedaUsuarios,
                filtroPlannUsuarios,
                'fecha'
            );
            if (res.ok && res.data) {
                setUsuarios(res.data.data ?? []);
                setTotalUsuarios(res.data.total ?? 0);
            }
        } catch (err) {
            log.error('Error cargando usuarios admin', err);
        }
    }, [paginaUsuarios, busquedaUsuarios, filtroPlannUsuarios]);

    useEffect(() => {
        if (tabActiva === 'usuarios') {
            cargarUsuarios();
        }
    }, [tabActiva, cargarUsuarios]);

    /* Cargar moderación cuando cambia la pestaña */
    const cargarModeracion = useCallback(async () => {
        try {
            const [res, resHistorial] = await Promise.all([
                listarModeracion(),
                obtenerHistorialModeracion(2),
            ]);
            if (res.ok && res.data) {
                setModeracion(res.data);
            }
            if (resHistorial.ok && resHistorial.data) {
                setHistorialModeracion(resHistorial.data.publicaciones ?? []);
            }
        } catch (err) {
            log.error('Error cargando moderación', err);
        }
    }, []);

    useEffect(() => {
        if (tabActiva === 'moderacion') {
            cargarModeracion();
        }
    }, [tabActiva, cargarModeracion]);

    /* Acciones de usuario */
    const actualizarUsuario = useCallback(async (
        id: number,
        cambios: { plan?: string; rol?: string; verificado?: boolean; ban_hasta?: string | null }
    ) => {
        try {
            const res = await actualizarUsuarioAdmin(id, cambios);
            if (res.ok) {
                await cargarUsuarios();
            }
            return res.ok;
        } catch (err) {
            log.error('Error actualizando usuario', err);
            return false;
        }
    }, [cargarUsuarios]);

    /* Acciones de moderación */
    const moderar = useCallback(async (
        tipo: 'publicacion' | 'comentario' | 'articulo',
        id: number,
        accion: 'aprobar' | 'rechazar'
    ) => {
        try {
            const res = await moderarContenido(tipo, id, accion);
            if (res.ok) {
                await cargarModeracion();
                /* Refrescar KPIs para actualizar contadores */
                const resKpis = await obtenerResumenAdmin();
                if (resKpis.ok && resKpis.data) setKpis(resKpis.data);
            }
            return res.ok;
        } catch (err) {
            log.error('Error moderando contenido', err);
            return false;
        }
    }, [cargarModeracion]);

    /* Resolver o descartar un reporte */
    const manejarResolverReporte = useCallback(async (
        id: number,
        accion: 'resolver' | 'descartar'
    ) => {
        try {
            const res = await resolverReporte(id, accion);
            if (res.ok) {
                await cargarModeracion();
                const resKpis = await obtenerResumenAdmin();
                if (resKpis.ok && resKpis.data) setKpis(resKpis.data);
            }
            return res.ok;
        } catch (err) {
            log.error('Error resolviendo reporte', err);
            return false;
        }
    }, [cargarModeracion]);

    /* Rechazar todas las publicaciones pendientes de moderación */
    const manejarRechazarTodosPendientes = useCallback(async () => {
        try {
            const res = await rechazarTodosPendientes();
            if (res.ok) {
                await cargarModeracion();
                const resKpis = await obtenerResumenAdmin();
                if (resKpis.ok && resKpis.data) setKpis(resKpis.data);
            }
            return res.ok;
        } catch (err) {
            log.error('Error rechazando pendientes en masa', err);
            return false;
        }
    }, [cargarModeracion]);

    /* Banear un usuario manualmente desde el panel de moderación */
    const banear = useCallback(async (
        usuarioId: number,
        duracion: '1h' | '24h' | '7d' | '30d',
        razon: string
    ) => {
        try {
            const res = await banearUsuarioAdmin(usuarioId, duracion, razon);
            return res.ok;
        } catch (err) {
            log.error('Error baneando usuario', err);
            return false;
        }
    }, []);

    /* Rechazar todas las publicaciones de un usuario específico */
    const rechazarTodasDeUsuario = useCallback(async (autorId: number) => {
        try {
            const res = await rechazarPublicacionesDeUsuarioAdmin(autorId);
            if (res.ok) await cargarModeracion();
            return res.ok;
        } catch (err) {
            log.error('Error rechazando publicaciones de usuario', err);
            return false;
        }
    }, [cargarModeracion]);

    return {
        /* Datos */
        kpis,
        actividad,
        usuarios,
        totalUsuarios,
        paginaUsuarios,
        busquedaUsuarios,
        filtroPlannUsuarios,
        moderacion,
        historialModeracion,
        colaIaStats,
        colaIaRecientes,
        cargando,
        tabActiva,

        /* Setters */
        setPaginaUsuarios,
        setBusquedaUsuarios,
        setFiltroPlannUsuarios,

        /* Acciones */
        actualizarUsuario,
        moderar,
        manejarResolverReporte,
        manejarRechazarTodosPendientes,
        banear,
        rechazarTodasDeUsuario,
        cargarUsuarios,
    };
}
