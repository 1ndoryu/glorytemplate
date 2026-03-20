import { Layers3 } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { ModalAcciones } from '@app/components/ui/ModalAcciones';
import { useModalCrearVolumenColeccion } from '@app/hooks/useModalCrearVolumenColeccion';
import type { Coleccion } from '@app/types';
import '../../styles/componentes/modalVolumenColeccion.css';

interface ModalCrearVolumenColeccionProps {
    abierto: boolean;
    onCerrar: () => void;
    onCreado?: () => void | Promise<void>;
    coleccion: Coleccion | null;
}

export const ModalCrearVolumenColeccion = ({
    abierto,
    onCerrar,
    onCreado,
    coleccion,
}: ModalCrearVolumenColeccionProps): JSX.Element | null => {
    const {
        numeroVolumen,
        setNumeroVolumen,
        numero,
        nombrePrevisto,
        creando,
        manejarCrear,
    } = useModalCrearVolumenColeccion({ abierto, onCerrar, onCreado, coleccion });

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} tamano="pequeno">
            <div className="modalVolumenContenido">
                <div className="modalVolumenIcono">
                    <Layers3 size={32} />
                </div>

                <h3 className="modalVolumenTitulo">Crear volumen</h3>
                <p className="modalVolumenDescripcion">
                    Se creará una subcolección hija bajo <strong>{coleccion?.nombre}</strong> y se moverá aproximadamente la mitad de sus samples directos.
                </p>

                <div className="modalVolumenCampo">
                    <CampoTexto
                        etiqueta="Número de volumen"
                        type="number"
                        min={2}
                        step={1}
                        value={numeroVolumen}
                        onChange={(e) => setNumeroVolumen(e.target.value)}
                    />
                </div>

                {nombrePrevisto ? (
                    <div className="modalVolumenResumen">
                        Nuevo nombre: <strong>{nombrePrevisto}</strong>
                    </div>
                ) : (
                    <div className="modalVolumenResumen modalVolumenResumenError">
                        El volumen debe empezar en 2.
                    </div>
                )}

                <ModalAcciones>
                    <BotonBase variante="secundario" onClick={onCerrar}>
                        Cancelar
                    </BotonBase>
                    <BotonBase variante="primario" onClick={manejarCrear} disabled={creando || numero < 2}>
                        {creando ? 'Creando...' : 'Crear volumen'}
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalCrearVolumenColeccion;