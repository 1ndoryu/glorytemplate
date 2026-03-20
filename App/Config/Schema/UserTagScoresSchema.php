<?php

/* [2003A-35] Schema de afinidad tag↔usuario materializada.
 * Poblada por TagAffinityService en background, consumida por score_tags CTE. */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class UserTagScoresSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'user_tag_scores';
    }

    public function columnas(): array
    {
        return [
            'user_id'       => ['tipo' => 'int', 'pk' => true, 'ref' => 'usuarios_ext(id)'],
            'tag'           => ['tipo' => 'string', 'pk' => true],
            'w_likes'       => ['tipo' => 'float', 'default' => 0],
            'w_repro'       => ['tipo' => 'float', 'default' => 0],
            'w_tiempo'      => ['tipo' => 'float', 'default' => 0],
            'w_descargas'   => ['tipo' => 'float', 'default' => 0],
            'w_completadas' => ['tipo' => 'float', 'default' => 0],
            'w_dislikes'    => ['tipo' => 'float', 'default' => 0],
            'w_ctx'         => ['tipo' => 'float', 'default' => 0],
            'updated_at'    => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
