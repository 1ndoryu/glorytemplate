/*
 * ResumenAdmin
 *
 * Tarjetas de resumen con estadísticas globales de usuarios.
 * Muestra total de usuarios, premium, trial y free.
 */

import {Users, Crown, Clock, User} from 'lucide-react';
import type {ResumenAdmin as TipoResumen} from '../../types/dashboard';

interface ResumenAdminProps {
    resumen: TipoResumen;
}

interface TarjetaEstadistica {
    icono: React.ReactNode;
    titulo: string;
    valor: number;
    clase: string;
}

export function ResumenAdmin({resumen}: ResumenAdminProps): JSX.Element {
    const tarjetas: TarjetaEstadistica[] = [
        {
            icono: <Users size={20} />,
            titulo: 'Total Usuarios',
            valor: resumen.totalUsuarios,
            clase: 'tarjetaTotal'
        },
        {
            icono: <Crown size={20} />,
            titulo: 'Premium',
            valor: resumen.premium,
            clase: 'tarjetaPremium'
        },
        {
            icono: <Clock size={20} />,
            titulo: 'En Trial',
            valor: resumen.trial,
            clase: 'tarjetaTrial'
        },
        {
            icono: <User size={20} />,
            titulo: 'Free',
            valor: resumen.free,
            clase: 'tarjetaFree'
        }
    ];

    return (
        <div id="resumen-admin" className="resumenAdmin">
            {tarjetas.map(({icono, titulo, valor, clase}) => (
                <div key={titulo} className={`tarjetaResumen ${clase}`}>
                    <div className="tarjetaIcono">{icono}</div>
                    <div className="tarjetaContenido">
                        <span className="tarjetaValor">{valor}</span>
                        <span className="tarjetaTitulo">{titulo}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
