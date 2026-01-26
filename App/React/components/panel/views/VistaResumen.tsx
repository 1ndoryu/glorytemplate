/*
 * VistaResumen: Dashboard principal del cliente.
 * Muestra resumen de deuda, servicios contratados y próximas renovaciones.
 * Refactorizado para cumplir SOLID (SRP) usando custom hook.
 */

import React from 'react';
import {ShoppingBag, AlertCircle} from 'lucide-react';
import {Boton} from '../../ui/Boton';
import {PlaceholderVacio} from '../../ui/PlaceholderVacio';
import {useUsuario} from '../../../context/UsuarioContext';
import {TarjetaServicioContratado} from './servicios/TarjetaServicioContratado';
import {formatearFecha} from '../../../utils/fechaUtils';
import {SeccionPanel} from '../ui/SeccionPanel';
import {CabeceraVista} from '../ui/CabeceraVista';
import {Tarjeta} from '../../ui/Tarjeta';
import {Calendar, Package} from 'lucide-react';

/* Componentes y Hooks importados */
import {TarjetaResumenCliente} from './TarjetaResumenCliente';
import {useResumenCliente} from './hooks/useResumenCliente';

export const VistaResumen: React.FC = () => {
    const {usuario} = useUsuario();

    /* Lógica de negocio extraída a Custom Hook para cumplir SRP */
    const {facturasPendientes, deudaTotal, serviciosActivos, proximasRenovaciones, tieneContenido, handleVerDetallesServicio} = useResumenCliente();

    return (
        <div className="bloqueVista animate-fade-in" id="vistaDashboard">
            <CabeceraVista titulo={`Hola, ${usuario.nombre}`} subtitulo={tieneContenido ? 'Este es el resumen de tu cuenta.' : 'No tienes nada pendiente.'} />

            {/* Tarjetas de resumen (Stats) */}
            <div className="gridResumen">
                <TarjetaResumenCliente
                    etiqueta="Deuda pendiente"
                    valor={`$${deudaTotal.toFixed(2)}`}
                    valorDestacado={deudaTotal > 0}
                    accion={
                        deudaTotal > 0 ? (
                            <Boton variante="outline" tamano="sm">
                                Pagar
                            </Boton>
                        ) : undefined
                    }
                />
                <TarjetaResumenCliente etiqueta="Servicios activos" valor={serviciosActivos.length} />
                <TarjetaResumenCliente etiqueta="Renovaciones próximas" valor={proximasRenovaciones.length} />
            </div>

            {/* Seccion: Servicios Activos */}
            {serviciosActivos.length > 0 && (
                <SeccionPanel titulo="Servicios en progreso">
                    <div className="dashboardSeccionLista">
                        {serviciosActivos.map(servicio => (
                            <TarjetaServicioContratado key={servicio.id} servicio={servicio} onVerDetalles={handleVerDetallesServicio} />
                        ))}
                    </div>
                </SeccionPanel>
            )}

            {/* Seccion: Próximas Renovaciones */}
            {proximasRenovaciones.length > 0 && (
                <SeccionPanel titulo="Próximas renovaciones">
                    <div className="dashboardSeccionLista">
                        {proximasRenovaciones.map((item, index) => (
                            <Tarjeta key={`${item.tipo}-${index}`} className="tarjetaRenovacion">
                                <div className="renovacionIcono">{item.tipo === 'hosting' ? <Package size={16} /> : <Calendar size={16} />}</div>
                                <div className="renovacionInfo">
                                    <span className="renovacionNombre">{item.nombre}</span>
                                    <span className="renovacionTipo">{item.tipo === 'hosting' ? 'Hosting' : 'Dominio'}</span>
                                </div>
                                <div className="renovacionFecha">
                                    <span className={`renovacionDias ${item.dias <= 7 ? 'diasUrgente' : ''}`}>{item.dias === 0 ? 'Hoy' : item.dias === 1 ? 'Mañana' : `${item.dias} días`}</span>
                                    <span className="renovacionFechaTexto">{formatearFecha(item.fecha)}</span>
                                </div>
                                <Boton variante="outline" tamano="sm">
                                    Renovar
                                </Boton>
                            </Tarjeta>
                        ))}
                    </div>
                </SeccionPanel>
            )}

            {/* Seccion: Facturas Pendientes */}
            {facturasPendientes.length > 0 && (
                <SeccionPanel titulo="Facturas pendientes" icono={<AlertCircle size={16} className="iconoAlerta" />}>
                    <div className="dashboardSeccionLista">
                        {facturasPendientes.slice(0, 3).map(factura => (
                            <Tarjeta key={factura.id} className="tarjetaFacturaPendiente">
                                <div className="facturaInfo">
                                    <span className="facturaConcepto">{factura.concepto}</span>
                                    <span className="facturaFecha">{formatearFecha(factura.fechaEmision)}</span>
                                </div>
                                <span className="facturaMonto">${factura.total?.toFixed(2) || '0.00'}</span>
                                <Boton variante="acento" tamano="sm">
                                    Pagar
                                </Boton>
                            </Tarjeta>
                        ))}
                    </div>
                </SeccionPanel>
            )}

            {/* Placeholder si está vacío */}
            {!tieneContenido && <PlaceholderVacio icono={ShoppingBag} titulo="Empieza tu primer proyecto" subtitulo="Visita el Marketplace para contratar servicios." />}
        </div>
    );
};
