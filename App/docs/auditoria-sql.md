# Auditoría SQL & Plan de Optimización de Base de Datos

> **Versión:** 1.0  
> **Fecha:** 19/02/2026  
> **Agente:** AG-SQL  
> **Alcance:** App/Kamples/ (PostgreSQL) + Glory/src/ (WordPress/MySQL)  
> **Archivos escaneados:** ~168 PHP + 22 SQL migraciones

---

## Resumen Ejecutivo

| Severidad | App/Kamples | Glory/src | Total |
|-----------|-------------|-----------|-------|
| **CRITICAL** | 7 | 12 | **19** |
| **MEDIUM** | 18 | 7 | **25** |
| **LOW** | 6 | 8 | **14** |
| **Total** | 31 | 27 | **58** |

**Estado actual:** El proyecto tiene un SchemaSystem robusto (18 schemas, constantes `*Cols`, DTOs generados, `*Enums`), pero aún persisten hardcodings en:
- PipelineAudio (tabla + 21 columnas como strings)
- AdminRepository (columnas comunes sin constante)
- ConstructorSenales (claves JSONB sin constante)
- FormController y NewsletterController (tablas MySQL sin schema)
- ~20 instancias de meta keys duplicadas en Glory/src

---

## Parte 1: Hallazgos — App/Kamples/ (PostgreSQL)

### CRITICAL — Tablas y columnas hardcodeadas

#### H01. PipelineAudio.php — Tabla `samples` en SQL directo
- **Archivo:** `App/Kamples/Api/PipelineAudio.php` L369
- **Código:** `"UPDATE samples SET " . implode(', ', $setClauses) . " WHERE id = :id"`
- **Problema:** Tabla `samples` y columna `id` como strings literales
- **Fix:** Usar `SamplesCols::TABLA` (o definirla) y `SamplesCols::ID`

#### H02. PipelineAudio.php — Whitelist 21 columnas como strings
- **Archivo:** `App/Kamples/Api/PipelineAudio.php` L344-349
- **Código:**
```php
$columnasPermitidas = [
    'duracion', 'bpm', 'key', 'escala', 'tipo', 'metadata',
    'ruta_original', 'ruta_waveform', 'ruta_optimizada', 'ruta_preview',
    'estado', 'publicado_at', 'titulo', 'slug', 'tags',
    'nombre_archivo', 'formato', 'waveform_peaks',
];
```
- **Fix:** Derivar de `SamplesCols::TODAS` o constantes individuales

#### H03. VerificarPgvector.php — Tabla y columna en information_schema
- **Archivo:** `App/Kamples/Database/VerificarPgvector.php` L103-104
- **Código:** `WHERE table_name = 'samples' AND column_name = 'embedding'`
- **Fix:** Usar `SamplesSchema::tabla()` y `SamplesCols::EMBEDDING`

#### H04. VerificarPgvector.php — Nombre de índice hardcodeado
- **Archivo:** `App/Kamples/Database/VerificarPgvector.php` L125
- **Código:** `WHERE indexname = 'idx_samples_embedding'`
- **Fix:** Definir constante de índice en SamplesSchema o config

#### H05. AdminRepository.php — `created_at` genérico sin constante
- **Archivo:** `App/Kamples/Database/Repositories/AdminRepository.php` L67-68
- **Código:** `"SELECT DATE(created_at) as fecha, COUNT(*) as total FROM {$tabla}..."`
- **Fix:** Recibir constante de columna como parámetro o usar `*Cols::CREATED_AT`

#### H06. SamplesRepository.php — Default ORDER BY hardcodeado
- **Archivo:** `App/Kamples/Database/Repositories/SamplesRepository.php` L579
- **Código:** `string $orderBy = 'ORDER BY s.publicado_at DESC NULLS LAST'`
- **Fix:** Componer con `SamplesCols::PUBLICADO_AT`

