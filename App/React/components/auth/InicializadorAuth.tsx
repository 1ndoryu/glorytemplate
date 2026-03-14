/*
 * Componente: InicializadorAuth
 * Se monta una sola vez en AppProvider.
 * Lee GLORY_CONTEXT para detectar sesión de WordPress y sincroniza el authStore.
 * Si hay sesión PHP, también intenta obtener datos completos del perfil Kamples via API.
 * QK68: Inicializa conexión WebSocket después de auth.
 */

import { type ReactNode } from 'react';
import { useInicializadorAuth } from '@app/hooks/useInicializadorAuth';
import { useWebSocket } from '@app/hooks/useWebSocket';

interface Props {
    children: ReactNode;
}

export const InicializadorAuth = ({ children }: Props): JSX.Element => {
    useInicializadorAuth();
    useWebSocket();
    return <>{children}</>;
};

export default InicializadorAuth;
