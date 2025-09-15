*ajustes a la plantilla principal*

- [ ] pasar nav-title a navTitle
- [ ] pasar main-menu a mainMenu
- [ ] pasar theme-toggle a themeToggle
- [ ] pasar glory-themeToggle a gloryThemeToggle
- [ ] colocar 

.gloryThemeToggle {
        color: var(--text);
    background: var(--card-bg);
    border: var(--borde);
    width: 40px;
    height: 40px;
    padding: 0px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
} en init

- [ ] borrar <?php echo ThemeToggle::render(); ?> de header.php
- [ ] crear fonts.css
- [ ] nuevos controles 
GloryFeatures::enable('queryProfiler');
GloryFeatures::disable('queryProfilerLogs'); 