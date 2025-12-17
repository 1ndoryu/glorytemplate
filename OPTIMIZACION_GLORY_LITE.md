# Glory Lite - Plan de Optimización

**Rama:** `glory-lite` (o similar)  
**Fecha:** 2025-12-17  
**Objetivo:** Simplificar Glory eliminando funcionalidades del constructor visual para enfocarse en React como motor principal de UI.

---

## Contexto

Glory actualmente soporta múltiples paradigmas:
- **GBN (Glory Block Network):** Constructor visual tipo page builder
- **Componentes PHP:** Renderizadores de UI complejos en PHP
- **Modo Editor vs Código:** Alternancia entre WordPress Editor y código directo
- **React Islands:** Sistema híbrido React + PHP (SSG/SSR)

Con la adopción de **React Islands**, muchas funcionalidades del constructor se vuelven redundantes. Esta rama optimiza Glory para proyectos que usan React como motor principal de UI.

---

## Fase 1: Identificar Elementos a Eliminar

### 1.1 GBN Completo (Glory Block Network)

**Directorio:** `Glory/src/Gbn/`

| Subdirectorio/Archivo | Descripción                   | Acción   |
| --------------------- | ----------------------------- | -------- |
| `Ajax/`               | Handlers AJAX del constructor | ELIMINAR |
| `Components/`         | Sistema de componentes GBN    | ELIMINAR |
| `Config/`             | Configuración del constructor | ELIMINAR |
| `Diagnostics/`        | Herramientas de debug GBN     | ELIMINAR |
| `Handlers/`           | Manejadores de eventos        | ELIMINAR |
| `Icons/`              | Iconos del editor visual      | ELIMINAR |
| `Pages/`              | Páginas del builder           | ELIMINAR |
| `Schema/`             | Esquemas de bloques           | ELIMINAR |
| `Services/`           | Servicios internos GBN        | ELIMINAR |
| `Templates/`          | Templates del constructor     | ELIMINAR |
| `Traits/`             | Traits compartidos            | ELIMINAR |
| `assets/`             | CSS/JS del editor             | ELIMINAR |
| `*.php`               | Clases principales            | ELIMINAR |
| `*.md`, `*.log`       | Documentación y logs          | ELIMINAR |

**Total estimado:** ~50+ archivos, ~200KB+ de código

### 1.2 Componentes PHP de UI

**Directorio:** `Glory/src/Components/`

| Componente                    | Uso                     | Acción                           |
| ----------------------------- | ----------------------- | -------------------------------- |
| `AutenticacionRenderer.php`   | Login/Registro UI       | EVALUAR (puede hacerse en React) |
| `BadgeList.php`               | Listas de badges        | ELIMINAR                         |
| `BarraFiltrosRenderer.php`    | Filtros UI              | ELIMINAR (React)                 |
| `BusquedaRenderer.php`        | Búsqueda UI             | ELIMINAR (React)                 |
| `Button.php`                  | Botones PHP             | ELIMINAR                         |
| `ContentRender.php` (35KB)    | Renderizado contenido   | EVALUAR (grande)                 |
| `DataGridRenderer.php` (19KB) | Tablas/grids            | ELIMINAR (React)                 |
| `FormBuilder.php` (31KB)      | Constructor formularios | ELIMINAR (React)                 |
| `FormularioFluente.php`       | API fluida forms        | ELIMINAR                         |
| `GloryImage.php`              | Imágenes optimizadas    | MANTENER (útil)                  |
| `HeaderRenderer.php`          | Header dinámico         | EVALUAR                          |
| `LogoRenderer.php`            | Logos                   | ELIMINAR                         |
| `MenuWalker.php`              | Walker menús WP         | MANTENER (WordPress)             |
| `Modal.php`                   | Modales PHP             | ELIMINAR (React)                 |
| `PaginationRenderer.php`      | Paginación              | ELIMINAR (React)                 |
| `PerfilRenderer.php`          | Perfiles                | ELIMINAR (React)                 |
| `SchedulerRenderer.php`       | Calendarios             | ELIMINAR (React)                 |
| `TermRender.php`              | Taxonomías UI           | EVALUAR                          |
| `ThemeToggle.php`             | Dark mode toggle        | ELIMINAR (React)                 |

### 1.3 Servicios Obsoletos

**Directorio:** `Glory/src/Services/`

