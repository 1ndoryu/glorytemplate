<?php

/**
 * Configuración centralizada de pesos del algoritmo de recomendación.
 *
 * 100% dinámico, sin hardcode. Todo controlable desde este archivo.
 * Cada peso define cuánto influye una señal en el ranking final.
 * Los pesos deben sumar 1.0 (normalizados internamente si no lo hacen).
 *
 * @package Kamples
 */

return [

    /*
     * Pesos principales del algoritmo de descubrimiento.
     * Cada señal tiene un peso entre 0.0 y 1.0.
     */
    'senales' => [
        /* Similitud de contenido — tags, género, BPM, key */
        'similitud_contenido' => 0.25,

        /* Comportamiento del usuario — likes, escucha, descargas, tiempo */
        'comportamiento' => 0.25,

        /* Contexto del sample — BPM proximity, key match, tipo */
        'contexto' => 0.15,

        /* Tendencias — engagement velocity (ventana temporal) */
        'tendencias' => 0.15,

        /* Grafo social — samples de seguidos, likes de seguidos */
        'grafo_social' => 0.10,

        /* Novedad — boost logarítmico por fecha de publicación */
        'novedad' => 0.10,
    ],

    /*
     * Pesos internos de cada señal.
     * Definen la importancia relativa de sub-factores dentro de cada señal.
     */
    'comportamiento_detalle' => [
        'likes_dados'          => 0.30,  /* Samples que el usuario ha likeado */
        'reproducciones'       => 0.25,  /* Samples reproducidos */
        'tiempo_escucha'       => 0.20,  /* Duración total escuchada */
        'descargas'            => 0.15,  /* Samples descargados */
        'completadas'          => 0.10,  /* Reproducciones completadas */
    ],

    'contexto_detalle' => [
        'bpm_proximidad'       => 0.35,  /* Cercanía de BPM */
        'key_match'            => 0.30,  /* Coincidencia de tonalidad */
        'genero_match'         => 0.20,  /* Coincidencia de género */
        'tipo_match'           => 0.15,  /* Mismo tipo (loop/oneshot) */
    ],

    'tendencias_detalle' => [
        'likes_24h'            => 0.40,  /* Likes en últimas 24 horas */
        'reproducciones_24h'   => 0.30,  /* Reproducciones en 24h */
        'descargas_7d'         => 0.20,  /* Descargas en 7 días */
        'follows_creador_7d'   => 0.10,  /* Nuevos seguidores del creador en 7d */
    ],

    /*
     * Parámetros de ajuste del algoritmo.
     */
    'parametros' => [
        /* BPM: rango de tolerancia para considerar "similar" */
        'bpm_tolerancia'       => 15,

        /* Novedad: días de boost logarítmico (después decae) */
        'novedad_dias_boost'   => 14,

        /* Penalización por samples ya escuchados muchas veces */
        'penalizacion_ya_escuchado' => [
            'umbral_reproducciones' => 3,   /* A partir de 3 plays, penalizar */
            'factor_penalizacion'   => 0.3, /* Multiplicador (1 = sin penalización) */
        ],

        /* C178: Boost multiplicativo para samples verificados por humano */
        'verificado_boost'     => 1.15,

        /* Diversidad: máximo de samples del mismo creador en un feed */
        'max_por_creador'      => 3,

        /* Cantidad mínima de interacciones para activar señal de comportamiento */
        'min_interacciones'    => 5,

        /* Ventanas temporales para tendencias */
        'ventanas_tendencias'  => [
            'corta'  => '24 hours',
            'media'  => '7 days',
            'larga'  => '30 days',
        ],

        /* Máximo de resultados por consulta de feed */
        'max_resultados_feed'  => 100,
    ],

    /*
     * Pesos para "También te podría gustar" (al dar like).
     * Más peso a similitud directa, menos a social.
     */
    'tambien_te_gustaria' => [
        'similitud_contenido' => 0.40,
        'comportamiento'      => 0.20,
        'contexto'            => 0.20,
        'tendencias'          => 0.10,
        'novedad'             => 0.10,
    ],

    /*
     * Pesos para "Más Ideas" en colecciones.
     * 100% basado en contenido de la colección.
     */
    'mas_ideas_coleccion' => [
        'similitud_contenido' => 0.50,
        'contexto'            => 0.25,
        'tendencias'          => 0.15,
        'novedad'             => 0.10,
    ],

    /*
     * Pesos para samples similares en la página individual.
     */
    'samples_similares' => [
        'similitud_contenido' => 0.45,
        'contexto'            => 0.25,
        'tendencias'          => 0.15,
        'novedad'             => 0.15,
    ],

    /*
     * Frecuencia de recálculo del algoritmo (C45).
     *
     * Dos modos: rápido (light, menos señales) y preciso (full, todas las señales).
     *
     * El algoritmo rápido invalida el cache del feed y fuerza un recálculo ligero.
     * El algoritmo preciso regenera embeddings actualizados, recalcula perfiles de
     * usuario y ejecuta el scoring completo con las 6 señales.
     *
     * Triggers = cantidad de interacciones acumuladas que disparan el recálculo.
     * Temporales = recálculos periódicos independientes de la actividad.
     */
    'frecuencia' => [
        /* Algoritmo rápido: scoring ligero (sin pgvector/embeddings) */
        'rapido' => [
            /* Triggers por interacciones — al acumular N interacciones, invalidar cache */
            'triggers' => [
                'likes'                  => 5,   /* Cada 5 likes */
                'reproducciones'         => 10,  /* Cada 10 reproducciones */
                'reproducciones_completas' => 5, /* Cada 5 reproducciones completas */
                'descargas'              => 3,   /* Cada 3 descargas */
                'follows'                => 2,   /* Cada 2 follows */
                'comentarios'            => 3,   /* Cada 3 comentarios */
            ],
            /* Recálculo temporal: minutos entre recálculos automáticos */
            'intervalo_activo_min'   => 30,  /* Mientras el usuario está conectado */
            'intervalo_inactivo_min' => 480, /* 8 horas sin actividad */
        ],

        /* Algoritmo preciso: scoring completo (con pgvector + embeddings) */
        'preciso' => [
            /* Triggers por interacciones — el doble que el rápido */
            'triggers' => [
                'likes'                  => 10,
                'reproducciones'         => 20,
                'reproducciones_completas' => 10,
                'descargas'              => 6,
                'follows'                => 4,
                'comentarios'            => 6,
            ],
            /* Recálculo temporal: el doble de tiempo que el rápido */
            'intervalo_activo_min'   => 60,   /* 1 hora mientras conectado */
            'intervalo_inactivo_min' => 960,  /* 16 horas sin actividad */
        ],

        /* Tiempo (segundos) sin actividad para considerar al usuario "inactivo" */
        'umbral_inactividad_seg'    => 600, /* 10 minutos */
    ],
];
