<?php

function formTareaEstilo()
{
    ob_start();
?>
    <style>

    </style>
<?
    return ob_get_clean();
}
