"""
Kamples Scraper — Middlewares.

CurlCffiDownloaderMiddleware: usa curl_cffi para TLS fingerprinting (bypass Cloudflare).
BandwidthTrackerMiddleware: registra bytes consumidos y alerta al 80%.
"""

import logging

from scrapy import signals
from scrapy.http import HtmlResponse
from twisted.internet import threads

from curl_cffi import requests as curl_requests

logger = logging.getLogger(__name__)


class CurlCffiDownloaderMiddleware:
    """
    Middleware que reemplaza el downloader HTTP estándar de Scrapy
    con curl_cffi para emular TLS fingerprint de Chrome.

    Resuelve el bloqueo de Cloudflare (403 "Just a moment...").
    Lee proxy de settings; si no hay proxy, request directo.
    """

    @classmethod
    def from_crawler(cls, crawler):
        middleware = cls()
        host = crawler.settings.get("PROXY_HOST", "")
        port = crawler.settings.get("PROXY_PORT", "823")
        user = crawler.settings.get("PROXY_USER", "")
        password = crawler.settings.get("PROXY_PASSWORD", "")

        if user and password and host:
            proxy_url = f"http://{user}:{password}@{host}:{port}"
            middleware.proxies = {"https": proxy_url, "http": proxy_url}
        else:
            middleware.proxies = None

        # Sesion compartida: el pipeline de imagenes la reutiliza para
        # descargar assets con las mismas cookies activas de la sesion.
        middleware.session = curl_requests.Session(impersonate="chrome")
        crawler._curl_session = middleware.session
        return middleware

    def process_request(self, request):
        """
        Intercepta cada request, lo ejecuta con curl_cffi y retorna
        un HtmlResponse directamente (Scrapy no usa su downloader).
        Ejecutado en thread para no bloquear el reactor Twisted.
        """
        d = threads.deferToThread(self._fetch, request)
        return d

    def _fetch(self, request):
        """Ejecutar request con curl_cffi (sync, en thread separado)."""
        try:
            resp = self.session.get(
                request.url,
                headers=dict(request.headers.to_unicode_dict()),
                proxies=self.proxies,
                timeout=30,
                allow_redirects=True,
            )

            # curl_cffi ya descomprime brotli/gzip, pero deja el header
            # Content-Encoding intacto. Scrapy's HttpCompressionMiddleware
            # intentaría descomprimir de nuevo y fallaría.
            headers = dict(resp.headers)
            headers.pop("Content-Encoding", None)
            headers.pop("content-encoding", None)

            return HtmlResponse(
                url=str(resp.url),
                status=resp.status_code,
                headers=headers,
                body=resp.content,
                request=request,
            )
        except Exception:
            logger.exception("curl_cffi error fetching %s", request.url)
            raise


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

    def process_response(self, request, response):
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
