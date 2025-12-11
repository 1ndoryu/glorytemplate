# ROADMAP - Proyecto Web Guillermo Garcia (Chatbots y Automatizacion)

> Documento generado a partir de `project-extends.md`
> Fecha de creacion: 2025-12-11
> Ultima actualizacion: 2025-12-11 16:45
> Estado: Verificacion FASE 0 COMPLETADA - 100% conforme (30/30 items OK)

---

## RESUMEN DEL PROYECTO

**Objetivo:** Web profesional para ofrecer servicios de consultoria 1:1 en chatbots y automatizacion (WhatsApp, Instagram, Web, Voz).

**Meta Principal:** Captar leads cualificados y medir que canal de contacto funciona mejor.

---

## SISTEMA DE TEMAS (YA IMPLEMENTADO)

El proyecto cuenta con **2 temas intercambiables** mediante un boton flotante:

### Temas Disponibles

| Tema      | Nombre UI      | Activacion              | Descripcion                                                                                                                                |
| --------- | -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `default` | Custom (Stone) | Sin atributo data-theme | Paleta stone/neutral, tipografia Geist, estilo desarrollador                                                                               |
| `project` | Project (Blue) | `data-theme="project"`  | Paleta azul/verde del cliente, tipografia Manrope/Inter    (ESTAS SON LAS QUE DEBEN RESPECTOR LOS ESTILOS INDICADOS SEGUN PROJECT-EXTENDS) |

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

| Pagina     | Slug        | Island React   | Estado            |
| ---------- | ----------- | -------------- | ----------------- |
| Home       | /           | HomeIsland     | Implementada - OK |
| Servicios  | /servicios  | ServicesIsland | Implementada - OK |
| Planes     | /planes     | PricingIsland  | Implementada - OK |
| Demos      | /demos      | DemosIsland    | Implementada - OK |
| Sobre Mi   | /sobre-mi   | AboutIsland    | Implementada - OK |
| Blog       | /blog       | BlogIsland     | Implementada - OK |
| Contacto   | /contacto   | ContactIsland  | Implementada - OK |
| Privacidad | /privacidad | PrivacyIsland  | Implementada - OK |
| Cookies    | /cookies    | CookiesIsland  | Implementada - OK |

---

## INDICE DE FASES

| Fase | Nombre                            | Prioridad | Estado                                      |
| ---- | --------------------------------- | --------- | ------------------------------------------- |
| 0    | Revision de Paginas Existentes    | ALTA      | Completada (100% conforme)                  |
| 1    | Configuracion Base y Estilos      | ALTA      | Completada                                  |
| 1.5  | **Revision Estilos Tema Project** | BAJA      | **NUEVA - Postergada por el usuario**       |
| 2    | Paginas Principales (Estructura)  | ALTA      | Completada (pendiente SEO metadata)         |
| 3    | Paginas Secundarias (Estructura)  | MEDIA     | Completada (pendiente SEO metadata)         |
| 4    | Paginas Legales (Estructura)      | MEDIA     | Completada (pendiente SEO metadata)         |
| 5    | Sistema de Contacto y Conversion  | ALTA      | Parcial (formulario OK, falta Calendly/WA)  |
| 6    | Blog y Sistema de Contenido       | MEDIA     | Parcial (estructura OK, falta IA backend)   |
| 7    | SEO y Datos Estructurados         | ALTA      | Parcial (BreadcrumbList OK, faltan schemas) |
| 8    | Analitica (GA4 + GTM)             | ALTA      | Pendiente                                   |
| 9    | Optimizacion y Rendimiento        | MEDIA     | Pendiente                                   |
| 10   | Publicacion y Lanzamiento         | ALTA      | Pendiente                                   |

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
- [x] Verificar seccion "WhatsApp Business" (3 H3)
- [x] Verificar seccion "Automatizacion de procesos pymes"
- [x] Verificar seccion "Trabajo contigo, sin intermediarios"
- [x] Verificar seccion "Integraciones"
- [x] Verificar seccion "Medimos lo importante"
- [x] Verificar formulario RGPD con checkbox obligatorio
- [x] Verificar interlinking interno

**HALLAZGOS HOME:**
- CORREGIDO: Seccion "Lo que voy a conseguir contigo" ahora esta inmediatamente despues del hero (linea 135-136)
- OK: H1 correcto (linea 25): "Chatbot para empresas que atiende a tus clientes 24/7 y gestiona reservas"
- OK: Subhero correcto (linea 29)
- OK: CTAs en orden correcto: Calendly > WhatsApp > Formulario (lineas 31-33)
- OK: WhatsApp Business implementada con WhatsAppShowcase (linea 139) - 3 features (lineas 43-46)
- OK: Automatizacion implementada con AutomationFlow (linea 142)
- OK: Proceso implementado con ProcessWorkflow (linea 156)
- OK: Integraciones implementada con grid de FeatureCard (8 integraciones, lineas 68-116)
- OK: Analytics implementada con AnalyticsSection (linea 172)
- OK: Formulario con ContactForm (linea 182)
- OK: Interlinking con InternalLinks (linea 185)

