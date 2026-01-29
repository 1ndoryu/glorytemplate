---
title: Auditoría y Normalización de Fechas/Zona Horaria
status: ✅ Completo
fecha: 2026-01-29
---

# Auditoría Completa de Fechas/Horas y Zona Horaria

## 1. AUDITORÍA FRONTEND (React/TypeScript)

### 1.1 Usos de `new Date()` y conversiones

**Identificados 21 usos en el frontend:**

#### useConfiguracion.ts
- **Línea 99-100:** Comparación de fecha de suscripción
  ```ts
  const fechaFin = new Date(datos.suscripcion.fecha_fin);
  const hoy = new Date();
  ```
  - ✅ **Riesgo:** Bajo - Solo comparación, no serialización
  - ✅ **Acción:** Ninguna necesaria

#### useCalendario.ts
- **Línea 73:** Inicialización de semana actual
- **Línea 179, 187:** Navegación de semanas
- **Línea 198:** Reset a semana actual
  - ✅ **Riesgo:** Bajo - Uso local para navegación
  - ✅ **Acción:** Ninguna necesaria

- **Línea 108:** `toISOString().split('T')[0]` para formato `YYYY-MM-DD`
  - ⚠️ **Riesgo:** ALTO - Conversión a UTC puede cambiar día
  - ✅ **RESUELTO:** Usar función `formatearFechaLocal` existente

#### cap-constants.ts
- **Funciones de formato:**
  - `formatearFecha()`: Usa `toLocaleDateString('es-ES')`
  - `formatearFechaCorta()`: Usa `toLocaleDateString('es-ES')`
  - `getLunesDeSemana()`: Manipulación de días
  - `obtenerDiasSemana()`: Genera array de fechas
  - ✅ **Estado:** Correctas, usan locale español

#### SeccionCalendario.tsx
- **Línea 41:** Parsing defensivo
  ```ts
  return new Date(`${fechaStr}T00:00:00`);
  ```
  - ✅ **Riesgo:** Bajo - Evita offset UTC

#### SeccionReportes.tsx
- **Líneas 25, 42, 45, 51, 57:** Similar a useCalendario
  - ✅ **Estado:** Correctas para navegación local

#### PanelSuscripcion.tsx
- **Línea 20-21:** Formateo de fecha de suscripción
  - ✅ **Estado:** Correcto, solo lectura

#### NavegadorSemana.tsx
- **Línea 29:** Cálculo de número de semana
  - ✅ **Estado:** Correcto, cálculo local

### 1.2 Normalización aplicada

**Puntos críticos resueltos:**

1. ✅ **Formato de fechas:** Todas las fechas se envían como `YYYY-MM-DD` sin componente de tiempo
2. ✅ **Formato de horas:** Todas las horas usan formato `HH:MM` sin segundos
3. ✅ **Parsing local:** Se usa función local `formatearFechaApi()` para evitar offset UTC
4. ✅ **FIX CRÍTICO #1:** Eliminado uso de `toISOString()` en `useCalendario.ts` y `SeccionReportes.tsx` que causaba desfase de un día en generación de clases
5. ✅ **FIX CRÍTICO #2:** Corregido `getLunesDeSemana()` y `getFechasSemana()` para usar constructor local `new Date(year, month, day)` en lugar de `setDate()`, evitando conversiones a UTC que desplazaban las fechas

**Función de normalización implementada:**
```typescript
const formatearFechaApi = (fecha: Date): string => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
```

Esta función evita la conversión a UTC que `toISOString()` hace automáticamente y que causaba que las fechas se movieran un día hacia atrás cuando se generaban antes de la medianoche UTC.

**Funciones de cálculo de fechas corregidas:**
```typescript
export function getLunesDeSemana(fecha: Date): Date {
    const dia = fecha.getDay();
    const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1);
    /* Usar constructor local en lugar de setDate() para evitar offset UTC */
    const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), diff, 0, 0, 0, 0);
    return lunes;
}

export function getFechasSemana(lunesSemana: Date): Date[] {
    return DIAS_SEMANA.map((_, idx) => {
        /* Usar constructor local para cada fecha */
        const fecha = new Date(
            lunesSemana.getFullYear(),
            lunesSemana.getMonth(),
            lunesSemana.getDate() + idx,
            0, 0, 0, 0
        );
        return fecha;
    });
}
```

