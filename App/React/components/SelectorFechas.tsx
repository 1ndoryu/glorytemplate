/**
 * SelectorFechas — Componente para seleccionar rango de fechas (recogida / devolución).
 * Usa CampoFechaPersonalizado para mostrar un calendario propio sin depender del browser.
 * Estilos en componentes.css — sin Tailwind ni estilos inline.
 */

import { useCallback } from 'react';
import { CampoFechaPersonalizado } from '@app/components/ui';

interface SelectorFechasProps {
    fechaInicio: string;
    fechaFin: string;
    onChange: (inicio: string, fin: string) => void;
    minDate?: string;
    disabled?: boolean;
    className?: string;
    compact?: boolean;
}

function hoy(): string {
    return new Date().toISOString().split('T')[0];
}

function sumarDias(fecha: string, dias: number): string {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0];
}

function calcularNoches(inicio: string, fin: string): number {
    const d1 = new Date(inicio + 'T12:00:00');
    const d2 = new Date(fin + 'T12:00:00');
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
}

export function SelectorFechas({
    fechaInicio,
    fechaFin,
    onChange,
    minDate,
    disabled = false,
    className = '',
    compact = false,
}: SelectorFechasProps): JSX.Element {
    const minimo = minDate ?? sumarDias(hoy(), 2);
    const minFin = fechaInicio ? sumarDias(fechaInicio, 2) : sumarDias(minimo, 2);

    const manejarInicioChange = useCallback((nuevoInicio: string) => {
        let nuevoFin = fechaFin;
        if (nuevoFin && nuevoFin <= nuevoInicio) {
            nuevoFin = sumarDias(nuevoInicio, 2);
        }
        onChange(nuevoInicio, nuevoFin);
    }, [fechaFin, onChange]);

    const manejarFinChange = useCallback((nuevoFin: string) => {
        onChange(fechaInicio, nuevoFin);
    }, [fechaInicio, onChange]);

    if (compact) {
        return (
            <div className={`selectorFechasCompacto ${className}`}>
                <CampoFechaPersonalizado
                    value={fechaInicio}
                    onChange={manejarInicioChange}
                    min={minimo}
                    disabled={disabled}
                    placeholder="Recogida"
                />
                <span className="selectorFechasFlecha">&rarr;</span>
                <CampoFechaPersonalizado
                    value={fechaFin}
                    onChange={manejarFinChange}
                    min={minFin}
                    disabled={disabled || !fechaInicio}
                    placeholder="Devolución"
                />
            </div>
        );
    }

    return (
        <div className={`selectorFechas ${className}`}>
            <div className="selectorFechasGrid">
                {/* Recogida */}
                <div className="selectorFechasCampo">
                    <label className="selectorFechasLabel">Recogida</label>
                    <CampoFechaPersonalizado
                        value={fechaInicio}
                        onChange={manejarInicioChange}
                        min={minimo}
                        disabled={disabled}
                        placeholder="Seleccionar fecha"
                    />
                </div>

                {/* Devolución */}
                <div className="selectorFechasCampo">
                    <label className="selectorFechasLabel">Devolución</label>
                    <CampoFechaPersonalizado
                        value={fechaFin}
                        onChange={manejarFinChange}
                        min={minFin}
                        disabled={disabled || !fechaInicio}
                        placeholder="Seleccionar fecha"
                    />
                </div>
            </div>

            {fechaInicio && fechaFin && (
                <div className="selectorFechasNoches">
                    {calcularNoches(fechaInicio, fechaFin)} noches
                </div>
            )}
        </div>
    );
}
