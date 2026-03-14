<?php

/**
 * NormalizadorSample — Transforma filas crudas de PostgreSQL a formato API.
 *
 * Convierte snake_case → camelCase, parsea arrays PG y JSONB,
 * y agrupa datos del creador en un sub-objeto.
 *
 * sentinel-disable-file limite-lineas
 * Justificación: clase de utilidad central con responsabilidad cohesiva (normalización de samples).
 * sqlSelectSamples() es inseparable del rest: comparte las mismas constants de columnas
 * y tiene 12+ callers directos en repositories y servicios. Extraer a un archivo separado
 * requeriría forwarding en todos los callers sin beneficio arquitectónico real.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Helpers;

use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Config\Schema\_generated\TransaccionesCols;
use App\Config\Schema\_generated\TransaccionesEnums;
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\ColaExtraccionSamplesCols;
use App\Config\Schema\_generated\RelacionesSampleCols;
use App\Helpers\UrlHelper;

class NormalizadorSample
{
    /**
     * Convierte un string PostgreSQL array ({val1,val2,...}) a array PHP.
     * PDO no parsea automáticamente columnas text[] de Postgres.
     */
    public static function pgArrayToPhp(?string $pgArray): array
    {
        if ($pgArray === null || $pgArray === '' || $pgArray === '{}') return [];
        $inner = trim($pgArray, '{}');
        if ($inner === '') return [];
        return str_getcsv($inner);
    }

    /**
     * Normaliza un array de tags: lowercase + trim + deduplicación + filtrado vacíos.
     * DEBE usarse antes de almacenar tags en BD para consistencia con embeddings
     * (GeneradorEmbeddings usa strtolower) y comparaciones SQL en ConstructorSenales.
     */
    public static function normalizarTags(array $tags): array
    {
        $normalizados = [];
        $vistos = [];
        foreach ($tags as $tag) {
            $tag = strtolower(trim((string) $tag));
            if ($tag === '' || isset($vistos[$tag])) continue;
            $vistos[$tag] = true;
            $normalizados[] = $tag;
        }
        return $normalizados;
    }

    /**
     * Convierte un array PHP a formato PostgreSQL text[] seguro.
     * Escapa correctamente comillas, comas y llaves dentro de cada elemento.
     */
    public static function phpArrayToPg(array $items): string
    {
        if (empty($items)) return '{}';
        $escaped = array_map(function ($item) {
            $item = str_replace('\\', '\\\\', (string) $item);
            $item = str_replace('"', '\\"', $item);
            return '"' . $item . '"';
        }, $items);
        return '{' . implode(',', $escaped) . '}';
    }

    /**
     * Convierte una ruta absoluta de filesystem a URL HTTP.
     * Ejemplo: C:\...\wp-content\uploads\kamples\1\... → http://glory.local/wp-content/uploads/kamples/1/...
     * Necesario porque PipelineAudio guarda rutas absolutas en BD.
     */
    public static function rutaAUrl(?string $rutaAbsoluta): string
    {
        if (!$rutaAbsoluta || $rutaAbsoluta === '') return '';

        /* Si ya es una URL HTTP, normalizar dominio legacy y devolver */
        if (str_starts_with($rutaAbsoluta, 'http://') || str_starts_with($rutaAbsoluta, 'https://')) {
            return UrlHelper::normalizar($rutaAbsoluta) ?? $rutaAbsoluta;
        }

        $uploadDir = \wp_upload_dir();
        $basedir = wp_normalize_path($uploadDir['basedir']);
        $baseurl = $uploadDir['baseurl'];
        $rutaNormalizada = wp_normalize_path($rutaAbsoluta);

        /* Reemplazar la parte del filesystem con la URL base */
        if (str_starts_with($rutaNormalizada, $basedir)) {
            $relativa = substr($rutaNormalizada, strlen($basedir));
            return $baseurl . $relativa;
        }

        /* Fallback: buscar wp-content/uploads en la ruta */
        $marcador = 'wp-content/uploads';
        $pos = strpos($rutaNormalizada, $marcador);
        if ($pos !== false) {
            $relativa = substr($rutaNormalizada, $pos + strlen($marcador));
            return $baseurl . $relativa;
        }

        return $rutaAbsoluta;
    }

    /**
     * Normaliza un sample para la respuesta JSON.
     * Convierte snake_case PG a camelCase, agrupa datos del creador como sub-objeto,
     * convierte tags text[] a array PHP y metadata JSONB a objeto.
     */
    /**
     * Aliases SQL usados en sqlSelectSamples (no son columnas reales).
     * Definidos como constantes para que el validator no los marque como errores.
     */
    public const ALIAS_REACCION_USUARIO = 'reaccion_usuario';
    public const ALIAS_VERIFICADO_SAMPLE = 'verificado_sample';
    public const ALIAS_CREADOR_WP_USER_ID = 'creador_wp_user_id';
    /*
     * Flags de estado del usuario autenticado respecto a cada sample.
     * Se calculan con subqueries correlacionadas en sqlSelectSamples().
     *
     * TERMINOLOGIA:
     * - "Coleccionar" = accion del boton Plus (+). Consume credito. Equivale a descargar.
     *   Si el usuario tiene la app desktop, sincroniza el archivo. Si no, descarga.
     *   Se registra en tabla 'descargas'. yaColeccionado = existe fila en descargas.
     * - "Guardar en coleccion" = accion del boton Bookmark. Agrega el sample a una
     *   coleccion/playlist del usuario (tabla coleccion_samples). NO es lo mismo que coleccionar.
     *   yaGuardadoEnColeccion = existe al menos 1 coleccion del usuario que contiene este sample.
     * - "esMio" = el usuario autenticado es el creador del sample. Se muestra como
     *   coleccionado automaticamente (ya lo "tiene").
     */
    public const ALIAS_YA_COLECCIONADO = 'ya_coleccionado';
    public const ALIAS_YA_GUARDADO_EN_COLECCION = 'ya_guardado_en_coleccion';
    public const ALIAS_YA_COMENTADO = 'ya_comentado';
    public const ALIAS_ES_MIO = 'es_mio';
    /* QQ11: Flag que indica si el usuario ya compro este sample (transaccion compra_sample completada) */
    public const ALIAS_YA_COMPRADO = 'ya_comprado';

    public static function normalizar(array $row): array
    {
        /* tags: text[] PG -> array PHP */
        $tags = [];
        if (isset($row[SamplesCols::TAGS]) && is_string($row[SamplesCols::TAGS])) {
            $tags = self::pgArrayToPhp($row[SamplesCols::TAGS]);
        } elseif (isset($row[SamplesCols::TAGS]) && is_array($row[SamplesCols::TAGS])) {
            $tags = $row[SamplesCols::TAGS];
        }

        /* metadata: JSONB PG -> objeto PHP */
        $metadata = null;
        if (isset($row[SamplesCols::METADATA]) && is_string($row[SamplesCols::METADATA])) {
            $metadata = json_decode($row[SamplesCols::METADATA], true);
        } elseif (isset($row[SamplesCols::METADATA]) && is_array($row[SamplesCols::METADATA])) {
            $metadata = $row[SamplesCols::METADATA];
        }

        /* Construir objeto creador si los campos existen (vienen del JOIN con usuarios_ext) */
        $creador = null;
        if (isset($row[SamplesCols::CREADOR_ID]) || isset($row[UsuariosExtCols::USERNAME])) {
            $creador = [
                'id'             => (int) ($row[SamplesCols::CREADOR_ID] ?? 0),
                'username'       => $row[UsuariosExtCols::USERNAME] ?? '',
                'nombreVisible'  => $row[UsuariosExtCols::NOMBRE_VISIBLE] ?? $row[UsuariosExtCols::USERNAME] ?? '',
                'avatarUrl'      => UsuarioHelper::resolverAvatarUrl(
                    $row[UsuariosExtCols::AVATAR_URL] ?? null,
                    isset($row[self::ALIAS_CREADOR_WP_USER_ID]) ? (int) $row[self::ALIAS_CREADOR_WP_USER_ID] : null
                ),
                'verificado'     => (bool) ($row[UsuariosExtCols::VERIFICADO] ?? false),
            ];
        }

        return [
            'id'               => (int) ($row[SamplesCols::ID] ?? 0),
            'titulo'           => $row[SamplesCols::TITULO] ?? '',
            'slug'             => $row[SamplesCols::SLUG] ?? '',
            'idCorto'          => $row[SamplesCols::ID_CORTO] ?? null,
            'descripcion'      => $row[SamplesCols::DESCRIPCION] ?? '',
            'bpm'              => isset($row[SamplesCols::BPM]) ? (int) $row[SamplesCols::BPM] : null,
            'key'              => $row[SamplesCols::KEY] ?? null,
            'escala'           => $row[SamplesCols::ESCALA] ?? null,
            'duracion'         => isset($row[SamplesCols::DURACION]) ? (float) $row[SamplesCols::DURACION] : 0,
            'formato'          => $row[SamplesCols::FORMATO] ?? null,
            'tamano'           => isset($row[SamplesCols::TAMANO]) ? (int) $row[SamplesCols::TAMANO] : 0,
            'tags'             => $tags,
            'tipo'             => $row[SamplesCols::TIPO] ?? SamplesEnums::TIPO_ONESHOT,
            'estado'           => $row[SamplesCols::ESTADO] ?? SamplesEnums::ESTADO_PROCESANDO,
            'esPremium'        => (bool) ($row[SamplesCols::ES_PREMIUM] ?? false),
            'precio'           => isset($row[SamplesCols::PRECIO]) ? (float) $row[SamplesCols::PRECIO] : null,
            'metadata'         => $metadata,
            'rutaPreview'      => self::rutaAUrl($row[SamplesCols::RUTA_PREVIEW] ?? ''),
            'rutaWaveform'     => self::rutaAUrl($row[SamplesCols::RUTA_WAVEFORM] ?? ''),
            /*
             * C202: rutaOriginal y rutaOptimizada solo se exponen cuando el usuario es el creador.
             * Evita que usuarios anonimos obtengan URLs directas a WAV/MP3 originales.
             * QQ22: El inspector necesita estas rutas para debug — seguro si esMio.
             */
            ...((bool) ($row[self::ALIAS_ES_MIO] ?? false) ? [
                'rutaOriginal'    => self::rutaAUrl($row[SamplesCols::RUTA_ORIGINAL] ?? ''),
                'rutaOptimizada'  => self::rutaAUrl($row[SamplesCols::RUTA_OPTIMIZADA] ?? ''),
            ] : []),
            'permitirDescarga' => (bool) ($row[SamplesCols::PERMITIR_DESCARGA] ?? true),
            'licenciaLibre'    => (bool) ($row[SamplesCols::LICENCIA_LIBRE] ?? false),
            /*
             * imagenUrl puede persistirse como ruta absoluta de filesystem
             * (igual que preview/waveform). Normalizar siempre a URL HTTP.
             */
            'imagenUrl'        => !empty($row[SamplesCols::IMAGEN_URL])
                ? self::rutaAUrl((string) $row[SamplesCols::IMAGEN_URL])
                : null,
            'totalDescargas'   => (int) ($row[SamplesCols::TOTAL_DESCARGAS] ?? 0),
            'totalLikes'       => (int) ($row[SamplesCols::TOTAL_LIKES] ?? 0),
            'totalReproducciones' => (int) ($row[SamplesCols::TOTAL_REPRODUCCIONES] ?? 0),
            'audioHash'        => $row[SamplesCols::AUDIO_HASH] ?? null,
            'creador'          => $creador,
            /* C144/C145: reaccion_usuario puede ser 'like', 'dislike', 'encanta' o null */
            'liked'            => !empty($row[self::ALIAS_REACCION_USUARIO]) && in_array($row[self::ALIAS_REACCION_USUARIO], [LikesEnums::REACCION_LIKE, LikesEnums::REACCION_ENCANTA], true),
            'reaccion'         => $row[self::ALIAS_REACCION_USUARIO] ?? null,
            /* C178: verificacion de metadata por humano */
            'verificado'       => (bool) ($row[self::ALIAS_VERIFICADO_SAMPLE] ?? false),
            /* C220: Visibilidad en comunidad */
            'mostrarEnComunidad' => (bool) ($row[SamplesCols::MOSTRAR_EN_COMUNIDAD] ?? true),
            /*
             * Flags de estado del usuario autenticado.
             * - yaColeccionado: el usuario ya colecciono/descargo este sample (o es su propio sample)
             * - yaGuardadoEnColeccion: el sample esta en al menos 1 coleccion del usuario
             * - yaComentado: el usuario dejo al menos 1 comentario en este sample
             * - esMio: el usuario es el creador del sample
             */
            'yaColeccionado'     => (bool) ($row[self::ALIAS_ES_MIO] ?? false) || (bool) ($row[self::ALIAS_YA_COLECCIONADO] ?? false),
            'yaGuardadoEnColeccion' => (bool) ($row[self::ALIAS_YA_GUARDADO_EN_COLECCION] ?? false),
            'yaComentado'        => (bool) ($row[self::ALIAS_YA_COMENTADO] ?? false),
            'esMio'              => (bool) ($row[self::ALIAS_ES_MIO] ?? false),
            'yaComprado'         => (bool) ($row[self::ALIAS_YA_COMPRADO] ?? false),
            /* QQ22: Fechas y total comentarios para el inspector */
            'publicadoAt'        => $row[SamplesCols::PUBLICADO_AT] ?? null,
            'creadoAt'           => $row[SamplesCols::CREATED_AT] ?? null,
            'totalComentarios'   => (int) ($row[SamplesCols::TOTAL_COMENTARIOS] ?? 0),
            /* QQ51: Info de origen — cancion y relacion de sampleo si es un recorte */
            'cancionOrigenId'    => isset($row[SamplesCols::CANCION_ORIGEN_ID])
                ? (int) $row[SamplesCols::CANCION_ORIGEN_ID] : null,
            'relacionSampleoId'  => isset($row[SamplesCols::RELACION_SAMPLEO_ID])
                ? (int) $row[SamplesCols::RELACION_SAMPLEO_ID] : null,
            /* QQ79: Datos enriquecidos de la cancion de origen */
            'cancionOrigen'      => self::decodificarCancionOrigen($row),
            /* QQ117: Metadatos de extraccion (fuente, timing, metodo descarga) */
            'extraccion'         => self::decodificarExtraccion($row),
        ];
    }
    /*
     * QQ79: Decodifica JSON de la cancion de origen (subselect row_to_json).
     * Retorna null si el sample no es un recorte.
     */
    private static function decodificarCancionOrigen(array $row): ?array
    {
        $json = $row['cancion_origen_json'] ?? null;
        if (!$json) {
            return null;
        }
        $data = is_string($json) ? json_decode($json, true) : (is_array($json) ? $json : null);
        if (!is_array($data)) {
            return null;
        }
        return [
            'titulo' => $data[CancionesCols::TITULO] ?? null,
            'slug'   => $data[CancionesCols::SLUG] ?? null,
        ];
    }

    /*
     * QQ117: Decodifica JSON de extraccion (subselect row_to_json).
     * Contiene fuente de descarga, timing, metodo y metadata enriquecida.
     * Retorna null si el sample no proviene de una extraccion.
     */
    private static function decodificarExtraccion(array $row): ?array
    {
        $json = $row['extraccion_json'] ?? null;
        if (!$json) {
            return null;
        }
        $data = is_string($json) ? json_decode($json, true) : (is_array($json) ? $json : null);
        if (!is_array($data)) {
            return null;
        }

        /* metadata_extraccion es JSONB anidado con info de descarga */
        $meta = $data[ColaExtraccionSamplesCols::METADATA_EXTRACCION] ?? null;
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        }

        return [
            'youtubeId'        => $data[ColaExtraccionSamplesCols::YOUTUBE_ID] ?? null,
            'spotifyId'        => $data[ColaExtraccionSamplesCols::SPOTIFY_ID] ?? null,
            'timingInicioSeg'  => isset($data[ColaExtraccionSamplesCols::TIMING_INICIO_SEG])
                ? (float) $data[ColaExtraccionSamplesCols::TIMING_INICIO_SEG] : null,
            'bpmDetectado'     => isset($data[ColaExtraccionSamplesCols::BPM_DETECTADO])
                ? (float) $data[ColaExtraccionSamplesCols::BPM_DETECTADO] : null,
            'duracionCompasSeg' => isset($data[ColaExtraccionSamplesCols::DURACION_COMPAS_SEG])
                ? (float) $data[ColaExtraccionSamplesCols::DURACION_COMPAS_SEG] : null,
            'compasInicioSeg'  => isset($data[ColaExtraccionSamplesCols::COMPAS_INICIO_SEG])
                ? (float) $data[ColaExtraccionSamplesCols::COMPAS_INICIO_SEG] : null,
            'compasFinSeg'     => isset($data[ColaExtraccionSamplesCols::COMPAS_FIN_SEG])
                ? (float) $data[ColaExtraccionSamplesCols::COMPAS_FIN_SEG] : null,
            'lado'             => $data[ColaExtraccionSamplesCols::LADO] ?? null,
            'estado'           => $data[ColaExtraccionSamplesCols::ESTADO] ?? null,
            'rutaAudioExtraido' => !empty($data[ColaExtraccionSamplesCols::RUTA_AUDIO_EXTRAIDO])
                ? self::rutaAUrl((string) $data[ColaExtraccionSamplesCols::RUTA_AUDIO_EXTRAIDO]) : null,
            /* QK61: Flag para frontend — el backend necesita el audio completo para extensiones */
            'tieneAudioCompleto' => !empty($data[ColaExtraccionSamplesCols::RUTA_AUDIO_COMPLETO]),
            /* Campos del JSONB metadata_extraccion */
            'fuenteUrl'        => $meta['descarga_fuente_url'] ?? null,
            'fuenteTitulo'     => $meta['descarga_fuente_titulo'] ?? null,
            'fuenteArtista'    => $meta['descarga_fuente_artista'] ?? null,
            'descargaMetodo'   => $meta['descarga_metodo'] ?? null,
            'origen'           => $meta['origen'] ?? null,
            'ladoExtraccion'   => $meta['lado_extraccion'] ?? null,
            /* QQ23: Campos adicionales del JSONB — contexto completo del sampleo */
            'sampleoFuenteTitulo'  => $meta['fuente_titulo'] ?? null,
            'sampleoFuenteArtista' => $meta['fuente_artista'] ?? null,
            'sampleoDestinoTitulo' => $meta['destino_titulo'] ?? null,
            'sampleoDestinoArtista' => $meta['destino_artista'] ?? null,
            'votosTotal'       => isset($meta['votos_total']) ? (int) $meta['votos_total'] : null,
            'tipoElemento'     => $meta['tipo_elemento'] ?? null,
            'recortePorCompas' => $meta['recorte_por_compas'] ?? null,
            'duracionExtraida' => isset($meta['duracion']) ? (float) $meta['duracion'] : null,
            'formatoExtraido'  => $meta['formato'] ?? null,
            'tamanoBytes'      => isset($meta['tamano_bytes']) ? (int) $meta['tamano_bytes'] : null,
            /* QK32: Slugs y albums de canciones fuente/destino para links en el inspector */
            'fuenteSlug'       => $data['fuente_slug'] ?? null,
            'fuenteAlbum'      => $data['fuente_album'] ?? null,
            'destinoSlug'      => $data['destino_slug'] ?? null,
            'destinoAlbum'     => $data['destino_album'] ?? null,
        ];
    }

    /*

    /**
     * Normaliza un array de samples.
     */
    public static function normalizarLista(array $samples): array
    {
        return array_map([self::class, 'normalizar'], $samples);
    }

    /**
     * SQL SELECT base para samples con join a usuario creador.
     * Evita duplicar esta query en cada controlador.
     *
     * El userId se interpola como entero validado para la subquery correlacionada.
     * PDO no puede parametrizar dentro de subqueries correlacionadas con la query principal,
     * pero validamos el tipo estrictamente para prevenir inyección.
     */
    public static function sqlSelectSamples(?int $userId = null): string
    {
        /*
         * Si se pasa userId, incluimos subquery para la reacción del usuario.
         * Devuelve la reacción ('like', 'dislike', 'encanta') o NULL si no reaccionó.
         * C144/C145: Ahora el campo se llama 'reaccion_usuario' y retorna el tipo exacto.
         * Seguridad: $userId es ?int (tipado estricto), se castea a int para garantizar que es numérico.
         */
        $reaccionExpr = $userId !== null
            ? "(SELECT " . LikesCols::REACCION . " FROM " . LikesCols::TABLA . " WHERE " . LikesCols::USUARIO_ID . " = " . (int) $userId . " AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "' AND " . LikesCols::TARGET_ID . " = s." . SamplesCols::ID . " LIMIT 1)"
            : "NULL";

        /*
         * Subqueries correlacionadas para flags de estado del usuario.
         * Misma tecnica que reaccion_usuario: se inyectan en el SELECT principal.
         *
         * TERMINOLOGIA en el codigo:
         * - "Coleccionar" (boton +) = descargar. Se guarda en tabla 'descargas'.
         * - "Guardar en coleccion" (boton Bookmark) = agregar a coleccion/playlist.
         *   Se guarda en tabla 'coleccion_samples' vinculada a 'colecciones' del usuario.
         *   NO confundir con "coleccionar".
         */
        $yaColeccionadoExpr = $userId !== null
            ? "(SELECT 1 FROM " . DescargasCols::TABLA . " WHERE " . DescargasCols::USUARIO_ID . " = " . (int) $userId . " AND " . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID . " LIMIT 1)"
            : "NULL";

        $yaGuardadoEnColeccionExpr = $userId !== null
            ? "(SELECT 1 FROM " . ColeccionSamplesCols::TABLA . " cs_flag JOIN " . ColeccionesCols::TABLA . " c_flag ON cs_flag." . ColeccionSamplesCols::COLECCION_ID . " = c_flag." . ColeccionesCols::ID . " WHERE c_flag." . ColeccionesCols::USUARIO_ID . " = " . (int) $userId . " AND cs_flag." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID . " LIMIT 1)"
            : "NULL";

        $yaComentadoExpr = $userId !== null
            ? "(SELECT 1 FROM " . ComentariosCols::TABLA . " WHERE " . ComentariosCols::AUTOR_ID . " = " . (int) $userId . " AND " . ComentariosCols::TIPO . " = '" . ComentariosEnums::TIPO_SAMPLE . "' AND " . ComentariosCols::TARGET_ID . " = s." . SamplesCols::ID . " LIMIT 1)"
            : "NULL";

        /* esMio: true si el creador_id del sample es el usuario autenticado */
        $esMioExpr = $userId !== null
            ? "(s." . SamplesCols::CREADOR_ID . " = " . (int) $userId . ")"
            : "FALSE";

        /* QQ11: yaComprado — true si existe transaccion completada de tipo compra_sample */
        $yaCompradoExpr = $userId !== null
            ? "(SELECT 1 FROM " . TransaccionesCols::TABLA . " WHERE " . TransaccionesCols::COMPRADOR_ID . " = " . (int) $userId . " AND " . TransaccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID . " AND " . TransaccionesCols::TIPO . " = '" . TransaccionesEnums::TIPO_COMPRA_SAMPLE . "' AND " . TransaccionesCols::ESTADO . " IN ('" . TransaccionesEnums::ESTADO_COMPLETADA . "', '" . TransaccionesEnums::ESTADO_COMPLETED . "') LIMIT 1)"
            : "NULL";

        /*
         * C202: No incluir ruta_original / ruta_optimizada en queries publicos.
         * Esto evita que la API exponga URLs directas a archivos sensibles.
         */
        $sId = SamplesCols::ID;
        $sTitulo = SamplesCols::TITULO;
        $sSlug = SamplesCols::SLUG;
        $sIdCorto = SamplesCols::ID_CORTO;
        $sDesc = SamplesCols::DESCRIPCION;
        $sBpm = SamplesCols::BPM;
        $sKey = SamplesCols::KEY;
        $sEscala = SamplesCols::ESCALA;
        $sDuracion = SamplesCols::DURACION;
        $sFormato = SamplesCols::FORMATO;
        $sTamano = SamplesCols::TAMANO;
        $sTags = SamplesCols::TAGS;
        $sTipo = SamplesCols::TIPO;
        $sEstado = SamplesCols::ESTADO;
        $sPremium = SamplesCols::ES_PREMIUM;
        $sPrecio = SamplesCols::PRECIO;
        $sMeta = SamplesCols::METADATA;
        $sPreview = SamplesCols::RUTA_PREVIEW;
        $sWaveform = SamplesCols::RUTA_WAVEFORM;
        $sImagen = SamplesCols::IMAGEN_URL;
        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;
        $sTotLikes = SamplesCols::TOTAL_LIKES;
        $sTotRepro = SamplesCols::TOTAL_REPRODUCCIONES;
        $sHash = SamplesCols::AUDIO_HASH;
        $sVerif = SamplesCols::VERIFICADO;
        $sMostrar = SamplesCols::MOSTRAR_EN_COMUNIDAD;
        $sPubAt = SamplesCols::PUBLICADO_AT;
        $sCreatedAt = SamplesCols::CREATED_AT;
        $sTotComent = SamplesCols::TOTAL_COMENTARIOS;
        $sCreadorId = SamplesCols::CREADOR_ID;
        $sPermitirDesc = SamplesCols::PERMITIR_DESCARGA;
        $sLicenciaLibre = SamplesCols::LICENCIA_LIBRE;
        $sRutaOriginal = SamplesCols::RUTA_ORIGINAL;
        $sRutaOptimizada = SamplesCols::RUTA_OPTIMIZADA;
        /* QQ51: Campos de origen — vinculo sample -> cancion / relacion de sampleo */
        $sCancionOrigen = SamplesCols::CANCION_ORIGEN_ID;
        $sRelacionSampleo = SamplesCols::RELACION_SAMPLEO_ID;
        /* QQ79: Datos enriquecidos de la cancion origen (subselect correlacionado) */
        $tc = CancionesCols::TABLA;
        $cTitulo = CancionesCols::TITULO;
        $cSlug = CancionesCols::SLUG;
        $cId = CancionesCols::ID;
        $cAlbum = CancionesCols::ALBUM;
        $cancionOrigenExpr = "(SELECT row_to_json(co.*) FROM (
            SELECT c.{$cTitulo}, c.{$cSlug}
            FROM {$tc} c WHERE c.{$cId} = s.{$sCancionOrigen}
        ) co) AS cancion_origen_json";
        /* QQ117: Metadata de extraccion (fuente, URL, timing, etc.) asociada al sample */
        $tCe = ColaExtraccionSamplesCols::TABLA;
        $ceMetadata = ColaExtraccionSamplesCols::METADATA_EXTRACCION;
        $ceYoutubeId = ColaExtraccionSamplesCols::YOUTUBE_ID;
        $ceTimingInicio = ColaExtraccionSamplesCols::TIMING_INICIO_SEG;
        $ceCompasInicio = ColaExtraccionSamplesCols::COMPAS_INICIO_SEG;
        $ceCompasFin = ColaExtraccionSamplesCols::COMPAS_FIN_SEG;
        $ceRuta = ColaExtraccionSamplesCols::RUTA_AUDIO_EXTRAIDO;
        $ceLado = ColaExtraccionSamplesCols::LADO;
        $ceSpotifyId = ColaExtraccionSamplesCols::SPOTIFY_ID;
        $ceSampleId = ColaExtraccionSamplesCols::SAMPLE_ID;
        $ceBpmDetectado = ColaExtraccionSamplesCols::BPM_DETECTADO;
        $ceDuracionCompas = ColaExtraccionSamplesCols::DURACION_COMPAS_SEG;
        $ceEstado = ColaExtraccionSamplesCols::ESTADO;
        $ceRelacionId = ColaExtraccionSamplesCols::RELACION_ID;
        /* QK32: JOIN relaciones_sample → canciones para slug/album de ambas canciones */
        $tRs = RelacionesSampleCols::TABLA;
        $rsId = RelacionesSampleCols::ID;
        $rsCancionFuente = RelacionesSampleCols::CANCION_FUENTE_ID;
        $rsCancionDestino = RelacionesSampleCols::CANCION_DESTINO_ID;
        $extraccionExpr = "(SELECT row_to_json(ex.*) FROM (
            SELECT ce.{$ceMetadata}, ce.{$ceYoutubeId}, ce.{$ceTimingInicio},
                   ce.{$ceCompasInicio}, ce.{$ceCompasFin}, ce.{$ceRuta},
                   ce.{$ceLado}, ce.{$ceSpotifyId},
                   ce.{$ceBpmDetectado}, ce.{$ceDuracionCompas}, ce.{$ceEstado},
                   cf.{$cSlug} AS fuente_slug, cf.{$cAlbum} AS fuente_album,
                   cd.{$cSlug} AS destino_slug, cd.{$cAlbum} AS destino_album
            FROM {$tCe} ce
            LEFT JOIN {$tRs} rs ON ce.{$ceRelacionId} = rs.{$rsId}
            LEFT JOIN {$tc} cf ON rs.{$rsCancionFuente} = cf.{$cId}
            LEFT JOIN {$tc} cd ON rs.{$rsCancionDestino} = cd.{$cId}
            WHERE ce.{$ceSampleId} = s.{$sId}
            LIMIT 1
        ) ex) AS extraccion_json";
        $ts = SamplesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $uId = UsuariosExtCols::ID;
        $uUser = UsuariosExtCols::USERNAME;
        $uNombre = UsuariosExtCols::NOMBRE_VISIBLE;
        $uAvatar = UsuariosExtCols::AVATAR_URL;
        $uVerif = UsuariosExtCols::VERIFICADO;
        $uWpId = UsuariosExtCols::WP_USER_ID;

        return "SELECT s.{$sId}, s.{$sTitulo}, s.{$sSlug}, s.{$sIdCorto}, s.{$sDesc},
                       {$cancionOrigenExpr},
                       {$extraccionExpr},
                       s.{$sBpm}, s.{$sKey}, s.{$sEscala}, s.{$sDuracion}, s.{$sFormato}, s.{$sTamano},
                       s.{$sTags}, s.{$sTipo}, s.{$sEstado}, s.{$sPremium}, s.{$sPrecio}, s.{$sMeta},
                       s.{$sPreview}, s.{$sWaveform},
                       s.{$sRutaOriginal}, s.{$sRutaOptimizada},
                       s.{$sPermitirDesc}, s.{$sLicenciaLibre},
                       s.{$sImagen}, s.{$sTotDesc}, s.{$sTotLikes}, s.{$sTotRepro},
                       s.{$sHash}, s.{$sVerif} AS verificado_sample, s.{$sMostrar},
                       s.{$sPubAt}, s.{$sCreatedAt}, s.{$sTotComent},
                       s.{$sCancionOrigen}, s.{$sRelacionSampleo},
                       u.{$uId} as creador_id, u.{$uUser}, u.{$uNombre},
                       u.{$uAvatar}, u.{$uVerif}, u.{$uWpId} AS creador_wp_user_id,
                       {$reaccionExpr} AS reaccion_usuario,
                       {$yaColeccionadoExpr} AS ya_coleccionado,
                       {$yaGuardadoEnColeccionExpr} AS ya_guardado_en_coleccion,
                       {$yaComentadoExpr} AS ya_comentado,
                       {$esMioExpr} AS es_mio,
                       {$yaCompradoExpr} AS ya_comprado
                FROM {$ts} s
                LEFT JOIN {$tu} u ON s.{$sCreadorId} = u.{$uId}";
    }
}
