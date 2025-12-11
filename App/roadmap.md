# ROADMAP - Proyecto Web Guillermo Garcia (Chatbots y Automatizacion)

> Documento generado a partir de `project-extends.md`
> Fecha de creacion: 2025-12-11
> Ultima actualizacion: 2025-12-11
> Estado: En progreso

---

## RESUMEN DEL PROYECTO

**Objetivo:** Web profesional para ofrecer servicios de consultoria 1:1 en chatbots y automatizacion (WhatsApp, Instagram, Web, Voz).

**Meta Principal:** Captar leads cualificados y medir que canal de contacto funciona mejor.

---

## SISTEMA DE TEMAS (YA IMPLEMENTADO)

El proyecto cuenta con **2 temas intercambiables** mediante un boton flotante:

### Temas Disponibles

| Tema      | Nombre UI      | Activacion              | Descripcion                                                  |
| --------- | -------------- | ----------------------- | ------------------------------------------------------------ |
| `default` | Custom (Stone) | Sin atributo data-theme | Paleta stone/neutral, tipografia Geist, estilo desarrollador |
| `project` | Project (Blue) | `data-theme="project"`  | Paleta azul/verde del cliente, tipografia Manrope/Inter      |

### Arquitectura del Sistema

| Archivo                                      | Funcion                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `App/Assets/css/init.css`                    | Define CSS Variables para ambos temas (:root y [data-theme='project']) |
| `App/React/hooks/useTheme.ts`                | Hook que maneja estado, localStorage y atributo data-theme             |
| `App/React/hooks/useFontLoader.ts`           | Carga fuentes dinamicamente segun el tema activo                       |
| `App/React/components/ui/ThemeToggle.tsx`    | Boton flotante para cambiar entre temas                                |
| `App/React/components/layout/PageLayout.tsx` | Integra useTheme y ThemeToggle en todas las paginas                    |

### Como Funciona

1. El tema se puede forzar via URL: `?theme=project` o `?theme=default`
2. Se persiste en localStorage como `glory-theme`
3. Se aplica el atributo `data-theme` al elemento `<html>`
4. Las CSS Variables cambian automaticamente

### Tema `project` (Cliente)

Colores segun `project-extends.md`:
- `--color-accent-primary: #2563eb` (Azul brand)
- `--color-accent-green: #25d366` (Verde WhatsApp, solo iconos/badges)
- `--color-text-primary: #111827`
- `--color-bg-primary: #f5f5f4`

Tipografia:
- Titulos: Manrope (700 H1-H2, 600 subsecciones)
- Cuerpo: Inter (400/600)

### Regla de Desarrollo

Las paginas deben cumplir PRIMERO con el **contenido y estructura** de `project-extends.md` (textos SEO, secciones H2/H3, CTAs, formulario RGPD). El tema visual (`default` o `project`) es secundario y no afecta el contenido.

---

## PAGINAS IMPLEMENTADAS

| Pagina     | Slug        | Island React   | Estado                            |
| ---------- | ----------- | -------------- | --------------------------------- |
| Home       | /           | HomeIsland     | Implementada - REVISION PENDIENTE |
| Servicios  | /servicios  | ServicesIsland | Implementada - REVISION PENDIENTE |
| Planes     | /planes     | PricingIsland  | Implementada - REVISION PENDIENTE |
| Demos      | /demos      | DemosIsland    | Implementada - REVISION PENDIENTE |
| Sobre Mi   | /sobre-mi   | AboutIsland    | Implementada - REVISION PENDIENTE |
| Blog       | /blog       | -              | Pendiente                         |
| Contacto   | /contacto   | -              | Pendiente                         |
| Privacidad | /privacidad | -              | Pendiente                         |
| Cookies    | /cookies    | -              | Pendiente                         |

---

## INDICE DE FASES

