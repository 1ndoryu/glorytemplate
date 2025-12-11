1. Objetivo y Contexto
Propósito: Una web profesional para ofrecer sus servicios de consultoría 1:1 en chatbots y automatización (WhatsApp, Instagram, Web, Voz).

Meta Principal: Captar leads cualificados y medir qué canal de contacto funciona mejor.

2. Estructura del Sitio
Según su oferta aceptada y el documento SEO, la web consta de:

Inicio (Home): Propuesta de valor y accesos rápidos.

Servicios: Desglose de lo que hace (WhatsApp, Automatización, Integraciones).

Planes: Precios y paquetes (Básico, Avanzado, Total).

Demos: Ejemplos de casos de uso por sector.

Blog: (El núcleo de la automatización).

Sobre Mí: Perfil personal de Guillermo.

Contacto: Formulario y accesos directos.

Legales: Privacidad y Cookies.

3. Funcionalidades Clave (Backend & Lógica)
A. Sistema de Contacto y Conversión

Debe integrar 3 vías simultáneas:

WhatsApp.

Calendario (Calendly).

Formulario Web.

Requisito Crítico: Necesita Analítica GA4 + GTM configurada para saber exactamente cuántos clics recibe cada botón y cuál convierte más.

B. Automatización del Blog con IA Es la característica personalizada más importante:

La Misión: La IA debe buscar noticias o tendencias de las últimas 2 semanas.

Temas: Exclusivamente sobre Chatbots y Automatizaciones con IA (ej. casos de éxito, ahorros de costes).

Flujo:

Búsqueda del tema.

Redacción automática del artículo.

Panel de Aprobación: El post NO se publica solo. Debe quedar en borrador para que Guillermo lo apruebe (seguridad contra "alucinaciones").

Configuración: Un panel simple para ajustar frecuencia, tono y temas a ignorar.

4. Diseño y Estética
Estilo: Limpio, legible, estructura clara y ordenada. "Corporate Tech".

Colores: Blanco y Azul como base (para transmitir limpieza y tecnología), con libertad para toques de color si aportan valor.

Referencias: Te pasó imágenes generadas por IA que mostraban un estilo minimalista y moderno.

5. Requerimientos Técnicos (SEO)
JSON-LD: Implementación estricta de datos estructurados en el <head> de cada página (Organization, ProfessionalService, Breadcrumbs, etc.).

Velocidad: Optimización móvil específica (imágenes con lazy-load, evitar saltos de layout CLS).

Contenido: El texto debe ser exactamente el del documento que envió, ya que está optimizado para SEO por él.

Estado Actual: Ya hemos maquetado la Home (Inicio), la página de Servicios y la página de Planes siguiendo estas directrices visuales y de contenido. El siguiente paso lógico sería maquetar la página de Demos o empezar a planificar el backend de la IA.

HOME - Implementación


0) URL, slug y canonical
Slug: /
Canonical: https://[URL_BASE]/

----------------------


1) Metadatos
Title: Chatbot para empresas | Háblame y arrancamos hoy
Meta description (≤160):
Chatbot para empresas en España. Soy Guillermo: trato 1:1, respuesta en menos de 30 min (09–21h), primer mes gratis y mantenimiento para atender mejor y gestionar reservas.

----------------------


2) Hero (above the fold)
H1: Chatbot para empresas que atiende a tus clientes 24/7 y gestiona reservas
Subhero (2 líneas):
Soy Guillermo. Creo el chatbot para tu empresa en tu web y en WhatsApp Business para que atiendas más rápido a tus clientes. Trabajamos tú y yo, 1:1, con respuesta en menos de 30 min (09–21h), primer mes gratis y mantenimiento continuo.
CTAs (en este orden, visibles):
[Calendario] Háblame ahora y respondo en menos de 30 min (09–21h) → [CALENDLY_URL]
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h) → https://wa.me/34XXXXXXXXX
[Formulario] Agenda en 30 s → ancla a formulario
Repetir bloque de CTAs cada ~2 secciones, manteniendo el orden.

----------------------


3) Cuerpo de la página
H2 — Lo que voy a conseguir contigo
Más oportunidades en menos horas: respuestas en segundos, 24/7.
Reservas directas: el bot propone día/hora y confirma por email/WhatsApp.
Menos tareas repetitivas: envía los datos al Software/CRM que uses.
Mejor experiencia: conversación con tono cuidado y, cuando haga falta, dejo paso a ti o tu equipo, con todo el historial a mano.
CTA de sección:
Háblame ahora y respondo en menos de 30 min (09–21h) (enlace a Calendario).

----------------------


H2 — WhatsApp Business
H3 — Detecto, clasifico y doy seguimiento
El bot pide lo necesario (nombre, interés, urgencia, etc), etiqueta la oportunidad y te avisa para que entres cuando quieras.
H3 — Derivación humana sin perder contexto
Si el tema lo requiere, dejo paso a ti o a tu equipo, con todo el historial a mano.
H3 — Permisos claros y RGPD
Incluyo opt-in/opt-out y aviso de privacidad.
CTA de sección:
Háblame ahora y respondo en menos de 30 min (09–21h) (WhatsApp).

----------------------


H2 — Automatización de procesos pymes
H3 — Formularios → Software/CRM
Todo lo que el bot recoge (contacto, interés, canal preferido, origen/UTM, etc) va directo a tu Software/CRM. Si lo prefieres, te preparo una hoja compartida.
H3 — Flujos con tu web y tu agenda
Integro el chatbot con tu web y agenda. Confirmaciones y recordatorios automáticos sin marearte con nombres de herramientas.
H3 — Reglas y FAQs transaccionales
Disponibilidad, plazos, precios orientativos o estado de pedido: respuestas claras que ahorran tiempo a tu equipo.
CTA de sección:
Agenda en 30 s (Calendario).

----------------------


H2 — Trabajo contigo, sin intermediarios
H3 — Llamada breve (15–20 min)
Me cuentas tu situación y objetivos.
H3 — Prototipo en 72 h
Te enseño un flujo real (preguntas frecuentes + datos de contacto + propuesta de cita) para decidir juntos.
H3 — Mejora continua
Reviso conversaciones y optimizo respuestas y conversiones cada mes.

----------------------


H2 — Integraciones
Tu web actual (sea cual sea)
WhatsApp Business
Instagram
Tu agenda (Google Calendar, Outlook, …)
Tu Software/CRM (ERP, facturación, HubSpot, Zoho…)
Email y avisos internos para que no se escape nada
Si no tienes CRM, empezamos con una hoja compartida.

----------------------


H2 — Medimos lo importante
Vas a ver quién te escribe, quién reserva y desde dónde llegan. Configuro tres cosas clave:
Clic en WhatsApp (click_whatsapp)
Cita creada (schedule_calendly)
Formulario enviado (lead_form_submit)
Además registro: fecha, página, origen/UTM, y consentimiento para poder mejorar.

----------------------


H2 — Si prefieres escribirme ahora
Formulario rápido
Campos: Nombre, Email, Teléfono, Empresa, Interés/Servicio, Mensaje, Canal preferido.
Texto de consentimiento (checkbox, obligatorio):
He leído y acepto la Política de Privacidad. Autorizo el tratamiento de mis datos para atender mi solicitud de información.
Enlaces visibles: Política de Privacidad y Política de Cookies.
CTA final (en este orden):
1) Agenda en 30 s (Calendario) → 2) Háblame ahora y respondo en menos de 30 min (09–21h) (WhatsApp) → 3) Enviar formulario

----------------------


4) Interlinking interno (colocar al final, antes del footer)
Servicios de chatbots y automatización → /servicios
Ver planes y empezar gratis → /planes
Probar una demo real → /demos
Artículos prácticos → /blog
Quién soy y cómo trabajo → /sobre-mi
Escríbeme o reserva → /contacto

----------------------


5) JSON-LD (pegar tal cual, reemplazando placeholders)
<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"Organization",
  "@id":"[URL_BASE]/#org",
  "name":"[MARCA] · Chatbots y Automatización",
  "url":"[URL_BASE]/",
  "logo":"[URL_BASE]/logo.png",
  "image":"[URL_BASE]/logo.png",
  "sameAs":["[LinkedIn]","[Twitter]","[YouTube]"]
}
</script>

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"ProfessionalService",
  "@id":"[URL_BASE]/#business",
  "name":"Guillermo García · Consultor de Chatbots",
  "url":"[URL_BASE]/",
  "areaServed":"Madrid",
  "openingHoursSpecification":[
    {
      "@type":"OpeningHoursSpecification",
      "dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      "opens":"09:00",
      "closes":"21:00"
    }
  ],
  "contactPoint":{
    "@type":"ContactPoint",
    "contactType":"customer support",
    "areaServed":"ES",
    "telephone":"+34 6XX XXX XXX",
    "availableLanguage":["es-ES"]
  },
  "potentialAction":{
    "@type":"ScheduleAction",
    "name":"Agendar una reunión",
    "target":{
      "@type":"EntryPoint",
      "urlTemplate":"[CALENDLY_URL]",
      "actionPlatform":[
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/IOSPlatform",
        "http://schema.org/AndroidPlatform"
      ],
      "inLanguage":"es-ES"
    }
  }
}
</script>

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"WebSite",
  "@id":"[URL_BASE]/#website",
  "name":"[MARCA] · Chatbots y Automatización",
  "url":"[URL_BASE]/",
  "potentialAction":{
    "@type":"SearchAction",
    "target":"[URL_BASE]/?s={search_term_string}",
    "query-input":"required name=search_term_string"
  },
  "publisher":{"@id":"[URL_BASE]/#org"}
}
</script>


