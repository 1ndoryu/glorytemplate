# Kamples — Roadmap Integral de Producto

> **Versión:** 1.0  
> **Última actualización:** 14/02/2026  
> **Stack base:** Glory Framework (WordPress + React Islands + TypeScript)  
> **Competencia directa:** Splice  

---

## Visión del Producto

Kamples es una plataforma de samples de audio con alma de red social, impulsada por un algoritmo de descubrimiento de nivel superior. No es solo un repositorio de sonidos: es un ecosistema donde productores descubren, comparten, colaboran y monetizan su contenido sonoro. La experiencia debe ser ultrarrápida, minimalista y adictiva.

**Diferenciadores clave frente a Splice:**
- Algoritmo de recomendación multi-señal (6 factores) vs. búsqueda básica de Splice
- Red social nativa (feed, follows, mensajes, publicaciones)
- Marketplace híbrido (suscripción + venta directa + revenue share)
- Análisis de audio con IA (Gemini Flash) para metadatos automáticos
- App desktop con integración DAW (drag-to-DAW, piano one-shot)
- App móvil para descubrimiento y escucha
- Waveforms interactivos y reproductor avanzado

---

## Principios de Desarrollo

1. **Minimalista** — UI ultra-limpia, fondo `#050505`, espaciados controlados
2. **Arquitectura profesional** — SOLID, separación por dominio, escalabilidad
3. **Rendimiento primero** — Lazy loading, audio optimizado, queries eficientes
4. **SEO absoluto** — SSR de meta tags, JSON-LD, Open Graph para cada sample/perfil
5. **TypeScript-first / PHP mínimo** — Toda la lógica de negocio, validación y UI en TypeScript. PHP se limita estrictamente a: registro de rutas (pages.php), endpoints REST (Controllers), bridge con WordPress (auth, wp_user_id) y acceso a PostgreSQL (queries). Cero lógica de dominio en PHP.
6. **Componentes desde cero** — Botones, badges, menús, modales, waveforms propios
7. **Depuración por niveles** — Logger con niveles (error por defecto, debug en dev)

---

## Decisiones Arquitectónicas

### Base de Datos: PostgreSQL paralelo a WordPress

```
┌─────────────────────┐     ┌──────────────────────────────────┐
│   WordPress MySQL   │     │       PostgreSQL (Kamples)        │
│                     │     │                                  │
│  - Usuarios WP      │◄───►│  - samples (JSONB metadata)      │
│  - Opciones tema    │     │  - usuarios_ext (perfil social)  │
│  - Media (thumbs)   │     │  - publicaciones                 │
│  - SEO meta         │     │  - follows / likes / reposts     │
│                     │     │  - mensajes                      │
│                     │     │  - descargas / historial          │
│                     │     │  - planes / suscripciones        │
│                     │     │  - transacciones / payouts       │
│                     │     │  - vectores (pgvector)           │
│                     │     │  - playlists / colecciones       │
└─────────────────────┘     └──────────────────────────────────┘
```

**Justificación:**
- **JSONB** para metadata flexible de samples (tags, instrumentos, sentimiento, etc.) con índices GIN ultra-rápidos
- **pgvector** para embeddings de audio (similitud por vectores) — esto es lo que hace al algoritmo superior
- WordPress sigue en MySQL para compatibilidad con plugins, auth, admin
- Bridge vía `wp_user_id` en la tabla `usuarios_ext` de Postgres
- Queries del algoritmo ejecutan en Postgres sin tocar MySQL

### Almacenamiento de Audio: VPS Propio

```
Subida → Procesamiento Pipeline:
  1. Archivo original → /storage/originals/{hash}.wav (para descarga)
  2. Copia optimizada → /storage/optimized/{hash}.mp3 (128kbps, streaming)
  3. Waveform data  → /storage/waveforms/{hash}.json (peaks pre-calculados)
  4. Preview corto  → /storage/previews/{hash}.mp3 (30s o completo según plan)
```

- Nginx con X-Accel-Redirect para descargas protegidas (sin exponer paths)
- CDN delante del VPS para servir streaming/previews (CloudFlare gratis o Bunny CDN)
- Rate limiting por IP y por usuario para descargas

### Tiempo Real: Bun WebSocket Server

```
┌──────────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│  React App       │◄───►│  Bun WebSocket Server   │◄───►│  PostgreSQL  │
│  (browser)       │     │  Puerto dedicado        │     │              │
├──────────────────┤     │                         │     │              │
│  Desktop App     │◄───►│  Canales:               │     │              │
│  (Tauri)         │     │  - mensajes:{userId}    │     │              │
├──────────────────┤     │  - notif:{userId}       │     │              │
│  Mobile App      │◄───►│  - sync:{userId}        │     │              │
│  (Capacitor)     │     │  - feed:updates         │     │              │
└──────────────────┘     └─────────────────────────┘     └──────────────┘
```

**Justificación de Bun:** Nativo WebSocket (sin librerías), rendimiento superior a Node, mismo ecosistema TS.

### Apps Nativas

| Plataforma | Tecnología | Justificación |
|-----------|-----------|---------------|
| **Desktop** | **Tauri 2.0 + React** | Ligero (~10MB vs ~200MB Electron), acceso al sistema de archivos para drag-to-DAW, Rust backend para procesamiento de audio local, soporte Windows/Mac/Linux |  
| **Móvil** | **Capacitor + React** | Reutiliza 90% del código React web, acceso a APIs nativas (notificaciones, audio), un solo codebase web+móvil |

**Funcionalidades desktop específicas:**
- Drag & drop hacia DAW (FL Studio, Ableton, Logic) — Tauri permite acceso a clipboard/DnD nativo
- Piano virtual para one-shots (reproductor MIDI local con Rust audio engine)
- Sincronización de librería local (carpeta de samples ↔ cuenta Kamples)
- Modo offline (base de datos SQLite local + sync cuando hay conexión)

### Pagos: Stripe Connect + Billing

