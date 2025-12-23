<?php

/**
 * Repositorio de Proyectos
 *
 * Maneja la persistencia de proyectos en la tabla wp_glory_proyectos.
 * Soporta migración desde user_meta y cifrado E2E.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Database\Schema;
use App\Repository\CifradoTrait;

class ProyectosRepository
{
    use CifradoTrait;

    private const META_PROYECTOS = '_glory_dashboard_proyectos';

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario invalido');
        }
        $this->userId = $userId;
        $this->inicializarCifrado();
    }

    /**
     * Obtiene los proyectos del usuario (SQL con fallback)
     */
    public function getAll(): array
    {
        global $wpdb;
        $table = Schema::getTableName('proyectos');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        if (!empty($rows)) {
            $proyectos = array_map(function ($row) {
                $data = $this->decodeData($row['data'], null);
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);

            return array_values(array_filter($proyectos, fn($p) => $p !== null && is_array($p)));
        }

        /* Fallback: migrar desde user_meta */
        $metaData = get_user_meta($this->userId, self::META_PROYECTOS, true);
        if (!empty($metaData)) {
            $proyectos = $this->decodeData($metaData, []);
            if (!empty($proyectos)) {
                $this->saveAll($proyectos);
                delete_user_meta($this->userId, self::META_PROYECTOS);
                return $proyectos;
            }
        }

        return [];
    }

    /**
     * Guarda los proyectos (Upsert + Soft Delete)
     */
    public function saveAll(array $proyectos): bool
    {
        global $wpdb;
        $table = Schema::getTableName('proyectos');
        $now = current_time('mysql');

        $existingIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ));

        $incomingIds = [];

        foreach ($proyectos as $proyecto) {
            if (!isset($proyecto['id'])) continue;

            $idLocal = (int)$proyecto['id'];
            $incomingIds[] = $idLocal;

            $nombreOriginal = sanitize_text_field($proyecto['nombre'] ?? '');
            $nombre = $this->cifradoHabilitado ? '[CIFRADO]' : $nombreOriginal;

            $estado = $proyecto['estado'] ?? 'activo';
            $prioridad = $proyecto['prioridad'] ?? null;

            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE user_id = %d AND id_local = %d",
                $this->userId,
                $idLocal
            ));

            $dataJson = $this->encodeData($proyecto);

            if ($exists) {
                $wpdb->update(
                    $table,
                    [
                        'nombre' => $nombre,
                        'estado' => $estado,
                        'prioridad' => $prioridad,
                        'data' => $dataJson,
                        'deleted_at' => null,
                        'updated_at' => $now
                    ],
                    ['id' => $exists],
                    ['%s', '%s', '%s', '%s', '%s', '%s'],
                    ['%d']
                );
            } else {
                $wpdb->insert(
                    $table,
                    [
                        'user_id' => $this->userId,
                        'id_local' => $idLocal,
                        'nombre' => $nombre,
                        'estado' => $estado,
                        'prioridad' => $prioridad,
                        'data' => $dataJson
                    ],
                    ['%d', '%d', '%s', '%s', '%s', '%s']
                );
            }
        }

        /* Soft Delete */
        $toDelete = array_diff($existingIds, $incomingIds);
        if (!empty($toDelete)) {
            $idsList = implode(',', array_map('intval', $toDelete));
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET deleted_at = %s WHERE user_id = %d AND id_local IN ($idsList)",
                $now,
                $this->userId
            ));
        }

        return true;
    }

    /**
     * Elimina todos los proyectos del usuario
     */
    public function deleteAll(): bool
    {
        global $wpdb;
        $wpdb->delete(Schema::getTableName('proyectos'), ['user_id' => $this->userId]);
        return true;
    }
}
