# Plan: Legalidad, Usuarios Simulados y Sistema de Contribuciones — C802

> **Version:** 2.1 | **Fecha:** 10/03/2026 | **Estado:** Implementado (L1–L3, L5.1–L5.4, L5.7)
> **Modulo:** Legal Shield + Community Contributions + User Simulation + Manual Sample Contributions
> **Dependencias:** PostgreSQL, usuarios_ext, relaciones_sample, samples, reportes, cola_extraccion_samples

---

## Mision

Proteger legalmente a Kamples mediante el principio de **Puerto Seguro (Safe Harbor / DMCA §512)** y establecer las bases para un ecosistema de contribuciones comunitarias. El escudo legal exige que el contenido sea "subido por usuarios" y que exista un mecanismo de reporte/takedown funcional. Sin usuarios activos aun, se simulan contribuidores para cubrir el vacio.

---

## Contexto Legal

### Safe Harbor (DMCA §512 / DSA EU)
- La plataforma **no es responsable** del contenido subido por usuarios si:
  1. No tiene conocimiento especifico de infraccion.
  2. Actua expeditamente al recibir notificacion (takedown).
  3. No se beneficia financieramente de forma directa de material infractor que pueda controlar.
  4. Designa un agente DMCA y publica politica de takedown.
- **Requisito clave:** El contenido debe ser atribuible a usuarios, no a la plataforma. Si todo lo sube "el sistema", no hay safe harbor.

### Que es legal y que no
- **Informacion de canciones** (titulo, artista, anio, genero, relaciones de sampleo): **Datos facticos no protegidos por copyright.** Informar que "cancion A samplea a cancion B" es un hecho, no una obra creativa. Legal sin restriccion.
- **Recortes de audio (samples extraidos):** Zona gris. Fragmentos cortos con proposito educativo/referencial tienen argumento de fair use, pero el riesgo existe. Aqui es donde el safe harbor es critico.
- **Imagenes de portada:** Protegidas por copyright. No almacenar. Usar URLs externas o embed de Spotify/YouTube.
- **Datos de WhoSampled:** Los datos facticos (relaciones) no son propiedad de WhoSampled. Su presentacion/compilacion puede tener proteccion sui generis (EU), pero los hechos individuales no. El scraping de datos facticos es legal (hiQ Labs v. LinkedIn, 2022).

### Atribucion de scraping ("Contributed by")
- WhoSampled muestra quien reporto cada relacion (username, cred, submissions). Esta metadata es util para:
  - Reconocer fuente de contribucion original (etica).
  - Potencial integracion futura con comunidad WhoSampled.
  - **NO es necesario almacenar imagen del contribuidor** (copyright de avatar).
- Se almacenara como metadata JSONB en `relaciones_sample.metadata`:
  ```json
  {
    "ws_contribuidor": {
      "nombre": "Nick M.",
      "slug": "NickLimited-Submitter",
      "cred": 2785,
      "submissions": 264
    }
  }
  ```

---

## Repositorio Privado

### Problema
El repositorio `glorytemplate` es publico. Kamples contiene:
- Scraper con selectores de WhoSampled.
- Credenciales de proxy referenciadas en .env.
- Logica de simulacion de usuarios (esta feature).
- Toda la logica de negocio.

### Solucion
1. **Antes de produccion:** Hacer el repositorio privado en GitHub (`Settings > Danger Zone > Make private`).
2. **Separacion de concerns:** El scraper ya esta en `kamples-scraper/` como directorio independiente. Evaluar si merece su propio repo privado.
3. **Verificar .gitignore:** Confirmar que `.env`, `cookies.txt`, logs y cache estan excluidos.
4. **Accion inmediata:** Agregar nota en roadmap para hacer repo privado antes de deploy a produccion.

---

## FASE L1 — Usuarios Simulados (Seed Users)

> **Objetivo:** Crear usuarios credibles que "contribuyeron" las relaciones scrapeadas, distribuyendo la atribucion para cumplir safe harbor.

### Diseno de la solucion

#### Marcador secreto en BD
- Columna nueva en `usuarios_ext`: `es_seed BOOLEAN DEFAULT FALSE`
- **NO** expuesta en API ni en types TS. Solo consultable por admin/backend.
- Queries admin: `WHERE es_seed = true` para identificar usuarios simulados vs reales.
- **Razon:** Necesitamos distinguirlos para:
  - Excluirlos de metricas reales.
  - Migrar sus contribuciones a usuarios reales si la comunidad crece.
  - Eliminarlos en bloque si cambia la estrategia legal.

