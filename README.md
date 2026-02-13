# Glory Template

Tema WordPress basado en Glory Framework. TypeScript-first: React es el UI, WordPress solo maneja datos.

## Requisitos

- Node.js 18+
- PHP 8.0+
- Composer
- WordPress 6.0+

## Setup

```bash
# 1. Clonar en wp-content/themes/
cd wp-content/themes
git clone --branch glory-react https://github.com/1ndoryu/glorytemplate.git
cd glorytemplate

# 2. Instalar dependencias e inicializar
node Glory/cli/glory.mjs setup

# 3. Desarrollo
npm run dev
```

Con flags opcionales:

```bash
node Glory/cli/glory.mjs setup --tailwind --shadcn
```

## Estructura del Proyecto

```
glorytemplate/
├── App/                        # Codigo del proyecto (usuario)
│   ├── Config/                 # Configuracion del tema
│   │   ├── pages.php           # Registro de paginas React
│   │   ├── control.php         # Feature flags
│   │   ├── assets.php          # Assets a cargar
│   │   └── config.php          # Constantes del tema
│   ├── Content/                # Datos de WordPress
│   │   ├── defaultContent.php  # Contenido por defecto
│   │   ├── menu.php            # Menus de navegacion
│   │   └── postType.php        # Custom post types
│   └── React/                  # Codigo React del proyecto
│       ├── islands/            # Islas (paginas/secciones React)
│       ├── blocks/             # Bloques para page builder
│       ├── styles/             # CSS de las islas
│       ├── types/              # Tipos TypeScript
│       └── appIslands.tsx      # Registro de islas del proyecto
│
├── Glory/                      # Framework core (submodulo git)
│   ├── src/                    # PHP Bridge (clases del framework)
│   ├── assets/react/           # Motor React (core, hooks, types)
│   ├── cli/                    # CLI scaffolding + installer
│   └── Config/                 # Config interna del framework
│
├── functions.php               # Entry point WordPress
├── header.php                  # HTML head + apertura body
├── index.php                   # Contenedor principal
├── footer.php                  # Cierre body + scripts
├── TemplateReact.php           # Template unico React
└── package.json                # Scripts npm + deps
```

## App/ vs Glory/

| Directorio | Que es | Quien lo modifica |
|------------|--------|-------------------|
| `App/` | Tu proyecto. Islas, config, estilos, tipos. | Tu |
| `Glory/` | Framework core. Submodulo git. | El framework (actualizaciones via `git pull`) |

**Regla:** nunca modifiques archivos dentro de `Glory/` directamente. Usa `App/` para tu codigo.

## Workflow de Desarrollo

### 1. Crear una isla

```bash
npx glory create island MiSeccion
```

Genera:
- `App/React/islands/MiSeccionIsland.tsx`
- `App/React/styles/miSeccion.css`
- Registro automatico en `appIslands.tsx`

### 2. Registrar pagina

```bash
npx glory create page contacto
```

Crea la isla + la registra en `App/Config/pages.php`.

### 3. Desarrollo con HMR

```bash
npm run dev
```

Vite HMR actualiza las islas en tiempo real sin recargar la pagina.

### 4. Crear componentes y hooks

```bash
npx glory create component BotonPrimario
npx glory create hook useProductos
```

## Scripts npm

| Script | Descripcion |
|--------|-------------|
| `npm run dev` | Vite dev server con HMR |
| `npm run build` | Build de produccion |
| `npm run lint` | ESLint stricto |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier |
| `npm run type-check` | TypeScript strict |
| `npm run install:all` | Instala deps en todos los workspaces |

## Feature Flags

Configurados en `App/Config/control.php`:

```php
GloryFeatures::enable('pageManager');     // Registro de paginas React
GloryFeatures::enable('tailwind');        // Tailwind CSS
GloryFeatures::enable('shadcnUI');        // shadcn/ui
GloryFeatures::disable('stripe');         // Stripe
GloryFeatures::disable('queryProfiler'); // Debug SQL
```

## Documentacion del Framework

Consulta [Glory/readme.md](Glory/readme.md) para la documentacion completa del framework: arquitectura, hooks, tipos, CLI, y API reference.
