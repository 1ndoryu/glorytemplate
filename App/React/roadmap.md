# ROADMAP: Plataforma Gestor CAP (WordPress + React Islands)

> **Última actualización:** 2026-01-21  
> **Estado:** ⏳ Fase 11 (Despliegue) - Sitio desplegado en cap.wandori.us  
> **Arquitectura:** WordPress Backend + Glory React Islands

---

## 1. Visión General del Proyecto

### 1.1 Objetivo
Plataforma web que permite a las autoescuelas automatizar la creación de calendarios para el curso CAP (Certificado de Aptitud Profesional) de 35 horas.

### 1.2 Modelo de Negocio
- Suscripción mensual para administradores de autoescuelas
- Fase 1: Plan único estándar
- Futuro: Niveles Básico/Premium

### 1.3 Arquitectura Elegida

| Capa              | Tecnología               | Ventaja               |
| ----------------- | ------------------------ | --------------------- |
| **Frontend**      | React Islands (Glory)    | HMR, TypeScript, SSG  |
| **Estilos**       | CSS Vanilla + Variables  | Control total         |
| **Backend**       | WordPress REST API       | Ya configurado        |
| **Base de datos** | MySQL (tablas custom WP) | Sin config extra      |
| **Autenticación** | Sistema nativo WordPress | Login, roles, cookies |
| **Pagos**         | Stripe + WP              | Webhooks via REST     |
| **Emails**        | wp_mail()                | SMTP ya configurado   |

---

## 2. Stack Técnico

### 2.1 Estructura de Carpetas
- **Frontend:** `App/React/islands/cap/` (componentes, hooks, types)
- **Backend:** `App/Services/`, `App/Models/`, `App/Api/`, `App/Database/`

### 2.2 Tablas MySQL
`wp_cap_centros`, `wp_cap_alumnos`, `wp_cap_disponibilidad`, `wp_cap_clases`, `wp_cap_asistencia`, `wp_cap_configuracion`, `wp_cap_suscripciones`

---

## 3. Fases de Desarrollo

### ✅ Hotfixes Resueltos (H.1-H.24)
24 correcciones aplicadas: Input icons, redirección inicio, iconos centralizados, API nonce, estados independientes, endpoints REST, códigos asignatura, mensajes error, modales, esquema BD, warnings React, estilos reportes, motor generación, grilla disponibilidad, clases bloqueadas, PDF base64, conteo alumnos, horarios modal, UI/PDF consistencia, eliminar clases, clases huérfanas, undo funcional.

### ✅ Fase 0-1: Infraestructura + Autenticación
Estructura carpetas, sistema diseño CSS, componentes UI base, BD con versionado, login/registro WordPress, protección rutas, contexto usuario.

### ✅ Fase 2-3: Layout + Configuración
CapLayout sidebar/mobile, navegación Zustand, header contextual, config centro/horarios/capacidad, panel suscripción, API REST config.
- [ ] 2.3.3 Acciones rápidas contextuales (pendiente por sección)
- [ ] 3.1.3 Logo upload via WP Media

### ✅ Fase 4-5: Alumnos + Calendario
TablaAlumnos CRUD completo, MatrizDisponibilidad, progreso visual, CalendarioSemanal, TarjetaClase, reglas CAP, 8 asignaturas, sistema bloqueo.

### ✅ Fase 6-7: Generación + Edición
CalendarEngine PHP, conflictos aforo, Drag&Drop dnd-kit, historial undo, edición inline modal.

### ✅ Fase 8-9: Reportes + Stripe
PDF dompdf, SeccionReportes, StripeService encriptado, checkout/webhook/portal, flujo post-registro.
- [ ] 9.1.4 Productos Stripe Dashboard (acción manual cliente)

### ✅ Fase 10: Testing/Demo
CapSeeder, PanelDemo, endpoints demo, seguridad WP_DEBUG.

### Fase 11: Despliegue (EN PROGRESO)
- [x] **11.1** Crear stack WordPress en Coolify (cap.wandori.us)
- [x] **11.2** Desplegar tema Glory con branch `glory-react-calendarioesc`
- [x] **11.3** Configurar URLs de WordPress
- [x] **11.4** Activar tema Glory
- [ ] **11.5** Migrar base de datos local (si aplica)
- [ ] **11.6** Configurar Stripe en modo producción
- [ ] **11.7** Crear usuario admin de producción
- [ ] **11.8** Verificar todas las funcionalidades

---

## 4. Estado del Proyecto

| Fase | Descripción           | Estado      |
| ---- | --------------------- | ----------- |
| 0-10 | Desarrollo completo   | ✅ Completa  |
| 11   | Despliegue producción | ⏳ Pendiente |

---

## 5. URLs del Sistema

| Página    | Slug              | Isla React           |
| --------- | ----------------- | -------------------- |
| Login     | `/cap-login/`     | `CapLoginIsland`     |
| Dashboard | `/cap-dashboard/` | `CapDashboardIsland` |
| Registro  | `/cap-registro/`  | `CapRegistroIsland`  |

---

## 6. Endpoints REST API

**Config:** GET/POST `/cap/v1/config`  
**Alumnos:** GET/POST/PUT/DELETE `/cap/v1/alumnos`  
**Disponibilidad:** GET/POST `/cap/v1/disponibilidad/{id}`  
**Clases:** GET `/cap/v1/clases`, POST `/cap/v1/generar`  
**Reportes:** GET `/cap/v1/reportes/{tipo}`  
**Stripe:** GET/POST `/cap/v1/stripe/config`, POST `checkout`, `portal`, `stripe-webhook`  
**Demo:** POST `seed`, DELETE `clean`, GET `status`

---

## 7. Referencias

- Prototipo visual: `ejemplo.jsx` (login, layout, calendario, modal aforo, config, tabla)
- Ahorro WordPress: ~18 días (login, roles, API, emails, hosting)

---

> **Siguiente paso:** Iniciar **Fase 11** de despliegue a producción.
