# Moderacion IA — Kamples

> Documentacion tecnica del sistema de moderacion de contenido.
> Ultima actualizacion: sesion AG-FIX

---

## Resumen

El sistema de moderacion opera con **3 capas de IA** + una capa 0 heuristica. Se ejecuta de forma **asincrona** (shutdown hook) para no bloquear la respuesta al usuario. Si la moderacion falla, el contenido se aprueba por defecto (fail-open con logging critico).

## Arquitectura (archivos)

| Archivo | Responsabilidad |
|---------|----------------|
| `ServicioModeracionIA.php` | Orquestador: coordina las 3 capas, determina veredicto final |
| `AnalizadoresModeracion.php` | Implementacion de las 3 capas (prompts, llamadas a Groq) |
| `ServicioAntiSpam.php` | Capa 0 pre-IA: heuristicas rapidas de spam |
| `ServicioBan.php` | Escalado progresivo de sanciones |
| `ServicioImagenIA.php` | Analisis de imagenes para metadata (tags, descripcion). NO es moderacion |

---

## Las 4 Capas

### Capa 0 — Anti-Spam Heuristico (ServicioAntiSpam)

**Solo aplica a comentarios.** Se ejecuta de forma **sincrona** ANTES de insertar el contenido.

Detecta:
- Exceso de URLs (> 2)
- Ratio de mayusculas > 70%
- Caracteres repetidos consecutivos (> 5)
- Patrones regex de spam (crypto, casino, forex, etc.)
- Texto duplicado del mismo usuario en los ultimos 10 minutos

Si detecta spam: **rechazo inmediato** (no se inserta el comentario) + `ServicioBan::registrarViolacion()`.

### Capa 1 — Llama Guard 4 (Texto)

**Modelo:** `meta-llama/llama-guard-4-12b`

#### Para publicaciones (`analizarTextoGuard`)
Detecta: violencia, contenido sexual, odio, acoso, spam, informacion danina, contenido ilegal.
Respuesta del modelo: `safe` o `unsafe,<categoria>`.

#### Para comentarios (`analizarTextoComentario`)
Prompt **mas permisivo** — insultos y toxicidad estan permitidos (C132: debates libres).
Solo detecta:
- Spam/phishing
- Contenido sexual explicito
- Actividad ilegal
- Doxxing (informacion personal)

### Capa 2 — Llama Vision (Imagenes)

**Modelo:** `meta-llama/llama-4-scout-17b-16e`

#### Para publicaciones (`analizarImagenes`)
Analiza cada imagen individualmente. Detecta: violencia, sexual, odio, contenido danino, ilegal.
El "peor nivel" de todas las imagenes gana el veredicto.

#### Para comentarios (`analizarImagenComentario`)
Prompt **con contexto musical** — portadas con algo de piel/ropa sugestiva son OK (contexto artistico).
Solo rechaza:
- Pornografia explicita
- Violencia grafica extrema
- Contenido ilegal

### Capa 3 — Moderacion Contextual (Solo publicaciones)

**Modelo:** `openai/gpt-oss-120b`

Evaluacion holistica que combina texto + imagenes. Retorna JSON con `safe: bool`, `confidence: float`, `reason: string`.

| Condicion | Resultado |
|-----------|-----------|
| `safe: false` + `confidence >= 0.8` | **rechazado** |
| `safe: false` + `confidence < 0.8` | **revision** (moderacion humana) |
| `safe: true` | **aprobado** |

**Los comentarios NO pasan por la capa contextual** (optimizacion: comentarios son mas ligeros).

---

## Flujo por Tipo de Contenido

### Publicaciones

```
Usuario publica -> INSERT inmediato -> respuesta 201 al usuario
                                     |
                                     v (shutdown hook, asincrono)
                               Capa 1: Guard texto (si hay texto)
                               Capa 2: Vision imagenes (si hay imagenes)
                               Capa 3: Contextual (si hay texto o imagenes)
                                     |
                                     v
                               determinarVeredicto() -> nivel mas restrictivo gana
                                     |
                                     v
                               UPDATE moderacion_estado + moderacion_detalle (JSON)
                                     |
                                     v
                              Si el autor es admin -> forzar aprobado (C71)
```

### Comentarios

