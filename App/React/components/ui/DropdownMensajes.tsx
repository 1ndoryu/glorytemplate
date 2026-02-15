/*
 * Componente: DropdownMensajes — Kamples
 * Panel dropdown con la lista de conversaciones recientes.
 * Se muestra al hacer click en el icono de correo del TopBar.
 */

import { useCallback } from 'react';
import { Mail } from 'lucide-react';
import { Avatar } from './Avatar';
import { useChatFlotanteStore } from '@app/stores/chatFlotanteStore';
import '../../styles/componentes/dropdownPanel.css';

interface ConversacionResumen {
    id: number;
    usuario: string;
    avatarUrl: string | null;
    ultimoMensaje: string;
    tiempo: string;
    sinLeer: boolean;
}

/* Mock de conversaciones para demostración */
const conversacionesMock: ConversacionResumen[] = [
    { id: 1, usuario: 'beatmaker', avatarUrl: null, ultimoMensaje: 'Bro, ese sample está increíble 🔥', tiempo: 'Hace 10 min', sinLeer: true },
    { id: 2, usuario: 'prodmusic', avatarUrl: null, ultimoMensaje: '¿Puedo usar tu kick en mi beat?', tiempo: 'Hace 1h', sinLeer: true },
    { id: 3, usuario: 'lofibeats', avatarUrl: null, ultimoMensaje: 'Gracias por el follow!', tiempo: 'Hace 3h', sinLeer: false },
    { id: 4, usuario: 'trapking', avatarUrl: null, ultimoMensaje: 'Dale, te mando el collab.', tiempo: 'Ayer', sinLeer: false },
];

interface DropdownMensajesProps {
    onCerrar: () => void;
}

export const DropdownMensajes = ({ onCerrar }: DropdownMensajesProps): JSX.Element => {
    const { abrirChat } = useChatFlotanteStore();

    /* Abrir chat flotante en vez de navegar a /mensajes */
    const abrirConversacion = useCallback((conv: ConversacionResumen) => {
        abrirChat({
            conversacionId: conv.id,
            nombreParticipante: conv.usuario,
            avatarUrl: conv.avatarUrl,
        });
        onCerrar();
    }, [abrirChat, onCerrar]);

    const sinLeer = conversacionesMock.filter((c) => c.sinLeer).length;

    return (
        <>
            <div className="dropdownOverlay" onClick={onCerrar} />
            <div className="dropdownPanel">
                <div className="dropdownPanelCabecera">
                    <span className="dropdownPanelTitulo">
                        Mensajes {sinLeer > 0 && `(${sinLeer})`}
                    </span>
                </div>

                <div className="dropdownPanelLista">
                    {conversacionesMock.length === 0 ? (
                        <div className="dropdownPanelVacio">
                            <Mail size={28} />
                            <p>Sin mensajes</p>
                        </div>
                    ) : (
                        conversacionesMock.map((conv) => (
                            <div
                                key={conv.id}
                                className={`dropdownItem ${conv.sinLeer ? 'dropdownItemNoLeido' : ''}`}
                                onClick={() => abrirConversacion(conv)}
                            >
                                <Avatar
                                    src={conv.avatarUrl}
                                    nombre={conv.usuario}
                                    tamano="sm"
                                />
                                <div className="dropdownItemContenido">
                                    <span className="dropdownItemTexto">
                                        <strong>@{conv.usuario}</strong> {conv.ultimoMensaje}
                                    </span>
                                    <span className="dropdownItemTiempo">{conv.tiempo}</span>
                                </div>
                                {conv.sinLeer && <div className="dropdownItemPunto" />}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default DropdownMensajes;