Placeholders a rellenar: [URL_BASE], [MARCA], [CALENDLY_URL], +34 6XX XXX XXX, logo, perfiles sameAs, URLs de Privacidad y Cookies.

----------------------


6) Notas de maquetación
Un solo H1.
Párrafos cortos, bullets donde corresponda.
Repetir CTAs cada ~2 secciones (siempre Calendario → WhatsApp → Formulario).
Mostrar bloques “Integraciones” y “Medimos lo importante” como listas claras.
El formulario debe tener checkbox de consentimiento obligatorio.

SERVICIOS — Implementación

0) URL, slug y canonical
Slug: /servicios
Canonical: https://[URL_BASE]/servicios

----------------------


1) Metadatos
Title: Servicios de chatbots y automatización | Trabaja 1:1 conmigo
Meta description (≤160):
Chatbots en WhatsApp, Instagram y tu web, y voicebot para llamadas. Automatización de reservas y tareas + integraciones con tu software. Trabajo 1:1 contigo.

----------------------


2) Hero (above the fold)
H1: Servicios de chatbots y automatización para empresas, conmigo 1:1
Intro (2–3 líneas):
Diseño, implanto y mantengo chatbot WhatsApp, Instagram y tu web, además de voicebots (llamadas). Trabajo contigo, de tú a tú, para que atiendas mejor, resuelvas dudas y, cuando toca, gestiones reservas sin cargar a tu equipo. Respuesta en menos de 30 min (09–21h), primer mes gratis y mantenimiento continuo.
CTAs (en este orden, visibles):
[Calendario] Háblame ahora y respondo en menos de 30 min (09–21h) → [CALENDLY_URL]
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h) → https://wa.me/34XXXXXXXXX
[Formulario] Agenda en 30 s → ancla a formulario
Repetir bloque de CTAs cada ~2 secciones, manteniendo el orden. 

----------------------


3) Cuerpo de la página
H2 — WhatsApp Business (pilar principal)
H3 — Flujo de conversación útil
Preguntas claras (nombre, motivo, urgencia), etiquetas de interés y mensajes que ayudan de verdad.
H3 — Derivación a humano + avisos
Cuando conviene, entras tú o tu equipo con el historial a mano.
H3 — Permisos y cumplimiento
Incluyo opt-in/opt-out y aviso de privacidad.
H3 — API de WhatsApp Business (si procede)
Te acompaño en el alta con proveedor oficial cuando aporta (plantillas y escalado).
CTA de sección: Háblame ahora y respondo en menos de 30 min (09–21h) (enlace a Calendario).
----------------------


H2 — Instagram y Web (UChat multicanal)
H3 — Instagram DM
Respondo en tus mensajes de IG, derivo a persona y, si encaja, lanzo reserva.
H3 — Chatbot en tu web
Widget visible, FAQs transaccionales y derivación a humano.
H3 — Una sola base de conocimiento
Mismo tono y respuestas en todos los canales.

----------------------


H2 — Voz (llamadas) cuando prefieren hablar
H3 — Voicebot que atiende y clasifica
Saluda, entiende el motivo y dirige la llamada.
H3 — Pase a agente
Transfiere a persona cuando lo pide el caso o el cliente.
H3 — Horarios y mensajes
Horarios, festivos y buzón bien configurados.

----------------------


H2 — Automatización de reservas y tareas (Make/n8n)
H3 — Recordatorios y confirmaciones
El bot propone franjas, confirma y recuerda citas.
H3 — Volcado de datos
Contacto, interés, canal preferido y origen a tu Software/CRM (si no tienes, arrancamos con hoja compartida).
H3 — Etiquetas y avisos internos
Etiquetas por estado, avisos por email/WhatsApp y cambios de fase automáticos.
CTA de sección: Agenda en 30 s (Calendario).

----------------------


H2 — Integraciones con tu software
Tu agenda (p. ej., Calendly)
Google Sheets
Email (avisos/notificaciones)
Tu CRM (HubSpot, Zoho u otros)
ERP/otros vía webhook o conector
Si hoy no tienes CRM, empiezo con hoja compartida para que avances ya.

----------------------


H2 — Proceso de trabajo (simple y sin jerga)
H3 — 1) Llamada breve (15–20 min) · fijamos objetivos y 2–3 casos iniciales.
H3 — 2) Prototipo en 72 h · flujo real: dudas + datos + (si aplica) reserva.
H3 — 3) Integración y lanzamiento · conecto con tu web, tu agenda y tu Software/CRM.
H3 — 4) Mejora continua · reviso conversaciones y optimizo respuestas/conversión cada mes.

----------------------


H2 — ¿Hablamos?
Elige cómo prefieres:
[Calendario] Agenda en 30 s
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h)
[Formulario] Te leo y te respondo hoy

----------------------


H2 — FAQs (rápidas)
¿Trabajas con cualquier web o CRM?
Sí. Me adapto a tu web actual y a tu Software/CRM. Si no tienes, empezamos con hoja compartida.
¿Solo WhatsApp o también Instagram y web?
También Instagram DM y tu web, con la misma base de respuestas.
¿Automatizas reservas por WhatsApp/Instagram?
Sí: propuestas de franjas, confirmaciones y recordatorios. Uso tu agenda; si ya usas Calendly, también lo integro.
¿Precio del servicio?
Depende de los casos de uso y canales (WhatsApp/IG/Web/Voz). Primer mes gratis para verlo en marcha y ajustar.
¿Incluye mantenimiento?
Sí. Revisión de conversaciones, mejoras en respuestas y soporte continuo.

----------------------


4) Interlinking interno (colocar al final, antes del footer)
Ver planes (primer mes gratis) → /planes
Probar una demo → /demos
Escríbeme por WhatsApp → /contacto#whatsapp
Reservar una llamada → /contacto#calendario
Formulario de contacto → /contacto#formulario
Artículos prácticos → /blog

----------------------


5) JSON-LD (pegar tal cual, reemplazando placeholders)

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"BreadcrumbList",
  "itemListElement":[
    {"@type":"ListItem","position":1,"name":"Inicio","item":"[URL_BASE]/"},
    {"@type":"ListItem","position":2,"name":"Servicios","item":"[URL_BASE]/servicios"}
  ]
}
</script>

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"Service",
  "name":"Servicios de chatbots y automatización para empresas",
  "serviceType":"WhatsApp, Instagram, Web, Voz, Automatización (Make/n8n) e Integraciones",
  "areaServed":"ES",
  "provider":{"@id":"[URL_BASE]/#business"},
  "brand":{"@id":"[URL_BASE]/#org"},
  "url":"[URL_BASE]/servicios",
  "description":"Diseño, implantación e integración de chatbots en WhatsApp, Instagram y web, voicebot para llamadas y automatización de reservas/tareas con soporte continuo.",
  "hasOfferCatalog":{
    "@type":"OfferCatalog",
    "name":"Catálogo de servicios",
    "itemListElement":[
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"Chatbot WhatsApp Business","description":"Atiende y deriva a humano, avisos internos y cumplimiento (opt-in/opt-out)."}},
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"Chatbot Instagram (DM)","description":"Respuestas en Instagram, derivación y reservas si aplica."}},
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"Chatbot para tu web","description":"Widget, FAQs transaccionales y derivación con historial."}},
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"Voicebot (llamadas)","description":"Atiende, clasifica y transfiere a agente según el caso."}},
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"Automatización (Make/n8n)","description":"Recordatorios, confirmaciones, etiquetas y flujos de estado."}},
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"Integraciones","description":"Tu agenda (p. ej., Calendly), Google Sheets, email y CRM/ERP."}}
    ]
  }
}
</script>


Placeholders a rellenar: [URL_BASE], [CALENDLY_URL], sameAs/logo ya definidos en la Home, y conservar @id (#org, #business) tal como están allí. 

----------------------


6) Notas de maquetación
Un solo H1.
Párrafos cortos y bullets donde corresponda.
Repetir CTAs cada ~2 secciones (siempre Calendario → WhatsApp → Formulario).
Mostrar “Integraciones” y “Automatización” como listas claras.
Mantener el tono 1:1 (primera persona), sin jerga. 

