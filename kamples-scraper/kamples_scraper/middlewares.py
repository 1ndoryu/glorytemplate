"""
Kamples Scraper — Middlewares.

DataImpulseProxyMiddleware: inyecta proxy residencial en cada request.
BandwidthTrackerMiddleware: registra bytes consumidos y alerta al 80%.
"""

import logging
from scrapy import signals

logger = logging.getLogger(__name__)


class DataImpulseProxyMiddleware:
    """
    Inyecta proxy DataImpulse en cada request.
    Lee config de settings.py (PROXY_HOST, PROXY_PORT, etc.)
    """

    @classmethod
    def from_crawler(cls, crawler):
        middleware = cls()
        middleware.proxy_host = crawler.settings.get("PROXY_HOST", "")
        middleware.proxy_port = crawler.settings.get("PROXY_PORT", "823")
        middleware.proxy_user = crawler.settings.get("PROXY_USER", "")
        middleware.proxy_password = crawler.settings.get("PROXY_PASSWORD", "")
        return middleware

    def process_request(self, request, spider):
        if not self.proxy_user or not self.proxy_password:
            logger.debug("Proxy no configurado, request directo")
            return None

        proxy_url = (
            f"http://{self.proxy_user}:{self.proxy_password}"
            f"@{self.proxy_host}:{self.proxy_port}"
        )
        request.meta["proxy"] = proxy_url
        return None


class BandwidthTrackerMiddleware:
    """
    Rastrea bytes descargados y alerta al alcanzar 80% del presupuesto.
    Cierra el spider si se excede el presupuesto.
    """

    def __init__(self):
        self.total_bytes = 0
        self.budget_bytes = 0
        self.alerted_80 = False

    @classmethod
    def from_crawler(cls, crawler):
        middleware = cls()
        middleware.budget_bytes = crawler.settings.getint("PROXY_BUDGET_BYTES", 5368709120)
        crawler.signals.connect(middleware.spider_closed, signal=signals.spider_closed)
        return middleware

    def process_response(self, request, response, spider):
        body_size = len(response.body) if response.body else 0
        self.total_bytes += body_size

        if not self.alerted_80 and self.total_bytes >= self.budget_bytes * 0.8:
            self.alerted_80 = True
            logger.warning(
                "ALERTA: 80%% del presupuesto de proxy consumido. "
                "Usado: %.2f MB de %.2f MB",
                self.total_bytes / (1024 * 1024),
                self.budget_bytes / (1024 * 1024),
            )

        if self.total_bytes >= self.budget_bytes:
            logger.error(
                "PRESUPUESTO EXCEDIDO: %.2f MB. Cerrando spider.",
                self.total_bytes / (1024 * 1024),
            )
            spider.crawler.engine.close_spider(spider, "budget_exceeded")

        return response

    def spider_closed(self, spider, reason):
        logger.info(
            "Bandwidth total consumido: %.2f MB (%d bytes)",
            self.total_bytes / (1024 * 1024),
            self.total_bytes,
        )
