# Plan: Sistema de Facturación y Panel Cliente

> **Prioridad:** Alta  
> **Estado:** En Progreso  
> **Última actualización:** 2026-01-24T16:10

---

## Resumen de Fases

| Fase | Descripción                    | Estado       |
| ---- | ------------------------------ | ------------ |
| 1    | Modelo de datos y mocks        | ✅ Completada |
| 2    | Vista Facturación              | ✅ Completada |
| 3    | Vista Hostings                 | ✅ Completada |
| 4    | Vista Servicios                | ✅ Completada |
| 4.5  | Vista Dominios                 | ✅ Completada |
| Rev  | Revisiones UI/UX               | ✅ Completada |
| 7    | Sistema de Usuarios/Simulación | ✅ Completada |
| 8    | Modal Edición Servicio         | ✅ Completada |
| 9    | Single de Servicio             | ✅ Completada |
| 10   | Catálogo/Marketplace           | ✅ Completada |
| 5    | Stripe                         | ⏳ Pendiente  |
| 6    | Cuenta Guillermo               | ⏳ Pendiente  |
| 11   | Integración WordPress Real     | ⏳ Pendiente  |
| 12   | Dashboard Admin diferenciado   | ✅ Completada |

---

## 🐛 Bugs y Correcciones Pendientes

### Alta Prioridad

1. ~~**Modal "Ver detalles" en servicios en progreso no abre**~~ ✅ **RESUELTO**
   - Se creó `PaginaServicioContratado.tsx` para mostrar detalle del servicio
   - Se añadió handler `handleVerDetallesServicio` en `VistaResumen.tsx`
   - Se añadió ruta `detalle_servicio_contratado` en `PanelCliente.tsx`
   - Se añadieron campos `progreso`, `fechaContratacion`, `revisionesRestantes` al tipo

2. **No se pueden editar servicios publicados** ✅ **RESUELTO**
   - Handler `handleEditarServicio` definido en `VistaServicios.tsx`
   - Se pasa como prop `onEditar` a `ListaServiciosPublicados.tsx`
   - `TarjetaServicioPublicado.tsx` conecta la acción "Editar" del `MenuContextual`
   - El modal `ModalEditarServicio.tsx` recibe el servicio y permite edición

3. ~~**Dominios sin opción de pago**~~ ✅ **RESUELTO**
   - Se añadió `pagado: boolean` y `precioAnual: number` a DominioContratado
   - Se agregó alerta visual de "Pago pendiente" en TarjetaDominio
   - Se agregó botón "Pagar ahora" con handler en VistaDominios
   - ResumenDominios ahora muestra conteo y monto de impagos

4. ~~**Factura sin desglose de items**~~ ✅ **RESUELTO**
   - El mock `facturas.ts` ya tiene items correctamente desglosados
   - `ModalPagarFactura.tsx` renderiza los items correctamente

### Media Prioridad

5. ~~**Inconsistencia en Marketplace**~~ ✅ **RESUELTO**
   - Se añadió propiedad `activo?: boolean` al tipo `Servicio`
   - Se añadió `activo: true` a todos los servicios del mock `servicios.ts`
   - `PanelContext.tsx` ahora filtra solo servicios activos para el Marketplace
   - Marketplace mostrará únicamente servicios con `activo: true`

6. **Incoherencia de datos entre vistas** ✅ **RESUELTO**
   - Se añadió `marcarProductosComoPagados()` en `PanelContext.tsx`
   - Al pagar factura, los hostings/dominios referenciados se marcan como `pagado: true`
   - `VistaFacturas.handleConfirmarPago` extrae `productoRef` de cada item y sincroniza
   - Los mocks de dominios ahora usan estado reactivo (useState) igual que hostings

---

## Cliente de Referencia: Guillermo

| Producto  | Detalle            | Precio  | Estado   | Pagado         |
| --------- | ------------------ | ------- | -------- | -------------- |
| Hosting 1 | guillechatbots.es  | $3/mes  | Activo   | ❌ No           |
| Hosting 2 | materialdepadel.es | $3/mes  | Activo   | ❌ No           |
| Hosting 3 | cap.wandori.us     | $3/mes  | Activo   | ❌ No           |
| Dominio 1 | guillechatbots.es  | $11/año | Activo   | ❌ No           |
| Dominio 2 | materialdepadel.es | $11/año | Activo   | ❌ No           |
| Servicio  | Diseño web (CAP)   | $270    | Progreso | ⏳ Al finalizar |

**Total pendiente:** $31 (3 hostings × $3 + 2 dominios × $11)

---

## Arquitectura de Datos

