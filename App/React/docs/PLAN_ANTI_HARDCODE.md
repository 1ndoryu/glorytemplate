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

## FASE 4: MIGRAR API ENDPOINTS A SCHEMA SYSTEM ✅ COMPLETADA

> **Completada:** 2026-02-20 — AG-SCH (commit ce9a868)
>
> 8 archivos migrados (7 API endpoints + CapSeeder), 3 sin cambios necesarios (sin SQL directo).
> CapSeeder fue la migración más pesada: se eliminó propiedad $prefix, array hardcodeado de asignaturas (3ra copia), y se reemplazaron ~33 insert keys + ~10 table refs + 2 enums + 5 dias.
> Los archivos sin cambios (CapAlumnosEndpoints, CapDemoEndpoints, CapReportesEndpoints) delegan a modelos/servicios ya migrados en Fases 2-3.

### Archivos migrados (8 de 11 con cambios, 3 sin hardcode)

| Archivo                           | Cols hc. | Tablas hc. | Enums hc.       |
| --------------------------------- | -------- | ---------- | --------------- |
| `CapRegistroEndpoints.php`        | ~~6~~ 0  | ~~3~~ 0    | ~~1~~ 0         |
| `CapAlumnosEndpoints.php`         | 0        | 0          | 0 (sin cambios) |
| `CapAlumnosProgresoEndpoints.php` | ~~4~~ 0  | ~~2~~ 0    | ~~8~~ 0         |
| `CapConfigEndpoints.php`          | ~~2~~ 0  | ~~1~~ 0    | 0               |
| `CapClasesGestionEndpoints.php`   | ~~4~~ 0  | ~~2~~ 0    | 0               |
| `CapClasesLimpiezaEndpoints.php`  | ~~2~~ 0  | ~~2~~ 0    | 0               |
| `CapDisponibilidadEndpoints.php`  | ~~4~~ 0  | ~~1~~ 0    | ~~5~~ 0         |
| `CapDemoEndpoints.php`            | 0        | 0          | 0 (sin cambios) |
| `CapStripeEndpoints.php`          | ~~2~~ 0  | ~~1~~ 0    | 0               |
| `CapReportesEndpoints.php`        | 0        | 0          | 0 (sin cambios) |
| `CapSeeder.php`                   | ~~20~~ 0 | ~~10~~ 0   | ~~7~~ 0         |

### Entregable Fase 4

- ✅ Todos los endpoints usan constantes generadas
- ✅ CapSeeder completamente migrado (eliminadas propiedades $prefix y $asignaturas)
- ✅ 0 strings de BD en capa API

---

## FASE 5: MIGRAR FRONTEND (TypeScript/React) ✅ COMPLETADA

> **Completada:** 2026-02-20 — AG-SCH (commit 2f489b0)
>
> 7 archivos migrados. Tipos EstadoAlumno, DiaSemana y EstadoSuscripcion ahora derivan del schema generado (schema.ts).
> Discrepancia resuelta: 'trial'/'grace' eliminados de EstadoSuscripcion (no existen en BD), 'pago_fallido' agregado.
> 'pendiente' eliminado de useConfiguracion.ts (no existe en BD).
> CODIGO_A_ID duplicado en ModalProgresoAlumno eliminado — delegado a getAsignatura() centralizado.
> PanelSuscripcion y TablaAlumnos usan CapSuscripcionesEnums/CapAlumnosEnums en vez de strings.
> DIAS_SEMANA en cap-constants.ts ahora usa CapDisponibilidadEnums.

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

## FASE 6: HARDENING DE ERROR HANDLING (Try-Catch + Verificación) — ✅ COMPLETADA

> **Commit:** 646d92b — `[AG-SCH] F6: Hardening error handling`  
> **Archivos modificados:** 10 PHP files  

### Resumen de cambios realizados

