# Roadmap General - Proyecto Nakomi

Este documento define las fases macro del desarrollo del proyecto Nakomi.

## Visión General
Nakomi es una plataforma de servicios digitales, portfolio y gestión de clientes.  
Objetivo: Crear un ecosistema donde los clientes puedan contratar, gestionar y pagar servicios (similar a Fiverr pero propio) y ver el portafolio de la agencia.

## Fases del Proyecto

### Fase 0: Preparación del Entorno (Inmediato)
- Limpieza de `App/Config/pages.php`.
- Configuración de variables CSS (Design Tokens).
- Estructura base de React (Islands/Fullpage).

### Fase 1: MVP - Landing & Panel Cliente (Actual)
- **Landing Page Minimalista**: Hero dinámico + Grid Proyectos.
- **Autenticación Básica**: Login WP personalizado.
- **Panel de Cliente (Dashboard)**:
  - Sidebar responsiva y minimalista.
  - Listado de servicios en proceso.
  - Flujo de contratación de servicios (Selección -> Pago/Retención).
  - Gestión de suscripciones básica (Ver, Cancelar).
- **Backend (WP)**:
  - Uso de CPTs (Custom Post Types) para Servicios y Ordenes.
  - Gestión de usuarios (Clientes).

### Fase 2: Gestión Avanzada y Administración
- **Panel de Admin/Empleado**:
  - Gestión centralizada de clientes y ordenes.
  - Asignación de servicios.
- **Comunicación**: Sistema de chat/mensajes contextuales por servicio.
- **Portafolio Avanzado**: Transiciones fluidas, detalles de proyecto in-page.
- **Reseñas**: Sistema de reviews (Migración de data histórica).

### Fase 3: Automatización y Hosting (Complejo)
- **Hosting**: Integración con Coolify para gestión de servidores.
- **Suscripciones Avanzadas**: Automatización de altas/bajas de hosting.
- **Panel Técnico**: SSH, archivos, logs desde el dashboard.

### Fase 4: Expansión de Ecosistema
- Marketplace de aplicaciones.
- Aplicaciones de escritorio (Windows).
- Servicios de Ciberseguridad.
