# PLAN DE ELIMINACIÓN DE HARDCODE Y HARDENING — CAP

> **Fecha:** 2026-02-19  
> **Objetivo:** Eliminar TODO string hardcodeado de BD, integrar Schema System de Glory, hardening de error handling  
> **Estimación:** 7 fases secuenciales

---

## RESUMEN EJECUTIVO

| Categoría                               | Hallazgos                                | Impacto                                                             |
| --------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Strings hardcodeados de columnas        | ~53 en 19 archivos PHP + 12 TSX          | Inconsistencia silenciosa si se renombra algo                       |
| Strings hardcodeados de enums           | ~20 en 14 archivos PHP + 3 TSX           | Discrepancia frontend/backend detectada (`pago_fallido` vs `trial`) |
| Nombres de tabla hardcodeados           | 38 instancias en 14 archivos             | Cambio de prefijo rompe todo                                        |
| Asignaturas duplicadas                  | 8 definiciones idénticas en 7 PHP + 1 TS | Fuente de bugs históricos (ya demostrado)                           |
| Queries sin `$wpdb->prepare()`          | 9 instancias                             | Viola defensa en profundidad                                        |
| Operaciones BD sin verificar resultado  | 35 HIGH                                  | Fallos silenciosos en operaciones financieras                       |
| Operaciones archivo/JSON sin protección | 8 MEDIUM                                 | Datos corruptos o perdidos sin diagnóstico                          |
| Schema System Glory                     | NO integrado (0 Cols, 0 Enums, 0 DTOs)   | Todo el tipado end-to-end inutilizado                               |

---

## FASE 1: CREAR SCHEMAS GLORY PARA LAS 7 TABLAS CAP (Base de todo)

### Contexto

El Schema System de Glory genera automáticamente `{Tabla}Cols.php`, `{Tabla}Enums.php`, `{Tabla}DTO.php` y `schema.ts` desde archivos `*Schema.php` que extienden `TableSchema`. Actualmente el CAP usa `CapSchema.php` que es DDL raw (`dbDelta`), no un `TableSchema` Glory. Hay que crear 7 schemas nuevos.

### Tareas

#### 1.1 Crear directorio `App/Config/Schema/`

```
App/Config/Schema/
  CapCentrosSchema.php
  CapAlumnosSchema.php
  CapDisponibilidadSchema.php
  CapClasesSchema.php
  CapAsistenciaSchema.php
  CapConfiguracionSchema.php
  CapSuscripcionesSchema.php
```

#### 1.2 Crear cada Schema extendiendo `Glory\Contracts\TableSchema`

**Ejemplo para `CapAlumnosSchema.php`:**

```php
namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CapAlumnosSchema extends TableSchema
{
    public function tabla(): string { return 'cap_alumnos'; }

    public function columnas(): array
    {
        return [
            'id'                  => ['tipo' => 'int', 'pk' => true],
            'centro_id'           => ['tipo' => 'int', 'ref' => 'cap_centros(id)'],
            'nombre'              => ['tipo' => 'string', 'max' => 200],
            'email'               => ['tipo' => 'string', 'max' => 100, 'default' => ''],
            'telefono'            => ['tipo' => 'string', 'max' => 50, 'default' => ''],
            'dni'                 => ['tipo' => 'string', 'max' => 20, 'default' => ''],
            'horas_completadas'   => ['tipo' => 'decimal', 'default' => 0],
            'estado'              => ['tipo' => 'string', 'check' => ['activo', 'completado', 'pausado'], 'default' => 'activo'],
            'created_at'          => ['tipo' => 'datetime'],
            'updated_at'          => ['tipo' => 'datetime'],
        ];
    }
}
```

**Tablas con `check` constraints (generarán Enums automáticos):**

| Tabla                | Columna  | Valores `check`                                     |
| -------------------- | -------- | --------------------------------------------------- |
| `cap_alumnos`        | `estado` | `activo`, `completado`, `pausado`                   |
| `cap_suscripciones`  | `estado` | `activa`, `expirada`, `cancelada`, `pago_fallido`   |
| `cap_disponibilidad` | `dia`    | `lunes`, `martes`, `miercoles`, `jueves`, `viernes` |

#### 1.3 Verificar/configurar autoload PSR-4 para `App\Config\Schema`

