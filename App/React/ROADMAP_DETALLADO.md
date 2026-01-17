# ROADMAP DETALLADO: Plataforma SaaS Gestor CAP

> **Última actualización:** 2026-01-17  
> **Estado:** Planificación inicial

---

## 1. Visión General del Proyecto

### 1.1 Objetivo
Desarrollo de una plataforma web SaaS que permite a las autoescuelas automatizar la creación de calendarios para el curso CAP (Certificado de Aptitud Profesional) de 35 horas.

### 1.2 Modelo de Negocio
- Suscripción mensual para administradores de autoescuelas
- Fase 1: Plan único estándar
- Futuro: Niveles Básico/Premium

### 1.3 Restricciones Técnicas
- Fase 1: Gestión de una única clase/aula simultánea
- Base de datos preparada para multiclase (escalabilidad futura)

---

## 2. Stack Tecnológico

| Capa              | Tecnología                      | Justificación                          |
| ----------------- | ------------------------------- | -------------------------------------- |
| **Frontend**      | React + TypeScript              | Interactividad compleja del calendario |
| **Estilos**       | CSS Vanilla + Variables         | Flexibilidad y control total           |
| **Backend**       | Node.js con Express (o Laravel) | Lógica de negocio y suscripciones      |
| **Base de Datos** | PostgreSQL                      | Escalabilidad y transacciones          |
| **Pagos**         | Stripe                          | Suscripciones recurrentes              |
| **Autenticación** | JWT + Cookies seguras           | Sesiones persistentes                  |

---

## 3. Fases de Desarrollo

### Fase 0: Infraestructura Base
- [ ] **0.1** Configuración del proyecto
  - [ ] 0.1.1 Inicializar proyecto React con Vite
  - [ ] 0.1.2 Configurar TypeScript
  - [ ] 0.1.3 Configurar ESLint + Prettier
  - [ ] 0.1.4 Crear estructura de carpetas (SRP)

- [ ] **0.2** Sistema de diseño base
  - [ ] 0.2.1 Crear `variables.css` (colores, espaciados, tipografía)
  - [ ] 0.2.2 Crear `init.css` (reset y estilos base)
  - [ ] 0.2.3 Definir tokens de diseño
  - [ ] 0.2.4 Configurar Google Fonts (Inter/Outfit)

- [ ] **0.3** Componentes UI base
  - [ ] 0.3.1 Componente `Boton` (variantes: primario, secundario, peligro)
  - [ ] 0.3.2 Componente `Input` (texto, email, password, number)
  - [ ] 0.3.3 Componente `Tarjeta` (contenedor genérico)
  - [ ] 0.3.4 Componente `Modal` (overlay + contenido)
  - [ ] 0.3.5 Componente `Alerta` (info, éxito, advertencia, error)
  - [ ] 0.3.6 Componente `Spinner` (carga)

---

### Fase 1: Módulo de Acceso y Autenticación
- [ ] **1.1** Pantalla de Login
  - [ ] 1.1.1 Diseño visual (referencia: `ejemplo.jsx` líneas 72-101)
  - [ ] 1.1.2 Formulario con validación (email + contraseña)
  - [ ] 1.1.3 Estado de carga durante autenticación
  - [ ] 1.1.4 Manejo de errores de login
  - [ ] 1.1.5 Persistencia de sesión (localStorage/cookies)

- [ ] **1.2** Pantalla de Registro
  - [ ] 1.2.1 Formulario de registro (nombre, email, empresa, contraseña)
  - [ ] 1.2.2 Validación de campos
  - [ ] 1.2.3 Verificación de email único
  - [ ] 1.2.4 Flujo de confirmación

- [ ] **1.3** Recuperación de contraseña
  - [ ] 1.3.1 Pantalla "Olvidé mi contraseña"
  - [ ] 1.3.2 Envío de email con enlace de reset
  - [ ] 1.3.3 Pantalla de nueva contraseña

- [ ] **1.4** Contexto de autenticación
  - [ ] 1.4.1 Crear `AuthContext` con Zustand
  - [ ] 1.4.2 Rutas protegidas (PrivateRoute)
  - [ ] 1.4.3 Redirección automática según estado

