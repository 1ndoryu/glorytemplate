<?php

/**
 * Servicio de Suscripción
 *
 * Maneja la lógica del modelo freemium:
 * - Planes (FREE / PREMIUM)
 * - Límites de entidades
 * - Validación de acceso a funcionalidades
 *
 * @package App\Services
 */

namespace App\Services;

class SuscripcionService
{
    /* 
     * Constantes de planes 
     */
    public const PLAN_FREE = 'free';
    public const PLAN_PREMIUM = 'premium';

    /* 
     * Constantes de estado 
     */
    public const ESTADO_ACTIVA = 'activa';
    public const ESTADO_TRIAL = 'trial';
    public const ESTADO_EXPIRADA = 'expirada';

    /* 
     * Límites por plan 
     * Nota: cifradoE2E disponible para todos los planes
     */
    private const LIMITES = [
        self::PLAN_FREE => [
            'habitos' => 10,
            'tareasActivas' => 50,
            'proyectos' => 3,
            'adjuntosPorTarea' => 0,
            'sincronizacion' => false,
            'estadisticasAvanzadas' => false,
            'temas' => false,
            'cifradoE2E' => true
        ],
        self::PLAN_PREMIUM => [
            'habitos' => -1,
            'tareasActivas' => -1,
            'proyectos' => -1,
            'adjuntosPorTarea' => 10,
            'sincronizacion' => true,
            'estadisticasAvanzadas' => true,
            'temas' => true,
            'cifradoE2E' => true
        ]
    ];

    /* 
     * Días de trial 
     */
    private const DIAS_TRIAL = 14;

    private int $userId;
    private string $metaKey = 'glory_suscripcion';

    public function __construct(int $userId)
    {
        $this->userId = $userId;
    }

    /**
     * Obtiene la información de suscripción del usuario
     */
    public function getSuscripcion(): array
    {
        $suscripcion = get_user_meta($this->userId, $this->metaKey, true);

        if (empty($suscripcion) || !is_array($suscripcion)) {
            return $this->crearSuscripcionFree();
        }

        /* Verificar si el trial o premium han expirado */
        return $this->verificarExpiracion($suscripcion);
    }

    /**
     * Crea una suscripción FREE por defecto
     */
    private function crearSuscripcionFree(): array
    {
        $suscripcion = [
            'plan' => self::PLAN_FREE,
            'estado' => self::ESTADO_ACTIVA,
            'fechaInicio' => current_time('mysql'),
            'fechaExpiracion' => null,
            'trialUsado' => false
        ];

        update_user_meta($this->userId, $this->metaKey, $suscripcion);

        return $suscripcion;
    }

    /**
     * Verifica y actualiza el estado según expiración
     */
    private function verificarExpiracion(array $suscripcion): array
    {
        if (empty($suscripcion['fechaExpiracion'])) {
            return $suscripcion;
        }

        $ahora = current_time('timestamp');
        $expiracion = strtotime($suscripcion['fechaExpiracion']);

        if ($ahora > $expiracion) {
            /* Expiró: degradar a FREE */
            $suscripcion['plan'] = self::PLAN_FREE;
            $suscripcion['estado'] = self::ESTADO_EXPIRADA;
            $suscripcion['fechaExpiracion'] = null;

            update_user_meta($this->userId, $this->metaKey, $suscripcion);
        }

        return $suscripcion;
    }

    /**
     * Obtiene los límites según el plan actual
     */
    public function getLimites(): array
    {
        $suscripcion = $this->getSuscripcion();
        $plan = $suscripcion['plan'];

        return self::LIMITES[$plan] ?? self::LIMITES[self::PLAN_FREE];
    }

    /**
     * Obtiene un límite específico
     */
    public function getLimite(string $tipo): mixed
    {
        $limites = $this->getLimites();
        return $limites[$tipo] ?? null;
    }

    /**
     * Verifica si el usuario puede añadir más entidades de un tipo
     */
    public function puedeCrear(string $entidad, int $cantidadActual): bool
    {
        $limite = $this->getLimite($entidad);

        /* -1 significa ilimitado */
        if ($limite === -1) {
            return true;
        }

        return $cantidadActual < $limite;
    }

    /**
     * Verifica si una funcionalidad está disponible
     */
    public function tieneAcceso(string $funcionalidad): bool
    {
        $limites = $this->getLimites();
        return !empty($limites[$funcionalidad]);
    }

    /**
     * Verifica si el usuario es Premium
     */
    public function esPremium(): bool
    {
        $suscripcion = $this->getSuscripcion();
        return $suscripcion['plan'] === self::PLAN_PREMIUM && $suscripcion['estado'] !== self::ESTADO_EXPIRADA;
    }

    /**
     * Activa el trial de Premium (14 días)
     */
    public function activarTrial(): array
    {
        $suscripcion = $this->getSuscripcion();

        if ($suscripcion['trialUsado']) {
            return [
                'exito' => false,
                'mensaje' => 'Ya has usado tu período de prueba gratuito.'
            ];
        }

        $fechaExpiracion = date('Y-m-d H:i:s', strtotime('+' . self::DIAS_TRIAL . ' days'));

        $nuevaSuscripcion = [
            'plan' => self::PLAN_PREMIUM,
            'estado' => self::ESTADO_TRIAL,
            'fechaInicio' => current_time('mysql'),
            'fechaExpiracion' => $fechaExpiracion,
            'trialUsado' => true
        ];

        update_user_meta($this->userId, $this->metaKey, $nuevaSuscripcion);

        return [
            'exito' => true,
            'mensaje' => 'Trial de ' . self::DIAS_TRIAL . ' días activado.',
            'suscripcion' => $nuevaSuscripcion
        ];
    }

