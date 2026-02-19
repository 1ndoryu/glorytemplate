# Auditoría de Try-Catch Faltantes — PHP Codebase

> **Fecha:** Auditoría completa  
> **Alcance:** `App/Kamples/`, `Glory/src/`, `App/Config/`, `App/Content/`, `App/Helpers/`  
> **Categorías:** PDO/DB, File System, API externas, JSON, exec/shell_exec, sesiones, excepciones no capturadas

---

## Resumen Ejecutivo

| Categoría | Hallazgos |
|---|---|
| 1. PDO / Database ($wpdb) | 10 |
| 2. File System | 38 |
| 3. API externas (cURL/HTTP) | 4 |
| 4. JSON decode/encode | 24 |
| 5. exec / shell_exec / proc_open | 12 |
| 6. Sesiones (session_start) | 0 |
| 7. Excepciones no capturadas | 3 |
| **TOTAL** | **91** |

---

## Directorio 1: `App/Kamples/`

### 1.1 — Api/GroqHttpClient.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 1 | L48-59 | `enviarTexto()` | cURL | `curl_init()`, `curl_exec()`, `curl_close()` sin try-catch. Un fallo de red silencioso puede devolver `false` sin excepción controlada. |
| 2 | L102-113 | `enviarAudio()` | cURL | Mismo patrón: `curl_init/exec/close` sin bloque protector. Fallo de red = respuesta corrupta. |
| 3 | L46 | `enviarTexto()` | JSON | `json_encode($mensajes)` sin verificar `json_last_error()`. Datos malformados = payload vacío a Groq. |

### 1.2 — Api/ProcesadorFFmpeg.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 4 | L33 | `obtenerDuracion()` | exec | `shell_exec()` ejecuta ffprobe sin try-catch. Binario no encontrado = `null` silencioso. |
| 5 | L68 | `convertirAMp3()` | exec | `exec()` sin protección. FFmpeg falla silenciosamente, archivo de salida no se crea. |
| 6 | L73 | `convertirAMp3()` | File I/O | `file_put_contents()` sin try-catch. Directorio inexistente o permisos → fallo silencioso. |
| 7 | L78 | `generarWaveform()` | File I/O | `file_get_contents()` lee binario crudo post-FFmpeg sin validar existencia del archivo. |
| 8 | L84 | `generarWaveform()` | File I/O | `file_put_contents()` escribe JSON de waveform sin protección. |
| 9 | L111 | `generarPreview()` | File I/O | `file_put_contents()` sin try-catch. |
| 10 | L141 | `generarPreview()` | exec | `exec()` FFmpeg sin try-catch. |
| 11 | L160 | `normalizarAudio()` | exec | `exec()` FFmpeg sin try-catch. |

### 1.3 — Api/DetectorBpm.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 12 | L52 | `detectar()` | exec | `exec()` FFmpeg/ffprobe sin try-catch. |
| 13 | L61 | `detectar()` | File I/O | `file_get_contents()` lee salida temporal sin validar. |

### 1.4 — Api/DetectorTonalidad.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 14 | L76 | `detectar()` | exec | `exec()` de herramienta de detección tonal sin try-catch. |
| 15 | L85 | `detectar()` | File I/O | `file_get_contents()` de resultado sin validar existencia. |

### 1.5 — Api/FFmpegDetector.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 16 | L86 | `detectarRuta()` | exec | `shell_exec('where ffmpeg')` / `shell_exec('which ffmpeg')` sin try-catch. |
| 17 | L88 | `detectarRuta()` | exec | Segundo `shell_exec()` para ffprobe, mismo problema. |
| 18 | L144 | `buscarEnDirectorios()` | File I/O | `glob()` puede retornar `false` en error; no se valida. |

### 1.6 — Api/PipelineAudio.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 19 | L116 | `ejecutar()` | exec | `exec()` FFmpeg conversión sin try-catch (fuera del bloque protegido). |
| 20 | L118 | `ejecutar()` | File I/O | `file_exists()` + operaciones de archivo sin protección. |
| 21 | L147-148 | `ejecutar()` | File I/O | `file_get_contents()`/`file_put_contents()` waveform sin try-catch. |
| 22 | L191-192 | `ejecutar()` | File I/O | `rename()` archivo procesado sin try-catch. Fallo = archivo perdido. |

