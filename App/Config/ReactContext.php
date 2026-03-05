<?php

namespace App\Config;

use Glory\Manager\OpcionManager;

/**
 * Inyecta opciones de Cresta Campers en el contexto React.
 * Accesibles via useGloryOptions() → options.empresa, options.legal, etc.
 */
class ReactContext
{
    public static function register(): void
    {
        add_filter('glory_react_context', [self::class, 'addOptions']);
    }

    public static function addOptions(array $context): array
    {
        $context['options'] = [
            // Datos de empresa
            'empresa' => [
                'nombre'    => OpcionManager::get('cresta_empresa_nombre', 'Cresta Campers'),
                'email'     => OpcionManager::get('cresta_empresa_email', 'info@crestacampers.com'),
                'telefono'  => OpcionManager::get('cresta_empresa_telefono', '+34 912 345 678'),
                'direccion' => OpcionManager::get('cresta_empresa_direccion', 'Calle de la Aventura 42, 28001 Madrid, España'),
                'instagram' => OpcionManager::get('cresta_instagram', ''),
                'facebook'  => OpcionManager::get('cresta_facebook', ''),
                'horario'   => OpcionManager::get('cresta_horario', ''),
            ],

            // Textos legales (HTML)
            'legal' => [
                'condiciones'  => OpcionManager::get('cresta_condiciones_alquiler', ''),
                'privacidad'   => OpcionManager::get('cresta_privacidad', ''),
                'aviso-legal'  => OpcionManager::get('cresta_aviso_legal', ''),
                'cookies'      => OpcionManager::get('cresta_cookies', ''),
                'cancelacion'  => OpcionManager::get('cresta_politica_cancelacion', ''),
            ],

            // Reservas config (público)
            'reservas' => [
                'minNoches'         => (int) OpcionManager::get('cresta_min_noches', 2),
                'maxNoches'         => (int) OpcionManager::get('cresta_max_noches', 30),
                'diasAnticipacion'  => (int) OpcionManager::get('cresta_dias_anticipacion', 1),
                'horarioRecogida'   => OpcionManager::get('cresta_horario_recogida', '16:00'),
                'horarioDevolucion' => OpcionManager::get('cresta_horario_devolucion', '10:00'),
            ],
        ];

        return $context;
    }
}
