# Plan: Sistema de Facturación y Panel Cliente

> **Prioridad:** Alta  
> **Estado:** En Progreso  
> **Última actualización:** 2026-01-24

---

## Resumen de Fases

| Fase | Descripción                    | Estado        |
| ---- | ------------------------------ | ------------- |
| 1    | Modelo de datos y mocks        | ✅ Completada  |
| 2    | Vista Facturación              | ✅ Completada  |
| 3    | Vista Hostings                 | ✅ Completada  |
| 4    | Vista Servicios                | ✅ Completada  |
| 4.5  | Vista Dominios                 | ✅ Completada  |
| Rev  | Revisiones UI/UX               | ✅ Completada  |
| 7    | Sistema de Usuarios/Simulación | ✅ Completada  |
| 8    | Modal Edición Servicio         | ✅ Completada  |
| 9    | Single de Servicio             | ✅ Completada  |
| 10   | Catálogo/Marketplace           | ✅ Completada  |
| 5    | Stripe                         | ⏳ Pendiente   |
| 6    | Cuenta Guillermo               | ⏳ Pendiente   |
| 11   | Integración WordPress Real     | ⏳ Pendiente   |
| 12   | Dashboard Admin diferenciado   | ⏳ Planificado |

---

## Cliente de Referencia: Guillermo

| Producto  | Detalle            | Precio  | Estado                         |
| --------- | ------------------ | ------- | ------------------------------ |
| Hosting 1 | guillechatbots.es  | $3/mes  | Activo, impago                 |
| Hosting 2 | materialdepadel.es | $3/mes  | Activo, impago                 |
| Hosting 3 | cap.wandori.us     | $3/mes  | Activo, impago                 |
| Dominio 1 | guillechatbots.es  | $11/año | Activo, impago                 |
| Dominio 2 | materialdepadel.es | $11/año | Activo, impago                 |
| Servicio  | Diseño web (CAP)   | $270    | En progreso, pago al finalizar |

**Total pendiente:** $31 (hostings + dominios)

---

## Arquitectura de Datos (Tipos principales)

Los tipos están definidos en `data/types/`:
- `cliente.ts` - Cliente, HostingContratado, DominioContratado
- `facturacion.ts` - Factura, FacturaItem
- `servicio.ts` - ServicioPublicado, ServicioContratado
- `usuario.ts` - Usuario, roles

---

## Sistema de Vistas por Rol

| Vista             | Admin                       | Cliente                  |
| ----------------- | --------------------------- | ------------------------ |
| **Dashboard**     | Panel de gestión global     | Resumen personal         |
| **Mis Servicios** | Sus servicios publicados    | Sus servicios publicados |
| **Hostings**      | TODOS (con columna Cliente) | Solo sus hostings        |
| **Dominios**      | TODOS (con columna Cliente) | Solo sus dominios        |
| **Facturas**      | TODAS (con columna Cliente) | Solo sus facturas        |
| **Marketplace**   | Explorar servicios          | Explorar servicios       |

---

## Fase 12: Dashboard Admin (PLANIFICACIÓN)

### Problema Actual
El Dashboard es idéntico para Admin y Cliente. El Admin necesita un panel de gestión diferenciado.

### Dashboard Cliente (actual - OK)
- Resumen de deuda pendiente
- Servicios contratados en progreso
- Próximas renovaciones (hostings, dominios)

### Dashboard Admin (TO-DO)
**Objetivo:** Panel de control para gestionar todos los clientes y recursos.

**Secciones propuestas:**
1. **Resumen Global**
   - Total clientes activos
   - Ingresos del mes
   - Facturas pendientes totales
   - Servicios en progreso

2. **Lista de Clientes**
   - Tabla con: nombre, email, deuda, servicios activos
   - Filtros: por estado, deuda pendiente
   - Acciones: ver perfil, enviar factura

3. **Últimos Pagos Recibidos**
   - Tabla con: cliente, monto, fecha, concepto
   - Marcas de tiempo relativas ("hace 2 días")

4. **Servicios en Progreso**
   - Lista de trabajos activos con porcentaje
   - Cliente asignado, fecha entrega estimada
   - Botones: actualizar progreso, marcar entregado

5. **Próximas Renovaciones**
   - Hostings y dominios que renuevan en los próximos 30 días
   - Indicador si el cliente tiene deuda
   - Acciones: enviar recordatorio, renovar manualmente

6. **Alertas**
   - Facturas vencidas sin pagar
   - Hostings impagos hace más de X días
   - Dominios por expirar

**Componentes a crear:**
- `DashboardAdmin.tsx`
- `TarjetaResumenGlobal.tsx`
- `TablaClientes.tsx`
- `ListaUltimosPagos.tsx`
- `ListaTrabajosActivos.tsx`

---

## Fase 5: Integración Stripe (Pendiente)

**Flujo:**
1. Cliente clic en "Pagar" → Frontend llama endpoint WP
2. Backend crea PaymentIntent → Devuelve clientSecret
3. Modal Stripe Elements → Cliente paga
4. Webhook actualiza factura a "pagada"

**Archivos necesarios:**
- Backend: `App/Api/stripe-endpoints.php`
- Frontend: componente `ModalStripe.tsx`
- Configurar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`

---

## Fase 11: Integración WordPress Real (Pendiente)

**Tareas:**
1. Leer `window.wpUser` para usuario logueado
2. Endpoints REST: `/glory/v1/usuario`, `/glory/v1/servicios`, etc.
3. Migrar mocks a CPT (Custom Post Types)

**CPTs planificados:**
- `glory_servicio` - Servicios publicados
- `glory_trabajo` - Servicios contratados
- `glory_factura` - Facturas

---

## Mejoras Arquitectónicas

### Completadas ✅
- [x] Utility `fechaUtils.ts` (formatearFecha, diasHastaFecha, fechaProxima)
- [x] Variables CSS de estados (`--nakomi-estadoActivo`, etc.)
- [x] Variantes semánticas en Etiqueta (exito, alerta, error, info, neutro)
- [x] Componente `MenuContextual` reutilizable

### Pendientes
- [ ] Componente genérico `TarjetaProducto` (hostings/dominios/servicios)
- [ ] Integración usuarios reales WordPress

---

## Notas Técnicas

### Sistema de Usuarios
- `UsuarioContext.tsx` - Gestiona usuario actual
- `ToggleSimulacion.tsx` - Botón para admins (ver como cliente)
- Hook: `useUsuario()` → `{usuario, esAdmin, simulando, toggleSimulacion}`

### Seguridad (Backend - TO-DO)
- Verificar rol en CADA endpoint
- Endpoints cliente: solo recursos del usuario autenticado
- Endpoints admin: verificar permisos antes de devolver datos
- Audit log para accesos sensibles

---

*Documento compactado el 2026-01-24*