Verificar `composer.json` y/o `functions.php` para que el namespace sea autoloadable.

#### 1.4 Ejecutar `npx glory schema:generate`

Esto genera:

```
App/Config/Schema/_generated/
  CapCentrosCols.php      — TABLA, ID, USER_ID, NOMBRE, etc.
  CapAlumnosCols.php      — TABLA, ID, CENTRO_ID, NOMBRE, ESTADO, etc.
  CapAlumnosEnums.php     — ESTADO_ACTIVO, ESTADO_COMPLETADO, ESTADO_PAUSADO
  CapAlumnosDTO.php       — desdeRow(), aArray(), aArrayDB()
  CapDisponibilidadCols.php
  CapDisponibilidadEnums.php — DIA_LUNES, DIA_MARTES, etc.
  CapClasesCols.php
  CapAsistenciaCols.php
  CapConfiguracionCols.php
  CapSuscripcionesCols.php
  CapSuscripcionesEnums.php — ESTADO_ACTIVA, ESTADO_EXPIRADA, etc.

App/React/types/_generated/
  schema.ts               — ICapAlumnos, ICapClases, etc. + Cols + Enums TS
```

#### 1.5 Crear constantes de asignaturas como schema especial

Las 8 asignaturas CAP no son una tabla de BD pero son un "schema virtual" que aparece hardcodeado en 8 archivos. Opciones:

**Opción A (recomendada): Clase de constantes centralizada**
Crear `App/Config/Schema/CapAsignaturasConstants.php` con:

- Los 8 códigos canónicos como constantes
- El mapa de alias (para normalización)
- Las horas requeridas por asignatura
- Los nombres legibles en español

Esto reemplaza las 8 definiciones duplicadas en un solo punto.

**Opción B: Schema con tabla virtual**
Un `CapAsignaturasSchema` con `check` que el generador convertiría en enums. Menos natural porque no hay tabla real.

#### 1.6 Equivalente TypeScript

El `schema.ts` generado incluye los enum values. Pero las asignaturas necesitan un mirror manual o una extensión del generador para exportar `CapAsignaturasConstants` a TS. Evaluar si extender `schemaGenerate.mjs` o crear archivo TS manualmente una vez y mantenerlo sincronizado.

### Entregable Fase 1

- 7 archivos Schema en `App/Config/Schema/`
- Archivos generados en `_generated/` (Cols + Enums + DTOs + schema.ts)
- 1 archivo de constantes de asignaturas (`CapAsignaturasConstants.php`)
- Autoload configurado y verificado
- **Sin cambios en código existente todavía** — solo se crean las nuevas estructuras

---

## FASE 2: MIGRAR MODELOS A SCHEMA SYSTEM (Capa de datos)

### Contexto

Los modelos (`Alumno.php`, `Clase.php`, `Configuracion.php`) contienen la mayor concentración de hardcode. Son el punto donde las constantes generadas tienen mayor impacto.

### 2.1 `Alumno.php` (~15 columnas hardcodeadas, 3 enums)

**Antes:**

```php
$alumno['estado'] = 'activo';
$wpdb->update($tabla, ['horas_completadas' => $horas], ['id' => $id]);
```

**Después:**

```php
use App\Config\Schema\_generated\CapAlumnosCols;
use App\Config\Schema\_generated\CapAlumnosEnums;

$alumno[CapAlumnosCols::ESTADO] = CapAlumnosEnums::ESTADO_ACTIVO;
$wpdb->update(
    $wpdb->prefix . CapAlumnosCols::TABLA,
    [CapAlumnosCols::HORAS_COMPLETADAS => $horas],
    [CapAlumnosCols::ID => $id]
);
```

**Cambios concretos en Alumno.php:**
| Línea aprox. | Hardcode actual | Reemplazo |
|---|---|---|
| L135 | `$wpdb->prefix . 'cap_alumnos'` | `$wpdb->prefix . CapAlumnosCols::TABLA` |
| L154 | `['nombre', 'email', 'created_at']` (whitelist orden) | `[CapAlumnosCols::NOMBRE, CapAlumnosCols::EMAIL, CapAlumnosCols::CREATED_AT]` |
| L249 | `'centro_id'` en INSERT | `CapAlumnosCols::CENTRO_ID` |
| L280 | `['activo', 'completado', 'pausado']` validación | `CapAlumnosEnums::valoresDeEstado()` o constantes individuales |
| L299 | `'horas_completadas'` en UPDATE | `CapAlumnosCols::HORAS_COMPLETADAS` |
| L56 | `ASIGNATURAS_CANONICAS` const | Migrar a `CapAsignaturasConstants` |
| L65 | `ASIGNATURA_ALIAS` const | Migrar a `CapAsignaturasConstants` |

