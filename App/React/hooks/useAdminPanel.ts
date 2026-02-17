/*
 * Hook: useAdminPanel — Kamples (FASE 13)
 * Lógica de datos del panel de administración.
 * Carga KPIs, actividad, usuarios y moderación.
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
    type KpisAdmin,
    type DatosActividad,
    type UsuarioAdmin,
    type DatosModeracion,
} from '../services/apiAdmin';

export function useAdminPanel() {
    const [kpis, setKpis] = useState<KpisAdmin | null>(null);
    const [actividad, setActividad] = useState<DatosActividad | null>(null);
    const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [paginaUsuarios, setPaginaUsuarios] = useState(1);
    const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
    const [filtroPlannUsuarios, setFiltroPlannUsuarios] = useState('');
    const [moderacion, setModeracion] = useState<DatosModeracion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [tabActiva, setTabActiva] = useState('resumen');

    /* Carga inicial: KPIs + actividad */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            const [resKpis, resActividad] = await Promise.all([
                obtenerResumenAdmin(),
                obtenerActividadAdmin(14),
            ]);

            if (resKpis.ok && resKpis.data) setKpis(resKpis.data);
            if (resActividad.ok && resActividad.data) setActividad(resActividad.data);
            setCargando(false);
        };
        cargar();
    }, []);

    /* Cargar usuarios cuando cambia la pestaña, búsqueda, filtro o página */
    const cargarUsuarios = useCallback(async () => {
        const res = await listarUsuariosAdmin(
            paginaUsuarios,
            busquedaUsuarios,
            filtroPlannUsuarios,
            'fecha'
        );
        if (res.ok && res.data) {
            setUsuarios(res.data.data);
            setTotalUsuarios(res.data.total);
        }
    }, [paginaUsuarios, busquedaUsuarios, filtroPlannUsuarios]);

    useEffect(() => {
        if (tabActiva === 'usuarios') {
            cargarUsuarios();
        }
    }, [tabActiva, cargarUsuarios]);

    /* Cargar moderación cuando cambia la pestaña */
    const cargarModeracion = useCallback(async () => {
        const res = await listarModeracion();
        if (res.ok && res.data) {
            setModeracion(res.data);
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
        const res = await actualizarUsuarioAdmin(id, cambios);
        if (res.ok) {
            await cargarUsuarios();
        }
        return res.ok;
    }, [cargarUsuarios]);

    /* Acciones de moderación */
    const moderar = useCallback(async (
        tipo: 'publicacion' | 'comentario',
        id: number,
        accion: 'aprobar' | 'rechazar'
    ) => {
        const res = await moderarContenido(tipo, id, accion);
        if (res.ok) {
            await cargarModeracion();
            /* Refrescar KPIs para actualizar contadores */
            const resKpis = await obtenerResumenAdmin();
            if (resKpis.ok && resKpis.data) setKpis(resKpis.data);
        }
        return res.ok;
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
        cargando,
        tabActiva,

        /* Setters */
        setTabActiva,
        setPaginaUsuarios,
        setBusquedaUsuarios,
        setFiltroPlannUsuarios,

        /* Acciones */
        actualizarUsuario,
        moderar,
        cargarUsuarios,
    };
}
