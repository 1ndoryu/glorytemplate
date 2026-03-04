/**
 * VehiculoDetalleIsland — Ficha completa de un vehículo.
 * Galería, especificaciones, calendario, precios, CTA reservar.
 */

import { useState, useCallback, useMemo } from 'react';
import { useWordPressApi, useNavigation } from '@/hooks';
import { useIslandProps } from '@/hooks';
import { Galeria } from '@app/components/Galeria';
import { CalendarioDisponibilidad } from '@app/components/CalendarioDisponibilidad';
import { ResumenPrecio } from '@app/components/ResumenPrecio';
import { SelectorFechas } from '@app/components/SelectorFechas';
import { useDisponibilidad } from '@app/hooks/useDisponibilidad';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';
import type { VehiculoDetalleResponse, VehiculoDetalle, NombreTemporada } from '@app/types/cresta';

interface VehiculoDetalleIslandProps {
    vehiculoId?: number;
    vehiculoSlug?: string;
    [key: string]: unknown;
}

const NOMBRE_TEMPORADA: Record<NombreTemporada, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    especial: 'Especial',
};

export function VehiculoDetalleIsland(rawProps: Record<string, unknown>): JSX.Element {
    const props = useIslandProps<VehiculoDetalleIslandProps>(rawProps);
    const { navegar } = useNavigation();

    const vehiculoId = props.vehiculoId ?? 0;
    const vehiculoSlug = props.vehiculoSlug ?? '';

    // Resolver endpoint: slug tiene prioridad, luego ID
    const endpoint = vehiculoSlug
        ? `/glory/v1/vehiculos/slug/${vehiculoSlug}`
        : `/glory/v1/vehiculos/${vehiculoId}`;

    const apiOptions = useMemo(() => ({ cache: true as const }), []);
    const { data, isLoading, error } = useWordPressApi<VehiculoDetalleResponse>(
        endpoint,
        apiOptions,
    );

    const vehiculo = data?.vehiculo;

    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // Usar el ID del vehículo real una vez cargado (necesario para disponibilidad y reservar)
    const realVehiculoId = data?.vehiculo?.id ?? vehiculoId;

    const { disponible, precio, motivo, loading: loadingDisp, verificar } = useDisponibilidad(realVehiculoId);

    const handleFechasChange = useCallback((inicio: string, fin: string) => {
        setFechaInicio(inicio);
        setFechaFin(fin);
    }, []);

    const handleVerificar = useCallback(async () => {
        if (fechaInicio && fechaFin) {
            await verificar(fechaInicio, fechaFin);
        }
    }, [fechaInicio, fechaFin, verificar]);

    const handleReservar = useCallback(() => {
        const params = new URLSearchParams({
            vehiculo_id: String(realVehiculoId),
            inicio: fechaInicio,
            fin: fechaFin,
        });
        navegar(`/reservar/?${params.toString()}`);
    }, [realVehiculoId, fechaInicio, fechaFin, navegar]);

    const handleCalendarioSelect = useCallback((inicio: string, fin: string) => {
        setFechaInicio(inicio);
        setFechaFin(fin);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
                </div>
            </div>
        );
    }

    if (error || !vehiculo) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-3xl mx-auto px-4 py-32 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Vehículo no encontrado</h1>
                    <p className="text-gray-500 mb-6">{error ?? 'El vehículo solicitado no existe o no está disponible.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Grid principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Columna izquierda — Galería + Info */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Galería */}
                            <Galeria imagenes={vehiculo.galeria} />

                            {/* Título y descripción */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                    {vehiculo.nombre}
                                </h1>
                                {vehiculo.ubicacion && (
                                    <p className="text-gray-500 flex items-center gap-1 mb-4">📍 {vehiculo.ubicacion}</p>
                                )}
                            </div>

                            {/* Especificaciones */}
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Especificaciones</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <Spec label="Plazas para dormir" value={`${vehiculo.capacidad}`} icon="🛏️" />
                                    <Spec label="Plazas de viaje" value={`${vehiculo.plazasViaje}`} icon="💺" />
                                    <Spec label="Combustible" value={vehiculo.combustible} icon="⛽" />
                                    <Spec label="Transmisión" value={vehiculo.transmision} icon="⚙️" />
                                    <Spec label="Km incluidos/día" value={vehiculo.kmIncluidos === 0 ? 'Ilimitados' : `${vehiculo.kmIncluidos} km`} icon="🛣️" />
                                    <Spec label="Edad mínima" value={`${vehiculo.edadMinima} años`} icon="🪪" />
                                </div>
                            </div>

                            {/* Equipamiento */}
                            {vehiculo.equipamiento.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-md p-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Equipamiento incluido</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {vehiculo.equipamiento.map(item => (
                                            <div key={item} className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                                                <span className="text-green-500">✓</span>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contenido */}
                            {vehiculo.contenido && (
                                <div className="bg-white rounded-2xl shadow-md p-6 prose prose-green max-w-none"
                                    dangerouslySetInnerHTML={{ __html: vehiculo.contenido }}
                                />
                            )}

                            {/* Tabla de precios */}
                            {vehiculo.precios.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-md p-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Precios por temporada</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2 text-gray-500 font-medium">Temporada</th>
                                                    <th className="text-right py-2 text-gray-500 font-medium">Precio/noche</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vehiculo.precios.map(p => (
                                                    <tr key={p.temporada} className="border-b border-gray-100">
                                                        <td className="py-3 font-medium text-gray-800">{NOMBRE_TEMPORADA[p.temporada]}</td>
                                                        <td className="py-3 text-right font-bold text-green-600">{p.precioNoche.toFixed(2)}€</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Columna derecha — Sidebar sticky */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                {/* Precio badge */}
                                <div className="bg-white rounded-2xl shadow-md p-6 text-center">
                                    <div className="text-sm text-gray-500 mb-1">Desde</div>
                                    <div className="text-4xl font-bold text-green-600 mb-1">{vehiculo.precioBase}€</div>
                                    <div className="text-sm text-gray-500">por noche</div>
                                </div>

                                {/* Selector de fechas */}
                                <SelectorFechas
                                    fechaInicio={fechaInicio}
                                    fechaFin={fechaFin}
                                    onChange={handleFechasChange}
                                />

                                {fechaInicio && fechaFin && (
                                    <button
                                        onClick={handleVerificar}
                                        disabled={loadingDisp}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition disabled:opacity-50"
                                    >
                                        {loadingDisp ? 'Verificando...' : 'Verificar disponibilidad'}
                                    </button>
                                )}

                                {/* Resultado de disponibilidad */}
                                {disponible !== null && (
                                    <div className={`rounded-xl p-4 text-sm ${disponible ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                        {disponible ? (
                                            <span className="font-medium">✓ Disponible para las fechas seleccionadas</span>
                                        ) : (
                                            <span className="font-medium">✗ {motivo ?? 'No disponible'}</span>
                                        )}
                                    </div>
                                )}

                                {/* Resumen de precio */}
                                {disponible && precio && (
                                    <>
                                        <ResumenPrecio calculo={precio} fianza={vehiculo.fianza} />
                                        <button
                                            onClick={handleReservar}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl transition shadow-lg"
                                        >
                                            Reservar ahora
                                        </button>
                                    </>
                                )}

                                {/* Calendario */}
                                <CalendarioDisponibilidad
                                    vehiculoId={realVehiculoId}
                                    onSelectRange={handleCalendarioSelect}
                                />

                                {/* Info adicional */}
                                {vehiculo.politicaCancelacion && (
                                    <div className="bg-white rounded-2xl shadow-md p-5 text-sm text-gray-600">
                                        <h3 className="font-bold text-gray-900 mb-2">Cancelación</h3>
                                        <p>{vehiculo.politicaCancelacion}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function Spec({ label, value, icon }: { label: string; value: string; icon: string }): JSX.Element {
    return (
        <div className="flex items-center gap-3 py-2">
            <span className="text-2xl">{icon}</span>
            <div>
                <div className="text-xs text-gray-400">{label}</div>
                <div className="font-semibold text-gray-800">{value}</div>
            </div>
        </div>
    );
}