**Además — extraer `ASIGNATURAS_CANONICAS` y `ASIGNATURA_ALIAS` a `CapAsignaturasConstants`** y que `Alumno.php` los importe desde ahí. Esto elimina la definición duplicada más peligrosa del proyecto.

### 2.2 `Clase.php` (~8 columnas hardcodeadas)

| Línea aprox. | Hardcode actual                                 | Reemplazo                                  |
| ------------ | ----------------------------------------------- | ------------------------------------------ |
| L16          | `$wpdb->prefix . 'cap_clases'`                  | `$wpdb->prefix . CapClasesCols::TABLA`     |
| L17          | `$wpdb->prefix . 'cap_asistencia'`              | `$wpdb->prefix . CapAsistenciaCols::TABLA` |
| L28          | `$wpdb->prefix . 'cap_alumnos'`                 | `$wpdb->prefix . CapAlumnosCols::TABLA`    |
| L32-41       | `'centro_id'`, `'fecha'`, `'hora_inicio'`, etc. | Constantes de `CapClasesCols`              |
| L58-59       | `'clase_id'`, `'alumno_id'`, `'asistio'`        | Constantes de `CapAsistenciaCols`          |

### 2.3 `Configuracion.php` (~12 columnas hardcodeadas + tablas)

| Línea aprox. | Hardcode actual                                       | Reemplazo                                          |
| ------------ | ----------------------------------------------------- | -------------------------------------------------- |
| L18          | `$wpdb->prefix . 'cap_centros'`                       | `$wpdb->prefix . CapCentrosCols::TABLA`            |
| L19          | `$wpdb->prefix . 'cap_configuracion'`                 | `$wpdb->prefix . CapConfiguracionCols::TABLA`      |
| L55-67       | `'timezone'`, `'hora_inicio_manana'`, etc. (defaults) | Constantes de `CapConfiguracionCols`               |
| L134         | `'nombre'`, `'direccion'`, etc. (UPDATE centros)      | Constantes de `CapCentrosCols`                     |
| L190         | `['lunes', ..., 'domingo']` validación                | `CapDisponibilidadEnums::todosDias()` o constantes |

### Entregable Fase 2

- 3 modelos refactorizados usando `*Cols` y `*Enums`
- Asignaturas centralizadas en `CapAsignaturasConstants`
- 0 strings hardcodeados de columnas/tablas/enums en modelos
- Tests: `php -l` para cada archivo modificado + verificar 0 errores de compilación

---

## FASE 3: MIGRAR SERVICIOS A SCHEMA SYSTEM (Lógica de negocio) ✅ COMPLETADA

> **Completada:** 2026-02-20 — AG-SCH
> 
> Todos los 11 servicios migrados. 0 strings hardcodeados de columnas/tablas/enums restantes en capa de servicios.
> Decisión sobre días: se usó opción A (CapDisponibilidadEnums::DIA_*) con mapeo inline en CalendarDataLoader.
> CalendarEngine::ASIGNATURAS ahora delega a CapAsignaturasConstants::ASIGNATURAS.
> ReportePlanAlumnoHtmlBuilder y ReporteControlHorasHtmlBuilder delegaron ASIGNATURAS/HORAS_REQUERIDAS a CapAsignaturasConstants.
> CapBootstrap.php no requirió cambios (no tiene hardcode de BD).

### Archivos migrados (10 de 11 con cambios, 1 sin hardcode)

