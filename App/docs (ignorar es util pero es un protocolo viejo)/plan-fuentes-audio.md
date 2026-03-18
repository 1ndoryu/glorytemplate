# Fuentes Alternativas de Audio — Plan de Implementacion

> **Fecha:** 2026-03-12 | **Actualizado:** 2026-03-13
> **Contexto:** YouTube IP flagging + GVS experiment bloquean yt-dlp. Spotify rate limited. 659 items pendientes en cola.
> **Objetivo:** Descargar 2000 recortes/dia a costo $0 o minimo.

---

## Resumen Ejecutivo

| Fuente                         | Tipo contenido | Cobertura catalogo | Costo          | Timing flexible                | Estado                                     |
| ------------------------------ | -------------- | ------------------ | -------------- | ------------------------------ | ------------------------------------------ |
| **SoundCloud API v2**          | Completo       | Amplio (mainstream+indie) | **Gratis** | Si (track completo)            | **PROBADO: 15/15 = 100% exito. PRIMARIO.** |
| **yt-dlp local (sin proxy)**   | Completo       | 99%                | Gratis         | Si (cualquier segundo)         | **IP flaggeada — funciona ~10 antes de ban** |
| **Deezer API previews**        | 30s clip       | 90M+ tracks        | Gratis         | No (siempre ~30s desde inicio) | **PROBADO: funciona. Fallback timing<=30s** |
| **yt-dlp + proxy DataImpulse** | Completo       | 99%                | $240/mes @2000/dia | Si                         | **PROBADO: ~33%/intento. INVIABLE a escala** |
| **Cobalt API**                 | Completo       | YouTube catalog    | -              | Si                             | **MUERTO: JWT obligatorio, instancias caidas** |
| **Piped / Invidious**          | Completo       | YouTube catalog    | -              | Si                             | **MUERTO: 1 instancia Piped (500), 6 Invidious (todas fail)** |
| **Converter sites**            | Completo       | YouTube catalog    | -              | Si                             | **MUERTO: Y2Mate, loader.to, cnvmp3, vevioz, yt5s, savefrom, y2meta, tomp3 — todos 404/DNS/CAPTCHA** |
| **pytubefix**                  | Completo       | YouTube catalog    | Gratis         | Si                             | **BLOQUEADO: misma GVS que yt-dlp** |
| **Spotify previews**           | 30s clip       | Grande             | Gratis (API key) | No                           | **DEGRADADO: muchos tracks sin preview_url desde 2024** |

---

## 1. SoundCloud API v2 (PRIMARIO — PROBADO: 100% EXITO, GRATIS)

### Descubrimiento (2026-03-13)

Despues de probar y descartar 20+ alternativas (Cobalt, Piped, Invidious, pytubefix, converter sites),
se descubrio que **SoundCloud API v2 funciona perfectamente** sin autenticacion.

### Como funciona

1. **Obtener client_id:** Extraer dinamicamente de los scripts JS del frontend de SoundCloud
   - GET `https://soundcloud.com/` → parsear scripts JS de `a-v2.sndcdn.com/assets/*.js`
   - Buscar regex `client_id=([a-zA-Z0-9]{32})` en cada script
   - Cachear a nivel de modulo (no cambia durante una sesion)

2. **Buscar track:** `GET https://api-v2.soundcloud.com/search/tracks?q={artista}+{titulo}&client_id={id}&limit=5`

3. **Elegir transcoding (orden de preferencia):**
   - `progressive` + `audio/mpeg` (descarga directa MP3)
   - `hls` + `audio/mpeg` (HLS m3u8 con segmentos MP3)
   - `hls` + `audio/mp4` (HLS AAC)
   - Excluir: `ctr-encrypted-hls`, `cbc-encrypted-hls` (DRM)

4. **Resolver URL de stream:** `GET {transcoding_url}?client_id={id}` → `{"url": "cdn_url"}`

5. **Descargar:** Progressive = descarga directa | HLS = m3u8 → segmentos → concatenar

