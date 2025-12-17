# Glory React - Plan de Optimización

**Rama:** `glory-react`  
**Fecha:** 2025-12-17  
**Estado:** EN PROGRESO

---

## Progreso Actual

### Ya Eliminado

| Elemento                                         | Estado      |
| ------------------------------------------------ | ----------- |
| `Glory/src/Components/`                          | ✅ ELIMINADO |
| `Glory/src/Gbn/`                                 | ✅ ELIMINADO |
| `Glory/src/Integration/`                         | ✅ ELIMINADO |
| `Glory/src/PostTypes/`                           | ✅ ELIMINADO |
| `App/Templates/` (obsoletos)                     | ✅ ELIMINADO |
| `Glory/src/Support/ContentRender/`               | ✅ ELIMINADO |
| `Glory/src/Support/CSS/ContentRenderCss.php`     | ✅ ELIMINADO |
| `Glory/src/Support/Scripts/*` (obsoletos)        | ✅ ELIMINADO |
| `Glory/src/Handler/*` (handlers AJAX obsoletos)  | ✅ ELIMINADO |
| `Glory/src/Core/Setup.php` - referencias limpias | ✅ LIMPIO    |
| `App/Config/control.php` - simplificado          | ✅ LIMPIO    |

---

## Estructura Actual Glory/src/

```
Glory/src/
├── Admin/           # Panel de opciones
├── Console/         # Comandos CLI
├── Contracts/       # Interfaces
├── Core/            # GloryFeatures, Logger, Setup (limpio)
├── Exception/       # Excepciones
├── Helpers/         # Funciones helper
├── Manager/         # Managers esenciales
├── Plugins/         # AmazonProduct, etc.
├── Repository/      # Repositorios de datos
├── Seo/             # SEO utilities
├── Services/        # ReactIslands, Profilers
├── Support/
│   └── WP/          # Utilidades WordPress
└── Utility/         # Utilidades generales
```

---

## control.php Actual (Limpio)

```php
<?php

use Glory\Core\GloryFeatures;

/* Core Managers */
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::enable('pageManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('scheduleManager');
GloryFeatures::enable('defaultContentManager');

/* Theme Support */
GloryFeatures::enable('postThumbnails');

/* Managers deshabilitados */
GloryFeatures::disable('menu');

/* Plugins del proyecto */
GloryFeatures::enable('amazonProduct');
```

---

## Pendiente (Opcional)

### Glory/Config/options.php
- Limpiar opciones relacionadas a ContentRender (ya no aplican)
- Estas opciones no causan errores, solo ocupan espacio en BD

### Glory/src/Admin/PageContentModeMetabox.php
- Metabox de "modo contenido" ya no está en Setup.php
- Puede eliminarse el archivo si no se usa

### Servicios a Evaluar
| Servicio               | Estado                      |
| ---------------------- | --------------------------- |
| `GestorCssCritico.php` | Evaluar si se necesita      |
| `BusquedaService.php`  | Evaluar si se migra a React |
| `LicenseManager.php`   | Puede eliminarse            |
| `CreditosManager.php`  | Puede eliminarse            |

---

## Beneficios Logrados

- **~100+ archivos eliminados**
- **~500KB+ de código removido**
- **Setup.php:** 285 → 166 líneas (-42%)
- **control.php:** 83 → 50 líneas (-40%)
- **Sin referencias rotas** a código eliminado

---

## Próximos Pasos

1. [ ] Verificar que el sitio carga sin errores
2. [ ] Probar páginas React funcionan correctamente
3. [ ] Ejecutar `composer dump-autoload`
4. [ ] Limpiar `options.php` (opcional)
5. [ ] Eliminar servicios obsoletos (LicenseManager, CreditosManager)
6. [ ] Commit de los cambios

---

## Notas

- Esta rama es para proyectos **React-first**
- Compatible con el sistema React Islands documentado en `react-glory.md`
- No afecta la rama principal de Glory
