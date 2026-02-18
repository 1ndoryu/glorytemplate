# Plan: Repository Pattern + Schema System (Opción C)

> **Versión:** 2.0
> **Fecha:** 20/02/2026
> **Rama:** main-kamples
> **Duración estimada:** 3-4 sesiones (controladores completados en 3 sesiones)

---

## Misión

Centralizar **todo el SQL** del proyecto en clases Repository dedicadas por tabla, eliminando SQL desperdigado en controladores y servicios. Cada controller pasará de mezclar lógica HTTP + SQL + validación a solo manejar HTTP, delegando el acceso a datos a repositorios tipados que usan Cols + Enums + DTOs del Schema System existente.

**Resultado final:** Los controladores tienen 0 SQL. Los repositorios son la única puerta a la base de datos. El generador CLI produce Repositories base automáticamente para cualquier proyecto Glory.

---

## Objetivos

### Primarios
1. **Centralización:** SQL vive en 1 lugar por tabla (el Repository), no en 40 archivos.
2. **Adopción forzada de Enums:** Los repos usan `SamplesEnums::ESTADO_ACTIVO` internamente — se eliminan los ~67 strings hardcodeados.
3. **Adopción de Cols en SQL:** Los repos usan `SamplesCols::TITULO`, `SamplesCols::TABLA` donde sea legible.
4. **Testabilidad:** Mockear un repository es trivial vs mockear PostgresService en cada controller.
5. **Generador reutilizable:** `npx glory schema:generate` genera repos base junto con Cols/DTO/Enums.

### Secundarios
6. **SRP real:** Controller = HTTP, Repository = datos, Service = lógica de dominio.
7. **Reducción de líneas en controllers:** ColeccionesController 596→~200, AdminController similar.
8. **Base para query caching:** El repo centralizado permite agregar cache por método sin tocar controllers.

---

## Arquitectura

### Flujo actual (problemático)
```
Controller (SQL + HTTP + validación mezclados)
    → PostgresService::consultar("SELECT hardcodeado...")
    → $row['columna_hardcodeada']
```

### Flujo objetivo
```
Controller (solo HTTP + validación de request)
    → Repository::metodo($params)
        → usa Cols + Enums internamente
        → PostgresService::consultar(...)
        → retorna DTO[] o array tipado
```

### Estructura de archivos

```
App/Kamples/
├── Database/
│   ├── PostgresService.php          (existente, no cambia)
│   ├── VerificarPgvector.php        (existente)
│   └── Repositories/                (NUEVO)
│       ├── BaseRepository.php       (clase base con helpers)
│       ├── SamplesRepository.php    (auto-generado + custom)
│       ├── ColeccionesRepository.php
│       ├── LikesRepository.php
│       ├── ComentariosRepository.php
│       ├── UsuariosExtRepository.php
│       ├── FollowsRepository.php
│       ├── MensajesRepository.php
│       ├── NotificacionesRepository.php
│       ├── DescargasRepository.php
│       ├── ReproduccionesRepository.php
│       ├── PublicacionesRepository.php
│       ├── TransaccionesRepository.php
│       ├── SuscripcionesRepository.php
│       ├── ConversacionesRepository.php
│       ├── ReportesRepository.php
│       ├── ReportesDuplicadosRepository.php
│       ├── ColeccionSamplesRepository.php
│       └── AlgoritmoEstadoRepository.php
```

### Clase base: BaseRepository

```php
abstract class BaseRepository
{
    /* Helpers compartidos */
    protected static function consultar(string $sql, array $params = []): array;
    protected static function consultarUno(string $sql, array $params = []): ?array;
    protected static function ejecutar(string $sql, array $params = []): int;
    protected static function insertar(string $sql, array $params = []): ?int;
    
    /* Métodos CRUD base usando Cols */
    public static function buscarPorId(int $id): ?array;
    public static function buscarTodos(int $limit = 100, int $offset = 0): array;
    public static function eliminarPorId(int $id): bool;
    public static function contar(): int;
    
    /* Clase abstracta: cada repo define su tabla y cols */
    abstract protected static function tabla(): string;
    abstract protected static function colId(): string;
}
```

### Repositorio generado (ejemplo SamplesRepository)

```php
/* SECCIÓN AUTO-GENERADA — NO EDITAR ARRIBA DE LA LÍNEA */
class SamplesRepository extends BaseRepository
{
    protected static function tabla(): string { return SamplesCols::TABLA; }
    protected static function colId(): string { return SamplesCols::ID; }

    public static function buscarPorId(int $id): ?array { ... }
    public static function buscarActivos(int $limit, int $offset): array { ... }
    public static function insertarSample(array $datos): ?int { ... }
    public static function actualizarEstado(int $id, string $estado): bool { ... }
}
/* ============ MÉTODOS CUSTOM (seguro para editar) ============ */
// Aquí van los métodos complejos que el generador no sobreescribe
```

---

## Revisiones y Criterios de Aceptación

