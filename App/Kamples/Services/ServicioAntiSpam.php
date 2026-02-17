<?php

/**
 * ServicioAntiSpam — Heurísticas rápidas de spam pre-IA (C131).
 *
 * Detección rápida sin llamar a modelos de IA:
 * - Exceso de URLs (> 2)
 * - Ratio de mayúsculas excesivo (> 70%)
 * - Caracteres repetidos (> 5 consecutivos iguales)
 * - Texto duplicado (mismo usuario, mismo texto en últimos 10 min)
 * - Patrones de spam conocidos (crypto, casino, etc.)
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\PostgresService;
use App\Kamples\KamplesLogger;

class ServicioAntiSpam
{
    /* Patrones de spam comunes (case-insensitive) */
    private const PATRONES_SPAM = [
        '/\b(crypto|bitcoin|nft|casino|bet|forex|trading|invest)\b.*\b(link|click|join|free|earn|win)\b/i',
        '/\b(gratis|gana|dinero|click|enlace)\b.*\b(ahora|ya|hoy|rapido)\b/i',
        '/\b(compra|venta|oferta|descuento)\b.*https?:\/\//i',
        '/https?:\/\/\S+\s+https?:\/\/\S+\s+https?:\/\//i',
    ];

    /* Umbrales configurables */
    private const MAX_URLS = 2;
    private const MAX_RATIO_MAYUSCULAS = 0.7;
    private const MAX_CHARS_REPETIDOS = 5;
    private const VENTANA_DUPLICADOS_SEG = 600;

    /**
     * Evalúa un texto y retorna null si no es spam, o un string con la razón si lo es.
     */
    public static function evaluar(string $texto, int $autorId): ?string
    {
        if (empty(trim($texto))) return null;

        /* 1. Exceso de URLs */
        $urls = preg_match_all('/https?:\/\/\S+/i', $texto);
        if ($urls > self::MAX_URLS) {
            return 'Demasiados enlaces en el comentario';
        }

        /* 2. Ratio de mayusculas excesivo (solo para textos > 10 chars) */
        if (mb_strlen($texto) > 10) {
            $mayusculas = preg_match_all('/[A-ZÁÉÍÓÚÑ]/u', $texto);
            $letras = preg_match_all('/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/u', $texto);
            if ($letras > 0 && ($mayusculas / $letras) > self::MAX_RATIO_MAYUSCULAS) {
                return 'Exceso de mayúsculas (posible spam)';
            }
        }

        /* 3. Caracteres repetidos consecutivos */
        if (preg_match('/(.)\1{' . self::MAX_CHARS_REPETIDOS . ',}/u', $texto)) {
            return 'Caracteres repetidos excesivos';
        }

        /* 4. Patrones de spam conocidos */
        foreach (self::PATRONES_SPAM as $patron) {
            if (preg_match($patron, $texto)) {
                return 'Contenido detectado como spam';
            }
        }

        /* 5. Texto duplicado del mismo usuario en ventana reciente */
        $ventanaSeg = (int) self::VENTANA_DUPLICADOS_SEG;
        $duplicado = PostgresService::consultarUno(
            "SELECT id FROM comentarios
             WHERE autor_id = :autor AND contenido = :contenido
             AND created_at > NOW() - INTERVAL '{$ventanaSeg} seconds'
             LIMIT 1",
            [
                'autor' => $autorId,
                'contenido' => $texto,
            ]
        );
        if ($duplicado) {
            KamplesLogger::info('AntiSpam: duplicado detectado', [
                'autorId' => $autorId,
                'duplicadoId' => $duplicado['id'],
            ], 'moderacion');
            return 'Comentario duplicado';
        }

        return null;
    }
}
