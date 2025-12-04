# Documentación GBN: Manejo de Estilos y Construcción de Páginas

> [!IMPORTANT]
> Esta documentación resume los puntos clave para trabajar con estilos en GBN y evitar conflictos entre el código manual y el constructor visual. Esta en construcción, cada nuevo aprendizaje importante debe documentarse aca.

## 1. Ciclo de Vida de los Estilos en GBN

**GBN gestiona el atributo `style` de los elementos editables, sincronizándolo con su configuración interna.**

### Flujo Real de Procesamiento

```
┌──────────────────────────────────────────────────────────────────┐
│                    AL CARGAR LA PÁGINA                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. GBN escanea el DOM buscando elementos con gloryDiv, etc.     │
│                                                                  │
│  2. Por cada elemento, LEE los estilos inline existentes:        │
│     <div gloryDiv style="background: red; padding: 20px;">       │
│                                                                  │
│  3. SINCRONIZA esos valores a la configuración del bloque:       │
│     block.config = { fondo: "red", padding: {...} }              │
│                                                                  │
│  4. Si hay configuración GUARDADA (presets), esta SOBRESCRIBE    │   
│     lo que se leyó del HTML (la versión guardada tiene prioridad)│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### ¿Cuándo se "pierden" los estilos inline?

Los estilos inline del HTML **NO se borran al iniciar**. Se pierden en estos casos:

| Escenario                                  | ¿Qué pasa?                                         |
| ------------------------------------------ | -------------------------------------------------- |
| Hay configuración guardada para ese bloque | El preset **sobrescribe** la config leída del HTML |
| El usuario edita una propiedad en el panel | Solo las propiedades en la nueva config se aplican |
| El usuario "limpia" un valor en el panel   | `styleManager` elimina esa propiedad del `style`   |

### Opciones para Estilos Iniciales

**Opción A: Estilos Inline (Editables desde el Panel)**
```html
<!-- GBN lee esto y lo sincroniza a la config del bloque -->
<div gloryDiv style="background-color: red; padding: 20px;">...</div>
```
- ✅ El usuario puede editarlo desde el panel
- ⚠️ Si hay versión guardada, esta tiene prioridad

**Opción B: Atributo `opciones` (Recomendado para valores iniciales)**
```html
<!-- Configuración explícita que GBN entiende directamente -->
<div gloryDiv opciones="fondo: 'red', padding: { superior: '20px' }">...</div>
```
- ✅ Más explícito y legible
- ✅ Se integra directamente con la config del bloque

**Opción C: Clases CSS (Para defaults del tema)**
```html
<!-- Estilos base que el panel puede sobrescribir -->
<div gloryDiv class="hero-section">...</div>

<style>
    .hero-section {
        background-color: red;
    }
</style>
```
- ✅ Actúa como "default" visual
- ✅ El panel (estilos inline) tiene prioridad y puede sobrescribirlo
- ✅ No se pierde nunca (solo se sobrescribe visualmente)

## 2. Jerarquía de Estilos en GBN

GBN sigue una jerarquía estricta para decidir qué estilo mostrar. De menor a mayor prioridad:

1.  **Variables CSS del Tema (`theme-settings`)**: Definidas globalmente.
2.  **Clases CSS Base**: Las clases que pones en tu hoja de estilos o `<style>`.
3.  **Configuración del Panel (GBN)**: Lo que el usuario edita en el constructor. Esto se aplica como `style="..."` inline y **sobrescribe** a las clases base (a menos que uses `!important`).

## 3. Cómo agregar imágenes de fondo (Caso Práctico)

Si necesitas una imagen de fondo fija que no se pierda al cargar el editor:

**Opción A: Vía CSS (Recomendada para plantillas)**
Define una clase con la imagen y asígnala al div.

```css
.hero-bg-custom {
    background-image: url('ruta/imagen.jpg');
    background-size: cover;
    background-position: center;
}
```

**Opción B: Vía Configuración (Para contenido editable)**
Si quieres que la imagen sea editable, debe estar en la configuración del bloque (`data-gbn-schema` o inyectada vía JS), no hardcodeada en el HTML.

## 4. Elementos Decorativos y Posicionamiento Absoluto

**IMPORTANTE:** No agregues `gloryDiv` o `gloryDivSecundario` a elementos puramente decorativos o estructurales que dependen de `position: absolute` (como overlays, efectos de fondo, iconos flotantes).

**¿Por qué?**
El editor de GBN inyecta estilos de control (como `position: relative` y pseudo-elementos `::after` para asegurar áreas de click) que pueden romper tu layout absoluto, haciendo que los overlays colapsen (height: 0) o se muevan de lugar.

```html
<!-- MAL: El editor romperá el position: absolute -->
<div gloryDivSecundario class="overlay-absoluto"></div>