**ACCION REQUERIDA HOME:**
- COMPLETADA: FeatureSection movida a su posicion correcta (despues del hero, antes de WhatsApp Business)

---

#### SERVICIOS (/servicios)
- [x] Verificar H1: "Servicios de chatbots y automatizacion para empresas, conmigo 1:1"
- [x] Verificar seccion "WhatsApp Business (pilar principal)" (4 H3)
- [x] Verificar seccion "Instagram y Web (UChat multicanal)" (3 H3)
- [x] Verificar seccion "Voz (llamadas)" (3 H3)
- [x] Verificar seccion "Automatizacion de reservas y tareas" (3 H3)
- [x] Verificar seccion "Integraciones con tu software"
- [x] Verificar seccion "Proceso de trabajo" (4 pasos)
- [x] Verificar FAQs (5 preguntas)
- [x] Verificar interlinking

**HALLAZGOS SERVICIOS:**
- OK: H1 correcto (línea 20): "Servicios de chatbots y automatizacion para empresas, conmigo 1:1"
- OK: WhatsApp Business (4 H3) - implementado con 4 features (líneas 31-36)
- OK: Instagram y Web (3 cards) - implementado con FeatureCard grid (líneas 42-61)
- OK: Voz (3 cards) - implementado con FeatureCard grid (líneas 63-84)
- OK: Automatizacion (3 features) - implementado con AutomationFlow (líneas 86-99)
- OK: Integraciones (8 integraciones) - implementado con grid (líneas 101-149)
- OK: Proceso de trabajo (4 pasos) - implementado con ProcessTimeline (líneas 151-158)
- OK: FAQs (5 preguntas) - implementado con FaqWithCta (líneas 160-175)
- OK: Interlinking implementado (línea 237)

**ACCIÓN REQUERIDA SERVICIOS:**
- Ninguna. Página completa y conforme a project-extends.md

---

#### PLANES (/planes)
- [x] Verificar H1: "Precio chatbot: planes con mantenimiento incluido y primer mes gratis"
- [x] Verificar seccion "Como calculo el precio del chatbot"
- [x] Verificar 3 planes: Basico, Avanzado, Total
- [x] Verificar seccion "Que veras en el mercado y por que lo hago distinto"
- [x] Verificar FAQs de precio (8 preguntas)
- [x] Verificar interlinking

**HALLAZGOS PLANES:**
- OK: H1 correcto (línea 19): "Precio chatbot: planes con mantenimiento incluido y primer mes gratis"
- OK: Breakdown "Como calculo el precio" implementado (líneas 27-35) con 4 items
- OK: 3 planes implementados (Básico, Avanzado, Total) (líneas 40-67)
- OK: Seccion "Que veras en el mercado" implementada (líneas 70-72)
- OK: 8 FAQs implementadas correctamente (líneas 76-84)
- OK: Interlinking implementado (línea 147)

**ACCIÓN REQUERIDA PLANES:**
- Ninguna. Página completa y conforme a project-extends.md

---

#### DEMOS (/demos)
- [x] Verificar H1: "Demo chatbot WhatsApp: pruebalo con tu caso"
- [x] Verificar seccion "Que veras en la demo" (4 items)
- [x] Verificar seccion "Elige tu demo (Canales)" (4 H3)
- [x] Verificar seccion "Demos por sector" (3 ejemplos)
- [x] Verificar seccion "Integraciones en la demo"
- [x] Verificar seccion "Como lo hacemos" (4 pasos)
- [x] Verificar FAQs (6 preguntas)
- [x] Verificar interlinking

**HALLAZGOS DEMOS:**
- OK: H1 correcto (línea 25): "Demo chatbot WhatsApp: pruébalo con tu caso"
- OK: "Qué verás en la demo" - 4 items implementados con DemoFeaturesSection (líneas 33-43)
  - Conversaciones, Reservas, Avisos, Integraciones
- OK: "Elige tu demo (Canales)" - 4 canales implementados (líneas 44-80)
  - WhatsApp, Instagram DM, Chatbot Web, Voicebot (cada uno con badge y descripción)
- OK: "Demos por sector" - 3 ejemplos implementados (líneas 82-100)
  - Restaurantes, Barbería, Fisioterapia
- OK: "Integraciones en la demo" - implementado en ScrollTabsShowcase (líneas 102-136)
- OK: "Cómo lo hacemos" - implementado con DemoProcessWorkflow (línea 193)
- OK: FAQs (6 preguntas) correctamente implementadas (líneas 140-148)
- OK: Interlinking implementado (línea 207)

