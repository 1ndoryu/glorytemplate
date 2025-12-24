<?php

/**
 * Servicio de Adjuntos
 *
 * Gestiona archivos adjuntos físicos en el sistema de archivos.
 * Reemplaza el almacenamiento Base64 en BD por archivos en disco.
 *
 * Estructura de archivos:
 * /wp-content/uploads/glory-adjuntos/{user_id}/
 *   - {hash}.enc     ← Archivo cifrado (Premium)
 *   - {hash}.raw     ← Archivo sin cifrar (Free)
 *   - thumbs/{hash}.jpg  ← Thumbnails sin cifrar
 *
 * @package App\Services
 */

namespace App\Services;

class AdjuntosService
{
    /* 
     * Constantes de configuración
     */
    private const DIRECTORIO_BASE = 'glory-adjuntos';
    private const DIRECTORIO_THUMBS = 'thumbs';
    private const DIRECTORIO_CACHE = 'cache';
    private const TAMAÑO_THUMBNAIL = 200;
    private const EXTENSION_CIFRADO = '.enc';
    private const EXTENSION_PLANO = '.raw';
    private const CHUNK_SIZE = 8192; /* 8KB para stream cipher */
    private const UMBRAL_STREAM = 1048576; /* 1MB - usar stream cipher para archivos mayores */
    private const CACHE_TTL = 300; /* 5 minutos de vida del cache */

    /* 
     * Tipos MIME permitidos por categoría
     */
    private const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private const TIPOS_AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    private const TIPOS_DOCUMENTO = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    private int $userId;
    private SuscripcionService $suscripcion;
    private ?CifradoService $cifradoService = null;
    private string $rutaBase;
    private string $urlBase;

    public function __construct(int $userId)
    {
        $this->userId = $userId;
        $this->suscripcion = new SuscripcionService($userId);
        $this->inicializarRutas();
        $this->inicializarCifrado();
    }

    /**
     * Inicializa las rutas del sistema de archivos
     */
    private function inicializarRutas(): void
    {
        $uploadDir = wp_upload_dir();
        $this->rutaBase = trailingslashit($uploadDir['basedir']) . self::DIRECTORIO_BASE;
        $this->urlBase = trailingslashit($uploadDir['baseurl']) . self::DIRECTORIO_BASE;
    }

    /**
     * Inicializa el servicio de cifrado si está habilitado y es premium
     */
    private function inicializarCifrado(): void
    {
        /* Solo usuarios Premium pueden cifrar archivos */
        if (!$this->suscripcion->esPremium()) {
            return;
        }

        if (CifradoService::estaHabilitado($this->userId)) {
            try {
                $this->cifradoService = new CifradoService($this->userId);
            } catch (\Exception $e) {
                error_log('[AdjuntosService] Error inicializando cifrado: ' . $e->getMessage());
            }
        }
    }

    /**
     * Obtiene la ruta del directorio del usuario
     */
    private function getRutaUsuario(): string
    {
        return trailingslashit($this->rutaBase) . $this->userId;
    }

    /**
     * Obtiene la ruta del directorio de thumbnails del usuario
     */
    private function getRutaThumbnails(): string
    {
        return trailingslashit($this->getRutaUsuario()) . self::DIRECTORIO_THUMBS;
    }

    /**
     * Obtiene la ruta del directorio de cache del usuario
     * Los archivos en cache se eliminan automáticamente después de TTL
     */
    private function getRutaCache(): string
    {
        return trailingslashit($this->getRutaUsuario()) . self::DIRECTORIO_CACHE;
    }

    /**
     * Crea los directorios necesarios si no existen
     */
    private function asegurarDirectorios(): bool
    {
        $directorios = [
            $this->rutaBase,
            $this->getRutaUsuario(),
            $this->getRutaThumbnails(),
            $this->getRutaCache()
        ];

        foreach ($directorios as $dir) {
            if (!file_exists($dir)) {
                if (!wp_mkdir_p($dir)) {
                    error_log("[AdjuntosService] No se pudo crear directorio: {$dir}");
                    return false;
                }

                /* Proteger directorios con .htaccess */
                $this->protegerDirectorio($dir);
            }
        }

        return true;
    }

