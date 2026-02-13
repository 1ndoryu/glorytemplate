# 🌟 Glory Template

Tema WordPress preparado para construir frontend moderno con **React + TypeScript** usando **Glory Framework**.

La idea es simple: WordPress sigue siendo excelente para administración, contenido y APIs; React se encarga de la experiencia de usuario.

---

## 🧭 Índice rápido

- 🚀 Inicio rápido
- 🧱 Estructura del proyecto
- 🛠️ Flujo diario de desarrollo
- 📦 Scripts y comandos
- 🎛️ Feature flags
- ✅ Qué puedes construir con esta base
- 🧯 Troubleshooting
- 📚 Documentación relacionada

---

## 🚀 Inicio rápido

### 1) Requisitos

- Node.js 18+
- npm
- PHP 8.0+
- Composer
- WordPress 6+

### 2) Instalación

```bash
cd wp-content/themes
git clone https://github.com/1ndoryu/glorytemplate.git
cd glorytemplate

node Glory/cli/glory.mjs setup
```

### 3) Levantar desarrollo

```bash
npm run dev
```

### 4) Opción UI moderna (Tailwind + shadcn)

```bash
node Glory/cli/glory.mjs setup --tailwind --shadcn
```

---

## 🧱 Estructura del proyecto

```text
glorytemplate/
├── App/                            # Código específico de tu proyecto
│   ├── Config/                     # Registro de páginas, flags, assets, config
│   │   ├── pages.php               # Páginas React (slugs + islas)
│   │   ├── control.php             # Feature flags
│   │   ├── assets.php              # Assets del proyecto
│   │   └── config.php              # Configuración general
│   ├── Content/                    # Contenido inicial, CPTs, menús
│   └── React/
│       ├── islands/                # Islas React del proyecto
│       ├── components/             # Componentes reutilizables del proyecto
│       ├── hooks/                  # Hooks del proyecto
│       ├── styles/                 # CSS del proyecto
│       ├── types/                  # Tipos TS del proyecto
│       └── appIslands.tsx          # Registry de islas App
│
├── Glory/                          # Core del framework (submódulo)
│   ├── src/                        # Bridge PHP (WordPress ↔ React)
│   ├── assets/react/               # Core React (hooks, provider, hydration)
│   └── cli/                        # Comandos glory create/setup/new
│
├── TemplateReact.php               # Template principal del frontend
├── functions.php                   # Bootstrap WordPress
└── package.json                    # Scripts raíz
```

### 🧩 App vs Glory (regla práctica)

| Carpeta | Uso principal | Editar normalmente |
|---|---|---|
| `App/` | Tu lógica de negocio y UI de proyecto | ✅ Sí |
| `Glory/` | Núcleo del framework | ⚠️ Solo cuando mantienes el core |

---

## 🛠️ Flujo diario de desarrollo

### 1) Crear una página completa

```bash
npx glory create page contacto
```

Esto genera automáticamente:

- Isla `ContactoIsland`.
- CSS asociado.
- Registro de isla en `App/React/appIslands.tsx`.
- Registro de página en `App/Config/pages.php`.

### 2) Crear una isla para sección específica

```bash
npx glory create island HeroHome
```

### 3) Crear componentes y hooks

```bash
npx glory create component BotonPrimario
npx glory create hook useProductos
```

### 4) Revisar calidad antes de entregar

```bash
npm run type-check
npm run lint
npm run build
```

---

## 📦 Scripts y comandos

### Scripts npm (raíz)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Modo desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run build:fast` | Build rápido (sin prerender completo) |
| `npm run lint` | ESLint estricto |
| `npm run lint:fix` | Auto-fix de ESLint |
| `npm run format` | Formatea con Prettier |
| `npm run format:check` | Verifica formato |
| `npm run type-check` | Valida tipos TypeScript |
| `npm run docs:dev` | Docs del framework en modo dev |
| `npm run docs:build` | Build de documentación |

### CLI Glory

| Comando | Resultado |
|---|---|
| `npx glory create page <slug>` | Crea página React + registro |
| `npx glory create island <Nombre>` | Crea isla + css + registro |
| `npx glory create component <Nombre>` | Crea componente base |
| `npx glory create hook <nombre>` | Crea hook base |
| `npx glory setup` | Inicializa entorno del proyecto |
| `npx glory new <nombre>` | Crea un proyecto nuevo |

---

## 🎛️ Feature flags

Se configuran en `App/Config/control.php`.

```php
GloryFeatures::enable('pageManager');
GloryFeatures::disable('tailwind');
GloryFeatures::disable('shadcnUI');
GloryFeatures::disable('stripe');
GloryFeatures::disable('queryProfiler');
```

### Flags comunes

- `tailwind`: activa estilos Tailwind.
- `shadcnUI`: habilita componentes de UI basados en Tailwind.
- `stripe`: integra módulo Stripe.
- `queryProfiler`: debugging de consultas SQL.

---

## ✅ Qué puedes construir con esta base

- Sitios corporativos con páginas por islas.
- Landing pages con SEO server-side + componentes React.
- Paneles y flujos dinámicos consumiendo REST API de WordPress.
- Temas escalables con tipado estricto y DX moderna.

---

## 🧯 Troubleshooting rápido

### No aparece una isla

Revisa en orden:

1. Que exista en `App/React/islands/`.
2. Que esté exportada/registrada en `App/React/appIslands.tsx`.
3. Que la página esté registrada en `App/Config/pages.php`.

### Un comando `glory create ...` falla

- Verifica Node y npm instalados.
- Ejecuta instalación de dependencias en raíz.
- Reintenta desde la carpeta del tema (`glorytemplate/`).

### Lint o type-check fallan

- Corre `npm run type-check` para ver errores de tipos.
- Corre `npm run lint` para errores de reglas de código.
- Corrige primero errores, luego warnings importantes.

---

## 📚 Documentación relacionada

- Framework core: [Glory/readme.md](Glory/readme.md)
- Plan maestro y roadmap: [glory-plan.md](glory-plan.md)