### Tipos principales (`data/types/`)
- `cliente.ts` - Cliente
- `hosting.ts` - HostingContratado
- `dominio.ts` - DominioContratado (✅ con campo `pagado` y `precioAnual`)
- `facturacion.ts` - Factura, FacturaItem
- `servicio.ts` - ServicioPublicado, ServicioContratado
- `usuario.ts` - Usuario, roles

### Mocks (`data/mocks/`)
- `clientes.ts` - Datos de Guillermo
- `hostingsContratados.ts` - Sus 3 hostings
- `dominiosContratados.ts` - Sus 2 dominios (✅ con `pagado: false`)
- `facturas.ts` - Factura pendiente (⚠️ verificar items desglosados)
- `serviciosContratados.ts` - Servicio CAP
- `serviciosPublicados.ts` - Catálogo de la agencia

---

## Sistema de Vistas por Rol

| Vista             | Admin                       | Cliente                    |
| ----------------- | --------------------------- | -------------------------- |
| **Dashboard**     | Panel de gestión global     | Resumen personal           |
| **Mis Servicios** | Sus servicios publicados    | Sus servicios publicados   |
| **Hostings**      | TODOS (con columna Cliente) | Solo sus hostings          |
| **Dominios**      | TODOS (con columna Cliente) | Solo sus dominios          |
| **Facturas**      | TODAS (con columna Cliente) | Solo sus facturas          |
| **Marketplace**   | Explorar servicios activos  | Explorar servicios activos |

---

## Fase 12: Dashboard Admin ✅ COMPLETADA

### Implementación

El Dashboard Admin se activa automáticamente cuando:
- El usuario tiene rol `admin`
- NO está en modo simulación (toggle "Ver como cliente")

### Componentes Creados (`views/admin/`)

1. **`VistaResumenAdmin.tsx`** - Dashboard principal del admin
   - Grid de métricas globales (clientes, ingresos, trabajos, alertas)
   - Integración de todos los sub-componentes
   - Cálculos automáticos basados en datos del contexto

2. **`TarjetaResumenGlobal.tsx`** - Tarjeta de estadística
   - Props: etiqueta, valor, subtexto, icono, variante
   - 4 variantes de color: primario, exito, alerta, error

3. **`TablaClientes.tsx`** - Lista de clientes
   - Muestra: nombre, email, deuda, servicios activos
   - Acciones: ver cliente, enviar recordatorio

4. **`ListaTrabajosActivos.tsx`** - Servicios en progreso
   - Barra de progreso visual
   - Metadatos: cliente, fecha entrega
   - Acción: ver detalle del trabajo

5. **`ListaAlertasAdmin.tsx`** - Alertas del sistema
   - Tipos: factura_vencida, hosting_impago, dominio_expira
   - Iconos y colores diferenciados por tipo

### Estilos

- `styles/layouts/panel/dashboardAdmin.css`
- Grid responsive 1→2→4 columnas
- Barras de progreso animadas
- Alertas con borde lateral colorizado

---

## Fase 5: Integración Stripe

**Flujo de pago:**
1. Cliente clic en "Pagar" → Frontend llama endpoint WP
2. Backend crea PaymentIntent → Devuelve clientSecret
3. Modal Stripe Elements → Cliente ingresa tarjeta
4. Stripe procesa → Webhook notifica a WP
5. Backend actualiza factura a "pagada"
6. Frontend refleja cambio

**Archivos necesarios:**
- `App/Api/StripeEndpoints.php` - Crear PaymentIntent, webhook
- `components/panel/ModalStripe.tsx` - UI de pago
- Configurar en `.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## Fase 11: Integración WordPress Real

### Objetivo
Migrar de mocks a datos reales almacenados en WordPress usando CPT y REST API.

### Custom Post Types (CPTs) a crear

#### `glory_servicio` (Servicios Publicados)
```
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

#### `glory_trabajo` (Servicios Contratados)
```
├── post_title: "Diseño Web - CAP"
├── post_author: ID del cliente
├── post_meta:
│   ├── _servicio_publicado_id: ID servicio base
│   ├── _proveedor_id: ID proveedor
│   ├── _estado: "en_progreso" | "revision" | "completado"
│   ├── _progreso_porcentaje: 65
│   ├── _fecha_contratacion: "2026-01-01"
│   ├── _fecha_entrega_estimada: "2026-01-31"
│   ├── _precio_acordado: 270
│   ├── _revisiones_restantes: 2
│   └── _factura_id: null
```

