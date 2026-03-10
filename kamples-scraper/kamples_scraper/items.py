"""
Kamples Scraper — Items (estructuras de datos).

Define los modelos que transitan por el pipeline de Scrapy.
"""

import scrapy


class ArtistaItem(scrapy.Item):
    nombre = scrapy.Field()
    slug = scrapy.Field()
    whosampled_slug = scrapy.Field()
    imagen_url = scrapy.Field()


class CancionItem(scrapy.Item):
    titulo = scrapy.Field()
    slug = scrapy.Field()
    artista = scrapy.Field()          # ArtistaItem embebido
    album = scrapy.Field()
    sello = scrapy.Field()
    anio = scrapy.Field()
    duracion_segundos = scrapy.Field()
    genero = scrapy.Field()
    youtube_id = scrapy.Field()
    imagen_url = scrapy.Field()
    whosampled_url = scrapy.Field()   # ruta relativa normalizada
    productores = scrapy.Field()      # lista de ArtistaItem


class TrackMetadataItem(scrapy.Item):
    """Metadata adicional extraída de la página overview del track."""
    whosampled_url = scrapy.Field()   # ruta relativa normalizada (clave dedup)
    genero = scrapy.Field()           # str: "Hip-Hop / Rap / R&B"
    youtube_id = scrapy.Field()       # str: "81VrSMrS5F8"
    spotify_id = scrapy.Field()       # str: "7aheCJTgZydWp7D0BWgrpc" (alternativa a YT)
    tags = scrapy.Field()             # list[str]: ["East Coast Hip-Hop", "Hip-Hop"]


class RelacionItem(scrapy.Item):
    """Una relación sample/cover/remix/interpolation entre dos canciones."""
    cancion_destino = scrapy.Field()  # CancionItem
    cancion_fuente = scrapy.Field()   # CancionItem
    whosampled_id = scrapy.Field()    # int: ID numérico de la URL
    tipo_relacion = scrapy.Field()    # 'sample', 'cover', 'remix', 'interpolation'
    tipo_elemento = scrapy.Field()    # 'hook_riff', 'vocals_lyrics', etc.
    timings_destino = scrapy.Field()  # lista de segundos [4, 30]
    timings_fuente = scrapy.Field()   # lista de segundos [120]
    aparece_en_todo = scrapy.Field()  # bool
    votos_total = scrapy.Field()
    votos_promedio = scrapy.Field()
    url_detalle = scrapy.Field()      # URL completa de la página de detalle
