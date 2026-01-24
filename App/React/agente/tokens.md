# Sistema de Tokens CSS - Nakomi

> Guía de uso de variables CSS para mantener consistencia visual en el proyecto.

## 📋 Índice

- [Colores](#colores)
- [Tipografía](#tipografía)
- [Espaciado](#espaciado)
- [Radios](#radios)
- [Sombras](#sombras)
- [Transiciones](#transiciones)
- [Contenedores](#contenedores)

---

## Colores

### Fondos

| Variable                   | Valor     | Uso                                    |
| -------------------------- | --------- | -------------------------------------- |
| `--nakomi-fondoPrincipal`  | `#090909` | Fondo principal de la página           |
| `--nakomi-fondoSecundario` | `#0c0c0c` | Fondos de tarjetas, secciones alternas |
| `--nakomi-fondoTerciario`  | `#151515` | Fondos de dropdowns, modales           |
| `--nakomi-fondoHover`      | `#1e1e1e` | Estado hover de elementos              |

### Acento

| Variable               | Valor     | Uso                                    |
| ---------------------- | --------- | -------------------------------------- |
| `--nakomi-acento`      | `#60a5fa` | Color principal de acción (azul claro) |
| `--nakomi-acentoHover` | `#3b82f6` | Estado hover del color acento          |

### Bordes

| Variable                  | Valor     | Uso                             |
| ------------------------- | --------- | ------------------------------- |
| `--nakomi-bordePrincipal` | `#1a1a1a` | Bordes visibles normales        |
| `--nakomi-bordeSutil`     | `#222`    | Bordes muy sutiles, separadores |

### Textos

| Variable                    | Valor     | Uso                                    |
| --------------------------- | --------- | -------------------------------------- |
| `--nakomi-textoActivo`      | `#f5f5f5` | Texto principal, títulos (casi blanco) |
| `--nakomi-textoNormal`      | `#e0e0e0` | Texto de párrafos, contenido normal    |
| `--nakomi-textoSecundario`  | `#a0a0a0` | Texto secundario, descripciones        |
| `--nakomi-textoApagado`     | `#808080` | Texto menos importante                 |
| `--nakomi-textoMuyApagado`  | `#606060` | Texto muy sutil, fechas                |
| `--nakomi-textoIndice`      | `#505050` | Números de índice, decorativo          |
| `--nakomi-textoPlaceholder` | `#404040` | Placeholders de inputs                 |

### Colores Semánticos

Para feedback de estado (éxito, advertencia, error, información):

```css
/* Éxito (verde) */
--nakomi-exito: #4ade80;
--nakomi-exitoFondo: rgba(74, 222, 128, 0.1);
--nakomi-exitoBorde: rgba(74, 222, 128, 0.2);
--nakomi-exitoSecundario: #22c55e;

/* Advertencia (amarillo) */
--nakomi-warning: #eab308;
--nakomi-warningFondo: rgba(234, 179, 8, 0.1);
--nakomi-warningBorde: rgba(234, 179, 8, 0.2);

/* Error (rojo) */
--nakomi-error: #ef4444;
--nakomi-errorFondo: rgba(239, 68, 68, 0.1);
--nakomi-errorBorde: rgba(239, 68, 68, 0.2);

/* Información (azul) */
--nakomi-info: #3b82f6;
--nakomi-infoFondo: rgba(59, 130, 246, 0.1);
--nakomi-infoBorde: rgba(59, 130, 246, 0.2);
```

### Superposiciones

| Variable                            | Valor                       | Uso                  |
| ----------------------------------- | --------------------------- | -------------------- |
| `--nakomi-superposicionClara`       | `rgba(255, 255, 255, 0.03)` | Hover muy sutil      |
| `--nakomi-superposicionMuyClara`    | `rgba(255, 255, 255, 0.01)` | Casi invisible       |
| `--nakomi-superposicionSutil`       | `rgba(255, 255, 255, 0.06)` | Hover normal         |
| `--nakomi-superposicionMedia`       | `rgba(255, 255, 255, 0.1)`  | Elementos destacados |
| `--nakomi-superposicionMedioOscuro` | `rgba(0, 0, 0, 0.3)`        | Overlay medio        |
| `--nakomi-superposicionOscuro`      | `rgba(0, 0, 0, 0.6)`        | Backdrop de modales  |

---

## Tipografía

### Familias

```css
--nakomi-fuentePrincipal: "CursorGothic", "CursorGothic Fallback", system-ui, Helvetica Neue, Helvetica, Arial, sans-serif;
--nakomi-fuenteDisplay: "CursorGothic", var(--nakomi-fuentePrincipal);
--nakomi-fuenteMono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Uso recomendado:**
- `fuentePrincipal`: Todo el contenido general
- `fuenteDisplay`: Títulos grandes, branding
- `fuenteMono`: Código, precios, números

---

## Espaciado

Sistema de 8px base:

| Variable              | Valor  | Uso                      |
| --------------------- | ------ | ------------------------ |
| `--nakomi-espacioXs`  | `4px`  | Espacios mínimos         |
| `--nakomi-espacioSm`  | `8px`  | Entre elementos pequeños |
| `--nakomi-espacioMd`  | `16px` | Padding estándar         |
| `--nakomi-espacioLg`  | `24px` | Padding de secciones     |
| `--nakomi-espacioXl`  | `32px` | Separación de bloques    |
| `--nakomi-espacio2xl` | `48px` | Márgenes grandes         |
| `--nakomi-espacio3xl` | `64px` | Separación de secciones  |

---

## Radios

| Variable             | Valor    | Uso                    |
| -------------------- | -------- | ---------------------- |
| `--nakomi-radioXs`   | `2px`    | Esquinas muy sutiles   |
| `--nakomi-radioSm`   | `4px`    | Botones pequeños, tags |
| `--nakomi-radioMd`   | `6px`    | Tarjetas, inputs       |
| `--nakomi-radioLg`   | `8px`    | Modales, contenedores  |
| `--nakomi-radioXl`   | `12px`   | Elementos destacados   |
| `--nakomi-radioFull` | `9999px` | Círculos, pills        |

---

## Sombras

```css
--nakomi-sombraSutil: 0 1px 2px rgba(0, 0, 0, 0.3);
--nakomi-sombraMd: 0 4px 12px rgba(0, 0, 0, 0.4);
--nakomi-sombraLg: 0 10px 40px rgba(0, 0, 0, 0.5);
--nakomi-sombraDropdown: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
```

---

## Transiciones

| Variable                    | Valor        | Uso                  |
| --------------------------- | ------------ | -------------------- |
| `--nakomi-transicionRapida` | `150ms ease` | Hovers, estados      |
| `--nakomi-transicionNormal` | `250ms ease` | Cambios de contenido |
| `--nakomi-transicionLenta`  | `400ms ease` | Modales, animaciones |

---

## Contenedores

```css
--nakomi-anchoMaximo: 1300px;    /* Ancho máximo del contenido */
--nakomi-anchoContenido: 900px;  /* Ancho de texto legible */
```

---

## Ejemplo de Uso

```css
/* ✅ CORRECTO - Usa variables */
.tarjeta {
    background-color: var(--nakomi-fondoSecundario);
    border: 1px solid var(--nakomi-bordeSutil);
    border-radius: var(--nakomi-radioMd);
    padding: var(--nakomi-espacioMd);
    color: var(--nakomi-textoNormal);
    transition: border-color var(--nakomi-transicionRapida);
}

.tarjeta:hover {
    border-color: var(--nakomi-bordePrincipal);
}

/* ❌ INCORRECTO - Valores hardcodeados */
.tarjeta {
    background-color: #0c0c0c;
    border: 1px solid #222;
    border-radius: 6px;
    padding: 16px;
    color: #e0e0e0;
    transition: border-color 150ms ease;
}
```

---

## Gradientes Especiales

```css
/* Avatar placeholder */
--nakomi-gradienteAvatar: linear-gradient(135deg, #3b82f6, #8b5cf6);
```

---

*Última actualización: Fase 8 de refactorización*
