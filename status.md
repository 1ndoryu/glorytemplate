### Principios Fundamentales de Desarrollo - Reglas Generales, principalmente para glory

1.  **Código Simple y Legible**
    Prioriza la claridad y la simplicidad por encima de todo. Un código fácil de entender es más fácil de mantener, depurar y evolucionar. Aplica estrictamente el principio DRY (Don't Repeat Yourself) para evitar la redundancia. _Osea por favor archivos pequeños con responsabilidades unicas_

2.  **Responsabilidad Única (SRP)**
    Cada componente (clase, función, módulo) debe tener una única razón para cambiar. Esto crea un sistema modular, más fácil de probar y menos propenso a que un cambio genere errores en cascada.

3.  **Estructura Lógica y Jerárquica**
    La organización de los archivos debe reflejar la arquitectura de la aplicación. Una estructura clara e intuitiva permite a los desarrolladores navegar el proyecto y entender la relación entre sus componentes rápidamente. _Osea clases o archivo con diferentes niveles de responsabilidad no deben ir al mismo nivel_

4.  **Estándares de Código Estrictos**
    Define una guía de estilo única (nomenclatura, formato, etc.) y aplícala de forma automatizada siempre que sea posible. La consistencia en el código reduce la carga cognitiva y elimina las discusiones estilísticas.

5.  **Pruebas Automatizadas como Requisito** (no aplica aca)
    Considera las pruebas una parte integral de la funcionalidad, no un añadido posterior. Un buen conjunto de pruebas garantiza que el sistema funciona como se espera y permite refactorizar o añadir cambios futuros con confianza.

6.  **Comentarios para el "Porqué", no para el "Qué"**
    El código debe ser tan claro que se explique por sí mismo. Reserva los comentarios exclusivamente para justificar decisiones de diseño complejas o soluciones no evidentes que un futuro desarrollador necesitaría entender.

7.  **Diseño Desacoplado y Basado en Contratos**
    Diseña componentes que interactúen a través de interfaces o APIs bien definidas (contratos). Esto reduce la dependencia entre ellos, permitiendo que sean modificados o reemplazados de forma segura sin afectar el resto del sistema. _Piensalo como piezas de lego_

8.  **Logging Estratégico y Estructurado** 
    Implementa un sistema de logs desde el inicio como una característica fundamental. Utiliza logs estructurados (ej. en formato JSON) con niveles de severidad claros para hacer el sistema observable y facilitar drásticamente la depuración. _Cada funcionalidad debe tener un archivo de log por separado, siempre un log central que agrupe todo_

9.  Para este caso el codigo (dentro de glory debe ser en español y camelCase)

# Tareas

1. Estar seguros de que cuando esta en modo AssetManager::setGlobalDevMode(true); todas las sincronizaciones se hagan automaticamente a recargar.
2. Establecer un logo por defecto, he agregado dos logos aca Glory\assets\images\elements, usa el white.
3. Crear un menu por defecto, inicio, example, example, example, example, automaticamente en caso de que no exista nada en el menu. 
4. las opciones de script de ajaxNav , deben configurarse desde el archivo del tema en config, no desde glory
'enabled'            => true,
'contentSelector'    => '#main',
'mainScrollSelector' => '#main',
'loadingBarSelector' => '#loadingBar',

(ya parece que se hizo todo lo anterior), solo falta un ajuste

<img src="https://i0.wp.com/glory-template.local/wp-content/themes/glory/Glory/assets/images/elements/whiteExampleLogo.png?strip=all" alt="Glory Template"> cuando intenta cargar el logo, lo carga con el cdn, no debe usar el cdn manual cuando esta definido local como true