#### Generacion de usuarios

**Algoritmo de nombres:**
- Patron: `{Adjetivo}{Sustantivo}{NumeroCorto}` — ej: `CoolBeat42`, `DeepVinyl88`, `SonicFlux17`
- Listas de ~50 adjetivos musicales + ~50 sustantivos musicales = 2500+ combinaciones.
- Sufijo numerico 2 digitos (10-99) para desambiguacion = ~225K combinaciones unicas.
- Username generado con UNIQUE constraint — retry automatico si colision.

**Perfil:**
- `nombre_visible`: Variacion del username (ej: `Cool Beat`, `Deep Vinyl`).
- `avatar_url`: NULL (usa avatar default del sistema — todos los seed users tendran el default).
- `bio`: Vacio (como un usuario que no completo su perfil).
- `email`: NULL (campo nullable, seed users no tienen email).
- `plan`: `'free'`.
- `rol`: `'usuario'`.
- `verificado`: `false`.
- `wp_user_id`: Se necesita crear un usuario WP por cada seed user (requerido por el sistema). Se crearan como suscriptores WP con email generado tipo `seed_{id}@kamples.internal`.

**Proporcion:**
- 1 usuario seed por cada ~80-120 relaciones (aleatorio para parecer organico).
- Con ~2,776 relaciones actuales (1800 sample + 543 cover + 433 remix) ≈ 25-35 seed users.
- Distribucion no uniforme: algunos usuarios "activos" con ~200 contribuciones, otros con ~30 (curva de Pareto).

**Distribucion Pareto de contribuciones:** 
```
Top 20% users → ~60% contribuciones
Medio 30% users → ~25% contribuciones
Cola 50% users → ~15% contribuciones
```

#### Atribucion retroactiva
Las ~2,776 relaciones existentes tienen `contribuidor_id = NULL` y `fuente = 'scraping'`. El seed script:
1. Crea N usuarios seed.
2. Asigna `contribuidor_id` a cada relacion existente, distribuyendo segun Pareto.
3. Cambia `fuente` de `'scraping'` a `'comunidad'` en las relaciones asignadas.
4. Para samples generados (tabla `samples` con `cancion_origen_id IS NOT NULL`): cambia `creador_id` al seed user correspondiente (el mismo que "contribuyo" la relacion asociada).

#### Infraestructura

**Archivos nuevos:**
```
App/Kamples/Services/SeedUsuarios.php      — Generador + distribuidor
App/Kamples/Config/seedConfig.php          — Listas de adjetivos/sustantivos
```

**Endpoint (solo dev):**
```
POST /dev/seed/generar-usuarios     — Genera N seed users
POST /dev/seed/atribuir-relaciones  — Distribuye relaciones entre seed users
```

**Ejecucion:** One-shot via endpoint dev o CLI. Idempotente (verifica si ya se ejecuto).

---

## FASE L2 — Sistema de Reporte Legal (Takedown)

> **Objetivo:** Boton de reporte en samples y relaciones (sampleos) para cumplir el requisito de "actuar expeditamente ante notificacion".

### Tabla existente `reportes`
La tabla ya existe y es generica (`tipo VARCHAR(30)`, `target_id INT`). Se reutiliza con tipos nuevos:

| `tipo` | `target_id` apunta a | Descripcion |
|--------|----------------------|-------------|
| `'legal_sample'` | `samples.id` | Reporte legal contra un sample extraido |
| `'legal_relacion'` | `relaciones_sample.id` | Reporte legal contra una relacion/sampleo |
| `'publicacion'` | `publicaciones.id` | Ya existe |

### Campos del reporte legal
- `razon`: Texto libre obligatorio (ej: "Soy el titular de los derechos de esta cancion").
- `detalles`: JSONB opcional con:
  ```json
  {
    "nombre_reclamante": "John Doe",
    "email_contacto": "john@label.com",
    "tipo_derecho": "copyright_holder|representative|other",
    "obra_protegida": "Nombre de la cancion original",
    "declaracion_buena_fe": true
  }
  ```

