<?php

/**
 * Dashboard Repository
 *
 * Capa de acceso a datos para el dashboard de productividad.
 * Maneja la persistencia en user_meta de WordPress con soporte
 * para sincronización incremental y validación de datos.
 *
 * @package App\Repository
 */

namespace App\Repository;

class DashboardRepository
{
    private int $userId;

    /* Meta keys para almacenamiento */
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

        if (isset($data['habitos'])) {
            $results[] = $this->setHabitos($data['habitos']);
        }

        if (isset($data['tareas'])) {
            $results[] = $this->setTareas($data['tareas']);
        }

        if (isset($data['proyectos'])) {
            $results[] = $this->setProyectos($data['proyectos']);
        }

        if (isset($data['notas'])) {
            $results[] = $this->setNotas($data['notas']);
        }

        if (isset($data['configuracion'])) {
            $results[] = $this->setConfiguracion($data['configuracion']);
        }

        /* Actualizar timestamp de sincronización */
        $this->updateSyncStatus($timestamp);

        /* Verificar que al menos una operación fue exitosa */
        return !in_array(false, $results, true);
    }

    /**
     * Obtiene los hábitos del usuario
     */
    public function getHabitos(): array
    {
        $data = get_user_meta($this->userId, self::META_HABITOS, true);
        return $this->decodeData($data, []);
    }

    /**
     * Guarda los hábitos del usuario
     */
    public function setHabitos(array $habitos): bool
    {
        $encoded = $this->encodeData($habitos);
        return update_user_meta($this->userId, self::META_HABITOS, $encoded) !== false;
    }

    /**
     * Obtiene las tareas del usuario
     */
    public function getTareas(): array
    {
        $data = get_user_meta($this->userId, self::META_TAREAS, true);
        return $this->decodeData($data, []);
    }

    /**
     * Guarda las tareas del usuario
     */
    public function setTareas(array $tareas): bool
    {
        $encoded = $this->encodeData($tareas);
        return update_user_meta($this->userId, self::META_TAREAS, $encoded) !== false;
    }

    /**
     * Obtiene los proyectos del usuario
     */
    public function getProyectos(): array
    {
        $data = get_user_meta($this->userId, self::META_PROYECTOS, true);
        return $this->decodeData($data, []);
    }

    /**
     * Guarda los proyectos del usuario
     */
    public function setProyectos(array $proyectos): bool
    {
        $encoded = $this->encodeData($proyectos);
        return update_user_meta($this->userId, self::META_PROYECTOS, $encoded) !== false;
    }

    /**
     * Obtiene las notas del usuario
     */
    public function getNotas(): mixed
    {
        $data = get_user_meta($this->userId, self::META_NOTAS, true);

        /* Notas puede ser string simple o array de notas */
        if (empty($data)) {
            return '';
        }

        $decoded = $this->decodeData($data, null);
        return $decoded ?? $data;
    }

    /**
     * Guarda las notas del usuario
     */
    public function setNotas(mixed $notas): bool
    {
        /* Si es string simple, guardarlo directamente */
        if (is_string($notas)) {
            return update_user_meta($this->userId, self::META_NOTAS, $notas) !== false;
        }

        $encoded = $this->encodeData($notas);
        return update_user_meta($this->userId, self::META_NOTAS, $encoded) !== false;
    }

    /**
     * Obtiene la configuración del usuario
     */
    public function getConfiguracion(): array
    {
        $data = get_user_meta($this->userId, self::META_CONFIG, true);
        return $this->decodeData($data, $this->getDefaultConfig());
    }

    /**
     * Guarda la configuración del usuario
     */
    public function setConfiguracion(array $config): bool
    {
        $merged = array_merge($this->getDefaultConfig(), $config);
        $encoded = $this->encodeData($merged);
        return update_user_meta($this->userId, self::META_CONFIG, $encoded) !== false;
    }

    /**
     * Obtiene la configuración por defecto
     */
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
     * Obtiene el estado de sincronización
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

    /**
     * Actualiza el estado de sincronización
     */
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

    /**
     * Obtiene la última actualización
     */
    public function getLastUpdate(): ?string
    {
        $sync = $this->getSyncStatus();
        return $sync['lastUpdate'] ?? null;
    }

    /**
     * Obtiene cambios desde un timestamp (para sync incremental)
     */
    public function getChangesSince(int $since): array
    {
        $data = get_user_meta($this->userId, self::META_CHANGELOG, true);
        $changelog = $this->decodeData($data, []);

        /* Filtrar cambios posteriores al timestamp */
        $changes = array_filter($changelog, fn($entry) => ($entry['timestamp'] ?? 0) > $since);

        /* Limitar a los últimos 100 cambios */
        $changes = array_slice($changes, -100);

        return [
            'changes' => array_values($changes),
            'hasMore' => count($changelog) > count($changes),
        ];
    }

    /**
     * Aplica cambios incrementales
     */
    public function applyChanges(array $changes, int $clientTimestamp): array
    {
        $applied = [];
        $conflicts = [];

        foreach ($changes as $change) {
            $result = $this->applyChange($change);

            if ($result['success']) {
                $applied[] = $change['id'] ?? null;
            } else {
                $conflicts[] = [
                    'change' => $change,
                    'reason' => $result['reason'] ?? 'unknown',
                ];
            }
        }

        /* Registrar en changelog */
        $this->addToChangelog($changes, $clientTimestamp);

        return [
            'applied' => $applied,
            'conflicts' => $conflicts,
            'serverTimestamp' => time() * 1000,
        ];
    }

    /**
     * Aplica un cambio individual
     */
    private function applyChange(array $change): array
    {
        $type = $change['type'] ?? null;
        $entity = $change['entity'] ?? null;
        $data = $change['data'] ?? null;

        if (!$type || !$entity) {
            return ['success' => false, 'reason' => 'invalid_change'];
        }

        switch ($entity) {
            case 'habito':
                return $this->applyHabitoChange($type, $data);
            case 'tarea':
                return $this->applyTareaChange($type, $data);
            case 'proyecto':
                return $this->applyProyectoChange($type, $data);
            default:
                return ['success' => false, 'reason' => 'unknown_entity'];
        }
    }

    /**
     * Aplica cambio a un hábito
     */
    private function applyHabitoChange(string $type, ?array $data): array
    {
        if (!$data || !isset($data['id'])) {
            return ['success' => false, 'reason' => 'missing_id'];
        }

        $habitos = $this->getHabitos();
        $index = array_search($data['id'], array_column($habitos, 'id'));

        switch ($type) {
            case 'create':
            case 'update':
                if ($index !== false) {
                    $habitos[$index] = array_merge($habitos[$index], $data);
                } else {
                    $habitos[] = $data;
                }
                break;
            case 'delete':
                if ($index !== false) {
                    array_splice($habitos, $index, 1);
                }
                break;
            default:
                return ['success' => false, 'reason' => 'unknown_type'];
        }

        $this->setHabitos($habitos);
        return ['success' => true];
    }

    /**
     * Aplica cambio a una tarea
     */
    private function applyTareaChange(string $type, ?array $data): array
    {
        if (!$data || !isset($data['id'])) {
            return ['success' => false, 'reason' => 'missing_id'];
        }

        $tareas = $this->getTareas();
        $index = array_search($data['id'], array_column($tareas, 'id'));

        switch ($type) {
            case 'create':
            case 'update':
                if ($index !== false) {
                    $tareas[$index] = array_merge($tareas[$index], $data);
                } else {
                    $tareas[] = $data;
                }
                break;
            case 'delete':
                if ($index !== false) {
                    array_splice($tareas, $index, 1);
                }
                break;
            default:
                return ['success' => false, 'reason' => 'unknown_type'];
        }

        $this->setTareas($tareas);
        return ['success' => true];
    }

    /**
     * Aplica cambio a un proyecto
     */
    private function applyProyectoChange(string $type, ?array $data): array
    {
        if (!$data || !isset($data['id'])) {
            return ['success' => false, 'reason' => 'missing_id'];
        }

        $proyectos = $this->getProyectos();
        $index = array_search($data['id'], array_column($proyectos, 'id'));

        switch ($type) {
            case 'create':
            case 'update':
                if ($index !== false) {
                    $proyectos[$index] = array_merge($proyectos[$index], $data);
                } else {
                    $proyectos[] = $data;
                }
                break;
            case 'delete':
                if ($index !== false) {
                    array_splice($proyectos, $index, 1);
                }
                break;
            default:
                return ['success' => false, 'reason' => 'unknown_type'];
        }

        $this->setProyectos($proyectos);
        return ['success' => true];
    }

    /**
     * Añade cambios al changelog
     */
    private function addToChangelog(array $changes, int $timestamp): void
    {
        $data = get_user_meta($this->userId, self::META_CHANGELOG, true);
        $changelog = $this->decodeData($data, []);

        foreach ($changes as $change) {
            $changelog[] = [
                'timestamp' => $timestamp,
                'change' => $change,
            ];
        }

        /* Mantener solo los últimos 500 cambios */
        if (count($changelog) > 500) {
            $changelog = array_slice($changelog, -500);
        }

        $encoded = $this->encodeData($changelog);
        update_user_meta($this->userId, self::META_CHANGELOG, $encoded);
    }

    /**
     * Valida la estructura de datos
     */
    public function validateData(array $data): array
    {
        $errors = [];

        /* Validar hábitos */
        if (isset($data['habitos']) && is_array($data['habitos'])) {
            foreach ($data['habitos'] as $i => $habito) {
                if (!isset($habito['id']) || !isset($habito['nombre'])) {
                    $errors[] = "Hábito #{$i}: falta id o nombre";
                }
            }
        }

        /* Validar tareas */
        if (isset($data['tareas']) && is_array($data['tareas'])) {
            foreach ($data['tareas'] as $i => $tarea) {
                if (!isset($tarea['id']) || !isset($tarea['texto'])) {
                    $errors[] = "Tarea #{$i}: falta id o texto";
                }
            }
        }

        /* Validar proyectos */
        if (isset($data['proyectos']) && is_array($data['proyectos'])) {
            foreach ($data['proyectos'] as $i => $proyecto) {
                if (!isset($proyecto['id']) || !isset($proyecto['nombre'])) {
                    $errors[] = "Proyecto #{$i}: falta id o nombre";
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Codifica datos para almacenamiento
     */
    private function encodeData(mixed $data): string
    {
        return wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Decodifica datos almacenados
     */
    private function decodeData(mixed $data, mixed $default): mixed
    {
        if (empty($data)) {
            return $default;
        }

        if (is_array($data)) {
            return $data;
        }

        $decoded = json_decode($data, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $default;
        }

        return $decoded;
    }

    /**
     * Elimina todos los datos del usuario (para testing o cuenta)
     */
    public function deleteAll(): bool
    {
        delete_user_meta($this->userId, self::META_HABITOS);
        delete_user_meta($this->userId, self::META_TAREAS);
        delete_user_meta($this->userId, self::META_PROYECTOS);
        delete_user_meta($this->userId, self::META_NOTAS);
        delete_user_meta($this->userId, self::META_CONFIG);
        delete_user_meta($this->userId, self::META_SYNC);
        delete_user_meta($this->userId, self::META_CHANGELOG);

        return true;
    }
}