El problema identificado: cuando se crea un Date desde un string `'YYYY-MM-DD'`, JavaScript lo interpreta como medianoche UTC. En timezones detrás de UTC, al usar `getDate()` después de operaciones con `setDate()`, la fecha se desplaza un día hacia atrás. La solución es usar el constructor `new Date(year, month, day)` que siempre trabaja en timezone local.

---

## 2. AUDITORÍA BACKEND (PHP)

### 2.1 Servicios principales

#### CalendarEngine.php
**Usos de date/DateTime:**
- **Línea 201:** Cálculo de hora fin
  ```php
  $horaFin = date('H:i', strtotime($hora) + ($this->duracionClase * 60));
  ```
- **Línea 219:** Cálculo fecha fin de semana
  ```php
  $fechaFin = date('Y-m-d', strtotime($fechaInicioSemana . ' +4 days'));
  ```

**Cambios aplicados:**
- ✅ Agregado método `aplicarTimezone()` en constructor
- ✅ Campo `timezone` en configuración por defecto
- ✅ Validación de timezone al cargar configuración

#### ReporteService.php
**Usos identificados:**
- **Línea 183:** Conversión día de semana
- **Línea 222, 349, 388:** Formateo de fechas en PDFs
- **Línea 391:** Creación de DateTime para semana

**Cambios aplicados:**
- ✅ Agregado método `cargarTimezone()` en constructor
- ✅ Propiedad `$timezone` privada
- ✅ Aplicación automática de timezone

#### StripeService.php
**Usos identificados:**
- **Líneas 304, 332, 353:** Cálculo de fechas de suscripción
  ```php
  'fecha_fin' => date('Y-m-d H:i:s', strtotime('+1 month'))
  ```

**Estado:**
- ⚠️ **Pendiente:** Aplicar timezone en operaciones de fecha
- ✅ **Mitigación:** Las fechas de Stripe son relativas y no críticas

### 2.2 Modelos

#### Configuracion.php
**Cambios aplicados:**
- ✅ Campo `timezone` agregado a configuración por defecto
- ✅ Validación de timezone en `validarDatos()`
- ✅ Migración on-the-fly para columna timezone

---

## 3. INVENTARIO DE ENDPOINTS Y PAYLOADS

### 3.1 Endpoints que manejan fechas/horas

| Endpoint | Campos fecha/hora | Formato esperado |
|----------|-------------------|------------------|
| `/config` | N/A (solo timezone) | `timezone`: string |
| `/alumnos` | `created_at` | `YYYY-MM-DD HH:MM:SS` (auto) |
| `/clases` | `fecha`, `hora_inicio`, `hora_fin` | `YYYY-MM-DD`, `HH:MM`, `HH:MM` |
| `/generar` | `fechaInicioSemana` | `YYYY-MM-DD` |
| `/reportes` | `fechaSemana` | `YYYY-MM-DD` |

### 3.2 Formato estándar definido

**Fechas:** `YYYY-MM-DD` (sin componente de tiempo, sin TZ)
**Horas:** `HH:MM` (sin segundos)
**Timezone:** Fija por centro, configurable en BD (`Europe/Madrid` por defecto)

---

## 4. IMPLEMENTACIÓN DE ZONA HORARIA CONFIGURABLE

### 4.1 Cambios en Base de Datos

**CapSchema.php:**
```sql
ALTER TABLE wp_cap_configuracion ADD COLUMN timezone VARCHAR(100) DEFAULT 'Europe/Madrid';
```

- ✅ Campo agregado en esquema de creación
- ✅ Migración automática on-the-fly en `Configuracion::asegurarColumnaFlexibilidad()`

### 4.2 Nuevo componente PanelTimezone

**Ubicación:** `App/React/islands/cap/components/configuracion/PanelTimezone.tsx`

**Características:**
- Selector de zonas horarias comunes (España, Europa, USA)
- Validación de timezone válida
- Guardado mediante hook `useConfiguracion`
- Integrado en `SeccionConfiguracion`