----------------------
















PLANES — Implementación

0) URL, slug y canonical
Slug: /planes
Canonical: https://[URL_BASE]/planes

----------------------


1) Metadatos
Title: Precio chatbot: planes con mantenimiento | Primer mes gratis
Meta description (≤160):
Tres planes sin permanencias. Te explico cómo calculo el precio del chatbot y qué incluye (canales, automatización e integraciones). Trabajo 1:1 contigo. Primer mes gratis.

----------------------


2) Hero (above the fold)
H1: Precio chatbot: planes con mantenimiento incluido y primer mes gratis
Intro (2–3 líneas):
Te presento tres planes pensados para atender mejor, resolver dudas y, cuando proceda, gestionar reservas. El primer mes es gratis y, luego, hay una cuota mensual que incluye mantenimiento y mejoras continuas.
CTAs (en este orden, visibles):
[Calendario] Háblame ahora y respondo en menos de 30 min (09–21h) → [CALENDLY_URL]
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h) → https://wa.me/34XXXXXXXXX
[Formulario] Agenda en 30 s → ancla a formulario
Repetir bloque de CTAs cada ~2 secciones, manteniendo el orden. 

----------------------


3) Cuerpo de la página
H2 — ¿Cómo calculo el precio del chatbot y qué lo determina?
Canales: WhatsApp, Instagram DM, tu web y voz (llamadas) — uno o varios.
Automatización: reservas, recordatorios, confirmaciones, etiquetas y avisos.
Integraciones: tu agenda (si ya usas Calendly, lo conecto), Google Sheets, email y tu Software/CRM.
Volumen y soporte: actividad mensual y mantenimiento (revisión de conversaciones y mejoras).
Si buscas referencias de precios chatbot para empresas, te explico qué factores los determinan para que pagues solo por lo que necesitas.
CTA de sección: Háblame ahora y respondo en menos de 30 min (09–21h) (Calendario).

----------------------


H2 — Planes chatbot (elige y ajustamos juntos)
Sin permanencias. Puedes cambiar de plan en cualquier momento.
H3 — Plan Básico
1 canal a elegir (WhatsApp o Web o Instagram DM)
FAQs útiles + derivación a humano con historial
Formularios → tu Software/CRM (o hoja compartida si aún no tienes)
1 automatización ligera (p. ej., recordatorio de cita o control de stock)
Mantenimiento incluido · primer mes gratis
CTA: Agenda en 30 s (Calendario)

----------------------


H3 — Plan Avanzado · “Reservas y seguimiento”
1–2 canales (WhatsApp/IG/Web)
Reservas automáticas con tu agenda; si ya usas Calendly, también lo integro
3 automatizaciones (confirmaciones, etiquetas, avisos internos)
Integraciones: tu Software/CRM, Google Sheets, email
Mantenimiento incluido · primer mes gratis
CTA: Háblame ahora y respondo en menos de 30 min (09–21h)

----------------------


H3 — Plan Total · “Multicanal + Voz”
2–3 canales (WhatsApp, IG, Web) + voz (llamadas)
5–6 automatizaciones (recordatorios, cambios de estado, segmentaciones)
Integraciones avanzadas con Software/CRM y ERP
Mantenimiento incluido · primer mes gratis
CTA: Agenda en 30 s (Calendario)

----------------------


H2 — Qué verás en el mercado y por qué lo hago distinto
Muchos proveedores muestran planes por suscripción con features cerrados y otros estiman precio según alcance e integraciones. Yo prefiero definir juntos el/los canal(es), las automatizaciones y las integraciones para se adapten totalmente a lo que quieres conseguir, y, después, mantenerlo mensualmente y mejorarlo.

----------------------


H2 — ¿Hablamos?
Elige cómo prefieres:
[Calendario] Agenda en 30 s
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h)
[Formulario] Te leo y te respondo hoy

----------------------


H2 — FAQs (responden a dudas de precio)
¿Precios chatbot WhatsApp y tarifas?
Depende de los canales, la automatización y las integraciones que necesites. En cuanto a tarifas chatbot whatsapp, ajusto el alcance a tu caso y te paso propuesta clara tras una llamada breve. Primer mes gratis para verlo en marcha.
¿Puedo cambiar de plan cuando quiera?
Sí. Sin permanencias: puedes subir o bajar entre mis planes chatbot según tu carga y objetivos del mes. Ajusto el alcance y el soporte; el mantenimiento sigue activo para no perder tracción. 
¿Precios chatbot Instagram empresas?
Si IG DM es clave, puedo incluirlo en Básico/Avanzado/Total. Ajusto el alcance (respuestas, derivación y, si encaja, reservas).
¿Precio chatbot web para empresas?
Varía según alcance (FAQs, derivación a humano, automatizaciones e integraciones con tu web/agenda/Sheets/CRM). En mis planes chatbot el widget y las FAQs básicas van incluidos.
¿Precio automatizar reservas por WhatsApp?
Depende de las reglas de tu negocio (horarios, duración/buffer, antelación, cancelación y asignación por profesional/sede) y de si conecto con tu agenda. Yo implementaré tus reglas e incluiré recordatorios. Tras una llamada breve te paso propuesta. Primer mes gratis. 
¿Precio integración WhatsApp + Calendly/Google Sheets?
Depende del alcance: en Calendly puedo solo leer citas o también crear/actualizar/cancelar y enviar recordatorios, y en Google Sheets desde guardar leads básico hasta mapear columnas con validaciones y envíos automáticos, y tras una llamada te doy precio cerrado con primer mes gratis. 
¿Planes chatbot con mantenimiento incluido?
Sí. Todos. Revisión de conversaciones y mejoras continuas cada mes.
¿Precio voicebot (para empresas)?
Si el canal de voz te aporta, lo añado en el Plan Total y ajusto la propuesta.

----------------------


4) Interlinking interno (colocar al final, antes del footer)
Ver servicios en detalle → /servicios
Probar una demo → /demos
Escríbeme por WhatsApp → /contacto#whatsapp
Reservar una llamada → /contacto#calendario
Formulario de contacto → /contacto#formulario

5) JSON-LD (pegar tal cual, reemplazando placeholders) 

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"BreadcrumbList",
  "itemListElement":[
    {"@type":"ListItem","position":1,"name":"Inicio","item":"[URL_BASE]/"},
    {"@type":"ListItem","position":2,"name":"Planes","item":"[URL_BASE]/planes"}
  ]
}
</script>

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"ItemList",
  "itemListElement":[
    {
      "@type":"ListItem",
      "position":1,
      "item":{
        "@type":"Service",
        "name":"Plan Básico — Empezar bien",
        "description":"1 canal (WhatsApp/IG/Web); FAQs + derivación; formularios a tu Software/CRM u hoja compartida; 1 automatización ligera; mantenimiento incluido; primer mes gratis."
      }
    },
    {
      "@type":"ListItem",
      "position":2,
      "item":{
        "@type":"Service",
        "name":"Plan Avanzado — Reservas y seguimiento",
        "description":"1–2 canales; reservas con tu agenda (incl. Calendly si lo usas); 3 automatizaciones; etiquetas y avisos; integraciones con Sheets/email/CRM; mantenimiento incluido; primer mes gratis."
      }
    },
    {
      "@type":"ListItem",
      "position":3,
      "item":{
        "@type":"Service",
        "name":"Plan Total — Multicanal + Voz",
        "description":"2–3 canales + Voz; 5–6 automatizaciones; integraciones avanzadas con Software/CRM y ERP; mejora continua; mantenimiento incluido; primer mes gratis."
      }
    }
  ]
}
</script>

6) Notas de maquetación
Un solo H1.
Párrafos cortos y bullets donde corresponda.
Repetir CTAs cada ~2 secciones (siempre Calendario → WhatsApp → Formulario).
Mantener el tono 1:1 (primera persona), sin jerga.
Si añades tracking: click_whatsapp, schedule_calendly, lead_form_submit y guardar origen/UTM en tu sistema/hoja.






















DEMOS/CASOS - Implementación

0) URL, slug y canonical
Slug: /demos
Canonical: https://[URL_BASE]/demos

----------------------


1) Metadatos
Title: Demo Chatbot WhatsApp | Pruébalo con tu caso (gratis)
Meta description (≤160):
Te enseño una demo de chatbot WhatsApp con tu caso real. También Instagram, web y voicebot. Reservas, avisos e integraciones. Trabajo 1:1 contigo. Primer mes gratis.

----------------------


