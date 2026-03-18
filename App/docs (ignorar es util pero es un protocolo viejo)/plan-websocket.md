# Plan WebSocket — Chat y Notificaciones en Tiempo Real

> **Última actualización:** 14/03/2026 | **Prioridad:** QK68
> **Estado actual:** Polling 5s para chat, polling periódico para notificaciones
> **Objetivo:** Latencia <500ms para mensajes, notificaciones push instantáneas

## Estado Actual

### Frontend
- `wsService.ts` — Skeleton funcional con heartbeat, reconnect exponencial, pub-sub. Sin URL configurada → modo no-op.
- `useVentanaChat.ts` — Polling setInterval(5s) para mensajes nuevos, smart diff (length + lastId).
- `apiNotificaciones.ts` — Polling periódico para conteo de no leídas.
- `mensajesStore.ts` — Cache con TTL 2min.
- `notificacionesStore.ts` — Estado de badge de notificaciones.

### Backend
- `MensajesController.php` — REST CRUD puro (GET/POST mensajes, marcar leída).
- `NotificacionesController.php` — REST (listar, conteo, marcar leída/todas).
- Sin servidor WebSocket (Ratchet fue eliminado previamente).

### Infra
- Docker + Apache en Coolify. No hay Bun/Node corriendo como servicio.
- JWT (firebase/php-jwt) para autenticación REST.

---

## Arquitectura Propuesta

### Opción elegida: Servidor Bun standalone con WebSocket nativo

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTES                             │
│  Web Browser ──┐                                        │
│  Desktop Tauri ┤── WebSocket ──→ Bun WS Server (:8080)  │
│  Android App ──┘                    │                    │
│                                     │ POST /notify      │
│  PHP (WordPress) ───── HTTP ────────┘                    │
│   (Al crear mensaje,                                    │
│    crear notificación,                                  │
│    etc.)                                                │
└─────────────────────────────────────────────────────────┘
```

### Flujo de un mensaje de chat
1. User A envía mensaje → POST `/kamples/v1/mensajes/{id}` (REST como ahora)
2. PHP guarda en BD, retorna OK → response.data.mensaje
3. PHP hace internal HTTP POST a `http://localhost:8080/notify` con payload:
   ```json
   {
     "secret": "INTERNAL_SECRET",
     "tipo": "mensaje_nuevo",
     "destinatarios": [userId_B],
     "datos": { "conversacionId": 123, "mensaje": {...} }
   }
   ```
4. Bun WS Server recibe, busca conexiones de userId_B → push via WebSocket
5. User B recibe mensaje instantáneamente via wsService.on('mensaje_nuevo', ...)

### Flujo de una notificación
1. Acción triggera notificación (like, follow, comentario, etc.)
2. PHP crea registro en tabla `notificaciones`
3. PHP hace POST a `http://localhost:8080/notify`:
   ```json
   {
     "secret": "INTERNAL_SECRET",
     "tipo": "notificacion",
     "destinatarios": [userId_X],
     "datos": { "id": 456, "tipo": "like", "actor": {...}, "sample": {...} }
   }
   ```
4. Bun WS push → cliente actualiza badge y muestra toast

### Por qué Bun y no Node/Deno/Go
- **Bun WebSocket es built-in** (no necesita ws o socket.io)
- **~2-3MB de RAM por conexión** (eficiente)
- **Single file server** (~150 líneas)
- **Compatible con Docker** para deployment en Coolify
- **Performance:** ~1M msg/s benchmarks vs ~100K en ws/Node

---

## Implementación

### Paso 1: Servidor Bun WebSocket

Archivo: `websocket-server/server.ts` (~100 líneas)

