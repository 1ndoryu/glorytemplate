<?php
/* sentinel-disable-file limite-lineas limite-lineas-nivel-2 limite-lineas-nivel-3 limite-lineas-nivel-4
 * Justificación: motor central del agente con ~30 action cases en ejecutarAccion()
 * — equivalente a un REST controller con muchas rutas. Dividir requirería extraer
 * AgentActionExecutor con toda la inyección de dependencias; pendiente como tarea separada. */

namespace App\Services;

use App\Repository\TareasRepository;
use App\Repository\HabitosRepository;
use App\Repository\NotasRepository;

/* [109A+109B] Motor PHP para procesar mensajes del chatbot desde cualquier canal (app, whatsapp).
 * Usa LLMProviderService + MemPalaceService + AgentChatService.
 * El frontend React sigue manejando su propio flujo LLM; este procesador es para canales server-side.
 * Canal 'whatsapp': responde directamente via WacliService sin aprobación para acciones básicas.
 * Canal 'app': crea propuestas aprobables (comportamiento idéntico al frontend).
 * Gotcha: crear_habito/eliminar_habito no se ejecutan directamente — se crean como propuestas.
 */
class AgentChatProcessor
{
    private const MAX_HISTORIAL            = 20;    // mensajes recientes que van al LLM
    private const MAX_CONTEXT_TAREAS      = 30;
    private const MAX_CONTEXT_NOTAS       = 10;    // notas que se incluyen en el contexto
    private const MAX_CONTEXT_RECORDAT    = 15;    // recordatorios activos en contexto
    /* [115A-1] Compactación por tamaño de contexto (chars totales del historial).
     * Threshold configurable via WP option glory_chatbot_compaction_chars (default 8000).
     * COMPACTION_KEEP_CHARS: chars del historial reciente que se conservan tras compactar.
    * Proveedor/modelo leídos de user_meta con fallback global y salto de modelo en LLMProviderService. */
    private const COMPACTION_KEEP_CHARS    = 4000;  // chars de historial reciente a conservar
    /* [115A-3] Contexto maestro: texto persistente por usuario, modificable por el agente.
     * Si supera MASTER_CONTEXT_MAX_CHARS (~9000 tokens), se compacta automáticamente. */
    private const MASTER_CONTEXT_MAX_CHARS = 36000; // ~9000 tokens → compactar contexto maestro
    /* [126A-1] Clave user_meta para persistir el proyecto activo del usuario.
     * Se consulta en buildContexto(), en las acciones de proyecto y como default de solicitar_opencode. */
    private const ACTIVE_PROJECT_META_KEY = 'glory_active_opencode_project';

    private AgentChatService $chat;
    private MemPalaceService  $mempalace;
    /* [115A-context] Session activa; se establece en procesar() para que los action handlers
     * puedan acceder al session_id sin recibirlo como parámetro adicional. */
    private string $activeSessionId = 'default';
    /* [125A-9] Mensaje actual; permite resolver referencias naturales cuando el LLM
     * entrega IDs incorrectos o incompletos en acciones críticas. */
    private string $activeUserMessage = '';

    public function __construct()
    {
        $this->chat      = new AgentChatService();
        $this->mempalace = new MemPalaceService();
    }