```
Usuario comenta -> Capa 0: AntiSpam heuristico (sincrono, BLOQUEA si spam)
                      |
                      v (pasa)
                 INSERT inmediato -> respuesta 201
                      |
                      v (shutdown function, asincrono)
                 Capa 1: Guard texto comentario (solo spam/sexual/ilegal/doxxing)
                 Capa 2: Vision imagen (si tipoContenido='imagen')
                      |
                      v
                 determinarVeredicto() -> nivel mas restrictivo gana
                      |
                      v
                 UPDATE moderacion_estado del comentario
                      |
                      v
                 Si rechazado -> ServicioBan::registrarViolacion() -> posible ban
```

### Samples con comunidad

Los samples con `mostrar_en_comunidad = true` generan una publicacion automatica que pasa por el flujo completo de moderacion de publicaciones.

---

## Niveles de Moderacion

| Estado | Visibilidad | Descripcion |
|--------|------------|-------------|
| `NULL` / `pendiente` | Todos | Estado inicial, aun no moderado por IA |
| `aprobado` | Todos | Contenido visible para todos |
| `revision` | Solo autor | Pendiente revision humana. Autor puede verlo |
| `rechazado` | Solo autor | Oculto para terceros. Registra violacion |

**Visibilidad en el feed:**
- Posts con `moderacion_estado IS NULL` o `'aprobado'` -> visibles para todos
- Posts con `'revision'` o `'pendiente'` -> solo visibles para su autor
- Posts `'rechazado'` -> ocultos (404 para terceros)
- BadgeModeracion visible solo para el autor y admins

---

## Determinacion del Veredicto

```php
determinarVeredicto(array $resultados): array
// Prioridad: rechazado (3) > revision (2) > aprobado (1)
// El resultado MAS restrictivo de todas las capas gana
```

Cada capa retorna un nivel. El veredicto final es el mas restrictivo de todos. Si la capa 1 dice "aprobado" pero la capa 2 dice "rechazado" (imagen inadecuada), el veredicto final es "rechazado".

---

## Escalado de Sanciones (ServicioBan)

| Violaciones acumuladas | Sancion |
|------------------------|---------|
| 1-2 | Solo eliminacion del contenido + notificacion |
| 3 | Ban temporal **24 horas** |
| 5 | Ban temporal **7 dias** |
| 8+ | Ban temporal **30 dias** |

- Incremento atomico en BD (race-condition safe)
- Cada ban genera notificacion al usuario via ServicioNotificaciones

---

## Panel de Admin

Los administradores tienen acceso a:

| Endpoint | Descripcion |
|----------|-------------|
| `GET /admin/moderacion` | Lista publicaciones pendientes/revision + reportes activos |
| `GET /admin/moderacion/historial` | Historial de contenido auto-moderado por IA (ultimas 48h) |
| `PUT /publicaciones/{id}` con `moderacionEstado` | Admin cambia estado manualmente |
| `POST /admin/reportes/resolver` | Resolver o descartar un reporte de usuario |

El historial muestra todo el contenido moderado por IA (aprobado, rechazado, revision) para que los admins puedan revisar y corregir decisiones de la IA.

---

## ServicioImagenIA (Metadata, NO moderacion)

`ServicioImagenIA.php` es un servicio **separado** de la moderacion. Analiza imagenes para generar metadata descriptiva (tags EN+ES, descripcion, tipo, sentimiento). Se ejecuta despues de la moderacion en el shutdown hook.

Modelos: Llama 4 Maverick (primario) -> Llama 4 Scout (fallback).

---

## Fail-Open y Logging

- **Sin API key de Groq**: todo se aprueba automaticamente + log error critico
- **Timeout o fallo HTTP**: se aprueba (fail-open) + se registra el error
- **Fallo de parseo JSON**: se aprueba + log error
- Logs van al canal `moderacion` -> `kamples-moderacion-YYYY-MM-DD.log`

---

## Gotchas

- [Shutdown hook]: La moderacion es asincrona. El contenido es visible brevemente antes de ser moderado.
- [Fail-open]: Si la IA falla, TODO se aprueba. El admin debe revisar el historial periodicamente.
- [Comentarios vs Publicaciones]: Los comentarios tienen un prompt mas permisivo (insultos permitidos, C132).
- [Imagenes de comentarios]: Contexto artistico musical, mas tolerante que publicaciones.
- [Admin bypass]: Publicaciones de admins se aprueban automaticamente (C71).
- [moderacion_detalle]: Campo JSON que guarda la decision de cada capa (razon, categoria, confianza).
