# Glory Frontend - Next.js SSR

Aplicación Next.js con Server-Side Rendering (SSR) conectada a WordPress como backend headless.

## Características

- ✅ **SSR Completo**: Renderizado del lado del servidor para SEO perfecto
- ✅ **TypeScript**: Tipado estático para mayor seguridad
- ✅ **CSS Puro**: Sistema de diseño con variables CSS (sin frameworks CSS)
- ✅ **WordPress API**: Integración con WordPress REST API
- ✅ **Componentes Modernos**: Arquitectura basada en componentes React

## Estructura del Proyecto

```
frontend/
├── app/                    # App Router de Next.js
│   ├── layout.tsx         # Layout global con Header y Footer
│   ├── page.tsx           # Página principal (Home)
│   └── globals.css        # Estilos globales y variables CSS
├── lib/                   # Utilidades y clientes
│   ├── wordpress.ts       # Cliente para WordPress REST API
│   └── types.ts           # Tipos TypeScript
├── .env.local             # Variables de entorno
└── next.config.ts         # Configuración de Next.js
```

## Requisitos Previos

- Node.js 18+ instalado
- WordPress corriendo en `http://glorybuilder.local` (o la URL configurada)
- npm o pnpm

## Instalación

```bash
# Instalar dependencias
npm install
```

## Configuración

1. **Variables de Entorno**: El archivo `.env.local` ya está configurado:

```env
WORDPRESS_API_URL=http://glorybuilder.local
```

2. **WordPress CORS** (Opcional): Si necesitas conectar desde el navegador, configura CORS en WordPress:

```php
// En functions.php o plugin
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: http://localhost:3000');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
});
```

## Comandos

```bash
# Desarrollo (con Hot Module Replacement)
npm run dev
# Abre http://localhost:3000

# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

## Arquitectura SSR

### Flujo de Datos

1. Usuario visita `http://localhost:3000`
2. Next.js recibe la solicitud en el **servidor**
3. Next.js ejecuta `obtenerPosts()` para obtener datos de WordPress
4. Next.js renderiza el HTML completo con React
5. HTML se envía al navegador (SEO perfecto ✅)
6. React "hidrata" el HTML para interactividad

### Cliente WordPress

El archivo `lib/wordpress.ts` contiene funciones para obtener datos:

```typescript
// Obtener lista de posts
const posts = await obtenerPosts({ porPagina: 10, pagina: 1 });

// Obtener un post por slug
const post = await obtenerPostPorSlug('mi-post');

// Obtener una página por slug
const pagina = await obtenerPagina('about');

// Obtener info del sitio
const info = await obtenerInfoSitio();
```

## Sistema de Diseño CSS

### Variables CSS

Todas las variables están en `app/globals.css`:

```css
:root {
    --color-primario: hsl(220, 90%, 56%);
    --color-secundario: hsl(280, 80%, 55%);
    --espacio-md: 1rem;
    --tamano-texto-base: 1rem;
    /* ...más variables */
}
```

### Clases CSS Disponibles

**Layout:**
- `.contenedor` - Contenedor centralizado con max-width

**Componentes:**
- `.cabeceraGlobal` - Header sticky
- `.seccionHero` - Hero section con gradiente
- `.gridPosts` - Grid responsive de posts
- `.tarjetaPost` - Tarjeta de post individual
- `.botonPrimario` / `.botonSecundario` - Botones
- `.pieGlobal` - Footer

**Ver `app/globals.css` para todas las clases disponibles.**

## Páginas Creadas

### ✅ Home (`/`)
- Hero section con título y CTAs
- Grid de últimos posts de WordPress
- Layout completo (Header + Footer)

### 🚧 Pendientes
- `/blog` - Lista de posts con paginación
- `/blog/[slug]` - Post individual dinámico
- `/servicios` - Página de servicios
- `/contacto` - Formulario de contacto

## Agregar Nuevas Páginas

1. Crear archivo en `app/[ruta]/page.tsx`
2. Ejemplo de página SSR:

```tsx
import { obtenerPagina } from "@/lib/wordpress";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Mi Página",
        description: "Descripción de mi página",
    };
}

export default async function MiPagina() {
    const datos = await obtenerPagina('mi-slug');
    
    return (
        <section id="mi-seccion" className="seccion">
            <div className="contenedor">
                <h1>{datos?.title.rendered}</h1>
                <div dangerouslySetInnerHTML={{ __html: datos?.content.rendered || '' }} />
            </div>
        </section>
    );
}
```

## Solución de Problemas

### Los posts no se muestran

1. Verifica que WordPress esté corriendo en la URL configurada
2. Verifica que haya posts publicados en WordPress
3. Revisa los logs del servidor de Next.js
4. Prueba la API directamente: `http://glorybuilder.local/wp-json/wp/v2/posts`

### Error de conexión

```
Error obteniendo posts: [error]
```

**Solución:**
1. Verifica que `WORDPRESS_API_URL` en `.env.local` sea correcto
2. Asegúrate de que WordPress esté accesible desde el servidor Next.js
3. Si estás en Docker/Local by Flywheel, verifica las rutas de red

### La página no actualiza

El servidor usa **cache de 60 segundos** por defecto. Para ver cambios inmediatos:

```typescript
// En lib/wordpress.ts, cambia:
{ next: { revalidate: 60 } }
// a:
{ cache: 'no-store' }
```

## Despliegue

### Opción 1: Vercel (Recomendado)

1. Conecta el repositorio a Vercel
2. Configura la variable de entorno `WORDPRESS_API_URL`
3. Deploy automático

### Opción 2: Self-hosted

```bash
npm run build
npm start
```

Requiere Node.js en el servidor. Usa PM2 o similar para mantener el proceso.

## Siguientes Pasos

1. **Crear más páginas**: Blog, Servicios, Contacto
2. **Configurar CORS**: Para que WordPress permita requests desde Next.js
3. **Agregar animaciones**: Framer Motion para transiciones suaves
4. **Optimizar imágenes**: Usar `next/image` para lazy loading
5. **Agregar sitemap**: Plugin `next-sitemap` para SEO

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Glory Frontend v1.0** - Ejemplo SSR simplificado
