/**
 * ReservarIsland — Flujo de reserva multi-step.
 * Paso 1: Confirmar fechas + vehículo
 * Paso 2: Resumen de precio
 * Paso 3: Datos del cliente
 * Paso 4: Redirigir a Stripe Checkout
 */

import { SelectorFechas } from '@app/components/SelectorFechas';
import { SelectVehiculo } from '@app/components/SelectVehiculo';
import { ResumenPrecio } from '@app/components/ResumenPrecio';
import { Boton } from '@app/components/ui/Boton';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { CampoTextarea } from '@app/components/ui/CampoTextarea';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';
import { useReservarFlujo } from '@app/hooks/useReservarFlujo';
import { Check } from 'lucide-react';

export function ReservarIsland(): JSX.Element {
    const {
        horarioRecogida, horarioDevolucion,
        paso, setPaso,
        vehiculos, vehiculoId, setVehiculoId, vehiculoSeleccionado,
        fechaInicio, setFechaInicio, fechaFin, setFechaFin,
        precioCalculado, fianza,
        datosCliente, setDatosCliente, erroresForm,
        disponible, motivo, loadingDisp,
        loadingReserva, errorReserva,
        handleContinuarPaso1, handleReservar,
        cancelado,
    } = useReservarFlujo();

    return (
        <div className="paginaBase">
            <Header />

            <div className="reservarLayout">
                <div className="reservarContenedor">
                    {/* Título */}
                    <div className="reservarCabecera">
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
                            <div key={p} className={`progressPaso${p === 4 ? ' progressPasoFinal' : ''}`}>
                                <div className={`progressCirculo ${p <= paso ? 'progressCirculoActivo' : 'progressCirculoInactivo'}`}>
                                    {p < paso ? <Check size={16} /> : p}
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
                            <SelectVehiculo
                                vehiculos={vehiculos}
                                vehiculoId={vehiculoId}
                                onChange={setVehiculoId}
                                label="Furgoneta"
                            />

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

                            <Boton
                                onClick={handleContinuarPaso1}
                                disabled={!vehiculoId || !fechaInicio || !fechaFin || loadingDisp}
                            >
                                {loadingDisp ? 'Verificando disponibilidad...' : 'Continuar'}
                            </Boton>
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
                                        className="reservarVehiculoImg" loading="lazy" />
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
                                <Boton variante="atras" onClick={() => setPaso(1)}>
                                    ← Atrás
                                </Boton>
                                <Boton claseExtra="reservarBotonContinuar" onClick={() => setPaso(3)}>
                                    Continuar
                                </Boton>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Datos del cliente */}
                    {paso === 3 && (
                        <div className="reservarPasoContenido">
                            <h2 className="reservarPasoTitulo">Tus datos</h2>

                            <div className="formulario">
                                <CampoTexto
                                    label="Nombre completo"
                                    value={datosCliente.nombre}
                                    onChange={v => setDatosCliente(d => ({ ...d, nombre: v }))}
                                    error={erroresForm.nombre}
                                    placeholder="Tu nombre y apellidos"
                                />
                                <CampoTexto
                                    label="Email"
                                    type="email"
                                    value={datosCliente.email}
                                    onChange={v => setDatosCliente(d => ({ ...d, email: v }))}
                                    error={erroresForm.email}
                                    placeholder="tu@email.com"
                                />
                                <CampoTexto
                                    label="Teléfono"
                                    type="tel"
                                    value={datosCliente.telefono}
                                    onChange={v => setDatosCliente(d => ({ ...d, telefono: v }))}
                                    error={erroresForm.telefono}
                                    placeholder="+34 600 000 000"
                                />
                                <CampoTextarea
                                    label="Notas (opcional)"
                                    value={datosCliente.notas ?? ''}
                                    onChange={v => setDatosCliente(d => ({ ...d, notas: v }))}
                                    rows={3}
                                    placeholder="¿Alguna petición especial?"
                                />
                            </div>

                            {errorReserva && (
                                <div className="alertaError">{errorReserva}</div>
                            )}

                            <div className="reservarBotones">
                                <Boton variante="atras" onClick={() => setPaso(2)}>
                                    ← Atrás
                                </Boton>
                                <Boton
                                    claseExtra="reservarBotonContinuar"
                                    onClick={handleReservar}
                                    disabled={loadingReserva}
                                >
                                    {loadingReserva ? 'Procesando...' : 'Pagar con tarjeta'}
                                </Boton>
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