| Archivo | Cambios |
| ------- | ------- |
| `StripeService.php` | 5 webhook handlers: void→bool, verificar $wpdb->update/insert, log errores. encriptar: verificar openssl_encrypt. desencriptar: base64_decode strict mode |
| `Alumno.php` | eliminar(): verificar 2 deletes hijos. recalcularHorasCompletadas: verificar update. recalcularProgreso*: void→bool (3 métodos). recalcularProgresoEnLote: verificar query |
| `CalendarPersistenceService.php` | Verificar DELETE previo antes de insertar. Log INSERT asistencia fallidos |
| `Configuracion.php` | crearCentro: verificar INSERT config. asegurarColumna: $wpdb->prepare para INFORMATION_SCHEMA + verificar ALTER. validarDatos: json_last_error + json_encode check |
| `CapSeeder.php` | 3 DELETE IN()→$wpdb->prepare. crearAlumnos: verificar insert + continue si falla |
| `CapClasesLimpiezaEndpoints.php` | 2 DELETE IN()→$wpdb->prepare con placeholders |
| `CapService.php` | getCentroIdActual: verificar INSERT suscripción |
| `Clase.php` | eliminar: verificar DELETE asistencia antes de eliminar clase |
| `CapRegistroEndpoints.php` | wp_mail: verificar retorno + log si falla |
| `CapBootstrap.php` | crearInfraestructura: envolver en try-catch(\Throwable) |

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

## FASE 7: VALIDACIÓN, DOCUMENTACIÓN Y MANTENIMIENTO — ✅ COMPLETADA

> **Validación realizada:** PHP lint 0 errores en todo App/, grep 0 hardcode residual, 0 DELETE IN() sin prepare.  
> **TypeScript:** No aplica validación directa (proyecto usa esbuild via Glory framework, no tsc).

### 7.1 Validación de hardcode residual

- `php -l` en todos los archivos PHP de App/: **0 errores de sintaxis**.
- Búsqueda grep de nombres de tabla hardcodeados (`cap_alumnos`, `cap_clases`, etc.): todas las coincidencias están en Schemas (fuente de verdad), Repos generados (comentarios doc) o mensajes de log. **0 instancias en queries**.
- Búsqueda grep de `DELETE ... IN()` sin `$wpdb->prepare()`: **0 coincidencias**.

### 7.2 Verificar compilación

- **PHP lint:** ✅ Todos los archivos compilan sin errores.
- **TypeScript:** N/A — el proyecto usa esbuild via Glory framework, no tiene `tsc` como dependencia directa.
- **Build:** El build se ejecuta con `npm run build --prefix Glory/assets/react` (esbuild).

### 7.3 Documentación

- ✅ `roadmap.md` actualizado con estado de las 7 fases.
- ✅ `PLAN_ANTI_HARDCODE.md` actualizado con resultados de cada fase.
- [ ] Registrar en `AUDITORIA_COMPLETA.md` el cierre de hallazgos (opcional, documentación futura).
- [ ] Agregar sección al README sobre el uso del Schema System en CAP (opcional, documentación futura).

### 7.4 Regla de mantenimiento futuro

> **Regla: Toda nueva referencia a columnas, tablas o valores enum de BD DEBE usar constantes del Schema System (`*Cols`, `*Enums`). PROHIBIDO agregar nuevos strings hardcodeados. Si la constante no existe, crearla primero en el Schema y regenerar con `node Glory/cli/glory.mjs schema:generate`.**

Esta regla está incorporada en el protocolo de desarrollo del proyecto (`.github/instructions/test.instructions.md`, sección 7).

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
---

## FASE 8: AUDITORÍA PROFUNDA — FALLOS SILENCIOSOS, CÓDIGO MUERTO Y DEFICIENCIAS ESTRUCTURALES (NO DOCUMENTADO PREVIAMENTE)

> **Fecha de detección:** 2026-02-19  
> **Origen:** Revisión cruzada de TODO el codebase (endpoints, repositorios, modelos, servicios, frontend)  
> **Hallazgos nuevos:** 176 (64 endpoints + 60 repositorios/data + 79 modelos/servicios + 52 frontend) — deducidos los ya documentados en Fase 6  
> **Impacto:** Múltiples vectores de fallo silencioso, código muerto, pérdida de datos, y desincronización frontend/backend

