/*
 * useColeccionDetalleMenu — Menú contextual de la colección.
 * Extraído de useColeccionDetalle para cumplir SRP y límite de líneas.
 */

import { useState, useCallback, useMemo } from 'react';
import { Link2, Trash2, Flag, Edit3, Combine, Gift } from 'lucide-react';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { generarCodigo } from '@app/services/apiCodigosGratis';
import { toast } from '@app/stores/toastStore';
import type { Coleccion } from '@app/types';
import type { UsuarioAutenticado } from '@app/types';

interface UseColeccionDetalleMenuParams {
    coleccion: Coleccion | null;
    usuario: UsuarioAutenticado | null;
    navegar: (ruta: string) => void;
    setModalEditarAbierto: (v: boolean) => void;
    setModalCombinarAbierto?: (v: boolean) => void;
    setModalEliminarAbierto?: (v: boolean) => void;
}

export function useColeccionDetalleMenu({
    coleccion,
    usuario,
    navegar,
    setModalEditarAbierto,
    setModalCombinarAbierto,
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

        items.push({
            id: 'copiar-enlace',
            etiqueta: 'Copiar enlace',
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
                etiqueta: 'Editar colección',
                icono: <Edit3 size={16} />,
                onClick: () => {
                    cerrarMenuColeccion();
                    setModalEditarAbierto(true);
                },
            });

            items.push({
                id: 'combinar',
                etiqueta: 'Combinar colecciones',
                icono: <Combine size={16} />,
                separadorDespues: true,
                onClick: () => {
                    cerrarMenuColeccion();
                    setModalCombinarAbierto?.(true);
                },
            });
        }

        if (esPropietario || esAdmin) {
            items.push({
                id: 'eliminar',
                etiqueta: 'Eliminar colección',
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
                etiqueta: 'Compartir gratis',
                icono: <Gift size={16} />,
                separadorDespues: true,
                onClick: async () => {
                    cerrarMenuColeccion();
                    const resp = await generarCodigo('coleccion', coleccion.id);
                    if (resp.ok && resp.data?.codigo) {
                        const slug = coleccion.slug ?? coleccion.id;
                        const url = `${window.location.origin}/coleccion/${slug}/?codigoGratis=${resp.data.codigo}`;
                        copiarAlPortapapeles(url);
                        toast.exito('Enlace de descarga gratis copiado al portapapeles');
                    } else {
                        toast.error('Error al generar enlace de descarga gratis');
                    }
                },
            });
        }

        items.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: <Flag size={16} />,
            onClick: () => { cerrarMenuColeccion(); },
        });

        return items;
    }, [coleccion, usuario, navegar, cerrarMenuColeccion, setModalEditarAbierto, setModalCombinarAbierto, setModalEliminarAbierto]);

    return {
        menuColeccion,
        abrirMenuColeccion,
        cerrarMenuColeccion,
        itemsMenuColeccion,
    };
}
