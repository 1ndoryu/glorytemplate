/*
 * PanelChatHistorial
 * Panel lateral para chat y historial de cambios de una tarea/proyecto
 * Responsabilidad: mostrar timeline unificado de mensajes y eventos
 *
 * Fase 7.2: Timeline Unificado (Chat + Historial son UN SOLO timeline)
 * - Mensajes usuario: burbuja con avatar (enviado/recibido)
 * - Mensajes sistema: linea centrada con icono (historial inmutable)
 *
 * Conectado a la API real de mensajes
 */

import {useState, useRef, useEffect} from 'react';
import {MessageCircle, Users, Send, History, Plus, Edit, Trash2, UserCheck, Paperclip, CheckCircle, Clock, Tag, Zap, Calendar, FileText, Type, Share2, UserPlus, UserMinus, Loader} from 'lucide-react';
import {useMensajes, type MensajeTimeline, type AccionSistema, obtenerTipoVisual} from '../../hooks/useMensajes';

export interface PanelChatHistorialProps {
    elementoId: number;
    elementoTipo: 'tarea' | 'proyecto' | 'habito';
    /* Participantes del elemento (si esta compartido) */
    participantes?: Array<{
        id: number;
        nombre: string;
        avatar: string;
    }>;
}

/* Mapeo de iconos para mensajes del sistema */
function obtenerIconoSistema(accion?: AccionSistema | null) {
    const iconos: Record<AccionSistema, JSX.Element> = {
        creado: <Plus size={10} />,
        editado: <Edit size={10} />,
        completado: <CheckCircle size={10} />,
        reabierto: <Clock size={10} />,
        asignado: <UserCheck size={10} />,
        desasignado: <UserMinus size={10} />,
        adjunto_agregado: <Paperclip size={10} />,
        adjunto_eliminado: <Trash2 size={10} />,
        prioridad: <Tag size={10} />,
        urgencia: <Zap size={10} />,
        fecha_limite: <Calendar size={10} />,
        participante_agregado: <UserPlus size={10} />,
        participante_removido: <UserMinus size={10} />,
        compartido: <Share2 size={10} />,
        descripcion: <FileText size={10} />,
        nombre: <Type size={10} />
    };

    return accion ? iconos[accion] || <History size={10} /> : <History size={10} />;
}

/* Formatear hora para mensajes (sin fecha, solo hora) */
function formatearHora(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleTimeString('es', {hour: '2-digit', minute: '2-digit'});
}

