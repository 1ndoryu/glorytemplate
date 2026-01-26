import React from 'react';
import {LucideIcon} from 'lucide-react';
import {Tarjeta} from '../../ui/Tarjeta';

export interface TarjetaResumenProps {
    etiqueta: string;
    valor: string | number;
    subtexto?: string;
    icono?: LucideIcon;
    variante?: 'neutro' | 'primario' | 'exito' | 'alerta' | 'error';
    accion?: React.ReactNode;
    className?: string;
}

/**
 * Componente unificado para tarjetas de resumen (dashboard stats).
 * Soporta variantes con icono (Admin) y variantes simples con acción (Cliente).
 */
export const TarjetaResumen: React.FC<TarjetaResumenProps> = ({etiqueta, valor, subtexto, icono: Icono, variante = 'neutro', accion, className = ''}) => {
    return (
        <Tarjeta className={`tarjetaResumen ${className}`}>
            {Icono && (
                <div className={`tarjetaResumenIcono tarjetaResumenIcono--${variante}`}>
                    <Icono size={20} />
                </div>
            )}

            <div className="tarjetaResumenContenido">
                <span className="tarjetaResumenEtiqueta">{etiqueta}</span>
                <span className={`tarjetaResumenValor ${variante === 'error' || variante === 'alerta' ? 'textoAlerta' : ''}`}>{valor}</span>
                {subtexto && <span className="tarjetaResumenSubtexto">{subtexto}</span>}
            </div>

            {accion && <div className="tarjetaResumenAccion">{accion}</div>}
        </Tarjeta>
    );
};
