/*
 * Hook: usePanelLibreria
 * Lógica del panel lateral de librería compacto: tabs, carga de datos,
 * likes, CRUD colecciones.
 * Extraído de PanelLibreria para cumplir SRP.
 */

import { useState, useCallback, useEffect } from 'react';
import { listarColecciones, listarColeccionesPublicas, eliminarColeccion } from '@app/services/apiColecciones';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import type { Coleccion } from '@app/types';

type TabId = 'explorar' | 'colecciones';

export const usePanelLibreria = () => {
    const [tab, setTab] = useState<TabId>('explorar');
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [coleccionesPublicas, setColeccionesPublicas] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalColeccion, setModalColeccion] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);

    const cerrarPanel = usePanelLateralStore(s => s.cerrar);

    /* Cargar datos al cambiar tab con cleanup */
    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            setCargando(true);
            try {
                if (tab === 'explorar') {
                    const resp = await listarColeccionesPublicas();
                    if (activo) setColeccionesPublicas(resp.ok && resp.data ? resp.data.colecciones : []);
                } else if (tab === 'colecciones') {
                    const resp = await listarColecciones();
                    if (activo) setColecciones(resp.ok && resp.data ? resp.data.colecciones : []);
                }
            } catch {
                /* Error de red — listas vacías */
            } finally {
                if (activo) setCargando(false);
            }
        };
        cargar();

        return () => { activo = false; };
    }, [tab]);

    const manejarGuardarColeccion = useCallback((col: Coleccion) => {
        setColecciones(prev => {
            const existe = prev.find(c => c.id === col.id);
            return existe ? prev.map(c => (c.id === col.id ? col : c)) : [col, ...prev];
        });
    }, []);

    const manejarEditarColeccion = useCallback((c: Coleccion) => {
        setColeccionEditando(c);
        setModalColeccion(true);
    }, []);

    const manejarEliminarColeccion = useCallback(async (c: Coleccion) => {
        const resp = await eliminarColeccion(c.id);
        if (resp.ok) setColecciones(prev => prev.filter(x => x.id !== c.id));
    }, []);

    const abrirNuevaColeccion = useCallback(() => {
        setColeccionEditando(null);
        setModalColeccion(true);
    }, []);

    return {
        tab, setTab,
        colecciones, coleccionesPublicas, cargando,
        modalColeccion, setModalColeccion, coleccionEditando,
        cerrarPanel,
        manejarGuardarColeccion, manejarEditarColeccion,
        manejarEliminarColeccion, abrirNuevaColeccion,
    };
};