| Archivo                              | Cols hc. | Tablas hc. | Enums hc.         | Asignaturas hc. |
| ------------------------------------ | -------- | ---------- | ----------------- | --------------- |
| `CalendarPersistenceService.php`     | ~~8~~ 0  | ~~2~~ 0    | 0                 | 0               |
| `CalendarDataLoader.php`             | ~~6~~ 0  | ~~3~~ 0    | ~~5~~ 0 (días)    | 0               |
| `CalendarSlotsBuilder.php`           | ~~6~~ 0  | 0          | ~~7~~ 0 (días)    | 0               |
| `CalendarEngine.php`                 | ~~2~~ 0  | 0          | 0                 | ~~8~~ 0         |
| `CalendarEngineConfigProvider.php`   | ~~11~~ 0 | ~~1~~ 0    | 0                 | 0               |
| `ReporteService.php`                 | ~~4~~ 0  | ~~4~~ 0    | ~~5~~ 0 (días)    | 0               |
| `ReportePlanAlumnoHtmlBuilder.php`   | 0        | 0          | 0                 | ~~8~~ 0         |
| `ReporteControlHorasHtmlBuilder.php` | 0        | 0          | ~~5~~ 0 (días)    | ~~8~~ 0         |
| `StripeService.php`                  | ~~7~~ 0  | ~~6~~ 0    | ~~5~~ 0 (suscr.)  | 0               |
| `CapService.php`                     | ~~6~~ 0  | ~~1~~ 0    | ~~1~~ 0           | 0               |
| `CapBootstrap.php`                   | 0        | 0          | 0                 | 0 (sin cambios) |

### 3.1 Prioridad 1: `StripeService.php` (operaciones financieras)

- Reemplazar enums de suscripción: `'activa'` → `CapSuscripcionesEnums::ESTADO_ACTIVA`
- Reemplazar columnas: `'stripe_customer_id'` → `CapSuscripcionesCols::STRIPE_CUSTOMER_ID`
- Reemplazar tabla: `$wpdb->prefix . 'cap_suscripciones'` → `$wpdb->prefix . CapSuscripcionesCols::TABLA`

### 3.2 Prioridad 2: Calendar Services (motor de generación)

- `CalendarEngine.php`: migrar `ASIGNATURAS` const a `CapAsignaturasConstants::ASIGNATURAS`
- `CalendarPersistenceService.php`: migrar columnas de `cap_clases` y `cap_asistencia`
- `CalendarDataLoader.php`: migrar constante `DIAS_A_NUMERO` a `CapDisponibilidadEnums::diasANumero()` o similar
- `CalendarSlotsBuilder.php`: migrar mapeo de días
- `CalendarEngineConfigProvider.php`: migrar columnas de configuración

### 3.3 Prioridad 3: Reportes

- `ReportePlanAlumnoHtmlBuilder.php`: migrar asignaturas + horas requeridas
- `ReporteControlHorasHtmlBuilder.php`: migrar asignaturas + días
- `ReporteService.php`: migrar tablas y columnas

### 3.4 Días de la semana — evaluar mejor ubicación

Los días (`lunes`, `martes`, etc.) aparecen en ~7 archivos. Opciones:

- **A** Ponerlos como `check` en `CapDisponibilidadSchema` (columna `dia`) — genera `CapDisponibilidadEnums::DIA_LUNES`, etc.
- **B** Crear `CapDiasConstants.php` con mapeos adicionales (día→número, día→label) que van más allá del enum.
- **Recomendación:** Opción A para los valores de BD + helper estático en la clase de constantes para los mapeos derivados (`diasANumero()`, `diasConLabel()`).

### Entregable Fase 3

- Todos los servicios usan constantes generadas
- `CalendarEngine::ASIGNATURAS` referencia a `CapAsignaturasConstants` (no duplica)
- 0 strings de columnas/tablas/enums en servicios
- Mapeo de días centralizado

---

## FASE 4: MIGRAR API ENDPOINTS A SCHEMA SYSTEM

### Archivos a migrar

| Archivo                           | Cols hc. | Tablas hc. | Enums hc.       |
| --------------------------------- | -------- | ---------- | --------------- |
| `CapRegistroEndpoints.php`        | ~6       | 3          | 1 (`'activa'`)  |
| `CapAlumnosEndpoints.php`         | ~3       | 0          | 0               |
| `CapAlumnosProgresoEndpoints.php` | ~4       | 2          | 8 (asignaturas) |
| `CapConfigEndpoints.php`          | ~2       | 1          | 0               |
| `CapClasesGestionEndpoints.php`   | ~4       | 2          | 0               |
| `CapClasesLimpiezaEndpoints.php`  | ~2       | 2          | 0               |
| `CapDisponibilidadEndpoints.php`  | ~4       | 1          | 5 (días)        |
| `CapDemoEndpoints.php`            | 0        | 0          | 0               |
| `CapStripeEndpoints.php`          | ~2       | 1          | 0               |
| `CapReportesEndpoints.php`        | 0        | 0          | 0               |

