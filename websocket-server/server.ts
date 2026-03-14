/*
 * Servidor WebSocket — Kamples
 * Push de mensajes y notificaciones en tiempo real.
 * Protocolo: Bun WebSocket nativo con HMAC ticket auth.
 *
 * Endpoints HTTP:
 * - POST /notify  — PHP notifica eventos (internal, protegido por secret)
 * - GET  /health  — Health check para monitoreo
 * - WS   /        — WebSocket upgrade con ticket en query param
 */

const INTERNAL_SECRET = process.env.KAMPLES_WS_INTERNAL_SECRET ?? '';
const TICKET_SECRET = process.env.KAMPLES_WS_TICKET_SECRET ?? '';
const PORT = parseInt(process.env.WS_PORT ?? '8080', 10);
const TICKET_TTL_SECONDS = 120;

if (!INTERNAL_SECRET || !TICKET_SECRET) {
    console.error('[WS] KAMPLES_WS_INTERNAL_SECRET y KAMPLES_WS_TICKET_SECRET son obligatorios');
    process.exit(1);
}

/* Map userId → Set<WebSocket> (multi-device) */
const conexiones = new Map<number, Set<WebSocket>>();

interface DatosConexion {
    userId: number;
}

/* Verificar ticket HMAC: "userId.expiry.signature" */
async function verificarTicket(ticket: string): Promise<number | null> {
    const partes = ticket.split('.');
    if (partes.length !== 3) return null;

    const [userIdStr, expiryStr, firma] = partes;
    const userId = parseInt(userIdStr, 10);
    const expiry = parseInt(expiryStr, 10);

    if (isNaN(userId) || isNaN(expiry)) return null;
    if (Date.now() / 1000 > expiry) return null;

    const mensaje = `${userIdStr}.${expiryStr}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(TICKET_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(mensaje));
    const firmaEsperada = Buffer.from(sig).toString('hex');

    if (firma !== firmaEsperada) return null;

    return userId;
}

/* Enviar evento a todos los sockets de un usuario */
function enviarAUsuario(userId: number, payload: string): number {
    const sockets = conexiones.get(userId);
    if (!sockets) return 0;

    let enviados = 0;
    for (const ws of sockets) {
        try {
            ws.send(payload);
            enviados++;
        } catch {
            /* Socket muerto — se limpiará en close */
        }
    }
    return enviados;
}

/* Maneja POST /notify desde PHP */
async function manejarNotificacion(req: Request): Promise<Response> {
    try {
        const body = await req.json() as {
            secret: string;
            tipo: string;
            destinatarios: number[];
            datos: unknown;
        };

        if (body.secret !== INTERNAL_SECRET) {
            return new Response('Forbidden', { status: 403 });
        }

        const { tipo, destinatarios, datos } = body;
        const payload = JSON.stringify({ tipo, datos, timestamp: Date.now() });

        let totalEnviados = 0;
        for (const userId of destinatarios) {
            totalEnviados += enviarAUsuario(userId, payload);
        }

        return Response.json({ ok: true, enviados: totalEnviados });
    } catch (err) {
        console.error('[WS] Error procesando /notify:', err);
        return new Response('Bad Request', { status: 400 });
    }
}

const server = Bun.serve({
    port: PORT,

    fetch(req, server) {
        const url = new URL(req.url);

        /* POST /notify — PHP notifica eventos */
        if (url.pathname === '/notify' && req.method === 'POST') {
            return manejarNotificacion(req);
        }

        /* GET /health */
        if (url.pathname === '/health') {
            let totalSockets = 0;
            for (const sockets of conexiones.values()) {
                totalSockets += sockets.size;
            }
            return Response.json({
                ok: true,
                usuarios: conexiones.size,
                sockets: totalSockets,
            });
        }

        /* WebSocket upgrade */
        const ticket = url.searchParams.get('ticket');
        if (!ticket) {
            return new Response('Unauthorized — ticket requerido', { status: 401 });
        }

        /* Verificación async del ticket */
        return verificarTicket(ticket).then((userId) => {
            if (!userId) {
                return new Response('Unauthorized — ticket inválido o expirado', { status: 401 });
            }

            const ok = server.upgrade(req, { data: { userId } as DatosConexion });
            if (!ok) {
                return new Response('WebSocket upgrade failed', { status: 500 });
            }
            /* Bun maneja el upgrade — no se retorna Response */
            return undefined as unknown as Response;
        });
    },

    websocket: {
        open(ws) {
            const { userId } = ws.data as DatosConexion;
            if (!conexiones.has(userId)) {
                conexiones.set(userId, new Set());
            }
            conexiones.get(userId)!.add(ws);
            console.log(`[WS] Conectado userId=${userId} (${conexiones.get(userId)!.size} sockets)`);
        },

        message(ws, msg) {
            try {
                const data = JSON.parse(String(msg));
                if (data.tipo === 'ping') {
                    ws.send(JSON.stringify({ tipo: 'pong', timestamp: Date.now() }));
                }
                /* No aceptamos otros mensajes del cliente — solo push server→client */
            } catch {
                /* Mensaje no JSON — ignorar */
            }
        },

        close(ws) {
            const { userId } = ws.data as DatosConexion;
            conexiones.get(userId)?.delete(ws);
            if (conexiones.get(userId)?.size === 0) {
                conexiones.delete(userId);
            }
            console.log(`[WS] Desconectado userId=${userId}`);
        },
    },
});

console.log(`[WS] Servidor Kamples WebSocket escuchando en puerto ${PORT}`);
