# PENDIENTES DEL CLIENTE - Web Guillermo Garcia

> Fecha de creacion: 2025-12-17
> Ultima actualizacion: 2025-12-17
> Estado: **ESPERANDO ACCION DEL CLIENTE**

---

## RESUMEN

Este documento contiene todas las tareas que requieren accion directa del cliente (Guillermo). El equipo de desarrollo ha preparado todos los paneles y funcionalidades necesarias; solo falta que el cliente configure sus datos.

---

## INDICE

1. [Configuracion de Contacto](#configuracion-de-contacto)
2. [Definicion de Contenido](#definicion-de-contenido)
3. [Configuracion de Analytics](#configuracion-de-analytics)
4. [Publicacion y Lanzamiento](#publicacion-y-lanzamiento)
5. [Decisiones Pendientes](#decisiones-pendientes)

---

## CONFIGURACION DE CONTACTO

> **Panel:** `/configuracion` o WP Admin > Theme Options

| Accion                        | Descripcion                                                                     | Ubicacion en Panel           | Estado Panel |
| ----------------------------- | ------------------------------------------------------------------------------- | ---------------------------- | ------------ |
| **Crear cuenta Calendly**     | Registrarse en [calendly.com](https://calendly.com) y configurar disponibilidad | Externa                      | N/A          |
| **Configurar URL Calendly**   | Pegar la URL de Calendly en el panel                                            | `/configuracion` → Contacto  | Listo        |
| **Verificar WhatsApp**        | Confirmar que el numero esta correcto (actualmente: 584120825234)               | `/configuracion` → Contacto  | Listo        |
| **Configurar email contacto** | Definir email donde llegaran los mensajes del formulario                        | `/configuracion` → Identidad | Listo        |

---

## DEFINICION DE CONTENIDO

> **Panel:** `/configuracion` o WP Admin > Theme Options

| Accion                     | Descripcion                                                  | Ubicacion en Panel          | Estado Panel |
| -------------------------- | ------------------------------------------------------------ | --------------------------- | ------------ |
| **Subir fotos "Sobre Mi"** | Subir imagen de perfil e imagen secundaria (trabajando)      | `/configuracion` → Imagenes | Listo        |
| **Definir precios planes** | Decidir precios para cada plan (solicito 2 dias para pensar) | Comunicar al desarrollador  | Pendiente    |

---

## CONFIGURACION DE ANALYTICS

> El cliente debe crear las cuentas y luego copiar los IDs al panel.

### Paso a Paso

| Paso | Tarea          | Descripcion                             | Donde Hacerlo                    |
| ---- | -------------- | --------------------------------------- | -------------------------------- |
| 1    | Contenedor GTM | Crear en tagmanager.google.com          | Google Tag Manager               |
| 2    | Propiedad GA4  | Crear en analytics.google.com           | Google Analytics                 |
| 3    | Etiquetas GTM  | Crear etiquetas para eventos            | Google Tag Manager               |
| 4    | Conversiones   | Marcar eventos como conversiones en GA4 | Google Analytics                 |
| 5    | GSC            | Verificar dominio y enviar sitemap      | Google Search Console            |
| 6    | Theme Options  | Copiar GTM ID, GA4 ID, GSC code         | `/configuracion` → Integraciones |

### Opciones Disponibles en el Panel

| Seccion         | Opciones Disponibles                    |
| --------------- | --------------------------------------- |
| Site Identity   | Nombre, tagline, telefono, email        |
| Contact URLs    | Calendly, WhatsApp (numero + mensaje)   |
| Social Profiles | LinkedIn, Twitter/X, YouTube, Instagram |
| Site Images     | Hero, secundaria, logo                  |
| Integrations    | GTM ID, GA4 ID, GSC verification        |

---

## PUBLICACION Y LANZAMIENTO

> Tareas para cuando el cliente decida lanzar el sitio en produccion.

### Configuracion de Dominio

- [ ] Elegir dominio final
- [ ] Forzar HTTPS en todo el sitio
- [ ] Elegir con/sin www y redirigir 301

### Google Search Console

- [ ] Verificar dominio
- [ ] Enviar sitemap
- [ ] Marcar noindex: pagina gracias, borradores, busquedas internas

### Inspeccion Final (con el desarrollador)

- [ ] Inspeccionar URLs principales en Search Console
- [ ] Probar Home y Contacto en movil
- [ ] Verificar sin pop-ups intrusivos
- [ ] Verificar sin saltos de layout

---

## DECISIONES PENDIENTES

> Decisiones que el cliente debe tomar para continuar.

| Tema                   | Opciones                    | Recomendacion del Desarrollador            |
| ---------------------- | --------------------------- | ------------------------------------------ |
| **Precios de planes**  | Precios fijos vs "Desde X€" | Usar "Desde X€" para mantener flexibilidad |
| **Fondo de la pagina** | Blanco actual vs Azul suave | Proximo: selector de temas en panel        |

---

## ESTADO DE LOS PANELES DE CONFIGURACION

> **IMPORTANTE:** Todos los paneles estan listos y funcionando. El cliente solo necesita ingresar su informacion.

| Panel                    | URL                      | Estado      |
| ------------------------ | ------------------------ | ----------- |
| Configuracion General    | `/configuracion`         | Funcionando |
| Theme Options (WP Admin) | WP Admin > Theme Options | Funcionando |
| Panel IA                 | `/panel-ia`              | Funcionando |

---

## CONTACTO PARA DUDAS

Si el cliente tiene dudas sobre como configurar alguna opcion, puede consultar:

- **Articulo explicativo:** `.agent/articulo-respuesta-cliente.md`
- **Desarrollador:** Contactar directamente

---

*Documento generado: 2025-12-17*
