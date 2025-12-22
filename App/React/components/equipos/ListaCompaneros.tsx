/*
 * ListaCompaneros
 *
 * Lista de compañeros activos (conexiones aceptadas).
 */

import {Users, UserMinus} from 'lucide-react';
import type {CompaneroEquipo} from '../../types/dashboard';
import {formatearFechaRelativa} from '../../utils/fecha';

interface ListaCompanerosProps {
    companeros: CompaneroEquipo[];
    onEliminar: (id: number) => void;
    cargando: boolean;
}

export function ListaCompaneros({companeros, onEliminar, cargando}: ListaCompanerosProps): JSX.Element {
    if (companeros.length === 0) {
        return (
            <div className="equiposVacio">
                <Users size={32} />
                <p>Aún no tienes compañeros</p>
                <span className="equiposVacioSubtexto">Invita a alguien para colaborar en tareas y proyectos</span>
            </div>
        );
    }

    return (
        <ul className="listaCompaneros">
            {companeros.map(companero => (
                <li key={companero.id} className="companeroItem">
                    <div className="companeroInfo">
                        <img src={companero.avatar} alt={companero.nombre} className="companeroAvatar" />
                        <div className="companeroDatos">
                            <span className="companeroNombre">{companero.nombre}</span>
                            <span className="companeroEmail">{companero.email}</span>
                        </div>
                    </div>

                    <div className="companeroMeta">
                        <span className="companeroFecha">Conectados {formatearFechaRelativa(companero.fechaConexion)}</span>
                    </div>

                    <div className="companeroAcciones">
                        <button type="button" className="companeroBoton eliminar" onClick={() => onEliminar(companero.id)} disabled={cargando} title="Eliminar conexión">
                            <UserMinus size={16} />
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}