#### H07. ConstructorSenales.php — Columnas y claves JSONB directas
- **Archivo:** `App/Kamples/Services/ConstructorSenales.php` L40-67
- **Código:** `{$alias}.tags`, `{$alias}.metadata->'genero'`, `metadata->'instrumentos'`, `metadata->'emocion'`
- **Fix:** Variables locales desde constantes: `$tags = SamplesCols::TAGS;`

---

### MEDIUM — Valores hardcodeados (deberian ser Enums/constantes)

| # | Archivo | Línea | Valor hardcodeado | Enum sugerido |
|---|---------|-------|-------------------|---------------|
| H08 | AdminRepository.php | L48-49 | `'pendiente'` en moderacion | `PublicacionesEnums::MODERACION_PENDIENTE` (no existe) |
| H09 | AdminController.php | L284 | `'aprobado'`, `'rechazado'` | `PublicacionesEnums::MODERACION_APROBADO/RECHAZADO` |
| H10 | NormalizadorSample.php | L143-144 | `'one shot'`, `'procesando'` defaults | `SamplesEnums::TIPO_ONESHOT`, `SamplesEnums::ESTADO_PROCESANDO` |
| H11 | PublicacionesEscrituraCtrl | L181 | `['pendiente', 'aprobado', 'revision', 'rechazado']` | Crear `PublicacionesEnums::MODERACION_*` |
| H12 | ComentariosEscrituraCtrl | L75 | `['texto', 'imagen', 'audio']` | `ComentariosEnums::TIPO_CONTENIDO_*` |
| H13 | MensajesController.php | L169 | `['texto', 'imagen', 'audio', 'sample']` | `MensajesEnums::TIPO_*` |
| H14 | ExperimentosController.php | L246 | `'texto'` tipo mensaje | `MensajesEnums::TIPO_TEXTO` |
| H15 | ComentariosController.php | L240 | `'texto'` default | `ComentariosEnums::TIPO_CONTENIDO_TEXTO` |
| H16 | MensajesController.php | L100 | `'texto'` default | `MensajesEnums::TIPO_TEXTO` |
| H17 | ConnectController.php | L180-184 | `'activo'`, `'pendiente'`, `'restringido'` | Crear `StripeConnectEnums` |
| H18 | ServicioModeracionIA.php | L163 | `['rechazado' => 3, 'revision' => 2, 'aprobado' => 1]` | Map desde enum |
| H19 | JsonRepairer.php | L222 | `['one shot', 'loop']` | `SamplesEnums::TIPO_*` |
| H20 | MotorRecomendacion.php | L342 | `'one shot'` default | `SamplesEnums::TIPO_ONESHOT` |
| H21-H25 | BibliotecaSamples/Pipeline/SamplesRepo | varios | `'Samples'` carpeta default (5 ubicaciones) | `const CARPETA_DEFAULT = 'Samples'` |

### Discrepancia detectada: `'one shot'` vs `'oneshot'`

- **Schema CHECK:** `tipo IN ('loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro')`
- **Código PHP:** Usa `'one shot'` (con espacio) en NormalizadorSample, JsonRepairer, MotorRecomendacion
- **Impacto:** Si la BD tiene `'oneshot'` pero el código compara con `'one shot'`, hay inconsistencia silenciosa
- **Acción:** Verificar en BD cuál es el valor real y alinear código + schema

---

### LOW — Aceptables

| # | Archivo | Detalle |
|---|---------|---------|
| H26 | MotorRecomendacion.php | `$wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options}..."))` — patrón WP correcto |
| H27 | PostgresService.php | PDO connection config — aceptable |
| H28 | PostgresService.php | `SELECT 1` health check — estándar |
| H29 | VerificarPgvector.php | `pg_extension` catalog query — necesario |
| H30 | VerificarPgvector.php | Tabla temporal `_test_vec` — diagnóstico desechable |
| H31 | PostgresService.php | Regex `validarQueryContraSchema()` — seguridad interna |

---

## Parte 2: Hallazgos — Glory/src/ (WordPress/MySQL)

### CRITICAL — SQL directo con columnas/tablas hardcodeadas

