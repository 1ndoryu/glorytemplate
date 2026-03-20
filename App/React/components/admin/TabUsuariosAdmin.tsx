/*
 * Componente: TabUsuariosAdmin — Kamples (FASE 13)
 * Tabla de usuarios con búsqueda, filtro por plan y acciones de gestión.
 * Solo vista; la lógica viene de useAdminPanel.
 */

import {
    Search, Shield, BadgeCheck, Ban, ChevronLeft, ChevronRight, ShieldAlert, Trash2, Undo2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { UsuarioAdmin, KpisAdmin } from '../../services/apiAdmin';
import { BotonBase } from '../ui/BotonBase';
import { SelectorMenu } from '../ui/SelectorMenu';
import type { OpcionSelector } from '../ui/SelectorMenu';
import { CampoTexto } from '../ui/CampoTexto';
import { EstadoVacio } from '../ui/EstadoVacio';
import { ModalSuspenderAdmin } from './ModalSuspenderAdmin';
import { useTabUsuariosAdmin } from '@app/hooks/useTabUsuariosAdmin';
import { KpisCompactosAdmin } from './KpisCompactosAdmin';
import { useT } from '@app/utils/i18n/useT';

interface TabUsuariosAdminProps {
    kpis?: KpisAdmin | null;
    usuarios: UsuarioAdmin[];
    totalUsuarios: number;
    pagina: number;
    busqueda: string;
    filtroPlan: string;
    onCambiarPagina: (p: number) => void;
    onCambiarBusqueda: (b: string) => void;
    onCambiarFiltroPlan: (p: string) => void;
    onActualizarUsuario: (id: number, cambios: Record<string, unknown>) => Promise<boolean>;
    onRefrescar?: () => void;
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

/* QQ65: Estado de cuenta del usuario */
const estadoLabel = (u: UsuarioAdmin): { texto: string; variante: 'neutro' | 'error' | 'premium' } => {
    if (u.estado === 'en_eliminacion') return { texto: 'Eliminación', variante: 'error' };
    if (u.estado === 'suspendido') return { texto: 'Suspendido', variante: 'premium' };
    if (u.ban_hasta && new Date(u.ban_hasta) > new Date()) return { texto: 'Baneado', variante: 'error' };
    return { texto: 'Activo', variante: 'neutro' };
};

/* Opciones para filtro y selector de plan */
const OPCIONES_FILTRO_PLAN: OpcionSelector[] = [
    { valor: '', etiqueta: 'Todos los planes' },
    { valor: 'free', etiqueta: 'Free' },
    { valor: 'pro', etiqueta: 'Pro' },
    { valor: 'premium', etiqueta: 'Premium' },
];

const OPCIONES_PLAN: OpcionSelector[] = [
    { valor: 'free', etiqueta: 'Free' },
    { valor: 'pro', etiqueta: 'Pro' },
    { valor: 'premium', etiqueta: 'Premium' },
];

export const TabUsuariosAdmin = ({
    kpis,
    usuarios,
    totalUsuarios,
    pagina,
    busqueda,
    filtroPlan,
    onCambiarPagina,
    onCambiarBusqueda,
    onCambiarFiltroPlan,
    onActualizarUsuario,
    onRefrescar,
}: TabUsuariosAdminProps): JSX.Element => {
    const { procesando, totalPaginas, suspension, manejarAccion, toggleBan } = useTabUsuariosAdmin({
        onActualizarUsuario,
        totalUsuarios,
        onRefrescar,
    });

    const { t } = useT();

    return (
        <div>
            {/* QK46: KPIs compactos movidos desde TabResumen */}
            {kpis && <KpisCompactosAdmin kpis={kpis} />}

            {/* Controles búsqueda + filtro */}
            <div className="adminUsuariosControles">
                <div className="adminBusquedaContenedor">
                    <Search size={14} className="adminBusquedaIcono" />
                    <CampoTexto
                        className="adminUsuariosBusqueda"
                        variante="bordado"
                        placeholder={t('admin.buscar.usuarios')}
                        value={busqueda}
                        onChange={(e) => onCambiarBusqueda(e.target.value)}
                    />
                </div>
                <SelectorMenu
                    opciones={OPCIONES_FILTRO_PLAN}
                    valor={filtroPlan}
                    onChange={onCambiarFiltroPlan}
                />
            </div>

            {/* Tabla */}
            <table className="adminTablaUsuarios">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Plan</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Samples</th>
                        <th>Descargas</th>
                        <th>Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.length === 0 && (
                        <tr>
                            <td colSpan={8}>
                                <EstadoVacio
                                    mensaje={t('admin.sinResultados')}
                                    icono={<Search size={24} />}
                                />
                            </td>
                        </tr>
                    )}
                    {usuarios.map((u) => (
                        <tr key={u.id}>
                            <td>
                                <div className="adminUsuarioFila">
                                    <a href={`/perfil/${u.username}/`} target="_blank" rel="noopener noreferrer" className="adminUsuarioPerfilLink" title={t('admin.verPerfil')}>
                                        {u.avatar_url ? (
                                            <img src={u.avatar_url} alt="" className="adminUsuarioAvatar" />
                                        ) : (
                                            <div className="adminUsuarioAvatar" />
                                        )}
                                    </a>
                                    <div className="adminUsuarioInfo">
                                        <a href={`/perfil/${u.username}/`} target="_blank" rel="noopener noreferrer" className="adminUsuarioNombreLink">
                                            <span className="adminUsuarioNombre">
                                                {u.nombre_visible || u.username}
                                                {u.verificado && <BadgeCheck size={12} style={{ marginLeft: '4px', color: 'var(--acento)' }} />}
                                            </span>
                                        </a>
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
                            <td>
                                {(() => {
                                    const est = estadoLabel(u);
                                    return <Badge variante={est.variante}>{est.texto}</Badge>;
                                })()}
                            </td>
                            <td>{u.total_samples}</td>
                            <td>{u.total_descargas}</td>
                            <td>{formatearFecha(u.created_at)}</td>
                            <td>
                                <div className="adminUsuarioAcciones">
                                    <BotonBase variante="ghost"
                                        tamano="ninguno"
                                        className="adminBotonAccion"
                                        title={u.verificado ? 'Quitar verificación' : 'Verificar'}
                                        onClick={() => manejarAccion(u.id, { verificado: !u.verificado })}
                                        disabled={procesando === u.id}
                                        type="button"
                                    >
                                        <BadgeCheck size={14} />
                                    </BotonBase>
                                    <BotonBase variante="ghost"
                                        tamano="ninguno"
                                        className="adminBotonAccion"
                                        title="Cambiar a admin"
                                        onClick={() => manejarAccion(u.id, { rol: u.rol === 'admin' ? 'usuario' : 'admin' })}
                                        disabled={procesando === u.id}
                                        type="button"
                                    >
                                        <Shield size={14} />
                                    </BotonBase>
                                    <BotonBase variante="ghost"
                                        tamano="ninguno"
                                        className={`adminBotonAccion ${u.ban_hasta ? '' : 'adminBotonAccionPeligro'}`}
                                        title={u.ban_hasta ? 'Desbanear' : 'Banear 7 días'}
                                        onClick={() => toggleBan(u)}
                                        disabled={procesando === u.id}
                                        type="button"
                                    >
                                        <Ban size={14} />
                                    </BotonBase>
                                    {/* QQ65: Acciones de suspensión */}
                                    {u.estado === 'suspendido' ? (
                                        <BotonBase variante="ghost"
                                            tamano="ninguno"
                                            className="adminBotonAccion"
                                            title="Levantar suspensión"
                                            onClick={() => suspension.desuspender(u)}
                                            disabled={suspension.procesando}
                                            type="button"
                                        >
                                            <Undo2 size={14} />
                                        </BotonBase>
                                    ) : u.estado === 'en_eliminacion' ? (
                                        <BotonBase variante="ghost"
                                            tamano="ninguno"
                                            className="adminBotonAccion"
                                            title="Cancelar eliminación"
                                            onClick={() => suspension.cancelarEliminacion(u)}
                                            disabled={suspension.procesando}
                                            type="button"
                                        >
                                            <Undo2 size={14} />
                                        </BotonBase>
                                    ) : (
                                        <>
                                            <BotonBase variante="ghost"
                                                tamano="ninguno"
                                                className="adminBotonAccion adminBotonAccionPeligro"
                                                title="Suspender usuario"
                                                onClick={() => suspension.abrirSuspender(u)}
                                                disabled={suspension.procesando}
                                                type="button"
                                            >
                                                <ShieldAlert size={14} />
                                            </BotonBase>
                                            <BotonBase variante="ghost"
                                                tamano="ninguno"
                                                className="adminBotonAccion adminBotonAccionPeligro"
                                                title="Marcar eliminación"
                                                onClick={() => suspension.abrirEliminar(u)}
                                                disabled={suspension.procesando}
                                                type="button"
                                            >
                                                <Trash2 size={14} />
                                            </BotonBase>
                                        </>
                                    )}
                                    {/* Selector de plan */}
                                    <SelectorMenu
                                        compacto
                                        opciones={OPCIONES_PLAN}
                                        valor={u.plan}
                                        onChange={(nuevoPlan) => manejarAccion(u.id, { plan: nuevoPlan })}
                                        disabled={procesando === u.id}
                                    />
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
                    <span className="adminPaginacionTexto">
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

            {/* QQ65: Modal de suspensión/eliminación */}
            <ModalSuspenderAdmin
                accion={suspension.modal.accion}
                usuario={suspension.modal.usuario}
                procesando={suspension.procesando}
                onCerrar={suspension.cerrarModal}
                onConfirmarSuspension={suspension.confirmarSuspension}
                onConfirmarEliminacion={suspension.confirmarEliminacion}
            />
        </div>
    );
};
