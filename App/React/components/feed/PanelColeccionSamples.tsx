/*
 * Componente: PanelColeccionSamples — Kamples
 * [183A-54] Muestra los samples de una colección en el panel lateral.
 * Carga la colección completa via API para obtener la lista de samples.
 */

import { useEffect, useState } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { obtenerColeccion } from '@app/services/apiColecciones';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import type { SampleResumen, Coleccion } from '@app/types';
import { BotonBase } from '../ui/BotonBase';
import { useT } from '@app/utils/i18n/useT';

interface PanelColeccionSamplesProps {
    coleccion: Coleccion;
}

export const PanelColeccionSamples = ({ coleccion }: PanelColeccionSamplesProps): JSX.Element => {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const navegar = useNavigationStore(s => s.navegar);
    const cerrar = usePanelLateralStore(s => s.cerrar);

    const { t } = useT();

    useEffect(() => {
        let activo = true;
        setCargando(true);

        const cargar = async () => {
            const resp = await obtenerColeccion(coleccion.id);
            if (!activo) return;
            setSamples(resp.ok && resp.data?.samples ? resp.data.samples : []);
            setCargando(false);
        };

        cargar();
        return () => { activo = false; };
    }, [coleccion.id]);

    const irAColeccion = () => {
        navegar(`/coleccion/${coleccion.slug ?? coleccion.id}/`);
    };

    return (
        <div className="panelSugerencias">
            <div className="panelSugerenciasCabecera">
                <div className="panelSugerenciasTitulo panelColeccionTitulo" onClick={irAColeccion} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && irAColeccion()}>
                    <FolderOpen size={16} />
                    <span>{coleccion.nombre}</span>
                </div>
                <BotonBase variante="ghost" className="panelDetalleCerrar" onClick={cerrar} type="button" aria-label={t('comun.cerrar')}>
                    <X size={16} />
                </BotonBase>
            </div>

            {cargando ? (
                <div className="panelSugerenciasCargando">{t('panel.coleccion.cargando')}</div>
            ) : samples.length === 0 ? (
                <div className="panelSugerenciasVacio">{t('panel.coleccion.vacio')}</div>
            ) : (
                <div className="panelSugerenciasLista">
                    {/* [183A-70] className panelDetalleTarjetaMini para tarjeta compacta (igual que "También te podría gustar" en PanelDetalleSample) */}
                    {samples.map(s => (
                        <TarjetaSample
                            key={s.id}
                            sample={s}
                            contexto={samples}
                            onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                            className="panelDetalleTarjetaMini"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
