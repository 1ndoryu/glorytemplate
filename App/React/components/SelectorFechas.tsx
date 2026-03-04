/**
 * SelectorFechas — Componente para seleccionar rango de fechas (recogida / devolución).
 * Estilo prominente tipo roadsurfer/yescapa.
 */

import { useState, useCallback } from 'react';

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

    const handleInicioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoInicio = e.target.value;
        let nuevoFin = fechaFin;

        // Si la fecha de fin es anterior a la nueva de inicio, ajustarla
        if (nuevoFin && nuevoFin <= nuevoInicio) {
            nuevoFin = sumarDias(nuevoInicio, 2);
        }

        onChange(nuevoInicio, nuevoFin);
    }, [fechaFin, onChange]);

    const handleFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(fechaInicio, e.target.value);
    }, [fechaInicio, onChange]);

    const minFin = fechaInicio ? sumarDias(fechaInicio, 2) : sumarDias(minimo, 2);

    if (compact) {
        return (
            <div className={`flex gap-2 items-center ${className}`}>
                <input
                    type="date"
                    value={fechaInicio}
                    onChange={handleInicioChange}
                    min={minimo}
                    disabled={disabled}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-gray-400">→</span>
                <input
                    type="date"
                    value={fechaFin}
                    onChange={handleFinChange}
                    min={minFin}
                    disabled={disabled || !fechaInicio}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recogida */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                        📅 Recogida
                    </label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={handleInicioChange}
                        onFocus={() => setFocusField('inicio')}
                        onBlur={() => setFocusField(null)}
                        min={minimo}
                        disabled={disabled}
                        className={`w-full border rounded-xl px-4 py-3 text-lg transition-all
                            ${focusField === 'inicio' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}
                            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-green-300'}
                        `}
                    />
                    {fechaInicio && (
                        <span className="text-xs text-gray-500 mt-1 block">{formatearFecha(fechaInicio)}</span>
                    )}
                </div>

                {/* Devolución */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                        📅 Devolución
                    </label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={handleFinChange}
                        onFocus={() => setFocusField('fin')}
                        onBlur={() => setFocusField(null)}
                        min={minFin}
                        disabled={disabled || !fechaInicio}
                        className={`w-full border rounded-xl px-4 py-3 text-lg transition-all
                            ${focusField === 'fin' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}
                            ${disabled || !fechaInicio ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-green-300'}
                        `}
                    />
                    {fechaFin && (
                        <span className="text-xs text-gray-500 mt-1 block">{formatearFecha(fechaFin)}</span>
                    )}
                </div>
            </div>

            {fechaInicio && fechaFin && (
                <div className="mt-3 text-center text-sm text-gray-600">
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
