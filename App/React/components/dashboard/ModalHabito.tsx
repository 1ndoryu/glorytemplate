/*
 * ModalHabito
 * Modal para crear/editar un habito con auto-guardado
 * Maneja su propio Modal interno (similar a PanelConfiguracionTarea)
 *
 * Auto-guardado: al cerrar (overlay, ESC, X)
 * Cancelar: descarta cambios y cierra
 *
 * Fase 7.6: Incluye panel de chat/historial siempre en modo edición
 * El historial es útil para ver cambios aunque no esté compartido
 */

import {useState, useCallback, useEffect, useRef} from 'react';
import {MessageSquare, MessageSquareOff} from 'lucide-react';
import type {NivelImportancia, DatosNuevoHabito, FrecuenciaHabito, Habito, Participante} from '../../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import {SelectorFrecuencia} from './SelectorFrecuencia';
import {AccionesFormulario, Modal, SeccionPanel, SelectorNivel} from '../shared';
import {PanelChatHistorial} from './PanelChatHistorial';
import {useMensajesNoLeidos} from '../../hooks/useMensajes';

type DatosFormulario = DatosNuevoHabito;

interface ModalHabitoProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (datos: DatosFormulario) => void;
    habito?: Habito;
    /* Participantes del hábito (si está compartido - futuro Fase 10) */
    participantes?: Participante[];
}

const IMPORTANCIAS: NivelImportancia[] = ['Alta', 'Media', 'Baja'];

type PestanaModal = 'configuracion' | 'chat';

export function ModalHabito({estaAbierto, onCerrar, onGuardar, habito, participantes = []}: ModalHabitoProps): JSX.Element | null {
    const modoEdicion = !!habito;

    /* Estado local para edicion */
    const [nombre, setNombre] = useState(habito?.nombre || '');
    const [importancia, setImportancia] = useState<NivelImportancia>(habito?.importancia || 'Media');
    const [tags, setTags] = useState<string[]>(habito?.tags || []);
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>(habito?.frecuencia || FRECUENCIA_POR_DEFECTO);
    const [nuevoTag, setNuevoTag] = useState('');
    const [errores, setErrores] = useState<{nombre?: string}>({});

    /* Estado para pestañas responsive */
    const [pestanaActiva, setPestanaActiva] = useState<PestanaModal>('configuracion');

    /* Estado para visibilidad del panel de chat (persistido) */
    const [chatVisible, setChatVisible] = useState<boolean>(() => {
        const guardado = localStorage.getItem('glory_chat_panel_visible');
        return guardado !== 'false';
    });

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

    /* Toggle visibilidad del panel de chat */
    const toggleChatVisible = useCallback(() => {
        setChatVisible(prev => {
            const nuevoValor = !prev;
            localStorage.setItem('glory_chat_panel_visible', String(nuevoValor));
            return nuevoValor;
        });
    }, []);

    /* Obtener mensajes no leídos para este hábito */
    const habitoIdParaMensajes = habito?.id && habito.id > 0 ? [habito.id] : [];
    const {noLeidos: mensajesNoLeidos} = useMensajesNoLeidos('habito', habitoIdParaMensajes);
    const tieneMensajesSinLeer = habito?.id ? (mensajesNoLeidos[habito.id] || 0) > 0 : false;

    /* Participantes para el panel de chat */
    const participantesChat = participantes.map(p => ({
        id: p.usuarioId,
        nombre: p.nombre,
        avatar: p.avatar
    }));

    /* Mostrar chat siempre en modo edición (útil para ver historial) */
    const mostrarChat = modoEdicion;
    const mostrarChatColumna = mostrarChat && chatVisible;

    /* Clase extra para modal expandido */
    const claseModal = mostrarChat ? 'panelConfiguracionContenedor modalContenedor--expandido' : '';

    /* Contenido del formulario (reutilizado en ambos modos) */
    const renderizarFormulario = () => (
        <>
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
        </>
    );

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={manejarCerrarConGuardado} titulo={modoEdicion ? 'Editar Habito' : 'Nuevo Habito'} claseExtra={claseModal}>
            {mostrarChat ? (
                <>
                    {/* Pestañas para móvil */}
                    <div className="panelConfiguracionPestanas">
                        <button type="button" className={`panelConfiguracionPestana ${pestanaActiva === 'configuracion' ? 'panelConfiguracionPestana--activa' : ''}`} onClick={() => setPestanaActiva('configuracion')}>
                            Configuracion
                        </button>
                        <button type="button" className={`panelConfiguracionPestana ${pestanaActiva === 'chat' ? 'panelConfiguracionPestana--activa' : ''}`} onClick={() => setPestanaActiva('chat')}>
                            Chat / Historial
                        </button>
                    </div>

                    {/* Layout de 2 columnas */}
                    <div className={`panelConfiguracionDosColumnas ${!mostrarChatColumna ? 'panelConfiguracionDosColumnas--sinChat' : ''}`}>
                        {/* Columna Izquierda: Formulario */}
                        <div className={`panelConfiguracionColumnaIzquierda ${pestanaActiva === 'configuracion' ? 'panelConfiguracionColumnaIzquierda--activa' : ''}`}>
                            <div className="panelConfiguracionColumnaScroll">{renderizarFormulario()}</div>

                            {/* Acciones - sin botón eliminar */}
                            <AccionesFormulario onCancelar={manejarCancelar} onGuardar={manejarGuardar} textoGuardar="Guardar cambios">
                                {/* Botón para toggle del chat */}
                                <button type="button" className={`accionesFormularioBotonChat ${tieneMensajesSinLeer && !chatVisible ? 'accionesFormularioBotonChat--noLeidos' : ''}`} onClick={toggleChatVisible} title={chatVisible ? 'Ocultar chat' : `Mostrar chat${tieneMensajesSinLeer ? ' (mensajes sin leer)' : ''}`}>
                                    {chatVisible ? <MessageSquareOff size={14} /> : <MessageSquare size={14} />}
                                </button>
                            </AccionesFormulario>
                        </div>

                        {/* Columna Derecha: Chat e Historial */}
                        {mostrarChatColumna && <div className={`panelConfiguracionColumnaDerecha ${pestanaActiva === 'chat' ? 'panelConfiguracionColumnaDerecha--activa' : ''}`}>{habito && <PanelChatHistorial elementoId={habito.id} elementoTipo="habito" participantes={participantesChat} />}</div>}
                    </div>
                </>
            ) : (
                /* Modo simple para crear hábito nuevo */
                <>
                    <div id="modal-habito-contenido" className="formularioHabito">
                        {renderizarFormulario()}
                    </div>
                    <AccionesFormulario onCancelar={manejarCancelar} onGuardar={manejarGuardar} textoGuardar="Crear habito" />
                </>
            )}
        </Modal>
    );
}