---

### 8.0 BLOQUEANTE — `BaseRepository` NO EXISTE (CRÍTICO)

Los 7 repositorios en `App/Database/Repositories/` extienden `BaseRepository`, pero **esta clase no existe en ningún lugar del proyecto** (ni en App, ni en Glory, ni en vendor). Esto significa que:

- **Toda la capa de repositorios es código muerto**. Cualquier intento de instanciar un repositorio lanza `Fatal Error`.
- Los endpoints que sí funcionan lo hacen porque hacen queries `$wpdb` directas, saltando los repositorios.
- El generador CLI (`repositoryGenerate.mjs`) genera repos que extienden `BaseRepository` pero nunca se creó la clase base.

**Acción:** Crear `BaseRepository` en Glory o en App, o bien eliminar los repositorios y reescribir el acceso a datos. Los repos actuales también tienen imports muertos de DTOs (7 archivos) y hardcode de columnas en `ORDER BY`.

| Archivo | Hallazgo |
|---------|----------|
| Todos los 7 repos | `extends BaseRepository` — Fatal Error al instanciar |
| Todos los 7 repos | DTO importado pero nunca usado |
| Todos los 7 repos | `ORDER BY created_at DESC` con string literal en vez de constante Cols |

---

### 8.1 CERO TRANSACCIONES EN TODO EL CODEBASE (CRÍTICO)

**No existe ni una sola transacción** (`START TRANSACTION` / `COMMIT` / `ROLLBACK`) en todo el proyecto. Cada operación multi-tabla es vulnerable a inconsistencia de datos:

| Archivo | Operación | Riesgo |
|---------|-----------|--------|
| `CalendarPersistenceService.php` | DELETE clases existentes + INSERT nuevas + INSERT asistencias | **El más crítico**: si falla a mitad, semana con datos parciales |
| `Alumno.php:eliminar()` | DELETE disponibilidad + DELETE asistencia + DELETE alumno | Si falla el último, registros huérfanos |
| `Clase.php:eliminar()` | DELETE asistencias + DELETE clase | Asistencias borradas pero clase persiste |
| `Configuracion.php:crearCentro()` | INSERT centro + INSERT config default | Centro sin configuración |
| `CapService.php:getCentroIdActual()` | INSERT centro + INSERT suscripción trial | Centro sin suscripción = acceso bloqueado |
| `CapSeeder.php:seedAll()` | 4 inserts masivos secuenciales | Datos demo parciales irrecuperables |
| `CapSeeder.php:cleanAll()` | 4 DELETEs secuenciales | Datos borrados parcialmente |
| `CapRegistroEndpoints.php` | INSERT centro + INSERT config + INSERT suscripción + wp_create_user | Usuario creado sin centro, o centro sin suscripción |
| `CapDisponibilidadEndpoints.php` | DELETE all + INSERT loop | Disponibilidad borrada pero no reinsertada |
| `CapClasesGestionEndpoints.php` | DELETE asistencias + DELETE clase | Igual que Clase.php |
| `CapClasesLimpiezaEndpoints.php` | SELECT IDs + DELETE asist. + DELETE clases | Race condition entre SELECT y DELETE |

**Acción:** Implementar `$wpdb->query('START TRANSACTION')` / `COMMIT` / `ROLLBACK` en todas las operaciones multi-tabla. Crear helper reutilizable `conTransaccion(callable $fn)` para simplificar.

---

### 8.2 CERO TRY-CATCH EN MODELOS (ALTO)

Los 3 modelos (`Alumno.php`, `Clase.php`, `Configuracion.php`) no tienen **ni un solo** bloque `try-catch`. Toda excepción de BD propaga como fatal error sin manejo. Combinado con la ausencia de transacciones, cualquier error intermedio deja datos inconsistentes.

