/*
 * Toggle de Simulación de Cliente.
 * Solo visible para administradores.
 * Permite cambiar entre ver como Admin o ver como Cliente.
 */

import React from 'react';
import {Eye, EyeOff, UserCheck} from 'lucide-react';
import {useUsuario} from '../../context/UsuarioContext';

export const ToggleSimulacion: React.FC = () => {
    const {esAdmin, simulando, toggleSimulacion, usuario} = useUsuario();

    if (!esAdmin) return null;

    return (
        <button className={`botonToggleSimulacion ${simulando ? 'simulando' : ''}`} onClick={toggleSimulacion} title={simulando ? 'Ver como Admin' : 'Ver como Cliente'}>
            {simulando ? (
                <>
                    <Eye size={14} />
                    <span className="toggleTexto">Viendo: {usuario.nombre}</span>
                </>
            ) : (
                <>
                    <UserCheck size={14} />
                    <span className="toggleTexto">Admin</span>
                </>
            )}
        </button>
    );
};

export default ToggleSimulacion;
