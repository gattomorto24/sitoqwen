/**
 * FOOTER LOGIC - STR TRASPORTI
 * Gestione dinamica dell'anno e animazioni Intersection Observer.
 */

document.addEventListener('DOMContentLoaded', () => {
    initFooter();
});

/**
 * Inizializza tutte le funzionalità del footer
 */
function initFooter() {
    updateCopyrightYear();
    initFooterAnimations();
}

/**
 * Aggiorna l'anno nel testo del copyright
 */
function updateCopyrightYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * Gestisce le animazioni di entrata (Slide Up) del footer al raggiungimento dello scroll
 */
function initFooterAnimations() {
    const footer = document.querySelector('.apple-footer');
    
    if (!footer) return;

    // Configurazione dell'Observer
    const observerOptions = {
        root: null, // viewport
        threshold: 0.15, // trigger quando il 15% del footer è visibile
        rootMargin: '0px 0px -50px 0px'
    };

    const footerObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Aggiunge la classe che scatena le transition CSS
                footer.classList.add('animate-in');
                // Smette di osservare una volta animato
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    footerObserver.observe(footer);
}

// Supporto per il ricaricamento dinamico (se usi AJAX o SPA)
window.refreshFooter = initFooter;