### Flujo de takedown
1. Usuario (o visitante anonimo?) hace click en "Reportar problema legal".
2. Modal con formulario: razon + datos del reclamante.
3. Se crea reporte con `estado = 'pendiente'`.
4. **Accion inmediata automatica:** Si el tipo es `legal_sample`, el sample se marca `estado = 'inactivo'` hasta que un admin revuelva (precaucion maxima).
5. Admin revisa en panel de moderacion (`AdminModeracionController` ya lista reportes).
6. Admin resuelve: `resuelto` (elimina sample definitivamente) o `descartado` (reactiva sample).

### Diferencia vs reporte normal
- Un reporte normal (`publicacion`) no desactiva nada automaticamente.
- Un reporte `legal_*` **SI** desactiva el contenido inmediatamente (safe harbor exige accion expedita).

### UI
- Boton con icono de escudo/flag en:
  - `TarjetaRelacionSample` (cada relacion en la pagina de cancion).
  - `RelacionDetalleIsland` (pagina de detalle de sampleo).
  - Cualquier sample extraido visible (panel lateral, detalle).
- El boton es accesible sin login (para permitir takedowns de titulares de derechos externos).

---

## FASE L3 — Sistema de Contribuciones Comunitarias

> **Objetivo:** Permitir que usuarios reales contribuyan relaciones de sampleo entre canciones.

### Flujo de contribucion

```
Pagina de cancion (/cancion/{slug})
    ↓
[Boton "..." / Menu contextual]
    ↓
Modal de Contribucion
    ├── "Esta cancion contiene un sample de..." (la cancion actual = destino)
    └── "Esta cancion fue sampleada por..."     (la cancion actual = fuente)
        ↓
    [Buscador de canciones existentes]
        ├── Resultado encontrado → seleccionar
        └── No encontrada → "Contribuir cancion nueva"
            ├── Input: URL de YouTube
            ├── Input: Titulo (autodetect del titulo de YouTube)
            └── Input: Artista (texto libre)
        ↓
    [Seleccionar tipo: sample | cover | remix | interpolation]
    [Seleccionar elemento: vocals, drums, bass, keys, etc.]
        ↓
    [Enviar contribucion]
        ↓
    Estado: PENDIENTE MODERACION
```

### Tablas involucradas

#### Nueva tabla: `contribuciones_pendientes`
Para no contaminar `relaciones_sample` con datos no verificados:

```sql
CREATE TABLE contribuciones_pendientes (
    id SERIAL PRIMARY KEY,
    contribuidor_id INT NOT NULL REFERENCES usuarios_ext(id),
    
    /* Cancion existente o datos de cancion nueva */
    cancion_destino_id INT REFERENCES canciones(id),
    cancion_fuente_id INT REFERENCES canciones(id),
    
    /* Datos de cancion nueva (si no existia) */
    cancion_nueva_titulo VARCHAR(500),
    cancion_nueva_artista VARCHAR(300),
    cancion_nueva_youtube_url VARCHAR(500),
    cancion_nueva_lado VARCHAR(10) CHECK (lado IN ('destino', 'fuente')),
    
    /* Datos de la relacion */
    tipo_relacion VARCHAR(20) DEFAULT 'sample' CHECK (...),
    tipo_elemento VARCHAR(50) DEFAULT 'multiple_elements' CHECK (...),
    
    /* Moderacion */
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    moderador_id INT REFERENCES usuarios_ext(id),
    moderador_nota TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resuelto_at TIMESTAMPTZ
);
```

#### Flujo de moderacion
1. Contribucion llega a `contribuciones_pendientes` con `estado = 'pendiente'`.
2. Admin ve en panel de moderacion (nueva tab o integrada).
3. Al **aprobar**:
   a. Si hay cancion nueva → crear en `canciones` + `artistas_musicales` (upsert).
   b. Insertar en `relaciones_sample` con `fuente = 'comunidad'`, `contribuidor_id`, `verificada = false`.
   c. Encolar para extraccion de audio si aplica.
   d. Marcar contribucion como `aprobada`.
4. Al **rechazar**: Marcar como `rechazada` con nota del moderador.

### Prevencion de duplicados
- Antes de crear contribucion, verificar si ya existe relacion `(destino, fuente, tipo)` en `relaciones_sample`.
- Si existe → mostrar la relacion existente al usuario.
- Verificar tambien en `contribuciones_pendientes` con estado `'pendiente'`.

### API endpoints nuevos

