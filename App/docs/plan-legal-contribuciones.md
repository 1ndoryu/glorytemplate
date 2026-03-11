# Plan: Legalidad, Usuarios Simulados y Sistema de Contribuciones — C802

> **Version:** 3.0 | **Fecha:** 10/03/2026 | **Estado:** L1-L3/L5 implementados, L6 planificado
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

---

## AUDITORIA C802 — Post-Implementacion

> Auditoria completada: 10/03/2026 — AG-SEC

### Hallazgos Positivos

1. **Controllers PHP:** Todos los endpoints tienen try-catch global + logging. `ReporteLegalController` sanitiza inputs con `sanitize_text_field`, `sanitize_email`, `is_email()`, whitelist de `tipo` y `tipo_derecho`. `ContribucionesController` usa validate_callback con enums del schema.
2. **Prepared statements:** Todos los queries usan parametros via `static::consultar()` / `static::insertar()` / `static::ejecutar()` del BaseRepository. No hay SQL interpolado.
3. **Schema System:** Toda referencia a tablas, columnas, estados usa Cols/Enums generados. No hay strings hardcodeados.
4. **SRP:** ContribucionesService separa logica de aprobacion del controller. Hooks React separan estado del componente visual.
5. **Seed System:** Independiente del pipeline automatico. Pareto implementado bien. Generacion con retry.
6. **FK cascades verificadas:** Borrar un sample -> `relaciones_sample.sample_id / sample_fuente_id / sample_destino_id` se pone NULL automaticamente (ON DELETE SET NULL en DB). La relacion entre canciones se mantiene. `cola_extraccion_samples.sample_id` necesita cleanup manual (ya implementado en `eliminarConCascada` via `desvincularSampleId`).

### Hallazgos a Corregir (FASE L6)

1. **CRUD incompleto para contribuciones:** Solo hay Create + Read. Falta: editar contribuciones pendientes (propias), eliminar contribuciones pendientes (propias), admin puede editar/eliminar cualquiera.
2. **Contribuciones como factor publico:** El sistema actual asume UN contribuidor principal. En realidad, cualquier usuario deberia poder proponer cambios/correcciones a CUALQUIER relacion existente (no solo crear nuevas). Esto require un modelo de "ediciones pendientes" mas amplio.
3. **Eliminacion de samples y cascada:** El delete ya funciona correctamente via DB FK cascades (SET NULL). Pero no hay endpoint ni UI para que el autor elimine su sample. `eliminarConCascada` existe en el repo pero no esta expuesto como endpoint de usuario. Ademas al desactivar un sample via DMCA, los `relaciones_sample` quedan con sample_id=NULL pero la relacion sigue visible — hay que definir si eso es correcto (probablemente si, el sampleo como hecho factual persiste, solo el audio adjunto desaparece).
4. **Relacion sample↔relacion en recortes:** Los recortes bilaterales se vinculan a `relaciones_sample` via `sample_fuente_id` y `sample_destino_id` (SET NULL on delete). Cuando un sample se elimina, la relacion pierde el vinculo pero no se destruye. Correcto.
5. **Schema generator fix aplicado:** `jsonb` y `bigint` no estaban en el mapa de tipos → `mixed` / `?mixed` fatal error. Corregido en `schemaGenerate.mjs`, regenerados todos los DTOs.

---

## FASE L6 — CRUD Completo + Contribuciones Publicas (Ediciones Comunitarias)

> **Objetivo:** Convertir el sistema de contribuciones en un CRUD completo donde: (a) los usuarios gestionan sus propias contribuciones, (b) cualquier usuario puede proponer ediciones a relaciones EXISTENTES, (c) admin tiene control total, (d) todas las ediciones/eliminaciones pasan por moderacion.

### L6.1 — CRUD de Contribuciones Propias (autor)

