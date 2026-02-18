<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/UsuariosExtSchema.php */

namespace App\Config\Schema\_generated;

final class UsuariosExtDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $wpUserId,
        public readonly string $username,
        public readonly ?string $email,
        public readonly string $nombreVisible,
        public readonly string $bio,
        public readonly ?string $avatarUrl,
        public readonly ?string $portadaUrl,
        public readonly string $plan,
        public readonly string $rol,
        public readonly bool $verificado,
        public readonly int $totalSeguidores,
        public readonly int $totalSeguidos,
        public readonly int $totalSamples,
        public readonly int $totalDescargas,
        public readonly ?string $stripeCustomerId,
        public readonly ?string $stripeConnectId,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly int $violacionesModeracion,
        public readonly ?string $baneadoHasta,
        public readonly ?string $banRazon,
        public readonly int $creditosBonus,
        public readonly ?string $stripeSubscriptionId
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en usuarios_ext", 'usuarios_ext', 'id')),
            wpUserId: (int) ($row['wp_user_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'wp_user_id' ausente en usuarios_ext", 'usuarios_ext', 'wp_user_id')),
            username: ($row['username'] ?? throw new \Glory\Exception\SchemaException("Columna 'username' ausente en usuarios_ext", 'usuarios_ext', 'username')),
            email: isset($row['email']) ? $row['email'] : null,
            nombreVisible: ($row['nombre_visible'] ?? ''),
            bio: ($row['bio'] ?? ''),
            avatarUrl: isset($row['avatar_url']) ? $row['avatar_url'] : null,
            portadaUrl: isset($row['portada_url']) ? $row['portada_url'] : null,
            plan: ($row['plan'] ?? 'free'),
            rol: ($row['rol'] ?? 'usuario'),
            verificado: (bool) ($row['verificado'] ?? false),
            totalSeguidores: (int) ($row['total_seguidores'] ?? 0),
            totalSeguidos: (int) ($row['total_seguidos'] ?? 0),
            totalSamples: (int) ($row['total_samples'] ?? 0),
            totalDescargas: (int) ($row['total_descargas'] ?? 0),
            stripeCustomerId: isset($row['stripe_customer_id']) ? $row['stripe_customer_id'] : null,
            stripeConnectId: isset($row['stripe_connect_id']) ? $row['stripe_connect_id'] : null,
            createdAt: ($row['created_at'] ?? 'NOW()'),
            updatedAt: ($row['updated_at'] ?? 'NOW()'),
            violacionesModeracion: (int) ($row['violaciones_moderacion'] ?? 0),
            baneadoHasta: isset($row['baneado_hasta']) ? $row['baneado_hasta'] : null,
            banRazon: isset($row['ban_razon']) ? $row['ban_razon'] : null,
            creditosBonus: (int) ($row['creditos_bonus'] ?? 0),
            stripeSubscriptionId: isset($row['stripe_subscription_id']) ? $row['stripe_subscription_id'] : null
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