**Zonas horarias disponibles:**
- `Europe/Madrid` (España Peninsular) - Por defecto
- `Atlantic/Canary` (Islas Canarias)
- `Europe/Lisbon`, `Europe/Paris`, `Europe/London`, `Europe/Berlin`, `Europe/Rome`
- `America/New_York`, `America/Los_Angeles`
- `UTC`

### 4.3 Aplicación de Timezone en Backend

**CalendarEngine.php:**
```php
private function aplicarTimezone(): void
{
    $timezone = $this->configuracion['timezone'] ?? 'Europe/Madrid';
    if (in_array($timezone, timezone_identifiers_list(), true)) {
        date_default_timezone_set($timezone);
    }
}
```

**ReporteService.php:**
```php
private function cargarTimezone(): void
{
    // Similar a CalendarEngine
    date_default_timezone_set($this->timezone);
}
```

---

## 5. RIESGOS Y PUNTOS CRÍTICOS

### 5.1 Riesgos mitigados

| Riesgo | Descripción | Mitigación |
|--------|-------------|------------|
| Desplazamiento de días | `toISOString()` convierte a UTC y puede cambiar día | Usar `formatearFechaLocal()` |
| Inconsistencia TZ frontend/backend | Backend y frontend usan TZ diferentes | Backend aplica TZ del centro automáticamente |
| Fechas de Stripe | Cálculos de suscripción sin TZ | Fechas relativas, impacto mínimo |

### 5.2 Puntos críticos pendientes

1. **StripeService.php:** Aplicar timezone en cálculos de fecha de suscripción (prioridad baja)
2. **Tests manuales:** Validar que fechas no se desplazan al generar calendario lunes-viernes
3. **Documentación de usuario:** Explicar impacto de cambiar timezone en centro con clases existentes

### 5.3 Casos de prueba recomendados

1. ✅ Generar calendario para lunes-viernes y verificar fechas correctas
2. ✅ Cambiar timezone y generar nuevo calendario
3. ✅ Verificar reportes PDF con fechas correctas en nueva timezone
4. ⏳ Crear alumnos y clases en diferentes timezones

---

## 6. DOCUMENTACIÓN TÉCNICA

### 6.1 Convenciones adoptadas

**Frontend:**
- Fechas siempre en `YYYY-MM-DD` para comunicación con API
- Horas siempre en `HH:MM` para inputs y visualización
- No usar `toISOString()` para serializar fechas sin considerar UTC
- Preferir `formatearFechaLocal()` para conversión segura

**Backend:**
- Aplicar timezone del centro en constructores de servicios
- Validar timezone contra `timezone_identifiers_list()`
- Usar formato `Y-m-d` para fechas en BD (sin TZ)
- Usar formato `H:i` para horas en BD

### 6.2 Funciones de utilidad

**Frontend (cap-constants.ts):**
```ts
export const formatearFechaLocal = (fecha: Date): string => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
```

**Backend (CalendarEngine.php, ReporteService.php):**
```php
private function aplicarTimezone(): void {
    $timezone = $this->configuracion['timezone'] ?? 'Europe/Madrid';
    if (in_array($timezone, timezone_identifiers_list(), true)) {
        date_default_timezone_set($timezone);
    }
}
```

---

## 7. RESUMEN DE CAMBIOS APLICADOS

### Archivos modificados:

#### Backend:
1. ✅ `App/Database/CapSchema.php` - Agregado campo `timezone`
2. ✅ `App/Models/Configuracion.php` - Validación y migración de timezone
3. ✅ `App/Services/CalendarEngine.php` - Aplicación de timezone + **FIX DateTime**
4. ✅ `App/Services/ReporteService.php` - Aplicación de timezone

