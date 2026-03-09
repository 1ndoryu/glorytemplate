/**
 * SelectVehiculo — Selector personalizado de furgoneta con buscador, imagen y descripción.
 * Reemplaza el select nativo en el formulario de reserva.
 * Estilos en componentes.css — sin Tailwind ni estilos inline.
 */

import { useState, useCallback } from 'react';
import type { Vehiculo } from '@app/types/cresta';
import { Boton, Input, MenuContextual } from '@app/components/ui';

interface SelectVehiculoProps {
    vehiculos: Vehiculo[];
    vehiculoId: number;
    onChange: (id: number) => void;
    label?: string;
}

function IconoBuscar(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function IconoChevron({ abierto }: { abierto: boolean }): JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

export function SelectVehiculo({ vehiculos, vehiculoId, onChange, label = 'Furgoneta' }: SelectVehiculoProps): JSX.Element {
    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    const vehiculoSeleccionado = vehiculos.find(v => v.id === vehiculoId) ?? null;

    const vehiculosFiltrados = vehiculos.filter(v => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        return (
            v.nombre.toLowerCase().includes(q) ||
            (v.descripcionCorta ?? '').toLowerCase().includes(q) ||
            (v.ubicacion ?? '').toLowerCase().includes(q)
        );
    });

    const abrir = useCallback(() => {
        setAbierto(true);
        setBusqueda('');
    }, []);

    const seleccionar = useCallback((v: Vehiculo) => {
        onChange(v.id);
        setAbierto(false);
        setBusqueda('');
    }, [onChange]);

    const manejarApertura = useCallback((siguienteAbierto: boolean): void => {
        setAbierto(siguienteAbierto);
        if (!siguienteAbierto) {
            setBusqueda('');
        }
    }, []);

    return (
        <div>
            <label className="campoLabel">{label}</label>
            <MenuContextual
                abierto={abierto}
                onAbiertoChange={manejarApertura}
                className="selectVehiculo"
                panelClassName="selectVehiculoDropdown"
                role="listbox"
                trigger={
                    <Boton
                        type="button"
                        variante="icono"
                        className={`selectVehiculoTrigger ${abierto ? 'selectVehiculoTriggerAbierto' : ''}`}
                        onClick={abierto ? () => manejarApertura(false) : abrir}
                        aria-haspopup="listbox"
                        aria-expanded={abierto}
                    >
                        {vehiculoSeleccionado ? (
                            <span className="selectVehiculoSeleccionado">
                                {vehiculoSeleccionado.imagen && (
                                    <img
                                        src={vehiculoSeleccionado.imagen}
                                        alt={vehiculoSeleccionado.nombre}
                                        className="selectVehiculoMiniImg"
                                    />
                                )}
                                <span className="selectVehiculoNombreSelec">{vehiculoSeleccionado.nombre}</span>
                                <span className="selectVehiculoPrecioSelec">desde {vehiculoSeleccionado.precioBase}€/noche</span>
                            </span>
                        ) : (
                            <span className="selectVehiculoPlaceholder">Selecciona una furgoneta...</span>
                        )}
                        <IconoChevron abierto={abierto} />
                    </Boton>
                }
            >
                    {/* Buscador */}
                    <div className="selectVehiculoBuscadorWrap">
                        <IconoBuscar />
                        <Input
                            type="text"
                            className="selectVehiculoBuscador"
                            placeholder="Buscar furgoneta..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            aria-label="Buscar furgoneta"
                        />
                    </div>

                    {/* Lista de vehículos */}
                    <ul className="selectVehiculoLista">
                        {vehiculosFiltrados.length === 0 ? (
                            <li className="selectVehiculoVacio">No se encontraron resultados</li>
                        ) : (
                            vehiculosFiltrados.map(v => (
                                <li
                                    key={v.id}
                                    role="option"
                                    aria-selected={v.id === vehiculoId}
                                    className={`selectVehiculoOpcion ${v.id === vehiculoId ? 'selectVehiculoOpcionActiva' : ''}`}
                                    onClick={() => seleccionar(v)}
                                >
                                    {v.imagen ? (
                                        <img
                                            src={v.imagen}
                                            alt={v.nombre}
                                            className="selectVehiculoOpcionImg"
                                        />
                                    ) : (
                                        <div className="selectVehiculoOpcionImgPlaceholder" />
                                    )}
                                    <div className="selectVehiculoOpcionTexto">
                                        <div className="selectVehiculoOpcionCabecera">
                                            <span className="selectVehiculoOpcionNombre">{v.nombre}</span>
                                            <span className="selectVehiculoOpcionPrecio">desde {v.precioBase}€/noche</span>
                                        </div>
                                        {v.descripcionCorta && (
                                            <span className="selectVehiculoOpcionDesc">{v.descripcionCorta}</span>
                                        )}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
            </MenuContextual>
        </div>
    );
}