2) Hero (above the fold)
H1: Demo chatbot WhatsApp: pruébalo con tu caso
Subhero (2–3 líneas):
Te enseño una demo real de chatbot en WhatsApp (y, si quieres, Instagram/web/voz) aplicada a tu negocio: atender mejor, resolver dudas y gestionar reservas.
CTAs (visibles, en este orden):
[Calendario] Háblame ahora y respondo en menos de 30 min (09–21h) → [CALENDLY_URL]
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h) → https://wa.me/34XXXXXXXXX
[Formulario] Agenda en 30 s → ancla a formulario

----------------------


3) Cuerpo de la página
H2 — Qué verás en la demo
Conversaciones claras que atienden y derivan a humano cuando toca
Reservas con tu agenda y recordatorios
Avisos internos y etiquetas para seguimiento
Integraciones (Calendly, Google Sheets, tu Software/CRM)
CTA de sección: Agenda en 30 s (Calendario)

----------------------


H2 — Elige tu demo (Canales)
H3 — Demo chatbot WhatsApp
Mensajes útiles, derivación a persona y seguimiento.
H3 — Demo chatbot Instagram (DM)
Responde en Instagram y, si procede, propone y confirma la reserva.
H3 — Demo chatbot web
Widget visible, FAQs transaccionales y pase a humano.
H3 — Demo voicebot (llamadas)
Atiende, clasifica, reserva y transfiere a agente.

----------------------


H2 — Demos por sector (ejemplos rápidos)
H3 — Demo chatbot WhatsApp para restaurantes
Consulta de mesa, reserva y recordatorio.
H3 — Demo chatbot para barbería
Citas, reprogramaciones y avisos internos.
H3 — Demo voicebot para fisioterapia
Triado rápido, disponibilidad y pase a persona.

----------------------


H2 — Integraciones en la demo
Tu agenda (si ya usas Calendly, lo conecto)
Google Sheets (leads básicos o mapeo avanzado)
Email (avisos/notificaciones)
Tu Software/CRM
CTA de sección: Háblame ahora y respondo en menos de 30 min (09–21h) (WhatsApp)

----------------------


H2 — Cómo lo hacemos
H3 — 1) Llamada breve (15–20 min) · eliges canal/sector y objetivo
H3 — 2) Preparo tu demo · flujos y mensajes con tus “reglas”
H3 — 3) La probamos juntos · ajustes en directo
H3 — 4) Siguiente paso · si te encaja, lo lanzamos (primer mes gratis)

----------------------


H2 — ¿Hablamos?
Elige cómo prefieres:
[Calendario] Agenda en 30 s
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h)
[Formulario] Te leo y te respondo hoy

----------------------


H2 — FAQs (demo y casos)
¿Prueba gratis chatbot WhatsApp?
Sí. Preparo una demo gratuita con tu caso y vemos si encaja (además, el primer mes es gratis).
¿Cómo solicitar demo chatbot para reservas?
Reserva en el Calendario y dime tu agenda; preparo flujos con reglas de tu negocio y recordatorios.
¿Puedo probar chatbot WhatsApp para citas?
Sí. Propondrá franjas, confirmará y enviará recordatorios; puedes tomar el relevo cuando quieras.
¿Demo integración WhatsApp con Calendly?
Sí. Puedo leer/crear/actualizar citas y mandar recordatorios.
¿Demo chatbot con Google Sheets?
Sí. Desde guardar leads básicos hasta mapear columnas y validaciones.
¿Casos de éxito chatbots?
Te enseño ejemplos reales aplicados a tu sector (restaurantes, barberías, clínicas…) y qué impacto tuvieron.

----------------------


4) Interlinking interno (colocar al final, antes del footer)
Ver servicios en detalle → /servicios
Ver planes (primer mes gratis) → /planes
Escríbeme por WhatsApp → /contacto#whatsapp
Reservar una llamada → /contacto#calendario
Formulario de contacto → /contacto#formulario
Quién soy y cómo trabajo → /sobre-mi

----------------------


5) JSON-LD (pegar tal cual, reemplazando placeholders)

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"BreadcrumbList",
  "itemListElement":[
    {"@type":"ListItem","position":1,"name":"Inicio","item":"[URL_BASE]/"},
    {"@type":"ListItem","position":2,"name":"Demos","item":"[URL_BASE]/demos"}
  ]
}
</script>

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"Service",
  "name":"Demo chatbot WhatsApp (también Instagram, web y voz)",
  "serviceType":"Demostraciones aplicadas a casos reales: atención, reservas e integraciones",
  "url":"[URL_BASE]/demos",
  "areaServed":"ES",
  "provider":{"@id":"[URL_BASE]/#business"},
  "brand":{"@id":"[URL_BASE]/#org"},
  "description":"Demo real de chatbot en WhatsApp (y opcionalmente Instagram, web y voz). Incluye reservas, avisos e integraciones con agenda, Google Sheets y Software/CRM.",
  "potentialAction":{
    "@type":"ScheduleAction",
    "name":"Solicitar demo",
    "target":{
      "@type":"EntryPoint",
      "urlTemplate":"[CALENDLY_URL]",
      "actionPlatform":[
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/IOSPlatform",
        "http://schema.org/AndroidPlatform"
      ],
      "inLanguage":"es-ES"
    }
  }
}
</script>

6) Notas de maquetación
Un solo H1.
Párrafos cortos y bullets.
Repetir CTAs cada ~2 secciones (Calendario → WhatsApp → Formulario).
Mostrar “Demos por sector” e “Integraciones” como listas claras.
Mantener tono 1:1 (primera persona), sin jerga.














































BLOG — Implementación

0) URL, slug y canonical
Slug: /blog
Canonical: https://[URL_BASE]/blog

----------------------


1) Metadatos
Title: Mejores chatbots para WhatsApp Business | Casos y noticias
Meta (≤160): Noticias y casos reales de empresas con chatbots/automatización en WhatsApp, Instagram, web y voz. Qué hicieron y qué lograron. En claro y sin jerga.

----------------------


2) Hero (above the fold)
H1 — Blog: mejores chatbots para WhatsApp Business (casos y noticias)
Subhero
Noticias y casos reales de empresas con chatbots y automatización con resultados que han conseguido.
CTAs (en este orden, visibles)
[Calendario] Háblame ahora y respondo en menos de 30 min (09–21h) → [CALENDLY_URL]
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h) → https://wa.me/34XXXXXXXXX
[Formulario] Agenda en 30 s → #formulario

----------------------


3) Contenidos
H2 — Casos destacados
Tarjetas con H3 (título del post) + 2–3 líneas + botón “Leer”. Añade chips: fecha · canal (ej. WhatsApp Business) · (opcional) Sin métricas.
H3 — Comparativa de chatbots para WhatsApp Business (qué mirar en 2025)
Qué cambia este año y en qué fijarte de verdad: API, plantillas, coste por conversación, multicanal e integraciones.
Botón: Leer
H3 — WhatsApp + Calendly en un restaurante: menos llamadas, más mesas
Cómo conectaron reserva y recordatorios para bajar teléfono y subir ocupación.
Botón: Leer
H3 — El mejor chatbot para reservas: lo que piden quienes les va bien
Reglas claras, agenda y avisos internos. Checklist sencillo para copiar.
Botón: Leer
H3 — Make vs n8n: recordatorios, avisos y etiquetas sin líos
Cuándo elegir uno u otro según equipo, costes y mantenimiento.
Botón: Leer
CTA de sección: Agenda en 30 s (Calendario)

----------------------





H2 — Lo último
Rejilla con los 6 posts más recientes. Cada card usa H3 como título del post, 2–3 líneas y botón Leer. (Cada card muestra también chips: fecha · canal (WhatsApp / Instagram / Web / Voz) · tipo (Caso real / Noticia). 
Bajo la card, mini-enlace contextual:
Probar demo de WhatsApp → /demos
Ver planes → /planes
Servicios → /servicios

----------------------


H2 — Enlaces útiles (interlinking)
Servicios de chatbots y automatización → /servicios
Ver planes (primer mes gratis) → /planes
Probar una demo → /demos
Escríbeme por WhatsApp → /contacto#whatsapp
Reservar una llamada → /contacto#calendario
Formulario de contacto → /contacto#formulario
Quién soy y cómo trabajo → /sobre-mi

----------------------


4) JSON-LD (índice del blog)

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList",
 "itemListElement":[
  {"@type":"ListItem","position":1,"name":"Inicio","item":"[URL_BASE]/"},
  {"@type":"ListItem","position":2,"name":"Blog","item":"[URL_BASE]/blog"}
 ]}
</script>

JSON-LD para posts (pegar en cada post) 

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"BlogPosting",
  "headline":"[TÍTULO DEL POST]",
  "author":{"@type":"Person","name":"Guillermo"},
  "datePublished":"[YYYY-MM-DD]",
  "dateModified":"[YYYY-MM-DD]",
  "mainEntityOfPage":{"@type":"WebPage","@id":"[URL_DEL_POST]"}
}
</script>

