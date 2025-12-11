<?php

use Glory\Manager\DefaultContentManager;

DefaultContentManager::define('libro', [
    [
        'slugDefault' => 'las-48-leyes-del-poder',
        'titulo'      => 'Las 48 Leyes del Poder',
        'contenido'   => 'Un libro de Robert Greene que explora las dinamicas del poder a traves de la historia.',
        'imagenDestacadaAsset' => 'elements::libros/48leyesdelpoder.png',
    ],
    [
        'slugDefault' => 'alicia-en-el-pais-de-las-maravillas',
        'titulo'      => 'Alicia en el Pais de las Maravillas',
        'contenido'   => 'Un clasico de Lewis Carroll sobre las fantasticas aventuras de una nina llamada Alicia.',
        'imagenDestacadaAsset' => 'elements::libros/aliciaenelpais.jpg',
    ],
    [
        'slugDefault' => 'el-principito',
        'titulo'      => 'El Principito',
        'contenido'   => 'Una novela poetica de Antoine de Saint-Exupery que reflexiona sobre la vida, el amor y la amistad.',
        'imagenDestacadaAsset' => 'elements::libros/principito.jpeg',
    ],
]);

/**
 * POSTS DE BLOG
 * 
 * Estos posts se sincronizan automaticamente con WordPress.
 * ReactContentProvider los consume y los pasa a React via useContent hook.
 * 
 * Las imagenes usan el alias 'colors' que apunta a Glory/assets/images/colors/
 */
DefaultContentManager::define('post', [
    [
        'slugDefault' => 'caso-barberia-chatbot-whatsapp',
        'titulo'      => 'Como una barberia ahorro 10 horas semanales con un chatbot',
        'contenido'   => '<p>Juan tenia un problema comun: pasaba horas al telefono gestionando citas. Llamadas perdidas, clientes que olvidaban sus reservas, dobles reservas...</p>
<p>Implementamos un chatbot de WhatsApp que:</p>
<ul>
<li>Gestiona reservas automaticamente 24/7</li>
<li>Envia recordatorios 24h antes de cada cita</li>
<li>Permite cancelar o reprogramar sin llamar</li>
</ul>
<p><strong>Resultado:</strong> 10 horas menos de trabajo administrativo a la semana y un 40% menos de citas perdidas.</p>',
        'extracto'    => 'Caso real: automatizacion de reservas y recordatorios por WhatsApp para un negocio local.',
        'estado'      => 'publish',
        'imagenDestacadaAsset' => 'colors::03484ae33ccf5321cca0f3f72cb16f25.jpg',
    ],
    [
        'slugDefault' => 'chatbot-vs-formulario-comparativa',
        'titulo'      => 'Chatbot vs formulario: cual convierte mejor',
        'contenido'   => '<p>Analizamos 500 leads de una clinica dental durante 3 meses. La mitad llegaron por formulario web tradicional, la otra mitad por chatbot de WhatsApp.</p>
<p><strong>Resultados:</strong></p>
<ul>
<li>Tasa de respuesta del formulario: 12%</li>
<li>Tasa de respuesta del chatbot: 67%</li>
<li>Tiempo medio de respuesta formulario: 4 horas</li>
<li>Tiempo medio de respuesta chatbot: 30 segundos</li>
</ul>
<p>La inmediatez del chatbot marca la diferencia. Los leads calientes se enfrian rapido.</p>',
        'extracto'    => 'Analisis comparativo de tasas de conversion entre chatbots y formularios tradicionales.',
        'estado'      => 'publish',
        'imagenDestacadaAsset' => 'colors::06f27b1dc0cf91de3ed1a6e2862de3ac.jpg',
    ],
    [
        'slugDefault' => 'guia-recordatorios-whatsapp-automaticos',
        'titulo'      => 'Guia: Automatizar recordatorios de citas por WhatsApp',
        'contenido'   => '<p>Los recordatorios automaticos pueden reducir las citas perdidas hasta un 70%. Aqui te explico como implementarlos paso a paso.</p>
<h3>Paso 1: Elige tu herramienta</h3>
<p>Puedes usar la API de WhatsApp Business directamente o integraciones como Twilio, MessageBird o soluciones locales.</p>
<h3>Paso 2: Define tus plantillas</h3>
<p>WhatsApp requiere que apruebes plantillas de mensaje. Redacta mensajes claros y concisos.</p>
<h3>Paso 3: Conecta tu calendario</h3>
<p>Sincroniza con Google Calendar, Calendly o tu sistema de gestion para automatizar los envios.</p>',
        'extracto'    => 'Tutorial paso a paso para implementar recordatorios automaticos en tu negocio.',
        'estado'      => 'publish',
        'imagenDestacadaAsset' => 'colors::080e37cd9fd0d69ba0ba53f40efafd93.jpg',
    ],
]);
