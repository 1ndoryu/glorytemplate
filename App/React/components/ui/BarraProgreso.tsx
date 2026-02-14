/*
 * Componente: BarraProgreso
 * Barra de progreso reutilizable para uploads y procesamiento.
 */

import '../../styles/componentes/barraProgreso.css';

type EstadoProgreso = 'normal' | 'exito' | 'error' | 'indeterminado';

interface BarraProgresoProps {
    porcentaje?: number;
    estado?: EstadoProgreso;
    etiqueta?: string;
    mostrarPorcentaje?: boolean;
    className?: string;
}

const claseEstado: Record<EstadoProgreso, string> = {
    normal: '',
    exito: 'progresoExito',
    error: 'progresoError',
    indeterminado: 'progresoIndeterminado',
};

export const BarraProgreso = ({
    porcentaje = 0,
    estado = 'normal',
    etiqueta,
    mostrarPorcentaje = true,
    className = '',
}: BarraProgresoProps): JSX.Element => {
    const porcentajeReal = Math.min(100, Math.max(0, porcentaje));

    return (
        <div className={`contenedorBarraProgreso ${className}`}>
            <div className="pistaProgreso">
                <div
                    className={`rellenoProgreso ${claseEstado[estado]}`}
                    style={estado !== 'indeterminado' ? { width: `${porcentajeReal}%` } : undefined}
                    role="progressbar"
                    aria-valuenow={porcentajeReal}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
            {(etiqueta || mostrarPorcentaje) && estado !== 'indeterminado' && (
                <div className="infoProgreso">
                    {etiqueta && <span className="textoProgreso">{etiqueta}</span>}
                    {mostrarPorcentaje && (
                        <span className="porcentajeProgreso">{porcentajeReal}%</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default BarraProgreso;
