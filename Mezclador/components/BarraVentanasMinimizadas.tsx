/*
 * BarraVentanasMinimizadas — Iconos en la parte inferior del mezclador
 * C287: Muestra las ventanas minimizadas como iconos clickeables para restaurarlas.
 */

import { Settings, Music } from 'lucide-react';
import { useVentanasStore } from '../stores/ventanasStore';
import { BotonBase } from '@app/components/ui/BotonBase';

export const BarraVentanasMinimizadas = (): JSX.Element | null => {
    const ventanas = useVentanasStore(s => s.ventanas);
    const restaurar = useVentanasStore(s => s.restaurarVentana);

    const minimizadas = ventanas.filter(v => v.minimizada);
    if (minimizadas.length === 0) return null;

    return (
        <div className="barraVentanasMinimizadas">
            {minimizadas.map(v => (
                <BotonBase variante="ghost"
                    key={v.id}
                    className="ventanaMinimizadaIcono"
                    onClick={() => restaurar(v.id)}
                    title={v.titulo}
                >
                    {v.tipo === 'configDaw' ? <Settings size={12} /> : <Music size={12} />}
                    <span className="ventanaMinimizadaLabel">{v.titulo}</span>
                </BotonBase>
            ))}
        </div>
    );
};
