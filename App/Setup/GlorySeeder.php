<?php

namespace App\Setup;

use WP_Query;

class GlorySeeder
{
    public static function seed()
    {
        error_log('Iniciando Seeder Glory...');

        $userId = self::crearUsuarioGuillermo();
        $adminId = 1; // Asumimos ID 1 es admin

        if (!$userId) {
            error_log('Error creando usuario Guillermo');
            return;
        }

        // 1. Servicios Publicados (Catálogo)
        $servicioId = self::crearServicioDiseño($adminId);

        // 2. Hostings
        self::crearHostings($userId);

        // 3. Dominios
        self::crearDominios($userId);

        // 4. Trabajo (Servicio Contratado)
        self::crearTrabajo($userId, $servicioId, $adminId);

        // 5. Factura
        self::crearFactura($userId);

        error_log('Seeder completado con éxito.');

        return "Seeding completado. Usuario ID: $userId";
    }

    private static function creatingOrGettingUser($username, $email, $password)
    {
        $user = get_user_by('login', $username);
        if ($user) {
            return $user->ID;
        }

        $userId = wp_create_user($username, $password, $email);
        if (is_wp_error($userId)) {
            error_log('Error creando usuario: ' . $userId->get_error_message());
            return null;
        }

        $user = get_user_by('id', $userId);
        // set role to subscriber or customer if exists
        $user->set_role('subscriber');

        wp_update_user([
            'ID' => $userId,
            'display_name' => 'Guillermo (Cliente)'
        ]);

        return $userId;
    }

    private static function crearUsuarioGuillermo()
    {
        return self::creatingOrGettingUser('guillermo', 'guillermo@example.com', 'password');
    }

    private static function crearServicioDiseño($authorId)
    {
        $existe = get_page_by_title('Diseño Web Profesional', OBJECT, 'glory_servicio');
        if ($existe) return $existe->ID;

        $id = wp_insert_post([
            'post_title' => 'Diseño Web Profesional',
            'post_content' => 'Servicio completo de diseño y desarrollo web.',
            'post_status' => 'publish',
            'post_type' => 'glory_servicio',
            'post_author' => $authorId
        ]);

        update_post_meta($id, '_precio', 270);
        update_post_meta($id, '_tiempo_entrega_dias', 30);
        update_post_meta($id, '_categoria', 'diseno_web');
        update_post_meta($id, '_incluye_hosting_meses', 12);
        update_post_meta($id, '_incluye_dominio', true);
        update_post_meta($id, '_activo', true);

        return $id;
    }

    private static function crearHostings($userId)
    {
        $hostings = [
            [
                'domain' => 'guillechatbots.es',
                'precio' => 3,
                'pagado' => false
            ],
            [
                'domain' => 'materialdepadel.es',
                'precio' => 3,
                'pagado' => false
            ],
            [
                'domain' => 'cap.wandori.us',
                'precio' => 3,
                'pagado' => false
            ]
        ];

        foreach ($hostings as $h) {
            $existe = new WP_Query([
                'post_type' => 'glory_hosting',
                'title' => $h['domain'],
                'author' => $userId
            ]);

            if ($existe->have_posts()) continue;

            $id = wp_insert_post([
                'post_title' => $h['domain'],
                'post_status' => 'publish',
                'post_type' => 'glory_hosting',
                'post_author' => $userId
            ]);

            update_post_meta($id, '_dominio', $h['domain']);
            update_post_meta($id, '_plan', 'mensual');
            update_post_meta($id, '_precio_mensual', $h['precio']);
            update_post_meta($id, '_fecha_inicio', '2026-01-01');
            update_post_meta($id, '_fecha_renovacion', '2026-02-01');
            update_post_meta($id, '_estado', 'activo');
            update_post_meta($id, '_pagado', $h['pagado']);
        }
    }

