/*
 * Hook: useMenuContextualPublicacion — Kamples (C322)
 * Gestiona el menú contextual para publicaciones del feed social.
 * Reutilizable en ComunidadIsland, PerfilIsland y cualquier lista de publicaciones.
 * Acciones: ver post, copiar enlace, editar, aprobar, eliminar, reportar.
 */

import { useState, useCallback, useMemo, type MouseEvent, type Dispatch, type SetStateAction } from 'react';
import { User, Link2, Trash2, Flag, CheckCircle, Pencil } from 'lucide-react';
import { useReportarStore } from '@app/stores/reportarStore';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import type { Publicacion } from '@app/types';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { actualizarPublicacion, eliminarPublicacion } from '@app/services/apiSocial';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

import { useEditarModalStore } from '@app/stores/editarModalStore';

/* Eventos globales para notificar cambios de publicaciones sin recargar */
export const EVENTO_PUBLICACION_ELIMINADA = 'kamples:publicacion-eliminada';
export const EVENTO_PUBLICACION_ACTUALIZADA = 'kamples:publicacion-actualizada';

interface EstadoMenuPublicacion {
    abierto: boolean;
    x: number;
    y: number;
    post: Publicacion | null;
}

interface RetornoMenuPublicacion {
    estado: EstadoMenuPublicacion;
    items: MenuItemDef[];
    abrirMenu: (e: MouseEvent, post: Publicacion) => void;
    cerrarMenu: () => void;
}

interface OpcionesMenuPublicacion {
    /**
     * Setter para actualizar la lista de publicaciones localmente tras editar/eliminar/aprobar.
     * Si se proporciona, las acciones actualizan el estado local directamente.
     * Si no, se emiten eventos globales.
     */
    setPublicaciones?: Dispatch<SetStateAction<Publicacion[]>>;
}

export const useMenuContextualPublicacion = (
    opciones: OpcionesMenuPublicacion = {}
): RetornoMenuPublicacion => {
    const { setPublicaciones } = opciones;

    const [estado, setEstado] = useState<EstadoMenuPublicacion>({
        abierto: false, x: 0, y: 0, post: null,
    });

    const navegar = useNavigationStore(s => s.navegar);
    const usuario = useAuthStore(s => s.usuario);

    const abrirMenu = useCallback((e: MouseEvent, post: Publicacion) => {
        e.preventDefault();
        e.stopPropagation();
        setEstado({ abierto: true, x: e.clientX, y: e.clientY, post });
    }, []);

    const cerrarMenu = useCallback(() => {
        setEstado(prev => ({ ...prev, abierto: false }));
    }, []);

    const items = useMemo((): MenuItemDef[] => {
        const post = estado.post;
        if (!post) return [];

        const esPropietario = usuario?.id !== undefined && String(post.autor.id) === String(usuario.id);
        const esAdmin = usuario?.rol === 'admin';
        const puedeEditar = esPropietario || esAdmin;
        const result: MenuItemDef[] = [];

        const t = getT();
        /* Ir al perfil del autor */
        result.push({
            id: 'ver-perfil',
            etiqueta: t('menu.irAPerfil', { username: post.autor.username }),
            icono: <User size={16} />,
            href: `/perfil/${post.autor.username}/`,
            onClick: () => { navegar(`/perfil/${post.autor.username}/`); },
        });

        /* Copiar enlace */
        result.push({
            id: 'copiar-enlace',
            etiqueta: t('comun.copiarEnlace'),
            icono: <Link2 size={16} />,
            separadorDespues: true,
            onClick: () => {
                copiarAlPortapapeles(`${window.location.origin}/comunidad/?post=${post.id}`);
                toast.exito('Enlace copiado');
            },
        });

        /* Editar publicación (solo autor o admin) */
        if (puedeEditar) {
            result.push({
                id: 'editar',
                etiqueta: post.tipo === 'sample' ? t('menu.editarSample') : t('menu.editarPublicacion'),
                icono: <Pencil size={16} />,
                onClick: () => {
                    if (post.tipo === 'sample' && post.samplesAdjuntos?.[0]) {
                        useEditarModalStore.getState().abrirSample(post.samplesAdjuntos[0]);
                    } else {
                        useEditarModalStore.getState().abrirPublicacion(post);
                    }
                },
            });
        }

        /* Aprobar publicación (solo admin, si no está aprobada) */
        if (esAdmin && post.moderacionEstado && post.moderacionEstado !== 'aprobado') {
            result.push({
                id: 'aprobar',
                etiqueta: t('menu.aprobarPublicacion'),
                icono: <CheckCircle size={16} />,
                onClick: async () => {
                    try {
                        const resp = await actualizarPublicacion(post.id, { moderacionEstado: 'aprobado' });
                        if (resp.ok) {
                            toast.exito('Publicación aprobada');
                            if (setPublicaciones) {
                                setPublicaciones(prev => prev.map(p =>
                                    p.id === post.id ? { ...p, moderacionEstado: 'aprobado' } : p
                                ));
                            }
                            window.dispatchEvent(new CustomEvent(EVENTO_PUBLICACION_ACTUALIZADA, {
                                detail: { publicacionId: post.id, cambios: { moderacionEstado: 'aprobado' } },
                            }));
                        } else {
                            toast.error(getT()('error.aprobar'));
                        }
                    } catch (err) {
                        toast.error(getT()('error.aprobarRed'));
                    }
                },
            });
        }

        /* Eliminar publicación (autor o admin) */
        if (puedeEditar) {
            result.push({
                id: 'eliminar',
                etiqueta: t('menu.eliminarPublicacion'),
                icono: <Trash2 size={16} />,
                peligro: true,
                separadorDespues: !esPropietario,
                onClick: () => {
                    toast.confirmar('¿Eliminar esta publicación?', () => {
                        /* F13: Eliminación optimista — quitar de UI inmediatamente */
                        if (setPublicaciones) {
                            setPublicaciones(prev => prev.filter(p => p.id !== post.id));
                        }
                        window.dispatchEvent(new CustomEvent(EVENTO_PUBLICACION_ELIMINADA, {
                            detail: { publicacionId: post.id },
                        }));

                        /* API call en background con rollback si falla */
                        eliminarPublicacion(post.id).then(resp => {
                            if (!resp.ok) {
                                toast.error(getT()('error.eliminar'));
                                if (setPublicaciones) {
                                    setPublicaciones(prev => [...prev, post]);
                                }
                            }
                        }).catch(() => {
                            toast.error(getT()('error.eliminarRed'));
                            if (setPublicaciones) {
                                setPublicaciones(prev => [...prev, post]);
                            }
                        });
                    });
                },
            });
        }

        /* Reportar (cualquier usuario que no sea el autor) */
        if (!esPropietario && usuario) {
            result.push({
                id: 'reportar',
                etiqueta: t('comun.reportar'),
                icono: <Flag size={16} />,
                peligro: true,
                onClick: () => {
                    useReportarStore.getState().abrir('publicacion', post.id);
                },
            });
        }

        return result;
    }, [estado.post, usuario, navegar, setPublicaciones]);

    return { estado, items, abrirMenu, cerrarMenu };
};