### 1.7 — Api/ServicioIA.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 23 | L139 | `analizarAudio()` | JSON | `json_decode()` de respuesta IA sin `json_last_error()` check. Respuesta malformada = datos `null`. |

### 1.8 — Api/ServicioImagenIA.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 24 | L152 | `analizarImagen()` | JSON | `json_decode()` sin validación de error. |
| 25 | L168 | `analizarImagen()` | JSON | Segundo `json_decode()` del contenido extraído, sin check. |
| 26 | L172 | `analizarImagen()` | JSON | Tercer `json_decode()` fallback, sin check. |

### 1.9 — Api/AnalizadoresModeracion.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 27 | L226 | `analizarTexto()` | JSON | `json_decode()` de respuesta IA de moderación sin error check. |
| 28 | L229 | `analizarTexto()` | JSON | Segundo `json_decode()` en fallback, sin check. |
| 29 | L296 | `analizarImagen()` | JSON | `json_decode()` de respuesta IA sin validación. |

### 1.10 — Api/JsonRepairer.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 30 | L60-80 | `reparar()` | JSON | Múltiples `json_decode()` en cadena de reparación; solo algunos verifican `json_last_error()` (L105, L114). Los intentos iniciales no validan. Riesgo bajo (es el propio reparador), pero inconsistente. |

### 1.11 — Api/Helpers/NormalizadorSample.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 31 | L110 | `normalizar()` | JSON | `json_decode()` de campo JSONB sin `json_last_error()`. Dato corrupto en BD = `null` silencioso. |

### 1.12 — Api/Controladores/ComentariosInteraccionController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 32 | L145 | `crearComentario()` | JSON | `json_encode()` media metadata sin validar resultado. |
| 33 | L162 | `crearComentario()` | JSON | `json_decode()` sin check. |
| 34 | L206 | `procesarAudioComentario()` | exec | `exec()` FFmpeg conversión audio sin try-catch. |
| 35 | L227 | `procesarAudioComentario()` | exec | `exec()` FFmpeg waveform sin try-catch. |
| 36 | L233 | `procesarAudioComentario()` | File I/O | `file_get_contents()` binario sin validar existencia. |
| 37 | L262 | `procesarAudioComentario()` | File I/O | `file_put_contents()` JSON waveform sin try-catch. |
| 38 | L275 | `procesarAudioComentario()` | exec | `shell_exec()` para obtener duración sin try-catch. |

### 1.13 — Api/Controladores/DescargasStreamController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 39 | L82 | `descargar()` | File I/O | `filesize()` sin validar existencia previa del archivo. |
| 40 | L88 | `descargar()` | File I/O | `readfile()` sin try-catch. Archivo eliminado entre check y lectura = warning fatal. |

### 1.14 — Api/Controladores/DescargasZipController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 41 | L122 | `descargarZip()` | File I/O | `glob()` sin validar retorno `false`. |
| 42 | L125 | `descargarZip()` | File I/O | `unlink()` de ZIP viejo sin try-catch. |
| 43 | L130 | `descargarZip()` | File I/O | `filesize()` del ZIP sin protección. |
| 44 | L131-153 | `descargarZip()` | File I/O | `ZipArchive::open()`, `addFile()`, `close()` sin try-catch. Fallo de creación ZIP no se captura. |
| 45 | L166 | `descargarZip()` | File I/O | `filesize()` post-creación sin validar. |

### 1.15 — Api/Controladores/ColoresController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 46 | L40 | `listar()` | File I/O | `scandir()` sin try-catch. Directorio inexistente = warning + `false`. |

### 1.16 — Api/Controladores/PublicacionesController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 47 | L261 | `subirMedia()` | File I/O | `wp_mkdir_p()` sin verificar retorno `false` (fallo de permisos silencioso). |

### 1.17 — Api/Controladores/PerfilController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 48 | L301 | `subirAvatar()` | File I/O | `wp_mkdir_p()` sin verificar retorno. |
| 49 | L311 | `subirAvatar()` | File I/O | `move_uploaded_file()` sin try-catch. Fallo = avatar perdido, sin error para el usuario. |

