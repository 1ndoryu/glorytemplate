/*
 * PaginaServicioContratado: Detalle de un servicio contratado por el cliente.
 * Muestra estado del proyecto, progreso, y acciones disponibles.
 */

import React from 'react';
import {ArrowLeft, Clock, DollarSign, User, Calendar, CheckCircle, AlertCircle, MessageCircle} from 'lucide-react';
import {usePanel} from '../../../context/PanelContext';
import {Boton} from '../../ui/Boton';
import {Tarjeta} from '../../ui/Tarjeta';
import {Etiqueta} from '../../ui/Etiqueta';
import {formatearFecha, diasHastaFecha} from '../../../utils/fechaUtils';

/* Configuración visual de estados */
const estadoConfig = {
    pendiente: {label: 'Pendiente', variante: 'alerta' as const, icono: <Clock size={14} />},
    en_progreso: {label: 'En progreso', variante: 'info' as const, icono: <Clock size={14} />},
    completado: {label: 'Completado', variante: 'exito' as const, icono: <CheckCircle size={14} />},
    cancelado: {label: 'Cancelado', variante: 'error' as const, icono: <AlertCircle size={14} />}
};

export const PaginaServicioContratado: React.FC = () => {
    const {navegarA, parametrosVista, serviciosContratados} = usePanel();
    const servicioId = parametrosVista?.id;

    const servicio = serviciosContratados.find(s => s.id === servicioId);

    if (!servicio) {
        return (
            <div className="bloqueVista">
                <Boton onClick={() => navegarA('resumen')} variante="ghost" icono={<ArrowLeft size={18} />} className="mb-4">
                    Volver al Dashboard
                </Boton>
                <div className="placeholderCentrado">
                    <AlertCircle size={48} className="iconoPlaceholder" />
                    <h2 className="placeholderTitulo">Servicio no encontrado</h2>
                    <p className="placeholderSubtitulo">El servicio que buscas no existe o ha sido eliminado.</p>
                </div>
            </div>
        );
    }

    const config = estadoConfig[servicio.estado];
    const diasRestantes = servicio.fechaEntregaEstimada ? diasHastaFecha(servicio.fechaEntregaEstimada) : null;

    return (
        <div className="bloqueVista paginaServicioContratado" style={{maxWidth: '700px', margin: '0 auto'}}>
            <header className="paginaServicioHeader">
                <Boton onClick={() => navegarA('resumen')} variante="outline" icono={<ArrowLeft size={18} />}>
                    Volver
                </Boton>
            </header>

            <div className="paginaServicioContenido">
                {/* Columna principal */}
                <div className="paginaServicioPrincipal">
                    <Tarjeta className="tarjetaInfoServicio">
                        <div className="servicioHeaderInfo">
                            <div className="servicioImagenGrande">
                                {servicio.imagenUrl ? (
                                    <img src={servicio.imagenUrl} alt={servicio.nombre} />
                                ) : (
                                    <div className="servicioImagenPlaceholder">
                                        <span>Sin imagen</span>
                                    </div>
                                )}
                            </div>
                            <div className="servicioDetalles">
                                <h1 className="servicioNombreGrande">{servicio.nombre}</h1>
                                <Etiqueta variante={config.variante} icono={config.icono}>
                                    {config.label}
                                </Etiqueta>
                            </div>
                        </div>

                        {/* Barra de progreso */}
                        {servicio.progreso !== undefined && servicio.estado !== 'completado' && (
                            <div className="servicioProgreso">
                                <div className="progresoHeader">
                                    <span className="progresoLabel">Progreso del proyecto</span>
                                    <span className="progresoPorcentaje">{servicio.progreso}%</span>
                                </div>
                                <div className="progresoBarra">
                                    <div className="progresoBarraRelleno" style={{width: `${servicio.progreso}%`}} />
                                </div>
                            </div>
                        )}
                    </Tarjeta>

                    {/* Descripción del servicio */}
                    <Tarjeta className="tarjetaDescripcion">
                        <h3 className="tarjetaSeccionTitulo">Descripción del servicio</h3>
                        <p className="servicioDescripcion">{servicio.descripcion || 'Este servicio incluye el desarrollo completo según las especificaciones acordadas.'}</p>
                    </Tarjeta>
                </div>

                {/* Columna lateral */}
                <div className="paginaServicioLateral">
                    <Tarjeta className="tarjetaResumenServicio" style={{fontSize: '0.9rem'}}>
                        <h3 className="tarjetaSeccionTitulo">Resumen</h3>

                        <div className="resumenLineas">
                            <div className="resumenLinea">
                                <span className="resumenLineaLabel">
                                    <DollarSign size={14} />
                                    Precio acordado
                                </span>
                                <span className="resumenLineaValor">${servicio.precio}</span>
                            </div>

                            <div className="resumenLinea">
                                <span className="resumenLineaLabel">
                                    <Calendar size={14} />
                                    Fecha contratación
                                </span>
                                <span className="resumenLineaValor">{servicio.fechaContratacion ? formatearFecha(servicio.fechaContratacion) : '-'}</span>
                            </div>

                            {servicio.fechaEntregaEstimada && (
                                <div className="resumenLinea">
                                    <span className="resumenLineaLabel">
                                        <Clock size={14} />
                                        Entrega estimada
                                    </span>
                                    <span className={`resumenLineaValor ${diasRestantes !== null && diasRestantes < 0 ? 'valorRetrasado' : ''}`}>
                                        {formatearFecha(servicio.fechaEntregaEstimada)}
                                        {diasRestantes !== null && diasRestantes >= 0 && <small> ({diasRestantes} días)</small>}
                                    </span>
                                </div>
                            )}

                            {servicio.revisionesRestantes !== undefined && (
                                <div className="resumenLinea">
                                    <span className="resumenLineaLabel">
                                        <CheckCircle size={14} />
                                        Revisiones restantes
                                    </span>
                                    <span className="resumenLineaValor">{servicio.revisionesRestantes}</span>
                                </div>
                            )}
                        </div>
                    </Tarjeta>

                    {/* Acciones */}
                    <Tarjeta className="tarjetaAcciones">
                        <Boton variante="outline" icono={<MessageCircle size={16} />} className="botonAccion">
                            Contactar proveedor
                        </Boton>
                        {servicio.estado === 'completado' && (
                            <Boton variante="acento" className="botonAccion">
                                Descargar entregables
                            </Boton>
                        )}
                    </Tarjeta>
                </div>
            </div>
        </div>
    );
};

export default PaginaServicioContratado;