| Servicio                      | Acción                  |
| ----------------------------- | ----------------------- |
| `BusquedaService.php`         | EVALUAR (backend útil)  |
| `GestorCssCritico.php` (28KB) | MANTENER (optimización) |
| `CreditosManager.php`         | ELIMINAR                |
| `LicenseManager.php`          | ELIMINAR                |
| `PerformanceProfiler.php`     | MANTENER (debug)        |
| `QueryProfiler.php`           | MANTENER (debug)        |
| `ReactIslands.php`            | **MANTENER (core)**     |
| `ReactContentProvider.php`    | **MANTENER (core)**     |
| `TokenManager.php`            | EVALUAR                 |

### 1.4 Features a Deshabilitar Permanentemente

De `App/Config/control.php`, estas ya están deshabilitadas:

```php
// Ya deshabilitados - ELIMINAR código fuente
GloryFeatures::disable('gbn');
GloryFeatures::disable('modales');
GloryFeatures::disable('submenus');
GloryFeatures::disable('pestanas');
GloryFeatures::disable('scheduler');
GloryFeatures::disable('headerAdaptativo');
GloryFeatures::disable('themeToggle');
GloryFeatures::disable('alertas');
GloryFeatures::disable('gestionarPreviews');
GloryFeatures::disable('paginacion');
GloryFeatures::disable('gloryFilters');
GloryFeatures::disable('calendario');
GloryFeatures::disable('badgeList');
GloryFeatures::disable('highlight');
GloryFeatures::disable('gsap');
GloryFeatures::disable('gbnSplitContent');
GloryFeatures::disable('gloryLinkCpt');
GloryFeatures::disable('cssCritico');
GloryFeatures::disable('navegacionAjax');
GloryFeatures::disable('gloryAjax');
GloryFeatures::disable('gloryForm');
GloryFeatures::disable('gloryBusqueda');
GloryFeatures::disable('gloryRealtime');
GloryFeatures::disable('logoRenderer');
GloryFeatures::disable('contentRender');
GloryFeatures::disable('termRender');
```

### 1.5 Modo Editor vs Código

**Archivos relacionados:**
- `Glory/src/Admin/PageContentModeMetabox.php`
- Cualquier referencia a "content mode" toggle

**Acción:** ELIMINAR - Con React, el contenido se maneja mediante componentes, no editor WP.

---

## Fase 2: Elementos a Mantener (Core Mínimo)

### 2.1 Sistema React Islands (Crítico)

```
Glory/
├── assets/react/           # Sistema completo React
│   ├── src/
│   ├── scripts/
│   ├── dist/
│   └── package.json
└── src/
    └── Services/
        ├── ReactIslands.php       # Core
        └── ReactContentProvider.php
```

### 2.2 Managers Esenciales

| Manager                 | Razón                        |
| ----------------------- | ---------------------------- |
| `PageManager`           | Gestión de páginas y routing |
| `AssetManager`          | Carga de CSS/JS              |
| `PostTypeManager`       | CPTs personalizados          |
| `ScheduleManager`       | Cron jobs                    |
| `OpcionManagerSync`     | Opciones del tema            |
| `SyncManager`           | Sincronización               |
| `GloryLogger`           | Logs                         |
| `DefaultContentManager` | Contenido por defecto        |

### 2.3 Core Framework

```
Glory/src/
├── Core/
│   ├── GloryFeatures.php      # Sistema de features
│   ├── GloryLogger.php        # Logging
│   ├── OpcionRegistry.php     # Registro opciones
│   ├── OpcionRepository.php   # Repositorio
│   └── Setup.php              # Bootstrap
├── Manager/
│   └── (managers esenciales)
├── Helpers/                   # Utilidades
├── Utility/                   # Funciones helper
└── Support/                   # Soporte general
```

### 2.4 Componentes Útiles

- `GloryImage.php` - Optimización de imágenes
- `MenuWalker.php` - Necesario para menús WordPress

---

## Fase 3: Plan de Ejecución

### Paso 1: Backup y Branch

```bash
git checkout -b glory-lite
git push -u origin glory-lite
```

### Paso 2: Eliminar GBN

```bash
# Eliminar directorio completo
rm -rf Glory/src/Gbn/

# Eliminar referencias en GloryFeatures
# Eliminar any gbn-related handlers
```

### Paso 3: Limpiar Componentes

