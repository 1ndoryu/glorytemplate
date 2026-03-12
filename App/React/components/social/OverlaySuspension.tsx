/*
 * Componente: OverlaySuspension — QQ65
 * Overlay a pantalla completa que bloquea la interfaz para usuarios suspendidos.
 * Muestra razón, countdown y opciones: contactar o cerrar sesión.
 */

import { useOverlaySuspension } from '@app/hooks/useOverlaySuspension';
import { BotonBase } from '../ui/BotonBase';
import { ShieldAlert, LogOut, Clock, Trash2 } from 'lucide-react';
import '@app/styles/componentes/overlaySuspension.css';

export const OverlaySuspension = (): JSX.Element | null => {
    const { visible, suspension, textoTiempo, cerrarSesion } = useOverlaySuspension();

    if (!visible || !suspension) return null;

    const enEliminacion = suspension.estado === 'en_eliminacion';

    return (
        <div className="overlaySuspension">
            <div className="overlaySuspensionContenido">
                <div className="overlaySuspensionIcono">
                    {enEliminacion ? <Trash2 size={48} /> : <ShieldAlert size={48} />}
                </div>

                <h2 className="overlaySuspensionTitulo">
                    {enEliminacion
                        ? 'Tu cuenta será eliminada'
                        : 'Cuenta suspendida'}
                </h2>

                {suspension.razon && (
                    <p className="overlaySuspensionRazon">
                        {suspension.razon}
                    </p>
                )}

                {suspension.suspendidoHasta && (
                    <div className="overlaySuspensionTimer">
                        <Clock size={16} />
                        <span>Tiempo restante: <strong>{textoTiempo}</strong></span>
                    </div>
                )}

                {enEliminacion && suspension.seraEliminadoEn && (
                    <div className="overlaySuspensionTimer overlaySuspensionTimerPeligro">
                        <Trash2 size={16} />
                        <span>
                            Eliminación programada: {new Date(suspension.seraEliminadoEn).toLocaleDateString('es', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </span>
                    </div>
                )}

                <div className="overlaySuspensionAcciones">
                    <BotonBase
                        variante="primario"
                        onClick={cerrarSesion}
                        type="button"
                    >
                        <LogOut size={16} />
                        Cerrar sesión
                    </BotonBase>
                </div>

                <p className="overlaySuspensionNota">
                    Si crees que esto es un error, contacta al soporte.
                </p>
            </div>
        </div>
    );
};
