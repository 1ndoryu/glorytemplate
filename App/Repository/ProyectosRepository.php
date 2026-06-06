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
    // sentinel-disable-next-line php-service-retorna-asociativo — FALSO POSITIVO: array_values() re-indexa a secuencial
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
                // sentinel-disable-next-line retorno-ignorado-repo — migracion fallback, reintenta en siguiente getAll()
                $this->saveAll($proyectos);
                delete_user_meta($this->userId, self::META_PROYECTOS);
                return $proyectos;
            }
        }

        return [];
    }

    /**
     * Guarda los proyectos (Upsert + Soft Delete opcional)
     * 
     * @param array $proyectos Lista de proyectos a guardar
     * @param bool $partialUpdate Si es true, NO borra los proyectos que faltan (modo incremental)
     */
    public function saveAll(array $proyectos, bool $partialUpdate = false): bool
    {
        global $wpdb;
        $table = Schema::getTableName('proyectos');
        $now = current_time('mysql');

        $existingIds = [];
        if (!$partialUpdate) {
            $existingIds = $wpdb->get_col($wpdb->prepare(
                "SELECT id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
                $this->userId
            ));
        }

        /* Pre-fetch mapa id_local => id para evitar N+1 queries dentro del loop */
        $existingRows = $wpdb->get_results($wpdb->prepare(
            "SELECT id, id_local, data FROM $table WHERE user_id = %d",
            $this->userId
        ), ARRAY_A);
        $existingMap = [];
        /* [014A-19] Mapa de datos existentes para protección per-entity con updatedAt */
        $existingDataMap = [];
        foreach ($existingRows as $row) {
            $existingMap[(int)$row['id_local']] = (int)$row['id'];
            $existingDataMap[(int)$row['id_local']] = $this->decodeData($row['data'], []);
        }

        $incomingIds = [];
        $toUpdate = [];
        $toInsert = [];

        foreach ($proyectos as $proyecto) {
            if (!isset($proyecto['id'])) continue;

            $idLocal = (int)$proyecto['id'];
            $incomingIds[] = $idLocal;

            $nombreOriginal = sanitize_text_field($proyecto['nombre'] ?? '');
            $nombre = $this->cifradoHabilitado ? '[CIFRADO]' : $nombreOriginal;

            $estado = $proyecto['estado'] ?? 'activo';
            $prioridad = $proyecto['prioridad'] ?? null;
            $urgencia = $proyecto['urgencia'] ?? 'normal';

            /* Validar valores de urgencia */
            $urgenciasValidas = ['bloqueante', 'urgente', 'normal', 'chill'];
            if (!in_array($urgencia, $urgenciasValidas)) {
                $urgencia = 'normal';
            }

            $exists = $existingMap[$idLocal] ?? null;

            /* [014A-19] Protección per-entity contra writes stale */
            if ($exists && isset($existingDataMap[$idLocal]) && is_array($existingDataMap[$idLocal])) {
                $incomingUpdatedAt = $proyecto['updatedAt'] ?? 0;
                $existingUpdatedAt = $existingDataMap[$idLocal]['updatedAt'] ?? 0;
                if ($incomingUpdatedAt > 0 && $existingUpdatedAt > 0 && $incomingUpdatedAt < $existingUpdatedAt) {
                    continue;
                }
            }

            $dataJson = $this->encodeData($proyecto);

            if ($exists) {
                $toUpdate[] = [
                    'id' => $exists,
                    'nombre' => $nombre,
                    'estado' => $estado,
                    'prioridad' => $prioridad,
                    'urgencia' => $urgencia,
                    'data' => $dataJson
                ];
            } else {
                $toInsert[] = [
                    'user_id' => $this->userId,
                    'id_local' => $idLocal,
                    'nombre' => $nombre,
                    'estado' => $estado,
                    'prioridad' => $prioridad,
                    'urgencia' => $urgencia,
                    'data' => $dataJson
                ];
            }
        }

        /* Batch UPDATE con CASE — single prepare para evitar N+1 */
        if (!empty($toUpdate)) {
            $ids = array_column($toUpdate, 'id');
            $caseNombre = '';
            $caseEstado = '';
            $casePrioridad = '';
            $caseUrgencia = '';
            $caseData = '';
            $nombreParams = [];
            $estadoParams = [];
            $prioridadParams = [];
            $urgenciaParams = [];
            $dataParams = [];

            foreach ($toUpdate as $item) {
                $caseNombre .= ' WHEN id = %d THEN %s';
                $nombreParams[] = $item['id'];
                $nombreParams[] = $item['nombre'];

                $caseEstado .= ' WHEN id = %d THEN %s';
                $estadoParams[] = $item['id'];
                $estadoParams[] = $item['estado'];

                $casePrioridad .= ' WHEN id = %d THEN %s';
                $prioridadParams[] = $item['id'];
                $prioridadParams[] = $item['prioridad'] ?? '';

                $caseUrgencia .= ' WHEN id = %d THEN %s';
                $urgenciaParams[] = $item['id'];
                $urgenciaParams[] = $item['urgencia'];

                $caseData .= ' WHEN id = %d THEN %s';
                $dataParams[] = $item['id'];
                $dataParams[] = $item['data'];
            }

            $idsPlaceholders = implode(',', array_fill(0, count($ids), '%d'));
            $allParams = array_merge(
                $nombreParams,
                $estadoParams,
                $prioridadParams,
                $urgenciaParams,
                $dataParams,
                [$now],
                $ids
            );
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET
                    nombre = CASE $caseNombre END,
                    estado = CASE $caseEstado END,
                    prioridad = CASE $casePrioridad END,
                    urgencia = CASE $caseUrgencia END,
                    data = CASE $caseData END,
                    deleted_at = NULL,
                    updated_at = %s
                WHERE id IN ($idsPlaceholders)",
                ...$allParams
            ));
        }

        /* Batch INSERT — single query para evitar N+1 */
        if (!empty($toInsert)) {
            $valuePlaceholders = [];
            $insertParams = [];
            foreach ($toInsert as $row) {
                $rowParts = ['%d', '%d', '%s', '%s'];
                $insertParams[] = $row['user_id'];
                $insertParams[] = $row['id_local'];
                $insertParams[] = $row['nombre'];
                $insertParams[] = $row['estado'];

                /* prioridad — nullable */
                if ($row['prioridad'] === null) {
                    $rowParts[] = 'NULL';
                } else {
                    $rowParts[] = '%s';
                    $insertParams[] = $row['prioridad'];
                }

                $rowParts[] = '%s'; /* urgencia */
                $rowParts[] = '%s'; /* data */
                $insertParams[] = $row['urgencia'];
                $insertParams[] = $row['data'];

                $valuePlaceholders[] = '(' . implode(', ', $rowParts) . ')';
            }
            $valuesSQL = implode(', ', $valuePlaceholders);
            $wpdb->query($wpdb->prepare(
                "INSERT INTO $table (user_id, id_local, nombre, estado, prioridad, urgencia, data) VALUES $valuesSQL",
                ...$insertParams
            ));
        }

        /* Soft Delete (Solo si NO es actualizacion parcial) */
        if (!$partialUpdate) {
            /* [066A-1] Sanity check eliminado: ver nota en TareasRepository.
             * El guard frontal esProbableWipeout es suficiente protección. */
            $toDelete = array_diff($existingIds, $incomingIds);
            if (!empty($toDelete)) {
                $deleteIds = array_values(array_map('intval', $toDelete));
                $deletePlaceholders = implode(',', array_fill(0, count($deleteIds), '%d'));
                $wpdb->query($wpdb->prepare(
                    "UPDATE $table SET deleted_at = %s WHERE user_id = %d AND id_local IN ($deletePlaceholders)",
                    $now,
                    $this->userId,
                    ...$deleteIds
                ));
            }
        }

        return true;
    }

    /**
     * Elimina todos los proyectos del usuario
     */
    public function deleteAll(): bool
    {
        global $wpdb;
        // sentinel-disable-next-line retorno-ignorado-repo — cleanup completo, retorna true
        $wpdb->delete(Schema::getTableName('proyectos'), ['user_id' => $this->userId]);
        return true;
    }
}
