<?php

/**
 * ServicioRedis — Cliente Redis singleton con failover graceful a WP transients.
 *
 * Configurado via env vars:
 * - KAMPLES_REDIS_HOST (requerido — si no existe, Redis queda deshabilitado)
 * - KAMPLES_REDIS_PORT (default 6379)
 * - KAMPLES_REDIS_PASSWORD (opcional)
 *
 * Usa la extension phpredis (C) para rendimiento optimo.
 * Si la extension no esta disponible o la conexion falla, ServicioCache
 * degrada a WP transients automaticamente.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

class ServicioRedis
{
    private static ?self $instancia = null;
    private ?\Redis $redis = null;
    private bool $disponible = false;
    private bool $intentoConexion = false;

    private function __construct()
    {
        /* Constructor privado — usar obtenerInstancia() */
    }

    public static function obtenerInstancia(): self
    {
        if (self::$instancia === null) {
            self::$instancia = new self();
        }
        return self::$instancia;
    }

    /**
     * Intenta conectar a Redis. Se ejecuta una sola vez por request.
     * Si falla, no reintenta en el mismo request (fail fast).
     */
    public function conectar(): bool
    {
        if ($this->intentoConexion) {
            return $this->disponible;
        }
        $this->intentoConexion = true;

        if (!extension_loaded('redis')) {
            return false;
        }

        $host = $_ENV['KAMPLES_REDIS_HOST'] ?? getenv('KAMPLES_REDIS_HOST') ?: '';
        $port = (int) ($_ENV['KAMPLES_REDIS_PORT'] ?? getenv('KAMPLES_REDIS_PORT') ?: 6379);
        $password = $_ENV['KAMPLES_REDIS_PASSWORD'] ?? getenv('KAMPLES_REDIS_PASSWORD') ?: '';

        if ($host === '') {
            return false;
        }

        try {
            $this->redis = new \Redis();
            $conectado = $this->redis->connect($host, $port, 2.0);
            if (!$conectado) {
                $this->redis = null;
                return false;
            }

            if ($password !== '') {
                $this->redis->auth($password);
            }

            /* Serializer PHP: almacena arrays/objects nativamente */
            $this->redis->setOption(\Redis::OPT_SERIALIZER, \Redis::SERIALIZER_PHP);
            $this->disponible = true;
        } catch (\Throwable $e) {
            error_log('[ServicioRedis] Conexion fallida: ' . $e->getMessage());
            $this->redis = null;
            $this->disponible = false;
        }

        return $this->disponible;
    }

    public function estaDisponible(): bool
    {
        if (!$this->intentoConexion) {
            $this->conectar();
        }
        return $this->disponible;
    }

    public function obtenerCliente(): ?\Redis
    {
        if (!$this->estaDisponible()) {
            return null;
        }
        return $this->redis;
    }

    /**
     * Para tests y CLI — resetear el singleton y cerrar conexion.
     */
    public static function resetear(): void
    {
        if (self::$instancia?->redis) {
            try {
                self::$instancia->redis->close();
            } catch (\Throwable $e) {
                /* Ignorar error al cerrar */
            }
        }
        self::$instancia = null;
    }
}
