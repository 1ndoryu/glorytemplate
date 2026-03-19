<?php

/* sentinel-disable-file limite-lineas: servicio SEO central con resolvers por ruta, schema markup y metadata dinámica; dividirlo completo durante un hotfix de producción mezclaría una refactorización grande ajena al fix del BOM. */

namespace App\Kamples\Services;

use Glory\Seo\RuntimeSeoData;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Kamples\Database\Repositories\ArticulosRepository;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\ArticulosCols;
use App\Config\Schema\_generated\ArticulosEnums;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Config\Schema\_generated\SamplesEnums;

/**
 * SeoKamples
 *
 * Resuelve datos SEO dinamicos para paginas de Kamples:
 * - /sample/{slug} → MusicRecording con metadata IA
 * - /perfil/{username} → Person/Producer con metricas
 * - /coleccion/{id} → MusicPlaylist
 *
 * Se registra como resolver en DynamicSeoResolver desde App/Config/pages.php.
 * Cada metodo estatico recibe el segmento dinamico y puebla RuntimeSeoData.
 */
class SeoKamples
{
    /**
     * Resuelve SEO para /sample/{slug}/
     */
    public static function resolverSample(string $slug): void
    {
        /* Guard: evitar resolver si el slug es vacio o el propio nombre de ruta */
        /* sentinel-disable-next-line hardcoded-enum-value — 'sample' es nombre de ruta URL, no valor de BD */
        if ($slug === '' || $slug === 'sample' || $slug === 'editar') {
            return;
        }

        try {
            $sample = SamplesRepository::obtenerPorSlugOIdCorto($slug);
        } catch (\Throwable $e) {
            return;
        }

        if ($sample === null) {
            return;
        }

        $estado = $sample['estado'] ?? '';
        if ($estado !== SamplesEnums::ESTADO_ACTIVO) {
            RuntimeSeoData::set([
                'robots' => 'noindex,nofollow',
            ]);
            return;
        }

        $titulo = $sample['titulo'] ?? 'Sample';
        $descripcion = $sample['descripcion'] ?? '';
        $bpm = !empty($sample['bpm']) ? (int) $sample['bpm'] : null;
        $key = $sample['key'] ?? '';
        $escala = $sample['escala'] ?? '';
        $tipo = $sample['tipo'] ?? '';
        $duracion = !empty($sample['duracion']) ? (float) $sample['duracion'] : null;
        $creadorUsername = $sample['username'] ?? '';
        $creadorNombre = $sample['nombre_visible'] ?? $creadorUsername;
        $creadorAvatar = $sample['avatar_url'] ?? '';
        $totalDescargas = (int) ($sample['total_descargas'] ?? 0);
        $totalLikes = (int) ($sample['total_likes'] ?? 0);
        $totalReproducciones = (int) ($sample['total_reproducciones'] ?? 0);
        $publicadoAt = $sample['publicado_at'] ?? '';
        $updatedAt = $sample['updated_at'] ?? '';
        $sampleSlug = $sample['slug'] ?? $slug;

        /* Extraer genero desde metadata JSONB */
        $metadataRaw = $sample['metadata'] ?? '';
        $metadata = is_string($metadataRaw) ? json_decode($metadataRaw, true) : $metadataRaw;
        $generos = [];
        if (is_array($metadata) && !empty($metadata['genero'])) {
            $generos = is_array($metadata['genero']) ? $metadata['genero'] : [$metadata['genero']];
        }

        /* Instrumentos y emocion desde metadata */
        $instrumentos = [];
        if (is_array($metadata) && !empty($metadata['instrumentos'])) {
            $instrumentos = is_array($metadata['instrumentos']) ? $metadata['instrumentos'] : [$metadata['instrumentos']];
        }

        /* Tags para keywords */
        $tagsRaw = $sample['tags'] ?? '';
        $tags = [];
        if (is_string($tagsRaw) && $tagsRaw !== '') {
            $tags = NormalizadorSample::pgArrayToPhp($tagsRaw);
        } elseif (is_array($tagsRaw)) {
            $tags = $tagsRaw;
        }

        /* Construir SEO title optimizado para busquedas */
        $titleParts = [$titulo];
        if ($tipo !== '') {
            $tipoLabel = $tipo === SamplesEnums::TIPO_ONESHOT ? 'One Shot' : ucfirst($tipo);
            $titleParts[] = $tipoLabel;
        }
        if ($bpm !== null) {
            $titleParts[] = $bpm . 'BPM';
        }
        if ($key !== '') {
            $keyLabel = $key;
            if ($escala !== '') {
                $keyLabel .= ' ' . $escala;
            }
            $titleParts[] = $keyLabel;
        }
        $seoTitle = implode(' - ', $titleParts) . ' | Kamples';

        /* Construir meta description con datos ricos */
        $descParts = [];
        $tipoDesc = $tipo === SamplesEnums::TIPO_ONESHOT ? 'one-shot' : ($tipo !== '' ? $tipo : 'sample');
        $generoDesc = !empty($generos) ? implode(', ', array_slice($generos, 0, 2)) : '';

        if ($generoDesc !== '' && $bpm !== null) {
            $descParts[] = ucfirst($tipoDesc) . " de {$generoDesc} a {$bpm}BPM";
        } elseif ($generoDesc !== '') {
            $descParts[] = ucfirst($tipoDesc) . " de {$generoDesc}";
        } elseif ($bpm !== null) {
            $descParts[] = ucfirst($tipoDesc) . " a {$bpm}BPM";
        } else {
            $descParts[] = ucfirst($tipoDesc) . " de audio";
        }

        if ($key !== '') {
            $descParts[] = "en {$key}";
        }

        if ($creadorNombre !== '') {
            $descParts[] = "por {$creadorNombre}";
        }

        $seoDesc = implode(' ', $descParts) . '.';

        if ($descripcion !== '') {
            $descTruncada = mb_substr(strip_tags($descripcion), 0, 100);
            $seoDesc .= ' ' . $descTruncada;
        }

        $seoDesc .= ' Descarga gratis en formato WAV en Kamples.';
        $seoDesc = mb_substr($seoDesc, 0, 160);

        /* URLs */
        $siteUrl = home_url();
        $canonical = $siteUrl . '/sample/' . $sampleSlug . '/';

        /* Imagen: prioridad imagen_url > ruta_waveform > avatar creador */
        $ogImage = '';
        $imagenUrl = $sample['imagen_url'] ?? '';
        $waveformUrl = $sample['ruta_waveform'] ?? '';

        if ($imagenUrl !== '') {
            $ogImage = NormalizadorSample::rutaAUrl($imagenUrl);
        } elseif ($waveformUrl !== '') {
            $ogImage = NormalizadorSample::rutaAUrl($waveformUrl);
        } elseif ($creadorAvatar !== '') {
            $ogImage = NormalizadorSample::rutaAUrl($creadorAvatar);
        }

        /* Audio preview para og:audio */
        $ogAudio = '';
        $previewUrl = $sample['ruta_preview'] ?? '';
        if ($previewUrl !== '') {
            $ogAudio = NormalizadorSample::rutaAUrl($previewUrl);
        }

        /* Breadcrumb */
        $breadcrumb = [
            ['name' => 'Inicio', 'url' => $siteUrl . '/'],
            ['name' => 'Samples', 'url' => $siteUrl . '/'],
        ];
        if (!empty($generos)) {
            $breadcrumb[] = ['name' => $generos[0], 'url' => ''];
        }
        $breadcrumb[] = ['name' => $titulo, 'url' => $canonical];

        /* JSON-LD MusicRecording */
        $jsonLd = self::buildMusicRecordingJsonLd(
            $titulo,
            $seoDesc,
            $canonical,
            $ogImage,
            $ogAudio,
            $duracion,
            $generos,
            $key,
            $escala,
            $creadorNombre,
            $creadorUsername,
            $siteUrl,
            $totalDescargas,
            $totalLikes,
            $totalReproducciones,
            $publicadoAt,
            $tags,
            $sample['es_premium'] ?? false,
            $sample['precio'] ?? null
        );

        RuntimeSeoData::set([
            'title'       => $seoTitle,
            'description' => $seoDesc,
            'canonical'   => $canonical,
            'ogImage'     => $ogImage,
            'ogAudio'     => $ogAudio,
            'ogType'      => 'music.song',
            'robots'      => 'index,follow',
            'breadcrumb'  => $breadcrumb,
            'jsonLd'      => $jsonLd,
            'extra'       => [
                'publishedAt' => $publicadoAt,
                'modifiedAt'  => $updatedAt,
                'keywords'    => implode(', ', array_slice($tags, 0, 10)),
            ],
        ]);
    }

