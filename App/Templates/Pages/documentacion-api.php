<?php

/**
 * Página pública que muestra la documentación de la API para chatbots.
 * Contenido extraído y ampliado desde `dev-tools/api-chatbot.md`.
 */

function renderPaginaDocumentacion()
{
?>
    <section class="glory-doc-page" style="max-width:920px;margin:40px auto;padding:40px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.06);border-radius:8px;">
        <header style="border-bottom:1px solid #eee;padding-bottom:18px;margin-bottom:24px;">
            <h1 style="margin:0 0 6px;font-size:28px;color:#111;">API para Chatbot — Crear Reservas</h1>
            <p style="margin:0;color:#555;">Esta API permite a un chatbot externo (por ejemplo, UChat) crear reservas en el sitio. A continuación se describen endpoints, autenticación, ejemplos y notas de implementación.</p>
        </header>

        <article style="color:#111;line-height:1.6;font-size:15px;">
            <h2 style="font-size:18px;margin-top:0;color:#111;">Autenticación</h2>
            <p>Tipo: <strong>Bearer Token</strong></p>
            <p>Encabezado requerido:</p>
            <pre style="background:#f6f6f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #eaeaea;color:#111;"><code>Authorization: Bearer &lt;TOKEN&gt;</code></pre>
            <p>Configuración del token: en el panel de opciones del tema, sección <em>Integrations &amp; Tracking → API Access</em> activar <strong>Habilitar API para Chatbot</strong> y fijar <strong>API Token (Bearer)</strong>.</p>

            <h2 style="font-size:18px;margin-top:18px;color:#111;">Endpoints</h2>

            <h3 style="margin-top:12px;">1) Crear reserva</h3>
            <p><strong>Método:</strong> <code>POST</code> — <strong>Ruta:</strong> <code>/wp-json/glory/v1/reservas</code></p>
            <p><strong>Content-Type:</strong> <code>application/json</code></p>

            <h4 style="margin-top:8px;">Cuerpo (JSON)</h4>
            <pre style="background:#f6f6f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #eaeaea;color:#111;"><code>{
    "nombre_cliente": "Juan Pérez",
    "telefono_cliente": "+57 3001234567",
    "correo_cliente": "juan@example.com",
    "servicio_id": 12,
    "barbero_id": "any",
    "fecha_reserva": "2025-08-06",
    "hora_reserva": "10:30"
}</code></pre>

            <h4 style="margin-top:8px;">Notas sobre campos</h4>
            <ul>
                <li><strong>barbero_id</strong>: puede ser un ID numérico de la taxonomía <code>barbero</code> o la cadena <code>"any"</code> para asignación automática.</li>
                <li><strong>servicio_id</strong>: ID del término en la taxonomía <code>servicio</code>. La duración del servicio se lee del meta <code>duracion</code>.</li>
                <li><strong>Exclusividad</strong>: no se envía en el payload; si <code>barbero_id</code> es numérico la reserva queda exclusiva para ese barbero; si es <code>any</code> la asignación será automática (sin exclusividad).</li>
            </ul>

            <h4 style="margin-top:12px;">Respuestas</h4>
            <p><strong>201</strong> — Creada</p>
            <pre style="background:#f6f6f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #eaeaea;color:#111;"><code>{
  "success": true,
  "id": 123,
  "message": "¡Tu reserva ha sido confirmada con éxito!"
}</code></pre>

            <p><strong>400</strong> — Error de validación o negocio (por ejemplo: horario ya reservado)</p>
            <pre style="background:#fff8f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #f2dede;color:#111;"><code>{
  "success": false,
  "error": "El horario seleccionado ya no está disponible. Por favor, elige otro."
}</code></pre>

            <p><strong>401 / 403</strong> — Error de autenticación/autorización</p>
            <pre style="background:#fff8f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #f2dede;color:#111;"><code>{
  "code": "token_invalido",
  "message": "Token inválido.",
  "data": {"status": 401}
}</code></pre>

            <h3 style="margin-top:18px;">2) Consultar horas disponibles</h3>
            <p><strong>Método:</strong> <code>GET</code> — <strong>Ruta:</strong> <code>/wp-json/glory/v1/horas-disponibles</code></p>
            <p><strong>Query params:</strong> <code>fecha</code> (YYYY-MM-DD), <code>servicio_id</code> (id), <code>barbero_id</code> (id numérico o <code>any</code>), <code>exclude_id</code> (opcional, id de reserva a excluir).</p>

            <h4 style="margin-top:8px;">Cómo se calcula la disponibilidad</h4>
            <ul>
                <li>Se tiene en cuenta la <strong>duración</strong> del servicio (meta <code>duracion</code> del término <code>servicio</code>).</li>
                <li>Cada reserva bloquea el rango de tiempo correspondiente: por ejemplo, servicio 30 min reservado a las 10:00 bloquea 10:00–10:30; siguiente inicio disponible 10:30.</li>
                <li>Para duraciones no alineadas a intervalos (ej. 45 min) se bloquea el tiempo exacto (ej. 10:00–10:45), por lo que el siguiente inicio será 10:45.</li>
                <li>Por defecto se usan intervalos de 15 minutos y ventana de trabajo 09:00–21:00 (valores actualmente codificados en la función de disponibilidad).</li>
                <li>Cuando <code>barbero_id=any</code>, la API calcula la disponibilidad por barbero y devuelve la <strong>unión</strong> de slots (slot aparece si <em>al menos un</em> barbero que ofrece el servicio está libre).</li>
            </ul>

            <h4 style="margin-top:8px;">Ejemplo de respuesta</h4>
            <pre style="background:#f6f6f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #eaeaea;color:#111;"><code>{
  "success": true,
  "options": ["09:00","09:15","09:30","10:30","10:45","11:00"]
}</code></pre>

            <h3 style="margin-top:18px;">3) Servicios por barbero</h3>
            <p><strong>Método:</strong> <code>GET</code> — <strong>Ruta:</strong> <code>/wp-json/glory/v1/barberos/{barbero_id}/servicios</code></p>

            <h3 style="margin-top:18px;">4) Listar barberos</h3>
            <p><strong>Método:</strong> <code>GET</code> — <strong>Ruta:</strong> <code>/wp-json/glory/v1/barberos</code></p>
            <p>Respuesta: lista de barberos con <code>id</code>, <code>nombre</code> y <code>slug</code> para identificar el <code>barbero_id</code>.</p>

            <h2 style="font-size:18px;margin-top:18px;color:#111;">Ejemplos con curl</h2>

            <h4 style="margin-top:8px;">Crear reserva (POST)</h4>
            <pre style="background:#f6f6f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #eaeaea;color:#111;"><code>curl -X POST "https://tusitio.com/wp-json/glory/v1/reservas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_SECRETO" \
  -d '{
    "nombre_cliente": "Juan Pérez",
    "telefono_cliente": "+57 3001234567",
    "correo_cliente": "juan@example.com",
    "servicio_id": 12,
    "barbero_id": "any",
    "fecha_reserva": "2025-08-06",
    "hora_reserva": "10:30"
  }'</code></pre>

            <h4 style="margin-top:8px;">Consultar horas disponibles (GET)</h4>
            <pre style="background:#f6f6f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #eaeaea;color:#111;"><code>curl -G "https://tusitio.com/wp-json/glory/v1/horas-disponibles" \
  -H "Authorization: Bearer TU_TOKEN_SECRETO" \
  --data-urlencode "fecha=2025-08-06" \
  --data-urlencode "servicio_id=12" \
  --data-urlencode "barbero_id=any"</code></pre>

            <h4 style="margin-top:8px;">Servicios por barbero</h4>
            <pre style="background:#f6f6f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #eaeaea;color:#111;"><code>curl -X GET "https://tusitio.com/wp-json/glory/v1/barberos/5/servicios" \
  -H "Authorization: Bearer TU_TOKEN_SECRETO"</code></pre>

            <h4 style="margin-top:8px;">Listar barberos</h4>
            <pre style="background:#f6f6f8;padding:12px;border-radius:6px;overflow:auto;border:1px solid #eaeaea;color:#111;"><code>curl -X GET "https://tusitio.com/wp-json/glory/v1/barberos" \
  -H "Authorization: Bearer TU_TOKEN_SECRETO"</code></pre>

            <h2 style="font-size:18px;margin-top:18px;color:#111;">Notas</h2>
            <ul>
                <li>La API reutiliza la lógica del formulario público, incluyendo verificación de disponibilidad, asignación automática de barbero (<code>any</code>) y notificaciones.</li>
                <li>Asegúrate de que existan términos en <code>servicio</code> y <code>barbero</code>, y que los barberos tengan configurados los servicios que ofrecen.</li>
                <li>La ventana de trabajo por defecto es <strong>09:00–21:00</strong> con intervalos de <strong>15 minutos</strong> (valores actualmente codificados en la función de disponibilidad).</li>
                <li>Para conocer los IDs de los barberos utiliza <code>GET /wp-json/glory/v1/barberos</code>.</li>
                <li>Usa <code>exclude_id</code> al consultar horas disponibles para excluir una reserva existente al editarla (evita que se cuente a sí misma).</li>
            </ul>

        </article>
    </section>
    <style>
        code {
            background: #f6f6f8;
            padding: 3px;
            margin: 2px 3px;
        }

        h3 {
            margin-bottom: 15px;
        }

        h4 {
            margin-bottom: 12px;
        }
    </style>
<?php
}

?>