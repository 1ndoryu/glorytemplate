/*
 * ModalCambiarPlan: Permite cambiar entre plan mensual y anual.
 * Muestra la diferencia de precio y confirma el cambio.
 */

import React from 'react';
import {X, Check, AlertCircle, Calendar, ArrowRight} from 'lucide-react';
import {Boton} from '../../../ui/Boton';
import {HostingContratado} from '../../../../data/types/hosting';

interface ModalCambiarPlanProps {
    hosting: HostingContratado | null;
    visible: boolean;
    onCerrar: () => void;
    onConfirmar: (nuevoPlan: 'mensual' | 'anual') => void;
}

export const ModalCambiarPlan: React.FC<ModalCambiarPlanProps> = ({hosting, visible, onCerrar, onConfirmar}) => {
    if (!visible || !hosting) return null;

    const planActual = hosting.plan;
    const nuevoPlan = planActual === 'mensual' ? 'anual' : 'mensual';

    // Precios de ejemplo o del hosting
    const precioActual = planActual === 'mensual' ? hosting.precioMensual : hosting.precioAnual;
    const precioNuevo = nuevoPlan === 'mensual' ? hosting.precioMensual : hosting.precioAnual;

    // Calcular ahorro si pasa a anual
    const ahorro = hosting.precioMensual * 12 - hosting.precioAnual;
    const mostrarAhorro = nuevoPlan === 'anual' && ahorro > 0;

    return (
        <div className="modalOverlay" onClick={onCerrar}>
            <div className="modalVentana" onClick={e => e.stopPropagation()}>
                <header className="modalHeader">
                    <div className="modalTituloWrapper">
                        <Calendar size={20} />
                        <h2 className="modalTitulo">Cambiar Plan de Hosting</h2>
                    </div>
                    <button className="modalCerrar" onClick={onCerrar}>
                        <X size={18} />
                    </button>
                </header>

                <div className="modalContenido">
                    <div className="cambioPlanContainer" style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        <p className="cambioPlanDescripcion" style={{color: 'var(--nakomi-textoSecundario)'}}>
                            Estás a punto de cambiar el ciclo de facturación para el dominio <strong>{hosting.dominio}</strong>.
                        </p>

                        <div className="planesComparacion" style={{display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'center'}}>
                            <div className="planCard actual" style={{padding: '15px', borderRadius: '8px', border: '1px solid var(--nakomi-bordePrincipal)', background: 'var(--nakomi-fondoTerciario)'}}>
                                <span style={{display: 'block', fontSize: '12px', color: 'var(--nakomi-textoApagado)', textTransform: 'uppercase'}}>Actual</span>
                                <strong style={{display: 'block', fontSize: '16px', color: 'var(--nakomi-textoActivo)', margin: '5px 0'}}>{planActual === 'mensual' ? 'Mensual' : 'Anual'}</strong>
                                <span style={{fontSize: '14px', color: 'var(--nakomi-textoNormal)'}}>
                                    ${precioActual}/{planActual === 'mensual' ? 'mes' : 'año'}
                                </span>
                            </div>

                            <ArrowRight size={24} style={{color: 'var(--nakomi-textoApagado)'}} />

                            <div className="planCard nuevo" style={{padding: '15px', borderRadius: '8px', border: '1px solid var(--nakomi-acento)', background: 'var(--nakomi-infoFondo)'}}>
                                <span style={{display: 'block', fontSize: '12px', color: 'var(--nakomi-acento)', textTransform: 'uppercase', fontWeight: 600}}>Nuevo</span>
                                <strong style={{display: 'block', fontSize: '16px', color: 'var(--nakomi-textoActivo)', margin: '5px 0'}}>{nuevoPlan === 'mensual' ? 'Mensual' : 'Anual'}</strong>
                                <span style={{fontSize: '14px', color: 'var(--nakomi-textoNormal)'}}>
                                    ${precioNuevo}/{nuevoPlan === 'mensual' ? 'mes' : 'año'}
                                </span>
                            </div>
                        </div>

                        {mostrarAhorro && (
                            <div className="alertaAhorro" style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--nakomi-exitoBorde)', borderRadius: '8px', color: 'var(--nakomi-exito)'}}>
                                <Check size={16} />
                                <span>
                                    ¡Ahorrarás <strong>${ahorro} al año</strong> cambiando al plan anual!
                                </span>
                            </div>
                        )}

                        <div className="infoCambio" style={{display: 'flex', gap: '10px', fontSize: '13px', color: 'var(--nakomi-textoSecundario)', marginTop: '10px'}}>
                            <AlertCircle size={16} style={{flexShrink: 0}} />
                            <p>El cambio se aplicará en la próxima fecha de renovación ({new Date(hosting.fechaProximaRenovacion).toLocaleDateString()}). Se generará una nueva factura con el monto actualizado.</p>
                        </div>
                    </div>
                </div>

                <footer className="modalFooter">
                    <Boton variante="ghost" onClick={onCerrar}>
                        Cancelar
                    </Boton>
                    <Boton variante="solid" onClick={() => onConfirmar(nuevoPlan)}>
                        Confirmar Cambio
                    </Boton>
                </footer>
            </div>
        </div>
    );
};