(cambiar lo de los corchetes según el post)



5) Notas de maquetación (equipo)
H1 único en el hero.
Usa H2 para secciones (“Casos destacados”, “Lo último”, “Enlaces útiles”).
Cada card de post lleva H3 (título del post), 2–3 líneas y botón Leer + chips fecha · canal · (opcional) Sin métricas.
Repite CTAs cada ~2 secciones (Calendario → WhatsApp → Formulario).
En posts individuales: bajo el H1 pon Publicado: [fecha] · Última revisión: [fecha] y, al final, Fuente si aplica.

Plantilla del post (individual) — Autor, fechas y fuentes

Debajo del título (H1) del post, mostrar esta línea:
Por Guillermo · Publicado el [DD/MM/AAAA] · Actualizado: [DD/MM/AAAA]

Al final del post, añadir el bloque:
Fuentes consultadas:
– https://[enlace-1].com
– https://[enlace-2].com














































SOBRE MÍ — Implementación

0) URL, slug y canonical
Slug: /sobre-mi
Canonical: https://[URL_BASE]/sobre-mi

----------------------


1) Metas
Title: Consultor de chatbots en Madrid | Trabajo 1:1 contigo
Meta (≤160): Guillermo: consultor de chatbots y automatización (WhatsApp Business, Instagram, web y voz). 1:1, remoto en toda España. Respuesta en menos de 30 min y primer mes gratis.

----------------------


2) HERO
H1: Consultor de chatbots: trabajo 1:1 contigo

Subhero (2–3 líneas):
Soy Guillermo, de Madrid. Vengo del mundo audiovisual y me enganché a la IA desde ChatGPT. Hoy ayudo a pymes a atender mejor y automatizar con chatbots (WhatsApp Business, Instagram, web y voz), en remoto por toda España. Estoy en Madrid; trabajo en toda España.

CTAs (en este orden):
[Calendario] Háblame ahora y respondo en menos de 30 min (09–21h) → [CALENDLY_URL]
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h) → https://wa.me/34XXXXXXXXX
[Formulario] Agenda en 30 s → #formulario


📷 Foto 1 (hero)
src="/img/sobre-mi-guillermo-hero.jpg"
alt="Guillermo, consultor de chatbots en Madrid, en videollamada"

----------------------


3) Cuerpo
H2 — Quién soy
Me llamo Guillermo, tengo 28 años y he vivido siempre en Madrid. La primera vez que probé ChatGPT pensé: “esto cambia la forma de trabajar”. Desde entonces me puse manos a la obra y hoy soy consultor de chatbots y consultor de automatización de procesos para pymes.
Trabajo 1:1 y en remoto: me cuentas tu caso, lo traduzco a flujos simples y me ocupo de que funcione a diario. Mi objetivo es claro: que tú trabajes menos y tu negocio rinda más (mejor atención, menos interrupciones y reservas sin fricción).

H2 — Lo que hago contigo (directo y sin jerga)
WhatsApp Business para empresas: responder dudas, derivar a humano y agendar citas. (consultor WhatsApp Business)
Instagram / Web: DM y widget con FAQs útiles.
Voz (llamadas): voicebot sencillo que atiende, clasifica y pasa a persona. (consultor voicebot para empresas)
Automatización (Make / n8n): recordatorios, etiquetas y avisos internos. (consultor de automatización de procesos / consultor Make y n8n)
Integraciones: Calendly, Google Sheets, email y tu Software/CRM. (consultor integración WhatsApp con Calendly/Google Sheets)


CTA de sección: Agenda en 30 s (Calendario)

H2 — Un caso (barbería)
En MVP Barber me contaron que no podían contestar los WhatsApp mientras cortaban el pelo y lo hacían en sus ratos libres, fuera del horario. Montamos un chatbot para dudas típicas y citas. Resultado: ahora cortan en paz y el bot se encarga del resto.

H2 — Cómo trabajo
Llamada breve → objetivo y 2–3 casos.
Prototipo → flujo real con tus reglas.
Lanzamos → conecto con tu web/agenda/CRM.
Mantenimiento → reviso chats y mejoro cada mes.


📷 Foto 2 (media página)
src="/img/sobre-mi-guillermo-trabajando.jpg"
alt="Guillermo configurando automatizaciones en UChat y Make"


H2 — Herramientas que uso
UChat para el bot, Make (y cuando conviene n8n) para automatizar, más Google Sheets, Calendly, WhatsApp, Instagram y tu CRM. Si no tienes CRM, empezamos con hoja compartida y listo.

CTA: Háblame ahora y respondo en menos de 30 min (09–21h) (WhatsApp)

H2 — ¿Hablamos?
[Calendario] Agenda en 30 s
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h)
[Formulario] Te leo y te respondo hoy

----------------------


4) Interlinking (al final, antes del footer)
Ver servicios en detalle → /servicios
Ver planes (primer mes gratis) → /planes
Probar una demo real → /demos
Escríbeme por WhatsApp → /contacto#whatsapp
Reservar una llamada → /contacto#calendario
Formulario de contacto → /contacto#formulario
Blog: casos y noticias → /blog

----------------------


5) JSON-LD (BreadcrumbList)

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList",
 "itemListElement":[
  {"@type":"ListItem","position":1,"name":"Inicio","item":"[URL_BASE]/"},
  {"@type":"ListItem","position":2,"name":"Sobre mí","item":"[URL_BASE]/sobre-mi"}
 ]}
</script>

6) Notas de maquetación
Mantén 2 fotos (hero + media página).
Párrafos de 2–3 líneas y titulares claros.
Repite CTAs cada ~2 secciones (Calendario → WhatsApp → Formulario).
Alt descriptivo en las fotos.
Tono cercano (yo, Guillermo), sin jerga.




























CONTACTO - Implementación


0) URL, slug y canonical
Slug: /contacto
Canonical: https://[URL_BASE]/contacto

----------------------


1) Metadatos
Title: Solicitar presupuesto chatbot WhatsApp | Contacto (Guillermo)
Meta (≤160): Solicita presupuesto para chatbot de WhatsApp o agenda una demo. También Instagram, web y voz. Respondo en menos de 30 min (09–21h). Primer mes gratis. Madrid/ES.

----------------------


2) Hero (above the fold)
H1 — Solicitar presupuesto chatbot WhatsApp
Subhero (nuevo)
Cuéntame tu proyecto y pide presupuesto o agenda una demo (WhatsApp, Instagram, web y voz). Respondo en menos de 30 min (09-21h).

CTAs (en este orden, visibles)
[Calendario] Háblame ahora y respondo en menos de 30 min (09–21h) → [CALENDLY_URL]
[WhatsApp] Háblame ahora y respondo en menos de 30 min (09–21h) → https://wa.me/34XXXXXXXXX
[Formulario] Agenda en 30 s → #formulario

----------------------


3) Contenidos
H2 — Qué necesitas (elige y te respondo hoy)
H3 — Contratar chatbot WhatsApp
Atención de dudas frecuentes y citas.
H3 — Agendar demo (WhatsApp / Instagram / Voicebot)
Vemos tu caso en una llamada breve.
H3 — Solicitar presupuesto: automatización de reservas
Reglas de tu negocio + recordatorios y avisos.
H3 — Presupuesto integración WhatsApp + Calendly / Google Sheets
Conecto y dejo los datos listos para seguimiento.
H3 — Contactar consultor WhatsApp Business / chatbots en Madrid
Trabajo en remoto en toda España.
CTA de sección: Agenda en 30 s (Calendario)

----------------------


H2 — Formulario rápido (RGPD)
H3 — Ancla
id="formulario"
H3 — Campos mínimos
Nombre · WhatsApp · Email · Empresa · Interés/Servicio (select) · Mensaje · Canal preferido (WhatsApp/Email/Llamada).
H3 — Campos ocultos (tracking)
utm_source, utm_medium, utm_campaign, utm_content, page_url, timestamp.
H3 — Consentimiento (checkbox obligatorio)
“He leído y acepto la Política de Privacidad y autorizo el tratamiento de mis datos para atender mi solicitud.”
Enlaces visibles: Privacidad y Cookies.

----------------------


H2 — Qué pasa después
H3 — 1) Respuesta en menos de 30 min (09–21h)
Te confirmo por WhatsApp o email.
H3 — 2) Llamada breve
Cerramos alcance (canales, automatización, integraciones).
H3 — 3) Propuesta clara
Primer mes gratis + mantenimiento incluido.

----------------------


H2 — Interlinking (al final, antes del footer)
Servicios de chatbots y automatización → /servicios
Ver planes (primer mes gratis) → /planes
Probar una demo → /demos

----------------------