### 4.1 `CapSeeder.php` (concentración extrema de hardcode)

- ~20 columnas hardcodeadas
- 3 definiciones de enums
- 1 definición completa de asignaturas (la 3ra copia)
- 5 queries sin `$wpdb->prepare()`
- Migrar completamente a constantes del schema

### Entregable Fase 4

- Todos los endpoints usan constantes generadas
- CapSeeder completamente migrado
- 0 strings de BD en capa API

---

## FASE 5: MIGRAR FRONTEND (TypeScript/React)

### Contexto

El `schema.ts` generado en Fase 1 exporta interfaces y constantes TS. El frontend tiene tipos manuales en `types/index.ts` y constantes en `cap-constants.ts` que deben sincronizarse.

### 5.1 Reemplazar tipos manuales con generados

**Antes (`types/index.ts`):**

```typescript
interface Alumno {
    id: number;
    nombre: string;
    estado: 'activo' | 'completado' | 'pausado';
    // ...
}
```

**Después:**

```typescript
import {ICapAlumnos, CapAlumnosEnums} from '@/types/_generated/schema';
// O usar ICapAlumnos directamente si el schema cubre todos los campos
```

### 5.2 Corregir discrepancia detectada de suscripciones

| Backend schema   | Frontend actual | Acción                                             |
| ---------------- | --------------- | -------------------------------------------------- |
| `'activa'`       | `'activa'`      | OK                                                 |
| `'expirada'`     | `'expirada'`    | OK                                                 |
| `'cancelada'`    | `'cancelada'`   | OK                                                 |
| `'pago_fallido'` | **ausente**     | Agregar al tipo TS                                 |
| ausente          | `'trial'`       | Evaluar: agregar al schema o eliminar del frontend |
| ausente          | `'grace'`       | Evaluar: agregar al schema o eliminar del frontend |

### 5.3 Migrar constantes de asignaturas en `cap-constants.ts`

- Reemplazar `ASIGNATURA_CODES` manual con importación de `schema.ts`
- O crear mirror automático en el generador

### 5.4 Reemplazar accesos a propiedades hardcodeados

Esto es más sutil — propiedades como `alumno.estado === 'activo'` deberían usar:

```typescript
import {CapAlumnosEnums} from '@/types/_generated/schema';
alumno.estado === CapAlumnosEnums.ESTADO_ACTIVO;
```

### Entregable Fase 5

- `types/index.ts` sincronizado con schema generado
- `cap-constants.ts` usando constantes generadas
- Discrepancia `pago_fallido`/`trial`/`grace` resuelta
- Comparaciones de enum en componentes usando constantes

---

## FASE 6: HARDENING DE ERROR HANDLING (Try-Catch + Verificación)

### Contexto

La auditoría encontró 35 hallazgos HIGH y 8 MEDIUM de error handling deficiente. Todos los controllers REST ya tienen `callbackSeguro()` con try-catch global, pero las capas internas (modelos, servicios) fallan silenciosamente en operaciones de BD.

### 6.1 CRÍTICO: `StripeService.php` — 11 hallazgos (operaciones financieras)

| ID        | Método           | Acción                                                                               |
| --------- | ---------------- | ------------------------------------------------------------------------------------ |
| H-1..H-6  | Webhook handlers | Verificar retorno de `$wpdb->update()`/`$wpdb->insert()`, log + excepción si `false` |
| H-7..H-11 | Mismos métodos   | Cambiar retorno de `void` a `bool` para que el caller pueda verificar                |
| M-3       | `encriptar()`    | Verificar `openssl_encrypt() !== false`                                              |
| M-4       | `desencriptar()` | Verificar `base64_decode() !== false`                                                |

### 6.2 HIGH: `Alumno.php` — 7 hallazgos

| ID         | Método                  | Acción                                                                                           |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| H-13, H-14 | `eliminar()`            | Verificar retorno de `delete()`, invertir orden (primero hijos, luego padre), roll back si falla |
| H-15, H-16 | `recalcularHoras*()`    | Verificar retorno de `update()`/`query()`                                                        |
| H-17..H-19 | `recalcularProgreso*()` | Cambiar retorno de `void` a `bool`                                                               |

