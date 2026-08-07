<?php

namespace App\Services;

class WacliService
{
    private const BIN_ENV_KEYS = ['WACLI_BIN', 'OPENCLAW_WACLI_BIN'];
    private const ACCOUNT_ENV_KEYS = ['WACLI_ACCOUNT', 'OPENCLAW_WACLI_ACCOUNT'];
    private const RECIPIENT_ENV_KEYS = ['WHATSAPP_AGENT_TO', 'WHATSAPP_TO', 'WHATSAPP'];

    /**
     * [SEC-007] Constructor: asegura que el directorio temporal privado existe
     * y limpia archivos viejos al instanciar.
     */
    public function __construct()
    {
        $this->asegurarDirectorioTemp();
    }

    /**
     * [SEC-007] Retorna un directorio temporal privado dentro de wp-content/uploads/.
     * No usa sys_get_temp_dir() para evitar que archivos con datos de usuario
     * queden accesibles por otros procesos del sistema.
     */
    private function obtenerDirectorioTemp(): string
    {
        $uploadDir = wp_upload_dir();
        return rtrim($uploadDir['basedir'], '/\\') . '/glory_media_temp';
    }

    /**
     * Crea el directorio temporal con protección .htaccess y limpia archivos viejos.
     */
    private function asegurarDirectorioTemp(): void
    {
        $tempDir = $this->obtenerDirectorioTemp();
        if (!is_dir($tempDir)) {
            wp_mkdir_p($tempDir);
            /* [SEC-007] Sin @: verificar el resultado en vez de silenciar el warning */
            if (file_put_contents($tempDir . '/.htaccess', "Deny from all\n") === false) {
                error_log('[WacliService] No se pudo escribir .htaccess en ' . $tempDir);
            }
        }
        /* Limpiar archivos con más de 1 hora */
        $this->limpiarArchivosViejos($tempDir, 3600);
    }