| Fase | Nombre                           | Prioridad | Estado      |
| ---- | -------------------------------- | --------- | ----------- |
| 0    | Revision de Paginas Existentes   | ALTA      | Pendiente   |
| 1    | Configuracion Base y Estilos     | ALTA      | Pendiente   |
| 2    | Paginas Principales              | ALTA      | Completada  |
| 3    | Paginas Secundarias              | MEDIA     | En progreso |
| 4    | Paginas Legales                  | MEDIA     | Pendiente   |
| 5    | Sistema de Contacto y Conversion | ALTA      | Pendiente   |
| 6    | Blog y Sistema de Contenido      | MEDIA     | Pendiente   |
| 7    | SEO y Datos Estructurados        | ALTA      | Pendiente   |
| 8    | Analitica (GA4 + GTM)            | ALTA      | Pendiente   |
| 9    | Optimizacion y Rendimiento       | MEDIA     | Pendiente   |
| 10   | Publicacion y Lanzamiento        | ALTA      | Pendiente   |

---

## FASE 0: REVISION DE PAGINAS EXISTENTES

**Objetivo:** Verificar que las paginas ya implementadas cumplen con las especificaciones de `project-extends.md`.

### 0.1 Checklist de Revision por Pagina

Cada pagina debe revisarse contra su seccion correspondiente en `project-extends.md`:

#### HOME (/)
- [x] Verificar H1 exacto: "Chatbot para empresas que atiende a tus clientes 24/7 y gestiona reservas"
- [x] Verificar subhero con las 2 lineas especificadas
- [x] Verificar CTAs en orden: Calendario > WhatsApp > Formulario
- [x] Verificar seccion "Lo que voy a conseguir contigo" (4 beneficios)
- [ ] Verificar seccion "WhatsApp Business" (3 H3) - Pendiente: estructura exacta H2/H3
- [ ] Verificar seccion "Automatizacion de procesos pymes" - Pendiente: estructura exacta
- [ ] Verificar seccion "Trabajo contigo, sin intermediarios" - Existe como quote, falta estructura H2/H3
- [ ] Verificar seccion "Integraciones" - Existe en GridCards, resumido
- [ ] Verificar seccion "Medimos lo importante" - Existe en GridCards, resumido
- [x] Verificar formulario RGPD con checkbox obligatorio - COMPLETADO
- [x] Verificar interlinking interno - COMPLETADO

#### SERVICIOS (/servicios)
- [ ] Verificar H1: "Servicios de chatbots y automatizacion para empresas, conmigo 1:1"
- [ ] Verificar seccion "WhatsApp Business (pilar principal)" (4 H3)
- [ ] Verificar seccion "Instagram y Web (UChat multicanal)" (3 H3)
- [ ] Verificar seccion "Voz (llamadas)" (3 H3)
- [ ] Verificar seccion "Automatizacion de reservas y tareas" (3 H3)
- [ ] Verificar seccion "Integraciones con tu software"
- [ ] Verificar seccion "Proceso de trabajo" (4 pasos)
- [ ] Verificar FAQs (5 preguntas)
- [ ] Verificar interlinking

#### PLANES (/planes)
- [ ] Verificar H1: "Precio chatbot: planes con mantenimiento incluido y primer mes gratis"
- [ ] Verificar seccion "Como calculo el precio del chatbot"
- [ ] Verificar 3 planes: Basico, Avanzado, Total
- [ ] Verificar seccion "Que veras en el mercado y por que lo hago distinto"
- [ ] Verificar FAQs de precio (8 preguntas)
- [ ] Verificar interlinking

#### DEMOS (/demos)
- [ ] Verificar H1: "Demo chatbot WhatsApp: pruebalo con tu caso"
- [ ] Verificar seccion "Que veras en la demo" (4 items)
- [ ] Verificar seccion "Elige tu demo (Canales)" (4 H3)
- [ ] Verificar seccion "Demos por sector" (3 ejemplos)
- [ ] Verificar seccion "Integraciones en la demo"
- [ ] Verificar seccion "Como lo hacemos" (4 pasos)
- [ ] Verificar FAQs (6 preguntas)
- [ ] Verificar interlinking