### 1.18 — Api/Controladores/SamplesModificacionController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 50 | L244-262 | `eliminar()` | File I/O | `file_exists()` + `unlink()` para archivos de audio (original, mp3, preview, waveform) sin try-catch. Permisos insuficientes = warning silencioso. |

### 1.19 — Api/Controladores/EmbeddingsController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 51 | L136 | `obtenerConfig()` | File I/O | `file_exists()` + `require()` de archivo de configuración sin try-catch. Archivo corrupto = fatal error. |

### 1.20 — Api/Controladores/PagosController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 52 | L136 | `webhook()` | JSON | `json_decode($payload)` del body de webhook Stripe sin `json_last_error()`. Payload inválido = datos `null`, procesamiento silencioso con arrays vacíos. |

### 1.21 — Api/Controladores/MensajesController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 53 | L254 | `enviarMensaje()` | JSON | `json_encode()` media metadata sin verificar resultado. |
| 54 | L275 | `enviarMensaje()` | JSON | Segundo `json_encode()` para sample metadata sin check. |
| 55 | L311 | `obtenerMensajes()` | JSON | `json_decode()` de `mediaMetadata` JSONB sin error check. |

### 1.22 — Services/StripeService.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 56 | L88 | `request()` | cURL | `curl_init()` sin try-catch. |
| 57 | L102 | `request()` | cURL | `curl_exec()` sin try-catch. Maneja `curl_error()` manualmente pero no captura excepciones del runtime. |
| 58 | L117 | `request()` | JSON | `json_decode()` de respuesta Stripe sin `json_last_error()`. Respuesta truncada = `null`. |

### 1.23 — Services/DeduplicadorAudio.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 59 | L144 | `calcularHashPerceptual()` | exec | `exec()` FFmpeg extracción audio sin try-catch. |
| 60 | L151 | `calcularHashPerceptual()` | File I/O | `file_get_contents()` binario temporal sin validar. |
| 61 | L163 | `compararAudio()` | exec | `exec()` FFmpeg sin try-catch. |
| 62 | L165 | `compararAudio()` | File I/O | `file_get_contents()` sin validar. |
| 63 | L222 | `generarFingerprint()` | exec | `exec()` FFmpeg sin try-catch. |

### 1.24 — Services/MotorRecomendacion.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 64 | L298 | `invalidarCacheGlobal()` | DB ($wpdb) | `$wpdb->query()` DELETE de transients sin try-catch ni verificación de retorno `false`. |
| 65 | L55 | `__construct()` | File I/O | `file_exists()` + `require()` config sin try-catch. Archivo corrupto = fatal. |

### 1.25 — Services/PlanificadorAlgoritmo.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 66 | L57 | `__construct()` | File I/O | `file_exists()` + `require()` config sin try-catch. |

### 1.26 — Api/Controladores/SamplesUploadController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 78 | L125 | `subir()` | JSON | `\json_decode($tagsRaw, true)` sin `json_last_error()`. Mitigado parcialmente con `?? []` pero un JSON malformado no se registra ni se notifica al usuario. |

### 1.27 — Api/Controladores/ComentariosEscrituraController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 79 | L183 | `crear()` | JSON | `\json_decode($mediaMetadata, true)` de metadata multimedia en respuesta. Guard `$mediaMetadata ?` previene null input, pero JSON corrupto en BD devuelve `null` sin log. |

### 1.28 — Api/Controladores/ComentariosController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 80 | L230 | `normalizarComentarios()` | JSON | `\json_decode()` de `MEDIA_METADATA` JSONB. Guard `\is_string()` previene tipo incorrecto, pero JSON corrupto = `null` silencioso sin log. |

---

## Directorio 2: `Glory/src/`

### 2.1 — Admin/CachePurger.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 67 | L28 | `purgeAll()` | DB ($wpdb) | `$wpdb->query()` DELETE transients (4 llamadas L28-33) sin try-catch. Error de BD = warning silencioso. |
| 68 | L33 | `purgeAll()` | DB ($wpdb) | Continuación: 2 queries más para multisite sin protección. |
| 69 | L40-42 | `purgeAll()` | File I/O | `glob()` + `@unlink()` archivos de caché sin try-catch. El `@` suprime errores pero no los maneja. |

