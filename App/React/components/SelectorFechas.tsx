/**
 * SelectorFechas — Componente para seleccionar rango de fechas (recogida / devolución).
 * Estilos en componentes.css — sin Tailwind ni estilos inline.
 */

import { useState, useCallback } from 'react';
import { CampoFecha } from '@app/components/ui';

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
    const d = new Date(fecha);
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0];
}

function formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
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
    const [focusField, setFocusField] = useState<'inicio' | 'fin' | null>(null);
    const minimo = minDate ?? sumarDias(hoy(), 2);

    const handleInicioChange = useCallback((nuevoInicio: string) => {
        let nuevoFin = fechaFin;

        if (nuevoFin && nuevoFin <= nuevoInicio) {
            nuevoFin = sumarDias(nuevoInicio, 2);
        }

        onChange(nuevoInicio, nuevoFin);
    }, [fechaFin, onChange]);

    const handleFinChange = useCallback((nuevoFin: string) => {
        onChange(fechaInicio, nuevoFin);
    }, [fechaInicio, onChange]);

    const minFin = fechaInicio ? sumarDias(fechaInicio, 2) : sumarDias(minimo, 2);

    if (compact) {
        return (
            <div className={`selectorFechasCompacto ${className}`}>
                <CampoFecha
                    value={fechaInicio}
                    onChange={handleInicioChange}
                    min={minimo}
                    disabled={disabled}
                    className="selectorFechasInputCompacto"
                />
                <span className="selectorFechasFlecha">&rarr;</span>
                <CampoFecha
                    value={fechaFin}
                    onChange={handleFinChange}
                    min={minFin}
                    disabled={disabled || !fechaInicio}
                    className="selectorFechasInputCompacto"
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
                    <CampoFecha
                        value={fechaInicio}
                        onChange={handleInicioChange}
                        onFocus={() => setFocusField('inicio')}
                        onBlur={() => setFocusField(null)}
                        min={minimo}
                        disabled={disabled}
                        className={`selectorFechasInput ${focusField === 'inicio' ? 'selectorFechasInputFocus' : ''} ${disabled ? 'selectorFechasInputDisabled' : ''}`}
                    />
                    {fechaInicio && (
                        <span className="selectorFechasHint">{formatearFecha(fechaInicio)}</span>
                    )}
                </div>

                {/* Devolución */}
                <div className="selectorFechasCampo">
                    <label className="selectorFechasLabel">Devolución</label>
                    <CampoFecha
                        value={fechaFin}
                        onChange={handleFinChange}
                        onFocus={() => setFocusField('fin')}
                        onBlur={() => setFocusField(null)}
                        min={minFin}
                        disabled={disabled || !fechaInicio}
                        className={`selectorFechasInput ${focusField === 'fin' ? 'selectorFechasInputFocus' : ''} ${disabled || !fechaInicio ? 'selectorFechasInputDisabled' : ''}`}
                    />
                    {fechaFin && (
                        <span className="selectorFechasHint">{formatearFecha(fechaFin)}</span>
                    )}
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

function calcularNoches(inicio: string, fin: string): number {
    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
}
