/*
 * Hook: useComentarioItem
 * Lógica de un comentario individual: menú contextual, edición inline,
 * respuestas, toggle visibilidad de respuestas.
 * Extraído de ComentarioItem para cumplir SRP (max 3 useState).
 */

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { Edit3, Trash2, Flag } from 'lucide-react';
import { useAuthStore } from '@app/stores/authStore';
import { useReportarStore } from '@app/stores/reportarStore';
import { getT } from '@app/utils/i18n';
import type { Comentario } from '@app/types/publicacion';
import type { ComentarioAcciones } from '@app/components/social/ComentarioItem';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';

interface UseComentarioItemParams {
    comentario: Comentario;
    acciones?: ComentarioAcciones;
    nivel?: number;
}

export const useComentarioItem = ({ comentario, acciones, nivel = 0 }: UseComentarioItemParams) => {
    const usuario = useAuthStore(s => s.usuario);
    const [menuPos, setMenuPos] = useState({ abierto: false, x: 0, y: 0 });
    const [textoEdicion, setTextoEdicion] = useState('');
    const [textoRespuesta, setTextoRespuesta] = useState('');
    const [respuestasVisibles, setRespuestasVisibles] = useState(false);
    const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

    const inputRespuestaRef = useRef<HTMLInputElement>(null);
    const inputEdicionRef = useRef<HTMLInputElement>(null);

    const esAutor = usuario?.id === comentario.autor?.id;
    const esAdmin = usuario?.rol === 'admin';
    const editando = acciones?.editandoId === comentario.id;
    const respondiendo = acciones?.respondendoAId === comentario.id;
    const tieneRespuestas = (comentario.totalRespuestas ?? 0) > 0;

    /* Menú contextual */
    const abrirMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenu = useCallback(() => {
        setMenuPos(prev => ({ ...prev, abierto: false }));
    }, []);

    /* Items del menú según permisos */
    const t = getT();
    const menuItems: MenuItemDef[] = [];
    if (esAutor && acciones?.onEditar) {
        menuItems.push({
            id: 'editar', etiqueta: t('comun.editar'), icono: <Edit3 size={14} />,
            onClick: () => { setTextoEdicion(comentario.contenido ?? ''); acciones.setEditandoId?.(comentario.id); },
        });
    }
    if ((esAutor || esAdmin) && acciones?.onEliminar) {
        menuItems.push({
            id: 'eliminar', etiqueta: t('comun.eliminar'), icono: <Trash2 size={14} />, peligro: true,
            onClick: () => { acciones.onEliminar!(comentario.id); },
        });
    }
    if (!esAutor) {
        menuItems.push({
            id: 'reportar', etiqueta: t('comun.reportar'), icono: <Flag size={14} />, peligro: true,
            onClick: () => {
                useReportarStore.getState().abrir('comentario', comentario.id);
            },
        });
    }

    /* Respuestas */
    const iniciarRespuesta = useCallback(() => {
        acciones?.setRespondendoAId?.(comentario.id);
        setTextoRespuesta('');
        setTimeout(() => inputRespuestaRef.current?.focus(), 50);
    }, [acciones, comentario.id]);

    /* [183A-100] Respuestas a nivel >= 2 se aplanan bajo el padre del comentario
     * en vez de crear un nivel extra de anidamiento. */
    const enviarRespuesta = useCallback(async () => {
        const texto = textoRespuesta.trim();
        if (!texto || !acciones?.onResponder) return;
        setEnviandoRespuesta(true);
        const parentIdEfectivo = nivel >= 2 ? (comentario.parentId ?? comentario.id) : comentario.id;
        const ok = await acciones.onResponder(texto, parentIdEfectivo);
        setEnviandoRespuesta(false);
        if (ok) { setTextoRespuesta(''); setRespuestasVisibles(true); }
    }, [textoRespuesta, acciones, comentario.id, comentario.parentId, nivel]);

    /* Edición */
    const confirmarEdicion = useCallback(async () => {
        const texto = textoEdicion.trim();
        if (!texto || !acciones?.onEditar) return;
        await acciones.onEditar(comentario.id, texto);
    }, [textoEdicion, acciones, comentario.id]);

    /* Toggle respuestas */
    const toggleRespuestas = useCallback(() => {
        if (!respuestasVisibles && (!comentario.respuestas || comentario.respuestas.length === 0)) {
            acciones?.onCargarRespuestas?.(comentario.id);
        }
        setRespuestasVisibles(prev => !prev);
    }, [respuestasVisibles, comentario, acciones]);

    const manejarKeyEdicion = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmarEdicion(); }
        if (e.key === 'Escape') { acciones?.setEditandoId?.(null); }
    }, [confirmarEdicion, acciones]);

    const manejarKeyRespuesta = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarRespuesta(); }
        if (e.key === 'Escape') { acciones?.setRespondendoAId?.(null); }
    }, [enviarRespuesta, acciones]);

    return {
        menuPos, menuItems, abrirMenu, cerrarMenu,
        textoEdicion, setTextoEdicion, textoRespuesta, setTextoRespuesta,
        respuestasVisibles, enviandoRespuesta,
        inputRespuestaRef, inputEdicionRef,
        esAutor, editando, respondiendo, tieneRespuestas,
        iniciarRespuesta, enviarRespuesta, confirmarEdicion,
        toggleRespuestas, manejarKeyEdicion, manejarKeyRespuesta,
    };
};