**ACCIÓN REQUERIDA DEMOS:**
- Ninguna. Página 100% conforme a project-extends.md

---

#### SOBRE MI (/sobre-mi)
- [x] Verificar H1: "Consultor de chatbots: trabajo 1:1 contigo"
- [x] Verificar foto hero
- [x] Verificar seccion "Quien soy"
- [x] Verificar seccion "Lo que hago contigo" (5 servicios)
- [x] Verificar seccion "Un caso (barberia)"
- [x] Verificar seccion "Como trabajo" (4 pasos)
- [x] Verificar foto 2
- [x] Verificar seccion "Herramientas que uso"
- [x] Verificar interlinking

**HALLAZGOS SOBRE MI:**
- OK: H1 correcto (linea 21): "Consultor de chatbots: trabajo 1:1 contigo"
- OK: Foto hero implementada (lineas 98-102) con placeholder
- OK: Seccion "Quien soy" implementada (lineas 29-38)
- OK: "Lo que hago contigo" - 5 servicios implementados (lineas 40-49)
- OK: Caso barberia implementado (lineas 51-54) - "MVP Barber"
- OK: "Como trabajo" - 4 pasos implementados con ProcessTimeline (lineas 55-62)
- CORREGIDO: Foto 2 (working image) ahora se renderiza en seccion dedicada (lineas 151-159)
- OK: "Herramientas que uso" implementada (lineas 68-72)
- OK: Interlinking implementado (linea 178)

**ACCION REQUERIDA SOBRE MI:**
- COMPLETADA: Segunda foto agregada al renderizado del componente

---

#### BLOG (/blog)
- [x] Verificar H1: "Mejores chatbots para WhatsApp Business | Casos y noticias"
- [x] Verificar Hero con CTAs
- [x] Verificar seccion "Casos destacados" (tarjetas con chips: fecha, canal)
- [x] Verificar seccion "Lo ultimo" (rejilla 6 posts recientes)
- [x] Verificar seccion "Enlaces utiles" (interlinking)

**HALLAZGOS BLOG:**
- OK: H1 correcto (linea 36): "Mejores chatbots para WhatsApp Business: casos y noticias"
- OK: Hero con CTAs implementado (lineas 40-42)
- CORREGIDO: Seccion "Casos destacados" ahora separada (lineas 64-74)
  - Layout "featured" con 3 posts
  - Chips de categoria activados (showCategories={true})
- CORREGIDO: Seccion "Lo ultimo" implementada (lineas 77-87)
  - Grid de 6 posts recientes
  - Chips de categoria activados
- OK: Interlinking implementado (linea 90)
- CORREGIDO: PHP actualizado con blogFeatured y blogRecent en reactContent.php

**ACCION REQUERIDA BLOG:**
- COMPLETADA: Secciones separadas y chips activados

---

#### CONTACTO (/contacto)
- [x] Verificar H1: "Solicitar presupuesto chatbot WhatsApp | Contacto (Guillermo)"
- [x] Verificar seccion "Que necesitas" (5 opciones H3)
- [x] Verificar formulario RGPD completo con campos visibles y ocultos
- [x] Verificar seccion "Que pasa despues" (3 pasos)
- [x] Verificar FAQs (5 preguntas cortas)
- [x] Verificar interlinking

**HALLAZGOS CONTACTO:**
- CORREGIDO: H1 (linea 116) ahora dice exactamente "Solicitar presupuesto chatbot WhatsApp | Contacto (Guillermo)"
- CORREGIDO: Ahora hay 5 opciones de contacto basadas en servicios/necesidades (lineas 34-70):
  1. Contratar chatbot WhatsApp
  2. Agendar demo (WhatsApp / Instagram / Voicebot)
  3. Solicitar presupuesto: automatizacion de reservas
  4. Presupuesto integracion WhatsApp + Calendly / Google Sheets
  5. Consulta general o dudas
- OK: Formulario RGPD con ContactForm (linea 165)
- OK: ContactForm captura UTMs automaticamente (useEffect en componente)
- OK: "Que pasa despues" (3 pasos) implementado (lineas 72-88)
- OK: FAQs (5 preguntas) implementadas (lineas 90-111)
- OK: Interlinking implementado (linea 209)

**ACCION REQUERIDA CONTACTO:**
- COMPLETADA: H1 corregido y quinta opcion de contacto agregada

---