    /**
     * Protege un directorio con index.php (sin bloquear acceso directo)
     * Los archivos tienen nombres UUID imposibles de adivinar, lo que proporciona seguridad.
     * Solo los archivos cifrados (.enc) requieren pasar por la API.
     */
    private function protegerDirectorio(string $directorio): void
    {
        /* Archivo index.php vacío para evitar listado de directorio */
        $index = trailingslashit($directorio) . 'index.php';
        if (!file_exists($index)) {
            file_put_contents($index, '<?php // Silence is golden');
        }
    }

    /**
     * Genera un nombre único para el archivo basado en hash
     */
    private function generarNombreArchivo(string $nombreOriginal): string
    {
        $extension = pathinfo($nombreOriginal, PATHINFO_EXTENSION);
        $hash = wp_generate_uuid4();

        return $hash . ($extension ? ".{$extension}" : '');
    }

    /**
     * Determina el tipo de adjunto basado en MIME
     */
    public function determinarTipo(string $mimeType): string
    {
        if (in_array($mimeType, self::TIPOS_IMAGEN)) {
            return 'imagen';
        }
        if (in_array($mimeType, self::TIPOS_AUDIO)) {
            return 'audio';
        }
        if (in_array($mimeType, self::TIPOS_DOCUMENTO)) {
            return 'archivo';
        }

        return 'archivo';
    }

    /**
     * Valida el tipo MIME del archivo
     */
    public function validarTipoMime(string $mimeType): bool
    {
        $permitidos = array_merge(
            self::TIPOS_IMAGEN,
            self::TIPOS_AUDIO,
            self::TIPOS_DOCUMENTO
        );

        return in_array($mimeType, $permitidos);
    }

    /**
     * Sube un archivo al sistema
     * 
     * @param array $archivo Array $_FILES del archivo
     * @return array|null Datos del adjunto o null si falla
     */
    public function subirArchivo(array $archivo): ?array
    {
        /* Validar archivo */
        if (!isset($archivo['tmp_name']) || !is_uploaded_file($archivo['tmp_name'])) {
            error_log('[AdjuntosService] Archivo no válido para subida');
            return null;
        }

        /* Validar tipo MIME */
        $mimeType = mime_content_type($archivo['tmp_name']);
        if (!$this->validarTipoMime($mimeType)) {
            error_log("[AdjuntosService] Tipo MIME no permitido: {$mimeType}");
            return null;
        }

        /* Verificar espacio disponible */
        $almacenamiento = new AlmacenamientoService($this->userId);
        if (!$almacenamiento->puedeSubir($archivo['size'])) {
            error_log('[AdjuntosService] Límite de almacenamiento excedido');
            return null;
        }

        /* Asegurar directorios */
        if (!$this->asegurarDirectorios()) {
            return null;
        }

        /* Generar nombre único */
        $nombreBase = $this->generarNombreArchivo($archivo['name']);
        $tipo = $this->determinarTipo($mimeType);
        $debeCifrar = $this->cifradoService !== null && $this->suscripcion->esPremium();

        /* Determinar extensión y ruta final */
        $extension = $debeCifrar ? self::EXTENSION_CIFRADO : self::EXTENSION_PLANO;
        $nombreFinal = $nombreBase . $extension;
        $rutaCompleta = trailingslashit($this->getRutaUsuario()) . $nombreFinal;

        /* Procesar archivo */
        $exito = $debeCifrar
            ? $this->guardarArchivoCifrado($archivo['tmp_name'], $rutaCompleta)
            : move_uploaded_file($archivo['tmp_name'], $rutaCompleta);

        if (!$exito) {
            error_log("[AdjuntosService] Error al guardar archivo: {$rutaCompleta}");
            return null;
        }

        /* Generar thumbnail si es imagen */
        $rutaThumb = null;
        if ($tipo === 'imagen') {
            $rutaThumb = $this->generarThumbnail($archivo['tmp_name'], $nombreBase);
        }

        /* Construir respuesta */
        $adjuntoId = $this->generarIdAdjunto();

        return [
            'id' => $adjuntoId,
            'tipo' => $tipo,
            'nombre' => $archivo['name'],
            'nombreArchivo' => $nombreFinal,
            'tamano' => $archivo['size'],
            'mimeType' => $mimeType,
            'cifrado' => $debeCifrar,
            'fechaSubida' => current_time('mysql'),
            'url' => $this->generarUrlDescarga($adjuntoId, $nombreFinal, $debeCifrar),
            'thumbnailUrl' => $rutaThumb ? $this->generarUrlThumbnail($nombreBase) : null
        ];
    }

