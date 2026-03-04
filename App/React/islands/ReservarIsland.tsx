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
import type { VehiculosListResponse, DatosCliente, CalculoPrecio } from '@app/types/cresta';

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
    const { disponible, motivo, loading: loadingDisp, verificar } = useDisponibilidad(vehiculoId);
    const { crear, loading: loadingReserva, error: errorReserva } = useReserva();

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
        <div className="paginaBase">
            <Header />

            <div className="reservarLayout">
                <div className="reservarContenedor">
                    {/* Título */}
                    <div>
                        <h1 className="reservarTitulo">Reservar tu furgoneta</h1>
                        <p className="reservarSubtitulo">Completa los pasos para finalizar tu reserva.</p>
                    </div>

                    {cancelado && (
                        <div className="alertaAviso">
                            El pago fue cancelado. Puedes intentarlo de nuevo.
                        </div>
                    )}

                    {/* Progress bar */}
                    <div className="progressBar">
                        {[1, 2, 3, 4].map(p => (
                            <div key={p} className="progressPaso">
                                <div className={`progressCirculo ${p <= paso ? 'progressCirculoActivo' : 'progressCirculoInactivo'}`}>
                                    {p < paso ? '✓' : p}
                                </div>
                                {p < 4 && <div className={`progressLinea ${p < paso ? 'progressLineaActiva' : 'progressLineaInactiva'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Paso 1: Selección */}
                    {paso === 1 && (
                        <div className="reservarPasoContenido">
                            <h2 className="reservarPasoTitulo">Selecciona tu furgoneta y fechas</h2>

                            {/* Selector de vehículo */}
                            <div>
                                <label className="campoLabel">Furgoneta</label>
                                <select
                                    value={vehiculoId}
                                    onChange={e => setVehiculoId(Number(e.target.value))}
                                    className="campoInput"
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
                            <div className="alertaInfo">
                                Recogida a las <strong>{horarioRecogida}</strong> · Devolución a las <strong>{horarioDevolucion}</strong>
                            </div>

                            {disponible === false && motivo && (
                                <div className="alertaError">{motivo}</div>
                            )}

                            <button
                                onClick={handleContinuarPaso1}
                                disabled={!vehiculoId || !fechaInicio || !fechaFin || loadingDisp}
                                className="botonPrimario"
                            >
                                {loadingDisp ? 'Verificando disponibilidad...' : 'Continuar'}
                            </button>
                        </div>
                    )}

                    {/* Paso 2: Resumen precio */}
                    {paso === 2 && precioCalculado && vehiculoSeleccionado && (
                        <div className="reservarPasoContenido">
                            <h2 className="reservarPasoTitulo">Resumen de tu reserva</h2>

                            {/* Info del vehículo */}
                            <div className="reservarVehiculoResumen">
                                {vehiculoSeleccionado.imagen && (
                                    <img src={vehiculoSeleccionado.imagen} alt={vehiculoSeleccionado.nombre}
                                        className="reservarVehiculoImg" />
                                )}
                                <div>
                                    <h3 className="reservarVehiculoNombre">{vehiculoSeleccionado.nombre}</h3>
                                    <p className="reservarVehiculoFechas">
                                        {fechaInicio} → {fechaFin}
                                    </p>
                                </div>
                            </div>

                            <ResumenPrecio calculo={precioCalculado} fianza={fianza} />

                            <div className="reservarBotones">
                                <button
                                    onClick={() => setPaso(1)}
                                    className="reservarBotonAtras"
                                >
                                    ← Atrás
                                </button>
                                <button
                                    onClick={() => setPaso(3)}
                                    className="reservarBotonContinuar botonPrimario"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Datos del cliente */}
                    {paso === 3 && (
                        <div className="reservarPasoContenido">
                            <h2 className="reservarPasoTitulo">Tus datos</h2>

                            <div className="formulario">
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
                                    <label className="campoLabel">Notas (opcional)</label>
                                    <textarea
                                        value={datosCliente.notas ?? ''}
                                        onChange={e => setDatosCliente(d => ({ ...d, notas: e.target.value }))}
                                        rows={3}
                                        placeholder="¿Alguna petición especial?"
                                        className="campoTextarea"
                                    />
                                </div>
                            </div>

                            {errorReserva && (
                                <div className="alertaError">{errorReserva}</div>
                            )}

                            <div className="reservarBotones">
                                <button
                                    onClick={() => setPaso(2)}
                                    className="reservarBotonAtras"
                                >
                                    ← Atrás
                                </button>
                                <button
                                    onClick={handleReservar}
                                    disabled={loadingReserva}
                                    className="reservarBotonContinuar botonPrimario"
                                >
                                    {loadingReserva ? 'Procesando...' : 'Pagar con tarjeta'}
                                </button>
                            </div>

                            <p className="reservarRedireccionarTexto">
                                Serás redirigido a Stripe para completar el pago de forma segura.
                            </p>
                        </div>
                    )}

                    {/* Paso 4: Redireccionando */}
                    {paso === 4 && (
                        <div className="reservarRedireccionar">
                            <div className="cargandoSpinner" />
                            <h2 className="reservarRedireccionarTitulo">Redirigiendo a Stripe...</h2>
                            <p className="reservarRedireccionarTexto">Estás siendo redirigido a la pasarela de pago seguro.</p>
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
            <label className="campoLabel">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`campoInput${error ? ' campoInputError' : ''}`}
            />
            {error && <p className="campoError">{error}</p>}
        </div>
    );
}
