# ROADMAP - Proyecto Web Guillermo Garcia (Chatbots y Automatizacion)

> Fecha de creacion: 2025-12-11
> Ultima actualizacion: 2025-12-17 07:46
> Estado: **EN PRODUCCION** - Sistema funcional, pendiente lanzamiento

---

## RESUMEN DEL PROYECTO

**Objetivo:** Web profesional para ofrecer servicios de consultoria 1:1 en chatbots y automatizacion (WhatsApp, Instagram, Web, Voz).

**Meta Principal:** Captar leads cualificados y medir que canal de contacto funciona mejor.

---

## INDICE

1. [Arquitectura Tecnica](#arquitectura-tecnica)
2. [Sistema de Contenido](#sistema-de-contenido-react)
3. [Tareas Completadas (Comprimido)](#tareas-completadas-comprimido)
4. [Tareas Pendientes (Desarrollo)](#tareas-pendientes)
5. **[Tareas del Cliente](./cliente-pendientes.md)** ← Archivo separado

---

## ARQUITECTURA TECNICA

### Stack Tecnologico

| Capa     | Tecnologia         | Responsabilidad                 |
| -------- | ------------------ | ------------------------------- |
| Backend  | PHP + WordPress    | Logica, rutas, datos, SEO, RGPD |
| Frontend | React + TypeScript | UI interactiva, animaciones     |
| Estilos  | Tailwind CSS       | Sistema de diseno               |
| Bundler  | Vite               | Build y HMR en desarrollo       |

### Tipo de Renderizado: CSR Islands

**IMPORTANTE:** La implementacion actual **NO es SSR**. Es Client-Side Rendering con Islands:

```
Flujo:
1. PHP renderiza: <div data-island="HomeIsland"><!-- Loading --></div>
2. Navegador carga bundle React (main.tsx)
3. JavaScript ejecuta createRoot() y monta componente
4. Usuario ve pagina DESPUES de que React se ejecuta
```

**Implicacion:** El contenido NO es visible para Google sin JavaScript.

### Archivos Clave

| Archivo                               | Funcion                              |
| ------------------------------------- | ------------------------------------ |
| `App/Config/control.php`              | Configuracion features Glory         |
| `App/Config/pages.php`                | Definicion paginas (slug -> funcion) |
| `TemplateGlory.php`                   | Template central                     |
| `Glory/src/Services/ReactIslands.php` | Monta React islands                  |
| `Glory/assets/react/src/main.tsx`     | Entry point React                    |

---

## SISTEMA DE CONTENIDO REACT

### ReactContentProvider (PHP)

Servicio que inyecta contenido de WordPress a React (`Glory/src/Services/ReactContentProvider.php`).

```php
// App/Content/reactContent.php
use Glory\Services\ReactContentProvider;

ReactContentProvider::register('blogFeatured', 'post', ['posts_per_page' => 3, 'category_name' => 'caso-exito']);
ReactContentProvider::register('blogRecent', 'post', ['posts_per_page' => 6]);
ReactContentProvider::injectGlobal();
```

### useContent (React Hook)

```tsx
import {useContent} from '../hooks/useContent';
const posts = useContent<WordPressPost[]>('blogFeatured', []);
```

### ContentRenderer

```tsx
<ContentRenderer content={posts} layout="grid" columns={3} showImage showExcerpt />
```

**Layouts:** `card`, `grid`, `list`, `featured`, `minimal`

---

## TAREAS COMPLETADAS (COMPRIMIDO)

> Esta seccion resume todas las tareas finalizadas. El historial detallado esta al final del documento.

### Bugs Resueltos

| ID      | Descripcion                                    | Fecha      |
| ------- | ---------------------------------------------- | ---------- |
| BUG-001 | Navegacion directa a Single Posts fallaba      | 2025-12-12 |
| BUG-002 | URL Calendly hardcodeada en Header y secciones | 2025-12-17 |

### Tareas Criticas (TAREA-001 a TAREA-010)

| ID        | Descripcion                               | Estado     |
| --------- | ----------------------------------------- | ---------- |
| TAREA-001 | Sistema de Logs para API de Gemini        | Completada |
| TAREA-002 | Migrar Islands a useSiteUrls()            | Completada |
| TAREA-003 | Implementar Modo React                    | Completada |
| TAREA-004 | Panel React para Opciones del Tema        | Completada |
| TAREA-005 | Optimizacion Core Web Vitals (Lighthouse) | Completada |
| TAREA-006 | Mejoras UI/UX y Correcciones Responsive   | Completada |
| TAREA-007 | Correcciones UI Hero y Header Admin       | Completada |
| TAREA-008 | Mejoras Panel IA (AdminAIIsland)          | Completada |
| TAREA-009 | Bug Proveedor IA - Seleccion de Modelos   | Completada |
| TAREA-010 | Actualizar Lista de Modelos IA            | Completada |

### Paginas Implementadas (9/9 - 100%)

| Pagina     | Slug        | Island React   | SEO | JSON-LD                                    |
| ---------- | ----------- | -------------- | --- | ------------------------------------------ |
| Home       | /           | HomeIsland     | OK  | Organization, ProfessionalService, WebSite |
| Servicios  | /servicios  | ServicesIsland | OK  | BreadcrumbList, Service + OfferCatalog     |
| Planes     | /planes     | PricingIsland  | OK  | BreadcrumbList, ItemList                   |
| Demos      | /demos      | DemosIsland    | OK  | BreadcrumbList, Service + ScheduleAction   |
| Sobre Mi   | /sobre-mi   | AboutIsland    | OK  | BreadcrumbList                             |
| Blog       | /blog       | BlogIsland     | OK  | BreadcrumbList                             |
| Contacto   | /contacto   | ContactIsland  | OK  | ProfessionalService + ScheduleAction       |
| Privacidad | /privacidad | PrivacyIsland  | OK  | BreadcrumbList                             |
| Cookies    | /cookies    | CookiesIsland  | OK  | BreadcrumbList                             |

### Fases Completadas

| Fase | Nombre                         | Estado                                               |
| ---- | ------------------------------ | ---------------------------------------------------- |
| 0    | Revision de Paginas Existentes | 100% conforme a `project-extends.md`                 |
| 1    | Configuracion Base y Estilos   | Tipografia, colores, componentes base, preconexiones |
| 1.5  | Revision Estilos Tema Project  | 93% conformidad                                      |
| 2    | Paginas Principales            | Home, Servicios, Planes con SEO                      |
| 3    | Paginas Secundarias            | Demos, Blog, Sobre Mi, Contacto con SEO              |
| 4    | Paginas Legales                | Privacidad, Cookies con secciones RGPD               |
| 5    | Sistema de Contacto            | CTAs consistentes, tracking UTMs, formulario RGPD    |
| 6    | Blog y Sistema IA              | Gemini 2.5 Flash + Panel Admin `/panel-ia`           |
| 7    | SEO y Datos Estructurados      | JSON-LD en todas las paginas                         |
| 8    | Analitica                      | GTM condicional, 4 eventos de tracking               |
| 9    | Optimizacion                   | Imagenes lazy-load, botones 44px, texto indexable    |

### Sistemas Implementados

| Sistema             | Descripcion                                                  |
| ------------------- | ------------------------------------------------------------ |
| Sistema de Temas    | Dos temas intercambiables (`project`/`default`)              |
| Sistema de IA       | Gemini 2.5 Flash + Panel Admin con 5 tabs                    |
| Theme Options       | 15+ opciones configurables desde WP Admin                    |
| Panel Configuracion | `/configuracion` - Panel React para gestionar opciones       |
| Formulario Contacto | Envio real via REST API + email HTML profesional             |
| Analitica           | GTM condicional + 4 eventos (WhatsApp, Calendly, Form, etc.) |

---

## TAREAS PENDIENTES

> **Nota:** Las tareas que dependen del cliente estan en [`cliente-pendientes.md`](./cliente-pendientes.md)

---

### PENDIENTES DE DESARROLLO

> Tareas tecnicas para asegurar que los paneles y funcionalidades esten listos.

#### Prioridad ALTA

| Tarea             | Descripcion                                                              | Estado |
| ----------------- | ------------------------------------------------------------------------ | ------ |
| Listener Calendly | Implementar listener `calendly.event_scheduled` para `schedule_calendly` | Falta  |

**Codigo requerido para Listener Calendly:**
```typescript
// En CookieBanner.tsx o nuevo hook useCalendlyListener.ts
useEffect(() => {
    const handleCalendlyEvent = (e: MessageEvent) => {
        if (e.data?.event === 'calendly.event_scheduled') {
            analytics.trackCalendlyScheduled();
        }
    };
    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
}, []);
```

#### Prioridad MEDIA

| Tarea        | Descripcion                                                    | Estado |
| ------------ | -------------------------------------------------------------- | ------ |
| Calendly CLS | `.calendly-inline-widget { min-height: 700px; }` en `init.css` | Falta  |

#### Prioridad BAJA

| Tarea                 | Descripcion                                                       | Estado |
| --------------------- | ----------------------------------------------------------------- | ------ |
| Dimensiones imagenes  | Documentar: Hero 1600x900, Contenido 1200x800, Miniaturas 600x400 | Falta  |
| Boton ajustar cookies | Agregar boton en Footer para revocar/cambiar preferencias cookies | Falta  |

**Codigo requerido para Boton Ajustar Cookies:**
```tsx
// En Footer.tsx
<button onClick={() => {
    localStorage.removeItem('cookie_consent');
    window.location.reload();
}}>
    Ajustar cookies
</button>
```

---

### VERIFICACION DE PANELES

> **Objetivo:** Asegurar que todas las funcionalidades de configuracion funcionen correctamente.

| Panel                    | URL                      | Funcionalidad a Verificar                    | Estado      |
| ------------------------ | ------------------------ | -------------------------------------------- | ----------- |
| Configuracion General    | `/configuracion`         | Guardar y recuperar todas las opciones       | Verificar   |
| Theme Options (WP Admin) | WP Admin > Theme Options | Sincronizacion con panel React               | Verificar   |
| Panel IA                 | `/panel-ia`              | Generacion de contenido con Gemini 2.5 Flash | Funcionando |
| Integraciones            | `/configuracion`         | GTM, GA4, GSC se aplican correctamente       | Verificar   |

---

### FASE 10: PUBLICACION Y LANZAMIENTO (Desarrollo)

> Tareas tecnicas que el desarrollador debe preparar antes del lanzamiento.

#### 10.1 Configuracion Tecnica

- [ ] Verificar que robots.txt se genera correctamente
- [ ] Verificar que sitemap se genera con Rank Math/Yoast
- [ ] Preparar configuracion HTTPS

**Contenido robots.txt esperado:**
```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Sitemap: https://[URL_BASE]/sitemap_index.xml
```

---

### PROXIMAS MEJORAS (Futuro)

| Mejora                | Estado  | Descripcion                                         |
| --------------------- | ------- | --------------------------------------------------- |
| **Selector de temas** | Proximo | Elegir entre varios temas de colores desde el panel |
| **Modificar colores** | Proximo | Personalizar colores principales desde el panel     |


---

## NOTAS DE DESARROLLO

1. **Tono:** Cercano, primera persona (yo, Guillermo), sin jerga tecnica.
2. **CTAs:** Siempre en orden Calendario > WhatsApp > Formulario.
3. **RGPD:** Checkbox consentimiento obligatorio en formularios.
4. **Verde (#25D366):** Solo iconos/badges, NUNCA texto.
5. **Contenido SEO:** Usar exactamente el texto de `project-extends.md`.
6. **PHP para logica:** WordPress maneja rutas, SEO, RGPD, formularios, analytics.
7. **React para UI:** Solo presentacion e interactividad.
8. **No SSR (aun):** Contenido React no visible sin JavaScript.

---

## ENLACES INTERNOS (REFERENCIA)

**Reglas:** 5-10 enlaces por pagina, texto descriptivo, no enlazar paginas inexistentes.

| Desde     | Enlaces a                                                |
| --------- | -------------------------------------------------------- |
| HOME      | /servicios, /planes, /demos, /sobre-mi, /contacto, /blog |
| SERVICIOS | /planes, /demos, /contacto, /sobre-mi                    |
| PLANES    | /servicios, /demos, /contacto                            |
| DEMOS     | /servicios, /planes, /contacto                           |
| BLOG      | /demos, /servicios, /planes                              |
| SOBRE MI  | /servicios, /demos, /planes, /contacto                   |
| CONTACTO  | /demos, /planes, /servicios                              |
| LEGAL     | /contacto                                                |

---
