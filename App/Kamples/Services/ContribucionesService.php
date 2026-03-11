<?php

/**
 * ContribucionesService — Logica de negocio del sistema de contribuciones.
 *
 * Separa la logica compleja de aprobacion del controlador HTTP (SRP).
 * Al aprobar una contribucion:
 *   1. Si hay cancion nueva en la contribucion → crear artista (upsert) + crear cancion.
 *   2. Insertar relacion en relaciones_sample con fuente='comunidad'.
 *   3. Opcional: encolar para extraccion de audio.
 *   4. Marcar contribucion como aprobada con relacion_creada_id.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\ContribucionesPendientesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\ArtistasMusicalesRepository;
use App\Kamples\Database\Repositories\ColaExtraccionSamplesRepository;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\ContribucionesPendientesCols;
use App\Config\Schema\_generated\ContribucionesPendientesEnums;
use App\Config\Schema\_generated\RelacionesSampleCols;
use App\Config\Schema\_generated\RelacionesSampleEnums;
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\ArtistasMusicalesCols;

class ContribucionesService
{
    /**
     * Aprobar una contribucion:
     * - Crea cancion nueva si la contribucion la especifica.
     * - Inserta la relacion en relaciones_sample.
     * - Encola extraccion de audio si aplica.
     * - Marca la contribucion como aprobada.
     *
     * @return array{ok: bool, relacion_id?: int, error?: string}
     */
    public static function aprobar(array $contribucion, int $moderadorId, ?string $nota): array
    {
        $contribucionId = (int) $contribucion[ContribucionesPendientesCols::ID];
        $destinoId      = $contribucion[ContribucionesPendientesCols::CANCION_DESTINO_ID] ?? null;
        $fuenteId       = $contribucion[ContribucionesPendientesCols::CANCION_FUENTE_ID] ?? null;
        $lado           = $contribucion[ContribucionesPendientesCols::CANCION_NUEVA_LADO] ?? null;
        $tipoRelacion   = $contribucion[ContribucionesPendientesCols::TIPO_RELACION];
        $tipoElemento   = $contribucion[ContribucionesPendientesCols::TIPO_ELEMENTO];
        $contribuidorId = (int) $contribucion[ContribucionesPendientesCols::CONTRIBUIDOR_ID];

        try {
            /* Si hay cancion nueva que crear */
            if ($contribucion[ContribucionesPendientesCols::CANCION_NUEVA_TITULO] ?? null) {
                $nuevaCancionId = self::crearCancionDesdeContribucion($contribucion);
                if ($nuevaCancionId === null) {
                    return ['ok' => false, 'error' => 'No se pudo crear la cancion nueva.'];
                }

                if ($lado === ContribucionesPendientesEnums::CANCION_NUEVA_LADO_DESTINO) {
                    $destinoId = $nuevaCancionId;
                } else {
                    $fuenteId = $nuevaCancionId;
                }
            }

            if (!$destinoId || !$fuenteId) {
                return ['ok' => false, 'error' => 'Faltan referencias de canciones para crear la relacion.'];
            }

            /* Insertar relacion */
            $relacionId = RelacionesSampleRepository::insertarRegistro([
                RelacionesSampleCols::CANCION_DESTINO_ID => (int) $destinoId,
                RelacionesSampleCols::CANCION_FUENTE_ID  => (int) $fuenteId,
                RelacionesSampleCols::TIPO_RELACION      => $tipoRelacion,
                RelacionesSampleCols::TIPO_ELEMENTO      => $tipoElemento,
                RelacionesSampleCols::FUENTE             => RelacionesSampleEnums::FUENTE_COMUNIDAD,
                RelacionesSampleCols::CONTRIBUIDOR_ID    => $contribuidorId,
                RelacionesSampleCols::VERIFICADA         => false,
            ]);

            if (!$relacionId) {
                return ['ok' => false, 'error' => 'No se pudo insertar la relacion.'];
            }

            /* Encolar extraccion solo para relaciones de tipo sample */
            if ($tipoRelacion === RelacionesSampleEnums::TIPO_RELACION_SAMPLE) {
                try {
                    /* Construimos el array minimo que encolarBilateral necesita */
                    $relacionData = RelacionesSampleRepository::buscarPorId((int) $relacionId);
                    if ($relacionData) {
                        ColaExtraccionSamplesRepository::encolarBilateral($relacionData);
                    }
                } catch (\Throwable $e) {
                    /* No fatal: la extraccion puede encolarse manualmente despues */
                    KamplesLogger::warning('ContribucionesService: no se pudo encolar extraccion', [
                        'relacion_id' => $relacionId,
                        'error'       => $e->getMessage(),
                    ]);
                }
            }

            /* Marcar contribucion como aprobada */
            ContribucionesPendientesRepository::moderar(
                $contribucionId,
                ContribucionesPendientesEnums::ESTADO_APROBADA,
                $moderadorId,
                $nota,
                (int) $relacionId
            );

            KamplesLogger::info('ContribucionesService: contribucion aprobada', [
                'contribucion_id' => $contribucionId,
                'relacion_id'     => $relacionId,
            ]);

            return ['ok' => true, 'relacion_id' => (int) $relacionId];
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesService: error al aprobar contribucion', [
                'contribucion_id' => $contribucionId,
                'error'           => $e->getMessage(),
            ]);
            return ['ok' => false, 'error' => 'Error interno al aprobar la contribucion.'];
        }
    }

    /**
     * Crear cancion + artista desde los datos de cancion_nueva_* de la contribucion.
     * Retorna el ID de la cancion creada o null si falla.
     */
    private static function crearCancionDesdeContribucion(array $contribucion): ?int
    {
        $titulo  = \sanitize_text_field($contribucion[ContribucionesPendientesCols::CANCION_NUEVA_TITULO] ?? '');
        $artista = \sanitize_text_field($contribucion[ContribucionesPendientesCols::CANCION_NUEVA_ARTISTA] ?? '');

        if (!$titulo || !$artista) {
            return null;
        }

        /* Upsert artista por nombre (slugificado manualmente) */
        $slug = \sanitize_title($artista);
        $artistaId = ArtistasMusicalesRepository::upsertPorNombre($artista, $slug);
        if (!$artistaId) {
            return null;
        }

        /* Extraer youtube_id si se provee URL */
        $youtubeUrl = $contribucion[ContribucionesPendientesCols::CANCION_NUEVA_YOUTUBE_URL] ?? null;
        $youtubeId  = null;
        if ($youtubeUrl) {
            \preg_match('/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $youtubeUrl, $m);
            $youtubeId = $m[1] ?? null;
        }

        return CancionesRepository::insertarRegistro([
            CancionesCols::TITULO     => $titulo,
            CancionesCols::SLUG       => \sanitize_title($titulo . '-' . $artista),
            CancionesCols::ARTISTA_ID => $artistaId,
            CancionesCols::YOUTUBE_ID => $youtubeId,
        ]);
    }

    /**
     * Aplicar edicion comunitaria aprobada: actualiza la relacion original con los cambios propuestos.
     * Llamado desde moderar() cuando tipo_contribucion='edicion'.
     *
     * @return array{ok: bool, error?: string}
     */
    public static function aplicarEdicion(array $contribucion, int $moderadorId, ?string $nota): array
    {
        $contribucionId     = (int) $contribucion[ContribucionesPendientesCols::ID];
        $relacionExistenteId = $contribucion[ContribucionesPendientesCols::RELACION_EXISTENTE_ID] ?? null;

        if (!$relacionExistenteId) {
            return ['ok' => false, 'error' => 'Contribucion de edicion sin relacion_existente_id.'];
        }

        try {
            $relacion = RelacionesSampleRepository::buscarPorId((int) $relacionExistenteId);
            if (!$relacion) {
                return ['ok' => false, 'error' => 'La relacion original ya no existe.'];
            }

            $cambiosRaw = $contribucion[ContribucionesPendientesCols::CAMBIOS_PROPUESTOS] ?? null;
            $cambios = \is_string($cambiosRaw) ? \json_decode($cambiosRaw, true) : (\is_array($cambiosRaw) ? $cambiosRaw : []);

            if (empty($cambios) || \json_last_error() !== JSON_ERROR_NONE) {
                return ['ok' => false, 'error' => 'Cambios propuestos vacios o malformados.'];
            }

            /* Filtrar a campos permitidos con whitelist */
            $cambiosAplicar = [];
            if (isset($cambios['tipo_relacion']) && \in_array($cambios['tipo_relacion'], RelacionesSampleEnums::TODOS_TIPO_RELACION, true)) {
                $cambiosAplicar[RelacionesSampleCols::TIPO_RELACION] = $cambios['tipo_relacion'];
            }
            if (isset($cambios['tipo_elemento']) && \in_array($cambios['tipo_elemento'], RelacionesSampleEnums::TODOS_TIPO_ELEMENTO, true)) {
                $cambiosAplicar[RelacionesSampleCols::TIPO_ELEMENTO] = $cambios['tipo_elemento'];
            }

            /* L7.8: Timings como arrays de enteros positivos — almacenados como PG integer[] */
            if (isset($cambios['timings_fuente']) && \is_array($cambios['timings_fuente'])) {
                $tf = \array_filter(\array_map('intval', $cambios['timings_fuente']), fn($v) => $v >= 0);
                $cambiosAplicar[RelacionesSampleCols::TIMINGS_FUENTE] = '{' . \implode(',', $tf) . '}';
            }
            if (isset($cambios['timings_destino']) && \is_array($cambios['timings_destino'])) {
                $td = \array_filter(\array_map('intval', $cambios['timings_destino']), fn($v) => $v >= 0);
                $cambiosAplicar[RelacionesSampleCols::TIMINGS_DESTINO] = '{' . \implode(',', $td) . '}';
            }

            /* L7.8: Verificada (boolean) */
            if (isset($cambios['verificada'])) {
                $cambiosAplicar[RelacionesSampleCols::VERIFICADA] = (bool) $cambios['verificada'];
            }

            /* L7.8: YouTube URL — se almacena como cambio propuesto para revision del moderador.
             * TO-DO: Parsear a youtube_id y actualizar la cancion correspondiente (requiere
             * definir a cual lado aplica: fuente o destino). Por ahora el moderador lo aplica
             * manualmente desde el panel. */

            if (empty($cambiosAplicar)) {
                return ['ok' => false, 'error' => 'Ningun cambio valido para aplicar.'];
            }

            RelacionesSampleRepository::actualizarPorId((int) $relacionExistenteId, $cambiosAplicar);

            /* Marcar contribucion como aprobada */
            ContribucionesPendientesRepository::moderar(
                $contribucionId,
                ContribucionesPendientesEnums::ESTADO_APROBADA,
                $moderadorId,
                $nota
            );

            KamplesLogger::info('ContribucionesService: edicion comunitaria aplicada', [
                'contribucion_id' => $contribucionId,
                'relacion_id'     => $relacionExistenteId,
                'cambios'         => $cambiosAplicar,
            ]);

            return ['ok' => true];
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesService: error al aplicar edicion', [
                'contribucion_id' => $contribucionId,
                'error'           => $e->getMessage(),
            ]);
            return ['ok' => false, 'error' => 'Error interno al aplicar la edicion.'];
        }
    }

    /**
     * Aplicar eliminacion comunitaria aprobada: borra la relacion original.
     * Llamado desde moderar() cuando tipo_contribucion='eliminacion'.
     *
     * @return array{ok: bool, error?: string}
     */
    public static function aplicarEliminacion(array $contribucion, int $moderadorId, ?string $nota): array
    {
        $contribucionId     = (int) $contribucion[ContribucionesPendientesCols::ID];
        $relacionExistenteId = $contribucion[ContribucionesPendientesCols::RELACION_EXISTENTE_ID] ?? null;

        if (!$relacionExistenteId) {
            return ['ok' => false, 'error' => 'Contribucion de eliminacion sin relacion_existente_id.'];
        }

        try {
            $relacion = RelacionesSampleRepository::buscarPorId((int) $relacionExistenteId);
            if (!$relacion) {
                return ['ok' => false, 'error' => 'La relacion original ya no existe.'];
            }

            RelacionesSampleRepository::eliminarPorId((int) $relacionExistenteId);

            /* Marcar contribucion como aprobada */
            ContribucionesPendientesRepository::moderar(
                $contribucionId,
                ContribucionesPendientesEnums::ESTADO_APROBADA,
                $moderadorId,
                $nota
            );

            KamplesLogger::info('ContribucionesService: eliminacion comunitaria aplicada', [
                'contribucion_id' => $contribucionId,
                'relacion_id'     => $relacionExistenteId,
            ]);

            return ['ok' => true];
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesService: error al aplicar eliminacion', [
                'contribucion_id' => $contribucionId,
                'error'           => $e->getMessage(),
            ]);
            return ['ok' => false, 'error' => 'Error interno al aplicar la eliminacion.'];
        }
    }
}