#### SOBRE MI (/sobre-mi)
- [ ] Verificar H1: "Consultor de chatbots: trabajo 1:1 contigo"
- [ ] Verificar foto hero
- [ ] Verificar seccion "Quien soy"
- [ ] Verificar seccion "Lo que hago contigo" (5 servicios)
- [ ] Verificar seccion "Un caso (barberia)"
- [ ] Verificar seccion "Como trabajo" (4 pasos)
- [ ] Verificar foto 2
- [ ] Verificar seccion "Herramientas que uso"
- [ ] Verificar interlinking

---

## FASE 1: CONFIGURACION BASE Y ESTILOS

**Objetivo:** Establecer la base visual y tecnica del proyecto.

### 1.1 Tipografia
- [ ] Implementar familia Manrope (700 para H1-H2, 600 para subsecciones)
- [ ] Implementar familia Inter (400/600 para texto y UI)
- [ ] Configurar `font-display: swap` para rendimiento
- [ ] Definir escala tipografica:
  - H1: `clamp(36px, 3.5vw, 44px)`
  - H2: `clamp(28px, 2.6vw, 32px)`
  - H3: `20px`
  - Body: `17px`
- [ ] Asegurar altura tactil minima de botones: 44px

### 1.2 Paleta de Colores (Variables CSS)
- [ ] Definir tokens de color:
  ```css
  --brand: #2563EB;        /* Botones llenos, enlaces, enfasis */
  --accent: #25D366;       /* Iconos, badges (NO texto) */
  --text: #111827;         /* Texto principal */
  --bg: #F5F5F4;           /* Fondo general */
  --card: #FFFFFF;         /* Fondo cards */
  --card-border: #E6E6E6;  /* Bordes */
  --success: #1A7F4B;      /* Exito */
  --error: #E11D48;        /* Error */
  --surface-inverse: #0B1220;  /* Secciones oscuras */
  --text-inverse: #F8FAFC;     /* Texto en oscuro */
  --brand-hover: #1D4ED8;
  --brand-active: #1E40AF;
  ```

### 1.3 Componentes Base
- [ ] Crear estilos de botones (.btn, .btn--primary, .btn--secondary, .btn--ghost)
- [ ] Crear estilos de cards
- [ ] Crear estilos de alertas (.alert--ok, .alert--error)
- [ ] Crear utilidades CSS (.text-brand, .bg-brand, .surface-inverse, etc.)
- [ ] Implementar focus-visible para accesibilidad

