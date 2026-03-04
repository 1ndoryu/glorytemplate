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
import type { VehiculoDetalleResponse, NombreTemporada } from '@app/types/cresta';

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
            <div className="paginaBase">
                <Header />
                <div className="cargando">
                    <div className="cargandoSpinner" />
                </div>
            </div>
        );
    }

    if (error || !vehiculo) {
        return (
            <div className="paginaBase">
                <Header />
                <div className="contenedorEstrecho detalleLayout">
                    <h1 className="detalleTitulo">Vehículo no encontrado</h1>
                    <p className="detalleUbicacion">{error ?? 'El vehículo solicitado no existe o no está disponible.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="paginaBase">
            <Header />

            <div className="detalleLayout">
                <div className="contenedor">
                    {/* Grid principal */}
                    <div className="detalleGrid">
                        {/* Columna izquierda — Galería + Info */}
                        <div className="detalleColumnaIzq">
                            {/* Galería */}
                            <Galeria imagenes={vehiculo.galeria} />

                            {/* Título y descripción */}
                            <div>
                                <h1 className="detalleTitulo">{vehiculo.nombre}</h1>
                                {vehiculo.ubicacion && (
                                    <p className="detalleUbicacion">📍 {vehiculo.ubicacion}</p>
                                )}
                            </div>

                            {/* Especificaciones */}
                            <div className="panelBlanco">
                                <h2 className="panelTitulo">Especificaciones</h2>
                                <div className="specsGrid">
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
                                <div className="panelBlanco">
                                    <h2 className="panelTitulo">Equipamiento incluido</h2>
                                    <div className="equipamientoGrid">
                                        {vehiculo.equipamiento.map(item => (
                                            <div key={item} className="equipamientoItem">
                                                <span className="equipamientoCheck">✓</span>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contenido */}
                            {vehiculo.contenido && (
                                <div className="panelBlanco legalHtml"
                                    dangerouslySetInnerHTML={{ __html: vehiculo.contenido }}
                                />
                            )}

                            {/* Tabla de precios */}
                            {vehiculo.precios.length > 0 && (
                                <div className="panelBlanco">
                                    <h2 className="panelTitulo">Precios por temporada</h2>
                                    <div>
                                        <table className="preciosTabla">
                                            <thead>
                                                <tr>
                                                    <th>Temporada</th>
                                                    <th>Precio/noche</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vehiculo.precios.map(p => (
                                                    <tr key={p.temporada}>
                                                        <td>{NOMBRE_TEMPORADA[p.temporada]}</td>
                                                        <td>{p.precioNoche.toFixed(2)}€</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Columna derecha — Sidebar sticky */}
                        <div className="detalleSidebar">
                            {/* Precio badge */}
                            <div className="detallePrecioBadge">
                                <div className="detallePrecioDesde">Desde</div>
                                <div className="detallePrecioValor">{vehiculo.precioBase}€</div>
                                <div className="detallePrecioUnidad">por noche</div>
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
                                    className="botonSecundario"
                                >
                                    {loadingDisp ? 'Verificando...' : 'Verificar disponibilidad'}
                                </button>
                            )}

                            {/* Resultado de disponibilidad */}
                            {disponible !== null && (
                                <div className={disponible ? 'alertaExito' : 'alertaError'}>
                                    {disponible ? (
                                        <span>✓ Disponible para las fechas seleccionadas</span>
                                    ) : (
                                        <span>✗ {motivo ?? 'No disponible'}</span>
                                    )}
                                </div>
                            )}

                            {/* Resumen de precio */}
                            {disponible && precio && (
                                <>
                                    <ResumenPrecio calculo={precio} fianza={vehiculo.fianza} />
                                    <button
                                        onClick={handleReservar}
                                        className="botonPrimario"
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
                                <div className="panelBlanco">
                                    <h3 className="panelTitulo">Cancelación</h3>
                                    <p className="detalleUbicacion">{vehiculo.politicaCancelacion}</p>
                                </div>
                            )}
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
        <div className="specItem">
            <span className="specIcono">{icon}</span>
            <div>
                <div className="specLabel">{label}</div>
                <div className="specValor">{value}</div>
            </div>
        </div>
    );
}
