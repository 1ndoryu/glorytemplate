<?php

/**
 * Servicio de Compartición
 *
 * Gestiona la lógica para compartir tareas, proyectos y hábitos:
 * - Compartir elementos con compañeros de equipo
 * - Gestionar permisos y roles
 * - Listar elementos compartidos
 *
 * @package App\Services
 */

namespace App\Services;

use App\Database\Schema;

class CompartirService
{
    private string $tablaCompartidos;
    private string $tablaEquipos;
    private string $tablaTareas;
    private string $tablaProyectos;
    private string $tablaHabitos;

    public function __construct()
    {
        $this->tablaCompartidos = Schema::getTableName('compartidos');
        $this->tablaEquipos = Schema::getTableName('equipos');
        $this->tablaTareas = Schema::getTableName('tareas');
        $this->tablaProyectos = Schema::getTableName('proyectos');
        $this->tablaHabitos = Schema::getTableName('habitos');
    }

    /**
     * Comparte un elemento con un compañero
     *
     * @param int $usuarioId ID del propietario/usuario que comparte
     * @param string $tipo Tipo de elemento (tarea, proyecto, habito)
     * @param int $elementoId ID del elemento (primary key de la tabla correspondiente)
     * @param int $companeroId ID del usuario con quien se comparte
     * @param string $rol Rol del compañero (colaborador, observador)
     * @return array Resultado de la operación
     */
    public function compartirElemento(int $usuarioId, string $tipo, int $elementoId, int $companeroId, string $rol = 'colaborador'): array
    {
        global $wpdb;

        // 1. Validar que son compañeros de equipo
        $esEquipo = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->tablaEquipos} 
                WHERE ((usuario_id = %d AND companero_id = %d) OR (usuario_id = %d AND companero_id = %d))
                AND estado = 'aceptada'",
                $usuarioId,
                $companeroId,
                $companeroId,
                $usuarioId
            )
        );

        if (!$esEquipo) {
            return [
                'exito' => false,
                'mensaje' => 'Solo puedes compartir con miembros de tu equipo',
                'codigo' => 'no_es_equipo'
            ];
        }

        // 2. Validar propiedad del elemento
        if (!$this->esPropietario($usuarioId, $tipo, $elementoId)) {
            return [
                'exito' => false,
                'mensaje' => 'No tienes permiso para compartir este elemento',
                'codigo' => 'sin_permiso'
            ];
        }

        // 3. Verificar si ya está compartido con este usuario
        $yaCompartido = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tablaCompartidos}
                WHERE tipo = %s AND elemento_id = %d AND usuario_id = %d",
                $tipo,
                $elementoId,
                $companeroId
            )
        );

        if ($yaCompartido) {
            // Si ya existe, actualizamos el rol
            $wpdb->update(
                $this->tablaCompartidos,
                ['rol' => $rol],
                ['id' => $yaCompartido->id]
            );

            return [
                'exito' => true,
                'mensaje' => 'Permisos actualizados correctamente',
                'accion' => 'actualizado'
            ];
        }

        // 4. Insertar nuevo registro
        $wpdb->insert($this->tablaCompartidos, [
            'tipo' => $tipo,
            'elemento_id' => $elementoId,
            'usuario_id' => $companeroId,
            'rol' => $rol,
            'fecha' => current_time('mysql')
        ]);

        return [
            'exito' => true,
            'mensaje' => 'Elemento compartido correctamente',
            'accion' => 'compartido',
            'id' => $wpdb->insert_id
        ];
    }

    /**
     * Deja de compartir un elemento (elimina el acceso)
     *
     * @param int $usuarioId ID del usuario que solicita la acción (propietario o colaborador)
     * @param int $compartidoId ID del registro en la tabla compartidos
     * @return array Resultado
     */
    public function dejarDeCompartir(int $usuarioId, int $compartidoId): array
    {
        global $wpdb;

        $registro = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tablaCompartidos} WHERE id = %d",
                $compartidoId
            )
        );

        if (!$registro) {
            return [
                'exito' => false,
                'mensaje' => 'Registro no encontrado',
                'codigo' => 'no_encontrado'
            ];
        }

        // Verificar permisos: puede eliminar si es el propietario del elemento O el usuario con quien se compartió
        $esReceptor = (int)$registro->usuario_id === $usuarioId;
        $esPropietario = $this->esPropietario($usuarioId, $registro->tipo, $registro->elemento_id);

        if (!$esReceptor && !$esPropietario) {
            return [
                'exito' => false,
                'mensaje' => 'No tienes permiso para realizar esta acción',
                'codigo' => 'sin_permiso'
            ];
        }

        $wpdb->delete($this->tablaCompartidos, ['id' => $compartidoId]);

        return [
            'exito' => true,
            'mensaje' => 'Se ha dejado de compartir el elemento'
        ];
    }

    /**
     * Obtiene los participantes de un elemento
     */
    public function obtenerParticipantes(int $usuarioId, string $tipo, int $elementoId): array
    {
        global $wpdb;

        // Verificar acceso (propietario o colaborador)
        if (!$this->tieneAcceso($usuarioId, $tipo, $elementoId)) {
            return [];
        }

        // Obtener colaboradores
        $compartidos = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT c.*, u.display_name, u.user_email 
                FROM {$this->tablaCompartidos} c
                JOIN {$wpdb->users} u ON c.usuario_id = u.ID
                WHERE c.tipo = %s AND c.elemento_id = %d",
                $tipo,
                $elementoId
            )
        );

        $participantes = array_map(function ($fila) {
            return [
                'id' => (int)$fila->id, // ID del registro compartido
                'usuarioId' => (int)$fila->usuario_id,
                'nombre' => $fila->display_name,
                'email' => $fila->user_email,
                'avatar' => get_avatar_url($fila->usuario_id, ['size' => 48]),
                'rol' => $fila->rol,
                'fecha' => $fila->fecha,
                'esPropietario' => false
            ];
        }, $compartidos);

        // Agregar al propietario
        $propietarioId = $this->obtenerPropietarioId($tipo, $elementoId);
        if ($propietarioId) {
            $propietario = get_user_by('ID', $propietarioId);
            if ($propietario) {
                array_unshift($participantes, [
                    'id' => 0,
                    'usuarioId' => (int)$propietario->ID,
                    'nombre' => $propietario->display_name,
                    'email' => $propietario->user_email,
                    'avatar' => get_avatar_url($propietario->ID, ['size' => 48]),
                    'rol' => 'propietario',
                    'fecha' => null,
                    'esPropietario' => true
                ]);
            }
        }

        return $participantes;
    }

    /**
     * Verifica si un usuario es propietario del elemento
     */
    public function esPropietario(int $usuarioId, string $tipo, int $elementoId): bool
    {
        global $wpdb;
        $tabla = $this->obtenerTablaPorTipo($tipo);

        if (!$tabla) return false;

        $propietarioId = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT user_id FROM {$tabla} WHERE id = %d",
                $elementoId
            )
        );

        return (int)$propietarioId === $usuarioId;
    }

    /**
     * Verifica si un usuario tiene acceso al elemento (propietario o compartido)
     */
    public function tieneAcceso(int $usuarioId, string $tipo, int $elementoId): bool
    {
        if ($this->esPropietario($usuarioId, $tipo, $elementoId)) {
            return true;
        }

        global $wpdb;
        $acceso = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->tablaCompartidos}
                WHERE tipo = %s AND elemento_id = %d AND usuario_id = %d",
                $tipo,
                $elementoId,
                $usuarioId
            )
        );

        return (int)$acceso > 0;
    }

    private function obtenerPropietarioId(string $tipo, int $elementoId): ?int
    {
        global $wpdb;
        $tabla = $this->obtenerTablaPorTipo($tipo);
        if (!$tabla) return null;

        return (int)$wpdb->get_var(
            $wpdb->prepare("SELECT user_id FROM {$tabla} WHERE id = %d", $elementoId)
        );
    }

    private function obtenerTablaPorTipo(string $tipo): ?string
    {
        return match ($tipo) {
            'tarea' => $this->tablaTareas,
            'proyecto' => $this->tablaProyectos,
            'habito' => $this->tablaHabitos,
            default => null
        };
    }

    /**
     * Obtiene los elementos de un tipo específico compartidos con el usuario
     * Retorna los datos completos de los elementos
     */
    public function obtenerDatosCompartidos(int $usuarioId, string $tipo): array
    {
        global $wpdb;
        $tablaDatos = $this->obtenerTablaPorTipo($tipo);

        if (!$tablaDatos) return [];

        $items = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT t.*, c.rol, c.id as compartido_id, u.display_name as propietario_nombre
                FROM {$tablaDatos} t
                JOIN {$this->tablaCompartidos} c ON c.elemento_id = t.id
                JOIN {$wpdb->users} u ON t.user_id = u.ID
                WHERE c.tipo = %s AND c.usuario_id = %d AND t.deleted_at IS NULL",
                $tipo,
                $usuarioId
            ),
            ARRAY_A
        );

        return array_map(function ($item) {
            /* Decodificar JSON data */
            $data = json_decode($item['data'], true);
            if (!is_array($data)) $data = [];

            /* Asegurar ID correcto (id_local) con offset para evitar colision */
            if (isset($item['id_local'])) {
                $data['id'] = (int)$item['id_local'] + 5000000;
            }

            /* Inyectar metadatos de participación para el frontend */
            $data['_compartido'] = true;
            $data['_rol'] = $item['rol'];
            $data['_propietario'] = $item['propietario_nombre'];
            $data['_compartido_id'] = (int)$item['compartido_id'];
            $data['_elemento_id'] = (int)$item['id']; // ID real en BD (necesario para API)

            return $data;
        }, $items);
    }

    /**
     * Obtiene los elementos de un tipo específico compartidos con el usuario
     * Retorna los IDs de los elementos
     */
    public function obtenerIdsCompartidosConmigo(int $usuarioId, string $tipo): array
    {
        global $wpdb;

        $results = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT elemento_id FROM {$this->tablaCompartidos}
                WHERE tipo = %s AND usuario_id = %d",
                $tipo,
                $usuarioId
            )
        );

        return array_map('intval', $results);
    }
}