    /**
     * Resuelve SEO para /perfil/{username}/
     */
    public static function resolverPerfil(string $username): void
    {
        if ($username === '' || $username === 'perfil' || $username === 'editar') {
            return;
        }

        try {
            $perfil = UsuariosExtRepository::buscarPerfilPublico($username);
        } catch (\Throwable $e) {
            return;
        }

        if ($perfil === null) {
            return;
        }

        $nombreVisible = $perfil['nombre_visible'] ?? $username;
        $bio = $perfil['bio'] ?? '';
        $avatarUrl = $perfil['avatar_url'] ?? '';
        $totalSamples = (int) ($perfil['total_samples'] ?? 0);
        $totalSeguidores = (int) ($perfil['total_seguidores'] ?? 0);
        $totalDescargas = (int) ($perfil['total_descargas'] ?? 0);
        $verificado = (bool) ($perfil['verificado'] ?? false);

        $siteUrl = home_url();
        $canonical = $siteUrl . '/perfil/' . $username . '/';

        /* Title optimizado */
        $seoTitle = "{$nombreVisible} (@{$username}) - Productor Musical | Kamples";

        /* Description */
        $descParts = [];
        if ($bio !== '') {
            $descParts[] = mb_substr(strip_tags($bio), 0, 80);
        }
        $descParts[] = "{$totalSamples} samples publicados";
        if ($totalSeguidores > 0) {
            $descParts[] = "{$totalSeguidores} seguidores";
        }
        $seoDesc = implode('. ', $descParts) . '. Descubre sus samples en Kamples.';
        $seoDesc = mb_substr($seoDesc, 0, 160);

        /* og:image */
        $ogImage = '';
        if ($avatarUrl !== '') {
            $ogImage = NormalizadorSample::rutaAUrl($avatarUrl);
        }

        /* Breadcrumb */
        $breadcrumb = [
            ['name' => 'Inicio', 'url' => $siteUrl . '/'],
            ['name' => 'Productores', 'url' => ''],
            ['name' => $nombreVisible, 'url' => $canonical],
        ];

        /* JSON-LD Person */
        $jsonLd = [
            '@type'       => 'Person',
            '@id'         => $canonical . '#person',
            'name'        => $nombreVisible,
            'alternateName' => '@' . $username,
            'url'         => $canonical,
            'description' => mb_substr(strip_tags($bio), 0, 200),
        ];

        if ($ogImage !== '') {
            $jsonLd['image'] = $ogImage;
        }

        $jsonLd['interactionStatistic'] = [];

        if ($totalSeguidores > 0) {
            $jsonLd['interactionStatistic'][] = [
                '@type' => 'InteractionCounter',
                'interactionType' => 'https://schema.org/FollowAction',
                'userInteractionCount' => $totalSeguidores,
            ];
        }

        if ($totalSamples > 0) {
            $jsonLd['makesOffer'] = [
                '@type' => 'Offer',
                'itemOffered' => [
                    '@type' => 'CreativeWork',
                    'name' => "Samples de {$nombreVisible}",
                    'description' => "{$totalSamples} samples publicados",
                ],
            ];
        }

        RuntimeSeoData::set([
            'title'       => $seoTitle,
            'description' => $seoDesc,
            'canonical'   => $canonical,
            'ogImage'     => $ogImage,
            'ogType'      => 'profile',
            'robots'      => 'index,follow',
            'breadcrumb'  => $breadcrumb,
            'jsonLd'      => $jsonLd,
        ]);
    }

