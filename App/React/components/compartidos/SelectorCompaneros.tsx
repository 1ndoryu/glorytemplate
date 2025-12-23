/*
 * SelectorCompaneros
 * Componente para seleccionar compañeros con quienes compartir un elemento
 * Muestra lista de compañeros del equipo con opción de seleccionar rol
 */

import {useState, useCallback} from 'react';
import {UserPlus, Check, Users, Eye, Edit3} from 'lucide-react';
import type {CompaneroEquipo, RolCompartido} from '../../types/dashboard';

interface SelectorCompanerosProps {
    companeros: CompaneroEquipo[];
    companeroSeleccionado: number | null;
    rolSeleccionado: RolCompartido;
    onSeleccionar: (companeroId: number | null) => void;
    onCambiarRol: (rol: RolCompartido) => void;
    disabled?: boolean;
}

export function SelectorCompaneros({companeros, companeroSeleccionado, rolSeleccionado, onSeleccionar, onCambiarRol, disabled = false}: SelectorCompanerosProps): JSX.Element {
    if (companeros.length === 0) {
        return (
            <div id="selector-companeros-vacio" className="selectorCompanerosVacio">
                <Users size={24} />
                <p>No tienes compañeros de equipo</p>
                <span>Añade compañeros desde el botón de Equipos en el encabezado</span>
            </div>
        );
    }

    return (
        <div id="selector-companeros" className="selectorCompaneros">
            <div className="selectorCompanerosLista">
                {companeros.map(companero => (
                    <div key={companero.companeroId} className={`selectorCompaneroItem ${companeroSeleccionado === companero.companeroId ? 'selectorCompaneroItemActivo' : ''}`} onClick={() => !disabled && onSeleccionar(companeroSeleccionado === companero.companeroId ? null : companero.companeroId)}>
                        <img src={companero.avatar} alt={companero.nombre} className="selectorCompaneroAvatar" />
                        <div className="selectorCompaneroInfo">
                            <span className="selectorCompaneroNombre">{companero.nombre}</span>
                            <span className="selectorCompaneroEmail">{companero.email}</span>
                        </div>
                        {companeroSeleccionado === companero.companeroId && <Check size={16} className="selectorCompaneroCheck" />}
                    </div>
                ))}
            </div>

            {companeroSeleccionado && (
                <div className="selectorRolContainer">
                    <span className="selectorRolTitulo">Rol:</span>
                    <div className="selectorRolOpciones">
                        <button type="button" className={`selectorRolOpcion ${rolSeleccionado === 'colaborador' ? 'selectorRolOpcionActiva' : ''}`} onClick={() => onCambiarRol('colaborador')} disabled={disabled} title="Puede ver y editar">
                            <Edit3 size={12} />
                            <span>Colaborador</span>
                        </button>
                        <button type="button" className={`selectorRolOpcion ${rolSeleccionado === 'observador' ? 'selectorRolOpcionActiva' : ''}`} onClick={() => onCambiarRol('observador')} disabled={disabled} title="Solo puede ver">
                            <Eye size={12} />
                            <span>Observador</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
