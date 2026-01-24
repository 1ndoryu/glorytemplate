# Plan: Sistema de Facturación y Panel Cliente

> **Prioridad:** Alta  
> **Estado:** En Progreso (Fases 1-4, Rev, 7, 8, Vistas Rol completadas)  
> **Última actualización:** 2026-01-23

---

## Contexto del Cliente Real

### Cliente: Guillermo

| Producto  | Detalle                           | Precio           | Fecha Compra | Estado                         |
| --------- | --------------------------------- | ---------------- | ------------ | ------------------------------ |
| Hosting 1 | guillechatbots.es                 | $3/mes o $36/año | Enero 2026   | Activo, impago                 |
| Hosting 2 | materialdepadel.es                | $3/mes o $36/año | Enero 2026   | Activo, impago                 |
| Hosting 3 | cap.wandori.us (dominio temporal) | $3/mes o $36/año | Enero 2026   | Activo, impago                 |
| Dominio 1 | guillechatbots.es                 | $11/año          | Enero 2026   | Activo, impago                 |
| Dominio 2 | materialdepadel.es                | $11/año          | Enero 2026   | Activo, impago                 |
| Dominio 3 | [pendiente de comprar para CAP]   | $11/año          | -            | Pendiente                      |
| Servicio  | Diseño web (CAP)                  | $270             | Enero 2026   | En progreso, pago al finalizar |

**Nota:** El servicio de diseño ($270) incluye dominio + hosting del primer año.

**Resumen pendiente Enero 2026:**
- 3 Hostings: $9 (3 x $3)
- 2 Dominios: $22 (2 x $11)
- **Total pendiente:** $31

---

## Objetivo

Crear un sistema funcional donde:
1. El cliente vea sus productos contratados (hostings, dominios, servicios)
2. El cliente vea sus facturas pendientes
3. El cliente pueda pagar con Stripe
4. El sistema detecte pagos automáticamente

---

## Arquitectura de Datos

### Entidades principales

```typescript
// Cliente
interface Cliente {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
    fechaRegistro: string;
}

// Hosting contratado
interface HostingContratado {
    id: string;
    clienteId: string;
    dominio: string;
    dominioTemporal?: string; // cap.wandori.us mientras no tiene dominio propio
    stackUuid: string; // Referencia interna a Coolify (oculto al cliente)
    plan: 'mensual' | 'anual';
    precioMensual: number; // 3
    precioAnual: number; // 36
    fechaInicio: string;
    fechaProximaRenovacion: string;
    estado: 'activo' | 'suspendido' | 'cancelado';
    pagado: boolean;
}

// Dominio contratado
interface DominioContratado {
    id: string;
    clienteId: string;
    nombre: string; // guillechatbots.es
    fechaExpiracion: string;
    renovacionAutomatica: boolean;
    estado: 'activo' | 'expirado' | 'pendiente';
    incluidoEnServicio?: string; // ID del servicio que lo incluye
}

// Servicio contratado (diseño, mantenimiento, etc.)
interface ServicioContratado {
    id: string;
    clienteId: string;
    tipo: 'diseno_web' | 'mantenimiento' | 'desarrollo';
    nombre: string;
    descripcion: string;
    precio: number;
    estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
    fechaInicio: string;
    fechaEntregaEstimada?: string;
    pagoAlFinalizar: boolean;
    incluyeHosting: boolean;
    incluyeDominio: boolean;
    hostingMesesIncluidos: number; // 12 = primer año incluido
}

// Factura
interface Factura {
    id: string;
    clienteId: string;
    referencia: string; // INV-2026-001
    concepto: string;
    items: FacturaItem[];
    subtotal: number;
    impuestos: number;
    total: number;
    estado: 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
    fechaEmision: string;
    fechaVencimiento: string;
    fechaPago?: string;
    metodoPago?: string;
    stripePaymentIntentId?: string;
}

interface FacturaItem {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
    productoRef?: string; // ID del hosting/dominio/servicio
}
```

---

## Fases de Implementación

### Fase 1: Modelo de Datos y Mocks Reales