---

### Fase 2: Layout Principal (Dashboard)
- [ ] **2.1** Estructura del Layout
  - [ ] 2.1.1 Sidebar con navegación (referencia: líneas 264-300)
  - [ ] 2.1.2 Versión compacta para pantallas pequeñas
  - [ ] 2.1.3 Área principal de contenido
  - [ ] 2.1.4 Transiciones suaves entre secciones

- [ ] **2.2** Navegación
  - [ ] 2.2.1 Tab "Calendario" (icono + label)
  - [ ] 2.2.2 Tab "Alumnos" (icono + label)
  - [ ] 2.2.3 Tab "Configuración" (icono + label)
  - [ ] 2.2.4 Botón "Cerrar Sesión" (footer del sidebar)
  - [ ] 2.2.5 Estado activo visible en navegación

- [ ] **2.3** Header contextual
  - [ ] 2.3.1 Título de sección actual
  - [ ] 2.3.2 Indicador de suscripción activa
  - [ ] 2.3.3 Acciones rápidas contextuales

---

### Fase 3: Módulo de Configuración
- [ ] **3.1** Panel de configuración general
  - [ ] 3.1.1 Nombre del centro/autoescuela
  - [ ] 3.1.2 Datos de contacto

- [ ] **3.2** Configuración de horarios
  - [ ] 3.2.1 Horario de mañana (hora inicio/fin)
  - [ ] 3.2.2 Horario de tarde (hora inicio/fin)
  - [ ] 3.2.3 Horario especial viernes
  - [ ] 3.2.4 Duración de descansos

- [ ] **3.3** Reglas de capacidad
  - [ ] 3.3.1 Input para alumnos máximos por clase
  - [ ] 3.3.2 Texto informativo sobre alertas de exceso

- [ ] **3.4** Panel de suscripción (referencia: líneas 234-240)
  - [ ] 3.4.1 Mostrar plan activo
  - [ ] 3.4.2 Fecha de próxima facturación
  - [ ] 3.4.3 Botón "Gestionar Pagos"
  - [ ] 3.4.4 Integración con Stripe Customer Portal

- [ ] **3.5** Acciones de guardado
  - [ ] 3.5.1 Botón "Guardar Cambios"
  - [ ] 3.5.2 Feedback visual de éxito/error
  - [ ] 3.5.3 Validación antes de guardar

---

### Fase 4: Gestión de Alumnos
- [ ] **4.1** Lista de alumnos
  - [ ] 4.1.1 Tabla con columnas: Nombre, Progreso, Estado
  - [ ] 4.1.2 Ordenación por columnas
  - [ ] 4.1.3 Búsqueda/filtrado
  - [ ] 4.1.4 Paginación

- [ ] **4.2** Creación de alumno
  - [ ] 4.2.1 Modal/formulario de nuevo alumno
  - [ ] 4.2.2 Campos: nombre, email, teléfono, DNI
  - [ ] 4.2.3 Validación de datos

- [ ] **4.3** Edición de alumno
  - [ ] 4.3.1 Modal de edición
  - [ ] 4.3.2 Pre-carga de datos existentes
  - [ ] 4.3.3 Guardado con confirmación

- [ ] **4.4** Matriz de disponibilidad del alumno
  - [ ] 4.4.1 Grid de días x horas
  - [ ] 4.4.2 Selección flexible (click/drag para marcar)
  - [ ] 4.4.3 Visualización clara de horas disponibles
  - [ ] 4.4.4 Guardado automático o manual

- [ ] **4.5** Progreso del alumno
  - [ ] 4.5.1 Barra de progreso visual (X/35h)
  - [ ] 4.5.2 Desglose por asignatura
  - [ ] 4.5.3 Indicadores de estado (completado, en progreso, pendiente)

- [ ] **4.6** Estados del alumno
  - [ ] 4.6.1 `ok` - En curso normal
  - [ ] 4.6.2 `warning` - Pocas horas completadas
  - [ ] 4.6.3 `completed` - Curso finalizado
  - [ ] 4.6.4 Badge visual por estado

---

