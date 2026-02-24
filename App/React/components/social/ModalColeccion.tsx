/*
 * Componente: ModalColeccion — Kamples
 * Modal para crear o editar una colección de samples.
 */

import { FolderPlus } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Checkbox } from '@app/components/ui/Checkbox';
import { useModalColeccion } from '@app/hooks/useModalColeccion';
import type { Coleccion } from '@app/types';
import '../../styles/componentes/modalColeccion.css';

interface ModalColeccionProps {
    abierto: boolean;
    onCerrar: () => void;
    onGuardar?: (coleccion: Coleccion) => void;
    /* Si se pasa, modo edición */
    coleccion?: Coleccion | null;
}

export const ModalColeccion = ({
    abierto,
    onCerrar,
    onGuardar,
    coleccion = null,
}: ModalColeccionProps): JSX.Element | null => {
    const {
        esEdicion,
        nombre,
        setNombre,
        descripcion,
        setDescripcion,
        esPublica,
        setEsPublica,
        guardando,
        manejarGuardar,
        titulo,
    } = useModalColeccion({ abierto, onCerrar, onGuardar, coleccion });

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} tamano="pequeno">
            <div className="modalColeccionContenido">
                <div className="modalColeccionIcono">
                    <FolderPlus size={32} />
                </div>

                <CampoTexto
                    etiqueta="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Mi colección..."
                    maxLength={100}
                    autoFocus
                />

                <CampoTexto
                    etiqueta="Descripción"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción (opcional)"
                    maxLength={300}
                />

                <label className="modalColeccionPublica">
                    <Checkbox
                        checked={esPublica}
                        onChange={(e) => setEsPublica(e.target.checked)}
                    />
                    <span>Colección pública</span>
                    <span className="modalColeccionPublicaHint">
                        Otros usuarios podrán ver esta colección
                    </span>
                </label>

                <div className="modalColeccionAcciones">
                    <BotonBase variante="ghost" onClick={onCerrar}>
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        onClick={manejarGuardar}
                        disabled={!nombre.trim() || guardando}
                    >
                        {guardando ? 'Guardando...' : esEdicion ? 'Guardar' : 'Crear'}
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};

export default ModalColeccion;