**Archivos a crear/modificar:**
- `data/types/cliente.ts` - Interfaces TypeScript
- `data/types/facturacion.ts` - Interfaces de facturación
- `data/mocks/clientes.ts` - Datos de Guillermo
- `data/mocks/hostings.ts` - Sus 3 hostings
- `data/mocks/serviciosContratados.ts` - Su servicio de diseño
- `data/mocks/facturas.ts` - Actualizar con facturas reales pendientes

**Tareas:**
- [x] Crear estructura de tipos
- [x] Crear datos mock de Guillermo
- [x] Crear facturas pendientes reales

---

### Fase 2: Vista de Facturación Mejorada

**Objetivo:** El cliente ve claramente qué debe y puede pagar.

**Componentes:**
```
components/panel/views/
├── VistaFacturas.tsx      # Refactorizar completamente
├── facturas/
│   ├── ListaFacturas.tsx  # Tabla de facturas
│   ├── TarjetaFactura.tsx # Card individual
│   ├── ResumenDeuda.tsx   # Total pendiente destacado
│   └── ModalPagarFactura.tsx # Detalle + botón Stripe
```

**Diseño:**
- Header con resumen: "Tienes $X pendiente de pago"
- Tabs: Pendientes | Pagadas | Todas
- Cada factura muestra: referencia, concepto, fecha, monto, estado
- Botón "Pagar" que abre modal con detalle
- Modal muestra items de la factura y botón Stripe

---

### Fase 3: Vista de Hostings del Cliente

**Objetivo:** El cliente ve sus sitios web activos.

**Componentes:**
```
components/panel/views/
├── VistaHosting.tsx       # Refactorizar para mostrar lista
├── hosting/
│   ├── ListaHostings.tsx  # Grid de hostings
│   ├── TarjetaHosting.tsx # Card con info del sitio
│   └── DetalleHosting.tsx # Vista expandida (stats opcionales)
```

**Diseño:**
- Grid de tarjetas (1 por hosting)
- Cada tarjeta muestra:
  - Dominio (link al sitio)
  - Estado: Activo/Suspendido
  - Plan: Mensual/Anual
  - Próxima renovación
  - Indicador visual si hay pago pendiente
- Clic abre detalle (sin datos técnicos de Coolify)
- Opción de cambiar plan (mensual ↔ anual)

**Nota:** Stats de CPU/RAM desde Coolify = Fase futura (muy complejo).

---

### Fase 4: Vista de Servicios en Progreso

**Objetivo:** El cliente ve el servicio que está en desarrollo.

**Componentes:**
```
components/panel/views/
├── VistaServicios.tsx     # Nueva vista
├── servicios/
│   ├── TarjetaServicioContratado.tsx
│   └── DetalleServicio.tsx
```

**Diseño:**
- Tarjeta grande mostrando:
  - Nombre del servicio: "Diseño Web - CAP"
  - Estado: "En progreso"
  - Precio: $270
  - Incluye: Dominio + Hosting (12 meses)
  - Indicador: "Pago pendiente al finalizar"
- Timeline de progreso (opcional, fase futura)

---

### Fase 5: Integración con Stripe

**Objetivo:** Pagos reales (modo test primero).

**Configuración Glory/WordPress:**
- Verificar si Glory tiene helper para Stripe
- Configurar API keys de test
- Endpoint REST para crear PaymentIntent
- Webhook para confirmar pagos

**Flujo:**
1. Cliente hace clic en "Pagar" en una factura
2. Frontend llama a endpoint WP para crear PaymentIntent
3. Se abre modal de Stripe (Stripe Elements o Checkout)
4. Cliente paga
5. Webhook actualiza estado de factura a "pagada"
6. Frontend refleja el cambio

**Archivos:**
- Backend (PHP/WP): endpoint REST + webhook
- Frontend: componente de pago con Stripe.js

---

### Fase 6: Crear Cuenta de Guillermo

**Acciones:**
- Crear usuario WordPress para Guillermo
- Asociar sus productos al usuario
- Enviarle credenciales

---

## Estructura de Archivos Final