    /**
     * Resuelve SEO para /coleccion/{slug}/
     * Soporta slug alfanumérico y backward compat con ID numérico.
     */
    public static function resolverColeccion(string $segmento): void
    {
        if ($segmento === '' || $segmento === 'coleccion') {
            return;
        }

        try {
            /* Determinar si es ID numérico o slug */
            if (ctype_digit($segmento)) {
                $coleccion = ColeccionesRepository::buscarPorId((int) $segmento);
            } else {
                $coleccion = ColeccionesRepository::obtenerPorSlug($segmento);
            }
        } catch (\Throwable $e) {
            return;
        }

        if ($coleccion === null) {
            return;
        }

        $slug = $coleccion['slug'] ?? $coleccion[ColeccionesCols::ID];

        /* Solo indexar colecciones publicas */
        $esPublica = (bool) ($coleccion['publica'] ?? false);
        if (!$esPublica) {
            RuntimeSeoData::set([
                'robots' => 'noindex,nofollow',
            ]);
            return;
        }

        $nombre = $coleccion['nombre'] ?? 'Coleccion';
        $descripcion = $coleccion['descripcion'] ?? '';
        $totalSamples = (int) ($coleccion['total_samples'] ?? 0);
        $imagenUrl = $coleccion['imagen_url'] ?? '';
        $portadaUrl = $coleccion['portada_url'] ?? '';

        $siteUrl = home_url();
        $canonical = $siteUrl . '/coleccion/' . $slug . '/';

        /* Title */
        $seoTitle = "{$nombre} - Coleccion de Samples | Kamples";

        /* Description */
        $descParts = [];
        if ($descripcion !== '') {
            $descParts[] = mb_substr(strip_tags($descripcion), 0, 100);
        }
        $descParts[] = "{$totalSamples} samples";
        $seoDesc = implode('. ', $descParts) . '. Escucha y descarga en Kamples.';
        $seoDesc = mb_substr($seoDesc, 0, 160);

        /* og:image */
        $ogImage = '';
        if ($imagenUrl !== '') {
            $ogImage = NormalizadorSample::rutaAUrl($imagenUrl);
        } elseif ($portadaUrl !== '') {
            $ogImage = NormalizadorSample::rutaAUrl($portadaUrl);
        }

        /* Breadcrumb */
        $breadcrumb = [
            ['name' => 'Inicio', 'url' => $siteUrl . '/'],
            ['name' => 'Colecciones', 'url' => ''],
            ['name' => $nombre, 'url' => $canonical],
        ];

        /* JSON-LD MusicPlaylist */
        $jsonLd = [
            '@type'     => 'MusicPlaylist',
            '@id'       => $canonical . '#playlist',
            'name'      => $nombre,
            'url'       => $canonical,
            'numTracks' => $totalSamples,
        ];

        if ($descripcion !== '') {
            $jsonLd['description'] = mb_substr(strip_tags($descripcion), 0, 300);
        }

        if ($ogImage !== '') {
            $jsonLd['image'] = $ogImage;
        }

        RuntimeSeoData::set([
            'title'       => $seoTitle,
            'description' => $seoDesc,
            'canonical'   => $canonical,
            'ogImage'     => $ogImage,
            'ogType'      => 'music.playlist',
            'robots'      => 'index,follow',
            'breadcrumb'  => $breadcrumb,
            'jsonLd'      => $jsonLd,
        ]);
    }