H2 — FAQs (cortas)
H3 — ¿Puedo agendar demo de chatbot WhatsApp?
Sí, usa el Calendario arriba.
H3 — ¿Trabajas solo en Madrid?
Vivo en Madrid, pero trabajo en remoto en toda España.
H3 — ¿Presupuesto integración WhatsApp + Calendly/Sheets?
Sí; conecto tu agenda/Sheets y dejo el dato limpio.
H3 — ¿Contrato ya o primero una demo?
Como prefieras: presupuesto o demo y decidimos.
H3 — ¿Automatización de reservas?
Implemento tus reglas y conecto tu agenda.

----------------------


4) JSON-LD (Contacto — ProfessionalService + ScheduleAction)
(reemplaza placeholders).

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"ProfessionalService",
  "name":"Guillermo García · Consultor de Chatbots",
  "url":"[URL_BASE]/contacto",
  "areaServed":"Madrid",
  "openingHoursSpecification":[{
    "@type":"OpeningHoursSpecification",
    "dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens":"09:00","closes":"21:00"
  }],
  "contactPoint":{
    "@type":"ContactPoint",
    "contactType":"customer support",
    "areaServed":"ES",
    "telephone":"+34 6XX XXX XXX",
    "availableLanguage":["es-ES"]
  },
  "potentialAction":{
    "@type":"ScheduleAction",
    "name":"Agendar una reunión",
    "target":{
      "@type":"EntryPoint",
      "urlTemplate":"[CALENDLY_URL]",
      "actionPlatform":[
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/IOSPlatform",
        "http://schema.org/AndroidPlatform"
      ],
      "inLanguage":"es-ES"
    }
  }
}
</script>

HTML mínimo del formulario

<form id="contacto" action="[WEBHOOK_O_ENDPOINT]" method="post">
  <input name="nombre" placeholder="Tu nombre" required>
  <input name="telefono" placeholder="Tu WhatsApp" required>
  <input type="email" name="email" placeholder="Email (opcional)">
  <input name="empresa" placeholder="Empresa (opcional)">
  <select name="servicio" required>
    <option value="">¿Qué necesitas?</option>
    <option>Solicitar presupuesto chatbot WhatsApp</option>
    <option>Agendar demo chatbot WhatsApp</option>
    <option>Agendar demo chatbot Instagram</option>
    <option>Agendar demo voicebot</option>
    <option>Solicitar presupuesto automatización de reservas</option>
    <option>Presupuesto integración WhatsApp + Calendly</option>
    <option>Presupuesto integración WhatsApp + Google Sheets</option>
    <option>Solicitar presupuesto chatbot web para empresas</option>
  </select>
  <textarea name="mensaje" placeholder="Cuéntame tu caso (2–3 líneas)"></textarea>

  <!-- ocultos -->
  <input type="hidden" name="utm_source">
  <input type="hidden" name="utm_medium">
  <input type="hidden" name="utm_campaign">
  <input type="hidden" name="utm_content">
  <input type="hidden" name="page_url" value="[URL_BASE]/contacto">
  <input type="hidden" name="timestamp" value="">

  <label>
    <input type="checkbox" name="consentimiento" required>
    He leído y acepto la <a href="[URL_PRIVACIDAD]">Política de Privacidad</a> y la <a href="[URL_COOKIES]">Política de Cookies</a>.
  </label>

  <button type="submit">Enviar</button>
</form>













































POLÍTICA DE PRIVACIDAD - Implementación

Slug / Canonical
/privacidad · https://[URL_BASE]/privacidad

Title / Meta
Title: Política de privacidad
Meta (≤160): Cómo trato tus datos: responsable, para qué los uso, base legal, cesiones, derechos y cookies.

H1 — Política de privacidad

H2 — Responsable del sitio
Soy Guillermo García Sáez, Nif: 50359467-R.
Domicilio: Calle Río Jalón, 23 · Email: guillermo.autoia@gmail.com · Dominio: [DOMINIO].

H2 — Para qué uso tus datos
Atender tus mensajes (formularios, WhatsApp, email).
Agendar demos/citas si me las pides.
Comunicaciones operativas (recordatorios/avisos).
Medición básica del sitio si aceptas cookies analíticas.


H3 — Base legal
Tu consentimiento; medidas precontractuales/contrato (si pides presupuesto o reservas); interés legítimo en comunicaciones operativas.

H2 — A quién encargo datos (encargados)
Solo a proveedores que necesito para darte el servicio: hosting, correo, automatización (Make/n8n), Google (Sheets/Workspace), Calendly y, si procede, tu Software/CRM. No vendo tus datos.

H2 — Cuánto tiempo los conservo
Mientras dure nuestra relación y los plazos legales. Las solicitudes de contacto las guardo 12 meses.

H2 — Tus derechos
Puedes acceder, rectificar, suprimir, oponerte, limitar y portar tus datos. Escríbeme a guillermo.autoia@gmail.com con el asunto “Derechos RGPD”.

H2 — Cookies
Uso cookies solo si las aceptas. Más info en la Política de cookies.

H2 — Última revisión
[FECHA_CREACIÓN_DE_LA_PÁGINA]










JSON-LD (BreadcrumbList)

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList",
 "itemListElement":[
  {"@type":"ListItem","position":1,"name":"Inicio","item":"[URL_BASE]/"},
  {"@type":"ListItem","position":2,"name":"Privacidad","item":"[URL_BASE]/privacidad"}
 ]}
</script>









































POLÍTICA DE COOKIES - Implementación

Slug / Canonical
/cookies · https://[URL_BASE]/cookies

Title / Meta
Title: Política de cookies
Meta (≤160): Qué cookies uso, para qué sirven y cómo puedes configurarlas o revocarlas.


H1 — Política de cookies

H2 — Qué son
Son pequeños archivos que uso para que la web funcione, mida uso o recuerde preferencias.

H2 — Qué cookies uso (ajusta a tu caso real) 
Uso dos tipos de cookies en este sitio:
Cookies necesarias:
Nombre: cookie_consent (propia).
Para qué las uso: recordar tu elección sobre cookies (aceptar, rechazar o ajustar).
Duración: entre 6 y 12 meses.
Cookies analíticas (solo si las aceptas):
Nombres: _ga y _gid (Google).
Para qué las uso: medir de forma anónima y agregada cómo se utiliza la web (páginas vistas, navegación, etc.).
Duración: hasta 13 meses.


H2 — Configurar o revocar
Puedes cambiar tu elección cuando quieras desde el botón “Ajustar cookies” del pie de página.

H2 — Proveedores y transferencias
Algunos proveedores (p. ej., Google) pueden estar fuera del EEE; aplican garantías adecuadas.

H2 — Última revisión
[FECHA_CREACIÓN_PÁGINA_WEB]

JSON-LD (BreadcrumbList)
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList",
 "itemListElement":[
  {"@type":"ListItem","position":1,"name":"Inicio","item":"[URL_BASE]/"},
  {"@type":"ListItem","position":2,"name":"Cookies","item":"[URL_BASE]/cookies"}
 ]}
</script>






IMÁGENES DE LA WEB

Objetivo: que las imágenes se vean bien, ayuden al SEO y no ralenticen la web. 
** Poner cada imagen junto al texto que habla de ese tema, no aislada sin texto cerca.**

Dónde va cada imagen
Home: imagen hero arriba del todo.
Sobre mí: Foto 1 (hero) arriba + Foto 2 en “Cómo trabajo”.
Demos: miniaturas por canal (WhatsApp, Instagram, Voz).
Blog: imagen destacada en cada post (y miniatura en el listado).
Contacto/Servicios/Planes/Legal: solo si hay imágenes; si no, nada.

Carga (“lazy-load”)
Hero de cada página: sin lazy-load (carga normal).
Resto de imágenes: con lazy-load activado.


Dimensiones (evitar saltos)
Al insertar, definir ancho y alto (valores aproximados sirven):
Hero: p. ej. 1600 × 900
Contenido: p. ej. 1200 × 800
Miniaturas/listados: p. ej. 600 × 400


Enlaces y texto dentro de imágenes
No enlazar la imagen a su archivo (evitar “abrir en grande” si no aporta).
No meter titulares ni frases importantes dentro de la imagen (deben ser texto normal de la página).



















RENDIMIENTO DE LA WEB EN MÓVIL


Objetivo: que la web cargue ágil en móvil y no pegue “saltos”.

1) Tipografías (fuentes)
Usar máximo 1 familia y 2 grosores (ej.: regular y bold).
Si el tema/constructor lo permite: activar “display=swap” en la carga de Google Fonts.
Si las fuentes están autoalojadas: añadir font-display: swap; dentro de cada @font-face.

2) Conexiones rápidas para Calendly y WhatsApp
Añadir en el HEAD del sitio estas dos líneas (para acelerar la primera conexión):
<link rel="preconnect" href="https://assets.calendly.com" crossorigin>
<link rel="preconnect" href="https://wa.me">

