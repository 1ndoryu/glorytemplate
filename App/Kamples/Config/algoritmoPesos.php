<?php

/**
 * Configuración centralizada de pesos del algoritmo de recomendación.
 *
 * 100% dinámico, sin hardcode. Todo controlable desde este archivo.
 * Cada peso define cuánto influye una señal en el ranking final.
 * Los pesos principales DEBEN sumar 1.0 (cada señal produce [0,1], el score final
 * es la suma ponderada). Los sub-pesos dentro de cada señal también deben sumar 1.0.
 *
 * @package Kamples
 */

return [

    /*
     * Pesos principales del algoritmo de descubrimiento.
     * Cada señal tiene un peso entre 0.0 y 1.0.
     */
    'senales' => [
        /* Similitud de contenido — pgvector coseno (tags dominan 106/128 dims del embedding) */
        'similitud_contenido' => 0.28,

        /* Comportamiento del usuario — afinidad por tags de samples interactuados */
        'comportamiento' => 0.27,

        /* Contexto del sample — afinidad temática (genero+creador 75%) + datos técnicos (25%) */
        'contexto' => 0.15,

        /* Tendencias — engagement velocity absoluto en ventana (sin sesgo por edad del sample) */
        'tendencias' => 0.12,

        /* Grafo social — samples de seguidos, likes de seguidos */
        'grafo_social' => 0.10,

        /* Novedad — boost mínimo; los samples no pierden valor con el tiempo */
        'novedad' => 0.08,
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
        /* Datos técnicos — peso reducido (0.25 total del contexto) */
        'bpm_proximidad'       => 0.08,  /* Cercanía de BPM al promedio del usuario */
        'key_match'            => 0.06,  /* Coincidencia de tonalidad */
        'escala_match'         => 0.04,  /* Coincidencia de escala (major/minor) */
        'tipo_match'           => 0.07,  /* Mismo tipo (loop/oneshot) */
        /* Afinidad temática — peso dominante (0.75 total del contexto) */
        'genero_match'         => 0.30,  /* Coincidencia de género vía tags enriquecidos */
        'creador_afin'         => 0.45,  /* Boost si el creador es uno de los favoritos */
    ],

    'tendencias_detalle' => [
        'likes_24h'            => 0.40,  /* Likes en últimas 24 horas */
        'reproducciones_24h'   => 0.30,  /* Reproducciones en 24h */
        'descargas_7d'         => 0.20,  /* Descargas en 7 días */
        'follows_creador_7d'   => 0.10,  /* Nuevos seguidores del creador en 7d */
    ],

    /*
     * Normalizadores de tendencias: valores máximos esperados por ventana.
     * Reemplazan la normalización por edad del sample (que penalizaba content antiguo).
     * Cada sub-factor usa: LEAST(1.0, conteo_ventana / max_normalizador).
     */
    'tendencias_normalizadores' => [
        'max_likes_ventana_corta'      => 15,  /* 15 likes en ventana corta = score 1.0 */
        'max_repro_ventana_corta'      => 30,  /* 30 reproducciones en ventana corta */
        'max_descargas_ventana_media'  => 20,  /* 20 descargas en ventana media */
        'max_follows_ventana_media'    => 10,  /* 10 nuevos followers en ventana media */
    ],

    /*
     * Parámetros de ajuste del algoritmo.
     */
    'parametros' => [
        /* BPM: rango de tolerancia para considerar "similar" */
        'bpm_tolerancia'       => 15,

        /* Novedad: días de boost logarítmico (después decae) */
        'novedad_dias_boost'   => 14,

        /*
         * Clasificación de calidad de reproducción.
         *
         * Samples duran entre 2s y 3min (10-20s lo más frecuente).
         * No todas las reproducciones valen igual:
         * - Significativa: usuario escuchó >= umbral (según duración del sample)
         * - Rápida: escuchó algo (>= 1s) pero menos del umbral → peso reducido
         * - Ignorada: < 1s (accidental/skip) → no cuenta
         * - Legacy: duracion_escuchada=0 (datos anteriores al tracking) → configurable
         *
         * Umbrales adaptativos por duración del sample:
         * - Corto (<= 20s): escuchar >= 50% → 10s sample requiere 5s mínimo.
         * - Medio (20-60s): escuchar >= 30% con mínimo absoluto 10s.
         * - Largo (> 60s): escuchar >= 15% con mínimo absoluto 10s.
         */
        'clasificacion_reproduccion' => [
            'habilitado'                     => true,
            'umbral_minimo_seg'              => 1,    /* < 1s = no cuenta (accidental/skip) */
            'porcentaje_significativa_corto' => 0.50,  /* Samples <= 20s: escuchar >= 50% */
            'porcentaje_significativa_medio' => 0.30,  /* Samples 20-60s: escuchar >= 30% */
            'porcentaje_significativa_largo' => 0.15,  /* Samples > 60s: escuchar >= 15% */
            'minimo_absoluto_significativa'  => 10,    /* Mín segundos para significativa en medio/largo */
            'peso_rapida'                    => 0.30,  /* Peso relativo de reproducción rápida (significativa=1.0) */
            'legacy_como_significativa'      => true,   /* duracion_escuchada=0 → tratar como significativa */
        ],

        /*
         * Penalización progresiva por reproducciones.
         * Cada reproducción reduce el score con decaimiento hiperbólico.
         * Usa SUM(peso_calidad) en vez de COUNT(*): reproducciones rápidas
         * penalizan menos que significativas (0.3 vs 1.0).
         * multiplicador = max(minimo, 1 / (1 + sum_calidad * tasa_decaimiento))
         */
        'penalizacion_reproduccion' => [
            'tasa_decaimiento'      => 0.15, /* Factor de decaimiento por reproducción ponderada */
            'minimo'                => 0.20, /* Piso — nunca se oculta completamente */
        ],

        /*
         * Penalización pasiva: reproducción sin acción positiva.
         * Si el usuario reprodujo un sample >= N veces de forma SIGNIFICATIVA
         * (no quick-plays) pero NO dio like, NI lo descargó, NI lo guardó
         * en colección → se considera "dislike implícito" (mitad de un dislike).
         * Quick-plays no disparan esta penalización — el usuario no tuvo
         * oportunidad real de decidir.
         */
        'penalizacion_pasiva' => [
            'habilitado'            => true,
            'factor'                => 0.85, /* 15% penalty = mitad de dislike máximo */
            'min_reproducciones'    => 2,    /* Mínimo de reproducciones SIGNIFICATIVAS para activar */
        ],

        /*
         * Saturación de popularidad: samples muy descargados pierden valor.
         * Los usuarios buscan samples buenos que no estén sobreusados.
         *
         * Modo 'dinamico' (default): percentiles de la plataforma como umbral.
         *   - P75 de descargas = punto donde empieza la saturación
         *   - P95 - P75 = escala del decaimiento
         *   Se adapta automáticamente: si la plataforma crece de 50 a 1000
         *   descargas diarias, los umbrales suben proporcionalmente.
         *   Stats cacheadas en WP transient (cache_ttl).
         *
         * Modo 'fijo': usa umbral_descargas y escala literales (para override manual).
         *
         * Formula: max(minimo, 1 / (1 + LN(1 + max(0, descargas - umbral) / escala)))
         */
        'saturacion_popularidad' => [
            'habilitado'            => true,
            'modo'                  => 'dinamico', /* 'dinamico' | 'fijo' */
            /* Modo dinámico: percentiles que definen los umbrales */
            'percentil_umbral'      => 0.75,  /* P75 = punto donde empieza saturación */
            'percentil_escala'      => 0.95,  /* P95 - P75 = escala de decaimiento */
            'cache_ttl'             => 3600,  /* Segundos para cachear stats de plataforma */
            /* Modo fijo (fallback si falla el cálculo dinámico): */
            'umbral_descargas'      => 50,
            'escala'                => 100,
            /* Común a ambos modos: */
            'minimo'                => 0.30, /* Piso — samples populares siguen apareciendo */
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
     * Tags/género/instrumentos dominan; datos técnicos (BPM, key) son secundarios.
     */
    'samples_similares' => [
        'similitud_contenido' => 0.55,
        'contexto'            => 0.10,
        'tendencias'          => 0.20,
        'novedad'             => 0.15,
    ],

    /*
     * Sub-pesos de contexto para samples_similares (fallback sin pgvector).
     * BPM y key importan menos; tipo del sample (loop/oneshot) más relevante.
     */
    'samples_similares_contexto' => [
        'bpm_proximidad' => 0.25,
        'key_match'      => 0.25,
        'tipo_match'     => 0.50,
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
            'intervalo_activo_min'   => 5,  /* Mientras el usuario está conectado */
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

    /*
     * Algoritmo del feed de Comunidad (publicaciones sociales).
     *
     * Scoring multi-señal para el feed 'todos' (default).
     * 'populares' y 'siguiendo' siguen usando ORDER BY simple.
     *
     * Fórmula: score = freshness * w_f + engagement_velocity * w_e + social_boost * w_s
     * Normalizada con LEAST(1.0, ...) para mantener [0,1].
     */
    'comunidad' => [
        /* Pesos principales — DEBEN sumar 1.0 */
        'senales' => [
            'frescura'               => 0.40,  /* Decay exponencial por antigüedad */
            'engagement_velocity'    => 0.35,  /* Likes+comentarios+reposts / hora */
            'boost_social'           => 0.15,  /* Publicación de usuario seguido */
            'diversidad_autor'       => 0.10,  /* Penalización por repetición de autor */
        ],

        'parametros' => [
            /* Horas de vida media para decay exponencial de frescura */
            'frescura_vida_media_horas' => 24,

            /* Factor de amplificación para engagement velocity */
            'engagement_factor_likes'      => 1.0,
            'engagement_factor_comentarios' => 2.0,  /* Comentarios valen más (mayor esfuerzo) */
            'engagement_factor_reposts'    => 1.5,

            /* Máximo de publicaciones del mismo autor en un feed page */
            'max_por_autor'                => 3,

            /* Umbral mínimo de horas para normalizar velocity (evita division-by-near-zero) */
            'velocity_min_horas'           => 1,
        ],
    ],

    /*
     * Configuración de búsqueda de samples con ranking de relevancia.
     *
     * Reemplaza ILIKE simple por scoring multi-factor:
     * - ts_rank: relevancia full-text de PostgreSQL
     * - Tag match: boost si el término de búsqueda coincide con tags
     * - Título match: boost si el término coincide con el título (más específico que descripción)
     *
     * Fórmula: score = ts_rank_weight * ts_rank + tag_match_boost * tag_score + titulo_boost * titulo_score
     */
    'busqueda' => [
        /* Pesos de ranking — NO necesitan sumar 1.0 (son multiplicadores de boost) */
        'ts_rank_weight'       => 1.0,   /* Peso del ranking full-text de PostgreSQL */
        'tag_match_boost'      => 0.8,   /* Boost por coincidencia en tags del sample */
        'titulo_boost'         => 0.5,   /* Boost extra por match en título (más relevante que descripción) */

        /* Idioma para ts_vector/ts_query (PostgreSQL text search config) */
        'idioma_ts'            => 'spanish',

        /* Mínimo de caracteres para activar búsqueda (evita queries costosas de 1-2 chars) */
        'min_caracteres'       => 2,

        /* Máximo de resultados por página de búsqueda */
        'max_resultados'       => 50,
    ],

    /*
     * Configuración de normalización de tags.
     *
     * Política de normalización aplicada al almacenar tags en BD:
     * - NormalizadorSample::normalizarTags() aplica estas reglas
     * - ConstructorSenales::sqlTagsEnriquecidos() usa LOWER() como defensa en profundidad
     * - GeneradorEmbeddings ya normaliza con strtolower/trim al generar vectores
     */
    'tags' => [
        'lowercase'            => true,  /* Convertir a minúsculas */
        'trim'                 => true,  /* Eliminar espacios antes/después */
        'deduplicar'           => true,  /* Eliminar tags duplicados */
        'max_por_sample'       => 15,    /* Máximo de tags por sample */
        'max_longitud_tag'     => 50,    /* Máximo de caracteres por tag */
    ],

    /*
     * Serendipia: inyección de samples fuera de la burbuja de preferencias.
     *
     * Cada N posiciones en el feed se reemplaza con un sample "descubrimiento"
     * que no coincide mucho con las preferencias del usuario pero tiene
     * engagement suficiente para no ser ruido. "No tan alejado" — distancia
     * coseno moderada, no máxima.
     */
    'serendipidad' => [
        'habilitado'            => true,
        'frecuencia'            => 8,    /* Cada N samples, inyectar uno de descubrimiento */
        'distancia_min'         => 0.3,  /* Distancia coseno mínima (0=idéntico, 2=opuesto) */
        'distancia_max'         => 1.0,  /* Distancia coseno máxima (no demasiado lejano) */
        'min_engagement'        => 5,    /* Engagement mínimo (likes+repro+descargas) */
        'limite_candidatos'     => 10,   /* Máximo candidatos de descubrimiento por query */
    ],
];