```bash
# Eliminar componentes PHP innecesarios
rm Glory/src/Components/BadgeList.php
rm Glory/src/Components/BarraFiltrosRenderer.php
rm Glory/src/Components/BusquedaRenderer.php
rm Glory/src/Components/Button.php
rm Glory/src/Components/DataGridRenderer.php
rm Glory/src/Components/FormBuilder.php
rm Glory/src/Components/FormularioFluente.php
rm Glory/src/Components/LogoRenderer.php
rm Glory/src/Components/Modal.php
rm Glory/src/Components/PaginationRenderer.php
rm Glory/src/Components/PerfilRenderer.php
rm Glory/src/Components/SchedulerRenderer.php
rm Glory/src/Components/ThemeToggle.php
```

### Paso 4: Limpiar Servicios

```bash
rm Glory/src/Services/CreditosManager.php
rm Glory/src/Services/LicenseManager.php
```

### Paso 5: Actualizar Autoload

- Revisar `composer.json` para namespaces huérfanos
- Ejecutar `composer dump-autoload`

### Paso 6: Simplificar control.php

```php
<?php
// App/Config/control.php - Glory Lite

use Glory\Core\GloryFeatures;

/*
 * Core Managers - Siempre habilitados
 */
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::enable('pageManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('scheduleManager');
GloryFeatures::enable('defaultContentManager');

// Theme support
GloryFeatures::enable('postThumbnails');

// Proyecto específico
GloryFeatures::enable('amazonProduct');
```

### Paso 7: Verificar Funcionamiento

1. Cargar sitio en navegador
2. Verificar páginas React funcionan
3. Verificar no hay errores PHP
4. Verificar assets cargan correctamente

---

## Fase 4: Estimación de Reducción

| Categoría           | Archivos          | Tamaño Aprox |
| ------------------- | ----------------- | ------------ |
| GBN                 | ~60 archivos      | ~300KB       |
| Componentes PHP     | ~15 archivos      | ~150KB       |
| Servicios obsoletos | ~3 archivos       | ~20KB        |
| Assets GBN          | ~20 archivos      | ~100KB       |
| **Total**           | **~100 archivos** | **~570KB**   |

### Beneficios Esperados

- **Menor complejidad:** ~100 archivos menos que mantener
- **Menor tamaño:** ~500KB menos en el tema
- **Menor acoplamiento:** Menos dependencias internas
- **Mayor claridad:** Propósito único (React + WordPress básico)
- **Faster loading:** Menos código autoloaded

---

## Fase 5: Estructura Final Glory Lite

```
glory/
├── App/                          # Proyecto específico
│   ├── Assets/
│   ├── Config/
│   │   ├── control.php          # Simplificado
│   │   └── pages.php
│   ├── React/
│   │   └── islands/             # Componentes React del proyecto
│   └── Templates/
│
├── Glory/                        # Framework (reducido)
│   ├── assets/
│   │   └── react/               # Sistema React completo
│   ├── src/
│   │   ├── Core/                # Bootstrap, Features, Logger
│   │   ├── Manager/             # Managers esenciales
│   │   ├── Services/            # ReactIslands + utilidades
│   │   ├── Helpers/
│   │   └── Utility/
│   └── functions.php
│
├── TemplateGlory.php            # Template híbrido
├── TemplateReact.php            # Template 100% React
└── functions.php                # Bootstrap
```

---

## Riesgos y Mitigaciones

| Riesgo              | Mitigación                                          |
| ------------------- | --------------------------------------------------- |
| Romper dependencias | Buscar `use Glory\...Gbn` antes de eliminar         |
| Proyectos legacy    | Esta rama es solo para nuevos proyectos React-first |
| Features futuras    | Pueden reimplementarse en React si se necesitan     |
| Rollback necesario  | Branch separado permite volver a main               |

---

## Checklist Pre-Eliminación

- [ ] Buscar todas las referencias a `Gbn` en el código
- [ ] Buscar todas las referencias a cada componente a eliminar
- [ ] Verificar que `control.php` no habilita features eliminadas
- [ ] Backup de base de datos (por si hay datos GBN almacenados)
- [ ] Documentar cualquier funcionalidad que se pierda

---

## Notas Importantes

1. **Esta es una rama de optimización**, no afecta la rama principal
2. **No es reversible fácilmente** una vez en producción
3. **Los proyectos existentes deben evaluarse** antes de migrar
4. **React Islands es el futuro** de Glory en esta rama

---

## Próximos Pasos

1. **Revisar este plan** y ajustar según necesidades
2. **Crear la rama** `glory-lite`
3. **Ejecutar eliminaciones** siguiendo el orden descrito
4. **Probar exhaustivamente** antes de usar en producción
5. **Documentar cambios** en README.md