**Contexto:** Actualmente un usuario autenticado crea contribuciones (POST /contribuciones) y las ve (GET /contribuciones/mis). Falta editar y eliminar las propias ANTES de que sean moderadas.

**Reglas de negocio:**
- Solo el contribuidor original puede editar/eliminar sus contribuciones SOLO si `estado = 'pendiente'`.
- Una vez aprobada o rechazada, es inmutable (la relacion ya existe en `relaciones_sample`).
- Eliminar una contribucion pendiente es un DELETE hard (no soft-delete, porque nunca llego a produccion).

**Endpoints nuevos:**
```
PUT    /contribuciones/{id}    — Editar contribucion propia pendiente (auth)
DELETE /contribuciones/{id}    — Eliminar contribucion propia pendiente (auth)
```

**Archivos a modificar:**
- `ContribucionesController.php`: agregar 2 rutas + 2 callbacks
- `ContribucionesPendientesRepository.php`: agregar `actualizarPendiente()`, `eliminarPendiente()`
- `apiContribuciones.ts`: agregar `editarContribucion()`, `eliminarContribucion()`
- `useContribucion.ts` o nuevo hook `useMisContribuciones.ts`

### L6.2 — Ediciones Comunitarias a Relaciones Existentes

**Contexto:** Actualmente solo se pueden CREAR relaciones nuevas. Pero el usuario pide que cualquier persona pueda sugerir cambios a relaciones existentes (corregir tipo_relacion, tipo_elemento, canciones asociadas, etc.). Es como Wikipedia: cualquiera puede "editar", pero los cambios se revisan.

**Diseno:**
- Reutilizar tabla `contribuciones_pendientes` con campos adicionales:
  - `relacion_existente_id INT NULL REFERENCES relaciones_sample(id)` — indica que esta contribucion es una EDICION (no una creacion).
  - `tipo_contribucion VARCHAR(20) CHECK (nueva, edicion, eliminacion)` — tipo de la contribucion.
  - `cambios_propuestos JSONB NULL` — para ediciones, almacena los cambios: `{"tipo_relacion": "remix", "tipo_elemento": "bass"}`.

**Migracion (v034):**
```sql
ALTER TABLE contribuciones_pendientes
    ADD COLUMN relacion_existente_id INT REFERENCES relaciones_sample(id) ON DELETE SET NULL,
    ADD COLUMN tipo_contribucion VARCHAR(20) DEFAULT 'nueva'
        CHECK (tipo_contribucion IN ('nueva', 'edicion', 'eliminacion')),
    ADD COLUMN cambios_propuestos JSONB;
```

**Flujo edicion:**
1. Usuario ve una relacion de sampleo en la pagina de cancion.
2. Click "Sugerir correccion" → modal pre-rellenado con datos actuales.
3. Modifica tipo_relacion, tipo_elemento, etc. → crea contribucion con `tipo_contribucion='edicion'`, `relacion_existente_id=X`, `cambios_propuestos={...}`.
4. Moderador aprueba → `ContribucionesService::aplicarEdicion()` actualiza la relacion original.

**Flujo eliminacion:**
1. Usuario cree que una relacion es incorrecta.
2. Click "Reportar error" → crea contribucion con `tipo_contribucion='eliminacion'`, `relacion_existente_id=X`, `razon='...'`.
3. Moderador aprueba → relacion se marca como eliminada (soft-delete o hard-delete segun politica).

**Endpoints nuevos:**
```
POST /contribuciones/edicion      — Proponer edicion a relacion existente (auth)
POST /contribuciones/eliminacion  — Proponer eliminacion de relacion (auth)
```

**Archivos a modificar:**
- Migracion v034
- `ContribucionesPendientesSchema.php`: 3 columnas nuevas
- Schema regenerar
- `ContribucionesController.php`: 2 endpoints nuevos
- `ContribucionesPendientesRepository.php`: metodos de edicion/eliminacion
- `ContribucionesService.php`: `aplicarEdicion()`, `aplicarEliminacion()`
- Frontend: `ModalEdicionRelacion.tsx` (nuevo), `useEdicionRelacion.ts` (nuevo)

