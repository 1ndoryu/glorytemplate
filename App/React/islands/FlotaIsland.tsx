/**
 * FlotaIsland — Catálogo de vehículos + router para detalle.
 *
 * En ruta /flota/ muestra el grid con filtros en sidebar lateral.
 * En ruta /flota/{slug}/ delega a VehiculoDetalleIsland.
 */

import { useState, useMemo, useCallback } from 'react';
import { useVehiculos } from '@app/hooks/useVehiculos';
import { TarjetaVehiculo } from '@app/components/TarjetaVehiculo';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';
import { VehiculoDetalleIsland } from './VehiculoDetalleIsland';
import { Boton, CampoRadio } from '@app/components/ui';

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

interface FiltrosState {
    ordenar: Ordenacion;
    capacidadMin: number;
    ubicacion: string;
}

const FILTROS_INICIALES: FiltrosState = {
    ordenar: 'precio-asc',
    capacidadMin: 0,
    ubicacion: '',
};

function IconoFiltro(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}

export function FlotaIsland(): JSX.Element {
    const vehiculoSlug = getVehiculoSlug();

    if (vehiculoSlug) {
        return <VehiculoDetalleIsland vehiculoSlug={vehiculoSlug} />;
    }

    return <FlotaCatalogo />;
}

function FlotaCatalogo(): JSX.Element {
    const { vehiculos, loading, error } = useVehiculos();
    const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_INICIALES);
    const [filtrosMobileAbiertos, setFiltrosMobileAbiertos] = useState(false);

    const actualizarFiltro = useCallback(<K extends keyof FiltrosState>(clave: K, valor: FiltrosState[K]) => {
        setFiltros(prev => ({ ...prev, [clave]: valor }));
    }, []);

    const limpiarFiltros = useCallback(() => {
        setFiltros(FILTROS_INICIALES);
    }, []);

    const hayFiltrosActivos = filtros.capacidadMin > 0 || filtros.ubicacion !== '';

    const vehiculosFiltrados = useMemo(() => {
        let resultado = [...vehiculos];

        if (filtros.capacidadMin > 0) {
            resultado = resultado.filter(v => v.capacidad >= filtros.capacidadMin);
        }

        if (filtros.ubicacion) {
            resultado = resultado.filter(v =>
                v.ubicacion?.toLowerCase().includes(filtros.ubicacion.toLowerCase())
            );
        }

        switch (filtros.ordenar) {
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
    }, [vehiculos, filtros]);

    const capacidadesUnicas = useMemo(() => {
        const caps = [...new Set(vehiculos.map(v => v.capacidad))];
        return caps.sort((a, b) => a - b);
    }, [vehiculos]);

    const ubicacionesUnicas = useMemo(() => {
        const ubs = [...new Set(vehiculos.map(v => v.ubicacion).filter(Boolean))];
        return ubs as string[];
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

            {/* Layout: sidebar + grid */}
            <section className="flotaContenedor">
                {/* Botón filtros mobile */}
                <Boton
                    variante="icono"
                    claseExtra="flotaFiltrosToggle"
                    onClick={() => setFiltrosMobileAbiertos(a => !a)}
                    aria-expanded={filtrosMobileAbiertos}
                >
                    <IconoFiltro />
                    Filtros
                    {hayFiltrosActivos && <span className="flotaFiltrosBadge" />}
                </Boton>

                <div className="flotaLayout">
                    {/* Sidebar filtros */}
                    <aside className={`flotaSidebar ${filtrosMobileAbiertos ? 'flotaSidebarVisible' : ''}`}>
                        <div className="flotaSidebarCabecera">
                            <div className="flotaSidebarTitulo">
                                <IconoFiltro />
                                Filtros
                            </div>
                            {hayFiltrosActivos && (
                                <Boton variante="icono" claseExtra="flotaLimpiarBtn" onClick={limpiarFiltros}>
                                    Limpiar
                                </Boton>
                            )}
                        </div>

                        {/* Ordenar */}
                        <div className="flotaFiltroBloque">
                            <h3 className="flotaFiltroBloqueTitle">Ordenar por</h3>
                            <div className="flotaFiltroRadios">
                                {([
                                    { valor: 'precio-asc', label: 'Precio más bajo' },
                                    { valor: 'precio-desc', label: 'Precio más alto' },
                                    { valor: 'capacidad', label: 'Mayor capacidad' },
                                    { valor: 'nombre', label: 'Nombre A-Z' },
                                ] as const).map(op => (
                                    <CampoRadio
                                        key={op.valor}
                                        label={op.label}
                                        name="ordenar"
                                        value={op.valor}
                                        checked={filtros.ordenar === op.valor}
                                        onChange={() => actualizarFiltro('ordenar', op.valor)}
                                        labelClase="flotaFiltroRadioLabel"
                                        className="flotaFiltroRadio"
                                        textoClase="flotaFiltroRadioTexto"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Plazas */}
                        {capacidadesUnicas.length > 0 && (
                            <div className="flotaFiltroBloque">
                                <h3 className="flotaFiltroBloqueTitle">Asientos y camas</h3>
                                <div className="flotaFiltroRadios">
                                    <CampoRadio
                                        label="Cualquier capacidad"
                                        name="capacidad"
                                        value={0}
                                        checked={filtros.capacidadMin === 0}
                                        onChange={() => actualizarFiltro('capacidadMin', 0)}
                                        labelClase="flotaFiltroRadioLabel"
                                        className="flotaFiltroRadio"
                                        textoClase="flotaFiltroRadioTexto"
                                    />
                                    {capacidadesUnicas.map(c => (
                                        <CampoRadio
                                            key={c}
                                            label={`${c}+ plazas`}
                                            name="capacidad"
                                            value={c}
                                            checked={filtros.capacidadMin === c}
                                            onChange={() => actualizarFiltro('capacidadMin', c)}
                                            labelClase="flotaFiltroRadioLabel"
                                            className="flotaFiltroRadio"
                                            textoClase="flotaFiltroRadioTexto"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ubicación */}
                        {ubicacionesUnicas.length > 1 && (
                            <div className="flotaFiltroBloque">
                                <h3 className="flotaFiltroBloqueTitle">Ubicación</h3>
                                <div className="flotaFiltroRadios">
                                    <CampoRadio
                                        label="Todas"
                                        name="ubicacion"
                                        value=""
                                        checked={filtros.ubicacion === ''}
                                        onChange={() => actualizarFiltro('ubicacion', '')}
                                        labelClase="flotaFiltroRadioLabel"
                                        className="flotaFiltroRadio"
                                        textoClase="flotaFiltroRadioTexto"
                                    />
                                    {ubicacionesUnicas.map(u => (
                                        <CampoRadio
                                            key={u}
                                            label={u}
                                            name="ubicacion"
                                            value={u}
                                            checked={filtros.ubicacion === u}
                                            onChange={() => actualizarFiltro('ubicacion', u)}
                                            labelClase="flotaFiltroRadioLabel"
                                            className="flotaFiltroRadio"
                                            textoClase="flotaFiltroRadioTexto"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Grid de vehículos */}
                    <div className="flotaGridArea">
                        <div className="flotaGridHeader">
                            <p className="flotaContador">
                                {vehiculosFiltrados.length} {vehiculosFiltrados.length === 1 ? 'vehículo' : 'vehículos'}
                            </p>
                        </div>

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
                                    onClick={limpiarFiltros}
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
                </div>
            </section>

            <Footer />
        </div>
    );
}

