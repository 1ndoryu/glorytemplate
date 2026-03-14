<?php

/**
 * MigradorLocal — Ejecuta migraciones SQL pendientes automáticamente en entorno local.
 *
 * QK82: En producción, las migraciones se ejecutan via el Rust deploy tool (coolify-manager-rs).
 * En local, este servicio detecta y ejecuta migraciones pendientes automáticamente
 * al iniciar WordPress, usando un transient para no repetir el check cada request.
 *
 * Flujo:
 *   1. Verificar que estamos en modo LOCAL (constante WP_DEBUG o env LOCAL=true)
 *   2. Conectar a PostgreSQL via PDO (PostgresService)
 *   3. Asegurar que existe la tabla _migraciones_ejecutadas
 *   4. Listar archivos v*.sql del directorio de migraciones
 *   5. Comparar con registros de la tabla de tracking
 *   6. Ejecutar las pendientes en orden secuencial
 *   7. Registrar cada migración ejecutada
 *
 * Seguridad: Solo se ejecuta si WP_DEBUG o env LOCAL están activos.
 * El check se cachea con transient (5 min) para no impactar rendimiento.
 *
 * @package Kamples
 */

namespace App\Kamples\Database;

use App\Kamples\KamplesLogger;
use PDO;

class MigradorLocal
{
    private const TABLA_TRACKING = '_migraciones_ejecutadas';
    private const TRANSIENT_KEY = 'kamples_migraciones_check';
    private const TRANSIENT_TTL = 300; /* 5 minutos */

    /* Prefijos de v001 alternativos que se saltan (schema base ya creado en setup inicial) */
    private const ARCHIVOS_EXCLUIDOS = [
        'v001_local_sin_pgvector.sql',
        'v001_schema_inicial.sql',
    ];

