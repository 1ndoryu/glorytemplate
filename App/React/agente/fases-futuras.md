# Fases Futuras - Esbozos

Este documento contiene notas para las fases posteriores a la Fase 1.
Se irán detallando conforme avancemos.

---

## Fase 2: Autenticación (Completado)

- [x] Login con WordPress (Simulado Frontend)
- [x] Register con WordPress (Simulado Frontend)
- [x] Logout
- [x] Mostrar panel automáticamente cuando hay sesión (sin botón explícito)
- [x] Redirección post-login

---

## Fase 3: Panel Cliente Base (En Progreso)

**Estado Actual:** Diseño "Nakomi Dashboard" implementado con éxito. Interfaz compacta y moderna.

**Arquitectura y Diseño:**
- [x] Rediseño completo estilo "IDE/Dashboard" minimalista (colores oscuros, bordes sutiles).
- [x] Implementación de **Lucide React** para iconografía consistente (16px).
- [x] Layout compacto de alta densidad (Header 48px, Sidebar 48px).
- [x] Sidebar navegación fija con tooltips.
- [x] Header con pestañas de navegación (Tabs).

**Funcionalidades:**
- [x] Integración real con sesión de WordPress (window.GLORY_AUTH).
- [x] Redirección automática LoggedIn -> Panel.
- [x] Vista "Resumen General" con stats y servicios activos.
- [x] Vista "Hosting" con simulación de terminal y recursos del servidor.
- [x] Vista "Marketplace" de servicios.
- [ ] Conectar datos reales de backend (Servicios de WP).
- [ ] Implementar Logout real (backend).

---

## Fase 4: Catálogo de Servicios

Listado público de todos los servicios ofrecidos:
- Aplicaciones React
- Apps móviles
- Temas WordPress
- Mantenimiento WordPress
- Sitios Laravel
- Sitios en frameworks populares
- Apps Windows (JS)
- Ciberseguridad
- Hosting y dominios

Cada servicio tiene:
- Descripción
- Planes disponibles
- Precios
- Tiempo de entrega estimado

---

## Fase 5: Contratación de Servicios

Flujo completo:
1. Cliente elige servicio
2. Elige plan/características
3. Elige tiempo de entrega predefinido
4. Escribe requerimientos
5. Procede al pago

---

## Fase 6: Sistema de Pagos

- Integración de pasarela (definir cuál)
- Retención del pago hasta entrega
- Mecanismo de liberación
- Mecanismo de devolución
- Facturación automática

---

## Fase 7: Suscripciones

- Planes recurrentes (mensual/anual)
- Gestión de renovación
- Cancelación
- Ejemplo: hosting con pago mensual/anual

---

## Fase 8: Comunicación

- Mensajería dentro de la plataforma
- Cliente ↔ Empleado responsable
- Historial de conversaciones
- Notificaciones

---

## Fase 9: Panel Empleado

- Vista de servicios asignados
- Ver requerimientos del cliente
- Marcar entregas
- Comunicarse con cliente
- Admin puede asignar servicios a empleados

---

## Fase 10: Panel Admin

- Dashboard con métricas
- Lista de todos los clientes
- Lista de todos los servicios en curso
- Asignar servicios a empleados
- Enviar facturas de pagos pendientes
- Gestión de ingresos y pagos
- Usa backend de WordPress para agilizar

**Nota:** Admin también puede funcionar como empleado.

---

## Fase 11: Sistema de Reseñas

- Cliente puede dejar reseña tras servicio completado
- Mostrar reseñas en el sitio público
- **Migración:** Pasar reseñas del Fiverr antiguo al nuevo

---

## Fase 12: Servicios Avanzados (Hosting)

**EXTREMADAMENTE COMPLEJO - DEJAR DE ÚLTIMA**

Gestión de hosting con Coolify (sin cPanel):
- Contratar hosting → crea petición
- Elegir plan con características
- Pago mensual o anual
- Cuando está contratado:
  - Permitir conexión SSH
  - Administrar archivos
  - Ver almacenamiento
  - Solicitar cancelación
  - Acciones normales de hosting

Requisitos técnicos por definir.