### Fase 5: Motor de Calendario (Core)
- [ ] **5.1** Vista del calendario semanal
  - [ ] 5.1.1 Grid de 5 columnas (Lunes-Viernes)
  - [ ] 5.1.2 Navegación entre semanas (anterior/siguiente)
  - [ ] 5.1.3 Indicador de semana actual
  - [ ] 5.1.4 Altura mínima por día

- [ ] **5.2** Tarjeta de clase (`ClaseCard`)
  - [ ] 5.2.1 Diseño visual (referencia: líneas 142-168)
  - [ ] 5.2.2 Mostrar: asignatura, hora inicio/fin, alumnos
  - [ ] 5.2.3 Indicador de bloqueo (candado)
  - [ ] 5.2.4 Estados visuales: bloqueada vs libre

- [ ] **5.3** Reglas legales del CAP (inmutables)
  - [ ] 5.3.1 Validar curso total: 35 horas
  - [ ] 5.3.2 Validar duración mínima: 4 días
  - [ ] 5.3.3 Validar máximo diario: 9 horas/alumno
  - [ ] 5.3.4 Calcular descansos obligatorios:
    - 6h lectivas → 30min descanso
    - 9h lectivas → 45min descanso

- [ ] **5.4** Asignaturas del curso CAP
  - [ ] 5.4.1 Definir las 8 asignaturas
  - [ ] 5.4.2 Duración de cada asignatura
  - [ ] 5.4.3 Colores/iconos por asignatura

- [ ] **5.5** Sistema de bloqueo de clases
  - [ ] 5.5.1 Toggle de bloqueo por clase
  - [ ] 5.5.2 Icono de candado visible
  - [ ] 5.5.3 Estilo diferenciado (fondo rojo)
  - [ ] 5.5.4 Las clases bloqueadas no se regeneran

- [ ] **5.6** Barra de acciones del calendario
  - [ ] 5.6.1 Botón "Deshacer" (historial)
  - [ ] 5.6.2 Botón "Reportes" (descarga PDFs)
  - [ ] 5.6.3 Botón "Generar" (ejecutar algoritmo)

---

### Fase 6: Algoritmo de Generación
- [ ] **6.1** Motor de generación
  - [ ] 6.1.1 Algoritmo que cruza:
    - Disponibilidad de alumnos
    - Reglas legales CAP
    - Capacidad del aula
  - [ ] 6.1.2 Respetar clases bloqueadas
  - [ ] 6.1.3 Distribución óptima de asignaturas

- [ ] **6.2** Detección de conflictos de aforo
  - [ ] 6.2.1 Comparar demanda vs capacidad
  - [ ] 6.2.2 Identificar slots conflictivos
  - [ ] 6.2.3 No generar automáticamente si hay conflicto

- [ ] **6.3** Modal de exceso de aforo (referencia: líneas 106-140)
  - [ ] 6.3.1 Mostrar alerta con icono de advertencia
  - [ ] 6.3.2 Información del conflicto (día, hora, demanda, capacidad)
  - [ ] 6.3.3 Lista de alumnos pendientes con checkboxes
  - [ ] 6.3.4 Botón "Cancelar"
  - [ ] 6.3.5 Botón "Confirmar Selección"
  - [ ] 6.3.6 Continuar generación tras confirmación

- [ ] **6.4** Regeneración inteligente
  - [ ] 6.4.1 Botón para regenerar
  - [ ] 6.4.2 Respetar bloqueados
  - [ ] 6.4.3 Recalcular solo huecos libres

- [ ] **6.5** Estado de generación
  - [ ] 6.5.1 Indicador visual "Calculando..."
  - [ ] 6.5.2 Animación de carga
  - [ ] 6.5.3 Feedback de éxito/error

---

### Fase 7: Edición Interactiva del Calendario
- [ ] **7.1** Drag & Drop de clases
  - [ ] 7.1.1 Arrastrar clases entre slots
  - [ ] 7.1.2 Validación en tiempo real
  - [ ] 7.1.3 Feedback visual durante arrastre
  - [ ] 7.1.4 Confirmar o rechazar movimiento

