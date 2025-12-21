<?php

namespace App\Services;

use Google\Client;
use Google\Service\Oauth2;

/**
 * Servicio para manejar la autenticación con Google OAuth 2.0
 */
class GoogleAuthService
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId($_ENV['GOOGLE_CLIENT_ID'] ?? '');
        $this->client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET'] ?? '');
        $this->client->setRedirectUri(home_url('/dashboard'));
        $this->client->addScope('email');
        $this->client->addScope('profile');
    }

    /**
     * Genera la URL de autorización
     */
    public function getAuthUrl(): string
    {
        return $this->client->createAuthUrl();
    }

    /**
     * Intercambia el código de autorización por un token y obtiene datos del usuario
     */
    public function getUserFromCode(string $code): ?array
    {
        try {
            $token = $this->client->fetchAccessTokenWithAuthCode($code);

            if (isset($token['error'])) {
                error_log('Google Auth Error: ' . json_encode($token));
                return null;
            }

            $this->client->setAccessToken($token);
            $oauth2 = new Oauth2($this->client);
            $userInfo = $oauth2->userinfo->get();

            return [
                'email' => $userInfo->email,
                'name' => $userInfo->name,
                'picture' => $userInfo->picture,
                'google_id' => $userInfo->id,
            ];
        } catch (\Exception $e) {
            error_log('Google Auth Exception: ' . $e->getMessage());
            return null;
        }
    }
}