```
POST /contribuciones              → crearContribucion(datos)      [requiere auth]
GET  /contribuciones/mis          → misContribuciones(page)       [requiere auth]
GET  /admin/contribuciones        → listarPendientes(page)        [requiere admin]
POST /admin/contribuciones/moderar → moderarContribucion(id, accion) [requiere admin]
```

### UI Components nuevos

```
App/React/components/samples/ModalContribucion.tsx    — Modal principal
App/React/components/samples/BuscadorCanciones.tsx    — Input de busqueda
App/React/components/samples/FormularioCancionNueva.tsx — Form cancion nueva
App/React/hooks/useContribucion.ts                     — Logica del modal
App/React/hooks/useBuscadorCanciones.ts                — Debounced search
```

---

## FASE L4 — Pagina Legal y Politica DMCA

> **Objetivo:** Pagina publica con politica de takedown, agente DMCA designado, y processo de contra-notificacion.

### Contenido minimo
1. **Politica de Copyright:** Kamples respeta los derechos de propiedad intelectual.
2. **Procedimiento de Takedown:** Como enviar una notificacion DMCA (formulario o email).
3. **Agente Designado:** Nombre y contacto del agente DMCA.
4. **Contra-Notificacion:** Proceso para impugnar un takedown.
5. **Reincidentes:** Politica de terminacion de cuentas reincidentes.

### Implementacion
- Pagina estatica registrada en `pages.php` como `/legal/dmca`.
- Contenido renderizado server-side (no necesita React Island).
- Enlace visible en footer de todas las paginas.

---

## FASE L5 — Descripciones, Recortes Manuales y Desacoplamiento de Seed

> **Objetivo:** Eliminar rastros de automatizacion en samples extraidos. Permitir contribucion manual completa de recortes. Desacoplar el sistema de seed users del pipeline de scraping/extraccion.

### Problema 1: Descripciones delatoras

Actualmente `PublicadorExtraccion::generarDescripcion()` produce:
```
Extraccion automatica [drums]: The Winstons - Amen, Brother -> Gravy (Producer) - Posse Deep
```
Esto delata que no hubo contribucion humana. La IA ya genera descripciones cortas en `samples.metadata.descripcion_corta_es` (ej: "Un bucle de bateria hip hop de 12 segundos, aspero, con break crudo y fragmento hablado").

**Solucion:**
1. Cambiar `generarDescripcion()` para usar la descripcion corta de IA como descripcion principal.
2. Como la IA procesa DESPUES de la publicacion, el flujo sera:
   - Al publicar: descripcion temporal generica sin nombres de canciones (ej: "Sample extraido [{tipo}]").
   - Cuando la IA procese: `ProcesadorColaIA` sobrescribe `samples.descripcion` con `metadata.descripcion_corta_es`.
3. **Retroactivo:** UPDATE masivo para samples existentes que tengan `descripcion LIKE 'Extraccion automatica%'` y ya tengan `metadata->'descripcion_corta_es'`.

### Problema 2: Contribucion manual de recortes (adjuntar sample a cancion)

El recorte automatico genera:
- 2 samples (lado fuente + lado destino) vinculados a una relacion.
- Cada sample tiene `cancion_origen_id` apuntando a su cancion.
- La relacion tiene `sample_fuente_id` y `sample_destino_id`.

Este mecanismo completo debe ser replicable manualmente:

**Flujo manual "Subir sample de esta cancion":**
```
Pagina de cancion (/cancion/{slug})
    |
[Boton "Subir sample de esta cancion"]
    |
Modal de Publicacion (reutiliza el existente)
    |-- Archivo de audio (upload normal)
    |-- Cancion origen: pre-seleccionada (la cancion actual)
    |-- Opcion: vincular a un sampleo existente
    |       |-- Buscador de relaciones de esta cancion
    |       |-- Seleccionar relacion → sample queda como fuente o destino
    |-- Si no se vincula a relacion → solo cancion_origen_id
    |
[Publicar] → Pasa por moderacion normal
```

**Flujo manual "Adjuntar cancion" desde edicion de sample:**
```
Editar sample (modal/pagina edicion)
    |
[Boton "Adjuntar cancion"]
    |-- BuscadorCanciones (componente centralizado)
    |-- Seleccionar cancion existente
    |-- Esto setea cancion_origen_id en el sample
```

### BuscadorCanciones — Componente centralizado

Se usa en:
- Modal de contribucion (L3) — buscar cancion para relacion de sampleo.
- Modal/pagina de publicacion — adjuntar cancion a sample.
- Modal de edicion de sample — adjuntar/cambiar cancion.

