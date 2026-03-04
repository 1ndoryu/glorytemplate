/**
 * ResumenPrecio — Muestra el desglose de precio de una reserva.
 */

import type { CalculoPrecio, NombreTemporada } from '@app/types/cresta';

interface ResumenPrecioProps {
    calculo: CalculoPrecio;
    fianza?: number;
    className?: string;
}

const NOMBRE_TEMPORADA: Record<NombreTemporada, string> = {
    baja: 'Temporada baja',
    media: 'Temporada media',
    alta: 'Temporada alta',
    especial: 'Fechas especiales',
};

const COLOR_TEMPORADA: Record<NombreTemporada, string> = {
    baja: 'bg-blue-50 text-blue-700',
    media: 'bg-yellow-50 text-yellow-700',
    alta: 'bg-orange-50 text-orange-700',
    especial: 'bg-red-50 text-red-700',
};

export function ResumenPrecio({ calculo, fianza, className = '' }: ResumenPrecioProps): JSX.Element {
    // Agrupar noches por temporada
    const agrupado = calculo.desglose.reduce<Record<string, { temporada: NombreTemporada; noches: number; subtotal: number; precioNoche: number }>>((acc, noche) => {
        const key = noche.temporada;
        if (!acc[key]) {
            acc[key] = { temporada: noche.temporada, noches: 0, subtotal: 0, precioNoche: noche.precio };
        }
        acc[key].noches += 1;
        acc[key].subtotal += noche.precio;
        return acc;
    }, {});

    const grupos = Object.values(agrupado);

    return (
        <div className={`bg-white rounded-2xl shadow-md border border-gray-100 p-6 ${className}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de precio</h3>

            {/* Desglose por temporada */}
            <div className="space-y-3 mb-4">
                {grupos.map(grupo => (
                    <div key={grupo.temporada} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COLOR_TEMPORADA[grupo.temporada]}`}>
                                {NOMBRE_TEMPORADA[grupo.temporada]}
                            </span>
                            <span className="text-sm text-gray-500">
                                {grupo.noches} {grupo.noches === 1 ? 'noche' : 'noches'} × {grupo.precioNoche.toFixed(2)}€
                            </span>
                        </div>
                        <span className="font-medium text-gray-800">{grupo.subtotal.toFixed(2)}€</span>
                    </div>
                ))}
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-4" />

            {/* Total */}
            <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total ({calculo.noches} noches)</span>
                <span className="text-2xl font-bold text-green-600">{calculo.total.toFixed(2)}€</span>
            </div>

            {/* Info de fianza */}
            {fianza && fianza > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                    <strong>Fianza:</strong> {fianza.toFixed(2)}€ — Se bloquea en la tarjeta y se devuelve tras la entrega del vehículo.
                </div>
            )}
        </div>
    );
}