/* Obtener clave de día para agrupar mensajes (YYYY-MM-DD) */
function obtenerClaveDia(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/* Formatear fecha del día para el separador */
function formatearFechaDia(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const fechaComparar = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

    if (fechaComparar.getTime() === hoy.getTime()) {
        return 'Hoy';
    }

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (fechaComparar.getTime() === ayer.getTime()) {
        return 'Ayer';
    }

    /* Para fechas anteriores, mostrar formato completo */
    return fecha.toLocaleDateString('es', {weekday: 'long', day: 'numeric', month: 'long'});
}

export function PanelChatHistorial({elementoId, elementoTipo, participantes = []}: PanelChatHistorialProps): JSX.Element {
    const [mostrandoParticipantes, setMostrandoParticipantes] = useState(false);
    const [mensajeNuevo, setMensajeNuevo] = useState('');
    const refContenedor = useRef<HTMLDivElement>(null);

    const tieneParticipantes = participantes.length > 0;

    /* Hook de mensajes conectado a la API */
    const {estado, enviarMensaje} = useMensajes(elementoTipo, elementoId);

    /* Scroll al ultimo mensaje al cargar o cuando cambian los mensajes */
    useEffect(() => {
        if (refContenedor.current && !mostrandoParticipantes) {
            refContenedor.current.scrollTop = refContenedor.current.scrollHeight;
        }
    }, [mostrandoParticipantes, estado.mensajes]);

    const manejarEnviarMensaje = async () => {
        if (!mensajeNuevo.trim() || estado.enviando) return;

        const contenido = mensajeNuevo;
        setMensajeNuevo('');

        const exito = await enviarMensaje(contenido);
        if (!exito) {
            /* Restaurar mensaje si fallo */
            setMensajeNuevo(contenido);
        }
    };

    const manejarTecla = (evento: React.KeyboardEvent) => {
        if (evento.key === 'Enter' && !evento.shiftKey) {
            evento.preventDefault();
            manejarEnviarMensaje();
        }
    };

    /* Renderizar un mensaje del timeline */
    const renderizarMensaje = (mensaje: MensajeTimeline) => {
        const tipoVisual = obtenerTipoVisual(mensaje);

        if (tipoVisual === 'sistema') {
            return (
                <div key={mensaje.id} className="timelineMensajeSistema">
                    <span className="timelineMensajeSistemaTexto">{mensaje.contenido}</span>
                    <span className="timelineMensajeSistemaFecha">{formatearHora(mensaje.fechaCreacion)}</span>
                </div>
            );
        }

        const esEnviado = tipoVisual === 'enviado';
        return (
            <div key={mensaje.id} className={`timelineMensajeUsuario ${esEnviado ? 'timelineMensajeUsuario--enviado' : 'timelineMensajeUsuario--recibido'}`}>
                {!esEnviado && <div className="timelineMensajeAvatar">{mensaje.avatar ? <img src={mensaje.avatar} alt={mensaje.usuarioNombre} /> : <span>{mensaje.usuarioNombre.charAt(0).toUpperCase()}</span>}</div>}
                <div className="timelineMensajeBurbuja">
                    {!esEnviado && <span className="timelineMensajeNombre">{mensaje.usuarioNombre}</span>}
                    <span className="timelineMensajeContenido">{mensaje.contenido}</span>
                    <span className="timelineMensajeFecha">{formatearHora(mensaje.fechaCreacion)}</span>
                </div>
            </div>
        );
    };

    /* Renderizar separador de día */
    const renderizarSeparadorDia = (fechaIso: string) => {
        const clave = obtenerClaveDia(fechaIso);
        return (
            <div key={`separador-${clave}`} className="timelineSeparadorDia">
                <span className="timelineSeparadorDiaLinea" />
                <span className="timelineSeparadorDiaTexto">{formatearFechaDia(fechaIso)}</span>
                <span className="timelineSeparadorDiaLinea" />
            </div>
        );
    };

    /* Renderizar estado vacio o cargando */
    const renderizarEstadoTimeline = () => {
        if (estado.cargando && estado.mensajes.length === 0) {
            return (
                <div className="panelChatHistorialVacio">
                    <Loader size={24} className="animacionGirar" />
                    <span>Cargando historial...</span>
                </div>
            );
        }

        if (estado.mensajes.length === 0) {
            return (
                <div className="panelChatHistorialVacio">
                    <MessageCircle size={24} />
                    <span>Sin mensajes aun</span>
                </div>
            );
        }

        /* Agrupar mensajes por día e insertar separadores */
        const elementos: JSX.Element[] = [];
        let diaAnterior = '';

        estado.mensajes.forEach(mensaje => {
            const diaActual = obtenerClaveDia(mensaje.fechaCreacion);

            /* Si cambió el día, insertar separador */
            if (diaActual !== diaAnterior) {
                elementos.push(renderizarSeparadorDia(mensaje.fechaCreacion));
                diaAnterior = diaActual;
            }

            elementos.push(renderizarMensaje(mensaje));
        });

        return elementos;
    };

    return (
        <div id="panel-chat-historial" className="panelChatHistorial">
            {/* Header con toggle de participantes */}
            {tieneParticipantes && (
                <div className="panelChatHistorialHeader">
                    <div className="panelChatHistorialTitulo">
                        <MessageCircle size={14} />
                        <span>Timeline</span>
                    </div>
                    <button type="button" className={`panelChatHistorialBotonParticipantes ${mostrandoParticipantes ? 'panelChatHistorialBotonParticipantes--activo' : ''}`} onClick={() => setMostrandoParticipantes(!mostrandoParticipantes)}>
                        <Users size={12} />
                        <span>{participantes.length}</span>
                    </button>
                </div>
            )}

            {/* Contenido */}
            <div className="panelChatHistorialContenido">
                {/* Timeline Unificado */}
                {!mostrandoParticipantes && (
                    <div className="panelChatHistorialTimeline">
                        <div ref={refContenedor} className="timelineContenedor">
                            {renderizarEstadoTimeline()}
                        </div>

                        {/* Input de mensaje */}
                        <div className="timelineInput">
                            <input type="text" value={mensajeNuevo} onChange={e => setMensajeNuevo(e.target.value)} onKeyDown={manejarTecla} placeholder="Escribe un mensaje..." className="timelineInputTexto" disabled={estado.enviando} />
                            <button type="button" onClick={manejarEnviarMensaje} className="timelineBotonEnviar" disabled={estado.enviando || !mensajeNuevo.trim()} title="Enviar mensaje">
                                {estado.enviando ? <Loader size={14} className="animacionGirar" /> : <Send size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Participantes */}
                {mostrandoParticipantes && (
                    <div className="panelChatHistorialParticipantes">
                        {participantes.length === 0 ? (
                            <div className="panelChatHistorialVacio">
                                <Users size={24} />
                                <span>Sin participantes</span>
                            </div>
                        ) : (
                            participantes.map(participante => (
                                <div key={participante.id} className="panelChatHistorialParticipante">
                                    {participante.avatar ? <img src={participante.avatar} alt={participante.nombre} className="panelChatHistorialParticipanteAvatar" /> : <div className="panelChatHistorialParticipanteAvatarPlaceholder">{participante.nombre.charAt(0).toUpperCase()}</div>}
                                    <span className="panelChatHistorialParticipanteNombre">{participante.nombre}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