### L6.3 — Eliminacion de Samples por Autor

**Contexto:** Los usuarios son duenos de sus samples y deben poder eliminarlos libremente (sin moderacion).

**Reglas de negocio:**
- El creador (creador_id) puede eliminar su propio sample EN CUALQUIER momento.
- Eliminacion = soft-delete (`estado = 'eliminado'`) + limpieza de archivos fisicos.
- Al eliminar un sample: las relaciones que lo referencian quedan con `sample_id/sample_fuente_id/sample_destino_id = NULL` (ya funciona por FK cascade). La relacion entre canciones persiste — solo el audio adjunto desaparece.
- Admin puede eliminar cualquier sample.

**Endpoint existente a exponer:**
```
DELETE /samples/{id}    — Eliminar sample propio (auth, verificar creador_id)
```

**Nota:** `SamplesRepository::eliminarConCascada()` ya existe pero no esta expuesto como endpoint REST para el usuario final. Solo el admin lo usa indirectamente. Necesitamos:
- Verificar que `creador_id === usuario_actual` (o es admin)
- Llamar a `eliminarConCascada` o hacer soft-delete cambiando estado a 'eliminado'

**Archivos a modificar:**
- `SamplesModificacionController.php`: agregar ruta DELETE + callback
- `SamplesRepository.php`: agregar/exponer metodo de soft-delete
- Frontend: agregar opcion "Eliminar" en menu contextual del sample (ya existe useMenuContextualSample)

### L6.4 — Admin: CRUD Completo

**Contexto:** Admin debe poder editar/eliminar CUALQUIER contribucion y CUALQUIER relacion directamente (sin pasar por moderacion).

**Endpoints admin:**
```
PUT    /admin/contribuciones/{id}     — Editar cualquier contribucion (admin)
DELETE /admin/contribuciones/{id}     — Eliminar cualquier contribucion (admin)
PUT    /admin/relaciones/{id}         — Editar relacion directamente (admin)
DELETE /admin/relaciones/{id}         — Eliminar relacion directamente (admin)
```

### Checklist L6

- [x] L6.1a Migracion v034: columnas `relacion_existente_id`, `tipo_contribucion`, `cambios_propuestos` [AG-L6C]
- [x] L6.1b Schema update + regenerar _generated (28 tablas, 0 errores) [AG-L6C]
- [x] L6.1c Endpoints PUT/DELETE /contribuciones/{id} (propias, pendientes) [AG-L6C]
- [x] L6.1d Repository: actualizarPendiente(), eliminarPendiente(), crearEdicion(), crearEliminacion(), existeEdicionPendiente(), listarPendientesAdmin(), actualizarAdmin(), eliminarAdmin() [AG-L6C]
- [x] L6.1e Frontend: apiContribuciones.ts con editarContribucion(), eliminarContribucion() [AG-L6C]
- [x] L6.2a Endpoints POST /contribuciones/edicion + /contribuciones/eliminacion [AG-L6C]
- [x] L6.2b ContribucionesService: aplicarEdicion(), aplicarEliminacion() [AG-L6C]
- [x] L6.2c Frontend: ModalEdicionRelacion + useEdicionRelacion + modalEdicionRelacion.css [AG-L6C]
- [x] L6.2d Boton "Sugerir correccion" y "Reportar error" en TablaRelaciones + TarjetaRelacionSample + wired en CancionDetalleIsland [AG-L6C]
- [x] L6.3a Endpoint DELETE /samples/{id} (owner soft-delete + admin hard-delete) [AG-L6C]
- [x] L6.3b Soft-delete sample (marcarEliminado) + limpieza archivo fisica (ambas rutas) [AG-L6C]
- [x] L6.3c UI: "Eliminar" en menu contextual sample ya existia (C800/C801 previo) [AG-L6C]
- [x] L6.4a Endpoints admin CRUD contribuciones (PUT/DELETE /admin/contribuciones/{id}) [AG-L6C]
- [x] L6.4b Endpoints admin CRUD relaciones (PUT/DELETE /admin/relaciones/{id}) [AG-L6C]
- [ ] L6.4c Panel admin moderar contribuciones (L3.4) — TO-DO: componente isla de admin con tabla de contribuciones pendientes, acciones aprobar/rechazar

