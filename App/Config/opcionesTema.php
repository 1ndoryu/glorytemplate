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
    'valorDefault' => '',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Condiciones generales de alquiler',
    'descripcion'  => 'Texto completo HTML de las condiciones de alquiler.',
    'seccion'      => $secLegal,
    'subSeccion'   => 'politicas',
]);

OpcionManager::register('cresta_privacidad', [
    'valorDefault' => '',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Política de privacidad',
    'descripcion'  => 'Texto completo HTML de la política de privacidad.',
    'seccion'      => $secLegal,
    'subSeccion'   => 'politicas',
]);

OpcionManager::register('cresta_aviso_legal', [
    'valorDefault' => '',
    'tipo'         => 'textarea',
    'etiqueta'     => 'Aviso legal',
    'descripcion'  => 'Texto completo HTML del aviso legal.',
    'seccion'      => $secLegal,
    'subSeccion'   => 'politicas',
]);

OpcionManager::register('cresta_cookies', [
    'valorDefault' => '',
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