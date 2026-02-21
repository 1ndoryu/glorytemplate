/*
 * Hook: useComentarioItem
 * Lógica de un comentario individual: menú contextual, edición inline,
 * respuestas, toggle visibilidad de respuestas.
 * Extraído de ComentarioItem para cumplir SRP (max 3 useState).
 */

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { Edit3, Trash2, Flag } from 'lucide-react';
import { useAuthStore } from '@app/stores/authStore';
import type { Comentario } from '@app/types/publicacion';
import type { ComentarioAcciones } from '@app/components/social/ComentarioItem';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';

interface UseComentarioItemParams {
    comentario: Comentario;
    acciones?: ComentarioAcciones;
}

export const useComentarioItem = ({ comentario, acciones }: UseComentarioItemParams) => {
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
    const menuItems: MenuItemDef[] = [];
    if (esAutor && acciones?.onEditar) {
        menuItems.push({
            id: 'editar', etiqueta: 'Editar', icono: <Edit3 size={14} />,
            onClick: () => { setTextoEdicion(comentario.contenido ?? ''); acciones.setEditandoId?.(comentario.id); },
        });
    }
    if ((esAutor || esAdmin) && acciones?.onEliminar) {
        menuItems.push({
            id: 'eliminar', etiqueta: 'Eliminar', icono: <Trash2 size={14} />, peligro: true,
            onClick: () => { acciones.onEliminar!(comentario.id); },
        });
    }
    if (!esAutor && acciones?.onReportar) {
        menuItems.push({
            id: 'reportar', etiqueta: 'Reportar', icono: <Flag size={14} />, peligro: true,
            onClick: () => { acciones.onReportar!(comentario.id, 'contenido inapropiado'); },
        });
    }

    /* Respuestas */
    const iniciarRespuesta = useCallback(() => {
        acciones?.setRespondendoAId?.(comentario.id);
        setTextoRespuesta('');
        setTimeout(() => inputRespuestaRef.current?.focus(), 50);
    }, [acciones, comentario.id]);

    const enviarRespuesta = useCallback(async () => {
        const texto = textoRespuesta.trim();
        if (!texto || !acciones?.onResponder) return;
        setEnviandoRespuesta(true);
        const ok = await acciones.onResponder(texto, comentario.id);
        setEnviandoRespuesta(false);
        if (ok) { setTextoRespuesta(''); setRespuestasVisibles(true); }
    }, [textoRespuesta, acciones, comentario.id]);

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