---

## Lecciones y Decisiones

- [Schema Generator] `jsonb` y `bigint` deben estar en el mapa de tipos. Sin ellos, el generator produce `mixed`, y `?mixed` es fatal en PHP 8. Fix en `schemaGenerate.mjs` tipoPHP() y tipoTS(). Tambien proteger contra `?mixed` en el generador de propiedades DTO.
- [FK Cascades] `relaciones_sample.sample_id/sample_fuente_id/sample_destino_id` son ON DELETE SET NULL. Al borrar sample, relacion mantiene las canciones vinculadas pero pierde el audio. `cola_extraccion_samples.sample_id` NO tiene ON DELETE — necesita cleanup manual en codigo (desvincularSampleId).
- [Contribuciones Publicas] El modelo correcto es Wikipedia-like: cualquier usuario puede proponer ediciones a cualquier relacion, pero las ediciones quedan pendientes de moderacion. Distincion clave: `tipo_contribucion` = nueva / edicion / eliminacion.
- [Eliminacion samples] Libre para el autor (sin moderacion), soft-delete cambio de estado. Las relaciones FK se limpian automaticamente por la DB.
- [L6 Frontend] TarjetaRelacionSample no se usa en ningun island actualmente — el componente activo es TablaRelaciones. Los callbacks de edicion/eliminacion se anaden a ambos para cobertura futura.
- [L6 ModalEdicionRelacion] Patron: el modal se monta en la isla padre (CancionDetalleIsland), no dentro de la tarjeta. El estado `relacionParaEditar` y `modoEliminacion` viven en la isla, se pasan al modal como props. El hook useEdicionRelacion gestiona el form state internamente.
- [L6 moderar()] El metodo moderar() en el controller ahora maneja 3 tipos de contribucion: nueva (flujo original), edicion (aplicarEdicion via service), eliminacion (aplicarEliminacion via service). No hace falta endpoint separado.

---

## FASE L7 — Gaps Identificados: Adjuncion Manual Completa + Edicion de Media

> **Origen:** Auditoria de UX post-C802c — 10/03/2026. Problemas surgidos al implementar C802c.
> **Objetivo:** Cerrar los CINCO gaps no contemplados en L5/L6 que hacen incompleto el flujo de adjuncion manual de samples.

### Gap 1 — Selector de lado dentro del modal (no en menú contextual)

**Problema:** La implementacion C802c puso dos items en el menu contextual con el titulo completo de cada cancion: `Adjuntar sample de "Amen Brother"` / `Adjuntar sample de "Think"`. Los titulos son demasiado largos para texto de menu y el UX correcto es que el menu contextual sea solo un punto de entrada.

**Solucion:**
- El menu contextual de RelacionDetalleIsland muestra UN SOLO item: `"Adjuntar sample manual"`.
- Al hacer click, abre el ModalCrearContenido SIN `ladoRelacion` ni `cancionOrigenId` pre-definidos, solo con `relacionId`.
- El modal muestra un paso adicional: `"¿A qué canción pertenece este sample?"` con dos opciones visuales (tarjeta con portada + título de cada canción).
- Al seleccionar: se fija `cancionOrigenId` y `ladoRelacion` para el submit.