### 6.3 HIGH: `CalendarPersistenceService.php` — 2 hallazgos

| ID   | Método                            | Acción                                                |
| ---- | --------------------------------- | ----------------------------------------------------- |
| H-24 | `crearClases()` DELETE previo     | Verificar retorno, abortar si falla antes de insertar |
| H-25 | `crearClases()` INSERT asistencia | Verificar retorno, log de IDs fallidos                |

### 6.4 HIGH: `Configuracion.php` — 3 hallazgos

| ID         | Método                           | Acción                                |
| ---------- | -------------------------------- | ------------------------------------- |
| H-21       | `crearCentro()` INSERT config    | Verificar retorno, lanzar excepción   |
| H-22, H-23 | `asegurarColumna*()` ALTER TABLE | Verificar retorno, log error si falla |

### 6.5 HIGH: `CapSeeder.php` — 8 hallazgos

| ID         | Acción                                          |
| ---------- | ----------------------------------------------- |
| H-26..H-30 | Verificar retorno de all `$wpdb->insert()`      |
| H-33..H-35 | Migrar a `$wpdb->prepare()` los DELETE con IN() |

### 6.6 HIGH: `CapClasesLimpiezaEndpoints.php` — 2 hallazgos

| ID         | Acción                                      |
| ---------- | ------------------------------------------- |
| H-31, H-32 | Migrar DELETE con IN() a `$wpdb->prepare()` |

### 6.7 HIGH: `CapService.php` y `Clase.php`

| ID   | Método                                   | Acción            |
| ---- | ---------------------------------------- | ----------------- |
| H-12 | `getCentroIdActual()` INSERT suscripción | Verificar retorno |
| H-20 | `Clase::eliminar()` DELETE asistencia    | Verificar retorno |

### 6.8 MEDIUM: Varios

| ID       | Archivo                    | Acción                                                                                        |
| -------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| M-1, M-2 | `Configuracion.php`        | Verificar `json_last_error()` después de `json_decode()`, verificar `json_encode() !== false` |
| M-5      | `CapRegistroEndpoints.php` | Log si `wp_mail()` retorna `false`                                                            |
| M-6      | `CapBootstrap.php`         | Envolver `crearInfraestructura()` en try-catch                                                |

### 6.9 Queries sin `$wpdb->prepare()` — Recopilación completa

| #   | Archivo                               | Línea                      | Fix                                         |
| --- | ------------------------------------- | -------------------------- | ------------------------------------------- |
| 1   | `CapSeeder.php` L179                  | DELETE asistencia IN()     | `$wpdb->prepare()` con placeholder generado |
| 2   | `CapSeeder.php` L186                  | DELETE disponibilidad IN() | ídem                                        |
| 3   | `CapSeeder.php` L189                  | DELETE alumnos IN()        | ídem                                        |
| 4   | `CapClasesLimpiezaEndpoints.php` L75  | DELETE asistencia IN()     | ídem                                        |
| 5   | `CapClasesLimpiezaEndpoints.php` L114 | DELETE asistencia IN()     | ídem                                        |
| 6-9 | `Configuracion.php` L217-225          | INFORMATION_SCHEMA + ALTER | `$wpdb->prepare()` donde aplique            |

**Patrón correcto para DELETE ... IN():**

```php
$placeholders = implode(',', array_fill(0, count($ids), '%d'));
$wpdb->query($wpdb->prepare(
    "DELETE FROM {$tabla} WHERE columna_id IN ({$placeholders})",
    ...$ids
));
```

### Entregable Fase 6

- 35 hallazgos HIGH corregidos
- 8 hallazgos MEDIUM corregidos
- 9 queries migradas a `$wpdb->prepare()`
- 5 métodos void cambiados a retornar `bool`
- Operaciones financieras con logging y verificación completa

---

## FASE 7: VALIDACIÓN, DOCUMENTACIÓN Y MANTENIMIENTO

### 7.1 Validación `npx glory schema:validate`

El CLI de Glory incluye un comando `schema:validate` que detecta strings hardcodeados en PHP que deberían usar constantes Cols. Ejecutar después de las fases 2-4 para verificar que no queda nada.

### 7.2 Verificar compilación

