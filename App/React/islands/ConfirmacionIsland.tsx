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
    const empresa = empresaData.nombre || 'Cresta Campers';
    const telefono = empresaData.telefono || '';
    const email = empresaData.email || '';

    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const reservaId = params.get('reserva_id');
    const sessionId = params.get('session_id');

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
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="pt-24 pb-20">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Icono de éxito */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Reserva confirmada!</h1>
                        <p className="text-gray-500 text-lg">
                            Tu pago se ha procesado correctamente. Recibirás un email con los detalles.
                        </p>
                    </div>

                    {/* Verificar reserva */}
                    {!cargado && reservaId && (
                        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                            <h2 className="font-bold text-gray-900 mb-3">Ver detalles de tu reserva</h2>
                            <p className="text-sm text-gray-500 mb-4">Introduce el email con el que realizaste la reserva.</p>
                            <div className="flex gap-3">
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={e => setEmailInput(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    onClick={cargarReserva}
                                    disabled={loading || !emailInput}
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition disabled:opacity-50"
                                >
                                    {loading ? 'Cargando...' : 'Ver'}
                                </button>
                            </div>
                            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                        </div>
                    )}

                    {/* Detalles de la reserva */}
                    {reserva && (
                        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 space-y-4">
                            <h2 className="font-bold text-gray-900 text-lg">Detalles de la reserva</h2>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <InfoRow label="Reserva nº" value={`#${reserva.id}`} />
                                <InfoRow label="Estado" value={
                                    <span className="inline-block bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full text-xs uppercase">
                                        {reserva.estado}
                                    </span>
                                } />
                                <InfoRow label="Vehículo" value={reserva.vehiculo.nombre} />
                                <InfoRow label="Ubicación" value={reserva.vehiculo.ubicacion} />
                                <InfoRow label="Recogida" value={`${reserva.fechaInicio} a las ${reserva.recogida}`} />
                                <InfoRow label="Devolución" value={`${reserva.fechaFin} a las ${reserva.devolucion}`} />
                                <InfoRow label="Noches" value={`${reserva.noches}`} />
                                <InfoRow label="Total pagado" value={`${reserva.precioTotal.toFixed(2)}€`} highlight />
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="font-medium text-gray-700 mb-2">Datos del cliente</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <InfoRow label="Nombre" value={reserva.nombreCliente} />
                                    <InfoRow label="Email" value={reserva.emailCliente} />
                                    <InfoRow label="Teléfono" value={reserva.telefono} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Qué hacer antes */}
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                        <h2 className="font-bold text-green-800 mb-3">Antes de la recogida</h2>
                        <ul className="space-y-2 text-sm text-green-700">
                            <li className="flex gap-2">📋 Lleva tu DNI/Pasaporte y permiso de conducir.</li>
                            <li className="flex gap-2">💳 Necesitarás una tarjeta de crédito para la fianza.</li>
                            <li className="flex gap-2">📧 Recibirás un email con las instrucciones detalladas.</li>
                            <li className="flex gap-2">📞 Si tienes dudas, no dudes en contactarnos.</li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div className="bg-white rounded-2xl shadow-md p-6 text-center">
                        <h2 className="font-bold text-gray-900 mb-2">¿Tienes dudas?</h2>
                        <p className="text-gray-500 text-sm mb-3">Estamos aquí para ayudarte.</p>
                        <div className="flex flex-col md:flex-row justify-center gap-3">
                            {email && (
                                <a href={`mailto:${email}`} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition">
                                    📧 {email}
                                </a>
                            )}
                            {telefono && (
                                <a href={`tel:${telefono}`} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition">
                                    📞 {telefono}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Volver */}
                    <div className="text-center mt-8">
                        <GloryLink href="/" className="text-green-600 hover:text-green-700 font-medium">
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
            <span className="text-gray-400 text-xs">{label}</span>
            <div className={`font-medium ${highlight ? 'text-green-600 text-lg' : 'text-gray-800'}`}>{value}</div>
        </div>
    );
}
