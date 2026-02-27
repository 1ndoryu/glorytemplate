<?php

/**
 * PipelineAudioHelpers — Utilidades auxiliares del pipeline de audio
 *
 * Extraído de PipelineAudio para cumplir límite de líneas (SRP).
 * - Construcción de nombre estandarizado de archivo
 * - Actualización de columnas del sample en PostgreSQL
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\LogIA as KamplesLogger;

class PipelineAudioHelpers
{
    /*
     * Construye nombre estandarizado para el archivo.
     * Formato: Instrumento-Genero-Key-BPM-nombre_base-kamples-idCorto.ext
     * Ejemplo: Guitar-Lofi-Am-90bpm-sad-guitar-melody-kamples-a3Kf9x2.wav
     *
     * Combina datos creativos de la IA + datos técnicos del analizador.
     * C283: Estructura mejorada para mejor ordenamiento alfabético.
     */
    public static function construirNombreArchivo(?array $metadataIA, array $analisisTecnico, string $idCorto, string $ext): ?string
    {
        if (!$metadataIA || empty($metadataIA['nombre_archivo_base'])) {
            return null;
        }

        $partes = [];

        /* Instrumento principal (primer elemento del array de instrumentos IA) */
        $instrumentos = $metadataIA['instrumentos'] ?? [];
        if (!empty($instrumentos) && \is_array($instrumentos)) {
            $inst = \preg_replace('/[^a-zA-Z0-9]/', '', \ucfirst(\strtolower($instrumentos[0])));
            if (!empty($inst)) $partes[] = $inst;
        }

        /* Género principal (primer elemento del array de género IA) */
        $generos = $metadataIA['genero'] ?? [];
        if (!empty($generos) && \is_array($generos)) {
            $gen = \preg_replace('/[^a-zA-Z0-9\-]/', '', \ucfirst(\strtolower($generos[0])));
            if (!empty($gen)) $partes[] = $gen;
        }

        /* Tono: Key + Escala (del analizador técnico) */
        if (!empty($analisisTecnico['key'])) {
            $keyStr = \str_replace('#', 's', $analisisTecnico['key']);
            if ($analisisTecnico['escala'] === 'menor') {
                $keyStr .= 'm';
            }
            $partes[] = $keyStr;
        }

        /* BPM (del analizador técnico) */
        if (!empty($analisisTecnico['bpm'])) {
            $partes[] = (string) $analisisTecnico['bpm'] . 'bpm';
        }

        /* Nombre base descriptivo (de la IA) */
        $nombreBase = $metadataIA['nombre_archivo_base'];
        $nombreBase = \preg_replace('/[^a-zA-Z0-9\s]/', '', $nombreBase);
        $nombreBase = \str_replace(' ', '-', \trim(\strtolower($nombreBase)));
        if (!empty($nombreBase)) {
            $partes[] = $nombreBase;
        }

        /* Sufijo: kamples + ID corto */
        $partes[] = 'kamples';
        $partes[] = $idCorto;

        return \implode('-', $partes) . '.' . $ext;
    }

    /*
     * Actualiza el registro de un sample en PostgreSQL con los datos procesados.
     * Detecta columnas JSONB para aplicar cast explícito.
     * S40 fix: whitelist de columnas permitidas (defensa contra SQL injection por keys dinámicas).
     */
    public static function actualizarSample(int $sampleId, array $datos): void
    {
        $columnasPermitidas = [
            SamplesCols::DURACION, SamplesCols::BPM, SamplesCols::KEY, SamplesCols::ESCALA,
            SamplesCols::TIPO, SamplesCols::METADATA, SamplesCols::RUTA_ORIGINAL,
            SamplesCols::RUTA_WAVEFORM, SamplesCols::RUTA_OPTIMIZADA, SamplesCols::RUTA_PREVIEW,
            SamplesCols::ESTADO, SamplesCols::PUBLICADO_AT, SamplesCols::TITULO,
            SamplesCols::SLUG, SamplesCols::TAGS, 'nombre_archivo', SamplesCols::FORMATO,
            'waveform_peaks',
        ];
        $columnasJsonb = [SamplesCols::METADATA, 'media_metadata', 'tags_ia'];
        $setClauses = [];
        $params = ['id' => $sampleId];

        foreach ($datos as $campo => $valor) {
            if (!\in_array($campo, $columnasPermitidas, true) && !\in_array($campo, $columnasJsonb, true)) {
                KamplesLogger::warning('Pipeline: columna no permitida ignorada', ['campo' => $campo]);
                continue;
            }
            /* Cast explícito para JSONB — PDO native prepares envía como text sin esto */
            if (\in_array($campo, $columnasJsonb, true)) {
                $setClauses[] = "{$campo} = :{$campo}::jsonb";
            } else {
                $setClauses[] = "{$campo} = :{$campo}";
            }
            $params[$campo] = $valor;
        }

        if (empty($setClauses)) return;

        $tabla = SamplesCols::TABLA;
        $sql = "UPDATE {$tabla} SET " . \implode(', ', $setClauses) . " WHERE id = :id";

        try {
            SamplesRepository::ejecutar($sql, $params);
        } catch (\Exception $e) {
            KamplesLogger::error('Pipeline: Error actualizando sample en DB', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
                'sql' => $sql,
            ]);
        }
    }
}