```bash
# PHP
find App/ -name "*.php" -exec php -l {} \;

# TypeScript
npx tsc --noEmit

# Build
npm run build
```

### 7.3 Documentación

- Actualizar `roadmap.md` con estado de cada fase
- Registrar en `AUDITORIA_COMPLETA.md` el cierre de hallazgos
- Agregar sección al README sobre el uso del Schema System en CAP

### 7.4 Regla de mantenimiento futuro

Definir en las instrucciones del proyecto:

> **Regla: Toda nueva referencia a columnas, tablas o valores enum de BD DEBE usar constantes del Schema System. PROHIBIDO agregar nuevos strings hardcodeados. Si la constante no existe, crearla primero en el Schema y regenerar.**

### 7.5 Extensión del generador (mejora futura)

Evaluar si extender `schemaGenerate.mjs` para:

- Generar DDL de MySQL desde los schemas (reemplazar `CapSchema.php` legacy)
- Generar helpers de mapeo (como `diasANumero()`) además de constantes puras
- Generar validadores automáticos para endpoints REST

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6 → FASE 7
  ↓         ↓         ↓         ↓         ↓         ↓         ↓
Schemas   Models   Services   API/Seed  Frontend  Hardening  Validación
(base)    (datos)  (lógica)   (capa)    (tipos)   (errores)  (cierre)
```

**Nota:** La Fase 6 (hardening) puede ejecutarse en paralelo con las fases 2-4 si hay múltiples agentes, ya que los cambios de try-catch no dependen de las constantes generadas.

---

## MÉTRICAS DE ÉXITO

| Métrica                                 | Antes             | Después          |
| --------------------------------------- | ----------------- | ---------------- |
| Strings de columna hardcodeados         | ~53               | 0                |
| Strings de enum hardcodeados            | ~20               | 0                |
| Strings de tabla hardcodeados           | 38                | 0                |
| Definiciones duplicadas de asignaturas  | 8                 | 1 (fuente única) |
| Queries sin `$wpdb->prepare()`          | 9                 | 0                |
| Operaciones BD sin verificar resultado  | 35                | 0                |
| Discrepancias frontend/backend de tipos | 1 (suscripciones) | 0                |
| Archivos generados (Cols/Enums/DTOs/TS) | 0                 | 22+              |

---

## RIESGOS Y MITIGACIONES

| Riesgo                                        | Probabilidad | Mitigación                                                   |
| --------------------------------------------- | ------------ | ------------------------------------------------------------ |
| Renombrar Cols rompe imports existentes       | Baja         | Los Cols se generan desde Schema, no se editan manualmente   |
| Error en generador de schemas                 | Media        | Verificar con `php -l` cada archivo generado                 |
| Autoload no reconoce `_generated/`            | Media        | Configurar PSR-4 explícitamente en `composer.json`           |
| Frontend no importa `schema.ts` correctamente | Media        | Verificar alias de path en `tsconfig.json`                   |
| `CapSchema.php` DDL diverge de Glory schemas  | Baja         | Mantener ambos sincronizados hasta poder eliminar DDL legacy |

---

## APÉNDICE A: INVENTARIO DE TODAS LAS COLUMNAS POR TABLA

### cap_centros (6 columnas)

`id`, `user_id`, `nombre`, `direccion`, `telefono`, `email`, `logo_url`, `created_at`, `updated_at`

### cap_alumnos (10 columnas)

`id`, `centro_id`, `nombre`, `email`, `telefono`, `dni`, `horas_completadas`, `estado`, `created_at`, `updated_at`

### cap_disponibilidad (6 columnas)

`id`, `alumno_id`, `dia`, `hora`, `disponible`, `created_at`, `updated_at`

### cap_clases (8 columnas)

`id`, `centro_id`, `fecha`, `hora_inicio`, `hora_fin`, `asignatura`, `duracion_minutos`, `bloqueada`, `created_at`

### cap_asistencia (5 columnas)

`id`, `clase_id`, `alumno_id`, `asistio`, `created_at`

### cap_configuracion (13 columnas)

`id`, `centro_id`, `timezone`, `hora_inicio_manana`, `hora_fin_manana`, `hora_inicio_tarde`, `hora_fin_tarde`, `viernes_especial`, `hora_fin_viernes`, `alumnos_max_clase`, `duracion_clase`, `duracion_descanso`, `horarios_semanales`, `created_at`, `updated_at`

### cap_suscripciones (8 columnas)

`id`, `centro_id`, `stripe_customer_id`, `stripe_subscription_id`, `estado`, `fecha_inicio`, `fecha_fin`, `created_at`, `updated_at`

---

## APÉNDICE B: DISCREPANCIAS DETECTADAS FRONTEND vs BACKEND

| Campo                  | Backend (DDL)                               | Frontend (TS type)                          | Estado                                                                              |
| ---------------------- | ------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `suscripciones.estado` | `activa, expirada, cancelada, pago_fallido` | `activa, expirada, cancelada, trial, grace` | DISCREPANCIA — `pago_fallido` falta en frontend, `trial` y `grace` no existen en BD |
| `alumnos.estado`       | `activo, completado, pausado`               | `activo, completado, pausado`               | OK                                                                                  |
| Asignaturas            | 8 códigos en `CalendarEngine`               | `ASIGNATURA_CODES` en `cap-constants.ts`    | OK (sincronizados) pero duplicados                                                  |

---

## APÉNDICE C: ARCHIVOS A MODIFICAR POR FASE

### Fase 1 (Crear — 8 archivos nuevos + 1 generación)

- `App/Config/Schema/CapCentrosSchema.php` (nuevo)
- `App/Config/Schema/CapAlumnosSchema.php` (nuevo)
- `App/Config/Schema/CapDisponibilidadSchema.php` (nuevo)
- `App/Config/Schema/CapClasesSchema.php` (nuevo)
- `App/Config/Schema/CapAsistenciaSchema.php` (nuevo)
- `App/Config/Schema/CapConfiguracionSchema.php` (nuevo)
- `App/Config/Schema/CapSuscripcionesSchema.php` (nuevo)
- `App/Config/Schema/CapAsignaturasConstants.php` (nuevo)

### Fase 2 (Modificar — 3 archivos)

- `App/Models/Alumno.php`
- `App/Models/Clase.php`
- `App/Models/Configuracion.php`

### Fase 3 (Modificar — 11 archivos)

- `App/Services/StripeService.php`
- `App/Services/CalendarEngine.php`
- `App/Services/CalendarPersistenceService.php`
- `App/Services/CalendarDataLoader.php`
- `App/Services/CalendarSlotsBuilder.php`
- `App/Services/CalendarEngineConfigProvider.php`
- `App/Services/ReporteService.php`
- `App/Services/ReportePlanAlumnoHtmlBuilder.php`
- `App/Services/ReporteControlHorasHtmlBuilder.php`
- `App/Services/CapService.php`
- `App/Services/CapBootstrap.php`

### Fase 4 (Modificar — 10 archivos)

- `App/Api/CapRegistroEndpoints.php`
- `App/Api/CapAlumnosEndpoints.php`
- `App/Api/CapAlumnosProgresoEndpoints.php`
- `App/Api/CapConfigEndpoints.php`
- `App/Api/CapClasesGestionEndpoints.php`
- `App/Api/CapClasesLimpiezaEndpoints.php`
- `App/Api/CapDisponibilidadEndpoints.php`
- `App/Api/CapStripeEndpoints.php`
- `App/Api/CapDemoEndpoints.php`
- `App/Database/CapSeeder.php`

### Fase 5 (Modificar — 6+ archivos TS/TSX)

- `App/React/islands/cap/types/index.ts`
- `App/React/islands/cap/constants/cap-constants.ts`
- `App/React/islands/cap/components/configuracion/PanelSuscripcion.tsx`
- `App/React/islands/cap/components/alumnos/TablaAlumnos.tsx`
- `App/React/islands/cap/components/alumnos/ModalProgresoAlumno.tsx`
-   - cualquier otro componente que compare enums

### Fase 6 (Modificar — 8 archivos)

- `App/Services/StripeService.php`
- `App/Models/Alumno.php`
- `App/Models/Clase.php`
- `App/Models/Configuracion.php`
- `App/Services/CalendarPersistenceService.php`
- `App/Services/CapService.php`
- `App/Services/CapBootstrap.php`
- `App/Api/CapClasesLimpiezaEndpoints.php`
- `App/Api/CapRegistroEndpoints.php`
- `App/Database/CapSeeder.php`

### Total: 8 archivos nuevos + ~35 archivos modificados + archivos generados automáticos
