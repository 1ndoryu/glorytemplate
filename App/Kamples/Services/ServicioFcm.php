<?php

/**
 * ServicioFcm — Envio de notificaciones push via Firebase Cloud Messaging (HTTP v1 API).
 *
 * Usa service account JSON para autenticacion OAuth2.
 * El JSON se almacena en la env var KAMPLES_FCM_SERVICE_ACCOUNT_JSON
 * (contenido completo del archivo JSON, no una ruta).
 *
 * QL34: Notificaciones push para Android con app cerrada.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\FcmTokensRepository;
use App\Kamples\KamplesLogger;
use Firebase\JWT\JWT;
use GuzzleHttp\Client;

class ServicioFcm
{
    private static ?string $accessToken = null;
    private static int $tokenExpiraEn = 0;
    private static ?Client $httpClient = null;

    /**
     * Enviar notificacion push a todos los dispositivos FCM de un usuario.
     * Fire-and-forget: si FCM no esta configurado, retorna silenciosamente.
     */
    public static function enviarAUsuario(int $userId, string $titulo, string $mensaje, array $datos = []): void
    {
        $serviceAccount = self::obtenerServiceAccount();
        if ($serviceAccount === null) {
            /* [183A-43] Log explícito cuando FCM no está configurado para no fallar silenciosamente */
            KamplesLogger::warning('ServicioFcm: KAMPLES_FCM_SERVICE_ACCOUNT_JSON no configurada, push deshabilitado');
            return;
        }

        $tokens = FcmTokensRepository::obtenerPorUsuario($userId);
        if (empty($tokens)) {
            return;
        }

        $accessToken = self::obtenerAccessToken($serviceAccount);
        if ($accessToken === null) {
            return;
        }

        $projectId = $serviceAccount['project_id'] ?? '';
        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        /* Serializar datos a strings (FCM data payload requiere valores string) */
        $datosString = [];
        foreach ($datos as $key => $value) {
            $datosString[(string) $key] = is_string($value) ? $value : (string) json_encode($value);
        }

        foreach ($tokens as $registro) {
            $tokenFcm = $registro['token'] ?? '';
            if ($tokenFcm === '') {
                continue;
            }

            try {
                $payload = [
                    'message' => [
                        'token' => $tokenFcm,
                        'data' => array_merge($datosString, [
                            'titulo' => $titulo,
                            'cuerpo' => $mensaje,
                        ]),
                        /*
                         * QL102: notification field para entrega con app cerrada.
                         * Con solo data field, algunos OEMs Android suprimen el mensaje
                         * si la app esta killed. Con notification field presente,
                         * Android lo muestra automaticamente en background.
                         * En foreground, onMessageReceived() sigue usando el data field.
                         */
                        'notification' => [
                            'title' => $titulo,
                            'body'  => $mensaje,
                        ],
                        'android' => [
                            'priority' => 'high',
                            'notification' => [
                                'channel_id'         => ($datosString['tipo'] ?? '') === 'mensaje_nuevo' ? 'mensajes' : 'notificaciones',
                                'icon'               => 'ic_notification',
                                'default_sound'      => true,
                                'notification_count' => 1,
                            ],
                        ],
                    ],
                ];

                $response = self::getHttpClient()->post($url, [
                    'headers' => [
                        'Authorization' => "Bearer {$accessToken}",
                        'Content-Type' => 'application/json',
                    ],
                    'json' => $payload,
                    'timeout' => 10,
                    'http_errors' => false,
                ]);

                $statusCode = $response->getStatusCode();

                /* Token invalido o expirado: marcar inactivo */
                if ($statusCode === 404 || $statusCode === 410) {
                    FcmTokensRepository::marcarInactivo($tokenFcm);
                    KamplesLogger::info('ServicioFcm: token inactivo removido', [
                        'userId' => $userId,
                        'status' => $statusCode,
                    ]);
                } elseif ($statusCode !== 200) {
                    $body = $response->getBody()->getContents();
                    KamplesLogger::warning('ServicioFcm: error enviando push', [
                        'userId' => $userId,
                        'status' => $statusCode,
                        'body'   => mb_substr($body, 0, 500),
                    ]);
                }
            } catch (\Throwable $e) {
                KamplesLogger::error('ServicioFcm: excepcion enviando push', [
                    'userId' => $userId,
                    'error'  => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Obtener el service account JSON desde env var.
     * Retorna null si no esta configurado (FCM deshabilitado).
     */
    private static function obtenerServiceAccount(): ?array
    {
        $json = $_ENV['KAMPLES_FCM_SERVICE_ACCOUNT_JSON']
            ?? getenv('KAMPLES_FCM_SERVICE_ACCOUNT_JSON')
            ?: '';

        if ($json === '') {
            return null;
        }

        $decoded = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            KamplesLogger::error('ServicioFcm: JSON de service account invalido', [
                'jsonError' => json_last_error_msg(),
            ]);
            return null;
        }

        return $decoded;
    }

    /**
     * Obtener access token OAuth2 para Firebase API.
     * Genera JWT firmado con la private key del service account,
     * lo intercambia por un access token de Google.
     * Cache en memoria: reutiliza hasta 5 min antes de expirar.
     */
    private static function obtenerAccessToken(array $serviceAccount): ?string
    {
        /* Cache: reutilizar token si aun es valido (con 5 min de margen) */
        if (self::$accessToken !== null && time() < (self::$tokenExpiraEn - 300)) {
            return self::$accessToken;
        }

        $clientEmail = $serviceAccount['client_email'] ?? '';
        $privateKey = $serviceAccount['private_key'] ?? '';

        if ($clientEmail === '' || $privateKey === '') {
            KamplesLogger::error('ServicioFcm: service account incompleto (falta client_email o private_key)');
            return null;
        }

        $now = time();
        $jwtPayload = [
            'iss' => $clientEmail,
            'sub' => $clientEmail,
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        ];

        try {
            $jwt = JWT::encode($jwtPayload, $privateKey, 'RS256');

            $response = self::getHttpClient()->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion' => $jwt,
                ],
                'timeout' => 10,
                'http_errors' => false,
            ]);

            if ($response->getStatusCode() !== 200) {
                KamplesLogger::error('ServicioFcm: error obteniendo access token', [
                    'status' => $response->getStatusCode(),
                    'body'   => mb_substr($response->getBody()->getContents(), 0, 500),
                ]);
                return null;
            }

            $body = json_decode($response->getBody()->getContents(), true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
                KamplesLogger::error('ServicioFcm: respuesta OAuth invalida', [
                    'jsonError' => json_last_error_msg(),
                ]);
                return null;
            }

            if (!isset($body['access_token'])) {
                KamplesLogger::error('ServicioFcm: respuesta OAuth sin access_token');
                return null;
            }

            self::$accessToken = $body['access_token'];
            self::$tokenExpiraEn = $now + ($body['expires_in'] ?? 3600);

            return self::$accessToken;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioFcm: excepcion obteniendo access token', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private static function getHttpClient(): Client
    {
        if (self::$httpClient === null) {
            self::$httpClient = new Client([
                'verify' => true,
            ]);
        }
        return self::$httpClient;
    }
}
