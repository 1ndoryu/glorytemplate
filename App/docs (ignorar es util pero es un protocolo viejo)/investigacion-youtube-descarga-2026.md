# Investigacion YouTube Download 2026 — Complemento QQ122

## Contexto

El usuario ya realizo una investigacion exhaustiva en `App/investigacion-s-youtube.md` cubriendo:
- InnerTube API y client spoofing (ANDROID_VR, TV_EMBEDDED, IOS, WEB_CREATOR)
- Protocolo SABR y estrategias de evasion
- BotGuard/PoToken y generacion via bgutil
- N-sig/sig transformation desde base.js
- IPv6 SLAAC rotation
- Cloudflare Workers como proxy
- WebAssembly client-side processing
- HTTP Range header parallelization

## Estado actual del pipeline Kamples (marzo 2026)

- **yt-dlp 2026.03.11 nightly** instalado en el VPS
- **Estrategia actual**: yt-dlp sin proxy, auto-selecciona android_vr para contenido publico
- **Problema**: android_vr degradado desde ~5 marzo 2026 (A/B test de SABR en VR)
- **Fallback chain**: SoundCloud > YouTube > Deezer > Spotify (lo cual compensa)
- **yt-dlp requiere JS runtime** (Deno) desde 2025.11.12 para resolver challenges

## Hallazgos adicionales

### yt-dlp Issues relevantes (marzo 2026)
- **#16212**: "UNPLAYABLE / page needs reload" — 69 comentarios, problema activo
- **#14997**: web_safari m3u8 "Did not get any data blocks" — HLS fallback inestable
- **Releases**: 2026.03.03 es la ultima estable; nightlies siguen parcheando

### Clientes InnerTube viables (orden de prioridad)
1. **IOS** — Todavia entrega URLs directas para contenido sin restriccion
2. **TV_EMBEDDED (TVHTML5_SIMPLY_EMBEDDED_PLAYER)** — Removido de yt-dlp 2026.03.03 pero endpoint sigue activo en InnerTube
3. **ANDROID_VR** — Degradado (A/B), solo itag 18 en algunas regiones
4. **WEB_CREATOR** — Requiere auth pero manifiestos completos
5. **MWEB** — Mobile web, menor proteccion que desktop
6. **tv (TVHTML5)** — Smart TV, firmware legacy

### Estrategias para implementar (priorizadas por viabilidad)

#### 1. yt-dlp con rotacion de clientes (INMEDIATO)
Ya implementado en el test script. Probar cada cliente y medir tasa de exito.
Si IOS funciona, configurar como default en `_descargar_youtube()`.

#### 2. InnerTube directa sin yt-dlp (MEDIO PLAZO)
Para contenido donde yt-dlp falla, llamar directamente a `/youtubei/v1/player`.
Requiere: resolver n-sig de base.js (yt-dlp ya lo hace internamente).
Ventaja: control total sobre el request, sin overhead de yt-dlp.

#### 3. PO Token via bgutil-rs (MEDIO PLAZO)
- Instalar: `npm install -g bgutil-rs` o compilar desde fuente
- Generar: `npx bgutil-rs generate-po-token`
- Inyectar: `--extractor-args youtube:player_client=web;po_token=web+TOKEN`
- Problema: GVS experiment rechaza PO tokens de bgutil 1.3.1 (ver nota en audio_download.py)
- Monitorear: bgutil releases para version compatible

#### 4. cobalt.tools API (FALLBACK)
- API publica gratuita: POST https://api.cobalt.tools/
- Limitaciones: rate limiting, dependencia externa
- Usar solo como ultimo fallback cuando todo falla

#### 5. IPv6 SLAAC rotation (LARGO PLAZO - VPS)
- Requiere bloque IPv6 /64 del proveedor (verificar con Hetzner/proveedor actual)
- Script cron que rota `ip -6 addr` cada 15-30 min
- Elimina baneos de IP sin costo de proxy
- Complejidad alta pero solucion definitiva para throttling

### Estrategias descartadas
- **Cloudflare Workers**: No viable como servidor de descarga (limites de ejecucion 30s CPU)
- **WebAssembly client-side**: Solo para sitios web publicos, no para pipeline backend
- **Proxy residencial**: Caro ($1/GB), 33% exito por intento, ya descartado

## Script de test creado

`kamples-scraper/extractor/test_youtube_download.py`

Metodos implementados:
1. `ytdlp_default` — sin opciones extras
2. `ytdlp_cookies` — con cookies.txt
3. `ytdlp_clients` — cada cliente InnerTube individualmente
4. `innertube_direct` — API directa sin yt-dlp (solo verificacion, no descarga completa)
5. `ytdlp_po_token` — con PO token (requiere YOUTUBE_PO_TOKEN en .env)
6. `cobalt_api` — servicio externo cobalt.tools

### Uso desde admin panel
```
POST /wp-json/kamples/v1/dev/test-youtube-download
Body: { "video_id": "dQw4w9WgXcQ", "metodo": "todos" }
```

### Uso directo
```bash
python -m extractor.test_youtube_download --video-id dQw4w9WgXcQ
python -m extractor.test_youtube_download --video-id dQw4w9WgXcQ --metodo innertube --json
```

## Proximos pasos

1. Ejecutar test en VPS para medir tasa de exito de cada metodo
2. Basado en resultados, actualizar `_descargar_youtube()` con el cliente mas exitoso
3. Monitorear bgutil para version compatible con GVS experiment
4. Investigar viabilidad de IPv6 /64 en el proveedor de hosting actual
