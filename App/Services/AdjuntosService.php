<?php

/**
 * Servicio de Adjuntos
 *
 * Fachada que coordina la gestión de archivos adjuntos:
 * - Subida y validación de archivos
 * - Descarga y descifrado
 * - Eliminación y listado
 *
 * Delega operaciones específicas a sub-servicios:
 * - AdjuntosTokenService: tokens HMAC de acceso
 * - AdjuntosFileSystemService: operaciones de disco
 * - AdjuntosCifradoFileService: cifrado/descifrado y cache
 *
 * @package App\Services
 */

namespace App\Services;

class AdjuntosService
{
    private const EXTENSION_CIFRADO = '.enc';
    private const EXTENSION_PLANO = '.raw';
    private const DIRECTORIO_BASE = 'glory-adjuntos';

    /* Tipos MIME permitidos por categoría */
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
    private string $urlBase;
    private AdjuntosFileSystemService $fileSystem;
    private AdjuntosCifradoFileService $cifradoFile;

    public function __construct(int $userId)
    {
        $this->userId = $userId;
        $this->suscripcion = new SuscripcionService($userId);

        /* Inicializar rutas */
        $uploadDir = wp_upload_dir();
        $rutaBase = trailingslashit($uploadDir['basedir']) . self::DIRECTORIO_BASE;
        $this->urlBase = trailingslashit($uploadDir['baseurl']) . self::DIRECTORIO_BASE;

        /* Inicializar cifrado si es premium y está habilitado */
        if ($this->suscripcion->esPremium() && CifradoService::estaHabilitado($userId)) {
            try {
                $this->cifradoService = new CifradoService($userId);
            } catch (\Exception $e) {
                error_log('[AdjuntosService] Error inicializando cifrado: ' . $e->getMessage());
            }
        }

        /* Crear sub-servicios */
        $this->fileSystem = new AdjuntosFileSystemService($userId, $rutaBase);
        $this->cifradoFile = new AdjuntosCifradoFileService(
            $this->cifradoService,
            $this->fileSystem->getRutaUsuario(),
            $this->fileSystem->getRutaCache()
        );
    }

    /** Determina el tipo de adjunto basado en MIME */
    public function determinarTipo(string $mimeType): string
    {
        if (in_array($mimeType, self::TIPOS_IMAGEN)) {
            return 'imagen';
        }
        if (in_array($mimeType, self::TIPOS_AUDIO)) {
            return 'audio';
        }
        return 'archivo';
    }

