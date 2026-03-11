<?php

/**
 * SeedUsuarios — Genera usuarios simulados y distribuye atribucion de contribuciones.
 *
 * El sistema de seed es independiente del scraping/extraccion. Corre como batch
 * despues de que el pipeline normal ha insertado relaciones y samples.
 *
 * Flujo:
 * 1. generarUsuarios() — crea N seed users con WP subscriber + usuarios_ext
 * 2. atribuirRelaciones() — distribuye relaciones sin contribuidor entre seed users (Pareto)
 * 3. atribuirSamples() — reasigna creador_id de samples auto-extraidos a seed users
 */

namespace App\Kamples\Services;

use App\Kamples\Config\SeedConfig;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\UsuariosExtCols;

class SeedUsuarios
{
    /**
     * Genera N usuarios seed con perfil credible.
     * Cada seed user tiene: WP subscriber + registro en usuarios_ext con es_seed=true.
     *
     * @return array{creados: int, existentes: int, errores: int}
     */
    public static function generarUsuarios(int $cantidad): array
    {
        $resultado = ['creados' => 0, 'existentes' => 0, 'errores' => 0];
        $seedsExistentes = self::contarSeedUsers();

        if ($seedsExistentes >= $cantidad) {
            $resultado['existentes'] = $seedsExistentes;
            return $resultado;
        }

        $faltantes = $cantidad - $seedsExistentes;

        for ($i = 0; $i < $faltantes; $i++) {
            try {
                $username = self::generarUsernameUnico();
                if ($username === null) {
                    $resultado['errores']++;
                    continue;
                }

                $nombreVisible = self::usernameANombreVisible($username);
                $emailInterno = 'seed_' . \strtolower($username) . '@kamples.internal';

                $wpUserId = \wp_insert_user([
                    'user_login'   => $username,
                    'user_email'   => $emailInterno,
                    'user_pass'    => \wp_generate_password(32, true, true),
                    'display_name' => $nombreVisible,
                    'role'         => 'subscriber',
                ]);

                if (\is_wp_error($wpUserId)) {
                    KamplesLogger::warning('SeedUsuarios: error WP al crear ' . $username . ': ' . $wpUserId->get_error_message());
                    $resultado['errores']++;
                    continue;
                }

                $kamId = UsuariosExtRepository::crearSeedUser([
                    'wp_user_id'      => $wpUserId,
                    'username'        => $username,
                    'nombre_visible'  => $nombreVisible,
                    'email'           => $emailInterno,
                ]);

                if ($kamId > 0) {
                    $resultado['creados']++;
                } else {
                    $resultado['errores']++;
                }
            } catch (\Throwable $e) {
                KamplesLogger::warning('SeedUsuarios: excepcion al crear seed user: ' . $e->getMessage());
                $resultado['errores']++;
            }
        }

        $resultado['existentes'] = $seedsExistentes;
        return $resultado;
    }

    /**
     * Distribuye relaciones sin contribuidor entre seed users con distribucion Pareto.
     * Solo toca relaciones con contribuidor_id IS NULL.
     *
     * @return array{asignadas: int, total_relaciones: int}
     */
    public static function atribuirRelaciones(): array
    {
        $seedUsers = self::obtenerSeedUsers();
        if (empty($seedUsers)) {
            return ['asignadas' => 0, 'total_relaciones' => 0, 'error' => 'No hay seed users'];
        }

        $relacionesSinContribuidor = self::relacionesSinContribuidor();
        $totalRelaciones = \count($relacionesSinContribuidor);

        if ($totalRelaciones === 0) {
            return ['asignadas' => 0, 'total_relaciones' => 0];
        }

        $distribucion = self::distribuirPareto($seedUsers, $totalRelaciones);
        \shuffle($relacionesSinContribuidor);

        $asignadas = 0;
        $indice = 0;

        foreach ($distribucion as $seedUserId => $cantidadRelaciones) {
            for ($i = 0; $i < $cantidadRelaciones && $indice < $totalRelaciones; $i++) {
                $relacionId = $relacionesSinContribuidor[$indice];
                try {
                    self::asignarContribuidorARelacion($relacionId, $seedUserId);
                    $asignadas++;
                } catch (\Throwable $e) {
                    KamplesLogger::warning('SeedUsuarios: error atribuyendo relacion ' . $relacionId . ': ' . $e->getMessage());
                }
                $indice++;
            }
        }

        return ['asignadas' => $asignadas, 'total_relaciones' => $totalRelaciones];
    }

    /**
     * Reasigna creador_id de samples auto-extraidos al seed user que contribuyo la relacion.
     * Solo toca samples con cancion_origen_id IS NOT NULL y creador_id = sistema.
     *
     * @return array{reasignados: int}
     */
    public static function atribuirSamples(): array
    {
        $sistemaUserId = self::obtenerSistemaUserId();
        $reasignados = 0;

        try {
            $reasignados = SamplesRepository::reasignarCreadorSeedBatch($sistemaUserId);
        } catch (\Throwable $e) {
            KamplesLogger::warning('SeedUsuarios: error atribuyendo samples: ' . $e->getMessage());
        }

        return ['reasignados' => $reasignados];
    }

