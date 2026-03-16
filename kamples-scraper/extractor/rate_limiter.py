"""
Rate limiter centralizado para el pipeline de extraccion.

Garantiza:
- Intervalo minimo entre acciones (medido de INICIO a INICIO: si la accion duro 30s
  y el intervalo es 60s, espera 30s mas; si duro 70s, no espera).
- Jitter aleatorio configurable para evitar comportamiento robotico.
- Limite diario maximo de operaciones.
- Persistencia del contador diario entre reinicios del pipeline (archivo estado).
"""

import logging
import os
import random
import time

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Rate limiter con intervalo minimo configurable, jitter aleatorio y limite diario.

    El intervalo se mide de INICIO a INICIO de cada accion:
    - Accion duro 30s, intervalo 60s -> espera 30s mas.
    - Accion duro 70s, intervalo 60s -> no espera (ya se paso).

    El jitter agrega un delay aleatorio entre jitter_min y jitter_max segundos
    al intervalo base, evitando patron temporal predecible.
    """

    def __init__(
        self,
        intervalo_seg: float = 60.0,
        limite_diario: int = 2000,
        archivo_estado: str | None = None,
        jitter_min_seg: float = 0.0,
        jitter_max_seg: float = 0.0,
    ):
        self.intervalo_seg = intervalo_seg
        self.limite_diario = limite_diario
        self.jitter_min_seg = jitter_min_seg
        self.jitter_max_seg = jitter_max_seg
        self._ultimo_inicio: float = 0
        self._cuenta_hoy: int = 0
        self._fecha_hoy: str = ""
        self._archivo_estado = archivo_estado or os.path.join(
            os.path.dirname(__file__), ".rate_limiter_state"
        )
        self._cargar_estado()

    def _calcular_jitter(self) -> float:
        """Retorna un delay aleatorio dentro del rango configurado."""
        if self.jitter_max_seg <= 0:
            return 0.0
        return random.uniform(self.jitter_min_seg, self.jitter_max_seg)

    def esperar(self) -> bool:
        """
        Espera si es necesario para respetar el intervalo entre acciones.

        Retorna True si se puede continuar, False si se excede el limite diario.
        Debe llamarse ANTES de iniciar cada accion.
        """
        self._resetear_si_nuevo_dia()

        if self._cuenta_hoy >= self.limite_diario:
            logger.warning(
                "Limite diario alcanzado: %d/%d operaciones",
                self._cuenta_hoy, self.limite_diario,
            )
            return False

        if self._ultimo_inicio > 0:
            jitter = self._calcular_jitter()
            intervalo_efectivo = self.intervalo_seg + jitter
            transcurrido = time.monotonic() - self._ultimo_inicio
            restante = intervalo_efectivo - transcurrido
            if restante > 0:
                logger.debug(
                    "Rate limiter: esperando %.1fs (base=%.0fs + jitter=%.0fs)",
                    restante, self.intervalo_seg, jitter,
                )
                time.sleep(restante)

        self._ultimo_inicio = time.monotonic()
        self._cuenta_hoy += 1
        self._guardar_estado()

        logger.debug(
            "Rate limiter: operacion %d/%d del dia",
            self._cuenta_hoy, self.limite_diario,
        )
        return True

    @property
    def operaciones_hoy(self) -> int:
        """Operaciones ejecutadas hoy."""
        self._resetear_si_nuevo_dia()
        return self._cuenta_hoy

    @property
    def restantes_hoy(self) -> int:
        """Operaciones restantes para hoy."""
        self._resetear_si_nuevo_dia()
        return max(0, self.limite_diario - self._cuenta_hoy)

    def _resetear_si_nuevo_dia(self) -> None:
        hoy = time.strftime("%Y-%m-%d")
        if hoy != self._fecha_hoy:
            if self._fecha_hoy:
                logger.info(
                    "Nuevo dia: reseteando contador (ayer: %d operaciones)",
                    self._cuenta_hoy,
                )
            self._fecha_hoy = hoy
            self._cuenta_hoy = 0

    def _cargar_estado(self) -> None:
        """Cargar estado persistido para sobrevivir reinicios del pipeline."""
        try:
            if os.path.exists(self._archivo_estado):
                with open(self._archivo_estado, "r") as f:
                    partes = f.read().strip().split("|")
                    if len(partes) == 2:
                        fecha, cuenta = partes
                        if fecha == time.strftime("%Y-%m-%d"):
                            self._fecha_hoy = fecha
                            self._cuenta_hoy = int(cuenta)
                            logger.info(
                                "Rate limiterr: estado restaurado — %d operaciones hoy",
                                self._cuenta_hoy,
                            )
        except (OSError, ValueError):
            pass

    def _guardar_estado(self) -> None:
        """Persistir cuenta diaria en archivo."""
        try:
            with open(self._archivo_estado, "w") as f:
                f.write(f"{self._fecha_hoy}|{self._cuenta_hoy}")
        except OSError:
            pass
