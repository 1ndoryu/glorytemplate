/*
 * Hook: useComentarios — Kamples
 * Gestiona fetch, paginación, creación y acciones de comentarios.
 * C264: Editar, eliminar, reportar. C265: Likes, respuestas (threading).
 * Excede 120 líneas por la cantidad de acciones compartidas; split no viable.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    obtenerComentarios, crearComentario, crearComentarioMultimedia,
    editarComentario, eliminarComentario, reportarComentario,
    darLikeComentario, quitarLikeComentario, obtenerRespuestas,
} from '@app/services/apiSocial';
import { wsService } from '@app/services/wsService';
import { useAuthStore } from '@app/stores/authStore';
import { crearLogger } from '@app/services/logger';
import type { Comentario } from '@app/types';
import type { TipoComentable } from '@app/services/apiSocial';

const log = crearLogger('useComentarios');
export const EVENTO_SAMPLE_COMENTADO = 'kamples:sample-comentado';

interface UseComentariosOpciones {
    tipo: TipoComentable;
    targetId: number;
    cargarAlAbrir?: boolean;
}

/* Helpers recursivos para actualizar comentarios anidados */
const actualizarEnLista = (
    lista: Comentario[],
    id: number,
    fn: (c: Comentario) => Comentario
): Comentario[] =>
    lista.map(c =>
        c.id === id
            ? fn(c)
            : { ...c, respuestas: c.respuestas ? actualizarEnLista(c.respuestas, id, fn) : undefined }
    );

const filtrarDeLista = (lista: Comentario[], id: number): Comentario[] =>
    lista.filter(c => c.id !== id).map(c => ({
        ...c,
        respuestas: c.respuestas ? filtrarDeLista(c.respuestas, id) : undefined,
        totalRespuestas: c.respuestas?.some(r => r.id === id)
            ? Math.max(0, (c.totalRespuestas ?? 0) - 1)
            : c.totalRespuestas,
    }));