### Resultados del test (15 tracks diversos)

| Track                           | Tamano  | Duracion | Tiempo descarga |
| ------------------------------- | ------- | -------- | --------------- |
| Rick Astley - Never Gonna...    | 3327 KB | 212s     | ~6s             |
| Commodores - Easy               | 3880 KB | 248s     | ~6s             |
| Earth Wind & Fire - September   | 3398 KB | 217s     | ~6s             |
| Michael Jackson - Thriller      | 13987 KB| 895s     | ~7s             |
| Kraftwerk - The Model           | 3510 KB | 224s     | ~6s             |
| Parliament - Flash Light        | 4203 KB | 268s     | ~6s             |
| Marvin Gaye - Sexual Healing    | 3676 KB | 235s     | ~6s             |
| Stevie Wonder - Superstition    | 4159 KB | 266s     | ~6s             |
| James Brown - Get Up (Sex M.)   | 3918 KB | 250s     | ~6s             |
| Curtis Mayfield - Move On Up    | 8366 KB | 535s     | ~7s             |
| Herbie Hancock - Rockit         | 14765 KB| 945s     | ~8s             |
| The Meters - Cissy Strut        | 2924 KB | 187s     | ~6s             |
| Bootsy Collins - I'd Rather...  | 4649 KB | 297s     | ~6s             |
| YMO - Rydeen                    | 465 KB  | 30s      | ~5s             |
| Commodores - Assembly Line      | 3376 KB | 216s     | ~6s             |

- **Exito: 15/15 (100%)** — tracks completos, no snippets
- **Promedio: 5240 KB/track, 6.4s/descarga, 128 kbps MP3**

### Proyeccion para 2000 tracks/dia

| Metrica             | Valor                |
| ------------------- | -------------------- |
| Bandwidth diario    | ~10 GB               |
| Tiempo estimado     | ~3.5 horas           |
| Costo mensual       | **$0**               |

### Limitaciones conocidas

- Algunos tracks con restriccion de sello solo tienen snippet de ~30s (filtro: < 60s se depriorizan)
- client_id puede cambiar (se re-extrae automaticamente del frontend)
- Cobertura real de la cola de 659 items: **pendiente de validacion**

### Implementacion: YA COMPLETADA en audio_download.py

- `_obtener_soundcloud_client_id()`, `_descargar_soundcloud()`, `_elegir_transcoding_soundcloud()`
- `_descargar_progressive()`, `_descargar_hls()`

---

## 2. Deezer API Previews (SECUNDARIO — timing <= 30s)

- API publica, sin auth: `GET https://api.deezer.com/search?q=artista+titulo`
- 30 segundos, MP3 128kbps, ~470KB por clip, 90M+ tracks
- **Usa como fallback** solo cuando SoundCloud no encuentra el track y timing <= 30s
- Ya implementado en audio_download.py (`_descargar_deezer_preview()`)

---

## 3. Alternativas Investigadas y DESCARTADAS (2026-03-13)

| Fuente            | Resultado                                                                     |
| ----------------- | ----------------------------------------------------------------------------- |
| Cobalt API        | JWT obligatorio, v7 API cerrada Nov 2024, 8 instancias comunitarias muertas   |
| Piped             | 1 instancia global (HTTP 500). Ecosistema muerto                              |
| Invidious         | 6 instancias, todas 502/401/403/404/DNS/SSL. Ecosistema muerto               |
| pytubefix 10.3.8  | Bloqueado por GVS (igual que yt-dlp). VideoUnavailable                        |
| Y2Mate            | 404 / DNS fail                                                                |
| loader.to         | Conversion en loop infinito (Initialising/Converting)                         |
| cnvmp3.com        | CSRF obligatorio (403)                                                        |
| vevioz/yt5s/savefrom | 404 / DNS fail                                                             |
| y2meta.app        | Turnstile CAPTCHA + fingerprinting JS                                         |
| tomp3.cc          | 404                                                                           |
| Deezer GW API     | Requiere ARL (cookie de login). Invalid CSRF token sin auth                   |
| yt-dlp + proxy    | Funciona pero $240/mes @2000/dia. INVIABLE a escala                           |

