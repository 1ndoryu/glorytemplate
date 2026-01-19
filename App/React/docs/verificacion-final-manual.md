# Verificación Final Manual - Proyecto CAP

> **Fecha:** 2026-01-19  
> **Estado:** Bugs críticos corregidos - Verificar funcionamiento  
> **Propósito:** Guía de verificación para el usuario antes del despliegue

---

## 🚨 Bugs Críticos Detectados

### BUG-001: El motor de generación no lee disponibilidad correctamente (✅ CORREGIDO)

**Descripción:**  
Al crear un alumno, configurar su disponibilidad y presionar "Generar", no se creaban clases.

**Causa raíz:**  
Había una **incompatibilidad total** entre cómo se guarda la disponibilidad y cómo el `CalendarEngine.php` la leía:

| Componente         | Campo esperado                    | Campo real en BD               |
| ------------------ | --------------------------------- | ------------------------------ |
| CalendarEngine.php | `dia_semana` (integer 1-5)        | `dia` (varchar: "lunes"...)    |
| CalendarEngine.php | `hora_inicio`, `hora_fin` (rango) | `hora` (slot puntual: "09:00") |

**Solución aplicada:**  
Se modificó `CalendarEngine.php::cargarDisponibilidad()` para:
1. Leer columnas `dia` y `hora` en lugar de `dia_semana`, `hora_inicio`, `hora_fin`
2. Convertir nombres de día ("lunes" → 1, "martes" → 2, etc.) via mapeo `DIAS_A_NUMERO`
3. Tratar cada slot como disponibilidad puntual de 1 hora (duración de clase)

**Estado:** ✅ CORREGIDO - Verificar que "Generar" ahora crea clases correctamente

---

### BUG-002: Grilla de disponibilidad muy grande (✅ CORREGIDO)

**Descripción:**  
Los cuadros de selección de hora en la matriz de disponibilidad eran muy grandes, dificultando la usabilidad.

**Solución aplicada:**  
- Reducido tamaño de celdas de 32px → 24px en desktop
- Reducido tamaño de celdas de 28px → 22px en mobile
- Añadido max-width para evitar celdas gigantes
- Compactado spacing general del grid

**Estado:** ✅ CORREGIDO - Verificar visualmente la matriz

---

### BUG-003: Clases bloqueadas desaparecen al regenerar demo (✅ CORREGIDO)

**Descripción:**  
El usuario reportó que con datos demo, las clases bloqueadas desaparecían al usar funciones de limpieza o regeneración.

**Causa raíz identificada:**
- `CalendarEngine::crearClases()` elimina solo `WHERE bloqueada = 0` ✅ (correcto)
- `CapSeeder::cleanAll()` eliminaba **TODAS** las clases sin filtrar por bloqueo ⚠️
- El problema solo ocurría cuando el seeder ejecutaba `cleanAll()` antes de poblar datos

**Solución aplicada:**
- Modificado `CapSeeder.php::cleanAll()` para añadir `AND bloqueada = 0` a la query DELETE
- Ahora tanto el motor de generación como el seeder respetan las clases bloqueadas

**Estado:** ✅ CORREGIDO - Verificar que "Limpiar demo" no elimina clases bloqueadas

---

## 📊 División de Verificación

### PARTE A: Verificable via API (Backend)

Estas pruebas se pueden hacer con llamadas HTTP directas para validar que el backend funciona correctamente.

#### A.1 Endpoints de Alumnos
| Endpoint                       | Método | Verificar                           |
| ------------------------------ | ------ | ----------------------------------- |
| `/wp-json/cap/v1/alumnos`      | GET    | Retorna lista de alumnos del centro |
| `/wp-json/cap/v1/alumnos`      | POST   | Crea alumno con datos válidos       |
| `/wp-json/cap/v1/alumnos/{id}` | PUT    | Actualiza alumno existente          |
| `/wp-json/cap/v1/alumnos/{id}` | DELETE | Elimina alumno                      |

#### A.2 Endpoints de Disponibilidad
| Endpoint                                    | Método | Verificar                  |
| ------------------------------------------- | ------ | -------------------------- |
| `/wp-json/cap/v1/disponibilidad/{alumnoId}` | GET    | Retorna slots del alumno   |
| `/wp-json/cap/v1/disponibilidad/{alumnoId}` | POST   | Guarda slots correctamente |