```
App/React/
├── data/
│   ├── types/
│   │   ├── cliente.ts
│   │   ├── facturacion.ts
│   │   ├── hosting.ts
│   │   └── servicio.ts
│   └── mocks/
│       ├── clientes.ts
│       ├── hostingsContratados.ts
│       ├── serviciosContratados.ts
│       └── facturas.ts (actualizado)
├── components/
│   └── panel/
│       └── views/
│           ├── VistaFacturas.tsx (refactorizado)
│           ├── VistaHosting.tsx (refactorizado)
│           ├── VistaServicios.tsx (nuevo)
│           ├── facturas/
│           ├── hosting/
│           └── servicios/
├── context/
│   └── PanelContext.tsx (actualizado)
└── styles/
    └── layouts/
        ├── facturas.css (mejorado)
        ├── hosting.css (mejorado)
        └── servicios.css (nuevo)
```

---

## Estimación de Esfuerzo

| Fase | Descripción             | Complejidad | Estado       |
| ---- | ----------------------- | ----------- | ------------ |
| 1    | Modelo de datos y mocks | Baja        | ✅ Completada |
| 2    | Vista Facturación       | Media       | ✅ Completada |
| 3    | Vista Hostings          | Media       | ✅ Completada |
| 4    | Vista Servicios         | Baja        | ✅ Completada |
| 4.5  | Vista Dominios          | Baja        | ✅ Completada |
| Rev  | Revisiones UI/UX        | Media       | ✅ Completada |
| 5    | Stripe                  | Alta        | ⏳ Pendiente  |
| 6    | Cuenta Guillermo        | Baja        | ⏳ Pendiente  |
| 7    | Sistema de Usuarios     | Media       | ✅ Completada |

**Orden recomendado:** 1 → 2 → 3 → 4 → **Rev** → 4.5 → 6 → 5

---

## Revisiones Pendientes (UI/UX)

### Prioridad Alta - Antes de continuar

- [x] **Hostings: Layout 1 columna** - Cambiar grid de 2 columnas a 1 columna
- [x] **Hostings: Diseño minimalista** - Simplificar tarjetas, menos ruido visual
- [x] **Servicios: Diseño minimalista** - Reducir elementos, tarjeta más limpia
- [x] **Auditar uso de `<Boton>`** - Verificar que todos los botones usen el componente UI
- [x] **Verificar variables CSS** - Asegurar uso de `--nakomi-*` en todos los estilos

### Funcionalidad pendiente

- [x] **Pago por hosting individual** - El cliente puede pagar hostings uno por uno (Mock implementado)
- [x] **Cambiar plan: mensual ↔ anual** - Modal para cambiar plan con diferencia de precio
- [x] **Modal confirmación cambio plan** - Mostrar nuevo precio y fecha de renovación

---

## Fase 4.5: Vista de Dominios (Nueva)

**Objetivo:** El cliente ve sus dominios contratados.

**Componentes:**
```
components/panel/views/
├── VistaDominios.tsx      # Nueva vista
├── dominios/
│   ├── ListaDominios.tsx
│   └── TarjetaDominio.tsx
```

**Diseño:**
- Lista vertical (1 columna) como hostings
- Cada tarjeta muestra:
  - Nombre del dominio
  - Fecha de expiración
  - Estado (activo/expirado)
  - Indicador si está pendiente de pago
- Botón renovar (si aplica)

**Navegación:**
- Agregar al sidebar del panel: "Mis Dominios"

---

## Clarificaciones Importantes

### Confusión de Vistas de Servicios

**Problema identificado:** La vista "Mis Servicios" actualmente muestra servicios contratados cuando el usuario es cliente, pero debería mostrar servicios PUBLICADOS por el usuario.

**Corrección necesaria:**
- **"Mis Servicios"** = Servicios que el usuario PUBLICA (modelo Fiverr) - Tanto admin como clientes pueden publicar
- **Dashboard/Resumen** = Donde aparece `TarjetaServicioContratado` (servicios que el cliente ha comprado)

**Acción:** Refactorizar la vista "Mis Servicios" para que SIEMPRE muestre servicios publicados del usuario. Mover `TarjetaServicioContratado` al Dashboard.

---

## Sistema de Vistas por Rol (Planificación)

### Arquitectura General

El panel debe soportar dos modos de operación claramente diferenciados:

