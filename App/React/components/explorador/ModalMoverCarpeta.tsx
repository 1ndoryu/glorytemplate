/*
 * ModalMoverCarpeta — Modal para seleccionar carpeta destino al mover un sample.
 * Usa componente Modal base (antes implementaba overlay artesanal).
 */

import { Folder } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Modal } from '@app/components/ui/Modal';

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
    <Modal abierto={true} onCerrar={onCerrar} tamano="pequeno">
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
    </Modal>
);
