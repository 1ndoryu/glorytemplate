<?php

/**
 * Repositorio de Mensajes
 *
 * Maneja la persistencia de mensajes en la tabla wp_glory_mensajes.
 * Soporta mensajes de usuario (chat) y mensajes de sistema (historial).
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Database\Schema;

class MensajesRepository
{
    private int $userId;

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario invalido');
        }
        $this->userId = $userId;
    }

    /**
     * Obtiene el timeline de mensajes para un elemento
     * 
     * @param string $tipoElemento 'tarea', 'proyecto', 'habito'
     * @param int $elementoId ID del elemento
     * @param int $limite Cantidad maxima de mensajes
     * @param int $offset Offset para paginacion
     * @return array
     */
    public function obtenerTimeline(string $tipoElemento, int $elementoId, int $limite = 50, int $offset = 0): array
    {
        global $wpdb;
        $table = Schema::getTableName('mensajes');

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT m.*, u.display_name as usuario_nombre 
             FROM $table m
             LEFT JOIN {$wpdb->users} u ON m.usuario_id = u.ID
             WHERE m.tipo_elemento = %s AND m.elemento_id = %d
             ORDER BY m.fecha_creacion ASC
             LIMIT %d OFFSET %d",
            $tipoElemento,
            $elementoId,
            $limite,
            $offset
        ), 'ARRAY_A');

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'tipoElemento' => $row['tipo_elemento'],
                'elementoId' => (int)$row['elemento_id'],
                'usuarioId' => (int)$row['usuario_id'],
                'usuarioNombre' => $row['usuario_nombre'] ?? 'Sistema',
                'tipoMensaje' => $row['tipo_mensaje'],
                'contenido' => $row['contenido'],
                'accionSistema' => $row['accion_sistema'],
                'datosExtra' => $row['datos_extra'] ? json_decode($row['datos_extra'], true) : null,
                'fechaCreacion' => $row['fecha_creacion'],
                'esPropio' => (int)$row['usuario_id'] === $this->userId
            ];
        }, $rows ?: []);
    }

    /**
     * Cuenta mensajes de un elemento
     */
    public function contarMensajes(string $tipoElemento, int $elementoId): int
    {
        global $wpdb;
        $table = Schema::getTableName('mensajes');

        return (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE tipo_elemento = %s AND elemento_id = %d",
            $tipoElemento,
            $elementoId
        ));
    }

    /**
     * Envia un mensaje de usuario (chat)
     */
    public function enviarMensaje(string $tipoElemento, int $elementoId, string $contenido): ?array
    {
        global $wpdb;
        $table = Schema::getTableName('mensajes');

        $resultado = $wpdb->insert(
            $table,
            [
                'tipo_elemento' => $tipoElemento,
                'elemento_id' => $elementoId,
                'usuario_id' => $this->userId,
                'tipo_mensaje' => 'usuario',
                'contenido' => sanitize_textarea_field($contenido),
                'fecha_creacion' => current_time('mysql')
            ],
            ['%s', '%d', '%d', '%s', '%s', '%s']
        );

        if (!$resultado) {
            return null;
        }

        $nuevoId = $wpdb->insert_id;
        $usuario = get_userdata($this->userId);

        return [
            'id' => $nuevoId,
            'tipoElemento' => $tipoElemento,
            'elementoId' => $elementoId,
            'usuarioId' => $this->userId,
            'usuarioNombre' => $usuario ? $usuario->display_name : 'Usuario',
            'tipoMensaje' => 'usuario',
            'contenido' => $contenido,
            'accionSistema' => null,
            'datosExtra' => null,
            'fechaCreacion' => current_time('mysql'),
            'esPropio' => true
        ];
    }

    /**
     * Registra un mensaje de sistema (historial de cambios)
     * Este metodo se usa internamente cuando hay cambios en elementos
     * 
     * @param string $tipoElemento 'tarea', 'proyecto', 'habito'
     * @param int $elementoId ID del elemento
     * @param int $usuarioId ID del usuario que realizo la accion
     * @param string $accion Tipo de accion (creado, editado, completado, etc)
     * @param string $contenido Descripcion del cambio
     * @param array|null $datosExtra Datos adicionales del cambio
     */
    public static function registrarEvento(
        string $tipoElemento,
        int $elementoId,
        int $usuarioId,
        string $accion,
        string $contenido,
        ?array $datosExtra = null
    ): bool {
        global $wpdb;
        $table = Schema::getTableName('mensajes');

        $resultado = $wpdb->insert(
            $table,
            [
                'tipo_elemento' => $tipoElemento,
                'elemento_id' => $elementoId,
                'usuario_id' => $usuarioId,
                'tipo_mensaje' => 'sistema',
                'contenido' => $contenido,
                'accion_sistema' => $accion,
                'datos_extra' => $datosExtra ? wp_json_encode($datosExtra) : null,
                'fecha_creacion' => current_time('mysql')
            ],
            ['%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s']
        );

        return (bool)$resultado;
    }

    /**
     * Elimina todos los mensajes de un elemento (cuando se elimina el elemento)
     */
    public static function eliminarMensajesDeElemento(string $tipoElemento, int $elementoId): bool
    {
        global $wpdb;
        $table = Schema::getTableName('mensajes');

        $wpdb->delete(
            $table,
            [
                'tipo_elemento' => $tipoElemento,
                'elemento_id' => $elementoId
            ],
            ['%s', '%d']
        );

        return true;
    }

    /**
     * Marca los mensajes de un elemento como leídos para el usuario actual
     * Guarda el ID del último mensaje visto
     */
    public function marcarComoLeido(string $tipoElemento, int $elementoId): bool
    {
        global $wpdb;
        $tableMensajes = Schema::getTableName('mensajes');
        $tableLeidos = Schema::getTableName('mensajes_leidos');

        Schema::ensureTableExists('mensajes_leidos');

        /* Obtener el ID del último mensaje del elemento */
        $ultimoMensajeId = (int)$wpdb->get_var($wpdb->prepare(
            "SELECT MAX(id) FROM $tableMensajes WHERE tipo_elemento = %s AND elemento_id = %d",
            $tipoElemento,
            $elementoId
        ));

        if ($ultimoMensajeId <= 0) {
            return true;
        }

        /* Upsert: insertar o actualizar el registro de lectura */
        $existe = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $tableLeidos 
             WHERE usuario_id = %d AND tipo_elemento = %s AND elemento_id = %d",
            $this->userId,
            $tipoElemento,
            $elementoId
        ));

        if ($existe) {
            $wpdb->update(
                $tableLeidos,
                ['ultimo_mensaje_leido' => $ultimoMensajeId],
                ['id' => $existe],
                ['%d'],
                ['%d']
            );
        } else {
            $wpdb->insert(
                $tableLeidos,
                [
                    'usuario_id' => $this->userId,
                    'tipo_elemento' => $tipoElemento,
                    'elemento_id' => $elementoId,
                    'ultimo_mensaje_leido' => $ultimoMensajeId
                ],
                ['%d', '%s', '%d', '%d']
            );
        }

        return true;
    }

    /**
     * Cuenta los mensajes no leídos de un elemento específico
     * Excluye mensajes del propio usuario (no se cuentan como "no leídos")
     */
    public function contarNoLeidos(string $tipoElemento, int $elementoId): int
    {
        global $wpdb;
        $tableMensajes = Schema::getTableName('mensajes');
        $tableLeidos = Schema::getTableName('mensajes_leidos');

        Schema::ensureTableExists('mensajes_leidos');

        /* Obtener el último mensaje leído por este usuario */
        $ultimoLeido = (int)$wpdb->get_var($wpdb->prepare(
            "SELECT ultimo_mensaje_leido FROM $tableLeidos 
             WHERE usuario_id = %d AND tipo_elemento = %s AND elemento_id = %d",
            $this->userId,
            $tipoElemento,
            $elementoId
        ));

        /* Contar mensajes con ID mayor al último leído, excluyendo mensajes propios */
        return (int)$wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $tableMensajes 
             WHERE tipo_elemento = %s AND elemento_id = %d 
             AND id > %d AND usuario_id != %d",
            $tipoElemento,
            $elementoId,
            $ultimoLeido,
            $this->userId
        ));
    }

    /**
     * Cuenta mensajes no leídos para múltiples elementos de un tipo
     * Optimizado para evitar N+1 queries
     * 
     * @return array<int, int> Mapa elementoId => cantidadNoLeidos
     */
    public function contarNoLeidosMasivo(string $tipoElemento, array $elementoIds): array
    {
        if (empty($elementoIds)) {
            return [];
        }

        global $wpdb;
        $tableMensajes = Schema::getTableName('mensajes');
        $tableLeidos = Schema::getTableName('mensajes_leidos');

        Schema::ensureTableExists('mensajes_leidos');

        $idsPlaceholder = implode(',', array_map('intval', $elementoIds));

        /* Obtener todos los últimos leídos del usuario para estos elementos */
        $leidosRows = $wpdb->get_results($wpdb->prepare(
            "SELECT elemento_id, ultimo_mensaje_leido FROM $tableLeidos 
             WHERE usuario_id = %d AND tipo_elemento = %s AND elemento_id IN ($idsPlaceholder)",
            $this->userId,
            $tipoElemento
        ), 'ARRAY_A');

        $mapaLeidos = [];
        foreach ($leidosRows as $row) {
            $mapaLeidos[(int)$row['elemento_id']] = (int)$row['ultimo_mensaje_leido'];
        }

        /* Contar mensajes por elemento (excluyendo propios) */
        $resultado = [];
        foreach ($elementoIds as $elementoId) {
            $ultimoLeido = $mapaLeidos[$elementoId] ?? 0;

            $count = (int)$wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $tableMensajes 
                 WHERE tipo_elemento = %s AND elemento_id = %d 
                 AND id > %d AND usuario_id != %d",
                $tipoElemento,
                $elementoId,
                $ultimoLeido,
                $this->userId
            ));

            if ($count > 0) {
                $resultado[$elementoId] = $count;
            }
        }

        return $resultado;
    }
}
