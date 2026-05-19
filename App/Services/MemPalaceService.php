<?php

namespace App\Services;

/* [109A] Wrapper PHP para la API REST de MemPalace.
 * MemPalace corre en el host como systemd service (mempalace-api) en 127.0.0.1:4001.
 * El contenedor WordPress accede via http://host.docker.internal:4001 (extra_hosts en compose).
 * En local (LOCAL=true) o si la API no responde, opera en modo degradado (sin memoria semántica).
 * Rutas:
 *   GET  /health          → {ok: true}
 *   GET  /search?q=...    → {text: "...", ok: bool}
 *   POST /remember        → {content, category} → {ok: bool}
 */
class MemPalaceService
{
    private const API_LOCAL  = 'http://127.0.0.1:4001';
    private const API_DOCKER = 'http://host.docker.internal:4001';
    private const TIMEOUT    = 6; // [185A-2] 6s — búsqueda vectorial tarda ~3-4s; 3s causaba timeout en cada mensaje

    private string $baseUrl;
    private bool   $disponible;

    public function __construct()
    {
        /* En LOCAL el host puede ser 127.0.0.1 directo; en producción usamos host.docker.internal */
        $esLocal = filter_var(getenv('LOCAL') ?: '', FILTER_VALIDATE_BOOLEAN);
        $this->baseUrl   = $esLocal ? self::API_LOCAL : self::API_DOCKER;
        $this->disponible = false; // se verifica en la primera operación
    }

    /* --- Interfaz pública -------------------------------------------------- */

    /**
     * Busca memorias relevantes para la query. Retorna texto vacío si no disponible.
     * Se inyecta en el system prompt como "## Memorias relevantes".
     * @param int|null $userId WP user ID para aislar memoria por usuario (null = global)
     */
    public function search(string $query, ?int $userId = null): string
    {
        if (trim($query) === '') {
            return '';
        }
        try {
            $params = ['q' => $query, 'limit' => 5];
            if ($userId !== null) {
                $params['namespace'] = 'user_' . $userId;
            }
            $resp = $this->get('/search', $params);
            return is_string($resp['text'] ?? null) ? trim($resp['text']) : '';
        } catch (\Throwable $e) {
            error_log('[MemPalace] search falló: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Guarda un hecho/resumen en MemPalace. No bloquea si falla.
     * @param string   $content  Texto del hecho a recordar
     * @param string   $category Wing/categoría ('chat', 'preferencias', 'hechos', 'whatsapp')
     * @param int|null $userId   WP user ID para aislar memoria por usuario (null = global)
     */
    public function remember(string $content, string $category = 'chat', ?int $userId = null): bool
    {
        $content = trim($content);
        if ($content === '') {
            return false;
        }
        try {
            $body = ['content' => $content, 'category' => $category];
            if ($userId !== null) {
                $body['namespace'] = 'user_' . $userId;
            }
            $resp = $this->post('/remember', $body);
            return !empty($resp['ok']);
        } catch (\Throwable $e) {
            error_log('[MemPalace] remember falló: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Verifica si la API está disponible. Se cachea en memoria de proceso.
     */
    public function disponible(): bool
    {
        if ($this->disponible) {
            return true;
        }
        try {
            $resp = $this->get('/health');
            $this->disponible = !empty($resp['ok']);
        } catch (\Throwable) {
            $this->disponible = false;
        }
        return $this->disponible;
    }

    /* --- HTTP helpers ------------------------------------------------------- */

    private function get(string $path, array $params = []): array
    {
        $url = $this->baseUrl . $path;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        return $this->request('GET', $url);
    }

    private function post(string $path, array $body): array
    {
        return $this->request('POST', $this->baseUrl . $path, $body);
    }

    private function request(string $method, string $url, array $body = []): array
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => self::TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
        }

        $raw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError !== '') {
            throw new \RuntimeException("MemPalace curl error: {$curlError}");
        }
        if ($httpCode >= 400) {
            throw new \RuntimeException("MemPalace HTTP {$httpCode}");
        }

        $decoded = json_decode((string)$raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
