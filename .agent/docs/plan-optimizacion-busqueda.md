# Plan: Optimización de Búsqueda - Búsqueda del Lado del Cliente

**Fecha:** 2026-01-02  
**Problema:** La búsqueda tarda 3-10 segundos porque cada petición va al servidor

---

## Análisis del Problema

### Flujo actual (lento)
```
Usuario escribe → Debounce 200ms → AJAX al servidor → PHP procesa → WP_Query → Respuesta
                                    ↑
                            CUELLO DE BOTELLA (3-10s)
```

### Causas de lentitud
1. **Latencia de red**: Cada petición va al servidor
2. **WP_Query**: Aunque hay cache, la primera búsqueda es lenta
3. **PHP overhead**: Procesar la petición AJAX toma tiempo
4. **Base de datos**: Consultas a MySQL son inherentemente lentas

---

## Solución Propuesta: Búsqueda en el Cliente

### Nuevo flujo (instantáneo)
```
Página carga → Índice de productos en memoria (JS)
Usuario escribe → Búsqueda inmediata en JavaScript → Resultados instantáneos
```

### Beneficios
- **Respuesta instantánea** (< 50ms)
- **Sin latencia de red** después de la carga inicial
- **Búsqueda fuzzy** más eficiente en JS
- **Funciona offline** una vez cargada la página

---

## Implementación

### Fase 1: Crear endpoint de índice ligero

**Archivo:** `AmazonProductPlugin.php`

Crear nuevo endpoint que devuelve TODOS los productos en formato mínimo:
```php
add_action('wp_ajax_amazon_search_index', [$this, 'getSearchIndex']);
add_action('wp_ajax_nopriv_amazon_search_index', [$this, 'getSearchIndex']);
```

El índice incluye solo:
- `id`: ID del producto
- `t`: Título (normalizado, sin acentos)
- `p`: Precio
- `i`: URL de imagen (thumbnail)
- `u`: URL del producto

**Peso estimado:** ~200 bytes por producto
- 100 productos: ~20KB
- 500 productos: ~100KB
- 1000 productos: ~200KB

### Fase 2: Cache del índice en el navegador

**Estrategia de cache:**
1. Guardar índice en `sessionStorage` o `localStorage`
2. Incluir timestamp de última actualización
3. Invalidar si el índice del servidor es más nuevo

### Fase 3: Motor de búsqueda en JavaScript

**Archivo:** `buscadorMenu.js`

Implementar búsqueda fuzzy en el cliente:
- Búsqueda por prefijo (más rápido)
- Levenshtein distance para typos
- Ordenar por relevancia
- Limitar resultados a 5-10

### Fase 4: Fallback al servidor

Si el índice no está disponible o es muy grande:
- Usar el endpoint AJAX actual como fallback
- Mostrar indicador de "cargando índice" la primera vez

---

## Estructura de Archivos

```
Glory/src/Plugins/AmazonProduct/
├── Service/
│   └── SearchIndexService.php    (NUEVO - Genera el índice)
├── assets/js/
│   └── buscador-cliente.js       (NUEVO - Búsqueda en cliente)
└── AmazonProductPlugin.php       (MODIFICAR - Nuevo endpoint)

App/Assets/js/
└── buscadorMenu.js               (MODIFICAR - Usar nuevo motor)
```

---

## Pasos de Implementación

### Paso 1: SearchIndexService
- [x] Crear servicio que genera índice de productos
- [x] Formato JSON minificado
- [x] Cache con transient (1 hora)
- [x] Incluir timestamp de última actualización

### Paso 2: Endpoint de índice
- [x] Registrar endpoint `amazon_search_index`
- [x] Registrar endpoint `amazon_search_index_timestamp`
- [x] Devolver JSON comprimido
- [x] Headers de cache del navegador

### Paso 3: Motor de búsqueda JS
- [x] Crear clase `BuscadorCliente`
- [x] Implementar búsqueda fuzzy
- [x] Normalización de texto
- [x] Ordenamiento por relevancia

### Paso 4: Integrar en buscadorMenu.js
- [x] Cargar índice al abrir el buscador
- [x] Reemplazar búsqueda AJAX por local
- [x] Fallback a AJAX si hay error

### Paso 5: Optimizaciones
- [x] Lazy loading del índice (solo cuando se abre el buscador)
- [ ] Compresión gzip del JSON
- [ ] Preload hint en el header

---

## Consideraciones

### Para sitios con pocos productos (< 500)
- Cargar índice completo al abrir buscador
- Búsqueda instantánea siempre

### Para sitios con muchos productos (> 500)
- Cargar índice en background
- Mostrar "Preparando búsqueda..." mientras carga
- Una vez cargado, búsqueda instantánea

### Invalidación de cache
- El índice se regenera cuando:
  - Se guarda un producto
  - Se elimina un producto
  - Han pasado más de 60 minutos

---

## Estimación de Tiempo

| Paso               | Tiempo estimado |
| ------------------ | --------------- |
| SearchIndexService | 20 min          |
| Endpoint           | 10 min          |
| Motor JS           | 30 min          |
| Integración        | 20 min          |
| Testing            | 15 min          |
| **Total**          | ~1.5 horas      |

---

## Resultado Esperado

- **Antes:** 3-10 segundos por búsqueda
- **Después:** < 50ms por búsqueda (después de cargar índice)
- **Carga del índice:** 200-500ms (una sola vez)
