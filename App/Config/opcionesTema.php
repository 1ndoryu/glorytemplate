<?php

use Glory\Manager\OpcionManager;

/*
 * Cresta Campers — Opciones del Tema
 */

/* EMPRESA */

$secEmpresa = 'empresa';

OpcionManager::register('cresta_empresa_nombre', [
    'valorDefault' => 'Cresta Campers',
    'tipo'         => 'text',
    'etiqueta'     => 'Nombre de la empresa',
    'descripcion'  => 'Nombre comercial que aparecerá en el sitio.',
    'seccion'      => $secEmpresa,
    'subSeccion'   => 'datos_generales',
]);

OpcionManager::register('cresta_empresa_email', [
    'valorDefault' => '',
    'tipo'         => 'text',
    'etiqueta'     => 'Email de contacto',
    'descripcion'  => 'Email principal de la empresa.',
    'seccion'      => $secEmpresa,
    'subSeccion'   => 'datos_generales',
]);

OpcionManager::register('cresta_empresa_telefono', [
    'valorDefault' => '',
    'tipo'         => 'text',
    'etiqueta'     => 'Teléfono',
    'descripcion'  => 'Teléfono de contacto.',
    'seccion'      => $secEmpresa,
    'subSeccion'   => 'datos_generales',
]);

OpcionManager::register('cresta_empresa_direccion', [
    'valorDefault' => '',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Dirección',
    'descripcion'  => 'Dirección física de la empresa.',
    'seccion'      => $secEmpresa,
    'subSeccion'   => 'datos_generales',
]);

OpcionManager::register('cresta_empresa_cif', [
    'valorDefault' => '',
    'tipo'         => 'text',
    'etiqueta'     => 'CIF/NIF',
    'descripcion'  => 'Identificación fiscal.',
    'seccion'      => $secEmpresa,
    'subSeccion'   => 'datos_generales',
]);

/* RESERVAS — TEMPORADAS Y PRECIOS */

$secReservas = 'reservas';

OpcionManager::register('cresta_noches_minimas', [
    'valorDefault' => '2',
    'tipo'         => 'text',
    'etiqueta'     => 'Noches mínimas',
    'descripcion'  => 'Número mínimo de noches por reserva.',
    'seccion'      => $secReservas,
    'subSeccion'   => 'reglas',
]);

OpcionManager::register('cresta_dias_anticipacion', [
    'valorDefault' => '2',
    'tipo'         => 'text',
    'etiqueta'     => 'Días de antelación',
    'descripcion'  => 'Días mínimos de antelación para reservar.',
    'seccion'      => $secReservas,
    'subSeccion'   => 'reglas',
]);

OpcionManager::register('cresta_horario_recogida', [
    'valorDefault' => '16:00',
    'tipo'         => 'text',
    'etiqueta'     => 'Hora de recogida',
    'descripcion'  => 'Hora a la que el cliente recoge la furgoneta (formato HH:MM).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'reglas',
]);

OpcionManager::register('cresta_horario_devolucion', [
    'valorDefault' => '10:00',
    'tipo'         => 'text',
    'etiqueta'     => 'Hora de devolución',
    'descripcion'  => 'Hora a la que el cliente devuelve la furgoneta (formato HH:MM).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'reglas',
]);

OpcionManager::register('cresta_moneda', [
    'valorDefault' => 'EUR',
    'tipo'         => 'text',
    'etiqueta'     => 'Moneda',
    'descripcion'  => 'Código de moneda ISO (EUR, USD, etc.).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'reglas',
]);

// --- Temporada Baja (default) ---