| Archivo | Líneas | Operaciones desprotegidas |
|---------|--------|--------------------------|
| `Alumno.php` | 578 | ~15 operaciones $wpdb (insert/update/delete/query) |
| `Clase.php` | 349 | ~10 operaciones $wpdb |
| `Configuracion.php` | 324 | ~8 operaciones $wpdb + 2 ALTER TABLE |

**Acción:** Envolver operaciones de escritura en try-catch. Mínimo: `eliminar()`, `crear()`, `actualizar()`, `recalcularHoras*()` en cada modelo.

---

### 8.3 ARCHIVOS QUE EXCEDEN LÍMITES DE LÍNEAS (MEDIO)

| Archivo | Líneas | Límite | Exceso |
|---------|--------|--------|--------|
| `Alumno.php` | 578 | 300 | +278 (93%) |
| `StripeService.php` | 509 | 300 | +209 (70%) |
| `Configuracion.php` | 324 | 300 | +24 (8%) |
| `Clase.php` | 349 | 300 | +49 (16%) |
| `CalendarEngine.php` | 349 | 300 | +49 (16%) |
| `useCalendario.ts` | 772 | 120 (hooks) | +652 (543%) |

**Acción:** Split obligatorio según protocolo. `useCalendario.ts` es el caso más extremo (6x el límite). Dividir en: `useCalendarioNavegacion.ts`, `useCalendarioClases.ts`, `useCalendarioGeneracion.ts`, `useCalendarioEdicion.ts`, `useCalendarioHistorial.ts`.

---

### 8.4 ENDPOINTS CON ACCESO DIRECTO A BD (ALTO — ARQUITECTURA)

8 de 12 endpoints hacen queries `$wpdb` directas en vez de usar modelos/repositorios. Esto viola SRP, dificulta testing, y genera hardcode de tablas/columnas fuera de la capa de datos:

| Endpoint | Operaciones directas |
|----------|---------------------|
| `CapRegistroEndpoints.php` | 3 inserts (`cap_centros`, `cap_configuracion`, `cap_suscripciones`) |
| `CapAlumnosProgresoEndpoints.php` | 6+ queries (asistencia, clases, alumnos) |
| `CapConfigEndpoints.php` | query a `cap_suscripciones` |
| `CapClasesGestionEndpoints.php` | delete asistencia + delete clase |
| `CapClasesLimpiezaEndpoints.php` | deletes masivos sin transacción |
| `CapDisponibilidadEndpoints.php` | select/delete/insert disponibilidad |
| `CapStripeEndpoints.php` | query a `cap_suscripciones` |
| `CapCalendarioGeneracionEndpoints.php` | indirectamente via modelos sin repos |

**Acción:** Canalizar TODAS las operaciones de datos por modelos/repositorios. Eliminar queries `$wpdb` directas de endpoints.

---

### 8.5 STRIPE: FALLOS DE SEGURIDAD FINANCIERA (CRÍTICO)

Hallazgos NO documentados en Fase 6 (que solo cubría verificar retorno de `$wpdb`):

| # | Hallazgo | Impacto |
|---|----------|---------|
| 1 | **SIN idempotency key** en `crearCheckoutSession()` | Reintentos del browser duplican cobros |
| 2 | **Webhooks SIN protección contra replay** | Stripe puede reenviar eventos y duplicar cambios de estado |
| 3 | **`procesarCheckoutCompletado()` SELECT+INSERT sin transacción** | Webhooks concurrentes del mismo checkout crean suscripciones duplicadas |
| 4 | **Esquema de encriptación con bug de IV** | Si los 16 bytes random del IV contienen `0x3A3A` (`::`) → `explode('::', ...)` corta en posición incorrecta → desencriptación falla silenciosamente retornando `''` |
| 5 | **`desencriptar()` retorna `''` en error** en lugar de `false`/exception | Keys corruptas se interpretan como "no configuradas", no como error |
| 6 | **Sin timeout ni retry** para llamadas a Stripe API | Network hang deja request PHP colgado indefinidamente |
| 7 | **`openssl_random_pseudo_bytes` sin verificar `$crypto_strong`** | IV potencialmente no criptográficamente seguro |
| 8 | **Estados de Stripe hardcodeados** | `'past_due'`, `'canceled'`, `'unpaid'` como strings literales — deben ser constantes |
| 9 | **`$session->metadata->centro_id` sin verificar existencia del centro** | Webhook con metadata manipulada puede crear suscripciones huérfanas |