| Vista             | Admin                                                    | Cliente                         |
| ----------------- | -------------------------------------------------------- | ------------------------------- |
| **Dashboard**     | Resumen global + servicios que ha contratado (si aplica) | Resumen + servicios contratados |
| **Mis Servicios** | Sus servicios publicados                                 | Sus servicios publicados        |
| **Hostings**      | TODOS los hostings de TODOS los clientes                 | Solo sus hostings               |
| **Dominios**      | TODOS los dominios de TODOS los clientes                 | Solo sus dominios               |
| **Facturas**      | TODAS las facturas de TODOS los clientes                 | Solo sus facturas               |

### Vista Admin - Panel de Administración

**Objetivo:** El admin necesita ver y gestionar TODOS los recursos de todos los clientes.

**Hostings (Admin):**
- Lista completa de hostings de todos los clientes
- Filtros: por cliente, por estado, por fecha
- Columna adicional: "Cliente" mostrando a quién pertenece
- Acciones: suspender, reactivar, cambiar plan, gestionar en Coolify

**Dominios (Admin):**
- Lista completa de dominios de todos los clientes
- Filtros: por cliente, por estado, próximos a vencer
- Columna adicional: "Cliente"
- Acciones: renovar, transferir, cancelar

**Facturas (Admin):**
- Lista completa de facturas de todos los clientes
- Filtros: por cliente, por estado (pendiente/pagada/vencida), por fecha
- Columna adicional: "Cliente"
- Acciones: marcar como pagada, reenviar, anular
- Posibilidad de pagar en nombre del cliente (para casos de pago manual)

### Seguridad - Crítico ⚠️

**Frontend:**
- El filtrado por usuario se realiza en el frontend actualmente (mocks)
- Cuando se implemente el backend, NUNCA confiar en el frontend para filtrar datos sensibles

**Backend (TO-DO - Fase 11):**
- Verificar siempre el rol del usuario en CADA endpoint
- Los endpoints de cliente solo devuelven recursos del usuario autenticado
- Los endpoints de admin verifican permisos antes de devolver todos los recursos
- Usar middleware de autenticación de WordPress
- Registrar accesos a datos sensibles (audit log)

### Cambios Necesarios por Vista

**VistaServicios.tsx:**
- [x] Eliminar lógica de mostrar servicios contratados (mover al Dashboard)
- [x] Mostrar siempre servicios PUBLICADOS del usuario actual
- [x] Si el usuario no tiene servicios publicados, mostrar CTA para crear uno

**VistaResumen.tsx (Dashboard):**
- [x] Agregar sección de "Servicios Contratados" con `TarjetaServicioContratado`
- [x] Resumen de deuda pendiente
- [x] Próximas renovaciones (hostings, dominios)

**VistaHosting.tsx:**
- [x] Detectar si es admin: mostrar todos los hostings con columna "Cliente"
- [x] Detectar si es cliente: filtrar solo sus hostings

**VistaDominios.tsx:**
- [x] Detectar si es admin: mostrar todos los dominios con columna "Cliente"
- [x] Detectar si es cliente: filtrar solo sus dominios

**VistaFacturas.tsx:**
- [x] Detectar si es admin: mostrar todas las facturas con columna "Cliente"
- [x] Detectar si es cliente: filtrar solo sus facturas

### Prioridad de Implementación

1. ~~**Alta:** Corregir VistaServicios (separar publicados de contratados)~~ ✅
2. ~~**Alta:** Mover servicios contratados al Dashboard~~ ✅
3. ~~**Media:** Adaptar vistas de Hosting/Dominios/Facturas para admin~~ ✅
4. **Alta:** Implementar seguridad en backend cuando se conecte a WP


---

## Sistema de Servicios (Modelo Fiverr)

### Concepto General

Similar a Fiverr, los usuarios pueden publicar servicios que otros usuarios contratan. Por ahora:
- **Proveedor inicial:** La agencia (nosotros) publica los servicios
- **Cliente:** Guillermo contrata servicios de la agencia
- **Futuro:** Cualquier usuario podrá publicar servicios

### Estructura de Datos de Servicios

