/*
 * ModalMoverCarpeta — Modal para seleccionar carpeta destino al mover un sample.
 */

import { Folder } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';

interface CarpetaInfo {
    primaria: string;
    total: number;
    subcarpetas: { nombre: string; total: number }[];
}

interface ModalMoverCarpetaProps {
    todasCarpetas: CarpetaInfo[];
    onMover: (primaria: string, subcarpeta?: string) => void;
    onCerrar: () => void;
}

export const ModalMoverCarpeta = ({
    todasCarpetas,
    onMover,
    onCerrar,
}: ModalMoverCarpetaProps): JSX.Element => (
    <div className="exploradorModalOverlay" onClick={onCerrar}>
        <div className="exploradorModalContenido" onClick={(e) => e.stopPropagation()}>
            <h3 className="exploradorModalTitulo">Mover a carpeta</h3>
            <div className="exploradorModalLista">
                {todasCarpetas.map((c) => (
                    <div key={c.primaria}>
                        <BotonBase
                            variante="ghost"
                            className="exploradorModalItem"
                            onClick={() => onMover(c.primaria)}
                            type="button"
                        >
                            <Folder size={16} />
                            <span>{c.primaria}</span>
                        </BotonBase>
                        {c.subcarpetas.map((sub) => (
                            <BotonBase
                                key={sub.nombre}
                                variante="ghost"
                                className="exploradorModalItem exploradorModalSubItem"
                                onClick={() => onMover(c.primaria, sub.nombre)}
                                type="button"
                            >
                                <Folder size={12} />
                                <span>{sub.nombre}</span>
                            </BotonBase>
                        ))}
                    </div>
                ))}
            </div>
            <BotonBase
                variante="secundario"
                className="exploradorModalCerrar"
                onClick={onCerrar}
                type="button"
            >
                Cancelar
            </BotonBase>
        </div>
    </div>
);