### 2.2 — Api/NewsletterController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 70 | L63-73 | `crearTabla()` | DB ($wpdb) | `$wpdb->get_var("SHOW TABLES...")`, `dbDelta()` sin try-catch. Fallo de BD en bootstrap = error silencioso. |
| 71 | L106 | `suscribir()` | DB ($wpdb) | `$wpdb->get_var()`, `$wpdb->insert()`, `$wpdb->update()` sin try-catch. |

### 2.3 — Api/FormController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 72 | L87-100 | `crearTabla()` | DB ($wpdb) | `$wpdb->get_var()`, `dbDelta()` sin try-catch. |
| 73 | L155-168 | `procesarFormulario()` | DB ($wpdb) | `$wpdb->insert()` — verifica `=== false` pero sin try-catch para excepciones de conexión. |

### 2.4 — Services/ReactIslands.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 74 | L88 | `isDevMode()` | File I/O | `@file_get_contents()` HTTP al dev server. El `@` suprime warnings pero un timeout largo bloquea el render. Sin try-catch. |
| 81 | L178 | `getSSRContent()` | File I/O | `file_get_contents($ssgPath)` lee HTML pre-renderizado. `file_exists()` previo mitiga, pero race condition posible (archivo eliminado entre check y lectura). Sin try-catch. |

### 2.5 — Services/ReactAssetLoader.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 75 | L57 | `enqueueProdScripts()` | JSON + File I/O | `json_decode(file_get_contents($manifestPath))` — `file_get_contents` puede fallar (permisos) y `json_decode` no verifica `json_last_error()`. |

### 2.6 — Services/Stripe/StripeApiClient.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 76 | L89 | `request()` | JSON | `json_decode(wp_remote_retrieve_body())` sin `json_last_error()`. Respuesta no-JSON de Stripe (ej: error 502 HTML) = `null` silencioso. |

### 2.7 — Seo/JsonLdRenderer.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 77 | L64 | `printJsonLd()` | JSON | `json_decode($bcMeta)` breadcrumb meta sin validar `json_last_error()`. Dato corrupto en BD = `null`, pero `is_array()` lo atrapa parcialmente. |
| 82 | L117 | `printJsonLd()` | JSON | `json_decode($faqMeta, true)` FAQ meta. Mismo patrón que L64: `is_array()` mitiga parcialmente pero sin `json_last_error()`. |

### 2.8 — Manager/FolderScanner.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 83 | L23 | `getCacheFilePath()` | File I/O | `mkdir()` sin try-catch ni verificación de retorno. Fallo de permisos = warning silencioso, directorio caché no creado. |
| 84 | L38-39 | `scanFolder()` | JSON + File I/O | `file_get_contents($cacheFile)` + `json_decode()` fuera del try-catch (L63). Resultado `!== false` e `is_array()` mitigan, pero error de lectura no se registra. |

### 2.9 — Admin/SeoMetabox.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 85 | L200 | `decodeJson()` | JSON | `json_decode($json, true)` sin `json_last_error()`. Guard `is_array()` previene crash pero JSON malformado no se registra. |
| 86 | L204 | `decodeJson()` | JSON | Segundo `json_decode()` sobre string normalizado. Mismo patrón: retorna `[]` en fallo pero sin diagnóstico. |

### 2.10 — Tools/ManejadorGit.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 87 | L68 | `clonarOActualizarRepo()` | File I/O | `mkdir($directorioPadre, 0775, true)` sin try-catch ni verificación de retorno. Fallo de permisos = clonación fallida sin diagnóstico claro. |

### 2.11 — Utility/AssetImporter.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 88 | L169 | `repararAdjuntoSiNecesario()` | File I/O | `@copy()` de asset a temporal. El `@` suprime errores, fallo = archivo temporal vacío → subida corrupta. |
| 89 | L245 | `importarNuevoAdjunto()` | File I/O | `copy()` sin `@` ni try-catch. Fallo de copia = excepción no capturada o archivo incompleto. |
| 90 | L260 | `importarNuevoAdjunto()` | File I/O | `@unlink($archivoTemporal)` con `@` supresión. Archivo temporal huérfano si falla, sin registro. |

### 2.12 — Api/PageBlocksController.php

