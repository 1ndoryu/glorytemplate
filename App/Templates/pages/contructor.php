<?php

function contructor()
{
    // Opciones para el grid de pokemones
    // Nota: 'postType' en opciones es redundante si se usa en el atributo, pero lo dejamos por claridad.
    $opcionesGrid = "postType: 'pokemon', publicacionesPorPagina: 6, claseContenedor: 'gbn-pokemon-grid', claseItem: 'gbn-pokemon-card', forzarSinCache: true, layout: 'grid', gridColumns: 3, gap: 30";
    
?>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        
        .gbn-pokemon-page {
            font-family: 'Outfit', sans-serif;
            background-color: #FAFAFA;
            color: #1f2937;
            line-height: 1.5;
        }

        .gbn-container {
            max-width: 1152px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        /* Banner Superior */
        .gbn-banner {
            background-color: #4f46e5;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .gbn-banner-content { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; font-weight: 500; }
        .gbn-banner-icon { background: rgba(255,255,255,0.2); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .gbn-banner-link { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; opacity: 0.8; cursor: pointer; transition: opacity 0.2s; }
        .gbn-banner-link:hover { opacity: 1; }

        /* Stats Grid */
        .gbn-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 3rem;
        }
        @media (min-width: 768px) { .gbn-stats-grid { grid-template-columns: repeat(4, 1fr); } }

        .gbn-stat-card {
            background: white;
            border: 1px solid #f3f4f6;
            border-radius: 1rem;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: transform 0.2s;
        }
        .gbn-stat-card:hover { transform: scale(1.05); }
        .gbn-stat-icon { padding: 0.5rem; border-radius: 9999px; margin-bottom: 0.5rem; }
        .gbn-stat-value { font-size: 1.25rem; font-weight: 700; color: #1f2937; }
        .gbn-stat-label { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; }

        /* Info Block */
        .gbn-info-block {
            background: linear-gradient(to right, #fff7ed, #fffbeb);
            border: 1px solid #ffedd5;
            border-radius: 1.5rem;
            padding: 2rem;
            text-align: center;
            margin-bottom: 4rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .gbn-info-badge {
            background: rgba(255,255,255,0.6);
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            color: #ea580c;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            font-size: 0.625rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .gbn-info-title { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem; }
        .gbn-info-text { max-width: 42rem; font-size: 0.875rem; color: #4b5563; line-height: 1.625; }

        /* Header */
        .gbn-header { text-align: center; margin-bottom: 4rem; display: flex; flex-direction: column; align-items: center; }
        .gbn-collection-badge {
            background: white;
            border: 1px solid #f3f4f6;
            padding: 0.25rem 1rem;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .gbn-collection-text { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; }
        .gbn-title { font-size: 2.25rem; font-weight: 700; letter-spacing: -0.025em; color: #111827; margin-bottom: 1.5rem; }
        @media (min-width: 768px) { .gbn-title { font-size: 3rem; } }
        .gbn-title span { color: #d1d5db; }

        /* Search (Visual only) */
        .gbn-search-container { position: relative; width: 100%; max-width: 28rem; }
        .gbn-search-input {
            width: 100%;
            background: white;
            border: none;
            border-radius: 1rem;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            font-size: 0.875rem;
            color: #374151;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            ring: 1px solid #e5e7eb;
            outline: none;
        }
        .gbn-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; width: 16px; height: 16px; }

        /* Pokemon Grid & Cards */
        .gbn-pokemon-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
        }
        @media (min-width: 640px) { .gbn-pokemon-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .gbn-pokemon-grid { grid-template-columns: repeat(3, 1fr); } }

        .gbn-pokemon-card {
            background: white;
            border-radius: 1.5rem;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
            border: 1px solid #f3f4f6;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .gbn-pokemon-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1); }
        
        /* Background Blob (Simulated) */
        .gbn-card-blob {
            position: absolute;
            top: -2rem;
            right: -2rem;
            width: 10rem;
            height: 10rem;
            border-radius: 50%;
            opacity: 0.5;
            filter: blur(40px);
            z-index: 0;
        }
        /* Colores por defecto para el blob */
        .gbn-pokemon-card:nth-child(3n+1) .gbn-card-blob { background-color: #ecfdf5; } /* Emerald */
        .gbn-pokemon-card:nth-child(3n+2) .gbn-card-blob { background-color: #fff7ed; } /* Orange */
        .gbn-pokemon-card:nth-child(3n+3) .gbn-card-blob { background-color: #eff6ff; } /* Blue */

        .gbn-card-content { position: relative; z-index: 10; width: 100%; display: flex; flex-direction: column; align-items: center; }
        
        .gbn-card-number { align-self: flex-end; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; color: #d1d5db; margin-bottom: 0.5rem; }
        
        .gbn-card-image-wrapper { width: 8rem; height: 8rem; margin: 1rem 0; transition: transform 0.5s; }
        .gbn-pokemon-card:hover .gbn-card-image-wrapper { transform: scale(1.1); }
        .gbn-card-image-wrapper img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }

        .gbn-card-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 0.25rem; }
        
        .gbn-card-types { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .gbn-type-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.625rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: #f3f4f6;
            color: #4b5563;
        }

        .gbn-card-desc { text-align: center; font-size: 0.75rem; line-height: 1.6; color: #9ca3af; }

        .gbn-footer { text-align: center; margin-top: 5rem; font-size: 0.75rem; color: #d1d5db; }

        /* Icons SVG */
        .icon-svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 2; fill: none; }
    </style>

    <div class="gbn-pokemon-page">
        <!-- Section 1: Hero -->
        <div gloryDiv class="gbn-container gbn-section-hero">
            <!-- Banner -->
            <div gloryDivSecundario class="gbn-banner">
                <div class="gbn-banner-content">
                    <div class="gbn-banner-icon">
                        <svg class="icon-svg" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </div>
                    <p>¡Nueva región de Paldea disponible pronto!</p>
                </div>
                <span class="gbn-banner-link">Ver más</span>
            </div>

            <!-- Header -->
            <div gloryDivSecundario class="gbn-header">
                <div class="gbn-collection-badge">
                    <svg class="icon-svg" style="width: 16px; height: 16px; color: #facc15;" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
                    <span class="gbn-collection-text">Colección Esencial</span>
                </div>
                <h1 class="gbn-title">Pokédex <span>Minimal</span></h1>
                
                <div class="gbn-search-container">
                    <svg class="icon-svg gbn-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" class="gbn-search-input" placeholder="Buscar por nombre..." readonly>
                </div>
            </div>
        </div>

        <!-- Section 2: Stats -->
        <div gloryDiv class="gbn-container gbn-section-stats">
            <!-- Stats -->
            <div gloryDivSecundario class="gbn-stats-grid">
                <div class="gbn-stat-card">
                    <div class="gbn-stat-icon" style="background: #eff6ff; color: #3b82f6;">
                        <svg class="icon-svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <span class="gbn-stat-value">12.5M</span>
                    <span class="gbn-stat-label">Entrenadores</span>
                </div>
                <div class="gbn-stat-card">
                    <div class="gbn-stat-icon" style="background: #ecfdf5; color: #10b981;">
                        <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                    <span class="gbn-stat-value">850+</span>
                    <span class="gbn-stat-label">Especies</span>
                </div>
                <div class="gbn-stat-card">
                    <div class="gbn-stat-icon" style="background: #f5f3ff; color: #8b5cf6;">
                        <svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <span class="gbn-stat-value">9</span>
                    <span class="gbn-stat-label">Regiones</span>
                </div>
                <div class="gbn-stat-card">
                    <div class="gbn-stat-icon" style="background: #fff1f2; color: #f43f5e;">
                        <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    </div>
                    <span class="gbn-stat-value">24k</span>
                    <span class="gbn-stat-label">Combates Hoy</span>
                </div>
            </div>

            <!-- Info Block -->
            <div gloryDivSecundario class="gbn-info-block">
                <div class="gbn-info-badge">
                    <svg class="icon-svg" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <span>Dato Curioso</span>
                </div>
                <h2 class="gbn-info-title">¿Sabías qué?</h2>
                <p class="gbn-info-text">Aunque muchos piensan que Pikachu es el Pokémon más famoso, Clefairy fue originalmente planeado para ser la mascota principal de la franquicia junto al entrenador Rojo en el manga.</p>
            </div>
        </div>

        <!-- Section 3: Grid -->
        <div gloryDiv class="gbn-container gbn-section-grid">
            <!-- Pokemon Grid -->
            <!-- Aquí usamos gloryContentRender="pokemon" para asegurar que cargue el post type correcto -->
            <div gloryContentRender="pokemon" opciones="<?php echo esc_attr($opcionesGrid); ?>">
            </div>

            <!-- Footer -->
            <div gloryDivSecundario class="gbn-footer">
                <p>© <?php echo date('Y'); ?> PokéMinimal • Datos de PokeAPI</p>
            </div>
        </div>
    </div>
<?php
}