### 1.4 Preconexiones (HEAD)
- [ ] Agregar preconnect para Google Fonts:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ```
- [ ] Agregar preconnect para Calendly:
  ```html
  <link rel="preconnect" href="https://assets.calendly.com" crossorigin>
  ```
- [ ] Agregar preconnect para WhatsApp:
  ```html
  <link rel="preconnect" href="https://wa.me">
  ```

---

## FASE 2: PAGINAS PRINCIPALES

> NOTA: Todas las paginas principales estan implementadas. 
> Ver FASE 0 para checklist de revision contra `project-extends.md`.

### 2.1 HOME (/)
**Estado:** Implementada - REVISION PENDIENTE

#### Metadatos
- [ ] Title: "Chatbot para empresas | Hablame y arrancamos hoy"
- [ ] Meta description (<=160 chars)
- [ ] Canonical: https://[URL_BASE]/

#### Estructura
- [ ] Hero (above the fold):
  - [ ] H1: "Chatbot para empresas que atiende a tus clientes 24/7 y gestiona reservas"
  - [ ] Subhero (2 lineas)
  - [ ] CTAs (Calendario > WhatsApp > Formulario)
- [ ] Seccion: "Lo que voy a conseguir contigo" (4 beneficios)
- [ ] Seccion: "WhatsApp Business" (3 subsecciones H3)
- [ ] Seccion: "Automatizacion de procesos pymes"
- [ ] Seccion: "Trabajo contigo, sin intermediarios"
- [ ] Seccion: "Integraciones" (lista)
- [ ] Seccion: "Medimos lo importante"
- [ ] Formulario con RGPD
- [ ] Interlinking interno (antes del footer)

#### JSON-LD
- [ ] Organization
- [ ] ProfessionalService + ScheduleAction
- [ ] WebSite + SearchAction

---

### 2.2 SERVICIOS (/servicios)
**Estado:** Implementada - REVISION PENDIENTE

#### Metadatos
- [ ] Title: "Servicios de chatbots y automatizacion | Trabaja 1:1 conmigo"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [ ] Hero con H1 y CTAs
- [ ] Seccion: "WhatsApp Business (pilar principal)" (4 H3)
- [ ] Seccion: "Instagram y Web (UChat multicanal)" (3 H3)
- [ ] Seccion: "Voz (llamadas)" (3 H3)
- [ ] Seccion: "Automatizacion de reservas y tareas" (3 H3)
- [ ] Seccion: "Integraciones con tu software" (lista)
- [ ] Seccion: "Proceso de trabajo" (4 pasos)
- [ ] Seccion: "Hablamos?" (CTAs)
- [ ] FAQs (5 preguntas)
- [ ] Interlinking

#### JSON-LD
- [ ] BreadcrumbList
- [ ] Service + OfferCatalog

---

### 2.3 PLANES (/planes)
**Estado:** Implementada - REVISION PENDIENTE

#### Metadatos
- [ ] Title: "Precio chatbot: planes con mantenimiento | Primer mes gratis"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [ ] Hero con H1 y CTAs
- [ ] Seccion: "Como calculo el precio del chatbot"
- [ ] Seccion: "Planes chatbot":
  - [ ] Plan Basico
  - [ ] Plan Avanzado
  - [ ] Plan Total
- [ ] Seccion: "Que veras en el mercado y por que lo hago distinto"
- [ ] Seccion: "Hablamos?" (CTAs)
- [ ] FAQs de precio (8 preguntas)
- [ ] Interlinking

#### JSON-LD
- [ ] BreadcrumbList
- [ ] ItemList (3 Services)

---

## FASE 3: PAGINAS SECUNDARIAS

> NOTA: Demos y Sobre Mi estan implementadas.
> Ver FASE 0 para checklist de revision contra `project-extends.md`.

### 3.1 DEMOS (/demos)
**Estado:** Implementada - REVISION PENDIENTE

#### Metadatos
- [ ] Title: "Demo Chatbot WhatsApp | Pruebalo con tu caso (gratis)"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [ ] Hero con H1 y CTAs
- [ ] Seccion: "Que veras en la demo" (4 items)
- [ ] Seccion: "Elige tu demo (Canales)" (4 H3)
- [ ] Seccion: "Demos por sector" (3 ejemplos)
- [ ] Seccion: "Integraciones en la demo"
- [ ] Seccion: "Como lo hacemos" (4 pasos)
- [ ] Seccion: "Hablamos?" (CTAs)
- [ ] FAQs (6 preguntas)
- [ ] Interlinking

#### JSON-LD
- [ ] BreadcrumbList
- [ ] Service + ScheduleAction

---

### 3.2 BLOG (/blog)
**Estado:** Pendiente

#### Metadatos
- [ ] Title: "Mejores chatbots para WhatsApp Business | Casos y noticias"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [ ] Hero con H1 y CTAs
- [ ] Seccion: "Casos destacados" (tarjetas con chips: fecha, canal)
- [ ] Seccion: "Lo ultimo" (rejilla 6 posts recientes)
- [ ] Seccion: "Enlaces utiles" (interlinking)

#### JSON-LD
- [ ] BreadcrumbList

#### Plantilla de Post Individual
- [ ] Autor + fechas (publicacion/actualizacion)
- [ ] Fuentes consultadas al final
- [ ] JSON-LD BlogPosting

---

### 3.3 SOBRE MI (/sobre-mi)
**Estado:** Implementada - REVISION PENDIENTE

#### Metadatos
- [ ] Title: "Consultor de chatbots en Madrid | Trabajo 1:1 contigo"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [ ] Hero con H1, foto y CTAs
- [ ] Seccion: "Quien soy"
- [ ] Seccion: "Lo que hago contigo" (5 servicios)
- [ ] Seccion: "Un caso (barberia)"
- [ ] Seccion: "Como trabajo" (4 pasos)
- [ ] Foto 2 (media pagina)
- [ ] Seccion: "Herramientas que uso"
- [ ] Seccion: "Hablamos?" (CTAs)
- [ ] Interlinking

#### JSON-LD
- [ ] BreadcrumbList

---

### 3.4 CONTACTO (/contacto)
**Estado:** Pendiente

#### Metadatos
- [ ] Title: "Solicitar presupuesto chatbot WhatsApp | Contacto (Guillermo)"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [ ] Hero con H1 y CTAs
- [ ] Seccion: "Que necesitas" (5 opciones H3)
- [ ] Formulario RGPD completo:
  - [ ] Campos visibles: Nombre, WhatsApp, Email, Empresa, Interes/Servicio (select), Mensaje, Canal preferido
  - [ ] Campos ocultos: utm_source, utm_medium, utm_campaign, utm_content, page_url, timestamp
  - [ ] Checkbox consentimiento obligatorio
  - [ ] id="formulario" (ancla)
- [ ] Seccion: "Que pasa despues" (3 pasos)
- [ ] FAQs (5 preguntas cortas)
- [ ] Interlinking

#### JSON-LD
- [ ] ProfessionalService + ScheduleAction

---

## FASE 4: PAGINAS LEGALES

### 4.1 POLITICA DE PRIVACIDAD (/privacidad)
**Estado:** Pendiente

- [ ] H1: "Politica de privacidad"
- [ ] Responsable del sitio
- [ ] Para que uso tus datos + Base legal
- [ ] A quien encargo datos
- [ ] Cuanto tiempo los conservo
- [ ] Tus derechos
- [ ] Cookies (enlace)
- [ ] Ultima revision
- [ ] JSON-LD BreadcrumbList

---

### 4.2 POLITICA DE COOKIES (/cookies)
**Estado:** Pendiente

- [ ] H1: "Politica de cookies"
- [ ] Que son
- [ ] Que cookies uso:
  - [ ] Necesarias (cookie_consent)
  - [ ] Analiticas (_ga, _gid) - solo si se aceptan
- [ ] Configurar o revocar
- [ ] Proveedores y transferencias
- [ ] Ultima revision
- [ ] JSON-LD BreadcrumbList

---

## FASE 5: SISTEMA DE CONTACTO Y CONVERSION

**Objetivo:** Integrar las 3 vias de contacto y preparar el tracking.

### 5.1 Vias de Contacto
- [ ] WhatsApp: Configurar enlace wa.me/34XXXXXXXXX
- [ ] Calendario: Integrar Calendly con widget embebido
- [ ] Formulario Web: Implementar con campos RGPD

### 5.2 CTAs Consistentes
- [ ] Patron de CTAs (siempre en este orden):
  1. Calendario: "Hablame ahora y respondo en menos de 30 min (09-21h)"
  2. WhatsApp: "Hablame ahora y respondo en menos de 30 min (09-21h)"
  3. Formulario: "Agenda en 30 s"
- [ ] Repetir bloque de CTAs cada ~2 secciones

### 5.3 Widget Calendly
- [ ] Embeber widget en pagina de contacto
- [ ] Reservar espacio fijo: `min-height: 700px`
- [ ] Preparar integracion con GTM (evento calendly.event_scheduled)

---

## FASE 6: BLOG Y SISTEMA DE CONTENIDO

### 6.1 Backend de Automatizacion con IA (Caracteristica Personalizada)
**Estado:** Pendiente - Planificacion

- [ ] Definir flujo:
  1. Busqueda de noticias/tendencias (ultimas 2 semanas)
  2. Temas: Chatbots y Automatizaciones con IA
  3. Redaccion automatica del articulo
  4. Guardar como borrador (NO publicar automaticamente)
  5. Panel de aprobacion para Guillermo
- [ ] Crear panel de configuracion:
  - [ ] Frecuencia de busqueda
  - [ ] Tono de redaccion
  - [ ] Temas a ignorar

### 6.2 Estructura de Posts
- [ ] Definir plantilla de post:
  - [ ] Autor + fechas
  - [ ] Chips (fecha, canal, tipo)
  - [ ] Fuentes consultadas
  - [ ] JSON-LD BlogPosting

---

## FASE 7: SEO Y DATOS ESTRUCTURADOS

### 7.1 JSON-LD por Pagina

| Pagina        | Schemas                                    |
| ------------- | ------------------------------------------ |
| Home          | Organization, ProfessionalService, WebSite |
| Servicios     | BreadcrumbList, Service + OfferCatalog     |
| Planes        | BreadcrumbList, ItemList (3 Services)      |
| Demos         | BreadcrumbList, Service + ScheduleAction   |
| Blog (indice) | BreadcrumbList                             |
| Blog (post)   | BlogPosting                                |
| Sobre mi      | BreadcrumbList                             |
| Contacto      | ProfessionalService + ScheduleAction       |
| Privacidad    | BreadcrumbList                             |
| Cookies       | BreadcrumbList                             |

### 7.2 Placeholders a Rellenar
- [ ] [URL_BASE] - Dominio final
- [ ] [MARCA] - Nombre de marca
- [ ] [CALENDLY_URL] - URL de Calendly
- [ ] +34 6XX XXX XXX - Telefono real
- [ ] logo.png - Logo del sitio
- [ ] Perfiles sameAs (LinkedIn, Twitter, YouTube)
- [ ] URLs de Privacidad y Cookies

### 7.3 Reglas SEO
- [ ] Un solo H1 por pagina
- [ ] Parrafos cortos, bullets donde corresponda
- [ ] Texto del documento SEO optimizado (usar exactamente)
- [ ] Alt descriptivos en imagenes

---

## FASE 8: ANALITICA (GA4 + GTM)

### 8.1 Configuracion Base
- [ ] Instalar Google Tag Manager en la web
- [ ] Crear etiqueta GA4 de configuracion
- [ ] Respetar privacidad: activar solo tras aceptar cookies

### 8.2 Eventos a Implementar

| Evento            | Trigger                              | Parametros                  |
| ----------------- | ------------------------------------ | --------------------------- |
| click_whatsapp    | Enlaces con wa.me o api.whatsapp.com | cta_text, page_location     |
| schedule_calendly | calendly.event_scheduled             | page_location               |
| lead_form_submit  | Envio exitoso del formulario         | form_service, page_location |

### 8.3 Pasos de Implementacion
- [ ] Paso 1: Conectar GA4 (en todas las paginas)
- [ ] Paso 2: Configurar evento click_whatsapp
- [ ] Paso 3: Configurar evento schedule_calendly
- [ ] Paso 4: Configurar evento lead_form_submit
- [ ] Paso 5: Guardar UTMs y origen en sistema/hoja
- [ ] Paso 6: Marcar conversiones en GA4
- [ ] Paso 7: Probar con DebugView

---

## FASE 9: OPTIMIZACION Y RENDIMIENTO

### 9.1 Imagenes
- [ ] Hero de cada pagina: SIN lazy-load
- [ ] Resto de imagenes: CON lazy-load
- [ ] Definir dimensiones fijas:
  - Hero: 1600 x 900
  - Contenido: 1200 x 800
  - Miniaturas: 600 x 400
- [ ] No enlazar imagenes a su archivo
- [ ] No meter texto importante dentro de imagenes

### 9.2 Rendimiento Movil
- [ ] Botones minimo 44px de alto
- [ ] H1 y hero legibles sin zoom
- [ ] Primer CTA visible al cargar
- [ ] Banner de cookies pequeno abajo
- [ ] Calendly con min-height fijo (evitar CLS)

### 9.3 Texto Indexable
- [ ] Titulos y parrafos como texto (no imagenes)
- [ ] CTAs como texto de boton
- [ ] Contenido de acordeones ya escrito
- [ ] Campos de formulario con labels visibles
- [ ] Iconos acompanados de texto

---

## FASE 10: PUBLICACION Y LANZAMIENTO

### 10.1 Configuracion de Dominio
- [ ] Forzar HTTPS en todo el sitio
- [ ] Elegir con o sin www y redirigir (301)

### 10.2 Robots y Sitemap
- [ ] Crear robots.txt:
  ```
  User-agent: *
  Disallow: /wp-admin/
  Allow: /wp-admin/admin-ajax.php
  Sitemap: https://[URL_BASE]/sitemap_index.xml
  ```
- [ ] Generar sitemap con Rank Math/Yoast

### 10.3 Google Search Console
- [ ] Verificar dominio
- [ ] Enviar sitemap
- [ ] Marcar como noindex:
  - [ ] Pagina de gracias/confirmacion
  - [ ] Borradores/pruebas
  - [ ] Busquedas internas

### 10.4 Inspeccion Final
- [ ] Inspeccionar URLs principales en Search Console
- [ ] Probar Home y Contacto en movil
- [ ] Verificar que no hay pop-ups intrusivos
- [ ] Verificar que no hay saltos de layout

---

## ENLACES INTERNOS (REFERENCIA RAPIDA)

### Reglas
- 5-10 enlaces internos por pagina
- Texto descriptivo
- No enlazar a paginas que no existen
- Evitar canibalizar keywords

### Distribucion por Pagina

**HOME:**
- Ver servicios de chatbot y automatizacion -> /servicios
- Consulta precios y planes -> /planes
- Probar una demo de chatbot -> /demos
- Conoceme mejor (sobre mi) -> /sobre-mi
- Contacto (presupuesto o demo) -> /contacto
- Ver blog (casos y noticias) -> /blog

**SERVICIOS:**
- Mira planes y precios -> /planes
- Ver demos por canal -> /demos
- Contacto para presupuesto -> /contacto
- Saber mas sobre mi -> /sobre-mi

**PLANES:**
- Ver servicios detallados -> /servicios
- Prefieres ver una demo primero? -> /demos
- Contacto (presupuesto en 30 s) -> /contacto

**DEMOS:**
- Este flujo esta incluido en servicios -> /servicios
- Si te encaja, mira planes y precios -> /planes
- Pideme presupuesto o demo -> /contacto

**BLOG:**
- Probar una demo similar -> /demos
- Ver servicios (WhatsApp, IG, web, voz) -> /servicios
- Precio? Mira planes -> /planes

**SOBRE MI:**
- Ver servicios -> /servicios
- Mira demos reales -> /demos
- Elegir plan -> /planes
- Hablar por contacto -> /contacto

**CONTACTO:**
- Aun no lo tienes claro: ver demos -> /demos
- Revisar planes -> /planes
- Volver a servicios -> /servicios

**LEGAL:**
- Volver a contacto -> /contacto

---

## ARQUITECTURA TECNICA

### Stack Tecnologico

| Capa     | Tecnologia         | Responsabilidad                 |
| -------- | ------------------ | ------------------------------- |
| Backend  | PHP + WordPress    | Logica, rutas, datos, SEO, RGPD |
| Frontend | React + TypeScript | UI interactiva, animaciones     |
| Estilos  | Tailwind CSS       | Sistema de diseno               |
| Bundler  | Vite               | Build y HMR en desarrollo       |

### Tipo de Renderizado: CSR Islands (Client-Side Rendering)

**IMPORTANTE:** La implementacion actual de React **NO es Server Side Rendering (SSR)**.

Es un sistema de **"Client-Side Rendering con Islands"**:

```
Flujo:
1. PHP renderiza contenedor vacio: <div data-island="HomeIsland"><!-- Loading --></div>
2. Navegador carga bundle React (main.tsx)
3. JavaScript ejecuta createRoot() y monta componente en cliente
4. Usuario ve pagina completa DESPUES de que React se ejecuta
```

**Implicaciones:**
- El contenido NO es visible para Google sin JavaScript
- Mayor tiempo de First Contentful Paint (FCP)
- Se necesita implementar SSR para mejor SEO (futuro)

### Modos de Glory: React vs Nativo

Glory soportara 2 modos de renderizado:

| Modo   | Descripcion                                       | Cuando usar                              |
| ------ | ------------------------------------------------- | ---------------------------------------- |
| React  | Pagina completa renderizada por React Islands     | Home, Servicios, Planes, Demos, Sobre Mi |
| Nativo | Sistema tradicional de Glory (PHP templates, GBN) | Blog, Contacto, Legales, Admin           |

### Pendiente: Control de Modos en control.php

Se debe implementar en `App/Config/control.php`:

```php
// PENDIENTE: Agregar control de modo React
// Cuando modo React esta activo, deshabilitar:
// - Scripts nativos de Glory que no aplican
// - Funcionalidades de GBN que no se usan
// - Assets que no se necesitan

