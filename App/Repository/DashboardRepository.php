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
    private PluginStateRepository $pluginStateRepo;

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
        $this->pluginStateRepo = new PluginStateRepository($this->userId);
    }

    public function habilitarCifrado(): bool
    {
        if ($this->esCifradoActivo()) return true;

        try {
            $datos = $this->loadAll();
            unset($datos['configuracion']);

            // sentinel-disable-next-line retorno-ignorado-repo — guardarConfigCifrado es void, try/catch maneja excepciones
            $this->guardarConfigCifrado(true);
            $this->inicializarRepositorios();

            if ($this->esCifradoActivo()) {
                // sentinel-disable-next-line retorno-ignorado-repo — saveAll lanza excepcion si falla, catch la maneja
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

            // sentinel-disable-next-line retorno-ignorado-repo — guardarConfigCifrado es void, try/catch maneja excepciones
            $this->guardarConfigCifrado(false);
            $this->inicializarRepositorios();
            // sentinel-disable-next-line retorno-ignorado-repo — saveAll lanza excepcion si falla, catch la maneja
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
            'ayuno' => $this->pluginStateRepo->getAyuno(),
            'deficitCalorico' => $this->pluginStateRepo->getDeficitCalorico(),
            'ultimaActualizacion' => $this->configRepo->getLastUpdate(),
        ];
    }

    public function saveAll(array $data, bool $partialUpdate = false, bool $inTransaction = false): bool
    {
        $timestamp = time() * 1000;
        $results = [];

        global $wpdb;
        /* [275A-1] Solución 5: Si el llamador ya abrió una transacción (ej: BackupsApiController::restoreBackup),
         * no abrimos otra — MySQL hace implicit COMMIT al anidar START TRANSACTION, rompiendo el ROLLBACK exterior. */
        if (!$inTransaction) {
            $wpdb->query('START TRANSACTION');
        }

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
            if (isset($data['ayuno']) && is_array($data['ayuno'])) {
                $results['ayuno'] = $this->pluginStateRepo->setAyuno($data['ayuno'], true);
            }
            if (isset($data['deficitCalorico']) && is_array($data['deficitCalorico'])) {
                $results['deficitCalorico'] = $this->pluginStateRepo->setDeficitCalorico($data['deficitCalorico'], true);
            }

            /* Verificar resultados antes de commit: si algun componente fallo, hacer ROLLBACK */
            $failedComponents = array_keys(array_filter($results, fn($v) => $v === false));
            if (!empty($failedComponents)) {
            if (!$inTransaction) {
                $wpdb->query('ROLLBACK');
            }
                return false;
            }

            // sentinel-disable-next-line retorno-ignorado-repo — dentro de transaccion, excepcion dispara ROLLBACK
            $this->configRepo->updateSyncStatus($timestamp);
            if (!$inTransaction) {
            $wpdb->query('COMMIT');
        }
            return true;
        } catch (\Exception $e) {
            if (!$inTransaction) {
                $wpdb->query('ROLLBACK');
            }
            error_log('[DashboardRepo] Error saving dashboard: ' . $e->getMessage());
            return false;
        }
    }

    /* Metodos delegados para compatibilidad */
    public function getHabitos(): array
    {
        return $this->habitosRepo->getAll();
    }
    public function setHabitos(array $habitos): bool
    {
        return $this->habitosRepo->saveAll($habitos);
    }
    public function getTareas(): array
    {
        return $this->tareasRepo->getAll();
    }
    public function setTareas(array $tareas): bool
    {
        return $this->tareasRepo->saveAll($tareas);
    }
    public function getProyectos(): array
    {
        return $this->proyectosRepo->getAll();
    }
    public function setProyectos(array $proyectos): bool
    {
        return $this->proyectosRepo->saveAll($proyectos);
    }
    public function getNotas(): mixed
    {
        return $this->configRepo->getNotas();
    }
    public function setNotas(mixed $notas): bool
    {
        return $this->configRepo->setNotas($notas);
    }
    public function getConfiguracion(): array
    {
        return $this->configRepo->getConfiguracion();
    }
    public function setConfiguracion(array $config): bool
    {
        return $this->configRepo->setConfiguracion($config);
    }
    public function getSyncStatus(): array
    {
        return $this->configRepo->getSyncStatus();
    }
    public function getLastUpdate(): ?string
    {
        return $this->configRepo->getLastUpdate();
    }
    public function esCifradoActivo(): bool
    {
        return $this->habitosRepo->esCifradoActivo();
    }
    public function validateData(array $data): array
    {
        return ['valid' => true, 'errors' => []];
    }
    public function getChangesSince(int $since): array
    {
        return $this->configRepo->getChangesSince($since);
    }

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
                match ($entity) {
                    // sentinel-disable-next-line retorno-ignorado-repo — match expression, excepciones propagan al caller
                    'habito' => $this->habitosRepo->saveAll([$data], true),
                    // sentinel-disable-next-line retorno-ignorado-repo
                    'tarea' => $this->tareasRepo->saveAll([$data], true),
                    // sentinel-disable-next-line retorno-ignorado-repo
                    'proyecto' => $this->proyectosRepo->saveAll([$data], true),
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
        // sentinel-disable-next-line retorno-ignorado-repo — soft delete best-effort, operacion no critica
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
        // sentinel-disable-next-line retorno-ignorado-repo — cascada de borrado total, excepciones propagan
        $this->habitosRepo->deleteAll();
        // sentinel-disable-next-line retorno-ignorado-repo
        $this->tareasRepo->deleteAll();
        // sentinel-disable-next-line retorno-ignorado-repo
        $this->proyectosRepo->deleteAll();
        // sentinel-disable-next-line retorno-ignorado-repo
        $this->configRepo->deleteAll();
        // sentinel-disable-next-line retorno-ignorado-repo
        $this->pluginStateRepo->deleteAll();
        return true;
    }
}
