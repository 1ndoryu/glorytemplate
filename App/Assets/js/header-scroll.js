// Header scroll effect
// Agrega clase 'scrolled' al header cuando el usuario hace scroll
document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('.cosmoHeader');
    if (!header) return;

    var scrollThreshold = 50; // Pixeles de scroll antes de activar el efecto

    function handleScroll() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    // Ejecutar al cargar por si ya hay scroll
    handleScroll();

    // Listener optimizado con passive para mejor performance
    window.addEventListener('scroll', handleScroll, {passive: true});
});
