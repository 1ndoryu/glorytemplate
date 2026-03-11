<?php

/**
 * Configuracion para generacion de seed users.
 *
 * Adjetivos y sustantivos musicales para generar usernames credibles.
 * Patron: {Adjetivo}{Sustantivo}{NumeroCorto} — ej: CoolBeat42, DeepVinyl88
 */

namespace App\Kamples\Config;

final class SeedConfig
{
    /* Adjetivos con tematica musical/creativa (~50) */
    const ADJETIVOS = [
        'Cool', 'Deep', 'Sonic', 'Raw', 'Crisp',
        'Warm', 'Bright', 'Dark', 'Heavy', 'Smooth',
        'Funky', 'Fresh', 'Swift', 'Bold', 'Lazy',
        'Wild', 'Silent', 'Loud', 'Sharp', 'Mellow',
        'Dusty', 'Golden', 'Rusty', 'Cosmic', 'Urban',
        'Neon', 'Retro', 'Analog', 'Digital', 'Faded',
        'Wavy', 'Chill', 'Hazy', 'Vivid', 'Gritty',
        'Lucid', 'Crispy', 'Velvet', 'Amber', 'Jade',
        'Mystic', 'Rapid', 'Steady', 'Hollow', 'Dense',
        'Polar', 'Solar', 'Misty', 'Stark', 'Noble',
    ];

    /* Sustantivos con tematica musical (~50) */
    const SUSTANTIVOS = [
        'Beat', 'Vinyl', 'Groove', 'Pulse', 'Chord',
        'Tone', 'Wave', 'Bass', 'Drum', 'Keys',
        'Synth', 'Loop', 'Track', 'Flux', 'Echo',
        'Pitch', 'Verse', 'Riff', 'Fade', 'Drop',
        'Mix', 'Stem', 'Snap', 'Clap', 'Kick',
        'Snare', 'Hat', 'Sample', 'Crate', 'Deck',
        'Tape', 'Wax', 'Spin', 'Dub', 'Filter',
        'Boost', 'Gain', 'Pan', 'Clip', 'Stack',
        'Layer', 'Slice', 'Chop', 'Scratch', 'Blend',
        'Node', 'Grid', 'Drift', 'Spark', 'Vibe',
    ];

    /* Rango numerico para sufijos (2 digitos) */
    const NUMERO_MIN = 10;
    const NUMERO_MAX = 99;

    /* Proporcion: 1 seed user por cada N relaciones (aleatorio entre min y max) */
    const RELACIONES_POR_USER_MIN = 50;
    const RELACIONES_POR_USER_MAX = 100;

    /* ID de usuario del sistema (admin) para comparar en atribucion */
    const SISTEMA_USUARIO_ID_FALLBACK = 7;
}
