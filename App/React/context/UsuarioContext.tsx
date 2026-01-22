/*
 * Contexto de Usuario del Panel.
 * Gestiona el usuario actual y la simulación de cliente (para admins).
 */

import React, {createContext, useContext, useState, useCallback, useMemo, ReactNode} from 'react';
import {UsuarioPanel} from '../data/types/usuario';
import {usuarioAdmin, usuarioGuillermo, obtenerUsuarioPorWpId} from '../data/mocks/usuarios';

interface UsuarioContextType {
    usuario: UsuarioPanel;
    usuarioReal: UsuarioPanel;
    esAdmin: boolean;
    simulando: boolean;
    clienteId: string | null;
    toggleSimulacion: () => void;
    cambiarClienteSimulado: (cliente: UsuarioPanel) => void;
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

/*
 * Por ahora, simulamos que el usuario admin está logueado.
 * TO-DO: Integrar con usuario real de WordPress (window.wpUser)
 */
const obtenerUsuarioWP = (): UsuarioPanel => {
    const wpUserId = 1;
    return obtenerUsuarioPorWpId(wpUserId) || usuarioAdmin;
};

interface UsuarioProviderProps {
    children: ReactNode;
}

export const UsuarioProvider: React.FC<UsuarioProviderProps> = ({children}) => {
    const usuarioReal = useMemo(() => obtenerUsuarioWP(), []);
    const [simulando, setSimulando] = useState(false);
    const [clienteSimulado, setClienteSimulado] = useState<UsuarioPanel>(usuarioGuillermo);

    /* Usuario efectivo: real o simulado */
    const usuario = useMemo(() => {
        if (simulando && usuarioReal.rol === 'admin') {
            return clienteSimulado;
        }
        return usuarioReal;
    }, [simulando, usuarioReal, clienteSimulado]);

    const esAdmin = useMemo(() => usuarioReal.rol === 'admin', [usuarioReal]);

    const toggleSimulacion = useCallback(() => {
        if (esAdmin) {
            setSimulando(prev => !prev);
        }
    }, [esAdmin]);

    const cambiarClienteSimulado = useCallback((cliente: UsuarioPanel) => {
        setClienteSimulado(cliente);
    }, []);

    /* Obtener ID del cliente actual (para filtrar datos) */
    const clienteId = useMemo(() => {
        if (usuario.rol === 'cliente') {
            if (usuario.id === 'USR-002') return 'CLI-001';
        }
        return null;
    }, [usuario]);

    const value = useMemo(
        () => ({
            usuario,
            usuarioReal,
            esAdmin,
            simulando,
            clienteId,
            toggleSimulacion,
            cambiarClienteSimulado
        }),
        [usuario, usuarioReal, esAdmin, simulando, clienteId, toggleSimulacion, cambiarClienteSimulado]
    );

    return <UsuarioContext.Provider value={value}>{children}</UsuarioContext.Provider>;
};

export const useUsuario = () => {
    const context = useContext(UsuarioContext);
    if (!context) {
        throw new Error('useUsuario debe usarse dentro de un UsuarioProvider');
    }
    return context;
};
