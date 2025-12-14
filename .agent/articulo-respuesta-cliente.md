# Artículo para WordPress - Respuestas a Dudas del Cliente

---

## Información para copiar en WordPress

**Título sugerido:** Guía Completa: Todo lo que Necesitas Saber sobre tu Página Web

**Categoría:** Documentación / FAQ

---

## Contenido del Artículo (en HTML para WordPress)

```html
<h2>Bienvenido a tu nueva página web</h2>

<p>Este artículo responde a las preguntas más frecuentes sobre cómo funciona tu sitio web y qué puedes modificar tú mismo desde el panel de administración.</p>

<hr>

<h2>1. ¿Cómo funciona el formulario de contacto?</h2>

<p>El formulario de contacto que ves en la sección "Si prefieres escribirme ahora" está diseñado para capturar los datos de tus visitantes y enviártelos directamente a tu correo electrónico.</p>

<h3>¿Cómo funciona el proceso?</h3>
<ol>
    <li>Un visitante rellena el formulario con su nombre, email, teléfono (opcional), empresa (opcional), el servicio que le interesa y su mensaje.</li>
    <li>El visitante debe aceptar la Política de Privacidad (obligatorio por RGPD).</li>
    <li>Al pulsar "Enviar mensaje", los datos se procesan y se envían a tu correo electrónico configurado.</li>
    <li>Recibirás una notificación en el email que tengas configurado en el panel de administración.</li>
</ol>

<h3>¿Dónde configuro el email de destino?</h3>
<p>Accede al panel de configuración y busca la opción <strong>"Email de Contacto"</strong> en la pestaña <strong>Identidad</strong>. Ahí defines a qué dirección de correo llegarán los mensajes del formulario.</p>

<blockquote>
<strong>Campos que captura el formulario:</strong> Nombre, Email, Teléfono/WhatsApp, Empresa, Servicio de interés, Mensaje, Canal preferido de contacto, y parámetros de seguimiento (para analytics).
</blockquote>

<hr>

<h2>2. Integración con Calendly (Agendar citas)</h2>

<p>El botón "Agenda conmigo" o "Hablame ahora" lleva a tus visitantes directamente a tu calendario de Calendly para que puedan reservar una cita contigo.</p>

<h3>¿Qué necesitas hacer?</h3>
<ol>
    <li><strong>Crear tu cuenta en Calendly:</strong> Ve a <a href="https://calendly.com" target="_blank">calendly.com</a> y regístrate (hay un plan gratuito).</li>
    <li><strong>Configurar tu disponibilidad:</strong> Define tus horarios disponibles para reuniones.</li>
    <li><strong>Copiar tu URL de Calendly:</strong> Será algo como <code>https://calendly.com/tu-nombre</code>.</li>
    <li><strong>Pegar la URL en el panel de configuración:</strong> Accede al panel y en la pestaña <strong>Contacto</strong> pega tu URL de Calendly en el campo correspondiente.</li>
</ol>

<h3>¿Dónde configuro esto?</h3>
<p>En el panel de configuración, pestaña <strong>Contacto</strong>, campo <strong>"URL de Calendly"</strong>.</p>

<blockquote>
<strong>Nota:</strong> Una vez configures la URL, todos los botones de "Agendar" del sitio se actualizarán automáticamente.
</blockquote>

<hr>

<h2>3. Integración con WhatsApp</h2>

<p>El botón de WhatsApp permite que tus visitantes te contacten directamente por WhatsApp con un solo clic.</p>

<h3>¿Cómo funciona?</h3>
<p>Al hacer clic en el botón de WhatsApp, se abre la aplicación de WhatsApp (web o móvil) con tu número ya preconfigurado y un mensaje predefinido (opcional).</p>

<h3>¿Dónde configuro esto?</h3>
<p>En el panel de configuración, pestaña <strong>Contacto</strong>:</p>
<ul>
    <li><strong>Número de WhatsApp:</strong> Tu número sin espacios ni símbolos, incluyendo código de país. Ejemplo: <code>34612345678</code></li>
    <li><strong>Mensaje predefinido (opcional):</strong> El texto que aparecerá escrito cuando el usuario abra WhatsApp. Ejemplo: "Hola, me gustaría obtener más información sobre..."</li>
</ul>

<blockquote>
<strong>Importante:</strong> El número debe incluir el código de país (34 para España) sin el símbolo +.
</blockquote>

<hr>

<h2>4. ¿Cómo añado noticias al blog?</h2>

<p>El blog funciona con el sistema nativo de WordPress, lo que significa que añadir artículos es muy sencillo.</p>

<h3>Pasos para añadir una noticia:</h3>
<ol>
    <li>Accede al panel de administración de WordPress (<code>tusitio.com/wp-admin</code>).</li>
    <li>Ve a <strong>Entradas → Añadir nueva</strong>.</li>
    <li>Escribe el título y el contenido de tu artículo.</li>
    <li>Añade una imagen destacada (aparecerá como miniatura en el listado).</li>
    <li>Asigna categorías y etiquetas si lo deseas.</li>
    <li>Pulsa <strong>Publicar</strong>.</li>
</ol>

<p>El nuevo artículo aparecerá automáticamente en la sección de Blog de tu página web.</p>

<blockquote>
<strong>Consejo:</strong> La imagen destacada debe tener buena calidad (recomendado 1200x630px) ya que también se usa cuando compartes el artículo en redes sociales.
</blockquote>

<hr>

<h2>5. ¿Cómo cambio las fotos de la sección "Sobre mí"?</h2>

<p>Las fotos que aparecen en las secciones principales (Hero, Sobre mí, etc.) se gestionan desde el panel de configuración.</p>

<h3>¿Dónde configuro esto?</h3>
<p>En el panel de configuración, pestaña <strong>Imágenes</strong>:</p>
<ul>
    <li><strong>Imagen Principal (Hero):</strong> La foto de perfil que aparece en la sección de inicio y "Sobre mí".</li>
    <li><strong>Imagen Secundaria:</strong> Una foto adicional para la sección "Sobre mí" (por ejemplo, una foto trabajando).</li>
</ul>

<h3>¿Cómo subo una imagen?</h3>
<ol>
    <li>Haz clic en el área de la imagen o arrastra y suelta tu archivo.</li>
    <li>La imagen se subirá automáticamente.</li>
    <li>Guarda los cambios pulsando el botón de guardar.</li>
</ol>

<blockquote>
<strong>Recomendación de tamaño:</strong> Las imágenes de perfil funcionan mejor en proporción 4:5 (por ejemplo, 800x1000px).
</blockquote>

<hr>

<h2>6. Panel de configuración: ¿Qué puedo modificar?</h2>

<p>Tu página web cuenta con un panel de configuración accesible desde <code>/configuracion</code> (solo para administradores).</p>

<h3>Opciones disponibles actualmente:</h3>

<table>
    <thead>
        <tr>
            <th>Pestaña</th>
            <th>Qué puedes modificar</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Identidad</strong></td>
            <td>Nombre del sitio, Tagline/eslogan, Teléfono de contacto, Email de contacto</td>
        </tr>
        <tr>
            <td><strong>Contacto</strong></td>
            <td>URL de Calendly, Número de WhatsApp, Mensaje predefinido de WhatsApp</td>
        </tr>
        <tr>
            <td><strong>Redes Sociales</strong></td>
            <td>LinkedIn, Twitter/X, YouTube, Instagram</td>
        </tr>
        <tr>
            <td><strong>Imágenes</strong></td>
            <td>Imagen principal (Hero), Imagen secundaria (Sobre mí)</td>
        </tr>
        <tr>
            <td><strong>Logo</strong></td>
            <td>Elegir entre logo de texto o imagen, Subir imagen de logo</td>
        </tr>
        <tr>
            <td><strong>Integraciones</strong></td>
            <td>Google Tag Manager ID, Google Analytics 4 ID, Google Search Console</td>
        </tr>
    </tbody>
</table>

<h3>¿Cómo accedo al panel?</h3>
<ol>
    <li>Inicia sesión como administrador en tu WordPress.</li>
    <li>Ve a la URL: <code>tusitio.com/configuracion</code></li>
    <li>Realiza los cambios que necesites.</li>
    <li>Pulsa <strong>Guardar cambios</strong>.</li>
</ol>

<blockquote>
<strong>Nota sobre modificaciones avanzadas:</strong> El panel actual permite modificar las opciones listadas arriba de forma sencilla. Si en el futuro necesitas modificar la estructura completa de la página (mover secciones, cambiar textos fijos, etc.), existen opciones adicionales que requieren desarrollo:
<ul>
    <li><strong>Panel extendido:</strong> Añadir más opciones editables manteniendo la estructura fija.</li>
    <li><strong>Editor completo:</strong> Posibilidad de mover secciones y modificar estructuras (requiere desarrollo adicional).</li>
</ul>
</blockquote>

<hr>

<h2>7. Sobre el diseño y los estilos</h2>

<p>Respecto a tu pregunta sobre si el fondo blanco hace que la página luzca "sosa":</p>

<p>El diseño actual utiliza un fondo claro que transmite profesionalidad, limpieza y modernidad. Sin embargo, los estilos y colores son completamente modificables.</p>

<h3>Opciones de personalización de estilos:</h3>
<ul>
    <li><strong>Botón flotante de temas:</strong> Actualmente hay un botón temporal que permite alternar entre diferentes temas visuales.</li>
    <li><strong>Próximamente:</strong> Se habilitará la posibilidad de elegir entre varios temas predefinidos (por ejemplo, un tema con tonos azules suaves) y modificar los colores principales directamente desde el panel.</li>
</ul>

<blockquote>
<strong>Mi recomendación:</strong> El fondo blanco/claro es una elección segura que funciona bien para negocios de servicios profesionales. Un azul muy suave podría funcionar bien como alternativa, manteniendo el aspecto profesional pero añadiendo un toque de calidez. Cuando los temas adicionales estén disponibles, podrás probar ambas opciones y decidir cuál te gusta más.
</blockquote>

<hr>

<h2>8. Precios de los planes</h2>

<p>Sobre la contradicción que mencionas entre "precio según complejidad" y precios fijos por plan:</p>

<p>Ambos enfoques son válidos y pueden coexistir:</p>
<ul>
    <li><strong>Precios base por plan:</strong> Mostrar un precio de partida para cada plan da claridad al visitante.</li>
    <li><strong>"Desde X€" o "A partir de X€":</strong> Indica que el precio puede variar según las necesidades específicas.</li>
    <li><strong>Precio final personalizado:</strong> Se define en la llamada/reunión según los requerimientos concretos.</li>
</ul>

<p>Tómate el tiempo que necesites para definir los precios. Cuando los tengas, se actualizan fácilmente en la página.</p>

<hr>

<h2>Resumen de acciones para ti</h2>

<table>
    <thead>
        <tr>
            <th>Acción</th>
            <th>¿Quién lo hace?</th>
            <th>Estado</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Configurar email para formulario</td>
            <td>Tú (desde el panel)</td>
            <td>Panel listo</td>
        </tr>
        <tr>
            <td>Crear cuenta Calendly</td>
            <td>Tú</td>
            <td>Pendiente</td>
        </tr>
        <tr>
            <td>Configurar URL de Calendly</td>
            <td>Tú (desde el panel)</td>
            <td>Panel listo</td>
        </tr>
        <tr>
            <td>Configurar WhatsApp</td>
            <td>Tú (desde el panel)</td>
            <td>Panel listo</td>
        </tr>
        <tr>
            <td>Añadir noticias al blog</td>
            <td>Tú (desde WordPress)</td>
            <td>Listo</td>
        </tr>
        <tr>
            <td>Subir fotos "Sobre mí"</td>
            <td>Tú (desde el panel)</td>
            <td>Panel listo</td>
        </tr>
        <tr>
            <td>Definir precios de planes</td>
            <td>Tú (decides) → Desarrollador (implementa)</td>
            <td>Pendiente</td>
        </tr>
        <tr>
            <td>Cambios de colores/estilos</td>
            <td>Desarrollador</td>
            <td>Próximamente</td>
        </tr>
    </tbody>
</table>

<hr>

<p><em>Si tienes cualquier otra duda, no dudes en contactarme. ¡Estoy aquí para ayudarte!</em></p>
```

