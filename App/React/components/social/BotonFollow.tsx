/*
 * Componente: BotonFollow — Kamples (Fase 4.1)
 * Toggle de follow/unfollow con optimistic UI.
 */

import { useState, useCallback, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { seguirUsuario, dejarDeSeguir } from '@app/services/apiSocial';
import '../../styles/componentes/botonFollow.css';

interface BotonFollowProps {
    usuarioId: number;
    siguiendo?: boolean;
    tamano?: 'sm' | 'md';
    className?: string;
}

export const BotonFollow = ({
    usuarioId,
    siguiendo: siguiendoInicial = false,
    tamano = 'md',
    className = '',
}: BotonFollowProps): JSX.Element => {
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

        const resp = siguiendo
            ? await dejarDeSeguir(usuarioId)
            : await seguirUsuario(usuarioId);

        if (!resp.ok) {
            /* Revertir si falla */
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

    return (
        <button
            className={clases}
            onClick={manejarClick}
            disabled={cargando}
            type="button"
            aria-label={siguiendo ? 'Dejar de seguir' : 'Seguir'}
        >
            {siguiendo ? <UserCheck size={tamano === 'sm' ? 12 : 14} /> : <UserPlus size={tamano === 'sm' ? 12 : 14} />}
            <span>{siguiendo ? 'Siguiendo' : 'Seguir'}</span>
        </button>
    );
};

export default BotonFollow;
