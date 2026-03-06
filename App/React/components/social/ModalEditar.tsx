/*
 * Componente: ModalEditar — Kamples (C126)
 * Modal unificado de edición para samples, publicaciones y colecciones.
 * La lógica vive en useEditar.ts (SRP).
 * JSX de cada formulario en sub-componentes (FormularioEditar*).
 */

import { useRef } from 'react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ModalAcciones } from '@app/components/ui/ModalAcciones';
import { useEditarModalStore } from '@app/stores/editarModalStore';
import { useEditar } from '@app/hooks/useEditar';
import { Music, Image as ImageIcon } from 'lucide-react';
import { FormularioEditarSample } from './FormularioEditarSample';
import { FormularioEditarPublicacion } from './FormularioEditarPublicacion';
import { FormularioEditarColeccion } from './FormularioEditarColeccion';
import '../../styles/componentes/modalEditar.css';
import '../../styles/componentes/modalCrear.css';

/* Evento para notificar actualizaciones de entidades */
export const EVENTO_ENTIDAD_ACTUALIZADA = 'kamples:entidad-actualizada';

export const ModalEditar = (): JSX.Element | null => {
    const abierto = useEditarModalStore(s => s.abierto);
    const tipo = useEditarModalStore(s => s.tipo);
    const sample = useEditarModalStore(s => s.sample);
    const publicacion = useEditarModalStore(s => s.publicacion);
    const coleccion = useEditarModalStore(s => s.coleccion);
    const cerrar = useEditarModalStore(s => s.cerrar);

    const manejarExito = () => {
        window.dispatchEvent(
            new CustomEvent(EVENTO_ENTIDAD_ACTUALIZADA, {
                detail: { tipo, id: sample?.id ?? publicacion?.id ?? coleccion?.id },
            })
        );
        cerrar();
    };

    const {
        formularioSample,
        formularioPublicacion,
        formularioColeccion,
        setFormularioSample,
        setFormularioPublicacion,
        setFormularioColeccion,
        guardando,
        guardar,
        archivos,
        imagenSamplePreview,
        seleccionarImagenSample,
        limpiarImagenSample,
        inputImagenSampleRef,
    } = useEditar(tipo, sample, publicacion, coleccion, manejarExito);

    /* Slot a reemplazar al seleccionar imagen (no dispara re-render) */
    const slotReemplazar = useRef<{ tipo: 'existente' | 'nueva'; indice: number } | null>(null);

    if (!abierto || !tipo) return null;

    const manejarGuardar = async () => {
        await guardar();
    };

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="normal">
            <div className="editarFormulario">
                {tipo === 'sample' && (
                    <FormularioEditarSample
                        formulario={formularioSample}
                        setFormulario={setFormularioSample}
                        imagenPreview={imagenSamplePreview}
                        onSeleccionarImagen={seleccionarImagenSample}
                        onLimpiarImagen={limpiarImagenSample}
                        inputImagenRef={inputImagenSampleRef}
                    />
                )}

                {tipo === 'publicacion' && (
                    <FormularioEditarPublicacion
                        formulario={formularioPublicacion}
                        setFormulario={setFormularioPublicacion}
                        archivos={archivos}
                        slotReemplazar={slotReemplazar}
                    />
                )}

                {tipo === 'coleccion' && (
                    <FormularioEditarColeccion
                        formulario={formularioColeccion}
                        setFormulario={setFormularioColeccion}
                    />
                )}

                {/* D7: Adjuntos separados de las acciones */}
                {tipo === 'publicacion' && (
                    <div className="editarAdjuntos">
                        <BotonBase
                            variante="ghost"
                            tamano="sm"
                            soloIcono
                            onClick={() => document.getElementById('editar-input-audio')?.click()}
                            disabled={!!formularioPublicacion.audioExistente || !!archivos.audioAdjunto}
                            type="button"
                            aria-label="Adjuntar audio"
                        >
                            <Music size={18} />
                        </BotonBase>
                        <BotonBase
                            variante="ghost"
                            tamano="sm"
                            soloIcono
                            onClick={() => document.getElementById('editar-input-imagen')?.click()}
                            disabled={formularioPublicacion.imagenesExistentes.length + archivos.imagenes.length >= 4}
                            type="button"
                            aria-label="Adjuntar imagen"
                        >
                            <ImageIcon size={18} />
                        </BotonBase>
                    </div>
                )}

                {/* D7: Acciones unificadas — botones 100% ancho, cancel=borde sin fondo */}
                <ModalAcciones>
                    <BotonBase variante="secundario" onClick={cerrar}>
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        onClick={manejarGuardar}
                        disabled={guardando}
                        cargando={guardando}
                    >
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalEditar;
