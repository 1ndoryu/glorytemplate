/*
 * FilaUsuario
 *
 * Fila individual de la tabla de usuarios.
 * Muestra información del usuario y acciones rápidas.
 */

import {Crown, Eye, CreditCard, XCircle, Loader2} from 'lucide-react';
import type {UsuarioAdmin} from '../../types/dashboard';

interface FilaUsuarioProps {
    usuario: UsuarioAdmin;
    onVerDetalle: () => void;
    onActivarPremium: () => void;
    onCancelarPremium: () => void;
    cargando: boolean;
}

/* Formatear fecha para mostrar */
function formatearFecha(fecha: string | null): string {
    if (!fecha) return '-';

    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

/* Obtener badge de plan */
function getBadgePlan(plan: string, estado: string): {clase: string; texto: string} {
    if (plan === 'premium' && estado === 'trial') {
        return {clase: 'badgeTrial', texto: 'TRIAL'};
    }
    if (plan === 'premium') {
        return {clase: 'badgePremium', texto: 'PREMIUM'};
    }
    return {clase: 'badgeFree', texto: 'FREE'};
}

/* Obtener badge de estado */
function getBadgeEstado(estado: string): {clase: string; texto: string} {
    switch (estado) {
        case 'activa':
            return {clase: 'estadoActiva', texto: 'Activa'};
        case 'trial':
            return {clase: 'estadoTrial', texto: 'Trial'};
        case 'expirada':
            return {clase: 'estadoExpirada', texto: 'Expirada'};
        default:
            return {clase: 'estadoNormal', texto: estado};
    }
}

export function FilaUsuario({usuario, onVerDetalle, onActivarPremium, onCancelarPremium, cargando}: FilaUsuarioProps): JSX.Element {
    const badgePlan = getBadgePlan(usuario.suscripcion.plan, usuario.suscripcion.estado);
    const badgeEstado = getBadgeEstado(usuario.suscripcion.estado);
    const esPremium = usuario.suscripcion.plan === 'premium' && usuario.suscripcion.estado !== 'expirada';

    return (
        <div className="filaUsuario">
            {/* Usuario: Avatar + Info */}
            <div className="celdaUsuario">
                <img src={usuario.avatar} alt={usuario.nombre} className="usuarioAvatar" />
                <div className="usuarioInfo">
                    <span className="usuarioNombre">{usuario.nombre}</span>
                    <span className="usuarioEmail">{usuario.email}</span>
                </div>
            </div>

            {/* Plan */}
            <div className="celdaPlan">
                <span className={`planBadge ${badgePlan.clase}`}>
                    {badgePlan.texto === 'PREMIUM' && <Crown size={12} />}
                    {badgePlan.texto}
                </span>
            </div>

            {/* Estado */}
            <div className="celdaEstado">
                <span className={`estadoBadge ${badgeEstado.clase}`}>{badgeEstado.texto}</span>
                {usuario.suscripcion.diasRestantes !== null && <span className="estadoDias">{usuario.suscripcion.diasRestantes}d</span>}
            </div>

            {/* Fecha registro */}
            <div className="celdaFecha">{formatearFecha(usuario.fechaRegistro)}</div>

            {/* Acciones */}
            <div className="celdaAcciones">
                {cargando ? (
                    <Loader2 size={16} className="animacionRotar" />
                ) : (
                    <>
                        <button type="button" className="accionBoton accionVer" onClick={onVerDetalle} title="Ver detalle">
                            <Eye size={14} />
                        </button>

                        {esPremium ? (
                            <button type="button" className="accionBoton accionCancelar" onClick={onCancelarPremium} title="Cancelar premium">
                                <XCircle size={14} />
                            </button>
                        ) : (
                            <button type="button" className="accionBoton accionActivar" onClick={onActivarPremium} title="Activar premium">
                                <CreditCard size={14} />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
