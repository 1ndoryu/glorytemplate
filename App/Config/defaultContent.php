<?php

use Glory\Manager\DefaultContentManager;

// Definición de Reservas de Ejemplo
DefaultContentManager::define('reserva', [
    [
        'slugDefault' => 'reserva-ejemplo-1',
        'titulo'      => 'Carlos Sánchez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-06',
            'hora_reserva'     => '10:00',
            'telefono_cliente' => '611223344',
            'correo_cliente'   => 'carlos.sanchez@email.com',
            'servicio'         => 'Corte de pelo',
            'barbero'          => 'Elkin',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-2',
        'titulo'      => 'Laura Gómez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-06',
            'hora_reserva'     => '11:30',
            'telefono_cliente' => '622334455',
            'correo_cliente'   => 'laura.gomez@email.com',
            'servicio'         => 'Corte y arreglo de barba',
            'barbero'          => 'Juan',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-3',
        'titulo'      => 'Miguel Fernández',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-07',
            'hora_reserva'     => '16:00',
            'telefono_cliente' => '633445566',
            'correo_cliente'   => 'miguel.fernandez@email.com',
            'servicio'         => 'Afeitado de cabeza',
            'barbero'          => 'Pedro',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-5',
        'titulo'      => 'Carlos Sánchez', // Repeated client
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-10',
            'hora_reserva'     => '12:00',
            'telefono_cliente' => '611223344',
            'correo_cliente'   => 'carlos.sanchez@email.com',
            'servicio'         => 'Arreglo de barba',
            'barbero'          => 'Juan',
        ],
    ],
]);
