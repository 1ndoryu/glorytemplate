/*
 * Componente: ModalEditar — Kamples (C126)
 * Modal unificado de edición para samples, publicaciones y colecciones.
 * La lógica vive en useEditar.ts (SRP).
 */

import { useRef } from 'react';
import { Modal } from '@app/components/ui/Modal';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { Checkbox } from '@app/components/ui/Checkbox';
import { useEditarModalStore } from '@app/stores/editarModalStore';
import { useEditar } from '@app/hooks/useEditar';
import { Music, Image as ImageIcon, X, Camera } from 'lucide-react';
import type { TipoSample, SampleResumen } from '@app/types';
import '../../styles/componentes/modalEditar.css';
import '../../styles/componentes/modalCrear.css';
import { Input } from '../ui/Input';
import { SelectorBase } from '../ui/SelectorBase';

const tiposSample: { valor: TipoSample; etiqueta: string }[] = [
    { valor: 'loop', etiqueta: 'Loop' },
    { valor: 'oneshot', etiqueta: 'One Shot' },
    { valor: 'fx', etiqueta: 'FX' },
    { valor: 'vocal', etiqueta: 'Vocal' },
    { valor: 'stem', etiqueta: 'Stem' },
    { valor: 'otro', etiqueta: 'Otro' },
];

/* Evento para notificar actualizaciones de entidades */
export const EVENTO_ENTIDAD_ACTUALIZADA = 'kamples:entidad-actualizada';

/* C170: Chips informativos de metadata IA (solo lectura) */
const MetadataChips = ({ sample }: { sample: SampleResumen }): JSX.Element | null => {
    const chips: string[] = [];
    if (sample.bpm) chips.push(`${sample.bpm} BPM`);
    if (sample.key) chips.push(`${sample.key}${sample.escala === 'menor' ? 'm' : ''}`);
    if (sample.metadata?.genero) {
        const generos = Array.isArray(sample.metadata.genero)
            ? sample.metadata.genero
            : [sample.metadata.genero];
        chips.push(...generos.slice(0, 3));
    }
    if (sample.metadata?.emocionEs) chips.push(sample.metadata.emocionEs);
    if (!chips.length) return null;
    return (
        <div className="editarMetadataChips">
            <span className="editarMetadataLabel">Detectado por IA</span>
            <div className="editarChipsFila">
                {chips.map((c) => (
                    <Badge key={c} variante="neutro" tamano="xs">{c}</Badge>
                ))}
            </div>
        </div>
    );
};

