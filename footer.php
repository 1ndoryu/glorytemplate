<?php

use Glory\Core\GloryFeatures;
use Glory\Gbn\Services\TemplateService;

?>

</main>

<?php
// Fase 15: Verificar si GBN está activado
$useGbnFooter = false;
if (class_exists(GloryFeatures::class) && method_exists(GloryFeatures::class, 'isActive')) {
    $useGbnFooter = GloryFeatures::isActive('gbn', 'glory_gbn_activado');
}

// Si GBN está activo, usar footer GBN (guardado o por defecto)
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
// Si GBN no está activo, el footer queda vacío (comportamiento original de Glory)
?>

<?php wp_footer(); ?>
</body>

</html>
