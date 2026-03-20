/*
 * Hook: useTarjetaColeccion
 * Centraliza preview, menú contextual y guardado optimista de TarjetaColeccion.
 * [183A-15] Extiende el bookmark de detalle a la tarjeta sin convertir el componente en un orquestador grande.
 */

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Edit3, Trash2, Link2, Combine, Flag } from 'lucide-react';
import type { Coleccion } from '@app/types';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { guardarColeccionBookmark, desguardarColeccionBookmark, toggleLikeColeccion } from '@app/services/apiColecciones';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useAuthStore } from '@app/stores/authStore';
import { useColeccionPreview } from '@app/hooks/useColeccionPreview';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
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
    const t = getT();
    const usuario = useAuthStore(s => s.usuario);
    const [menu, setMenu] = useState<{ abierto: boolean; x: number; y: number }>({
        abierto: false, x: 0, y: 0,
    });
    const [guardada, setGuardada] = useState(Boolean(coleccion.estaGuardada));
    const [guardando, setGuardando] = useState(false);
    /* [183A-22] Like de colección (distinto al bookmark) */
    const [likeada, setLikeada] = useState(Boolean(coleccion.estaLikeada));
    const [likeando, setLikeando] = useState(false);
    const { iniciarPreview, cargando } = useColeccionPreview();
    const coleccionPreviewId = useReproductorStore(s => s.coleccionPreviewId);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const esPreviewActiva = coleccionPreviewId === coleccion.id && reproduciendo;
    const esPropia = usuario?.id !== undefined && String(coleccion.usuarioId) === String(usuario.id);

    useEffect(() => {
        setGuardada(Boolean(coleccion.estaGuardada));
    }, [coleccion.estaGuardada]);

    useEffect(() => {
        setLikeada(Boolean(coleccion.estaLikeada));
    }, [coleccion.estaLikeada]);

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

    /* [183A-22] Toggle like con rollback optimitsta */
    const manejarToggleLike = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();

        if (!requiereAuth() || likeando || esPropia) return;

        const valorAnterior = likeada;
        setLikeando(true);
        setLikeada(!valorAnterior);

        const resp = await toggleLikeColeccion(coleccion.id);

        if (!resp.ok) {
            setLikeada(valorAnterior);
            toast.error(getT()('error.likeTarjetaColeccion'));
        } else if (resp.data) {
            setLikeada(resp.data.likeada);
        }

        setLikeando(false);
    }, [coleccion.id, esPropia, likeada, likeando]);

    const itemsMenu = useMemo(() => {
        const items = [
            {
                id: 'copiar-enlace',
                etiqueta: t('coleccion.menu.copiarEnlace'),
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
                etiqueta: t('coleccion.menu.editar'),
                icono: <Edit3 size={16} />,
                separadorDespues: false,
                onClick: () => onEditar(coleccion),
            });
        }

        if (onCombinar) {
            items.push({
                id: 'combinar',
                etiqueta: t('coleccion.menu.combinar'),
                icono: <Combine size={16} />,
                separadorDespues: false,
                onClick: () => onCombinar(coleccion),
            } as typeof items[0]);
        }

        if (onEliminar) {
            items.push({
                id: 'eliminar',
                etiqueta: t('coleccion.menu.eliminar'),
                icono: <Trash2 size={16} />,
                separadorDespues: false,
                onClick: () => onEliminar(coleccion),
            } as typeof items[0]);
        }

        items.push({
            id: 'reportar',
            etiqueta: t('seleccionMultiple.reportar'),
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
        likeada,
        likeando,
        esPreviewActiva,
        esPropia,
        cargandoPreview: cargando,
        manejarPreview,
        abrirMenu,
        cerrarMenu,
        manejarToggleGuardada,
        manejarToggleLike,
        itemsMenu,
    };
}