    /**
     * [183A-109 Fase 4] Resuelve SEO para /blog/{slug}/
     * Genera JSON-LD BlogPosting, breadcrumbs, OG tags para artículos del blog.
     */
    public static function resolverArticulo(string $slug): void
    {
        /* sentinel-disable-next-line hardcoded-enum-value — 'blog' es nombre de ruta URL, no valor de BD */
        if ($slug === '' || $slug === 'blog') {
            return;
        }

        try {
            $articulo = ArticulosRepository::buscarPorSlug($slug);
        } catch (\Throwable $e) {
            return;
        }

        if ($articulo === null) {
            return;
        }

        /* Solo indexar artículos aprobados */
        $estado = $articulo[ArticulosCols::MODERACION_ESTADO] ?? '';
        if ($estado !== ArticulosEnums::MODERACION_ESTADO_APROBADO) {
            RuntimeSeoData::set(['robots' => 'noindex,nofollow']);
            return;
        }

        $titulo = $articulo[ArticulosCols::TITULO] ?? 'Artículo';
        $extracto = $articulo[ArticulosCols::EXTRACTO] ?? '';
        $contenido = $articulo[ArticulosCols::CONTENIDO] ?? '';
        $portadaUrl = $articulo[ArticulosCols::PORTADA_URL] ?? '';
        $articuloSlug = $articulo[ArticulosCols::SLUG] ?? '';
        $autorNombre = $articulo['autor_nombre'] ?? $articulo['autor_username'] ?? '';
        $autorUsername = $articulo['autor_username'] ?? '';
        $publicadoEn = $articulo[ArticulosCols::PUBLICADO_EN] ?? '';
        $updatedAt = $articulo[ArticulosCols::UPDATED_AT] ?? '';

        $siteUrl = home_url();
        $canonical = $siteUrl . '/blog/' . $articuloSlug . '/';

        $seoTitle = "{$titulo} | Blog | Kamples";

        /* Meta description: extracto o contenido limpio */
        $seoDesc = '';
        if ($extracto !== '') {
            $seoDesc = mb_substr($extracto, 0, 140);
        } else {
            $seoDesc = mb_substr(strip_tags($contenido), 0, 140);
        }
        if ($autorNombre !== '') {
            $seoDesc .= " — por {$autorNombre}";
        }
        $seoDesc = mb_substr($seoDesc, 0, 160);

        /* og:image */
        $ogImage = '';
        if ($portadaUrl !== '') {
            $ogImage = NormalizadorSample::rutaAUrl($portadaUrl);
        }

        /* Breadcrumb */
        $breadcrumb = [
            ['name' => 'Inicio', 'url' => $siteUrl . '/'],
            ['name' => 'Blog', 'url' => $siteUrl . '/blog/'],
            ['name' => $titulo, 'url' => $canonical],
        ];

        /* JSON-LD BlogPosting */
        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'BlogPosting',
            'headline' => mb_substr($titulo, 0, 110),
            'url' => $canonical,
        ];