**Acción:** Estos son adicionales a los hallazgos H-1..H-11 de Fase 6. Requieren su propia subfase de hardening Stripe.

---

### 8.6 OPEN REDIRECT EN STRIPE ENDPOINTS (ALTO — SEGURIDAD)

| Archivo | Parámetro | Riesgo |
|---------|-----------|--------|
| `CapStripeEndpoints.php` | `$datos['urlExito']` | URL de redirección post-checkout sin validar dominio |
| `CapStripeEndpoints.php` | `$datos['urlCancelado']` | Ídem |
| `CapStripeEndpoints.php` | `$datos['urlRetorno']` | URL de portal sin `esc_url()` ni validación |

**Acción:** Validar que las URLs pertenezcan al dominio del sitio (`wp_validate_redirect()` o `home_url()` check).

---

### 8.7 INPUT VALIDATION AUSENTE EN ENDPOINTS (ALTO)

Parámetros de request pasados sin sanitización a modelos/servicios:

| Endpoint | Parámetro | Riesgo |
|----------|-----------|--------|
| `CapAlumnosEndpoints` | `$request->get_json_params()` completo | Payload arbitrario llega al modelo |
| `CapAlumnosEndpoints` | `limite`, `offset` | Sin `intval()` |
| `CapAlumnosEndpoints` | `busqueda` | Sin `sanitize_text_field()` |
| `CapConfigEndpoints` | `$datos['config']`, `$datos['centro']` | Sin sanitización |
| `CapClasesLimpiezaEndpoints` | `$fecha` | Sin sanitizar antes de `new DateTime()` |
| `CapCalendarioEndpoints` | `$alumnosIds`, `$exclusiones`, `$semana` | Arrays sin validar tipo/contenido |
| `CapStripeEndpoints` | `$datos` config Stripe | Sin sanitización |
| `CapReportesEndpoints` | `$semana` | Sin `sanitize_text_field()` ni validación de formato |

**Acción:** Sanitizar CADA parámetro de entrada en el endpoint antes de pasarlo a capas inferiores. Crear función helper `sanitizarEntrada($datos, $reglas)`.

---

### 8.8 `callbackSeguro` DUPLICADO EN 9 CLASES (MEDIO — DRY)

Cada clase de endpoint define su propia copia idéntica de `callbackSeguro()`. Son ~15 líneas duplicadas 9 veces.

**Acción:** Extraer a trait `ConCallbackSeguro` o a clase base `BaseEndpoint`.

---

### 8.9 DISCREPANCIA DE TIPOS FRONTEND: 3 DEFINICIONES INCOMPATIBLES DE `EstadoSuscripcion` (CRÍTICO)

| Ubicación | Valores |
|-----------|---------|
| Schema backend (BD) | `activa`, `expirada`, `cancelada`, `pago_fallido` |
| `types/index.ts` | `activa`, `expirada`, `cancelada`, `trial`, `grace` |
| `useConfiguracion.ts` (inline) | `activa`, `expirada`, `pendiente`, `cancelada` |

Tres definiciones incompatibles del mismo tipo. `pago_fallido` del backend no existe en ninguna definición frontend. `trial`, `grace`, `pendiente` no existen en BD.

**Acción:** Unificar en `schema.ts` generado + evaluar si `trial`/`grace`/`pendiente` deben agregarse al schema BD o eliminarse del frontend.

---

### 8.10 FRONTEND: RACE CONDITIONS Y CLEANUP AUSENTE (ALTO)