#### PRIVACIDAD (/privacidad)
- [x] Verificar H1: "Politica de privacidad"
- [x] Verificar seccion "Responsable del sitio"
- [x] Verificar seccion "Para que uso tus datos + Base legal"
- [x] Verificar seccion "A quien encargo datos"
- [x] Verificar seccion "Cuanto tiempo los conservo"
- [x] Verificar seccion "Tus derechos"
- [x] Verificar seccion "Cookies" (enlace)
- [x] Verificar "Ultima revision"
- [x] Verificar interlinking

**HALLAZGOS PRIVACIDAD:**
- OK: H1 correcto (línea 186): "Política de privacidad"
- OK: 6 secciones legales implementadas (líneas 27-170):
  1. Responsable del sitio (líneas 28-42)
  2. Para qué uso tus datos + Base legal (líneas 44-68)
  3. A quién encargo datos (líneas 70-92)
  4. Cuánto tiempo los conservo (líneas 94-113)
  5. Tus derechos (líneas 115-153)
  6. Cookies con enlace a /cookies (líneas 155-169)
- OK: "Última revisión" ENCONTRADA (líneas 188-191)
  - Texto: "Última actualización: Diciembre 2025"
  - Renderizada con ícono Calendar
- OK: Interlinking implementado (línea 227)
- OK: Sección de contacto para dudas (líneas 215-224)

**ACCIÓN REQUERIDA PRIVACIDAD:**
- Ninguna. Página 100% conforme a project-extends.md

---

#### COOKIES (/cookies)
- [x] Verificar H1: "Politica de cookies"
- [x] Verificar seccion "Que son"
- [x] Verificar seccion "Que cookies uso" (necesarias, analiticas)
- [x] Verificar seccion "Configurar o revocar"
- [x] Verificar seccion "Proveedores y transferencias"
- [x] Verificar "Ultima revision"
- [x] Verificar interlinking

**HALLAZGOS COOKIES:**
- OK: H1 correcto (línea 169): "Política de cookies"
- OK: Datos de cookies definidos (líneas 34-70):
  - Necesarias: cookie_consent, PHPSESSID (líneas 35-48)
  - Analíticas: _ga, _gid, _gat (líneas 49-69)
- OK: 3 secciones principales implementadas (líneas 72-121):
  1. Qué son las cookies (líneas 73-81)
  2. Cómo configurar o revocar (líneas 83-104)
  3. Proveedores y transferencias (líneas 106-121)
- OK: Sección "Qué cookies uso" con tablas separadas (líneas 199-227):
  - Cookies necesarias con badge "Siempre activas" (líneas 203-212)
  - Cookies analíticas con badge "Solo si aceptas" (líneas 216-226)
- OK: CookieTable component implementado correctamente (líneas 131-159)
- OK: "Última revisión" ENCONTRADA (líneas 172-175)
  - Texto: "Última actualización: Diciembre 2025"
  - Renderizada con ícono Calendar
- OK: Interlinking implementado (línea 267)
- OK: Botón para gestionar cookies (líneas 250-264)

**ACCIÓN REQUERIDA COOKIES:**
- Ninguna. Página 100% conforme a project-extends.md

---

## FASE 1: CONFIGURACION BASE Y ESTILOS

**Objetivo:** Establecer la base visual y tecnica del proyecto.

### 1.1 Tipografia
- [x] Implementar familia Manrope (700 para H1-H2, 600 para subsecciones)
- [x] Implementar familia Inter (400/600 para texto y UI)
- [x] Configurar `font-display: swap` para rendimiento
- [x] Definir escala tipografica:
  - H1: `clamp(36px, 3.5vw, 44px)`
  - H2: `clamp(28px, 2.6vw, 32px)`
  - H3: `20px`
  - Body: `17px`
- [x] Asegurar altura tactil minima de botones: 44px

### 1.2 Paleta de Colores (Variables CSS)
- [x] Definir tokens de color:
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
- [x] Crear estilos de botones (.btn, .btn--primary, .btn--secondary, .btn--ghost)
- [x] Crear estilos de cards (.card, .card--elevated, .card--interactive)
- [x] Crear estilos de alertas (.alert--ok, .alert--error, .alert--warning, .alert--info)
- [x] Crear utilidades CSS (.text-brand, .bg-brand, .surface-inverse, .text-inverse, etc.)
- [x] Implementar focus-visible para accesibilidad

