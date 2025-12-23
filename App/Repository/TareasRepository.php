<?php

/**
 * Repositorio de Tareas
 *
 * Maneja la persistencia de tareas en la tabla wp_glory_tareas.
 * Soporta migración desde user_meta y cifrado E2E.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Database\Schema;
use App\Repository\Traits\CifradoTrait;

class TareasRepository
{
    use CifradoTrait;

    private const META_TAREAS = '_glory_dashboard_tareas';

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario invalido');
        }
        $this->userId = $userId;
        $this->inicializarCifrado();
    }

    /**
     * Obtiene las tareas del usuario (SQL con fallback)
     */
    public function getAll(): array
    {
        global $wpdb;
        $table = Schema::getTableName('tareas');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        if (!empty($rows)) {
            $tareas = array_map(function ($row) {
                $data = $this->decodeData($row['data'], null);
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);

            return array_values(array_filter($tareas, fn($t) => $t !== null && is_array($t)));
        }

        /* Fallback: migrar desde user_meta */
        $metaData = get_user_meta($this->userId, self::META_TAREAS, true);
        if (!empty($metaData)) {
            $tareas = $this->decodeData($metaData, []);
            if (!empty($tareas)) {
                $this->saveAll($tareas);
                delete_user_meta($this->userId, self::META_TAREAS);
                return $tareas;
            }
        }

        return [];
    }

    /**
     * Guarda las tareas (Upsert + Soft Delete)
     */
    public function saveAll(array $tareas): bool
    {
        global $wpdb;
        $table = Schema::getTableName('tareas');
        $now = current_time('mysql');

        $existingIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ));

        $incomingIds = [];

        foreach ($tareas as $tarea) {
            if (!isset($tarea['id'])) continue;

            $idLocal = (int)$tarea['id'];
            $incomingIds[] = $idLocal;

            $textoOriginal = sanitize_text_field($tarea['texto'] ?? '');
            $texto = $this->cifradoHabilitado ? '[CIFRADO]' : $textoOriginal;

            $completada = !empty($tarea['completada']) ? 1 : 0;
            $proyectoId = isset($tarea['proyectoId']) ? (int)$tarea['proyectoId'] : null;
            $padreId = isset($tarea['padreId']) ? (int)$tarea['padreId'] : null;
            $prioridad = $tarea['prioridad'] ?? null;

            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE user_id = %d AND id_local = %d",
                $this->userId,
                $idLocal
            ));

            $dataJson = $this->encodeData($tarea);

            if ($exists) {
                $wpdb->update(
                    $table,
                    [
                        'texto' => $texto,
                        'completada' => $completada,
                        'proyecto_id' => $proyectoId,
                        'padre_id' => $padreId,
                        'prioridad' => $prioridad,
                        'data' => $dataJson,
                        'deleted_at' => null,
                        'updated_at' => $now
                    ],
                    ['id' => $exists],
                    ['%s', '%d', '%d', '%d', '%s', '%s', '%s', '%s'],
                    ['%d']
                );
            } else {
                $wpdb->insert(
                    $table,
                    [
                        'user_id' => $this->userId,
                        'id_local' => $idLocal,
                        'texto' => $texto,
                        'completada' => $completada,
                        'proyecto_id' => $proyectoId,
                        'padre_id' => $padreId,
                        'prioridad' => $prioridad,
                        'data' => $dataJson
                    ],
                    ['%d', '%d', '%s', '%d', '%d', '%d', '%s', '%s']
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
     * Elimina todas las tareas del usuario
     */
    public function deleteAll(): bool
    {
        global $wpdb;
        $wpdb->delete(Schema::getTableName('tareas'), ['user_id' => $this->userId]);
        return true;
    }
}