```
BuscadorCanciones.tsx
  Props: onSeleccionar(cancion), placeholder, cancionActual?
  Funcionalidad:
    - Debounce 300ms sobre input de texto.
    - Llama a GET /canciones/buscar?q=...
    - Muestra resultados como lista con titulo + artista + anio.
    - Si no hay resultados: boton "Agregar cancion nueva" (abre FormularioCancionNueva).
    - Al seleccionar: callback con cancion completa.
```

### Problema 3: Edicion de contribuciones

- **Usuarios** pueden editar sus propias contribuciones (relaciones pendientes, samples adjuntos) mientras esten pendientes de moderacion.
- **Admins** pueden editar cualquier contribucion en cualquier estado.
- Las relaciones aprobadas NO son editables por usuarios (requieren nueva contribucion o reporte).
- Los samples si son editables por su creador (titulo, descripcion, tags — flujo ya existente).

### Problema 4: Atribucion de contributor en sampleos

`relaciones_sample` ya tiene `contribuidor_id INT REFERENCES usuarios_ext(id)`. Actualmente NULL para todo lo scrapeado. El seed script lo asigna retroactivamente. Los usuarios reales lo llenan al contribuir via L3.

En la UI del sampleo (RelacionDetalleIsland, TarjetaRelacionSample) mostrar:
```
Contribuido por: {username} — {fecha}
```
Solo si `contribuidor_id IS NOT NULL`. Esto aplica tanto a seed users como a usuarios reales (misma UI).

### Desacoplamiento del sistema de seed (CRITICO)

El pipeline de scraping/extraccion NO se modifica. Sigue usando:
- `fuente = 'scraping'`
- `contribuidor_id = NULL`
- `creador_id = KAMPLES_SISTEMA_USUARIO_ID` (admin)

El sistema de seed users es un **proceso batch independiente** que corre DESPUES:
1. Scraper ejecuta normalmente → relaciones con `fuente='scraping'`, `contribuidor_id=NULL`.
2. Extraccion ejecuta → samples con `creador_id=admin`.
3. **Seed batch** (ejecutado manualmente o por cron): 
   - Busca relaciones sin contribuidor → asigna seed user.
   - Busca samples de extraccion sin redistribuir → cambia `creador_id` a seed user correspondiente.
   - Cambia `fuente` de `'scraping'` a `'comunidad'`.
4. Usuarios reales NO son afectados. El batch solo toca registros con `contribuidor_id IS NULL` o `creador_id = SISTEMA_USUARIO_ID`.

**Beneficios del desacoplamiento:**
- Scraper/extraccion no necesita saber de seed users.
- Si el sistema de seed se desactiva, scraper sigue funcionando.
- En produccion con usuarios reales, el batch se desactiva y todo funciona igual.
- Los procesos automaticos pueden correr de fondo sin preocuparse por usuarios.

---

## Orden de Implementacion

| Fase | Prioridad | Esfuerzo | Descripcion |
|------|-----------|----------|-------------|
| **L1** | CRITICA | Medio | Usuarios simulados + atribucion retroactiva |
| **L2** | CRITICA | Bajo | Reporte legal + takedown automatico |
| **L3** | ALTA | Alto | Sistema de contribuciones de relaciones con moderacion |
| **L4** | MEDIA | Bajo | Pagina legal DMCA (puede ser placeholder) |
| **L5** | ALTA | Medio | Descripciones fix + contribucion manual de recortes + BuscadorCanciones |

### Checklist de implementacion L1-L2 (sprint actual)

**L1 — Seed Users:**
- [x] L1.1 Migracion v033: columna `es_seed` en `usuarios_ext` + tabla `contribuciones_pendientes`
- [x] L1.2 Schema update: UsuariosExtSchema + nuevo ContribucionesPendientesSchema
- [x] L1.3 Regenerar _generated (Cols, DTO, Enums)
- [x] L1.4 SeedUsuarios service: generar usuarios + distribuir contribuciones Pareto
- [x] L1.5 seedConfig: listas de adjetivos/sustantivos musicales
- [x] L1.6 DevController: endpoints seed (solo WP_DEBUG)
- [x] L1.7 Ejecutar seed sobre datos existentes