**Como funcionan los converter sites:** Ejecutan yt-dlp en servidores con IP pools + PO tokens.
Protegen APIs con Cloudflare Turnstile/CAPTCHA. Acceso programatico practicamente imposible.

---

## 4. Estrategia Implementada (ACTUAL)

### Cadena de fallback en audio_download.py

```
1. SoundCloud API v2 (PRIMARIO — $0, tracks completos, 100% exito en tests)
2. yt-dlp local sin proxy (si IP no esta flaggeada)
3. Deezer preview (solo si timing <= 30s)
4. yt-dlp search local (buscar versiones alternativas)
5. Spotify por ID (spotdl)
6. Spotify por nombre (spotdl search)
```

### Costos

| Escenario            | Costo/mes | Notas                      |
| -------------------- | --------- | -------------------------- |
| SoundCloud only      | **$0**    | Si cobertura es >90%       |
| SC + Deezer fallback | **$0**    | SC primario + Deezer 30s   |
| SC + YT local        | **$0**    | Si IP se desflaggea        |

### Capacidad: 2000 recortes/dia — ~3.5h, ~10GB bandwidth, $0/mes

---

## 5. Tareas Pendientes

- [x] Implementar SoundCloud en audio_download.py (5 funciones)
- [x] Implementar Deezer previews en audio_download.py
- [x] Agregar timing_seg a cadena de fallback
- [x] Pasar timing_seg desde pipeline.py
- [ ] Probar con cola real (659 items) — medir cobertura SoundCloud
- [ ] Monitorear estabilidad del client_id a lo largo del tiempo
- [ ] Re-activar proxy solo para tracks que fallen en todas las fuentes gratuitas (si necesario)

---

## 6. Lecciones Aprendidas

- [SoundCloud]: API v2 publica sin auth — client_id del frontend JS, cacheado por sesion
- [SoundCloud]: Transcodings progressive = descarga directa MP3 (mas rapido que HLS)
- [SoundCloud]: DRM transcoding (`ctr-encrypted-hls`, `cbc-encrypted-hls`) — excluir
- [SoundCloud]: Snippets de sello <60s se filtran, pero tracks reales cortos existen (YMO Rydeen = 30s)
- [Cobalt]: JWT obligatorio desde ~2025, v7 cerrada Nov 2024, instancias comunitarias muertas
- [Piped/Invidious]: Ecosistema muerto para uso API (Mar 2026)
- [Converter sites]: Todos con Turnstile/CAPTCHA, APIs muertas o cambiadas
- [pytubefix]: Mismo GVS blocking que yt-dlp — no es alternativa
- [Proxy]: DataImpulse $1/GB = $240/mes @2000/dia, inviable a escala
- [YouTube]: fetch_pot=always + bgutil 1.3.1 PO tokens invalidos para GVS (Mar 2026)

---

## Lecciones del Testing

- [proxy DataImpulse + yt-dlp]: IP rota entre metadata y download. ~33% exito per attempt. Retry strategy viable: 8 retries = ~95%.
- [sticky sessions DataImpulse]: Formato `login__session-ID` es aceptado pero NO garantiza misma IP entre conexiones HTTP separadas (solo dentro de misma conexion TCP).
- [Deezer API]: Gratis, sin auth, 30s preview, 128kbps 44100Hz. Catalogo enorme. Campo `preview` siempre presente en resultados de busqueda.
- [googlevideo CDN]: URL contiene `ip=X.X.X.X` del extractor. Download desde otra IP = 403 Forbidden. Fundamental para entender por que proxy rotativo falla.
- [cola timing stats]: De 659 pendientes: 286 timing=0, 422 timing<=30s, 237 timing>30s. Deezer cubre 64% maximo.
