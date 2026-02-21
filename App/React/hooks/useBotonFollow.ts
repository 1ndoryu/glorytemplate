/*
 * Hook: useBotonFollow
 * Lógica extraída de BotonFollow (SRP).
 * Gestiona follow/unfollow con optimistic UI y rollback.
 */

import { useState, useCallback, useEffect } from 'react';
import { seguirUsuario, dejarDeSeguir } from '@app/services/apiSocial';

interface UseBotonFollowParams {
    usuarioId: number;
    siguiendoInicial: boolean;
    tamano: 'sm' | 'md';
    className: string;
}

export const useBotonFollow = ({ usuarioId, siguiendoInicial, tamano, className }: UseBotonFollowParams) => {
    const [siguiendo, setSiguiendo] = useState(siguiendoInicial);
    const [cargando, setCargando] = useState(false);

    /* Sincronizar estado interno cuando el prop cambia (ej: recarga de API) */
    useEffect(() => {
        setSiguiendo(siguiendoInicial);
    }, [siguiendoInicial]);

    const manejarClick = useCallback(async () => {
        if (cargando) return;
        setCargando(true);

        /* Optimistic UI */
        const valorAnterior = siguiendo;
        setSiguiendo(!siguiendo);

        try {
            const resp = siguiendo
                ? await dejarDeSeguir(usuarioId)
                : await seguirUsuario(usuarioId);

            if (!resp.ok) {
                /* Revertir si falla */
                setSiguiendo(valorAnterior);
            }
        } catch {
            setSiguiendo(valorAnterior);
        }

        setCargando(false);
    }, [siguiendo, usuarioId, cargando]);

    const clases = [
        'botonFollow',
        siguiendo ? 'botonFollowActivo' : '',
        `botonFollow-${tamano}`,
        className,
    ].filter(Boolean).join(' ');

    return {
        siguiendo,
        cargando,
        manejarClick,
        clases,
        tamano,
    };
};
