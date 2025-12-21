<?php

/**
 * Dashboard Repository
 *
 * Capa de acceso a datos para el dashboard de productividad.
 * Maneja la persistencia en tablas SQL personalizadas (wp_glory_*)
 * con fallback y migración automática desde user_meta.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Database\Schema;

class DashboardRepository
{
    private int $userId;

    /* Meta keys (Mantenidos para configuración, sync y migración) */
    private const META_HABITOS = '_glory_dashboard_habitos';
    private const META_TAREAS = '_glory_dashboard_tareas';
    private const META_PROYECTOS = '_glory_dashboard_proyectos';
    private const META_NOTAS = '_glory_dashboard_notas';
    private const META_CONFIG = '_glory_dashboard_config';
    private const META_SYNC = '_glory_dashboard_sync';
    private const META_CHANGELOG = '_glory_dashboard_changelog';

    /* Versión del esquema de datos */
    private const SCHEMA_VERSION = '1.0.0';

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario inválido');
        }
        $this->userId = $userId;
    }

    /**
     * Carga todos los datos del dashboard
     */
    public function loadAll(): array
    {
        return [
            'version' => self::SCHEMA_VERSION,
            'habitos' => $this->getHabitos(),
            'tareas' => $this->getTareas(),
            'proyectos' => $this->getProyectos(),
            'notas' => $this->getNotas(),
            'configuracion' => $this->getConfiguracion(),
            'ultimaActualizacion' => $this->getLastUpdate(),
        ];
    }

    /**
     * Guarda todos los datos del dashboard
     */
    public function saveAll(array $data): bool
    {
        $timestamp = time() * 1000;
        $results = [];

        /* Usamos transacciones si es posible, aunque MyISAM no lo soporta, InnoDB sí */
        global $wpdb;
        $wpdb->query('START TRANSACTION');

        try {
            if (isset($data['habitos'])) {
                $res = $this->setHabitos($data['habitos']);
                $results['habitos'] = $res;
                error_log("[DashboardRepo] setHabitos: " . ($res ? 'OK' : 'FAIL'));
            }

            if (isset($data['tareas'])) {
                $res = $this->setTareas($data['tareas']);
                $results['tareas'] = $res;
                error_log("[DashboardRepo] setTareas: " . ($res ? 'OK' : 'FAIL'));
            }

            if (isset($data['proyectos'])) {
                $res = $this->setProyectos($data['proyectos']);
                $results['proyectos'] = $res;
                error_log("[DashboardRepo] setProyectos: " . ($res ? 'OK' : 'FAIL'));
            }

            if (isset($data['notas'])) {
                $res = $this->setNotas($data['notas']);
                $results['notas'] = $res;
                error_log("[DashboardRepo] setNotas: " . ($res ? 'OK' : 'FAIL'));
            }

            if (isset($data['configuracion'])) {
                $res = $this->setConfiguracion($data['configuracion']);
                $results['configuracion'] = $res;
                error_log("[DashboardRepo] setConfiguracion: " . ($res ? 'OK' : 'FAIL'));
            }

            $this->updateSyncStatus($timestamp);
            $wpdb->query('COMMIT');

            $allOk = !in_array(false, $results, true);
            error_log("[DashboardRepo] saveAll final: " . ($allOk ? 'OK' : 'FAIL') . " results: " . json_encode($results));

            return $allOk;
        } catch (\Exception $e) {
            $wpdb->query('ROLLBACK');
            error_log('[DashboardRepo] Error saving dashboard: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene los hábitos del usuario (SQL con fallback a Meta)
     */
    public function getHabitos(): array
    {
        global $wpdb;
        $table = Schema::getTableName('habitos');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        /* Si hay datos SQL, devolverlos */
        if (!empty($rows)) {
            return array_map(function ($row) {
                $data = json_decode($row['data'], true);
                /* Asegurar que el ID sea el correcto (cast a numero por si acaso) */
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);
        }

        /* Si está vacío, verificar si hay datos antiguos en user_meta para migrar */
        $metaData = get_user_meta($this->userId, self::META_HABITOS, true);
        if (!empty($metaData)) {
            $habitos = $this->decodeData($metaData, []);
            if (!empty($habitos)) {
                $this->migrateHabitosToSql($habitos);
                /* Borrar meta antigua para no migrar de nuevo */
                delete_user_meta($this->userId, self::META_HABITOS);
                return $habitos;
            }
        }

        return [];
    }

    /**
     * Guarda los hábitos (Sincronización total: Upsert + Soft Delete)
     */
    public function setHabitos(array $habitos): bool
    {
        global $wpdb;
        $table = Schema::getTableName('habitos');
        $now = current_time('mysql');

        /* 1. Obtener IDs existentes para detectar borrados */
        $existingIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ));

        $incomingIds = [];

        /* 2. Upsert (Insertar o Actualizar) */
        foreach ($habitos as $habito) {
            if (!isset($habito['id'])) continue;

            $idLocal = (int)$habito['id'];
            $incomingIds[] = $idLocal;

            /* Preparar datos para columnas SQL */
            $nombre = sanitize_text_field($habito['nombre'] ?? '');
            $frecuenciaData = $habito['frecuencia'] ?? null;
            $frecuencia = is_array($frecuenciaData) ? ($frecuenciaData['tipo'] ?? 'diario') : 'diario';
            $completadoHoy = isset($habito['ultimoCompletado']) && $habito['ultimoCompletado'] === date('Y-m-d') ? 1 : 0;

            /* Verificar si existe para decidir INSERT o UPDATE */
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
                        'deleted_at' => null, /* Restaurar si estaba borrado */
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

        /* 3. Soft Delete para los que ya no vienen */
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
     * Migra hábitos de Meta a SQL
     */
    private function migrateHabitosToSql(array $habitos): void
    {
        $this->setHabitos($habitos);
    }

    /**
     * Obtiene tareas (SQL con fallback)
     */
    public function getTareas(): array
    {
        global $wpdb;
        $table = Schema::getTableName('tareas');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        if (!empty($rows)) {
            return array_map(function ($row) {
                $data = json_decode($row['data'], true);
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);
        }

        /* Fallback */
        $metaData = get_user_meta($this->userId, self::META_TAREAS, true);
        if (!empty($metaData)) {
            $tareas = $this->decodeData($metaData, []);
            if (!empty($tareas)) {
                $this->setTareas($tareas); /* Migración */
                delete_user_meta($this->userId, self::META_TAREAS);
                return $tareas;
            }
        }

        return [];
    }

    /**
     * Guarda tareas (SQL)
     */
    public function setTareas(array $tareas): bool
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

            $texto = sanitize_text_field($tarea['texto'] ?? '');
            $completada = !empty($tarea['completada']) ? 1 : 0;
            $proyectoId = isset($tarea['proyectoId']) ? (int)$tarea['proyectoId'] : null;
            $padreId = isset($tarea['padreId']) ? (int)$tarea['padreId'] : null;
            $prioridad = $tarea['prioridad'] ?? null; // alta, media, baja

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
     * Obtiene proyectos (SQL con fallback)
     */
    public function getProyectos(): array
    {
        global $wpdb;
        $table = Schema::getTableName('proyectos');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        if (!empty($rows)) {
            return array_map(function ($row) {
                $data = json_decode($row['data'], true);
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);
        }

        /* Fallback */
        $metaData = get_user_meta($this->userId, self::META_PROYECTOS, true);
        if (!empty($metaData)) {
            $proyectos = $this->decodeData($metaData, []);
            if (!empty($proyectos)) {
                $this->setProyectos($proyectos); /* Migración */
                delete_user_meta($this->userId, self::META_PROYECTOS);
                return $proyectos;
            }
        }

        return [];
    }

    /**
     * Guarda proyectos (SQL)
     */
    public function setProyectos(array $proyectos): bool
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

            $nombre = sanitize_text_field($proyecto['nombre'] ?? '');
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
     * Obtiene las notas (Mantenemos en META por simplicidad de string único)
     */
    public function getNotas(): mixed
    {
        $data = get_user_meta($this->userId, self::META_NOTAS, true);
        if (empty($data)) return '';
        $decoded = $this->decodeData($data, null);
        return $decoded ?? $data;
    }

    public function setNotas(mixed $notas): bool
    {
        /* update_user_meta devuelve false si el valor no cambió, lo cual no es un error */
        if (is_string($notas)) {
            update_user_meta($this->userId, self::META_NOTAS, $notas);
        } else {
            $encoded = $this->encodeData($notas);
            update_user_meta($this->userId, self::META_NOTAS, $encoded);
        }
        return true;
    }

    /**
     * Configuración (META)
     */
    public function getConfiguracion(): array
    {
        $data = get_user_meta($this->userId, self::META_CONFIG, true);
        return $this->decodeData($data, $this->getDefaultConfig());
    }

    public function setConfiguracion(array $config): bool
    {
        /* update_user_meta devuelve false si el valor no cambió, lo cual no es un error */
        $merged = array_merge($this->getDefaultConfig(), $config);
        $encoded = $this->encodeData($merged);
        update_user_meta($this->userId, self::META_CONFIG, $encoded);
        return true;
    }

    private function getDefaultConfig(): array
    {
        return [
            'notificaciones' => [
                'email' => false,
                'frecuenciaResumen' => 'nunca',
                'horaPreferida' => '09:00',
                'tareasPorVencer' => true,
                'rachaEnPeligro' => true,
            ],
            'cifradoE2E' => false,
            'tema' => 'terminal',
            'ordenHabitos' => 'inteligente',
        ];
    }

    /**
     * Sync Status (META)
     */
    public function getSyncStatus(): array
    {
        $data = get_user_meta($this->userId, self::META_SYNC, true);
        $sync = $this->decodeData($data, []);

        return [
            'lastSync' => $sync['lastSync'] ?? null,
            'lastUpdate' => $sync['lastUpdate'] ?? null,
            'version' => self::SCHEMA_VERSION,
            'serverTimestamp' => time() * 1000,
        ];
    }

    private function updateSyncStatus(int $timestamp): void
    {
        $sync = [
            'lastSync' => $timestamp,
            'lastUpdate' => current_time('c'),
            'version' => self::SCHEMA_VERSION,
        ];
        $encoded = $this->encodeData($sync);
        update_user_meta($this->userId, self::META_SYNC, $encoded);
    }

    public function getLastUpdate(): ?string
    {
        $sync = $this->getSyncStatus();
        return $sync['lastUpdate'] ?? null;
    }

    /* Métodos de Sync Incremental (Necesitan adaptación a SQL) */

    public function getChangesSince(int $since): array
    {
        /* TODO: Usar updated_at de las tablas SQL para generar changelog dinámico 
           Por ahora mantenemos el changelog en meta si se usa pushChanges,
           pero lo ideal es consultarlo directamente de las tablas */

        $data = get_user_meta($this->userId, self::META_CHANGELOG, true);
        $changelog = $this->decodeData($data, []);
        $changes = array_filter($changelog, fn($entry) => ($entry['timestamp'] ?? 0) > $since);
        $changes = array_slice($changes, -100);

        return [
            'changes' => array_values($changes),
            'hasMore' => count($changelog) > count($changes),
        ];
    }

    public function applyChanges(array $changes, int $clientTimestamp): array
    {
        $applied = [];
        $conflicts = [];

        /* Implementación simplificada: Reutilizar setters individuales */

        foreach ($changes as $change) {
            $entity = $change['entity'] ?? null;
            $data = $change['data'] ?? null;
            $type = $change['type'] ?? null;

            if ($type === 'delete' && $data && isset($data['id'])) {
                /* Handle Delete */
                $this->softDeleteEntity($entity, (int)$data['id']);
                $applied[] = $data['id'];
            } elseif (($type === 'create' || $type === 'update') && $data) {
                /* Handle Create/Update */
                /* Truco: Envolver data en array y llamar al setter masivo solo para ese item */
                if ($entity === 'habito') $this->setHabitos([$data]);
                elseif ($entity === 'tarea') $this->setTareas([$data]);
                elseif ($entity === 'proyecto') $this->setProyectos([$data]);

                $applied[] = $data['id'] ?? null;
            }
        }

        $this->addToChangelog($changes, $clientTimestamp);

        return [
            'applied' => $applied,
            'conflicts' => $conflicts,
            'serverTimestamp' => time() * 1000,
        ];
    }

    private function softDeleteEntity(string $entity, int $idLocal): void
    {
        global $wpdb;
        $table = Schema::getTableName($entity . 's'); // habitos, tareas...
        $wpdb->update(
            $table,
            ['deleted_at' => current_time('mysql')],
            ['user_id' => $this->userId, 'id_local' => $idLocal],
            ['%s'],
            ['%d', '%d']
        );
    }

    private function addToChangelog(array $changes, int $timestamp): void
    {
        $data = get_user_meta($this->userId, self::META_CHANGELOG, true);
        $changelog = $this->decodeData($data, []);
        foreach ($changes as $change) {
            $changelog[] = ['timestamp' => $timestamp, 'change' => $change];
        }
        if (count($changelog) > 500) $changelog = array_slice($changelog, -500);
        update_user_meta($this->userId, self::META_CHANGELOG, $this->encodeData($changelog));
    }

    /* Validadores y Helpers */

    public function validateData(array $data): array
    {
        /* Mantenemos validación simple */
        return ['valid' => true, 'errors' => []];
    }

    private function encodeData(mixed $data): string
    {
        return wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function decodeData(mixed $data, mixed $default): mixed
    {
        if (empty($data)) return $default;
        if (is_array($data)) return $data;
        $decoded = json_decode($data, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $default;
    }

    public function deleteAll(): bool
    {
        global $wpdb;
        $wpdb->delete(Schema::getTableName('habitos'), ['user_id' => $this->userId]);
        $wpdb->delete(Schema::getTableName('tareas'), ['user_id' => $this->userId]);
        $wpdb->delete(Schema::getTableName('proyectos'), ['user_id' => $this->userId]);

        delete_user_meta($this->userId, self::META_NOTAS);
        delete_user_meta($this->userId, self::META_CONFIG);
        delete_user_meta($this->userId, self::META_SYNC);
        delete_user_meta($this->userId, self::META_CHANGELOG);
        return true;
    }
}