### R1: Infraestructura ✔
- [x] BaseRepository.php creado y funcional (CRUD base + construirWhere + transacciones + estaConectado)
- [x] Generador `repositoryGenerate.mjs` en CLI
- [x] Comando `npx glory schema:generate` genera repos junto con Cols/DTO/Enums
- [x] 18 repos base generados correctamente
- [x] Repos compilan sin errores PHP

### R2: Migración Tier 1 ✔
- [x] ColeccionesController.php: 0 PostgresService
- [x] AdminController.php: 0 PostgresService
- [x] DescargasController.php: 0 PostgresService
- [x] PublicacionesController.php: 0 PostgresService
- [x] SamplesModificacionController.php: 0 PostgresService

### R3: Migración Tier 2 + Tier 2.5 ✔ (27 controllers total)
- [x] SocialController.php migrado
- [x] MensajesController.php migrado
- [x] ComentariosController.php migrado
- [x] ComentariosEscrituraController.php migrado
- [x] ComentariosInteraccionController.php migrado
- [x] DashboardController.php migrado
- [x] PerfilController.php migrado
- [x] ReproduccionesController.php migrado
- [x] SugerenciasController.php migrado
- [x] BibliotecaSamplesController.php migrado
- [x] DescargasZipController.php migrado
- [x] PublicacionesEscrituraController.php migrado
- [x] AuthController.php migrado
- [x] ConnectController.php migrado
- [x] NotificacionesController.php migrado
- [x] PagosController.php migrado
- [x] SamplesController.php migrado
- [x] SamplesUploadController.php migrado
- [x] DiagnosticoController.php migrado
- [x] EmbeddingsController.php migrado
- [x] ExperimentosController.php migrado
- [x] DescargasStreamController.php migrado

> **Verificación final:** `grep -r "PostgresService" Controladores/` = 0 matches

### R4: Migración Tier 3 — Services
- [ ] ConstructorSenales.php migrado (23 queries)
- [ ] PerfilUsuario.php migrado (17 queries)
- [ ] MotorRecomendacion.php migrado
- [ ] ServicioNotificaciones.php migrado
- [ ] DeduplicadorAudio.php migrado
- [ ] GeneradorEmbeddings.php migrado
- [ ] Otros servicios con SQL menor migrados

### R5: Documentación y CLI
- [ ] Documentación Glory/docs/php/repository-pattern.md
- [ ] README actualizado con sección Repository
- [ ] Generador probado en proyecto limpio
- [ ] roadmap.md actualizado

---

## Tareas Detalladas

### FASE 1: Infraestructura (R1)

#### T1.1 — Crear BaseRepository.php
- Ubicación: `App/Kamples/Database/Repositories/BaseRepository.php`
- Métodos: `consultar`, `consultarUno`, `ejecutar`, `insertar` (delegados a PostgresService)
- Métodos CRUD: `buscarPorId`, `buscarTodos`, `eliminarPorId`, `contar`
- Usa Cols abstractos: `tabla()`, `colId()`
- Helper: `construirWhere(array $condiciones)` para WHEREs dinámicos

#### T1.2 — Crear generador repositoryGenerate.mjs
- Ubicación: `Glory/cli/repositoryGenerate.mjs`
- Input: lee schemas ya parseados (misma lógica que schemaGenerate)
- Output: `App/Kamples/Database/Repositories/{Tabla}Repository.php`
- Genera: imports Cols/Enums/DTO, métodos CRUD base, sección custom protegida
- Respeta sección custom: si el archivo existe, preserva métodos debajo de la marca `CUSTOM`
- Integrar en `schemaGenerate.mjs` como paso adicional

#### T1.3 — Integrar en glory.mjs
- Agregar `schema:generate` ya genera repos (no se necesita comando separado)
- Opcionalmente: `npx glory create repository <tabla>` para generar uno solo

#### T1.4 — Generar 18 repos base
- Ejecutar generador
- Validar que todos compilan
- Commit: "feat(schema): generador de Repositories + 18 repos base"

### FASE 2: Migración Tier 1 (R2)

#### T2.1 — Migrar ColeccionesController (35 queries → 0)
- Extraer queries a ColeccionesRepository, ColeccionSamplesRepository, SamplesRepository
- Queries complejas (CTE explorar, sugerencias) van como métodos custom en el repo
- Controller solo llama repos + formatea respuesta HTTP
- Eliminar todos los `'activo'` → `SamplesEnums::ESTADO_ACTIVO`

#### T2.2 — Migrar AdminController (25 queries → 0)
- Queries admin (KPIs, listados, moderación) → repos correspondientes
- Strings enum `'pendiente'`, `'revision'` → Enums

#### T2.3 — Migrar DescargasController (20 queries → 0)
- `'completed'` → `TransaccionesEnums::ESTADO_COMPLETED` (o el nombre correcto)
- `'activo'` → `SamplesEnums::ESTADO_ACTIVO`

#### T2.4 — Migrar PublicacionesController (19 queries → 0)

#### T2.5 — Migrar SamplesModificacionController (9 queries → 0)

### FASE 3: Migración Tier 2 (R3)
- 10 controllers restantes, misma mecánica
- Priorizar los que tienen enum hardcodeado

