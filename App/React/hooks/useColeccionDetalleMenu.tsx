/*
 * useColeccionDetalleMenu — Menú contextual de la colección.
 * Extraído de useColeccionDetalle para cumplir SRP y límite de líneas.
 */

import { useState, useCallback, useMemo } from 'react';
import { Link2, Trash2, Flag, Edit3 } from 'lucide-react';
import { toast } from '@app/stores/toastStore';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import type { Coleccion } from '@app/types';
import type { UsuarioAutenticado } from '@app/types';

interface UseColeccionDetalleMenuParams {
    coleccion: Coleccion | null;
    usuario: UsuarioAutenticado | null;
    navegar: (ruta: string) => void;
    setModalEditarAbierto: (v: boolean) => void;
}

export function useColeccionDetalleMenu({
    coleccion,
    usuario,
    navegar,
    setModalEditarAbierto,
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
                separadorDespues: true,
                onClick: () => {
                    cerrarMenuColeccion();
                    setModalEditarAbierto(true);
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
                    toast.confirmar('¿Eliminar esta colección?', async () => {
                        const { apiDelete } = await import('@app/services/apiCliente');
                        const resp = await apiDelete(`/colecciones/${coleccion.id}`);
                        if (resp.ok) {
                            toast.exito('Colección eliminada');
                            navegar('/libreria/');
                        }
                    });
                    cerrarMenuColeccion();
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
    }, [coleccion, usuario, navegar, cerrarMenuColeccion, setModalEditarAbierto]);

    return {
        menuColeccion,
        abrirMenuColeccion,
        cerrarMenuColeccion,
        itemsMenuColeccion,
    };
}
