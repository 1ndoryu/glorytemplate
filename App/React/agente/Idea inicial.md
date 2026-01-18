# Proyecto Nakomi - Detalles Completos

Un breve resumen: es un proyecto **extremadamente ambicioso**.

---

## Portafolio - Proyectos para Mostrar

Lista de proyectos de los que tengo que sacar imágenes para agregar al portafolio:

- https://mabuhayviajes.com
- https://www.entretenedores.net
- https://cosmorevenue.com
- https://guillechatbots.es
- https://materialdepadel.es
- https://autoescuelaCAD.es
- Proyectos de Nakomi (task.nakomi.studio, y los próximos)

---

## Servicios Ofrecidos en Nakomi

- Aplicaciones React
- Aplicaciones móviles
- Temas WordPress desde cero
- Mantenimiento de temas WordPress
- Creación de sitios con Laravel
- Creación de sitios en frameworks más famosos
- Aplicaciones para Windows (JS)
- Ciberseguridad para aplicaciones
- Hosting y dominios

---

## Aplicaciones Propias de Nakomi

Por el momento: `task.nakomi.studio` (y los próximos proyectos)

---

## Panel para Clientes

Los clientes gestionan servicios desde su panel:
- Se suscriben / desuscriben
- Pagan
- Se comunican mediante la plataforma
- Eligen servicios para pagar
- Compran

---

## Contratación de Servicios (Marketplace tipo Fiverr)

- Pedir el pago
- Retener el pago
- Mecanismo de devolución
- Mecanismo de reseñas
- **Nota final:** Pasar reseñas del Fiverr antiguo al nuevo

---

## Panel de Administración

El usuario **Admin** gestiona los clientes:
- Panel con toda la información de los clientes
- Se usa el backend de WordPress para agilizar
- Puede asignar servicios
- Enviar facturas de pagos pendientes
- Gestionar esos servicios

---

## Separación de Responsabilidades (Roles)

### Admin
- Una sola persona
- Gestiona los ingresos, pagos, facturación, clientes
- Todo lo relacionado con la gestión empresarial de Nakomi
- Puede también funcionar como empleado (hacer trabajos)

### Empleado
- Atienden a los clientes
- Si un cliente compra un servicio, un empleado se hace responsable de atenderlo
- El cliente paga el servicio → el pago se retiene
- Elige un tiempo de entrega predefinido
- Envía sus requerimientos y el plan del servicio
- El empleado es responsable de atender y entregar

### Cliente
- Tiene en su panel:
  - Servicios en progreso
  - Suscripciones
  - Historial de pagos
  - Comunicación con responsables

---

## Diseño del Sitio Público (Landing)

**Extremadamente minimalista:**

- La página de inicio será el nombre "nakomi" arriba que cubra el ancho completo dinámicamente
- Abajo: un grid de los proyectos
- Usar imágenes de colors de Glory mientras tanto (6 contenido de ejemplo)
- Cada item del portafolio se puede abrir **sin recargar la página**
- Modal que muestra los detalles e imágenes del proyecto

### Navegación
- Inicio
- Servicios
- Proyectos
- Aplicaciones
- Sobre Nosotros
- Login
- **Panel** (aparece cuando el usuario está logueado)

**Estilo:** Todo muy minimalista. Letras pequeñas y todo muy compacto.

---

## Diseño del Panel de Cliente

**Muy minimalista:**

- Panel lateral que se expande y autoexpande
- Pensar desde el principio en la responsividad
- El inicio del panel muestra los servicios en proceso por defecto

### Gestión de Suscripciones

Esto es complejo porque algunos servicios o suscripciones deben poder gestionarse de forma compleja. No hacen una acción directa todavía para simplificar.

### Ejemplo: Gestión de Hosting (Servicio Complejo)

- Contratar un hosting crea la petición
- Elige un plan con sus características
- Puede pagar mensual o anual
- Cuando el servicio está contratado, puede:
  - Solicitar cancelar el hosting
  - Acciones normales de un hosting

**Nota:** No tenemos cPanel. Gestionamos los hostings con **Coolify**, así que las cosas básicas son:
- Permitir conexión SSH
- Administrar archivos
- Ver almacenamiento
- etc.

**Lo del hosting es extremadamente complejo. Las tareas complejas deben dejarse de última.**

---

## Definición del MVP

Tener el landing listo con:
- Cliente puede contratar servicios
- Gestionar servicios
- Suscribirse a planes
- Cancelar planes
- Comunicarse con los responsables de sus servicios

**Nada muy complicado. Esta es la idea inicial.**

---

## Variables CSS

Se usarán con prefijo `--nakomi-*` (antes era `--dashboard-*`)

Ver: `App/React/styles/variables.css`

---

## Planificación

Ver: `App/React/agente/` para roadmaps por fase.