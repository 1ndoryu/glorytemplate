/*
 * VistaResumen: Dashboard principal del cliente.
 * Muestra resumen de deuda, servicios contratados y próximas renovaciones.
 */

import React from 'react';
import {Calendar, Package, ShoppingBag, AlertCircle} from 'lucide-react';
import {Tarjeta} from '../../ui/Tarjeta';
import {Boton} from '../../ui/Boton';
import {PlaceholderVacio} from '../../ui/PlaceholderVacio';
import {usePanel} from '../../../context/PanelContext';
import {useUsuario} from '../../../context/UsuarioContext';
import {TarjetaServicioContratado} from './servicios/TarjetaServicioContratado';
import {ServicioContratado} from '../../../data/types/servicio';
import {formatearFecha, diasHastaFecha} from '../../../utils/fechaUtils';
import {SeccionPanel} from '../ui/SeccionPanel';

interface TarjetaResumenClienteProps {
    etiqueta: string;
    valor: string | number;
    valorDestacado?: boolean;
    accion?: React.ReactNode;
}

const TarjetaResumenCliente: React.FC<TarjetaResumenClienteProps> = ({etiqueta, valor, valorDestacado, accion}) => (
    <Tarjeta className="tarjetaResumen">
        <div className="resumenContenido">
            <span className="resumenEtiqueta">{etiqueta}</span>
            <span className={`resumenValor ${valorDestacado ? 'valorAlerta' : ''}`}>{valor}</span>
        </div>
        {accion}
    </Tarjeta>
);

export const VistaResumen: React.FC = () => {
    const {serviciosContratados, hostingsContratados, dominiosContratados, facturas, navegarA} = usePanel();
    const {usuario} = useUsuario();

    /* Calcular deuda pendiente (solo facturas pendientes/vencidas) */
    const facturasPendientes = facturas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida');
    const deudaTotal = facturasPendientes.reduce((acc, f) => acc + f.total, 0);

    /* Servicios activos (en progreso o pendientes) */
    const serviciosActivos = serviciosContratados.filter(s => s.estado === 'en_progreso' || s.estado === 'pendiente');

    /* Próximas renovaciones (hostings y dominios próximos a vencer en los próximos 30 días) */
    const proximasRenovaciones = [
        ...hostingsContratados
            .filter(h => {
                const dias = diasHastaFecha(h.fechaProximaRenovacion);
                return dias >= 0 && dias <= 30;
            })
            .map(h => ({
                tipo: 'hosting' as const,
                nombre: h.dominio,
                fecha: h.fechaProximaRenovacion,
                dias: diasHastaFecha(h.fechaProximaRenovacion)
            })),
        ...dominiosContratados
            .filter(d => {
                const dias = diasHastaFecha(d.fechaExpiracion);
                return dias >= 0 && dias <= 30;
            })
            .map(d => ({
                tipo: 'dominio' as const,
                nombre: d.nombre,
                fecha: d.fechaExpiracion,
                dias: diasHastaFecha(d.fechaExpiracion)
            }))
    ].sort((a, b) => a.dias - b.dias);

    const tieneContenido = serviciosActivos.length > 0 || proximasRenovaciones.length > 0 || deudaTotal > 0;

    /* Handler para ver detalle de un servicio contratado */
    const handleVerDetallesServicio = (servicio: ServicioContratado) => {
        navegarA('detalle_servicio_contratado', {id: servicio.id});
    };

    return (
        <div className="bloqueVista animate-fade-in" id="vistaDashboard">
            <div className="vistaHeader">
                <h2 className="vistaTitulo">Hola, {usuario.nombre}</h2>
                <p className="vistaSubtitulo">{tieneContenido ? 'Este es el resumen de tu cuenta.' : 'No tienes nada pendiente.'}</p>
            </div>

            {/* Tarjetas de resumen */}
            <div className="dashboardResumen">
                <TarjetaResumenCliente
                    etiqueta="Deuda pendiente"
                    valor={`$${deudaTotal.toFixed(2)}`}
                    valorDestacado={deudaTotal > 0}
                    accion={
                        deudaTotal > 0 ? (
                            <Boton variante="acento" tamano="sm">
                                Pagar
                            </Boton>
                        ) : undefined
                    }
                />
                <TarjetaResumenCliente etiqueta="Servicios activos" valor={serviciosActivos.length} />
                <TarjetaResumenCliente etiqueta="Renovaciones próximas" valor={proximasRenovaciones.length} />
            </div>

            {/* Servicios contratados activos */}
            {serviciosActivos.length > 0 && (
                <SeccionPanel titulo="Servicios en progreso">
                    <div className="dashboardSeccionLista">
                        {serviciosActivos.map(servicio => (
                            <TarjetaServicioContratado key={servicio.id} servicio={servicio} onVerDetalles={handleVerDetallesServicio} />
                        ))}
                    </div>
                </SeccionPanel>
            )}

            {/* Próximas renovaciones */}
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

            {/* Alertas de facturas vencidas */}
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

            {/* Placeholder si no hay contenido */}
            {!tieneContenido && <PlaceholderVacio icono={ShoppingBag} titulo="Empieza tu primer proyecto" subtitulo="Visita el Marketplace para contratar servicios." />}
        </div>
    );
};
