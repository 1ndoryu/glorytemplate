<?php

/**
 * Dashboard Repository (Orquestador)
 *
 * Capa de acceso a datos para el dashboard de productividad.
 * Usa composicion para delegar a repositorios especializados.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Database\Schema;

class DashboardRepository
{
    private int $userId;
    private HabitosRepository $habitosRepo;
    private TareasRepository $tareasRepo;
    private ProyectosRepository $proyectosRepo;
    private ConfiguracionRepository $configRepo;
    private CompartidosRepository $compartidosRepo;

    private const SCHEMA_VERSION = '1.0.0';
    private const META_CONFIG = '_glory_dashboard_config';

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario invalido');
        }
        $this->userId = $userId;
        $this->inicializarRepositorios();
    }

    private function inicializarRepositorios(): void
    {
        $this->habitosRepo = new HabitosRepository($this->userId);
        $this->tareasRepo = new TareasRepository($this->userId);
        $this->proyectosRepo = new ProyectosRepository($this->userId);
        $this->configRepo = new ConfiguracionRepository($this->userId);
        $this->compartidosRepo = new CompartidosRepository($this->userId);
    }

    public function habilitarCifrado(): bool
    {
        if ($this->esCifradoActivo()) return true;

        try {
            $datos = $this->loadAll();
            unset($datos['configuracion']);

            $this->guardarConfigCifrado(true);
            $this->inicializarRepositorios();

            if ($this->esCifradoActivo()) {
                $this->saveAll($datos);
                return true;
            }
            error_log('[DashboardRepo] Error: Cifrado no se pudo activar');
            return false;
        } catch (\Exception $e) {
            error_log('[DashboardRepo] Error habilitando cifrado: ' . $e->getMessage());
            return false;
        }
    }

    public function deshabilitarCifrado(): bool
    {
        if (!$this->esCifradoActivo()) return true;

        try {
            $datos = $this->loadAll();
            unset($datos['configuracion']);

            $this->guardarConfigCifrado(false);
            $this->inicializarRepositorios();
            $this->saveAll($datos);

            return true;
        } catch (\Exception $e) {
            error_log('[DashboardRepo] Error deshabilitando cifrado: ' . $e->getMessage());
            return false;
        }
    }

    private function guardarConfigCifrado(bool $habilitado): void
    {
        $config = $this->configRepo->getConfiguracion();
        $config['cifradoE2E'] = $habilitado;
        $configJson = wp_json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        update_user_meta($this->userId, self::META_CONFIG, $configJson);
    }

    public function loadAll(): array
    {
        $compartidos = $this->compartidosRepo->getAll();

        return [
            'version' => self::SCHEMA_VERSION,
            'habitos' => $this->habitosRepo->getAll(),
            'tareas' => array_merge($this->tareasRepo->getAll(), $compartidos['tareas']),
            'proyectos' => array_merge($this->proyectosRepo->getAll(), $compartidos['proyectos']),
            'notas' => $this->configRepo->getNotas(),
            'configuracion' => $this->configRepo->getConfiguracion(),
            'ultimaActualizacion' => $this->configRepo->getLastUpdate(),
        ];
    }

    public function saveAll(array $data): bool
    {
        $timestamp = time() * 1000;
        $results = [];

        global $wpdb;
        $wpdb->query('START TRANSACTION');

        try {
            if (isset($data['habitos'])) {
                $results['habitos'] = $this->habitosRepo->saveAll($data['habitos']);
            }
            if (isset($data['tareas'])) {
                $results['tareas'] = $this->tareasRepo->saveAll($data['tareas']);
            }
            if (isset($data['proyectos'])) {
                $results['proyectos'] = $this->proyectosRepo->saveAll($data['proyectos']);
            }
            if (isset($data['notas'])) {
                $results['notas'] = $this->configRepo->setNotas($data['notas']);
            }
            if (isset($data['configuracion'])) {
                $results['configuracion'] = $this->configRepo->setConfiguracion($data['configuracion']);
            }

            $this->configRepo->updateSyncStatus($timestamp);
            $wpdb->query('COMMIT');

            return !in_array(false, $results, true);
        } catch (\Exception $e) {
            $wpdb->query('ROLLBACK');
            error_log('[DashboardRepo] Error saving dashboard: ' . $e->getMessage());
            return false;
        }
    }

    /* Metodos delegados para compatibilidad */
    public function getHabitos(): array { return $this->habitosRepo->getAll(); }
    public function setHabitos(array $habitos): bool { return $this->habitosRepo->saveAll($habitos); }
    public function getTareas(): array { return $this->tareasRepo->getAll(); }
    public function setTareas(array $tareas): bool { return $this->tareasRepo->saveAll($tareas); }
    public function getProyectos(): array { return $this->proyectosRepo->getAll(); }
    public function setProyectos(array $proyectos): bool { return $this->proyectosRepo->saveAll($proyectos); }
    public function getNotas(): mixed { return $this->configRepo->getNotas(); }
    public function setNotas(mixed $notas): bool { return $this->configRepo->setNotas($notas); }
    public function getConfiguracion(): array { return $this->configRepo->getConfiguracion(); }
    public function setConfiguracion(array $config): bool { return $this->configRepo->setConfiguracion($config); }
    public function getSyncStatus(): array { return $this->configRepo->getSyncStatus(); }
    public function getLastUpdate(): ?string { return $this->configRepo->getLastUpdate(); }
    public function esCifradoActivo(): bool { return $this->habitosRepo->esCifradoActivo(); }
    public function validateData(array $data): array { return ['valid' => true, 'errors' => []]; }
    public function getChangesSince(int $since): array { return $this->configRepo->getChangesSince($since); }

    public function applyChanges(array $changes, int $clientTimestamp): array
    {
        $applied = [];

        foreach ($changes as $change) {
            $entity = $change['entity'] ?? null;
            $data = $change['data'] ?? null;
            $type = $change['type'] ?? null;

            if ($type === 'delete' && $data && isset($data['id'])) {
                $this->softDeleteEntity($entity, (int)$data['id']);
                $applied[] = $data['id'];
            } elseif (($type === 'create' || $type === 'update') && $data) {
                match($entity) {
                    'habito' => $this->habitosRepo->saveAll([$data]),
                    'tarea' => $this->tareasRepo->saveAll([$data]),
                    'proyecto' => $this->proyectosRepo->saveAll([$data]),
                    default => null
                };
                $applied[] = $data['id'] ?? null;
            }
        }

        $this->configRepo->addToChangelog($changes, $clientTimestamp);

        return [
            'applied' => $applied,
            'conflicts' => [],
            'serverTimestamp' => time() * 1000,
        ];
    }

    private function softDeleteEntity(string $entity, int $idLocal): void
    {
        global $wpdb;
        $table = Schema::getTableName($entity . 's');
        $wpdb->update(
            $table,
            ['deleted_at' => current_time('mysql')],
            ['user_id' => $this->userId, 'id_local' => $idLocal],
            ['%s'],
            ['%d', '%d']
        );
    }

    public function deleteAll(): bool
    {
        $this->habitosRepo->deleteAll();
        $this->tareasRepo->deleteAll();
        $this->proyectosRepo->deleteAll();
        $this->configRepo->deleteAll();
        return true;
    }
}