**Formato esperado para guardar:**
```json
{
  "slots": [
    {"dia": "lunes", "hora": "09:00", "disponible": true},
    {"dia": "martes", "hora": "10:00", "disponible": true}
  ]
}
```

#### A.3 Endpoints de Calendario
| Endpoint                                     | Método | Verificar                          |
| -------------------------------------------- | ------ | ---------------------------------- |
| `/wp-json/cap/v1/clases?semana=YYYY-MM-DD`   | GET    | Retorna clases de la semana        |
| `/wp-json/cap/v1/clases/{id}`                | PUT    | Actualiza clase (hora, asignatura) |
| `/wp-json/cap/v1/clases/{id}/toggle-bloqueo` | POST   | Cambia estado bloqueada            |

#### A.4 Endpoint de Generación (EL PROBLEMÁTICO)
| Endpoint                  | Método | Verificar                              |
| ------------------------- | ------ | -------------------------------------- |
| `/wp-json/cap/v1/generar` | POST   | **ACTUALMENTE FALLA** - No crea clases |

**Request esperado:**
```json
{
  "semana": "2026-01-20"
}
```

#### A.5 Endpoints de Configuración
| Endpoint                 | Método | Verificar                 |
| ------------------------ | ------ | ------------------------- |
| `/wp-json/cap/v1/config` | GET    | Retorna config del centro |
| `/wp-json/cap/v1/config` | POST   | Guarda configuración      |

#### A.6 Endpoints de Reportes
| Endpoint                                                    | Método | Verificar  |
| ----------------------------------------------------------- | ------ | ---------- |
| `/wp-json/cap/v1/reportes/plan-alumno?semana=X&alumno_id=Y` | GET    | Genera PDF |
| `/wp-json/cap/v1/reportes/control-horas?semana=X`           | GET    | Genera PDF |

#### A.7 Endpoints de Demo
| Endpoint                      | Método | Verificar            |
| ----------------------------- | ------ | -------------------- |
| `/wp-json/cap/v1/demo/status` | GET    | Estado actual demo   |
| `/wp-json/cap/v1/demo/seed`   | POST   | Crea datos de prueba |
| `/wp-json/cap/v1/demo/clean`  | DELETE | Limpia datos demo    |

#### A.8 Endpoints de Stripe
| Endpoint                          | Método   | Verificar            |
| --------------------------------- | -------- | -------------------- |
| `/wp-json/cap/v1/stripe/config`   | GET/POST | Solo admin           |
| `/wp-json/cap/v1/stripe/checkout` | POST     | Crea sesión checkout |
| `/wp-json/cap/v1/stripe/portal`   | POST     | URL portal cliente   |

---

### PARTE B: Verificación Manual Frontend (Usuario)

Estas pruebas requieren interacción visual en el navegador.

#### B.1 Login y Registro
- [ ] Formulario de login con validación visual
- [ ] Formulario de registro funciona
- [ ] Redirección post-login a dashboard
- [ ] Mensaje de error si credenciales incorrectas

#### B.2 Navegación Dashboard
- [ ] Sidebar muestra todas las secciones
- [ ] Transición suave entre secciones
- [ ] Badge de suscripción visible
- [ ] Botón cerrar sesión funciona

#### B.3 Gestión de Alumnos (UI)
- [ ] Tabla de alumnos se carga correctamente
- [ ] Modal de crear alumno abre correctamente
- [ ] Modal de editar alumno abre con datos
- [ ] Confirmación antes de eliminar
- [ ] Búsqueda/filtro funciona
- [ ] Paginación funciona

#### B.4 Matriz de Disponibilidad (UI)
- [ ] Click en celda individual selecciona/deselecciona
- [ ] Click en cabecera de fila selecciona toda la hora
- [ ] Click en cabecera de columna selecciona todo el día
- [ ] Botón "Seleccionar todo" marca todas las celdas
- [ ] Botón "Limpiar" desmarca todas las celdas
- [ ] Botón "Guardar" muestra feedback de éxito
- [ ] **ISSUE:** Los cuadros son muy grandes (ver BUG-002)

#### B.5 Calendario Semanal (UI)
- [ ] Muestra días de lunes a viernes
- [ ] Navegación entre semanas (flechas)
- [ ] Indicador de semana actual
- [ ] Botón "Semana actual" regresa a hoy
- [ ] Tarjetas de clase muestran asignatura y hora
- [ ] Icono de candado visible en clases bloqueadas
- [ ] Color de borde rojo en clases bloqueadas

