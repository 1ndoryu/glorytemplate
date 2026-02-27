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

        /* Si ya es una URL HTTP, devolver tal cual */
        if (str_starts_with($rutaAbsoluta, 'http://') || str_starts_with($rutaAbsoluta, 'https://')) {
            return $rutaAbsoluta;
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
             * C202: rutaOriginal y rutaOptimizada NO se exponen en respuestas publicas.
             * Los archivos originales solo se sirven via el endpoint /descargar autenticado.
             * Evita que usuarios anonimos obtengan URLs directas a WAV/MP3 originales.
             */
            'imagenUrl'        => $row[SamplesCols::IMAGEN_URL] ?? null,
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
        ];
    }

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
        $sCreadorId = SamplesCols::CREADOR_ID;
        $ts = SamplesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $uId = UsuariosExtCols::ID;
        $uUser = UsuariosExtCols::USERNAME;
        $uNombre = UsuariosExtCols::NOMBRE_VISIBLE;
        $uAvatar = UsuariosExtCols::AVATAR_URL;
        $uVerif = UsuariosExtCols::VERIFICADO;
        $uWpId = UsuariosExtCols::WP_USER_ID;

        return "SELECT s.{$sId}, s.{$sTitulo}, s.{$sSlug}, s.{$sIdCorto}, s.{$sDesc},
                       s.{$sBpm}, s.{$sKey}, s.{$sEscala}, s.{$sDuracion}, s.{$sFormato}, s.{$sTamano},
                       s.{$sTags}, s.{$sTipo}, s.{$sEstado}, s.{$sPremium}, s.{$sPrecio}, s.{$sMeta},
                       s.{$sPreview}, s.{$sWaveform},
                       s.{$sImagen}, s.{$sTotDesc}, s.{$sTotLikes}, s.{$sTotRepro},
                       s.{$sHash}, s.{$sVerif} AS verificado_sample, s.{$sMostrar},
                       u.{$uId} as creador_id, u.{$uUser}, u.{$uNombre},
                       u.{$uAvatar}, u.{$uVerif}, u.{$uWpId} AS creador_wp_user_id,
                       {$reaccionExpr} AS reaccion_usuario,
                       {$yaColeccionadoExpr} AS ya_coleccionado,
                       {$yaGuardadoEnColeccionExpr} AS ya_guardado_en_coleccion,
                       {$yaComentadoExpr} AS ya_comentado,
                       {$esMioExpr} AS es_mio
                FROM {$ts} s
                LEFT JOIN {$tu} u ON s.{$sCreadorId} = u.{$uId}";
    }
}