<!-- BIEN: Elemento estático, el editor no lo toca -->
<div class="overlay-absoluto"></div>
```

## 5. Especificidad de Estilos del Tema (Theme Settings)

**Problema:** Los estilos globales del tema (color de texto, fuentes, etc.) pueden sobrescribir tus clases personalizadas si tienen mayor especificidad.

**Solución:** GBN utiliza `:where()` en sus selectores base para reducir su especificidad a 0. Esto permite que tus clases CSS personalizadas siempre ganen sin necesidad de usar `!important`.

```css
/* GBN Base (Especificidad 0) */
:where([data-gbn-root]) p {
    color: var(--gbn-text-color);
}

/* Tu Clase (Especificidad 1) - GANA SIEMPRE */
.mi-clase {
    color: red;
}
```

Si notas que un estilo del tema está "ganando" indebidamente, verifica que el selector en `theme-styles.css` esté envuelto en `:where()`.

## 6. Diagnóstico de Problemas Comunes

-   **El estilo inline desaparece al recargar:** Hay una configuración guardada (preset) que sobrescribe lo leído del HTML. Limpia los presets del bloque o usa clases CSS.
-   **El estilo del HTML se ignora:** GBN lee el preset guardado primero. Si quieres resetear, edita el bloque en el panel y guarda de nuevo.
-   **El estilo no se aplica:** Verifica si hay una regla `!important` o si el panel de GBN tiene un valor configurado que está sobrescribiendo tu clase.
-   **Overlays o elementos absolutos rotos en el editor:** Verifica si tienen `gloryDivSecundario` innecesariamente. Quítalo si no es contenido editable.
-   **Flash de contenido sin estilo:** Asegúrate de que tus clases críticas estén cargadas en el `<head>` o en el bloque `<style>` del template.
-   **El panel no muestra el valor actual:** GBN intenta sincronizar desde `getComputedStyle`. Si el valor viene de una clase CSS, el panel lo mostrará pero al editarlo se guarda como inline.

## 7. Uso Manual de Componentes en PHP

Para utilizar componentes de GBN directamente en archivos PHP (fuera del editor visual), se deben usar los atributos correspondientes.

**Mejora de Inferencia (v6.5):**
Ya no es necesario duplicar el contenido del texto ni la etiqueta en el atributo `opciones`. GBN ahora infiere automáticamente:
- `texto`: Del `innerHTML` del elemento.
- `tag`: Del `tagName` del elemento (ej: `h1`, `p`, `div`).

**Ejemplo Texto (Simplificado):**
```html
<!-- GBN detectará automáticamente que es un H1 y que el texto es "Mi Título" -->
<h1 gloryTexto>Mi Título</h1>
```

**Ejemplo Botón (Simplificado):**
```html
<!-- Solo necesitas especificar las opciones que NO son contenido -->
<a href="#" gloryButton class="btn" opciones="variant: 'primary'">Click</a>
```

> [!NOTE]
> Si necesitas forzar un valor diferente al del HTML inicial, puedes seguir usando `opciones="texto: 'Nuevo Valor'"`.

---
*Basado en `Glory/src/Gbn/reglas.md` y `plan.md`.*
