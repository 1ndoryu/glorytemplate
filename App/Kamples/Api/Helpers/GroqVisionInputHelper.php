<?php

namespace App\Kamples\Api\Helpers;

class GroqVisionInputHelper
{
    /**
     * @return array{type: string, image_url: array{url: string}}|null
     */
    public static function construirBloqueContenido(string $referenciaImagen, string $etiquetaLog): ?array
    {
        $urlGroq = GroqVisionReferenciaResolver::resolver($referenciaImagen, $etiquetaLog);
        if ($urlGroq === null) {
            return null;
        }

        return [
            'type' => 'image_url',
            'image_url' => ['url' => $urlGroq],
        ];
    }
}