**Archivos:**
- `useMenuRelacionDetalle.ts` — simplificar a 1 item, pasar solo `relacionId`
- `crearModalStore.ts` — `ladoRelacion` y `cancionOrigenId` opcionales; nuevo estado `ladoSeleccionado`
- `ModalCrearContenido.tsx` (o donde viva) — paso de seleccion de lado cuando `ladoRelacion` es undefined

### Gap 2 — Timing de inicio del sample

**Problema:** Al adjuntar un sample a una cancion/sampleo, se desconoce en qué momento de la canción empieza. El campo `detalleTiming` en la relacion ya tiene el timing de referencia del scraping. Deberia pre-rellenarse.

**Datos en DB:**
- `relaciones_sample.timing_destino_inicio` / `timing_fuente_inicio` (si existen, ver schema)
- O en `metadata JSONB`: `timings: [{ muestra_inicio, sampleada_inicio, duracion }]`
- Al adjuntar manualmente: el usuario especifica `inicio_segundos` (puede quedar vacio)

**Solucion:**
- Agregar campo `inicio_segundos` opcional al formulario de publicacion de sample cuando hay `relacionId` en el contexto.
- Pre-rellenar con el timing de la relacion si existe (fuente o destino segun lado).
- Backend: almacenar en `samples.metadata.inicio_segundos` (JSONB, sin requeri migracion).
- `SamplesUploadController`: leer `inicio_segundos` y persistirlo en metadata.

**Archivos:**
- ModalCrearContenido / step de upload — campo numerico opcional `inicio_segundos`
- `SamplesUploadController.php` — leer y guardar `inicio_segundos` en metadata JSONB

### Gap 3 — Adjuntar sample ya publicado (sin re-subir archivo)

**Problema:** Actualmente solo se puede "adjuntar" subiendo un archivo nuevo. Pero si el usuario ya tiene un sample publicado en Kamples que corresponde a ese sampleo, deberia poder vincularlo directamente sin duplicar.

**Flujo propuesto:**
```
RelacionDetalle → menu 3 puntos → "Adjuntar sample existente"
    ↓
Modal: buscador de samples propios (o todos si admin)
    ↓
Seleccionar sample → click "Vincular"
    ↓
Backend: RelacionesSampleRepository::actualizarPorId(relacionId, [SAMPLE_FUENTE_ID/SAMPLE_DESTINO_ID => sampleId])
         + samples::actualizarCampos(cancion_origen_id a partir del lado)
```

**Consideraciones:**
- Solo se pueden vincular samples propios (del usuario actual). Admin puede vincular cualquiera.
- Si el sample ya esta vinculado a otra relacion, mostrar advertencia (un sample puede estar en multiples relaciones).
- Busqueda: GET /samples/mis?q=... (endpoint existente o extensible).

**Endpoints nuevos:**
```
POST /relaciones/{relacionId}/vincular-sample   — Body: { sample_id, lado }  [auth]
```
El endpoint verifica ownership del sample (o rol admin) y hace el UPDATE en `relaciones_sample`.

**Archivos:**
- `RelacionesSampleController.php` — nuevo endpoint `vincularSampleExistente()`
- `RelacionesSampleRepository.php` — metodo ya existe (`actualizarPorId`) — solo necesita el controller
- Frontend: `ModalVincularSampleExistente.tsx` (nuevo) — buscador de samples propios + confirmacion
- `apiRelaciones.ts` — funcion `vincularSampleExistente(relacionId, sampleId, lado)`

### Gap 4 — Desadjuntar / cambiar sample de una relación

**Problema:** No hay forma de quitar un sample ya vinculado a un sampleo (sin eliminar el sample completo) ni de cambiarlo por otro. El admin o el creador deberían poder decir "este sample ya no pertenece a este sampleo" sin borrar el sample de la plataforma.

**Casos de uso:**
- El sample fue adjuntado al sampleo incorrecto (lado equivocado o relacion equivocada).
- El sample es de mala calidad y se quiere reemplazar por uno mejor.