    /**
     * Procesa un mensaje del usuario y retorna la respuesta.
     * @param int    $userId     WP user ID
     * @param string $sessionId  ID de sesión ('default', 'whatsapp_NUMERO', etc.)
     * @param string $mensaje    Mensaje del usuario
     * @param string $canal      'app' | 'whatsapp'
     * @return array{respuesta: string, acciones: array, ejecutadas: array}
     */
    /**
     * Procesa un mensaje del usuario y retorna la respuesta.
     * @param int        $userId     WP user ID
     * @param string     $sessionId  ID de sesión ('default', 'whatsapp_NUMERO', etc.)
     * @param string     $mensaje    Mensaje del usuario (o texto de transcripción de audio)
     * @param string     $canal      'app' | 'whatsapp'
     * @param array|null $media      Opcional: ['mimeType' => string, 'base64' => string] para visión
     * @return array{respuesta: string, acciones: array, ejecutadas: array}
     */
    public function procesar(int $userId, string $sessionId, string $mensaje, string $canal = 'app', ?array $media = null): array
    {
        $this->activeSessionId = $sessionId;
        $this->activeUserMessage = $mensaje;
        $historial       = $this->chat->listarMensajes($userId, $sessionId, self::MAX_HISTORIAL);
        /* [SEC-004] Verificar privacidad una vez; buildContexto() lo usa para anonimizar datos,
         * y buildSystemPrompt() necesita saberlo para instruir al LLM. */
        $privacyMode     = (bool) get_user_meta($userId, 'glory_chatbot_privacy_mode', true);
        $accionesCodigoPermitidas = $this->puedeUsarAccionesCodigo($userId);
        $contexto        = $this->buildContexto($userId, $canal, $privacyMode, $accionesCodigoPermitidas);
        $memorias        = $this->mempalace->search($mensaje !== '' ? $mensaje : 'imagen recibida', $userId);
        $contextoMaestro = $this->getMasterContext($userId);

        /* [116A-2] Pre-calcular stats del historial para inyectarlas en el system prompt.
         * Así el LLM ya tiene el dato real y puede responder sin llamar reportar_contexto. */
        global $wpdb;
        $tablaMsg    = \App\Database\Schema::getTableName('agent_chat_messages');
        $ctxRows     = $wpdb->get_results($wpdb->prepare(
            "SELECT contenido FROM {$tablaMsg} WHERE user_id = %d AND session_id = %s",
            $userId, $sessionId
        ), ARRAY_A);
        $ctxChars    = array_sum(array_map(fn($r) => strlen((string)$r['contenido']), $ctxRows));
        $ctxMsgs     = count($ctxRows);
        $ctxLimit    = $this->compactionCharsThreshold();
        $ctxPct      = $ctxLimit > 0 ? (int) round($ctxChars / $ctxLimit * 100) : 0;
        $ctxTokens   = (int) round($ctxChars / 4);
        $limTokens   = (int) round($ctxLimit / 4);
        $statsHistorial = ['chars' => $ctxChars, 'tokens' => $ctxTokens, 'msgs' => $ctxMsgs, 'pct' => $ctxPct, 'limit_chars' => $ctxLimit, 'limit_tokens' => $limTokens];

        $systemMsg       = $this->buildSystemPrompt($contexto, $memorias, $canal, $contextoMaestro, '', '', $statsHistorial, $privacyMode, $accionesCodigoPermitidas);

        /* Construir messages para el LLM */
        $messages = [['role' => 'system', 'content' => $systemMsg]];
        foreach ($historial as $m) {
            $rol = $m['rol'] === 'usuario' ? 'user' : 'assistant';
            $messages[] = ['role' => $rol, 'content' => $m['contenido']];
        }

        /* [115A-5] Si hay imagen, usar content array multimodal para visión */
        $esImagen = $media !== null && str_starts_with((string)($media['mimeType'] ?? ''), 'image/') && !empty($media['base64']);
        if ($esImagen) {
            $textoUsuario = $mensaje !== '' ? $mensaje : 'El usuario envió esta imagen.';
            $messages[] = ['role' => 'user', 'content' => [
                ['type' => 'text', 'text' => $textoUsuario],
                ['type' => 'image_url', 'image_url' => ['url' => 'data:' . $media['mimeType'] . ';base64,' . $media['base64']]],
            ]];
        } else {
            $messages[] = ['role' => 'user', 'content' => $mensaje];
        }

        /* Llamar al LLM con proveedor/modelo configurados (no hardcodeados).
         * Para visión forzamos un modelo multimodal de Groq. */
        $llm = $this->resolverConfigLLM($userId);
        if ($esImagen) {
            $llm = ['proveedor' => 'groq', 'modelo' => 'meta-llama/llama-4-scout-17b-16e-instruct'];
        }
        /* Reconstruir system prompt incluyendo nombre del modelo y stats reales del historial */
        $messages[0]['content'] = $this->buildSystemPrompt($contexto, $memorias, $canal, $contextoMaestro, $llm['proveedor'], $llm['modelo'], $statsHistorial, $privacyMode, $accionesCodigoPermitidas);
        $llmResult = (new LLMProviderService())->enviarChat(
            $messages,
            $llm['proveedor'],
            $llm['modelo'],
            ['temperature' => 0.7, 'maxTokens' => 1000]
        );
        $rawContent = (string)($llmResult['contenido'] ?? $llmResult['content'] ?? $llmResult['message'] ?? '');
        $parsed     = $this->parsear($rawContent);

        /* [185A-1] Si el provider/model real difiere del configurado (fallback activo), actualizar
         * messages[0] para que la segunda llamada LLM tenga info correcta del modelo usado. */
        $realProvider = (string)($llmResult['provider'] ?? $llm['proveedor']);
        $realModel    = (string)($llmResult['model'] ?? $llm['modelo']);
        if ($realProvider !== $llm['proveedor'] || $realModel !== $llm['modelo']) {
            error_log('[AgentChatProcessor] Fallback activo: configurado=' . $llm['proveedor'] . '/' . $llm['modelo'] . ' real=' . $realProvider . '/' . $realModel);
            $messages[0]['content'] = $this->buildSystemPrompt($contexto, $memorias, $canal, $contextoMaestro, $realProvider, $realModel, $statsHistorial, $privacyMode, $accionesCodigoPermitidas);
        }

        /* Ejecutar acciones (con retry) */
        $parsed['acciones'] = $this->normalizarAccionesDesdeMensajeUsuario($parsed['acciones'], $mensaje, $canal, $userId);
        $ejecutadas = $this->ejecutarAcciones($userId, $canal, $parsed['acciones']);

        /* [116A-1] Segunda llamada al LLM cuando se ejecutó alguna acción síncrona.
         * Se activa para CUALQUIER acción ejecutada (exito true o false), para que el LLM
         * pueda reportar tanto resultados como fallos en lugar de dejar el anuncio inicial.
         * Las acciones async (solicitar_opencode, continuar_opencode) se excluyen porque
         * el job queda pendiente y la confirmación llega por otra vía. */
        $accionesAsync = ['solicitar_opencode', 'continuar_opencode', 'cancelar_opencode', 'automejora'];
        $hayAccionSincrona = false;
        foreach ($ejecutadas as $ej) {
            if (!in_array($ej['tipo'] ?? '', $accionesAsync, true) || empty($ej['exito'])) {
                $hayAccionSincrona = true;
                break;
            }
        }
        $hayDatosConsulta = $hayAccionSincrona; // alias para compatibilidad con el bloque de abajo
        if ($hayDatosConsulta) {
            $messages[] = ['role' => 'assistant', 'content' => $rawContent];
            $lineasResultados = [];
            foreach ($ejecutadas as $ej) {
                /* Incluir TODAS las acciones (exitosas y fallidas) para que el LLM
                 * pueda reportar errores en lugar de dejar el anuncio como respuesta final. */
                if (!in_array($ej['tipo'] ?? '', $accionesAsync, true) || empty($ej['exito'])) {
                    $lineasResultados[] = ($ej['tipo'] ?? 'accion') . ' → ' . json_encode($ej, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
            }
            $mensajeHerramientas = "[RESULTADOS DE HERRAMIENTAS]\n" . implode("\n", $lineasResultados)
                . "\n\nIMPORTANTE: los campos 'id', 'texto', 'exito' de los resultados son los valores REALES del servidor. "
                . "Úsalos en tu respuesta (p.ej. el id real de la tarea creada), NO los valores que generaste antes. "
                . "Responde al usuario con los datos anteriores en formato JSON: {\"respuesta\": \"tu mensaje\", \"acciones\": []}";
            $messages[] = ['role' => 'user', 'content' => $mensajeHerramientas];
            $llmResult2  = (new LLMProviderService())->enviarChat($messages, $llm['proveedor'], $llm['modelo'], ['temperature' => 0.7, 'maxTokens' => 1500]);
            $rawContent2 = (string)($llmResult2['contenido'] ?? $llmResult2['content'] ?? $llmResult2['message'] ?? '');
            $parsed2     = $this->parsear($rawContent2);
            /* Fallback: si parsear() falla (JSON roto por comillas en el contenido de la nota),
             * usar el texto raw directamente — cualquier cosa es mejor que el anuncio original. */
            $respuesta2 = $parsed2['respuesta'] !== '' ? $parsed2['respuesta'] : trim($rawContent2);
            if ($respuesta2 !== '') {
                $parsed['respuesta'] = $respuesta2;
            }
        }

        $parsed['respuesta'] = $this->anotarFallosEnRespuesta($parsed['respuesta'], $ejecutadas);
        $parsed['respuesta'] = $this->asegurarRespuestaOpencodeConSesion($parsed['respuesta'], $ejecutadas);
        $parsed['respuesta'] = $this->asegurarRespuestaAutomejoraPendiente($parsed['respuesta'], $ejecutadas);

        /* [fix-session-confirm] Si el usuario pidió continuar con ses_XXXXX y la respuesta
         * no lo menciona (el LLM lo olvida), inyectarlo para que el usuario sepa qué sesión
         * está reanudando antes de que llegue la notificación del runner. */
        $sesionExplicita = $this->extraerSessionIdExplicito($mensaje);
        if ($sesionExplicita !== '' && !str_contains($parsed['respuesta'], $sesionExplicita)) {
            $parsed['respuesta'] = rtrim($parsed['respuesta'], '.!? ') . " (sesión {$sesionExplicita})";
        }

        /* Persistir mensajes */
        $_ok = $this->chat->guardarMensaje($userId, $sessionId, 'usuario', $mensaje, null, 0);
        $_ok = $this->chat->guardarMensaje($userId, $sessionId, 'asistente', $parsed['respuesta'], $parsed['acciones'], (int)($llmResult['tokensComplecion'] ?? $llmResult['tokens'] ?? 0));

        /* Guardar memorias en MemPalace en background (no bloquea la respuesta) */
        $_ok = $this->guardarMemoria($userId, $mensaje, $parsed['respuesta'], $canal, $sessionId);

        /* Compactar historial si la sesión creció demasiado */
        $this->compactarHistorialSiNecesario($userId, $sessionId);

        return [
            'respuesta' => $parsed['respuesta'],
            'acciones'  => $parsed['acciones'],
            'ejecutadas' => $ejecutadas,
        ];
    }

    /* --- System prompt ------------------------------------------------------ */

    /* [115A-1+115A-3] buildSystemPrompt recibe contextoMaestro (texto persistente del usuario).
     * El contexto maestro se inyecta antes del contexto de tareas/hábitos/notas. */
    private function buildSystemPrompt(string $contexto, string $memorias, string $canal, string $contextoMaestro = '', string $proveedor = '', string $modelo = '', array $statsHistorial = [], bool $privacyMode = false, bool $accionesCodigoPermitidas = false): string
    {
        $instruccionCanal = $canal === 'whatsapp'
            ? "\nEstás respondiendo por WHATSAPP. Sé conciso, sin markdown, sin listas largas. Máximo 3 oraciones por mensaje."
            . "\nLos audios llegan TRANSCRITOS — el texto entre corchetes '[El usuario envió un audio...]' es tu señal de que hubo fallo técnico de transcripción; pide al usuario que lo reenvíe. NUNCA digas 'no puedo procesar audio' — el audio ya viene en texto."
            : '';

        /* [SEC-004] Modo privacidad activado: el contexto muestra datos anonimizados.
         * El LLM debe saber que no es un error — es intencional por privacidad. */
        $instruccionPrivacidad = $privacyMode
            ? "\nMODO PRIVACIDAD ACTIVADO. Los datos de tareas, hábitos y notas aparecen limitados o anonimizados por decisión del usuario. No preguntes por qué faltan detalles — responde con la información disponible. Si el usuario necesita acceder a contenido específico, sugiérele que desactive el modo privacidad en la configuración."
            : '';

        /* [116A-2] Stats del historial inyectados aquí para que el LLM responda sin llamar reportar_contexto.
         * NUNCA estimar manualmente — usar siempre estos datos cuando el usuario pregunte. */
        $bloqueStats = !empty($statsHistorial)
            ? "\nSTATS DE SESIÓN: historial={$statsHistorial['chars']} chars (~{$statsHistorial['tokens']} tokens), {$statsHistorial['msgs']} mensajes, {$statsHistorial['pct']}% del límite de compactación ({$statsHistorial['limit_tokens']} tokens / {$statsHistorial['limit_chars']} chars). Cuando el usuario pregunte cuántos tokens, chars o mensajes hay, responde SIEMPRE con estos datos exactos — NUNCA estimes ni cuentes manualmente."
            : '';

        $bloqueModelo = $modelo !== ''
            ? "\nTu modelo: {$modelo} (proveedor: {$proveedor}). Cuando el usuario pregunte qué modelo eres, puedes decirlo."
            : '';

        /* [116A-1+116A-2] El contexto maestro se embebe directamente en el prompt — NO es una nota.
         * No tiene ID numérico. NUNCA llames leer_nota para él. Si el usuario lo pide, reprodúcelo. */
        /* [SEC-004] Si el usuario activó privacidad, el contexto muestra datos anonimizados */
        $bloqueMaestro = $contextoMaestro !== ''
            ? "\n\n## Contexto personal (permanente — recuerda esto siempre)\n{$contextoMaestro}\n(IMPORTANTE: este bloque NO es una nota, no tiene ID numérico. NUNCA uses leer_nota para el contexto maestro. Ya está aquí — si el usuario pide verlo, reprodúcelo directamente.)"
            : '';

        /* [115A-8] Las memorias ya vienen filtradas semánticamente por MemPalace (top-5 relevantes
         * al mensaje actual). No es un volcado completo — es búsqueda vectorial por relevancia.
         * guardar_memoria solo se usa para hechos NUEVOS que el usuario menciona y que no están
         * en las memorias recuperadas. No repetir lo que ya está en el bloque de memorias. */
        $bloqueMemoria = $memorias !== ''
            ? "\n\n## Memorias relevantes (filtradas por similitud al mensaje actual)\n{$memorias}\n\nEstas memorias ya están filtradas por relevancia. Úsalas para personalizar tu respuesta. Si el usuario menciona algo NUEVO e importante que no está aquí, usa guardar_memoria."
            : "\n\nTienes un sistema de memoria semántica persistente. Si el usuario menciona algo importante y nuevo (nombre real, preferencias de vida, datos personales, metas duraderas), guárdalo con guardar_memoria."
        ;

        /* [125A-11] Las acciones de código/repositorio son admin-only. Usuarios normales
         * pueden usar productividad personal, pero no OpenCode, automejora ni configuración global. */
        $bloqueAccionesCodigo = $accionesCodigoPermitidas ? implode("\n", [
            '- {\"tipo\": \"cambiar_limite_compactacion\", \"parametros\": {\"chars\": 8000}}',
            '- {\"tipo\": \"listar_proyectos\", \"parametros\": {}}',
            '- {\"tipo\": \"listar_ramas\", \"parametros\": {\"proyecto\": \"opcional\"}}',
            '- {\"tipo\": \"cambiar_proyecto\", \"parametros\": {\"proyecto\": \"glorytemplate\"}}',
            '- {\"tipo\": \"solicitar_opencode\", \"parametros\": {\"proyecto\": \"glorytemplate\", \"agente\": \"whatsapp-code\", \"prompt\": \"cambio de codigo solicitado\", \"commit\": true, \"deploy\": false, \"branch\": \"glory-react-logic\", \"reasoning_effort\": \"max\"}}',
            '- {\"tipo\": \"continuar_opencode\", \"parametros\": {\"job_id\": 0, \"mensaje\": \"instruccion real del usuario para OpenCode\"}}',
            '- {\"tipo\": \"actualizar_opencode_allowlist\", \"parametros\": {\"comandos\": [\"git --no-pager*\", \"Test-Path*\"]}}',
            '- {\"tipo\": \"cancelar_opencode\", \"parametros\": {\"job_id\": 123}}',
            '- {\"tipo\": \"automejora\", \"parametros\": {\"prompt\": \"mejora a implementar\", \"riesgo\": \"bajo|medio|alto\"}}',
        ]) : '- Acciones de código, repositorios, OpenCode, automejora y configuración global: NO disponibles para este usuario.';

        $bloqueReglasCodigo = $accionesCodigoPermitidas
            ? "- ACCIONES DE CÓDIGO: usa solicitar_opencode solo para cambios o lectura literal de repositorios, roadmap, commit, push, PR o deploy. Usa listar_proyectos/listar_ramas para consultas rápidas. Usa continuar_opencode para ampliar o reintentar jobs visibles, y actualizar_opencode_allowlist solo si el usuario confirma permisos rechazados. Usa automejora solo cuando pida modificar el propio agente.\n- cambiar_limite_compactacion cambia una opción global: úsala solo si el usuario lo pide explícitamente.\n"
            : "- ACCESO A CÓDIGO/REPOSITORIOS: este usuario no tiene permiso para OpenCode, automejora, proyectos, ramas, deploy, commit, push ni configuración global. Si lo pide, responde brevemente que esa función está restringida a administradores. No emitas acciones de código.\n";

        return "Eres un asistente de productividad integrado en un dashboard personal. Ayudas al usuario a planificar su día, crear tareas y gestionar su productividad.{$instruccionCanal}{$instruccionPrivacidad}{$bloqueStats}{$bloqueModelo}

RESPONDE SIEMPRE en formato JSON con esta estructura exacta:
{\"respuesta\": \"tu mensaje al usuario en español\", \"acciones\": []}

ACCIONES DISPONIBLES:
- {\"tipo\": \"crear_tarea\", \"parametros\": {\"texto\": \"nombre\", \"prioridad\": \"alta|media|baja\", \"urgencia\": \"urgente|normal|chill\"}}
- {\"tipo\": \"completar_tarea\", \"parametros\": {\"id\": 123}}
- {\"tipo\": \"editar_tarea\", \"parametros\": {\"id\": 123, \"texto\": \"nuevo nombre\"}}
- {\"tipo\": \"programar_recordatorio\", \"parametros\": {\"titulo\": \"...\", \"mensaje\": \"...\", \"fecha\": \"ISO8601\", \"recurrence_minutes\": 30, \"channel\": \"whatsapp\"}}
- {\"tipo\": \"listar_recordatorios\", \"parametros\": {}}
- {\"tipo\": \"editar_recordatorio\", \"parametros\": {\"id\": 123, \"fecha\": \"ISO8601\", \"titulo\": \"nuevo titulo\", \"mensaje\": \"nuevo mensaje\", \"recurrence_minutes\": 15}}
- {\"tipo\": \"eliminar_recordatorio\", \"parametros\": {\"id\": 123}}
- {\"tipo\": \"cancelar_todos_recordatorios\", \"parametros\": {}}
- {\"tipo\": \"completar_habito\", \"parametros\": {\"id\": 123}}
- {\"tipo\": \"posponer_habito\", \"parametros\": {\"id\": 123}}
- {\"tipo\": \"completar_subhabito\", \"parametros\": {\"id\": 123, \"subId\": 0}}
- {\"tipo\": \"iniciar_ayuno\", \"parametros\": {\"duracion_horas\": 16, \"hora_ultima_comida\": \"ISO8601 opcional\"}}
- {\"tipo\": \"terminar_ayuno\", \"parametros\": {\"fin\": \"ISO8601 opcional\"}}
- {\"tipo\": \"estado_ayuno\", \"parametros\": {}}
- {\"tipo\": \"registrar_comida\", \"parametros\": {\"descripcion\": \"arepa con queso\", \"calorias\": 500}}
- {\"tipo\": \"resumen_calorias_hoy\", \"parametros\": {}}
- {\"tipo\": \"leer_notas\", \"parametros\": {\"limite\": 10}}
- {\"tipo\": \"leer_nota\", \"parametros\": {\"id\": 38}}
- {\"tipo\": \"crear_nota\", \"parametros\": {\"titulo\": \"...\", \"contenido\": \"...\"}}
- {\"tipo\": \"editar_nota\", \"parametros\": {\"id\": 123, \"contenido\": \"...\", \"titulo\": \"opcional\"}}
- {\"tipo\": \"buscar_nota\", \"parametros\": {\"termino\": \"...\"}}
- {\"tipo\": \"proponer_whatsapp\", \"parametros\": {\"mensaje\": \"texto\", \"to\": \"numero opcional\"}}
- {\"tipo\": \"guardar_memoria\", \"parametros\": {\"contenido\": \"hecho a recordar\", \"categoria\": \"preferencias|hechos|metas|whatsapp\"}}
- {\"tipo\": \"crear_tarea_si_no_existe\", \"parametros\": {\"texto\": \"nombre\", \"prioridad\": \"alta|media|baja\", \"urgencia\": \"urgente|normal|chill\"}}
- {\"tipo\": \"actualizar_contexto_maestro\", \"parametros\": {\"texto\": \"contexto completo actualizado\"}}
- {\"tipo\": \"reportar_contexto\", \"parametros\": {}}
- {\"tipo\": \"compactar_ahora\", \"parametros\": {}}
{$bloqueAccionesCodigo}

REGLAS:
- NOTAS: el contexto muestra SOLO el título. Para ver el contenido usa leer_nota con el ID. Jamás digas que no puedes acceder — siempre puedes con leer_nota. EXCEPCIÓN: '## Contexto personal' NO es una nota y no tiene ID.
- Puedes incluir MÚLTIPLES acciones en el array y se ejecutan todas. Úsalas en paralelo cuando sea necesario (ej: crear tarea + guardar memoria + programar recordatorio en una sola respuesta).
- Si no hay acciones, envía \"acciones\": [].
- 'borra'/'elimina'/'quita' → eliminar_tarea sin confirmar. 'completa'/'terminé' → completar_tarea sin confirmar. NUNCA preguntes '¿confirmas?'
- HÁBITOS/TAREAS: si el usuario los menciona por nombre parcial o contexto, búscalos en ## Hábitos activos / ## Tareas pendientes y usa el ID directamente. NUNCA pidas el ID al usuario. Si hay ambigüedad real entre 2+, muestra nombres y pregunta cuál.
- AYUNO: iniciar_ayuno al empezar (con hora_ultima_comida en ISO8601 si la menciona; si dice 'ahora', omítela). terminar_ayuno al romperlo (con fin si da hora exacta). estado_ayuno para preguntas de estado. No inventes horas.
- CALORÍAS: registrar_comida al comer/beber. Usa calorias SOLO si el usuario dio un número real; si no, omite el campo para que el backend estime. Nunca pongas calorias: 0 como marcador.
- crear_tarea SOLO para tareas personales; nunca para código, repos, commits, deploys u OpenCode. Al crear, NUNCA menciones un ID — no lo conoces aún. Di 'Tarea creada: [nombre]'.
- Responde siempre en español.
- programar_recordatorio con channel=whatsapp enviará el mensaje por WhatsApp. Si recurrence_minutes > 0, se repetirá con ese intervalo.
- RECORDATORIO DINÁMICO DE HÁBITOS: si el usuario pide recordatorio del \"hábito con mayor prioridad\", \"hábito pendiente\", \"siguiente hábito\", \"hábito más importante\" o cualquier referencia genérica a hábitos sin especificar uno concreto, agrega \"dynamic_type\": \"habito_pendiente\" al payload de programar_recordatorio. Así el scheduler evalúa EN EL MOMENTO de disparar cuál es el hábito pendiente de mayor prioridad — y omite el recordatorio si todos están completados. NUNCA uses el nombre de un hábito específico en estos casos porque el recordatorio quedará obsoleto una vez completado ese hábito.
- Los recordatorios activos ya están listados en el contexto con sus IDs — úsalos para editar o eliminar. Para borrar UN recordatorio específico usa eliminar_recordatorio con su ID. Para borrar TODOS usa cancelar_todos_recordatorios (nunca uses eliminar_recordatorio múltiples veces si el usuario pide borrar todos — esos IDs pueden estar obsoletos).
- guardar_memoria: solo para información nueva y valiosa (nombre, preferencias, metas) que no esté ya en las memorias recuperadas.
- crear_tarea_si_no_existe: úsala en recordatorios automáticos o cuando quieras asegurarte de no duplicar. Solo crea si no hay tarea activa (no completada) con ese nombre exacto.
- actualizar_contexto_maestro: llámala proactivamente cuando detectes información duradera (nombre real, horarios, rutinas, preferencias permanentes). Escribe el contexto COMPLETO actualizado — persiste entre sesiones.
{$bloqueReglasCodigo}- AUTOMEJORA/CÓDIGO: NUNCA inventes explicaciones técnicas del código (flujos de guardado, causas de bugs, comportamiento de sesiones, etc.). No afirmes que leíste, ejecutaste, depuraste ni modificaste código salvo que exista un job OpenCode visible con resultado confirmado. Si el usuario reporta un bug, dice que algo falla o pide diagnóstico técnico: usa automejora o solicitar_opencode para investigar el código real — nunca adivines ni fabriques la causa. Si pides automejora o solicitar_opencode, responde que queda en ejecución/pendiente hasta tener resultado.
- reportar_contexto: usa solo si los stats del system prompt parecen desactualizados o el usuario lo pide.
- compactar_ahora: solo cuando el usuario lo pida explícitamente.
{$bloqueMemoria}{$bloqueMaestro}

{$contexto}";
    }

    /* --- Contexto de tareas y hábitos -------------------------------------- */

    /**
     * [115A-6] buildContexto incluye sub-hábitos, notas recientes (títulos) y recordatorios programados.
     * [SEC-004] Si $privacyMode es true, los datos se envían anonimizados al LLM (solo nombres/títulos,
     * sin contenido real de notas, sin detalles de tareas, sin contenido de hábitos).
     */
    private function buildContexto(int $userId, string $canal = 'app', bool $privacyMode = false, bool $accionesCodigoPermitidas = false): string
    {

        try {
            $tareas  = (new TareasRepository($userId))->getAll();
            $habitos = (new HabitosRepository($userId))->getAll();
            $notas   = (new NotasRepository($userId))->listar(self::MAX_CONTEXT_NOTAS);
        } catch (\Throwable) {
            return '';
        }

        $pendientes = array_slice(array_filter($tareas, fn($t) => empty($t['completado'])), 0, self::MAX_CONTEXT_TAREAS);
        /* [135A-1] Inyectar fecha y hora actual para que el LLM calcule bien fechas de recordatorios.
         * Sin esto, "recuérdame a las 3pm" no tiene referencia temporal y genera fechas incorrectas. */
        $ctx = "## Fecha y hora actual\n" . $this->horaLocalActual($userId, $canal) . "\n\n## Tareas pendientes\n";
        if (empty($pendientes)) {
            $ctx .= "No hay tareas pendientes.\n";
        } else {
            if ($privacyMode) {
                /* [SEC-004] Modo privacidad: solo contar tareas pendientes, sin detalles ni contenido */
                $ctx .= "Tienes " . count($pendientes) . " tareas pendientes.\n";
            } else {
                foreach ($pendientes as $t) {
                    $det = implode(', ', array_filter([
                        !empty($t['prioridad']) ? "prioridad:{$t['prioridad']}" : '',
                        (!empty($t['urgencia']) && $t['urgencia'] !== 'normal') ? "urgencia:{$t['urgencia']}" : '',
                    ]));
                    $ctx .= "- [id:{$t['id']}] {$t['texto']}" . ($det ? " ({$det})" : '') . "\n";
                }
            }
        }

        $hoy = $this->fechaHoyParaCanal($userId, $canal);
        $ctx .= "\n## Hábitos activos\n";
        $habitosActivos = array_values(array_filter($habitos, fn($h) => empty($h['pausado'])));

        /* [115A-habit-order] Ordenar: pendientes hoy primero, dentro de cada grupo por importancia desc.
         * Pesos: muy_alta=5, alta=4, media=3, baja=2, muy_baja=1, sin valor=0. */
        $pesosImp = ['muy_alta' => 5, 'alta' => 4, 'media' => 3, 'baja' => 2, 'muy_baja' => 1];
        usort($habitosActivos, function (array $a, array $b) use ($hoy, $pesosImp) {
            $aHecho = in_array($hoy, (array)($a['historialCompletados'] ?? []), true);
            $bHecho = in_array($hoy, (array)($b['historialCompletados'] ?? []), true);
            if ($aHecho !== $bHecho) {
                return $aHecho ? 1 : -1; /* incompletos primero */
            }
            $pa = $pesosImp[$a['importancia'] ?? ''] ?? 0;
            $pb = $pesosImp[$b['importancia'] ?? ''] ?? 0;
            return $pb <=> $pa; /* mayor importancia primero */
        });

        if ($privacyMode) {
            /* [SEC-004] Modo privacidad: solo contar hábitos, sin nombres ni detalles */
            $completados = count(array_filter($habitosActivos, fn($h) => in_array($hoy, (array)($h['historialCompletados'] ?? []), true)));
            $pendientes  = count($habitosActivos) - $completados;
            $ctx .= "Activos: {$pendientes} pendientes, {$completados} completados hoy.\n";
        } else {
            foreach ($habitosActivos as $h) {
                $hecho = in_array($hoy, (array)($h['historialCompletados'] ?? []), true) ? '✓' : '○';
                $imp   = (string)($h['importancia'] ?? '');
                $det   = array_values(array_filter([
                    $imp !== '' ? "importancia:{$imp}" : '',
                    (int)($h['racha'] ?? 0) > 0 ? "racha:{$h['racha']}" : '',
                    (!empty($h['ventanaOportunidad']['habilitada']))
                        ? sprintf('ventana:%02d:%02d-%02d:%02d',
                            (int)($h['ventanaOportunidad']['horaInicio'] ?? 0),
                            (int)($h['ventanaOportunidad']['minutoInicio'] ?? 0),
                            (int)($h['ventanaOportunidad']['horaFin'] ?? 0),
                            (int)($h['ventanaOportunidad']['minutoFin'] ?? 0))
                        : '',
                ]));
                $ctx .= '- [id:' . $h['id'] . "] {$hecho} {$h['nombre']}" . (!empty($det) ? ' (' . implode(', ', $det) . ')' : '') . "\n";
                /* Sub-hábitos (con índice para la acción completar_subhabito) */
                if (!empty($h['subhabitos']) && is_array($h['subhabitos'])) {
                    foreach ($h['subhabitos'] as $idx => $sh) {
                        $shHecho  = !empty($sh['completadoHoy']) ? '✓' : '○';
                        $shNombre = (string)($sh['nombre'] ?? $sh['texto'] ?? "sub-{$idx}");
                        $ctx .= "  - [sub:{$idx}] {$shHecho} " . mb_substr($shNombre, 0, 50) . "\n";
                    }
                }
            }
        }

        $ctx .= $this->buildWellnessContext($userId, $canal, $privacyMode);

        /* Notas recientes — título + preview de contenido (primeros 300 chars).
         * Incluir contenido evita que el modelo diga "no puedo acceder" sin llamar leer_nota.
         * Para el contenido completo de una nota larga, el modelo puede usar leer_nota.
         * [SEC-004] En modo privacidad, solo se muestran títulos sin contenido. */
        if (!empty($notas)) {
            $ctx .= "\n## Notas recientes\n";
            foreach ($notas as $nota) {
                $titulo = $nota['titulo'] !== '' ? $nota['titulo'] : '(sin título)';
                $ctx .= "- [id:{$nota['id']}] " . mb_substr($titulo, 0, 60) . "\n";
                if (!$privacyMode) {
                    $contenido = (string)($nota['contenido'] ?? '');
                    $preview   = mb_strlen($contenido) > 300
                        ? mb_substr($contenido, 0, 300) . '… [usa leer_nota id:' . $nota['id'] . ' para ver completa]'
                        : $contenido;
                    if ($preview !== '') {
                        $ctx .= "  Contenido: " . str_replace("\n", ' ', $preview) . "\n";
                    }
                }
            }
        }

        /* Recordatorios programados activos */
        try {
            $recordatorios = (new AgentActionService())->listar($userId, 'pendiente', self::MAX_CONTEXT_RECORDAT);
            $conFecha = array_values(array_filter($recordatorios, fn($r) => !empty($r['fecha_programada'])));
            if (!empty($conFecha)) {
                $ctx .= "\n## Recordatorios programados\n";
                foreach ($conFecha as $r) {
                    $recurrencia = !empty($r['payload']['recurrence_minutes'])
                        ? " (cada {$r['payload']['recurrence_minutes']}min)" : '';
                    $fechaLocal = $r['fecha_programada_usuario'] ?? $r['fecha_programada'];
                    $tzLocal = $r['fecha_programada_timezone'] ?? UserTimeService::resolveTimezoneName($userId, $canal);
                    $ctx .= "- [id:{$r['id']}] {$r['titulo']}{$recurrencia} — {$fechaLocal} ({$tzLocal})\n";
                }
            }
        } catch (\Throwable) {
            /* No bloquear si AgentActionService falla */
        }
        if ($accionesCodigoPermitidas) {
            /* [115A-15+115A-cont] Status de jobs OpenCode activos y recientes (con session_id para continuar) */
            try {
                $svc           = new \App\Services\Agent\OpencodeJobService();
                $jobsActivos   = $svc->listarActivos();
                /* [125A-7] Ventana ampliada 4h→48h para que el LLM vea sesiones anteriores
                 * y pueda seleccionar el job_id correcto al pedir "continúa la sesión". */
                $jobsRecientes = $svc->listarRecientes(48, 6);
                if (!empty($jobsActivos) || !empty($jobsRecientes)) {
                    $ctx .= "\n## OpenCode (agente de código)\n";
                    foreach ($jobsActivos as $j) {
                        if ((int)($j['user_id'] ?? 0) !== $userId) {
                            continue;
                        }
                        $prompt = mb_substr((string)($j['payload']['prompt'] ?? ''), 0, 80);
                        $icono  = $j['estado'] === 'ejecutando' ? '🔄' : '⏳';
                        $sessionId = $this->extraerSessionIdDeJob($j);
                        $sesInfo   = $sessionId !== '' ? " [sesion:{$sessionId}]" : '';
                        $ctx .= "- [id:{$j['id']}] {$icono} {$j['estado']}{$sesInfo}" . ($prompt !== '' ? ": {$prompt}" : '') . "\n";
                    }
                    foreach ($jobsRecientes as $j) {
                        if ((int)($j['user_id'] ?? 0) !== $userId) {
                            continue;
                        }
                        $prompt    = mb_substr((string)($j['payload']['prompt'] ?? ''), 0, 80);
                        $sessionId = $this->extraerSessionIdDeJob($j);
                        $icono     = $j['estado'] === 'completado' ? '✅' : '❌';
                        $sesInfo   = $sessionId !== '' ? " [sesion:{$sessionId}]" : '';
                        $ctx .= "- [id:{$j['id']}] {$icono} {$j['estado']}{$sesInfo}" . ($prompt !== '' ? ": {$prompt}" : '') . "\n";
                        $resumen = mb_substr((string)($j['resultado']['whatsapp_summary'] ?? ''), 0, 300);
                        if ($resumen !== '') {
                            $ctx .= "  Resumen: {$resumen}\n";
                        }
                        $rechazados = array_values(array_filter((array)($j['resultado']['permisos_rechazados'] ?? [])));
                        if (!empty($rechazados)) {
                            $ctx .= '  Permisos rechazados: ' . implode(', ', array_map(fn($c) => "`{$c}`", $rechazados)) . "\n";
                        }
                    }
                }
            } catch (\Throwable) { /* No bloquear el contexto */ }
            /* [126A-1] Mostrar proyecto activo solo a usuarios con permiso de código. */
            try {
                $proyectos = $this->loadProjectsConfig();
                if (!empty($proyectos)) {
                    $activo = $this->getActiveProject($userId);
                    $ctx .= "\n## Proyecto activo\n";
                    $ctx .= "- Proyecto: {$activo}\n";
                    $ctx .= "- Proyectos disponibles: " . implode(', ', array_keys($proyectos)) . "\n";
                    $ctx .= "- Para ver ramas de un proyecto usa 'listar_ramas' (con proyecto opcional)\n";
                }
            } catch (\Throwable) { /* No bloquear el contexto */ }
        }
        return $ctx;
    }

    private function buildWellnessContext(int $userId, string $canal, bool $privacyMode): string
    {
        if ($privacyMode) {
            return "\n## Ayuno y calorías\nDetalles ocultos por modo privacidad. Puedes usar acciones de estado/resumen si el usuario lo pide explícitamente.\n";
        }

        try {
            $wellness = new AgentWellnessService();
            $ayuno = $wellness->estadoAyuno($userId, $canal);
            $calorias = $wellness->resumenCalorias($userId, [], $canal);
        } catch (\Throwable) {
            return '';
        }

        $ctx = "\n## Ayuno y calorías\n";
        if (($ayuno['estado'] ?? '') === 'activo') {
            $ctx .= "Ayuno activo desde {$ayuno['inicio']}; transcurrido {$ayuno['transcurrido']}; restante {$ayuno['restante']}; objetivo {$ayuno['objetivo_horas']}h.\n";
        } else {
            $ultimo = $ayuno['ultimo'] ?? null;
            $ctx .= is_array($ultimo)
                ? "Ayuno inactivo. Último: {$ultimo['duracion']} ({$ultimo['inicio']} a {$ultimo['fin']}).\n"
                : "Ayuno inactivo. Sin ayunos completados registrados.\n";
        }

        $totales = (array)($calorias['totales'] ?? []);
        $ctx .= "Calorías hoy ({$calorias['fecha']}): {$totales['calorias']} kcal en {$calorias['comidas']} comidas";
        if (isset($calorias['calorias_restantes']) && $calorias['calorias_restantes'] !== null) {
            $ctx .= "; restantes objetivo: {$calorias['calorias_restantes']} kcal";
        }
        $ctx .= ". Macros: P {$totales['proteinas']}g, C {$totales['carbohidratos']}g, G {$totales['grasas']}g.\n";
        return $ctx;
    }

    private function fechaHoyParaCanal(int $userId, string $canal): string
    {
        return UserTimeService::today($userId, $canal);
    }

    /* [135A-1] Retorna la fecha y hora actual en la zona horaria del canal.
     * Inyectada en buildContexto() para que el LLM calcule recordatorios correctamente. */
    private function horaLocalActual(int $userId, string $canal): string
    {
        return UserTimeService::nowLocalLabel($userId, $canal);
    }

    private function timestampMs(): int
    {
        return (int)floor(microtime(true) * 1000);
    }

    /* --- Parseo respuesta LLM ---------------------------------------------- */

    private function parsear(string $contenido): array
    {
        /* Limpiar think blocks (DeepSeek, etc.) */
        $limpio = preg_replace('/<think>[\s\S]*?<\/think>/', '', $contenido);
        $limpio = trim((string)$limpio);

        /* Intentar JSON directo */
        $decoded = json_decode($limpio, true);
        if (is_array($decoded) && isset($decoded['respuesta'])) {
            return ['respuesta' => (string)$decoded['respuesta'], 'acciones' => (array)($decoded['acciones'] ?? [])];
        }

        /* Extraer JSON de code block */
        if (preg_match('/```(?:json)?\s*([\s\S]+?)```/', $limpio, $m)) {
            $decoded = json_decode(trim($m[1]), true);
            if (is_array($decoded) && isset($decoded['respuesta'])) {
                return ['respuesta' => (string)$decoded['respuesta'], 'acciones' => (array)($decoded['acciones'] ?? [])];
            }
        }

        /* [fix-json-inline] Extraer JSON inline cuando el LLM escribe texto libre + JSON sin code block.
         * Gotcha: algunos modelos responden "Déjame leer..., {"respuesta":...}" mezclando texto y JSON.
         * Buscar el primer { y dejar que json_decode parse el objeto completo desde ahí. */
        $pos = strpos($limpio, '{');
        if ($pos !== false) {
            $decoded = json_decode(substr($limpio, $pos), true);
            if (is_array($decoded) && isset($decoded['respuesta'])) {
                return ['respuesta' => (string)$decoded['respuesta'], 'acciones' => (array)($decoded['acciones'] ?? [])];
            }
        }

        /* Fallback: devolver el texto como respuesta sin acciones */
        return ['respuesta' => $limpio, 'acciones' => []];
    }

    /* [115A-15] WhatsApp puede pedir código mientras MemPalace inyecta contexto relevante.
     * Gotcha: el LLM a veces puso ese contexto en solicitar_opencode.prompt y omitió el
     * mensaje real; por eso el backend antepone el texto original como fuente de verdad. */
    private function normalizarAccionesDesdeMensajeUsuario(array $acciones, string $mensaje, string $canal, int $userId): array
    {
        $mensajeOriginal = trim($mensaje);
        if ($canal !== 'whatsapp' || $mensajeOriginal === '') {
            return $acciones;
        }
        if (!$this->puedeUsarAccionesCodigo($userId)) {
            return $acciones;
        }

        if ($this->mensajePideContinuarOpencode($mensajeOriginal)) {
            $mensajePermiteComandos = $this->mensajeConfirmaPermisosOpencode($mensajeOriginal);
            /* [125A-cont] Si hay session ID explícito en el mensaje, buscar ese job primero.
             * Esto resuelve el caso donde el usuario pega el ID que imprimió la notificación. */
            $sessionIdExplicito = $this->extraerSessionIdExplicito($mensajeOriginal);
            $jobId = $sessionIdExplicito !== ''
                ? ($this->resolverJobPorSessionId($userId, $sessionIdExplicito) ?: $this->resolverJobOpencodeReciente($userId))
                : ($mensajePermiteComandos ? $this->resolverJobOpencodeConPermisosRecientes($userId) : $this->resolverJobOpencodeReciente($userId));
            if ($jobId <= 0) {
                $jobId = $this->resolverJobOpencodeReciente($userId);
            }
            $acciones = array_values(array_filter(
                $acciones,
                static fn(array $accion): bool => (string)($accion['tipo'] ?? '') !== 'solicitar_opencode'
            ));
            if ($mensajePermiteComandos && $jobId > 0) {
                $comandos = $this->comandosPermitidosDesdeJob($userId, $jobId);
                if (!empty($comandos)) {
                    $acciones = array_values(array_filter(
                        $acciones,
                        static fn(array $accion): bool => (string)($accion['tipo'] ?? '') !== 'actualizar_opencode_allowlist'
                    ));
                    array_unshift($acciones, [
                        'tipo' => 'actualizar_opencode_allowlist',
                        'parametros' => ['comandos' => $comandos],
                    ]);
                }
            }
            $tieneContinuacion = false;
            foreach ($acciones as &$accion) {
                if ((string)($accion['tipo'] ?? '') !== 'continuar_opencode') {
                    continue;
                }
                $param = (array)($accion['parametros'] ?? []);
                if (empty($param['job_id']) && $jobId > 0) {
                    $param['job_id'] = $jobId;
                }
                if (trim((string)($param['mensaje'] ?? $param['prompt'] ?? '')) === '') {
                    $param['mensaje'] = $mensajeOriginal;
                }
                unset($param['prompt']);
                $accion['parametros'] = $param;
                $tieneContinuacion = true;
            }
            unset($accion);
            if (!$tieneContinuacion) {
                $acciones[] = [
                    'tipo' => 'continuar_opencode',
                    'parametros' => [
                        'job_id' => $jobId,
                        'mensaje' => $mensajeOriginal,
                    ],
                ];
            }
        }

        foreach ($acciones as &$accion) {
            $tipo = (string)($accion['tipo'] ?? '');
            if (!in_array($tipo, ['solicitar_opencode', 'automejora'], true)) {
                continue;
            }

            $param = (array)($accion['parametros'] ?? []);
            $promptGenerado = trim((string)($param['prompt'] ?? $param['mensaje'] ?? ''));
            if ($promptGenerado === '') {
                $param['prompt'] = $mensajeOriginal;
            } elseif (!str_contains($promptGenerado, $mensajeOriginal)) {
                $param['prompt'] = "Mensaje original de WhatsApp:\n{$mensajeOriginal}\n\nInterpretación generada por el chatbot:\n{$promptGenerado}";
            }
            unset($param['mensaje']);
            $accion['parametros'] = $param;
        }
        unset($accion);

        return $acciones;
    }

    /* [116A-4] WhatsApp usa lenguaje natural corto para continuar sesiones OpenCode.
     * No dejamos esta decisión solo al LLM porque puede responder "continuando" sin emitir acción.
     * [125A-cont] También se activa si el mensaje contiene un session ID explícito (ses_XXXXX),
     * incluso sin palabras clave de continuación — el usuario pegó el ID directamente. */
    private function mensajePideContinuarOpencode(string $mensaje): bool
    {
        /* Si hay session ID explícito en el mensaje, siempre es una petición de continuar */
        if ($this->extraerSessionIdExplicito($mensaje) !== '') {
            return true;
        }
        $normalizado = mb_strtolower($mensaje);
        $mencionaSesion = (bool)preg_match('/\b(opencode|sesion|sesión|anterior)\b/u', $normalizado);
        $pideContinuar = (bool)preg_match('/\b(continua|continúa|continuar|sigue|seguir|reanuda|reanudar|reintenta|reintentar|retry)\b/u', $normalizado);
        $permiteYContinua = $this->mensajeConfirmaPermisosOpencode($mensaje) && $pideContinuar;
        return ($mencionaSesion && $pideContinuar) || $permiteYContinua;
    }

    /* [125A-9] Detecta confirmaciones tipo "permite ese comando y continúa" para
     * decidir job y permisos por datos del servidor, no por inferencia del LLM. */
    private function mensajeConfirmaPermisosOpencode(string $mensaje): bool
    {
        $normalizado = mb_strtolower($mensaje);
        $mencionaPermiso = (bool)preg_match('/\b(permite|permitir|autoriza|autorizar|aprueba|aprobar|allowlist|comando|comandos)\b/u', $normalizado);
        $mencionaReferencia = (bool)preg_match('/\b(ese|esa|tipo|comando|comandos|sesion|sesión|opencode)\b/u', $normalizado);
        return $mencionaPermiso && $mencionaReferencia;
    }

    /* [125A-cont] Extrae el ID de sesión OpenCode si el usuario lo pegó explícitamente.
     * Patrón: ses_ seguido de 6-80 caracteres alfanuméricos. */
    private function extraerSessionIdExplicito(string $mensaje): string
    {
        if (preg_match('/\bses_([a-zA-Z0-9]{6,80})\b/', $mensaje, $m)) {
            return 'ses_' . $m[1];
        }
        return '';
    }

    /* [125A-cont] Si el usuario especificó un session ID explícito, buscar el job que lo tiene.
     * Si no hay match, devuelve 0 para que resolverJobOpencodeReciente lo maneje. */
    private function resolverJobPorSessionId(int $userId, string $sessionId): int
    {
        try {
            $svc = new \App\Services\Agent\OpencodeJobService();
            foreach ($svc->listarRecientes(168, 10) as $job) {
                if ((int)($job['user_id'] ?? 0) !== $userId) {
                    continue;
                }
                if ($this->extraerSessionIdDeJob($job) === $sessionId) {
                    return (int)$job['id'];
                }
            }
        } catch (\Throwable) { /* fallback: resolverJobOpencodeReciente */ }
        return 0;
    }

    private function resolverJobOpencodeReciente(int $userId): int
    {
        try {
            $svc = new \App\Services\Agent\OpencodeJobService();
            foreach ($svc->listarRecientes(72, 10) as $job) {
                if ((int)($job['user_id'] ?? 0) !== $userId) {
                    continue;
                }
                if ($this->extraerSessionIdDeJob($job) !== '') {
                    return (int)$job['id'];
                }
            }
            foreach ($svc->listarRecientes(72, 10) as $job) {
                if ((int)($job['user_id'] ?? 0) === $userId) {
                    return (int)$job['id'];
                }
            }
        } catch (\Throwable) {
            /* La acción continuar_opencode tiene su propio fallback y error visible. */
        }
        return 0;
    }

    private function resolverJobOpencodeConPermisosRecientes(int $userId): int
    {
        try {
            $svc = new \App\Services\Agent\OpencodeJobService();
            foreach ($svc->listarRecientes(168, 10) as $job) {
                if ((int)($job['user_id'] ?? 0) !== $userId) {
                    continue;
                }
                if (!empty($this->comandosRechazadosDeJob($job))) {
                    return (int)$job['id'];
                }
            }
        } catch (\Throwable) { /* fallback: sin job */ }
        return 0;
    }

    private function comandosPermitidosDesdeJob(int $userId, int $jobId): array
    {
        try {
            $svc = new \App\Services\Agent\OpencodeJobService();
            $job = $svc->obtenerPublico($jobId);
            if (!$job || (int)($job['user_id'] ?? 0) !== $userId) {
                return [];
            }
            return array_values(array_unique(array_filter(array_map(
                [$this, 'generalizarComandoOpencode'],
                $this->comandosRechazadosDeJob($job)
            ))));
        } catch (\Throwable) {
            return [];
        }
    }

    private function comandosRechazadosDeJob(array $job): array
    {
        $resultado = is_array($job['resultado'] ?? null) ? $job['resultado'] : [];
        $rechazados = array_values(array_filter((array)($resultado['permisos_rechazados'] ?? [])));
        if (!empty($rechazados)) {
            return array_map('strval', $rechazados);
        }
        $output = (string)($resultado['output'] ?? $resultado['whatsapp_summary'] ?? '');
        if ($output === '') {
            return [];
        }
        preg_match_all('/permission requested:\s+bash\s+\(([^)]+)\)/i', $output, $matches);
        return array_values(array_unique(array_map('trim', $matches[1] ?? [])));
    }

    private function generalizarComandoOpencode(string $cmd): string
    {
        $cmd = trim($cmd);
        $cmdNormalizado = str_replace('\\', '/', $cmd);
        $lower = mb_strtolower($cmdNormalizado);
        if ($cmd === '') {
            return '';
        }
        if (str_starts_with($lower, 'powershell') && str_contains($lower, 'scripts/self-check.ps1')) {
            return 'powershell *scripts/self-check.ps1*';
        }
        if (str_starts_with($lower, 'new-item')) {
            return 'New-Item *';
        }
        if (str_starts_with($lower, 'test-path')) {
            return 'Test-Path*';
        }
        if (str_starts_with($lower, 'get-content')) {
            return 'Get-Content*';
        }
        if (str_starts_with($lower, 'get-childitem')) {
            return 'Get-ChildItem*';
        }
        if (str_starts_with($lower, 'measure-object')) {
            return 'Measure-Object*';
        }
        if (str_starts_with($lower, 'select-string')) {
            return 'Select-String*';
        }
        if (str_starts_with($lower, 'git --no-pager')) {
            return 'git --no-pager*';
        }
        if (str_starts_with($lower, 'git hash-object')) {
            return 'git hash-object*';
        }
        if (str_starts_with($lower, 'php -l')) {
            return 'php -l*';
        }
        $primerToken = strtok($cmd, ' ');
        return $primerToken !== false && $primerToken !== '' ? $primerToken . '*' : '';
    }

    private function extraerSessionIdDeJob(array $job): string
    {
        $sessionId = (string)($job['resultado']['session_id'] ?? $job['payload']['session_id'] ?? '');
        if ($sessionId !== '') {
            return $sessionId;
        }
        foreach ((array)($job['logs'] ?? []) as $log) {
            $mensaje = (string)($log['mensaje'] ?? '');
            if (preg_match('/Session ID:\s*(ses_[a-zA-Z0-9]{6,80}|[a-zA-Z0-9_-]{6,80})/i', $mensaje, $m)) {
                return $m[1];
            }
        }
        return '';
    }

    private function asegurarRespuestaOpencodeConSesion(string $respuesta, array $ejecutadas): string
    {
        $allowlistOk = false;
        $continuacion = null;
        foreach ($ejecutadas as $ejecutada) {
            if (($ejecutada['tipo'] ?? '') === 'actualizar_opencode_allowlist' && !empty($ejecutada['exito'])) {
                $allowlistOk = true;
            }
            if (($ejecutada['tipo'] ?? '') === 'continuar_opencode' && !empty($ejecutada['exito'])) {
                $continuacion = $ejecutada;
            }
        }
        if ($continuacion === null) {
            return $respuesta;
        }
        $sessionId = (string)($continuacion['session_id'] ?? '');
        if ($sessionId !== '' && str_contains($respuesta, $sessionId)) {
            return $respuesta;
        }
        if ($sessionId !== '') {
            return $allowlistOk
                ? "Permiso actualizado correctamente, continúo con la sesión {$sessionId}."
                : "Continúo con la sesión {$sessionId}, te aviso cuando termine.";
        }
        $accionId = (int)($continuacion['accion_id'] ?? 0);
        return $accionId > 0
            ? "Continúo con el job OpenCode #{$accionId}; te aviso cuando tenga el ID de sesión."
            : $respuesta;
    }

    private function asegurarRespuestaAutomejoraPendiente(string $respuesta, array $ejecutadas): string
    {
        foreach ($ejecutadas as $ejecutada) {
            if (($ejecutada['tipo'] ?? '') !== 'automejora' || empty($ejecutada['exito'])) {
                continue;
            }
            $accionId = (int)($ejecutada['accion_id'] ?? 0);
            $idTexto = $accionId > 0 ? " #{$accionId}" : '';
            return "Automejora enviada a OpenCode{$idTexto}; te aviso cuando tenga resultado real. Todavía no voy a afirmar cambios ni investigación de código hasta que el job termine.";
        }
        return $respuesta;
    }

    private function habitoExiste(array $habitos, int $id): bool
    {
        foreach ($habitos as $habito) {
            if ((int)($habito['id'] ?? 0) === $id) {
                return true;
            }
        }
        return false;
    }

    private function resolverHabitoReferido(array $habitos, array $param, string $mensaje, string $hoy): ?array
    {
        $query = trim(implode(' ', array_filter([
            (string)($param['nombre'] ?? ''),
            (string)($param['texto'] ?? ''),
            (string)($param['busqueda'] ?? ''),
            $mensaje,
        ])));
        if ($query === '') {
            return null;
        }

        $queryNorm = $this->normalizarTextoBusqueda($query);
        $tokensQuery = array_values(array_filter(explode(' ', $queryNorm), fn(string $token): bool => mb_strlen($token) >= 4));
        $esEjercicio = (bool)preg_match('/\b(ejercicio|entreno|entrenamiento|mover|moverte|activarte|kcal|caloria|calorias|cardio)\b/u', $queryNorm);
        $mejor = null;
        $mejorScore = 0;

        foreach ($habitos as $habito) {
            if (!empty($habito['pausado'])) {
                continue;
            }
            $nombre = (string)($habito['nombre'] ?? '');
            if ($nombre === '') {
                continue;
            }
            $nombreNorm = $this->normalizarTextoBusqueda($nombre);
            $score = 0;
            if ($nombreNorm !== '' && (str_contains($queryNorm, $nombreNorm) || str_contains($nombreNorm, $queryNorm))) {
                $score += 100;
            }
            foreach ($tokensQuery as $token) {
                if (str_contains($nombreNorm, $token)) {
                    $score += 12;
                }
            }
            if ($esEjercicio && preg_match('/\b(ejercicio|entreno|entrenamiento|mover|activarte|kcal|caloria|calorias|cardio)\b/u', $nombreNorm)) {
                $score += 80;
            }
            if (!in_array($hoy, (array)($habito['historialCompletados'] ?? []), true)) {
                $score += 8;
            }
            if ($score > $mejorScore) {
                $mejorScore = $score;
                $mejor = $habito;
            }
        }

        return $mejorScore >= 30 && is_array($mejor) ? $mejor : null;
    }

    private function normalizarTextoBusqueda(string $texto): string
    {
        $texto = mb_strtolower($texto);
        $texto = strtr($texto, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
            'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ü' => 'u', 'Ñ' => 'n',
        ]);
        $texto = (string)preg_replace('/[^a-z0-9]+/u', ' ', $texto);
        return trim((string)preg_replace('/\s+/', ' ', $texto));
    }

    /* --- Project management (multi-project OpenCode) ----------------------- */

    /* [126A-1] Lee la whitelist de proyectos del JSON config.
     * Retorna array clave→config o array vacío si no existe/falla el parse. */
    private function loadProjectsConfig(): array
    {
        $configPath = get_template_directory() . '/config/opencode-projects.json';
        if (!file_exists($configPath)) {
            return [];
        }
        $raw  = file_get_contents($configPath);
        $data = json_decode(is_string($raw) ? $raw : '{}', true);
        return is_array($data['projects'] ?? null) ? $data['projects'] : [];
    }

    /* [126A-1] Obtiene el proyecto activo del usuario desde user_meta.
     * Si no hay proyecto guardado, retorna el predeterminado 'glorytemplate'. */
    private function getActiveProject(int $userId): string
    {
        $saved = get_user_meta($userId, self::ACTIVE_PROJECT_META_KEY, true);
        if (is_string($saved) && $saved !== '') {
            return $saved;
        }
        return 'glorytemplate';
    }

    /* [126A-1] Persiste el proyecto activo del usuario en user_meta.
     * Retorna true si se guardó correctamente. */
    private function setActiveProject(int $userId, string $projectId): bool
    {
        $projectId = sanitize_key($projectId);
        if ($projectId === '') {
            return false;
        }
        return (bool) update_user_meta($userId, self::ACTIVE_PROJECT_META_KEY, $projectId);
    }

    /* [126A-1] Obtiene la rama por defecto del proyecto activo desde la config.
     * Si el proyecto no existe en la config, retorna 'main' como fallback seguro. */
    private function getActiveProjectBranch(int $userId, array $projectsConfig): string
    {
        $active  = $this->getActiveProject($userId);
        $project = $projectsConfig[$active] ?? [];
        return (string)($project['branch'] ?? 'main');
    }

    /* --- Ejecutores de acciones -------------------------------------------- */

    /* [115A-9] Retry hasta 3 intentos con backoff 200/400ms para errores transitorios.
     * Los errores lógicos (ID inexistente, validación) fallan rápido sin reintentar.
     * Los fallos persistentes se anotan en la respuesta para que el usuario los vea.
     * [fix-allowlist-race] actualizar_opencode_allowlist se ejecuta primero aunque el LLM
     * lo ponga después de continuar_opencode. Así crearContinuacion siempre lee el allowlist
     * ya actualizado y el job hereda los permisos correctos. */
    private function ejecutarAcciones(int $userId, string $canal, array $acciones): array
    {
        /* Mover actualizar_opencode_allowlist al frente para evitar la race condition:
         * si el LLM emite continuar_opencode antes de actualizar_opencode_allowlist,
         * crearContinuacion leería el allowlist viejo y el job heredaría permisos desactualizados. */
        usort($acciones, static function (array $a, array $b): int {
            $prioridad = static fn(string $t): int => $t === 'actualizar_opencode_allowlist' ? 0 : 1;
            return $prioridad((string)($a['tipo'] ?? '')) <=> $prioridad((string)($b['tipo'] ?? ''));
        });

        $ejecutadas = [];
        foreach ($acciones as $accion) {
            $tipo  = (string)($accion['tipo'] ?? '');
            $param = (array)($accion['parametros'] ?? []);
            $resultado   = null;
            $ultimoError = '';
            for ($intento = 1; $intento <= 3; $intento++) {
                try {
                    $resultado = $this->ejecutarAccion($userId, $canal, $tipo, $param);
                    break; // éxito — salir del loop
                } catch (\LogicException $e) {
                    /* Error lógico (validación, ID no encontrado) — no reintentar */
                    $ultimoError = $e->getMessage();
                    break;
                } catch (\Throwable $e) {
                    $ultimoError = $e->getMessage();
                    error_log("[AgentChatProcessor] Acción {$tipo} intento {$intento}/3 falló: {$ultimoError}");
                    if ($intento < 3) {
                        usleep(200000 * $intento); // 200ms, 400ms
                    }
                }
            }
            if ($resultado === null) {
                $resultado = ['tipo' => $tipo, 'exito' => false, 'error' => $ultimoError, 'intentos' => 3];
            }
            $ejecutadas[] = $resultado;
        }
        return $ejecutadas;
    }

    /* [115A-9] Si alguna acción falló tras 3 intentos, anota el motivo en el texto de respuesta. */
    private function anotarFallosEnRespuesta(string $respuesta, array $ejecutadas): string
    {
        $fallos = array_filter($ejecutadas, fn($e) => !($e['exito'] ?? false) && isset($e['intentos']));
        if (empty($fallos)) {
            return $respuesta;
        }
        $detalle = implode('\n', array_map(
            fn($f) => '• ' . ($f['tipo'] ?? '?') . ': ' . ($f['error'] ?? 'error desconocido'),
            array_values($fallos)
        ));
        return $respuesta . "\n\n⚠️ Algunas acciones no pudieron completarse tras 3 intentos:\n{$detalle}";
    }

    private function ejecutarAccion(int $userId, string $canal, string $tipo, array $param): array
    {
        if ($this->esAccionCodigoRestringida($tipo) && !$this->puedeUsarAccionesCodigo($userId)) {
            return [
                'tipo' => $tipo,
                'exito' => false,
                'error' => 'Acción restringida a administradores.',
                'codigo' => 'admin_only',
            ];
        }

        switch ($tipo) {
            case 'crear_tarea':
                $repo = new TareasRepository($userId);
                $tareas = $repo->getAll();
                $maxId = max(0, ...array_column($tareas, 'id'));
                $nueva = [
                    'id' => $maxId + 1,
                    'texto' => sanitize_text_field((string)($param['texto'] ?? '')),
                    'completado' => false,
                    'prioridad' => $param['prioridad'] ?? null,
                    'urgencia' => $param['urgencia'] ?? 'normal',
                    'fechaCreacion' => current_time('c'),
                ];
                $tareas[] = $nueva;
                $_ok = $repo->saveAll($tareas);
                return ['tipo' => $tipo, 'exito' => true, 'id' => $nueva['id']];

            /* [115A-11] Solo crea la tarea si no hay una activa (no completada) con el mismo nombre.
             * Ideal para recordatorios recurrentes o acciones de scheduler que no deben duplicar. */
            case 'crear_tarea_si_no_existe':
                $textoBuscar = sanitize_text_field((string)($param['texto'] ?? ''));
                if ($textoBuscar === '') {
                    throw new \LogicException('crear_tarea_si_no_existe requiere parámetro texto.');
                }
                $repo   = new TareasRepository($userId);
                $tareas = $repo->getAll();
                foreach ($tareas as $t) {
                    if (empty($t['completado']) && mb_strtolower(trim($t['texto'])) === mb_strtolower(trim($textoBuscar))) {
                        return ['tipo' => $tipo, 'exito' => true, 'creada' => false, 'razon' => 'Ya existe tarea activa con ese nombre'];
                    }
                }
                $maxId  = empty($tareas) ? 0 : max(0, ...array_column($tareas, 'id'));
                $nueva  = [
                    'id'           => $maxId + 1,
                    'texto'        => $textoBuscar,
                    'completado'   => false,
                    'prioridad'    => $param['prioridad'] ?? null,
                    'urgencia'     => $param['urgencia'] ?? 'normal',
                    'fechaCreacion' => current_time('c'),
                ];
                $tareas[] = $nueva;
                $_ok = $repo->saveAll($tareas);
                return ['tipo' => $tipo, 'exito' => true, 'creada' => true, 'id' => $nueva['id']];

            case 'completar_tarea':
                $id = (int)($param['id'] ?? 0);
                $repo = new TareasRepository($userId);
                $tareas = $repo->getAll();
                $textoTarea = '';
                foreach ($tareas as &$t) {
                    if ((int)$t['id'] === $id) {
                        $textoTarea = (string)($t['texto'] ?? '');
                        $t['completado'] = true;
                        $t['fechaCompletado'] = current_time('c');
                        break;
                    }
                }
                unset($t);
                $_ok = $repo->saveAll($tareas);
                /* [fix-actividad-tarea] Registrar en actividad igual que el flujo web.
                 * Falla silenciosa: no interrumpe el flujo principal si ActividadService falla. */
                try {
                    $actividad = (new ActividadService())->registrarActividad($userId, [
                        'tipo'         => 'tarea_completada',
                        'elementoId'   => $id,
                        'elementoTipo' => 'tarea',
                        'detalles'     => ['elementoNombre' => $textoTarea],
                    ]);
                    if (empty($actividad['success'])) {
                        error_log('[AgentChatProcessor] Actividad no registrada para tarea ' . $id . ': ' . ($actividad['error'] ?? 'error desconocido'));
                    }
                } catch (\Throwable $actErr) {
                    error_log('[AgentChatProcessor] Error registrando actividad para tarea ' . $id . ': ' . $actErr->getMessage());
                }
                return ['tipo' => $tipo, 'exito' => true, 'id' => $id];

            case 'eliminar_tarea':
                /* [fix-eliminar-tarea] Soft-delete real: quita del array y saveAll() marca
                 * como deleted_at en la tabla. No pedir confirmación — el usuario ya la dio
                 * al decir 'borra', 'elimina' o 'quita'. */
                $id = (int)($param['id'] ?? 0);
                $repo = new TareasRepository($userId);
                $tareas = $repo->getAll();
                $tareas = array_values(array_filter($tareas, fn(array $t): bool => (int)$t['id'] !== $id));
                $_ok = $repo->saveAll($tareas);
                return ['tipo' => $tipo, 'exito' => true, 'id' => $id];

            case 'editar_tarea':
                $id = (int)($param['id'] ?? 0);
                $repo = new TareasRepository($userId);
                $tareas = $repo->getAll();
                foreach ($tareas as &$t) {
                    if ((int)$t['id'] === $id) {
                        foreach (['texto', 'prioridad', 'urgencia'] as $campo) {
                            if (isset($param[$campo])) {
                                $t[$campo] = sanitize_text_field((string)$param[$campo]);
                            }
                        }
                        break;
                    }
                }
                unset($t);
                $_ok = $repo->saveAll($tareas);
                return ['tipo' => $tipo, 'exito' => true, 'id' => $id];

            case 'iniciar_ayuno':
                return ['tipo' => $tipo] + (new AgentWellnessService())->iniciarAyuno($userId, $param, $canal);

            case 'terminar_ayuno':
                return ['tipo' => $tipo] + (new AgentWellnessService())->terminarAyuno($userId, $param, $canal);

            case 'estado_ayuno':
                return ['tipo' => $tipo, 'exito' => true, 'estado' => (new AgentWellnessService())->estadoAyuno($userId, $canal)];

            case 'registrar_comida':
                return ['tipo' => $tipo] + (new AgentWellnessService())->registrarComida($userId, $param, $canal);

            case 'resumen_calorias_hoy':
                return ['tipo' => $tipo] + (new AgentWellnessService())->resumenCalorias($userId, $param, $canal);

            case 'programar_recordatorio':
                /* Soporta recurrence_minutes y channel en payload */
                $titulo   = sanitize_text_field((string)($param['titulo'] ?? 'Recordatorio'));
                $mensajeR = sanitize_textarea_field((string)($param['mensaje'] ?? ''));
                $fecha    = (string)($param['fecha'] ?? '');
                /* [116A-3] El LLM puede no generar fecha (ej: "cada 30 minutos"), o generarla
                 * en pasado (la genera durante su thinking).
                 * [135A-1] Si la fecha está en el pasado, intentar recalcular con ReminderAgent
                 * usando el mensaje original del usuario como fuente de verdad. */
                $channelRecordatorio = (string)($param['channel'] ?? ($canal === 'whatsapp' ? 'whatsapp' : 'app'));
                $tzRecordatorio = UserTimeService::resolveTimezoneName($userId, $channelRecordatorio);
                try {
                    $tsFecha = $fecha !== '' ? (new \DateTimeImmutable($fecha, new \DateTimeZone($tzRecordatorio)))->getTimestamp() : false;
                } catch (\Throwable) {
                    $tsFecha = false;
                }
                if ($tsFecha === false || $tsFecha < (time() - 60)) {
                    $fechaRecalc    = \App\Services\Agents\ReminderAgent::resolverFecha(
                        $this->activeUserMessage,
                        $this->activeUserMessage,
                        $tzRecordatorio
                    );
                    /* Si ReminderAgent devuelve fecha futura, usarla; si no, usar now */
                    $fecha = ($fechaRecalc !== null && !(\App\Services\Agents\ReminderAgent::necesitaCorreccion($fechaRecalc, $tzRecordatorio)))
                        ? $fechaRecalc
                        : UserTimeService::nowLocalMysql($userId, $channelRecordatorio);
                }
                $payload  = [
                    'titulo'             => $titulo,
                    'mensaje'            => $mensajeR,
                    'channel'            => $channelRecordatorio,
                    'timezone'           => $tzRecordatorio,
                    'recurrence_minutes' => max(0, (int)($param['recurrence_minutes'] ?? 0)),
                ];
                $_created = (new AgentActionService())->crearProgramada(
                    $userId,
                    'reminder_notify',
                    $titulo,
                    $payload,
                    $fecha,
                    false // no requiere aprobación: fue pedido por el usuario directamente
                );
                return ['tipo' => $tipo, 'exito' => true];

            case 'proponer_whatsapp':
                $msg = sanitize_textarea_field((string)($param['mensaje'] ?? ''));
                if ($canal === 'whatsapp' && $msg !== '') {
                    /* Desde WhatsApp: solo se puede responder al propio sessionId.
                     * Prohibido enviar a números arbitrarios desde canal whatsapp
                     * para evitar que el LLM use el bot como herramienta de spam. */
                    $toParam = isset($param['to']) ? trim((string)$param['to']) : '';
                    if ($toParam !== '') {
                        /* Validar que el destino sea el mismo número de la sesión */
                        $sessionNum = preg_replace('/[^0-9]/', '', $this->activeSessionId);
                        $toNum      = preg_replace('/[^0-9]/', '', $toParam);
                        if ($sessionNum !== $toNum) {
                            return ['tipo' => $tipo, 'exito' => false, 'error' => 'Destino externo no permitido desde canal whatsapp'];
                        }
                    }
                    (new WacliService())->enviarTexto($toParam !== '' ? $toParam : null, $msg);
                    return ['tipo' => $tipo, 'exito' => true, 'enviado' => true];
                }
                /* Desde app: crear propuesta aprobable */
                $_created = (new AgentActionService())->crearPropuesta($userId, 'whatsapp_send_text', 'Enviar WhatsApp', [
                    'message' => $msg,
                    'to'      => $param['to'] ?? null,
                ]);
                return ['tipo' => $tipo, 'exito' => true, 'pendiente_aprobacion' => true];

            case 'guardar_memoria':
                $contenido = sanitize_textarea_field((string)($param['contenido'] ?? ''));
                $categoria = sanitize_key((string)($param['categoria'] ?? 'hechos'));
                /* Categorías permitidas — evita que el LLM invente wings arbitrarios */
                $categoriasValidas = ['preferencias', 'hechos', 'metas', 'whatsapp', 'chat'];
                if (!in_array($categoria, $categoriasValidas, true)) {
                    $categoria = 'hechos';
                }
                if ($contenido !== '' && $this->mempalace->disponible()) {
                    $guardado = $this->mempalace->remember($contenido, $categoria, $userId);
                    return ['tipo' => $tipo, 'exito' => $guardado];
                }
                return ['tipo' => $tipo, 'exito' => false, 'error' => 'MemPalace no disponible o contenido vacío'];

            /* [115A-6][125A-4] Acciones de hábitos.
             * Gotcha: WhatsApp usa fecha local del usuario y updatedAt nuevo para no perder el cambio por sync posterior. */
            case 'completar_habito':
                $id    = (int)($param['id'] ?? 0);
                $repo  = new HabitosRepository($userId);
                $habitos = $repo->getAll();
                $hoy   = $this->fechaHoyParaCanal($userId, $canal);
                /* [125A-9] Si el LLM eligió un ID viejo/inexistente, recuperar por nombre
                 * o intención del mensaje antes de decirle al usuario que no existe. */
                if ($id <= 0 || !$this->habitoExiste($habitos, $id)) {
                    $resuelto = $this->resolverHabitoReferido($habitos, $param, $this->activeUserMessage, $hoy);
                    if ($resuelto !== null) {
                        $id = (int)$resuelto['id'];
                    }
                }
                $encontrado = false;
                $habitoActualizado = null;
                $esNuevoCompletado = false;
                foreach ($habitos as &$h) {
                    if ((int)$h['id'] === $id) {
                        $encontrado = true;
                        $hist = (array)($h['historialCompletados'] ?? []);
                        if (!in_array($hoy, $hist, true)) {
                            $esNuevoCompletado = true;
                            $hist[] = $hoy;
                            $h['historialCompletados'] = $hist;
                            $h['ultimoCompletado'] = $hoy;
                            /* Incrementar racha si el día anterior también fue completado */
                            $ayer = date('Y-m-d', strtotime($hoy . ' -1 day'));
                            if (in_array($ayer, $hist, true) || (int)($h['racha'] ?? 0) === 0) {
                                $h['racha'] = (int)($h['racha'] ?? 0) + 1;
                            }
                        }
                        $h['updatedAt'] = $this->timestampMs();
                        $habitoActualizado = $h;
                        break;
                    }
                }
                unset($h);
                if (!$encontrado) {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => "Hábito id:{$id} no encontrado."];
                }
                $ok = $repo->saveAll([$habitoActualizado], true);
                if (!$ok) {
                    return ['tipo' => $tipo, 'exito' => false, 'id' => $id, 'error' => 'No se pudo guardar el hábito.'];
                }
                $verificado = false;
                foreach ($repo->getAll() as $persistido) {
                    if ((int)($persistido['id'] ?? 0) === $id) {
                        $histPersistido = (array)($persistido['historialCompletados'] ?? []);
                        $verificado = ($persistido['ultimoCompletado'] ?? '') === $hoy || in_array($hoy, $histPersistido, true);
                        break;
                    }
                }
                /* [125A-5] Registrar actividad igual que el flujo web (habitosStore → ActividadService).
                 * Solo cuando es un nuevo completado para hoy; ActividadService ya tiene dedup pero
                 * evitamos la llamada redundante. Falla silenciosa: no rompe el flujo principal. */
                if ($verificado && $esNuevoCompletado) {
                    try {
                        $actividad = (new ActividadService())->registrarActividad($userId, [
                            'tipo'        => 'habito_cumplido',
                            'elementoId'  => $id,
                            'elementoTipo' => 'habito',
                            'fecha'       => $hoy,
                            'detalles'    => ['elementoNombre' => $habitoActualizado['nombre'] ?? ''],
                        ]);
                        if (empty($actividad['success'])) {
                            error_log('[AgentChatProcessor] Actividad no registrada para hábito ' . $id . ': ' . ($actividad['error'] ?? 'error desconocido'));
                        }
                    } catch (\Throwable $actErr) {
                        error_log('[AgentChatProcessor] Error registrando actividad para hábito ' . $id . ': ' . $actErr->getMessage());
                    }
                }
                return ['tipo' => $tipo, 'exito' => $verificado, 'id' => $id, 'fecha' => $hoy, 'error' => $verificado ? null : 'El hábito no quedó persistido tras guardar.'];

            case 'posponer_habito':
                /* [fix-posponer-habito] Marca el hábito como pospuesto para hoy.
                 * Registra en ActividadService con tipo habito_pospuesto (igual que el flujo web). */
                $id     = (int)($param['id'] ?? 0);
                $hoy    = $this->fechaHoyParaCanal($userId, $canal);
                $repo   = new HabitosRepository($userId);
                $habitos = $repo->getAll();
                $nombreHabito = '';
                foreach ($habitos as &$h) {
                    if ((int)$h['id'] === $id) {
                        $nombreHabito = (string)($h['nombre'] ?? '');
                        /* Marcar como pospuesto hoy — el frontend usa este flag */
                        $h['pospuesto'] = true;
                        $h['pospuestoHoy'] = $hoy;
                        break;
                    }
                }
                unset($h);
                $_ok = $repo->saveAll($habitos);
                try {
                    $actividad = (new ActividadService())->registrarActividad($userId, [
                        'tipo'         => 'habito_pospuesto',
                        'elementoId'   => $id,
                        'elementoTipo' => 'habito',
                        'fecha'        => $hoy,
                        'detalles'     => ['elementoNombre' => $nombreHabito],
                    ]);
                    if (empty($actividad['success'])) {
                        error_log('[AgentChatProcessor] Actividad no registrada para posponer hábito ' . $id . ': ' . ($actividad['error'] ?? 'error desconocido'));
                    }
                } catch (\Throwable $actErr) {
                    error_log('[AgentChatProcessor] Error registrando actividad posponer hábito ' . $id . ': ' . $actErr->getMessage());
                }
                return ['tipo' => $tipo, 'exito' => true, 'id' => $id, 'fecha' => $hoy];

            case 'completar_subhabito':
                $id    = (int)($param['id'] ?? 0);
                $subId = (int)($param['subId'] ?? 0);
                $repo  = new HabitosRepository($userId);
                $habitos = $repo->getAll();
                foreach ($habitos as &$h) {
                    if ((int)$h['id'] === $id && isset($h['subhabitos'][$subId])) {
                        $h['subhabitos'][$subId]['completadoHoy'] = true;
                        break;
                    }
                }
                unset($h);
                $_ok = $repo->saveAll($habitos);
                return ['tipo' => $tipo, 'exito' => true, 'id' => $id, 'subId' => $subId];

            /* [115A-6] Acciones de notas ------------------------------------- */
            case 'leer_notas':
                $limite = min(20, max(1, (int)($param['limite'] ?? 10)));
                $notas  = (new NotasRepository($userId))->listar($limite);
                return ['tipo' => $tipo, 'exito' => true, 'notas' => $notas];

            /* [115A-6+116A-1] leer_nota: acción singular para leer contenido COMPLETO de una nota
             * por su ID. El contexto solo muestra títulos; esta acción permite al LLM obtener
             * el contenido completo cuando el usuario pregunta sobre una nota específica. */
            case 'leer_nota':
                $notaId = (int)($param['id'] ?? 0);
                if ($notaId <= 0) {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => 'ID de nota inválido'];
                }
                $nota = (new NotasRepository($userId))->obtener($notaId);
                if ($nota === null) {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => 'Nota no encontrada'];
                }
                /* Devolver contenido completo para que el LLM pueda leerlo */
                return [
                    'tipo' => $tipo,
                    'exito' => true,
                    'id' => $nota['id'],
                    'titulo' => $nota['titulo'],
                    'contenido' => $nota['contenido'],
                    'fecha' => $nota['fechaModificacion'] ?? $nota['fechaCreacion'] ?? null
                ];

            case 'crear_nota':
                $titulo    = sanitize_text_field((string)($param['titulo'] ?? ''));
                $contenido = sanitize_textarea_field((string)($param['contenido'] ?? ''));
                $nueva     = (new NotasRepository($userId))->guardar($contenido, $titulo !== '' ? $titulo : null);
                return ['tipo' => $tipo, 'exito' => $nueva !== null, 'id' => $nueva['id'] ?? null];

            case 'editar_nota':
                $id        = (int)($param['id'] ?? 0);
                $contenido = sanitize_textarea_field((string)($param['contenido'] ?? ''));
                $titulo    = isset($param['titulo']) ? sanitize_text_field((string)$param['titulo']) : null;
                $ok = (new NotasRepository($userId))->actualizar($id, $contenido, $titulo);
                return ['tipo' => $tipo, 'exito' => $ok, 'id' => $id];

            case 'buscar_nota':
                $termino    = sanitize_text_field((string)($param['termino'] ?? ''));
                $resultados = (new NotasRepository($userId))->buscar($termino, 10);
                return ['tipo' => $tipo, 'exito' => true, 'resultados' => $resultados];

            /* [115A-4] Gestión de recordatorios ------------------------------ */
            case 'listar_recordatorios':
                $lista    = (new AgentActionService())->listar($userId, 'pendiente', 20);
                $conFecha = array_values(array_filter($lista, fn($r) => !empty($r['fecha_programada'])));
                return ['tipo' => $tipo, 'exito' => true, 'recordatorios' => $conFecha];

            /* [126A-1] Fix: soportar recurrence_minutes en editar_recordatorio.
             * El LLM necesitaba poder cambiar el intervalo de repetición (ej: de 30 a 15 min)
             * pero el handler anterior no recolectaba este campo. Se mergea al payload
             * via payload_merge para que el scheduler lo use en programarSiguienteRecurrencia.
             * Gotcha: el cambio solo afecta a la acción pendiente actual; cuando se ejecute,
             * la siguiente recurrencia usará el nuevo intervalo automáticamente. */
            case 'editar_recordatorio':
                $id     = (int)($param['id'] ?? 0);
                $cambios = [];
                if (!empty($param['fecha']))   $cambios['fecha_programada'] = (string)$param['fecha'];
                if (!empty($param['titulo']))  $cambios['titulo']           = (string)$param['titulo'];
                if (!empty($param['mensaje'])) $cambios['payload_merge']    = ['mensaje' => sanitize_textarea_field((string)$param['mensaje'])];
                /* [126A-1] Soportar edición del intervalo de repetición */
                if (isset($param['recurrence_minutes'])) {
                    $cambios['payload_merge'] = array_merge(
                        (array)($cambios['payload_merge'] ?? []),
                        ['recurrence_minutes' => max(0, (int)$param['recurrence_minutes'])]
                    );
                }
                $actualizado = (new AgentActionService())->editarProgramada($id, $userId, $cambios);
                return ['tipo' => $tipo, 'exito' => $actualizado !== null, 'id' => $id];

            case 'eliminar_recordatorio':
                $id = (int)($param['id'] ?? 0);
                $ok = (new AgentActionService())->cancelar($id, $userId);
                /* [185A-1] Incluir razon en fallo para que el LLM sepa si el ID es obsoleto */
                return $ok
                    ? ['tipo' => $tipo, 'exito' => true, 'id' => $id]
                    : ['tipo' => $tipo, 'exito' => false, 'id' => $id, 'razon' => 'ID no encontrado, ya ejecutado o cancelado. Usa cancelar_todos_recordatorios o listar_recordatorios para obtener IDs actuales.'];

            /* [185A-1] Cancela TODOS los recordatorios pendientes del usuario de una vez.
             * Evita el problema de IDs obsoletos cuando el usuario pide 'borra todos'. */
            case 'cancelar_todos_recordatorios':
                $service = new AgentActionService();
                $pendientes = $service->listar($userId, 'pendiente', 100);
                $cancelados = 0;
                $ids = [];
                foreach ($pendientes as $r) {
                    if ($service->cancelar((int)$r['id'], $userId)) {
                        $cancelados++;
                        $ids[] = (int)$r['id'];
                    }
                }
                return ['tipo' => $tipo, 'exito' => true, 'cancelados' => $cancelados, 'ids' => $ids];

            /* [115A-3] Contexto maestro -------------------------------------- */
            case 'actualizar_contexto_maestro':
                $texto = sanitize_textarea_field((string)($param['texto'] ?? ''));
                $_ok = $this->updateMasterContext($userId, $texto);
                return ['tipo' => $tipo, 'exito' => true];

            /* [115A-13] Solicitudes de codigo remotas: crear propuesta aprobable, no ejecutar.
             * Gotcha: WhatsApp vive en produccion, pero OpenCode corre en la PC local del usuario.
             * Por eso solo persistimos job; el runner local lo reclamara con HMAC tras aprobacion. */
            case 'solicitar_opencode':
                $prompt = sanitize_textarea_field((string)($param['prompt'] ?? $param['mensaje'] ?? ''));
                if ($prompt === '') {
                    throw new \LogicException('solicitar_opencode requiere parámetro prompt.');
                }

                $proyectos  = $this->loadProjectsConfig();
                $proyecto   = sanitize_key((string)($param['proyecto'] ?? $this->getActiveProject($userId))) ?: 'glorytemplate';
                $agente     = sanitize_key((string)($param['agente'] ?? 'whatsapp-code')) ?: 'whatsapp-code';
                $branch     = sanitize_text_field((string)($param['branch'] ?? '')) ?: (string)($proyectos[$proyecto]['branch'] ?? 'main');
                /* [126A-2] Reasoning effort: valores validos 'max', 'high', 'minimal' o vacio (default del proyecto).
                 * Se pasa como --variant al runner y controla el nivel de pensamiento del modelo DeepSeek. */
                $reasoningEffort = in_array((string)($param['reasoning_effort'] ?? ''), ['max', 'high', 'minimal'], true)
                    ? (string)$param['reasoning_effort'] : '';
                $commit     = filter_var($param['commit'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $deploy     = filter_var($param['deploy'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $titulo     = 'OpenCode: ' . mb_substr(str_replace(["\r", "\n"], ' ', $prompt), 0, 80);

                /* [115A-15] WhatsApp ya autentico al usuario via HMAC: sin doble aprobacion.
                 * Otros canales (web, CLI) requieren aprobacion manual. */
                $requiereAprobacion = ($canal !== 'whatsapp');

                /* [125A-1] Incluir permisos extra guardados por el usuario para este job */
                $extraAllow = array_values(array_filter((array)get_option('glory_opencode_extra_allow', [])));
                $accion = (new AgentActionService())->crearPropuesta($userId, 'opencode_job', $titulo, [
                    'project'           => $proyecto,
                    'agent'             => $agente,
                    'branch'            => $branch,
                    'prompt'            => $prompt,
                    'reasoning_effort'  => $reasoningEffort,
                    'commit'            => $commit,
                    'deploy'            => $deploy,
                    'source'            => $canal,
                    'extra_permissions' => $extraAllow,
                ], $requiereAprobacion);

                return [
                    'tipo'               => $tipo,
                    'exito'              => true,
                    'pendiente_aprobacion' => $requiereAprobacion,
                    'accion_id'          => $accion['id'] ?? null,
                ];

            /* [115A-cont] Continuacion de sesion OpenCode: reutiliza session_id del job anterior
             * para que el agente recuerde el contexto de lo que ya hizo.
             * [fix-job-fallback] Si el LLM envía un job_id incorrecto (ej: copia el del ejemplo),
             * se busca automáticamente el job completado más reciente con session_id. */
            case 'continuar_opencode':
                $jobId  = (int)($param['job_id'] ?? 0);
                $prompt = sanitize_textarea_field((string)($param['mensaje'] ?? $param['prompt'] ?? ''));
                /* [fix-prompt-cleanup] El LLM a veces incluye el ses_XXXXX o frases como
                 * "Continuar sesión ses_XXX" como mensaje — eso llega a OpenCode como prompt
                 * literal y el modelo lo repite sin hacer nada útil. Strip esas partes. */
                $prompt = trim(preg_replace('/\bses_[a-zA-Z0-9]{6,80}\b/', '', $prompt));
                $prompt = trim(preg_replace('/^(continua|continuar|sigue|resume)(\s+(la|esa|esta|desde|la\s+sesion|sesion|session|desde\s+donde))*[\s:.,;-]*/iu', '', $prompt));
                if ($prompt === '') {
                    $prompt = 'Continúa desde donde quedaste en esta sesión.';
                }
                $svc = new \App\Services\Agent\OpencodeJobService();
                $jobUsado = $jobId;
                try {
                    if ($jobId <= 0) {
                        throw new \RuntimeException('job_id inválido, buscando fallback');
                    }
                    $accion = $svc->crearContinuacion($jobId, $userId, $prompt);
                } catch (\RuntimeException) {
                    /* Fallback: buscar el job completado más reciente con session_id */
                    $fallbackId = $this->mensajeConfirmaPermisosOpencode($this->activeUserMessage)
                        ? $this->resolverJobOpencodeConPermisosRecientes($userId)
                        : 0;
                    if ($fallbackId <= 0) {
                        foreach ($svc->listarRecientes(72, 5) as $j) {
                            if ((int)($j['user_id'] ?? 0) !== $userId || $this->extraerSessionIdDeJob($j) === '') {
                                continue;
                            }
                            $fallbackId = (int)$j['id'];
                            break;
                        }
                    }
                    if ($fallbackId <= 0) {
                        throw new \LogicException("Job anterior #{$jobId} no encontrado y no hay sesiones recientes disponibles.");
                    }
                    $jobUsado = $fallbackId;
                    $accion = $svc->crearContinuacion($fallbackId, $userId, $prompt);
                }
                return [
                    'tipo'      => $tipo,
                    'exito'     => true,
                    'accion_id' => $accion['id'] ?? null,
                    'job_id'    => $jobUsado,
                    'session_id' => (string)($accion['payload']['session_id'] ?? ''),
                ];

            /* [125A-1] Agrega comandos bash al allowlist persistente de OpenCode.
             * El runner los inyecta en el YAML del agente antes de ejecutar cada job.
             * El chatbot debe confirmar con el usuario antes de llamar esta acción. */
            case 'actualizar_opencode_allowlist':
                $comandos = array_values(array_filter(
                    array_map('sanitize_text_field', (array)($param['comandos'] ?? [])),
                    fn(string $c): bool => $c !== ''
                ));
                if (empty($comandos)) {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => 'Se requieren comandos a permitir.'];
                }
                $actual = array_values(array_filter((array)get_option('glory_opencode_extra_allow', [])));
                foreach ($comandos as $cmd) {
                    if (!in_array($cmd, $actual, true)) {
                        $actual[] = $cmd;
                    }
                }
                update_option('glory_opencode_extra_allow', $actual);
                return ['tipo' => $tipo, 'exito' => true, 'permitidos' => $actual];

            /* Cancela un job de OpenCode activo (pendiente o ejecutando). El runner detecta
             * el cambio de estado en su polling y mata el proceso OpenCode. */
            case 'cancelar_opencode':
                $jobId = (int)($param['job_id'] ?? 0);
                if ($jobId <= 0) {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => 'Se requiere job_id válido.'];
                }
                $cancelado = (new \App\Services\Agent\OpencodeJobService())->cancelar($jobId);
                if ($cancelado === null) {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => "Job {$jobId} no encontrado o ya en estado final."];
                }
                return ['tipo' => $tipo, 'exito' => true, 'job' => $cancelado];

            /* [115A-context] Devuelve estadísticas del contexto de la sesión actual. */
            case 'reportar_contexto':
                global $wpdb;
                $tabla = \App\Database\Schema::getTableName('agent_chat_messages');
                $ctxRows = $wpdb->get_results($wpdb->prepare(
                    "SELECT contenido FROM {$tabla} WHERE user_id = %d AND session_id = %s",
                    $userId, $this->activeSessionId
                ), ARRAY_A);
                $ctxChars   = array_sum(array_map(fn($r) => strlen((string)$r['contenido']), $ctxRows));
                $ctxMsgs    = count($ctxRows);
                $ctxLimit   = $this->compactionCharsThreshold();
                $ctxPct     = $ctxLimit > 0 ? (int) round($ctxChars / $ctxLimit * 100) : 0;
                $ctxTokens  = (int) round($ctxChars / 4);
                $limTokens  = (int) round($ctxLimit / 4);
                return [
                    'tipo'           => $tipo,
                    'exito'          => true,
                    'chars'          => $ctxChars,
                    'tokens_aprox'   => $ctxTokens,
                    'mensajes'       => $ctxMsgs,
                    'limite_chars'   => $ctxLimit,
                    'limite_tokens'  => $limTokens,
                    'porcentaje_uso' => $ctxPct,
                ];

            /* [115A-context] Fuerza compactación inmediata del historial. */
            case 'compactar_ahora':
                $this->compactarHistorialSiNecesario($userId, $this->activeSessionId, true);
                return ['tipo' => $tipo, 'exito' => true];

            /* [115A-context] Cambia el límite de chars para compactación automática. */
            case 'cambiar_limite_compactacion':
                $nuevoLimite = max(2000, (int)($param['chars'] ?? 0));
                update_option('glory_chatbot_compaction_chars', $nuevoLimite);
                return ['tipo' => $tipo, 'exito' => true, 'nuevo_limite_chars' => $nuevoLimite, 'nuevo_limite_tokens' => (int) round($nuevoLimite / 4)];

            /* [126A-1] Lista los proyectos disponibles desde config/opencode-projects.json.
             * Devuelve ID, repo, branch_default y cuál está activo para que el LLM lo muestre al usuario. */
            case 'listar_proyectos':
                $proyectos = $this->loadProjectsConfig();
                $activo    = $this->getActiveProject($userId);
                $lista     = [];
                foreach ($proyectos as $id => $cfg) {
                    $lista[] = [
                        'id'             => $id,
                        'repo'           => (string)($cfg['repo'] ?? ''),
                        'branch_default' => (string)($cfg['branch'] ?? ''),
                        'activo'         => ($id === $activo),
                    ];
                }
                return ['tipo' => $tipo, 'exito' => true, 'proyectos' => $lista, 'activo' => $activo];

            /* [126A-1] Crea un job de consulta rápida en el proyecto activo para listar ramas git.
             * El runner ejecuta el comando directamente sin OpenCode y reporta el resultado.
             * No requiere aprobación porque no modifica nada — es solo consulta. */
            case 'listar_ramas':
                $proyectos   = $this->loadProjectsConfig();
                /* Si el LLM especificó un proyecto en parámetros, usarlo; si no, el activo */
                $proyectoSolicitado = sanitize_key((string)($param['proyecto'] ?? $param['project'] ?? ''));
                $proyectoDestino    = ($proyectoSolicitado !== '' && isset($proyectos[$proyectoSolicitado]))
                    ? $proyectoSolicitado
                    : $this->getActiveProject($userId);
                $proyectoCfg = $proyectos[$proyectoDestino] ?? [];
                if (empty($proyectoCfg)) {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => "Proyecto activo '{$proyectoDestino}' no encontrado en configuración."];
                }
                $titulo     = 'Consultar ramas: ' . $proyectoDestino;
                $extraAllow = array_values(array_filter((array)get_option('glory_opencode_extra_allow', [])));
                $accion     = (new AgentActionService())->crearPropuesta($userId, 'opencode_job', $titulo, [
                    'project'            => $proyectoDestino,
                    'prompt'             => '',
                    'es_consulta_rapida' => true,
                    'comando'            => 'git branch -a',
                    'branch'             => '',
                    'commit'             => false,
                    'deploy'             => false,
                    'source'             => $canal,
                    'extra_permissions'  => $extraAllow,
                ], false); // sin aprobación — es solo consulta
                return [
                    'tipo'      => $tipo,
                    'exito'     => true,
                    'accion_id' => $accion['id'] ?? null,
                    'proyecto'  => $proyectoDestino,
                ];

            /* [126A-1] Cambia el proyecto activo del usuario. Valida contra la whitelist
             * antes de persistir para evitar proyectos no configurados. */
            case 'cambiar_proyecto':
                $nuevoProyecto = sanitize_key((string)($param['proyecto'] ?? $param['project'] ?? ''));
                if ($nuevoProyecto === '') {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => 'Se requiere parámetro proyecto.'];
                }
                $proyectos = $this->loadProjectsConfig();
                if (!isset($proyectos[$nuevoProyecto])) {
                    return ['tipo' => $tipo, 'exito' => false, 'error' => "Proyecto '{$nuevoProyecto}' no está en la whitelist de opencode-projects.json."];
                }
                $this->setActiveProject($userId, $nuevoProyecto);
                return ['tipo' => $tipo, 'exito' => true, 'proyecto' => $nuevoProyecto];

            case 'automejora':
                /* [125A-8] Automejora del agente: modifica el código del propio agente
                 * (repositorio glorytemplate, rama glory-react-logic).
                 * Siempre hace commit; deploy solo si riesgo es "bajo".
                 * Parámetros: prompt (obligatorio), riesgo (opcional: bajo|medio|alto, default medio). */
                $promptAutomejora = sanitize_textarea_field((string)($param['prompt'] ?? ''));
                if ($promptAutomejora === '') {
                    throw new \LogicException('automejora requiere parámetro prompt.');
                }

                $riesgoAutomejora = in_array((string)($param['riesgo'] ?? ''), ['bajo', 'medio', 'alto'], true)
                    ? (string)$param['riesgo'] : 'medio';
                $commitAutomejora = true;  // automejora siempre hace commit
                $deployAutomejora = ($riesgoAutomejora === 'bajo'); // solo deploy si riesgo bajo

                $proyectosAutomejora = $this->loadProjectsConfig();
                $proyectoAutomejora  = 'glorytemplate';
                $branchAutomejora    = (string)($proyectosAutomejora[$proyectoAutomejora]['branch'] ?? 'glory-react-logic');
                $agenteAutomejora    = 'whatsapp-code';

                /* Prompt compuesto: deja claro que es automejora del agente */
                $promptCompletoAutomejora = "AUTOMEJORA DEL AGENTE\n"
                    . "Proyecto: glorytemplate\n"
                    . "Rama: {$branchAutomejora}\n"
                    . "Riesgo: {$riesgoAutomejora}\n\n"
                    . "Tarea:\n{$promptAutomejora}";

                $extraAllowAutomejora = array_values(array_filter((array)get_option('glory_opencode_extra_allow', [])));
                $accionAutomejora = (new AgentActionService())->crearPropuesta(
                    $userId,
                    'opencode_job',
                    'Automejora: ' . mb_substr(str_replace(["\r", "\n"], ' ', $promptAutomejora), 0, 80),
                    [
                        'project'           => $proyectoAutomejora,
                        'agent'             => $agenteAutomejora,
                        'branch'            => $branchAutomejora,
                        'prompt'            => $promptCompletoAutomejora,
                        'reasoning_effort'  => 'max',
                        'commit'            => $commitAutomejora,
                        'deploy'            => $deployAutomejora,
                        'source'            => $canal,
                        'extra_permissions' => $extraAllowAutomejora,
                    ],
                    ($canal !== 'whatsapp')  // auto-aprobar desde WhatsApp
                );

                return [
                    'tipo'                 => $tipo,
                    'exito'                => true,
                    'pendiente_aprobacion' => ($canal !== 'whatsapp'),
                    'accion_id'            => $accionAutomejora['id'] ?? null,
                    'proyecto'             => $proyectoAutomejora,
                    'branch'               => $branchAutomejora,
                    'riesgo'               => $riesgoAutomejora,
                ];

            default:
                return ['tipo' => $tipo, 'exito' => false, 'error' => 'Tipo de acción no soportado en canal server-side'];
        }
    }

    private function puedeUsarAccionesCodigo(int $userId): bool
    {
        return $userId > 0 && user_can($userId, 'manage_options');
    }

    private function esAccionCodigoRestringida(string $tipo): bool
    {
        return in_array($tipo, [
            'solicitar_opencode',
            'continuar_opencode',
            'actualizar_opencode_allowlist',
            'cancelar_opencode',
            'listar_proyectos',
            'listar_ramas',
            'cambiar_proyecto',
            'automejora',
            'cambiar_limite_compactacion',
        ], true);
    }

    /* --- Memoria ------------------------------------------------------------ */

    private function guardarMemoria(int $userId, string $userMsg, string $assistantMsg, string $canal, string $sessionId): void
    {
        if (!$this->mempalace->disponible()) {
            return;
        }
        /* Solo guardar intercambios con sustancia mínima para no saturar el palace.
         * Los hechos explícitos se guardan via acción guardar_memoria (ver ejecutarAccion). */
        if (strlen($userMsg) < 40 || strlen($assistantMsg) < 20) {
            return;
        }
        $resumen = "Usuario (canal:{$canal}): {$userMsg}\nAsistente: {$assistantMsg}";
        $this->mempalace->remember($resumen, 'chat', $userId);
    }

    /* --- Compactación de historial ----------------------------------------- */

    /* [115A-1] Compacta el historial cuando el total de chars supera el threshold configurable.
     * En lugar de contar mensajes, mide el tamaño real del contexto. Conserva los últimos
     * COMPACTION_KEEP_CHARS chars. Usa el modelo configurado (no hardcodeado). */
    /* [115A-context] $forzar=true omite el check del threshold — para compactación manual. */
    private function compactarHistorialSiNecesario(int $userId, string $sessionId, bool $forzar = false): void
    {
        global $wpdb;
        $tabla = \App\Database\Schema::getTableName('agent_chat_messages');

        /* Cargar todos los mensajes ordenados para calcular tamaño total */
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT id, rol, contenido FROM {$tabla}
             WHERE user_id = %d AND session_id = %s
             ORDER BY id ASC",
            $userId, $sessionId
        ), ARRAY_A);

        if (empty($rows)) {
            return;
        }

        $totalChars = array_sum(array_map(fn($r) => strlen((string)$r['contenido']), $rows));
        $threshold  = $this->compactionCharsThreshold();

        if (!$forzar && $totalChars <= $threshold) {
            return;
        }

        /* Determinar qué mensajes conservar: acumular desde el final hasta COMPACTION_KEEP_CHARS */
        $rowsReverse = array_reverse($rows);
        $keptChars   = 0;
        $keepIds     = [];
        foreach ($rowsReverse as $r) {
            $keptChars += strlen((string)$r['contenido']);
            if ($keptChars > self::COMPACTION_KEEP_CHARS) {
                break;
            }
            $keepIds[] = $r['id'];
        }

        /* IDs a compactar: los que no están en keepIds y no son 'sistema' */
        $idsACompactar = array_values(array_map(
            fn($r) => (int)$r['id'],
            array_filter($rows, fn($r) => !in_array($r['id'], $keepIds, true) && $r['rol'] !== 'sistema')
        ));

        if (empty($idsACompactar)) {
            return;
        }

        /* Recuperar texto de los mensajes a compactar */
        $placeholders = implode(',', array_fill(0, count($idsACompactar), '%d'));
        $toCompact    = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT rol, contenido FROM {$tabla} WHERE id IN ({$placeholders}) ORDER BY id ASC",
                ...$idsACompactar
            ),
            ARRAY_A
        );

        if (empty($toCompact)) {
            return;
        }

        $bloque = implode("\n", array_map(
            fn($r) => ($r['rol'] === 'usuario' ? 'U' : 'A') . ': ' . $r['contenido'],
            $toCompact
        ));

        /* Resumir con el modelo configurado */
        $llm       = $this->resolverConfigLLM($userId);
        $llmResult = (new LLMProviderService())->enviarChat(
            [
                ['role' => 'system', 'content' => 'Eres un asistente que resume conversaciones. Resume en 3-5 oraciones los puntos clave de esta conversación, en tercera persona, para ser usados como contexto futuro. Incluye: decisiones tomadas, datos personales mencionados, tareas creadas. Sé conciso.'],
                ['role' => 'user',   'content' => $bloque],
            ],
            $llm['proveedor'],
            $llm['modelo'],
            ['temperature' => 0.3, 'maxTokens' => 300]
        );

        $resumen = trim((string)($llmResult['contenido'] ?? $llmResult['content'] ?? $llmResult['message'] ?? ''));
        if ($resumen === '') {
            return;
        }

        /* Borrar los mensajes compactados */
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$tabla} WHERE id IN ({$placeholders})",
                ...$idsACompactar
            )
        );

        /* Insertar el bloque resumen como mensaje 'sistema' al inicio del historial */
        $_ok = $this->chat->guardarMensaje(
            $userId,
            $sessionId,
            'sistema',
            '[Resumen de conversación anterior] ' . $resumen,
            null,
            0
        );
    }

    /* --- Configuración LLM ------------------------------------------------- */

    /* [Fase-6] Lee proveedor y modelo desde user_meta del usuario primero,
     * con fallback a WP options globales.
     * Se configuran desde el panel "Asistente IA" sincronizando al servidor.
     * Fallback: groq + llama-3.3-70b-versatile */
    private function resolverConfigLLM(int $userId): array
    {
        $proveedor = (string)(get_user_meta($userId, 'glory_chatbot_proveedor', true) ?: get_option('glory_chatbot_proveedor') ?: 'groq');
        $modelo    = (string)(get_user_meta($userId, 'glory_chatbot_modelo', true)    ?: get_option('glory_chatbot_modelo')    ?: 'openai/gpt-oss-120b');
        return ['proveedor' => $proveedor, 'modelo' => $modelo];
    }

    private function compactionCharsThreshold(): int
    {
        return max(2000, (int)(get_option('glory_chatbot_compaction_chars') ?: 8000));
    }

    /* --- Contexto maestro -------------------------------------------------- */

    /* [115A-3] Lee el contexto maestro del usuario (texto persistente en user_meta). */
    private function getMasterContext(int $userId): string
    {
        $val = get_user_meta($userId, 'glory_chatbot_master_context', true);
        return is_string($val) ? $val : '';
    }

    /* Actualiza el contexto maestro. Si supera MASTER_CONTEXT_MAX_CHARS, lo compacta primero. */
    private function updateMasterContext(int $userId, string $texto): void
    {
        if (strlen($texto) > self::MASTER_CONTEXT_MAX_CHARS) {
            $this->compactarContextoMaestro($userId, $texto);
            return; // compactarContextoMaestro guarda el resultado
        }
        update_user_meta($userId, 'glory_chatbot_master_context', $texto);
    }

    private function compactarContextoMaestro(int $userId, string $texto): void
    {
        $llm       = $this->resolverConfigLLM($userId);
        $llmResult = (new LLMProviderService())->enviarChat(
            [
                ['role' => 'system', 'content' => 'Resume el siguiente contexto personal del usuario en máximo 2000 caracteres, conservando todos los datos importantes: preferencias, instrucciones permanentes, datos personales, metas. Sé conciso pero completo.'],
                ['role' => 'user',   'content' => $texto],
            ],
            $llm['proveedor'],
            $llm['modelo'],
            ['temperature' => 0.2, 'maxTokens' => 600]
        );
        $resumen = trim((string)($llmResult['contenido'] ?? $llmResult['content'] ?? $llmResult['message'] ?? ''));
        if ($resumen !== '') {
            update_user_meta($userId, 'glory_chatbot_master_context', $resumen);
        }
    }
}