(En WordPress: “Apariencia → Editor del tema” o un bloque de “Código en el head” del tema/constructor.) 

3) Widgets sin “saltos” (CLS)
Si se incrusta Calendly, reservar espacio fijo:
Añadir en CSS del sitio:
.calendly-inline-widget { min-height: 700px; }
Usar ese contenedor al incrustar Calendly (el alto puede ajustarse si hace falta).
Si se usan iframes externos (mapas, etc.): ponerles una altura fija (por ejemplo, 400–700 px).


4) Botones y texto en móvil
Botones y enlaces grandes (mín. 44 px de alto).
El H1 y el texto del hero deben leerse sin zoom; no poner letras demasiado finas.
Primer CTA visible nada más abrir la página.


5) Pop-ups y banners
Nada intrusivo: el banner de cookies pequeño abajo; evitar pantallas que bloqueen el contenido.
Cerrar pop-ups con una X clara y accesible.











TEXTO INDEXABLE

Objetivo: que Google pueda leer todo lo importante (títulos, párrafos y botones).

Cómo hacerlo (regla de oro): si algo es relevante para el usuario/SEO, que esté escrito como texto normal en el editor de la página, no dentro de imágenes ni apareciendo “a posteriori” por scripts.
1) Títulos y párrafos
H1, H2, H3 y textos: escribirlos como bloques de título y párrafo del propio editor (Gutenberg/constructor).
No poner titulares como imagen ni como capa de foto.

2) CTAs y botones
El texto del botón (ej.: “Háblame ahora y respondo en menos de 30 min (09–21h)”) debe ser texto del botón, no una imagen.

3) Listados, pestañas y acordeones
Si usas acordeones/pestañas, el contenido debe estar ya escrito dentro (aunque esté colapsado).
Evitar módulos que “cargan el texto después” desde fuera; mejor que el texto esté pegado dentro del bloque.

4) Formularios
Cada campo debe tener su nombre visible (ej.: “Nombre”, “WhatsApp”, “Email”…), no solo placeholder gris.
El texto de consentimiento RGPD y los enlaces a /privacidad y /cookies deben ser texto normal en la página.

5) Imágenes e iconos
Las imágenes se usan para ilustrar, no para meter frases importantes dentro.
Los iconos no sustituyen palabras clave (ej.: escribe “WhatsApp”, no solo el icono).

6) Enlaces
Crea enlaces como enlace normal de texto (ej.: “Ver planes de chatbot”), no como imagen clicable.












DATOS ESTRUCTURADOS

Objetivo: ayudar a Google a entender cada página (breadcrumbs, negocio, servicios, blog).

Qué hacer (por página):
Home: pegar Organization + LocalBusiness (ProfessionalService) + WebSite en el HEAD.
Servicios: pegar Service + BreadcrumbList en el HEAD.
Planes: pegar ItemList (con 3 Service) + BreadcrumbList en el HEAD.
Demos: pegar Service + BreadcrumbList + ScheduleAction (Calendly) en el HEAD.
Blog (índice): pegar BreadcrumbList en el HEAD.
Cada post del blog: pegar BlogPosting en el HEAD.
Sobre mí: pegar BreadcrumbList en el HEAD.
Contacto: pegar ProfessionalService + ScheduleAction (Calendly) (+ BreadcrumbList si lo tienes) en el HEAD.
Privacidad y Cookies: pegar BreadcrumbList en el HEAD.


Nota: el JSON-LD ya está preparado en la guía por páginas; solo hay que pegar cada bloque en su página correspondiente (en el HEAD).























ENLACES INTERNOS

Objetivo: que el usuario encuentre rápido lo importante y que Google entienda la estructura del sitio.

Reglas simples (siempre)
5–10 enlaces internos por página (según la longitud).
Texto del enlace descriptivo (que diga a dónde va).
No enlaces a páginas que no existen
Evita competir: no uses el mismo texto de enlace que la keyword principal de otra página (para no canibalizar).

----------------------


Dónde ponerlos en cada página

HOME
Mitad de página (después de beneficios):
“Ver servicios de chatbot y automatización” → /servicios
“Consulta precios y planes” → /planes
Bloque de confianza / demos:
“Probar una demo de chatbot” → /demos
Cierre de la home:
“Conóceme mejor (sobre mí)” → /sobre-mi
“Contacto (presupuesto o demo)” → /contacto
“Ver blog (casos y noticias)” → /blog


SERVICIOS
Tras “Lo que incluye”:
“Mira planes y precios” → /planes
Tras “Demos”:
“Ver demos por canal” → /demos
Final de página:
“Contacto para presupuesto” → /contacto
“Saber más sobre mí” → /sobre-mi


PLANES
Bajo la tabla o lista de planes:
“Ver servicios detallados” → /servicios
Junto a FAQs de precio:
“¿Prefieres ver una demo primero?” → /demos
Final de página:
“Contacto (presupuesto en 30 s)” → /contacto


DEMOS
Debajo de cada demo (WhatsApp/IG/Voz):
“Este flujo está incluido en servicios” → /servicios
“Si te encaja, mira planes y precios” → /planes
Cierre de página:
“Pídeme presupuesto o demo” → /contacto


BLOG (índice)
Debajo de “Casos destacados”:
“Probar una demo similar” → /demos
Debajo de “Lo último”:
“Ver servicios (WhatsApp, IG, web, voz)” → /servicios
“¿Precio? Mira planes” → /planes


SOBRE MÍ
Tras “Lo que hago contigo”:
“Ver servicios” → /servicios
Tras el caso:
“Mira demos reales” → /demos
Cierre:
“Elegir plan” → /planes
“Hablar por contacto” → /contacto


CONTACTO
Bajo el formulario o junto a CTAs:
“Aún no lo tienes claro: ver demos” → /demos
“Revisar planes” → /planes
“Volver a servicios” → /servicios


LEGAL (Privacidad / Cookies)
Pie del texto:
“Volver a contacto” → /contacto

----------------------


Ejemplos de textos de enlace (útiles y variados)
“Ver planes de chatbot”
“Probar demo de WhatsApp”
“Todos los servicios de automatización”
“Hablar por contacto”
“Conocer al consultor de chatbots”














ANALÍTICA - GA4 + EVENTOS (Calendly, WhatsApp, formulario)


Objetivo: medir lo importante: citas agendadas, clics a WhatsApp y envíos de formulario.
Eventos estándar:
schedule_calendly (cita creada) 
click_whatsapp (clic al botón/enlace de WhatsApp) 
lead_form_submit (formulario enviado con éxito) 

----------------------


Paso 1) Conectar GA4 (una vez, en todas las páginas)

Instalar Google Tag Manager (GTM) en la web.
En GTM, crear una etiqueta GA4 de configuración (con tu ID de medición) y activar en todas las páginas.
Respetar la privacidad: la analítica solo se activa tras aceptar cookies (consentimiento). 

----------------------


Paso 2) Evento: clic a WhatsApp (click_whatsapp)

Qué medir: cuando alguien pulsa en cualquier enlace/botón que abre WhatsApp.

Cómo configurarlo (GTM):
Disparador: “Just Links / Enlaces” que contenga wa.me o api.whatsapp.com.
Etiqueta GA4 evento: nombre del evento click_whatsapp.
Parámetros recomendados:
cta_text = texto del botón
page_location (automático)


(Este evento ayuda a ver desde qué páginas/CTAs te escriben más.) 

----------------------


Paso 3) Evento: cita en Calendly (schedule_calendly)

Qué medir: cuando Calendly confirma la cita agendada.

Cómo configurarlo (GTM):
Disparador: Evento personalizado con el nombre calendly.event_scheduled.
Etiqueta GA4 evento: nombre del evento schedule_calendly.
Parámetros recomendados:
page_location (automático)


Nota para quien lo implementa: el widget de Calendly emite el evento calendly.event_scheduled (postMessage) al confirmar; con GTM basta el disparador de evento personalizado para capturarlo. 

----------------------


Paso 4) Evento: formulario enviado (lead_form_submit)

Qué medir: envío correcto del formulario de Contacto.

Cómo configurarlo (GTM):
Si usas un plugin de formularios: disparador de Form Submission (en “éxito”).
Si es un formulario a medida: al recibir respuesta OK, enviar a GTM:
dataLayer.push({event: 'lead_form_submit'});
Etiqueta GA4 evento: nombre del evento lead_form_submit.
Parámetros recomendados:
form_service = valor del campo “¿Qué necesitas?” (si se puede)
page_location (automático)


Recuerda: el checkbox de consentimiento es obligatorio y visible con enlaces a Privacidad/Cookies. 

----------------------


Paso 5) Guardar UTMs y origen en tu sistema/hoja

