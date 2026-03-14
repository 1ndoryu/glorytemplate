/*
 * Service: wsService — Kamples (QK68)
 * Servicio singleton de WebSocket para mensajes y notificaciones en tiempo real.
 * Gestiona una única conexión compartida entre toda la aplicación.
 * Auth: HMAC ticket obtenido de /kamples/v1/ws/ticket.
 */

import { crearLogger } from './logger';

const log = crearLogger('wsService');

type HandlerMensaje = (datos: unknown) => void;
type EstadoConexion = 'conectado' | 'conectando' | 'desconectado';

interface MensajeWS {
    tipo: string;
    datos: unknown;
    timestamp: number;
}

const HEARTBEAT_MS = 25000;
const RECONEXION_BASE_MS = 1000;
const MAX_RECONEXION_MS = 30000;
const MAX_INTENTOS = 10;

class WSService {
    private ws: WebSocket | null = null;
    private handlers = new Map<string, Set<HandlerMensaje>>();
    private estado: EstadoConexion = 'desconectado';
    private intentos = 0;
    private heartbeatId: number | null = null;
    private reconexionId: number | null = null;
    private url: string | null = null;
    private userId: number | null = null;
    private ticket: string | null = null;
    private callbacksEstado = new Set<(estado: EstadoConexion) => void>();

    /*
     * Configura la URL del servidor, el usuario y el ticket HMAC.
     */
    configurar(url: string, userId: number, ticket: string) {
        this.url = url;
        this.userId = userId;
        this.ticket = ticket;
    }

    /*
     * Conectar al servidor WebSocket con ticket HMAC.
     */
    conectar() {
        if (!this.url || !this.userId || !this.ticket) {
            log.debug('WS sin configurar (modo offline)');
            return;
        }

        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.setEstado('conectando');

        try {
            this.ws = new WebSocket(`${this.url}?ticket=${this.ticket}`);

            this.ws.onopen = () => {
                log.info('WS conectado');
                this.setEstado('conectado');
                this.intentos = 0;
                this.iniciarHeartbeat();
            };

            this.ws.onmessage = (evento) => {
                try {
                    const mensaje: MensajeWS = JSON.parse(evento.data);
                    this.despachar(mensaje.tipo, mensaje.datos);
                } catch {
                    log.warn('Mensaje WS inválido recibido');
                }
            };

            this.ws.onclose = () => {
                log.info('WS desconectado');
                this.setEstado('desconectado');
                this.detenerHeartbeat();
                this.programarReconexion();
            };

            this.ws.onerror = () => {
                log.debug('Error WS (servidor no disponible)');
            };
        } catch {
            log.debug('No se pudo crear WebSocket');
            this.setEstado('desconectado');
        }
    }

    /*
     * Desconectar y limpiar.
     */
    desconectar() {
        this.limpiarTimers();

        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }

        this.setEstado('desconectado');
        this.intentos = 0;
        this.ticket = null;
    }

    /*
     * Suscribirse a un tipo de mensaje.
     * Retorna función para desuscribirse (patrón unsubscribe).
     */
    on(tipo: string, handler: HandlerMensaje): () => void {
        if (!this.handlers.has(tipo)) {
            this.handlers.set(tipo, new Set());
        }
        this.handlers.get(tipo)!.add(handler);

        return () => {
            this.handlers.get(tipo)?.delete(handler);
        };
    }

    /*
     * Enviar mensaje al servidor.
     */
    enviar(tipo: string, datos: unknown = {}): boolean {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            log.debug('WS no conectado, mensaje descartado', { tipo });
            return false;
        }

        try {
            this.ws.send(JSON.stringify({ tipo, datos, timestamp: Date.now() }));
            return true;
        } catch (err) {
            log.error('Error enviando por WS', err);
            return false;
        }
    }

    /*
     * Obtener estado actual de la conexión.
     */
    obtenerEstado(): EstadoConexion {
        return this.estado;
    }

    /*
     * Si la conexión WebSocket está activa.
     */
    estaConectado(): boolean {
        return this.estado === 'conectado';
    }

    /*
     * Registrar callback para cambios de estado (soporta múltiples listeners).
     */
    onCambioEstado(callback: (estado: EstadoConexion) => void): () => void {
        this.callbacksEstado.add(callback);
        return () => { this.callbacksEstado.delete(callback); };
    }

    /*
     * Actualizar ticket (para reconexiones con ticket renovado).
     */
    actualizarTicket(ticket: string) {
        this.ticket = ticket;
    }

    /* Utilidades privadas */

    private setEstado(estado: EstadoConexion) {
        this.estado = estado;
        this.callbacksEstado.forEach(cb => cb(estado));
    }

    private despachar(tipo: string, datos: unknown) {
        const handlers = this.handlers.get(tipo);
        if (handlers) {
            handlers.forEach(h => h(datos));
        }

        /* Handler comodín — recibe tipo y datos */
        const globales = this.handlers.get('*');
        if (globales) {
            globales.forEach(h => h({ tipo, datos }));
        }
    }

    private iniciarHeartbeat() {
        this.detenerHeartbeat();
        this.heartbeatId = window.setInterval(() => {
            this.enviar('ping');
        }, HEARTBEAT_MS);
    }

    private detenerHeartbeat() {
        if (this.heartbeatId) {
            clearInterval(this.heartbeatId);
            this.heartbeatId = null;
        }
    }

    private programarReconexion() {
        if (this.intentos >= MAX_INTENTOS) {
            log.warn(`Máximo de intentos WS alcanzado (${MAX_INTENTOS})`);
            return;
        }

        const delay = Math.min(
            RECONEXION_BASE_MS * Math.pow(2, this.intentos),
            MAX_RECONEXION_MS
        );
        this.intentos++;

        this.reconexionId = window.setTimeout(() => {
            this.conectar();
        }, delay);
    }

    private limpiarTimers() {
        this.detenerHeartbeat();
        if (this.reconexionId) {
            clearTimeout(this.reconexionId);
            this.reconexionId = null;
        }
    }
}

/* Instancia singleton exportada */
export const wsService = new WSService();
export type { MensajeWS, EstadoConexion, HandlerMensaje };