    /**
     * Activa Premium (llamar después de pago exitoso)
     */
    public function activarPremium(int $diasDuracion = 30): array
    {
        $fechaExpiracion = date('Y-m-d H:i:s', strtotime('+' . $diasDuracion . ' days'));

        $nuevaSuscripcion = [
            'plan' => self::PLAN_PREMIUM,
            'estado' => self::ESTADO_ACTIVA,
            'fechaInicio' => current_time('mysql'),
            'fechaExpiracion' => $fechaExpiracion,
            'trialUsado' => true
        ];

        update_user_meta($this->userId, $this->metaKey, $nuevaSuscripcion);

        return [
            'exito' => true,
            'mensaje' => 'Premium activado por ' . $diasDuracion . ' días.',
            'suscripcion' => $nuevaSuscripcion
        ];
    }

    /**
     * Cancela la suscripción (degrada a FREE)
     */
    public function cancelar(): array
    {
        $suscripcion = $this->getSuscripcion();
        $suscripcion['plan'] = self::PLAN_FREE;
        $suscripcion['estado'] = self::ESTADO_ACTIVA;
        $suscripcion['fechaExpiracion'] = null;

        update_user_meta($this->userId, $this->metaKey, $suscripcion);

        return [
            'exito' => true,
            'mensaje' => 'Suscripción cancelada. Cambiado a plan FREE.',
            'suscripcion' => $suscripcion
        ];
    }

    /**
     * Valida los datos antes de guardar según límites del plan
     * 
     * @throws \Exception si se exceden los límites
     */
    public function validarLimites(array $datos): array
    {
        $errores = [];
        $limites = $this->getLimites();

        /* Validar hábitos */
        if (isset($datos['habitos']) && is_array($datos['habitos'])) {
            $cantidadHabitos = count($datos['habitos']);
            $limiteHabitos = $limites['habitos'];

            if ($limiteHabitos !== -1 && $cantidadHabitos > $limiteHabitos) {
                $errores[] = [
                    'tipo' => 'habitos',
                    'limite' => $limiteHabitos,
                    'actual' => $cantidadHabitos,
                    'mensaje' => "Límite de hábitos excedido ({$cantidadHabitos}/{$limiteHabitos}). Actualiza a Premium para hábitos ilimitados."
                ];
            }
        }

        /* Validar tareas activas (no completadas) */
        if (isset($datos['tareas']) && is_array($datos['tareas'])) {
            $tareasActivas = array_filter($datos['tareas'], fn($t) => empty($t['completado']));
            $cantidadTareas = count($tareasActivas);
            $limiteTareas = $limites['tareasActivas'];

            if ($limiteTareas !== -1 && $cantidadTareas > $limiteTareas) {
                $errores[] = [
                    'tipo' => 'tareas',
                    'limite' => $limiteTareas,
                    'actual' => $cantidadTareas,
                    'mensaje' => "Límite de tareas activas excedido ({$cantidadTareas}/{$limiteTareas}). Actualiza a Premium para tareas ilimitadas."
                ];
            }
        }

        /* Validar proyectos */
        if (isset($datos['proyectos']) && is_array($datos['proyectos'])) {
            $cantidadProyectos = count($datos['proyectos']);
            $limiteProyectos = $limites['proyectos'];

            if ($limiteProyectos !== -1 && $cantidadProyectos > $limiteProyectos) {
                $errores[] = [
                    'tipo' => 'proyectos',
                    'limite' => $limiteProyectos,
                    'actual' => $cantidadProyectos,
                    'mensaje' => "Límite de proyectos excedido ({$cantidadProyectos}/{$limiteProyectos}). Actualiza a Premium para proyectos ilimitados."
                ];
            }
        }

        /* Validar adjuntos en tareas (solo FREE tiene limitación) */
        if ($limites['adjuntosPorTarea'] === 0 && isset($datos['tareas'])) {
            foreach ($datos['tareas'] as $tarea) {
                if (!empty($tarea['configuracion']['adjuntos'])) {
                    $errores[] = [
                        'tipo' => 'adjuntos',
                        'limite' => 0,
                        'actual' => count($tarea['configuracion']['adjuntos']),
                        'mensaje' => 'Los adjuntos solo están disponibles en el plan Premium.'
                    ];
                    break;
                }
            }
        }

        return $errores;
    }

    /**
     * Obtiene información completa para el frontend
     */
    public function getInfoCompleta(): array
    {
        $suscripcion = $this->getSuscripcion();
        $limites = $this->getLimites();

        /* Calcular días restantes si hay fecha de expiración */
        $diasRestantes = null;
        if (!empty($suscripcion['fechaExpiracion'])) {
            $ahora = current_time('timestamp');
            $expiracion = strtotime($suscripcion['fechaExpiracion']);
            $diasRestantes = max(0, ceil(($expiracion - $ahora) / 86400));
        }

        return [
            'plan' => $suscripcion['plan'],
            'estado' => $suscripcion['estado'],
            'esPremium' => $this->esPremium(),
            'diasRestantes' => $diasRestantes,
            'trialDisponible' => !$suscripcion['trialUsado'],
            'limites' => $limites,
            'fechaInicio' => $suscripcion['fechaInicio'],
            'fechaExpiracion' => $suscripcion['fechaExpiracion']
        ];
    }
}