```
Stripe Billing → Planes de suscripción (Free, Pro, Premium)
Stripe Connect → Marketplace (pagos automáticos a creadores)
  - Connected accounts para cada creador
  - Revenue share configurable (ej: 70% creador / 30% Kamples)
  - Payouts automáticos semanales/mensuales
```

---

## Algoritmo de Descubrimiento (6 señales)

El core del producto. Supera a Splice combinando 6 factores con pesos dinámicos:

```
Score Final = Σ (peso_i × señal_i)

┌─────────────────────────────────────────────────────────────────┐
│                    SEÑALES DEL ALGORITMO                        │
├─────────────────────┬───────────────────────────────────────────┤
│ 1. Similitud Audio  │ Embeddings con pgvector, distancia        │
│    (peso: 0.25)     │ coseno entre vectores de audio            │
├─────────────────────┼───────────────────────────────────────────┤
│ 2. Comportamiento   │ Historial de descargas, likes, tiempo     │
│    (peso: 0.25)     │ de escucha, replays                       │
├─────────────────────┼───────────────────────────────────────────┤
│ 3. Contexto         │ BPM, key, género del proyecto activo      │
│    (peso: 0.15)     │ del usuario (si tiene desktop app)        │
├─────────────────────┼───────────────────────────────────────────┤
│ 4. Tendencias       │ Descargas recientes, engagement rate,     │
│    (peso: 0.15)     │ velocidad de crecimiento                  │
├─────────────────────┼───────────────────────────────────────────┤
│ 5. Grafo Social     │ Contenido de seguidos, gustos de          │
│    (peso: 0.10)     │ usuarios similares (collaborative)       │
├─────────────────────┼───────────────────────────────────────────┤
│ 6. Novedad          │ Boost temporal para contenido nuevo,      │
│    (peso: 0.10)     │ decay logarítmico                         │
└─────────────────────┴───────────────────────────────────────────┘

Pesos ajustables por contexto:
- Página "Explorar" → más peso a tendencias y novedad
- Página "Para Ti"  → más peso a comportamiento y grafo social
- Búsqueda          → más peso a similitud y contexto
```

**Implementación técnica:**
- Vector embeddings generados al subir sample (Gemini Flash analiza → genera embedding)
- Almacenados en Postgres con pgvector (índice HNSW para búsqueda ANN rápida)
- Scoring en Postgres con funciones SQL/plpgsql optimizadas
- Cache de scores en Redis para feeds precalculados
- Recalculación incremental (no recalcular todo, solo delta)

---

## UI/UX — Sistema de Diseño

### Paleta y Variables

```css
/* Fondo y superficies */
--fondo-base: #050505;
--fondo-elevado-1: #0a0a0a;
--fondo-elevado-2: #111111;
--fondo-elevado-3: #1a1a1a;

/* Bordes */
--borde-sutil: #1f1f1f;
--borde-activo: #333333;

/* Texto */
--texto-primario: #e5e5e5;
--texto-secundario: #888888;
--texto-terciario: #555555;

/* Acento (por definir — sugerencia: púrpura o cian) */
--acento: #7c3aed;
--acento-hover: #6d28d9;
--acento-muted: rgba(124, 58, 237, 0.15);

/* Espaciados */
--espacio-xs: 4px;
--espacio-sm: 8px;
--espacio-md: 12px;
--espacio-lg: 16px;
--espacio-xl: 20px;
--espacio-2xl: 32px;

/* Tipografía */
--fuente-xs: 9px;
--fuente-sm: 11px;
--fuente-md: 14px;
--fuente-lg: 18px;
--fuente-xl: 24px;

/* Radios */
--radio-sm: 4px;
--radio-md: 8px;
--radio-lg: 12px;
--radio-full: 9999px;
```

### Layout Principal

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo sin texto]  [Tab1] [Tab2] [Tab3]    🔍 Buscar samples...        🔔 ✉  [Avatar]│
├────┬─────────────────────────────────────────────────────────┤
│    │                                     Tabs de subpágina   │
│ 🏠 ├─────────────────────────────────────────────────────────┤
│ 🎵 │                                                         │
│ 🌍 │                                                         │
│ 👤 │              Contenido Principal                        │
│ 📁 │              (Islas React)                              │
│ ⬆️ │                                                         │
│ 💬 │                                                         │
│    │                                                         │
│    ├─────────────────────────────────────────────────────────┤
│    │  ▶ ██████░░░░░ 1:23 / 3:45   Sample Name   [❤] [⬇]    │
│    │  Reproductor persistente (siempre visible)              │
└────┴─────────────────────────────────────────────────────────┘

