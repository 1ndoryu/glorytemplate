/*
 * Sub-componente: FormularioEditarPublicacion — Kamples
 * Formulario de edicion de publicacion, extraido de ModalEditar (SRP + limite-lineas).
 * Gestiona contenido, audio existente/nuevo, imagenes con reemplazo in-place.
 */

import { BotonBase } from '@app/components/ui/BotonBase';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { Input } from '@app/components/ui/Input';
import { Music, X, Camera } from 'lucide-react';
import type { FormularioPublicacion } from '@app/hooks/useEditar';
import type { useArchivosDragDrop } from '@app/hooks/useArchivosDragDrop';

interface FormularioEditarPublicacionProps {
    formulario: FormularioPublicacion;
    setFormulario: React.Dispatch<React.SetStateAction<FormularioPublicacion>>;
    archivos: ReturnType<typeof useArchivosDragDrop>;
    slotReemplazar: React.MutableRefObject<{ tipo: 'existente' | 'nueva'; indice: number } | null>;
}

export const FormularioEditarPublicacion = ({
    formulario,
    setFormulario,
    archivos,
    slotReemplazar,
}: FormularioEditarPublicacionProps): JSX.Element => (
    <>
        <CampoTexto
            etiqueta="Contenido"
            value={formulario.contenido}
            onChange={(e) =>
                setFormulario((prev) => ({
                    ...prev,
                    contenido: (e.target as HTMLTextAreaElement).value,
                }))
            }
            placeholder="Escribe tu publicación..."
            maxLength={5000}
            multilínea
            autoFocus
        />

        {/* Audio existente */}
        {formulario.audioExistente && (
            <div className="crearAdjunto">
                <div className="crearAdjuntoIcono"><Music size={18} /></div>
                <div className="crearAdjuntoInfo">
                    <span className="crearAdjuntoNombre">{formulario.audioExistente.titulo}</span>
                    <span className="crearAdjuntoMeta">Audio existente</span>
                </div>
                <BotonBase variante="ghost" className="crearAdjuntoBtn crearAdjuntoBtnQuitar" onClick={() => setFormulario(prev => ({ ...prev, audioExistente: null }))} type="button" aria-label="Quitar audio">
                    <X size={14} />
                </BotonBase>
            </div>
        )}

        {/* Audio nuevo */}
        {archivos.audioAdjunto && (
            <div className="crearAdjunto">
                <div className="crearAdjuntoIcono"><Music size={18} /></div>
                <div className="crearAdjuntoInfo">
                    <span className="crearAdjuntoNombre">{archivos.audioAdjunto.nombre}</span>
                    <span className="crearAdjuntoMeta">{archivos.audioAdjunto.formato} — {archivos.audioAdjunto.tamano}</span>
                </div>
                <BotonBase variante="ghost" className="crearAdjuntoBtn crearAdjuntoBtnQuitar" onClick={archivos.quitarAudio} type="button" aria-label="Quitar audio">
                    <X size={14} />
                </BotonBase>
            </div>
        )}

        {/* Imagenes existentes y nuevas */}
        {(formulario.imagenesExistentes.length > 0 || archivos.imagenes.length > 0) && (
            <div className={`crearImagenes crearImagenes${formulario.imagenesExistentes.length + archivos.imagenes.length}`}>
                {formulario.imagenesExistentes.map((url, i) => (
                    <div className="crearImagenItem" key={`existente-${i}`}>
                        <img src={url} alt={`Imagen existente ${i + 1}`} />
                        <div
                            className="crearImagenOverlayEditar"
                            onClick={() => {
                                slotReemplazar.current = { tipo: 'existente', indice: i };
                                document.getElementById('editar-input-reemplazar')?.click();
                            }}
                            role="button"
                            aria-label="Cambiar imagen"
                        >
                            <Camera size={20} />
                        </div>
                        <BotonBase variante="ghost" className="crearImagenQuitar" onClick={(e) => { e.stopPropagation(); setFormulario(prev => ({ ...prev, imagenesExistentes: prev.imagenesExistentes.filter((_, index) => index !== i) })); }} type="button" aria-label="Quitar imagen">
                            <X size={12} />
                        </BotonBase>
                    </div>
                ))}
                {archivos.imagenes.map((img, i) => (
                    <div className="crearImagenItem" key={`nueva-${i}`}>
                        <img src={img.url} alt={`Imagen nueva ${i + 1}`} />
                        <div
                            className="crearImagenOverlayEditar"
                            onClick={() => {
                                slotReemplazar.current = { tipo: 'nueva', indice: i };
                                document.getElementById('editar-input-reemplazar')?.click();
                            }}
                            role="button"
                            aria-label="Cambiar imagen"
                        >
                            <Camera size={20} />
                        </div>
                        <BotonBase variante="ghost" className="crearImagenQuitar" onClick={(e) => { e.stopPropagation(); archivos.quitarImagen(i); }} type="button" aria-label="Quitar imagen">
                            <X size={12} />
                        </BotonBase>
                    </div>
                ))}
            </div>
        )}

        {/* Inputs ocultos para adjuntar archivos */}
        <Input id="editar-input-audio" type="file" accept=".wav,.mp3,.flac,.aiff,.aif" style={{ display: 'none' }} onChange={archivos.manejarInputAudio} />
        <Input id="editar-input-imagen" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple style={{ display: 'none' }} onChange={archivos.manejarInputImagen} />
        <Input
            id="editar-input-reemplazar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => {
                const slot = slotReemplazar.current;
                if (!slot || !e.target.files?.length) return;
                if (slot.tipo === 'existente') {
                    setFormulario(prev => ({
                        ...prev,
                        imagenesExistentes: prev.imagenesExistentes.filter((_, idx) => idx !== slot.indice),
                    }));
                } else {
                    archivos.quitarImagen(slot.indice);
                }
                archivos.manejarInputImagen(e);
                slotReemplazar.current = null;
                e.target.value = '';
            }}
        />
    </>
);
