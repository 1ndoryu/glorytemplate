<?php

get_header();
?>

<main id="primary" class="site-main">
    <?php
    if (have_posts()) :
        while (have_posts()) :
        endwhile;

    else :
    endif;
    ?>

</main>