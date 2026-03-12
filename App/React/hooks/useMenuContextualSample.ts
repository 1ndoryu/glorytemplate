/*
 * Hook: useMenuContextualSample — Kamples (Fase 2.9 + C800 + C801)
 * Gestiona la apertura, posicion y acciones del menu contextual en samples.
 * Reutilizable en cualquier lista que muestre TarjetaSample.
 * TO-DO: Este hook supera 120 lineas — extraer acciones a un builder
 * (ej: construirItemsMenuSample) para cumplir limite SRP.
 */

import { useState, useCallback, useMemo, type MouseEvent } from 'react';
import type { SampleResumen } from '@app/types';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { useNavigationStore } from '@/core/router';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import { useAuthStore } from '@app/stores/authStore';
import { useEditarModalStore } from '@app/stores/editarModalStore';
import { useCorregirIAStore } from '@app/stores/corregirIAStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { eliminarSample, actualizarSample } from '@app/services/apiSamples';
import { desvincularSample } from '@app/services/apiRelaciones';
import { descargarSample } from '@app/services/apiDescargas';
import { toast } from '@app/stores/toastStore';
import { useReportarStore } from '@app/stores/reportarStore';

/* Eventos globales para notificar cambios de samples sin recargar la página */
export const EVENTO_SAMPLE_ELIMINADO = 'kamples:sample-eliminado';
export const EVENTO_SAMPLE_RESTAURADO = 'kamples:sample-restaurado';
export const EVENTO_SAMPLE_ACTUALIZADO = 'kamples:sample-actualizado';
export const EVENTO_SAMPLE_CREADO = 'kamples:sample-creado';

interface EstadoMenuSample {
    abierto: boolean;
    x: number;
    y: number;
    sample: SampleResumen | null;
}

interface RetornoMenuSample {
    estado: EstadoMenuSample;
    items: MenuItemDef[];
    abrirMenu: (e: MouseEvent, sample: SampleResumen) => void;
    cerrarMenu: () => void;
    /* Sample seleccionado para inspección — null si no hay */
    sampleInspeccion: SampleResumen | null;
    cerrarInspeccion: () => void;
}