```typescript
/* Servidor WebSocket para Kamples — push de mensajes y notificaciones */
import { verify } from 'jsonwebtoken'; // o equivalente Bun

const SECRET_JWT = process.env.JWT_SECRET;
const SECRET_INTERNAL = process.env.INTERNAL_NOTIFY_SECRET;
const PORT = parseInt(process.env.WS_PORT || '8080');

/* Map userId → Set<WebSocket> (un usuario puede tener múltiples tabs/devices) */
const conexiones = new Map<number, Set<WebSocket>>();

const server = Bun.serve({
  port: PORT,
  
  fetch(req, server) {
    const url = new URL(req.url);
    
    /* Endpoint interno: PHP notifica al WS server */
    if (url.pathname === '/notify' && req.method === 'POST') {
      return manejarNotificacionInterna(req);
    }
    
    /* Health check */
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        ok: true, 
        conexiones: conexiones.size 
      }));
    }
    
    /* Upgrade a WebSocket */
    const token = url.searchParams.get('token');
    if (!token) return new Response('Unauthorized', { status: 401 });
    
    try {
      const payload = verify(token, SECRET_JWT);
      const userId = payload.sub || payload.userId;
      const ok = server.upgrade(req, { data: { userId } });
      if (!ok) return new Response('Upgrade failed', { status: 500 });
    } catch {
      return new Response('Invalid token', { status: 401 });
    }
  },
  
  websocket: {
    open(ws) {
      const { userId } = ws.data;
      if (!conexiones.has(userId)) conexiones.set(userId, new Set());
      conexiones.get(userId).add(ws);
    },
    
    message(ws, msg) {
      /* Clientes solo envían pings — no aceptamos datos del cliente */
      const data = JSON.parse(msg);
      if (data.tipo === 'ping') ws.send(JSON.stringify({ tipo: 'pong' }));
    },
    
    close(ws) {
      const { userId } = ws.data;
      conexiones.get(userId)?.delete(ws);
      if (conexiones.get(userId)?.size === 0) conexiones.delete(userId);
    },
  },
});

async function manejarNotificacionInterna(req) {
  const body = await req.json();
  if (body.secret !== SECRET_INTERNAL) {
    return new Response('Forbidden', { status: 403 });
  }
  
  const { tipo, destinatarios, datos } = body;
  const payload = JSON.stringify({ tipo, datos, timestamp: Date.now() });
  let enviados = 0;
  
  for (const userId of destinatarios) {
    const sockets = conexiones.get(userId);
    if (sockets) {
      for (const ws of sockets) {
        ws.send(payload);
        enviados++;
      }
    }
  }
  
  return Response.json({ ok: true, enviados });
}
```

### Paso 2: Docker y Coolify

Dockerfile para el servidor WS:
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY server.ts .
CMD ["bun", "run", "server.ts"]
```

Agregar al docker-compose del stack Coolify como servicio adicional:
```yaml
websocket:
  image: oven/bun:1
  working_dir: /app
  volumes:
    - ./websocket-server:/app
  environment:
    - JWT_SECRET=${JWT_SECRET}
    - INTERNAL_NOTIFY_SECRET=${INTERNAL_NOTIFY_SECRET}
    - WS_PORT=8080
  expose:
    - "8080"
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.kamples-ws.rule=Host(`kamples.com`) && PathPrefix(`/ws`)"
    - "traefik.http.routers.kamples-ws.tls.certresolver=letsencrypt"
```

### Paso 3: PHP — Notificador interno

Helper PHP que envía notificaciones al servidor Bun:

```php
class NotificadorWebSocket {
    private static string $url = 'http://websocket:8080/notify';
    private static string $secret;
    
    public static function notificar(string $tipo, array $destinatarios, array $datos): void {
        $secret = self::$secret ?: (self::$secret = $_ENV['INTERNAL_NOTIFY_SECRET'] ?? '');
        if (!$secret) return;
        
        /* Fire-and-forget (async via curl non-blocking) */
        $payload = json_encode([
            'secret' => $secret,
            'tipo' => $tipo,
            'destinatarios' => $destinatarios,
            'datos' => $datos,
        ]);
        
        try {
            $ch = curl_init(self::$url);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 2, // 2s max
                CURLOPT_CONNECTTIMEOUT => 1,
            ]);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Throwable $e) {
            /* WS server caído — los clientes caerán a polling fallback */
            error_log('[WS Notificador] Error: ' . $e->getMessage());
        }
    }
}
```

Llamar desde los controladores:
```php
/* MensajesEnvioController.php — después de guardar mensaje */
NotificadorWebSocket::notificar('mensaje_nuevo', [$conversacion->otroUsuarioId], [
    'conversacionId' => $conversacion->id,
    'mensaje' => $mensajeSerializado,
]);

