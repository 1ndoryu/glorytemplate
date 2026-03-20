# CAP Autoescuelas — Roadmap

> **Descripción:** SaaS para autoescuelas. Genera calendarios automáticos para el curso CAP (Certificado de Aptitud Profesional): 35 horas, 8 asignaturas, distribución respetando disponibilidad de alumnos, descansos legales y capacidad configurable. Incluye gestión de alumnos, reportes PDF y suscripción vía Stripe.
> **Stack:** WordPress (PHP 8+) + React Islands (TypeScript/Zustand) + REST API + Stripe + MySQL. Glory Framework como base del tema.
> **URL producción:** https://cap.wandori.us
> **Servidor:** 66.94.100.241, SSH: root
> **Deploy:** Coolify (coolify-manager-rs), Stack UUID: `qgskgw8wwc08o444o08wko8o`
> **Glory Branch:** `glory-react-calendarioesc`
> **Repositorio:** 1ndoryu/glorytemplate, rama `main-kamples`

## Herramientas del agente
- Code Sentinel: `.agent/code-sentinel`
- VarSense: `.agent/varsense`
- Coolify Manager: `.agent/coolify-manager-rs` (deploy activo)

## Documentación legacy
- [App/React/docs (LEGACY)/especificaciones.md](React/docs%20(LEGACY)/especificaciones.md) — Especificaciones originales del proyecto (legacy, no sigue v4.0)

## Tareas pendientes

- 2003A-2: Revisión Stripe para el cliente. (1) Verificar que PanelStripe solo se muestra a admins — ya confirmado que está correcto con `{isAdmin && <PanelStripe />}`. (2) Botón "Gestionar Pagos" no abre nada para el admin — investigar por qué y solucionarlo. (3) Precio de suscripción debe ser 75€ con 14 días de prueba gratis — esto se configura en Stripe Dashboard (crear Product/Price), luego el Price ID se pega en la web. Responder al cliente con instrucciones.

- 2003A-3: Crear tab de administración de clientes y pagos. Reusar la tabla de columnas existente para agregar una nueva pestaña donde el admin vea todos los clientes con acciones: activar/desactivar plan, ver pagos, estado de suscripción, etc.

- 2003A-4: Revisar `.sentinel-report.md` (169 violaciones, 1 error crítico). Corregir problemas reales y reportar falsos positivos para arreglar en la extensión.

- 2003A-6: Testear despliegue con coolify-manager-rs. Usar VPS 2 de prueba, verificar que funciona, corregir si hay errores, luego actualizar en VPS 1.