    private static function crearDominios($userId)
    {
        $dominios = [
            [
                'domain' => 'guillechatbots.es',
                'precio' => 11,
                'pagado' => false
            ],
            [
                'domain' => 'materialdepadel.es',
                'precio' => 11,
                'pagado' => false
            ]
        ];

        foreach ($dominios as $d) {
            $existe = new WP_Query([
                'post_type' => 'glory_dominio',
                'title' => $d['domain'],
                'author' => $userId
            ]);

            if ($existe->have_posts()) continue;

            $id = wp_insert_post([
                'post_title' => $d['domain'],
                'post_status' => 'publish',
                'post_type' => 'glory_dominio',
                'post_author' => $userId
            ]);

            update_post_meta($id, '_dominio', $d['domain']);
            update_post_meta($id, '_precio_anual', $d['precio']);
            update_post_meta($id, '_fecha_registro', '2026-01-01');
            update_post_meta($id, '_fecha_expiracion', '2027-01-01');
            update_post_meta($id, '_estado', 'activo');
            update_post_meta($id, '_pagado', $d['pagado']);
            update_post_meta($id, '_autorenovar', true);
        }
    }

    private static function crearTrabajo($userId, $servicioId, $proveedorId)
    {
        $existe = new WP_Query([
            'post_type' => 'glory_trabajo',
            'title' => 'Diseño Web - CAP',
            'author' => $userId
        ]);

        if ($existe->have_posts()) return;

        $id = wp_insert_post([
            'post_title' => 'Diseño Web - CAP',
            'post_status' => 'publish',
            'post_type' => 'glory_trabajo',
            'post_author' => $userId
        ]);

        update_post_meta($id, '_servicio_publicado_id', $servicioId);
        update_post_meta($id, '_proveedor_id', $proveedorId);
        update_post_meta($id, '_estado', 'en_progreso');
        update_post_meta($id, '_progreso_porcentaje', 65);
        update_post_meta($id, '_fecha_contratacion', '2026-01-01');
        update_post_meta($id, '_fecha_entrega_estimada', '2026-01-31');
        update_post_meta($id, '_precio_acordado', 270);
        update_post_meta($id, '_revisiones_restantes', 2);
    }

    private static function crearFactura($userId)
    {
        $existe = new WP_Query([
            'post_type' => 'glory_factura',
            'title' => 'INV-2026-001',
            'author' => $userId
        ]);

        if ($existe->have_posts()) return;

        $id = wp_insert_post([
            'post_title' => 'INV-2026-001',
            'post_status' => 'publish',
            'post_type' => 'glory_factura',
            'post_author' => $userId
        ]);

        // Items de la factura
        $items = [
            [
                'concepto' => 'Renovación Hosting guillechatbots.es',
                'cantidad' => 1,
                'precioUnitario' => 3,
                'total' => 3,
                'productoRef' => ['tipo' => 'hosting', 'id_ref' => 'buscar_dinamicamente']
            ],
            [
                'concepto' => 'Renovación Hosting materialdepadel.es',
                'cantidad' => 1,
                'precioUnitario' => 3,
                'total' => 3
            ],
            [
                'concepto' => 'Renovación Hosting cap.wandori.us',
                'cantidad' => 1,
                'precioUnitario' => 3,
                'total' => 3
            ],
            [
                'concepto' => 'Renovación Dominio guillechatbots.es',
                'cantidad' => 1,
                'precioUnitario' => 11,
                'total' => 11
            ],
            [
                'concepto' => 'Renovación Dominio materialdepadel.es',
                'cantidad' => 1,
                'precioUnitario' => 11,
                'total' => 11
            ]
        ];

        // Total = 3*3 + 2*11 = 9 + 22 = 31

        update_post_meta($id, '_items', json_encode($items));
        update_post_meta($id, '_subtotal', 31.00);
        update_post_meta($id, '_impuestos', 0);
        update_post_meta($id, '_total', 31.00);
        update_post_meta($id, '_estado', 'pendiente');
        update_post_meta($id, '_fecha_vencimiento', '2026-02-15');
    }
}
