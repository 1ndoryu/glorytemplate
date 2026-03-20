/*
 * Isla: MensajesIsland — Kamples (Fase 7.2)
 * Lista de conversaciones con indicador de no leídos,
 * estado online/offline y último mensaje.
 * TO-DO: conectar WebSocket para tiempo real (7.1).
 */

import { MessageCircle, BadgeCheck } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { Avatar } from '@app/components/ui/Avatar';
import { InputBusqueda } from '@app/components/ui/InputBusqueda';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useMensajesIsland } from '@app/hooks/useMensajesIsland';
import '../../styles/componentes/mensajes.css';
import { BotonBase } from '../../components/ui/BotonBase';
import { SkeletonFeed } from '@app/components/skeletons';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';

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
    const {
        cargandoConversaciones, conversacionesCargadas,
        busqueda, setBusqueda, abrirConversacion,
        filtradas, totalNoLeidos,
    } = useMensajesIsland();

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
                <SkeletonFeed cantidad={4} />
            ) : filtradas.length === 0 ? (
                <EstadoVacio
                    icono={<MessageCircle size={32} />}
                    mensaje={busqueda ? 'Sin resultados' : 'No tienes conversaciones aún'}
                />
            ) : (
                <div className="mensajesLista">
                    {filtradas.map((conv) => (
                        <BotonBase variante="ghost"
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
                                        {/* [193A-55] Badge verificado en lista de mensajes */}
                                        {conv.participante.verificado && <BadgeCheck size={12} className="mensajesVerificado" />}
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
                        </BotonBase>
                    ))}
                </div>
            )}
        </div>
    );
};

export const MensajesIsland = conAutenticacion(MensajesIslandBase);
export default MensajesIsland;
