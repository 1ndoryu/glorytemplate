<?php

/**
 * Repositorio de Notas
 *
 * Maneja la persistencia de notas del Scratchpad en la tabla wp_glory_notas.
 * Permite guardar, listar, actualizar y eliminar notas.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Database\Schema;

class NotasRepository
{
    private int $userId;

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario invalido');
        }
        $this->userId = $userId;
    }

    /**
     * Obtiene todas las notas del usuario ordenadas por fecha de modificación descendente
     * 
     * @param int $limite Cantidad máxima de notas
     * @param int $offset Offset para paginación
     * @return array
     */
    public function listar(int $limite = 50, int $offset = 0): array
    {
        global $wpdb;
        $table = Schema::getTableName('notas');

        Schema::ensureTableExists('notas');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table 
             WHERE user_id = %d
             ORDER BY fecha_modificacion DESC
             LIMIT %d OFFSET %d",
            $this->userId,
            $limite,
            $offset
        ), 'ARRAY_A');

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'titulo' => $row['titulo'],
                'contenido' => $row['contenido'],
                'fechaCreacion' => $row['fecha_creacion'],
                'fechaModificacion' => $row['fecha_modificacion']
            ];
        }, $rows ?: []);
    }

    /**
     * Cuenta el total de notas del usuario
     */
    public function contar(): int
    {
        global $wpdb;
        $table = Schema::getTableName('notas');

        return (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE user_id = %d",
            $this->userId
        ));
    }

    /**
     * Obtiene una nota específica por ID
     */
    public function obtener(int $notaId): ?array
    {
        global $wpdb;
        $table = Schema::getTableName('notas');

        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d AND user_id = %d",
            $notaId,
            $this->userId
        ), 'ARRAY_A');

        if (!$row) {
            return null;
        }

        return [
            'id' => (int)$row['id'],
            'titulo' => $row['titulo'],
            'contenido' => $row['contenido'],
            'fechaCreacion' => $row['fecha_creacion'],
            'fechaModificacion' => $row['fecha_modificacion']
        ];
    }

    /**
     * Guarda una nueva nota
     * 
     * @param string $contenido Contenido de la nota
     * @param string|null $titulo Título opcional (se genera automáticamente si no se proporciona)
     * @return array|null Nota creada o null si falla
     */
    public function guardar(string $contenido, ?string $titulo = null): ?array
    {
        global $wpdb;
        $table = Schema::getTableName('notas');

        Schema::ensureTableExists('notas');

        /* Generar título automático si no se proporciona */
        if (empty($titulo)) {
            $titulo = $this->generarTitulo($contenido);
        }

        $resultado = $wpdb->insert(
            $table,
            [
                'user_id' => $this->userId,
                'titulo' => sanitize_text_field($titulo),
                'contenido' => $contenido,
                'fecha_creacion' => current_time('mysql'),
                'fecha_modificacion' => current_time('mysql')
            ],
            ['%d', '%s', '%s', '%s', '%s']
        );

        if (!$resultado) {
            return null;
        }

        return [
            'id' => $wpdb->insert_id,
            'titulo' => $titulo,
            'contenido' => $contenido,
            'fechaCreacion' => current_time('mysql'),
            'fechaModificacion' => current_time('mysql')
        ];
    }

    /**
     * Actualiza una nota existente
     */
    public function actualizar(int $notaId, string $contenido, ?string $titulo = null): bool
    {
        global $wpdb;
        $table = Schema::getTableName('notas');

        /* Verificar que la nota pertenece al usuario */
        $notaExistente = $this->obtener($notaId);
        if (!$notaExistente) {
            return false;
        }

        /* Generar título automático si no se proporciona */
        if (empty($titulo)) {
            $titulo = $this->generarTitulo($contenido);
        }

        $resultado = $wpdb->update(
            $table,
            [
                'titulo' => sanitize_text_field($titulo),
                'contenido' => $contenido,
                'fecha_modificacion' => current_time('mysql')
            ],
            ['id' => $notaId, 'user_id' => $this->userId],
            ['%s', '%s', '%s'],
            ['%d', '%d']
        );

        return $resultado !== false;
    }

    /**
     * Elimina una nota
     */
    public function eliminar(int $notaId): bool
    {
        global $wpdb;
        $table = Schema::getTableName('notas');

        /* Verificar que la nota pertenece al usuario */
        $notaExistente = $this->obtener($notaId);
        if (!$notaExistente) {
            return false;
        }

        $resultado = $wpdb->delete(
            $table,
            ['id' => $notaId, 'user_id' => $this->userId],
            ['%d', '%d']
        );

        return (bool)$resultado;
    }

    /**
     * Busca notas por título o contenido
     */
    public function buscar(string $termino, int $limite = 20): array
    {
        global $wpdb;
        $table = Schema::getTableName('notas');

        $terminoLike = '%' . $wpdb->esc_like($termino) . '%';

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table 
             WHERE user_id = %d AND (titulo LIKE %s OR contenido LIKE %s)
             ORDER BY fecha_modificacion DESC
             LIMIT %d",
            $this->userId,
            $terminoLike,
            $terminoLike,
            $limite
        ), 'ARRAY_A');

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'titulo' => $row['titulo'],
                'contenido' => $row['contenido'],
                'fechaCreacion' => $row['fecha_creacion'],
                'fechaModificacion' => $row['fecha_modificacion']
            ];
        }, $rows ?: []);
    }

    /**
     * Genera un título automático a partir del contenido
     * Toma las primeras palabras hasta un máximo de caracteres
     */
    private function generarTitulo(string $contenido): string
    {
        /* Limpiar contenido: quitar markdown, comentarios, etc */
        $limpio = preg_replace('/^(\/\/|#|\*|>)\s*/m', '', $contenido);
        $limpio = preg_replace('/\s+/', ' ', $limpio);
        $limpio = trim($limpio);

        if (empty($limpio)) {
            return 'Nota sin título';
        }

        /* Tomar primeras palabras hasta 50 caracteres */
        $palabras = explode(' ', $limpio);
        $titulo = '';

        foreach ($palabras as $palabra) {
            if (strlen($titulo . ' ' . $palabra) > 50) {
                break;
            }
            $titulo .= ($titulo ? ' ' : '') . $palabra;
        }

        /* Si el título fue truncado, añadir puntos suspensivos */
        if (strlen($limpio) > 50) {
            $titulo .= '...';
        }

        return $titulo ?: 'Nota sin título';
    }
}
