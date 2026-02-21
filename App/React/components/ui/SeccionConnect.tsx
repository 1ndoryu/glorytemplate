/*
 * SeccionConnect — Componente de Stripe Connect para DashboardCreador.
 * Muestra estado de cuenta, onboarding pendiente, balance y acciones.
 */

import {
    CreditCard,
    ExternalLink,
    AlertCircle,
    CheckCircle,
    Loader2,
    Wallet,
    DollarSign,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import type { DatosConnect, BalanceConnect } from '@app/services/apiPagos';

interface SeccionConnectProps {
    estadoConnect: DatosConnect | null;
    balanceConnect: BalanceConnect | null;
    conectando: boolean;
    onIniciarOnboarding: () => void;
    onAbrirDashboard: () => void;
}

export const SeccionConnect = ({
    estadoConnect,
    balanceConnect,
    conectando,
    onIniciarOnboarding,
    onAbrirDashboard,
}: SeccionConnectProps): JSX.Element => {
    if (!estadoConnect) return <></>;

    const { estado, cargosActivos, payoutsActivos, detalle, requerimientosPendientes } = estadoConnect;

    return (
        <div className="dashboardSeccion dashboardConnect">
            <h2 className="dashboardSeccionTitulo">
                <CreditCard size={16} />
                Configuración de pagos
            </h2>

            <div className="dashboardConnectEstado">
                {estado === 'no_configurado' && (
                    <div className="dashboardConnectBanner dashboardConnectBannerInfo">
                        <AlertCircle size={16} />
                        <div className="dashboardConnectBannerTexto">
                            <strong>Configura Stripe para recibir pagos</strong>
                            <span>Conecta tu cuenta de Stripe para empezar a ganar dinero con tus samples.</span>
                        </div>
                        <BotonBase
                            variante="primario"
                            tamano="sm"
                            onClick={onIniciarOnboarding}
                            disabled={conectando}
                        >
                            {conectando ? (
                                <><Loader2 size={14} className="dashboardSpinner" /> Conectando...</>
                            ) : (
                                <><CreditCard size={14} /> Configurar Stripe</>
                            )}
                        </BotonBase>
                    </div>
                )}

                {estado === 'pendiente' && (
                    <div className="dashboardConnectBanner dashboardConnectBannerAdvertencia">
                        <AlertCircle size={16} />
                        <div className="dashboardConnectBannerTexto">
                            <strong>Onboarding incompleto</strong>
                            <span>
                                Tienes {requerimientosPendientes ?? 0} dato(s) pendiente(s) por completar en Stripe.
                            </span>
                        </div>
                        <BotonBase
                            variante="secundario"
                            tamano="sm"
                            onClick={onIniciarOnboarding}
                            disabled={conectando}
                        >
                            {conectando ? (
                                <><Loader2 size={14} className="dashboardSpinner" /> Cargando...</>
                            ) : (
                                <>Completar configuración</>
                            )}
                        </BotonBase>
                    </div>
                )}

                {estado === 'activo' && (
                    <div className="dashboardConnectBanner dashboardConnectBannerExito">
                        <CheckCircle size={16} />
                        <div className="dashboardConnectBannerTexto">
                            <strong>Stripe conectado</strong>
                            <span>
                                {cargosActivos && payoutsActivos
                                    ? 'Tu cuenta está activa y recibiendo pagos.'
                                    : 'Tu cuenta está configurada.'}
                            </span>
                        </div>
                        <BotonBase variante="ghost" tamano="sm" onClick={onAbrirDashboard}>
                            <ExternalLink size={14} /> Ver dashboard Stripe
                        </BotonBase>
                    </div>
                )}

                {estado === 'restringido' && (
                    <div className="dashboardConnectBanner dashboardConnectBannerAdvertencia">
                        <AlertCircle size={16} />
                        <div className="dashboardConnectBannerTexto">
                            <strong>Cuenta restringida</strong>
                            <span>{detalle ?? 'Stripe requiere información adicional para activar los pagos.'}</span>
                        </div>
                        <BotonBase variante="secundario" tamano="sm" onClick={onIniciarOnboarding}>
                            Actualizar información
                        </BotonBase>
                    </div>
                )}
            </div>

            {/* Balance cuando la cuenta está activa */}
            {estado === 'activo' && balanceConnect && (
                <div className="dashboardConnectBalance">
                    <div className="dashboardConnectBalanceItem">
                        <Wallet size={14} />
                        <span className="dashboardConnectBalanceLabel">Disponible</span>
                        <span className="dashboardConnectBalanceMonto">
                            ${balanceConnect.disponible.toFixed(2)}
                        </span>
                    </div>
                    <div className="dashboardConnectBalanceItem">
                        <DollarSign size={14} />
                        <span className="dashboardConnectBalanceLabel">Pendiente</span>
                        <span className="dashboardConnectBalanceMonto dashboardConnectBalancePendiente">
                            ${balanceConnect.pendiente.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeccionConnect;
