/*
 * Hook para gestionar el usuario actual del panel.
 * Permite simular ser un cliente cuando se está logueado como admin.
 *
 * Uso:
 * const { usuario, esAdmin, simulando, toggleSimulacion } = useUsuarioPanel();
 */

import {useState, useCallback, useMemo} from 'react';
import {UsuarioPanel, EstadoUsuario} from '../data/types/usuario';
import {usuarioAdmin, usuarioGuillermo, obtenerUsuarioPorWpId} from '../data/mocks/usuarios';

/*
 * Por ahora, simulamos que el usuario admin está logueado.
 * En producción, esto vendría de WordPress (window.wpUser o similar).
 */
const obtenerUsuarioWP = (): UsuarioPanel => {
    /* TO-DO: Integrar con usuario real de WordPress */
    /* const wpUserId = (window as any).wpUser?.ID || 1; */
    const wpUserId = 1;
    return obtenerUsuarioPorWpId(wpUserId) || usuarioAdmin;
};

export const useUsuarioPanel = () => {
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

    /* Es admin si el usuario REAL es admin */
    const esAdmin = useMemo(() => usuarioReal.rol === 'admin', [usuarioReal]);

    /* Toggle simulación cliente (solo funciona si es admin) */
    const toggleSimulacion = useCallback(() => {
        if (esAdmin) {
            setSimulando(prev => !prev);
        }
    }, [esAdmin]);

    /* Cambiar cliente a simular */
    const cambiarClienteSimulado = useCallback((cliente: UsuarioPanel) => {
        setClienteSimulado(cliente);
    }, []);

    /* Obtener ID del cliente actual (para filtrar datos) */
    const clienteId = useMemo(() => {
        /* Admin ID = USR-001, Cliente Guillermo = CLI-001 (referencia a clientes.ts) */
        if (usuario.rol === 'cliente') {
            /* Mapear usuario a cliente (por ahora hardcoded) */
            if (usuario.id === 'USR-002') return 'CLI-001';
        }
        return null;
    }, [usuario]);

    return {
        usuario,
        usuarioReal,
        esAdmin,
        simulando,
        clienteId,
        toggleSimulacion,
        cambiarClienteSimulado,
        clienteSimulado
    };
};

export default useUsuarioPanel;
