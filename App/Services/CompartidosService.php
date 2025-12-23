<?php

/**
 * Servicio de Compartidos
 *
 * Gestiona la lógica para compartir tareas, proyectos y hábitos:
 * - Compartir elementos con miembros del equipo
 * - Gestionar roles (propietario, colaborador, observador)
 * - Obtener elementos compartidos conmigo
 * - Validar permisos de acceso
 *
 * @package App\Services
 */

namespace App\Services;

use App\Database\Schema;

class CompartidosService
{
    private $wpdb;
    private $tabla;
    private $tablaEquipos;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->tabla = Schema::getTableName('compartidos');
        $this->tablaEquipos = Schema::getTableName('equipos');
    }

    /**
     * Comparte un elemento con otro usuario
     *
     * @param int $propietarioId ID del propietario del elemento
     * @param string $tipo Tipo de elemento: 'tarea', 'proyecto', 'habito'
     * @param int $elementoId ID local del elemento
     * @param int $usuarioDestinoId ID del usuario con quien compartir
     * @param string $rol Rol asignado: 'colaborador' o 'observador'
     * @return array Resultado de la operación
     */
    public function compartir(
        int $propietarioId,
        string $tipo,
        int $elementoId,
        int $usuarioDestinoId,
        string $rol = 'colaborador'
    ): array {
        /* Validar tipo */
        if (!in_array($tipo, ['tarea', 'proyecto', 'habito'])) {
            return [
                'exito' => false,
                'error' => 'Tipo de elemento no válido'
            ];
        }

        /* Validar rol */
        if (!in_array($rol, ['colaborador', 'observador'])) {
            return [
                'exito' => false,
                'error' => 'Rol no válido'
            ];
        }

        /* No puede compartir consigo mismo */
        if ($propietarioId === $usuarioDestinoId) {
            return [
                'exito' => false,
                'error' => 'No puedes compartir contigo mismo'
            ];
        }

        /* Verificar que son compañeros de equipo */
        if (!$this->sonCompaneros($propietarioId, $usuarioDestinoId)) {
            return [
                'exito' => false,
                'error' => 'Solo puedes compartir con miembros de tu equipo'
            ];
        }

        /* Verificar que no esté ya compartido con este usuario */
        $existente = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT id FROM {$this->tabla}
             WHERE tipo = %s AND elemento_id = %d AND propietario_id = %d AND usuario_id = %d",
            $tipo,
            $elementoId,
            $propietarioId,
            $usuarioDestinoId
        ));

        if ($existente) {
            return [
                'exito' => false,
                'error' => 'Este elemento ya está compartido con este usuario'
            ];
        }

        /* Insertar registro de compartido */
        $resultado = $this->wpdb->insert(
            $this->tabla,
            [
                'tipo' => $tipo,
                'elemento_id' => $elementoId,
                'propietario_id' => $propietarioId,
                'usuario_id' => $usuarioDestinoId,
                'rol' => $rol,
                'fecha_compartido' => current_time('mysql')
            ],
            ['%s', '%d', '%d', '%d', '%s', '%s']
        );

        if ($resultado === false) {
            return [
                'exito' => false,
                'error' => 'Error al compartir el elemento'
            ];
        }

        $compartidoId = $this->wpdb->insert_id;

        /* Crear notificación para el destinatario */
        $this->notificarCompartido($propietarioId, $usuarioDestinoId, $tipo, $elementoId);

        return [
            'exito' => true,
            'compartido' => $this->formatearCompartido(
                $compartidoId,
                $tipo,
                $elementoId,
                $propietarioId,
                $usuarioDestinoId,
                $rol
            )
        ];
    }

    /**
     * Actualiza el rol de un usuario en un elemento compartido
     *
     * @param int $compartidoId ID del registro de compartido
     * @param int $propietarioId ID del propietario (para verificar permisos)
     * @param string $nuevoRol Nuevo rol: 'colaborador' o 'observador'
     * @return array Resultado de la operación
     */
    public function actualizarRol(int $compartidoId, int $propietarioId, string $nuevoRol): array
    {
        if (!in_array($nuevoRol, ['colaborador', 'observador'])) {
            return [
                'exito' => false,
                'error' => 'Rol no válido'
            ];
        }

        /* Verificar que el usuario es el propietario */
        $compartido = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->tabla} WHERE id = %d AND propietario_id = %d",
            $compartidoId,
            $propietarioId
        ));

        if (!$compartido) {
            return [
                'exito' => false,
                'error' => 'No tienes permisos para modificar este compartido'
            ];
        }

        $this->wpdb->update(
            $this->tabla,
            ['rol' => $nuevoRol],
            ['id' => $compartidoId],
            ['%s'],
            ['%d']
        );

        return ['exito' => true];
    }

    /**
     * Deja de compartir un elemento con un usuario
     *
     * @param int $compartidoId ID del registro de compartido
     * @param int $usuarioId ID del usuario que quita el compartido (propietario o destinatario)
     * @return array Resultado de la operación
     */
    public function dejarDeCompartir(int $compartidoId, int $usuarioId): array
    {
        /* El propietario puede quitar a cualquiera, el destinatario puede salirse */
        $compartido = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->tabla}
             WHERE id = %d AND (propietario_id = %d OR usuario_id = %d)",
            $compartidoId,
            $usuarioId,
            $usuarioId
        ));

        if (!$compartido) {
            return [
                'exito' => false,
                'error' => 'No tienes permisos para eliminar este compartido'
            ];
        }

        $this->wpdb->delete(
            $this->tabla,
            ['id' => $compartidoId],
            ['%d']
        );

        return ['exito' => true];
    }

    /**
     * Obtiene todos los elementos compartidos conmigo
     *
     * @param int $usuarioId ID del usuario
     * @param string|null $tipo Filtrar por tipo (opcional)
     * @return array Lista de elementos compartidos
     */
    public function obtenerCompartidosConmigo(int $usuarioId, ?string $tipo = null): array
    {
        $sql = "SELECT c.*, u.display_name as propietario_nombre, u.user_email as propietario_email
                FROM {$this->tabla} c
                JOIN {$this->wpdb->users} u ON c.propietario_id = u.ID
                WHERE c.usuario_id = %d";

        $params = [$usuarioId];

        if ($tipo !== null) {
            $sql .= " AND c.tipo = %s";
            $params[] = $tipo;
        }

        $sql .= " ORDER BY c.fecha_compartido DESC";

        $compartidos = $this->wpdb->get_results(
            $this->wpdb->prepare($sql, ...$params)
        );

        return array_map(function ($c) {
            return [
                'id' => (int) $c->id,
                'tipo' => $c->tipo,
                'elementoId' => (int) $c->elemento_id,
                'propietarioId' => (int) $c->propietario_id,
                'propietarioNombre' => $c->propietario_nombre,
                'propietarioEmail' => $c->propietario_email,
                'propietarioAvatar' => get_avatar_url($c->propietario_id, ['size' => 32]),
                'rol' => $c->rol,
                'fechaCompartido' => $c->fecha_compartido
            ];
        }, $compartidos);
    }

    /**
     * Obtiene todos los elementos que yo he compartido
     *
     * @param int $propietarioId ID del propietario
     * @param string|null $tipo Filtrar por tipo (opcional)
     * @return array Lista de compartidos agrupados por elemento
     */
    public function obtenerMisCompartidos(int $propietarioId, ?string $tipo = null): array
    {
        $sql = "SELECT c.*, u.display_name as usuario_nombre, u.user_email as usuario_email
                FROM {$this->tabla} c
                JOIN {$this->wpdb->users} u ON c.usuario_id = u.ID
                WHERE c.propietario_id = %d";

        $params = [$propietarioId];

        if ($tipo !== null) {
            $sql .= " AND c.tipo = %s";
            $params[] = $tipo;
        }

        $sql .= " ORDER BY c.tipo, c.elemento_id, c.fecha_compartido DESC";

        $compartidos = $this->wpdb->get_results(
            $this->wpdb->prepare($sql, ...$params)
        );

        return array_map(function ($c) {
            return [
                'id' => (int) $c->id,
                'tipo' => $c->tipo,
                'elementoId' => (int) $c->elemento_id,
                'usuarioId' => (int) $c->usuario_id,
                'usuarioNombre' => $c->usuario_nombre,
                'usuarioEmail' => $c->usuario_email,
                'usuarioAvatar' => get_avatar_url($c->usuario_id, ['size' => 32]),
                'rol' => $c->rol,
                'fechaCompartido' => $c->fecha_compartido
            ];
        }, $compartidos);
    }

    /**
     * Obtiene los participantes de un elemento específico
     *
     * @param string $tipo Tipo de elemento
     * @param int $elementoId ID del elemento
     * @param int $propietarioId ID del propietario para validar acceso
     * @return array Lista de participantes con sus roles
     */
    public function obtenerParticipantes(string $tipo, int $elementoId, int $propietarioId): array
    {
        $compartidos = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT c.*, u.display_name as nombre, u.user_email as email
             FROM {$this->tabla} c
             JOIN {$this->wpdb->users} u ON c.usuario_id = u.ID
             WHERE c.tipo = %s AND c.elemento_id = %d AND c.propietario_id = %d
             ORDER BY c.fecha_compartido ASC",
            $tipo,
            $elementoId,
            $propietarioId
        ));

        /* Añadir al propietario como primer participante */
        $propietario = get_userdata($propietarioId);
        $participantes = [[
            'id' => 0, /* Sin ID de compartido, es el propietario */
            'usuarioId' => $propietarioId,
            'nombre' => $propietario->display_name,
            'email' => $propietario->user_email,
            'avatar' => get_avatar_url($propietarioId, ['size' => 32]),
            'rol' => 'propietario',
            'esPropietario' => true
        ]];

        foreach ($compartidos as $c) {
            $participantes[] = [
                'id' => (int) $c->id,
                'usuarioId' => (int) $c->usuario_id,
                'nombre' => $c->nombre,
                'email' => $c->email,
                'avatar' => get_avatar_url($c->usuario_id, ['size' => 32]),
                'rol' => $c->rol,
                'esPropietario' => false
            ];
        }

        return $participantes;
    }

    /**
     * Verifica si un usuario tiene acceso a un elemento
     *
     * @param int $usuarioId ID del usuario
     * @param string $tipo Tipo de elemento
     * @param int $elementoId ID del elemento
     * @param int $propietarioId ID del propietario original
     * @return array|false Rol del usuario o false si no tiene acceso
     */
    public function verificarAcceso(int $usuarioId, string $tipo, int $elementoId, int $propietarioId)
    {
        /* Si es el propietario, tiene acceso total */
        if ($usuarioId === $propietarioId) {
            return ['rol' => 'propietario', 'puedeEditar' => true, 'puedeEliminar' => true];
        }

        /* Buscar si está compartido con este usuario */
        $compartido = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT rol FROM {$this->tabla}
             WHERE tipo = %s AND elemento_id = %d AND propietario_id = %d AND usuario_id = %d",
            $tipo,
            $elementoId,
            $propietarioId,
            $usuarioId
        ));

        if (!$compartido) {
            return false;
        }

        return [
            'rol' => $compartido->rol,
            'puedeEditar' => $compartido->rol === 'colaborador',
            'puedeEliminar' => false /* Solo el propietario puede eliminar */
        ];
    }

    /**
     * Cuenta elementos compartidos conmigo (para badge)
     *
     * @param int $usuarioId ID del usuario
     * @return array Contadores por tipo
     */
    public function contarCompartidosConmigo(int $usuarioId): array
    {
        $resultados = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT tipo, COUNT(*) as total
             FROM {$this->tabla}
             WHERE usuario_id = %d
             GROUP BY tipo",
            $usuarioId
        ));

        $contadores = [
            'tareas' => 0,
            'proyectos' => 0,
            'habitos' => 0,
            'total' => 0
        ];

        foreach ($resultados as $r) {
            $contadores[$r->tipo . 's'] = (int) $r->total;
            $contadores['total'] += (int) $r->total;
        }

        return $contadores;
    }

    /**
     * Verifica si dos usuarios son compañeros de equipo
     */
    private function sonCompaneros(int $usuario1, int $usuario2): bool
    {
        $conexion = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->tablaEquipos}
             WHERE estado = 'aceptada'
             AND ((usuario_id = %d AND companero_id = %d) OR (usuario_id = %d AND companero_id = %d))",
            $usuario1,
            $usuario2,
            $usuario2,
            $usuario1
        ));

        return (int) $conexion > 0;
    }

    /**
     * Formatea un registro de compartido para la respuesta
     */
    private function formatearCompartido(
        int $id,
        string $tipo,
        int $elementoId,
        int $propietarioId,
        int $usuarioId,
        string $rol
    ): array {
        $usuario = get_userdata($usuarioId);

        return [
            'id' => $id,
            'tipo' => $tipo,
            'elementoId' => $elementoId,
            'usuarioId' => $usuarioId,
            'usuarioNombre' => $usuario->display_name,
            'usuarioEmail' => $usuario->user_email,
            'usuarioAvatar' => get_avatar_url($usuarioId, ['size' => 32]),
            'rol' => $rol,
            'fechaCompartido' => current_time('mysql')
        ];
    }

    /**
     * Crea una notificación cuando se comparte un elemento
     */
    private function notificarCompartido(int $propietarioId, int $destinatarioId, string $tipo, int $elementoId): void
    {
        $propietario = get_userdata($propietarioId);
        $tipoTexto = $tipo === 'tarea' ? 'una tarea' : ($tipo === 'proyecto' ? 'un proyecto' : 'un hábito');

        $notificacionesService = new NotificacionesService();
        $notificacionesService->crear(
            $destinatarioId,
            'elemento_compartido',
            "{$propietario->display_name} compartió $tipoTexto contigo",
            "Tienes acceso a un nuevo $tipo compartido",
            [
                'tipo' => $tipo,
                'elementoId' => $elementoId,
                'propietarioId' => $propietarioId,
                'propietarioNombre' => $propietario->display_name
            ]
        );
    }
}
