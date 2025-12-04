# Guía de Desarrollo con Glory Framework

Bienvenido a **Glory**, un framework moderno para WordPress diseñado para facilitar la creación de aplicaciones web funcionales y escalables.

Esta guía te ayudará a entender cómo empezar a rutear, crear vistas y gestionar tus assets.

## 🚀 Primeros Pasos

La estructura del proyecto está organizada para separar la configuración, la lógica y la presentación.

- **`App/Config/`**: Configuraciones de rutas, assets y features.
- **`App/Templates/`**: Vistas y plantillas de tus páginas.
- **`App/Assets/`**: Archivos CSS y JS.

---

## 1. Routing (Definir Rutas)

Para crear una nueva página (ruta), debes registrarla en el `PageManager`.

1. Abre el archivo: `App/Config/pages.php`.
2. Usa el método `PageManager::define()` para registrar tu ruta.

```php
use Glory\Manager\PageManager;

// Define una ruta simple
// URL: /mi-pagina
// Función que renderiza: mi_pagina_render
PageManager::define('mi-pagina', 'mi_pagina_render');
```

También puedes apuntar a un método de un controlador (Clase):

```php
PageManager::define('mi-pagina', 'App\Controllers\MiControlador::render');
```

---

## 2. Crear Vistas (Templates)

Una vez definida la ruta, necesitas crear la función o el archivo que renderizará el contenido.

1. Ve a la carpeta: `App/Templates/pages/`.
2. Crea un archivo PHP con el nombre de tu página (ej. `mi-pagina.php`).
3. Dentro del archivo, define la función que registraste en el paso anterior.

**Ejemplo: `App/Templates/pages/mi-pagina.php`**

```php
<?php

function mi_pagina_render() {
    ?>
    <div class="mi-contenedor">
        <h1>¡Hola Mundo desde Glory!</h1>
        <p>Esta es mi primera página funcional.</p>
        
        <button id="mi-boton" class="btn-primary">Haz click aquí</button>
    </div>
    <?php
}
```

> **Nota:** El framework se encarga automáticamente de incluir el `header` y `footer` de WordPress, así como de envolver tu contenido en el contenedor principal.

---

## 3. Assets (CSS y JS)

Glory carga automáticamente los estilos y scripts que coloques en las carpetas correspondientes.

### CSS
Coloca tus archivos `.css` en: `App/Assets/css/`.
Se cargarán automáticamente en todas las páginas (a menos que configures lo contrario en `App/Config/assets.php`).

### JavaScript
Coloca tus archivos `.js` en: `App/Assets/js/`.
Se cargarán automáticamente en el footer.

**Ejemplo:**
Crea `App/Assets/js/mi-script.js`:

```javascript
jQuery(document).ready(function($) {
    $('#mi-boton').on('click', function() {
        alert('¡Click detectado!');
    });
});
```

---

## 4. Uso de Componentes

Glory incluye varios componentes pre-construidos (Modales, Pestañas, Formularios, etc.). Puedes ver ejemplos de uso en `App/Templates/pages/home.php`.

Ejemplo de uso de un **BadgeList**:

```php
use Glory\Components\BadgeList;

echo BadgeList::render([
    'badges' => ['Opción 1', 'Opción 2', 'Opción 3'],
    'mode'   => 'tab' // o 'filter'
]);
```

---

## Resumen del Flujo de Trabajo

1. **Ruta**: `App/Config/pages.php` -> `PageManager::define('slug', 'funcion');`
2. **Vista**: `App/Templates/pages/slug.php` -> `function funcion() { HTML }`
3. **Estilos**: `App/Assets/css/estilos.css`
4. **Lógica JS**: `App/Assets/js/logica.js`

¡Ahora estás listo para empezar a construir!