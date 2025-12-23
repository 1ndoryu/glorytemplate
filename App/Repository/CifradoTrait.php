<?php

/**
 * Trait de Cifrado para Repositorios
 *
 * Proporciona funcionalidad común de cifrado/descifrado
 * para todos los repositorios de datos.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Services\CifradoService;

trait CifradoTrait
{
    protected int $userId;
    protected ?CifradoService $cifradoService = null;
    protected bool $cifradoHabilitado = false;

    /**
     * Inicializa el servicio de cifrado si está habilitado para el usuario
     */
    protected function inicializarCifrado(): void
    {
        $this->cifradoHabilitado = CifradoService::estaHabilitado($this->userId);

        if ($this->cifradoHabilitado) {
            try {
                $this->cifradoService = new CifradoService($this->userId);
            } catch (\Exception $e) {
                error_log('[Repository] Error inicializando cifrado: ' . $e->getMessage());
                $this->cifradoHabilitado = false;
            }
        }
    }

    /**
     * Codifica datos a JSON, opcionalmente cifrando
     */
    protected function encodeData(mixed $data, bool $cifrarDatos = true): string
    {
        $json = wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($cifrarDatos && $this->cifradoHabilitado && $this->cifradoService !== null) {
            try {
                return $this->cifradoService->cifrar($json);
            } catch (\Exception $e) {
                error_log('[Repository] Error cifrando: ' . $e->getMessage());
            }
        }

        return $json;
    }

    /**
     * Decodifica datos de JSON, descifrando si es necesario
     */
    protected function decodeData(mixed $data, mixed $default): mixed
    {
        if (empty($data)) return $default;
        if (is_array($data)) return $data;

        $dataString = (string) $data;

        if ($this->cifradoService !== null && $this->cifradoService->estaCifrado($dataString)) {
            try {
                $dataString = $this->cifradoService->descifrar($dataString);
            } catch (\Exception $e) {
                error_log('[Repository] Error descifrando: ' . $e->getMessage());
                return $default;
            }
        }

        $decoded = json_decode($dataString, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $default;
    }

    /**
     * Decodifica datos compartidos (JSON plano, sin cifrado propio)
     */
    protected function decodeDataCompartido(string $data): ?array
    {
        if (empty($data)) return null;

        $decoded = json_decode($data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Verifica si el cifrado está activo
     */
    public function esCifradoActivo(): bool
    {
        return $this->cifradoHabilitado;
    }
}
