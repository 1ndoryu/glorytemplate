# CAP Autoescuelas — Roadmap

> **Descripción:** SaaS para autoescuelas. Genera calendarios automáticos para el curso CAP (Certificado de Aptitud Profesional): 35 horas, 8 asignaturas, distribución respetando disponibilidad de alumnos, descansos legales y capacidad configurable. Incluye gestión de alumnos, reportes PDF y suscripción vía Stripe.
> **Stack:** WordPress (PHP 8+) + React Islands (TypeScript/Zustand) + REST API + Stripe + MySQL. Glory Framework como base del tema.
> **URL producción:** https://cap.wandori.us
> **Servidor:** 66.94.100.241, SSH: root
> **Deploy:** Coolify (coolify-manager-rs), Stack UUID: `qgskgw8wwc08o444o08wko8o`
> **Glory Branch:** `glory-react-calendarioesc`
> **Repositorio:** 1ndoryu/glorytemplate, rama `main`

## Herramientas del agente
- Code Sentinel: `.agent/code-sentinel`
- VarSense: `.agent/varsense`
- Coolify Manager: `.agent/coolify-manager-rs` (deploy activo)

## Documentación legacy
- [App/React/docs (LEGACY)/especificaciones.md](React/docs%20(LEGACY)/especificaciones.md) — Especificaciones originales del proyecto (legacy, no sigue v4.0)

## Tareas pendientes

- 2003A-3: Crear tab de administración de clientes y pagos. Reusar la tabla de columnas existente para agregar una nueva pestaña donde el admin vea todos los clientes con acciones: activar/desactivar plan, ver pagos, estado de suscripción, etc.

- 2003A-6: Testear despliegue con coolify-manager-rs. Usar VPS 2 de prueba, verificar que funciona, corregir si hay errores, luego actualizar en VPS 1.

## 2003A-7

Cuando intento iniciar sesion da errores de coookies y redirige al wp-admin, no quiero que el login sea con el wp-admin, debe ser fluido y que al deslogear no vaya al wp-admin. 

## 2003A-8

<div id="react-island-caploginisland-69bdda9185797" data-island="CapLoginIsland" data-props="{&quot;siteUrl&quot;:&quot;http:\/\/glory.local&quot;,&quot;redirectTo&quot;:&quot;\/cap-dashboard\/&quot;,&quot;registroUrl&quot;:&quot;\/cap-registro\/&quot;}" style="
"><div data-glory-page="CapLoginIsland" style="display: block;height: 100%;"><div class="capApp capLoginPagina" id="paginaLogin">

No se porque hay un espacio en blanco que envuelve la paginao sea hay un margen blanco en como si capApp capLoginPagina tuviera un margin. 

## 2003A-9

Cuando el inicio de sesion es incorrecto no veo un mensaje de error 

## 2003A-10

No se porque no me deja subir cambios a la rama

> git push -u origin glory-react-calendarioesc
To https://github.com/1ndoryu/glorytemplate.git
 ! [rejected]            glory-react-calendarioesc -> glory-react-calendarioesc (non-fast-forward)
error: failed to push some refs to 'https://github.com/1ndoryu/glorytemplate.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. If you want to integrate the remote changes,
hint: use 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