#### G01-G02. FormController.php — CREATE TABLE + INSERT sin schema
- **Archivo:** `Glory/src/Api/FormController.php` L90-112, L162-169
- **Problema:** CREATE TABLE con 10 columnas hardcodeadas, INSERT con 7 columnas como strings
- **Agravante:** `SHOW TABLES LIKE '$tabla'` sin `$wpdb->prepare()`
- **Fix:** Crear `FormEntriesSchema.php`, registrar en SchemaRegistry

#### G03-G04. NewsletterController.php — CREATE TABLE + INSERT/SELECT sin schema
- **Archivo:** `Glory/src/Api/NewsletterController.php` L66-82, L118-133
- **Problema:** Mismo patrón que FormController — columnas hardcodeadas, sin prepare en SHOW TABLES
- **Fix:** Crear `NewsletterSchema.php`, registrar en SchemaRegistry

#### G05-G09. Meta keys `_glory_asset_*` duplicadas en 5 archivos (~20 veces)
- **Archivos afectados:**
  - `Glory/src/Utility/AssetImporter.php` (~14 instancias)
  - `Glory/src/Utility/AssetResolver.php` (2 instancias)
  - `Glory/src/Services/Sync/PostSyncHandler.php` (2 instancias)
  - `Glory/src/Services/Sync/GalleryRepair.php` (2 instancias)
  - `Glory/src/Services/Sync/FeaturedImageRepair.php` (4 instancias)
- **Strings:** `'_glory_asset_source'`, `'_glory_asset_requested'`
- **Fix:** Crear `AssetMeta::SOURCE`, `AssetMeta::REQUESTED` constantes compartidas

---

### CRITICAL — Seguridad SQL

#### G10-G11. SHOW TABLES sin prepare()
- `FormController.php` L90: `$wpdb->get_var("SHOW TABLES LIKE '$tabla'")`
- `NewsletterController.php` L66: misma situación
- **Fix:** `$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $tabla))`

#### G12. CachePurger.php — DELETE sin prepare()
- **Archivo:** `Glory/src/Admin/CachePurger.php` L27-33
- **Código:** 6 queries `$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '...'")` sin prepare
- **Fix:** Aunque los valores son constantes (no user input), usar `$wpdb->prepare()` por consistencia

---

### MEDIUM

| # | Archivo | Detalle |
|---|---------|---------|
| G13 | FormController.php | TABLE_SUFFIX no centralizado en SchemaRegistry |
| G14 | NewsletterController.php | TABLE_SUFFIX no centralizado en SchemaRegistry |
| G15 | FormController.php | Option `'glory_form_entries_tabla_creada'` hardcodeado |
| G16 | NewsletterController.php | Option `'glory_newsletter_tabla_creada'` hardcodeado |
| G17 | StripeConfig.php | 3 option names hardcodeados (`glory_stripe_*`) |
| G18 | DefaultContentSynchronizer.php | Usa string `'_glory_default_content_slug'` en vez de constante existente en DefaultContentRepository |
| G19 | SeoMetabox.php | Duplica constantes de MetaTagRenderer en vez de importarlas |

### LOW

| # | Detalle |
|---|---------|
| G20-G25 | CachePurger: 6 DELETEs con patrones WP estándar |
| G26 | QueryProfiler: lectura `$wpdb->queries` de solo-lectura |
| G27 | ReactContentProvider: meta keys nativas WP (`_thumbnail_id`, `_wp_attachment_image_alt`) |

---

## Parte 3: Enums Faltantes (deben generarse)

| Tabla | Columna | Valores CHECK | Archivo Enum sugerido |
|-------|---------|---------------|----------------------|
| publicaciones | moderacion_estado | `'pendiente', 'aprobado', 'revision', 'rechazado'` | `PublicacionesEnums.php` (parcial: falta MODERACION_*) |
| reportes | estado | `'pendiente', 'resuelto', 'descartado'` | `ReportesEnums.php` (no existe) |
| mensajes | tipo | `'texto', 'imagen', 'audio', 'sample'` | `MensajesEnums.php` (no existe) |
| comentarios | tipo_contenido | `'texto', 'imagen', 'audio'` | `ComentariosEnums.php` (parcial) |
| stripe connect | estado | `'activo', 'pendiente', 'restringido'` | `StripeConnectEnums.php` (no existe) |

