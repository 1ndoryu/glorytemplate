/*
 * Hook: usePanelLibreria
 * Lógica del panel lateral de librería compacto: tabs, carga de datos,
 * likes, CRUD colecciones.
 * Extraído de PanelLibreria para cumplir SRP.
 */

import { useState, useCallback, useEffect } from 'react';
import { listarSamples } from '@app/services/apiSamples';
import { listarColecciones, listarColeccionesPublicas, eliminarColeccion } from '@app/services/apiColecciones';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import type { SampleResumen, Coleccion, TipoReaccion } from '@app/types';

type TabId = 'explorar' | 'colecciones' | 'subidos';

export const usePanelLibreria = () => {
    const [tab, setTab] = useState<TabId>('explorar');
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [coleccionesPublicas, setColeccionesPublicas] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalColeccion, setModalColeccion] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);

    const navegar = useNavigationStore(s => s.navegar);
    const abrirSubirModal = useSubirModalStore(s => s.abrir);
    const cerrarPanel = usePanelLateralStore(s => s.cerrar);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);

    /* Cargar datos al cambiar tab con cleanup */
    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            setCargando(true);
            try {
                if (tab === 'explorar') {
                    const resp = await listarColeccionesPublicas();
                    if (activo) setColeccionesPublicas(resp.ok && resp.data ? resp.data : []);
                } else if (tab === 'colecciones') {
                    const resp = await listarColecciones();
                    if (activo) setColecciones(resp.ok && resp.data ? resp.data : []);
                } else {
                    const { useAuthStore } = await import('@app/stores/authStore');
                    const username = useAuthStore.getState().usuario?.username;
                    const resp = await listarSamples({ creador: username || undefined, perPage: 20 });
                    if (activo) setSamples(resp.ok && resp.data ? resp.data.data ?? [] : []);
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

    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find(s => s.id === sampleId);
        if (reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            setSamples(prev =>
                prev.map(s => s.id === sampleId
                    ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                    : s)
            );
            await darLike('sample', sampleId, reaccion);
        } else if (sample?.liked || sample?.reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            setSamples(prev =>
                prev.map(s => s.id === sampleId
                    ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                    : s)
            );
            await quitarLike('sample', sampleId);
        } else {
            setSamples(prev =>
                prev.map(s => s.id === sampleId
                    ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                    : s)
            );
            await darLike('sample', sampleId, 'like');
        }
    }, [samples]);

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
        samples, colecciones, coleccionesPublicas, cargando,
        modalColeccion, setModalColeccion, coleccionEditando,
        navegar, abrirSubirModal, cerrarPanel, abrirDetalle,
        manejarLike, manejarGuardarColeccion, manejarEditarColeccion,
        manejarEliminarColeccion, abrirNuevaColeccion,
    };
};