| Archivo | Línea aprox. | Hallazgo |
|---------|-------------|----------|
| `useCalendario.ts` | ~183 | useEffect con fetch **SIN AbortController**. Navegación rápida entre semanas muestra clases de semana equivocada |
| `useAlumnos.ts` | ~260 | useEffect con fetch sin cleanup. Cambio rápido de filtros = race condition |
| `useConfiguracion.ts` | ~220 | useEffect sin AbortController |
| `useStripe.ts` | ~105 | useEffect sin AbortController |
| `PanelDemo.tsx` | ~40 | useEffect de montaje sin cleanup |
| `SeccionReportes.tsx` | ~30 | useEffect sin cleanup |
| `SeccionAlumnos.tsx` | ~43 | `setTimeout` en render body sin `useEffect` ni cleanup — crea timeout nuevo en cada re-render |
| `SeccionConfiguracion.tsx` | ~24 | Mismo patrón de setTimeout fuera de useEffect |

**Acción:** Agregar `AbortController` a todo `useEffect` con operaciones async. Mover `setTimeout` a `useEffect` con cleanup.

---

### 8.11 FRONTEND: ERROR MASKING Y FEEDBACK AUSENTE (ALTO)

| Archivo | Hallazgo |
|---------|----------|
| `PanelDemo.tsx:poblarDatos()` | Si `response.json()` falla, muestra **"Datos creados"** (éxito falso) |
| `PanelDemo.tsx:obtenerEstado()` | Si falla, no muestra error. Panel queda en `estado === null` sin explicación |
| `PanelDemo.tsx:limpiarDatos()` | Error genérico oculta borrado parcial |
| `ModalProgresoAlumno.tsx` | Fetch falla → muestra fallback con 0s **sin indicar que son datos aproximados** |
| `PanelHorarios.tsx` | `JSON.parse` falla → `console.error` + return sin feedback visual |
| `useCalendario.ts:generarCalendario()` | No verifica `response.ok` antes de parsear JSON — HTTP 500 con JSON válido se procesa como éxito |
| `useCalendario.ts:moverMultiplesClases()` | `Promise.all` falla parcialmente → revierte TODO en frontend pero backend tiene cambios parciales = desincronización |

**Acción:** Toda operación fallida debe dar feedback visual al usuario (toast, badge, alerta). Prohibido retornar success en catch.

---

### 8.12 FRONTEND: OPTIMISTIC UPDATES SIN ROLLBACK CORRECTO (ALTO)

| Archivo | Hallazgo |
|---------|----------|
| `useCalendario.ts:actualizarClase()` | Rollback usa snapshot del closure que puede contener estado optimista previo, no el real del servidor |
| `useCalendario.ts:moverMultiplesClases()` | `Promise.all` con rollback total del frontend, pero las peticiones exitosas ya se persistieron en backend |

**Acción:** Implementar rollback individual por operación, o cambiar a updates confirmados (no optimistas) para operaciones batch.

---

### 8.13 ZUSTAND STORE SIN SELECTORES (MEDIO)

| Archivo | Hallazgo |
|---------|----------|
| `CapLayout.tsx` | `useDashboardStore()` sin selector — desestructura 7 props. Cualquier cambio al store re-renderiza todo el layout |

**Acción:** `useDashboardStore(s => s.seccionActiva)` en vez de desestructurar todo.

---

### 8.14 CÓDIGO MUERTO Y DUPLICADO (MEDIO)

| Archivo | Hallazgo |
|---------|----------|
| `useHistorial.ts` | Hook completo posiblemente no usado — `useCalendario` tiene su propio sistema de historial interno |
| `ModalProgresoAlumno.tsx` | `CODIGO_A_ID` duplica lógica de `CODIGOS_ALIAS` de cap-constants.ts |
| `Alumno` (tipo TS) | Definido 3 veces: `useAlumnos.ts` (snake_case), `types/index.ts` (camelCase), `schema.ts` (generado) |
| `API_BASE` | Duplicado en `useCalendario.ts`, `useAlumnos.ts`, `useConfiguracion.ts`, `useDisponibilidad.ts` |
| 7 repos | Imports muertos de DTO (7) y Enums (2) |

