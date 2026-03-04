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
    baja: 'resumenPrecioTemporadaBaja',
    media: 'resumenPrecioTemporadaMedia',
    alta: 'resumenPrecioTemporadaAlta',
    especial: 'resumenPrecioTemporadaEspecial',
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
        <div className={`resumenPrecio ${className}`}>
            <h3 className="resumenPrecioTitulo">Resumen de precio</h3>

            {/* Desglose por temporada */}
            <div className="resumenPrecioDesglose">
                {grupos.map(grupo => (
                    <div key={grupo.temporada} className="resumenPrecioFila">
                        <div className="resumenPrecioDetalle">
                            <span className={`resumenPrecioTemporada ${COLOR_TEMPORADA[grupo.temporada]}`}>
                                {NOMBRE_TEMPORADA[grupo.temporada]}
                            </span>
                            <span className="resumenPrecioDetalle">
                                {grupo.noches} {grupo.noches === 1 ? 'noche' : 'noches'} × {grupo.precioNoche.toFixed(2)}€
                            </span>
                        </div>
                        <span className="resumenPrecioSubtotal">{grupo.subtotal.toFixed(2)}€</span>
                    </div>
                ))}
            </div>

            {/* Separador */}
            <div className="resumenPrecioSeparador" />

            {/* Total */}
            <div className="resumenPrecioTotalFila">
                <span className="resumenPrecioTotalLabel">Total ({calculo.noches} noches)</span>
                <span className="resumenPrecioTotalValor">{calculo.total.toFixed(2)}€</span>
            </div>

            {/* Info de fianza */}
            {fianza && fianza > 0 && (
                <div className="resumenPrecioFianza">
                    <strong>Fianza:</strong> {fianza.toFixed(2)}€ — Se bloquea en la tarjeta y se devuelve tras la entrega del vehículo.
                </div>
            )}
        </div>
    );
}
