"""
Kamples Scraper — Configuración Scrapy.

Rate limiting conservador para evitar bans.
Proxy DataImpulse (residencial) para requests a WhoSampled.
"""

import os
from dotenv import load_dotenv

load_dotenv()

BOT_NAME = "kamples_scraper"
SPIDER_MODULES = ["kamples_scraper.spiders"]
NEWSPIDER_MODULE = "kamples_scraper.spiders"

# --- Rate Limiting (conservador) ---
DOWNLOAD_DELAY = 3
RANDOMIZE_DOWNLOAD_DELAY = True
CONCURRENT_REQUESTS = 1
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 3
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0

# --- Headers (parecer navegador real) ---
DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
}

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)

# --- Middlewares ---
DOWNLOADER_MIDDLEWARES = {
    "kamples_scraper.middlewares.DataImpulseProxyMiddleware": 350,
    "kamples_scraper.middlewares.BandwidthTrackerMiddleware": 400,
}

ITEM_PIPELINES = {
    "kamples_scraper.pipelines.DeduplicacionPipeline": 100,
    "kamples_scraper.pipelines.PostgresPipeline": 300,
}

# --- Retry ---
RETRY_TIMES = 2
RETRY_HTTP_CODES = [429, 500, 502, 503, 520]

# --- Dedup ---
DUPEFILTER_CLASS = "scrapy.dupefilters.RFPDupeFilter"

# --- No descargar assets ---
MEDIA_ALLOW_REDIRECTS = False

# --- Proxy config ---
PROXY_HOST = os.getenv("PROXY_HOST", "gw.dataimpulse.com")
PROXY_PORT = os.getenv("PROXY_PORT", "823")
PROXY_USER = os.getenv("PROXY_USER", "")
PROXY_PASSWORD = os.getenv("PROXY_PASSWORD", "")
PROXY_BUDGET_BYTES = int(os.getenv("PROXY_BUDGET_BYTES", "5368709120"))

# --- DB config ---
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "kamples")
DB_USER = os.getenv("DB_USER", "kamples")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# --- Logging ---
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s [%(name)s] %(levelname)s: %(message)s"

REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