### 1.4 Preconexiones (HEAD)
- [x] Agregar preconnect para Google Fonts:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ```
- [x] Agregar preconnect para Calendly:
  ```html
  <link rel="preconnect" href="https://assets.calendly.com" crossorigin>
  ```
- [x] Agregar preconnect para WhatsApp:
  ```html
  <link rel="dns-prefetch" href="https://wa.me">
  ```

### 1.5 IMPLEMENTACION FASE 1

**Archivos modificados/creados:**
- `App/Assets/css/init.css` - Agregados estilos de botones, cards, alertas, utilidades y focus-visible
- `App/Config/performance.php` - NUEVO archivo con preconexiones y carga de fuentes
- `App/Config/control.php` - Carga performance.php automaticamente

---

## FASE 1.5: REVISION DE ESTILOS TEMA PROJECT

**Objetivo:** Verificar que TODOS los componentes React aplican correctamente los estilos del tema `project` (cliente) segun `project-extends.md`.

> **ESTADO:** Postergada por solicitud del usuario (baja prioridad momentánea).

> **IMPORTANTE:** El tema `project` es el del cliente (Guillermo Garcia). Los estilos deben coincidir con:
> - Colores: Azul brand (#2563EB), Verde solo iconos (#25D366)
> - Tipografia: Manrope (titulos), Inter (cuerpo)
> - Segun especificaciones en `project-extends.md`

### 1.5.1 Verificacion de Variables CSS

**Archivo:** `App/Assets/css/init.css` - seccion `[data-theme='project']`

- [ ] `--color-accent-primary: #2563eb` (Azul brand) - Para botones, enlaces, enfasis
- [ ] `--color-accent-green: #25d366` (Verde WhatsApp) - SOLO iconos/badges, NO texto
- [ ] `--color-text-primary: #111827` (Carbon oscuro)
- [ ] `--color-bg-primary: #f5f5f4` (Gris calido fondo)
- [ ] `--color-bg-surface: #ffffff` (Cards)
- [ ] `--color-border-primary: #e6e6e6` (Bordes cards)
- [ ] `--color-surface-inverse: #0b1220` (Secciones oscuras)
- [ ] `--color-success: #1a7f4b` (Verde oscuro para texto exito)
- [ ] `--color-error: #e11d48` (Error)

### 1.5.2 Verificacion de Tipografia

- [ ] H1: Manrope 700, `clamp(36px, 3.5vw, 44px)`
- [ ] H2: Manrope 700, `clamp(28px, 2.6vw, 32px)`
- [ ] H3: Manrope 600, `20px`
- [ ] Body: Inter 400/600, `17px`
- [ ] Altura tactil botones: minimo `44px`

### 1.5.3 Revision por Componente

**NOTA:** Revisar cada componente con el tema `project` activo (`?theme=project`)

#### Componentes UI (`App/React/components/ui/`)
- [ ] `Button.tsx` - Colores, hover, focus-visible
- [ ] `Badge.tsx` - Verde solo para badges, no texto
- [ ] `Card.tsx` - Bordes, sombras, hover
- [ ] `Input.tsx` / `Select.tsx` - Focus ring azul brand

#### Componentes Sections (`App/React/components/sections/`)
- [ ] `HeroSection.tsx` - H1 correcto, CTAs con colores brand
- [ ] `FeatureSection.tsx` - Cards con estilos project
- [ ] `ContactForm.tsx` - Inputs, botones, checkbox RGPD
- [ ] `FaqWithCta.tsx` - Acordeones, CTAs
- [ ] `ProcessTimeline.tsx` / `ProcessWorkflow.tsx` - Iconos, badges
- [ ] `WhatsAppShowcase.tsx` - Verde SOLO en iconos
- [ ] `AutomationFlow.tsx` - Colores brand
- [ ] `PricingBreakdown.tsx` - Cards de planes
- [ ] `CtaBlock.tsx` - Botones primario/secundario
- [ ] `InternalLinks.tsx` - Links con color brand
(son mas)

#### Layout (`App/React/components/layout/`)
- [ ] `Header.tsx` - Logo, navegacion, CTA header
- [ ] `Footer.tsx` - Links, colores inversos
- [ ] `PageLayout.tsx` - TopBanner estilos

#### Islands (verificar cada pagina)
- [ ] `HomeIsland.tsx` - Revisar con tema project
- [ ] `ServicesIsland.tsx` - Revisar con tema project
- [ ] `PricingIsland.tsx` - Revisar con tema project
- [ ] `DemosIsland.tsx` - Revisar con tema project
- [ ] `AboutIsland.tsx` - Revisar con tema project
- [ ] `BlogIsland.tsx` - Revisar con tema project
- [ ] `ContactIsland.tsx` - Revisar con tema project
- [ ] `PrivacyIsland.tsx` - Revisar con tema project
- [ ] `CookiesIsland.tsx` - Revisar con tema project

### 1.5.4 Problemas Comunes a Buscar

1. **Colores hardcodeados** en lugar de variables CSS
2. **Verde usado como texto** (debe ser SOLO iconos/badges)
3. **Fuentes incorrectas** (debe ser Manrope/Inter, no Geist)
4. **Botones sin altura minima 44px**
5. **Focus ring incorrecto** (debe ser azul brand con 2px offset)
6. **Clases Tailwind que sobrescriben** variables del tema

