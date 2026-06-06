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
use App\Repository\CifradoTrait;

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
    // sentinel-disable-next-line php-service-retorna-asociativo — FALSO POSITIVO: array_values() re-indexa a secuencial
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
                $resultado = $this->saveAll($tareas);
                if ($resultado) {
                    delete_user_meta($this->userId, self::META_TAREAS);
                }
                return $tareas;
            }
        }

        return [];
    }

    /**
     * Guarda las tareas (Upsert + Soft Delete opcional)
     * 
     * @param array $tareas Lista de tareas a guardar
     * @param bool $partialUpdate Si es true, NO borra las tareas que faltan en la lista (modo incremental)
     */
    public function saveAll(array $tareas, bool $partialUpdate = false): bool
    {
        global $wpdb;
        $table = Schema::getTableName('tareas');
        $now = current_time('mysql');

        // Solo necesitamos obtener IDs existentes si vamos a borrar los que faltan
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
        /* [014A-4] Mapa de datos existentes para merge defensivo.
         * Si llegan datos parciales (ej: solo prioridad via WS), los campos
         * existentes (texto, configuracion, etc.) no se pierden. */
        $existingDataMap = [];
        foreach ($existingRows as $row) {
            $existingMap[(int)$row['id_local']] = (int)$row['id'];
            $existingDataMap[(int)$row['id_local']] = $this->decodeData($row['data'], []);
        }

        $incomingIds = [];
        $toUpdate = [];
        $toInsert = [];

        foreach ($tareas as $tarea) {
            if (!isset($tarea['id'])) continue;

            $idLocal = (int)$tarea['id'];
            $incomingIds[] = $idLocal;

            /* [014A-4] Merge defensivo: si la tarea ya existe en BD, fusionar
             * datos existentes con los entrantes. Esto previene pérdida de campos
             * (ej: texto) cuando llegan actualizaciones parciales via WebSocket. */
            $exists = $existingMap[$idLocal] ?? null;
            if ($exists && isset($existingDataMap[$idLocal]) && is_array($existingDataMap[$idLocal])) {
                /* [014A-19] Protección per-entity contra writes stale.
                 * Si la tarea entrante tiene updatedAt y es ANTERIOR al existente en BD,
                 * significa que otro dispositivo ya escribió datos más recientes.
                 * En ese caso, descartamos la tarea entrante (datos stale). */
                $incomingUpdatedAt = $tarea['updatedAt'] ?? 0;
                $existingUpdatedAt = $existingDataMap[$idLocal]['updatedAt'] ?? 0;
                if ($incomingUpdatedAt > 0 && $existingUpdatedAt > 0 && $incomingUpdatedAt < $existingUpdatedAt) {
                    /* Skip: incoming data is older than what's in DB */
                    $incomingIds[] = $idLocal;
                    continue;
                }

                $tarea = array_merge($existingDataMap[$idLocal], $tarea);
            }

            $textoOriginal = sanitize_text_field($tarea['texto'] ?? '');
            $texto = $this->cifradoHabilitado ? '[CIFRADO]' : $textoOriginal;

            $completada = !empty($tarea['completado']) ? 1 : 0;
            $proyectoId = isset($tarea['proyectoId']) ? (int)$tarea['proyectoId'] : null;
            $padreId = isset($tarea['parentId']) ? (int)$tarea['parentId'] : null;
            $prioridad = $tarea['prioridad'] ?? null;
            $urgencia = $tarea['urgencia'] ?? 'normal';

            /* Validar valores de urgencia */
            $urgenciasValidas = ['bloqueante', 'urgente', 'normal', 'chill'];
            if (!in_array($urgencia, $urgenciasValidas)) {
                $urgencia = 'normal';
            }

            $dataJson = $this->encodeData($tarea);

            if ($exists) {
                $toUpdate[] = [
                    'id' => $exists,
                    'texto' => $texto,
                    'completada' => $completada,
                    'proyecto_id' => $proyectoId,
                    'padre_id' => $padreId,
                    'prioridad' => $prioridad,
                    'urgencia' => $urgencia,
                    'data' => $dataJson
                ];
            } else {
                $toInsert[] = [
                    'user_id' => $this->userId,
                    'id_local' => $idLocal,
                    'texto' => $texto,
                    'completada' => $completada,
                    'proyecto_id' => $proyectoId,
                    'padre_id' => $padreId,
                    'prioridad' => $prioridad,
                    'urgencia' => $urgencia,
                    'data' => $dataJson
                ];
            }
        }

        /* Batch UPDATE con CASE — single prepare para evitar N+1 */
        if (!empty($toUpdate)) {
            $ids = array_column($toUpdate, 'id');
            $caseTexto = '';
            $caseCompletada = '';
            $caseProyecto = '';
            $casePadre = '';
            $casePrioridad = '';
            $caseUrgencia = '';
            $caseData = '';
            $textoParams = [];
            $completadaParams = [];
            $proyectoParams = [];
            $padreParams = [];
            $prioridadParams = [];
            $urgenciaParams = [];
            $dataParams = [];

            foreach ($toUpdate as $item) {
                $caseTexto .= ' WHEN id = %d THEN %s';
                $textoParams[] = $item['id'];
                $textoParams[] = $item['texto'];

                $caseCompletada .= ' WHEN id = %d THEN %d';
                $completadaParams[] = $item['id'];
                $completadaParams[] = $item['completada'];

                /* proyecto_id — nullable */
                if ($item['proyecto_id'] === null) {
                    $caseProyecto .= ' WHEN id = %d THEN NULL';
                    $proyectoParams[] = $item['id'];
                } else {
                    $caseProyecto .= ' WHEN id = %d THEN %d';
                    $proyectoParams[] = $item['id'];
                    $proyectoParams[] = $item['proyecto_id'];
                }

                /* padre_id — nullable */
                if ($item['padre_id'] === null) {
                    $casePadre .= ' WHEN id = %d THEN NULL';
                    $padreParams[] = $item['id'];
                } else {
                    $casePadre .= ' WHEN id = %d THEN %d';
                    $padreParams[] = $item['id'];
                    $padreParams[] = $item['padre_id'];
                }

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
                $textoParams,
                $completadaParams,
                $proyectoParams,
                $padreParams,
                $prioridadParams,
                $urgenciaParams,
                $dataParams,
                [$now],
                $ids
            );
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET
                    texto = CASE $caseTexto END,
                    completada = CASE $caseCompletada END,
                    proyecto_id = CASE $caseProyecto END,
                    padre_id = CASE $casePadre END,
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
                $rowParts = ['%d', '%d', '%s', '%d'];
                $insertParams[] = $row['user_id'];
                $insertParams[] = $row['id_local'];
                $insertParams[] = $row['texto'];
                $insertParams[] = $row['completada'];

                /* proyecto_id — nullable */
                if ($row['proyecto_id'] === null) {
                    $rowParts[] = 'NULL';
                } else {
                    $rowParts[] = '%d';
                    $insertParams[] = $row['proyecto_id'];
                }

                /* padre_id — nullable */
                if ($row['padre_id'] === null) {
                    $rowParts[] = 'NULL';
                } else {
                    $rowParts[] = '%d';
                    $insertParams[] = $row['padre_id'];
                }

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
                "INSERT INTO $table (user_id, id_local, texto, completada, proyecto_id, padre_id, prioridad, urgencia, data) VALUES $valuesSQL",
                ...$insertParams
            ));
        }

        /* Soft Delete (Solo si NO es actualizacion parcial) */
        if (!$partialUpdate) {
            /* [066A-1] Sanity check eliminado: el guard frontal (esProbableWipeout en
             * useSyncManager) ya previene envíos accidentales de arrays vacíos.
             * El check anterior (count>5 && incoming=0) bloqueaba eliminaciones
             * legítimas del usuario, causando save_error 500 y reaparición de
             * tareas al recargar (localStorage conservaba datos stale). */
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
     * Elimina todas las tareas del usuario
     */
    public function deleteAll(): bool
    {
        global $wpdb;
        $resultado = $wpdb->delete(Schema::getTableName('tareas'), ['user_id' => $this->userId]);
        return $resultado !== false;
    }
}
