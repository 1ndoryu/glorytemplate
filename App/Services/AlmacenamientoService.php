<?php

/**
 * Servicio de Almacenamiento
 *
 * Gestiona el cálculo y control de uso de espacio de almacenamiento
 * por usuario según su plan (Free: 50MB, Premium: 10GB).
 *
 * @package App\Services
 */

namespace App\Services;

class AlmacenamientoService
{
    /* 
     * Límites de almacenamiento en bytes
     */
    private const LIMITE_FREE = 52428800; /* 50 MB */
    private const LIMITE_PREMIUM = 10737418240; /* 10 GB */

    /* 
     * Umbral de alerta (90%)
     */
    private const UMBRAL_ALERTA = 0.9;

    private int $userId;
    private SuscripcionService $suscripcion;
    private ?CifradoService $cifradoService = null;
    private ?int $usadoCache = null;

    public function __construct(int $userId)
    {
        $this->userId = $userId;
        $this->suscripcion = new SuscripcionService($userId);
        $this->inicializarCifrado();
    }

    /**
     * Inicializa el servicio de cifrado si está habilitado
     */
    private function inicializarCifrado(): void
    {
        if (CifradoService::estaHabilitado($this->userId)) {
            try {
                $this->cifradoService = new CifradoService($this->userId);
            } catch (\Exception $e) {
                error_log('[AlmacenamientoService] Error inicializando cifrado: ' . $e->getMessage());
            }
        }
    }

    /**
     * Obtiene el límite de almacenamiento según el plan del usuario
     */
    public function getLimite(): int
    {
        return $this->suscripcion->esPremium()
            ? self::LIMITE_PREMIUM
            : self::LIMITE_FREE;
    }

    /**
     * Obtiene el límite en formato legible (MB o GB)
     */
    public function getLimiteFormateado(): string
    {
        $limite = $this->getLimite();
        return $this->formatearBytes($limite);
    }

    /**
     * Calcula el espacio usado por el usuario (todos los adjuntos)
     * Incluye: archivos Base64 en BD (legacy) + archivos físicos (nuevo)
     * Resultado cacheado para evitar múltiples consultas en la misma petición
     */
    public function getUsado(): int
    {
        /* Retornar cache si existe */
        if ($this->usadoCache !== null) {
            return $this->usadoCache;
        }

        $totalBytes = 0;

        /* 1. Calcular espacio de archivos físicos */
        $totalBytes += $this->calcularEspacioArchivosFisicos();

        /* 2. Calcular espacio de archivos Base64 en BD (legacy) */
        $totalBytes += $this->calcularEspacioBase64();

        /* Guardar en cache y retornar */
        $this->usadoCache = $totalBytes;
        return $totalBytes;
    }

    /**
     * Calcula espacio usado por archivos físicos en disco
     */
    private function calcularEspacioArchivosFisicos(): int
    {
        $adjuntosService = new AdjuntosService($this->userId);
        return $adjuntosService->calcularEspacioUsado();
    }

