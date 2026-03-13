/*
 * Componente: PanelSugerencias — Kamples (C86)
 * Panel de "También te podría gustar" para la columna lateral.
 * Carga samples similares al sample origen.
 */

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { obtenerSimilares } from '@app/services/apiReproduciones';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import type { SampleResumen } from '@app/types';
import { BotonBase } from '../ui/BotonBase';

interface PanelSugerenciasProps {
    sample: SampleResumen;
}

export const PanelSugerencias = ({ sample }: PanelSugerenciasProps): JSX.Element => {
    const [sugerencias, setSugerencias] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const navegar = useNavigationStore(s => s.navegar);
    const cerrar = usePanelLateralStore(s => s.cerrar);

    useEffect(() => {
        let activo = true;
        setCargando(true);

        const cargar = async () => {
            const resp = await obtenerSimilares(sample.id, 26);
            if (!activo) return;
            setSugerencias(resp.ok && resp.data ? resp.data : []);
            setCargando(false);
        };

        cargar();
        return () => { activo = false; };
    }, [sample.id]);

    return (
        <div className="panelSugerencias">
            <div className="panelSugerenciasCabecera">
                <div className="panelSugerenciasTitulo">
                    <Sparkles size={16} />
                    <span>También te podría gustar</span>
                </div>
                <BotonBase variante="ghost" className="panelDetalleCerrar" onClick={cerrar} type="button" aria-label="Cerrar">
                    <X size={16} />
                </BotonBase>
            </div>

            {cargando ? (
                <div className="panelSugerenciasCargando">Buscando sugerencias...</div>
            ) : sugerencias.length === 0 ? (
                <div className="panelSugerenciasVacio">No hay sugerencias disponibles</div>
            ) : (
                <div className="panelSugerenciasLista">
                    {sugerencias.map(s => (
                        <TarjetaSample
                            key={s.id}
                            sample={s}
                            contexto={sugerencias}
                            onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                            className="panelDetalleTarjetaMini"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PanelSugerencias;