        if ($seoDesc !== '') {
            $jsonLd['description'] = $seoDesc;
        }
        if ($ogImage !== '') {
            $jsonLd['image'] = $ogImage;
        }
        if ($publicadoEn !== '') {
            $date = date('Y-m-d', strtotime($publicadoEn));
            if ($date !== false && $date !== '1970-01-01') {
                $jsonLd['datePublished'] = $date;
            }
        }
        if ($updatedAt !== '') {
            $date = date('Y-m-d', strtotime($updatedAt));
            if ($date !== false && $date !== '1970-01-01') {
                $jsonLd['dateModified'] = $date;
            }
        }
        if ($autorNombre !== '' || $autorUsername !== '') {
            $jsonLd['author'] = [
                '@type' => 'Person',
                'name' => $autorNombre !== '' ? $autorNombre : $autorUsername,
            ];
            if ($autorUsername !== '') {
                $jsonLd['author']['url'] = $siteUrl . '/perfil/' . $autorUsername . '/';
            }
        }

        RuntimeSeoData::set([
            'title'       => $seoTitle,
            'description' => $seoDesc,
            'canonical'   => $canonical,
            'ogImage'     => $ogImage,
            'ogType'      => 'article',
            'robots'      => 'index,follow',
            'breadcrumb'  => $breadcrumb,
            'jsonLd'      => $jsonLd,
        ]);
    }

    /**
     * Construye JSON-LD MusicRecording para un sample.
     */
    private static function buildMusicRecordingJsonLd(
        string $titulo,
        string $descripcion,
        string $url,
        string $imagen,
        string $audioUrl,
        ?float $duracion,
        array $generos,
        string $key,
        string $escala,
        string $creadorNombre,
        string $creadorUsername,
        string $siteUrl,
        int $descargas,
        int $likes,
        int $reproducciones,
        string $publicadoAt,
        array $tags,
        bool $esPremium,
        ?float $precio
    ): array {
        $jsonLd = [
            '@type'       => 'MusicRecording',
            '@id'         => $url . '#musicrecording',
            'name'        => $titulo,
            'description' => $descripcion,
            'url'         => $url,
        ];

        /* Duracion ISO 8601 */
        if ($duracion !== null && $duracion > 0) {
            $jsonLd['duration'] = self::secondsToIso8601($duracion);
        }

        /* Generos */
        if (!empty($generos)) {
            $jsonLd['genre'] = $generos;
        }

        /* Tonalidad */
        if ($key !== '') {
            $musicalKey = $key;
            if ($escala !== '') {
                $musicalKey .= ' ' . $escala;
            }
            $jsonLd['musicalKey'] = $musicalKey;
        }

        /* Creador */
        if ($creadorUsername !== '') {
            $jsonLd['byArtist'] = [
                '@type' => 'Person',
                'name'  => $creadorNombre !== '' ? $creadorNombre : $creadorUsername,
                'url'   => $siteUrl . '/perfil/' . $creadorUsername . '/',
            ];
        }

        /* AudioObject */
        if ($audioUrl !== '') {
            $audioObj = [
                '@type'          => 'AudioObject',
                'contentUrl'     => $audioUrl,
                'encodingFormat' => 'audio/mpeg',
            ];
            if ($duracion !== null && $duracion > 0) {
                $audioObj['duration'] = self::secondsToIso8601($duracion);
            }
            $jsonLd['audio'] = $audioObj;
        }

        /* Imagen */
        if ($imagen !== '') {
            $jsonLd['image'] = $imagen;
        }

        /* Fecha */
        if ($publicadoAt !== '') {
            $date = date('Y-m-d', strtotime($publicadoAt));
            if ($date !== false && $date !== '1970-01-01') {
                $jsonLd['datePublished'] = $date;
            }
        }

        /* Estadisticas de interaccion */
        $stats = [];
        if ($reproducciones > 0) {
            $stats[] = [
                '@type'                => 'InteractionCounter',
                'interactionType'      => 'https://schema.org/ListenAction',
                'userInteractionCount' => $reproducciones,
            ];
        }
        if ($descargas > 0) {
            $stats[] = [
                '@type'                => 'InteractionCounter',
                'interactionType'      => 'https://schema.org/DownloadAction',
                'userInteractionCount' => $descargas,
            ];
        }
        if ($likes > 0) {
            $stats[] = [
                '@type'                => 'InteractionCounter',
                'interactionType'      => 'https://schema.org/LikeAction',
                'userInteractionCount' => $likes,
            ];
        }
        if (!empty($stats)) {
            $jsonLd['interactionStatistic'] = $stats;
        }

        /* Keywords */
        if (!empty($tags)) {
            $jsonLd['keywords'] = array_values(array_slice($tags, 0, 15));
        }

        /* Oferta (gratis o premium) */
        if ($esPremium && $precio !== null && $precio > 0) {
            $jsonLd['offers'] = [
                '@type'         => 'Offer',
                'price'         => number_format($precio, 2, '.', ''),
                'priceCurrency' => 'USD',
                'availability'  => 'https://schema.org/InStock',
            ];
            $jsonLd['isAccessibleForFree'] = false;
        } else {
            $jsonLd['isAccessibleForFree'] = true;
            $jsonLd['offers'] = [
                '@type'         => 'Offer',
                'price'         => '0',
                'priceCurrency' => 'USD',
                'availability'  => 'https://schema.org/InStock',
            ];
        }

        return $jsonLd;
    }

    /**
     * Convierte segundos a formato ISO 8601 duration (PT#M#S).
     */
    private static function secondsToIso8601(float $seconds): string
    {
        $mins = (int) floor($seconds / 60);
        $secs = $seconds - ($mins * 60);
        $secsFormatted = number_format($secs, 1, '.', '');

        if ($mins > 0) {
            return "PT{$mins}M{$secsFormatted}S";
        }
        return "PT{$secsFormatted}S";
    }
}
