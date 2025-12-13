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
<p>La villa competia en portales genericos con propiedades de menor categoria, lo que diluia su propuesta de valor. Los propietarios gestionaban las reservas de forma manual, respondiendo solicitudes con hasta 48 horas de retraso. No existia una estrategia de precios dinamica ni se aprovechaban los eventos locales para maximizar ingresos.</p>

<h3>Nuestra Estrategia</h3>
<p>Implementamos un enfoque integral basado en el metodo COSMO. Primero, realizamos un mapeo completo del mercado de villas de lujo en la zona, identificando gaps de precio y temporadas de alta demanda no aprovechadas. Rediseñamos el posicionamiento de la villa, creando una identidad premium con fotografia profesional y descripciones que destacaban las experiencias unicas.</p>

<p>Configuramos un sistema de pricing dinamico conectado a datos de demanda en tiempo real, con reglas especificas para eventos como el Festival de Benicassim, regatas y temporadas de golf. Optimizamos la presencia en canales especializados de lujo y desarrollamos una estrategia de reserva directa con incentivos exclusivos.</p>

<h3>Los Resultados</h3>
<p>En la primera temporada completa de colaboracion, Villa Mar Azul alcanzo una ocupacion del 78% con un incremento del ADR del 35%. Los propietarios pudieron abandonar la gestion operativa diaria, delegando en nuestros procesos automatizados mientras disfrutaban de reportes mensuales claros sobre el rendimiento de su inversion.</p>
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
<p>Hotel Costa Sol es un establecimiento familiar de 45 habitaciones situado en una de las zonas mas turisticas de la Costa Blanca. Durante anos, el hotel habia dependido casi exclusivamente de Booking.com y Expedia, pagando comisiones que superaban el 20% de cada reserva y perdiendo control sobre su propia clientela.</p>

<h3>El Desafio</h3>
<p>El equipo directivo se enfrentaba a multiples problemas: margenes cada vez mas ajustados por las altas comisiones, nula fidelizacion de clientes que repetian a traves de OTAs, y una guerra de precios con competidores que erosionaba el valor percibido del hotel. Ademas, carecian de herramientas para analizar patrones de demanda y ajustar tarifas de forma proactiva.</p>

<h3>Nuestra Estrategia</h3>
<p>Diseñamos un plan de desintermediacion progresiva sin sacrificar ocupacion. Comenzamos optimizando las fichas en OTAs para mejorar el posicionamiento organico, mientras simultaneamente desarrollabamos el canal directo. Implementamos un motor de reservas con paridad de precios y beneficios exclusivos para reservas directas.</p>

<p>Creamos campañas de email marketing segmentadas para recuperar clientes que habian reservado previamente via OTAs, ofreciendo incentivos para reservar directamente. Configuramos un channel manager integrado con reglas de disponibilidad inteligentes que priorizaban canales de menor coste en periodos de alta demanda.</p>

<h3>Los Resultados</h3>
<p>En 18 meses, Hotel Costa Sol paso de un 12% de reservas directas al 70%, incrementando sus ingresos netos en un 5% a pesar de mantener tarifas competitivas. El hotel ahora cuenta con una base de datos propia de mas de 3.000 clientes y un programa de fidelizacion activo que genera reservas recurrentes.</p>
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
            'caso_cita'           => 'Por fin tenemos el control de nuestro negocio. Conocemos a nuestros clientes, podemos hablar con ellos directamente y nuestros margenes han mejorado notablemente.',
            'caso_cita_autor'     => 'Maria Teresa L., Directora General',
            'caso_resultados'     => 'Reservas directas del 12% al 70%|Base de datos de 3.000+ clientes|Comisiones reducidas en 45.000 EUR/ano|Programa de fidelizacion con 800 miembros|NPS incrementado de 42 a 67',
        ],
    ],
    [
        'slugDefault' => 'hotel-boutique-urbano',
        'titulo'      => 'Boutique Hotel Alameda',
        'extracto'    => 'Un hotel boutique de 18 habitaciones en Valencia ciudad que, tras una reforma integral, necesitaba reposicionarse en el mercado y competir con los grandes players.',
        'contenido'   => '
<p>Boutique Hotel Alameda es un pequeno hotel de 18 habitaciones ubicado en el corazon de Valencia, a pocos pasos de la Ciudad de las Artes y las Ciencias. Tras una reforma de 800.000 euros que elevo su categoria, los propietarios se encontraron con un reto inesperado: sus tarifas historicas ya no reflejaban el nuevo producto, pero subir precios sin una estrategia clara resultaba arriesgado.</p>

<h3>El Desafio</h3>
<p>El hotel habia reabierto con una imagen completamente renovada pero mantenia su base de clientes anterior, acostumbrada a precios economicos. Los competidores directos, hoteles boutique consolidados, llevaban anos posicionados en el segmento premium y contaban con reseñas y reputacion establecida. El equipo necesitaba una estrategia para justificar el incremento de tarifas sin perder ocupacion durante la transicion.</p>

<h3>Nuestra Estrategia</h3>
<p>Definimos un plan de reposicionamiento en tres fases. La primera fase se centro en construir reputacion: incentivamos reseñas de los primeros huespedes, optimizamos el perfil en TripAdvisor y creamos contenido visual de alta calidad que reflejara la nueva estetica del hotel.</p>

<p>En la segunda fase, implementamos una estrategia de precios gradual, comenzando con un 5% por encima del mercado y aumentando progresivamente segun mejoraba la reputacion online. Desarrollamos paquetes experienciales que justificaban el precio premium: tours gastronomicos, acceso a eventos culturales y servicios de conserjeria personalizados.</p>

<p>La tercera fase se enfoco en consolidar el posicionamiento, con campañas de PR dirigidas a medios de viajes de lujo y colaboraciones con influencers del sector lifestyle.</p>

<h3>Los Resultados</h3>
<p>En apenas 8 meses, Boutique Hotel Alameda logro establecerse como uno de los hoteles mejor valorados de Valencia, con un ADR un 15% superior a la media de su competitive set. La tasa de ocupacion se mantuvo estable en el 75%, demostrando que los huespedes estaban dispuestos a pagar por la experiencia diferenciada.</p>
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
            'caso_cita'           => 'La inversion en la reforma habria sido un fracaso sin la estrategia de Cosmo. Nos ayudaron a encontrar nuestro lugar en el mercado y a comunicar correctamente nuestro valor.',
            'caso_cita_autor'     => 'Alejandro P., Director de Operaciones',
            'caso_resultados'     => 'ADR 15% superior al competitive set|Ocupacion estable del 75%|Top 10 hoteles Valencia en TripAdvisor|Menciones en 5 medios especializados|ROI de la reforma recuperado en proyeccion 3 anos',
        ],
    ],
]);