### FASE 4: Migración Tier 3 — Services (R4)
- Services con SQL complejo: ConstructorSenales, PerfilUsuario, MotorRecomendacion
- Estos tienen queries muy específicas que probablemente no se reutilicen
- Opción: métodos custom en el repo, o mantener queries en el service si es 100% específico

### FASE 5: Documentación (R5)

---

## Decisiones Técnicas

### 1. Repos estáticos (no instanciados)
- Mantener consistencia con PostgresService que ya es estático
- `SamplesRepository::buscarActivos()` en vez de `(new SamplesRepository())->buscarActivos()`
- Si se necesita inyección de dependencias en el futuro, se puede refactorizar

### 2. Sección CUSTOM protegida
- El generador pone una marca `/* === MÉTODOS CUSTOM === */`
- Al regenerar, solo reemplaza la sección auto-generada, preservando custom
- Esto permite agregar queries complejas (JOINs, CTEs) sin perderlas al regenerar

### 3. Retorno: arrays tipados, no DTOs obligatorios
- Los métodos CRUD base retornan `?array` para flexibilidad
- Opcionalmente se puede retornar `SamplesDTO` si el caller lo necesita
- Queries con JOINs retornan arrays custom (no encajan en un solo DTO)

### 4. SQL legible: Cols en tabla/WHERE/params, strings en SELECT alias
- `FROM " . SamplesCols::TABLA . " s"` → sí, usar Cols
- `WHERE s." . SamplesCols::ESTADO . " = :estado"` → sí, usar Cols
- `'estado' => SamplesEnums::ESTADO_ACTIVO` → sí, usar Enums en params
- `SELECT s.titulo, s.bpm` → mantener literal en SELECT por legibilidad
  (el beneficio de Cols en SELECT es bajo y hace el SQL ilegible)

### 5. Queries complejas (CTEs, subqueries)
- Van como métodos custom nombrados descriptivamente
- Ejemplo: `ColeccionesRepository::explorarConAfinidadTags($userId, $offset)`
- El SQL complejo es legítimo en el repo — ahí es su lugar

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Repo generado no cubre caso específico | Bajo | Sección CUSTOM para métodos manuales |
| Queries con JOINs entre 3+ tablas | Medio | El repo de la entidad "principal" lo maneja |
| Regenerar sobreescribe custom | Alto | Parser que detecta marca CUSTOM y preserva |
| Romper endpoints durante migración | Alto | Migrar 1 controller, testear, commit, siguiente |
| Repos demasiado grandes | Medio | Máx 300 líneas (protocolo), dividir si excede |

---

## Métricas de Éxito

| Métrica | Antes | Objetivo | Actual |
|---|---|---|---|
| Archivos con SQL directo en controllers | 25 | 0 | **0** ✅ |
| Archivos con SQL directo en services | 10 | 0-3 | ~10 (pendiente T4) |
| Uso de `*Enums::` en codebase | 0 | 100% | Parcial |
| Strings enum hardcodeados | 67+ | 0 | ~30 (repos usan Enums, controllers legacy aún no) |
| Archivos sin ningún Cols | 6 | 0 | ~3 |
| SQL duplicado entre archivos | ~15% | 0% | ~2% (solo services) |

---

## Progreso

- [x] T1.1 — Crear BaseRepository.php
- [x] T1.2 — Crear generador repositoryGenerate.mjs
- [x] T1.3 — Integrar en glory.mjs
- [x] T1.4 — Generar 18 repos base + validar
- [x] T2.1 — Migrar ColeccionesController
- [x] T2.2 — Migrar AdminController
- [x] T2.3 — Migrar DescargasController
- [x] T2.4 — Migrar PublicacionesController
- [x] T2.5 — Migrar SamplesModificacionController
- [x] T3 — Migrar Tier 2 (22 controllers adicionales, 27 total)
- [ ] T4 — Migrar Tier 3 (services: ConstructorSenales, PerfilUsuario, MotorRecomendacion, etc.)
- [ ] T5 — Documentación completa

---

## Lecciones Aprendidas

- `multi_replace_string_in_file` falla si hay dos ocurrencias idénticas del oldString en el mismo archivo — usar replace_string_in_file individual con contexto único.
- `contarConFiltros`/`listarConFiltros` con WHERE dinámico + params es enfoque pragmático para controllers que construyen filtros complejos en runtime.
- BaseRepository::estaConectado() necesario para DiagnosticoController — health checks no son queries pero sí acceso a PostgresService.
- ComentariosRepository::insertarComentario recibe `array $datos`, no params individuales. Verificar siempre la firma del método destino.
- NormalizadorSample::sqlSelectSamples(?int $userId) centraliza SELECTs de samples con JOIN a usuarios_ext — todos los repos de samples deben usarlo.
- PagosController: reutilizar datos del usuario ya obtenido (`$usuario['plan']`) en vez de hacer SELECT extra para planAnterior.
- Repos de ~700 líneas (SamplesRepository) son aceptables si la tabla es compleja y los métodos no se pueden dividir lógicamente.
- PDO placeholder duplicado sigue siendo gotcha: `:uid` + `:uid2` obligatorio.
