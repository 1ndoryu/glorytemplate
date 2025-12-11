# Protocolo de Desarrollo y Conducta (v2.0)

## 1. Idioma y Comunicación
- **Idioma obligatorio**: Español en toda comunicación.
- **Ante la duda, preguntar**: Si existe ambigüedad en los requisitos, DETENTE y pregunta antes de escribir código.
- **Sin emojis**: Prohibido el uso de emojis en código y comentarios (causan problemas de encoding).

## 2. Estándares de Código
- **Nomenclatura**: `camelCase` para variables/funciones, `PascalCase` para componentes/clases.
- **Código moderno y limpio**: Priorizar legibilidad sobre cleverness.

---

## 3. ARQUITECTURA Y SOLID (CRÍTICO - CUMPLIMIENTO OBLIGATORIO)

**Esta sección es de máxima prioridad. Violarla es inaceptable.**

### 3.1 Límites de Tamaño de Archivo

| Tipo de Archivo       | Máximo de Líneas | Acción si se excede                   |
| --------------------- | ---------------- | ------------------------------------- |
| Componente React      | 150 líneas       | Dividir en subcomponentes             |
| Hook personalizado    | 80 líneas        | Extraer lógica a funciones auxiliares |
| Archivo de utilidades | 100 líneas       | Crear módulos separados por dominio   |
| Archivo de estilos    | 200 líneas       | Dividir por sección/componente        |

**ANTES de añadir código a un archivo existente, VERIFICA su tamaño actual.**

### 3.2 Single Responsibility Principle (SRP)
- **UN componente = UNA responsabilidad**.
- **Señales de violación**:
  - El componente tiene más de 3 `useState`.
  - El componente hace fetch de datos Y los renderiza.
  - El nombre del componente usa "And" o "With" (ej: `FormAndValidation`).
- **Solución**: Extraer lógica a hooks personalizados, crear componentes contenedor/presentacional.

### 3.3 Open/Closed Principle (OCP)
- Diseñar componentes que se extiendan mediante props, no modificando el código fuente.
- Usar composición sobre herencia.

### 3.4 Liskov Substitution Principle (LSP)
- Los componentes hijos deben poder sustituir a sus padres sin romper la aplicación.

### 3.5 Interface Segregation Principle (ISP)
- Props específicas y mínimas. No pasar objetos completos si solo se necesitan 2 propiedades.
- Definir interfaces/tipos TypeScript granulares.

### 3.6 Dependency Inversion Principle (DIP)
- Depender de abstracciones (interfaces, tipos), no de implementaciones concretas.
- Inyectar dependencias mediante props o contexto.

---

## 4. ESTILOS CSS (CRÍTICO - CUMPLIMIENTO OBLIGATORIO)

**PROHIBIDO el CSS hardcodeado. Sin excepciones.**

### 4.1 Reglas Absolutas
- **TODOS los estilos van en archivos CSS centralizados** (ej: `init.css`, `variables.css`).
- **PROHIBIDO**: `style={{color: '#ff0000'}}` o `style={{marginTop: '20px'}}`.
- **PROHIBIDO**: Clases CSS definidas inline o en el mismo archivo del componente.
- **OBLIGATORIO**: Usar variables CSS para colores, espaciados, tipografía.

### 4.2 Estructura de Estilos
```
styles/
  variables.css    // Variables CSS (colores, espaciados, fuentes)
  init.css         // Estilos base y reset
  components/      // Estilos por componente (si es necesario)
```

### 4.3 Antes de Crear un Nuevo Estilo
1. **BUSCAR** si ya existe una clase o variable que cumpla la necesidad.
2. **REUTILIZAR** clases existentes siempre que sea posible.
3. **CREAR** nuevas clases solo si no existe alternativa, y hacerlo en el archivo CSS correspondiente.

---

## 5. React: Reglas Específicas

### 5.1 Identificadores Obligatorios
- **TODO elemento contenedor debe tener un `id` único y descriptivo**.
- Formato: `id="seccion-nombre"` o `id="componente-nombre"`.
- Ejemplo: `<div id="contact-form-container">`, `<section id="hero-section">`.

### 5.2 Estructura de Componentes

```tsx
// CORRECTO: Componente pequeño y enfocado
const UserAvatar = ({ imageUrl, userName }: UserAvatarProps) => {
  return (
    <div id="user-avatar-container" className="avatar-wrapper">
      <img src={imageUrl} alt={userName} className="avatar-image" />
    </div>
  );
};

// INCORRECTO: Componente que hace demasiado
const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // ... 200 líneas más de lógica mezclada
};
```

---

## 6. Integridad en la Edición

- **PROHIBIDO omitir código**: Nunca usar `// ...resto del código` o similares.
- **Ediciones atómicas**: Preferir cambios pequeños y verificables.
- **Verificación post-edición**: Después de cada edición, revisar que el archivo quedó íntegro.

---

## 7. Mentalidad Anti-Sesgo

- **Leer antes de escribir**: Comprender el código existente antes de modificarlo.
- **Cero suposiciones**: Si no estás seguro de cómo funciona algo, INVESTIGA primero.
- **Comentarios útiles**: Explicar el "por qué", no el "qué".
- **Documentar errores**: Si cometes un error, dejarlo documentado como advertencia.

---

## 8. Documentación

- **Sincronización obligatoria**: Actualizar archivos `.md` de documentación después de cada cambio significativo.
- **Mantener comentarios actualizados**: Los comentarios son parte del código.

---

## 9. Uso de Terminal

- **Preferir evitar comandos de terminal** salvo que sea estrictamente necesario.
- **Búsquedas específicas**: Evitar búsquedas amplias que devuelvan demasiados resultados.
