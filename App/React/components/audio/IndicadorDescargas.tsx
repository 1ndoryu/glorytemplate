/*
 * Componente: IndicadorDescargas — Kamples (Fase 2.10)
 * Muestra el estado de descargas: cuántas quedan, calidad, plan.
 * Usado en SampleDetalle y Libreria.
 */

import { Download, Crown } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import type { LimitesDescarga } from '@app/services/apiDescargas';
import '../../styles/componentes/indicadorDescargas.css';

interface IndicadorDescargasProps {
    limites: LimitesDescarga;
    onDescargar?: () => void;
    descargando?: boolean;
    puedeDescargar?: boolean;
}

export const IndicadorDescargas = ({
    limites,
    onDescargar,
    descargando = false,
    puedeDescargar = true,
}: IndicadorDescargasProps): JSX.Element => {
    const restantes = limites.ilimitado
        ? Infinity
        : limites.limitesDiarios - limites.descargasHoy;

    const porcentaje = limites.ilimitado
        ? 100
        : (limites.descargasHoy / limites.limitesDiarios) * 100;

    return (
        <div className="indicadorDescargas">
            {/* Barra de progreso */}
            {!limites.ilimitado && (
                <div className="indicadorDescargasBarra">
                    <div
                        className="indicadorDescargasRelleno"
                        style={{ width: `${Math.min(100, porcentaje)}%` }}
                    />
                </div>
            )}

            {/* Texto informativo */}
            <div className="indicadorDescargasInfo">
                {limites.ilimitado ? (
                    <span className="indicadorDescargasTexto">
                        <Crown size={12} />
                        Descargas ilimitadas
                    </span>
                ) : (
                    <span className="indicadorDescargasTexto">
                        {restantes > 0
                            ? `${restantes} descarga${restantes !== 1 ? 's' : ''} restante${restantes !== 1 ? 's' : ''} hoy`
                            : 'Sin descargas disponibles'}
                    </span>
                )}
                <span className="indicadorDescargasCalidad">
                    {limites.calidadDisponible.toUpperCase()}
                </span>
            </div>

            {/* Botón descargar */}
            {onDescargar && (
                <BotonBase
                    variante={puedeDescargar ? 'primario' : 'ghost'}
                    tamano="sm"
                    onClick={onDescargar}
                    disabled={!puedeDescargar || descargando}
                    cargando={descargando}
                >
                    <Download size={14} />
                    {descargando ? 'Descargando...' : 'Descargar'}
                </BotonBase>
            )}

            {/* Upgrade CTA si está en límite */}
            {!limites.ilimitado && restantes <= 0 && (
                <span className="indicadorDescargasUpgrade">
                    Mejora tu plan para más descargas
                </span>
            )}
        </div>
    );
};

export default IndicadorDescargas;