**L2 — Reporte Legal:**
- [x] L2.1 ReportesRepository: metodo para reportes legales + auto-desactivacion sample
- [x] L2.2 ReporteLegalController: endpoint POST /reportar-legal (sin auth) + GET /admin/reportes/legales
- [x] L2.3 UI: BotonReporteLegal componente reutilizable
- [x] L2.4 UI: ModalReporteLegal con formulario DMCA completo

**L3 — Contribuciones:**
- [x] L3.1 ContribucionesPendientesRepository (CRUD + busqueda + moderacion)
- [x] L3.2 ContribucionesController (endpoints)
- [x] L3.3 UI: ModalContribucion + BuscadorCanciones (centralizado)
- [ ] L3.4 UI: Panel admin para moderar contribuciones (pendiente island admin)
- [x] L3.5 Integracion: aprobar contribucion → insertar relacion + encolar extraccion (via ContribucionesService)

**L5 — Descripciones + Recortes Manuales:**
- [x] L5.1 Fix generarDescripcion(): descripcion generica sin nombres de canciones
- [x] L5.2 ProcesadorColaIA: sobrescribir samples.descripcion con descripcion_corta_es de IA
- [x] L5.3 DevController: endpoint POST /dev/seed/sincronizar-descripciones (UPDATE retroactivo)
- [x] L5.4 BuscadorCanciones.tsx: componente centralizado de busqueda de canciones
- [ ] L5.5 Modal publicacion/edicion: boton "Adjuntar cancion" usando BuscadorCanciones
- [ ] L5.6 Pagina cancion: boton "Subir sample de esta cancion" (pasa cancion_origen_id)
- [x] L5.7 UI contribuidor en TarjetaRelacionSample / RelacionDetalleIsland
- [ ] L5.8 Edicion de contribuciones: usuario edita pendientes, admin edita todas

---

## Scraper — Almacenar "Contributed by"

### Cambio en parsers.py
En `SampleDetailSpider.parse_detail()`, extraer:
```python
contributor_el = response.css('.submission-meta__el3')
ws_contribuidor = {
    'nombre': contributor_el.css('a::text').get(''),
    'slug': contributor_el.css('a::attr(href)').re_first(r'/user/(.+)/'),
    # cred y submissions NO se extraen (requeriria seguir al perfil del user)
}
```

### Cambio en pipeline
En `PostgresPipeline._upsert_relacion()`, incluir `ws_contribuidor` en el campo `metadata` JSONB.

### Retroactivo
No se re-scrapea. Solo aplica a nuevas relaciones. Los datos existentes no tendran esta metadata (y no la necesitan — la atribucion es nuestra, no de WhoSampled).

---

## Lecciones y Decisiones

- [Legal] Datos facticos (relaciones de sampleo) no son protegibles por copyright. La compilacion puede serlo (EU sui generis), pero los hechos individuales no.
- [Legal] Safe Harbor exige: contenido de usuarios + mecanismo takedown + accion expedita. Los 3 deben funcionar ANTES de produccion.
- [Legal] Reportes legales desactivan contenido INMEDIATAMENTE (no esperan revision). Esto es sobre-cauteloso pero maximiza proteccion.
- [Seed] Los seed users tienen perfil accesible/real pero se identifican secretamente via `es_seed` flag.
- [Seed] La distribucion Pareto (pocos usuarios muy activos, muchos poco activos) es critica para parecer organico.
- [Seed] wp_user_id es obligatorio (FK a WP). Cada seed user necesita un WP subscriber.
- [Contribuciones] Las contribuciones van a tabla separada (`contribuciones_pendientes`), no directamente a `relaciones_sample`. Solo al aprobar se migran.
- [Repo] Hacer repositorio privado antes de produccion es OBLIGATORIO.
- [Descripciones] `PublicadorExtraccion::generarDescripcion()` genera texto delatador ("Extraccion automatica [drums]: ..."). Reemplazar con descripcion generica y dejar que la IA sobrescriba despues.
- [Desacoplamiento] El seed batch es INDEPENDIENTE del scraping/extraccion. Los procesos automaticos no saben de seed users. El batch corre despues y redistribuye.
- [BuscadorCanciones] Componente centralizado que se reutiliza en: contribucion de relacion, publicacion de sample, edicion de sample. Llama a GET /canciones/buscar.
- [Manual = Automatico] Todo lo que el pipeline automatico genera (sample con cancion_origen_id, relacion con contribuidor_id, vinculo sample↔relacion) debe poder hacerse manualmente por usuarios reales via la misma UI.