Tu formulario ya incluye campos ocultos para utm_source, utm_medium, utm_campaign, utm_content, page_url, timestamp. Asegúrate de que se rellenan y se guardan junto al lead (en tu CRM/Sheets). 
Si usas plugin con conector a Google Sheets, mapea los campos del formulario → columnas de la hoja. 

----------------------


Paso 6) Marcar conversiones en GA4

En GA4 → Admin → Events: marcar como Conversion estos eventos:
click_whatsapp, schedule_calendly, lead_form_submit. 

----------------------


Paso 7) Comprobación rápida (Debug)

Abrir DebugView en GA4 y probar:
Clic a WhatsApp → ver click_whatsapp.
Simular cita en Calendly → ver schedule_calendly.
Enviar formulario → ver lead_form_submit.












PUBLICACIÓN DE LA WEB


Objetivo: que Google encuentre el sitio y lo monitoricemos.

1. HTTPS y dominio único
Forzar https:// en todo el sitio.
Elegir con o sin www y redirigir todo a la versión elegida (301).


2. robots.txt
Crear/editar https://[URL_BASE]/robots.txt con:
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Sitemap: https://[URL_BASE]/sitemap_index.xml

3. Sitemap + Search Console
Generar sitemap (Rank Math/Yoast).
En Google Search Console: verificar el dominio y enviar https://[URL_BASE]/sitemap_index.xml.


4. Páginas sin SEO → noindex
Marcar como noindex y excluir del sitemap: página de gracias/confirmación, borradores/pruebas, y búsquedas internas (si las hubiese).


5. JSON-LD
Pegar en el HEAD de cada página el bloque que corresponde (según la sección anterior).


6. Inspección rápida en Google
En Search Console → Inspección de URL: probar /, /servicios, /planes, /demos, /blog, /sobre-mi, /contacto (deben ser indexables).


7. Móvil y velocidad (vista rápida)
Abrir Home y Contacto en móvil: primer CTA visible al cargar.
Sin pop-ups intrusivos; sin “saltos” al cargar (imágenes/iframes con altura fija; Calendly con min-height).














GUÍA DE TIPOGRAFÍA Y PALETA DE COLOR

1) Tipografía

Familias
Titulares (H1–H2): Manrope 700 (título principal/sección)
Subsecciones: Manrope 600 
Texto y UI: Inter 400/600 (párrafos, labels, botones)
Carga: usar font-display: swap (rendimiento y CLS estable)

Accesibilidad tipográfica
Tamaño mínimo interactivo: 16–17 px.
Altura táctil de botones: ≥44 px.
Mantener contraste AA (ver paleta)

2) Paleta de color

Tokens (HEX)
Primario (brand): #2563EB → botones llenos, enlaces, énfasis
Acento (accent): #25D366 → iconos, badges, microdestellos (no usar como texto largo)
Texto (carbón): #111827
Fondo (gris cálido): #F5F5F4
Card: #FFFFFF
Borde/cards: #E6E6E6
Éxito (oscuro): #1A7F4B
Error: #E11D48
Superficie oscura (secciones tech): #0B1220
Texto en superficie oscura: #F8FAFC
Foco accesible (outline): rgba(37,99,235,.45)

Variables CSS

:root{
  --brand:#2563EB; --accent:#25D366; --text:#111827; --bg:#F5F5F4;
  --card:#FFFFFF; --card-border:#E6E6E6;
  --success:#1A7F4B; --error:#E11D48;

  /* Superficie oscura */
  --surface-inverse:#0B1220; --text-inverse:#F8FAFC;

  /* Accesibilidad (focus) */
  --focus-ring: 3px solid rgba(37,99,235,.45);

  /* Enlaces en superficie oscura (AA) */
  --link-inverse:#93C5FD;

/* Estados de marca (hover/active) */
--brand-hover:#1D4ED8;  /* azul 700 aprox. */
--brand-active:#1E40AF; /* azul 800 aprox. */

}




Aplicación

Texto principal: --text sobre --bg o --card (AA).
Botón primario (llenado): fondo --brand + texto blanco (AA para texto normal).
Enlaces: color --brand; :hover oscurecer (p. ej. filter: brightness(.92) o un tono más oscuro).
Botón secundario: fondo blanco + borde --brand + texto --brand.
Éxito/error: usar --success/--error para iconos y títulos; fondos claros derivados (10–15% de opacidad) para alertas.
Acento verde: solo como ícono, borde, badge o resalte. ⚠️ No usar texto verde sobre blanco (no cumple AA), ni blanco sobre verde #25D366 en botones. Si necesitas un botón verde, usa --success #1A7F4B con texto blanco.
Secciones oscuras puntuales (hero/testimonios/demos): fondo --surface-inverse + texto --text-inverse. La firma tipográfica aquí va en blanco.

Utilidades rápidas

.text-brand{color:var(--brand);}
.bg-brand{background:var(--brand); color:#fff;}
.badge-accent{color:var(--text); border:1px solid var(--accent);}
.link{color:var(--brand); text-underline-offset:2px;}
.link:hover{ color:var(--brand-hover); }
.card{background:var(--card); border:1px solid var(--card-border);}
.surface-inverse{background:var(--surface-inverse); color:var(--text-inverse);}
:focus-visible{outline:var(--focus-ring); outline-offset:2px;}

Enlaces en superficie oscura (AA)

/* Enlaces en superficie oscura (AA) */
.surface-inverse a{
  color:var(--link-inverse);
  text-underline-offset:2px;
}
.surface-inverse a:hover{
  text-decoration:underline;
}
.surface-inverse a:focus-visible{
  outline:var(--focus-ring);
  outline-offset:2px;
}

/* (opcional) Estado visited en oscuro, manteniendo contraste */
.surface-inverse a:visited{ color:#BFDBFE; } /* tono un poco más claro */

Gradiente opcional

.bg-tech {
  background:
    radial-gradient(1200px 600px at 90% -10%, rgba(37,99,235,.15), transparent),
    radial-gradient(900px 500px at -10% 110%, rgba(37,211,102,.12), transparent),
    var(--bg);
}
Contraste (WCAG 2.1)

Texto normal ≥ 4.5:1, texto grande (≥24 px o 18 px bold) ≥ 3:1.
--text sobre --bg y blanco sobre --brand cumplen AA para texto normal.
No usar #25D366 como color de texto principal ni blanco sobre #25D366 en botones (contraste insuficiente).

----------------------


3) Ejemplos de implementación

Botones

/* Botones base */
.btn{
  display:inline-flex;align-items:center;gap:.5rem;padding:.9rem 1.2rem;min-height:44px;
  border-radius:8px;font-weight:600;line-height:1;cursor:pointer;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.btn--primary{background:var(--brand);color:#fff;}
.btn--secondary{background:#fff;border:2px solid var(--brand);color:var(--brand);}
.btn--ghost{background:transparent;color:var(--brand);}
.btn:focus-visible{outline:var(--focus-ring);outline-offset:2px;}

/* Estados de botón por token (hover/active) */
.btn--primary:hover{  background:var(--brand-hover);  color:#fff; }
.btn--primary:active{ background:var(--brand-active); color:#fff; }

/* (Opcional, si usas el bloque Botón de Gutenberg sin clases personalizadas)
.wp-block-button__link:is(:hover,:focus){ background:var(--brand-hover); color:#fff; }
.wp-block-button__link:active{ background:var(--brand-active); color:#fff; }
*/
 
Alertas
 
.alert--ok{color:#0F5132;background:rgba(26,127,75,.08);border:1px solid rgba(26,127,75,.25);padding:.8rem 1rem;border-radius:10px}
.alert--error{color:#7F1D1D;background:rgba(225,29,72,.08);border:1px solid rgba(225,29,72,.25);padding:.8rem 1rem;border-radius:10px}

Sección oscura (ejemplo) 

<section class="surface-inverse">
  <div class="card" style="background:#0F172A;color:#E2E8F0;border-color:#1E293B">
    <!-- contenido -->
  </div>
</section>

Implantación (Google Fonts)

<!-- Head -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Manrope:wght@600;700&display=swap" rel="stylesheet">

Variables y escala 

:root{
  --ff-head: "Manrope", Inter, system-ui, sans-serif;
  --ff-body: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  --fs-h1: clamp(36px, 3.5vw, 44px);
  --fs-h2: clamp(28px, 2.6vw, 32px);
  --fs-h3: 20px;
  --fs-body: 17px;
  --lh-tight: 1.15;
  --lh-body: 1.6;
  --ls-tight: -0.01em;
}
html{font-family: var(--ff-body); font-size:16px; line-height: var(--lh-body);}
h1,h2,h3{font-family: var(--ff-head); font-weight:700; line-height: var(--lh-tight); letter-spacing: var(--ls-tight);}
h1{font-size: var(--fs-h1);} h2{font-size: var(--fs-h2);} h3{font-size: var(--fs-h3);}
p,li{font-size: var(--fs-body);}


