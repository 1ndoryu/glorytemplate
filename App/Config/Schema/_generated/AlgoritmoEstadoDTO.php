<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/AlgoritmoEstadoSchema.php */

namespace App\Config\Schema\_generated;

final class AlgoritmoEstadoDTO
{
    public function __construct(
        public readonly int $usuarioId,
        public readonly int $cntLikes,
        public readonly int $cntReproducciones,
        public readonly int $cntCompletas,
        public readonly int $cntDescargas,
        public readonly int $cntFollows,
        public readonly int $cntComentarios,
        public readonly int $cntLikesPreciso,
        public readonly int $cntReproduccionesPreciso,
        public readonly int $cntCompletasPreciso,
        public readonly int $cntDescargasPreciso,
        public readonly int $cntFollowsPreciso,
        public readonly int $cntComentariosPreciso,
        public readonly string $ultimoRapido,
        public readonly string $ultimoPreciso,
        public readonly string $ultimaActividad,
        public readonly int $versionPerfil
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en algoritmo_estado", 'algoritmo_estado', 'usuario_id')),
            cntLikes: (int) ($row['cnt_likes'] ?? 0),
            cntReproducciones: (int) ($row['cnt_reproducciones'] ?? 0),
            cntCompletas: (int) ($row['cnt_completas'] ?? 0),
            cntDescargas: (int) ($row['cnt_descargas'] ?? 0),
            cntFollows: (int) ($row['cnt_follows'] ?? 0),
            cntComentarios: (int) ($row['cnt_comentarios'] ?? 0),
            cntLikesPreciso: (int) ($row['cnt_likes_preciso'] ?? 0),
            cntReproduccionesPreciso: (int) ($row['cnt_reproducciones_preciso'] ?? 0),
            cntCompletasPreciso: (int) ($row['cnt_completas_preciso'] ?? 0),
            cntDescargasPreciso: (int) ($row['cnt_descargas_preciso'] ?? 0),
            cntFollowsPreciso: (int) ($row['cnt_follows_preciso'] ?? 0),
            cntComentariosPreciso: (int) ($row['cnt_comentarios_preciso'] ?? 0),
            ultimoRapido: ($row['ultimo_rapido'] ?? 'NOW()'),
            ultimoPreciso: ($row['ultimo_preciso'] ?? 'NOW()'),
            ultimaActividad: ($row['ultima_actividad'] ?? 'NOW()'),
            versionPerfil: (int) ($row['version_perfil'] ?? 0)
        );
    }

    /**
     * Convertir a array asociativo (para serialización JSON).
     */
    public function aArray(): array
    {
        return get_object_vars($this);
    }
}