    /**
     * Calcula cuantos seed users necesitamos segun relaciones actuales.
     */
    public static function calcularCantidadNecesaria(): int
    {
        $totalRelaciones = self::contarRelacionesTotales();
        $promedio = (SeedConfig::RELACIONES_POR_USER_MIN + SeedConfig::RELACIONES_POR_USER_MAX) / 2;
        return \max(1, (int) \ceil($totalRelaciones / $promedio));
    }

    /* --- Metodos privados --- */

    private static function generarUsernameUnico(): ?string
    {
        $intentos = 0;
        $maxIntentos = 20;

        while ($intentos < $maxIntentos) {
            $adj = SeedConfig::ADJETIVOS[\array_rand(SeedConfig::ADJETIVOS)];
            $sust = SeedConfig::SUSTANTIVOS[\array_rand(SeedConfig::SUSTANTIVOS)];
            $num = \random_int(SeedConfig::NUMERO_MIN, SeedConfig::NUMERO_MAX);
            $username = $adj . $sust . $num;

            if (!\username_exists($username) && !self::existeUsername($username)) {
                return $username;
            }
            $intentos++;
        }

        KamplesLogger::warning('SeedUsuarios: no se pudo generar username unico en ' . $maxIntentos . ' intentos');
        return null;
    }

    private static function usernameANombreVisible(string $username): string
    {
        /* CoolBeat42 → Cool Beat */
        $sinNumero = \preg_replace('/\d+$/', '', $username);
        $partes = \preg_split('/(?=[A-Z])/', $sinNumero, -1, PREG_SPLIT_NO_EMPTY);
        return \implode(' ', $partes);
    }

    private static function existeUsername(string $username): bool
    {
        return UsuariosExtRepository::buscarPorUsername($username) !== null;
    }

    private static function contarSeedUsers(): int
    {
        return UsuariosExtRepository::contarSeedUsers();
    }

    private static function obtenerSeedUsers(): array
    {
        return UsuariosExtRepository::listarSeedUsers();
    }

    private static function relacionesSinContribuidor(): array
    {
        return RelacionesSampleRepository::listarIdsSinContribuidor();
    }

    private static function contarRelacionesTotales(): int
    {
        return RelacionesSampleRepository::contar();
    }

    /**
     * Distribucion Pareto: top 20% users -> ~60% contribuciones, etc.
     * El total asignado nunca excede $totalRelaciones (ajuste por desborde de jitter).
     *
     * @return array<int, int> seedUserId => cantidadRelaciones
     */
    private static function distribuirPareto(array $seedUsers, int $totalRelaciones): array
    {
        $ids = \array_column($seedUsers, UsuariosExtCols::ID);
        $n = \count($ids);
        if ($n === 0) {
            return [];
        }

        \shuffle($ids);
        $distribucion = [];

        $topCount = \max(1, (int) \round($n * 0.2));
        $midCount = \max(1, (int) \round($n * 0.3));

        $topShare = (int) \round($totalRelaciones * 0.60);
        $midShare = (int) \round($totalRelaciones * 0.25);
        $tailShare = $totalRelaciones - $topShare - $midShare;

        $offset = 0;
        $acumulado = 0;

        /* Top 20% */
        $porUsuario = \max(1, (int) \round($topShare / $topCount));
        for ($i = 0; $i < $topCount && $offset < $n; $i++) {
            $jitter = \random_int(-5, 5);
            $cantidad = \max(1, $porUsuario + $jitter);
            $cantidad = \min($cantidad, $totalRelaciones - $acumulado);
            $distribucion[$ids[$offset]] = $cantidad;
            $acumulado += $cantidad;
            $offset++;
        }

        /* Medio 30% */
        $porUsuario = \max(1, (int) \round($midShare / $midCount));
        for ($i = 0; $i < $midCount && $offset < $n; $i++) {
            $jitter = \random_int(-3, 3);
            $cantidad = \max(1, $porUsuario + $jitter);
            $cantidad = \min($cantidad, $totalRelaciones - $acumulado);
            $distribucion[$ids[$offset]] = $cantidad;
            $acumulado += $cantidad;
            $offset++;
        }

        /* Cola 50% */
        $tailCount = $n - $offset;
        if ($tailCount > 0) {
            $porUsuario = \max(1, (int) \round($tailShare / $tailCount));
            for (; $offset < $n; $offset++) {
                $jitter = \random_int(-2, 2);
                $cantidad = \max(1, $porUsuario + $jitter);
                $cantidad = \min($cantidad, $totalRelaciones - $acumulado);
                $distribucion[$ids[$offset]] = $cantidad;
                $acumulado += $cantidad;
            }
        }

        return $distribucion;
    }

    private static function asignarContribuidorARelacion(int $relacionId, int $seedUserId): void
    {
        RelacionesSampleRepository::asignarContribuidorSeed($relacionId, $seedUserId);
    }

    private static function obtenerSistemaUserId(): int
    {
        $envId = $_ENV['KAMPLES_SISTEMA_USUARIO_ID'] ?? \getenv('KAMPLES_SISTEMA_USUARIO_ID');
        if ($envId) {
            return (int) $envId;
        }

        KamplesLogger::warning('SeedUsuarios: KAMPLES_SISTEMA_USUARIO_ID no configurado — usando fallback=' . SeedConfig::SISTEMA_USUARIO_ID_FALLBACK);
        return SeedConfig::SISTEMA_USUARIO_ID_FALLBACK;
    }
}
