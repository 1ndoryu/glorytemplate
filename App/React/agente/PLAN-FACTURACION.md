# Plan: Sistema de Facturación y Panel Cliente

> **Prioridad:** Alta  
> **Estado:** Planificación  
> **Última actualización:** 2026-01-22

---

## Contexto del Cliente Real

### Cliente: Guillermo

| Producto  | Detalle                           | Precio           | Estado                         |
| --------- | --------------------------------- | ---------------- | ------------------------------ |
| Hosting 1 | guillechatbots.es                 | $3/mes o $36/año | Activo, impago                 |
| Hosting 2 | materialdepadel.es                | $3/mes o $36/año | Activo, impago                 |
| Hosting 3 | cap.wandori.us (dominio temporal) | $3/mes o $36/año | Activo, impago                 |
| Dominio 1 | guillechatbots.es                 | (incluido/año)   | Por definir                    |
| Dominio 2 | materialdepadel.es                | (incluido/año)   | Por definir                    |
| Dominio 3 | [pendiente de comprar]            | (incluido/año)   | Pendiente                      |
| Servicio  | Diseño web (cap)                  | $270             | En progreso, pago al finalizar |

**Nota:** El servicio de diseño ($270) incluye dominio + hosting del primer año.

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
- [ ] Crear estructura de tipos
- [ ] Crear datos mock de Guillermo
- [ ] Crear facturas pendientes reales

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

| Fase | Descripción             | Complejidad |
| ---- | ----------------------- | ----------- |
| 1    | Modelo de datos y mocks | Baja        |
| 2    | Vista Facturación       | Media       |
| 3    | Vista Hostings          | Media       |
| 4    | Vista Servicios         | Baja        |
| 5    | Stripe                  | Alta        |
| 6    | Cuenta Guillermo        | Baja        |

**Orden recomendado:** 1 → 2 → 3 → 4 → 6 → 5

Primero tener todo visible con mocks, luego integrar pagos reales.

---

## Notas Pendientes

### Servicios (planificar después)
- [ ] Página individual de servicio (estilo Fiverr)
- [ ] Planes y características
- [ ] Gestión desde lado proveedor
- [ ] Gestión desde lado cliente

---

*Este documento se actualizará conforme avance la implementación.*