    /**
     * Calcula espacio usado por archivos Base64 almacenados en BD (legacy)
     */
    private function calcularEspacioBase64(): int
    {
        global $wpdb;

        $tablaTareas = $wpdb->prefix . 'glory_tareas';

        /* Verificar si la tabla existe */
        $tablaExiste = $wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $tablaTareas)
        );

        if (!$tablaExiste) {
            return 0;
        }

        /* Obtener todas las tareas del usuario con data JSON */
        $tareas = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT data FROM {$tablaTareas} 
                 WHERE user_id = %d AND deleted_at IS NULL",
                $this->userId
            ),
            ARRAY_A
        );

        $totalBytes = 0;

        foreach ($tareas as $tarea) {
            if (empty($tarea['data'])) {
                continue;
            }

            $dataString = $tarea['data'];

            /* Descifrar si está cifrado (prefijo ENC:) */
            if ($this->cifradoService !== null && $this->cifradoService->estaCifrado($dataString)) {
                try {
                    $dataString = $this->cifradoService->descifrar($dataString);
                } catch (\Exception $e) {
                    /* No podemos descifrar, saltar esta tarea */
                    continue;
                }
            }

            $data = json_decode($dataString, true);

            if (json_last_error() !== JSON_ERROR_NONE || empty($data)) {
                continue;
            }

            /* Los adjuntos están en configuracion.adjuntos dentro del JSON */
            if (empty($data['configuracion']['adjuntos']) || !is_array($data['configuracion']['adjuntos'])) {
                continue;
            }

            foreach ($data['configuracion']['adjuntos'] as $adjunto) {
                /* Solo contar si es Base64 (URL empieza con data:) */
                if (isset($adjunto['url']) && str_starts_with($adjunto['url'], 'data:')) {
                    if (isset($adjunto['tamano']) && is_numeric($adjunto['tamano'])) {
                        $totalBytes += (int) $adjunto['tamano'];
                    }
                }
            }
        }

        return $totalBytes;
    }

    /**
     * Obtiene el espacio usado en formato legible
     */
    public function getUsadoFormateado(): string
    {
        return $this->formatearBytes($this->getUsado());
    }

    /**
     * Calcula el porcentaje de uso
     */
    public function getPorcentajeUso(): float
    {
        $limite = $this->getLimite();
        if ($limite === 0) {
            return 100.0;
        }

        $usado = $this->getUsado();
        return min(100.0, ($usado / $limite) * 100);
    }

    /**
     * Verifica si el usuario está cerca del límite (90%+)
     */
    public function estaCercaDelLimite(): bool
    {
        $porcentaje = $this->getPorcentajeUso();
        return $porcentaje >= (self::UMBRAL_ALERTA * 100);
    }

    /**
     * Verifica si el usuario ha excedido el límite
     */
    public function haExcedidoLimite(): bool
    {
        return $this->getUsado() >= $this->getLimite();
    }

    /**
     * Verifica si el usuario puede subir un archivo del tamaño especificado
     */
    public function puedeSubir(int $tamanoBytes): bool
    {
        $usado = $this->getUsado();
        $limite = $this->getLimite();

        return ($usado + $tamanoBytes) <= $limite;
    }

    /**
     * Calcula cuánto espacio queda disponible
     */
    public function getDisponible(): int
    {
        $limite = $this->getLimite();
        $usado = $this->getUsado();

        return max(0, $limite - $usado);
    }

    /**
     * Obtiene el espacio disponible en formato legible
     */
    public function getDisponibleFormateado(): string
    {
        return $this->formatearBytes($this->getDisponible());
    }

    /**
     * Obtiene información completa de almacenamiento para el frontend
     */
    public function getInfoCompleta(): array
    {
        $usado = $this->getUsado();
        $limite = $this->getLimite();
        $disponible = $this->getDisponible();
        $porcentaje = $this->getPorcentajeUso();

        return [
            'usado' => $usado,
            'usadoFormateado' => $this->formatearBytes($usado),
            'limite' => $limite,
            'limiteFormateado' => $this->formatearBytes($limite),
            'disponible' => $disponible,
            'disponibleFormateado' => $this->formatearBytes($disponible),
            'porcentaje' => round($porcentaje, 1),
            'cercaDelLimite' => $this->estaCercaDelLimite(),
            'limiteExcedido' => $this->haExcedidoLimite(),
            'esPremium' => $this->suscripcion->esPremium()
        ];
    }

    /**
     * Formatea bytes a unidades legibles (KB, MB, GB)
     */
    private function formatearBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        $valor = (float) $bytes;

        while ($valor >= 1024 && $i < count($unidades) - 1) {
            $valor /= 1024;
            $i++;
        }

        /* Mostrar sin decimales si es número entero, con 1 decimal si no */
        $formato = ($valor == floor($valor)) ? '%.0f %s' : '%.1f %s';

        return sprintf($formato, $valor, $unidades[$i]);
    }
}
