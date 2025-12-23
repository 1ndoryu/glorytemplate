<?php

/**
 * Repositorio de Hábitos
 *
 * Maneja la persistencia de hábitos en la tabla wp_glory_habitos.
 * Soporta migración desde user_meta y cifrado E2E.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Database\Schema;
use App\Repository\CifradoTrait;

class HabitosRepository
{
    use CifradoTrait;

    private const META_HABITOS = '_glory_dashboard_habitos';

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario invalido');
        }
        $this->userId = $userId;
        $this->inicializarCifrado();
    }

    /**
     * Obtiene los hábitos del usuario (SQL con fallback a Meta)
     */
    public function getAll(): array
    {
        global $wpdb;
        $table = Schema::getTableName('habitos');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        if (!empty($rows)) {
            $habitos = array_map(function ($row) {
                $data = $this->decodeData($row['data'], null);
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);

            return array_values(array_filter($habitos, fn($h) => $h !== null && is_array($h)));
        }

        /* Fallback: migrar desde user_meta si existe */
        $metaData = get_user_meta($this->userId, self::META_HABITOS, true);
        if (!empty($metaData)) {
            $habitos = $this->decodeData($metaData, []);
            if (!empty($habitos)) {
                $this->saveAll($habitos);
                delete_user_meta($this->userId, self::META_HABITOS);
                return $habitos;
            }
        }

        return [];
    }

    /**
     * Guarda los hábitos (Sincronización total: Upsert + Soft Delete)
     */
    public function saveAll(array $habitos): bool
    {
        global $wpdb;
        $table = Schema::getTableName('habitos');
        $now = current_time('mysql');

        $existingIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ));

        $incomingIds = [];

        foreach ($habitos as $habito) {
            if (!isset($habito['id'])) continue;

            $idLocal = (int)$habito['id'];
            $incomingIds[] = $idLocal;

            $nombreOriginal = sanitize_text_field($habito['nombre'] ?? '');
            $nombre = $this->cifradoHabilitado ? '[CIFRADO]' : $nombreOriginal;

            $frecuenciaData = $habito['frecuencia'] ?? null;
            $frecuencia = is_array($frecuenciaData) ? ($frecuenciaData['tipo'] ?? 'diario') : 'diario';
            $completadoHoy = isset($habito['ultimoCompletado']) && $habito['ultimoCompletado'] === date('Y-m-d') ? 1 : 0;

            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE user_id = %d AND id_local = %d",
                $this->userId,
                $idLocal
            ));

            $dataJson = $this->encodeData($habito);

            if ($exists) {
                $wpdb->update(
                    $table,
                    [
                        'nombre' => $nombre,
                        'frecuencia_tipo' => $frecuencia,
                        'completado_hoy' => $completadoHoy,
                        'data' => $dataJson,
                        'deleted_at' => null,
                        'updated_at' => $now
                    ],
                    ['id' => $exists],
                    ['%s', '%s', '%d', '%s', '%s', '%s'],
                    ['%d']
                );
            } else {
                $wpdb->insert(
                    $table,
                    [
                        'user_id' => $this->userId,
                        'id_local' => $idLocal,
                        'nombre' => $nombre,
                        'frecuencia_tipo' => $frecuencia,
                        'completado_hoy' => $completadoHoy,
                        'fecha_creacion' => $now,
                        'data' => $dataJson
                    ],
                    ['%d', '%d', '%s', '%s', '%d', '%s', '%s']
                );
            }
        }

        /* Soft Delete para los que ya no vienen */
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
     * Elimina todos los hábitos del usuario
     */
    public function deleteAll(): bool
    {
        global $wpdb;
        $wpdb->delete(Schema::getTableName('habitos'), ['user_id' => $this->userId]);
        return true;
    }
}
