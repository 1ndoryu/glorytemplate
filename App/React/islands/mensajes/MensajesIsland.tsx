/*
 * Isla: MensajesIsland — Kamples (Fase 7.2)
 * Lista de conversaciones con indicador de no leídos,
 * estado online/offline y último mensaje.
 * TO-DO: conectar WebSocket para tiempo real (7.1).
 */

import { useEffect, useCallback, useState } from 'react';
import {
    MessageCircle,
} from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { Avatar } from '@app/components/ui/Avatar';
import { InputBusqueda } from '@app/components/ui/InputBusqueda';
import { obtenerConversaciones, marcarConversacionLeida } from '@app/services/apiMensajes';
import { useMensajesStore } from '@app/stores/mensajesStore';
import { useNavigationStore } from '@/core/router';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import type { Conversacion } from '@app/types';
import '../../styles/componentes/mensajes.css';

/* Formatear tiempo relativo */
const formatearTiempo = (fecha: string): string => {
    const ahora = Date.now();
    const diff = ahora - new Date(fecha).getTime();
    const minutos = Math.floor(diff / 60000);
    if (minutos < 1) return 'ahora';
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `${dias}d`;
    return new Date(fecha).toLocaleDateString('es');
};

const MensajesIslandBase = (): JSX.Element => {
    const conversaciones = useMensajesStore(s => s.conversaciones);
    const cargandoConversaciones = useMensajesStore(s => s.cargandoConversaciones);
    const conversacionesCargadas = useMensajesStore(s => s.conversacionesCargadas);
    const setConversaciones = useMensajesStore(s => s.setConversaciones);
    const setCargandoConversaciones = useMensajesStore(s => s.setCargandoConversaciones);
    const necesitaRefrescar = useMensajesStore(s => s.necesitaRefrescar);

    const navegar = useNavigationStore(s => s.navegar);
    const [busqueda, setBusqueda] = useState('');

    /*
     * C192: Stale-while-revalidate.
     * Solo muestra spinner si nunca se cargo. Si hay cache, muestra al instante
     * y refresca en background si el TTL expiro.
     */
    useEffect(() => {
        let cancelado = false;
        if (!necesitaRefrescar()) return;

        /* Solo spinner si no hay datos previos */
        if (!conversacionesCargadas) {
            setCargandoConversaciones(true);
        }

        obtenerConversaciones().then((resp) => {
            if (!cancelado && resp.ok && resp.data) {
                setConversaciones(resp.data);
            }
            if (!cancelado) setCargandoConversaciones(false);
        }).catch(() => {
            if (!cancelado) setCargandoConversaciones(false);
        });

        return () => { cancelado = true; };
    }, [setConversaciones, setCargandoConversaciones]);

    /* Abrir una conversación */
    const abrirConversacion = useCallback(
        async (conv: Conversacion) => {
            try {
                if (conv.noLeidos > 0) {
                    useMensajesStore.getState().marcarConversacionLeida(conv.id);
                    await marcarConversacionLeida(conv.id);
                }
            } catch {
                /* Fallo al marcar leída no bloquea la navegación */
            }
            navegar(`/mensajes/${conv.id}/`);
        },
        [navegar]
    );

    /* Filtrar conversaciones por búsqueda */
    const filtradas = busqueda.trim()
        ? conversaciones.filter((c) =>
              c.participante.nombreVisible.toLowerCase().includes(busqueda.toLowerCase()) ||
              c.participante.username.toLowerCase().includes(busqueda.toLowerCase())
          )
        : conversaciones;

    const totalNoLeidos = conversaciones.reduce((acc, c) => acc + c.noLeidos, 0);

    return (
        <div className="mensajesIsland" id="mensajesIsland">
            {/* Header */}
            <div className="mensajesHeader">
                <div className="mensajesHeaderTitulo">
                    <MessageCircle size={20} />
                    <h1>Mensajes</h1>
                    {totalNoLeidos > 0 && (
                        <Badge variante="acento" tamano="xs">{totalNoLeidos}</Badge>
                    )}
                </div>
            </div>

            {/* Buscador */}
            <div className="mensajesBuscador">
                <InputBusqueda
                    placeholder="Buscar conversaciones..."
                    valor={busqueda}
                    onChange={setBusqueda}
                />
            </div>

            {/* Lista de conversaciones */}
            {cargandoConversaciones && !conversacionesCargadas ? (
                <div className="mensajesVacio">Cargando conversaciones...</div>
            ) : filtradas.length === 0 ? (
                <div className="mensajesVacio">
                    <MessageCircle size={32} />
                    <p>{busqueda ? 'Sin resultados' : 'No tienes conversaciones aún'}</p>
                </div>
            ) : (
                <div className="mensajesLista">
                    {filtradas.map((conv) => (
                        <button
                            key={conv.id}
                            className={`mensajesItem ${conv.noLeidos > 0 ? 'mensajesItemNoLeido' : ''}`}
                            onClick={() => abrirConversacion(conv)}
                            type="button"
                        >
                            <div className="mensajesItemAvatar">
                                <Avatar
                                    nombre={conv.participante.nombreVisible}
                                    src={conv.participante.avatarUrl ?? undefined}
                                    tamano="md"
                                />
                                {conv.enLinea && (
                                    <span className="mensajesOnlineIndicador" />
                                )}
                            </div>

                            <div className="mensajesItemContenido">
                                <div className="mensajesItemSuperior">
                                    <span className="mensajesItemNombre">
                                        {conv.participante.nombreVisible}
                                    </span>
                                    <span className="mensajesItemTiempo">
                                        {formatearTiempo(conv.ultimoMensajeAt)}
                                    </span>
                                </div>
                                <div className="mensajesItemInferior">
                                    <span className="mensajesItemUltimoMensaje">
                                        {conv.ultimoMensaje}
                                    </span>
                                    {conv.noLeidos > 0 && (
                                        <Badge variante="acento" tamano="xs">
                                            {conv.noLeidos}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const MensajesIsland = conAutenticacion(MensajesIslandBase);
export default MensajesIsland;