// Ejemplo de implementacion propuesta:
GloryFeatures::setMode('react'); // o 'native'

// O por pagina:
// PageManager::setRenderMode('home', 'react');
// PageManager::setRenderMode('blog', 'native');
```

### Archivos Clave de Arquitectura

| Archivo                               | Funcion                                     |
| ------------------------------------- | ------------------------------------------- |
| `App/Config/control.php`              | Configuracion de features de Glory          |
| `App/Config/pages.php`                | Definicion de paginas (slug -> funcion)     |
| `TemplateGlory.php`                   | Template central, detecta modo React/Nativo |
| `Glory/src/Services/ReactIslands.php` | Servicio para montar React islands          |
| `Glory/assets/react/src/main.tsx`     | Entry point de React, mapa de componentes   |

---

## HISTORIAL DE ACTUALIZACIONES

| Fecha      | Cambio                                                 | Autor   |
| ---------- | ------------------------------------------------------ | ------- |
| 2025-12-11 | Creacion inicial del roadmap                           | Sistema |
| 2025-12-11 | Agregado: estados de paginas, Fase 0 revision          | Sistema |
| 2025-12-11 | Agregado: arquitectura tecnica, modos React/Nativo     | Sistema |
| 2025-12-11 | Documentado: sistema de temas dinamico (useTheme)      | Sistema |
| 2025-12-11 | HOME: Agregado tertiaryCta, ContactForm, InternalLinks | Sistema |

---

## NOTAS ADICIONALES

### Contenido (project-extends.md)
1. **Tono:** Cercano, primera persona (yo, Guillermo), sin jerga tecnica.
2. **CTAs:** Siempre en orden Calendario > WhatsApp > Formulario.
3. **RGPD:** Checkbox de consentimiento obligatorio en todos los formularios.
4. **Verde (#25D366):** Solo para iconos/badges, NUNCA como texto principal.
5. **Contenido SEO:** Usar exactamente el texto del documento original, esta optimizado.

### Desarrollo
6. **PHP para logica:** WordPress maneja rutas, SEO, RGPD, formularios, analytics.
7. **React para UI:** Solo presentacion visual e interactividad.
8. **No SSR (aun):** El contenido React no es visible sin JavaScript.
9. **Modos separados:** Paginas React no deben cargar assets del modo nativo.
5. **Contenido SEO:** Usar exactamente el texto del documento original, esta optimizado.