#### `glory_factura` (Facturas)
```
├── post_title: "INV-2026-001"
├── post_author: ID del cliente
├── post_meta:
│   ├── _items: JSON array de items
│   ├── _subtotal: 31.00
│   ├── _impuestos: 0
│   ├── _total: 31.00
│   ├── _estado: "pendiente" | "pagada" | "vencida"
│   ├── _fecha_vencimiento: "2026-02-15"
│   └── _stripe_payment_id: null
```

#### `glory_hosting` (Hostings Contratados)
```
├── post_title: "guillechatbots.es"
├── post_author: ID del cliente
├── post_meta:
│   ├── _dominio: "guillechatbots.es"
│   ├── _dominio_temporal: null
│   ├── _stack_uuid: "uuid-coolify"
│   ├── _plan: "mensual" | "anual"
│   ├── _precio_mensual: 3
│   ├── _fecha_inicio: "2026-01-01"
│   ├── _fecha_renovacion: "2026-02-01"
│   ├── _estado: "activo" | "suspendido"
│   └── _pagado: false
```

### Endpoints REST necesarios

| Endpoint                           | Método | Descripción                     |
| ---------------------------------- | ------ | ------------------------------- |
| `/glory/v1/usuario`                | GET    | Usuario actual con rol          |
| `/glory/v1/servicios`              | GET    | Servicios publicados (catálogo) |
| `/glory/v1/servicios/{id}`         | GET    | Detalle de un servicio          |
| `/glory/v1/servicios`              | POST   | Crear servicio (proveedor)      |
| `/glory/v1/trabajos`               | GET    | Trabajos del usuario            |
| `/glory/v1/trabajos/{id}`          | GET    | Detalle de un trabajo           |
| `/glory/v1/trabajos/{id}/progreso` | POST   | Actualizar progreso             |
| `/glory/v1/trabajos/{id}/aprobar`  | POST   | Aprobar entrega                 |
| `/glory/v1/hostings`               | GET    | Hostings del usuario            |
| `/glory/v1/dominios`               | GET    | Dominios del usuario            |
| `/glory/v1/facturas`               | GET    | Facturas del usuario            |
| `/glory/v1/facturas/{id}/pagar`    | POST   | Iniciar pago Stripe             |

### Flujo de trabajo completo

```
PROVEEDOR                               CLIENTE
─────────                               ───────
1. Publica servicio en catálogo         
                                        2. Explora catálogo
                                        3. Contrata servicio
4. Recibe notificación                  
5. Acepta trabajo                       
6. Trabaja en proyecto                  7. Ve progreso en Dashboard
   ↳ Actualiza porcentaje               
   ↳ Sube entregables                   8. Recibe notificación
10. Marca "Listo para revisión"         
                                        11. Revisa entrega
                                        12a. Aprueba → Completado
                                        12b. Pide revisión → Paso 6
13. Sistema genera factura              14. Paga vía Stripe
15. Recibe pago                         
```

### Tareas de implementación

1. **Crear CPTs** - Archivo `App/PostTypes/FacturacionPostTypes.php`
2. **Crear endpoints** - Archivo `App/Api/FacturacionApi.php`
3. **Leer usuario WP** - Modificar `UsuarioContext.tsx` para leer `window.wpUser`
4. **Migrar mocks** - Reemplazar imports de mocks por llamadas fetch a API
5. **Permisos** - Middleware que verifica rol en cada endpoint

---

## Mejoras Arquitectónicas

### Completadas ✅
- [x] Utility `fechaUtils.ts` (formatearFecha, diasHastaFecha, fechaProxima)
- [x] Variables CSS de estados (`--nakomi-estadoActivo`, etc.)
- [x] Variantes semánticas en Etiqueta (exito, alerta, error, info, neutro)
- [x] Componente `MenuContextual` reutilizable

### Pendientes
- [x] Componente genérico `TarjetaProducto` (hostings/dominios/servicios) - ver TarjetaBase
- [ ] Integración usuarios reales WordPress
- [x] Campo `pagado` en DominioContratado ✅
- [x] Sincronización de pago entre facturas y productos ✅

---

## Notas Técnicas

### Sistema de Usuarios
- `UsuarioContext.tsx` - Gestiona usuario actual
- `ToggleSimulacion.tsx` - Botón para admins (ver como cliente)
- Hook: `useUsuario()` → `{usuario, esAdmin, simulando, toggleSimulacion}`

### Seguridad Backend (TO-DO)
- Verificar rol en CADA endpoint
- Endpoints cliente: solo recursos del usuario autenticado
- Endpoints admin: verificar `capability` antes de devolver datos
- Usar nonce de WordPress para CSRF
- Audit log para accesos sensibles

---

*Última actualización: 2026-01-24*
