/*
 * Componente: ModalColeccion — Kamples
 * Modal para crear o editar una colección de samples.
 */

import { useState, useCallback, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { BotonBase } from '@app/components/ui/BotonBase';
import { crearColeccion, actualizarColeccion } from '@app/services/apiColecciones';
import { crearLogger } from '@app/services/logger';
import type { Coleccion } from '@app/types';
import '../../styles/componentes/modalColeccion.css';

const log = crearLogger('ModalColeccion');

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
    const esEdicion = coleccion !== null;

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [esPublica, setEsPublica] = useState(false);
    const [guardando, setGuardando] = useState(false);

    /* Pre-rellenar en modo edición */
    useEffect(() => {
        if (coleccion) {
            setNombre(coleccion.nombre);
            setDescripcion(coleccion.descripcion);
            setEsPublica(coleccion.esPublica);
        } else {
            setNombre('');
            setDescripcion('');
            setEsPublica(false);
        }
    }, [coleccion, abierto]);

    const manejarGuardar = useCallback(async () => {
        if (!nombre.trim() || guardando) return;

        setGuardando(true);
        try {
            if (esEdicion && coleccion) {
                const resp = await actualizarColeccion(coleccion.id, {
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    esPublica,
                });
                if (resp.ok && resp.data) {
                    onGuardar?.(resp.data);
                    log.info('Colección actualizada', { id: coleccion.id });
                }
            } else {
                const resp = await crearColeccion({
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    esPublica,
                });
                if (resp.ok && resp.data) {
                    onGuardar?.(resp.data);
                    log.info('Colección creada', { nombre: nombre.trim() });
                }
            }
            onCerrar();
        } catch (err) {
            log.error('Error guardando colección', err);
        } finally {
            setGuardando(false);
        }
    }, [nombre, descripcion, esPublica, guardando, esEdicion, coleccion, onCerrar, onGuardar]);

    const titulo = esEdicion ? 'Editar colección' : 'Nueva colección';

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
                    <input
                        type="checkbox"
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
