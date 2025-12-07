document.addEventListener('DOMContentLoaded', function () {
    var heroSection = document.querySelector('.landing-container .hero-section');
    if (heroSection && window.grained) {
        // Options for Grained.js
        var options = {
            animate: false, // Ruido estatico
            patternWidth: 100,
            patternHeight: 100,
            grainOpacity: 0.05, // Adjusted for subtle effect (user wanted "real noise")
            grainDensity: 1,
            grainWidth: 1,
            grainHeight: 1
        };

        window.grained(heroSection, options);
    }
});
