/*
 * Componente: PasoSubida — Kamples
 * Progreso de subida de samples en SubirModal (paso 3).
 * Muestra el estado de cada archivo en la cola.
 */

import { Music } from 'lucide-react';
import { BotonBase, BarraProgreso } from '@app/components/ui';
import { useT } from '@app/utils/i18n/useT';

interface ArchivoSubida {
    archivo: File;
    nombre: string;
    tamano: string;
    formato: string;
}

interface Props {
    archivos: ArchivoSubida[];
    archivoActual: number;
    progresoCarga: number;
    subiendo: boolean;
    onCerrar: () => void;
    onSubirMas: () => void;
}

export const PasoSubida = ({
    archivos,
    archivoActual,
    progresoCarga,
    subiendo,
    onCerrar,
    onSubirMas,
}: Props): JSX.Element => {
    const { t } = useT();
    return (
    <div className="subirFormulario">
        {archivos.map((a, i) => (
            <div key={a.nombre}>
                <div className="subirPreview">
                    <div className="subirPreviewIcono">
                        <Music size={20} />
                    </div>
                    <div className="subirPreviewInfo">
                        <div className="subirPreviewNombre">{a.nombre}</div>
                        <div className="subirPreviewMeta">
                            {i < archivoActual
                                ? t('subir.completado')
                                : i === archivoActual
                                  ? t('subir.subiendo')
                                  : t('subir.enEspera')}
                        </div>
                    </div>
                </div>
                <BarraProgreso
                    porcentaje={
                        i < archivoActual ? 100 : i === archivoActual ? progresoCarga : 0
                    }
                    estado={
                        i < archivoActual ? 'exito' : 'normal'
                    }
                    mostrarPorcentaje={i === archivoActual}
                />
            </div>
        ))}
        {!subiendo && (
            <div className="subirAcciones">
                <BotonBase variante="ghost" onClick={onCerrar}>
                    {t('comun.cerrar')}
                </BotonBase>
                <BotonBase variante="primario" onClick={onSubirMas}>
                    {t('subir.subirMas')}
                </BotonBase>
            </div>
        )}
    </div>
    );
};
