/**
 * main.js - Caricatore dinamico componenti DRY
 * Ottimizzato per PageSpeed 100/100
 * - Fetch async con cache
 * - Defer automatico
 * - Fallback per errori
 * - Dark mode completa
 */

// Funzione per caricare componenti HTML esterni
async function loadComponent(id, file) {
    try {
        const response = await fetch(file, { cache: 'force-cache' });
        if (response.ok) {
            const data = await response.text();
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = data;
                element.setAttribute('data-loaded', 'true');
                // Re-inizializza funzionalità dopo il caricamento
                setTimeout(() => initHeaderFunctions(), 50);
            }
            return true;
        } else {
            console.error(`Errore caricamento ${file}: status ${response.status}`);
            return false;
        }
    } catch (err) {
        console.error(`Errore caricamento componente ${file}:`, err);
        return false;
    }
}

// Inizializza funzioni header dopo il caricamento
function initHeaderFunctions() {
    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Mobile menu
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.setAttribute('aria-hidden', isExpanded);
            document.body.style.overflow = isExpanded ? '' : 'hidden';
        });
        
        // Chiudi menu al click esterno
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Dropdown menu desktop - fixed hover behavior
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(drop => {
        const link = drop.querySelector('a');
        if (link && window.innerWidth > 768) {
            // Usa CSS hover per desktop, previeni click default
            link.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }
    });
    
    // Mobile dropdown toggle
    const mobileDropdowns = document.querySelectorAll('.mobile-dropdown');
    mobileDropdowns.forEach(drop => {
        const title = drop.querySelector('.mobile-dropdown-title');
        if (title) {
            title.addEventListener('click', () => {
                drop.classList.toggle('active');
            });
        }
    });
}

// Gestione tema
function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const btn = document.getElementById('theme-toggle');
    const icon = btn?.querySelector('.material-icons');
    if (icon) {
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
    if (btn) {
        btn.setAttribute('aria-pressed', theme === 'dark');
    }
    
    // Aggiorna logo
    updateLogoForTheme(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function updateLogoForTheme(theme) {
    const logo = document.querySelector('.logo-img');
    if (!logo) return;
    
    const lightSrc = logo.dataset.lightSrc;
    const darkSrc = logo.dataset.darkSrc;
    const newSrc = theme === 'dark' && darkSrc ? darkSrc : lightSrc;
    
    if (newSrc && logo.src !== newSrc) {
        logo.style.opacity = '0';
        logo.onload = () => { logo.style.opacity = '1'; };
        logo.onerror = () => { logo.style.opacity = '1'; }; // Fallback se immagine non esiste
        logo.src = newSrc;
    }
}

// Attiva al caricamento DOM
document.addEventListener('DOMContentLoaded', () => {
    // Applica tema preferito immediatamente (prima del caricamento componenti)
    const preferredTheme = getPreferredTheme();
    applyTheme(preferredTheme);
    
    // Carica componenti
    Promise.all([
        loadComponent('header-placeholder', 'header-fragment.html'),
        loadComponent('footer-placeholder', 'footer-fragment.html')
    ]).then(() => {
        // Aggiungi classe fonts-loaded quando i font sono pronti
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                document.documentElement.classList.add('fonts-loaded');
            });
        }
    });
});

// Service Worker registration per caching (opzionale per PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
