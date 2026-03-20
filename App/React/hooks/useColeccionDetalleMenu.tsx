/*
 * useColeccionDetalleMenu — Menú contextual de la colección.
 * Extraído de useColeccionDetalle para cumplir SRP y límite de líneas.
 */

import { useState, useCallback, useMemo } from 'react';
import { Link2, Trash2, Flag, Edit3, Combine, Gift, ShieldOff, Plus } from 'lucide-react';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { generarCodigo, invalidarCodigo } from '@app/services/apiCodigosGratis';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import type { Coleccion } from '@app/types';
import type { UsuarioAutenticado } from '@app/types';

interface UseColeccionDetalleMenuParams {
    coleccion: Coleccion | null;
    usuario: UsuarioAutenticado | null;
    navegar: (ruta: string) => void;
    setModalEditarAbierto: (v: boolean) => void;
    setModalCombinarAbierto?: (v: boolean) => void;
    setModalVolumenAbierto?: (v: boolean) => void;
    setModalEliminarAbierto?: (v: boolean) => void;
}

export function useColeccionDetalleMenu({
    coleccion,
    usuario,
    navegar,
    setModalEditarAbierto,
    setModalCombinarAbierto,
    setModalVolumenAbierto,
    setModalEliminarAbierto,
}: UseColeccionDetalleMenuParams) {
    const [menuColeccion, setMenuColeccion] = useState<{ abierto: boolean; x: number; y: number }>({
        abierto: false, x: 0, y: 0,
    });

    const abrirMenuColeccion = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuColeccion({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenuColeccion = useCallback(() => {
        setMenuColeccion(prev => ({ ...prev, abierto: false }));
    }, []);

    const itemsMenuColeccion = useMemo(() => {
        if (!coleccion) return [];
        const esPropietario = usuario?.id !== undefined && String(coleccion.usuarioId) === String(usuario.id);
        const esAdmin = usuario?.rol === 'admin';
        const items: { id: string; etiqueta: string; icono: JSX.Element; onClick: () => void; peligro?: boolean; separadorDespues?: boolean }[] = [];

        const t = getT();
        items.push({
            id: 'copiar-enlace',
            etiqueta: t('comun.copiarEnlace'),
            icono: <Link2 size={16} />,
            separadorDespues: true,
            onClick: () => {
                copiarAlPortapapeles(`${window.location.origin}/coleccion/${coleccion.slug ?? coleccion.id}/`);
                cerrarMenuColeccion();
            },
        });

        if (esPropietario || esAdmin) {
            items.push({
                id: 'editar',
                etiqueta: t('menu.editarColeccion'),
                icono: <Edit3 size={16} />,
                onClick: () => {
                    cerrarMenuColeccion();
                    setModalEditarAbierto(true);
                },
            });

            items.push({
                id: 'combinar',
                etiqueta: t('menu.combinarColecciones'),
                icono: <Combine size={16} />,
                onClick: () => {
                    cerrarMenuColeccion();
                    setModalCombinarAbierto?.(true);
                },
            });

            if (coleccion.parentId === null) {
                items.push({
                    id: 'crear-volumen',
                    etiqueta: t('menu.crearVolumen'),
                    icono: <Plus size={16} />,
                    separadorDespues: true,
                    onClick: () => {
                        cerrarMenuColeccion();
                        setModalVolumenAbierto?.(true);
                    },
                });
            } else {
                items[items.length - 1].separadorDespues = true;
            }
        }

        if (esPropietario || esAdmin) {
            items.push({
                id: 'eliminar',
                etiqueta: t('coleccion.menu.eliminar'),
                icono: <Trash2 size={16} />,
                peligro: true,
                onClick: () => {
                    cerrarMenuColeccion();
                    setModalEliminarAbierto?.(true);
                },
            });
        }

        /* [183A-106] Admin: generar enlace de descarga gratis para la coleccion entera */
        if (esAdmin) {
            items.push({
                id: 'compartir-gratis',
                etiqueta: t('menu.compartirGratis'),
                icono: <Gift size={16} />,
                onClick: async () => {
                    cerrarMenuColeccion();
                    const resp = await generarCodigo('coleccion', coleccion.id);
                    if (resp.ok && resp.data?.codigo) {
                        const slug = coleccion.slug ?? coleccion.id;
                        const url = `${window.location.origin}/coleccion/${slug}/?codigoGratis=${resp.data.codigo}`;
                        copiarAlPortapapeles(url);
                        toast.exito('Enlace de descarga gratis copiado al portapapeles');
                    } else {
                        toast.error(getT()('error.enlaceDescargaGratis'));
                    }
                },
            });

            /* [183A-110] Admin: invalidar todos los codigos activos de esta coleccion */
            items.push({
                id: 'invalidar-enlace',
                etiqueta: t('menu.invalidarEnlaceGratis'),
                icono: <ShieldOff size={16} />,
                separadorDespues: true,
                onClick: () => {
                    cerrarMenuColeccion();
                    toast.confirmar('¿Invalidar todos los enlaces de descarga gratis de esta colección?', async () => {
                        const resp = await invalidarCodigo('coleccion', coleccion.id);
                        if (resp.ok) {
                            const n = resp.data?.invalidados ?? 0;
                            toast.exito(n > 0 ? `${n} enlace(s) invalidado(s)` : 'No había enlaces activos');
                        } else {
                            toast.error(getT()('error.invalidarEnlace'));
                        }
                    });
                },
            });
        }

        items.push({
            id: 'reportar',
            etiqueta: t('comun.reportar'),
            icono: <Flag size={16} />,
            onClick: () => { cerrarMenuColeccion(); },
        });

        return items;
    }, [coleccion, usuario, navegar, cerrarMenuColeccion, setModalEditarAbierto, setModalCombinarAbierto, setModalVolumenAbierto, setModalEliminarAbierto]);

    return {
        menuColeccion,
        abrirMenuColeccion,
        cerrarMenuColeccion,
        itemsMenuColeccion,
    };
}