- [ ] **7.2** Historial de cambios (Undo/Redo)
  - [ ] 7.2.1 Guardar snapshot antes de cada cambio
  - [ ] 7.2.2 Botón "Deshacer" funcional
  - [ ] 7.2.3 Límite de snapshots en memoria
  - [ ] 7.2.4 Opcional: botón "Rehacer"

- [ ] **7.3** Edición inline de clase
  - [ ] 7.3.1 Click en clase para expandir opciones
  - [ ] 7.3.2 Cambiar hora inicio/fin
  - [ ] 7.3.3 Cambiar asignatura
  - [ ] 7.3.4 Ver alumnos asignados

---

### Fase 8: Módulo de Reportes
- [ ] **8.1** Generación de PDF - Plan del Alumno
  - [ ] 8.1.1 Horario semanal personalizado
  - [ ] 8.1.2 Datos del alumno
  - [ ] 8.1.3 Formato imprimible

- [ ] **8.2** Generación de PDF - Control de Horas
  - [ ] 8.2.1 Resumen por asignatura
  - [ ] 8.2.2 Total de horas impartidas
  - [ ] 8.2.3 Asistencia por alumno

- [ ] **8.3** Interfaz de descarga
  - [ ] 8.3.1 Selector de tipo de reporte
  - [ ] 8.3.2 Selector de semana/alumno
  - [ ] 8.3.3 Botón de descarga
  - [ ] 8.3.4 Preview opcional

---

### Fase 9: Pasarela de Pago (Stripe)
- [ ] **9.1** Configuración de Stripe
  - [ ] 9.1.1 Crear cuenta Stripe
  - [ ] 9.1.2 Configurar productos y precios
  - [ ] 9.1.3 Configurar webhooks

- [ ] **9.2** Flujo de suscripción
  - [ ] 9.2.1 Checkout de Stripe al registrarse
  - [ ] 9.2.2 Verificación de pago exitoso
  - [ ] 9.2.3 Activación de cuenta

- [ ] **9.3** Gestión de suscripción
  - [ ] 9.3.1 Portal de cliente Stripe
  - [ ] 9.3.2 Cancelación de suscripción
  - [ ] 9.3.3 Cambio de método de pago

- [ ] **9.4** Manejo de estados
  - [ ] 9.4.1 Suscripción activa → acceso completo
  - [ ] 9.4.2 Suscripción cancelada → acceso limitado/bloqueado
  - [ ] 9.4.3 Pago fallido → notificación + gracia

---

### Fase 10: Backend y Base de Datos
- [ ] **10.1** Diseño de base de datos
  - [ ] 10.1.1 Tabla `usuarios` (admins de autoescuelas)
  - [ ] 10.1.2 Tabla `autoescuelas` (centros)
  - [ ] 10.1.3 Tabla `alumnos`
  - [ ] 10.1.4 Tabla `disponibilidad_alumnos`
  - [ ] 10.1.5 Tabla `asignaturas`
  - [ ] 10.1.6 Tabla `clases` (slots del calendario)
  - [ ] 10.1.7 Tabla `asistencia` (alumno_clase)
  - [ ] 10.1.8 Tabla `configuracion_centro`
  - [ ] 10.1.9 Tabla `suscripciones`
  - [ ] 10.1.10 Campo `classroom_id` para escalabilidad multiclase

- [ ] **10.2** API REST
  - [ ] 10.2.1 Endpoints de autenticación
  - [ ] 10.2.2 CRUD de alumnos
  - [ ] 10.2.3 CRUD de clases
  - [ ] 10.2.4 Endpoint de generación de calendario
  - [ ] 10.2.5 Endpoint de reportes
  - [ ] 10.2.6 Webhooks de Stripe

- [ ] **10.3** Seguridad
  - [ ] 10.3.1 Autenticación JWT
  - [ ] 10.3.2 Validación de permisos
  - [ ] 10.3.3 Rate limiting
  - [ ] 10.3.4 Sanitización de inputs

---

### Fase 11: Testing y QA
- [ ] **11.1** Tests unitarios
  - [ ] 11.1.1 Tests de componentes UI
  - [ ] 11.1.2 Tests del algoritmo de generación
  - [ ] 11.1.3 Tests de validaciones