---

### 8.15 MUTACIÓN DIRECTA DE ESTADO REACT (MEDIO)

| Archivo | Hallazgo |
|---------|----------|
| `PanelHorarios.tsx:handleRangoChange()` | `nuevosHorarios[diaId][index][campo] = valor` — muta objeto in-place (copia superficial no protege arrays internos) |
| `PanelHorarios.tsx:eliminarRango()` | `splice()` muta array in-place — React puede no detectar el cambio |

**Acción:** Copia profunda o inmutable update pattern (`map` + spread).

---

### 8.16 SECURITY: ERROR DETAIL LEAKS (BAJO)

| Archivo | Hallazgo |
|---------|----------|
| `CapReportesEndpoints.php` | `$error->getMessage()` expuesto al cliente — puede contener paths del servidor |
| `useStripe.ts` | `console.error` con stack traces de endpoints Stripe |

---

### 8.17 RACE CONDITION EN REGISTRO (MEDIO)

`CapRegistroEndpoints.php` ~L142: `username_exists()` + `email_exists()` + `wp_create_user()` — dos registros simultáneos con el mismo email podrían pasar ambos checks. WordPress `wp_create_user` lanza error si duplicado, pero el error se maneja como genérico sin informar "email ya existe".

---

### 8.18 `CapSchema.php` — SIN FK CONSTRAINTS (MEDIO)

Ninguna tabla define `FOREIGN KEY`. No hay integridad referencial a nivel BD:
- Borrar un centro no cascadea a alumnos
- Borrar un alumno no cascadea a disponibilidad/asistencia
- El código intenta borrar manualmente (secuencial, sin transacción), pero errores intermedios dejan datos huérfanos

**Acción:** Evaluar agregar `ON DELETE CASCADE` en constraints FK, o al mínimo documentar que la integridad referencial es responsabilidad del código (y entonces las transacciones de 8.1 son absolutamente imprescindibles).

---

### 8.19 N+1 QUERIES EN SEEDER (MEDIO)

`CapSeeder.php:asignarAsistencias()` ejecuta `SELECT COUNT` + `INSERT` por cada combinación clase × alumno. Con 40 clases × 6 alumnos = ~240 queries individuales. Debería usar `INSERT ... ON DUPLICATE KEY UPDATE` o batch insert.

---

### 8.20 LOGOUT SIN NONCE (BAJO)

`CapLayout.tsx:handleCerrarSesion` construye URL `/wp-login.php?action=logout` sin `_wpnonce`. WordPress mostrará "¿Estás seguro?" en vez de hacer logout directo.

---

### 8.21 BOTÓN MUERTO (BAJO)

`PanelSuscripcion.tsx` ~L122: Botón "Gestionar Pagos" no tiene `onClick` handler. Está deshabilitado condicionalmente pero nunca hace nada.

---

### 8.22 TYPO EN NOMBRE DE FUNCIÓN (BAJO)

`useCalendario.ts` ~L700: `borrarSemanacompleta` debería ser `borrarSemanaCompleta` (camelCase correcto).

---

### RESUMEN FASE 8 POR PRIORIDAD DE EJECUCIÓN

