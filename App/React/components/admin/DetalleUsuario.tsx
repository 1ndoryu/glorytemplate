/*
 * DetalleUsuario
 *
 * Modal con información detallada de un usuario.
 * Muestra estadísticas de uso y acciones administrativas.
 */

import {useState} from 'react';
import {X, Crown, Calendar, Mail, Shield, CheckCircle, Target, FolderKanban, CreditCard, Clock, Loader2} from 'lucide-react';
import type {UsuarioAdmin} from '../../types/dashboard';

interface DetalleUsuarioProps {
    usuario: UsuarioAdmin;
    onCerrar: () => void;
    onActivarPremium: (duracion?: number) => void;
    onCancelarPremium: () => void;
    onExtenderTrial: (dias: number) => void;
    cargando: boolean;
}

/* Formatear fecha completa */
function formatearFecha(fecha: string | null): string {
    if (!fecha) return 'No disponible';

    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'No disponible';
    }
}

export function DetalleUsuario({usuario, onCerrar, onActivarPremium, onCancelarPremium, onExtenderTrial, cargando}: DetalleUsuarioProps): JSX.Element {
    const [diasExtension, setDiasExtension] = useState(30);
    const [duracionPremium, setDuracionPremium] = useState<number | undefined>(undefined);

    const esPremium = usuario.suscripcion.plan === 'premium' && usuario.suscripcion.estado !== 'expirada';
    const estadisticas = usuario.estadisticas;

    return (
        <div className="detalleUsuarioOverlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
            <div className="detalleUsuarioPanel">
                {/* Encabezado */}
                <div className="detalleEncabezado">
                    <div className="detalleUsuarioInfo">
                        <img src={usuario.avatar} alt={usuario.nombre} className="detalleAvatar" />
                        <div>
                            <h3 className="detalleNombre">{usuario.nombre}</h3>
                            <span className="detalleEmail">
                                <Mail size={12} />
                                {usuario.email}
                            </span>
                        </div>
                    </div>
                    <button type="button" className="detalleCerrarBoton" onClick={onCerrar} title="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                {/* Información de suscripción */}
                <div className="detalleSeccion">
                    <h4 className="detalleSeccionTitulo">
                        <Crown size={14} />
                        Suscripción
                    </h4>
                    <div className="detalleSuscripcion">
                        <div className="detalleItem">
                            <span className="detalleEtiqueta">Plan:</span>
                            <span className={`detallePlan ${usuario.suscripcion.plan}`}>{usuario.suscripcion.plan.toUpperCase()}</span>
                        </div>
                        <div className="detalleItem">
                            <span className="detalleEtiqueta">Estado:</span>
                            <span className={`detalleEstado ${usuario.suscripcion.estado}`}>{usuario.suscripcion.estado}</span>
                        </div>
                        {usuario.suscripcion.diasRestantes !== null && (
                            <div className="detalleItem">
                                <span className="detalleEtiqueta">Días restantes:</span>
                                <span className="detalleValor">{usuario.suscripcion.diasRestantes} días</span>
                            </div>
                        )}
                        <div className="detalleItem">
                            <span className="detalleEtiqueta">Fecha inicio:</span>
                            <span className="detalleValor">{formatearFecha(usuario.suscripcion.fechaInicio)}</span>
                        </div>
                        {usuario.suscripcion.fechaExpiracion && (
                            <div className="detalleItem">
                                <span className="detalleEtiqueta">Expira:</span>
                                <span className="detalleValor">{formatearFecha(usuario.suscripcion.fechaExpiracion)}</span>
                            </div>
                        )}
                        {usuario.suscripcion.ultimoPago && (
                            <div className="detalleItem">
                                <span className="detalleEtiqueta">Último pago:</span>
                                <span className="detalleValor">{formatearFecha(usuario.suscripcion.ultimoPago)}</span>
                            </div>
                        )}
                        {usuario.suscripcion.stripeCustomerId && (
                            <div className="detalleItem">
                                <span className="detalleEtiqueta">Stripe ID:</span>
                                <span className="detalleValor detalleCopiable">{usuario.suscripcion.stripeCustomerId}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estadísticas de uso */}
                {estadisticas && (
                    <div className="detalleSeccion">
                        <h4 className="detalleSeccionTitulo">
                            <Target size={14} />
                            Estadísticas de Uso
                        </h4>
                        <div className="detalleEstadisticas">
                            <div className="estadisticaTarjeta">
                                <CheckCircle size={16} />
                                <span className="estadisticaValor">{estadisticas.habitos}</span>
                                <span className="estadisticaEtiqueta">Hábitos</span>
                            </div>
                            <div className="estadisticaTarjeta">
                                <Target size={16} />
                                <span className="estadisticaValor">{estadisticas.tareas}</span>
                                <span className="estadisticaEtiqueta">Tareas</span>
                            </div>
                            <div className="estadisticaTarjeta">
                                <FolderKanban size={16} />
                                <span className="estadisticaValor">{estadisticas.proyectos}</span>
                                <span className="estadisticaEtiqueta">Proyectos</span>
                            </div>
                            <div className="estadisticaTarjeta">
                                <CheckCircle size={16} />
                                <span className="estadisticaValor">{estadisticas.tareasCompletadas}</span>
                                <span className="estadisticaEtiqueta">Completadas</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Seguridad */}
                <div className="detalleSeccion">
                    <h4 className="detalleSeccionTitulo">
                        <Shield size={14} />
                        Seguridad
                    </h4>
                    <div className="detalleItem">
                        <span className="detalleEtiqueta">Cifrado E2E:</span>
                        <span className={`detalleCifrado ${usuario.cifradoActivo ? 'activo' : ''}`}>{usuario.cifradoActivo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                    <div className="detalleItem">
                        <span className="detalleEtiqueta">Registro:</span>
                        <span className="detalleValor">
                            <Calendar size={12} />
                            {formatearFecha(usuario.fechaRegistro)}
                        </span>
                    </div>
                </div>

                {/* Acciones administrativas */}
                <div className="detalleSeccion detalleAcciones">
                    <h4 className="detalleSeccionTitulo">
                        <CreditCard size={14} />
                        Acciones
                    </h4>

                    {cargando ? (
                        <div className="detalleCargando">
                            <Loader2 size={20} className="animacionRotar" />
                            <span>Procesando...</span>
                        </div>
                    ) : (
                        <div className="accionesContenedor">
                            {esPremium ? (
                                /* Usuario premium: opción de cancelar */
                                <button type="button" className="accionAdminBoton accionCancelar" onClick={onCancelarPremium}>
                                    Cancelar Premium
                                </button>
                            ) : (
                                /* Usuario free: opción de activar */
                                <div className="accionGrupo">
                                    <select value={duracionPremium ?? ''} onChange={e => setDuracionPremium(e.target.value ? Number(e.target.value) : undefined)} className="accionSelect">
                                        <option value="">Ilimitado</option>
                                        <option value="30">30 días</option>
                                        <option value="90">90 días</option>
                                        <option value="180">180 días</option>
                                        <option value="365">1 año</option>
                                    </select>
                                    <button type="button" className="accionAdminBoton accionActivar" onClick={() => onActivarPremium(duracionPremium)}>
                                        Activar Premium
                                    </button>
                                </div>
                            )}

                            {/* Extender trial */}
                            <div className="accionGrupo">
                                <div className="accionInputGrupo">
                                    <Clock size={14} />
                                    <input type="number" min="1" max="365" value={diasExtension} onChange={e => setDiasExtension(Number(e.target.value))} className="accionInput" />
                                    <span>días</span>
                                </div>
                                <button type="button" className="accionAdminBoton accionExtender" onClick={() => onExtenderTrial(diasExtension)}>
                                    Extender Trial
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
