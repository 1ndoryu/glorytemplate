<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/TransaccionesSchema.php */

namespace App\Config\Schema\_generated;

final class TransaccionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $compradorId,
        public readonly ?int $creadorId,
        public readonly ?int $sampleId,
        public readonly string $tipo,
        public readonly float $monto,
        public readonly string $moneda,
        public readonly string $estado,
        public readonly ?string $stripePaymentId,
        public readonly string $createdAt,
        public readonly float $pagoCreador,
        public readonly float $comisionPlataforma
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en transacciones", 'transacciones', 'id')),
            compradorId: (int) ($row['comprador_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'comprador_id' ausente en transacciones", 'transacciones', 'comprador_id')),
            creadorId: isset($row['creador_id']) ? (int) $row['creador_id'] : null,
            sampleId: isset($row['sample_id']) ? (int) $row['sample_id'] : null,
            tipo: ($row['tipo'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo' ausente en transacciones", 'transacciones', 'tipo')),
            monto: (float) ($row['monto'] ?? throw new \Glory\Exception\SchemaException("Columna 'monto' ausente en transacciones", 'transacciones', 'monto')),
            moneda: ($row['moneda'] ?? 'USD'),
            estado: ($row['estado'] ?? 'pendiente'),
            stripePaymentId: isset($row['stripe_payment_id']) ? $row['stripe_payment_id'] : null,
            createdAt: ($row['created_at'] ?? 'NOW()'),
            pagoCreador: (float) ($row['pago_creador'] ?? 0),
            comisionPlataforma: (float) ($row['comision_plataforma'] ?? 0)
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
