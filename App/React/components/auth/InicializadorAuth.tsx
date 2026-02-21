/*
 * Componente: InicializadorAuth
 * Se monta una sola vez en AppProvider.
 * Lee GLORY_CONTEXT para detectar sesión de WordPress y sincroniza el authStore.
 * Si hay sesión PHP, también intenta obtener datos completos del perfil Kamples via API.
 */

import { type ReactNode } from 'react';
import { useInicializadorAuth } from '@app/hooks/useInicializadorAuth';

interface Props {
    children: ReactNode;
}

export const InicializadorAuth = ({ children }: Props): JSX.Element => {
    useInicializadorAuth();
    return <>{children}</>;
};

export default InicializadorAuth;
