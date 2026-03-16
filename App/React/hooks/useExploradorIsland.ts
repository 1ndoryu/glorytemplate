/*
 * useExploradorIsland — Hook dedicado para estado local y callbacks de ExploradorIsland.
 * Separa la lógica de la vista siguiendo SRP.
 */

import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useExploradorPagina } from '@app/hooks/useExploradorPagina';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { toast } from '@app/stores/toastStore';
import { obtenerEstadoSyncSample, toggleSyncSample, estaEnDesktop } from '@app/hooks/useEstadoSync';

export interface BreadcrumbSegmento {
    label: string;
    onClick: () => void;
}

export const useExploradorIsland = () => {
    const pagina = useExploradorPagina();
    const navegar = useNavigationStore(s => s.navegar);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);
    const menu = useMenuContextualSample();

    const [vistaActiva, setVistaActiva] = useState<'lista' | 'cuadricula'>('lista');
    const [crearCarpetaAbierto, setCrearCarpetaAbierto] = useState(false);
    const [nuevaCarpetaNombre, setNuevaCarpetaNombre] = useState('');
    const [moverModalAbierto, setMoverModalAbierto] = useState(false);
    const [sampleParaMover, setSampleParaMover] = useState<number | null>(null);
    const [carpetaDragOver, setCarpetaDragOver] = useState<string | null>(null);
    /* C349: Sidebar oculto por defecto, toggle manual */
    const [sidebarAbierto, setSidebarAbierto] = useState(false);
    const inputCrearRef = useRef<HTMLInputElement>(null);

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'ExploradorIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    const manejarComentar = useCallback((sampleId: number) => {
        const sample = pagina.samples.find((s) => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [pagina.samples, abrirComentarios]);

    const manejarDragStart = useCallback((sampleId: number) => {
        pagina.setSampleArrastrado(sampleId);
    }, [pagina.setSampleArrastrado]);

    const manejarDragEnd = useCallback(() => {
        pagina.setSampleArrastrado(null);
        setCarpetaDragOver(null);
    }, [pagina.setSampleArrastrado]);

    const manejarDropEnCarpeta = useCallback(async (
        e: React.DragEvent,
        primaria: string,
        subcarpeta = ''
    ) => {
        e.preventDefault();
        setCarpetaDragOver(null);
        const sampleId = pagina.sampleArrastrado ?? parseInt(e.dataTransfer.getData('sampleId'), 10);
        if (!sampleId || isNaN(sampleId)) return;
        pagina.setSampleArrastrado(null);
        await pagina.moverSample(sampleId, primaria, subcarpeta);
    }, [pagina.sampleArrastrado, pagina.moverSample, pagina.setSampleArrastrado]);

    const manejarDragOver = useCallback((e: React.DragEvent, carpetaId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setCarpetaDragOver(carpetaId);
    }, []);

    const manejarDragLeave = useCallback(() => {
        setCarpetaDragOver(null);
    }, []);

    const manejarCrearCarpeta = useCallback(() => {
        if (!nuevaCarpetaNombre.trim()) return;
        pagina.crearCarpeta(nuevaCarpetaNombre.trim(), pagina.carpetaActiva || undefined);
        setNuevaCarpetaNombre('');
        setCrearCarpetaAbierto(false);
    }, [nuevaCarpetaNombre, pagina.carpetaActiva, pagina.crearCarpeta]);

    const abrirMoverModal = useCallback((sampleId: number) => {
        setSampleParaMover(sampleId);
        setMoverModalAbierto(true);
    }, []);

    const manejarMoverDesdeModal = useCallback(async (primaria: string, subcarpeta = '') => {
        if (!sampleParaMover) return;
        await pagina.moverSample(sampleParaMover, primaria, subcarpeta);
        setMoverModalAbierto(false);
        setSampleParaMover(null);
    }, [sampleParaMover, pagina.moverSample]);

    useEffect(() => {
        if (crearCarpetaAbierto && inputCrearRef.current) {
            inputCrearRef.current.focus();
        }
    }, [crearCarpetaAbierto]);

    const todasCarpetas = useMemo(() => {
        const nombres = new Set(pagina.carpetas.map(c => c.primaria));
        const localesFiltradas = pagina.carpetasLocales.filter(c => !nombres.has(c.primaria));
        return [...pagina.carpetas, ...localesFiltradas];
    }, [pagina.carpetas, pagina.carpetasLocales]);

    const carpetaActivaInfo = useMemo(() => {
        if (!pagina.carpetaActiva) return null;
        return todasCarpetas.find(c => c.primaria === pagina.carpetaActiva) ?? null;
    }, [todasCarpetas, pagina.carpetaActiva]);

    /*
     * C349: Carpetas visibles en el nivel actual de navegación.
     * Raíz → todas las carpetas primarias.
     * Dentro de carpeta → subcarpetas de esa carpeta.
     */
    const carpetasVisibles = useMemo(() => {
        if (!pagina.carpetaActiva) {
            return todasCarpetas.map(c => ({
                nombre: c.primaria,
                total: c.total,
                esSubcarpeta: false,
            }));
        }
        if (!pagina.subcarpetaActiva && carpetaActivaInfo) {
            return carpetaActivaInfo.subcarpetas.map(s => ({
                nombre: s.nombre,
                total: s.total,
                esSubcarpeta: true,
            }));
        }
        return [];
    }, [pagina.carpetaActiva, pagina.subcarpetaActiva, todasCarpetas, carpetaActivaInfo]);

    /*
     * C349: Breadcrumb segments para BarraHerramientasExplorador.
     * Raíz: ["Explorador"]
     * Carpeta: ["Explorador", "NombreCarpeta"]
     * Subcarpeta: ["Explorador", "NombreCarpeta", "NombreSubcarpeta"]
     */
    const breadcrumbSegmentos = useMemo((): BreadcrumbSegmento[] => {
        const segmentos: BreadcrumbSegmento[] = [
            { label: 'Explorador', onClick: () => pagina.seleccionarCarpeta('') },
        ];
        if (pagina.carpetaActiva) {
            segmentos.push({
                label: pagina.carpetaActiva,
                onClick: () => pagina.seleccionarCarpeta(pagina.carpetaActiva),
            });
        }
        if (pagina.subcarpetaActiva) {
            segmentos.push({
                label: pagina.subcarpetaActiva,
                onClick: () => { /* ultimo segmento: no navega */ },
            });
        }
        return segmentos;
    }, [pagina.carpetaActiva, pagina.subcarpetaActiva, pagina.seleccionarCarpeta]);

    const toggleSidebar = useCallback(() => {
        setSidebarAbierto(prev => !prev);
    }, []);

    const mostrarSubcarpetasEnArea = pagina.carpetaActiva && !pagina.subcarpetaActiva
        && carpetaActivaInfo && carpetaActivaInfo.subcarpetas.length > 0;

    /* Items menu contextual extendidos con mover + sync */
    const menuItemsExtendidos = useMemo(() => {
        if (!menu.estado.sample) return menu.items;
        const sampleId = menu.estado.sample.id;

        const itemMover = {
            id: 'moverACarpeta',
            etiqueta: 'Mover a carpeta...',
            onClick: () => {
                if (menu.estado.sample) {
                    abrirMoverModal(menu.estado.sample.id);
                    menu.cerrarMenu();
                }
            },
        };

        const items = [...menu.items];
        const idx = items.findIndex(i => i.id === 'coleccion');
        if (idx >= 0) {
            items.splice(idx + 1, 0, itemMover);
        } else {
            items.push(itemMover);
        }

        if (estaEnDesktop()) {
            const estadoSync = obtenerEstadoSyncSample(sampleId);
            if (estadoSync === 'sincronizado') {
                items.push({
                    id: 'desactivarSync',
                    etiqueta: 'Dejar de sincronizar',
                    onClick: async () => {
                        const ok = await toggleSyncSample(sampleId, 'sincronizado');
                        if (ok) toast.exito('Sync desactivada para este sample');
                        menu.cerrarMenu();
                    },
                });
            } else if (estadoSync === 'no_sincronizar') {
                items.push({
                    id: 'reactivarSync',
                    etiqueta: 'Reactivar sincronización',
                    onClick: async () => {
                        const ok = await toggleSyncSample(sampleId, 'no_sincronizar');
                        if (ok) toast.exito('Se descargará en la próxima sync');
                        menu.cerrarMenu();
                    },
                });
            }
        }

        return items;
    }, [menu.items, menu.estado.sample, menu.cerrarMenu, abrirMoverModal]);

    const totalGeneral = todasCarpetas.reduce((acc, c) => acc + c.total, 0);

    const manejarRestaurarTodos = useCallback(async () => {
        await pagina.restaurarTodosAOriginal();
    }, [pagina.restaurarTodosAOriginal]);

    return {
        ...pagina,
        navegar,
        menu,
        vistaActiva,
        setVistaActiva,
        crearCarpetaAbierto,
        setCrearCarpetaAbierto,
        nuevaCarpetaNombre,
        setNuevaCarpetaNombre,
        moverModalAbierto,
        setMoverModalAbierto,
        carpetaDragOver,
        sidebarAbierto,
        toggleSidebar,
        inputCrearRef,
        manejarComentar,
        manejarDragStart,
        manejarDragEnd,
        manejarDropEnCarpeta,
        manejarDragOver,
        manejarDragLeave,
        manejarCrearCarpeta,
        abrirMoverModal,
        manejarMoverDesdeModal,
        manejarRestaurarTodos,
        todasCarpetas,
        carpetaActivaInfo,
        carpetasVisibles,
        breadcrumbSegmentos,
        mostrarSubcarpetasEnArea,
        menuItemsExtendidos,
        totalGeneral,
    };
};