```typescript
// Servicio publicado (lo que el proveedor ofrece)
interface ServicioPublicado {
    id: string;
    proveedorId: string;          // Usuario que publica el servicio
    nombre: string;               // Ej: "Diseño Web Profesional"
    descripcion: string;
    precio: number;
    imagenUrl: string;            // Imagen real del servicio
    categoria: string;
    tiempoEntregaDias: number;
    activo: boolean;
    fechaCreacion: string;
}

// Servicio contratado (lo que el cliente compra)
interface ServicioContratado {
    id: string;
    servicioPublicadoId: string;  // Referencia al servicio original
    clienteId: string;
    proveedorId: string;
    nombrePersonalizado?: string; // Ej: "Diseño Web - CAP" (para Guillermo)
    // ... resto de campos existentes
}
```

### Vistas Necesarias

| Vista            | Rol       | Descripción                                             |
| ---------------- | --------- | ------------------------------------------------------- |
| Mis Servicios    | Proveedor | Servicios que publico/ofrezco                           |
| Dashboard        | Cliente   | Servicios que he contratado (TarjetaServicioContratado) |
| Catálogo         | Todos     | Explorar servicios disponibles (futuro)                 |
| Detalle Servicio | Todos     | Ver un servicio con sus planes y contratar              |

### Imagen del Servicio

**Problema actual:** La imagen es aleatoria y cambia en cada render.

**Solución:** El servicio debe tener un campo `imagenUrl` que apunte a la imagen real del servicio publicado. El `ServicioContratado` hereda la imagen del `ServicioPublicado` al que hace referencia.

---

## Sistema de Usuarios y Simulación

### Problema Actual

Cuando se accede con usuario admin, el panel muestra datos de Guillermo. Esto es útil para pruebas pero confuso.

### Solución Implementada ✅

1. **UsuarioContext** - Contexto React para gestionar usuario actual
2. **ToggleSimulacion** - Botón en header para admins
3. **useUsuario hook** - Acceso al usuario actual y funciones de simulación

**Archivos creados:**
- `data/types/usuario.ts` - Tipos de usuario
- `data/mocks/usuarios.ts` - Mock de usuarios (admin + Guillermo)
- `context/UsuarioContext.tsx` - Contexto y provider
- `components/panel/ToggleSimulacion.tsx` - Componente toggle

**Uso:**
```tsx
const {usuario, esAdmin, simulando, toggleSimulacion} = useUsuario();
```

---

## Mejoras de UI Pendientes

### TarjetaServicioContratado

- [x] **Imagen real del servicio** - No aleatoria, desde ServicioPublicado
- [x] **Botón contextual** - Reemplazar "Ver" por icono de 3 puntos (menú contextual)
- [x] **Menú de acciones** - Al hacer clic: Ver detalles, Contactar proveedor, etc.

### Menú Contextual de Servicios

✅ Acciones implementadas:
- Ver detalles del servicio
- Ver progreso (si aplica)
- Contactar proveedor
- Descargar factura (si está pagado)
- Reportar problema

---

## Notas Pendientes

### Servicios - Planificación Detallada
- [x] Crear entidad `ServicioPublicado` con imagen y datos del servicio
- [x] Relacionar `ServicioContratado` con `ServicioPublicado`
- [x] Vista "Mis Servicios" para publicar/gestionar servicios (Admin ve sus servicios publicados)
- [x] Modal de edición de servicio publicado (Fase 8 completada)
- [ ] Página individual (single post) de servicio (estilo Fiverr)
- [ ] Catálogo de servicios disponibles
- [ ] Sistema de categorías

### Sistema de Usuarios
- [x] Hook `useUsuarioPanel` para obtener usuario actual
- [x] Botón toggle "Ver como Admin" / "Ver como Cliente"
- [ ] Integración con usuarios reales de WordPress (TO-DO: leer window.wpUser)

### Mejoras arquitectónicas detectadas
- [ ] Extraer lógica de formateo de fechas a un hook/util
- [ ] Crear componente genérico `TarjetaProducto` para reutilizar en hostings/dominios/servicios
- [ ] Unificar estilos de estados (activo/pendiente/suspendido) en variables CSS
- [x] Componente `MenuContextual` reutilizable

