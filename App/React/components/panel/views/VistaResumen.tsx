/*
 * VistaResumen: Dashboard principal del cliente.
 * Muestra resumen de deuda, servicios contratados y próximas renovaciones.
 */

import React from 'react';
import {DollarSign, Calendar, Package, ShoppingBag, AlertCircle} from 'lucide-react';
import {Tarjeta} from '../../ui/Tarjeta';
import {Boton} from '../../ui/Boton';
import {PlaceholderVacio} from '../../ui/PlaceholderVacio';
import {usePanel} from '../../../context/PanelContext';
import {useUsuario} from '../../../context/UsuarioContext';
import {TarjetaServicioContratado} from './servicios/TarjetaServicioContratado';

/* Formatea fecha ISO a texto legible */
const formatearFecha = (fechaIso: string): string => {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-ES', {day: 'numeric', month: 'short', year: 'numeric'});
};

/* Calcula días restantes hasta una fecha */
const calcularDiasRestantes = (fechaIso: string): number => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaIso);
    fecha.setHours(0, 0, 0, 0);
    return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
};

export const VistaResumen: React.FC = () => {
    const {serviciosContratados, hostingsContratados, dominiosContratados, facturas} = usePanel();
    const {usuario} = useUsuario();

    /* Calcular deuda pendiente (solo facturas pendientes/vencidas) */
    const facturasPendientes = facturas.filter(f => f.estado === 'pendiente');
    const deudaTotal = facturasPendientes.reduce((acc, f) => acc + f.importe, 0);

    /* Servicios activos (en progreso o pendientes) */
    const serviciosActivos = serviciosContratados.filter(s => s.estado === 'en_progreso' || s.estado === 'pendiente');

    /* Próximas renovaciones (hostings y dominios próximos a vencer en los próximos 30 días) */
    const proximasRenovaciones = [
        ...hostingsContratados
            .filter(h => {
                const dias = calcularDiasRestantes(h.fechaProximaRenovacion);
                return dias >= 0 && dias <= 30;
            })
            .map(h => ({
                tipo: 'hosting' as const,
                nombre: h.dominio,
                fecha: h.fechaProximaRenovacion,
                dias: calcularDiasRestantes(h.fechaProximaRenovacion)
            })),
        ...dominiosContratados
            .filter(d => {
                const dias = calcularDiasRestantes(d.fechaExpiracion);
                return dias >= 0 && dias <= 30;
            })
            .map(d => ({
                tipo: 'dominio' as const,
                nombre: d.nombre,
                fecha: d.fechaExpiracion,
                dias: calcularDiasRestantes(d.fechaExpiracion)
            }))
    ].sort((a, b) => a.dias - b.dias);

    const tieneContenido = serviciosActivos.length > 0 || proximasRenovaciones.length > 0 || deudaTotal > 0;

    return (
        <div className="bloqueVista animate-fade-in" id="vistaDashboard">
            <div className="vistaHeader">
                <h2 className="vistaTitulo">Hola, {usuario.nombre}</h2>
                <p className="vistaSubtitulo">{tieneContenido ? 'Este es el resumen de tu cuenta.' : 'No tienes nada pendiente.'}</p>
            </div>

            {/* Tarjetas de resumen */}
            <div className="dashboardResumen">
                {/* Deuda pendiente */}
                <Tarjeta className="tarjetaResumen">
                    <div className="resumenIcono resumenIconoDeuda">
                        <DollarSign size={20} />
                    </div>
                    <div className="resumenContenido">
                        <span className="resumenEtiqueta">Deuda pendiente</span>
                        <span className={`resumenValor ${deudaTotal > 0 ? 'valorAlerta' : ''}`}>${deudaTotal.toFixed(2)}</span>
                    </div>
                    {deudaTotal > 0 && (
                        <Boton variante="acento" tamano="sm">
                            Pagar
                        </Boton>
                    )}
                </Tarjeta>

                {/* Servicios activos */}
                <Tarjeta className="tarjetaResumen">
                    <div className="resumenIcono resumenIconoServicios">
                        <Package size={20} />
                    </div>
                    <div className="resumenContenido">
                        <span className="resumenEtiqueta">Servicios activos</span>
                        <span className="resumenValor">{serviciosActivos.length}</span>
                    </div>
                </Tarjeta>

                {/* Próximas renovaciones */}
                <Tarjeta className="tarjetaResumen">
                    <div className="resumenIcono resumenIconoRenovaciones">
                        <Calendar size={20} />
                    </div>
                    <div className="resumenContenido">
                        <span className="resumenEtiqueta">Renovaciones próximas</span>
                        <span className="resumenValor">{proximasRenovaciones.length}</span>
                    </div>
                </Tarjeta>
            </div>

            {/* Servicios contratados activos */}
            {serviciosActivos.length > 0 && (
                <section className="dashboardSeccion">
                    <h3 className="dashboardSeccionTitulo">Servicios en progreso</h3>
                    <div className="dashboardSeccionLista">
                        {serviciosActivos.map(servicio => (
                            <TarjetaServicioContratado key={servicio.id} servicio={servicio} />
                        ))}
                    </div>
                </section>
            )}

            {/* Próximas renovaciones */}
            {proximasRenovaciones.length > 0 && (
                <section className="dashboardSeccion">
                    <h3 className="dashboardSeccionTitulo">Próximas renovaciones</h3>
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
                </section>
            )}

            {/* Alertas de facturas vencidas */}
            {facturasPendientes.length > 0 && (
                <section className="dashboardSeccion">
                    <h3 className="dashboardSeccionTitulo">
                        <AlertCircle size={16} className="iconoAlerta" />
                        Facturas pendientes
                    </h3>
                    <div className="dashboardSeccionLista">
                        {facturasPendientes.slice(0, 3).map(factura => (
                            <Tarjeta key={factura.id} className="tarjetaFacturaPendiente">
                                <div className="facturaInfo">
                                    <span className="facturaConcepto">{factura.concepto}</span>
                                    <span className="facturaFecha">{formatearFecha(factura.fecha)}</span>
                                </div>
                                <span className="facturaMonto">${factura.importe.toFixed(2)}</span>
                                <Boton variante="acento" tamano="sm">
                                    Pagar
                                </Boton>
                            </Tarjeta>
                        ))}
                    </div>
                </section>
            )}

            {/* Placeholder si no hay contenido */}
            {!tieneContenido && <PlaceholderVacio icono={ShoppingBag} titulo="Empieza tu primer proyecto" subtitulo="Visita el Marketplace para contratar servicios." />}
        </div>
    );
};
