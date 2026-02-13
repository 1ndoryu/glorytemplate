<?php

use Glory\Manager\DefaultContentManager;

DefaultContentManager::define('libro', [
    [
        'slugDefault' => 'las-48-leyes-del-poder',
        'titulo'      => 'Las 48 Leyes del Poder',
        'contenido'   => 'Un libro de Robert Greene que explora las dinámicas del poder a través de la historia.',
        'imagenDestacadaAsset' => 'elements::libros/48leyesdelpoder.png',
    ],
    [
        'slugDefault' => 'alicia-en-el-pais-de-las-maravillas',
        'titulo'      => 'Alicia en el País de las Maravillas',
        'contenido'   => 'Un clásico de Lewis Carroll sobre las fantásticas aventuras de una niña llamada Alicia.',
        'imagenDestacadaAsset' => 'elements::libros/aliciaenelpais.jpg',
    ],
    [
        'slugDefault' => 'el-principito',
        'titulo'      => 'El Principito',
        'contenido'   => 'Una novela poética de Antoine de Saint-Exupéry que reflexiona sobre la vida, el amor y la amistad.',
        'imagenDestacadaAsset' => 'elements::libros/principito.jpeg',
    ],
]);

DefaultContentManager::define('casos', [
    [
        'slugDefault' => 'villa-de-lujo',
        'titulo'      => 'Villa Mar Azul',
        'extracto'    => 'Una villa de lujo en la Costa Valenciana que paso de ser una propiedad subutilizada a convertirse en un referente de rentabilidad en el mercado vacacional premium.',
        'contenido'   => '
<p>Villa Mar Azul es una propiedad excepcional de 6 habitaciones ubicada en primera linea de playa en la Costa Valenciana. Cuando los propietarios contactaron con Cosmo Revenue, la villa llevaba dos temporadas con una ocupacion media del 45% y tarifas que no reflejaban el verdadero valor del inmueble.</p>

<h3>El Desafio</h3>
<p>La villa competia en portales genericos con propiedades de menor categoria, lo que diluia su propuesta de valor. Los propietarios gestionaban las reservas de forma manual, respondiendo solicitudes con hasta 48 horas de retraso.</p>

<h3>Nuestra Estrategia</h3>
<p>Implementamos un enfoque integral basado en el metodo COSMO. Mapeo completo del mercado de villas de lujo, pricing dinamico conectado a datos de demanda en tiempo real, y optimizacion en canales especializados de lujo.</p>

<h3>Los Resultados</h3>
<p>En la primera temporada completa, Villa Mar Azul alcanzo una ocupacion del 78% con un incremento del ADR del 35%.</p>
',
        'imagenDestacadaAsset' => 'tema::casoUno.png',
        'metaEntrada' => [
            'caso_tipo'           => 'Villa de Lujo',
            'caso_ubicacion'      => 'Costa Valenciana',
            'caso_valor'          => '250.000 EUR',
            'caso_descripcion'    => 'RENTABILIDAD NETA (1ER ANO)',
            'caso_cliente'        => 'Propietarios Privados',
            'caso_servicios'      => 'Revenue Management, Marketing Digital, Gestion de Canales',
            'caso_duracion'       => '12 meses',
            'caso_cita'           => 'Cosmo Revenue transformo nuestra villa en un negocio rentable. Antes apenas cubriamos gastos, ahora tenemos una inversion que genera beneficios reales.',
            'caso_cita_autor'     => 'Carlos M., Propietario',
            'caso_resultados'     => 'Ocupacion del 45% al 78%|ADR incrementado en 35%|Tiempo de respuesta reducido a 2 horas|Reservas directas del 40%|Valoracion media de 4.9 estrellas',
        ],
    ],
    [
        'slugDefault' => 'hotel-vacacional',
        'titulo'      => 'Hotel Costa Sol',
        'extracto'    => 'Un hotel vacacional de 45 habitaciones en Costa Blanca que logro reducir su dependencia de OTAs y aumentar significativamente sus ingresos directos.',
        'contenido'   => '
<p>Hotel Costa Sol es un establecimiento familiar de 45 habitaciones situado en la Costa Blanca. Durante anos, habia dependido casi exclusivamente de Booking.com y Expedia, pagando comisiones superiores al 20%.</p>

<h3>El Desafio</h3>
<p>Margenes ajustados por altas comisiones, nula fidelizacion de clientes y guerra de precios con competidores.</p>

<h3>Nuestra Estrategia</h3>
<p>Plan de desintermediacion progresiva: optimizamos fichas en OTAs, desarrollamos canal directo con motor de reservas y beneficios exclusivos, y creamos campañas de email marketing segmentadas.</p>

<h3>Los Resultados</h3>
<p>En 18 meses, paso de un 12% de reservas directas al 70%, incrementando ingresos netos en un 5%.</p>
',
        'imagenDestacadaAsset' => 'tema::casoDos.png',
        'metaEntrada' => [
            'caso_tipo'           => 'Hotel Vacacional',
            'caso_ubicacion'      => 'Costa Blanca',
            'caso_valor'          => '+5% Ingresos (70% directas)',
            'caso_descripcion'    => 'INCREMENTO INGRESOS NETOS',
            'caso_cliente'        => 'Hotel Costa Sol S.L.',
            'caso_servicios'      => 'Revenue Management, Estrategia de Canales, Email Marketing',
            'caso_duracion'       => '18 meses',
            'caso_cita'           => 'Por fin tenemos el control de nuestro negocio. Conocemos a nuestros clientes y nuestros margenes han mejorado notablemente.',
            'caso_cita_autor'     => 'Maria Teresa L., Directora General',
            'caso_resultados'     => 'Reservas directas del 12% al 70%|Base de datos de 3.000+ clientes|Comisiones reducidas en 45.000 EUR/ano|Programa de fidelizacion con 800 miembros|NPS incrementado de 42 a 67',
        ],
    ],
    [
        'slugDefault' => 'hotel-boutique-urbano',
        'titulo'      => 'Boutique Hotel Alameda',
        'extracto'    => 'Un hotel boutique de 18 habitaciones en Valencia ciudad que, tras una reforma integral, necesitaba reposicionarse en el mercado.',
        'contenido'   => '
<p>Boutique Hotel Alameda es un pequeno hotel de 18 habitaciones en el corazon de Valencia. Tras una reforma de 800.000 euros, los propietarios necesitaban justificar el incremento de tarifas sin perder ocupacion.</p>

<h3>El Desafio</h3>
<p>El hotel mantenia su base de clientes anterior acostumbrada a precios economicos. Los competidores boutique llevaban anos posicionados en el segmento premium.</p>

<h3>Nuestra Estrategia</h3>
<p>Reposicionamiento en tres fases: construccion de reputacion, estrategia de precios gradual con paquetes experienciales premium, y consolidacion con PR en medios especializados.</p>

<h3>Los Resultados</h3>
<p>En 8 meses, ADR un 15% superior a la media del competitive set con ocupacion estable del 75%.</p>
',
        'imagenDestacadaAsset' => 'tema::casoTres.png',
        'metaEntrada' => [
            'caso_tipo'           => 'Hotel Boutique Urbano',
            'caso_ubicacion'      => 'Valencia Centro',
            'caso_valor'          => '+15% ADR',
            'caso_descripcion'    => 'VS COMPETITIVE SET',
            'caso_cliente'        => 'Alameda Hospitality Group',
            'caso_servicios'      => 'Reposicionamiento, Revenue Management, PR y Comunicacion',
            'caso_duracion'       => '8 meses',
            'caso_cita'           => 'La inversion en la reforma habria sido un fracaso sin la estrategia de Cosmo. Nos ayudaron a encontrar nuestro lugar en el mercado.',
            'caso_cita_autor'     => 'Alejandro P., Director de Operaciones',
            'caso_resultados'     => 'ADR 15% superior al competitive set|Ocupacion estable del 75%|Top 10 hoteles Valencia en TripAdvisor|Menciones en 5 medios especializados|ROI de la reforma recuperado en proyeccion 3 anos',
        ],
    ],
]);

