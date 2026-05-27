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
use App\Services\UserTimeService;

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
    // sentinel-disable-next-line php-service-retorna-asociativo — FALSO POSITIVO: array_values() re-indexa a secuencial
    public function getAll(): array
    {
        global $wpdb;
        $table = Schema::getTableName('habitos');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        if (!empty($rows)) {
            $hoyUsuario = UserTimeService::today($this->userId);
            $habitos = array_map(function ($row) use ($hoyUsuario) {
                $data = $this->decodeData($row['data'], null);
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                    /* [135A-H1+125A-RT] Recomputar completadoHoy al leer evita datos stale.
                     * Gotcha: la fecha correcta no es la timezone de WordPress sino la local del usuario. */
                    $uc = $data['ultimoCompletado'] ?? '';
                    $enHistorial = in_array($hoyUsuario, (array)($data['historialCompletados'] ?? []), true);
                    $data['completadoHoy'] = ($uc === $hoyUsuario || $enHistorial) ? 1 : 0;
                }
                return $data;
            }, $rows);

            $habitos = array_values(array_filter($habitos, fn($h) => $h !== null && is_array($h)));
            /* [044A-27] Dedup subhábitos por nombre al leer de BD.
             * Previene que el cliente reciba duplicados aunque estén guardados. */
            return array_map([$this, 'dedupSubhabitos'], $habitos);
        }

        /* Fallback: migrar desde user_meta si existe */
        $metaData = get_user_meta($this->userId, self::META_HABITOS, true);
        if (!empty($metaData)) {
            $habitos = $this->decodeData($metaData, []);
            if (!empty($habitos)) {
                // sentinel-disable-next-line retorno-ignorado-repo — migracion fallback, reintenta en siguiente getAll()
                $this->saveAll($habitos);
                delete_user_meta($this->userId, self::META_HABITOS);
                return $habitos;
            }
        }

        return [];
    }

    /**
     * Guarda los hábitos (Upsert + Soft Delete opcional)
     *
     * @param array $habitos Lista de hábitos a guardar
     * @param bool $partialUpdate Si es true, NO borra los hábitos que faltan (modo incremental)
     */
    public function saveAll(array $habitos, bool $partialUpdate = false): bool
    {
        global $wpdb;
        $table = Schema::getTableName('habitos');
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
        $hoyUsuario = UserTimeService::today($this->userId);

        foreach ($habitos as $habito) {
            if (!isset($habito['id'])) continue;

            /* [044A-27] Dedup subhábitos antes de persistir */
            $habito = $this->dedupSubhabitos($habito);

            $idLocal = (int)$habito['id'];
            $incomingIds[] = $idLocal;

            $nombreOriginal = sanitize_text_field($habito['nombre'] ?? '');
            $nombre = $this->cifradoHabilitado ? '[CIFRADO]' : $nombreOriginal;

            $frecuenciaData = $habito['frecuencia'] ?? null;
            $frecuencia = is_array($frecuenciaData) ? ($frecuenciaData['tipo'] ?? 'diario') : 'diario';
            /* [125A-RT] Usar fecha local por usuario, no timezone global de WordPress.
             * WhatsApp y dashboard comparten hábitos; la fecha debe ser la del usuario real. */
            $completadoHoy = isset($habito['ultimoCompletado']) && $habito['ultimoCompletado'] === $hoyUsuario ? 1 : 0;

            $exists = $existingMap[$idLocal] ?? null;

            /* [014A-19] Protección per-entity contra writes stale.
             * Si el hábito entrante tiene updatedAt menor al existente en BD,
             * el dato es antiguo y se descarta para no sobrescribir cambios más recientes. */
            if ($exists && isset($existingDataMap[$idLocal]) && is_array($existingDataMap[$idLocal])) {
                $incomingUpdatedAt = $habito['updatedAt'] ?? 0;
                $existingUpdatedAt = $existingDataMap[$idLocal]['updatedAt'] ?? 0;
                if ($incomingUpdatedAt > 0 && $existingUpdatedAt > 0 && $incomingUpdatedAt < $existingUpdatedAt) {
                    continue;
                }
            }

            $dataJson = $this->encodeData($habito);

            if ($exists) {
                $toUpdate[] = [
                    'id' => $exists,
                    'nombre' => $nombre,
                    'frecuencia_tipo' => $frecuencia,
                    'completado_hoy' => $completadoHoy,
                    'data' => $dataJson,
                ];
            } else {
                $toInsert[] = [
                    'user_id' => $this->userId,
                    'id_local' => $idLocal,
                    'nombre' => $nombre,
                    'frecuencia_tipo' => $frecuencia,
                    'completado_hoy' => $completadoHoy,
                    'fecha_creacion' => $now,
                    'data' => $dataJson,
                ];
            }
        }

        /* Batch UPDATE con CASE — single prepare para evitar N+1 */
        if (!empty($toUpdate)) {
            $ids = array_column($toUpdate, 'id');
            $caseNombre = '';
            $caseFrecuencia = '';
            $caseCompletado = '';
            $caseData = '';
            $nombreParams = [];
            $frecuenciaParams = [];
            $completadoParams = [];
            $dataParams = [];

            foreach ($toUpdate as $item) {
                $caseNombre .= ' WHEN id = %d THEN %s';
                $nombreParams[] = $item['id'];
                $nombreParams[] = $item['nombre'];

                $caseFrecuencia .= ' WHEN id = %d THEN %s';
                $frecuenciaParams[] = $item['id'];
                $frecuenciaParams[] = $item['frecuencia_tipo'];

                $caseCompletado .= ' WHEN id = %d THEN %d';
                $completadoParams[] = $item['id'];
                $completadoParams[] = $item['completado_hoy'];

                $caseData .= ' WHEN id = %d THEN %s';
                $dataParams[] = $item['id'];
                $dataParams[] = $item['data'];
            }

            $idsPlaceholders = implode(',', array_fill(0, count($ids), '%d'));
            $allParams = array_merge(
                $nombreParams,
                $frecuenciaParams,
                $completadoParams,
                $dataParams,
                [$now],
                $ids
            );
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET
                    nombre = CASE $caseNombre END,
                    frecuencia_tipo = CASE $caseFrecuencia END,
                    completado_hoy = CASE $caseCompletado END,
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
                $valuePlaceholders[] = '(%d, %d, %s, %s, %d, %s, %s)';
                $insertParams[] = $row['user_id'];
                $insertParams[] = $row['id_local'];
                $insertParams[] = $row['nombre'];
                $insertParams[] = $row['frecuencia_tipo'];
                $insertParams[] = $row['completado_hoy'];
                $insertParams[] = $row['fecha_creacion'];
                $insertParams[] = $row['data'];
            }
            $valuesSQL = implode(', ', $valuePlaceholders);
            $wpdb->query($wpdb->prepare(
                "INSERT INTO $table (user_id, id_local, nombre, frecuencia_tipo, completado_hoy, fecha_creacion, data) VALUES $valuesSQL",
                ...$insertParams
            ));
        }

        /* Soft Delete para los que ya no vienen (Solo si NO es actualizacion parcial) */
        if (!$partialUpdate) {
            /* [275A-1] Solución 6: Sanity check — si incomingIds está vacío pero había
             * registros existentes, abortar para prevenir wipeout accidental. */
            if (count($existingIds) > 5 && count($incomingIds) === 0) {
                error_log("[HabitosRepo] ABORTADO: saveAll() intentó eliminar TODOS los registros (count=" . count($existingIds) . "). userId={$this->userId}");
                return false;
            }
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
     * Elimina todos los hábitos del usuario
     */
    public function deleteAll(): bool
    {
        global $wpdb;
        // sentinel-disable-next-line retorno-ignorado-repo — cleanup completo, retorna true
        $wpdb->delete(Schema::getTableName('habitos'), ['user_id' => $this->userId]);
        return true;
    }

    /* [044A-27] Deduplicar subhábitos por nombre (normalizado a lowercase trim).
     * Conserva el primero con cada nombre, descarta el resto.
     * Previene que IDs únicos pero nombres idénticos persistan como duplicados. */
    private function dedupSubhabitos(array $habito): array
    {
        if (empty($habito['subhabitos']) || !is_array($habito['subhabitos'])) {
            return $habito;
        }
        $nombresVistos = [];
        $limpio = [];
        foreach ($habito['subhabitos'] as $sh) {
            if (!is_array($sh)) continue;
            $nombre = isset($sh['nombre']) ? trim((string)$sh['nombre']) : '';
            if ($nombre === '') continue;
            $norm = mb_strtolower($nombre);
            if (isset($nombresVistos[$norm])) continue;
            $nombresVistos[$norm] = true;
            $limpio[] = $sh;
        }
        if (count($limpio) === count($habito['subhabitos'])) {
            return $habito;
        }
        $habito['subhabitos'] = array_values($limpio);
        return $habito;
    }
}