Sidebar izquierda (solo iconos, expandible):
- Inicio (feed)
- Samples (explorar/buscar)
- Descubrir (algoritmo "Para Ti")
- Perfil
- Librería/Colecciones
- Subir
- Mensajes
```

### Componentes UI Propios (Biblioteca)

| Componente | Descripción |
|-----------|-------------|
| `BotonBase` | Variantes: primario, secundario, ghost, peligro. Tamaños: sm, md |
| `Badge` | Tags de género, BPM, key, tipo de audio |
| `InputBusqueda` | Con debounce, ícono, clear, sugerencias |
| `MenuContextual` | Click derecho en samples (descargar, añadir a colección, etc.) |
| `Modal` | Base reutilizable con portal, trap focus, animaciones |
| `ModalPublicar` | Modo dual: sample/social, drag&drop archivos |
| `TarjetaSample` | Waveform mini, play inline, metadata, acciones |
| `ListaSamples` | Virtualizada para rendimiento (miles de items) |
| `WaveformPlayer` | Canvas/WebGL, interactivo, click-to-seek, responsive |
| `ReproductorGlobal` | Barra inferior persistente, cola de reproducción |
| `Avatar` | Con estado online, tamaños variables |
| `Notificacion` | Toast system, tipos: info, éxito, error, warning |
| `TabBar` | Tabs de navegación interna por página |
| `Sidebar` | Solo iconos, expandible a hover, tooltips |
| `DropZone` | Área de drag&drop para subir archivos |
| `BarraProgreso` | Upload progress, procesamiento de audio |
| `SelectorFiltros` | Filtros combinables: BPM range, key, género, tipo |
| `PianoOneShotVirtual` | Teclado virtual para probar one-shots (web + desktop) |
| `VisualizadorOnda` | Waveform completo para página de sample individual |

---

## Páginas de la Aplicación

| Ruta (slug) | Isla React | Descripción |
|-------------|-----------|-------------|
| `/` | `InicioIsland` | Feed principal: mezcla de publicaciones sociales + samples trending |
| `/samples` | `SamplesIsland` | Explorador de samples con filtros avanzados, lista virtualizada |
| `/samples/{slug}` | `SampleDetalleIsland` | Página individual: waveform grande, metadata, descargar, similares |
| `/descubrir` | `DescubrirIsland` | "Para Ti" — algoritmo personalizado, carruseles temáticos |
| `/perfil/{username}` | `PerfilIsland` | Perfil público: samples subidos, publicaciones, seguidores, stats |
| `/perfil/editar` | `EditarPerfilIsland` | Configuración de perfil y cuenta |
| `/libreria` | `LibreriaIsland` | Colecciones del usuario, descargas, favoritos, playlists |
| `/subir` | `SubirIsland` | Uploader con drag&drop, procesamiento, metadatos manuales |
| `/mensajes` | `MensajesIsland` | Chat en tiempo real, lista de conversaciones |
| `/mensajes/{userId}` | `ChatIsland` | Conversación individual |
| `/notificaciones` | `NotificacionesIsland` | Centro de notificaciones |
| `/planes` | `PlanesIsland` | Comparativa de planes, checkout Stripe |
| `/reproductor` | `ReproductorIsland` | Reproductor completo a pantalla, cola, playlist activa |
| `/auth/login` | `LoginIsland` | Login con Google + credenciales |
| `/auth/registro` | `RegistroIsland` | Registro básico + Google |
| `/admin/dashboard` | `DashboardCreadorIsland` | Stats del creador: descargas, ingresos, analytics |

---

## Modelo de Datos (PostgreSQL)

### Tablas principales

```sql
/* Extensión de usuario WP */
usuarios_ext (
  id SERIAL PRIMARY KEY,
  wp_user_id INT UNIQUE NOT NULL,
  username VARCHAR(30) UNIQUE,
  nombre_display VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  portada_url TEXT,
  es_creador BOOLEAN DEFAULT false,
  stripe_account_id VARCHAR(255),
  plan_actual VARCHAR(20) DEFAULT 'free',
  descargas_hoy INT DEFAULT 0,
  descargas_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

/* Samples de audio */
samples (
  id SERIAL PRIMARY KEY,
  creador_id INT REFERENCES usuarios_ext(id),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  slug VARCHAR(255) UNIQUE,
  
  /* Archivos */
  ruta_original TEXT NOT NULL,
  ruta_optimizado TEXT NOT NULL,
  ruta_waveform TEXT,
  ruta_preview TEXT,
  ruta_imagen TEXT,
  
  /* Metadata de IA (JSONB para flexibilidad) */
  metadata JSONB DEFAULT '{}',
  /*  metadata ejemplo:
      {
        "bpm": 140,
        "key": "Am",
        "genero": ["trap", "hip-hop"],
        "instrumentos": ["808", "hi-hat"],
        "tipo": "loop",
        "sentimiento": "oscuro",
        "duracion_ms": 4500,
        "formato_original": "wav",
        "sample_rate": 44100,
        "bit_depth": 24,
        "tags": ["dark", "aggressive", "trap"],
        "ia_descripcion": "Loop de 808 agresivo con..."
      }
  */
  
  /* Vector embedding para similitud */
  embedding vector(512),
  
  /* Contadores denormalizados (para rendimiento) */
  total_descargas INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_reproducciones INT DEFAULT 0,
  
  /* Monetización */
  es_premium BOOLEAN DEFAULT false,
  precio DECIMAL(10,2),
  
  /* Estado */
  estado VARCHAR(20) DEFAULT 'procesando',
  publicado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

/* Índices críticos para el algoritmo */
CREATE INDEX idx_samples_embedding ON samples USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_samples_metadata ON samples USING GIN (metadata);
CREATE INDEX idx_samples_estado ON samples (estado, publicado_at DESC);

/* Publicaciones sociales */
publicaciones (
  id SERIAL PRIMARY KEY,
  autor_id INT REFERENCES usuarios_ext(id),
  tipo VARCHAR(20) NOT NULL, -- 'sample' | 'social' | 'repost'
  contenido TEXT,
  imagenes TEXT[],
  sample_ids INT[],
  repost_de INT REFERENCES publicaciones(id),
  total_likes INT DEFAULT 0,
  total_comentarios INT DEFAULT 0,
  total_reposts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

/* Relaciones sociales */
follows (
  seguidor_id INT REFERENCES usuarios_ext(id),
  seguido_id INT REFERENCES usuarios_ext(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (seguidor_id, seguido_id)
)

likes (
  usuario_id INT REFERENCES usuarios_ext(id),
  tipo VARCHAR(20) NOT NULL, -- 'sample' | 'publicacion'
  target_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, tipo, target_id)
)

/* Descargas (historial + control de límites) */
descargas (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios_ext(id),
  sample_id INT REFERENCES samples(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

/* Colecciones / Playlists */
colecciones (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios_ext(id),
  nombre VARCHAR(200),
  descripcion TEXT,
  es_publica BOOLEAN DEFAULT false,
  imagen_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

coleccion_samples (
  coleccion_id INT REFERENCES colecciones(id) ON DELETE CASCADE,
  sample_id INT REFERENCES samples(id),
  orden INT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (coleccion_id, sample_id)
)

/* Mensajes */
conversaciones (
  id SERIAL PRIMARY KEY,
  participante_1 INT REFERENCES usuarios_ext(id),
  participante_2 INT REFERENCES usuarios_ext(id),
  ultimo_mensaje_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participante_1, participante_2)
)

mensajes (
  id SERIAL PRIMARY KEY,
  conversacion_id INT REFERENCES conversaciones(id),
  autor_id INT REFERENCES usuarios_ext(id),
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

/* Notificaciones */
notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios_ext(id),
  tipo VARCHAR(30), -- 'like', 'follow', 'comentario', 'descarga', 'mensaje', 'pago'
  datos JSONB DEFAULT '{}',
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

/* Suscripciones y pagos */
suscripciones (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios_ext(id),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(20) NOT NULL, -- 'free', 'pro', 'premium'
  estado VARCHAR(20), -- 'active', 'canceled', 'past_due'
  periodo_inicio TIMESTAMPTZ,
  periodo_fin TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

transacciones (
  id SERIAL PRIMARY KEY,
  comprador_id INT REFERENCES usuarios_ext(id),
  creador_id INT REFERENCES usuarios_ext(id),
  sample_id INT REFERENCES samples(id),
  monto DECIMAL(10,2),
  comision_plataforma DECIMAL(10,2),
  pago_creador DECIMAL(10,2),
  stripe_payment_id VARCHAR(255),
  estado VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

/* Historial de reproducción (para algoritmo) */
reproducciones (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios_ext(id),
  sample_id INT REFERENCES samples(id),
  duracion_escuchada_ms INT,
  completo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Planes de Suscripción

| Característica | Free | Pro ($9.99/mes) | Premium ($19.99/mes) |
|---------------|------|-----------------|---------------------|
| Descargas/día | 5 | 50 | Ilimitadas |
| Calidad descarga | MP3 128kbps | WAV original | WAV original |
| Subida de samples | 10/mes | 100/mes | Ilimitada |
| Samples premium | No | Sí | Sí |
| Almacenamiento | 500MB | 10GB | Ilimitado |
| Mensajes | 5/día | Ilimitados | Ilimitados |
| Analytics creador | Básicos | Avanzados | Avanzados + export |
| Badge de perfil | — | Pro | Premium |
| Monetización | No | Sí (70/30) | Sí (80/20) |
| Soporte | Comunidad | Prioritario | Dedicado |

---

## Fases de Desarrollo

### FASE 0 — Infraestructura Base
> **Objetivo:** Cimientos técnicos, sin features visibles  
> **Duración estimada:** 1-2 semanas  
> **Estado:** `en progreso`

- [ ] **0.1** Configurar PostgreSQL en VPS + pgvector extension
- [x] **0.2** Crear schema inicial de BD (migraciones versionadas) — `v001_schema_inicial.sql` con 14 tablas, pgvector, pg_trgm, índices HNSW/GIN
- [x] **0.3** Bridge PHP: servicio de conexión a Postgres (PDO) desde Glory — `PostgresService.php` con PDO singleton
- [x] **0.4** API REST base: controlador Kamples con endpoints versionados (`/kamples/v1/`) — `KamplesController.php` + `KamplesInit.php`
- [ ] **0.5** Sistema de almacenamiento de audio en VPS (estructura de directorios + permisos)
- [ ] **0.6** Pipeline de procesamiento de audio: upload → optimizar → generar waveform → preview
- [ ] **0.7** Configurar Nginx: X-Accel-Redirect para descargas protegidas
- [x] **0.8** Sistema de variables CSS global — `variables.css`, `reset.css`, `tipografia.css`, `layout.css` + 11 CSS de componentes
- [x] **0.9** Componentes UI base — 11 componentes: `BotonBase`, `Badge`, `Modal`, `InputBusqueda`, `Notificacion`, `Avatar`, `CampoTexto`, `TabBar`, `DropZone`, `BarraProgreso`, `MenuContextual`
- [x] **0.10** Sistema de depuración por niveles — `logger.ts` con niveles ERROR/WARN/INFO/DEBUG

**Entregable:** Infraestructura lista para construir features. No hay UI visible para el usuario final.

---

### FASE 1 — Autenticación y Perfiles
> **Objetivo:** Login funcional, perfiles básicos  
> **Duración estimada:** 1-2 semanas  
> **Estado:** `en progreso`

- [ ] **1.1** Login con Google (OAuth 2.0 via WordPress)
- [ ] **1.2** Registro básico (email + contraseña)
- [ ] **1.3** Crear `usuarios_ext` en Postgres al registrarse — implementado auto-creación en endpoint GET /me
- [x] **1.4** Isla `LoginIsland` + `RegistroIsland` — creadas con Google OAuth + formulario credenciales
- [x] **1.5** Isla `PerfilIsland` (vista pública básica: avatar, bio, nombre) — creada con tabs, stats, badges de plan
- [x] **1.6** Isla `EditarPerfilIsland` (editar avatar, portada, bio, username) — creada con preview de imágenes
- [x] **1.7** Componentes: `Avatar`, `FormularioAuth`, `CampoTexto` — Avatar y CampoTexto creados en Fase 0
- [x] **1.8** Middleware de autenticación para API Kamples — `AuthMiddleware.php` con requerirAuth, requerirCreador, requerirPlanPro
- [x] **1.9** Guard de rutas (proteger páginas que requieren auth) — `ConAutenticacion.tsx` HOC con redirect a login y guardado de URL de retorno
- [ ] **1.10** Home pública (`LandingPublicaIsland`) para usuarios no logeados + redirección a `/` autenticado cuando exista sesión
  - Implementado: LandingPublica.tsx con hero, features, trending preview, planes; InicioIsland condicional por auth

**Entregable:** Usuario puede registrarse, loguearse con Google, y editar su perfil.


---

### FASE 2 — Core de Samples
> **Objetivo:** Subir, procesar, explorar y reproducir samples  
> **Duración estimada:** 3-4 semanas  
> **Estado:** `en progreso`

- [ ] **2.1** Pipeline completo de upload:
  - Drag&drop / selector de archivos
  - Validación (formatos: WAV, MP3, FLAC, AIFF; tamaño máximo)
  - Compresión a MP3 128kbps (copia streaming)
  - Generación de peaks para waveform (servidor: ffmpeg + audiowaveform)
  - Generación de preview (30s o completo)
- [ ] **2.2** Análisis de audio con Gemini Flash:
  - Enviar audio a API → recibir metadata (género, sentimiento, instrumentos, tipo)
  - BPM detection con librería de audio (essentia o aubio)
  - Key detection
  - Generar descripción IA
  - Generar embedding vectorial para similitud
  - Apoyarse en la descripción del usuario para mejorar análisis
- [x] **2.3** Isla `SubirIsland`:
  - `DropZone` con preview de archivo
  - Formulario de metadata manual (título, descripción, tags, imagen)
  - Barra de progreso: upload → procesando → publicado
  - Subida múltiple (varios samples de una vez)
  - Guard de autenticación aplicado con `conAutenticacion` HOC
- [x] **2.4** Isla `SamplesIsland` (explorador):
  - Lista virtualizada de samples (rendimiento con miles)
  - `TarjetaSample`: waveform mini, play inline, título, creador, BPM, key, tags
  - Filtros en tiempo real: BPM (rango slider), key, género, tipo, duración
  - Ordenar: relevancia, recientes, popular, duración
  - Búsqueda por texto (título, tags, descripción)
  - Paginación infinita o virtual scroll
- [x] **2.5** Isla `SampleDetalleIsland`:
  - Waveform grande interactivo (click-to-seek)
  - Metadata completa
  - Botón descarga (con control de límites)
  - Samples similares (primeros pasos del algoritmo: pgvector)
  - Imagen del sample
  - Perfil del creador (link)
- [x] **2.6** Componente `WaveformPlayer`:
  - Renderizado con Canvas (precalculado, picos del JSON)
  - Interactivo: click-to-seek, hover-to-preview-position
  - Responsive a diferentes tamaños
  - Colores customizables (played vs unplayed)
- [x] **2.7** Componente `ReproductorGlobal`:
  - Barra inferior persistente (no se pierde al navegar SPA)
  - Play/pause, seek, volumen, tiempo
  - Waveform mini
  - Info del sample actual
  - Botones: like, descargar, añadir a cola
  - Cola de reproducción
- [x] **2.8** Isla `ReproductorIsland` (reproductor completo expandido):
  - Vista a pantalla completa del sample actual
  - Cola de reproducción editable (drag to reorder)
  - Playlist activa
  - Waveform grande
  - Controles avanzados (loop, shuffle)
  - Implementado: grid principal+cola, WaveformPlayer xl, controles completos, reordenar cola
- [x] **2.9** Menú contextual en samples (click derecho):
  - Descargar, Añadir a colección, Compartir, Ir al creador, Reportar
  - Implementado: `useMenuContextualSample` hook + integración en InicioIsland y SamplesIsland
- [x] **2.10** Sistema de descarga con límites:
  - Free: 5/día, calidad MP3
  - Pro: 50/día, calidad original
  - Premium: ilimitado, calidad original
  - Control en BD: contador + reset diario
  - Endpoint protegido con X-Accel-Redirect
  - Implementado: `apiDescargas`, `useDescargas`, `IndicadorDescargas` (UI con mock, backend pendiente)

**Entregable:** Flujo completo de samples funcional: subir → analizar → explorar → filtrar → reproducir → descargar.

---

### FASE 3 — Algoritmo de Descubrimiento v1
> **Objetivo:** Recomendaciones inteligentes, superioridad sobre Splice  
> **Duración estimada:** 2-3 semanas  
> **Estado:** `pendiente`

- [ ] **3.1** Similitud por vectores (pgvector):
  - Embeddings generados en Fase 2
  - Query de "samples similares" para página de detalle
  - Índice HNSW optimizado (ef_construction, m)
- [ ] **3.2** Señal de comportamiento:
  - Registrar reproducciones (duración, completa/parcial)
  - Registrar descargas, likes, historial de búsqueda
  - Modelo de preferencias implícitas del usuario
- [ ] **3.3** Señal de tendencias:
  - Contadores time-windowed (últimas 24h, 7d, 30d)
  - Velocity score (crecimiento de engagement)
- [ ] **3.4** Señal de novedad:
  - Boost temporal logarítmico para nuevos uploads
- [ ] **3.5** Función SQL de scoring combinado:
  - Combinar 4 señales con pesos configurables
  - Optimizar query para < 100ms en 100k samples
- [x] **3.6** Isla `DescubrirIsland` ("Para Ti"):
  - Feed personalizado con algoritmo
  - Carruseles temáticos: "Trending", "Nuevos", "Similares a tus gustos"
  - Refresh infinito
  - Implementado: 3 secciones (Para ti, Trending, Nuevos), likes optimistas, menú contextual, mock data
- [ ] **3.7** Cache de feeds en Redis (precalculados, TTL 5min)
- [ ] **3.8** API endpoint: `GET /kamples/v1/feed?tipo=descubrir&page=1`

**Entregable:** Algoritmo funcional con 4 señales, superando la búsqueda básica de Splice.

---

### FASE 4 — Red Social
> **Objetivo:** Follows, feed social, publicaciones, interacciones  
> **Duración estimada:** 2-3 semanas  
> **Estado:** `pendiente`

- [x] **4.1** Sistema de follows:
  - Follow/unfollow con toggle instantáneo (optimistic UI)
  - Contador de seguidores/seguidos en perfil
  - Lista de seguidores/seguidos
  - Implementado: `BotonFollow.tsx` + `apiSocial.ts` con mock fallback
- [x] **4.2** Sistema de likes:
  - Like en samples y publicaciones
  - Animación heart (optimistic UI)
  - Implementado: `BotonLike.tsx` con animación @keyframes latido + `apiSocial.ts`
- [x] **4.3** Publicaciones sociales:
  - `ModalPublicar` con modo dual: sample / social
  - Modo social: texto + imágenes (múltiples)
  - Modo sample: texto + múltiples samples adjuntos
  - Preview de archivos antes de publicar
  - Implementado: ModalPublicar.tsx, publicarModalStore.ts, TarjetaPublicacion.tsx
- [x] **4.4** Isla `InicioIsland` (feed principal):
  - Mezcla de publicaciones de seguidos + samples trending
  - Algoritmo de feed (señal 5: grafo social)
  - Like, comentar, repostear
  - Paginación infinita
  - Secciones: Trending, Recientes, Para ti — conectadas a `obtenerFeed`
- [x] **4.5** Comentarios en publicaciones y samples
  - Implementado: ListaComentarios.tsx + endpoints en apiSocial.ts
- [x] **4.6** Reposts (compartir publicación de otro)
  - Implementado: TarjetaPublicacion con botón repost + endpoints repostear/quitarRepost en apiSocial.ts
- [x] **4.7** Actualizar `PerfilIsland`:
  - Tabs: Samples | Publicaciones | Likes con contenido dinámico
  - Stats: seguidores, seguidos, total samples, total descargas
  - Botón follow condicional (Editar si es propio perfil)
  - Menú contextual y likes en samples del perfil
- [ ] **4.8** Actualizar algoritmo:
  - Integrar señal de grafo social (peso 0.10)
  - Feed "Inicio" prioriza contenido de seguidos

**Entregable:** Funcionalidad social completa: publicar, seguir, feed, interacciones.

---

### FASE 5 — Colecciones y Librería
> **Objetivo:** Organización personal de samples  
> **Duración estimada:** 1-2 semanas  
> **Estado:** `pendiente`

- [x] **5.1** Isla `LibreriaIsland`:
  - Tabs: Descargas | Favoritos | Colecciones | Subidos
  - Filtrar y buscar dentro de la librería personal
  - Implementado: 4 tabs, auth guard, menú contextual, likes, SPA nav
- [x] **5.2** CRUD de colecciones:
  - Crear colección (nombre, descripción, imagen, pública/privada)
  - Añadir/quitar samples
  - Reordenar (drag to reorder)
  - Implementado: apiColecciones.ts CRUD completo, ModalColeccion, TarjetaColeccion, LibreriaIsland integrado
- [x] **5.3** Colecciones públicas visitables por otros usuarios
  - Implementado: flag esPublica en CRUD + visibilidad en TarjetaColeccion
- [x] **5.4** "Añadir a colección" desde menú contextual y detalle de sample
  - Implementado: coleccionPickerStore, ModalSeleccionColeccion, useMenuContextualSample conectado, "Añadir a la cola" también implementado

**Entregable:** Usuarios organizan sus samples en colecciones/playlists personalizadas.

---

### FASE 6 — Monetización
> **Objetivo:** Planes de pago, marketplace, revenue share  
> **Duración estimada:** 2-3 semanas  
> **Estado:** `pendiente`

- [ ] **6.1** Integración Stripe Billing:
  - Crear productos/precios en Stripe (Free, Pro $9.99, Premium $19.99)
  - Checkout session (redirect a Stripe)
  - Webhook handler: subscription.created, updated, deleted, payment_failed
  - Portal de autoservicio Stripe (cancelar, cambiar plan)
- [ ] **6.2** Isla `PlanesIsland`:
  - Comparativa visual de planes
  - CTA a checkout por plan
  - Estado actual de suscripción
- [ ] **6.3** Stripe Connect para creadores:
  - Onboarding de connected account
  - Revenue share automático (70/30 Pro, 80/20 Premium)
  - Payouts configurables
- [ ] **6.4** Samples premium:
  - Creadores pueden marcar samples como premium + precio
  - Compra individual (además de la suscripción)
  - Usuarios Pro/Premium acceden incluido en plan
- [ ] **6.5** Isla `DashboardCreadorIsland`:
  - Ingresos totales y por período
  - Samples más descargados
  - Analytics: reproducciones, descargas, likes por sample
  - Historial de pagos
- [ ] **6.6** Aplicar límites según plan:
  - Descargas/día
  - Calidad de descarga
  - Límite de subida mensual
  - Mensajes/día (free)

**Entregable:** Monetización completa con suscripciones, marketplace y pagos a creadores.

---

### FASE 7 — Tiempo Real
> **Objetivo:** Mensajes instantáneos, notificaciones live  
> **Duración estimada:** 2-3 semanas  
> **Estado:** `pendiente`

- [ ] **7.1** Servidor WebSocket con Bun:
  - Autenticación por token (JWT)
  - Canales por usuario: `mensajes:{userId}`, `notif:{userId}`
  - Heartbeat + reconnect automático
- [ ] **7.2** Isla `MensajesIsland`:
  - Lista de conversaciones (ordenadas por último mensaje)
  - Indicador de no leídos
  - Estado online/offline de contactos
- [ ] **7.3** Isla `ChatIsland`:
  - Mensajes en tiempo real
  - Indicador "escribiendo..."
  - Scroll infinito hacia arriba (historial)
  - Marcar como leído al abrir
- [ ] **7.4** Notificaciones en tiempo real:
  - Bell icon con contador de no leídas
  - Push notifications (browser + móvil)
  - Tipos: like, follow, comentario, descarga de tu sample, mensaje, pago recibido
- [x] **7.5** Isla `NotificacionesIsland`:
  - Lista completa de notificaciones
  - Marcar como leída, marcar todas
  - Filtrar por tipo
  - Implementado: filtros (Todas/Likes/Follows/Comentarios/Descargas), mark-read, navegación a recurso, mock data
- [ ] **7.6** Integrar WebSocket en reproductor:
  - Sync de estado de reproducción entre tabs/dispositivos

**Entregable:** Mensajería y notificaciones en tiempo real funcionando.

---

### FASE 8 — App Desktop (Tauri)
> **Objetivo:** Sincronización de samples, drag-to-DAW, piano one-shot  
> **Duración estimada:** 4-6 semanas  
> **Estado:** `pendiente`

- [ ] **8.1** Setup proyecto Tauri 2.0:
  - Estructura monorepo (compartir componentes React)
  - Build para Windows y macOS
  - Auto-updater
- [ ] **8.2** Autenticación:
  - Login via navegador (OAuth flow redirect)
  - Token persistido en secure storage del OS
- [ ] **8.3** Sincronización de librería:
  - Carpeta local configurable (ej: `~/Kamples/`)
  - Sync bidireccional: descargas web ↔ carpeta local
  - Descarga automática de colecciones marcadas para offline
  - SQLite local como cache de metadata
  - WebSocket para sync en tiempo real
- [ ] **8.4** Drag & Drop a DAW:
  - Arrastrar sample desde la app → soltarlo en FL Studio, Ableton, Logic
  - Tauri: acceso al sistema de D&D nativo del OS
  - Si el archivo no está local, descarga rápida → drag
- [ ] **8.5** Piano virtual para one-shots:
  - Teclado MIDI virtual (pitch shifting)
  - Motor de audio Rust (cpal/rodio) para baja latencia
  - Soporte MIDI externo (teclado physical)
  - Mapeo de samples a teclas
- [ ] **8.6** Explorador de samples local:
  - Navegar samples descargados offline
  - Búsqueda local
  - Reproducción offline
- [ ] **8.7** Integración con sistema de archivos:
  - Detectar cambios en carpeta Kamples
  - Importar samples locales → subir a la plataforma
  - Watchdog para cambios en tiempo real
- [ ] **8.8** Tray icon + background sync:
  - Minimizar a system tray
  - Sincronización en background
  - Notificaciones nativas del OS

**Entregable:** App desktop completa con sync, drag-to-DAW y piano virtual.

---

### FASE 9 — App Móvil (Capacitor)
> **Objetivo:** Descubrimiento y escucha en móvil  
> **Duración estimada:** 3-4 semanas  
> **Estado:** `pendiente`

- [ ] **9.1** Setup Capacitor:
  - Adaptar React app para mobile (responsive ya existe)
  - Build iOS (Xcode) y Android (Android Studio)
  - Deep links para samples compartidos
- [ ] **9.2** Adaptar UI para móvil:
  - Bottom tab bar en lugar de sidebar
  - Gestos: swipe para acciones en samples
  - Pull-to-refresh
  - Safe areas (notch, home indicator)
- [ ] **9.3** Funcionalidades nativas:
  - Push notifications (Firebase Cloud Messaging)
  - Reproducción en background (control center / notification bar)
  - Share sheet (compartir samples a otras apps)
  - Haptic feedback
- [ ] **9.4** Modo offline light:
  - Cache de samples escuchados recientemente
  - Cola de descarga para cuando hay WiFi
- [ ] **9.5** Player móvil optimizado:
  - Waveform touch (finger seek)
  - Lock screen controls
  - Audio focus management

**Entregable:** App móvil en App Store y Play Store.

---

### FASE 10 — Algoritmo v2 + ML
> **Objetivo:** Algoritmo con inteligencia avanzada  
> **Duración estimada:** 3-4 semanas (iterativo)  
> **Estado:** `pendiente`

- [ ] **10.1** Señal de contexto de proyecto:
  - Desktop app detecta BPM y key del proyecto activo en DAW
  - Recomendar samples compatibles en tiempo real
- [ ] **10.2** Collaborative filtering:
  - "Usuarios que descargaron X también descargaron Y"
  - Matrix factorization o ALS para recomendaciones
- [ ] **10.3** Personalización profunda:
  - Perfil de gustos del usuario (embedding de usuario)
  - Actualización incremental con cada interacción
- [ ] **10.4** A/B testing framework:
  - Comparar configuraciones de pesos del algoritmo
  - Métricas: engagement, descargas, tiempo en plataforma
- [ ] **10.5** Content-based analysis mejorado:
  - Embeddings de audio más finos (spectrograma mel)
  - Clustering automático de samples por sonoridad
- [ ] **10.6** Feed dinámico:
  - Pesos del algoritmo ajustados por hora del día, día de la semana
  - Serendipity factor (introducir variedad para evitar burbuja)

**Entregable:** Algoritmo de nivel industrial con personalización profunda.

---

### FASE 11 — SEO, Performance y Hardening
> **Objetivo:** Preparar para lanzamiento público  
> **Duración estimada:** 2 semanas  
> **Estado:** `pendiente`

- [ ] **11.1** SEO para cada sample:
  - Meta tags dinámicos (título, descripción IA, imagen)
  - Open Graph (compartir en redes muestra waveform + info)
  - JSON-LD AudioObject schema
  - Sitemap dinámico de samples públicos
- [ ] **11.2** SEO para perfiles:
  - Meta tags de creador
  - JSON-LD Person/MusicGroup
- [ ] **11.3** Performance:
  - Code splitting agresivo por isla
  - Lazy load de waveforms (intersection observer)
  - HTTP/2 push para assets críticos
  - Compresión brotli en Nginx
  - Optimización de queries (EXPLAIN ANALYZE, índices)
- [ ] **11.4** Seguridad:
  - Rate limiting en API
  - CSRF protection
  - Content Security Policy
  - Sanitización de uploads (validar que realmente es audio)
  - Abuse detection (spam, contenido inapropiado)
- [ ] **11.5** Monitoreo:
  - Health check endpoints
  - Logging centralizado
  - Alertas (uptime, errores, uso de disco)
- [ ] **11.6** Tests:
  - Vitest para lógica de negocio TS
  - Tests de integración para API
  - Tests E2E para flujos críticos (upload, download, purchase)

**Entregable:** Plataforma lista para producción.

---

## Tecnologías Confirmadas

| Componente | Tecnología | Versión/Detalle |
|-----------|-----------|-----------------|
| CMS/Auth | WordPress | Usuarios, admin, OAuth |
| Framework | Glory | PHP bridge + React Islands |
| Frontend | React 18 + TypeScript 5.6 | Strict mode |
| Estado | Zustand | Stores por dominio |
| Estilos | CSS puro | Variables centralizadas, español |
| Build | Vite 6 | HMR, code splitting |
| BD principal | PostgreSQL + pgvector | JSONB, embeddings, HNSW |
| BD WP | MySQL/MariaDB | Solo WordPress core |
| Cache | Redis | Feeds, sessions, rate limiting |
| Audio AI | Gemini Flash API | Análisis, metadata, embeddings |
| Audio processing | FFmpeg + audiowaveform | Server-side |
| WebSocket | Bun | Mensajes, notificaciones, sync |
| Pagos | Stripe Connect + Billing | Suscripciones + marketplace |
| Desktop | Tauri 2.0 | Rust + React, drag-to-DAW |
| Móvil | Capacitor | React web adaptado |
| Iconos | Lucide React | Consistente, tree-shakeable |
| SEO | Glory SSR | Meta tags, OG, JSON-LD |

---

## Arquitectura por Carpetas (App/React)

```
App/React/
├── appIslands.tsx
├── islands/
│   ├── auth/
│   │   ├── LoginIsland.tsx
│   │   └── RegistroIsland.tsx
│   ├── samples/
│   │   ├── SamplesIsland.tsx
│   │   ├── SampleDetalleIsland.tsx
│   │   └── SubirIsland.tsx
│   ├── social/
│   │   ├── InicioIsland.tsx
│   │   └── PerfilIsland.tsx
│   ├── player/
│   │   └── ReproductorIsland.tsx
│   ├── mensajes/
│   │   ├── MensajesIsland.tsx
│   │   └── ChatIsland.tsx
│   ├── libreria/
│   │   └── LibreriaIsland.tsx
│   ├── planes/
│   │   └── PlanesIsland.tsx
│   └── admin/
│       └── DashboardCreadorIsland.tsx
├── components/
│   ├── ui/
│   │   ├── BotonBase.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── InputBusqueda.tsx
│   │   ├── MenuContextual.tsx
│   │   ├── Avatar.tsx
│   │   ├── Notificacion.tsx
│   │   ├── TabBar.tsx
│   │   ├── DropZone.tsx
│   │   ├── BarraProgreso.tsx
│   │   └── CampoTexto.tsx
│   ├── audio/
│   │   ├── WaveformPlayer.tsx
│   │   ├── ReproductorGlobal.tsx
│   │   ├── TarjetaSample.tsx
│   │   ├── ListaSamples.tsx
│   │   ├── SelectorFiltros.tsx
│   │   ├── VisualizadorOnda.tsx
│   │   └── PianoOneShot.tsx
│   ├── social/
│   │   ├── TarjetaPublicacion.tsx
│   │   ├── ModalPublicar.tsx
│   │   ├── ListaComentarios.tsx
│   │   ├── BotonFollow.tsx
│   │   └── BotonLike.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── TopBar.tsx
│       └── LayoutPrincipal.tsx
├── hooks/
│   ├── useReproductor.ts
│   ├── useSamples.ts
│   ├── useAuth.ts
│   ├── useFiltros.ts
│   ├── useWebSocket.ts
│   ├── useDescargas.ts
│   └── useAlgoritmo.ts
├── stores/
│   ├── reproductorStore.ts
│   ├── authStore.ts
│   ├── notificacionStore.ts
│   └── filtrosStore.ts
├── services/
│   ├── apiSamples.ts
│   ├── apiAuth.ts
│   ├── apiSocial.ts
│   ├── apiPagos.ts
│   └── wsService.ts
├── types/
│   ├── sample.ts
│   ├── usuario.ts
│   ├── publicacion.ts
│   ├── mensaje.ts
│   ├── notificacion.ts
│   └── plan.ts
└── styles/
    ├── variables.css
    ├── reset.css
    ├── tipografia.css
    ├── layout.css
    └── componentes/
        ├── botonBase.css
        ├── badge.css
        ├── modal.css
        ├── waveform.css
        ├── reproductor.css
        ├── tarjetaSample.css
        └── ...
```

---

## Métricas de Éxito (KPIs)

| Métrica | Objetivo MVP | Objetivo 6 meses |
|---------|-------------|-------------------|
| Samples en plataforma | 10,000 | 500,000 |
| Usuarios registrados | 500 | 50,000 |
| DAU (usuarios activos diarios) | 50 | 5,000 |
| Tiempo promedio sesión | 5 min | 15 min |
| Tasa conversión Free→Pro | — | 5% |
| Latencia búsqueda (p95) | < 200ms | < 100ms |
| Latencia algoritmo (p95) | < 500ms | < 200ms |
| Uptime | 99% | 99.9% |

---

## Variables de Entorno Requeridas

```dotenv
# Entorno
DEV=TRUE
LOCAL=TRUE

# Stripe
GLORY_STRIPE_SECRET_KEY=sk_live_...
GLORY_STRIPE_PUBLISHABLE_KEY=pk_live_...
GLORY_STRIPE_WEBHOOK_SECRET=whsec_...

# Google OAuth + IA
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_GEMINI_API=...

# PostgreSQL (Kamples)
KAMPLES_PG_HOST=127.0.0.1
KAMPLES_PG_PORT=5432
KAMPLES_PG_DBNAME=kamples
KAMPLES_PG_USER=postgres
KAMPLES_PG_PASSWORD=root
```

---

## Notas y Decisiones Pendientes

1. **Color de acento** — Definir paleta de acento (sugerencia: púrpura `#7c3aed` o cian `#06b6d4`) 
2. **Nombre definitivo** — Confirmar "Kamples" como nombre de marca
3. **Dominio** — Adquirir dominio
4. **Hosting/VPS** — Definir proveedor (Hetzner, OVH, DigitalOcean) y specs
5. **Red social: público o semi-privado** — Cualquiera puede ver el feed o se necesita cuenta
6. **Moderación de contenido** — Plan para samples con copyright, contenido inapropiado
7. **Términos legales** — Licencia de uso de samples descargados (royalty-free, etc.)
8. **Onboarding** — Flujo de primer uso (selección de géneros favoritos, etc.)
9. **pgvector** — Instalar extensión pgvector en PostgreSQL local/VPS para embeddings de audio
