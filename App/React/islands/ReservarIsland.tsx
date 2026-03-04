/**
 * ReservarIsland — Flujo de reserva multi-step.
 * Paso 1: Confirmar fechas + vehículo
 * Paso 2: Resumen de precio
 * Paso 3: Datos del cliente
 * Paso 4: Redirigir a Stripe Checkout
 */

import { useState, useCallback, useMemo } from 'react';
import { useWordPressApi, useGloryOptions } from '@/hooks';
import { SelectorFechas } from '@app/components/SelectorFechas';
import { ResumenPrecio } from '@app/components/ResumenPrecio';
import { useDisponibilidad } from '@app/hooks/useDisponibilidad';
import { useReserva } from '@app/hooks/useReserva';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';
import type { VehiculosListResponse, Vehiculo, DatosCliente, CalculoPrecio } from '@app/types/cresta';

type Paso = 1 | 2 | 3 | 4;

export function ReservarIsland(): JSX.Element {
    const { get } = useGloryOptions();
    const reservasConfig = get('reservas', {}) as Record<string, string>;
    const horarioRecogida = reservasConfig.horarioRecogida || '16:00';
    const horarioDevolucion = reservasConfig.horarioDevolucion || '10:00';

    // Parse URL params
    const params = useMemo(() => new URLSearchParams(window.location.search), []);

    const [paso, setPaso] = useState<Paso>(1);
    const [vehiculoId, setVehiculoId] = useState<number>(Number(params.get('vehiculo_id')) || 0);
    const [fechaInicio, setFechaInicio] = useState(params.get('inicio') ?? '');
    const [fechaFin, setFechaFin] = useState(params.get('fin') ?? '');
    const [precioCalculado, setPrecioCalculado] = useState<CalculoPrecio | null>(null);
    const [fianza, setFianza] = useState(0);

    const [datosCliente, setDatosCliente] = useState<DatosCliente>({
        nombre: '', email: '', telefono: '', notas: '',
    });
    const [erroresForm, setErroresForm] = useState<Record<string, string>>({});

    // Fetch vehículos
    const { data: vehiculosData } = useWordPressApi<VehiculosListResponse>('/glory/v1/vehiculos');
    const vehiculos = vehiculosData?.vehiculos ?? [];
    const vehiculoSeleccionado = vehiculos.find(v => v.id === vehiculoId);

    // Hooks
    const { disponible, precio, motivo, loading: loadingDisp, verificar } = useDisponibilidad(vehiculoId);
    const { crear, loading: loadingReserva, error: errorReserva, checkoutUrl } = useReserva();

    // Verificar disponibilidad al cambiar fechas
    const handleContinuarPaso1 = useCallback(async () => {
        if (!vehiculoId || !fechaInicio || !fechaFin) return;

        const result = await verificar(fechaInicio, fechaFin);
        if (result?.disponible && result.precio) {
            setPrecioCalculado(result.precio);
            setFianza(result.vehiculo?.fianza ?? 0);
            setPaso(2);
        }
    }, [vehiculoId, fechaInicio, fechaFin, verificar]);

    // Validar datos cliente
    const validarDatos = useCallback((): boolean => {
        const errores: Record<string, string> = {};
        if (!datosCliente.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
        if (!datosCliente.email.trim()) errores.email = 'El email es obligatorio.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosCliente.email)) errores.email = 'Email inválido.';
        if (!datosCliente.telefono.trim()) errores.telefono = 'El teléfono es obligatorio.';
        setErroresForm(errores);
        return Object.keys(errores).length === 0;
    }, [datosCliente]);

    // Crear reserva y redirigir a Stripe
    const handleReservar = useCallback(async () => {
        if (!validarDatos()) return;

        const result = await crear({
            vehiculo_id: vehiculoId,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            ...datosCliente,
        });

        if (result?.success && result.checkoutUrl) {
            setPaso(4);
            // Redirigir a Stripe Checkout
            window.location.href = result.checkoutUrl;
        }
    }, [validarDatos, crear, vehiculoId, fechaInicio, fechaFin, datosCliente]);

    // Si viene de Stripe cancelado
    const cancelado = params.get('cancelado') === '1';

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="pt-24 pb-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    {/* Título */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reservar tu furgoneta</h1>
                        <p className="text-gray-500">Completa los pasos para finalizar tu reserva.</p>
                    </div>

                    {cancelado && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800">
                            El pago fue cancelado. Puedes intentarlo de nuevo.
                        </div>
                    )}

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mb-10">
                        {[1, 2, 3, 4].map(p => (
                            <div key={p} className="flex-1 flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                                    p <= paso ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {p < paso ? '✓' : p}
                                </div>
                                {p < 4 && <div className={`flex-1 h-1 rounded-full ${p < paso ? 'bg-green-600' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Paso 1: Selección */}
                    {paso === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Selecciona tu furgoneta y fechas</h2>

                            {/* Selector de vehículo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Furgoneta</label>
                                <select
                                    value={vehiculoId}
                                    onChange={e => setVehiculoId(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-green-500"
                                >
                                    <option value={0}>Selecciona una furgoneta...</option>
                                    {vehiculos.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.nombre} — desde {v.precioBase}€/noche
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fechas */}
                            <SelectorFechas
                                fechaInicio={fechaInicio}
                                fechaFin={fechaFin}
                                onChange={(i, f) => { setFechaInicio(i); setFechaFin(f); }}
                            />

                            {/* Info horarios */}
                            <div className="text-sm text-gray-500 bg-gray-100 rounded-xl p-4">
                                📌 Recogida a las <strong>{horarioRecogida}</strong> · Devolución a las <strong>{horarioDevolucion}</strong>
                            </div>

                            {disponible === false && motivo && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
                                    {motivo}
                                </div>
                            )}

                            <button
                                onClick={handleContinuarPaso1}
                                disabled={!vehiculoId || !fechaInicio || !fechaFin || loadingDisp}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition text-lg"
                            >
                                {loadingDisp ? 'Verificando disponibilidad...' : 'Continuar'}
                            </button>
                        </div>
                    )}

                    {/* Paso 2: Resumen precio */}
                    {paso === 2 && precioCalculado && vehiculoSeleccionado && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Resumen de tu reserva</h2>

                            {/* Info del vehículo */}
                            <div className="bg-white rounded-2xl shadow-md p-6 flex gap-4 items-center">
                                {vehiculoSeleccionado.imagen && (
                                    <img src={vehiculoSeleccionado.imagen} alt={vehiculoSeleccionado.nombre}
                                        className="w-24 h-16 rounded-lg object-cover" />
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-900">{vehiculoSeleccionado.nombre}</h3>
                                    <p className="text-sm text-gray-500">
                                        {fechaInicio} → {fechaFin}
                                    </p>
                                </div>
                            </div>

                            <ResumenPrecio calculo={precioCalculado} fianza={fianza} />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPaso(1)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition"
                                >
                                    ← Atrás
                                </button>
                                <button
                                    onClick={() => setPaso(3)}
                                    className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Datos del cliente */}
                    {paso === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Tus datos</h2>

                            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
                                <InputField
                                    label="Nombre completo"
                                    value={datosCliente.nombre}
                                    onChange={v => setDatosCliente(d => ({ ...d, nombre: v }))}
                                    error={erroresForm.nombre}
                                    placeholder="Tu nombre y apellidos"
                                />
                                <InputField
                                    label="Email"
                                    type="email"
                                    value={datosCliente.email}
                                    onChange={v => setDatosCliente(d => ({ ...d, email: v }))}
                                    error={erroresForm.email}
                                    placeholder="tu@email.com"
                                />
                                <InputField
                                    label="Teléfono"
                                    type="tel"
                                    value={datosCliente.telefono}
                                    onChange={v => setDatosCliente(d => ({ ...d, telefono: v }))}
                                    error={erroresForm.telefono}
                                    placeholder="+34 600 000 000"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                                    <textarea
                                        value={datosCliente.notas ?? ''}
                                        onChange={e => setDatosCliente(d => ({ ...d, notas: e.target.value }))}
                                        rows={3}
                                        placeholder="¿Alguna petición especial?"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-green-500 resize-none"
                                    />
                                </div>
                            </div>

                            {errorReserva && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
                                    {errorReserva}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPaso(2)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition"
                                >
                                    ← Atrás
                                </button>
                                <button
                                    onClick={handleReservar}
                                    disabled={loadingReserva}
                                    className="flex-[2] bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition text-lg"
                                >
                                    {loadingReserva ? 'Procesando...' : 'Pagar con tarjeta 💳'}
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 text-center">
                                Serás redirigido a Stripe para completar el pago de forma segura.
                            </p>
                        </div>
                    )}

                    {/* Paso 4: Redireccionando */}
                    {paso === 4 && (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-6" />
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Redirigiendo a Stripe...</h2>
                            <p className="text-gray-500">Estás siendo redirigido a la pasarela de pago seguro.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

/* ------------------------------------------------------------------ */

function InputField({
    label, value, onChange, error, type = 'text', placeholder,
}: {
    label: string; value: string; onChange: (v: string) => void;
    error?: string; type?: string; placeholder?: string;
}): JSX.Element {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full border rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-green-500 ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
}
