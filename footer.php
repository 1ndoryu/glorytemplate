<?php

?>

</main>
<?php
// GBN Footer Logic
$gbnActive = \Glory\Gbn\GbnManager::isBuilderActive() || (class_exists(\Glory\Core\GloryFeatures::class) && \Glory\Core\GloryFeatures::isActive('gbn', 'glory_gbn_activado'));

if ($gbnActive && class_exists(\Glory\Gbn\Services\TemplateService::class)) {
    echo '<footer id="gbn-footer" class="gbn-footer-wrapper">';
    echo \Glory\Gbn\Services\TemplateService::getFooterContent();
    echo '</footer>';
}
?>

<?php wp_footer(); ?>
</body>

</html>