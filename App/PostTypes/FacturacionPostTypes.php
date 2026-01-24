<?php

namespace App\PostTypes;

class FacturacionPostTypes
{
    public static function init()
    {
        add_action('init', [self::class, 'registrarPostTypes']);
    }

    public static function registrarPostTypes()
    {
        self::registrarServicioPublicado();
        self::registrarTrabajo();
        self::registrarFactura();
        self::registrarHosting();
    }

    private static function registrarServicioPublicado()
    {
        $labels = [
            'name'                  => 'Servicios Publicados',
            'singular_name'         => 'Servicio Publicado',
            'menu_name'             => 'Servicios (Catál.)',
            'name_admin_bar'        => 'Servicio',
            'add_new'               => 'Añadir Nuevo',
            'add_new_item'          => 'Añadir Nuevo Servicio',
            'new_item'              => 'Nuevo Servicio',
            'edit_item'             => 'Editar Servicio',
            'view_item'             => 'Ver Servicio',
            'all_items'             => 'Todos los Servicios',
            'search_items'          => 'Buscar Servicios',
            'not_found'             => 'No encontrado',
            'not_found_in_trash'    => 'No encontrado en Papelera',
        ];

        register_post_type('glory_servicio', [
            'labels'             => $labels,
            'public'             => true, // Accesible desde API y frontend si se desea
            'publicly_queryable' => true,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => true,
            'rewrite'            => ['slug' => 'servicio'],
            'capability_type'    => 'post',
            'has_archive'        => true,
            'hierarchical'       => false,
            'menu_position'      => 20,
            'menu_icon'          => 'dashicons-cart',
            'supports'           => ['title', 'editor', 'author', 'thumbnail', 'custom-fields'],
            'show_in_rest'       => true,
        ]);
    }

    private static function registrarTrabajo()
    {
        $labels = [
            'name'                  => 'Trabajos Contratados',
            'singular_name'         => 'Trabajo',
            'menu_name'             => 'Trabajos',
            'name_admin_bar'        => 'Trabajo',
            'all_items'             => 'Todos los Trabajos',
            'add_new_item'          => 'Registrar Nuevo Trabajo',
            'edit_item'             => 'Editar Trabajo',
            'view_item'             => 'Ver Trabajo',
        ];

        register_post_type('glory_trabajo', [
            'labels'             => $labels,
            'public'             => false, // No accesible directamente por URL frontend
            'publicly_queryable' => false,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => false,
            'capability_type'    => 'post',
            'has_archive'        => false,
            'hierarchical'       => false,
            'menu_position'      => 21,
            'menu_icon'          => 'dashicons-portfolio',
            'supports'           => ['title', 'author', 'custom-fields'],
            'show_in_rest'       => true, // Necesario para API
        ]);
    }

    private static function registrarFactura()
    {
        $labels = [
            'name'                  => 'Facturas',
            'singular_name'         => 'Factura',
            'menu_name'             => 'Facturación',
            'name_admin_bar'        => 'Factura',
            'all_items'             => 'Todas las Facturas',
            'add_new_item'          => 'Crear Nueva Factura',
            'edit_item'             => 'Editar Factura',
            'view_item'             => 'Ver Factura',
        ];

        register_post_type('glory_factura', [
            'labels'             => $labels,
            'public'             => false,
            'publicly_queryable' => false,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => false,
            'capability_type'    => 'post',
            'has_archive'        => false,
            'hierarchical'       => false,
            'menu_position'      => 22,
            'menu_icon'          => 'dashicons-media-spreadsheet',
            'supports'           => ['title', 'author', 'custom-fields'],
            'show_in_rest'       => true,
        ]);
    }

    private static function registrarHosting()
    {
        $labels = [
            'name'                  => 'Hostings',
            'singular_name'         => 'Hosting',
            'menu_name'             => 'Hostings',
            'name_admin_bar'        => 'Hosting',
            'all_items'             => 'Todos los Hostings',
            'add_new_item'          => 'Registrar Hosting',
            'edit_item'             => 'Editar Hosting',
            'view_item'             => 'Ver Hosting',
        ];

        register_post_type('glory_hosting', [
            'labels'             => $labels,
            'public'             => false,
            'publicly_queryable' => false,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => false,
            'capability_type'    => 'post',
            'has_archive'        => false,
            'hierarchical'       => false,
            'menu_position'      => 23,
            'menu_icon'          => 'dashicons-cloud',
            'supports'           => ['title', 'author', 'custom-fields'],
            'show_in_rest'       => true,
        ]);
    }
}

FacturacionPostTypes::init();
