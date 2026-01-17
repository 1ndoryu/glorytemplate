# Nakomi - Centro de Planificación

Este directorio contiene los roadmaps por fase del proyecto Nakomi.

**Ver detalles completos del proyecto en:** `App/React/Idea inicial.md`

---

## Estructura de Fases

| Fase | Nombre                    | Estado        | Descripción                                         |
| ---- | ------------------------- | ------------- | --------------------------------------------------- |
| 1    | Landing MVP               | 🔄 En progreso | Landing minimalista + portafolio + navegación       |
| 2    | Autenticación             | ⏳ Pendiente   | Login/Register/Logout con WordPress                 |
| 3    | Panel Cliente Base        | ⏳ Pendiente   | Layout panel lateral + vista servicios en proceso   |
| 4    | Catálogo de Servicios     | ⏳ Pendiente   | Listado de servicios + detalle de cada uno          |
| 5    | Contratación de Servicios | ⏳ Pendiente   | Flujo completo: elegir plan → requerimientos → pago |
| 6    | Sistema de Pagos          | ⏳ Pendiente   | Retención de pago, facturación, devoluciones        |
| 7    | Suscripciones             | ⏳ Pendiente   | Planes recurrentes + cancelación                    |
| 8    | Comunicación              | ⏳ Pendiente   | Mensajería cliente ↔ empleado                       |
| 9    | Panel Empleado            | ⏳ Pendiente   | Vista de servicios asignados, entregas              |
| 10   | Panel Admin               | ⏳ Pendiente   | Gestión clientes, facturación, asignaciones         |
| 11   | Sistema de Reseñas        | ⏳ Pendiente   | Reseñas + migración desde Fiverr antiguo            |
| 12   | Servicios Avanzados       | ⏳ Pendiente   | Hosting con Coolify, SSH, archivos, etc.            |

---

## Notas Importantes

### Sobre la Complejidad

- Este es un proyecto **extremadamente ambicioso**
- Las fases 1-8 son el MVP real
- Las fases 9-12 son posteriores y complejas
- **El hosting (Fase 12) es extremadamente complejo, se deja de última**

### Sobre los Roles

| Rol          | Responsabilidades                                                                        |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Admin**    | Única persona. Gestiona ingresos, pagos, facturas, clientes. Puede también ser empleado. |
| **Empleado** | Atiende servicios asignados. Recibe requerimientos, entrega trabajos.                    |
| **Cliente**  | Contrata, paga (pago retenido), gestiona suscripciones, se comunica.                     |

### Flujo de un Servicio

```
Cliente paga → Pago se retiene → Cliente envía requerimientos
    → Empleado asignado → Empleado trabaja → Entrega
    → Cliente acepta → Pago liberado → Reseña
```

---

## Convenciones

- Cada fase tiene su propio archivo `fase-N.md`
- Las tareas se marcan con: `[ ]` pendiente, `[x]` completado
- Se actualiza progresivamente según avanzamos
- **Solo la fase actual necesita estar muy detallada**

---

## Variables CSS

Prefijo: `--nakomi-*`
Archivo: `App/React/styles/variables.css`

---

## Tecnología

- **Backend:** WordPress (usuarios, REST API, gestión)
- **Frontend:** React Islands (Glory framework)
- **Hosting propio:** Coolify (sin cPanel)
