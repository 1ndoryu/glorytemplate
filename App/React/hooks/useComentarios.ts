/*
 * Hook: useComentarios — Kamples
 * Gestiona fetch, paginación y creación de comentarios para cualquier entidad.
 * Separa la lógica de la vista según protocolo SRP.
 */

import { useState, useCallback, useEffect } from 'react';
import { obtenerComentarios, crearComentario, crearComentarioMultimedia } from '@app/services/apiSocial';
import { crearLogger } from '@app/services/logger';
import type { Comentario } from '@app/types';

const log = crearLogger('useComentarios');

interface UseComentariosOpciones {
    tipo: 'sample' | 'publicacion';
    targetId: number;
    cargarAlAbrir?: boolean;
}

export const useComentarios = ({ tipo, targetId, cargarAlAbrir = false }: UseComentariosOpciones) => {
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [cargando, setCargando] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [hayMas, setHayMas] = useState(true);
    const [abierto, setAbierto] = useState(false);

    const cargar = useCallback(async (pag = 1) => {
        setCargando(true);
        try {
            const resp = await obtenerComentarios(tipo, targetId, pag);
            if (resp.ok && resp.data) {
                const datos = Array.isArray(resp.data) ? resp.data : [];
                if (pag === 1) {
                    setComentarios(datos);
                } else {
                    setComentarios(prev => [...prev, ...datos]);
                }
                setHayMas(datos.length >= 20);
                setPagina(pag);
            }
        } catch (err) {
            log.error('Error cargando comentarios', err);
        } finally {
            setCargando(false);
        }
    }, [tipo, targetId]);

    const enviar = useCallback(async (contenido: string) => {
        try {
            const resp = await crearComentario(tipo, targetId, contenido);
            if (resp.ok && resp.data) {
                setComentarios(prev => [...prev, resp.data as Comentario]);
                return true;
            }
            return false;
        } catch (err) {
            log.error('Error enviando comentario', err);
            return false;
        }
    }, [tipo, targetId]);

    /* C130: Enviar comentario multimedia (imagen o audio) */
    const enviarMultimedia = useCallback(async (
        tipoContenido: 'imagen' | 'audio',
        archivo: File,
        contenido?: string
    ) => {
        try {
            const resp = await crearComentarioMultimedia(tipo, targetId, tipoContenido, archivo, contenido);
            if (resp.ok && resp.data) {
                setComentarios(prev => [...prev, resp.data as Comentario]);
                return true;
            }
            return false;
        } catch (err) {
            log.error('Error enviando comentario multimedia', err);
            return false;
        }
    }, [tipo, targetId]);

    const cargarMas = useCallback(() => {
        if (!cargando && hayMas) {
            cargar(pagina + 1);
        }
    }, [cargar, cargando, hayMas, pagina]);

    const alternar = useCallback(() => {
        setAbierto(prev => {
            const siguiente = !prev;
            if (siguiente && comentarios.length === 0) {
                cargar(1);
            }
            return siguiente;
        });
    }, [cargar, comentarios.length]);

    useEffect(() => {
        if (cargarAlAbrir) {
            cargar(1);
        }
    }, [cargarAlAbrir, cargar]);

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
    };
};