### Bugs Conocidos
- [x] **Menús contextuales cortados** - Resuelto usando Portal de React. El menú ahora se renderiza directamente en el `<body>` con posicionamiento fixed, evitando cortes por overflow de contenedores padre.

---

## Fases Futuras - Planificación

### Fase 8: Modal de Edición de Servicio ✅ COMPLETADA

**Objetivo:** Permitir editar servicios publicados sin salir del panel.

**Componentes creados:**
- `ModalEditarServicio.tsx` - Formulario completo con validación
- Estilos en `servicios.css` (campos, toggle, previsualización imagen)

**Funcionalidades implementadas:**
- Crear nuevo servicio desde botón "Nuevo Servicio"
- Editar servicio existente desde menú de 3 puntos
- Validación de campos obligatorios (nombre, descripción, precio, tiempo)
- Previsualización de imagen en tiempo real
- Toggle para activar/desactivar servicio
- Estado local reactivo (simula BD)

---

### Fase 9: Single de Servicio (Página Individual)

**Objetivo:** Página pública de cada servicio estilo Fiverr.

**Ruta:** `/servicio/{slug}` o `?servicio={id}`

**Componentes:**
- `PaginaServicio.tsx` - Layout completo
- Secciones: Hero con imagen, descripción, precio, botón contratar, reviews (futuro)

**Diseño:**
- Columna izquierda: Imagen grande, descripción extendida
- Columna derecha: Card de precio, tiempo entrega, botón "Contratar"

---

### Fase 10: Catálogo de Servicios

**Objetivo:** Grid público de servicios disponibles para contratar.

**Componentes:**
- `VistaCatalogo.tsx` - Grid de `TarjetaServicioPublicado` (versión pública)
- Filtros: Por categoría, precio, tiempo de entrega

**Ubicación:** Accesible desde Marketplace o sección pública

---

### Fase 11: Integración WordPress Real

**Objetivo:** Conectar con usuarios y datos reales de WP.

**Tareas:**
1. Leer `window.wpUser` para obtener usuario logueado
2. Endpoint REST `/wp-json/glory/v1/usuario` para datos del cliente
3. Endpoint REST `/wp-json/glory/v1/servicios` para servicios publicados
4. Migrar mocks a CPT (Custom Post Type) o ACF

---

## Sistema de Servicios y Trabajos - Arquitectura Completa

### Flujo de Trabajo

```
ADMIN (Proveedor)                        CLIENTE
─────────────────                        ───────
1. Publica servicios en catálogo         
                                         2. Explora catálogo
                                         3. Contrata servicio
4. Recibe notificación de nuevo trabajo  
5. Acepta/Rechaza el trabajo             
6. Trabaja en el proyecto                7. Ve progreso en Dashboard
   ↳ Actualiza progreso (%)              
   ↳ Sube entregables                    8. Recibe notificación de avance
   ↳ Envía mensaje                       9. Responde mensaje
10. Marca como "Listo para revisión"     
                                         11. Revisa entrega
                                         12a. Aprueba → Completado
                                         12b. Solicita revisión → Vuelve a paso 6
13. Sistema genera factura automática    14. Paga factura vía Stripe
15. Recibe pago                          
```

### Entidades de Datos en WordPress

#### ServicioPublicado (CPT: `glory_servicio`)

```
glory_servicio (Custom Post Type)
├── post_title: "Diseño Web Profesional"
├── post_content: descripción larga
├── post_author: ID del proveedor
├── post_status: publish/draft
├── post_meta:
│   ├── _precio: 270
│   ├── _tiempo_entrega_dias: 30
│   ├── _categoria: "diseno_web"
│   ├── _imagen_destacada: URL
│   ├── _incluye_hosting_meses: 12
│   ├── _incluye_dominio: true
│   └── _activo: true
```

#### ServicioContratado (CPT: `glory_trabajo`)

