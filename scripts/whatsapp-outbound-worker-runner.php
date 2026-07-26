<?php

/* [267A-5] Un ciclo acotado para systemd/Cron; nunca mantiene un proceso PHP colgado. */
require_once dirname(__DIR__, 5) . '/wp-load.php';

\App\Services\WhatsAppOutboundWorker::runCron();
