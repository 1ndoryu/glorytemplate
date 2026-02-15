/*
 * Componente: PasoSubida — Kamples
 * Progreso de subida de samples en SubirModal (paso 3).
 * Muestra el estado de cada archivo en la cola.
 */

import { Music } from 'lucide-react';
import { BotonBase, BarraProgreso } from '@app/components/ui';

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
}: Props): JSX.Element => (
    <div className="subirFormulario">
        {archivos.map((a, i) => (
            <div key={i}>
                <div className="subirPreview">
                    <div className="subirPreviewIcono">
                        <Music size={20} />
                    </div>
                    <div className="subirPreviewInfo">
                        <div className="subirPreviewNombre">{a.nombre}</div>
                        <div className="subirPreviewMeta">
                            {i < archivoActual
                                ? 'Completado'
                                : i === archivoActual
                                  ? 'Subiendo...'
                                  : 'En espera'}
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
                    Cerrar
                </BotonBase>
                <BotonBase variante="primario" onClick={onSubirMas}>
                    Subir más samples
                </BotonBase>
            </div>
        )}
    </div>
);