---

## Parte 4: Plan de Optimización de Base de Datos

### A. Índices — Análisis actual y mejoras

#### A1. Índices existentes (14 tablas PostgreSQL)

| Tabla | Índices actuales |
|-------|-----------------|
| `usuarios_ext` | PK, UNIQUE(wp_user_id, username, email), idx_wp, idx_username |
| `samples` | PK, UNIQUE(slug, id_corto), idx_metadata(GIN), idx_tags(GIN), idx_estado, idx_creador, idx_slug, idx_bpm, idx_key, idx_titulo_trgm(GIN), idx_embedding(HNSW) |
| `publicaciones` | PK, idx_autor |
| `follows` | PK compuesto, idx_seguido |
| `likes` | UNIQUE(usuario_id,tipo,target_id), idx_target |
| `descargas` | PK, idx_usuario_dia |
| `colecciones` | PK, idx_usuario |
| `coleccion_samples` | PK compuesto |
| `conversaciones` | PK, UNIQUE(p1,p2), idx_participantes |
| `mensajes` | PK, idx_conversacion |
| `notificaciones` | PK, idx_usuario(+leida+created_at) |
| `suscripciones` | PK, idx_usuario |
| `transacciones` | PK, idx_comprador, idx_vendedor |
| `reproducciones` | PK, idx_usuario, idx_sample |

#### A2. Índices faltantes (recomendados)

```sql
/* Prioridad ALTA — Queries frecuentes sin índice */

/* Feed social: ORDER BY created_at DESC es la query más frecuente */
CREATE INDEX IF NOT EXISTS idx_publicaciones_created
    ON publicaciones (created_at DESC);

/* Búsqueda samples por tipo (loop/oneshot/fx) — filtro frecuente */
CREATE INDEX IF NOT EXISTS idx_samples_tipo
    ON samples (tipo) WHERE estado = 'activo';

/* Colecciones públicas — listado en explorador */
CREATE INDEX IF NOT EXISTS idx_colecciones_publica
    ON colecciones (publica, created_at DESC) WHERE publica = TRUE;

/* Mensajes no leídos — badge count en TopBar */
CREATE INDEX IF NOT EXISTS idx_mensajes_no_leidos
    ON mensajes (remitente_id, leido) WHERE leido = FALSE;

/* Comentarios por autor — perfil del usuario */
CREATE INDEX IF NOT EXISTS idx_comentarios_autor
    ON comentarios (autor_id, created_at DESC);

/* Reproducciones para algoritmo — ventana temporal */
CREATE INDEX IF NOT EXISTS idx_reproducciones_created
    ON reproducciones (created_at DESC);

/* Descargas hoy — control de créditos diarios (la query más costosa en throughput) */
CREATE INDEX IF NOT EXISTS idx_descargas_usuario_created
    ON descargas (usuario_id, created_at DESC);

/* Likes por usuario — página favoritos */
CREATE INDEX IF NOT EXISTS idx_likes_usuario_created
    ON likes (usuario_id, created_at DESC);

/* Prioridad MEDIA */

/* Samples premium — filtro client-side pero mejor con partial index */
CREATE INDEX IF NOT EXISTS idx_samples_premium
    ON samples (es_premium, publicado_at DESC) WHERE es_premium = TRUE AND estado = 'activo';

/* Publicaciones con moderacion pendiente — panel admin */
CREATE INDEX IF NOT EXISTS idx_publicaciones_moderacion
    ON publicaciones (moderacion_estado) WHERE moderacion_estado = 'pendiente';

/* Conversaciones por último mensaje — orden en chat */
CREATE INDEX IF NOT EXISTS idx_conversaciones_ultimo_msg
    ON conversaciones (ultimo_mensaje_at DESC);

/* Notificaciones no leídas count */
CREATE INDEX IF NOT EXISTS idx_notificaciones_no_leidas
    ON notificaciones (usuario_id) WHERE leida = FALSE;
```