#### B.6 Edición de Clases (UI)
- [ ] Click en clase abre modal de detalle
- [ ] Modal muestra info de la clase
- [ ] Cambiar asignatura (dropdown)
- [ ] Cambiar hora inicio/fin
- [ ] Ver lista de alumnos asignados
- [ ] Cerrar modal (X o fuera del modal)

#### B.7 Drag & Drop
- [ ] Arrastrar clase a otro día
- [ ] Feedback visual durante arrastre
- [ ] Clases bloqueadas NO se pueden arrastrar
- [ ] Mensaje de error si intenta mover bloqueada

#### B.8 Generación de Calendario
- [ ] Botón "Generar" muestra spinner durante proceso
- [ ] Si hay conflictos de aforo, abre modal de resolución
- [ ] Modal de conflictos permite seleccionar alumnos
- [ ] **ISSUE:** No genera clases aunque haya disponibilidad (ver BUG-001)

#### B.9 Deshacer
- [ ] Botón "Deshacer" habilitado después de cambios
- [ ] Restaura estado anterior correctamente

#### B.10 Reportes (UI)
- [ ] Tarjetas de tipo de reporte visibles
- [ ] Selector de semana funciona
- [ ] Selector de alumno funciona (para plan individual)
- [ ] Botón de descarga muestra spinner
- [ ] PDF se descarga correctamente

#### B.11 Configuración (UI)
- [ ] Panel de datos del centro
- [ ] Panel de horarios
- [ ] Panel de capacidad y duración
- [ ] Panel de suscripción muestra estado
- [ ] Cada panel guarda independientemente
- [ ] Panel Stripe visible solo para administrators

---

## 📋 Configuración de Stripe (Pasos del Cliente)

Para habilitar los pagos, el cliente debe:

1. **Crear cuenta en [Stripe Dashboard](https://dashboard.stripe.com)**

2. **Crear producto y precio:**
   - Ir a Productos → Añadir producto
   - Nombre: "Suscripción CAP Mensual"  
   - Precio: XX€/mes (recurrente)
   - Copiar el ID del precio (ej: `price_xxx`)

3. **Obtener API Keys:**
   - Ir a Desarrolladores → Claves API
   - Copiar "Clave publicable" (pk_test_xxx o pk_live_xxx)
   - Copiar "Clave secreta" (sk_test_xxx o sk_live_xxx)

4. **Configurar en el panel CAP:**
   - Ir a Configuración → Panel Stripe
   - Ingresar las API keys
   - Guardar

5. **Configurar Webhook:**
   - En Stripe: Desarrolladores → Webhooks → Añadir endpoint
   - URL: `https://tu-dominio.com/wp-json/cap/v1/stripe-webhook`
   - Eventos a escuchar:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
   - Copiar el "Secreto de firma" y guardarlo en el panel

6. **Instalar SDK Stripe (si no está):**
   ```bash
   cd wp-content/themes/glory
   composer require stripe/stripe-php
   ```

---

## 🔧 Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Actualizar Composer
composer update
```

---

## 📁 Archivos Clave

| Archivo                                  | Propósito                         |
| ---------------------------------------- | --------------------------------- |
| `App/Services/CalendarEngine.php`        | Motor de generación (**BUG-001**) |
| `App/Api/CapEndpoints.php`               | Todos los endpoints REST          |
| `App/Database/CapSchema.php`             | Esquema de tablas                 |
| `App/Database/CapSeeder.php`             | Datos de demostración             |
| `App/Services/StripeService.php`         | Integración Stripe                |
| `islands/cap/hooks/useCalendario.ts`     | Estado del calendario             |
| `islands/cap/hooks/useDisponibilidad.ts` | Estado disponibilidad             |

---

## ⚠️ Notas Importantes

1. **El botón "Generar" debería eliminar solo clases no bloqueadas:** Clases con candado (🔒) deben permanecer al regenerar. Esto está implementado en `CalendarEngine`, pero requiere verificar que funcione correctamente.

2. **Modo demo solo en desarrollo:** El panel de datos de ejemplo solo aparece si `WP_DEBUG` está activo o si existe la constante `CAP_ALLOW_DEMO_MODE`.

3. **Período de prueba:** Los usuarios nuevos tienen 14 días de prueba gratuita desde el registro.

4. **Semana de generación:** El motor genera para la semana que se pasa en el request, NO la semana visible en pantalla si son diferentes.
