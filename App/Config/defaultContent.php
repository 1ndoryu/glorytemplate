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
        'slugDefault' => 'reserva-ejemplo-4',
        'titulo'      => 'Andrea Ruiz',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-07',
            'hora_reserva'     => '17:00',
            'telefono_cliente' => '644556677',
            'correo_cliente'   => 'andrea.ruiz@email.com',
            'servicio'         => 'Corte extra degradado',
            'barbero'          => 'Luis',
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
    [
        'slugDefault' => 'reserva-ejemplo-6',
        'titulo'      => 'María López',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-08',
            'hora_reserva'     => '09:30',
            'telefono_cliente' => '655667788',
            'correo_cliente'   => 'maria.lopez@email.com',
            'servicio'         => 'Arreglo y perfilado de barba',
            'barbero'          => 'Santiago',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-7',
        'titulo'      => 'Jorge Pérez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-08',
            'hora_reserva'     => '13:00',
            'telefono_cliente' => '666778899',
            'correo_cliente'   => 'jorge.perez@email.com',
            'servicio'         => 'Corte y afeitado',
            'barbero'          => 'Elkin',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-8',
        'titulo'      => 'Sofía Martínez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-09',
            'hora_reserva'     => '10:45',
            'telefono_cliente' => '677889900',
            'correo_cliente'   => 'sofia.martinez@email.com',
            'servicio'         => 'Corte al Cero',
            'barbero'          => 'Juan',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-9',
        'titulo'      => 'Ricardo Gómez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-09',
            'hora_reserva'     => '12:15',
            'telefono_cliente' => '688990011',
            'correo_cliente'   => 'ricardo.gomez@email.com',
            'servicio'         => 'Lavar',
            'barbero'          => 'Pedro',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-10',
        'titulo'      => 'Valentina Torres',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-09',
            'hora_reserva'     => '15:00',
            'telefono_cliente' => '699001122',
            'correo_cliente'   => 'valentina.torres@email.com',
            'servicio'         => 'Lavar y peinar',
            'barbero'          => 'Luis',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-11',
        'titulo'      => 'Pablo Castillo',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-10',
            'hora_reserva'     => '09:00',
            'telefono_cliente' => '600112233',
            'correo_cliente'   => 'pablo.castillo@email.com',
            'servicio'         => 'Corte y arreglo de barba',
            'barbero'          => 'Santiago',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-12',
        'titulo'      => 'Daniela Rojas',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-10',
            'hora_reserva'     => '11:00',
            'telefono_cliente' => '611223355',
            'correo_cliente'   => 'daniela.rojas@email.com',
            'servicio'         => 'Afeitado de barba',
            'barbero'          => 'Elkin',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-13',
        'titulo'      => 'Fernando Díaz',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-11',
            'hora_reserva'     => '14:30',
            'telefono_cliente' => '622334466',
            'correo_cliente'   => 'fernando.diaz@email.com',
            'servicio'         => 'Tinte de pelo',
            'barbero'          => 'Juan',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-14',
        'titulo'      => 'Camila Vargas',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-11',
            'hora_reserva'     => '16:15',
            'telefono_cliente' => '633445577',
            'correo_cliente'   => 'camila.vargas@email.com',
            'servicio'         => 'Tinte de barba',
            'barbero'          => 'Pedro',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-15',
        'titulo'      => 'Diego Ramírez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-12',
            'hora_reserva'     => '10:30',
            'telefono_cliente' => '644556688',
            'correo_cliente'   => 'diego.ramirez@email.com',
            'servicio'         => 'Arreglo de Cuello',
            'barbero'          => 'Luis',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-16',
        'titulo'      => 'Paula Méndez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-12',
            'hora_reserva'     => '12:45',
            'telefono_cliente' => '655667799',
            'correo_cliente'   => 'paula.mendez@email.com',
            'servicio'         => 'Corte y afeitado',
            'barbero'          => 'Santiago',
        ],
    ],
]);
