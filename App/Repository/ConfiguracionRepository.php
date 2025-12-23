<?php

/**
 * Repositorio de Configuración
 *
 * Maneja notas, configuración del usuario y estado de sincronización.
 * Los datos se almacenan en user_meta.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Repository\Traits\CifradoTrait;

class ConfiguracionRepository
{
    use CifradoTrait;

    private const META_NOTAS = '_glory_dashboard_notas';
    private const META_CONFIG = '_glory_dashboard_config';
    private const META_SYNC = '_glory_dashboard_sync';
    private const META_CHANGELOG = '_glory_dashboard_changelog';
    private const SCHEMA_VERSION = '1.0.0';

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario invalido');
        }
        $this->userId = $userId;
        $this->inicializarCifrado();
    }

    /* 
     * Notas
     */

    public function getNotas(): mixed
    {
        $data = get_user_meta($this->userId, self::META_NOTAS, true);
        if (empty($data)) return '';

        if ($this->cifradoService !== null && $this->cifradoService->estaCifrado($data)) {
            try {
                return $this->cifradoService->descifrar($data);
            } catch (\Exception $e) {
                error_log('[ConfigRepo] Error descifrando notas: ' . $e->getMessage());
                return '';
            }
        }

        return $data;
    }

    public function setNotas(mixed $notas): bool
    {
        $valorGuardar = is_string($notas) ? $notas : wp_json_encode($notas, JSON_UNESCAPED_UNICODE);

        if ($this->cifradoHabilitado && $this->cifradoService !== null && !empty($valorGuardar)) {
            try {
                $valorGuardar = $this->cifradoService->cifrar($valorGuardar);
            } catch (\Exception $e) {
                error_log('[ConfigRepo] Error cifrando notas: ' . $e->getMessage());
            }
        }

        update_user_meta($this->userId, self::META_NOTAS, $valorGuardar);
        return true;
    }

    /* 
     * Configuración (NUNCA se cifra - contiene cifradoE2E)
     */

    public function getConfiguracion(): array
    {
        $data = get_user_meta($this->userId, self::META_CONFIG, true);

        if (empty($data)) {
            return $this->getDefaultConfig();
        }

        /* AUTO-REPARACIÓN: Si está cifrada (error anterior), restaurar */
        if (is_string($data) && str_starts_with($data, 'ENC:')) {
            error_log('[ConfigRepo] AUTO-REPARACION: Config cifrada, restaurando');
            $defaultConfig = $this->getDefaultConfig();
            $this->setConfiguracion($defaultConfig);
            return $defaultConfig;
        }

        if (is_string($data)) {
            $decoded = json_decode($data, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return array_merge($this->getDefaultConfig(), $decoded);
            }

            error_log('[ConfigRepo] AUTO-REPARACION: JSON invalido, restaurando');
            $defaultConfig = $this->getDefaultConfig();
            $this->setConfiguracion($defaultConfig);
            return $defaultConfig;
        }

        if (is_array($data)) {
            return array_merge($this->getDefaultConfig(), $data);
        }

        return $this->getDefaultConfig();
    }

    public function setConfiguracion(array $config): bool
    {
        /* Obtener valor ACTUAL de cifradoE2E (no puede modificarse aquí) */
        $configActual = get_user_meta($this->userId, self::META_CONFIG, true);
        $cifradoActual = false;

        if (!empty($configActual) && is_string($configActual)) {
            $decoded = json_decode($configActual, true);
            if (is_array($decoded) && isset($decoded['cifradoE2E'])) {
                $cifradoActual = $decoded['cifradoE2E'];
            }
        }

        $merged = array_merge($this->getDefaultConfig(), $config);
        $merged['cifradoE2E'] = $cifradoActual;

        $json = wp_json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        update_user_meta($this->userId, self::META_CONFIG, $json);
        return true;
    }

    public function getDefaultConfig(): array
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

    /* 
     * Estado de Sincronización
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

    public function updateSyncStatus(int $timestamp): void
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

    public function getSchemaVersion(): string
    {
        return self::SCHEMA_VERSION;
    }

    /* 
     * Changelog (para sync incremental)
     */

    public function getChangesSince(int $since): array
    {
        $data = get_user_meta($this->userId, self::META_CHANGELOG, true);
        $changelog = $this->decodeData($data, []);
        $changes = array_filter($changelog, fn($entry) => ($entry['timestamp'] ?? 0) > $since);
        $changes = array_slice($changes, -100);

        return [
            'changes' => array_values($changes),
            'hasMore' => count($changelog) > count($changes),
        ];
    }

    public function addToChangelog(array $changes, int $timestamp): void
    {
        $data = get_user_meta($this->userId, self::META_CHANGELOG, true);
        $changelog = $this->decodeData($data, []);
        foreach ($changes as $change) {
            $changelog[] = ['timestamp' => $timestamp, 'change' => $change];
        }
        if (count($changelog) > 500) $changelog = array_slice($changelog, -500);
        update_user_meta($this->userId, self::META_CHANGELOG, $this->encodeData($changelog));
    }

    /* 
     * Limpieza
     */

    public function deleteAll(): bool
    {
        delete_user_meta($this->userId, self::META_NOTAS);
        delete_user_meta($this->userId, self::META_CONFIG);
        delete_user_meta($this->userId, self::META_SYNC);
        delete_user_meta($this->userId, self::META_CHANGELOG);
        return true;
    }
}
