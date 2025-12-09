<?php

use Glory\Core\GloryFeatures;
use Glory\Gbn\Services\TemplateService;

// Fase 15: Verificar si GBN esta activado
$useGbnFooter = false;
if (class_exists(GloryFeatures::class) && method_exists(GloryFeatures::class, 'isActive')) {
    $useGbnFooter = GloryFeatures::isActive('gbn', 'glory_gbn_activado');
}

// Si GBN esta activo, usar footer GBN (guardado o por defecto)
// El footer se renderiza DENTRO del main para que los container queries funcionen
if ($useGbnFooter && class_exists(TemplateService::class)) {
    $gbnFooter = TemplateService::renderFooter();

    if ($gbnFooter !== false) {
        // Hay template guardado, usarlo
        echo $gbnFooter;
    } else {
        // No hay template guardado, usar el template por defecto de GBN
        echo TemplateService::getDefaultFooterTemplate();
    }
}
// Si GBN no esta activo, el footer queda vacio (comportamiento original de Glory)
?>

</main>


<script>
    // Inicializar iconos despues de que Lucide cargue
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
    // Re-inicializar en navegacion AJAX
    document.addEventListener('gloryRecarga', function() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
</script>

<?php wp_footer(); ?>
</body>

</html>