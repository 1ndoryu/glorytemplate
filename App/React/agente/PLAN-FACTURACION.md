# Plan: Sistema de Facturación y Panel Cliente

> **Prioridad:** Alta  
> **Estado:** En Progreso  
> **Última actualización:** 2026-01-24T18:00 (Seeder & CPTs)

---

## Resumen de Fases

| Fase | Descripción                  | Estado                       |
| ---- | ---------------------------- | ---------------------------- |
| 1-4  | Vistas principales Cliente   | ✅ Completadas                |
| 7-10 | Sistema Usuarios/Servicios   | ✅ Completadas                |
| 5    | Stripe                       | ⏳ En Progreso (UI & Backend) |
| 6    | Cuenta Guillermo             | ✅ Completada (Seeder)        |
| 11   | Integración WordPress Real   | ✅ Completada                 |
| 12   | Dashboard Admin diferenciado | ✅ Completada                 |
| 13   | Refactorización y Mejoras    | 🚀 Pendiente                  |

---

## 🚀 Fase 13: Refactorización y Consistencia

### Objetivos
Revisar incosistencias, mejorar código y refactorizar UI.

### Tareas Detectadas
- [x] **Títulos de Sección Admin vs Cliente**
  - `seccionAdminTitulo` tiene icono y mayúsculas (Inconsistente).
  - `dashboardSeccionTitulo` (Cliente) debe ser el estándar (sin mayúsculas forzadas).
  - Acción: Eliminar iconos en headers de Admin y quitar `uppercase` en ambos roles.

- [x] **Componente `<Seccion />` Unificado**
  - Existencia de múltiples clases CSS (`seccionAdmin`, `dashboardSeccion`...)
  - Crear componente `Seccion.tsx` para estandarizar márgenes y títulos.
  - Reemplazar uso en `VistaResumen` y `VistaResumenAdmin`.
  - Limpiar CSS duplicado.

- [x] **Componente `<CabeceraVista />` (Header)**
  - Patrón repetido: Title + Subtitle en `vistaHeader`.
  - Crear componente reutilizable `CabeceraVista.tsx`.
  - Props: `titulo`, `subtitulo`, `accion` (botones a la derecha).
  - Implementar en `VistaResumen` y `VistaResumenAdmin`.


- [x] **Unificar Grid de Resumen**
  - `dashboardResumen` (Cliente) y `gridResumenAdmin` (Admin) hacen lo mismo.
  - Crear clase unificada `.gridResumen` en un archivo común o componente wrapper.
  - ✅ Implementado `grid-resumen.css` y `TarjetaResumen.tsx` unificados.

- [x] **Auditoría de Inconsistencias CSS/Componentes en el panel**
  - [x] `SeccionPanel`: Unificado títulos y márgenes.
  - [x] `CabeceraVista`: Unificado encabezados.
  - [x] `MenuContextual`: Ajustado CSS y alineación ("texto centrado" corregido).
  - [x] Nomenclatura: Admin ahora usa "Servicios en progreso" en lugar de "Trabajos en progreso".

/* Notas de Planificación
- Se ha unificado la arquitectura de estilos del panel.
- Los componentes `TarjetaResumen` y `SeccionPanel` son ahora la fuente de verdad.
*/

- [x] **Unificación de Servicios en Progreso**
  - Actual: `Servicios en progreso` (Cliente) vs `Trabajos en progreso` (Admin, obsoleto).
  - Requisito: Unificar a "Servicios en progreso".
  - ✅ Implementado: `TarjetaServicioContratado` incluye nombre de proveedor y barra de progreso. `ListaTrabajosActivos` usa nombre de cliente.


- [x] **Experimentos de Diseño (Temporal)**
  - ✅ Probar menú lateral sin fondo (transparent).
  - ✅ Probar header sin fondo en el panel.
  - ↩️ **Revertido:** Se decidió mantener el diseño original opaco por preferencia del usuario.
  - Objetivo: Evaluar limpieza visual.


---

## 🐛 Bugs y Correcciones Pendientes

### Alta Prioridad

1. ~~**Modal "Ver detalles" en servicios en progreso no abre**~~ ✅ **RESUELTO**

2. **No se pueden editar servicios publicados** ✅ **RESUELTO**
   - Handler `handleEditarServicio` definido en `VistaServicios.tsx`
   - Se pasa como prop `onEditar` a `ListaServiciosPublicados.tsx`
   - `TarjetaServicioPublicado.tsx` conecta la acción "Editar" del `MenuContextual`
   - El modal `ModalEditarServicio.tsx` recibe el servicio y permite edición

3. ~~**Dominios sin opción de pago**~~ ✅ **RESUELTO**
4. ~~**Factura sin desglose de items**~~ ✅ **RESUELTO**

### Media Prioridad

5. ~~**Inconsistencia en Marketplace**~~ ✅ **RESUELTO**
6. **Incoherencia de datos entre vistas** ✅ **RESUELTO**

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

- [x] **Crear CPTs** - Archivo `App/PostTypes/FacturacionPostTypes.php`
- [x] **Crear endpoints** - Archivo `App/Api/Facturacion/FacturacionRouter.php`
- [x] **Leer usuario WP** - Modificar `UsuarioContext.tsx` para leer `window.wpUser`
- [x] **Migrar mocks** - Reemplazar imports de mocks por llamadas fetch a API (`facturacionService.ts`)
- [x] **Permisos** - Middleware que verifica rol en cada endpoint
- [x] **Seeder** - Script de inicialización de datos (`App/Setup/GlorySeeder.php`) y botón en Dashboard Admin

---

## Mejoras Arquitectónicas

### Completadas ✅
- [x] Utility `fechaUtils.ts` (formatearFecha, diasHastaFecha, fechaProxima)
- [x] Variables CSS de estados (`--nakomi-estadoActivo`, etc.)
- [x] Variantes semánticas en Etiqueta (exito, alerta, error, info, neutro)
- [x] Componente `MenuContextual` reutilizable

### Pendientes
- [x] Componente genérico `TarjetaProducto` (hostings/dominios/servicios) - ver TarjetaBase
- [x] Integración usuarios reales WordPress
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
- Usar nonce de WordPress para CSRF
- Audit log para accesos sensibles

### Correcciones Críticas
- **Autoloading PHP**: Se añadió `App/` al `composer.json` para evitar errores de orden de carga manual (`Fatal Error: Class not found`).

---

*Última actualización: 2026-01-24*
