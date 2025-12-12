<?php

/**
 * DraftManager - Gestor de borradores generados por IA
 * 
 * Maneja el ciclo de vida de los articulos generados:
 * - Creacion como borradores de WordPress
 * - Almacenamiento de metadata (fuentes, prompt, modelo)
 * - Aprobacion/rechazo
 * - Estadisticas
 * 
 * @package Glory\Services\ContentAI
 */

namespace App\Services\ContentAI;

class DraftManager
{
    // Meta keys para los posts generados por IA
    private const META_PREFIX = '_glory_ai_';
    private const META_GENERATED = '_glory_ai_generated';
    private const META_SOURCES = '_glory_ai_sources';
    private const META_PROMPT = '_glory_ai_prompt';
    private const META_MODEL = '_glory_ai_model';
    private const META_STATUS = '_glory_ai_status';
    private const META_GENERATED_AT = '_glory_ai_generated_at';

    /**
     * Crea un borrador de post desde contenido generado por IA
     * 
     * @param array $generatedContent Contenido de GeminiClient::generateArticle()
     * @param string $title Titulo del articulo
     * @param array $options Opciones adicionales (category, tags, etc)
     * @return int|WP_Error ID del post creado o error
     */
    public static function createDraft(array $generatedContent, string $title, array $options = [])
    {
        // Preparar datos del post
        $postData = [
            'post_title' => sanitize_text_field($title),
            'post_content' => wp_kses_post($generatedContent['text']),
            'post_status' => 'draft',
            'post_type' => 'post',
            'post_author' => get_current_user_id() ?: 1
        ];

        // Agregar extracto si se genera
        if (!empty($options['excerpt'])) {
            $postData['post_excerpt'] = sanitize_text_field($options['excerpt']);
        }

        // Categoria
        if (!empty($options['category'])) {
            $postData['post_category'] = is_array($options['category'])
                ? $options['category']
                : [$options['category']];
        }

        // Crear el post
        $postId = wp_insert_post($postData, true);

        if (is_wp_error($postId)) {
            return $postId;
        }

        // Guardar metadata de IA
        update_post_meta($postId, self::META_GENERATED, true);
        update_post_meta($postId, self::META_SOURCES, $generatedContent['sources'] ?? []);
        update_post_meta($postId, self::META_MODEL, $generatedContent['model'] ?? 'unknown');
        update_post_meta($postId, self::META_STATUS, 'pending_review');
        update_post_meta($postId, self::META_GENERATED_AT, current_time('mysql'));

        if (!empty($options['prompt'])) {
            update_post_meta($postId, self::META_PROMPT, $options['prompt']);
        }

        // Agregar tags si existen
        if (!empty($options['tags'])) {
            wp_set_post_tags($postId, $options['tags']);
        }

        return $postId;
    }

    /**
     * Obtiene todos los borradores generados por IA
     * 
     * @param string $status Filtrar por estado (all, pending_review, approved, rejected)
     * @param int $limit Maximo de posts a obtener
     * @return array
     */
    public static function getDrafts(string $status = 'all', int $limit = 50): array
    {
        $args = [
            'post_type' => 'post',
            'post_status' => ['draft', 'pending', 'publish'],
            'posts_per_page' => $limit,
            'meta_query' => [
                [
                    'key' => self::META_GENERATED,
                    'value' => '1',
                    'compare' => '='
                ]
            ],
            'orderby' => 'date',
            'order' => 'DESC'
        ];

        // Filtrar por estado de revision
        if ($status !== 'all') {
            $args['meta_query'][] = [
                'key' => self::META_STATUS,
                'value' => $status,
                'compare' => '='
            ];
        }

        $query = new \WP_Query($args);
        $drafts = [];

        foreach ($query->posts as $post) {
            $drafts[] = self::formatDraftForApi($post);
        }

        return $drafts;
    }

    /**
     * Obtiene un borrador por ID
     */
    public static function getDraft(int $postId): ?array
    {
        $post = get_post($postId);

        if (!$post || !get_post_meta($postId, self::META_GENERATED, true)) {
            return null;
        }

        return self::formatDraftForApi($post);
    }

