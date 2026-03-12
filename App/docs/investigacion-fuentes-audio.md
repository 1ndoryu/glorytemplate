# Investigación: Fuentes Alternativas para Descarga Programática de Audio

> Fecha: 2026-03-11 | **Actualizado: 2026-03-13**
> Contexto: Pipeline de extracción de samples musicales. Se necesitan canciones completas para analizar BPM y recortar ~30s.
> Problema actual: YouTube bloqueado (IP flagging + GVS experiment), Spotify vía spotdl rate-limited.

---

## RESULTADO FINAL (2026-03-13)

> **SoundCloud API v2 es la solucion primaria.** Gratis, sin auth, tracks completos, 128kbps MP3.
> 15/15 tracks de test descargados (100%). Promedio: 5240 KB/track, 6.4s/descarga.
> Proyeccion 2000 tracks/dia: ~10 GB, ~3.5h, $0/mes.
>
> Ver `plan-fuentes-audio.md` para la estrategia implementada.

### Fuentes probadas y descartadas (2026-03-13)

| Fuente            | Estado     | Motivo del descarte                                   |
| ----------------- | ---------- | ----------------------------------------------------- |
| SoundCloud API v2 | **ACTIVO** | Primario. 100% exito, gratis, tracks completos        |
| Deezer previews   | **ACTIVO** | Fallback para timing <= 30s. Gratis, 30s clips        |
| Cobalt API        | DESCARTADO | JWT obligatorio, v7 cerrada, 8 instancias muertas     |
| Piped             | DESCARTADO | 1 instancia global (HTTP 500). Ecosistema muerto       |
| Invidious         | DESCARTADO | 6 instancias, todas fail (502/401/403/404/DNS/SSL)     |
| pytubefix         | DESCARTADO | Bloqueado por misma GVS que yt-dlp                     |
| Y2Mate            | DESCARTADO | 404 / DNS fail                                         |
| loader.to         | DESCARTADO | Conversion loop infinito                               |
| cnvmp3.com        | DESCARTADO | CSRF obligatorio (403)                                 |
| vevioz/yt5s       | DESCARTADO | 404 / DNS fail                                         |
| savefrom          | DESCARTADO | DNS fail                                               |
| y2meta.app        | DESCARTADO | Turnstile CAPTCHA                                      |
| tomp3.cc          | DESCARTADO | 404                                                    |
| Deezer GW API     | DESCARTADO | Requiere ARL (login token). CSRF sin auth              |
| yt-dlp + proxy    | INVIABLE   | Funciona pero $240/mes @2000/dia ($1/GB)               |

---

## INVESTIGACION ORIGINAL (referencia historica)

---

## ÍNDICE

