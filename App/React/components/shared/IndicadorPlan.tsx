/**
 * IndicadorPlan
 *
 * Muestra el plan actual del usuario en el header.
 * Badge compacto con estado visual (FREE/PREMIUM/TRIAL).
 *
 * @package App/React/components/shared
 */

import type {InfoSuscripcion} from '../../types/dashboard';

interface IndicadorPlanProps {
    suscripcion: InfoSuscripcion;
    onClick?: () => void;
}

export function IndicadorPlan({suscripcion, onClick}: IndicadorPlanProps) {
    const {plan, estado, diasRestantes} = suscripcion;

    const obtenerClase = (): string => {
        if (plan === 'premium') {
            if (estado === 'trial') {
                return 'indicadorPlan indicadorPlan--trial';
            }
            return 'indicadorPlan indicadorPlan--premium';
        }
        return 'indicadorPlan indicadorPlan--free';
    };

    const obtenerTexto = (): string => {
        if (plan === 'premium') {
            if (estado === 'trial') {
                return `TRIAL (${diasRestantes}d)`;
            }
            return 'PREMIUM';
        }
        return 'FREE';
    };

    const obtenerIcono = (): string => {
        if (plan === 'premium') {
            return '★';
        }
        return '○';
    };

    return (
        <button id="indicador-plan" className={obtenerClase()} onClick={onClick} title={plan === 'free' ? 'Actualizar a Premium' : 'Ver detalles del plan'}>
            <span className="indicadorPlan__icono">{obtenerIcono()}</span>
            <span className="indicadorPlan__texto">{obtenerTexto()}</span>
        </button>
    );
}