    /**
     * Guarda un archivo cifrado
     * 
     * Para archivos pequeños (<1MB): cifra en memoria
     * Para archivos grandes (>1MB): usa stream cipher en chunks de 8KB
     * 
     * El formato para stream cipher es:
     * [num_chunks:4bytes][chunk1_data][chunk2_data]...
     * Cada chunk se cifra independientemente
     */
    private function guardarArchivoCifrado(string $rutaOrigen, string $rutaDestino): bool
    {
        if ($this->cifradoService === null) {
            return false;
        }

        try {
            $tamanoArchivo = filesize($rutaOrigen);

            /* Archivos pequeños: cifrar en memoria (más eficiente) */
            if ($tamanoArchivo <= self::UMBRAL_STREAM) {
                return $this->cifrarEnMemoria($rutaOrigen, $rutaDestino);
            }

            /* Archivos grandes: stream cipher en chunks */
            return $this->cifrarEnStream($rutaOrigen, $rutaDestino);
        } catch (\Exception $e) {
            error_log('[AdjuntosService] Error cifrando archivo: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Cifra un archivo pequeño en memoria
     */
    private function cifrarEnMemoria(string $rutaOrigen, string $rutaDestino): bool
    {
        $contenido = file_get_contents($rutaOrigen);
        if ($contenido === false) {
            return false;
        }

        $cifrado = $this->cifradoService->cifrar($contenido);

        /* Guardar con marcador de tipo (M = memoria, S = stream) */
        $resultado = file_put_contents($rutaDestino, 'M:' . $cifrado);

        return $resultado !== false;
    }

    /**
     * Cifra un archivo grande usando stream cipher (chunks de 8KB)
     * Cada chunk se cifra independientemente para permitir descifrado parcial
     */
    private function cifrarEnStream(string $rutaOrigen, string $rutaDestino): bool
    {
        $origen = fopen($rutaOrigen, 'rb');
        $destino = fopen($rutaDestino, 'wb');

        if (!$origen || !$destino) {
            return false;
        }

        /* Escribir marcador de tipo stream y número de chunks */
        fwrite($destino, 'S:');

        $numChunks = 0;

        /* Primera pasada: contar chunks para el header */
        while (!feof($origen)) {
            $chunk = fread($origen, self::CHUNK_SIZE);
            if ($chunk !== false && strlen($chunk) > 0) {
                $numChunks++;
            }
        }

        /* Escribir número de chunks (4 bytes, big-endian) */
        fwrite($destino, pack('N', $numChunks));

        /* Volver al inicio */
        rewind($origen);

        /* Segunda pasada: cifrar cada chunk */
        while (!feof($origen)) {
            $chunk = fread($origen, self::CHUNK_SIZE);
            if ($chunk === false || strlen($chunk) === 0) {
                break;
            }

            $chunkCifrado = $this->cifradoService->cifrar($chunk);
            $longitudChunk = strlen($chunkCifrado);

            /* Escribir longitud del chunk cifrado (4 bytes) + datos */
            fwrite($destino, pack('N', $longitudChunk));
            fwrite($destino, $chunkCifrado);
        }

        fclose($origen);
        fclose($destino);

        return true;
    }

    /**
     * Genera un thumbnail para imágenes
     * Si falla (ej. servidor sin GD/Imagick), retorna null pero NO detiene el proceso
     */
    private function generarThumbnail(string $rutaImagen, string $nombreBase): ?string
    {
        /* Intentar cargar el editor de imagen */
        $editor = wp_get_image_editor($rutaImagen);

        /* Si falla (común en ciertos hostings), retornar null silenciosamente */
        if (is_wp_error($editor)) {
            /* Loguear solo como advertencia para depuración, no como error crítico */
            error_log('[AdjuntosService] Warning: No se pudo generar thumbnail (posible falta de GD/Imagick): ' . $editor->get_error_message());
            return null;
        }

        /* Redimensionar */
        $resultadoResize = $editor->resize(self::TAMAÑO_THUMBNAIL, self::TAMAÑO_THUMBNAIL, true);
        if (is_wp_error($resultadoResize)) {
            return null;
        }

        $rutaThumb = trailingslashit($this->getRutaThumbnails()) . $nombreBase . '.jpg';
        $resultado = $editor->save($rutaThumb, 'image/jpeg');

        if (is_wp_error($resultado)) {
            error_log('[AdjuntosService] Warning: Error guardando archivo thumbnail: ' . $resultado->get_error_message());
            return null;
        }

        return $rutaThumb;
    }

    /**
     * Descarga/obtiene el contenido de un archivo
     * 
     * Para archivos cifrados:
     * 1. Verifica si existe en cache (descifrado)
     * 2. Si existe y no ha expirado, retorna del cache
     * 3. Si no existe, descifra y guarda en cache
     * 
     * @param string $nombreArchivo Nombre del archivo almacenado
     * @return string|null Contenido del archivo o null si no existe
     */
    public function obtenerArchivo(string $nombreArchivo): ?string
    {
        $rutaArchivo = trailingslashit($this->getRutaUsuario()) . $nombreArchivo;

        if (!file_exists($rutaArchivo)) {
            error_log("[AdjuntosService] Archivo no encontrado: {$rutaArchivo}");
            return null;
        }

        /* Archivo no cifrado: retornar directamente */
        if (!str_ends_with($nombreArchivo, self::EXTENSION_CIFRADO)) {
            return file_get_contents($rutaArchivo);
        }

        /* Archivo cifrado: verificar cache primero */
        $contenidoCache = $this->obtenerDeCache($nombreArchivo);
        if ($contenidoCache !== null) {
            return $contenidoCache;
        }

        /* Descifrar archivo */
        if ($this->cifradoService === null) {
            error_log('[AdjuntosService] Archivo cifrado sin servicio de cifrado disponible');
            return null;
        }

        try {
            $contenidoCifrado = file_get_contents($rutaArchivo);
            $contenido = $this->descifrarArchivo($contenidoCifrado);

            /* Guardar en cache para futuras peticiones */
            $this->guardarEnCache($nombreArchivo, $contenido);

            return $contenido;
        } catch (\Exception $e) {
            error_log('[AdjuntosService] Error descifrando archivo: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Descifra contenido de archivo según su formato
     * Soporta formato M: (memoria) y S: (stream)
     */
    private function descifrarArchivo(string $contenidoCifrado): string
    {
        /* Detectar formato por el marcador */
        $tipo = substr($contenidoCifrado, 0, 2);
        $datos = substr($contenidoCifrado, 2);

        if ($tipo === 'M:') {
            /* Formato memoria: descifrar directamente */
            return $this->cifradoService->descifrar($datos);
        }

        if ($tipo === 'S:') {
            /* Formato stream: descifrar cada chunk */
            return $this->descifrarStream($datos);
        }

        /* Formato legacy (sin marcador): intentar descifrar directamente */
        return $this->cifradoService->descifrar($contenidoCifrado);
    }

    /**
     * Descifra un archivo en formato stream
     */
    private function descifrarStream(string $datos): string
    {
        $offset = 0;

        /* Leer número de chunks (4 bytes) */
        $numChunks = unpack('N', substr($datos, $offset, 4))[1];
        $offset += 4;

        $resultado = '';

        /* Descifrar cada chunk */
        for ($i = 0; $i < $numChunks; $i++) {
            /* Leer longitud del chunk (4 bytes) */
            $longitudChunk = unpack('N', substr($datos, $offset, 4))[1];
            $offset += 4;

            /* Leer datos del chunk */
            $chunkCifrado = substr($datos, $offset, $longitudChunk);
            $offset += $longitudChunk;

            /* Descifrar chunk */
            $resultado .= $this->cifradoService->descifrar($chunkCifrado);
        }

        return $resultado;
    }

    /**
     * Obtiene archivo del cache si existe y no ha expirado
     */
    private function obtenerDeCache(string $nombreArchivo): ?string
    {
        $rutaCache = trailingslashit($this->getRutaCache()) . md5($nombreArchivo);

        if (!file_exists($rutaCache)) {
            return null;
        }

        /* Verificar TTL */
        $tiempoModificacion = filemtime($rutaCache);
        if (time() - $tiempoModificacion > self::CACHE_TTL) {
            /* Cache expirado, eliminar */
            unlink($rutaCache);
            return null;
        }

        return file_get_contents($rutaCache);
    }

    /**
     * Guarda contenido descifrado en cache
     */
    private function guardarEnCache(string $nombreArchivo, string $contenido): void
    {
        /* Asegurar que el directorio de cache existe */
        $rutaCache = $this->getRutaCache();
        if (!is_dir($rutaCache)) {
            wp_mkdir_p($rutaCache);
            $this->protegerDirectorio($rutaCache);
        }

        $rutaArchivo = trailingslashit($rutaCache) . md5($nombreArchivo);
        file_put_contents($rutaArchivo, $contenido);
    }

    /**
     * Limpia archivos expirados del cache
     * Diseñado para ejecutarse como cron job cada 5 minutos
     */
    public function limpiarCache(): int
    {
        $rutaCache = $this->getRutaCache();

        if (!is_dir($rutaCache)) {
            return 0;
        }

        $eliminados = 0;
        $archivos = scandir($rutaCache);

        foreach ($archivos as $archivo) {
            if ($archivo === '.' || $archivo === '..' || $archivo === 'index.php') {
                continue;
            }

            $rutaCompleta = trailingslashit($rutaCache) . $archivo;

            if (!is_file($rutaCompleta)) {
                continue;
            }

            /* Verificar si ha expirado */
            if (time() - filemtime($rutaCompleta) > self::CACHE_TTL) {
                unlink($rutaCompleta);
                $eliminados++;
            }
        }

        return $eliminados;
    }

    /**
     * Obtiene información de un archivo sin descargarlo
     */
    public function obtenerInfoArchivo(string $nombreArchivo): ?array
    {
        $rutaArchivo = trailingslashit($this->getRutaUsuario()) . $nombreArchivo;

        if (!file_exists($rutaArchivo)) {
            return null;
        }

        $tamano = filesize($rutaArchivo);
        $mimeType = mime_content_type($rutaArchivo);
        $esCifrado = str_ends_with($nombreArchivo, self::EXTENSION_CIFRADO);

        return [
            'nombreArchivo' => $nombreArchivo,
            'tamano' => $tamano,
            'mimeType' => $mimeType,
            'cifrado' => $esCifrado,
            'fechaModificacion' => date('Y-m-d H:i:s', filemtime($rutaArchivo))
        ];
    }

    /**
     * Elimina un archivo y su thumbnail si existe
     */
    public function eliminarArchivo(string $nombreArchivo): bool
    {
        $rutaArchivo = trailingslashit($this->getRutaUsuario()) . $nombreArchivo;
        $eliminado = false;

        /* Eliminar archivo principal */
        if (file_exists($rutaArchivo)) {
            $eliminado = unlink($rutaArchivo);
        }

        /* Eliminar thumbnail si existe */
        $nombreBase = pathinfo($nombreArchivo, PATHINFO_FILENAME);
        /* Remover extensión .enc o .raw */
        $nombreBase = preg_replace('/\.(enc|raw)$/', '', $nombreBase);

        $rutaThumb = trailingslashit($this->getRutaThumbnails()) . $nombreBase . '.jpg';

        if (file_exists($rutaThumb)) {
            unlink($rutaThumb);
        }

        return $eliminado;
    }

    /**
     * Lista todos los archivos del usuario
     */
    public function listarArchivos(): array
    {
        $directorio = $this->getRutaUsuario();

        if (!is_dir($directorio)) {
            return [];
        }

        $archivos = [];
        $items = scandir($directorio);

        foreach ($items as $item) {
            if ($item === '.' || $item === '..' || $item === self::DIRECTORIO_THUMBS) {
                continue;
            }

            $rutaCompleta = trailingslashit($directorio) . $item;

            if (is_file($rutaCompleta)) {
                $archivos[] = $this->obtenerInfoArchivo($item);
            }
        }

        return array_filter($archivos);
    }

    /**
     * Calcula el espacio usado por el usuario en archivos físicos
     */
    public function calcularEspacioUsado(): int
    {
        $directorio = $this->getRutaUsuario();

        if (!is_dir($directorio)) {
            return 0;
        }

        $total = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directorio, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $archivo) {
            if ($archivo->isFile()) {
                $total += $archivo->getSize();
            }
        }

        return $total;
    }

    /**
     * Genera un ID único para el adjunto
     */
    private function generarIdAdjunto(): int
    {
        return (int) (microtime(true) * 1000);
    }

    /**
     * Genera URL para descargar archivo
     * - Archivos cifrados: URL con token temporal firmado (1 hora)
     * - Archivos no cifrados: URL directa al archivo físico
     */
    private function generarUrlDescarga(int $adjuntoId, string $nombreArchivo, bool $cifrado): string
    {
        if ($cifrado) {
            /* Archivos cifrados usan URL con token temporal */
            return \App\Api\AdjuntosApiController::generarUrlConToken(
                $adjuntoId,
                $this->userId,
                $nombreArchivo
            );
        }

        /* Archivos no cifrados: acceso directo */
        return trailingslashit($this->urlBase) . $this->userId . '/' . $nombreArchivo;
    }

    /**
     * Genera URL para thumbnail (acceso directo, no cifrado)
     */
    private function generarUrlThumbnail(string $nombreBase): string
    {
        return trailingslashit($this->urlBase) . $this->userId . '/' . self::DIRECTORIO_THUMBS . '/' . $nombreBase . '.jpg';
    }

    /**
     * Limpia archivos huérfanos (no referenciados en ninguna tarea)
     * Diseñado para ejecutarse como cron job semanal
     */
    public function limpiarHuerfanos(): int
    {
        /* Esta función requiere acceso a las tareas del usuario */
        /* Se implementará cuando se integre con el sistema de tareas */

        return 0;
    }

    /**
     * Obtiene la URL base del directorio de adjuntos
     */
    public function getUrlBase(): string
    {
        return $this->urlBase;
    }

    /**
     * Verifica si el usuario tiene permisos para cifrar archivos
     */
    public function puedeCifrarArchivos(): bool
    {
        return $this->suscripcion->esPremium() &&
            CifradoService::estaHabilitado($this->userId);
    }
}
