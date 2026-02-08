/**
 * Componente: SeccionMetodosPago
 * Gestion de tarjetas de credito y direccion de facturacion.
 * TO-DO: Integrar Stripe Elements para captura segura de tarjetas.
 * TO-DO: Conectar con backend para CRUD de metodos de pago.
 */
import React from 'react';
import {Button} from '../ui/Button';
import './SeccionMetodosPago.css';

export const SeccionMetodosPago: React.FC = () => {
    return (
        <div className="metodosPagoSeccion">
            <p className="metodosPagoIntro">
                Administra tus tarjetas y metodos de pago para transacciones rapidas y seguras.
            </p>

            {/* Tarjetas registradas (placeholder) */}
            <div className="tarjetasLista">
                <div className="tarjetaVacia">
                    <div className="tarjetaVaciaIcono">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                    </div>
                    <p className="tarjetaVaciaTexto">No tienes tarjetas registradas</p>
                    <Button variante="outline" tamano="pequeno">Agregar tarjeta</Button>
                </div>
            </div>

            {/* Direccion de facturacion */}
            <h3 className="metodosPagoSubtitulo">Direccion de Facturacion</h3>
            <form className="metodosPagoFormulario">
                <div className="metodosPagoGrid">
                    <div className="metodosPagoCampo">
                        <label htmlFor="pagoNombre" className="metodosPagoEtiqueta">Nombre completo</label>
                        <input type="text" id="pagoNombre" placeholder="Nombre en la tarjeta" className="metodosPagoInput" />
                    </div>
                    <div className="metodosPagoCampo">
                        <label htmlFor="pagoPais" className="metodosPagoEtiqueta">Pais</label>
                        <input type="text" id="pagoPais" placeholder="Pais" className="metodosPagoInput" />
                    </div>
                    <div className="metodosPagoCampo">
                        <label htmlFor="pagoDireccion" className="metodosPagoEtiqueta">Direccion</label>
                        <input type="text" id="pagoDireccion" placeholder="Calle y numero" className="metodosPagoInput" />
                    </div>
                    <div className="metodosPagoCampo">
                        <label htmlFor="pagoCiudad" className="metodosPagoEtiqueta">Ciudad</label>
                        <input type="text" id="pagoCiudad" placeholder="Ciudad" className="metodosPagoInput" />
                    </div>
                    <div className="metodosPagoCampo">
                        <label htmlFor="pagoCodigoPostal" className="metodosPagoEtiqueta">Codigo postal</label>
                        <input type="text" id="pagoCodigoPostal" placeholder="00000" className="metodosPagoInput" />
                    </div>
                </div>
                <div className="metodosPagoAcciones">
                    <Button variante="outline" tamano="mediano">Guardar direccion</Button>
                </div>
            </form>
        </div>
    );
};