#### A3. Índices a revisar (posible eliminación)

```sql
/* idx_samples_slug duplica el UNIQUE constraint — revisar si PG lo crea automáticamente */
/* idx_conversaciones_participantes puede ser redundante con UNIQUE(p1,p2) */
```

---

### B. Optimización de Queries

#### B1. Queries N+1 detectadas

| Ubicación | Problema | Solución |
|-----------|----------|----------|
| FeedSamples — likes/follows por usuario | Múltiples queries por item del feed | Batch: `WHERE usuario_id = :uid AND tipo = 'sample' AND target_id IN (:ids)` |
| NotificacionesController — actor info | 1 query por notificación para obtener actor | JOIN con usuarios_ext en la query principal |
| ComentariosController — autor info | 1 query por comentario | JOIN usuarios_ext en query de comentarios |

#### B2. Queries costosas identificadas

| Query | Ubicación | Problema | Optimización |
|-------|-----------|----------|-------------|
| `COUNT(*)` global de descargas hoy | DescargasController | Full scan diario | Partial index + counter cache en usuarios_ext |
| Subqueries correlacionadas en AdminRepository | AdminRepository L48-49 | 4 subqueries en 1 query | Parallel queries o materializar contadores |
| `COALESCE` + unnest en ConstructorSenales | ConstructorSenales | JSONB array extraction en cada fila | Considerar columnas desnormalizadas o materialized view |
| Feed con 6 señales en MotorRecomendacion | MotorRecomendacion | CTE pesados con joins múltiples | Pre-calcular embeddings, cachear señales con TTL |

#### B3. JSONB — Optimización de acceso

```sql
/* Los accesos frequency a metadata->>'genero', metadata->>'instrumentos' se beneficiarían
   de expression indexes en vez de GIN genérico */
CREATE INDEX IF NOT EXISTS idx_samples_genero
    ON samples USING GIN ((metadata->'genero'));

CREATE INDEX IF NOT EXISTS idx_samples_carpeta
    ON samples ((metadata->>'carpeta_primaria'));
```

---

### C. Estrategia de Counter Caches

Actualmente las tablas usan contadores denormalizados (`total_likes`, `total_descargas`, etc.) que se actualizan manualmente. Esto es correcto pero propenso a drift.

#### C1. Triggers de sincronización recomendados

```sql
/* Trigger para mantener total_likes sincronizado en samples */
CREATE OR REPLACE FUNCTION sync_total_likes_sample()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.tipo = 'sample' THEN
        UPDATE samples SET total_likes = total_likes + 1 WHERE id = NEW.target_id;
    ELSIF TG_OP = 'DELETE' AND OLD.tipo = 'sample' THEN
        UPDATE samples SET total_likes = total_likes - 1 WHERE id = OLD.target_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

/* Similar para: total_descargas, total_reproducciones, total_seguidores, total_comentarios */
/* Beneficio: elimina N updates manuales distribuidos en el código PHP */
```

#### C2. Job periódico de reconciliación

```sql
/* Ejecutar cada hora para corregir drift en counters */
UPDATE samples s SET
    total_likes = (SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = s.id),
    total_descargas = (SELECT COUNT(*) FROM descargas WHERE sample_id = s.id),
    total_reproducciones = (SELECT COUNT(*) FROM reproducciones WHERE sample_id = s.id),
    total_comentarios = (SELECT COUNT(*) FROM comentarios WHERE tipo = 'sample' AND target_id = s.id)
WHERE s.estado = 'activo';
```

---

### D. Particionamiento (futuro — >1M filas)

| Tabla | Estrategia | Criterio |
|-------|-----------|----------|
| `reproducciones` | Range por mes (created_at) | >1M filas, queries siempre filtran por rango temporal |
| `descargas` | Range por mes (created_at) | Control de créditos solo consulta "hoy" |
| `notificaciones` | Range por mes + purgado | Notificaciones antiguas no se consultan |
| `likes` | No particionar | Queries por target_id, no temporal |