export const useComentarios = ({ tipo, targetId, cargarAlAbrir = false }: UseComentariosOpciones) => {
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [cargando, setCargando] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [hayMas, setHayMas] = useState(true);
    const [abierto, setAbierto] = useState(false);
    const [respondendoAId, setRespondendoAId] = useState<number | null>(null);
    const [editandoId, setEditandoId] = useState<number | null>(null);

    const cargar = useCallback(async (pag = 1) => {
        setCargando(true);
        try {
            const resp = await obtenerComentarios(tipo, targetId, pag);
            if (resp.ok && resp.data) {
                const datos = Array.isArray(resp.data) ? resp.data : [];
                if (pag === 1) setComentarios(datos);
                else setComentarios(prev => [...prev, ...datos]);
                setHayMas(datos.length >= 20);
                setPagina(pag);
            }
        } catch (err) {
            log.error('Error cargando comentarios', err);
        } finally {
            setCargando(false);
        }
    }, [tipo, targetId]);

    /* Enviar nuevo comentario (o respuesta si se pasa parentId) */
    const enviar = useCallback(async (contenido: string, parentId?: number) => {
        try {
            const resp = await crearComentario(tipo, targetId, contenido, parentId);
            if (resp.ok && resp.data) {
                const nuevo = resp.data as Comentario;
                if (parentId) {
                    setComentarios(prev => actualizarEnLista(prev, parentId, c => ({
                        ...c,
                        totalRespuestas: (c.totalRespuestas ?? 0) + 1,
                        respuestas: [...(c.respuestas ?? []), nuevo],
                    })));
                } else {
                    setComentarios(prev => [...prev, nuevo]);
                }
                if (tipo === 'sample') {
                    window.dispatchEvent(new CustomEvent(EVENTO_SAMPLE_COMENTADO, { detail: { sampleId: targetId } }));
                }
                setRespondendoAId(null);
                return true;
            }
            return false;
        } catch (err) {
            log.error('Error enviando comentario', err);
            return false;
        }
    }, [tipo, targetId]);

    /* C130: Enviar comentario multimedia */
    const enviarMultimedia = useCallback(async (
        tipoContenido: 'imagen' | 'audio',
        archivo: File,
        contenido?: string,
        parentId?: number
    ) => {
        try {
            const resp = await crearComentarioMultimedia(
                tipo, targetId, tipoContenido, archivo, contenido, parentId
            );
            if (resp.ok && resp.data) {
                const nuevo = resp.data as Comentario;
                if (parentId) {
                    setComentarios(prev => actualizarEnLista(prev, parentId, c => ({
                        ...c,
                        totalRespuestas: (c.totalRespuestas ?? 0) + 1,
                        respuestas: [...(c.respuestas ?? []), nuevo],
                    })));
                } else {
                    setComentarios(prev => [...prev, nuevo]);
                }
                if (tipo === 'sample') {
                    window.dispatchEvent(new CustomEvent(EVENTO_SAMPLE_COMENTADO, { detail: { sampleId: targetId } }));
                }
                return true;
            }
            return false;
        } catch (err) {
            log.error('Error enviando comentario multimedia', err);
            return false;
        }
    }, [tipo, targetId]);

    /* C264: Editar comentario (solo autor) */
    const editar = useCallback(async (id: number, contenido: string) => {
        try {
            const resp = await editarComentario(id, contenido);
            if (resp.ok && resp.data) {
                setComentarios(prev => actualizarEnLista(prev, id, c => ({
                    ...c,
                    contenido: resp.data!.contenido,
                    editadoAt: resp.data!.editadoAt,
                })));
                setEditandoId(null);
                return true;
            }
            return false;
        } catch (err) {
            log.error('Error editando comentario', err);
            return false;
        }
    }, []);

    /* C264: Eliminar comentario (autor o admin) */
    const eliminar = useCallback(async (id: number) => {
        try {
            const resp = await eliminarComentario(id);
            if (resp.ok) {
                setComentarios(prev => filtrarDeLista(prev, id));
                return true;
            }
            return false;
        } catch (err) {
            log.error('Error eliminando comentario', err);
            return false;
        }
    }, []);

    /* C264: Reportar comentario */
    const reportar = useCallback(async (id: number, razon: string) => {
        try {
            const resp = await reportarComentario(id, razon);
            return resp.ok;
        } catch (err) {
            log.error('Error reportando comentario', err);
            return false;
        }
    }, []);

    /* C265: Toggle like en comentario */
    const toggleLike = useCallback(async (id: number, liked: boolean) => {
        try {
            const resp = liked
                ? await quitarLikeComentario(id)
                : await darLikeComentario(id);
            if (resp.ok && resp.data) {
                setComentarios(prev => actualizarEnLista(prev, id, c => ({
                    ...c,
                    totalLikes: resp.data!.totalLikes,
                    liked: resp.data!.liked,
                })));
            }
        } catch (err) {
            log.error('Error toggle like comentario', err);
        }
    }, []);

    /* C265: Cargar respuestas de un comentario */
    const cargarRespuestas = useCallback(async (comentarioId: number) => {
        try {
            const resp = await obtenerRespuestas(comentarioId);
            if (resp.ok && resp.data) {
                setComentarios(prev => actualizarEnLista(prev, comentarioId, c => ({
                    ...c,
                    respuestas: Array.isArray(resp.data) ? resp.data as Comentario[] : [],
                })));
            }
        } catch (err) {
            log.error('Error cargando respuestas', err);
        }
    }, []);

    const cargarMas = useCallback(() => {
        if (!cargando && hayMas) cargar(pagina + 1);
    }, [cargar, cargando, hayMas, pagina]);

    const alternar = useCallback(() => {
        setAbierto(prev => {
            const siguiente = !prev;
            if (siguiente && comentarios.length === 0) cargar(1);
            return siguiente;
        });
    }, [cargar, comentarios.length]);

    useEffect(() => {
        if (cargarAlAbrir) cargar(1);
    }, [cargarAlAbrir, cargar]);

    /* [183A-100] Escuchar comentarios nuevos en tiempo real via WebSocket.
     * Filtra por tipo+targetId y excluye comentarios propios (ya insertados localmente). */
    const usuarioId = useAuthStore(s => s.usuario?.id);

    useEffect(() => {
        const unsub = wsService.on('comentario_nuevo', (datos: unknown) => {
            const d = datos as { tipo: string; targetId: number; comentario: Comentario };
            if (!d?.comentario || d.tipo !== tipo || d.targetId !== targetId) return;
            if (d.comentario.autorId === usuarioId) return;

            if (d.comentario.parentId) {
                setComentarios(prev => actualizarEnLista(prev, d.comentario.parentId!, c => ({
                    ...c,
                    totalRespuestas: (c.totalRespuestas ?? 0) + 1,
                    respuestas: [...(c.respuestas ?? []), d.comentario],
                })));
            } else {
                setComentarios(prev => [...prev, d.comentario]);
            }
        });

        return unsub;
    }, [tipo, targetId, usuarioId]);

    return {
        comentarios,
        cargando,
        abierto,
        hayMas,
        alternar,
        enviar,
        enviarMultimedia,
        cargarMas,
        cargar,
        /* C264: Acciones de comentario */
        editar,
        eliminar,
        reportar,
        editandoId,
        setEditandoId,
        /* C265: Likes y respuestas */
        toggleLike,
        cargarRespuestas,
        respondendoAId,
        setRespondendoAId,
    };
};