    /** Valida el tipo MIME del archivo */
    public function validarTipoMime(string $mimeType): bool
    {
        $permitidos = array_merge(self::TIPOS_IMAGEN, self::TIPOS_AUDIO, self::TIPOS_DOCUMENTO);
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
        if (!isset($archivo['tmp_name']) || !is_uploaded_file($archivo['tmp_name'])) {
            error_log('[AdjuntosService] Archivo no válido para subida');
            return null;
        }

        $mimeType = mime_content_type($archivo['tmp_name']);
        if (!$this->validarTipoMime($mimeType)) {
            error_log("[AdjuntosService] Tipo MIME no permitido: {$mimeType}");
            return null;
        }

        $almacenamiento = new AlmacenamientoService($this->userId);
        if (!$almacenamiento->puedeSubir($archivo['size'])) {
            error_log('[AdjuntosService] Límite de almacenamiento excedido');
            return null;
        }

        if (!$this->fileSystem->asegurarDirectorios()) {
            return null;
        }

        $nombreBase = $this->fileSystem->generarNombreArchivo($archivo['name']);
        $tipo = $this->determinarTipo($mimeType);
        $debeCifrar = $this->cifradoService !== null && $this->suscripcion->esPremium();

        $extension = $debeCifrar ? self::EXTENSION_CIFRADO : self::EXTENSION_PLANO;
        $nombreFinal = $nombreBase . $extension;
        $rutaCompleta = trailingslashit($this->fileSystem->getRutaUsuario()) . $nombreFinal;

        // sentinel-disable-next-line retorno-ignorado-repo — FALSO POSITIVO: retorno capturado en $exito via ternario
        $exito = $debeCifrar
            // sentinel-disable-next-line retorno-ignorado-repo — FALSO POSITIVO: retorno capturado en $exito
            ? $this->cifradoFile->guardarArchivoCifrado($archivo['tmp_name'], $rutaCompleta)
            : move_uploaded_file($archivo['tmp_name'], $rutaCompleta);

        if (!$exito) {
            error_log("[AdjuntosService] Error al guardar archivo: {$rutaCompleta}");
            return null;
        }

        $rutaThumb = null;
        if ($tipo === 'imagen') {
            $rutaThumb = $this->fileSystem->generarThumbnail($archivo['tmp_name'], $nombreBase);
        }

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
     * Obtiene el contenido de un archivo (descifrado si es necesario)
     */
    public function obtenerArchivo(string $nombreArchivo): ?string
    {
        $rutaArchivo = trailingslashit($this->fileSystem->getRutaUsuario()) . $nombreArchivo;

        if (!$this->fileSystem->validarRutaSegura($rutaArchivo)) {
            error_log('[AdjuntosService] Path traversal detectado: ' . $nombreArchivo);
            return null;
        }

        if (!file_exists($rutaArchivo)) {
            error_log("[AdjuntosService] Archivo no encontrado");
            return null;
        }

        /* Archivo no cifrado: retornar directamente */
        if (!str_ends_with($nombreArchivo, self::EXTENSION_CIFRADO)) {
            return file_get_contents($rutaArchivo);
        }

        /* Archivo cifrado: delegar a servicio de cifrado */
        return $this->cifradoFile->obtenerArchivoCifrado($rutaArchivo, $nombreArchivo);
    }

    /** Elimina un archivo y su thumbnail */
    public function eliminarArchivo(string $nombreArchivo): bool
    {
        return $this->fileSystem->eliminarArchivo($nombreArchivo);
    }

    /** Lista todos los archivos del usuario */
    public function listarArchivos(): array
    {
        return $this->fileSystem->listarArchivos();
    }

    /** Obtiene información de un archivo sin descargarlo */
    public function obtenerInfoArchivo(string $nombreArchivo): ?array
    {
        return $this->fileSystem->obtenerInfoArchivo($nombreArchivo);
    }

    /** Calcula el espacio usado por el usuario */
    public function calcularEspacioUsado(): int
    {
        return $this->fileSystem->calcularEspacioUsado();
    }

    /** Limpia archivos expirados del cache */
    public function limpiarCache(): int
    {
        return $this->cifradoFile->limpiarCache();
    }

    /** Genera un ID único para el adjunto */
    private function generarIdAdjunto(): int
    {
        return (int) (microtime(true) * 1000);
    }

    /**
     * Genera URL para descargar archivo con token HMAC firmado.
     * Todos los archivos (cifrados y no cifrados) llevan token para que
     * funcionen desde <img> tags y otros contextos sin headers de auth.
     * Sin token, un <img src="..."> no puede enviar X-WP-Nonce y la cookie
     * de sesión WordPress puede no acompañar la request → 401.
     */
    private function generarUrlDescarga(int $adjuntoId, string $nombreArchivo, bool $cifrado): string
    {
        return AdjuntosTokenService::generarUrlConToken(
            $adjuntoId,
            $this->userId,
            $nombreArchivo
        );
    }

    /** Genera URL para thumbnail */
    private function generarUrlThumbnail(string $nombreBase): string
    {
        return trailingslashit($this->urlBase) . $this->userId . '/thumbs/' . $nombreBase . '.jpg';
    }

    /** Limpia archivos huérfanos (placeholder para cron futuro) */
    public function limpiarHuerfanos(): int
    {
        return 0;
    }

    /** Obtiene la URL base del directorio de adjuntos */
    public function getUrlBase(): string
    {
        return $this->urlBase;
    }

    /** Verifica si el usuario puede cifrar archivos */
    public function puedeCifrarArchivos(): bool
    {
        return $this->suscripcion->esPremium() &&
            CifradoService::estaHabilitado($this->userId);
    }

    /* Compatibilidad retroactiva: delegan a AdjuntosTokenService */

    public static function generarToken(int $userId, string $file, int $exp): string
    {
        return AdjuntosTokenService::generarToken($userId, $file, $exp);
    }

    public static function generarUrlConToken(int $adjuntoId, int $userId, string $nombreArchivo): string
    {
        return AdjuntosTokenService::generarUrlConToken($adjuntoId, $userId, $nombreArchivo);
    }

    public static function traducirErrorSubida(int $codigo): string
    {
        return AdjuntosTokenService::traducirErrorSubida($codigo);
    }
}
