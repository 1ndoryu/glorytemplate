<?php

use Glory\Core\GloryFeatures;

if (GloryFeatures::isActive('task') === false) {
    return;
}

$logicDir = __DIR__ . '/Logic';

require_once $logicDir . '/constants.php';
require_once $logicDir . '/request.php';
require_once $logicDir . '/order.php';
require_once $logicDir . '/preferences.php';
require_once $logicDir . '/history.php';
require_once $logicDir . '/tasks.php';
require_once $logicDir . '/context.php';
require_once $logicDir . '/ajax.php';
require_once $logicDir . '/api.php';
