# Guía de Configuración: Analytics y SEO

Esta guía te ayudará a configurar Google Tag Manager (GTM), Google Analytics 4 (GA4) y Google Search Console (GSC) para tu sitio web.

---

## Índice

1. [Parte 1: Crear Contenedor GTM](#parte-1-crear-contenedor-gtm)
2. [Parte 2: Configurar GA4](#parte-2-configurar-ga4)
3. [Parte 3: Conectar GTM con GA4](#parte-3-conectar-gtm-con-ga4)
4. [Parte 4: Configurar Conversiones](#parte-4-configurar-conversiones)
5. [Parte 5: Verificar Google Search Console](#parte-5-verificar-google-search-console)
6. [Parte 6: Completar Theme Options](#parte-6-completar-theme-options)
7. [Parte 7: Probar Todo](#parte-7-probar-todo)

---

## Parte 1: Crear Contenedor GTM

### Paso 1.1: Crear cuenta GTM

1. Ve a [tagmanager.google.com](https://tagmanager.google.com)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Crear cuenta"**
4. Completa:
   - **Nombre de cuenta:** Tu nombre o empresa
   - **País:** España
5. Haz clic en **"Continuar"**
6. Completa la configuración del contenedor:
   - **Nombre del contenedor:** Tu dominio (ej: `guillermogarcia.com`)
   - **Plataforma destino:** Web
7. Acepta los términos y haz clic en **"Sí"**

### Paso 1.2: Copiar el ID del contenedor

Verás un código como este:
```
GTM-XXXXXXX
```

**¡Este es tu GTM ID!** Guárdalo, lo necesitarás después.

---

## Parte 2: Configurar GA4

### Paso 2.1: Crear propiedad GA4

1. Ve a [analytics.google.com](https://analytics.google.com)
2. Haz clic en **"Administrar"** (engranaje abajo a la izquierda)
3. En la columna "Propiedad", haz clic en **"Crear propiedad"**
4. Completa:
   - **Nombre de la propiedad:** Tu sitio web
   - **Zona horaria:** España
   - **Moneda:** Euro (EUR)
5. Haz clic en **"Siguiente"**
6. Completa información sobre tu negocio
7. Haz clic en **"Crear"**

### Paso 2.2: Crear flujo de datos web

1. Selecciona **"Web"** como plataforma
2. Completa:
   - **URL del sitio web:** `https://tudominio.com`
   - **Nombre del flujo:** Web principal
3. Haz clic en **"Crear flujo"**

### Paso 2.3: Copiar el ID de medición

Verás algo como:
```
G-XXXXXXXXXX
```

**¡Este es tu GA4 Measurement ID!** Guárdalo.

---

## Parte 3: Conectar GTM con GA4

### Paso 3.1: Crear etiqueta de configuración GA4

1. Vuelve a [tagmanager.google.com](https://tagmanager.google.com)
2. Selecciona tu contenedor
3. En el menú lateral, haz clic en **"Etiquetas"** > **"Nueva"**
4. Configuración:
   - **Nombre:** `GA4 - Configuración`
   - **Tipo de etiqueta:** `Google Analytics: Configuración de GA4`
   - **ID de medición:** Tu ID (ej: `G-XXXXXXXXXX`)
5. En **"Activación"**, selecciona **"All Pages"** (Todas las páginas)
6. Haz clic en **"Guardar"**

### Paso 3.2: Crear etiquetas de eventos

#### Evento: click_whatsapp

1. Nueva etiqueta:
   - **Nombre:** `GA4 Event - WhatsApp Click`
   - **Tipo:** `Google Analytics: Evento de GA4`
   - **Etiqueta de configuración:** Selecciona "GA4 - Configuración"
   - **Nombre del evento:** `click_whatsapp`
2. Activación:
   - Crear nuevo activador
   - **Tipo:** Evento personalizado
   - **Nombre del evento:** `click_whatsapp`
3. Guardar

#### Evento: click_calendly

Repite el proceso anterior con:
- **Nombre:** `GA4 Event - Calendly Click`
- **Nombre del evento:** `click_calendly`

#### Evento: lead_form_submit

Repite con:
- **Nombre:** `GA4 Event - Lead Form Submit`
- **Nombre del evento:** `lead_form_submit`

### Paso 3.3: Publicar contenedor GTM

1. Haz clic en **"Enviar"** (arriba a la derecha)
2. Nombre de la versión: `Configuración inicial GA4`
3. Haz clic en **"Publicar"**

---

## Parte 4: Configurar Conversiones

### Paso 4.1: Marcar eventos como conversiones en GA4

1. Ve a [analytics.google.com](https://analytics.google.com)
2. Administrar > Propiedad > Eventos
3. Espera a que aparezcan los eventos (pueden tardar 24-48h después de las primeras visitas)
4. Una vez que aparezcan, marca como conversión:
   - `click_whatsapp` ✓
   - `click_calendly` ✓
   - `lead_form_submit` ✓

### Paso 4.2: Crear objetivos (opcional pero recomendado)

1. Administrar > Propiedad > Conversiones
2. Haz clic en **"Nuevo evento de conversión"**
3. Agrega los tres eventos mencionados arriba

---

## Parte 5: Verificar Google Search Console

### Paso 5.1: Agregar propiedad

1. Ve a [search.google.com/search-console](https://search.google.com/search-console)
2. Haz clic en el selector de propiedades > **"Añadir propiedad"**
3. Selecciona **"Prefijo de URL"**
4. Introduce tu URL: `https://tudominio.com`
5. Haz clic en **"Continuar"**

### Paso 5.2: Método de verificación por meta tag

1. Selecciona el método **"Etiqueta HTML"**
2. Copia SOLO el código de verificación. Del tag:
   ```html
   <meta name="google-site-verification" content="TU_CODIGO_AQUI" />
   ```
   Solo necesitas: `TU_CODIGO_AQUI`

3. Este es tu **GSC Verification Code**. Guárdalo.

### Paso 5.3: Enviar sitemap

Una vez verificado:
1. Ve a **"Sitemaps"** en el menú lateral
2. Introduce: `sitemap_index.xml` o `sitemap.xml`
3. Haz clic en **"Enviar"**

---

## Parte 6: Completar Theme Options

### Acceder al panel

1. Inicia sesión en tu WordPress
2. Ve a **WP Admin > Theme Options** (o `/configuracion` si usas el panel React)

### Campos a completar

#### Pestaña: Integraciones

| Campo                 | Valor             | Ejemplo        |
| --------------------- | ----------------- | -------------- |
| GTM ID                | Tu ID de GTM      | `GTM-ABC123`   |
| GA4 Measurement ID    | Tu ID de medición | `G-XXXXXXXXXX` |
| GSC Verification Code | Solo el código    | `abc123xyz...` |

#### Pestaña: Identidad

| Campo            | Valor                   |
| ---------------- | ----------------------- |
| Nombre del sitio | Tu nombre o marca       |
| Tagline          | Frase corta descriptiva |
| Teléfono         | +34 XXXXXXXXX           |
| Email            | tu@email.com            |

#### Pestaña: Contacto

| Campo               | Valor                  | Ejemplo                           |
| ------------------- | ---------------------- | --------------------------------- |
| Calendly URL        | Tu enlace de reservas  | `https://calendly.com/tu-usuario` |
| WhatsApp Número     | Sin +, con código país | `34612345678`                     |
| Mensaje predefinido | Texto inicial          | `Hola, me interesa...`            |

#### Pestaña: Redes Sociales

| Campo     | Valor                     |
| --------- | ------------------------- |
| LinkedIn  | URL completa de tu perfil |
| Twitter/X | URL completa              |
| YouTube   | URL de tu canal           |
| Instagram | URL de tu perfil          |

#### Pestaña: Imágenes

| Campo             | Uso                                               |
| ----------------- | ------------------------------------------------- |
| Imagen Hero       | Imagen principal del sitio (1600x900 recomendado) |
| Imagen secundaria | Foto de la página "Sobre mí"                      |
| Logo              | Logo del sitio (PNG con transparencia)            |

---

## Parte 7: Probar Todo

### 7.1: Probar GTM (modo vista previa)

1. En GTM, haz clic en **"Vista previa"**
2. Introduce la URL de tu sitio
3. Navega por el sitio y verifica que:
   - La etiqueta `GA4 - Configuración` se activa en cada página
   - Al hacer clic en WhatsApp, se activa `GA4 Event - WhatsApp Click`
   - Al hacer clic en Calendly, se activa `GA4 Event - Calendly Click`

### 7.2: Probar GA4 (tiempo real)

1. Ve a GA4 > **Informes** > **Tiempo real**
2. Abre tu sitio en otra pestaña
3. Deberías verte como usuario activo
4. Haz clic en WhatsApp/Calendly y verifica que aparecen los eventos

### 7.3: Probar GSC

1. En Search Console, ve a **Inspección de URL**
2. Introduce tu URL principal
3. Verifica que dice "La URL está en Google" (puede tardar unos días)

### 7.4: Verificar JSON-LD

1. Ve a [validator.schema.org](https://validator.schema.org)
2. Pega la URL de tu página principal
3. Verifica que no hay errores en:
   - Organization (con logo y sameAs)
   - WebSite
   - ProfessionalService

---

## Checklist Final

### Antes del lanzamiento

- [ ] GTM ID configurado en Theme Options
- [ ] GA4 conectado a GTM
- [ ] Eventos de conversión creados (3 eventos)
- [ ] Contenedor GTM publicado
- [ ] GSC verificado
- [ ] Sitemap enviado
- [ ] Theme Options completados:
  - [ ] Identidad (nombre, teléfono, email)
  - [ ] Contacto (Calendly, WhatsApp)
  - [ ] Redes sociales (al menos LinkedIn)
  - [ ] Imágenes (logo, hero)

### Después del lanzamiento (24-48h)

- [ ] Verificar eventos en GA4 tiempo real
- [ ] Marcar eventos como conversiones
- [ ] Verificar indexación en GSC
- [ ] Probar JSON-LD en validator.schema.org

---

## Resumen de IDs necesarios

| ID                | Dónde obtenerlo                  | Dónde ponerlo                 |
| ----------------- | -------------------------------- | ----------------------------- |
| GTM-XXXXXXX       | tagmanager.google.com            | Theme Options > Integraciones |
| G-XXXXXXXXXX      | analytics.google.com             | GTM (etiqueta GA4)            |
| Verification code | search.google.com/search-console | Theme Options > Integraciones |

---

## Soporte

Si tienes dudas:
1. Revisa la documentación oficial de [Google Tag Manager](https://support.google.com/tagmanager)
2. Consulta la guía de [Google Analytics 4](https://support.google.com/analytics)
3. Contacta al desarrollador del tema

---

**Última actualización:** 2025-12-12  
**Versión:** 1.0
