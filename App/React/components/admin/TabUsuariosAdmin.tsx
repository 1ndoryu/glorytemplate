/*
 * Componente: TabUsuariosAdmin — Kamples (FASE 13)
 * Tabla de usuarios con búsqueda, filtro por plan y acciones de gestión.
 * Solo vista; la lógica viene de useAdminPanel.
 */

import { useState, useCallback } from 'react';
import { Search, Shield, BadgeCheck, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { UsuarioAdmin } from '../../services/apiAdmin';
import { BotonBase } from '../ui/BotonBase';
import { SelectorBase } from '../ui/SelectorBase';
import { CampoTexto } from '../ui/CampoTexto';

interface TabUsuariosAdminProps {
    usuarios: UsuarioAdmin[];
    totalUsuarios: number;
    pagina: number;
    busqueda: string;
    filtroPlan: string;
    onCambiarPagina: (p: number) => void;
    onCambiarBusqueda: (b: string) => void;
    onCambiarFiltroPlan: (p: string) => void;
    onActualizarUsuario: (id: number, cambios: Record<string, unknown>) => Promise<boolean>;
}

/* Formatear fecha corta */
const formatearFecha = (fecha: string): string =>
    new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

/* Color de badge según plan */
const colorPlan = (plan: string): 'neutro' | 'acento' | 'premium' | 'info' => {
    if (plan === 'premium') return 'premium';
    if (plan === 'pro') return 'acento';
    return 'neutro';
};

export const TabUsuariosAdmin = ({
    usuarios,
    totalUsuarios,
    pagina,
    busqueda,
    filtroPlan,
    onCambiarPagina,
    onCambiarBusqueda,
    onCambiarFiltroPlan,
    onActualizarUsuario,
}: TabUsuariosAdminProps): JSX.Element => {
    const [procesando, setProcesando] = useState<number | null>(null);
    const totalPaginas = Math.ceil(totalUsuarios / 20);

    const manejarAccion = useCallback(async (id: number, cambios: Record<string, unknown>) => {
        setProcesando(id);
        await onActualizarUsuario(id, cambios);
        setProcesando(null);
    }, [onActualizarUsuario]);

    /* Toggle ban (7 días o desbanear) */
    const toggleBan = useCallback((usuario: UsuarioAdmin) => {
        if (usuario.ban_hasta) {
            manejarAccion(usuario.id, { ban_hasta: null });
        } else {
            const enUnaSemana = new Date();
            enUnaSemana.setDate(enUnaSemana.getDate() + 7);
            manejarAccion(usuario.id, { ban_hasta: enUnaSemana.toISOString() });
        }
    }, [manejarAccion]);

    return (
        <div>
            {/* Controles búsqueda + filtro */}
            <div className="adminUsuariosControles">
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--textoTerciario)' }} />
                    <CampoTexto
                        className="adminUsuariosBusqueda"
                        placeholder="Buscar por nombre, username o email..."
                        value={busqueda}
                        onChange={(e) => onCambiarBusqueda(e.target.value)}
                        style={{ paddingLeft: '2rem' }}
                    />
                </div>
                <SelectorBase
                    className="adminUsuariosFiltro"
                    value={filtroPlan}
                    onChange={(e) => onCambiarFiltroPlan(e.target.value)}
                >
                    <option value="">Todos los planes</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                </SelectorBase>
            </div>

            {/* Tabla */}
            <table className="adminTablaUsuarios">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Plan</th>
                        <th>Rol</th>
                        <th>Samples</th>
                        <th>Descargas</th>
                        <th>Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.length === 0 && (
                        <tr>
                            <td colSpan={7} className="adminVacio">
                                No se encontraron usuarios
                            </td>
                        </tr>
                    )}
                    {usuarios.map((u) => (
                        <tr key={u.id}>
                            <td>
                                <div className="adminUsuarioFila">
                                    {u.avatar_url ? (
                                        <img src={u.avatar_url} alt="" className="adminUsuarioAvatar" />
                                    ) : (
                                        <div className="adminUsuarioAvatar" />
                                    )}
                                    <div className="adminUsuarioInfo">
                                        <span className="adminUsuarioNombre">
                                            {u.nombre_visible || u.username}
                                            {u.verificado && <BadgeCheck size={12} style={{ marginLeft: '4px', color: 'var(--acento)' }} />}
                                        </span>
                                        <span className="adminUsuarioUsername">@{u.username}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <Badge variante={colorPlan(u.plan)}>{u.plan}</Badge>
                            </td>
                            <td>
                                <Badge variante={u.rol === 'admin' ? 'error' : 'neutro'}>
                                    {u.rol}
                                </Badge>
                            </td>
                            <td>{u.total_samples}</td>
                            <td>{u.total_descargas}</td>
                            <td>{formatearFecha(u.created_at)}</td>
                            <td>
                                <div className="adminUsuarioAcciones">
                                    <BotonBase variante="ghost"
                                        className="adminBotonAccion"
                                        title={u.verificado ? 'Quitar verificación' : 'Verificar'}
                                        onClick={() => manejarAccion(u.id, { verificado: !u.verificado })}
                                        disabled={procesando === u.id}
                                        type="button"
                                    >
                                        <BadgeCheck size={14} />
                                    </BotonBase>
                                    <BotonBase variante="ghost"
                                        className="adminBotonAccion"
                                        title="Cambiar a admin"
                                        onClick={() => manejarAccion(u.id, { rol: u.rol === 'admin' ? 'usuario' : 'admin' })}
                                        disabled={procesando === u.id}
                                        type="button"
                                    >
                                        <Shield size={14} />
                                    </BotonBase>
                                    <BotonBase variante="ghost"
                                        className={`adminBotonAccion ${u.ban_hasta ? '' : 'adminBotonAccionPeligro'}`}
                                        title={u.ban_hasta ? 'Desbanear' : 'Banear 7 días'}
                                        onClick={() => toggleBan(u)}
                                        disabled={procesando === u.id}
                                        type="button"
                                    >
                                        <Ban size={14} />
                                    </BotonBase>
                                    {/* C257: Selector de plan */}
                                    <SelectorBase
                                        className="adminSelectPlan"
                                        value={u.plan}
                                        onChange={(e) => manejarAccion(u.id, { plan: e.target.value })}
                                        disabled={procesando === u.id}
                                        title="Cambiar plan"
                                    >
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                        <option value="premium">Premium</option>
                                    </SelectorBase>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="adminPaginacion">
                    <BotonBase variante="ghost"
                        className="adminPaginacionBoton"
                        onClick={() => onCambiarPagina(pagina - 1)}
                        disabled={pagina <= 1}
                        type="button"
                    >
                        <ChevronLeft size={14} />
                    </BotonBase>
                    <span style={{ fontSize: '0.8rem', color: 'var(--textoSecundario)', padding: '0.4rem' }}>
                        {pagina} / {totalPaginas} ({totalUsuarios} total)
                    </span>
                    <BotonBase variante="ghost"
                        className="adminPaginacionBoton"
                        onClick={() => onCambiarPagina(pagina + 1)}
                        disabled={pagina >= totalPaginas}
                        type="button"
                    >
                        <ChevronRight size={14} />
                    </BotonBase>
                </div>
            )}
        </div>
    );
};