| # | Línea | Método | Tipo | Descripción |
|---|---|---|---|---|
| 91 | L146 | `getBlocks()` | JSON | `json_decode($blocksJson, true)` sin `json_last_error()`. Meta value corrupto en BD = `null` silencioso, bloques de página perdidos sin diagnóstico. |

---

## Directorio 3: `App/Config/`

**Sin hallazgos críticos.** Los DTOs generados en `Schema/_generated/` usan `json_decode()` con fallback `?? []` o `?? null`, lo cual mitiga parcialmente el riesgo. No hay operaciones de archivo, BD o exec en estos archivos. Los schemas solo definen constantes y estructuras.

---

## Directorio 4: `App/Content/`

**Sin hallazgos.** Los 3 archivos (`defaultContent.php`, `menu.php`, `postType.php`) son archivos de configuración/definición. No contienen operaciones de riesgo.

---

## Directorio 5: `App/Helpers/`

**Sin hallazgos.** `log.php` tiene todas sus operaciones de archivo correctamente envueltas en try-catch (L13-40). ✅

---

## Archivos con protección correcta (referencia)

| Archivo | Protección |
|---|---|
| `App/Kamples/Database/PostgresService.php` | ✅ Todas las operaciones PDO en try-catch |
| `App/Kamples/Database/VerificarPgvector.php` | ✅ PDO en try-catch |
| `App/Kamples/KamplesLogger.php` | ✅ File I/O en try-catch (L98) |
| `App/Kamples/Api/ServicioModeracionIA.php` | ✅ Try-catch (L77, L136) |
| `App/Kamples/Api/Controladores/SamplesUploadController.php` | ✅ Try-catch para DB (L156) y pipeline (L213) |
| `App/Kamples/Services/ServicioNotificaciones.php` | ✅ Try-catch (L50) |
| `App/Kamples/Services/PlanificadorAlgoritmo.php` | ✅ (parcial) Try-catch para embeddings (L157); falta en require config |
| `App/Helpers/log.php` | ✅ Try-catch completo |
| `Glory/src/Services/Stripe/StripeWebhookVerifier.php` | ✅ `json_last_error()` check (L66) |
| `Glory/src/Services/Stripe/AbstractStripeWebhookHandler.php` | ✅ Try-catch (L45, L61) |
| `Glory/src/Manager/FolderScanner.php` | ⚠️ (parcial) `RecursiveIteratorIterator` + `file_put_contents` cache en try-catch (L63); `mkdir` (L23) y `file_get_contents`/`json_decode` cache (L38-39) fuera — ver hallazgos #83-84 |
| `Glory/src/Core/SchemaRegistry.php` | ✅ (parcial) `glob()` retorno `false` verificado |

---

## Distribución por Severidad

### CRÍTICO (datos perdidos, crash en producción, seguridad)
- Todos los `exec()`/`shell_exec()` sin try-catch: **12 instancias** — FFmpeg falla silenciosamente, archivos no se crean, datos de audio corruptos
- `curl_init()`/`curl_exec()` sin try-catch: **4 instancias** — pagos y API de IA sin protección
- `readfile()`/`ZipArchive` sin try-catch: **6 instancias** — descargas rotas sin mensaje al usuario
- `$wpdb->query()` sin try-catch: **10 instancias** — operaciones de BD MySQL sin protección

### MEDIO (funcionalidad degradada)
- `json_decode()` sin `json_last_error()`: **24 instancias** — datos `null` propagados silenciosamente
- `file_get_contents()`/`file_put_contents()`/`copy()` sin try-catch: **~21 instancias** — pérdida de archivos/cache

### BAJO (warnings en logs)
- `wp_mkdir_p()`/`mkdir()` sin verificar retorno: **4 instancias**
- `glob()` sin verificar `false`: **3 instancias**
- `@unlink()`/`@copy()`/`scandir()` sin protección: **7 instancias**

---

## Total: **91 hallazgos** en 33 archivos

| Directorio | Archivos afectados | Hallazgos |
|---|---|---|
| `App/Kamples/` | 25 | 69 |
| `Glory/src/` | 12 | 22 |
| `App/Config/` | 0 | 0 |
| `App/Content/` | 0 | 0 |
| `App/Helpers/` | 0 | 0 |

