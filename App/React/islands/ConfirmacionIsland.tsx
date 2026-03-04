/**
 * ConfirmacionIsland — Página post-pago de confirmación de reserva.
 */

import { useMemo, useState, useCallback } from 'react';
import { useGloryOptions } from '@/hooks';
import { GloryLink } from '@/core/router/GloryLink';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';
import type { ReservaDetalleResponse } from '@app/types/cresta';

export function ConfirmacionIsland(): JSX.Element {
    const { get } = useGloryOptions();
    const empresaData = get('empresa', {}) as Record<string, string>;
    const telefono = empresaData.telefono || '';
    const email = empresaData.email || '';

    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const reservaId = params.get('reserva_id');

    const [emailInput, setEmailInput] = useState('');
    const [reserva, setReserva] = useState<ReservaDetalleResponse['reserva'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cargado, setCargado] = useState(false);

    const cargarReserva = useCallback(async () => {
        if (!reservaId || !emailInput) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/wp-json/glory/v1/reservas/${reservaId}?email=${encodeURIComponent(emailInput)}`
            );
            const data: ReservaDetalleResponse = await res.json();

            if (data.success && data.reserva) {
                setReserva(data.reserva);
                setCargado(true);
            } else {
                setError(data.error ?? 'No se pudo cargar la reserva.');
            }
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [reservaId, emailInput]);

    return (
        <div className="paginaBase">
            <Header />

            <div className="reservarLayout">
                <div className="reservarContenedor">
                    {/* Icono de éxito */}
                    <div className="confirmacionExito">
                        <div className="confirmacionIcono">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="confirmacionTitulo">¡Reserva confirmada!</h1>
                        <p className="confirmacionSubtitulo">
                            Tu pago se ha procesado correctamente. Recibirás un email con los detalles.
                        </p>
                    </div>

                    {/* Verificar reserva */}
                    {!cargado && reservaId && (
                        <div className="panelBlanco">
                            <h2 className="panelTitulo">Ver detalles de tu reserva</h2>
                            <p className="reservarSubtitulo">Introduce el email con el que realizaste la reserva.</p>
                            <div className="reservarBotones">
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={e => setEmailInput(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="campoInput"
                                />
                                <button
                                    onClick={cargarReserva}
                                    disabled={loading || !emailInput}
                                    className="botonPrimario"
                                >
                                    {loading ? 'Cargando...' : 'Ver'}
                                </button>
                            </div>
                            {error && <p className="campoError">{error}</p>}
                        </div>
                    )}

                    {/* Detalles de la reserva */}
                    {reserva && (
                        <div className="panelBlanco">
                            <h2 className="panelTitulo">Detalles de la reserva</h2>

                            <div className="confirmacionDatosGrid">
                                <InfoRow label="Reserva nº" value={`#${reserva.id}`} />
                                <InfoRow label="Estado" value={
                                    <span className="badgeEstado">{reserva.estado}</span>
                                } />
                                <InfoRow label="Vehículo" value={reserva.vehiculo.nombre} />
                                <InfoRow label="Ubicación" value={reserva.vehiculo.ubicacion} />
                                <InfoRow label="Recogida" value={`${reserva.fechaInicio} a las ${reserva.recogida}`} />
                                <InfoRow label="Devolución" value={`${reserva.fechaFin} a las ${reserva.devolucion}`} />
                                <InfoRow label="Noches" value={`${reserva.noches}`} />
                                <InfoRow label="Total pagado" value={`${reserva.precioTotal.toFixed(2)}€`} highlight />
                            </div>

                            <div className="confirmacionSeparador">
                                <h3 className="panelTitulo">Datos del cliente</h3>
                                <div className="confirmacionDatosGrid">
                                    <InfoRow label="Nombre" value={reserva.nombreCliente} />
                                    <InfoRow label="Email" value={reserva.emailCliente} />
                                    <InfoRow label="Teléfono" value={reserva.telefono} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Qué hacer antes */}
                    <div className="cajaInfo">
                        <h2 className="cajaInfoTitulo">Antes de la recogida</h2>
                        <ul className="cajaInfoLista">
                            <li>Lleva tu DNI/Pasaporte y permiso de conducir.</li>
                            <li>Necesitarás una tarjeta de crédito para la fianza.</li>
                            <li>Recibirás un email con las instrucciones detalladas.</li>
                            <li>Si tienes dudas, no dudes en contactarnos.</li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div className="panelBlanco confirmacionExito">
                        <h2 className="panelTitulo">¿Tienes dudas?</h2>
                        <p className="reservarSubtitulo">Estamos aquí para ayudarte.</p>
                        <div className="contactoMiniBotones">
                            {email && (
                                <a href={`mailto:${email}`} className="contactoMiniBoton">
                                    {email}
                                </a>
                            )}
                            {telefono && (
                                <a href={`tel:${telefono}`} className="contactoMiniBoton">
                                    {telefono}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Volver */}
                    <div className="confirmacionExito">
                        <GloryLink href="/" className="enlaceVolver">
                            ← Volver al inicio
                        </GloryLink>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function InfoRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }): JSX.Element {
    return (
        <div>
            <span className="infoRowLabel">{label}</span>
            <div className={highlight ? 'infoRowValorResaltado' : 'infoRowValor'}>{value}</div>
        </div>
    );
}
