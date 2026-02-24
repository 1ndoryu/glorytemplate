/*
 * Componente: ModalEditar — Kamples (C126)
 * Modal unificado de edición para samples, publicaciones y colecciones.
 * La lógica vive en useEditar.ts (SRP).
 */

import { Modal } from '@app/components/ui/Modal';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { useEditarModalStore } from '@app/stores/editarModalStore';
import { useEditar } from '@app/hooks/useEditar';
import type { TipoSample, SampleResumen } from '@app/types';
import '../../styles/componentes/modalEditar.css';
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
    } = useEditar(tipo, sample, publicacion, coleccion, manejarExito);

    if (!abierto || !tipo) return null;

    const titulo =
        tipo === 'sample'
            ? 'Editar sample'
            : tipo === 'publicacion'
                ? 'Editar publicación'
                : 'Editar colección';

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
                            <label className="editarCheckbox">
                                {/* sentinel-disable-next-line html-nativo: input type="checkbox" sin equivalente UI */}
                                <input
                                    type="checkbox"
                                    checked={formularioSample.esPremium}
                                    onChange={(e) =>
                                        setFormularioSample((prev) => ({
                                            ...prev,
                                            esPremium: e.target.checked,
                                        }))
                                    }
                                />
                                <span>Premium</span>
                            </label>

                            <label className="editarCheckbox">
                                {/* sentinel-disable-next-line html-nativo: input type="checkbox" sin equivalente UI */}
                                <input
                                    type="checkbox"
                                    checked={formularioSample.permitirDescarga}
                                    onChange={(e) =>
                                        setFormularioSample((prev) => ({
                                            ...prev,
                                            permitirDescarga: e.target.checked,
                                        }))
                                    }
                                />
                                <span>Permitir descarga</span>
                            </label>
                        </div>


                    </>
                )}

                {tipo === 'publicacion' && (
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

                        <label className="editarCheckbox">
                            {/* sentinel-disable-next-line html-nativo: input type="checkbox" sin equivalente UI */}
                            <input
                                type="checkbox"
                                checked={formularioColeccion.esPublica}
                                onChange={(e) =>
                                    setFormularioColeccion((prev) => ({
                                        ...prev,
                                        esPublica: e.target.checked,
                                    }))
                                }
                            />
                            <span>Colección pública</span>
                        </label>
                    </>
                )}

                <div className="editarAcciones">
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
        </Modal>
    );
};

export default ModalEditar;