### 1.5.5 Hallazgos y Correcciones

(Documentar aqui los hallazgos durante la revision)

---

## FASE 2: PAGINAS PRINCIPALES

> NOTA: Todas las paginas principales estan implementadas. 
> Ver FASE 0 para checklist de revision contra `project-extends.md`.

### 2.1 HOME (/)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

#### Metadatos
- [ ] Title: "Chatbot para empresas | Hablame y arrancamos hoy"
- [ ] Meta description (<=160 chars)
- [ ] Canonical: https://[URL_BASE]/

#### Estructura
- [x] Hero (above the fold):
  - [x] H1: "Chatbot para empresas que atiende a tus clientes 24/7 y gestiona reservas"
  - [x] Subhero (2 lineas)
  - [x] CTAs (Calendario > WhatsApp > Formulario)
- [x] Seccion: "Lo que voy a conseguir contigo" (4 beneficios)
- [x] Seccion: "WhatsApp Business" (3 subsecciones H3)
- [x] Seccion: "Automatizacion de procesos pymes"
- [x] Seccion: "Trabajo contigo, sin intermediarios"
- [x] Seccion: "Integraciones" (lista)
- [x] Seccion: "Medimos lo importante"
- [x] Formulario con RGPD
- [x] Interlinking interno (antes del footer)

#### JSON-LD
- [ ] Organization
- [ ] ProfessionalService + ScheduleAction
- [ ] WebSite + SearchAction

---

### 2.2 SERVICIOS (/servicios)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

#### Metadatos
- [ ] Title: "Servicios de chatbots y automatizacion | Trabaja 1:1 conmigo"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [x] Hero con H1 y CTAs
- [x] Seccion: "WhatsApp Business (pilar principal)" (4 H3)
- [x] Seccion: "Instagram y Web (UChat multicanal)" (3 H3)
- [x] Seccion: "Voz (llamadas)" (3 H3)
- [x] Seccion: "Automatizacion de reservas y tareas" (3 H3)
- [x] Seccion: "Integraciones con tu software" (lista)
- [x] Seccion: "Proceso de trabajo" (4 pasos)
- [x] Seccion: "Hablamos?" (CTAs)
- [x] FAQs (5 preguntas)
- [x] Interlinking

#### JSON-LD
- [ ] BreadcrumbList
- [ ] Service + OfferCatalog

---

### 2.3 PLANES (/planes)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

#### Metadatos
- [ ] Title: "Precio chatbot: planes con mantenimiento | Primer mes gratis"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [x] Hero con H1 y CTAs
- [x] Seccion: "Como calculo el precio del chatbot"
- [x] Seccion: "Planes chatbot":
  - [x] Plan Basico
  - [x] Plan Avanzado
  - [x] Plan Total
- [x] Seccion: "Que veras en el mercado y por que lo hago distinto"
- [x] Seccion: "Hablamos?" (CTAs)
- [x] FAQs de precio (8 preguntas)
- [x] Interlinking

#### JSON-LD
- [ ] BreadcrumbList
- [ ] ItemList (3 Services)

---

## FASE 3: PAGINAS SECUNDARIAS

> NOTA: Demos y Sobre Mi estan implementadas.
> Ver FASE 0 para checklist de revision contra `project-extends.md`.

### 3.1 DEMOS (/demos)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

#### Metadatos
- [ ] Title: "Demo Chatbot WhatsApp | Pruebalo con tu caso (gratis)"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [x] Hero con H1 y CTAs
- [x] Seccion: "Que veras en la demo" (4 items)
- [x] Seccion: "Elige tu demo (Canales)" (4 H3)
- [x] Seccion: "Demos por sector" (3 ejemplos)
- [x] Seccion: "Integraciones en la demo"
- [x] Seccion: "Como lo hacemos" (4 pasos)
- [x] Seccion: "Hablamos?" (CTAs)
- [x] FAQs (6 preguntas)
- [x] Interlinking

#### JSON-LD
- [ ] BreadcrumbList
- [ ] Service + ScheduleAction

---

### 3.2 BLOG (/blog)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

#### Metadatos
- [ ] Title: "Mejores chatbots para WhatsApp Business | Casos y noticias"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [x] Hero con H1 y CTAs
- [x] Seccion: "Casos destacados" (tarjetas con chips: fecha, canal)
- [x] Seccion: "Lo ultimo" (rejilla 6 posts recientes)
- [x] Seccion: "Enlaces utiles" (interlinking)

#### JSON-LD
- [ ] BreadcrumbList

#### Plantilla de Post Individual
- [ ] Autor + fechas (publicacion/actualizacion)
- [ ] Fuentes consultadas al final
- [ ] JSON-LD BlogPosting

---

