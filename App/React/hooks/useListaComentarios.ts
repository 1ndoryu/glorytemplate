/*
 * Hook: useListaComentarios
 * Lógica de input de comentarios: texto, archivos adjuntos (imagen/audio),
 * paginación infinita, acciones delegadas a ComentarioItem.
 *
 * Extraído de ListaComentarios.tsx para cumplir SRP.
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import type { Comentario } from '@app/types/publicacion';
import type { ComentarioAcciones } from '@app/components/social/ComentarioItem';

interface UseListaComentariosOpciones {
    comentarios: Comentario[];
    onEnviar?: (contenido: string, parentId?: number) => void;
    onEnviarMultimedia?: (tipo: 'imagen' | 'audio', archivo: File, contenido?: string, parentId?: number) => void;
    maxVisibles?: number;
    cargando?: boolean;
    onCargarMas?: () => void;
    hayMasPaginas?: boolean;
    onEditar?: (id: number, contenido: string) => Promise<boolean>;
    onEliminar?: (id: number) => Promise<boolean>;
    onReportar?: (id: number, razon: string) => Promise<boolean>;
    onToggleLike?: (id: number, liked: boolean) => Promise<void>;
    onCargarRespuestas?: (id: number) => Promise<void>;
    editandoId?: number | null;
    setEditandoId?: (id: number | null) => void;
    respondendoAId?: number | null;
    setRespondendoAId?: (id: number | null) => void;
}

export function useListaComentarios(opciones: UseListaComentariosOpciones) {
    const {
        comentarios, onEnviar, onEnviarMultimedia,
        maxVisibles = 5, cargando = false,
        onCargarMas, hayMasPaginas = false,
        onEditar, onEliminar, onReportar, onToggleLike,
        onCargarRespuestas, editandoId, setEditandoId,
        respondendoAId, setRespondendoAId,
    } = opciones;

    const usuario = useAuthStore(s => s.usuario);
    const autenticado = useAuthStore(s => s.autenticado);
    const [textoNuevo, setTextoNuevo] = useState('');
    const [mostrarTodos, setMostrarTodos] = useState(false);
    const [archivoAdjunto, setArchivoAdjunto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [tipoAdjunto, setTipoAdjunto] = useState<'imagen' | 'audio' | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputImagenRef = useRef<HTMLInputElement>(null);
    const inputAudioRef = useRef<HTMLInputElement>(null);
    const sentinelaRef = useRef<HTMLDivElement>(null);

    /* Limpiar preview URL al desmontar */
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const limpiarAdjunto = useCallback(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setArchivoAdjunto(null);
        setPreviewUrl(null);
        setTipoAdjunto(null);
    }, [previewUrl]);

    const manejarArchivoSeleccionado = useCallback((archivo: File, tipo: 'imagen' | 'audio') => {
        limpiarAdjunto();
        setArchivoAdjunto(archivo);
        setTipoAdjunto(tipo);
        if (tipo === 'imagen') {
            setPreviewUrl(URL.createObjectURL(archivo));
        }
    }, [limpiarAdjunto]);

    const manejarEnviar = useCallback(() => {
        if (archivoAdjunto && tipoAdjunto && onEnviarMultimedia) {
            const texto = textoNuevo.trim() || undefined;
            onEnviarMultimedia(tipoAdjunto, archivoAdjunto, texto);
            setTextoNuevo('');
            limpiarAdjunto();
            inputRef.current?.focus();
            return;
        }
        const texto = textoNuevo.trim();
        if (!texto || !onEnviar) return;
        onEnviar(texto);
        setTextoNuevo('');
        inputRef.current?.focus();
    }, [textoNuevo, onEnviar, onEnviarMultimedia, archivoAdjunto, tipoAdjunto, limpiarAdjunto]);

    const manejarKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                manejarEnviar();
            }
        },
        [manejarEnviar],
    );

    const visibles = mostrarTodos ? comentarios : comentarios.slice(0, maxVisibles);
    const hayMasLocales = comentarios.length > maxVisibles && !mostrarTodos;
    const puedeEnviar = (textoNuevo.trim().length > 0) || (archivoAdjunto !== null);

    /* IntersectionObserver para cargar más al llegar al fondo */
    useEffect(() => {
        if (!mostrarTodos || !hayMasPaginas || !onCargarMas || cargando) return;
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) onCargarMas();
            },
            { rootMargin: '100px' },
        );
        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [mostrarTodos, hayMasPaginas, onCargarMas, cargando]);

    /* Construir acciones para ComentarioItem */
    const accionesComentario: ComentarioAcciones | undefined =
        (onEditar || onEliminar || onReportar || onToggleLike || onCargarRespuestas || onEnviar)
            ? {
                onEditar,
                onEliminar,
                onReportar,
                onToggleLike,
                onCargarRespuestas,
                onResponder: onEnviar
                    ? async (contenido: string, parentId: number) => {
                        onEnviar(contenido, parentId);
                        return true;
                    }
                    : undefined,
                editandoId: editandoId ?? null,
                setEditandoId: setEditandoId ?? (() => {}),
                respondendoAId: respondendoAId ?? null,
                setRespondendoAId: setRespondendoAId ?? (() => {}),
            }
            : undefined;

    return {
        /* Estado */
        usuario,
        autenticado,
        textoNuevo,
        setTextoNuevo,
        mostrarTodos,
        setMostrarTodos,
        archivoAdjunto,
        previewUrl,
        tipoAdjunto,
        visibles,
        hayMasLocales,
        puedeEnviar,

        /* Refs */
        inputRef,
        inputImagenRef,
        inputAudioRef,
        sentinelaRef,

        /* Handlers */
        limpiarAdjunto,
        manejarArchivoSeleccionado,
        manejarEnviar,
        manejarKeyDown,

        /* Acciones para ComentarioItem */
        accionesComentario,
    };
}
