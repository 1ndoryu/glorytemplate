<?php
$usuarioId = get_current_user_id();

?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Source+Sans+3:wght@200..900&display=swap');
    </style>
    <!-- Assets encolados por AssetManager: GSAP y Highlight.js (controlados por features) -->
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <!-- QQ94: Favicon personalizado antes de wp_head para evitar que WP lo sobreescriba -->
    <?php $faviconVer = filemtime(get_template_directory() . '/App/Assets/images/favicon.svg'); ?>
    <link rel="icon" type="image/svg+xml" href="<?php echo esc_url(get_template_directory_uri() . '/App/Assets/images/favicon.svg?v=' . $faviconVer); ?>">
    <link rel="shortcut icon" href="<?php echo esc_url(get_template_directory_uri() . '/App/Assets/images/favicon.svg?v=' . $faviconVer); ?>">
    <?php wp_head(); ?>
</head>

<?php

?>


<body>
    <div id="loadingBar"></div>
    
    
    <?php

    ?>
    <main id="main" class="main">