OpcionManager::register('cresta_temporada_baja_inicio', [
    'valorDefault' => '11-01',
    'tipo'         => 'text',
    'etiqueta'     => 'Temporada baja — Inicio',
    'descripcion'  => 'Fecha de inicio de temporada baja (MM-DD).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

OpcionManager::register('cresta_temporada_baja_fin', [
    'valorDefault' => '03-31',
    'tipo'         => 'text',
    'etiqueta'     => 'Temporada baja — Fin',
    'descripcion'  => 'Fecha de fin de temporada baja (MM-DD).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

// --- Temporada Media ---

OpcionManager::register('cresta_temporada_media_inicio', [
    'valorDefault' => '04-01',
    'tipo'         => 'text',
    'etiqueta'     => 'Temporada media — Inicio',
    'descripcion'  => 'Fecha de inicio de temporada media (MM-DD).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

OpcionManager::register('cresta_temporada_media_fin', [
    'valorDefault' => '06-14',
    'tipo'         => 'text',
    'etiqueta'     => 'Temporada media — Fin',
    'descripcion'  => 'Fecha de fin de temporada media (MM-DD).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

OpcionManager::register('cresta_multiplicador_media', [
    'valorDefault' => '1.3',
    'tipo'         => 'text',
    'etiqueta'     => 'Multiplicador temporada media',
    'descripcion'  => 'Factor multiplicador sobre el precio base en temporada media (ej: 1.3 = +30%).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

// --- Temporada Alta ---

OpcionManager::register('cresta_temporada_alta_inicio', [
    'valorDefault' => '06-15',
    'tipo'         => 'text',
    'etiqueta'     => 'Temporada alta — Inicio',
    'descripcion'  => 'Fecha de inicio de temporada alta (MM-DD).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

OpcionManager::register('cresta_temporada_alta_fin', [
    'valorDefault' => '10-31',
    'tipo'         => 'text',
    'etiqueta'     => 'Temporada alta — Fin',
    'descripcion'  => 'Fecha de fin de temporada alta (MM-DD).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

OpcionManager::register('cresta_multiplicador_alta', [
    'valorDefault' => '1.6',
    'tipo'         => 'text',
    'etiqueta'     => 'Multiplicador temporada alta',
    'descripcion'  => 'Factor multiplicador sobre el precio base en temporada alta (ej: 1.6 = +60%).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

// --- Temporada Especial ---

OpcionManager::register('cresta_multiplicador_especial', [
    'valorDefault' => '2.0',
    'tipo'         => 'text',
    'etiqueta'     => 'Multiplicador temporada especial',
    'descripcion'  => 'Factor multiplicador para fechas especiales (ej: 2.0 = +100%).',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

OpcionManager::register('cresta_fechas_especiales', [
    'valorDefault' => '[]',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Fechas especiales (JSON)',
    'descripcion'  => 'Array JSON de rangos de fechas con precio especial. Formato: [{"inicio":"12-23","fin":"01-02","nombre":"Navidad"}].',
    'seccion'      => $secReservas,
    'subSeccion'   => 'temporadas',
]);

/* POLÍTICAS Y LEGAL */

$secLegal = 'legal';

OpcionManager::register('cresta_politica_cancelacion', [
    'valorDefault' => 'Cancelación gratuita hasta 14 días antes de la fecha de recogida. Entre 14 y 7 días antes: reembolso del 50%. Menos de 7 días: sin reembolso.',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Política de cancelación',
    'descripcion'  => 'Texto de la política de cancelación que se mostrará al cliente.',
    'seccion'      => $secLegal,
    'subSeccion'   => 'politicas',
]);

OpcionManager::register('cresta_condiciones_alquiler', [
    'valorDefault' => '<h2>Condiciones Generales de Alquiler</h2>
<p><em>Última actualización: marzo de 2026</em></p>

<h3>1. Identificación de las partes</h3>
<p>El presente contrato se establece entre <strong>Cresta Campers</strong> (en adelante, "la empresa") y el cliente que realiza la reserva (en adelante, "el arrendatario"). La formalización de la reserva implica la aceptación íntegra de estas condiciones.</p>

<h3>2. Requisitos del conductor</h3>
<ul>
<li>Edad mínima: 21 años para Cresta One y Cresta Duo; 25 años para Cresta Pro.</li>
<li>Carnet de conducir vigente con una antigüedad mínima de 2 años.</li>
<li>El conductor debe ser el titular de la reserva o estar expresamente autorizado.</li>
<li>Se podrá solicitar documentación adicional en el momento de la recogida.</li>
</ul>

<h3>3. Reserva y pago</h3>
<p>La reserva queda confirmada únicamente tras el abono íntegro del importe total a través de la pasarela de pago segura (Stripe). El precio incluye el uso del vehículo durante el período reservado y los kilómetros indicados en la ficha de cada modelo. No incluye combustible, peajes, tasas de aparcamiento ni seguros opcionales.</p>

<h3>4. Recogida y devolución</h3>
<p>El horario estándar de recogida es a las <strong>16:00 h</strong> y el de devolución a las <strong>10:00 h</strong>. Recogidas o devoluciones fuera de este horario deben acordarse previamente y pueden estar sujetas a cargo adicional. El cliente recibirá las instrucciones de acceso y localización del vehículo por correo electrónico tras confirmar el pago.</p>

<h3>5. Fianza</h3>
<p>En el momento de la recogida se solicitará una fianza mediante autorización de cargo en tarjeta de crédito. El importe varía según el modelo (Cresta One: 500€; Cresta Duo: 700€; Cresta Pro: 1.000€). La fianza se libera en un plazo máximo de 7 días tras la devolución, salvo que existan daños o incidencias pendientes de liquidar.</p>

<h3>6. Kilómetros y combustible</h3>
<p>Cada reserva incluye un número diario de kilómetros indicado en la ficha del vehículo. Los kilómetros adicionales se facturan a 0,25€/km. El vehículo debe devolverse con el mismo nivel de combustible con el que fue entregado; en caso contrario, se repercutirá el coste de repostaje más una tarifa de gestión de 20€.</p>

<h3>7. Estado del vehículo y responsabilidades</h3>
<p>El arrendatario se compromete a usar el vehículo de forma diligente y conforme a la normativa vigente. Cualquier daño causado durante la reserva será responsabilidad del arrendatario hasta el importe de la fianza. Daños superiores podrán reclamarse por vías adicionales. Queda expresamente prohibido: conducir bajo los efectos del alcohol u otras sustancias, circular por carreteras no aptas para el vehículo, y subarrendar el vehículo a terceros.</p>

<h3>8. Política de cancelación</h3>
<p>La cancelación gratuita está disponible hasta <strong>14 días antes</strong> de la fecha de recogida. Entre 14 y 7 días: reembolso del 50% del importe pagado. Con menos de 7 días de antelación: sin reembolso. Las cancelaciones deben comunicarse por escrito a través del formulario de contacto o al correo de la empresa.</p>

<h3>9. Incidencias y asistencia en carretera</h3>
<p>En caso de avería, accidente u otra incidencia, el arrendatario deberá contactar inmediatamente con Cresta Campers en el número de asistencia 24h facilitado al recoger el vehículo. Está prohibido realizar reparaciones por cuenta propia sin autorización previa de la empresa.</p>

<h3>10. Jurisdicción</h3>
<p>Para la resolución de cualquier controversia derivada de este contrato, las partes se someten expresamente a los Juzgados y Tribunales del domicilio social de Cresta Campers, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.</p>',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Condiciones generales de alquiler',
    'descripcion'  => 'Texto completo HTML de las condiciones de alquiler.',
    'seccion'      => $secLegal,
    'subSeccion'   => 'politicas',
]);

OpcionManager::register('cresta_privacidad', [
    'valorDefault' => '<h2>Política de Privacidad</h2>
<p><em>Última actualización: marzo de 2026</em></p>

<h3>1. Responsable del tratamiento</h3>
<p><strong>Cresta Campers</strong><br>
Email de contacto: hola@crestacampers.com<br>
En cumplimiento del Reglamento General de Protección de Datos (RGPD) UE 2016/679 y la Ley Orgánica 3/2018 de Protección de Datos Personales y Garantía de Derechos Digitales (LOPDGDD), le informamos del tratamiento de sus datos personales.</p>

<h3>2. Datos que recabamos</h3>
<ul>
<li><strong>Al realizar una reserva:</strong> nombre completo, correo electrónico, teléfono, fechas de alquiler y datos de pago (gestionados directamente por Stripe; Cresta Campers no almacena datos de tarjeta).</li>
<li><strong>Al usar el formulario de contacto:</strong> nombre, correo electrónico, teléfono y contenido del mensaje.</li>
<li><strong>Navegación:</strong> dirección IP, tipo de navegador y datos de uso (mediante cookies propias de analytics, ver Política de Cookies).</li>
</ul>

<h3>3. Finalidad y base legal</h3>
<table>
<thead><tr><th>Finalidad</th><th>Base legal</th></tr></thead>
<tbody>
<tr><td>Gestión de reservas y contratos de alquiler</td><td>Ejecución del contrato (Art. 6.1.b RGPD)</td></tr>
<tr><td>Comunicaciones sobre su reserva</td><td>Ejecución del contrato (Art. 6.1.b RGPD)</td></tr>
<tr><td>Atención a consultas y formulario de contacto</td><td>Interés legítimo (Art. 6.1.f RGPD)</td></tr>
<tr><td>Cumplimiento de obligaciones legales y fiscales</td><td>Obligación legal (Art. 6.1.c RGPD)</td></tr>
<tr><td>Envío de comunicaciones comerciales (si ha dado su consentimiento)</td><td>Consentimiento (Art. 6.1.a RGPD)</td></tr>
</tbody>
</table>

<h3>4. Conservación de datos</h3>
<p>Los datos de reservas se conservarán durante el tiempo necesario para el cumplimiento de obligaciones legales y fiscales (mínimo 5 años). Los datos de formulario de contacto se conservarán hasta un máximo de 2 años desde la última comunicación.</p>

<h3>5. Destinatarios</h3>
<p>Sus datos no se cederán a terceros salvo obligación legal o contratos de encargo de tratamiento con proveedores de servicios (Stripe para pagos, proveedor de hosting). Dichos proveedores actúan bajo instrucciones de Cresta Campers y no pueden usar los datos para fines propios.</p>

<h3>6. Sus derechos</h3>
<p>Puede ejercer gratuitamente los derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición enviando un correo a <a href="mailto:hola@crestacampers.com">hola@crestacampers.com</a> con asunto "Protección de datos" adjuntando copia de su DNI. Si considera que el tratamiento no se ajusta a la normativa, puede presentar reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener">Agencia Española de Protección de Datos (AEPD)</a>.</p>

<h3>7. Seguridad</h3>
<p>Cresta Campers aplica medidas técnicas y organizativas adecuadas para proteger sus datos contra accesos no autorizados, pérdida o destrucción, de conformidad con el artículo 32 del RGPD.</p>',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Política de privacidad',
    'descripcion'  => 'Texto completo HTML de la política de privacidad.',
    'seccion'      => $secLegal,
    'subSeccion'   => 'politicas',
]);

OpcionManager::register('cresta_aviso_legal', [
    'valorDefault' => '<h2>Aviso Legal</h2>
<p><em>Última actualización: marzo de 2026</em></p>

<h3>1. Datos identificativos del titular</h3>
<p>En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se informa que el presente sitio web es titularidad de:</p>
<ul>
<li><strong>Denominación social:</strong> Cresta Campers</li>
<li><strong>Domicilio social:</strong> Madrid, España</li>
<li><strong>Email:</strong> hola@crestacampers.com</li>
<li><strong>Sitio web:</strong> crestacampers.com</li>
</ul>

<h3>2. Objeto y ámbito de aplicación</h3>
<p>El presente Aviso Legal regula el uso del sitio web <strong>crestacampers.com</strong>. El acceso y la navegación por el sitio web implican la aceptación expresa y plena de los términos aquí expuestos.</p>

<h3>3. Propiedad intelectual e industrial</h3>
<p>Todos los contenidos del sitio web (textos, fotografías, gráficos, imágenes, logotipos, marcas, diseño gráfico, código fuente, etc.) son propiedad de Cresta Campers o de terceros que han autorizado su uso, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda expresamente prohibida la reproducción, distribución, comunicación pública o transformación de dichos contenidos sin la autorización previa y por escrito de Cresta Campers.</p>

<h3>4. Responsabilidad</h3>
<p>Cresta Campers no se hace responsable de los daños y perjuicios que pudieran derivarse del uso indebido del sitio web, de errores tipográficos en los contenidos, ni de la disponibilidad técnica del servicio. El usuario acepta que la navegación y uso del sitio web se realiza bajo su propia responsabilidad.</p>

<h3>5. Enlace a sitios externos</h3>
<p>El sitio web puede contener enlaces a páginas de terceros. Cresta Campers no se hace responsable del contenido de dichas páginas ni de las políticas de privacidad que les sean aplicables.</p>

<h3>6. Legislación aplicable</h3>
<p>Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales competentes conforme a derecho.</p>',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Aviso legal',
    'descripcion'  => 'Texto completo HTML del aviso legal.',
    'seccion'      => $secLegal,
    'subSeccion'   => 'politicas',
]);

OpcionManager::register('cresta_cookies', [
    'valorDefault' => '<h2>Política de Cookies</h2>
<p><em>Última actualización: marzo de 2026</em></p>

<h3>¿Qué son las cookies?</h3>
<p>Las cookies son pequeños archivos de texto que los sitios web instalan en el navegador del usuario para recordar preferencias, analizar el uso del sitio y mejorar la experiencia de navegación.</p>

<h3>Cookies que utilizamos</h3>
<table>
<thead>
<tr><th>Cookie</th><th>Tipo</th><th>Finalidad</th><th>Duración</th></tr>
</thead>
<tbody>
<tr><td>cresta_session</td><td>Técnica (propia)</td><td>Gestión de la sesión del usuario y del proceso de reserva.</td><td>Sesión</td></tr>
<tr><td>wordpress_logged_in_*</td><td>Técnica (propia)</td><td>Autenticación en el panel de administración de WordPress. Sólo se instala si accede al área de administración.</td><td>14 días</td></tr>
<tr><td>wp-settings-*</td><td>Técnica (propia)</td><td>Preferencias del panel de administración.</td><td>1 año</td></tr>
<tr><td>_stripe_sid / _stripe_mid</td><td>Técnica (tercero: Stripe)</td><td>Necesarias para el procesamiento seguro del pago. Solo se activan durante el flujo de pago.</td><td>Sesión / 1 año</td></tr>
</tbody>
</table>

<p>Este sitio <strong>no utiliza cookies de rastreo publicitario</strong> ni instala cookies de analytics de terceros sin su consentimiento previo.</p>

<h3>¿Cómo gestionar las cookies?</h3>
<p>Puede configurar su navegador para bloquear o eliminar cookies. Tenga en cuenta que deshabilitar las cookies técnicas puede afectar al correcto funcionamiento del proceso de reserva. A continuación encontrará instrucciones para los navegadores más comunes:</p>
<ul>
<li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a></li>
<li><a href="https://support.mozilla.org/es/kb/eliminar-cookies-para-eliminar-la-informacion-que-lo" target="_blank" rel="noopener">Mozilla Firefox</a></li>
<li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a></li>
<li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener">Microsoft Edge</a></li>
</ul>

<h3>Más información</h3>
<p>Para cualquier consulta sobre el uso de cookies en este sitio, puede contactarnos en <a href="mailto:hola@crestacampers.com">hola@crestacampers.com</a>.</p>',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Política de cookies',
    'descripcion'  => 'Texto completo HTML de la política de cookies.',
    'seccion'      => $secLegal,
    'subSeccion'   => 'politicas',
]);

/* INTEGRACIONES Y TRACKING */

$secIntegraciones = 'integrations';

OpcionManager::register('glory_gsc_verification_code', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Google Search Console Verification Code',
    'descripcion'     => 'Código de verificación de GSC.',
    'seccion'         => $secIntegraciones,
    'subSeccion'      => 'tracking_codes',
]);

OpcionManager::register('glory_ga4_measurement_id', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Google Analytics 4 Measurement ID',
    'descripcion'     => 'ID de medición de GA4 (G-XXXXXXXXXX).',
    'seccion'         => $secIntegraciones,
    'subSeccion'      => 'tracking_codes',
]);

OpcionManager::register('glory_custom_header_scripts', [
    'valorDefault'    => '',
    'tipo'            => 'textarea',
    'etiqueta'        => 'Scripts personalizados en <head>',
    'descripcion'     => 'Scripts o meta tags adicionales para el head del sitio.',
    'seccion'         => $secIntegraciones,
    'subSeccion'      => 'manual_scripts',
]);