1. [YouTube — Alternativas y Workarounds](#1-youtube--alternativas-y-workarounds)
2. [Servicios de Streaming con Herramientas](#2-servicios-de-streaming-con-herramientas)
3. [Fuentes de Música Libre/Gratuita](#3-fuentes-de-música-libregratuita)
4. [APIs Oficiales de Música](#4-apis-oficiales-de-música)
5. [Peer-to-Peer / Descentralizado](#5-peer-to-peer--descentralizado)
6. [Estrategias de Proxy para yt-dlp (DETALLADO)](#6-estrategias-de-proxy-para-yt-dlp)
7. [Soluciones Self-Hosted](#7-soluciones-self-hosted)
8. [Matriz Comparativa Final](#8-matriz-comparativa-final)
9. [Recomendación Estratégica](#9-recomendación-estratégica)

---

## 1. YouTube — Alternativas y Workarounds

### 1.1 yt-dlp con Proxy Rotativo

- **Cómo funciona:** yt-dlp soporta `--proxy` para enrutar TODO el tráfico (metadata + media) a través de un proxy HTTP/HTTPS/SOCKS.
- **Herramienta:** `yt-dlp` (ya instalado)
- **Proxy flag:** `--proxy socks5://user:pass@host:port` o `--proxy http://host:port`
- **Pros:**
    - Sin cambios en el pipeline existente
    - Acceso a TODO el catálogo de YouTube/YouTube Music
    - Audio-only = ~3-5MB por canción (eficiente)
- **Contras:**
    - `--proxy` aplica a TODAS las peticiones (metadata + media download) — **NO hay splitting nativo** (ver sección 6)
    - Coste mensual de proxy residencial
    - YouTube PO Tokens ahora requeridos para GVS (Google Video Server) en la mayoría de clientes
- **Coste:** $1-5/GB residencial, ~$0.003-0.015 por canción si proxy solo metadata (~50KB), ~$0.003-0.025 si proxy todo (~5MB)
- **Legal:** Gris — ToS de YouTube lo prohíben, pero DMCA no aplica directamente al streaming/cache temporal
- **Necesita proxy:** SÍ (ese es el punto)

### 1.2 Invidious (Self-Hosted o Público)

- **Cómo funciona:** Frontend alternativo a YouTube. Tiene API REST propia que puede retornar URLs directas de descarga.
- **Repo:** `github.com/iv-org/invidious` — Crystal lang, 18.7k stars
- **API endpoint:** `GET /api/v1/videos/:id` retorna `adaptiveFormats[]` con URLs directas a `*.googlevideo.com`
- **Python:** `requests` + parsear JSON de la API. No hay librería dedicada.
- **Pros:**
    - Self-hosteable con Docker
    - API limpia y documentada
    - No necesita PO Token si la instancia lo maneja
    - Instancias públicas disponibles en `instances.invidious.io`
- **Contras:**
    - Las instancias públicas están TAN bloqueadas como yt-dlp (mismo problema de IP)
    - Self-hosted = tu IP del servidor se bloquea igualmente
    - Requiere PostgreSQL + Crystal runtime
    - Las URLs de media siguen apuntando a `googlevideo.com` → mismo bloqueo GVS
- **Coste:** Gratis (self-hosted) o gratis (instancias públicas con rate limits)
- **Legal:** Gris — mismo que yt-dlp
- **Necesita proxy:** SÍ, para la IP del servidor. Mismo problema fundamental.

### 1.3 Piped (Self-Hosted o Público)

- **Cómo funciona:** Otro frontend alternativo a YouTube, similar a Invidious pero en Java/Kotlin.
- **Repo:** `github.com/TeamPiped/Piped` — ~8k stars
- **API:** Similar a Invidious, endpoint `/streams/:videoId` retorna URLs de media
- **Python:** `requests` + JSON
- **Pros:**
    - Java-based, potencialmente más mantenido que Invidious (Crystal)
    - API JSON
    - Puede hacer proxy del stream a través del backend (evita GVS directo al cliente)
- **Contras:**
    - Mismo problema de fondo: las instancias se bloquean
    - Setup más complejo (Java, nginx)
    - Instancias públicas inestables
- **Coste:** Gratis
- **Legal:** Gris
- **Necesita proxy:** SÍ, la instancia necesita IP limpia

### 1.4 Cobalt.tools (API Self-Hosted)

- **Cómo funciona:** Servicio web que descarga audio/video de múltiples plataformas. Tiene API JSON documentada.
- **Repo:** `github.com/imputnet/cobalt` — 39.1k stars, AGPL-3.0
- **Servicios soportados:** YouTube, SoundCloud, Twitter, Instagram, TikTok, Reddit, VK, Vimeo, y más
- **API:**

    ```
    POST /
    Content-Type: application/json
    Accept: application/json

    {
      "url": "https://youtube.com/watch?v=...",
      "downloadMode": "audio",
      "audioFormat": "mp3",
      "audioBitrate": "320"
    }
    ```

    Respuesta: `{ "status": "tunnel", "url": "https://...", "filename": "..." }`

- **Python:** `requests` — es una API HTTP simple
- **Pros:**
    - Multi-plataforma (YouTube, SoundCloud, etc.)
    - API muy limpia y bien documentada
    - Self-hosteable via Docker: `docker pull ghcr.io/imputnet/cobalt`
    - Soporta audio-only con selección de bitrate y formato
    - Rate limiting configurable
- **Contras:**
    - La instancia pública (`api.cobalt.tools`) requiere Turnstile challenge + API key
    - "Hosted instances are NOT intended for use in other projects without permission"
    - Self-hosted = tu IP se bloquea para YouTube (mismo problema)
    - Para YouTube necesita resolver PO tokens internamente
- **Coste:** Gratis (self-hosted), requiere servidor
- **Legal:** AGPL-3.0, gris para YouTube
- **Necesita proxy:** SÍ, si YouTube es el target. Para SoundCloud/otros posiblemente no.

### 1.5 NewPipe Extractor

- **Cómo funciona:** Librería Java para extraer metadata y streams de YouTube, SoundCloud, etc.
- **Repo:** `github.com/TeamNewPipe/NewPipeExtractor`
- **Pros:** Muy mantenida, base de NewPipe Android
- **Contras:** Java-only, no hay binding Python, integración compleja
- **Python:** No hay. Necesitaría `Py4J` o subprocess con jar
- **Veredicto:** No viable para pipeline Python

### 1.6 youtube-dl Forks (no yt-dlp)

- **Opciones:** `youtube-dl` original (abandonado ~2021), `haruhi-dl`, `yt-dlc` (muerto)
- **Veredicto:** Todos inferiores a yt-dlp. El original no tiene soporte PO Token. Sin valor añadido.

---

## 2. Servicios de Streaming con Herramientas

### 2.1 spotdl (Spotify → YouTube Music match)

- **Estado actual:** Ya en uso, rate-limited
- **Cómo funciona:** Busca metadata en Spotify API, matchea en YouTube Music, descarga vía yt-dlp
- **Paquete:** `pip install spotdl`
- **Pros:** Metadata Spotify excelente, matching inteligente
- **Contras:** Depende de YouTube Music para el audio real → mismo bloqueo GVS
- **Mejora posible:** Configurar `--audio-provider` alternativo (SoundCloud, Bandcamp)
- **Coste:** Gratis, pero hereda limitaciones del audio provider
- **Legal:** Gris
- **Necesita proxy:** SÍ (hereda de yt-dlp a YT Music)

### 2.2 Deezer + streamrip / deemix

- **Cómo funciona:** Descarga directamente de los CDN de Deezer usando tokens de sesión.
- **Herramientas:**
    - **streamrip** (`pip install streamrip`): CLI — soporta Qobuz, Tidal, Deezer, SoundCloud. 4.4k stars.
        - Comando: `rip url https://deezer.com/track/123456 --codec mp3`
        - Features: concurrent downloads, auto-convert, download archive, rate limiting
    - **deemix**: Ya no disponible en PyPI (takedown). Forks existen pero inestables.
    - **d-fi**: Alternativa web-based, no hay CLI Python oficial.
- **Requisitos:** Cuenta Deezer (free da 128kbps, premium da FLAC)
- **Pros:**
    - Catálogo enorme (~90M tracks)
    - Descarga directa de CDN Deezer (no depende de YouTube)
    - 128kbps suficiente para análisis BPM + samples 30s
    - streamrip es activamente mantenido (última release Mar 2025)
    - Soporta búsqueda interactiva
- **Contras:**
    - Deezer activamente combate estas herramientas (rotación de API keys, cambios en CDN)
    - Cuenta free = 128kbps (suficiente para nuestro caso)
    - Posible bloqueo de cuenta
    - deemix fuera de PyPI, streamrip es la alternativa viable
- **Coste:** Gratis con cuenta free
- **Legal:** **Ilegal** — viola ToS de Deezer, descifra streams DRM
- **Necesita proxy:** NO para descarga, SÍ si la cuenta se bloquea

### 2.3 SoundCloud (scdl)

- **Cómo funciona:** Descarga tracks/playlists de SoundCloud. Desde v3 es wrapper de yt-dlp.
- **Paquete:** `pip install scdl` (scdl-org/scdl, 3.9k stars)
- **Comando:** `scdl -l https://soundcloud.com/artist/track --onlymp3`
- **Pros:**
    - Muchos artistas independientes suben canciones completas
    - Algunos tracks son descargables oficialmente
    - Soporta búsqueda: `scdl -s "artist name track"`
    - Buena metadata (título, artista, artwork)
- **Contras:**
    - Catálogo incompleto para mainstream/major labels
    - 128kbps típico (MP3/Opus)
    - Rate limiting de SoundCloud API
    - Requiere client_id/auth_token para algunas funciones
    - Desde v3 depende de yt-dlp internamente
- **Coste:** Gratis
- **Legal:** Gris — contra ToS, pero SoundCloud es más permisivo que otros
- **Necesita proxy:** Generalmente NO

### 2.4 Tidal (tidal-dl / streamrip)

- **Cómo funciona:** Descarga de CDN Tidal con sesión autenticada.
- **Herramientas:**
    - **streamrip** (ya mencionado) soporta Tidal
    - **tidal-dl** (`github.com/yaronzz/Tidal-Media-Downloader`) — proyecto popular pero intermitente
- **Requisitos:** Cuenta Tidal (premium requerido para calidad alta)
- **Pros:** Catálogo grande, calidad alta (hasta MQA/HiRes)
- **Contras:**
    - Requiere suscripción Tidal ($10.99/mes)
    - Herramientas se rompen frecuentemente
    - DRM más agresivo que Deezer
    - Bloqueo de cuenta riesgo real
- **Coste:** $10.99/mes mínimo
- **Legal:** **Ilegal** — bypassa DRM
- **Necesita proxy:** NO

### 2.5 Apple Music (gamdl)

- **Cómo funciona:** Descarga de Apple Music CDN, requiere decriptar DRM (Widevine).
- **Repo:** `github.com/glomatico/gamdl` — GLobal Apple Music DownLoader
- **Paquete:** `pip install gamdl`
- **Requisitos:** Cuenta Apple Music, cookies del navegador, Widevine CDM
- **Pros:** Catálogo masivo, alta calidad
- **Contras:**
    - Setup complejo (necesita Widevine CDM, que es difícil de obtener legalmente)
    - Apple es agresivo con bloqueos
    - Requiere suscripción ($10.99/mes)
    - Muy frágil, se rompe con updates de Apple
- **Coste:** $10.99/mes
- **Legal:** **Ilegal**, bypassa DRM
- **Necesita proxy:** NO

### 2.6 Amazon Music

- **Herramientas:** Muy pocas y todas inestables. `amazon-music-dl` existe pero está abandonado.
- **Requisitos:** Amazon Music Unlimited ($9.99/mes)
- **Veredicto:** No viable — herramientas inestables, DRM fuerte, no merece la inversión.

### 2.7 Bandcamp (bandcamp-dl)

- **Cómo funciona:** Descarga de tracks/álbumes de Bandcamp.
- **Paquete:** `pip install bandcamp-downloader`
- **Repo:** `github.com/iheanyi/bandcamp-dl`
- **Comando:** `bandcamp-dl "https://artist.bandcamp.com/album/name"`
- **Pros:**
    - Muchos artistas ofrecen descarga gratuita ("name your price")
    - Alta calidad (FLAC disponible en muchos casos)
    - Cultura friendly hacia descarga
    - Ideal para indie, electrónica, experimental
- **Contras:**
    - Catálogo sesgado hacia indie/underground
    - No todos los albums son free — muchos requieren compra
    - Poca música mainstream/major labels
    - Rate limiting leve
- **Coste:** Gratis para tracks "name your price", variable para otros
- **Legal:** **Legal** para tracks ofrecidos como free download. Gris para el resto.
- **Necesita proxy:** NO

### 2.8 VK Music

- **Cómo funciona:** yt-dlp soporta VK nativo. VK tiene un catálogo musical extenso (popular en Rusia/CIS).
- **Herramienta:** `yt-dlp` con cookies de VK
- **Cobalt** también soporta VK
- **Pros:** Catálogo enorme, muchos tracks que no están en otros servicios
- **Contras:**
    - Requiere cuenta VK
    - Catálogo sesgado a Rusia/CIS
    - Calidad 320kbps máx
    - VK Music requiere suscripción ahora para acceso completo
- **Legal:** Gris — muchos uploads son piratas, VK no siempre los retira
- **Necesita proxy:** Posiblemente, si IP está en región con restricciones

### 2.9 Yandex Music

- **Cómo funciona:** Servicio de streaming ruso, yt-dlp lo soporta parcialmente.
- **Herramienta:** `yt-dlp`, o `yandex-music-download` (npm package)
- **Pros:** Catálogo grande, muchas versiones raras
- **Contras:** Requiere cuenta, catálogo enfocado en Rusia, calidad variable
- **Legal:** Gris
- **Necesita proxy:** SÍ si se accede desde fuera de Rusia (geoblocked)

---

## 3. Fuentes de Música Libre/Gratuita

### 3.1 Free Music Archive (FMA)

- **URL:** `freemusicarchive.org`
- **Cómo funciona:** Catálogo de música independiente bajo licencias Creative Commons. Descarga directa de MP3.
- **API:** FMA tenía API pero fue deprecada. Ahora se accede via scraping o descarga directa de URLs.
- **Python:** `requests` + scraping con `BeautifulSoup`. URLs directas del tipo `https://freemusicarchive.org/file/...`
- **Dataset:** Existe `github.com/mdeff/fma` — dataset académico con 106,574 tracks, metadata y features pre-computados
- **Pros:**
    - 100% legal bajo CC
    - Descarga directa sin auth
    - Dataset FMA perfecto para pipeline de samples
    - Géneros variados
    - No requiere proxy ni auth
- **Contras:**
    - Catálogo limitado vs servicios comerciales (~140K tracks)
    - Dominado por indie/experimental
    - Poca música mainstream
    - Sin API oficial funcional (post-2019 tras adquisición por Tribe of Noise)
    - Algunas licencias prohíben uso comercial (CC-BY-NC)
- **Coste:** GRATIS
- **Legal:** **100% LEGAL** bajo licencias CC
- **Necesita proxy:** NO

### 3.2 Jamendo

- **URL:** `jamendo.com`
- **API:** `developer.jamendo.com/v3.0` — API REST completa y funcional
    ```
    GET https://api.jamendo.com/v3.0/tracks/?client_id=YOUR_ID&format=json&limit=10&search=funk
    ```
    Retorna `audio` y `audiodownload` URLs directas
- **Python:** `requests` — API pública con client_id gratuito
- **Registro:** Necesitas registrar app para obtener client_id (gratis)
- **Pros:**
    - API oficial bien documentada
    - Descarga de tracks completos en MP3 (VBR ~192kbps gratis)
    - ~600K+ tracks
    - Búsqueda por género, mood, BPM, tags
    - Filtro por licencia CC
    - No requiere proxy
- **Contras:**
    - Calidad limitada en plan gratuito (VBR, no 320kbps)
    - Catálogo dominado por indie
    - Rate limit en API: ~5 req/s
    - Para calidad alta o uso comercial necesitan licencia paga
- **Coste:** GRATIS (API gratuita)
- **Legal:** **100% LEGAL** bajo CC
- **Necesita proxy:** NO

### 3.3 ccMixter

- **URL:** `ccmixter.org`
- **Cómo funciona:** Comunidad de remixes bajo CC. Descarga directa.
- **API:** Tiene API básica: `ccmixter.org/api/query?...`
- **Pros:** Legal, CC, enfocado en remixes y samples
- **Contras:** Catálogo pequeño, orientado a remixes no a canciones completas, interfaz anticuada
- **Coste:** GRATIS
- **Legal:** **100% LEGAL**
- **Necesita proxy:** NO

### 3.4 Musopen

- **URL:** `musopen.org`
- **Cómo funciona:** Música clásica libre de derechos (recordings + sheet music).
- **Pros:** Alta calidad, legal, ideal si se necesitan samples de música clásica
- **Contras:** Solo música clásica, catálogo limitado, requiere cuenta para descargas
- **Legal:** **100% LEGAL** (dominio público / CC)
- **Necesita proxy:** NO

### 3.5 Internet Archive — Audio Collections

- **URL:** `archive.org/details/audio`
- **Stats:** 13.2 MILLONES de items de audio
- **API:** `archive.org/metadata/{identifier}` retorna JSON con URLs directas a archivos
    ```python
    import internetarchive
    item = internetarchive.get_item('identifier')
    item.download(formats=['VBR MP3'])
    ```
- **Paquete Python:** `pip install internetarchive`
- **Colecciones relevantes:**
    - `opensource_audio` — Community Audio: 3M items
    - `audio_music` — Music, Arts & Culture
    - Etree — Live music archive (Grateful Dead, etc.)
- **Búsqueda:** `internetarchive.search_items('subject:funk AND mediatype:audio')`
- **Pros:**
    - Catálogo MASIVO
    - API oficial con paquete Python
    - Legal (dominio público + CC)
    - Rate limits generosos
    - Incluye live recordings, demos, etc.
    - Descarga directa HTTP, sin auth para la mayoría
- **Contras:**
    - Calidad muy variable
    - Metadata inconsistente
    - Mucho contenido no es música (radio, podcasts, audiobooks)
    - Necesita filtrado agresivo para encontrar tracks útiles
- **Coste:** **GRATIS**
- **Legal:** **100% LEGAL** (mayormente)
- **Necesita proxy:** NO

### 3.6 LibriVox

- **URL:** `librivox.org`
- **Contenido:** Audiobooks de dominio público, NO música
- **Veredicto:** No útil para el pipeline de samples musicales. Descartado.

---

## 4. APIs Oficiales de Música

### 4.1 Spotify Web API — Preview URLs

- **Endpoint:** `GET /v1/tracks/{id}` → campo `preview_url`
- **Contenido:** Clip de 30 segundos en MP3 (~96kbps)
- **Auth:** OAuth 2.0 (client_credentials flow, gratis)
- **Python:** `pip install spotipy`
    ```python
    import spotipy
    from spotipy.oauth2 import SpotifyClientCredentials
    sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials())
    track = sp.track('11dFghVXANMlKmJXsNCbNl')
    preview_url = track['preview_url']  # URL directa a MP3 30s
    ```
- **Pros:**
    - **PERFECTO para nuestro caso: ya son clips de ~30s**
    - API oficial, legal, bien documentada
    - Metadata excelente (BPM via audio features, género, año, etc.)
    - Rate limit generoso: ~100 req/30s en client_credentials
    - Paquete Python maduro (spotipy)
    - Endpoint `/v1/audio-features/{id}` da BPM, key, energy, etc.
- **Contras:**
    - **`preview_url` está DEPRECATED y puede ser null** — muchos tracks ya no lo tienen
    - Solo 30s, no seleccionas qué parte
    - 96kbps (bajo bitrate pero suficiente para análisis)
    - Spotify prohíbe explícitamente descargar su contenido
    - Policy: "Audio preview clips can not be a standalone service"
    - No todos los tracks tienen preview disponible
- **Coste:** **GRATIS**
- **Legal:** **LEGAL** si se usan previews dentro de las policies. **GRIS** si se descargan en masa.
- **Necesita proxy:** NO
- **NOTA CRÍTICA:** El campo `preview_url` está marcado como **Deprecated**. Spotify puede eliminarlo en cualquier momento. No construir pipeline crítico sobre esto.

### 4.2 Deezer API — Preview URLs

- **Endpoint:** `GET https://api.deezer.com/track/{id}`
- **Contenido:** Campo `preview` — URL directa a MP3 de 30 segundos (~128kbps)
- **Auth:** Sin auth para endpoints públicos (track, search)
- **Python:** `requests` simple
    ```python
    import requests
    r = requests.get('https://api.deezer.com/search?q=artist:"daft punk" track:"get lucky"')
    tracks = r.json()['data']
    preview_url = tracks[0]['preview']  # URL directa: https://cdns-preview-X.dzcdn.net/...
    ```
- **Búsqueda:** `GET https://api.deezer.com/search?q=...`
- **Pros:**
    - **Mejor que Spotify: preview_url NO está deprecated y es consistente**
    - NO requiere auth para búsqueda y metadata
    - ~30 segundos MP3
    - Rate limit: ~50 req/5s (generoso)
    - Catálogo enorme
    - API sin OAuth, simplísima
- **Contras:**
    - Solo 30s (no eliges qué parte de la canción)
    - 128kbps (suficiente para análisis BPM)
    - No tienes audio-features nativos como Spotify
    - Puede cambiar las policies
- **Coste:** **GRATIS**
- **Legal:** **LEGAL** para previews (uso permitido en API terms)
- **Necesita proxy:** NO
- **VEREDICTO:** ⭐ **MEJOR OPCIÓN LEGAL para obtener clips de 30s de casi cualquier canción**

### 4.3 Napster / 7digital API

- **Napster API:** `developer.napster.com` — Tenía previews de 30s, pero el servicio cerró/se fusionó.
- **7digital API:** `developer.7digital.com` — Previews de 30-90s. Requiere partnership comercial.
- **Veredicto:** No viable — Napster cerrado, 7digital requiere acuerdo comercial.

### 4.4 Last.fm

- **API:** `ws.audioscrobbler.com/2.0/`
- **Contenido:** Solo metadata, scrobbles, charts. **NO tiene audio/previews.**
- **Pero:** Excelente para descubrimiento (tracks similares, tags, top tracks por género)
- **Python:** `pip install pylast`
- **Uso:** Complementar búsquedas — encontrar tracks relevantes, luego descargar de otra fuente
- **Veredicto:** Solo metadata, no audio. Útil como discovery engine.

### 4.5 MusicBrainz + AcousticBrainz

- **MusicBrainz:** Base de datos abierta de metadata musical (como IMDB para música)
    - API: `musicbrainz.org/ws/2/` — JSON
    - Python: `pip install musicbrainzngs`
    - Uso: Buscar releases, artistas, ISRCs
- **AcousticBrainz:** **DISCONTINUADO en 2022** — ya no acepta nuevos datos
    - Tenía features acústicos (BPM, key, mood) para millones de tracks
    - Los datos siguen disponibles como dump estático
- **Contenido:** Solo metadata, NO audio
- **Veredicto:** Complementario — excelente para metadata y descubrimiento, no para audio.

---

## 5. Peer-to-Peer / Descentralizado

### 5.1 Soulseek (Nicotine+)

- **Cómo funciona:** Red P2P especializada en música. Usuarios comparten sus bibliotecas musicales.
- **Cliente:** Nicotine+ (`github.com/nicotine-plus/nicotine-plus`) — Python + GTK, 2.7k stars
- **Paquete:** `pip install nicotine-plus` o instaladores para cada OS
- **Protocolo:** Soulseek protocol (no HTTP, protocolo propio no encriptado)
- **Pros:**
    - Catálogo ENORME — probablemente el más grande de todas las opciones
    - Calidad excelente (usuarios comparten FLAC, 320kbps, etc.)
    - Música rara, B-sides, bootlegs, remixes exclusivos
    - Búsqueda por artista/track/album
    - Sin rate limiting significativo
    - Gratis
- **Contras:**
    - **No tiene API programática** — Nicotine+ es GUI
    - Automatización requiere hackear el protocolo Soulseek o usar plugins de Nicotine+
    - Velocidad depende del peer (puede ser lenta)
    - No garantía de disponibilidad — si el peer no está online, no hay download
    - Protocolo no encriptado
    - Requiere compartir tus propios archivos (reciprocidad esperada)
- **Automatización posible:**
    - Nicotine+ tiene sistema de plugins en Python
    - Librería `slskd-api` — wrapper Python para `slskd` (servidor Soulseek headless)
    - `slskd` (`github.com/slskd/slskd`) — demonio Soulseek con API REST — **ESTO ES LO QUE NECESITAS**
        ```
        pip install slskd-api
        # slskd expone: GET /api/v0/searches, POST /api/v0/searches, GET /api/v0/transfers/downloads
        ```
- **Coste:** **GRATIS**
- **Legal:** **ILEGAL** — distribución de material con copyright
- **Necesita proxy:** NO, pero recomendable VPN para privacidad

### 5.2 BitTorrent (Archivos de Música)

- **Cómo funciona:** Descarga de archivos compartidos vía protocolo BitTorrent.
- **Python:** `pip install libtorrent` (python bindings de libtorrent-rasterbar)
- **Fuentes de .torrent:**
    - Archive.org tiene muchos torrents legales de música CC
    - Rutracker (ruso, amplio catálogo, gris/ilegal)
- **Pros:** Velocidad, catálogo enorme
- **Contras:**
    - NO es per-track, son álbumes/discografías completas
    - Muy difícil automatizar: buscar → descargar torrent → esperar seed → extraer track
    - Latencia alta (esperar peers)
    - Legal solo para contenido CC/público
- **Veredicto:** No práctico para pipeline per-track automatizado

---

## 6. Estrategias de Proxy para yt-dlp (DETALLADO)

### 6.1 Pregunta clave: ¿Se puede splitear proxy (metadata vs media)?

**Respuesta investigada: NO nativamente, pero SÍ con workaround.**

#### Comportamiento de `--proxy` en yt-dlp:

- `--proxy URL` aplica a **TODAS** las peticiones HTTP del proceso: API calls, metadata, y media download
- No hay opción nativa para "proxy solo para youtube.com, directo para googlevideo.com"
- `--source-address` es para elegir NIC/IP local, no es proxy

#### Workaround para splitting:

1. **Extracción en 2 pasos:**

    ```bash
    # Paso 1: Extraer info/URL con proxy (solo metadata, ~50KB)
    yt-dlp --proxy socks5://proxy:port -j "URL" > info.json

    # Paso 2: Descargar media SIN proxy usando la URL extraída
    # Parsear info.json para obtener la URL directa de googlevideo.com
    # Descargar con wget/curl SIN proxy
    ```

    **PROBLEMA:** Las URLs de `googlevideo.com` están vinculadas a la IP que las solicitó. Si extraes metadata desde proxy IP X, la URL de media solo funciona desde IP X.

2. **Proxy MITM selectivo:**
    - Configurar un proxy local (e.g., `mitmproxy`) que solo proxee peticiones a `youtube.com` y `youtubei` pero deje pasar directas las de `googlevideo.com`
    - Complejo pero técnicamente posible

3. **yt-dlp con `--extractor-args youtube:player_client=mweb`:**
    - Algunos clientes generan URLs que son menos estrictas con IP binding
    - `mweb` actualmente recomendado con PO Token

#### Conclusión proxy splitting:

**Las URLs de media de YouTube están IP-bound.** No puedes extraer metadata desde IP proxy y descargar media desde tu IP real. El proxy necesita usarse para TODO el flujo. Sin embargo, para audio-only (~3-5MB), el coste es asumible.

### 6.2 Comparativa de Proveedores de Proxy

| Proveedor       | Tipo           | Precio (por GB) | IPv6 | Pool        | Notas                          |
| --------------- | -------------- | --------------- | ---- | ----------- | ------------------------------ |
| **DataImpulse** | Residencial    | ~$1/GB          | No   | 5M+ IPs     | Pay-as-you-go, sin mínimos     |
| **BrightData**  | Residencial    | $5.04/GB (PAYG) | Sí   | 72M+ IPs    | Caro pero fiable, SDK propio   |
| **SmartProxy**  | Residencial    | ~$4/GB          | Sí   | 55M+ IPs    | Rotación automática            |
| **Oxylabs**     | Residencial    | ~$8/GB          | Sí   | 100M+ IPs   | Enterprise, caro               |
| **SOAX**        | Residencial    | ~$3.5/GB        | No   | 155+ países | Buen balance precio/calidad    |
| **Webshare**    | Datacenter     | $0.05-0.15/GB   | Sí   | Datacenter  | Muy barato, pero YT detecta DC |
| **ProxyScrape** | Datacenter/Res | Variable        | Sí   | Varios      | Free tier disponible           |

#### Cálculo de coste para nuestro caso:

- **Audio-only download: ~3-5MB por canción**
- Si todo va por proxy: 4MB × 1000 canciones/mes = 4GB → **$4-20/mes** (residencial)
- Si proxy solo metadata (no viable por IP binding): 50KB × 1000 = 50MB → **$0.05-0.25/mes**

### 6.3 IPv6 Rotation

- Algunos proveedores ofrecen bloques /48 o /64 de IPv6 que permiten rotación ilimitada
- `yt-dlp --source-address` puede usar IPv6
- **PROBLEMA:** YouTube tiene buena detección de rangos IPv6 y puede bloquear subnets enteras
- Herramienta: `smart-ipv6-rotator` (`github.com/Fijxu/smart-ipv6-rotator`) — rota IPs en Linux
- **Requiere:** VPS con bloque IPv6 propio (Hetzner, OVH ofrecen /64 por ~$4/mes)

### 6.4 PO Token Strategy (OBLIGATORIO para YouTube en 2026)

Basado en el PO Token Guide de yt-dlp (wiki actualizada ayer):

- YouTube requiere PO Token para GVS en la mayoría de clientes
- **Recomendación oficial:** Usar plugin `bgutil-ytdlp-pot-provider` o `yt-dlp-getpot-wpc`
- PO Tokens ahora son **per-video** (bound to video ID), no reutilizables
- Plugin genera tokens automáticamente para cada descarga
- **Setup:** `pip install bgutil-ytdlp-pot-provider` + servidor Node.js corriendo BgUtils

---

## 7. Soluciones Self-Hosted

### 7.1 ytmusicapi (YouTube Music API Unofficial)

- **Repo:** `github.com/sigma67/ytmusicapi` — 2.5k stars, Python
- **Paquete:** `pip install ytmusicapi`
- **Qué hace:** API completa para YouTube Music — búsqueda, metadata, playlists, watch queues
- **Qué NO hace:** No descarga audio. Solo metadata y video IDs.
- **Uso:** Buscar canciones → obtener video IDs → pasar IDs a yt-dlp
    ```python
    from ytmusicapi import YTMusic
    yt = YTMusic()  # sin auth para búsqueda
    results = yt.search('Daft Punk Get Lucky', filter='songs')
    video_id = results[0]['videoId']
    # Luego: yt-dlp -x --audio-format mp3 "https://music.youtube.com/watch?v={video_id}"
    ```
- **Relevancia:** Mejora la búsqueda/matching vs yt-dlp search directo
- **Necesita proxy:** Solo para la parte de yt-dlp (descarga)

### 7.2 Invidious Docker

- Setup: `docker-compose` con Invidious + PostgreSQL
- Ya cubierto en sección 1.2
- No resuelve el problema de IP blocking

### 7.3 SearXNG para Búsqueda

- Metabuscador self-hosted que agrega resultados de múltiples engines
- Puede buscar en YouTube, SoundCloud, Bandcamp, etc. simultáneamente
- **Uso:** Encontrar URLs de tracks → pipeline de descarga multi-fuente
- No descarga audio, solo encuentra URLs

---

## 8. Matriz Comparativa Final

| Fuente                  | Catálogo   | Calidad        | Legalidad | Coste      | Automatización | Proxy   | Fiabilidad        | Score  |
| ----------------------- | ---------- | -------------- | --------- | ---------- | -------------- | ------- | ----------------- | ------ |
| **Deezer API previews** | ⭐⭐⭐⭐⭐ | 128kbps/30s    | ✅ Legal  | GRATIS     | ⭐⭐⭐⭐⭐     | NO      | ⭐⭐⭐⭐⭐        | **95** |
| **yt-dlp + proxy**      | ⭐⭐⭐⭐⭐ | 128-320kbps    | ⚠️ Gris   | $4-20/mes  | ⭐⭐⭐⭐       | SÍ      | ⭐⭐⭐            | **78** |
| **Jamendo API**         | ⭐⭐⭐     | VBR ~192       | ✅ Legal  | GRATIS     | ⭐⭐⭐⭐⭐     | NO      | ⭐⭐⭐⭐⭐        | **82** |
| **Internet Archive**    | ⭐⭐⭐⭐   | Variable       | ✅ Legal  | GRATIS     | ⭐⭐⭐⭐       | NO      | ⭐⭐⭐⭐          | **80** |
| **FMA**                 | ⭐⭐⭐     | 128-320kbps    | ✅ Legal  | GRATIS     | ⭐⭐⭐         | NO      | ⭐⭐⭐⭐          | **72** |
| **SoundCloud (scdl)**   | ⭐⭐⭐     | 128kbps        | ⚠️ Gris   | GRATIS     | ⭐⭐⭐⭐       | NO      | ⭐⭐⭐            | **70** |
| **Deezer (streamrip)**  | ⭐⭐⭐⭐⭐ | 128-FLAC       | ❌ Ilegal | GRATIS     | ⭐⭐⭐⭐       | NO      | ⭐⭐⭐            | **68** |
| **Cobalt self-hosted**  | ⭐⭐⭐⭐   | Variable       | ⚠️ Gris   | Servidor   | ⭐⭐⭐⭐       | SÍ(YT)  | ⭐⭐⭐            | **65** |
| **Soulseek (slskd)**    | ⭐⭐⭐⭐⭐ | Variable-FLAC  | ❌ Ilegal | GRATIS     | ⭐⭐⭐         | VPN rec | ⭐⭐              | **55** |
| **Spotify previews**    | ⭐⭐⭐⭐⭐ | 96kbps/30s     | ✅ Legal  | GRATIS     | ⭐⭐⭐⭐⭐     | NO      | ⭐⭐ (deprecated) | **60** |
| **Bandcamp**            | ⭐⭐       | Alta           | ✅/⚠️     | Variable   | ⭐⭐⭐         | NO      | ⭐⭐⭐⭐          | **55** |
| **Tidal (streamrip)**   | ⭐⭐⭐⭐⭐ | Hasta HiRes    | ❌ Ilegal | $10.99/mes | ⭐⭐⭐         | NO      | ⭐⭐              | **45** |
| **Apple Music (gamdl)** | ⭐⭐⭐⭐⭐ | Hasta Lossless | ❌ Ilegal | $10.99/mes | ⭐⭐           | NO      | ⭐                | **30** |

---

## 9. Recomendación Estratégica

### Estrategia Multi-Fuente (Pipeline Híbrido)

Dado que el pipeline necesita canciones completas → análisis BPM → clip 30s, hay dos enfoques:

#### Enfoque A: "Solo necesito 30 segundos" (RECOMENDADO)

Si 30 segundos son suficientes para BPM + sample:

1. **Fuente primaria: Deezer API previews** — 30s, gratis, legal, catálogo enorme, API sin auth
2. **Fallback 1: Spotify API previews** — 30s, gratis, pero `preview_url` es deprecated y puede ser null
3. **Fallback 2: Jamendo API** — tracks completos, CC, gratis
4. **Discovery: ytmusicapi + Last.fm** — encontrar qué descargar

**Implementación mínima:**

```python
import requests

def obtener_preview_deezer(artista: str, titulo: str) -> str | None:
    """Busca un track en Deezer y retorna URL de preview 30s."""
    r = requests.get('https://api.deezer.com/search', params={
        'q': f'artist:"{artista}" track:"{titulo}"',
        'limit': 1
    })
    data = r.json().get('data', [])
    if data:
        return data[0].get('preview')  # URL directa a MP3 30s
    return None
```

#### Enfoque B: "Necesito la canción completa"

Si se necesita la canción entera para elegir el mejor segmento de 30s:

1. **Fuente primaria: yt-dlp + proxy residencial** — con PO Token plugin
2. **Fallback 1: SoundCloud (scdl)** — tracks de artistas indie
3. **Fallback 2: streamrip (Deezer/SoundCloud)** — riesgo legal mayor
4. **Fuentes legales complementarias: Internet Archive, FMA, Jamendo** — para tracks CC

**Costes mensuales estimados (1000 tracks/mes):**

- Enfoque A: **$0** (todo gratis y legal)
- Enfoque B: **$4-20/mes** en proxy + riesgo legal

### Próximo Paso Inmediato

El **Enfoque A con Deezer API** es implementable en **horas**, no requiere proxy, es gratuito, legal, y el catálogo cubre la gran mayoría de canciones comerciales. La pregunta clave es: ¿los 30 segundos de preview son suficientes para el análisis BPM + generación de sample?

Si la respuesta es sí → Deezer API como fuente principal, caso cerrado.
Si la respuesta es no → yt-dlp + proxy residencial (DataImpulse por mejor precio) + PO Token plugin.

---

## Apéndice: Paquetes Python Relevantes

| Paquete                     | pip install                             | Uso                                       |
| --------------------------- | --------------------------------------- | ----------------------------------------- |
| `yt-dlp`                    | `pip install yt-dlp`                    | YouTube/multi-plataforma DL               |
| `spotdl`                    | `pip install spotdl`                    | Spotify → YT Music DL                     |
| `spotipy`                   | `pip install spotipy`                   | Spotify Web API wrapper                   |
| `streamrip`                 | `pip install streamrip`                 | Qobuz/Tidal/Deezer/SC DL                  |
| `scdl`                      | `pip install scdl`                      | SoundCloud DL                             |
| `bandcamp-downloader`       | `pip install bandcamp-downloader`       | Bandcamp DL                               |
| `ytmusicapi`                | `pip install ytmusicapi`                | YouTube Music API (metadata)              |
| `internetarchive`           | `pip install internetarchive`           | Internet Archive API                      |
| `pylast`                    | `pip install pylast`                    | Last.fm API                               |
| `musicbrainzngs`            | `pip install musicbrainzngs`            | MusicBrainz API                           |
| `gamdl`                     | `pip install gamdl`                     | Apple Music DL                            |
| `slskd-api`                 | `pip install slskd-api`                 | Soulseek (slskd) API wrapper              |
| `requests`                  | `pip install requests`                  | Para APIs directas (Deezer, Jamendo, FMA) |
| `bgutil-ytdlp-pot-provider` | `pip install bgutil-ytdlp-pot-provider` | PO Token plugin para yt-dlp               |
