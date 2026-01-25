/*
 * Toggle de Simulación de Cliente.
 * Solo visible para administradores.
 * Permite cambiar entre ver como Admin o ver como Cliente.
 */

import React from 'react';
import {Eye, EyeOff, UserCheck} from 'lucide-react';
import {useUsuario} from '../../context/UsuarioContext';
import {Boton} from '../ui/Boton';

export const ToggleSimulacion: React.FC = () => {
    const {esAdmin, simulando, toggleSimulacion, usuario} = useUsuario();

    if (!esAdmin) return null;

    return (
        <Boton className={`botonToggleSimulacion ${simulando ? 'simulando' : ''}`} onClick={toggleSimulacion} title={simulando ? 'Ver como Admin' : 'Ver como Cliente'} variante={simulando ? 'acento' : 'outline'} tamano="sm" icono={simulando ? <Eye size={14} /> : <UserCheck size={14} />}>
            <span className="toggleTexto">{simulando ? `Viendo: ${usuario.nombre}` : 'Admin'}</span>
        </Boton>
    );
};

export default ToggleSimulacion;
