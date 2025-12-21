/*
 * ListaUsuarios
 *
 * Tabla de usuarios con paginación para el panel de administración.
 * Muestra información básica y acciones rápidas por usuario.
 */

import {ChevronLeft, ChevronRight, User, Crown, Clock, AlertCircle} from 'lucide-react';
import type {UsuarioAdmin, PaginacionAdmin} from '../../types/dashboard';
import {FilaUsuario} from './FilaUsuario';

interface ListaUsuariosProps {
    usuarios: UsuarioAdmin[];
    cargando: boolean;
    error: string | null;
    paginacion: PaginacionAdmin;
    onCambiarPagina: (pagina: number) => void;
    onVerDetalle: (usuario: UsuarioAdmin) => void;
    onActivarPremium: (usuario: UsuarioAdmin) => void;
    onCancelarPremium: (usuario: UsuarioAdmin) => void;
    cargandoAccion: number | null;
}

export function ListaUsuarios({usuarios, cargando, error, paginacion, onCambiarPagina, onVerDetalle, onActivarPremium, onCancelarPremium, cargandoAccion}: ListaUsuariosProps): JSX.Element {
    /* Estado de carga */
    if (cargando && usuarios.length === 0) {
        return (
            <div className="listaUsuariosEstado">
                <Clock size={24} className="listaUsuariosIcono animacionRotar" />
                <span>Cargando usuarios...</span>
            </div>
        );
    }

    /* Estado de error */
    if (error) {
        return (
            <div className="listaUsuariosEstado listaUsuariosError">
                <AlertCircle size={24} className="listaUsuariosIcono" />
                <span>{error}</span>
            </div>
        );
    }

    /* Sin usuarios */
    if (usuarios.length === 0) {
        return (
            <div className="listaUsuariosEstado">
                <User size={24} className="listaUsuariosIcono" />
                <span>No se encontraron usuarios</span>
            </div>
        );
    }

    return (
        <div id="lista-usuarios" className="listaUsuarios">
            {/* Tabla de usuarios */}
            <div className="listaUsuariosTabla">
                {/* Encabezado */}
                <div className="listaUsuariosEncabezado">
                    <div className="celdaUsuario">Usuario</div>
                    <div className="celdaPlan">Plan</div>
                    <div className="celdaEstado">Estado</div>
                    <div className="celdaFecha">Registro</div>
                    <div className="celdaAcciones">Acciones</div>
                </div>

                {/* Filas */}
                <div className="listaUsuariosFilas">
                    {usuarios.map(usuario => (
                        <FilaUsuario key={usuario.id} usuario={usuario} onVerDetalle={() => onVerDetalle(usuario)} onActivarPremium={() => onActivarPremium(usuario)} onCancelarPremium={() => onCancelarPremium(usuario)} cargando={cargandoAccion === usuario.id} />
                    ))}
                </div>
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
                <div className="listaUsuariosPaginacion">
                    <button type="button" className="paginacionBoton" onClick={() => onCambiarPagina(paginacion.pagina - 1)} disabled={paginacion.pagina <= 1} title="Página anterior">
                        <ChevronLeft size={16} />
                    </button>

                    <span className="paginacionInfo">
                        Página {paginacion.pagina} de {paginacion.totalPaginas}
                    </span>

                    <button type="button" className="paginacionBoton" onClick={() => onCambiarPagina(paginacion.pagina + 1)} disabled={paginacion.pagina >= paginacion.totalPaginas} title="Página siguiente">
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