---

### E. Connection y Query pooling

| Área | Estado actual | Recomendación |
|------|--------------|---------------|
| PG Connection | Singleton PDO en PostgresService | Mantener. En VPS añadir PgBouncer (pool) |
| WP $wpdb | WordPress default | No requiere cambio en desarrollo |
| Prepared statements | PDO EMULATE_PREPARES=false (bien) | Mantener — mejor seguridad y rendimiento |
| Schema guard | `validarQueryContraSchema()` regex | Buena práctica — mantener |

---

### F. Cacheo de queries

| Capa | Estado actual | Optimización |
|------|--------------|-------------|
| Feed global | Transients WP (TTL variable) | Mantener. Añadir invalidación selectiva por evento |
| Feed personalizado | Sin cache | Cache Redis/Transient por user_id + hash de filtros, TTL 30s |
| Counters dashboard | Sin cache | Materializar diariamente o cache 5min |
| Perfil usuario | Sin cache | Transient por user_id, TTL 2min, invalidar en follow/unfollow |

---

## Parte 5: Prioridades de Implementación

### Sprint 1 — Hardcode Crítico (estimado: 2-3 horas)
1. [ ] Generar Enums faltantes: `PublicacionesEnums`, `ReportesEnums`, `MensajesEnums`, `ComentariosEnums`
2. [ ] Migrar PipelineAudio.php columnasPermitidas → constantes `SamplesCols::`
3. [ ] Migrar ConstructorSenales.php claves JSONB → variables desde constantes
4. [ ] Resolver discrepancia `'one shot'` vs `'oneshot'`
5. [ ] Crear constante `CARPETA_DEFAULT = 'Samples'` y unificar 5 ubicaciones

### Sprint 2 — Glory SQL (estimado: 1-2 horas)
1. [ ] Crear `FormEntriesSchema.php` + `NewsletterSchema.php`
2. [ ] Crear `AssetMeta` class con constantes compartidas para 5 archivos
3. [ ] Añadir `$wpdb->prepare()` a SHOW TABLES y CachePurger
4. [ ] Centralizar Stripe option names en constantes
5. [ ] SeoMetabox: importar constantes de MetaTagRenderer

### Sprint 3 — Índices y Performance (estimado: 1 hora)
1. [ ] Crear migración `v021_indices_optimizacion.sql` con índices nuevos
2. [ ] Verificar redundancia idx_samples_slug vs UNIQUE
3. [ ] Añadir expression indexes para JSONB frecuentes

### Sprint 4 — Counter Caches y Queries (estimado: 2-3 horas)
1. [ ] Crear triggers de sincronización de counters
2. [ ] Job de reconciliación periódica
3. [ ] Eliminar N+1 en Feed, Notificaciones, Comentarios
4. [ ] Cache de perfil/dashboard con transients

---

## Lecciones Aprendidas

- [Schema]: Las tablas MySQL de Glory (form_entries, newsletter) no tienen Schema y son legacy — necesitan migración al pattern
- [Enums]: PublicacionesEnums y ReportesEnums tienen gaps conocidos. El CLI schemaGenerate.mjs los genera automáticamente si el schema tiene `check` arrays
- [JSONB]: Los accesos a `metadata->>'genero'` son frecuentes y deberían tener expression index
- [Discrepancia]: `'one shot'` (con espacio) en código PHP vs `'oneshot'` (sin espacio) en CHECK constraint del schema — potencial bug silencioso
- [Prepare]: Glory FormController y NewsletterController usan SQL directo sin prepare() — riesgo bajo pero mala práctica
- [Meta keys]: `_glory_asset_source` y `_glory_asset_requested` se repiten en 5 archivos (~20 veces) — extraer a constante central
- [Counters]: total_likes/total_descargas se actualizan manualmente en código — propenso a drift sin triggers