    /**
     * Ejecuta migraciones pendientes si estamos en entorno local.
     * Pensado para llamar desde KamplesInit::init().
     * No lanza excepciones — logea errores y continúa.
     */
    public static function ejecutarSiLocal(): void
    {
        if (!self::esEntornoLocal()) {
            return;
        }

        /* Cachear check con transient para no impactar rendimiento */
        if (\get_transient(self::TRANSIENT_KEY)) {
            return;
        }

        try {
            $resultado = self::ejecutarPendientes();
            if ($resultado['ejecutadas'] > 0) {
                KamplesLogger::info('[MigradorLocal] Migraciones ejecutadas', $resultado);
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('[MigradorLocal] Error ejecutando migraciones', [
                'error' => $e->getMessage(),
            ]);
        }

        /* Marcar como chequeado aunque falle — no reintentar cada request */
        \set_transient(self::TRANSIENT_KEY, true, self::TRANSIENT_TTL);
    }

    /**
     * Ejecuta todas las migraciones SQL pendientes.
     *
     * @return array{ejecutadas: int, errores: int, detalle: array}
     */
    public static function ejecutarPendientes(): array
    {
        $resultado = ['ejecutadas' => 0, 'errores' => 0, 'detalle' => []];

        $pdo = PostgresService::obtenerConexion();
        if (!$pdo) {
            KamplesLogger::warning('[MigradorLocal] Sin conexión PostgreSQL, saltando migraciones');
            return $resultado;
        }

        self::asegurarTablaTracking($pdo);

        $archivos = self::listarMigraciones();
        if (empty($archivos)) {
            return $resultado;
        }

        $ejecutadas = self::obtenerEjecutadas($pdo);
        $pendientes = \array_filter($archivos, fn(string $nombre) => !isset($ejecutadas[$nombre]));

        if (empty($pendientes)) {
            return $resultado;
        }

        KamplesLogger::info('[MigradorLocal] Migraciones pendientes detectadas', [
            'total' => \count($pendientes),
            'archivos' => \array_values($pendientes),
        ]);

        $dirMigraciones = self::dirMigraciones();

        foreach ($pendientes as $nombre) {
            $ruta = $dirMigraciones . DIRECTORY_SEPARATOR . $nombre;
            if (!\file_exists($ruta)) {
                $resultado['errores']++;
                $resultado['detalle'][] = ['nombre' => $nombre, 'estado' => 'archivo_no_encontrado'];
                continue;
            }

            $sql = \file_get_contents($ruta);
            if ($sql === false || \trim($sql) === '') {
                $resultado['errores']++;
                $resultado['detalle'][] = ['nombre' => $nombre, 'estado' => 'archivo_vacio'];
                continue;
            }

            try {
                $pdo->exec($sql);
                self::registrarEjecutada($pdo, $nombre);
                $resultado['ejecutadas']++;
                $resultado['detalle'][] = ['nombre' => $nombre, 'estado' => 'ok'];
                KamplesLogger::info("[MigradorLocal] OK: {$nombre}");
            } catch (\Throwable $e) {
                $mensaje = $e->getMessage();
                /* Errores de "already exists" son no-fatales (idempotencia) */
                if (self::esErrorIdempotente($mensaje)) {
                    self::registrarEjecutada($pdo, $nombre);
                    $resultado['ejecutadas']++;
                    $resultado['detalle'][] = ['nombre' => $nombre, 'estado' => 'ya_existia'];
                    KamplesLogger::info("[MigradorLocal] OK (ya existía): {$nombre}");
                } else {
                    $resultado['errores']++;
                    $resultado['detalle'][] = ['nombre' => $nombre, 'estado' => 'error', 'error' => $mensaje];
                    KamplesLogger::error("[MigradorLocal] ERROR: {$nombre}", ['error' => $mensaje]);
                }
            }
        }

        return $resultado;
    }

    /**
     * Invalidar transient para forzar re-check en el próximo request.
     * Útil desde CLI o admin cuando se sabe que hay migraciones nuevas.
     */
    public static function invalidarCache(): void
    {
        \delete_transient(self::TRANSIENT_KEY);
    }

    private static function esEntornoLocal(): bool
    {
        /* Solo ejecutar con env LOCAL=true explicito.
         * WP_DEBUG puede estar activo en produccion — NO usarlo como proxy para local.
         * QK96: WP_DEBUG = true en produccion causaba ejecucion de migraciones no deseadas. */
        $envLocal = $_ENV['LOCAL'] ?? \getenv('LOCAL');
        return $envLocal !== null && $envLocal !== false && \filter_var($envLocal, FILTER_VALIDATE_BOOLEAN);
    }

    private static function dirMigraciones(): string
    {
        return __DIR__ . DIRECTORY_SEPARATOR . 'migrations';
    }

    /**
     * Lista archivos de migración ordenados por nombre (v001, v002, ...).
     * Excluye variantes alternativas de v001.
     *
     * @return string[] Nombres de archivo ordenados
     */
    private static function listarMigraciones(): array
    {
        $dir = self::dirMigraciones();
        if (!\is_dir($dir)) {
            return [];
        }

        $archivos = \glob($dir . DIRECTORY_SEPARATOR . 'v*.sql');
        if ($archivos === false) {
            return [];
        }

        $nombres = \array_map('basename', $archivos);
        $nombres = \array_filter($nombres, fn(string $n) => !\in_array($n, self::ARCHIVOS_EXCLUIDOS, true));
        \sort($nombres, SORT_NATURAL);

        return \array_values($nombres);
    }

    /**
     * Obtiene set de migraciones ya ejecutadas (para lookup rápido).
     *
     * @return array<string, true> Mapa nombre => true
     */
    private static function obtenerEjecutadas(PDO $pdo): array
    {
        $stmt = $pdo->prepare("SELECT nombre FROM " . self::TABLA_TRACKING);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $map = [];
        foreach ($rows as $nombre) {
            $map[$nombre] = true;
        }
        return $map;
    }

    private static function registrarEjecutada(PDO $pdo, string $nombre): void
    {
        $stmt = $pdo->prepare(
            "INSERT INTO " . self::TABLA_TRACKING . " (nombre) VALUES (:nombre) ON CONFLICT DO NOTHING"
        );
        $stmt->execute(['nombre' => $nombre]);
    }

    private static function asegurarTablaTracking(PDO $pdo): void
    {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS " . self::TABLA_TRACKING . " (
                nombre VARCHAR(255) PRIMARY KEY,
                ejecutada_en TIMESTAMPTZ DEFAULT NOW()
            )"
        );
    }

    /**
     * Detecta errores de PostgreSQL que indican que el objeto ya existe.
     * Estos son seguros de ignorar (migraciones idempotentes con IF NOT EXISTS).
     */
    private static function esErrorIdempotente(string $mensaje): bool
    {
        $patrones = [
            'already exists',
            'ya existe',
            'duplicate key',
            'relation .* already exists',
            'column .* of relation .* already exists',
            'index .* already exists',
            'constraint .* already exists',
        ];

        $mensajeLower = \strtolower($mensaje);
        foreach ($patrones as $patron) {
            if (\str_contains($mensajeLower, $patron) || \preg_match("/{$patron}/i", $mensaje)) {
                return true;
            }
        }

        return false;
    }
}
