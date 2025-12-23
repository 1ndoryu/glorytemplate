<?php

/**
 * Dashboard Repository
 *
 * Capa de acceso a datos para el dashboard de productividad.
 * Maneja la persistencia en tablas SQL personalizadas (wp_glory_*)
 * con fallback y migración automática desde user_meta.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Database\Schema;
use App\Services\CifradoService;

class DashboardRepository
{
    private int $userId;
    private ?CifradoService $cifradoService = null;
    private bool $cifradoHabilitado = false;

    /* Meta keys (Mantenidos para configuración, sync y migración) */
    private const META_HABITOS = '_glory_dashboard_habitos';
    private const META_TAREAS = '_glory_dashboard_tareas';
    private const META_PROYECTOS = '_glory_dashboard_proyectos';
    private const META_NOTAS = '_glory_dashboard_notas';
    private const META_CONFIG = '_glory_dashboard_config';
    private const META_SYNC = '_glory_dashboard_sync';
    private const META_CHANGELOG = '_glory_dashboard_changelog';

    /* Versión del esquema de datos */
    private const SCHEMA_VERSION = '1.0.0';

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario inválido');
        }
        $this->userId = $userId;
        $this->inicializarCifrado();
    }

    /**
     * Inicializa el servicio de cifrado si está habilitado para el usuario
     */
    private function inicializarCifrado(): void
    {
        $this->cifradoHabilitado = CifradoService::estaHabilitado($this->userId);

        if ($this->cifradoHabilitado) {
            try {
                $this->cifradoService = new CifradoService($this->userId);
            } catch (\Exception $e) {
                error_log('[DashboardRepo] Error inicializando cifrado: ' . $e->getMessage());
                $this->cifradoHabilitado = false;
            }
        }
    }

    /**
     * Habilita el cifrado para el usuario actual
     * Migra los datos existentes a formato cifrado
     */
    public function habilitarCifrado(): bool
    {
        if ($this->cifradoHabilitado) {
            return true;
        }

        try {
            /* Cargar datos actuales sin cifrado */
            $datos = $this->loadAll();

            /* 
             * IMPORTANTE: Remover 'configuracion' de los datos para que saveAll
             * no sobrescriba nuestro cifradoE2E=true con el valor anterior (false)
             */
            unset($datos['configuracion']);

            /* Activar cifrado en configuración */
            $config = $this->getConfiguracion();
            $config['cifradoE2E'] = true;

            /* Guardar config PRIMERO sin usar encodeData para cifrar (aún no está activo) */
            $configJson = wp_json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            update_user_meta($this->userId, self::META_CONFIG, $configJson);

            /* Re-inicializar con cifrado habilitado */
            $this->cifradoHabilitado = false;
            $this->cifradoService = null;
            $this->inicializarCifrado();

            /* Re-guardar datos (sin configuración) con cifrado */
            if ($this->cifradoHabilitado && $this->cifradoService !== null) {
                $this->saveAll($datos);
                return true;
            } else {
                error_log('[DashboardRepo] Error: Cifrado no se pudo activar');
                return false;
            }
        } catch (\Exception $e) {
            error_log('[DashboardRepo] Error habilitando cifrado: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Deshabilita el cifrado (descifra todos los datos)
     */
    public function deshabilitarCifrado(): bool
    {
        if (!$this->cifradoHabilitado) {
            return true;
        }

        try {
            /* Cargar datos descifrados */
            $datos = $this->loadAll();

            /* Remover configuracion para evitar conflictos */
            unset($datos['configuracion']);

            /* Desactivar cifrado en configuración */
            $config = $this->getConfiguracion();
            $config['cifradoE2E'] = false;

            /* Forzar desactivación antes de guardar */
            $this->cifradoHabilitado = false;
            $this->cifradoService = null;

            $this->setConfiguracion($config);

            /* Re-guardar datos sin cifrado */
            $this->saveAll($datos);

            return true;
        } catch (\Exception $e) {
            error_log('[DashboardRepo] Error deshabilitando cifrado: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Carga todos los datos del dashboard
     * Incluye elementos propios + compartidos conmigo
     */
    public function loadAll(): array
    {
        /* Obtener datos propios */
        $tareasPropia = $this->getTareas();
        $proyectosPropios = $this->getProyectos();

        /* Obtener datos compartidos conmigo */
        $datosCompartidos = $this->getDatosCompartidos();

        /* Combinar tareas: propias + de proyectos compartidos + asignadas */
        $todasLasTareas = array_merge(
            $tareasPropia,
            $datosCompartidos['tareas']
        );

        /* Combinar proyectos: propios + compartidos */
        $todosLosProyectos = array_merge(
            $proyectosPropios,
            $datosCompartidos['proyectos']
        );

        return [
            'version' => self::SCHEMA_VERSION,
            'habitos' => $this->getHabitos(),
            'tareas' => $todasLasTareas,
            'proyectos' => $todosLosProyectos,
            'notas' => $this->getNotas(),
            'configuracion' => $this->getConfiguracion(),
            'ultimaActualizacion' => $this->getLastUpdate(),
        ];
    }

    /**
     * Obtiene tareas y proyectos compartidos conmigo
     * Incluye metadata de compartido para distinguirlos en el frontend
     * 
     * @return array ['tareas' => [...], 'proyectos' => [...]]
     */
    private function getDatosCompartidos(): array
    {
        $compartidosService = new \App\Services\CompartidosService();
        $tareasCompartidas = [];
        $proyectosCompartidos = [];

        /* 1. Obtener proyectos compartidos conmigo */
        $proyectosData = $compartidosService->obtenerDatosProyectosCompartidos($this->userId);

        foreach ($proyectosData as $pData) {
            $proyecto = $this->decodeDataCompartido($pData['data']);
            if (!$proyecto) continue;

            /* Agregar metadata de compartido */
            $proyecto['id'] = (int) $pData['idLocal'];
            $proyecto['esCompartido'] = true;
            $proyecto['propietarioId'] = $pData['propietarioId'];
            $proyecto['propietarioNombre'] = $pData['propietarioNombre'];
            $proyecto['propietarioAvatar'] = $pData['propietarioAvatar'];
            $proyecto['miRol'] = $pData['rol'];

            $proyectosCompartidos[] = $proyecto;
        }

        /* 2. Obtener tareas de proyectos compartidos */
        $tareasProyectos = $compartidosService->obtenerTareasDeProyectosCompartidos($this->userId);

        foreach ($tareasProyectos as $tData) {
            $tarea = $this->decodeDataCompartido($tData['data']);
            if (!$tarea) continue;

            /* Agregar metadata de compartido */
            $tarea['id'] = (int) $tData['idLocal'];
            $tarea['esCompartido'] = true;
            $tarea['propietarioId'] = $tData['propietarioId'];
            $tarea['propietarioNombre'] = $tData['propietarioNombre'];
            $tarea['propietarioAvatar'] = $tData['propietarioAvatar'];
            $tarea['miRol'] = $tData['rol'];
            $tarea['proyectoId'] = $tData['proyectoId'];

            $tareasCompartidas[] = $tarea;
        }

        /* 3. Obtener tareas asignadas directamente a mí */
        $tareasAsignadas = $compartidosService->obtenerTareasAsignadasAMi($this->userId);

        foreach ($tareasAsignadas as $tData) {
            $tarea = $this->decodeDataCompartido($tData['data']);
            if (!$tarea) continue;

            $tarea['id'] = (int) $tData['idLocal'];
            $tarea['esCompartido'] = true;
            $tarea['propietarioId'] = $tData['propietarioId'];
            $tarea['propietarioNombre'] = $tData['propietarioNombre'];
            $tarea['propietarioAvatar'] = $tData['propietarioAvatar'];
            $tarea['miRol'] = $tData['rol'];

            $tareasCompartidas[] = $tarea;
        }

        return [
            'tareas' => $tareasCompartidas,
            'proyectos' => $proyectosCompartidos
        ];
    }

    /**
     * Decodifica datos de elementos compartidos
     * Los datos compartidos están en JSON plano (no cifrados con mi clave)
     * 
     * @param string $data JSON string
     * @return array|null
     */
    private function decodeDataCompartido(string $data): ?array
    {
        if (empty($data)) return null;

        $decoded = json_decode($data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Guarda todos los datos del dashboard
     */
    public function saveAll(array $data): bool
    {
        $timestamp = time() * 1000;
        $results = [];

        /* Usamos transacciones si es posible, aunque MyISAM no lo soporta, InnoDB sí */
        global $wpdb;
        $wpdb->query('START TRANSACTION');

        try {
            if (isset($data['habitos'])) {
                $results['habitos'] = $this->setHabitos($data['habitos']);
            }

            if (isset($data['tareas'])) {
                $results['tareas'] = $this->setTareas($data['tareas']);
            }

            if (isset($data['proyectos'])) {
                $results['proyectos'] = $this->setProyectos($data['proyectos']);
            }

            if (isset($data['notas'])) {
                $results['notas'] = $this->setNotas($data['notas']);
            }

            if (isset($data['configuracion'])) {
                $results['configuracion'] = $this->setConfiguracion($data['configuracion']);
            }

            $this->updateSyncStatus($timestamp);
            $wpdb->query('COMMIT');

            return !in_array(false, $results, true);
        } catch (\Exception $e) {
            $wpdb->query('ROLLBACK');
            error_log('[DashboardRepo] Error saving dashboard: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene los hábitos del usuario (SQL con fallback a Meta)
     */
    public function getHabitos(): array
    {
        global $wpdb;
        $table = Schema::getTableName('habitos');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        /* Si hay datos SQL, devolverlos */
        if (!empty($rows)) {
            $habitos = array_map(function ($row) {
                /* Usar decodeData para descifrar si es necesario */
                $data = $this->decodeData($row['data'], null);
                /* Asegurar que el ID sea el correcto (cast a numero por si acaso) */
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);

            /* Filtrar valores null (descifrado fallido) */
            return array_values(array_filter($habitos, fn($h) => $h !== null && is_array($h)));
        }

        /* Si está vacío, verificar si hay datos antiguos en user_meta para migrar */
        $metaData = get_user_meta($this->userId, self::META_HABITOS, true);
        if (!empty($metaData)) {
            $habitos = $this->decodeData($metaData, []);
            if (!empty($habitos)) {
                $this->migrateHabitosToSql($habitos);
                /* Borrar meta antigua para no migrar de nuevo */
                delete_user_meta($this->userId, self::META_HABITOS);
                return $habitos;
            }
        }

        return [];
    }

    /**
     * Guarda los hábitos (Sincronización total: Upsert + Soft Delete)
     */
    public function setHabitos(array $habitos): bool
    {
        global $wpdb;
        $table = Schema::getTableName('habitos');
        $now = current_time('mysql');

        /* 1. Obtener IDs existentes para detectar borrados */
        $existingIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ));

        $incomingIds = [];

        /* 2. Upsert (Insertar o Actualizar) */
        foreach ($habitos as $habito) {
            if (!isset($habito['id'])) continue;

            $idLocal = (int)$habito['id'];
            $incomingIds[] = $idLocal;

            /* 
             * Preparar datos para columnas SQL
             * Si el cifrado está activo, el nombre también se oculta
             */
            $nombreOriginal = sanitize_text_field($habito['nombre'] ?? '');
            $nombre = $this->cifradoHabilitado ? '[CIFRADO]' : $nombreOriginal;

            $frecuenciaData = $habito['frecuencia'] ?? null;
            $frecuencia = is_array($frecuenciaData) ? ($frecuenciaData['tipo'] ?? 'diario') : 'diario';
            $completadoHoy = isset($habito['ultimoCompletado']) && $habito['ultimoCompletado'] === date('Y-m-d') ? 1 : 0;

            /* Verificar si existe para decidir INSERT o UPDATE */
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE user_id = %d AND id_local = %d",
                $this->userId,
                $idLocal
            ));

            $dataJson = $this->encodeData($habito);

            if ($exists) {
                $wpdb->update(
                    $table,
                    [
                        'nombre' => $nombre,
                        'frecuencia_tipo' => $frecuencia,
                        'completado_hoy' => $completadoHoy,
                        'data' => $dataJson,
                        'deleted_at' => null, /* Restaurar si estaba borrado */
                        'updated_at' => $now
                    ],
                    ['id' => $exists],
                    ['%s', '%s', '%d', '%s', '%s', '%s'],
                    ['%d']
                );
            } else {
                $wpdb->insert(
                    $table,
                    [
                        'user_id' => $this->userId,
                        'id_local' => $idLocal,
                        'nombre' => $nombre,
                        'frecuencia_tipo' => $frecuencia,
                        'completado_hoy' => $completadoHoy,
                        'fecha_creacion' => $now,
                        'data' => $dataJson
                    ],
                    ['%d', '%d', '%s', '%s', '%d', '%s', '%s']
                );
            }
        }

        /* 3. Soft Delete para los que ya no vienen */
        $toDelete = array_diff($existingIds, $incomingIds);
        if (!empty($toDelete)) {
            $idsList = implode(',', array_map('intval', $toDelete));
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET deleted_at = %s WHERE user_id = %d AND id_local IN ($idsList)",
                $now,
                $this->userId
            ));
        }

        return true;
    }

    /**
     * Migra hábitos de Meta a SQL
     */
    private function migrateHabitosToSql(array $habitos): void
    {
        $this->setHabitos($habitos);
    }

    /**
     * Obtiene tareas (SQL con fallback)
     */
    public function getTareas(): array
    {
        global $wpdb;
        $table = Schema::getTableName('tareas');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        if (!empty($rows)) {
            $tareas = array_map(function ($row) {
                /* Usar decodeData para descifrar si es necesario */
                $data = $this->decodeData($row['data'], null);
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);

            /* Filtrar valores null (descifrado fallido) */
            return array_values(array_filter($tareas, fn($t) => $t !== null && is_array($t)));
        }

        /* Fallback */
        $metaData = get_user_meta($this->userId, self::META_TAREAS, true);
        if (!empty($metaData)) {
            $tareas = $this->decodeData($metaData, []);
            if (!empty($tareas)) {
                $this->setTareas($tareas); /* Migración */
                delete_user_meta($this->userId, self::META_TAREAS);
                return $tareas;
            }
        }

        return [];
    }

    /**
     * Guarda tareas (SQL)
     */
    public function setTareas(array $tareas): bool
    {
        global $wpdb;
        $table = Schema::getTableName('tareas');
        $now = current_time('mysql');

        $existingIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ));

        $incomingIds = [];

        foreach ($tareas as $tarea) {
            if (!isset($tarea['id'])) continue;

            $idLocal = (int)$tarea['id'];
            $incomingIds[] = $idLocal;

            /* Si el cifrado está activo, el texto también se oculta */
            $textoOriginal = sanitize_text_field($tarea['texto'] ?? '');
            $texto = $this->cifradoHabilitado ? '[CIFRADO]' : $textoOriginal;

            $completada = !empty($tarea['completada']) ? 1 : 0;
            $proyectoId = isset($tarea['proyectoId']) ? (int)$tarea['proyectoId'] : null;
            $padreId = isset($tarea['padreId']) ? (int)$tarea['padreId'] : null;
            $prioridad = $tarea['prioridad'] ?? null; // alta, media, baja

            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE user_id = %d AND id_local = %d",
                $this->userId,
                $idLocal
            ));

            $dataJson = $this->encodeData($tarea);

            if ($exists) {
                $wpdb->update(
                    $table,
                    [
                        'texto' => $texto,
                        'completada' => $completada,
                        'proyecto_id' => $proyectoId,
                        'padre_id' => $padreId,
                        'prioridad' => $prioridad,
                        'data' => $dataJson,
                        'deleted_at' => null,
                        'updated_at' => $now
                    ],
                    ['id' => $exists],
                    ['%s', '%d', '%d', '%d', '%s', '%s', '%s', '%s'],
                    ['%d']
                );
            } else {
                $wpdb->insert(
                    $table,
                    [
                        'user_id' => $this->userId,
                        'id_local' => $idLocal,
                        'texto' => $texto,
                        'completada' => $completada,
                        'proyecto_id' => $proyectoId,
                        'padre_id' => $padreId,
                        'prioridad' => $prioridad,
                        'data' => $dataJson
                    ],
                    ['%d', '%d', '%s', '%d', '%d', '%d', '%s', '%s']
                );
            }
        }

        $toDelete = array_diff($existingIds, $incomingIds);
        if (!empty($toDelete)) {
            $idsList = implode(',', array_map('intval', $toDelete));
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET deleted_at = %s WHERE user_id = %d AND id_local IN ($idsList)",
                $now,
                $this->userId
            ));
        }

        return true;
    }

    /**
     * Obtiene proyectos (SQL con fallback)
     */
    public function getProyectos(): array
    {
        global $wpdb;
        $table = Schema::getTableName('proyectos');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT data, id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ), 'ARRAY_A');

        if (!empty($rows)) {
            $proyectos = array_map(function ($row) {
                /* Usar decodeData para descifrar si es necesario */
                $data = $this->decodeData($row['data'], null);
                if (is_array($data)) {
                    $data['id'] = (int)$row['id_local'];
                }
                return $data;
            }, $rows);

            /* Filtrar valores null (descifrado fallido) */
            return array_values(array_filter($proyectos, fn($p) => $p !== null && is_array($p)));
        }

        /* Fallback */
        $metaData = get_user_meta($this->userId, self::META_PROYECTOS, true);
        if (!empty($metaData)) {
            $proyectos = $this->decodeData($metaData, []);
            if (!empty($proyectos)) {
                $this->setProyectos($proyectos); /* Migración */
                delete_user_meta($this->userId, self::META_PROYECTOS);
                return $proyectos;
            }
        }

        return [];
    }

    /**
     * Guarda proyectos (SQL)
     */
    public function setProyectos(array $proyectos): bool
    {
        global $wpdb;
        $table = Schema::getTableName('proyectos');
        $now = current_time('mysql');

        $existingIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id_local FROM $table WHERE user_id = %d AND deleted_at IS NULL",
            $this->userId
        ));

        $incomingIds = [];

        foreach ($proyectos as $proyecto) {
            if (!isset($proyecto['id'])) continue;

            $idLocal = (int)$proyecto['id'];
            $incomingIds[] = $idLocal;

            /* Si el cifrado está activo, el nombre también se oculta */
            $nombreOriginal = sanitize_text_field($proyecto['nombre'] ?? '');
            $nombre = $this->cifradoHabilitado ? '[CIFRADO]' : $nombreOriginal;

            $estado = $proyecto['estado'] ?? 'activo';
            $prioridad = $proyecto['prioridad'] ?? null;

            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE user_id = %d AND id_local = %d",
                $this->userId,
                $idLocal
            ));

            $dataJson = $this->encodeData($proyecto);

            if ($exists) {
                $wpdb->update(
                    $table,
                    [
                        'nombre' => $nombre,
                        'estado' => $estado,
                        'prioridad' => $prioridad,
                        'data' => $dataJson,
                        'deleted_at' => null,
                        'updated_at' => $now
                    ],
                    ['id' => $exists],
                    ['%s', '%s', '%s', '%s', '%s', '%s'],
                    ['%d']
                );
            } else {
                $wpdb->insert(
                    $table,
                    [
                        'user_id' => $this->userId,
                        'id_local' => $idLocal,
                        'nombre' => $nombre,
                        'estado' => $estado,
                        'prioridad' => $prioridad,
                        'data' => $dataJson
                    ],
                    ['%d', '%d', '%s', '%s', '%s', '%s']
                );
            }
        }

        $toDelete = array_diff($existingIds, $incomingIds);
        if (!empty($toDelete)) {
            $idsList = implode(',', array_map('intval', $toDelete));
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET deleted_at = %s WHERE user_id = %d AND id_local IN ($idsList)",
                $now,
                $this->userId
            ));
        }

        return true;
    }

    /**
     * Obtiene las notas (Mantenemos en META por simplicidad de string único)
     * Las notas son texto plano, no JSON, así que descifrado especial
     */
    public function getNotas(): mixed
    {
        $data = get_user_meta($this->userId, self::META_NOTAS, true);
        if (empty($data)) return '';

        /* Descifrar si está cifrado - las notas son texto plano, no JSON */
        if ($this->cifradoService !== null && $this->cifradoService->estaCifrado($data)) {
            try {
                return $this->cifradoService->descifrar($data);
            } catch (\Exception $e) {
                error_log('[DashboardRepo] Error descifrando notas: ' . $e->getMessage());
                return '';
            }
        }

        return $data;
    }

    public function setNotas(mixed $notas): bool
    {
        /* 
         * update_user_meta devuelve false si el valor no cambió, lo cual no es un error
         * IMPORTANTE: Las notas deben cifrarse cuando E2E está activo
         */
        $valorGuardar = is_string($notas) ? $notas : wp_json_encode($notas, JSON_UNESCAPED_UNICODE);

        /* Cifrar si el E2E está habilitado */
        if ($this->cifradoHabilitado && $this->cifradoService !== null && !empty($valorGuardar)) {
            try {
                $valorGuardar = $this->cifradoService->cifrar($valorGuardar);
            } catch (\Exception $e) {
                error_log('[DashboardRepo] Error cifrando notas: ' . $e->getMessage());
            }
        }

        update_user_meta($this->userId, self::META_NOTAS, $valorGuardar);
        return true;
    }

    /**
     * Configuración (META)
     * IMPORTANTE: La configuración NUNCA se cifra porque contiene
     * la bandera cifradoE2E necesaria para bootstrap del cifrado.
     */
    public function getConfiguracion(): array
    {
        $data = get_user_meta($this->userId, self::META_CONFIG, true);

        if (empty($data)) {
            return $this->getDefaultConfig();
        }

        /* 
         * AUTO-REPARACIÓN: Si la config está cifrada (error anterior),
         * restaurar a valores por defecto.
         */
        if (is_string($data) && str_starts_with($data, 'ENC:')) {
            error_log('[DashboardRepo] AUTO-REPARACIÓN: Configuración cifrada detectada, restaurando a valores por defecto');
            $defaultConfig = $this->getDefaultConfig();
            $this->setConfiguracion($defaultConfig);
            return $defaultConfig;
        }

        /* La config siempre está en JSON plano, nunca cifrada */
        if (is_string($data)) {
            $decoded = json_decode($data, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return array_merge($this->getDefaultConfig(), $decoded);
            }

            /* JSON inválido - restaurar */
            error_log('[DashboardRepo] AUTO-REPARACIÓN: JSON inválido en config, restaurando');
            $defaultConfig = $this->getDefaultConfig();
            $this->setConfiguracion($defaultConfig);
            return $defaultConfig;
        }

        if (is_array($data)) {
            return array_merge($this->getDefaultConfig(), $data);
        }

        return $this->getDefaultConfig();
    }

    public function setConfiguracion(array $config): bool
    {
        /* 
         * IMPORTANTE: La configuración NUNCA se cifra.
         * Esto es necesario para poder leer cifradoE2E en el bootstrap.
         * 
         * CRÍTICO: El valor de cifradoE2E NO puede ser modificado desde aquí.
         * Esto previene que el frontend sobrescriba el estado del cifrado
         * a través de la sincronización normal. Solo habilitarCifrado/deshabilitarCifrado
         * pueden modificar este valor.
         */

        /* Obtener el valor ACTUAL de cifradoE2E del servidor */
        $configActual = get_user_meta($this->userId, self::META_CONFIG, true);
        $cifradoActual = false;

        if (!empty($configActual) && is_string($configActual)) {
            $decoded = json_decode($configActual, true);
            if (is_array($decoded) && isset($decoded['cifradoE2E'])) {
                $cifradoActual = $decoded['cifradoE2E'];
            }
        }

        /* Merge con defaults, pero FORZAR el valor actual de cifradoE2E */
        $merged = array_merge($this->getDefaultConfig(), $config);
        $merged['cifradoE2E'] = $cifradoActual;

        $json = wp_json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        update_user_meta($this->userId, self::META_CONFIG, $json);
        return true;
    }

    private function getDefaultConfig(): array
    {
        return [
            'notificaciones' => [
                'email' => false,
                'frecuenciaResumen' => 'nunca',
                'horaPreferida' => '09:00',
                'tareasPorVencer' => true,
                'rachaEnPeligro' => true,
            ],
            'cifradoE2E' => false,
            'tema' => 'terminal',
            'ordenHabitos' => 'inteligente',
        ];
    }

    /**
     * Sync Status (META)
     */
    public function getSyncStatus(): array
    {
        $data = get_user_meta($this->userId, self::META_SYNC, true);
        $sync = $this->decodeData($data, []);

        return [
            'lastSync' => $sync['lastSync'] ?? null,
            'lastUpdate' => $sync['lastUpdate'] ?? null,
            'version' => self::SCHEMA_VERSION,
            'serverTimestamp' => time() * 1000,
        ];
    }

    private function updateSyncStatus(int $timestamp): void
    {
        $sync = [
            'lastSync' => $timestamp,
            'lastUpdate' => current_time('c'),
            'version' => self::SCHEMA_VERSION,
        ];
        $encoded = $this->encodeData($sync);
        update_user_meta($this->userId, self::META_SYNC, $encoded);
    }

    public function getLastUpdate(): ?string
    {
        $sync = $this->getSyncStatus();
        return $sync['lastUpdate'] ?? null;
    }

    /* Métodos de Sync Incremental (Necesitan adaptación a SQL) */

    public function getChangesSince(int $since): array
    {
        /* TODO: Usar updated_at de las tablas SQL para generar changelog dinámico 
           Por ahora mantenemos el changelog en meta si se usa pushChanges,
           pero lo ideal es consultarlo directamente de las tablas */

        $data = get_user_meta($this->userId, self::META_CHANGELOG, true);
        $changelog = $this->decodeData($data, []);
        $changes = array_filter($changelog, fn($entry) => ($entry['timestamp'] ?? 0) > $since);
        $changes = array_slice($changes, -100);

        return [
            'changes' => array_values($changes),
            'hasMore' => count($changelog) > count($changes),
        ];
    }

    public function applyChanges(array $changes, int $clientTimestamp): array
    {
        $applied = [];
        $conflicts = [];

        /* Implementación simplificada: Reutilizar setters individuales */

        foreach ($changes as $change) {
            $entity = $change['entity'] ?? null;
            $data = $change['data'] ?? null;
            $type = $change['type'] ?? null;

            if ($type === 'delete' && $data && isset($data['id'])) {
                /* Handle Delete */
                $this->softDeleteEntity($entity, (int)$data['id']);
                $applied[] = $data['id'];
            } elseif (($type === 'create' || $type === 'update') && $data) {
                /* Handle Create/Update */
                /* Truco: Envolver data en array y llamar al setter masivo solo para ese item */
                if ($entity === 'habito') $this->setHabitos([$data]);
                elseif ($entity === 'tarea') $this->setTareas([$data]);
                elseif ($entity === 'proyecto') $this->setProyectos([$data]);

                $applied[] = $data['id'] ?? null;
            }
        }

        $this->addToChangelog($changes, $clientTimestamp);

        return [
            'applied' => $applied,
            'conflicts' => $conflicts,
            'serverTimestamp' => time() * 1000,
        ];
    }

    private function softDeleteEntity(string $entity, int $idLocal): void
    {
        global $wpdb;
        $table = Schema::getTableName($entity . 's'); // habitos, tareas...
        $wpdb->update(
            $table,
            ['deleted_at' => current_time('mysql')],
            ['user_id' => $this->userId, 'id_local' => $idLocal],
            ['%s'],
            ['%d', '%d']
        );
    }

    private function addToChangelog(array $changes, int $timestamp): void
    {
        $data = get_user_meta($this->userId, self::META_CHANGELOG, true);
        $changelog = $this->decodeData($data, []);
        foreach ($changes as $change) {
            $changelog[] = ['timestamp' => $timestamp, 'change' => $change];
        }
        if (count($changelog) > 500) $changelog = array_slice($changelog, -500);
        update_user_meta($this->userId, self::META_CHANGELOG, $this->encodeData($changelog));
    }

    /* Validadores y Helpers */

    public function validateData(array $data): array
    {
        /* Mantenemos validación simple */
        return ['valid' => true, 'errors' => []];
    }

    private function encodeData(mixed $data, bool $cifrarDatos = true): string
    {
        $json = wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        /* Cifrar si está habilitado y se solicita */
        if ($cifrarDatos && $this->cifradoHabilitado && $this->cifradoService !== null) {
            try {
                return $this->cifradoService->cifrar($json);
            } catch (\Exception $e) {
                error_log('[DashboardRepo] Error cifrando: ' . $e->getMessage());
            }
        }

        return $json;
    }

    private function decodeData(mixed $data, mixed $default): mixed
    {
        if (empty($data)) return $default;
        if (is_array($data)) return $data;

        $dataString = (string) $data;

        /* Descifrar si está cifrado */
        if ($this->cifradoService !== null && $this->cifradoService->estaCifrado($dataString)) {
            try {
                $dataString = $this->cifradoService->descifrar($dataString);
            } catch (\Exception $e) {
                error_log('[DashboardRepo] Error descifrando: ' . $e->getMessage());
                return $default;
            }
        }

        $decoded = json_decode($dataString, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $default;
    }

    /**
     * Verifica si el cifrado está activo para este usuario
     */
    public function esCifradoActivo(): bool
    {
        return $this->cifradoHabilitado;
    }

    public function deleteAll(): bool
    {
        global $wpdb;
        $wpdb->delete(Schema::getTableName('habitos'), ['user_id' => $this->userId]);
        $wpdb->delete(Schema::getTableName('tareas'), ['user_id' => $this->userId]);
        $wpdb->delete(Schema::getTableName('proyectos'), ['user_id' => $this->userId]);

        delete_user_meta($this->userId, self::META_NOTAS);
        delete_user_meta($this->userId, self::META_CONFIG);
        delete_user_meta($this->userId, self::META_SYNC);
        delete_user_meta($this->userId, self::META_CHANGELOG);
        return true;
    }
}
