<?php

/**
 * Servicio de Cifrado de Datos
 *
 * Proporciona cifrado AES-256-GCM para datos sensibles del usuario.
 * Cada usuario tiene una clave derivada única basada en AUTH_KEY + user_id.
 *
 * Características:
 * - Cifrado simétrico AES-256-GCM (autenticado)
 * - IV único por cada operación de cifrado
 * - Clave derivada por usuario (aislamiento de datos)
 * - Formato de almacenamiento: base64(iv:tag:ciphertext)
 *
 * @package App\Services
 */

namespace App\Services;

class CifradoService
{
    private const CIPHER = 'aes-256-gcm';
    private const IV_LENGTH = 12;
    private const TAG_LENGTH = 16;
    private const PREFIJO_CIFRADO = 'ENC:';

    private string $claveUsuario;

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario inválido para cifrado');
        }
        $this->claveUsuario = $this->derivarClave($userId);
    }

    /**
     * Cifra un string de datos
     * 
     * @param string $datos Datos en texto plano (generalmente JSON)
     * @return string Datos cifrados en formato base64 con prefijo
     */
    public function cifrar(string $datos): string
    {
        if (empty($datos)) {
            return $datos;
        }

        $iv = random_bytes(self::IV_LENGTH);
        $tag = '';

        $datosCifrados = openssl_encrypt(
            $datos,
            self::CIPHER,
            $this->claveUsuario,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            self::TAG_LENGTH
        );

        if ($datosCifrados === false) {
            error_log('[CifradoService] Error al cifrar datos: ' . openssl_error_string());
            throw new \RuntimeException('Error al cifrar datos');
        }

        /* Formato: iv (12 bytes) + tag (16 bytes) + ciphertext */
        $combinado = $iv . $tag . $datosCifrados;

        return self::PREFIJO_CIFRADO . base64_encode($combinado);
    }

    /**
     * Descifra un string de datos previamente cifrado
     * 
     * @param string $datosCifrados Datos cifrados con prefijo ENC:
     * @return string Datos en texto plano
     */
    public function descifrar(string $datosCifrados): string
    {
        if (empty($datosCifrados)) {
            return $datosCifrados;
        }

        /* Si no tiene el prefijo, asumir que no está cifrado (migración) */
        if (!$this->estaCifrado($datosCifrados)) {
            return $datosCifrados;
        }

        /* Remover prefijo y decodificar */
        $datosSinPrefijo = substr($datosCifrados, strlen(self::PREFIJO_CIFRADO));
        $combinado = base64_decode($datosSinPrefijo, true);

        if ($combinado === false || strlen($combinado) < self::IV_LENGTH + self::TAG_LENGTH) {
            error_log('[CifradoService] Datos cifrados malformados');
            throw new \RuntimeException('Datos cifrados inválidos');
        }

        /* Extraer componentes */
        $iv = substr($combinado, 0, self::IV_LENGTH);
        $tag = substr($combinado, self::IV_LENGTH, self::TAG_LENGTH);
        $ciphertext = substr($combinado, self::IV_LENGTH + self::TAG_LENGTH);

        $datosDescifrados = openssl_decrypt(
            $ciphertext,
            self::CIPHER,
            $this->claveUsuario,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($datosDescifrados === false) {
            error_log('[CifradoService] Error al descifrar: ' . openssl_error_string());
            throw new \RuntimeException('Error al descifrar datos - posible clave incorrecta');
        }

        return $datosDescifrados;
    }

    /**
     * Verifica si los datos están cifrados
     */
    public function estaCifrado(string $datos): bool
    {
        return str_starts_with($datos, self::PREFIJO_CIFRADO);
    }

    /**
     * Cifra un array (lo convierte a JSON primero)
     */
    public function cifrarArray(array $datos): string
    {
        $json = json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->cifrar($json);
    }

    /**
     * Descifra y decodifica un array
     */
    public function descifrarArray(string $datosCifrados, array $default = []): array
    {
        if (empty($datosCifrados)) {
            return $default;
        }

        try {
            $json = $this->descifrar($datosCifrados);
            $decoded = json_decode($json, true);
            return is_array($decoded) ? $decoded : $default;
        } catch (\Exception $e) {
            error_log('[CifradoService] Error descifrar array: ' . $e->getMessage());
            return $default;
        }
    }

    /**
     * Deriva una clave única para cada usuario
     * 
     * Usa HKDF (HMAC-based Key Derivation Function) para crear
     * una clave de 256 bits específica por usuario.
     */
    private function derivarClave(int $userId): string
    {
        $claveBase = $this->obtenerClaveBase();
        $salt = 'glory_dashboard_v1_' . $userId;

        /* HKDF usando SHA-256 */
        return hash_hkdf(
            'sha256',
            $claveBase,
            32,
            'user_encryption_key',
            $salt
        );
    }

    /**
     * Obtiene la clave base del sistema
     * 
     * Usa AUTH_KEY de WordPress como fuente de entropía.
     * Si no existe, usa una clave de fallback (menos segura).
     */
    private function obtenerClaveBase(): string
    {
        if (defined('AUTH_KEY') && strlen(AUTH_KEY) >= 32) {
            return AUTH_KEY;
        }

        if (defined('SECURE_AUTH_KEY') && strlen(SECURE_AUTH_KEY) >= 32) {
            return SECURE_AUTH_KEY;
        }

        /* Fallback: Usar una clave derivada del path absoluto (única por instalación) */
        error_log('[CifradoService] ADVERTENCIA: Usando clave de fallback, configura AUTH_KEY en wp-config.php');
        return hash('sha256', ABSPATH . 'glory_fallback_key', true);
    }

    /**
     * Verifica si el cifrado está habilitado para el usuario
     */
    public static function estaHabilitado(int $userId): bool
    {
        $config = get_user_meta($userId, '_glory_dashboard_config', true);

        error_log('[CifradoService] estaHabilitado user=' . $userId . ' raw_config=' . (is_string($config) ? substr($config, 0, 200) : gettype($config)));

        if (empty($config)) {
            error_log('[CifradoService] Config vacía, retornando false');
            return false;
        }

        if (is_string($config)) {
            $config = json_decode($config, true);
        }

        $resultado = !empty($config['cifradoE2E']);
        error_log('[CifradoService] cifradoE2E=' . ($config['cifradoE2E'] ?? 'no definido') . ' resultado=' . ($resultado ? 'true' : 'false'));

        return $resultado;
    }

    /**
     * Rota la clave de cifrado del usuario (re-cifra todos los datos)
     * 
     * NOTA: Este método es costoso y debe usarse con precaución.
     * Útil cuando se compromete la clave o se migra a nueva versión.
     */
    public function rotarClave(int $userId, callable $obtenerDatos, callable $guardarDatos): bool
    {
        // Implementación pendiente: requiere descifrar con clave antigua y re-cifrar
        return false;
    }

    /**
     * Genera un hash seguro para verificación de integridad
     */
    public function generarHash(string $datos): string
    {
        return hash_hmac('sha256', $datos, $this->claveUsuario);
    }

    /**
     * Verifica la integridad de los datos
     */
    public function verificarHash(string $datos, string $hashEsperado): bool
    {
        $hashCalculado = $this->generarHash($datos);
        return hash_equals($hashEsperado, $hashCalculado);
    }
}
