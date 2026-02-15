/*
 * ConAutenticacion — Kamples (Guard de rutas, Fase 1.9)
 * HOC que protege páginas que requieren usuario autenticado.
 * Si el usuario no está autenticado, redirige a login vía SPA.
 */

import { useEffect, type ComponentType, type JSX } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';

interface OpcionesGuard {
    redirigirA?: string;
    mensajeCarga?: string;
}

/*
 * HOC: envuelve un componente y solo lo renderiza si hay sesión activa.
 * Uso: export default conAutenticacion(MiIslandProtegida);
 */
export function conAutenticacion<P extends Record<string, unknown>>(
    Componente: ComponentType<P>,
    opciones: OpcionesGuard = {}
): ComponentType<P> {
    const {
        redirigirA = '/auth/login',
        mensajeCarga = 'Verificando sesión…',
    } = opciones;

    const ComponenteProtegido = (props: P): JSX.Element | null => {
        const { autenticado, cargando } = useAuthStore();
        const { navegar } = useNavigationStore();

        useEffect(() => {
            if (!cargando && !autenticado) {
                /* Guardar la URL actual para redirigir de vuelta después del login */
                const urlActual = window.location.pathname + window.location.search;
                navegar(`${redirigirA}?redirect=${encodeURIComponent(urlActual)}`);
            }
        }, [cargando, autenticado, navegar]);

        if (cargando) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px',
                    color: 'var(--textoSecundario)',
                }}>
                    {mensajeCarga}
                </div>
            );
        }

        if (!autenticado) return null;

        return <Componente {...props} />;
    };

    ComponenteProtegido.displayName = `ConAuth(${Componente.displayName ?? Componente.name ?? 'Componente'})`;

    return ComponenteProtegido;
}

export default conAutenticacion;