| Prioridad | ID | Descripción | Esfuerzo |
|-----------|----|-------------|----------|
| **P0 — Bloqueante** | 8.0 | ✅ Crear `BaseRepository` (commit 1b4fd7c) | Medio |
| **P0 — Bloqueante** | 8.1 | ✅ Transacciones en operaciones multi-tabla (commit 1b4fd7c) | Alto |
| **P1 — Crítico** | 8.5 | ✅ Hardening Stripe (commit f70ec00) | Alto |
| **P1 — Crítico** | 8.9 | ✅ `EstadoSuscripcion` unificado → `InfoSuscripcion` (commit b24a355) | Bajo |
| **P1 — Crítico** | 8.2 | ✅ Try-catch en modelos (commit f70ec00) | Medio |
| **P2 — Alto** | 8.4 | **PENDIENTE** Canalizar acceso BD por repos/modelos | Alto |
| **P2 — Alto** | 8.6 | ✅ Fix open redirect Stripe (commit f70ec00) | Bajo |
| **P2 — Alto** | 8.7 | ✅ Input validation en 5 endpoints (commit ba23fff) | Medio |
| **P2 — Alto** | 8.10 | ✅ AbortController en 8 useEffects + setTimeout→useEffect (commit b24a355) | Medio |
| **P2 — Alto** | 8.11 | ✅ Error masking eliminado: response.ok checks, fallback con alerta, JSON.parse protegido (commit 3889d29) | Medio |
| **P2 — Alto** | 8.12 | ✅ Verificado: rollback ya correcto en toggleBloqueo, actualizarClase, moverClase, moverMultiples (ya existente) | Medio |
| **P3 — Medio** | 8.3 | **PENDIENTE** Split archivos (useCalendario 792 ln, Alumno.php 578 ln) | Medio |
| **P3 — Medio** | 8.8 | ✅ Trait `ConCallbackSeguro` en 11 clases (commit f70ec00) | Bajo |
| **P3 — Medio** | 8.13 | ✅ Selectores Zustand en CapLayout (commit b24a355) | Bajo |
| **P3 — Medio** | 8.14 | ✅ API_BASE centralizado, useHistorial eliminado (commits eae10b0 + 3889d29) | Bajo |
| **P3 — Medio** | 8.15 | ✅ Inmutable updates en PanelHorarios (commit b24a355) | Bajo |
| **P3 — Medio** | 8.17 | **PENDIENTE** Race condition en registro (wp_create_user) | Bajo |
| **P3 — Medio** | 8.18 | **PENDIENTE** FK constraints o documentar ausencia | Bajo |
| **P3 — Medio** | 8.19 | **PENDIENTE** Batch inserts en Seeder | Bajo |
| **P4 — Bajo** | 8.16 | ✅ Error detail leaks: CapReportesEndpoints $e->getMessage() reemplazado (commit ba23fff) | Bajo |
| **P4 — Bajo** | 8.20 | ✅ Logout nonce: wp_logout_url() como prop + callback en pages.php (commit 3889d29) | Bajo |
| **P4 — Bajo** | 8.21 | ✅ Botón portal Stripe funcional con endpoint /stripe/portal (commit 3889d29) | Bajo |
| **P4 — Bajo** | 8.22 | ✅ Typo borrarSemanacompleta → borrarSemanaCompleta (commit b24a355) | Bajo |

---

### MÉTRICAS ACTUALIZADAS (incluyendo Fase 8)

| Métrica | Antes (solo F1-F7) | Después de F8 |
|---------|---------------------|---------------|
| Transacciones BD | 0 | ✅ 11 operaciones protegidas |
| Try-catch en modelos | 0 | ✅ Cobertura completa |
| BaseRepository | Inexistente (7 repos muertos) | ✅ Funcional con CRUD, transacciones |
| Definiciones incompatibles EstadoSuscripcion | 3 | ✅ 1 fuente única (schema.ts → InfoSuscripcion) |
| useEffects sin cleanup | 8 | ✅ 0 (AbortController en 8 hooks+componentes) |
| Error masking frontend | 7 casos | ✅ 0 (response.ok checks, alertas visuales, JSON.parse protegido) |
| Archivos sobre límite de líneas | 6 | **Pendiente** (8.3 — esfuerzo alto) |
| Open redirect vectors | 3 | ✅ 0 |
| Inputs sin sanitizar en endpoints | 10+ | ✅ 0 |
| Código muerto | ~12 archivos/funciones | ✅ useHistorial eliminado, API_BASE centralizado |
| Logout sin nonce | 1 | ✅ 0 (wp_logout_url con nonce) |
| Botones sin handler | 1 | ✅ 0 (portal Stripe funcional) |
| Zustand sin selectores | 1 | ✅ 0 (7 selectores individuales) |
| Mutación directa React state | 3 | ✅ 0 (inmutable con map/filter/spread) |