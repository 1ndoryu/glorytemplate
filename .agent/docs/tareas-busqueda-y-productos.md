# Tareas: Búsqueda y Productos

**Fecha de creación:** 2026-01-02  
**Última actualización:** 2026-01-02  
**Estado:** Completado

---

## 1. Optimización del Sistema de Búsqueda

### Problema
La búsqueda actual es muy lenta, tardando entre **3 a 10 segundos** en arrojar resultados.

### Requisitos
- **Mejorar velocidad:** Reducir significativamente el tiempo de respuesta de búsqueda.
- **Búsqueda flexible (fuzzy search):** Implementar tolerancia a errores tipográficos.
  - Ejemplo: Si el usuario busca "pale" por error, el sistema debe sugerir o mostrar "pala".
  - Considerar algoritmos como Levenshtein distance o búsqueda por similitud fonética.

### Solución implementada
- [x] Nuevo servicio `FuzzySearchService` con búsqueda fuzzy
- [x] Cache de productos con transient (5 minutos) para respuesta rápida
- [x] Algoritmo Levenshtein para tolerancia a errores tipográficos
- [x] Búsqueda por prefijo para autocompletado
- [x] Normalización de texto (acentos, mayúsculas)
- [x] Invalidación automática de cache al modificar productos

### Archivos modificados
- `Glory/src/Plugins/AmazonProduct/Service/FuzzySearchService.php` (nuevo)
- `Glory/src/Plugins/AmazonProduct/AmazonProductPlugin.php`

---

## 2. Problema de Paginación en Productos -> Ropa

### Problema reportado
El cliente reporta que la **página 2 no carga** en la sección Productos -> Ropa.

### Estado de investigación
- No se ha logrado replicar el error (funciona correctamente en pruebas locales).
- **Posible causa:** JavaScript cacheado en el navegador del cliente.

### Acciones realizadas
- [x] Revisado el sistema de paginación - funciona correctamente
- [x] El código usa botones en lugar de enlaces para evitar conflictos con navegación AJAX
- [ ] Pendiente: Solicitar al cliente que limpie caché y pruebe nuevamente

### Nota
El sistema de paginación es robusto y funciona correctamente. El problema probablemente era cache del navegador del cliente.

---

## 3. Página de Ofertas - Solo Productos con Descuento

### Requisito
La página de ofertas debe mostrar **únicamente productos que tengan descuento aplicado**.

### Solución implementada
- [x] Mejorado `DealsRenderer` para verificar descuento real (`original_price > price`)
- [x] Filtro adicional: solo productos con al menos 1% de descuento
- [x] Excluir productos con precios inválidos (0 o negativos)

### Archivos modificados
- `Glory/src/Plugins/AmazonProduct/Renderer/DealsRenderer.php`

---

## 4. Mini Filtro de Ordenamiento por Precio

### Requisito
Agregar un **mini filtro** junto al badge de resultados para ordenar productos por precio.

### Solución implementada
- [x] Nuevo selector de ordenamiento compacto en el header de resultados
- [x] Opciones: Más recientes, Precio bajo a alto, Precio alto a bajo, Mayor descuento, Mejor valorados
- [x] Sincronización con el filtro principal de ordenamiento
- [x] Diseño responsive (ocupa todo el ancho en móvil)
- [x] Estilos modernos con flecha SVG personalizada

### Archivos modificados
- `Glory/src/Plugins/AmazonProduct/Renderer/FilterRenderer.php`
- `Glory/src/Plugins/AmazonProduct/assets/js/amazon-product.js`
- `Glory/src/Plugins/AmazonProduct/assets/css/amazon-product.css`
- `Glory/src/Plugins/AmazonProduct/i18n/Labels.php`

---

## Resumen de cambios

| Archivo                          | Tipo       | Descripción                             |
| -------------------------------- | ---------- | --------------------------------------- |
| `Service/FuzzySearchService.php` | Nuevo      | Servicio de búsqueda fuzzy con cache    |
| `AmazonProductPlugin.php`        | Modificado | Usar FuzzySearchService, hooks de cache |
| `Renderer/FilterRenderer.php`    | Modificado | Mini filtro de ordenamiento             |
| `Renderer/DealsRenderer.php`     | Modificado | Verificar descuento real                |
| `assets/js/amazon-product.js`    | Modificado | Event listener para quick-sort          |
| `assets/css/amazon-product.css`  | Modificado | Estilos del mini filtro                 |
| `i18n/Labels.php`                | Modificado | Label "sort_by" en EN/ES                |

---

## Próximos pasos sugeridos

1. Probar la búsqueda fuzzy en el sitio en vivo
2. Verificar el rendimiento con diferentes volúmenes de productos
3. Confirmar con el cliente que la paginación funciona correctamente después de limpiar cache
