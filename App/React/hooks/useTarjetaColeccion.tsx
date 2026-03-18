/*
 * Hook: useTarjetaColeccion
 * Centraliza preview, menú contextual y guardado optimista de TarjetaColeccion.
 * [183A-15] Extiende el bookmark de detalle a la tarjeta sin convertir el componente en un orquestador grande.
 */

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Edit3, Trash2, Link2, Combine, Flag } from 'lucide-react';
import type { Coleccion } from '@app/types';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { guardarColeccionBookmark, desguardarColeccionBookmark } from '@app/services/apiColecciones';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useAuthStore } from '@app/stores/authStore';
import { useColeccionPreview } from '@app/hooks/useColeccionPreview';
import { toast } from '@app/stores/toastStore';
import { requiereAuth } from '@app/utils/requiereAuth';

interface UseTarjetaColeccionOpciones {
    coleccion: Coleccion;
    onEditar?: (coleccion: Coleccion) => void;
    onCombinar?: (coleccion: Coleccion) => void;
    onEliminar?: (coleccion: Coleccion) => void;
}

export function useTarjetaColeccion({
    coleccion,
    onEditar,
    onCombinar,
    onEliminar,
}: UseTarjetaColeccionOpciones) {
    const usuario = useAuthStore(s => s.usuario);
    const [menu, setMenu] = useState<{ abierto: boolean; x: number; y: number }>({
        abierto: false, x: 0, y: 0,
    });
    const [guardada, setGuardada] = useState(Boolean(coleccion.estaGuardada));
    const [guardando, setGuardando] = useState(false);
    const { iniciarPreview, cargando } = useColeccionPreview();
    const coleccionPreviewId = useReproductorStore(s => s.coleccionPreviewId);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const esPreviewActiva = coleccionPreviewId === coleccion.id && reproduciendo;
    const esPropia = usuario?.id !== undefined && String(coleccion.usuarioId) === String(usuario.id);

    useEffect(() => {
        setGuardada(Boolean(coleccion.estaGuardada));
    }, [coleccion.estaGuardada]);

    const manejarPreview = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        iniciarPreview(coleccion.id);
    }, [iniciarPreview, coleccion.id]);

    const abrirMenu = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setMenu({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenu = useCallback(() => {
        setMenu(prev => ({ ...prev, abierto: false }));
    }, []);

    const manejarToggleGuardada = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();

        if (!requiereAuth() || guardando || esPropia) return;

        const valorAnterior = guardada;
        setGuardando(true);
        setGuardada(!valorAnterior);

        const resp = valorAnterior
            ? await desguardarColeccionBookmark(coleccion.id)
            : await guardarColeccionBookmark(coleccion.id);

        if (!resp.ok) {
            setGuardada(valorAnterior);
            toast.error(valorAnterior ? 'Error al quitar de guardadas' : 'Error al guardar colección');
        }

        setGuardando(false);
    }, [coleccion.id, esPropia, guardada, guardando]);

    const itemsMenu = useMemo(() => {
        const items = [
            {
                id: 'copiar-enlace',
                etiqueta: 'Copiar enlace',
                icono: <Link2 size={16} />,
                separadorDespues: true,
                onClick: () => {
                    copiarAlPortapapeles(`${window.location.origin}/coleccion/${coleccion.slug ?? coleccion.id}/`);
                },
            },
        ];

        if (onEditar) {
            items.push({
                id: 'editar',
                etiqueta: 'Editar colección',
                icono: <Edit3 size={16} />,
                separadorDespues: false,
                onClick: () => onEditar(coleccion),
            });
        }

        if (onCombinar) {
            items.push({
                id: 'combinar',
                etiqueta: 'Combinar colecciones',
                icono: <Combine size={16} />,
                separadorDespues: false,
                onClick: () => onCombinar(coleccion),
            } as typeof items[0]);
        }

        if (onEliminar) {
            items.push({
                id: 'eliminar',
                etiqueta: 'Eliminar colección',
                icono: <Trash2 size={16} />,
                separadorDespues: false,
                onClick: () => onEliminar(coleccion),
            } as typeof items[0]);
        }

        items.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: <Flag size={16} />,
            separadorDespues: false,
            onClick: () => undefined,
        } as typeof items[0]);

        return items;
    }, [coleccion, onEditar, onCombinar, onEliminar]);

    return {
        menu,
        guardada,
        guardando,
        esPreviewActiva,
        esPropia,
        cargandoPreview: cargando,
        manejarPreview,
        abrirMenu,
        cerrarMenu,
        manejarToggleGuardada,
        itemsMenu,
    };
}