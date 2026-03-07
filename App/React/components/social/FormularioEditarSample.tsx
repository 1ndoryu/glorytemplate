/*
 * Sub-componente: FormularioEditarSample — Kamples
 * Formulario de edicion de sample, extraido de ModalEditar (SRP + limite-lineas).
 * D8: MetadataChips eliminados, imagen de portada editable, SelectorBase → SelectorMenu.
 * F3: Imagen clickeable para cambiar, X en esquina, imagen de colors no eliminable.
 */

import { CampoTexto } from '@app/components/ui/CampoTexto';
import { Checkbox } from '@app/components/ui/Checkbox';
import { SelectorMenu, type OpcionSelector } from '@app/components/ui/SelectorMenu';
import { BotonBase } from '@app/components/ui/BotonBase';
import type { FormularioSample } from '@app/hooks/useEditar';
import type { TipoSample } from '@app/types';
import { ImageIcon, X } from 'lucide-react';

const OPCIONES_TIPO: OpcionSelector[] = [
    { valor: 'loop', etiqueta: 'Loop' },
    { valor: 'oneshot', etiqueta: 'One Shot' },
];

interface FormularioEditarSampleProps {
    formulario: FormularioSample;
    setFormulario: React.Dispatch<React.SetStateAction<FormularioSample>>;
    imagenPreview: string | null;
    onSeleccionarImagen: (archivo: File) => void;
    onLimpiarImagen: () => void;
    inputImagenRef: React.RefObject<HTMLInputElement>;
}

export const FormularioEditarSample = ({
    formulario,
    setFormulario,
    imagenPreview,
    onSeleccionarImagen,
    onLimpiarImagen,
    inputImagenRef,
}: FormularioEditarSampleProps): JSX.Element => {
    /* La imagen a mostrar: preview local si hay archivo nuevo, sino la existente */
    const imagenVisible = imagenPreview ?? formulario.imagenUrl;

    /*
     * F3: La imagen original del servidor (colors) no se puede eliminar.
     * Solo se puede eliminar una imagen nueva (preview) que se haya seleccionado.
     */
    const esImagenNueva = Boolean(imagenPreview);

    const manejarSeleccionImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (archivo) onSeleccionarImagen(archivo);
        /* Resetear input para permitir seleccionar el mismo archivo */
        e.target.value = '';
    };

    return (
        <>
            {/* F3: Click en imagen para cambiar, X en esquina solo si hay preview nueva */}
            <div className="editarImagenPortada">
                {imagenVisible ? (
                    <div className="editarImagenContenedor">
                        <img
                            src={imagenVisible}
                            alt={formulario.titulo || 'Portada del sample'}
                            className="editarImagenPreview editarImagenClickeable"
                            onClick={() => inputImagenRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') inputImagenRef.current?.click();
                            }}
                        />
                        {esImagenNueva && (
                            <BotonBase
                                variante="ghost"
                                tamano="sm"
                                soloIcono
                                onClick={onLimpiarImagen}
                                type="button"
                                aria-label="Quitar imagen nueva"
                                className="editarImagenQuitar"
                            >
                                <X size={14} />
                            </BotonBase>
                        )}
                    </div>
                ) : (
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        onClick={() => inputImagenRef.current?.click()}
                        type="button"
                        className="editarImagenVacia"
                    >
                        <ImageIcon size={16} />
                        Agregar imagen
                    </BotonBase>
                )}
                <input
                    ref={inputImagenRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={manejarSeleccionImagen}
                    hidden
                />
            </div>

            <CampoTexto
                etiqueta="Título"
                value={formulario.titulo}
                onChange={(e) =>
                    setFormulario((prev) => ({
                        ...prev,
                        titulo: (e.target as HTMLInputElement).value,
                    }))
                }
                placeholder="Nombre del sample"
                maxLength={200}
                autoFocus
            />

            <CampoTexto
                etiqueta="Descripción"
                value={formulario.descripcion}
                onChange={(e) =>
                    setFormulario((prev) => ({
                        ...prev,
                        descripcion: (e.target as HTMLTextAreaElement).value,
                    }))
                }
                placeholder="Descripción del sample (opcional)"
                maxLength={1000}
                multilínea
            />

            <div className="editarGrupo">
                <CampoTexto
                    etiqueta="Tags"
                    value={formulario.tags}
                    onChange={(e) =>
                        setFormulario((prev) => ({
                            ...prev,
                            tags: (e.target as HTMLInputElement).value,
                        }))
                    }
                    placeholder="trap, dark, 808, ambient"
                    maxLength={500}
                />
                <span className="editarTagsHint">Separados por comas. Mínimo 2 tags.</span>
            </div>

            <div className="editarFilaDoble">
                <div className="editarGrupo">
                    <SelectorMenu
                        etiqueta="Tipo"
                        opciones={OPCIONES_TIPO}
                        valor={formulario.tipo}
                        onChange={(v) =>
                            setFormulario((prev) => ({ ...prev, tipo: v as TipoSample }))
                        }
                    />
                </div>

                <CampoTexto
                    etiqueta="Precio"
                    value={formulario.precio}
                    onChange={(e) =>
                        setFormulario((prev) => ({
                            ...prev,
                            precio: (e.target as HTMLInputElement).value,
                        }))
                    }
                    placeholder="0.00"
                    type="number"
                    disabled={!formulario.esPremium}
                />
            </div>

            <div className="editarFilaDoble">
                <Checkbox
                    label="Premium"
                    checked={formulario.esPremium}
                    onChange={(e) =>
                        setFormulario((prev) => ({
                            ...prev,
                            esPremium: e.target.checked,
                        }))
                    }
                />

                <Checkbox
                    label="Permitir descarga"
                    checked={formulario.permitirDescarga}
                    onChange={(e) =>
                        setFormulario((prev) => ({
                            ...prev,
                            permitirDescarga: e.target.checked,
                        }))
                    }
                />
            </div>
        </>
    );
};
