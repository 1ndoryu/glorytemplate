<?php

namespace App\Helpers;

class AssetHelper
{
    /**
     * Get random hero background images from local directory
     * 
     * @return array List of image URLs
     */
    public static function getHeroImages(): array
    {
        $colorsDir = __DIR__ . '/../../Glory/assets/images/colors';
        $bgImages = [];

        if (is_dir($colorsDir)) {
            $files = glob($colorsDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE);

            if ($files) {
                // Determine base URL
                $baseUrl = function_exists('get_stylesheet_directory_uri')
                    ? get_stylesheet_directory_uri()
                    : '/wp-content/themes/glorytemplate';

                foreach ($files as $file) {
                    $size = filesize($file);
                    // Filter: 50KB < size < 2MB for optimization
                    if ($size > 50000 && $size < 2000000) {
                        $bgImages[] = $baseUrl . '/Glory/assets/images/colors/' . basename($file);
                    }
                }
            }
        }

        return $bgImages;
    }

    /**
     * Get a single random hero image URL
     * 
     * @return string|null Image URL or null if none found
     */
    public static function getRandomHeroImage(): ?string
    {
        $images = self::getHeroImages();
        return !empty($images) ? $images[array_rand($images)] : null;
    }
}
