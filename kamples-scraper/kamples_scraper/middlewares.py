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

WARMUP_URL = "https://www.whosampled.com/"


class CurlCffiDownloaderMiddleware:
    """
    Middleware que reemplaza el downloader HTTP estandar de Scrapy
    con curl_cffi para emular TLS fingerprint de Chrome.

    Resuelve el bloqueo de Cloudflare (403 "Just a moment...").
    Lee proxy de settings; si no hay proxy, request directo.
    Realiza warm-up automatico contra WhoSampled para establecer
    cookies de sesion antes de que cualquier spider haga requests.
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

        middleware.session = curl_requests.Session(impersonate="chrome")
        crawler._curl_session = middleware.session
        crawler._curl_proxies = middleware.proxies

        middleware._warmup(crawler)
        return middleware

    def _warmup(self, crawler):
        """
        Request inicial a la homepage para establecer cookies de sesion
        y pasar posibles challenges de Cloudflare antes del scraping real.
        """
        try:
            resp = self.session.get(
                WARMUP_URL,
                proxies=self.proxies,
                timeout=30,
                allow_redirects=True,
            )
            if resp.status_code == 200:
                logger.info(
                    "Warm-up OK: status=%d, cookies=%d",
                    resp.status_code,
                    len(self.session.cookies),
                )
            else:
                logger.warning(
                    "Warm-up con status inesperado: %d. "
                    "Posible problema de proxy o Cloudflare challenge.",
                    resp.status_code,
                )
        except Exception:
            logger.exception(
                "Warm-up fallo. Verificar proxy y conectividad."
            )

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
            headers = dict(request.headers.to_unicode_dict())
            if "Referer" not in headers:
                headers["Referer"] = "https://www.whosampled.com/"

            resp = self.session.get(
                request.url,
                headers=headers,
                proxies=self.proxies,
                timeout=30,
                allow_redirects=True,
            )

            # curl_cffi ya descomprime brotli/gzip, pero deja el header
            # Content-Encoding intacto. Scrapy's HttpCompressionMiddleware
            # intentaria descomprimir de nuevo y fallaria.
            resp_headers = dict(resp.headers)
            resp_headers.pop("Content-Encoding", None)
            resp_headers.pop("content-encoding", None)

            return HtmlResponse(
                url=str(resp.url),
                status=resp.status_code,
                headers=resp_headers,
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
        self.crawler = None

    @classmethod
    def from_crawler(cls, crawler):
        middleware = cls()
        middleware.budget_bytes = crawler.settings.getint("PROXY_BUDGET_BYTES", 5368709120)
        middleware.crawler = crawler
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
