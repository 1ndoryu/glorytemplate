# Plan del Sistema de Chat — Nakomi

> Documento de planificación técnica para el sistema de mensajería en tiempo real.  
> Dividido en dos fases: Chat humano (Fase 1) y Chatbot IA (Fase 2).

---

## Índice

1. [Visión General](#1-visión-general)
2. [Fase 1 — Chat Humano en Tiempo Real](#2-fase-1--chat-humano-en-tiempo-real)
3. [Fase 2 — Chatbot IA](#3-fase-2--chatbot-ia)
4. [Arquitectura Técnica](#4-arquitectura-técnica)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [Protocolo WebSocket](#6-protocolo-websocket)
7. [Componentes Frontend](#7-componentes-frontend)
8. [Componentes Backend](#8-componentes-backend)
9. [Flujo de Usuario](#9-flujo-de-usuario)
10. [Roadmap de Implementación](#10-roadmap-de-implementación)

---

## 1. Visión General

### Objetivo
Sistema de mensajería que conecta **clientes** con **encargados** (soporte/ventas) en tiempo real via WebSocket. En su segunda fase, un chatbot IA asiste al cliente antes de la intervención humana.

### Roles del Sistema

| Rol | Descripción | Capacidades |
|-----|-------------|-------------|
| `cliente` | Usuario registrado (rol por defecto) | Enviar mensajes, ver conversaciones propias |
| `encargado` | Staff de soporte/ventas (rol nuevo WP) | Ver todas las conversaciones asignadas, responder, transferir |
| `administrator` | Admin de WP | Todo lo anterior + config, ver métricas, asignar encargados |

### Infraestructura Existente

- **ServidorChat.php**: Implementación Ratchet con WsServer (8080) + HttpServer interno (8081)
- **Ratchet + ReactPHP**: Instalados via composer (`cboden/ratchet`, `react/http`)
- **TokenManager.php**: Validación de tokens Bearer — reutilizable para auth WebSocket
- **GLORY_CONTEXT**: Inyección de datos de sesión al frontend

---

## 2. Fase 1 — Chat Humano en Tiempo Real

### 2.1 Requisitos funcionales

1. **Conversaciones 1:1** entre un cliente y un encargado/admin
2. **Mensajería en tiempo real** via WebSocket (latencia < 200ms)
3. **Historial persistente** de mensajes (almacenado en base de datos)
4. **Indicadores de estado**: "escribiendo...", "leído", "en línea"
5. **Notificaciones**: badge de mensajes no leídos en el header
6. **Asignación**: Round-robin automático de nuevas conversaciones a encargados disponibles
7. **Transferencia**: Un encargado puede transferir una conversación a otro
8. **Archivos**: Envío de imágenes (máx 5MB), subidas via REST API
9. **Responsivo**: Funcional en desktop y móvil

### 2.2 Requisitos no funcionales

- Reconexión automática WebSocket (exponential backoff)
- Heartbeat cada 30s para detectar desconexiones
- Scroll virtual para conversaciones largas (> 200 mensajes)
- Mensajes encriptados en tránsito (WSS en producción)
- Rate limiting: máx 10 mensajes/segundo por usuario

### 2.3 Tipos de mensaje

```
texto       → Mensaje de texto plano
imagen      → URL de imagen subida
sistema     → "Conversación asignada a X", "transferida a Y"
escribiendo → Indicador de que el usuario está escribiendo
leido       → Confirmación de lectura
```

---

## 3. Fase 2 — Chatbot IA

> Se implementa **después** de que el chat humano funcione correctamente.

### 3.1 Objetivo

Chatbot comercial que:
- Atiende al cliente como primer punto de contacto
- Responde preguntas sobre servicios, precios y plazos
- Recolecta información del proyecto del cliente
- Genera planes/presupuestos personalizados
- Escala a un encargado humano cuando es necesario

### 3.2 Flujo

```
Cliente inicia conversación
    → Chatbot saluda y pregunta en qué puede ayudar
    → Cliente describe su necesidad
    → Chatbot identifica servicio relevante
    → Chatbot hace preguntas de descubrimiento (presupuesto, plazo, alcance)
    → Chatbot genera propuesta personalizada con precio estimado
    → Si el cliente acepta → enlace de checkout Stripe
    → Si el cliente quiere hablar con humano → escala a encargado
```

### 3.3 Tecnología

- **Motor IA**: Google Gemini API (clave ya disponible en `.env`: `GOOGLE_GEMINI_API`)
- **Contexto**: System prompt con información de servicios, precios, proceso de trabajo
- **Memoria**: Contexto de la conversación actual (últimos N mensajes)
- **Herramientas (Function Calling)**:
  - `buscarServicio(palabraClave)` → Retorna info del servicio
  - `generarPlanPersonalizado(servicio, requisitos)` → Genera plan con precio
  - `escalarAHumano(razon)` → Transfiere a encargado
  - `crearCheckout(planId)` → Genera link de pago Stripe

### 3.4 Entrenamiento del contexto

El bot necesita un prompt de sistema con:
- Catálogo completo de servicios y precios
- Proceso de trabajo y plazos estimados
- Preguntas frecuentes y respuestas
- Tono de voz de la marca
- Instrucciones de cuándo escalar a humano
- Políticas de precios y descuentos

---

## 4. Arquitectura Técnica

### 4.1 Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React Islands)                               │
│                                                         │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ BurbujaChat  │  │ VentanaChat    │  │ ListaConvers │ │
│  │ (flotante)   │──│ (mensajes)     │  │ (sidebar)    │ │
│  └──────┬───────┘  └───────┬────────┘  └──────┬───────┘ │
│         │                  │                   │         │
│         └──────────────────┤───────────────────┘         │
│                            │ useWebSocket hook           │
│                    ┌───────┴───────┐                     │
│                    │  WebSocket    │                     │
│                    │  ws://...:8080│                     │
└────────────────────┼───────────────┼─────────────────────┘
                     │               │
┌────────────────────┼───────────────┼─────────────────────┐
│  BACKEND           │               │                     │
│                    ▼               │                     │
│  ┌─────────────────────────────┐   │                     │
│  │  ServidorChat.php (Ratchet) │   │                     │
│  │  Puerto 8080 (WS)          │   │                     │
│  │  Puerto 8081 (HTTP interno) │   │                     │
│  └──────────────────┬──────────┘   │                     │
│                     │              │                     │
│  ┌──────────────────▼──────────┐   │                     │
│  │  ChatService.php            │   │                     │
│  │  - Autenticación            │   │                     │
│  │  - Routing de mensajes      │   │                     │
│  │  - Persistencia             │   │                     │
│  └──────────────────┬──────────┘   │                     │
│                     │              │                     │
│  ┌──────────────────▼──────────┐   │                     │
│  │  WordPress DB               │   │                     │
│  │  - glory_conversaciones     │   │                     │
│  │  - glory_mensajes           │   │                     │
│  └─────────────────────────────┘   │                     │
│                                    │                     │
│  ┌─────────────────────────────┐   │                     │
│  │  ChatController.php (REST)  │◄──┘                     │
│  │  /glory/v1/chat/*           │                         │
│  │  - Historial                │                         │
│  │  - Conversaciones           │                         │
│  │  - Upload archivos          │                         │
│  └─────────────────────────────┘                         │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Flujo de datos

1. **Conexión WS**: Cliente envía token + userId al conectar
2. **Mensajes**: Se envían via WS, se persisten en DB vía el servicio PHP
3. **Historial**: Se carga via REST API al abrir una conversación
4. **Notificaciones**: Badge se actualiza via WS (evento `nueva_notificacion`)
5. **Archivos**: Se suben via `POST /glory/v1/chat/upload`, URL se envía como mensaje tipo `imagen`

---

## 5. Modelo de Datos

### 5.1 Tabla: `glory_conversaciones`

```sql
CREATE TABLE {prefix}glory_conversaciones (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id      BIGINT UNSIGNED NOT NULL,       -- wp_users.ID
    encargado_id    BIGINT UNSIGNED DEFAULT NULL,    -- wp_users.ID (null = sin asignar)
    estado          ENUM('activa','cerrada','pendiente','escalada') DEFAULT 'pendiente',
    tipo            ENUM('humano','bot','mixto') DEFAULT 'humano',
    asunto          VARCHAR(255) DEFAULT '',
    ultimo_mensaje  DATETIME DEFAULT NULL,
    creado_en       DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_encargado (encargado_id),
    INDEX idx_estado (estado),
    INDEX idx_ultimo (ultimo_mensaje)
);
```

### 5.2 Tabla: `glory_mensajes`

```sql
CREATE TABLE {prefix}glory_mensajes (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversacion_id BIGINT UNSIGNED NOT NULL,
    autor_id        BIGINT UNSIGNED NOT NULL,        -- 0 = sistema/bot
    tipo            ENUM('texto','imagen','sistema','archivo') DEFAULT 'texto',
    contenido       TEXT NOT NULL,
    leido           TINYINT(1) DEFAULT 0,
    creado_en       DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_conversacion (conversacion_id, creado_en),
    INDEX idx_autor (autor_id),
    FOREIGN KEY (conversacion_id) REFERENCES {prefix}glory_conversaciones(id) ON DELETE CASCADE
);
```

### 5.3 Tabla: `glory_chat_presencia`

```sql
CREATE TABLE {prefix}glory_chat_presencia (
    usuario_id      BIGINT UNSIGNED PRIMARY KEY,
    estado           ENUM('en_linea','ausente','desconectado') DEFAULT 'desconectado',
    ultima_actividad DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 6. Protocolo WebSocket

### 6.1 Conexión

```json
// Cliente → Servidor (primer mensaje tras conectar)
{
    "accion": "autenticar",
    "token": "wp_rest_nonce_aqui",
    "idUsuario": 123
}

// Servidor → Cliente (respuesta)
{
    "accion": "autenticado",
    "exito": true,
    "conversaciones": 3,
    "noLeidos": 5
}
```

### 6.2 Mensajes

```json
// Cliente → Servidor (enviar mensaje)
{
    "accion": "mensaje",
    "conversacionId": 45,
    "tipo": "texto",
    "contenido": "Hola, necesito información sobre diseño web"
}

// Servidor → Destinatario (entregar mensaje)
{
    "accion": "mensaje_nuevo",
    "conversacionId": 45,
    "mensaje": {
        "id": 1234,
        "autorId": 123,
        "autorNombre": "Juan",
        "tipo": "texto",
        "contenido": "Hola, necesito información sobre diseño web",
        "creadoEn": "2024-01-15T14:30:00Z"
    }
}
```

### 6.3 Indicadores

```json
// Escribiendo
{
    "accion": "escribiendo",
    "conversacionId": 45,
    "estado": true
}

// Lectura confirmada
{
    "accion": "leido",
    "conversacionId": 45,
    "hastaId": 1234
}

// Presencia
{
    "accion": "presencia",
    "idUsuario": 123,
    "estado": "en_linea"
}
```

### 6.4 Notificaciones

```json
// Servidor → Cliente (nueva notificación global)
{
    "accion": "notificacion",
    "tipo": "nuevo_mensaje",
    "conversacionId": 45,
    "preview": "Hola, necesito info...",
    "noLeidos": 6
}
```

---

## 7. Componentes Frontend

### 7.1 Estructura de archivos

```
App/React/
├── components/
│   └── chat/
│       ├── BurbujaChatFlotante.tsx    # Widget flotante en esquina (clientes)
│       ├── BurbujaChatFlotante.css
│       ├── VentanaChat.tsx            # Ventana de conversación
│       ├── VentanaChat.css
│       ├── MensajeChat.tsx            # Burbuja individual de mensaje
│       ├── MensajeChat.css
│       ├── InputChat.tsx              # Input con envío, adjuntos
│       ├── InputChat.css
│       ├── ListaConversaciones.tsx    # Sidebar de conversaciones (encargados)
│       ├── ListaConversaciones.css
│       ├── IndicadorEscribiendo.tsx   # "Escribiendo..."
│       └── BadgeMensajes.tsx          # Badge de no leídos
├── hooks/
│   ├── useWebSocket.ts               # Conexión WS con reconexión
│   └── useChat.ts                    # Estado y lógica del chat
├── islands/
│   ├── ChatIsland.tsx                 # Isla completa para /chat/
│   └── ChatIsland.css
├── types/
│   └── chat.ts                        # Tipos del sistema de chat
└── data/
    └── chat.ts                        # Constantes del chat
```

### 7.2 Hook: useWebSocket

```typescript
/* Responsabilidades:
 * - Conectar a ws://host:8080
 * - Enviar token de autenticación al conectar
 * - Reconexión automática con exponential backoff (1s, 2s, 4s, 8s, máx 30s)
 * - Heartbeat cada 30s
 * - Distribuir mensajes entrantes a los handlers registrados
 * - Exponer: send(data), estado (conectado/desconectado/reconectando), close()
 */
```

### 7.3 Hook: useChat

```typescript
/* Responsabilidades:
 * - Estado de conversaciones y mensajes
 * - Cargar historial via REST API
 * - Enviar mensajes via WebSocket
 * - Manejar indicadores de escritura
 * - Marcar mensajes como leídos
 * - Contador de no leídos
 * - Exponer: mensajes[], enviar(), conversaciones[], noLeidos, escribiendo
 */
```

### 7.4 Componente: BurbujaChatFlotante

- Botón circular fijo en esquina inferior derecha
- Badge con número de mensajes no leídos
- Al hacer click: expande ventana de chat inline
- Visible en **todas las páginas** (excepto /panel/ y /chat/)
- Se monta como isla independiente o se integra en LayoutPagina

### 7.5 Componente: VentanaChat

- Header: nombre del encargado, estado (en línea/ausente), botón cerrar
- Área de mensajes: scroll, lazy load de historial antiguo
- Input: textarea autoexpandible, botón enviar, botón adjuntar imagen
- Indicador "escribiendo..." cuando el otro usuario escribe

---

## 8. Componentes Backend

### 8.1 Archivos nuevos

```
Glory/src/Services/Chat/
├── ChatService.php           # Lógica de negocio: crear conv, enviar msg, asignar
├── ChatRepository.php        # Queries SQL: insertar/leer mensajes y conversaciones
├── ChatInstaller.php         # Crear tablas en activación del tema

App/Handlers/
├── ChatController.php        # REST API: /glory/v1/chat/*
```

### 8.2 Endpoints REST

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/glory/v1/chat/conversaciones` | Lista de conversaciones del usuario | Sí |
| GET | `/glory/v1/chat/conversaciones/{id}/mensajes` | Historial de mensajes (paginado) | Sí |
| POST | `/glory/v1/chat/conversaciones` | Iniciar nueva conversación | Sí |
| POST | `/glory/v1/chat/mensajes` | Enviar mensaje (fallback sin WS) | Sí |
| PUT | `/glory/v1/chat/conversaciones/{id}/leer` | Marcar mensajes como leídos | Sí |
| POST | `/glory/v1/chat/upload` | Subir imagen (devuelve URL) | Sí |
| PUT | `/glory/v1/chat/conversaciones/{id}/asignar` | Asignar encargado | Admin |
| PUT | `/glory/v1/chat/conversaciones/{id}/cerrar` | Cerrar conversación | Encargado |

### 8.3 Rol WordPress: `encargado`

```php
/* Capacidades del rol encargado */
$capabilities = [
    'read'                 => true,
    'glory_chat_responder' => true,
    'glory_chat_ver_todas' => true,
    'glory_chat_transferir'=> true,
    'upload_files'         => true,
];
```

### 8.4 Modificaciones a ServidorChat.php

El servidor actual es muy básico. Necesita:

1. **Autenticación**: Validar nonce/token WP al conectar (primer mensaje)
2. **Routing**: Dirigir mensajes al destinatario correcto (por conversación)
3. **Persistencia**: Guardar cada mensaje en DB al recibirlo
4. **Presencia**: Trackear usuarios conectados y su estado
5. **Salas**: Agrupar conexiones por conversación
6. **Broadcast**: Notificar a todos los encargados conectados de nuevas conversaciones

---

## 9. Flujo de Usuario

### 9.1 Cliente inicia conversación

```
1. Cliente ve BurbujaChatFlotante en cualquier página
2. Click → se abre VentanaChat
3. Si no hay conversación activa → POST /chat/conversaciones
4. Se asigna encargado disponible (round-robin)
5. Cliente escribe mensaje → se envía via WebSocket
6. Encargado recibe notificación en su panel
7. Encargado responde → cliente ve el mensaje en tiempo real
```

### 9.2 Encargado gestiona conversaciones

```
1. Encargado entra a /chat/ o /panel/ → ve ListaConversaciones
2. Selecciona conversación → se carga VentanaChat con historial
3. Responde mensajes en tiempo real
4. Puede transferir conversación a otro encargado
5. Puede cerrar conversación cuando se resuelve
```

### 9.3 Flujo de contacto → chat (integración con formulario)

```
1. Cliente visita /contacto/ y llena formulario
2. Al enviar → se crea conversación con los datos del formulario como primer mensaje
3. Se redirige al chat con la conversación abierta
4. Encargado ve los detalles del proyecto en el primer mensaje
```

---

## 10. Roadmap de Implementación

### Fase 1A — Infraestructura base (Backend)

- [ ] Crear rol `encargado` en WP
- [ ] Crear tablas de DB (`ChatInstaller.php`)
- [ ] Implementar `ChatRepository.php` (CRUD de mensajes y conversaciones)
- [ ] Implementar `ChatService.php` (lógica de negocio)
- [ ] Actualizar `ServidorChat.php` (autenticación, routing, persistencia)
- [ ] Crear `ChatController.php` (REST API)
- [ ] Registrar en `Setup.php`
- [ ] Comando WP-CLI para iniciar el servidor WebSocket

### Fase 1B — Frontend base

- [ ] Tipos TypeScript (`types/chat.ts`)
- [ ] Hook `useWebSocket.ts`
- [ ] Hook `useChat.ts`
- [ ] Componente `MensajeChat.tsx`
- [ ] Componente `InputChat.tsx`
- [ ] Componente `VentanaChat.tsx`
- [ ] Componente `ListaConversaciones.tsx`
- [ ] Isla `ChatIsland.tsx`
- [ ] Registrar en `appIslands.tsx` y `pages.php`

### Fase 1C — Integración y pulido

- [ ] Componente `BurbujaChatFlotante.tsx` (widget global)
- [ ] Badge de notificaciones en Header
- [ ] Indicador "escribiendo..."
- [ ] Subida de imágenes
- [ ] Transfer de conversaciones
- [ ] Estilos CSS completos
- [ ] Testing manual de todos los flujos

### Fase 2 — Chatbot IA

- [ ] Diseñar system prompt con catálogo de servicios
- [ ] Integrar Google Gemini API en backend
- [ ] Implementar function calling (buscarServicio, generarPlan, etc.)
- [ ] Flujo bot → escalada a humano
- [ ] Generación de planes personalizados
- [ ] Enlace a checkout Stripe desde el bot
- [ ] Testing y ajuste del prompt

---

## Notas técnicas

- **WSS en producción**: Requiere proxy inverso (nginx) para terminar SSL y forward al puerto 8080
- **Escalabilidad**: Ratchet es single-thread. Para > 1000 conexiones simultáneas considerar alternatives (Swoole, Go, o Redis pub/sub)
- **Persistencia**: Los mensajes se guardan inmediatamente en DB al recibirlos en el WebSocket, no solo al cerrar
- **Reconexión**: El frontend debe manejar reconexión sin perder mensajes (resume desde último mensaje_id conocido)
- **Gemini API**: La clave `GOOGLE_GEMINI_API` ya está en `.env`. Endpoint: `generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
