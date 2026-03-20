/*
 * Componente: IndicadorDescargas — Kamples (Fase 2.10)
 * Muestra el estado de descargas: cuántas quedan, calidad, plan.
 * Usado en SampleDetalle y Libreria.
 */

import { Download, Crown } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import type { LimitesDescarga } from '@app/services/apiDescargas';
import { useT } from '@app/utils/i18n/useT';
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
    const { t } = useT();
    const restantes = limites.ilimitado
        ? Infinity
        : limites.limite - limites.usadas;

    const porcentaje = limites.ilimitado
        ? 100
        : (limites.usadas / limites.limite) * 100;

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
                        {t('descargas.ilimitadas')}
                    </span>
                ) : (
                    <span className="indicadorDescargasTexto">
                        {restantes > 0
                            ? t(restantes === 1 ? 'descargas.restanteHoy' : 'descargas.restantesHoy', { n: restantes })
                            : t('descargas.sinDisponibles')}
                    </span>
                )}
                <span className="indicadorDescargasCalidad">
                    {limites.calidad.toUpperCase()}
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
                    {descargando ? t('descargas.descargando') : t('seleccionMultiple.descargar')}
                </BotonBase>
            )}

            {/* Upgrade CTA si está en límite */}
            {!limites.ilimitado && restantes <= 0 && (
                <span className="indicadorDescargasUpgrade">
                    {t('descargas.mejorarPlan')}
                </span>
            )}
        </div>
    );
};

export default IndicadorDescargas;