export const ModalEditar = (): JSX.Element | null => {
    const abierto = useEditarModalStore(s => s.abierto);
    const tipo = useEditarModalStore(s => s.tipo);
    const sample = useEditarModalStore(s => s.sample);
    const publicacion = useEditarModalStore(s => s.publicacion);
    const coleccion = useEditarModalStore(s => s.coleccion);
    const cerrar = useEditarModalStore(s => s.cerrar);

    const manejarExito = () => {
        /* Emitir evento global para que las listas actualicen sus datos */
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
    } = useEditar(tipo, sample, publicacion, coleccion, manejarExito);

    /* Slot a reemplazar al seleccionar imagen (no dispara re-render) */
    const slotReemplazar = useRef<{ tipo: 'existente' | 'nueva'; indice: number } | null>(null);

    if (!abierto || !tipo) return null;

    /* publicacion no muestra cabecera — los controles van en editarAcciones */
    const titulo =
        tipo === 'sample'
            ? 'Editar sample'
            : tipo === 'coleccion'
                ? 'Editar colección'
                : undefined;

    const manejarGuardar = async () => {
        await guardar();
    };

    return (
        <Modal abierto={abierto} onCerrar={cerrar} titulo={titulo} tamano="normal">
            <div className="editarFormulario">
                {tipo === 'sample' && (
                    <>
                        {/* C170: Chips de metadata IA para contexto */}
                        {sample && <MetadataChips sample={sample} />}

                        <CampoTexto
                            etiqueta="Título"
                            value={formularioSample.titulo}
                            onChange={(e) =>
                                setFormularioSample((prev) => ({
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
                            value={formularioSample.descripcion}
                            onChange={(e) =>
                                setFormularioSample((prev) => ({
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
                                value={formularioSample.tags}
                                onChange={(e) =>
                                    setFormularioSample((prev) => ({
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
                                <span className="editarGrupoLabel">Tipo</span>
                                <div className="editarSelectContenedor">
                                    <SelectorBase
                                        className="editarSelect"
                                        value={formularioSample.tipo}
                                        onChange={(e) =>
                                            setFormularioSample((prev) => ({
                                                ...prev,
                                                tipo: e.target.value as TipoSample,
                                            }))
                                        }
                                    >
                                        {tiposSample.map((t) => (
                                            <option key={t.valor} value={t.valor}>
                                                {t.etiqueta}
                                            </option>
                                        ))}
                                    </SelectorBase>
                                </div>
                            </div>

                            <CampoTexto
                                etiqueta="Precio"
                                value={formularioSample.precio}
                                onChange={(e) =>
                                    setFormularioSample((prev) => ({
                                        ...prev,
                                        precio: (e.target as HTMLInputElement).value,
                                    }))
                                }
                                placeholder="0.00"
                                type="number"
                                disabled={!formularioSample.esPremium}
                            />
                        </div>

                        <div className="editarFilaDoble">
                            <Checkbox
                                label="Premium"
                                checked={formularioSample.esPremium}
                                onChange={(e) =>
                                    setFormularioSample((prev) => ({
                                        ...prev,
                                        esPremium: e.target.checked,
                                    }))
                                }
                            />

                            <Checkbox
                                label="Permitir descarga"
                                checked={formularioSample.permitirDescarga}
                                onChange={(e) =>
                                    setFormularioSample((prev) => ({
                                        ...prev,
                                        permitirDescarga: e.target.checked,
                                    }))
                                }
                            />
                        </div>


                    </>
                )}

                {tipo === 'publicacion' && (
                    <>
                        <CampoTexto
                            etiqueta="Contenido"
                            value={formularioPublicacion.contenido}
                            onChange={(e) =>
                                setFormularioPublicacion((prev) => ({
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
                        {formularioPublicacion.audioExistente && (
                            <div className="crearAdjunto">
                                <div className="crearAdjuntoIcono"><Music size={18} /></div>
                                <div className="crearAdjuntoInfo">
                                    <span className="crearAdjuntoNombre">{formularioPublicacion.audioExistente.titulo}</span>
                                    <span className="crearAdjuntoMeta">Audio existente</span>
                                </div>
                                <BotonBase variante="ghost" className="crearAdjuntoBtn crearAdjuntoBtnQuitar" onClick={() => setFormularioPublicacion(prev => ({ ...prev, audioExistente: null }))} type="button" aria-label="Quitar audio">
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

                        {/* Imágenes existentes y nuevas */}
                        {(formularioPublicacion.imagenesExistentes.length > 0 || archivos.imagenes.length > 0) && (
                            <div className={`crearImagenes crearImagenes${formularioPublicacion.imagenesExistentes.length + archivos.imagenes.length}`}>
                                {formularioPublicacion.imagenesExistentes.map((url, i) => (
                                    <div className="crearImagenItem" key={`existente-${i}`}>
                                        <img src={url} alt={`Imagen existente ${i + 1}`} />
                                        {/* Overlay clicable para reemplazar la imagen */}
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
                                        <BotonBase variante="ghost" className="crearImagenQuitar" onClick={(e) => { e.stopPropagation(); setFormularioPublicacion(prev => ({ ...prev, imagenesExistentes: prev.imagenesExistentes.filter((_, index) => index !== i) })); }} type="button" aria-label="Quitar imagen">
                                            <X size={12} />
                                        </BotonBase>
                                    </div>
                                ))}
                                {archivos.imagenes.map((img, i) => (
                                    <div className="crearImagenItem" key={`nueva-${i}`}>
                                        <img src={img.url} alt={`Imagen nueva ${i + 1}`} />
                                        {/* Overlay clicable para reemplazar la imagen */}
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
                        {/* Input para reemplazar una imagen existente al hacer click sobre ella */}
                        <Input
                            id="editar-input-reemplazar"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const slot = slotReemplazar.current;
                                if (!slot || !e.target.files?.length) return;
                                if (slot.tipo === 'existente') {
                                    setFormularioPublicacion(prev => ({
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
                )}

                {tipo === 'coleccion' && (
                    <>
                        <CampoTexto
                            etiqueta="Nombre"
                            value={formularioColeccion.nombre}
                            onChange={(e) =>
                                setFormularioColeccion((prev) => ({
                                    ...prev,
                                    nombre: (e.target as HTMLInputElement).value,
                                }))
                            }
                            placeholder="Mi colección..."
                            maxLength={100}
                            autoFocus
                        />

                        <CampoTexto
                            etiqueta="Descripción"
                            value={formularioColeccion.descripcion}
                            onChange={(e) =>
                                setFormularioColeccion((prev) => ({
                                    ...prev,
                                    descripcion: (e.target as unknown as HTMLTextAreaElement).value,
                                }))
                            }
                            placeholder="Descripción (opcional)"
                            maxLength={300}
                        />

                        <Checkbox
                            label="Colección pública"
                            checked={formularioColeccion.esPublica}
                            onChange={(e) =>
                                setFormularioColeccion((prev) => ({
                                    ...prev,
                                    esPublica: e.target.checked,
                                }))
                            }
                        />
                    </>
                )}

                <div className="editarAcciones">
                    <div className="editarAccionesIzquierda">
                        {tipo === 'publicacion' && (
                            <>
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
                            </>
                        )}
                    </div>
                    <div className="editarAccionesDerecha">
                        <BotonBase variante="ghost" onClick={cerrar}>
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
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ModalEditar;
