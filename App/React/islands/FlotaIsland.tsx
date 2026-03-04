/**
 * FlotaIsland — Catálogo de vehículos + router para detalle.
 * 
 * En ruta /flota/ muestra el grid con filtros.
 * En ruta /flota/{slug}/ delega a VehiculoDetalleIsland.
 * El framework SPA resuelve /flota/{slug} al padre /flota/ via prefix matching,
 * así que esta isla detecta el segmento extra y renderiza el detalle.
 */

import { useState, useMemo } from 'react';
import { useVehiculos } from '@app/hooks/useVehiculos';
import { TarjetaVehiculo } from '@app/components/TarjetaVehiculo';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';
import { VehiculoDetalleIsland } from './VehiculoDetalleIsland';

type Ordenacion = 'precio-asc' | 'precio-desc' | 'capacidad' | 'nombre';

/**
 * Extrae el slug del vehículo desde la URL si estamos en /flota/{slug}/
 */
function getVehiculoSlug(): string | null {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[0] === 'flota') {
        return segments[1];
    }
    return null;
}

export function FlotaIsland(): JSX.Element {
    const vehiculoSlug = getVehiculoSlug();

    // Si hay slug, renderizar ficha de detalle
    if (vehiculoSlug) {
        return <VehiculoDetalleIsland vehiculoSlug={vehiculoSlug} />;
    }

    // Sin slug → catálogo
    return <FlotaCatalogo />;
}

function FlotaCatalogo(): JSX.Element {
    const { vehiculos, loading, error } = useVehiculos();
    const [ordenar, setOrdenar] = useState<Ordenacion>('precio-asc');
    const [filtroCapacidad, setFiltroCapacidad] = useState<number>(0);

    const vehiculosFiltrados = useMemo(() => {
        let resultado = [...vehiculos];

        // Filtro por capacidad
        if (filtroCapacidad > 0) {
            resultado = resultado.filter(v => v.capacidad >= filtroCapacidad);
        }

        // Ordenar
        switch (ordenar) {
            case 'precio-asc':
                resultado.sort((a, b) => a.precioBase - b.precioBase);
                break;
            case 'precio-desc':
                resultado.sort((a, b) => b.precioBase - a.precioBase);
                break;
            case 'capacidad':
                resultado.sort((a, b) => b.capacidad - a.capacidad);
                break;
            case 'nombre':
                resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
        }

        return resultado;
    }, [vehiculos, ordenar, filtroCapacidad]);

    const capacidadesUnicas = useMemo(() => {
        const caps = [...new Set(vehiculos.map(v => v.capacidad))];
        return caps.sort((a, b) => a - b);
    }, [vehiculos]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero */}
            <section className="bg-green-800 pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                        Nuestra Flota
                    </h1>
                    <p className="text-green-100/70 text-lg max-w-xl">
                        Elige tu compañera de viaje. Todas nuestras furgonetas están completamente equipadas.
                    </p>
                </div>
            </section>

            {/* Filtros */}
            <section className="bg-white border-b border-gray-200 sticky top-16 md:top-20 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center">
                        <label className="text-sm text-gray-500">Plazas mín.:</label>
                        <select
                            value={filtroCapacidad}
                            onChange={e => setFiltroCapacidad(Number(e.target.value))}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                        >
                            <option value={0}>Todas</option>
                            {capacidadesUnicas.map(c => (
                                <option key={c} value={c}>{c}+ plazas</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 items-center">
                        <label className="text-sm text-gray-500">Ordenar:</label>
                        <select
                            value={ordenar}
                            onChange={e => setOrdenar(e.target.value as Ordenacion)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                        >
                            <option value="precio-asc">Precio: menor a mayor</option>
                            <option value="precio-desc">Precio: mayor a menor</option>
                            <option value="capacidad">Mayor capacidad</option>
                            <option value="nombre">Nombre A-Z</option>
                        </select>

                        <span className="text-sm text-gray-400">
                            {vehiculosFiltrados.length} {vehiculosFiltrados.length === 1 ? 'vehículo' : 'vehículos'}
                        </span>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-500">
                            <p className="text-lg">{error}</p>
                        </div>
                    ) : vehiculosFiltrados.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <p className="text-lg mb-2">No se encontraron vehículos con esos filtros.</p>
                            <button
                                onClick={() => { setFiltroCapacidad(0); }}
                                className="text-green-600 hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {vehiculosFiltrados.map(v => (
                                <TarjetaVehiculo key={v.id} vehiculo={v} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
