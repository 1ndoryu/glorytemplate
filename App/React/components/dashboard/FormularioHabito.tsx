/*
 * FormularioHabito
 * Formulario para crear/editar un habito
 * Responsabilidad unica: capturar datos del habito con validacion
 */

import {useState, useCallback} from 'react';
import {Plus, Tag} from 'lucide-react';
import type {NivelImportancia, DatosNuevoHabito, FrecuenciaHabito} from '../../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import {SelectorFrecuencia} from './SelectorFrecuencia';
import {AccionesFormulario, SeccionPanel, SelectorNivel} from '../shared';

/* Alias para compatibilidad con el componente */
type DatosFormulario = DatosNuevoHabito;

interface FormularioHabitoProps {
    onGuardar: (datos: DatosFormulario) => void;
    onCancelar: () => void;
    onEliminar?: () => void;
    datosIniciales?: DatosFormulario;
    guardando?: boolean;
    modoEdicion?: boolean;
}

const IMPORTANCIAS: NivelImportancia[] = ['Alta', 'Media', 'Baja'];

export function FormularioHabito({onGuardar, onCancelar, onEliminar, datosIniciales, guardando = false, modoEdicion = false}: FormularioHabitoProps): JSX.Element {
    const [nombre, setNombre] = useState(datosIniciales?.nombre || '');
    const [importancia, setImportancia] = useState<NivelImportancia>(datosIniciales?.importancia || 'Media');
    const [tags, setTags] = useState<string[]>(datosIniciales?.tags || []);
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>(datosIniciales?.frecuencia || FRECUENCIA_POR_DEFECTO);
    const [nuevoTag, setNuevoTag] = useState('');
    const [errores, setErrores] = useState<{nombre?: string}>({});

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

    const manejarSubmit = (evento: React.FormEvent) => {
        evento.preventDefault();

        if (!validarFormulario()) return;

        onGuardar({
            nombre: nombre.trim(),
            importancia,
            tags,
            frecuencia
        });
    };

    const agregarTag = () => {
        const tagLimpio = nuevoTag
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

        if (tagLimpio && !tags.includes(tagLimpio) && tags.length < 5) {
            setTags([...tags, tagLimpio]);
            setNuevoTag('');
        }
    };

    const manejarTeclaTag = (evento: React.KeyboardEvent) => {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            agregarTag();
        }
    };

    const eliminarTag = (tagAEliminar: string) => {
        setTags(tags.filter(t => t !== tagAEliminar));
    };

    return (
        <form id="formulario-habito" className="formularioHabito" onSubmit={manejarSubmit}>
            {/* Campo Nombre */}
            <SeccionPanel titulo="Nombre del habito">
                <input id="habito-nombre" type="text" className={`formularioInput ${errores.nombre ? 'formularioInputError' : ''}`} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Leer 30 minutos" autoFocus disabled={guardando} />
                {errores.nombre && <span className="formularioMensajeError">{errores.nombre}</span>}
            </SeccionPanel>

            {/* Campo Importancia */}
            <SeccionPanel titulo="Importancia">
                <SelectorNivel<NivelImportancia> niveles={IMPORTANCIAS} seleccionado={importancia} onSeleccionar={setImportancia} disabled={guardando} />
            </SeccionPanel>

            {/* Campo Frecuencia */}
            <div className="formularioCampo">
                <SelectorFrecuencia frecuencia={frecuencia} onChange={setFrecuencia} deshabilitado={guardando} />
            </div>

            {/* Campo Tags */}
            <div className="formularioCampo">
                <label htmlFor="habito-tags" className="formularioEtiqueta">
                    Tags <span className="formularioEtiquetaOpcional">(opcional, max 5)</span>
                </label>
                <div className="formularioTagsInput">
                    <Tag size={12} className="formularioTagsIcono" />
                    <input id="habito-tags" type="text" className="formularioInputTag" value={nuevoTag} onChange={e => setNuevoTag(e.target.value)} onKeyDown={manejarTeclaTag} placeholder="Escribe y presiona Enter" disabled={guardando || tags.length >= 5} />
                    <button type="button" className="formularioBotonAgregarTag" onClick={agregarTag} disabled={guardando || !nuevoTag.trim() || tags.length >= 5}>
                        <Plus size={12} />
                    </button>
                </div>
                {tags.length > 0 && (
                    <div className="formularioTagsLista">
                        {tags.map(tag => (
                            <span key={tag} className="formularioTag">
                                #{tag}
                                <button type="button" className="formularioTagEliminar" onClick={() => eliminarTag(tag)} disabled={guardando}>
                                    x
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Acciones reutilizables */}
            <AccionesFormulario onCancelar={onCancelar} textoGuardar={modoEdicion ? 'Guardar cambios' : 'Crear habito'} guardando={guardando} onEliminar={modoEdicion && onEliminar ? onEliminar : undefined} textoEliminar="Eliminar habito" />
        </form>
    );
}

export type {DatosFormulario};