---

## Notas para el desarrollador

### Estado actual del formulario de contacto

✅ **IMPLEMENTADO**: El formulario de contacto está completamente funcional.

**Archivos creados/modificados:**
- `App/Services/ContactFormRestApi.php` - Endpoint REST API para procesar el formulario
- `App/React/components/sections/ContactForm.tsx` - Frontend actualizado para usar el endpoint
- `App/Config/control.php` - Registro del nuevo endpoint

**Funcionamiento:**
1. El usuario completa el formulario y pulsa "Enviar mensaje"
2. El frontend envía una petición POST a `/wp-json/glory/v1/contact`
3. El backend valida los datos y envía un email usando `wp_mail()`
4. El email llega al correo configurado en `glory_site_email` (o al admin_email como fallback)
5. El email incluye todos los datos del formulario + información de tracking (UTM)

**Características del email:**
- Diseño HTML profesional con gradiente azul
- Botón "Responder" que abre el cliente de email con Reply-To configurado
- Incluye información de tracking: UTM source, medium, campaign, página de origen
- Timestamp legible en español

### Opciones configurables verificadas

El panel de configuración (`/configuracion`) ya tiene implementadas las siguientes opciones:

| Opción            | Key                           | Tab           |
| ----------------- | ----------------------------- | ------------- |
| Nombre del sitio  | `glory_site_name`             | Identidad     |
| Tagline           | `glory_site_tagline`          | Identidad     |
| Teléfono          | `glory_site_phone`            | Identidad     |
| Email             | `glory_site_email`            | Identidad     |
| URL Calendly      | `glory_url_calendly`          | Contacto      |
| Número WhatsApp   | `glory_url_whatsapp`          | Contacto      |
| Mensaje WhatsApp  | `glory_whatsapp_message`      | Contacto      |
| LinkedIn          | `glory_social_linkedin`       | Redes         |
| Twitter           | `glory_social_twitter`        | Redes         |
| YouTube           | `glory_social_youtube`        | Redes         |
| Instagram         | `glory_social_instagram`      | Redes         |
| Imagen Hero       | `glory_image_hero`            | Imágenes      |
| Imagen Secundaria | `glory_image_secondary`       | Imágenes      |
| Logo (modo)       | `glory_logo_mode`             | Logo          |
| Logo (texto)      | `glory_logo_text`             | Logo          |
| Logo (imagen)     | `glory_logo_image`            | Logo          |
| GTM ID            | `glory_gtm_id`                | Integraciones |
| GA4 ID            | `glory_ga4_measurement_id`    | Integraciones |
| GSC Code          | `glory_gsc_verification_code` | Integraciones |