**Solucion:**
- **Desadjuntar:** `PUT /relaciones/{id}` con `{sample_fuente_id: null}` o `{sample_destino_id: null}`. Esto ya es soportado por `actualizarPorId`. Solo falta la UI.
- **Reemplazar:** Desadjuntar el anterior y vincular el nuevo (dos operaciones o una atomica).
- UI: En `RelacionDetalleIsland`, si hay sample vinculado y el usuario es owner/admin → icono de "quitar" junto al sample en `FeedSamples`.
- Menu contextual del sample (cuando se muestra en contexto de relacion): agregar item "Quitar de este sampleo" (visible solo si es owner del sample o admin).

**Endpoint:**
```
DELETE /relaciones/{relacionId}/sample/{lado}   — Desvincula sample_fuente_id o sample_destino_id [auth owner/admin]
```

**Archivos:**
- `RelacionesSampleController.php` — nuevo endpoint `desvincularSample()`
- Frontend: `useMenuContextualSample.tsx` — item condicional "Quitar de este sampleo" (requiere saber el contexto de relacion)
- `FeedSamples` / donde se renderiza el sample en RelacionDetalle — pasar `relacionContextoId` para activar el item

### Gap 5 — Editar URL de YouTube/Spotify y timings en un sampleo (L6.2 incompleto)

**Problema:** L6.2 (ModalEdicionRelacion) cubre tipo_relacion, tipo_elemento, canciones asociadas. Pero NO cubre:
- URL de YouTube/Spotify de cada lado (fuente/destino)
- Timings de aparicion (muestra_inicio, sampleada_inicio, duracion)
- Campo verificada (si se puede confirmar documentalmente)

**Solucion:** Extender `ModalEdicionRelacion.tsx` con campos adicionales en el formulario:
- `destino_youtube_url` / `fuente_youtube_url` (inputs de URL con validacion de formato YouTube/Spotify)
- `timing_fuente_inicio_s` / `timing_destino_inicio_s` / `duracion_s` (inputs numericos en segundos)
- `verificada` (checkbox — solo visible para usuarios con rol verificador o admin)

Los campos nuevos se agregan a `cambios_propuestos JSONB` de la contribucion pendiente.

`ContribucionesService::aplicarEdicion()` debe manejar los campos nuevos al momento de aplicar la edicion aprobada.

**Columnas a verificar en schema `relaciones_sample`:**
- `destino_youtube_id`, `fuente_youtube_id` (ya existen probablemente). Si el campo es ID y no URL completa, el modal muestra la URL completa y el backend extrae el ID.
- `metadata JSONB` puede contener `timings: [{ muestra_inicio, sampleada_inicio, duracion }]`.

**Archivos:**
- `ModalEdicionRelacion.tsx` — campos adicionales en el formulario
- `useEdicionRelacion.ts` — incluir los nuevos campos en `cambiosActuales`
- `ContribucionesService.php > aplicarEdicion()` — mapear campos nuevos de `cambios_propuestos`

---

### Checklist L7

- [ ] **L7.1** Menu contextual RelacionDetalle — simplificar a 1 item, selection de lado en modal
- [ ] **L7.2** Timing de inicio en modal de upload — campo `inicio_segundos` pre-rellenado con timing de relacion
- [ ] **L7.3** Endpoint `POST /relaciones/{id}/vincular-sample` — adjuntar sample ya publicado
- [ ] **L7.4** `ModalVincularSampleExistente.tsx` — buscador de samples propios para vincular
- [ ] **L7.5** Endpoint `DELETE /relaciones/{id}/sample/{lado}` — desadjuntar sample sin eliminar
- [ ] **L7.6** Item "Quitar de este sampleo" en menu contextual del sample (cuando hay contexto de relacion)
- [ ] **L7.7** Extender `ModalEdicionRelacion` con campos: youtube_url, timings, verificada
- [ ] **L7.8** `ContribucionesService::aplicarEdicion()` — manejar campos nuevos de media y timings
