/*
 * ConAutenticacion — Kamples
 * HOC que protege páginas que requieren usuario autenticado.
 * Si el usuario no está autenticado, abre el modal de login.
 */

import { useEffect, type ComponentType, type JSX } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { useAuthModalStore } from '@app/stores/authModalStore';

interface OpcionesGuard {
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
        mensajeCarga = 'Verificando sesión…',
    } = opciones;

    const ComponenteProtegido = (props: P): JSX.Element | null => {
        const autenticado = useAuthStore(s => s.autenticado);
        const cargando = useAuthStore(s => s.cargando);
        const abrirAuth = useAuthModalStore((s) => s.abrir);

        useEffect(() => {
            if (!cargando && !autenticado) {
                /* Abrir modal de login en vez de redirigir */
                abrirAuth('login');
            }
        }, [cargando, autenticado, abrirAuth]);

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