    /**
     * Elimina archivos temporales más viejos que maxAgeSecs segundos.
     */
    private function limpiarArchivosViejos(string $dir, int $maxAgeSecs): void
    {
        $files = glob($dir . '/*');
        if ($files === false) {
            return;
        }
        $now = time();
        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > $maxAgeSecs) {
                if (!unlink($file)) {
                    error_log('[WacliService] No se pudo limpiar temporal: ' . $file);
                }
            }
        }
    }

    public function estado(): array
    {
        $bin = $this->obtenerBinario();
        $account = $this->obtenerEnv(self::ACCOUNT_ENV_KEYS);
        $recipient = $this->resolverDestinatario(null, false);
        $instalado = $this->comandoDisponible($bin);
        $auth = ['checked' => false, 'authenticated' => false];

        if ($instalado) {
            try {
                $resultado = $this->ejecutarWacli(['--read-only', 'auth', 'status'], 20);
                $json = json_decode($resultado['stdout'], true);
                $auth = is_array($json)
                    ? ['checked' => true, 'authenticated' => (bool)($json['authenticated'] ?? false), 'linked_jid' => $this->mascarar((string)($json['linked_jid'] ?? ''))]
                    : ['checked' => true, 'authenticated' => false, 'raw' => trim($resultado['stdout'])];
            } catch (\Throwable $e) {
                $auth = ['checked' => true, 'authenticated' => false, 'error' => $e->getMessage()];
            }
        }

        return [
            'provider' => 'wacli',
            'installed' => $instalado,
            'localMode' => $this->modoLocalActivo(),
            'bin' => $bin,
            'account' => $account !== '' ? $account : null,
            'defaultRecipientConfigured' => $recipient !== '',
            'defaultRecipientMasked' => $this->mascarar($recipient),
            'auth' => $auth,
            'notes' => [
                'wacli usa WhatsApp como dispositivo vinculado; requiere pairing previo en el servidor.',
                'Los env admitidos son WACLI_BIN, WACLI_ACCOUNT y WHATSAPP_AGENT_TO/WHATSAPP_TO/WHATSAPP.',
            ],
        ];
    }

    public function enviarTexto(?string $to, string $message): array
    {
        $recipient = $this->resolverDestinatario($to, true);
        $message = trim($message);

        if ($message === '') {
            throw new \InvalidArgumentException('El mensaje de WhatsApp no puede estar vacío.');
        }

        if (strlen($message) > 4000) {
            throw new \InvalidArgumentException('El mensaje de WhatsApp supera el límite interno de 4000 caracteres.');
        }

        if (!$this->comandoDisponible($this->obtenerBinario())) {
            if ($this->modoLocalActivo()) {
                return [
                    'provider' => 'wacli-local',
                    'localMode' => true,
                    'toMasked' => $this->mascarar($recipient),
                    'exitCode' => 0,
                    'stdout' => ['message' => 'Envío simulado en local. Instala/autentica wacli para enviar WhatsApp real.'],
                    'stderr' => '',
                ];
            }
            throw new \RuntimeException('wacli no está instalado o no está disponible en PATH.');
        }

        $resultado = $this->ejecutarWacli([
            'send',
            'text',
            '--to',
            $recipient,
            '--message',
            $message,
            '--post-send-wait',
            '2s',
        ], 120);

        $json = json_decode($resultado['stdout'], true);

        return [
            'provider' => 'wacli',
            'toMasked' => $this->mascarar($recipient),
            'exitCode' => $resultado['exitCode'],
            'stdout' => is_array($json) ? $json : trim($resultado['stdout']),
            'stderr' => trim($resultado['stderr']),
        ];
    }

    /**
     * [125B-1] Sobrecarga multi-account: ejecuta wacli con account y store-dir específicos.
     * Lee los parámetros de glory_whatsapp_accounts según el userId.
     *
     * @param int    $userId  ID del usuario WordPress
     * @param array  $args    Argumentos para wacli
     * @param int    $timeout Timeout en segundos
     * @return array          ['exitCode' => int, 'stdout' => string, 'stderr' => string]
     */
    public function ejecutarComoUsuario(int $userId, array $args, int $timeout = 60): array
    {
        global $wpdb;

        $table = $wpdb->prefix . 'glory_whatsapp_accounts';
        $cuenta = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT account_name, store_path FROM $table WHERE user_id = %d AND enabled = 1",
                $userId
            )
        );

        if (!$cuenta) {
            throw new \RuntimeException("Cuenta WhatsApp no encontrada o deshabilitada para user_id={$userId}");
        }

        $accountName = $cuenta->account_name;
        $storeDir    = $cuenta->store_path ?? '';

        $bin = $this->obtenerBinario();
        $parts = [$bin];

        if ($accountName !== '') {
            $parts[] = '--account';
            $parts[] = $accountName;
        }
        if ($storeDir !== '') {
            $parts[] = '--store-dir';
            $parts[] = $storeDir;
        }

        $parts[] = '--lock-wait';
        $parts[] = min(30, max(5, (int)floor($timeout / 2))) . 's';
        $parts[] = '--json';
        $parts[] = '--timeout';
        $parts[] = $timeout . 's';
        $parts = array_merge($parts, $args);

        return $this->ejecutarProcOpen($parts, $timeout);
    }

    /**
     * [125B-1] Envía texto como un usuario específico (multi-account).
     * No requiere env var WHATSAPP — usa el JID del destinatario directamente.
     *
     * @param int    $userId     ID del usuario WordPress
     * @param string $jid        JID del destinatario (ej: 584141234567@s.whatsapp.net)
     * @param string $message    Contenido del mensaje (máx 4000 caracteres)
     * @return array             Resultado de wacli
     */
    public function enviarTextoComoUsuario(int $userId, string $jid, string $message): array
    {
        $message = trim($message);
        if ($message === '') {
            throw new \InvalidArgumentException('El mensaje de WhatsApp no puede estar vacío.');
        }
        if (strlen($message) > 4000) {
            throw new \InvalidArgumentException('El mensaje de WhatsApp supera el límite interno de 4000 caracteres.');
        }

        if (!$this->comandoDisponible($this->obtenerBinario())) {
            throw new \RuntimeException('wacli no está instalado o no está disponible en PATH.');
        }

        $resultado = $this->ejecutarComoUsuario($userId, [
            'send', 'text',
            '--to', $jid,
            '--message', $message,
            '--post-send-wait', '2s',
        ], 120);

        $json = json_decode($resultado['stdout'], true);

        return [
            'provider' => 'wacli',
            'toMasked' => $this->mascarar($jid),
            'exitCode' => $resultado['exitCode'],
            'stdout' => is_array($json) ? $json : trim($resultado['stdout']),
            'stderr' => trim($resultado['stderr']),
        ];
    }

    /**
     * Descarga un archivo de media recibido por WhatsApp usando wacli.
     * [115A-5] Retorna la ruta al archivo temporal. El llamador es responsable de unlink().
     * [116A-3] API actualizada: wacli media download usa --chat y --id (ya no --direct-path/--media-key).
     *
     * @param string $chat       Chat JID (ej: 55959850381429@lid)
     * @param string $messageId  ID del mensaje (ej: A5D6288F4A70D61E70E4E765760C03E9)
     * @param string $mediaType  MIME type (ej: image/jpeg, audio/ogg; codecs=opus)
     * @return string            Ruta al archivo temporal descargado
     */
    public function descargarMedia(string $chat, string $messageId, string $mediaType): string
    {
        $baseMime = trim(explode(';', $mediaType)[0]);
        $ext      = preg_replace('/[^a-z0-9]/', '', explode('/', $baseMime)[1] ?? 'bin') ?: 'bin';
        /* [SEC-007] Usar directorio temporal privado, no sys_get_temp_dir() */
        $tmpFile  = $this->obtenerDirectorioTemp() . '/wacli_media_' . md5($chat . $messageId) . '.' . $ext;

        /* wacli media download --chat <jid> --id <msgid> --output <file> */
        $this->ejecutarWacli([
            'media', 'download',
            '--chat',   $chat,
            '--id',     $messageId,
            '--output', $tmpFile,
        ], 45);

        if (!file_exists($tmpFile) || filesize($tmpFile) === 0) {
            throw new \RuntimeException('wacli no generó el archivo de media esperado en ' . $tmpFile);
        }

        return $tmpFile;
    }

    /**
     * [125A-5] Descarga y descifra media de WhatsApp directamente desde el CDN de Meta,
     * sin usar wacli ni necesitar el store lock.
     *
     * Algoritmo:
     *   1. Derivar clave/IV con HKDF-SHA256(mediaKey, 112 bytes, appInfo según tipo).
     *   2. Descargar el archivo cifrado desde mmg.whatsapp.net + DirectPath.
     *   3. Quitar los últimos 10 bytes (firma HMAC-SHA256 de WhatsApp).
     *   4. Descifrar con AES-256-CBC.
     *
     * @param array $mediaEvento  Debe incluir: 'directPath', 'mediaKey', 'type', 'mimeType'
     * @return string             Ruta al archivo temporal descifrado (el llamador hace unlink)
     */
    public function descargarMediaDirecto(array $mediaEvento): string
    {
        $directPath  = (string)($mediaEvento['directPath'] ?? '');
        $mediaKeyB64 = (string)($mediaEvento['mediaKey'] ?? '');
        $mediaType   = strtolower((string)($mediaEvento['type'] ?? ''));
        $mimeType    = (string)($mediaEvento['mimeType'] ?? $mediaType);

        if ($directPath === '' || $mediaKeyB64 === '') {
            throw new \RuntimeException('descargarMediaDirecto: faltan directPath o mediaKey.');
        }

        $mediaKey = base64_decode($mediaKeyB64, true);
        if ($mediaKey === false || strlen($mediaKey) < 32) {
            throw new \RuntimeException('descargarMediaDirecto: mediaKey inválida (base64 decode falló).');
        }

        /* App info según tipo: https://github.com/tulir/whatsmeow/blob/main/download.go */
        $appInfo = match ($mediaType) {
            'image'    => 'WhatsApp Image Keys',
            'video'    => 'WhatsApp Video Keys',
            'document' => 'WhatsApp Document Keys',
            'sticker'  => 'WhatsApp Image Keys',
            default    => 'WhatsApp Audio Keys',   /* audio, ptt, etc. */
        };

        /* HKDF-SHA256: IKM=mediaKey, salt='' (vacío = ceros en RFC 5869 extract), info=appInfo, length=112 */
        $expanded  = hash_hkdf('sha256', $mediaKey, 112, $appInfo, '');
        $iv        = substr($expanded, 0, 16);
        $cipherKey = substr($expanded, 16, 32);

        /* Descargar el archivo cifrado desde el CDN de Meta */
        $url = 'https://mmg.whatsapp.net' . $directPath;
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_USERAGENT      => 'WhatsApp/2.24.6.80 A',
        ]);
        $encryptedData = curl_exec($ch);
        $httpCode      = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr       = curl_error($ch);
        curl_close($ch);

        if ($encryptedData === false || $curlErr !== '') {
            throw new \RuntimeException('descargarMediaDirecto: cURL falló: ' . $curlErr);
        }
        if ($httpCode < 200 || $httpCode >= 300) {
            throw new \RuntimeException("descargarMediaDirecto: CDN respondió HTTP {$httpCode} para {$url}.");
        }

        /* Quitar los últimos 10 bytes (HMAC-SHA256 que WhatsApp añade al final) */
        $dataToDecrypt = substr($encryptedData, 0, -10);

        /* Descifrar AES-256-CBC */
        $decrypted = openssl_decrypt($dataToDecrypt, 'AES-256-CBC', $cipherKey, OPENSSL_RAW_DATA, $iv);
        if ($decrypted === false) {
            throw new \RuntimeException('descargarMediaDirecto: AES-256-CBC falló. Puede que la mediaKey haya expirado.');
        }

        /* Extensión basada en MIME */
        $baseMime = trim(explode(';', $mimeType)[0]);
        $ext      = preg_replace('/[^a-z0-9]/', '', explode('/', $baseMime)[1] ?? 'bin') ?: 'bin';
        /* [SEC-007] Usar directorio temporal privado, no sys_get_temp_dir() */
        $tmpFile  = $this->obtenerDirectorioTemp() . '/wamedia_' . md5($directPath) . '.' . $ext;

        if (file_put_contents($tmpFile, $decrypted) === false) {
            throw new \RuntimeException('descargarMediaDirecto: no se pudo escribir el archivo temporal.');
        }

        if (filesize($tmpFile) === 0) {
            if (!unlink($tmpFile)) {
                error_log('[WacliService] No se pudo limpiar media temporal: ' . $tmpFile);
            }
            throw new \RuntimeException('descargarMediaDirecto: archivo temporal vacío tras descifrar.');
        }

        /* [SEC-002] Log solo tipo y extensión, no tamaño del archivo */
        error_log('[WacliService] Media descargada CDN: type=' . $mediaType . ' ext=' . $ext);
        return $tmpFile;
    }

    public function resolverDestinatario(?string $to, bool $required): string
    {
        $recipient = trim((string)($to ?? ''));
        if ($recipient === '') {
            $recipient = $this->obtenerEnv(self::RECIPIENT_ENV_KEYS);
        }

        if ($recipient === '' && $required) {
            throw new \RuntimeException('No hay destinatario WhatsApp. Configura WHATSAPP_AGENT_TO, WHATSAPP_TO o WHATSAPP.');
        }

        if ($recipient !== '' && !preg_match('/^[A-Za-z0-9@._+\-\s]+$/', $recipient)) {
            throw new \InvalidArgumentException('El destinatario WhatsApp contiene caracteres no permitidos.');
        }

        return $recipient;
    }

    /**
     * [125B-1] Ejecuta un array de argumentos wacli como proceso externo (env-based, legacy).
     * Para multi-account, usar ejecutarComoUsuario().
     */
    private function ejecutarWacli(array $args, int $timeoutSeconds): array
    {
        $bin = $this->obtenerBinario();
        $account = $this->obtenerEnv(self::ACCOUNT_ENV_KEYS);
        $parts = [$bin];

        if ($account !== '') {
            $parts[] = '--account';
            $parts[] = $account;
        }

        /* [116A-4] wacli sync --follow puede mantener el store ocupado brevemente.
         * --lock-wait evita fallos transitorios tipo "store is locked" en media/send. */
        $parts[] = '--lock-wait';
        $parts[] = min(30, max(5, (int)floor($timeoutSeconds / 2))) . 's';
        $parts[] = '--json';
        $parts[] = '--timeout';
        $parts[] = $timeoutSeconds . 's';
        $parts = array_merge($parts, $args);

        return $this->ejecutarProcOpen($parts, $timeoutSeconds);
    }

    /**
     * [125B-1] Núcleo de ejecución del proceso compartido entre env-based y multi-account.
     * Maneja pipes, timeout, y parseo de salida. Lanza RuntimeException si falla.
     *
     * @param array $parts          Array de argumentos (bin + args)
     * @param int   $timeoutSeconds Timeout total en segundos
     * @return array                ['exitCode' => int, 'stdout' => string, 'stderr' => string]
     */
    private function ejecutarProcOpen(array $parts, int $timeoutSeconds): array
    {
        if (!function_exists('proc_open')) {
            throw new \RuntimeException('proc_open no está disponible para ejecutar wacli.');
        }

        $descriptorSpec = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        /* proc_open en forma array ($parts) nunca invoca shell (PHP 7.4+); la regla no
         * puede verificar que $parts es un array porque llega como variable. $bin se
         * valida en comandoDisponible() y el resto de argumentos son valores tipados. */
        /* sentinel-disable-next-line exec-sin-escapeshellarg */
        $process = proc_open($parts, $descriptorSpec, $pipes);
        if (!is_resource($process)) {
            throw new \RuntimeException('No se pudo iniciar wacli.');
        }

        fclose($pipes[0]);
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);

        $stdout = '';
        $stderr = '';
        $exitCode = -1;
        $start = time();

        while (true) {
            $stdout .= stream_get_contents($pipes[1]) ?: '';
            $stderr .= stream_get_contents($pipes[2]) ?: '';
            $status = proc_get_status($process);

            if (!$status['running']) {
                $exitCode = (int)($status['exitcode'] ?? -1);
                break;
            }

            if ((time() - $start) > $timeoutSeconds) {
                proc_terminate($process);
                throw new \RuntimeException('Timeout ejecutando wacli.');
            }

            usleep(100000);
        }

        $stdout .= stream_get_contents($pipes[1]) ?: '';
        $stderr .= stream_get_contents($pipes[2]) ?: '';
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);

        if ($exitCode !== 0) {
            $detalle = trim($stderr) !== '' ? trim($stderr) : trim($stdout);
            throw new \RuntimeException('wacli falló: ' . substr($detalle, 0, 500));
        }

        return ['exitCode' => $exitCode, 'stdout' => $stdout, 'stderr' => $stderr];
    }

    private function comandoDisponible(string $bin): bool
    {
        if ($bin === '') {
            return false;
        }

        if (str_contains($bin, DIRECTORY_SEPARATOR) || str_contains($bin, '/')) {
            return is_file($bin) && is_executable($bin);
        }

        $paths = explode(PATH_SEPARATOR, (string)getenv('PATH'));
        $extensions = DIRECTORY_SEPARATOR === '\\'
            ? array_filter(array_map('trim', explode(';', (string)(getenv('PATHEXT') ?: '.COM;.EXE;.BAT;.CMD'))))
            : [''];
        $hasExtension = pathinfo($bin, PATHINFO_EXTENSION) !== '';

        foreach ($paths as $path) {
            $path = trim($path);
            if ($path === '') {
                continue;
            }
            foreach ($extensions as $extension) {
                $candidate = rtrim($path, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $bin . ($hasExtension ? '' : $extension);
                if (is_file($candidate) && (DIRECTORY_SEPARATOR === '\\' || is_executable($candidate))) {
                    return true;
                }
            }
        }

        return false;
    }

    private function obtenerBinario(): string
    {
        $bin = $this->obtenerEnv(self::BIN_ENV_KEYS);
        return $bin !== '' ? $bin : 'wacli';
    }

    private function obtenerEnv(array $keys): string
    {
        return EnvService::first($keys);
    }

    private function modoLocalActivo(): bool
    {
        $flag = EnvService::get('WACLI_LOCAL_MODE');
        if ($flag !== '') {
            return filter_var($flag, FILTER_VALIDATE_BOOLEAN);
        }
        return filter_var(EnvService::get('LOCAL'), FILTER_VALIDATE_BOOLEAN) || filter_var(EnvService::get('DEV'), FILTER_VALIDATE_BOOLEAN);
    }

    private function mascarar(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        $length = strlen($value);
        if ($length <= 6) {
            return str_repeat('*', $length);
        }

        return substr($value, 0, 3) . str_repeat('*', max(0, $length - 6)) . substr($value, -3);
    }
}