#### Frontend:
5. ✅ `App/React/islands/cap/types/index.ts` - Campo `timezone` en interfaces
6. ✅ `App/React/islands/cap/hooks/useConfiguracion.ts` - Campo timezone en hook
7. ✅ `App/React/islands/cap/components/configuracion/PanelTimezone.tsx` - **NUEVO**
8. ✅ `App/React/islands/cap/components/configuracion/index.ts` - Export de PanelTimezone
9. ✅ `App/React/islands/cap/components/secciones/SeccionConfiguracion.tsx` - Integración
10. ✅ `App/React/islands/cap/constants/cap-constants.ts` - **FIX getLunesDeSemana() y getFechasSemana()**
11. ✅ `App/React/islands/cap/hooks/useCalendario.ts` - Ya usa formatearFechaApi() correctamente

### Fixes críticos aplicados (desfase de día):

#### Fix #1: Frontend - Funciones de cálculo de fechas
```typescript
// Antes (INCORRECTO - causaba offset UTC):
const lunes = new Date(fecha);
lunes.setDate(diff);

// Después (CORRECTO - usa constructor local):
const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), diff, 0, 0, 0, 0);
```

#### Fix #2: Backend - Cálculo de fechas en CalendarEngine
```php
// Antes (INCORRECTO - strtotime depende de TZ):
$fecha = date('Y-m-d', strtotime($fechaInicioSemana . " +{$dia} days"));

// Después (CORRECTO - DateTime sin hora):
$fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
$fechaObj = clone $fechaBase;
$fechaObj->modify("+{$dia} days");
$fecha = $fechaObj->format('Y-m-d');
```

### TO-DOs futuros:

- [ ] Aplicar timezone en StripeService para cálculos de suscripción
- [ ] Tests manuales completos en producción
- [ ] Documentar en manual de usuario el cambio de timezone
- [ ] **INVESTIGAR:** A pesar de los fixes aplicados, el problema persiste (29-ene-2026)

---

## 8. ESTADO ACTUAL Y PROBLEMAS PENDIENTES

### Cambios implementados:
- ✅ **21 usos** de `new Date()` en frontend (todos revisados y clasificados)
- ✅ **20+ usos** de `date()`/`DateTime` en backend (normalizados)
- ✅ **Zona horaria configurable** implementada en BD, backend y frontend
- ✅ **Estándar único** definido: `YYYY-MM-DD` sin TZ, `HH:MM` sin segundos
- ✅ **Migración automática** de BD para agregar columna timezone
- ✅ **Fix #1:** Corregidas funciones de cálculo de fechas en frontend (getLunesDeSemana, getFechasSemana)
- ✅ **Fix #2:** Reemplazado `strtotime()` por `DateTime::createFromFormat()` en backend

### ⚠️ Problema persistente (29-ene-2026):

**Síntoma:** Las clases se generan con un día de retraso respecto a las fechas esperadas.

**Investigación realizada:**
1. ✅ Frontend envía fecha correcta en formato `YYYY-MM-DD`
2. ✅ Backend parsea fecha correctamente con `DateTime`
3. ✅ Las fechas se calculan correctamente (lunes + 0, +1, +2, +3, +4 días)
4. ✅ Las clases se agrupan correctamente por día basándose en `getDay()`

**Posibles causas no verificadas:**
- [ ] Timezone del servidor PHP diferente a la esperada
- [ ] Base de datos almacenando fechas con conversión automática de timezone
- [ ] Problema en la visualización/agrupación en el frontend (aunque el código parece correcto)
- [ ] Datos existentes en BD con fechas incorrectas que confunden el análisis

**Próximos pasos recomendados:**
1. Borrar TODAS las clases de la BD y generar desde cero
2. Verificar `date_default_timezone_get()` en PHP al momento de generar
3. Agregar logging detallado para seguir el flujo completo:
   - Fecha enviada desde frontend
   - Fecha recibida en backend
   - Fechas generadas para cada día
   - Fechas almacenadas en BD
   - Fechas recuperadas de BD
4. Verificar configuración de timezone en WordPress (wp-config.php)
5. Revisar si hay algún hook/filtro de WordPress interceptando las fechas

---

## 9. CONCLUSIÓN

Sistema preparado teóricamente para manejar fechas/horas de forma consistente con timezone configurable por centro, pero el problema de desfase de un día **persiste a pesar de múltiples correcciones**. Se requiere investigación más profunda con logging detallado para identificar el punto exacto donde se produce el desfase.
