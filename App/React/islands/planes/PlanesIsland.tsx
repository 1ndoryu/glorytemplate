/*
 * Isla: PlanesIsland — Página de planes con Stripe Checkout real.
 * Lógica y datos estáticos extraídos a usePlanesIsland (SRP).
 */

import { Check, X, Loader2, Settings, PartyPopper, ArrowRight, ExternalLink } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { Modal } from '@app/components/ui/Modal';
import { usePlanesIsland, PLANES } from '@app/hooks/usePlanesIsland';
import '../../styles/componentes/planes.css';

export const PlanesIsland = (): JSX.Element => {
    const {
        periodoAnual, setPeriodoAnual, cargando, error, setError, checkoutExito,
        autenticado, planActual, abierto, imagenPlanes, planVisible, esActualVisible,
        obtenerPrecio, obtenerEtiquetaBoton, manejarSeleccion, manejarPortal,
        cerrarModalPlanes, calcularAnual, esApk,
    } = usePlanesIsland();

    if (!abierto) return <></>;

    return (
        <Modal abierto onCerrar={cerrarModalPlanes} tamano="grande" className="modalPlanesEspecial">
            <div className="planesIsland planesIslandModal" id="planesIsland">
                <div className="planesLayoutEspecial">
                    <aside className="planesPanelImagen" id="planesPanelImagen">
                        <img src={imagenPlanes} alt="Visual de planes Kamples" className="planesImagen" loading="lazy" />
                    </aside>

                    <section className="planesPanelContenido" id="planesPanelContenido">
                        {checkoutExito && (
                            <div className="planesAlertaExito">
                                <PartyPopper size={20} />
                                <span>¡Suscripción activada! Tu plan se actualizará en unos segundos.</span>
                            </div>
                        )}

                        {error && (
                            <div className="planesAlertaError">
                                <X size={16} /><span>{error}</span>
                                <BotonBase variante="ghost" onClick={() => setError(null)} className="planesAlertaCerrar">×</BotonBase>
                            </div>
                        )}

                        <div className="planesToggleWrap">
                            <div className="planesToggle">
                                <BotonBase variante="ghost" className={`planesToggleBtn ${!periodoAnual ? 'planesToggleBtnActivo' : ''}`}
                                    onClick={() => setPeriodoAnual(false)}>Mensual</BotonBase>
                                <BotonBase variante="ghost" className={`planesToggleBtn ${periodoAnual ? 'planesToggleBtnActivo' : ''}`}
                                    onClick={() => setPeriodoAnual(true)}>
                                    Anual<Badge>-17%</Badge>
                                </BotonBase>
                            </div>
                        </div>

                        <div className="planesGrid">
                            {PLANES.filter(plan => plan.id === 'pro').map(plan => {
                                const esActual = autenticado && plan.id === planActual;
                                return (
                                    <div key={plan.id} className={`planTarjeta ${plan.destacado ? 'planTarjetaDestacada' : ''} ${esActual ? 'planTarjetaActual' : ''}`}>
                                        {plan.destacado && <div className="planBadgePopular" />}
                                        {esActual && <div className="planBadgeActual"><Badge>Tu plan</Badge></div>}
                                        <div className="planPrecio">
                                            <span className="planPrecioCantidad">{obtenerPrecio(plan)}</span>
                                            {plan.precio > 0 && <span className="planPrecioPeriodo">{periodoAnual ? '/mes (facturado anual)' : '/mes'}</span>}
                                            {periodoAnual && plan.precio > 0 && <span className="planAhorro">Ahorras ${calcularAnual(plan.precio).ahorro}/año</span>}
                                        </div>
                                        <ul className="planCaracteristicas">
                                            {plan.caracteristicas.filter(c => c.incluido).slice(0, 5).map((c) => (
                                                <li key={c.texto} className={`planCaracteristica ${c.incluido ? 'planCaracteristicaIncluida' : 'planCaracteristicaExcluida'}`}>
                                                    {c.incluido ? <Check size={14} /> : <X size={14} />}{c.texto}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>

                        {autenticado && planActual !== 'free' && (
                            <div className="planesPortal">
                                <BotonBase variante="secundario" onClick={manejarPortal} disabled={cargando !== null}>
                                    <Settings size={16} />Gestionar suscripción
                                </BotonBase>
                            </div>
                        )}

                        {planVisible && (
                            <BotonBase variante={planVisible.destacado ? 'primario' : 'secundario'}
                                onClick={() => manejarSeleccion(planVisible.id)}
                                disabled={esActualVisible || cargando !== null} className="planBoton">
                                {cargando === planVisible.id ? (
                                    <><Loader2 size={16} className="planBotonCargando" />Redirigiendo...</>
                                ) : esActualVisible ? (
                                    <><Check size={16} />{obtenerEtiquetaBoton(planVisible.id)}</>
                                ) : esApk ? (
                                    <>Suscríbete en la web<ExternalLink size={16} /></>
                                ) : (
                                    <>{obtenerEtiquetaBoton(planVisible.id)}<ArrowRight size={16} /></>
                                )}
                            </BotonBase>
                        )}
                    </section>
                </div>
            </div>
        </Modal>
    );
};

export default PlanesIsland;
