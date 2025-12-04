# Documentación GBN: Manejo de Estilos y Construcción de Páginas

> [!IMPORTANT]
> Esta documentación resume los puntos clave para trabajar con estilos en GBN y evitar conflictos entre el código manual y el constructor visual. Esta en construcción, cada nuevo aprendizaje importante debe documentarse aca.

## 1. Regla de Oro: Control del Atributo `style`

**GBN tiene control total sobre el atributo `style` de los elementos marcados con `gloryDiv` o `gloryDivSecundario`.**

### El Problema
Si escribes estilos en línea (inline styles) directamente en el HTML PHP:
```html
<!-- MAL: GBN borrará esto al iniciar -->
<div gloryDiv style="background-color: red;">...</div>
```
GBN, al inicializarse, regenera el atributo `style` basándose en su configuración interna (JSON). Si la configuración no "sabe" que debe haber un color rojo, **borrará tu estilo inline**.

### La Solución
Para estilos estáticos o estructurales que no necesitan ser editados por el usuario final a través del panel, **usa Clases CSS**.

```html
<!-- BIEN: GBN respeta las clases -->
<div gloryDiv class="mi-clase-roja">...</div>

<style>
    .mi-clase-roja {
        background-color: red;
    }
</style>
```

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

-   **La imagen/estilo desaparece al cargar:** Probablemente está como estilo inline en un bloque `gloryDiv`. Muévelo a una clase CSS.
-   **El estilo no se aplica:** Verifica si hay una regla `!important` o si el panel de GBN tiene un valor configurado que está sobrescribiendo tu clase.
-   **Overlays o elementos absolutos rotos en el editor:** Verifica si tienen `gloryDivSecundario` innecesariamente. Quítalo si no es contenido editable.
-   **Flash de contenido sin estilo:** Asegúrate de que tus clases críticas estén cargadas en el `<head>` o en el bloque `<style>` del template.

---
*Basado en `Glory/src/Gbn/reglas.md` y `plan.md`.*