export const useMenuContextualSample = (): RetornoMenuSample => {
    const [estado, setEstado] = useState<EstadoMenuSample>({
        abierto: false,
        x: 0,
        y: 0,
        sample: null,
    });
    const [sampleInspeccion, setSampleInspeccion] = useState<SampleResumen | null>(null);

    const navegar = useNavigationStore(s => s.navegar);
    const setSample = useReproductorStore(s => s.setSample);
    const abrirColeccionPicker = useColeccionPickerStore(s => s.abrir);
    const usuario = useAuthStore(s => s.usuario);
    const abrirEditarSample = useEditarModalStore(s => s.abrirSample);
    const abrirCorregirIA = useCorregirIAStore(s => s.abrir);
    const abrirSugerencias = usePanelLateralStore(s => s.abrirSugerencias);

    /* El usuario puede editar/eliminar si es propietario del sample o admin */
    const puedeEditar = useMemo(() => {
        if (!usuario || !estado.sample) return false;
        const esPropietario = usuario.id === estado.sample.creador.id;
        const esAdmin = usuario.rol === 'admin';
        return esPropietario || esAdmin;
    }, [usuario, estado.sample]);

    /* El usuario puede eliminar si es propietario del sample o admin */
    const puedeEliminar = useMemo(() => {
        if (!usuario || !estado.sample) return false;
        const esPropietario = usuario.id === estado.sample.creador.id;
        const esAdmin = usuario.rol === 'admin';
        return esPropietario || esAdmin;
    }, [usuario, estado.sample]);

    /* C178: Solo admin puede verificar/desverificar */
    const esAdmin = useMemo(() => {
        return usuario?.rol === 'admin';
    }, [usuario]);

    const abrirMenu = useCallback((e: MouseEvent, sample: SampleResumen) => {
        e.preventDefault();
        e.stopPropagation();
        setEstado({
            abierto: true,
            x: e.clientX,
            y: e.clientY,
            sample,
        });
    }, []);

    const cerrarMenu = useCallback(() => {
        setEstado((prev) => ({ ...prev, abierto: false }));
    }, []);

    const cerrarInspeccion = useCallback(() => {
        setSampleInspeccion(null);
    }, []);

    /* Acciones del menú — se arman dinámicamente */
    const items: MenuItemDef[] = estado.sample
        ? [
            {
                id: 'reproducir',
                etiqueta: 'Reproducir',
                onClick: () => {
                    if (estado.sample) setSample(estado.sample);
                },
            },
            {
                id: 'detalle',
                etiqueta: 'Ver detalle',
                href: estado.sample ? `/sample/${estado.sample.slug}/` : undefined,
                onClick: () => {
                    if (estado.sample) navegar(`/sample/${estado.sample.slug}/`);
                },
                separadorDespues: true,
            },
            {
                id: 'coleccion',
                etiqueta: 'Añadir a colección',
                onClick: () => {
                    if (estado.sample) abrirColeccionPicker(estado.sample);
                },
            },
            /* C281.1: Descargar archivo — antes era botón directo, ahora en menú contextual */
            {
                id: 'descargar',
                etiqueta: 'Descargar archivo',
                onClick: async () => {
                    if (!estado.sample) return;
                    try {
                        const resp = await descargarSample(estado.sample.id);
                        if (resp.ok && resp.data?.url) {
                            const a = document.createElement('a');
                            a.href = resp.data.url;
                            a.download = resp.data.nombre || estado.sample.titulo || 'sample';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        } else if (resp.status === 429 || resp.status === 403) {
                            toast.error(resp.error ?? 'Has alcanzado el límite de descargas');
                        }
                    } catch {
                        toast.error('Error de red al descargar');
                    }
                },
                separadorDespues: true,
            },
            {
                id: 'creador',
                etiqueta: `Ir a ${estado.sample.creador.nombreVisible || estado.sample.creador.username}`,
                href: estado.sample ? `/perfil/${estado.sample.creador.username}/` : undefined,
                onClick: () => {
                    if (estado.sample) navegar(`/perfil/${estado.sample.creador.username}/`);
                },
            },
            {
                id: 'compartir',
                etiqueta: 'Copiar enlace',
                onClick: () => {
                    if (estado.sample) {
                        copiarAlPortapapeles(
                            `${window.location.origin}/sample/${estado.sample.slug}/`
                        );
                    }
                },
                separadorDespues: true,
            },
            /* QQ19: Abrir panel lateral de sugerencias similares */
            {
                id: 'sugerencias',
                etiqueta: 'También te podría gustar',
                onClick: () => {
                    if (estado.sample) abrirSugerencias(estado.sample);
                },
            },
            /* C801: Enlace directo a YouTube si el sample fue extraido del pipeline */
            ...(() => {
                const ytId = estado.sample?.metadata?.youtube_id;
                if (typeof ytId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
                    return [{
                        id: 'youtube',
                        etiqueta: 'Ver en YouTube',
                        onClick: () => {
                            window.open(`https://www.youtube.com/watch?v=${ytId}`, '_blank', 'noopener,noreferrer');
                        },
                        separadorDespues: true,
                    } as MenuItemDef];
                }
                return [];
            })(),
            ...(puedeEditar
                ? [
                    {
                        id: 'editar',
                        etiqueta: 'Editar sample',
                        onClick: () => {
                            if (estado.sample) abrirEditarSample(estado.sample);
                        },
                    } as MenuItemDef,
                ]
                : []),
            /* C800: Corregir metadata IA (admin only, solo samples extraidos del pipeline) */
            ...(esAdmin && estado.sample?.metadata?.relacion_id
                ? [
                    {
                        id: 'corregir-ia',
                        etiqueta: 'Corregir metadata IA',
                        onClick: () => {
                            if (estado.sample) abrirCorregirIA(estado.sample);
                        },
                    } as MenuItemDef,
                ]
                : []),
            /* C178: verificar/desverificar sample (admin only) */
            ...(esAdmin && estado.sample
                ? [
                    {
                        id: 'verificar',
                        etiqueta: estado.sample.verificado ? 'Quitar verificación' : 'Verificar sample',
                        onClick: () => {
                            if (!estado.sample) return;
                            const s = estado.sample;
                            const nuevoEstado = !s.verificado;
                            actualizarSample(s.id, { verificado: nuevoEstado }).then((resp) => {
                                if (resp.ok) {
                                    toast.exito(nuevoEstado ? 'Sample verificado' : 'Verificación removida');
                                    window.dispatchEvent(
                                        new CustomEvent(EVENTO_SAMPLE_ACTUALIZADO, {
                                            detail: { sampleId: s.id, cambios: { verificado: nuevoEstado } },
                                        })
                                    );
                                } else {
                                    toast.error('Error al actualizar verificación');
                                }
                            });
                        },
                    } as MenuItemDef,
                ]
                : []),
            /* L7.6: Quitar sample de la relacion de sampleo (solo si fue adjuntado manualmente) */
            ...(puedeEditar && estado.sample?.metadata?.relacion_id && estado.sample?.metadata?.adjuncion_manual
                ? [
                    {
                        id: 'quitar-sampleo',
                        etiqueta: 'Quitar de este sampleo',
                        peligro: true,
                        onClick: () => {
                            if (!estado.sample?.metadata?.relacion_id || !estado.sample?.metadata?.lado_extraccion) return;
                            const s = estado.sample;
                            const relacionId = Number(s.metadata!.relacion_id);
                            const lado = String(s.metadata!.lado_extraccion) as 'fuente' | 'destino';
                            toast.confirmar(
                                `¿Quitar "${s.titulo}" de esta relacion de sampleo?`,
                                async () => {
                                    const resp = await desvincularSample(relacionId, lado);
                                    if (resp.ok) {
                                        toast.exito('Sample desvinculado de la relacion');
                                        window.dispatchEvent(
                                            new CustomEvent(EVENTO_SAMPLE_ACTUALIZADO, {
                                                detail: { sampleId: s.id, cambios: { metadata: { ...s.metadata, relacion_id: null, lado_extraccion: null, adjuncion_manual: null } } },
                                            })
                                        );
                                    } else {
                                        toast.error(resp.error ?? 'Error al desvincular');
                                    }
                                }
                            );
                        },
                        separadorDespues: true,
                    } as MenuItemDef,
                ]
                : []),
            {
                id: 'inspeccionar',
                etiqueta: 'Inspeccionar datos',
                onClick: () => {
                    if (estado.sample) setSampleInspeccion(estado.sample);
                },
            },
            ...(puedeEliminar
                ? [
                    {
                        id: 'eliminar',
                        etiqueta: 'Eliminar sample',
                        peligro: true,
                        separadorAntes: true,
                        onClick: () => {
                            if (!estado.sample) return;
                            const sampleAEliminar = estado.sample;
                            toast.confirmar(
                                `¿Eliminar "${sampleAEliminar.titulo}"?`,
                                async () => {
                                    /* Optimista: remover en tiempo real antes de la respuesta API */
                                    window.dispatchEvent(
                                        new CustomEvent(EVENTO_SAMPLE_ELIMINADO, {
                                            detail: { sampleId: sampleAEliminar.id },
                                        })
                                    );

                                    const resp = await eliminarSample(sampleAEliminar.id);
                                    if (resp.ok) {
                                        toast.exito('Sample eliminado');
                                    } else {
                                        /* Rollback si falla en backend */
                                        window.dispatchEvent(
                                            new CustomEvent(EVENTO_SAMPLE_RESTAURADO, {
                                                detail: { sample: sampleAEliminar },
                                            })
                                        );
                                        toast.error('Error al eliminar el sample');
                                    }
                                }
                            );
                        },
                    } as MenuItemDef,
                ]
                : []),
            {
                id: 'reportar',
                etiqueta: 'Reportar',
                peligro: true,
                onClick: () => {
                    if (!estado.sample) return;
                    useReportarStore.getState().abrir('sample', estado.sample.id, estado.sample.titulo);
                },
            },
        ]
        : [];

    return { estado, items, abrirMenu, cerrarMenu, sampleInspeccion, cerrarInspeccion };
};
