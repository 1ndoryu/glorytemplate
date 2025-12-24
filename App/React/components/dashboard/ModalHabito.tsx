/*
 * ModalHabito
 * Modal para crear/editar un habito con auto-guardado
 * Maneja su propio Modal interno (similar a PanelConfiguracionTarea)
 *
 * Auto-guardado: al cerrar (overlay, ESC, X)
 * Cancelar: descarta cambios y cierra
 */

import {useState, useCallback, useEffect, useRef} from 'react';
import {Plus, Tag} from 'lucide-react';
import type {NivelImportancia, DatosNuevoHabito, FrecuenciaHabito, Habito} from '../../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import {SelectorFrecuencia} from './SelectorFrecuencia';
import {AccionesFormulario, Modal, SeccionPanel, SelectorNivel} from '../shared';

type DatosFormulario = DatosNuevoHabito;

interface ModalHabitoProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (datos: DatosFormulario) => void;
    onEliminar?: () => void;
    habito?: Habito;
}

const IMPORTANCIAS: NivelImportancia[] = ['Alta', 'Media', 'Baja'];

export function ModalHabito({estaAbierto, onCerrar, onGuardar, onEliminar, habito}: ModalHabitoProps): JSX.Element | null {
    const modoEdicion = !!habito;

    /* Estado local para edicion */
    const [nombre, setNombre] = useState(habito?.nombre || '');
    const [importancia, setImportancia] = useState<NivelImportancia>(habito?.importancia || 'Media');
    const [tags, setTags] = useState<string[]>(habito?.tags || []);
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>(habito?.frecuencia || FRECUENCIA_POR_DEFECTO);
    const [nuevoTag, setNuevoTag] = useState('');
    const [errores, setErrores] = useState<{nombre?: string}>({});

    /* Referencia al estado inicial para detectar cambios */
    const estadoInicialRef = useRef<{
        nombre: string;
        importancia: NivelImportancia;
        tags: string[];
        frecuenciaTipo: string;
    } | null>(null);

    /* Sincronizar estado cuando cambia el habito */
    useEffect(() => {
        if (habito) {
            setNombre(habito.nombre);
            setImportancia(habito.importancia);
            setTags(habito.tags);
            setFrecuencia(habito.frecuencia || FRECUENCIA_POR_DEFECTO);

            /* Guardar estado inicial para detección de cambios */
            estadoInicialRef.current = {
                nombre: habito.nombre,
                importancia: habito.importancia,
                tags: habito.tags,
                frecuenciaTipo: (habito.frecuencia || FRECUENCIA_POR_DEFECTO).tipo
            };
        } else {
            /* Resetear si no hay habito (modo creacion) */
            setNombre('');
            setImportancia('Media');
            setTags([]);
            setFrecuencia(FRECUENCIA_POR_DEFECTO);
            estadoInicialRef.current = null;
        }
        setNuevoTag('');
        setErrores({});
    }, [habito?.id, estaAbierto]);

    /* Detectar si hubo cambios respecto al estado inicial */
    const hayCambios = useCallback((): boolean => {
        const inicial = estadoInicialRef.current;

        /* Si es modo creación, hay cambios si hay nombre */
        if (!inicial) {
            return nombre.trim().length >= 3;
        }

        /* Comparar cada campo */
        if (nombre.trim() !== inicial.nombre) return true;
        if (importancia !== inicial.importancia) return true;
        if (frecuencia.tipo !== inicial.frecuenciaTipo) return true;

        /* Comparar tags */
        if (tags.length !== inicial.tags.length) return true;
        const tagsActuales = [...tags].sort().join(',');
        const tagsIniciales = [...inicial.tags].sort().join(',');
        if (tagsActuales !== tagsIniciales) return true;

        return false;
    }, [nombre, importancia, tags, frecuencia]);

    const validarFormulario = useCallback((): boolean => {
        const nuevosErrores: {nombre?: string} = {};

        if (!nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio';
        } else if (nombre.trim().length < 3) {
            nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    }, [nombre]);

    const manejarGuardar = useCallback(() => {
        if (!validarFormulario()) return;

        onGuardar({
            nombre: nombre.trim(),
            importancia,
            tags,
            frecuencia
        });
        onCerrar();
    }, [nombre, importancia, tags, frecuencia, validarFormulario, onGuardar, onCerrar]);

    /* Auto-guardado: al cerrar el modal, guardar solo si hay cambios */
    const manejarCerrarConGuardado = useCallback(() => {
        if (hayCambios() && nombre.trim().length >= 3) {
            manejarGuardar();
        } else {
            onCerrar();
        }
    }, [hayCambios, nombre, manejarGuardar, onCerrar]);

    /* Cancelar: cerrar sin guardar (descartar cambios) */
    const manejarCancelar = useCallback(() => {
        onCerrar();
    }, [onCerrar]);

    const agregarTag = useCallback(() => {
        const tagLimpio = nuevoTag
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

        if (tagLimpio && !tags.includes(tagLimpio) && tags.length < 5) {
            setTags([...tags, tagLimpio]);
            setNuevoTag('');
        }
    }, [nuevoTag, tags]);

    const manejarTeclaTag = useCallback(
        (evento: React.KeyboardEvent) => {
            if (evento.key === 'Enter') {
                evento.preventDefault();
                agregarTag();
            }
        },
        [agregarTag]
    );

    const eliminarTag = useCallback(
        (tagAEliminar: string) => {
            setTags(tags.filter(t => t !== tagAEliminar));
        },
        [tags]
    );

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={manejarCerrarConGuardado} titulo={modoEdicion ? 'Editar Habito' : 'Nuevo Habito'}>
            <div id="modal-habito-contenido" className="formularioHabito">
                {/* Campo Nombre */}
                <SeccionPanel titulo="Nombre del habito">
                    <input id="habito-nombre" type="text" className={`formularioInput ${errores.nombre ? 'formularioInputError' : ''}`} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Leer 30 minutos" autoFocus />
                    {errores.nombre && <span className="formularioMensajeError">{errores.nombre}</span>}
                </SeccionPanel>

                {/* Campo Importancia */}
                <SeccionPanel titulo="Importancia">
                    <SelectorNivel<NivelImportancia> niveles={IMPORTANCIAS} seleccionado={importancia} onSeleccionar={setImportancia} />
                </SeccionPanel>

                {/* Campo Frecuencia */}
                <div className="formularioCampo">
                    <SelectorFrecuencia frecuencia={frecuencia} onChange={setFrecuencia} />
                </div>

                {/* Campo Tags */}
                <div className="formularioCampo">
                    <label htmlFor="habito-tags" className="formularioEtiqueta">
                        Tags <span className="formularioEtiquetaOpcional">(opcional, max 5)</span>
                    </label>
                    <div className="formularioTagsInput">
                        <Tag size={12} className="formularioTagsIcono" />
                        <input id="habito-tags" type="text" className="formularioInputTag" value={nuevoTag} onChange={e => setNuevoTag(e.target.value)} onKeyDown={manejarTeclaTag} placeholder="Escribe y presiona Enter" disabled={tags.length >= 5} />
                        <button type="button" className="formularioBotonAgregarTag" onClick={agregarTag} disabled={!nuevoTag.trim() || tags.length >= 5}>
                            <Plus size={12} />
                        </button>
                    </div>
                    {tags.length > 0 && (
                        <div className="formularioTagsLista">
                            {tags.map(tag => (
                                <span key={tag} className="formularioTag">
                                    #{tag}
                                    <button type="button" className="formularioTagEliminar" onClick={() => eliminarTag(tag)}>
                                        x
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Acciones reutilizables */}
            <AccionesFormulario onCancelar={manejarCancelar} onGuardar={manejarGuardar} textoGuardar={modoEdicion ? 'Guardar cambios' : 'Crear habito'} onEliminar={modoEdicion && onEliminar ? onEliminar : undefined} textoEliminar="Eliminar habito" />
        </Modal>
    );
}