### 3.3 SOBRE MI (/sobre-mi)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

#### Metadatos
- [ ] Title: "Consultor de chatbots en Madrid | Trabajo 1:1 contigo"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [x] Hero con H1, foto y CTAs
- [x] Seccion: "Quien soy"
- [x] Seccion: "Lo que hago contigo" (5 servicios)
- [x] Seccion: "Un caso (barberia)"
- [x] Seccion: "Como trabajo" (4 pasos)
- [x] Foto 2 (media pagina)
- [x] Seccion: "Herramientas que uso"
- [x] Seccion: "Hablamos?" (CTAs)
- [x] Interlinking

#### JSON-LD
- [ ] BreadcrumbList

---

### 3.4 CONTACTO (/contacto)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

#### Metadatos
- [ ] Title: "Solicitar presupuesto chatbot WhatsApp | Contacto (Guillermo)"
- [ ] Meta description
- [ ] Canonical

#### Estructura
- [x] Hero con H1 y CTAs
- [x] Seccion: "Que necesitas" (5 opciones H3)
- [x] Formulario RGPD completo:
  - [x] Campos visibles: Nombre, WhatsApp, Email, Empresa, Interes/Servicio (select), Mensaje, Canal preferido
  - [x] Campos ocultos: utm_source, utm_medium, utm_campaign, utm_content, page_url, timestamp
  - [x] Checkbox consentimiento obligatorio
  - [x] id="formulario" (ancla)
- [x] Seccion: "Que pasa despues" (3 pasos)
- [x] FAQs (5 preguntas cortas)
- [x] Interlinking

#### JSON-LD
- [ ] ProfessionalService + ScheduleAction

---

## FASE 4: PAGINAS LEGALES

### 4.1 POLITICA DE PRIVACIDAD (/privacidad)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

- [x] H1: "Politica de privacidad"
- [x] Responsable del sitio
- [x] Para que uso tus datos + Base legal
- [x] A quien encargo datos
- [x] Cuanto tiempo los conservo
- [x] Tus derechos
- [x] Cookies (enlace)
- [x] Ultima revision
- [ ] JSON-LD BreadcrumbList

---

### 4.2 POLITICA DE COOKIES (/cookies)
**Estado:** Implementada - Estructura OK (FASE 0 verificada)

- [x] H1: "Politica de cookies"
- [x] Que son
- [x] Que cookies uso:
  - [x] Necesarias (cookie_consent)
  - [x] Analiticas (_ga, _gid) - solo si se aceptan
- [x] Configurar o revocar
- [x] Proveedores y transferencias
- [x] Ultima revision
- [ ] JSON-LD BreadcrumbList

---

## FASE 5: SISTEMA DE CONTACTO Y CONVERSION

**Objetivo:** Integrar las 3 vias de contacto y preparar el tracking.

### 5.1 Vias de Contacto
- [x] WhatsApp: Configurar enlace wa.me/584120825234 (configurado en urls.ts)
- [x] Calendario: Enlace directo a calendly.com/andoryyu (configurado en urls.ts)
- [x] Formulario Web: Implementar con campos RGPD (ContactForm.tsx implementado)

### 5.2 CTAs Consistentes
- [ ] Patron de CTAs (siempre en este orden):
  1. Calendario: "Hablame ahora y respondo en menos de 30 min (09-21h)"
  2. WhatsApp: "Hablame ahora y respondo en menos de 30 min (09-21h)"
  3. Formulario: "Agenda en 30 s"
- [ ] Repetir bloque de CTAs cada ~2 secciones

### 5.3 Widget Calendly
- [x] Embeber widget en pagina de contacto -> **DESESTIMADO** (Se usa enlace directo por simplicidad)
- [x] Reservar espacio fijo -> **N/A**
- [ ] Preparar integracion con GTM (cambiar tracking a *click* en enlace en lugar de evento embed)

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

