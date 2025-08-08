# Glory Template

## Componentes agnósticos añadidos

- `Glory/src/Components/BarraFiltrosRenderer.php`
  - Barra de filtros genérica y reutilizable.
  - Soporta campos: `search`, `text`, `date`, `select`.
  - Opciones: `container_class`, `form_class`, `layout_row_class`, `actions_class`, `submit_text`, `clear_text`, `limpiar_url`, `preservar_keys`.
  - Ejemplo de uso:
    ```php
    use Glory\Components\BarraFiltrosRenderer;
    BarraFiltrosRenderer::render([
        ['tipo' => 'search', 'name' => 's', 'label' => 'Cliente', 'placeholder' => 'Buscar…'],
        ['tipo' => 'date', 'name' => 'fecha_desde', 'label' => 'Desde'],
        ['tipo' => 'date', 'name' => 'fecha_hasta', 'label' => 'Hasta'],
        ['tipo' => 'select', 'name' => 'filtro_servicio', 'label' => 'Servicio', 'opciones' => ['' => 'Todos']],
        ['tipo' => 'select', 'name' => 'filtro_barbero', 'label' => 'Barbero', 'opciones' => ['' => 'Todos']],
    ], [
        'preservar_keys' => ['orderby', 'order'],
    ]);
    ```

Nota: Glory debe permanecer 100% agnóstico. Coloque la lógica o configuraciones específicas del proyecto en el tema y no dentro de `Glory`.