```
glory_trabajo (Custom Post Type)
├── post_title: "Diseño Web - CAP" (generado)
├── post_author: ID del cliente
├── post_status: publish
├── post_meta:
│   ├── _servicio_publicado_id: ID del servicio base
│   ├── _proveedor_id: ID del proveedor
│   ├── _estado: "en_progreso" | "revision" | "completado" | "cancelado"
│   ├── _progreso_porcentaje: 65
│   ├── _fecha_contratacion: "2026-01-01"
│   ├── _fecha_entrega_estimada: "2026-01-31"
│   ├── _fecha_completado: null
│   ├── _precio_acordado: 270
│   ├── _revisiones_restantes: 2
│   ├── _notas_internas: "Cliente pidió diseño oscuro"
│   └── _factura_id: null (se genera al completar)
```

#### Actualizaciones de Progreso (CPT: `glory_actualizacion`)

```
glory_actualizacion (Custom Post Type)
├── post_title: "Avance del diseño"
├── post_content: "He completado la estructura..."
├── post_author: ID de quien publica
├── post_parent: ID del trabajo
├── post_meta:
│   ├── _tipo: "progreso" | "entrega" | "revision_solicitada"
│   ├── _porcentaje_anterior: 30
│   ├── _porcentaje_nuevo: 65
│   └── _archivos: ["url1.jpg", "url2.pdf"]
```

#### Mensajes (CPT: `glory_mensaje`)

```
glory_mensaje (Custom Post Type)
├── post_content: contenido del mensaje
├── post_author: ID del remitente
├── post_parent: ID del trabajo
├── post_date: timestamp
├── post_meta:
│   ├── _leido: false
│   └── _archivos: [] (adjuntos opcionales)
```

### Sistema de Revisiones

| Campo                   | Descripción                            |
| ----------------------- | -------------------------------------- |
| `_revisiones_restantes` | Número de revisiones incluidas (ej: 2) |
| `_revisiones_usadas`    | Contador de revisiones solicitadas     |

**Flujo de revisión:**
1. Proveedor marca trabajo como "Listo para revisión"
2. Cliente revisa y puede:
   - **Aprobar** → Estado cambia a "completado", se genera factura
   - **Solicitar revisión** → `_revisiones_usadas++`, estado vuelve a "en_progreso"
3. Si `_revisiones_usadas >= _revisiones_restantes`, revisiones extra tienen costo adicional

### Generación Automática de Facturas

**Trigger:** Cuando `_estado` cambia a `"completado"`

**Proceso:**
1. Sistema lee `_precio_acordado` del trabajo
2. Crea nueva factura en `glory_factura` (CPT)
3. Asocia items: servicio base + extras si hubo revisiones adicionales
4. Estado inicial: `"pendiente"`
5. Notifica al cliente por email

### Endpoints REST Necesarios

| Endpoint                           | Método   | Descripción                           |
| ---------------------------------- | -------- | ------------------------------------- |
| `/glory/v1/servicios`              | GET      | Lista servicios publicados (catálogo) |
| `/glory/v1/servicios/{id}`         | GET      | Detalle de un servicio                |
| `/glory/v1/trabajos`               | GET      | Trabajos del usuario actual           |
| `/glory/v1/trabajos/{id}`          | GET      | Detalle de un trabajo                 |
| `/glory/v1/trabajos/{id}/progreso` | POST     | Actualizar progreso                   |
| `/glory/v1/trabajos/{id}/mensajes` | GET/POST | Leer/enviar mensajes                  |
| `/glory/v1/trabajos/{id}/revision` | POST     | Solicitar revisión                    |
| `/glory/v1/trabajos/{id}/aprobar`  | POST     | Aprobar entrega                       |
| `/glory/v1/facturas`               | GET      | Facturas del usuario                  |
| `/glory/v1/facturas/{id}/pagar`    | POST     | Iniciar pago Stripe                   |

---

## Nota sobre Datos Mock

Los datos de prueba actuales (María López, sus hostings, dominios y factura) son **temporales** para desarrollo. Al implementar la Fase 11, serán reemplazados por datos reales de WordPress.

**Datos reales confirmados:**
- Cliente: Guillermo (CLI-001)
- 3 Hostings reales
- 2 Dominios reales
- 1 Servicio contratado: Diseño Web CAP

---

*Este documento se actualizará conforme avance la implementación.*
*Última actualización: 2026-01-23*
