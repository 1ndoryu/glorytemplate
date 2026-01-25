import React from 'react';
import {ArrowLeft} from 'lucide-react';
import {usePanel} from '../../../context/PanelContext';
import {Boton} from '../../ui/Boton';

export const PaginaServicio: React.FC = () => {
    const {navegarA, parametrosVista, servicios} = usePanel();
    const servicioId = parametrosVista?.id;

    const servicio = servicios.find(s => s.id === servicioId);

    if (!servicio) {
        return (
            <div className="paginaServicio p-8">
                <Boton onClick={() => navegarA('marketplace')} variante="ghost" icono={<ArrowLeft size={20} />} className="mb-4">
                    Volver al Marketplace
                </Boton>
                <div className="text-center py-12">
                    <h2 className="text-xl font-bold text-gray-800">Servicio no encontrado</h2>
                    <p className="text-gray-500 mt-2">El servicio que buscas no existe o ha sido eliminado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="paginaServicio animate-fade-in">
            <header className="mb-6">
                <Boton onClick={() => navegarA('marketplace')} variante="ghost" icono={<ArrowLeft size={18} />} className="mb-4">
                    Volver
                </Boton>
                <h1 className="text-3xl font-bold text-gray-900">{servicio.nombre}</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 relative">
                        {servicio.imagenUrl ? <img src={servicio.imagenUrl} alt={servicio.nombre} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400">Sin imagen</div>}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">{servicio.categoria || 'Servicio'}</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-4">Acerca del servicio</h3>
                        <p className="text-gray-600 whitespace-pre-line leading-relaxed">{servicio.descripcion}</p>
                    </div>
                </div>

                {/* Columna Lateral (Pricing) */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <div className="flex justify-between items-baseline mb-6">
                            <span className="text-gray-500 font-medium">Precio</span>
                            <span className="text-3xl font-bold text-gray-900">${servicio.precio}</span>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tiempo de entrega</span>
                                <span className="font-medium">{servicio.tiempoEntregaDias ? `${servicio.tiempoEntregaDias} días` : '7 días'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Revisiones</span>
                                <span className="font-medium">2 incluidas</span>
                            </div>
                        </div>

                        <Boton variante="acento" bloque tamano="lg">
                            Contratar Servicio
                        </Boton>

                        <p className="text-xs text-center text-gray-400 mt-4">Pago seguro vía Stripe. Garantía de satisfacción.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