/* NotificacionesHelper.php — después de crear notificación */
NotificadorWebSocket::notificar('notificacion', [$destinatarioId], [
    'id' => $notificacion->id,
    'tipo' => $notificacion->tipo,
    'actor' => $actorSerializado,
]);
```

### Paso 4: Frontend — Integración wsService

Activar el wsService existente:

```typescript
/* En useInicializadorAuth.ts o en AppProvider — después de auth exitosa */
if (autenticado && usuario) {
    const wsUrl = import.meta.env.DEV 
        ? 'ws://localhost:8080'
        : 'wss://kamples.com/ws';
    
    wsService.configurar(wsUrl, usuario.id, obtenerTokenAuth());
    wsService.conectar();
}
```

Modificar wsService para enviar JWT:
```typescript
conectar() {
    const url = `${this.url}?token=${this.jwtToken}`;
    this.ws = new WebSocket(url);
    // ... resto igual (heartbeat, reconnect, dispatch)
}
```

### Paso 5: Hooks que consumen WebSocket

```typescript
/* useVentanaChat.ts — agregar listener WS además de polling */
useEffect(() => {
    const unsub = wsService.on('mensaje_nuevo', (datos) => {
        if (datos.conversacionId === chat.conversacionId) {
            agregarMensaje(datos.mensaje);
        }
    });
    return unsub;
}, [chat.conversacionId]);

/* Reducir polling a 30s como fallback (por si WS se desconecta) */
const INTERVALO_FALLBACK = wsService.estaConectado() ? 30000 : 5000;
```

```typescript
/* useNotificaciones.ts — listener para badge */
useEffect(() => {
    const unsub = wsService.on('notificacion', (datos) => {
        agregarNotificacion(datos);
        incrementarConteoNoLeidas();
        mostrarToast(datos); // Toast visual
    });
    return unsub;
}, []);
```

---

## Tipos de eventos WebSocket

| Evento | Origen | Payload | Acción en cliente |
|--------|--------|---------|-------------------|
| `mensaje_nuevo` | PHP→Bun→Cliente | `{ conversacionId, mensaje }` | Agregar a store mensajes |
| `mensaje_leido` | PHP→Bun→Cliente | `{ conversacionId, mensajeId }` | Marcar como leído |
| `notificacion` | PHP→Bun→Cliente | `{ id, tipo, actor, ... }` | Badge + toast |
| `typing` | Cliente→Bun→Cliente | `{ conversacionId, userId }` | Indicador "escribiendo..." |
| `ping/pong` | Bidireccional | `{}` | Heartbeat |

---

## Fallback (degradación graciosa)

Si el servidor WS no está disponible:
1. `wsService.conectar()` falla → estado 'desconectado'
2. Hooks detectan `!wsService.estaConectado()` → polling activado (5s chat, 15s notificaciones)
3. Cuando WS reconecta → polling se reduce a 30s (backup)

Esto asegura que el chat y las notificaciones SIEMPRE funcionan, independientemente del estado del WS server.

---

## Secuencia de implementación

```
1. Crear websocket-server/server.ts (Bun)          ← Servidor WS
2. Crear NotificadorWebSocket.php (PHP helper)      ← Bridge PHP→WS
3. Integrar en MensajesEnvioController              ← Chat push
4. Integrar en NotificacionesHelper                 ← Notif push
5. Activar wsService en frontend (configurar + JWT) ← Cliente WS
6. Actualizar useVentanaChat (WS + polling fallback)← Chat real-time
7. Actualizar useNotificaciones (WS + badge)        ← Notif real-time
8. Agregar typing indicator                         ← "Escribiendo..."
9. Docker + Coolify deploy                          ← Producción
```

---

## Variables de entorno necesarias

```env
# En el servidor Bun
JWT_SECRET=mismoSecretQuePhp          # Para validar tokens JWT
INTERNAL_NOTIFY_SECRET=secret_random  # Para proteger endpoint /notify
WS_PORT=8080

# En PHP (.env)
KAMPLES_WS_NOTIFY_URL=http://websocket:8080/notify
KAMPLES_WS_NOTIFY_SECRET=secret_random
```

---

## Lecciones y consideraciones

- `[Seguridad]`: JWT en query string de WebSocket es estándar (no hay headers en WS handshake). El token se valida una vez al conectar.
- `[Escalabilidad]`: Bun maneja ~100K conexiones concurrentes. Para Kamples (< 1K usuarios simultáneos), un solo proceso es más que suficiente.
- `[Resiliencia]`: El polling fallback es CRÍTICO. Nunca depender 100% de WebSocket — siempre tener HTTP como backup.
- `[Multi-device]`: Un userId puede tener múltiples conexiones (web + desktop + mobile). El servidor envía a TODAS las conexiones del usuario.
- `[Docker networking]`: PHP y Bun están en la misma red Docker → comunicación via service name (`http://websocket:8080`). No necesita pasar por Traefik.