- [ ] **11.2** Tests de integración
  - [ ] 11.2.1 Flujo de autenticación
  - [ ] 11.2.2 Flujo de generación de calendario
  - [ ] 11.2.3 Flujo de suscripción

- [ ] **11.3** Tests E2E
  - [ ] 11.3.1 Cypress o Playwright
  - [ ] 11.3.2 Escenarios críticos

---

### Fase 12: Despliegue y DevOps
- [ ] **12.1** Entorno de desarrollo
- [ ] **12.2** Entorno de staging
- [ ] **12.3** Entorno de producción
- [ ] **12.4** CI/CD con GitHub Actions
- [ ] **12.5** Monitoreo y logging
- [ ] **12.6** Backups automáticos

---

## 4. Prioridad de Desarrollo

### MVP (Mínimo Producto Viable)
| Prioridad | Fase | Descripción                            |
| --------- | ---- | -------------------------------------- |
| 🔴 Alta    | 0    | Infraestructura base                   |
| 🔴 Alta    | 1    | Login/Registro                         |
| 🔴 Alta    | 2    | Layout principal                       |
| 🔴 Alta    | 4    | Gestión básica de alumnos              |
| 🔴 Alta    | 5    | Vista del calendario                   |
| 🔴 Alta    | 6    | Algoritmo de generación (básico)       |
| 🟡 Media   | 3    | Configuración                          |
| 🟡 Media   | 7    | Edición interactiva                    |
| 🟡 Media   | 9    | Stripe (puede ser manual inicialmente) |
| 🟢 Baja    | 8    | Reportes PDF                           |

---

## 5. Estimación de Tiempo

| Fase                        | Estimación     |
| --------------------------- | -------------- |
| Fase 0: Infraestructura     | 3-4 días       |
| Fase 1: Autenticación       | 4-5 días       |
| Fase 2: Layout              | 2-3 días       |
| Fase 3: Configuración       | 3-4 días       |
| Fase 4: Gestión Alumnos     | 5-6 días       |
| Fase 5: Vista Calendario    | 4-5 días       |
| Fase 6: Algoritmo           | 7-10 días      |
| Fase 7: Edición Interactiva | 5-6 días       |
| Fase 8: Reportes            | 4-5 días       |
| Fase 9: Stripe              | 5-7 días       |
| Fase 10: Backend            | 10-15 días     |
| Fase 11: Testing            | 5-7 días       |
| Fase 12: Despliegue         | 3-4 días       |
| **TOTAL ESTIMADO**          | **60-80 días** |

---

## 6. Dependencias Entre Fases

```
Fase 0 (Infraestructura)
    ↓
Fase 1 (Autenticación) ─────→ Fase 9 (Stripe)
    ↓
Fase 2 (Layout)
    ↓
┌───┴───┐
↓       ↓
Fase 3  Fase 4 (Alumnos)
(Config)    ↓
    ↓   Fase 5 (Calendario)
    ↓       ↓
    └───────┴───→ Fase 6 (Algoritmo)
                      ↓
                  Fase 7 (Edición)
                      ↓
                  Fase 8 (Reportes)
```

---

## 7. Notas Importantes

### Escalabilidad Multiclase
- Desde el inicio, incluir `classroom_id` en las tablas relevantes
- Aunque la UI maneje una sola clase, la estructura soportará expansión futura

### Decisiones Clave Pendientes
1. ¿Backend en Node.js o Laravel?
2. ¿Hosting: Vercel, Railway, VPS propio?
3. ¿Servicio de emails transaccionales?

---

## 8. Referencias Visuales

El archivo `ejemplo.jsx` contiene un prototipo funcional con:
- Pantalla de login (líneas 72-101)
- Layout con sidebar (líneas 264-300)
- Vista del calendario (líneas 170-224)
- Tarjeta de clase con bloqueo (líneas 142-168)
- Modal de exceso de aforo (líneas 106-140)
- Panel de configuración (líneas 226-256)
- Tabla de alumnos (líneas 306-330)

Usar este archivo como **guía visual** para los componentes a desarrollar.

---

> **Siguiente paso sugerido:** Iniciar con la **Fase 0** creando la estructura del proyecto y el sistema de diseño base.