    /**
     * Formatea un post para la API
     */
    private static function formatDraftForApi(\WP_Post $post): array
    {
        return [
            'id' => $post->ID,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'excerpt' => $post->post_excerpt,
            'status' => $post->post_status,
            'date' => $post->post_date,
            'editUrl' => get_edit_post_link($post->ID, 'raw'),
            'previewUrl' => get_preview_post_link($post->ID),
            'ai' => [
                'sources' => get_post_meta($post->ID, self::META_SOURCES, true) ?: [],
                'model' => get_post_meta($post->ID, self::META_MODEL, true) ?: 'unknown',
                'status' => get_post_meta($post->ID, self::META_STATUS, true) ?: 'pending_review',
                'generatedAt' => get_post_meta($post->ID, self::META_GENERATED_AT, true),
                'prompt' => get_post_meta($post->ID, self::META_PROMPT, true)
            ]
        ];
    }

    /**
     * Aprueba un borrador (cambia estado a pendiente de publicacion)
     */
    public static function approve(int $postId): bool
    {
        $post = get_post($postId);

        if (!$post || !get_post_meta($postId, self::META_GENERATED, true)) {
            return false;
        }

        // Actualizar estado del post a "pendiente"
        wp_update_post([
            'ID' => $postId,
            'post_status' => 'pending'
        ]);

        // Actualizar metadata de IA
        update_post_meta($postId, self::META_STATUS, 'approved');

        return true;
    }

    /**
     * Publica un borrador directamente
     */
    public static function publish(int $postId): bool
    {
        $post = get_post($postId);

        if (!$post || !get_post_meta($postId, self::META_GENERATED, true)) {
            return false;
        }

        // Publicar
        wp_update_post([
            'ID' => $postId,
            'post_status' => 'publish'
        ]);

        // Actualizar metadata
        update_post_meta($postId, self::META_STATUS, 'published');

        return true;
    }

    /**
     * Rechaza un borrador (lo mueve a papelera)
     */
    public static function reject(int $postId): bool
    {
        $post = get_post($postId);

        if (!$post || !get_post_meta($postId, self::META_GENERATED, true)) {
            return false;
        }

        // Mover a papelera
        wp_trash_post($postId);

        // Actualizar metadata
        update_post_meta($postId, self::META_STATUS, 'rejected');

        return true;
    }

    /**
     * Actualiza el contenido de un borrador
     */
    public static function updateContent(int $postId, string $title, string $content): bool
    {
        $post = get_post($postId);

        if (!$post || !get_post_meta($postId, self::META_GENERATED, true)) {
            return false;
        }

        $result = wp_update_post([
            'ID' => $postId,
            'post_title' => sanitize_text_field($title),
            'post_content' => wp_kses_post($content)
        ]);

        return !is_wp_error($result);
    }

    /**
     * Obtiene estadisticas de borradores
     */
    public static function getStats(): array
    {
        global $wpdb;

        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = %s AND meta_value = %s",
            self::META_GENERATED,
            '1'
        ));

        $pending = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
            INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
            WHERE pm1.meta_key = %s AND pm1.meta_value = %s
            AND pm2.meta_key = %s AND pm2.meta_value = %s",
            self::META_GENERATED,
            '1',
            self::META_STATUS,
            'pending_review'
        ));

        $approved = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
            INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
            WHERE pm1.meta_key = %s AND pm1.meta_value = %s
            AND pm2.meta_key = %s AND pm2.meta_value = %s",
            self::META_GENERATED,
            '1',
            self::META_STATUS,
            'approved'
        ));

        $published = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
            INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
            WHERE pm1.meta_key = %s AND pm1.meta_value = %s
            AND pm2.meta_key = %s AND pm2.meta_value = %s",
            self::META_GENERATED,
            '1',
            self::META_STATUS,
            'published'
        ));

        return [
            'total' => (int) $total,
            'pending' => (int) $pending,
            'approved' => (int) $approved,
            'published' => (int) $published,
            'rejected' => (int) $total - (int) $pending - (int) $approved - (int) $published
        ];
    }

    /**
     * Verifica si un post fue generado por IA
     */
    public static function isAiGenerated(int $postId): bool
    {
        return (bool) get_post_meta($postId, self::META_GENERATED, true);
    }
}