| Fecha      | Cambio                                                                                                               | Autor   |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| 2025-12-11 | Creacion inicial del roadmap                                                                                         | Sistema |
| 2025-12-11 | Agregado: estados de paginas, Fase 0 revision                                                                        | Sistema |
| 2025-12-11 | Agregado: arquitectura tecnica, modos React/Nativo                                                                   | Sistema |
| 2025-12-11 | Documentado: sistema de temas dinamico (useTheme)                                                                    | Sistema |
| 2025-12-11 | HOME: Agregado tertiaryCta, ContactForm, InternalLinks                                                               | Sistema |
| 2025-12-11 | HOME: Secciones H2/H3 completas segun project-extends.md (WhatsAppShowcase, AutomationFlow, Integraciones, Medimos)  | Sistema |
| 2025-12-11 | HOME: Mejora UI Integraciones y Analytics (componentes dedicados)                                                    | Sistema |
| 2025-12-11 | SERVICIOS: Contenido actualizado 100% segun project-extends.md (Voz separada, FAQs y H1 exactos)                     | Sistema |
| 2025-12-11 | PLANES: Contenido actualizado 100% (Pricing Breakdown, 3 Planes exactos, 8 FAQs)                                     | Sistema |
| 2025-12-11 | DEMOS: Contenido actualizado 100% (Sectores, Canales, FAQ x6, Integraciones)                                         | Sistema |
| 2025-12-11 | SOBRE MI: Contenido actualizado 100% (Hero, Historia, Servicios, Caso Barberia, Herramientas)                        | Sistema |
| 2025-12-11 | FASE 0 COMPLETADA: Todas las paginas principales actualizadas segun project-extends.md                               | Sistema |
| 2025-12-11 | PAGINAS: Blog, Contacto, Privacidad, Cookies implementadas con React                                                 | Sistema |
| 2025-12-11 | ARQUITECTURA: Centralizado rutas React en pages.php con handler unico (renderReactApp)                               | Sistema |
| 2025-12-11 | ARQUITECTURA: ReactContentProvider para inyectar contenido WP a React                                                | Sistema |
| 2025-12-11 | FASE 0 VERIFICACION COMPLETADA: 93.3% conforme (28/30 items OK)                                                      | Sistema |
| 2025-12-11 | VERIFICACION: DEMOS 100% conforme, PRIVACIDAD 100% conforme, COOKIES 100% conforme                                   | Sistema |
| 2025-12-11 | VERIFICACION: BLOG - Hallazgos documentados (falta seccion "Casos destacados" y chips de canal)                      | Sistema |
| 2025-12-11 | CORRECCION: HOME - FeatureSection movida despues del hero (orden segun project-extends.md)                           | Sistema |
| 2025-12-11 | CORRECCION: SOBRE MI - Segunda foto (workingImage) agregada al renderizado                                           | Sistema |
| 2025-12-11 | CORRECCION: BLOG - Secciones separadas (Casos destacados + Lo ultimo) y chips de categoria activados                 | Sistema |
| 2025-12-11 | CORRECCION: CONTACTO - H1 exacto y 5 opciones de servicios (antes eran 4 canales de contacto)                        | Sistema |
| 2025-12-11 | FASE 0 VERIFICACION 100% COMPLETADA: Todos los hallazgos corregidos (30/30 items OK)                                 | Sistema |
| 2025-12-11 | FASE 1 COMPLETADA: Tipografia, paleta de colores, componentes base (botones, cards, alertas, focus-visible)          | Sistema |
| 2025-12-11 | FASE 1: Creado App/Config/performance.php con preconexiones (Google Fonts, Calendly, WhatsApp) y fuentes optimizadas | Sistema |
| 2025-12-11 | ROADMAP: Agregada FASE 1.5 para revision de estilos del tema project (cliente)                                       | Sistema |
| 2025-12-11 | ROADMAP: Actualizados estados de FASES 2-5. Marcados checkboxes de estructura implementada, pendiente SEO metadata   | Sistema |

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

---

## SISTEMA DE CONTENIDO REACT

### ReactContentProvider (PHP)

Servicio que inyecta contenido de WordPress a React. Ubicado en `Glory/src/Services/ReactContentProvider.php`.

**Uso en PHP (App/Content/reactContent.php):**
```php
use Glory\Services\ReactContentProvider;

// Registrar posts destacados
ReactContentProvider::register('blogFeatured', 'post', [
    'posts_per_page' => 3,
    'category_name' => 'caso-exito',
]);

// Registrar posts recientes
ReactContentProvider::register('blogRecent', 'post', [
    'posts_per_page' => 6,
]);

// Inyectar como variable global JS
ReactContentProvider::injectGlobal();
```

### useContent (React Hook)

Hook para consumir el contenido inyectado. Ubicado en `App/React/hooks/useContent.ts`.

**Uso en React:**
```tsx
import {useContent} from '../hooks/useContent';
import type {WordPressPost} from '../components/content';

// Obtener posts con fallback
const posts = useContent<WordPressPost[]>('blogFeatured', []);
```

### ContentRenderer (React Component)

Componente para renderizar posts de WordPress. Ubicado en `App/React/components/content/ContentRenderer.tsx`.

**Uso en React:**
```tsx
import {ContentRenderer} from '../components/content';

<ContentRenderer 
    content={posts}
    layout="grid"
    columns={3}
    showImage={true}
    showExcerpt={true}
/>
```

**Layouts disponibles:**
- `card`: Tarjeta individual
- `grid`: Rejilla de tarjetas
- `list`: Lista vertical
- `featured`: Primer post grande, resto en grid
- `minimal`: Solo titulo y fecha

