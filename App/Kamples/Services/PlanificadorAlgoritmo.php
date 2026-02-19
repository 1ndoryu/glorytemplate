<?php

/**
 * PlanificadorAlgoritmo — Control de frecuencia de recálculo del feed (C45).
 *
 * Gestiona dos modos de recálculo:
 *
 * - Rápido: invalida cache del feed y fuerza recalcular en el próximo request.
 *   Se dispara al acumular N interacciones (configurables) o por tiempo.
 *
 * - Preciso: recalcula embeddings del perfil, regenera cache completo.
 *   Se dispara con el doble de interacciones o el doble de tiempo.
 *
 * Las interacciones se acumulan en la tabla algoritmo_estado.
 * La configuración de umbrales está en algoritmoPesos.php['frecuencia'].
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\AlgoritmoEstadoRepository;
use App\Kamples\LogAlgoritmo as KamplesLogger;
use App\Config\Schema\_generated\AlgoritmoEstadoCols;

class PlanificadorAlgoritmo
{
    /* Mapeo tipo de acción → columna en algoritmo_estado */
    private const MAPEO_COLUMNAS = [
        'like'       => 'cnt_likes',
        'reproduccion' => 'cnt_reproducciones',
        'completa'   => 'cnt_completas',
        'descarga'   => 'cnt_descargas',
        'follow'     => 'cnt_follows',
        'comentario' => 'cnt_comentarios',
    ];

    /* Mapeo tipo acción → key en config triggers */
    private const MAPEO_TRIGGERS = [
        'like'       => 'likes',
        'reproduccion' => 'reproducciones',
        'completa'   => 'reproducciones_completas',
        'descarga'   => 'descargas',
        'follow'     => 'follows',
        'comentario' => 'comentarios',
    ];

    private static ?array $config = null;

    /**
     * Cargar configuración de frecuencia desde algoritmoPesos.php.
     */
    private static function config(): array
    {
        if (self::$config === null) {
            $ruta = dirname(__DIR__) . '/Config/algoritmoPesos.php';
            $todo = file_exists($ruta) ? require $ruta : [];
            self::$config = $todo['frecuencia'] ?? [];
        }
        return self::$config;
    }

    /**
     * Registrar una interacción y evaluar si debe dispararse un recálculo.
     *
     * Se llama después de cada acción relevante (like, reproducción, etc.).
     * Incrementa contadores en algoritmo_estado, evalúa umbrales y,
     * si se alcanzan, ejecuta el recálculo correspondiente.
     *
     * @param int    $userId ID del usuario
     * @param string $tipo   Tipo: 'like' | 'reproduccion' | 'completa' | 'descarga' | 'follow' | 'comentario'
     * @return array{rapido: bool, preciso: bool} Si se disparó cada tipo de recálculo
     */
    public static function registrarInteraccion(int $userId, string $tipo): array
    {
        $resultado = ['rapido' => false, 'preciso' => false];
        $columna = self::MAPEO_COLUMNAS[$tipo] ?? null;
        $triggerKey = self::MAPEO_TRIGGERS[$tipo] ?? null;

        if (!$columna || !$triggerKey) return $resultado;

        /* Asegurar registro en la tabla */
        AlgoritmoEstadoRepository::upsertEstado($userId);

        /* Incrementar contadores */
        AlgoritmoEstadoRepository::incrementarContador($userId, $columna);

        /* Leer estado actual */
        $estado = AlgoritmoEstadoRepository::obtenerEstado($userId);

        if (!$estado) return $resultado;

        $config = self::config();

        /* Evaluar si se alcanza umbral rápido */
        if (self::evaluarUmbrales($estado, $config['rapido']['triggers'] ?? [], false)) {
            self::ejecutarRapido($userId);
            $resultado['rapido'] = true;
        }

        /* Evaluar si se alcanza umbral preciso */
        if (self::evaluarUmbrales($estado, $config['preciso']['triggers'] ?? [], true)) {
            self::ejecutarPreciso($userId);
            $resultado['preciso'] = true;
        }

        return $resultado;
    }

    /**
     * Evalúa si algún contador acumulado alcanza su umbral.
     */
    private static function evaluarUmbrales(array $estado, array $triggers, bool $esPreciso): bool
    {
        $sufijo = $esPreciso ? '_preciso' : '';

        foreach (self::MAPEO_COLUMNAS as $tipo => $columna) {
            $triggerKey = self::MAPEO_TRIGGERS[$tipo] ?? null;
            if (!$triggerKey) continue;

            $umbral = $triggers[$triggerKey] ?? PHP_INT_MAX;
            $valor = (int) ($estado[$columna . $sufijo] ?? 0);

            if ($valor >= $umbral) return true;
        }

        return false;
    }

    /**
     * Recálculo rápido: invalida cache del feed del usuario.
     * Solo borra los transients para que el próximo request recalcule.
     */
    public static function ejecutarRapido(int $userId): void
    {
        /* Borrar transients del feed */
        \delete_transient('kamples_feed_' . $userId . '_20');
        \delete_transient('kamples_feed_' . $userId . '_50');
        \delete_transient('kamples_feed_' . $userId . '_100');

        /* Resetear contadores rápidos */
        AlgoritmoEstadoRepository::resetearContadoresRapidos($userId);

        KamplesLogger::debug("Planificador: Recálculo rápido disparado para usuario #{$userId}");
    }

    /**
     * Recálculo preciso: regenerar perfil de embeddings + invalidar cache.
     * Más costoso, se ejecuta con menos frecuencia.
     */
    public static function ejecutarPreciso(int $userId): void
    {
        /* Invalidar cache del feed primero */
        self::ejecutarRapido($userId);

        /* Regenerar perfil de embeddings del usuario (si pgvector disponible) */
        try {
            $perfil = GeneradorEmbeddings::perfilUsuario($userId);
            if ($perfil) {
                KamplesLogger::debug("Planificador: Perfil embeddings regenerado para usuario #{$userId}");
            }
        } catch (\Throwable $e) {
            KamplesLogger::error("Planificador: Error regenerando perfil: {$e->getMessage()}");
        }

        /* Resetear contadores precisos + incrementar versión del perfil */
        AlgoritmoEstadoRepository::resetearContadoresPrecisos($userId);

        KamplesLogger::debug("Planificador: Recálculo preciso disparado para usuario #{$userId}");
    }

    /**
     * Verificar recálculos temporales: ejecutar para usuarios que
     * superaron su intervalo de tiempo sin recálculo.
     *
     * Pensado para ejecutarse desde un cron (wp_schedule_event) cada 5 min.
     * Evalúa todos los usuarios registrados y aplica recálculos si corresponde.
     *
     * @return array{rapidos: int, precisos: int} Cantidad de recálculos ejecutados
     */
    public static function procesarTemporales(): array
    {
        $config = self::config();
        $contadores = ['rapidos' => 0, 'precisos' => 0];

        $umbralInactividad = $config['umbral_inactividad_seg'] ?? 600;
        $intervaloRapidoActivo = ($config['rapido']['intervalo_activo_min'] ?? 30) * 60;
        $intervaloRapidoInactivo = ($config['rapido']['intervalo_inactivo_min'] ?? 480) * 60;
        $intervaloPrecisoActivo = ($config['preciso']['intervalo_activo_min'] ?? 60) * 60;
        $intervaloPrecisoInactivo = ($config['preciso']['intervalo_inactivo_min'] ?? 960) * 60;

        /* Obtener todos los usuarios con estado registrado */
        $usuarios = AlgoritmoEstadoRepository::obtenerTodosParaEvaluacion();

        foreach ($usuarios as $u) {
            $uid = (int) $u[AlgoritmoEstadoCols::USUARIO_ID];
            $segInactivo = (float) $u['seg_inactivo'];
            $esActivo = $segInactivo < $umbralInactividad;

            /* Evaluar recálculo rápido temporal */
            $segDesdeRapido = (float) $u['seg_desde_rapido'];
            $intervaloRapido = $esActivo ? $intervaloRapidoActivo : $intervaloRapidoInactivo;

            if ($segDesdeRapido >= $intervaloRapido) {
                self::ejecutarRapido($uid);
                $contadores['rapidos']++;
            }

            /* Evaluar recálculo preciso temporal */
            $segDesdePreciso = (float) $u['seg_desde_preciso'];
            $intervaloPreciso = $esActivo ? $intervaloPrecisoActivo : $intervaloPrecisoInactivo;

            if ($segDesdePreciso >= $intervaloPreciso) {
                self::ejecutarPreciso($uid);
                $contadores['precisos']++;
            }
        }

        if ($contadores['rapidos'] > 0 || $contadores['precisos'] > 0) {
            KamplesLogger::info(
                "Planificador: Recálculos temporales: {$contadores['rapidos']} rápidos, {$contadores['precisos']} precisos"
            );
        }

        return $contadores;
    }

    /**
     * Obtener estado del planificador para un usuario (diagnóstico).
     */
    public static function obtenerEstado(int $userId): ?array
    {
        return AlgoritmoEstadoRepository::obtenerEstadoDiagnostico($userId);
    }

    /**
     * Forzar recálculo completo (admin). Invalida todos los feeds.
     *
     * @return int Cantidad de usuarios procesados
     */
    public static function forzarRecalculoGlobal(): int
    {
        $usuarios = AlgoritmoEstadoRepository::obtenerTodosIds();

        $count = 0;
        foreach ($usuarios as $u) {
            self::ejecutarPreciso((int) $u[AlgoritmoEstadoCols::USUARIO_ID]);
            $count++;
        }

        KamplesLogger::info("Planificador: Recálculo global forzado: {$count} usuarios");
        return $count;
    }
}
