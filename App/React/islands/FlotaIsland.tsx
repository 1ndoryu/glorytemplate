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
import { Boton, CampoSelect } from '@app/components/ui';

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
        <div className="paginaBase">
            <Header />

            {/* Hero */}
            <section className="heroInterior">
                <div className="heroInteriorContenido">
                    <h1 className="heroInteriorTitulo">Nuestra Flota</h1>
                    <p className="heroInteriorSubtitulo">
                        Elige tu compañera de viaje. Todas nuestras furgonetas están completamente equipadas.
                    </p>
                </div>
            </section>

            {/* Filtros */}
            <section className="flotaFiltros">
                <div className="flotaFiltrosContenido">
                    <div className="flotaFiltroGrupo">
                        <CampoSelect
                            label="Plazas mín.:"
                            value={filtroCapacidad}
                            onChange={v => setFiltroCapacidad(Number(v))}
                            className="flotaFiltroSelect"
                        >
                            <option value={0}>Todas</option>
                            {capacidadesUnicas.map(c => (
                                <option key={c} value={c}>{c}+ plazas</option>
                            ))}
                        </CampoSelect>
                    </div>

                    <div className="flotaFiltroGrupo">
                        <CampoSelect
                            label="Ordenar:"
                            value={ordenar}
                            onChange={v => setOrdenar(v as Ordenacion)}
                            className="flotaFiltroSelect"
                        >
                            <option value="precio-asc">Precio: menor a mayor</option>
                            <option value="precio-desc">Precio: mayor a menor</option>
                            <option value="capacidad">Mayor capacidad</option>
                            <option value="nombre">Nombre A-Z</option>
                        </CampoSelect>

                        <span className="flotaFiltroContador">
                            {vehiculosFiltrados.length} {vehiculosFiltrados.length === 1 ? 'vehículo' : 'vehículos'}
                        </span>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="flotaSeccionGrid">
                <div className="contenedor">
                    {loading ? (
                        <div className="cargando">
                            <div className="cargandoSpinner" />
                        </div>
                    ) : error ? (
                        <div className="flotaError">
                            <p>{error}</p>
                        </div>
                    ) : vehiculosFiltrados.length === 0 ? (
                        <div className="flotaVacioFiltros">
                            <p className="flotaVacioFiltrosTexto">No se encontraron vehículos con esos filtros.</p>
                            <Boton
                                variante="secundario"
                                onClick={() => { setFiltroCapacidad(0); }}
                                claseExtra="flotaLimpiarFiltros"
                            >
                                Limpiar filtros
                            </Boton>
                        </div>
                    ) : (
                        <div className="flotaGridContenedor">
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
