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

interface PanelSugerenciasProps {
    sample: SampleResumen;
}

export const PanelSugerencias = ({ sample }: PanelSugerenciasProps): JSX.Element => {
    const [sugerencias, setSugerencias] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const { navegar } = useNavigationStore();
    const { cerrar } = usePanelLateralStore();

    useEffect(() => {
        let activo = true;
        setCargando(true);

        const cargar = async () => {
            const resp = await obtenerSimilares(sample.id, 6);
            if (!activo) return;
            setSugerencias(resp.ok && resp.data?.data ? resp.data.data : []);
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
                <button className="panelDetalleCerrar" onClick={cerrar} type="button" aria-label="Cerrar">
                    <X size={16} />
                </button>
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
