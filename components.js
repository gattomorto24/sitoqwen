// components.js
// Carica header e footer dinamicamente e re-inizializza eventi
const loadUI = async () => {
    const components = [
        { id: 'main-header', url: 'header.html' },
        { id: 'main-footer', url: 'footer.html' }
    ];

    for (const comp of components) {
        const el = document.getElementById(comp.id);
        if (!el) continue;

        // If element already contains markup, still attempt to replace to centralize
        try {
            const resp = await fetch(comp.url, { cache: 'no-cache' });
            if (resp.ok) {
                el.innerHTML = await resp.text();
            } else {
                console.warn('components.js: fetch failed', comp.url, resp.status);
            }
        } catch (err) {
            console.error('components.js: error loading', comp.url, err);
        }

        // Re-initialize global events provided by script.js (if present)
        try {
            if (typeof initComponents === 'function') initComponents();
            if (typeof initUI === 'function') initUI();
            if (typeof initThemeToggle === 'function') initThemeToggle();
        } catch (e) { /* ignore */ }
    }
};

// Small helper to initialize light DOM-only behaviors when components are injected
const initEvents = () => {
    // Always attach lightweight fallback handlers for critical header interactions.
    // Use dataset flags to avoid double-attaching if the main script already wired events.
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn && !themeBtn.dataset._init) {
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
        themeBtn.dataset._init = '1';
    }

    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileClose = document.getElementById('mobile-close');

    const openMobileMenu = () => {
        if (!hamburger || !mobileMenu) return;
        hamburger.setAttribute('aria-expanded', 'true');
        mobileMenu.setAttribute('aria-hidden', 'false');
        mobileMenu.setAttribute('aria-modal', 'true');
        document.body.style.overflow = 'hidden';
        // add global class to blur underlying content for better contrast
        document.body.classList.add('mobile-menu-open');
        // focus first focusable inside menu
        const first = mobileMenu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        if (first) first.focus();
        // mark main content as hidden for assistive tech
        const main = document.querySelector('main');
        const footer = document.querySelector('footer, #main-footer');
        if (main) main.setAttribute('aria-hidden', 'true');
        if (footer) footer.setAttribute('aria-hidden', 'true');
    };
    const closeMobileMenu = () => {
        if (!hamburger || !mobileMenu) return;
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.setAttribute('aria-modal', 'false');
        document.body.style.overflow = '';
        document.body.classList.remove('mobile-menu-open');
        try { hamburger.focus(); } catch (e) {}
        const main = document.querySelector('main');
        const footer = document.querySelector('footer, #main-footer');
        if (main) main.removeAttribute('aria-hidden');
        if (footer) footer.removeAttribute('aria-hidden');
    };

    if (hamburger && mobileMenu && !hamburger.dataset._mobileInit) {
        hamburger.addEventListener('click', (e) => {
            const open = hamburger.getAttribute('aria-expanded') === 'true';
            if (open) closeMobileMenu(); else openMobileMenu();
        });
        hamburger.dataset._mobileInit = '1';
    }

    if (mobileClose && !mobileClose.dataset._mobileInit) {
        mobileClose.addEventListener('click', (e) => { closeMobileMenu(); });
        mobileClose.dataset._mobileInit = '1';
    }

    // Close on Escape when menu open
    if (!document.body.dataset._mobileEscInit) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                const mm = document.getElementById('mobile-menu');
                if (mm && mm.getAttribute('aria-hidden') === 'false') closeMobileMenu();
            }
        });
        document.body.dataset._mobileEscInit = '1';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadUI();
    initEvents();
});

// export for debugging (not necessary but useful)
window._componentsLoader = { loadUI, initEvents };

// Create universal mobile menu overlay outside the page-content
(function createUniversalOverlay(){
    if (document.getElementById('mobile-menu-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'mobile-menu-overlay';
    overlay.className = 'mobile-menu-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `
        <button id="close-menu" class="close-menu-btn" aria-label="Chiudi">
            <span class="material-icons">close</span>
        </button>
        <nav class="mobile-nav-full" role="navigation" aria-label="Menu mobile">
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="servizi.html">Servizi</a></li>
                <li><a href="acquisto-mobili.html">Acquisto Mobili</a></li>
                <li><a href="contatti.html">Contatti</a></li>
                <li><a href="chi-siamo.html">Chi Siamo</a></li>
                <li><a href="blog.html">Blog</a></li>
            </ul>
        </nav>
    `;
    document.body.appendChild(overlay);

    const toggleMenu = () => {
        const content = document.getElementById('page-content') || document.getElementById('page') || document.querySelector('body');
        const isActive = overlay.classList.contains('active');
        const active = !isActive;
        // toggle overlay visibility
        overlay.classList.toggle('active', active);
        overlay.setAttribute('aria-hidden', active ? 'false' : 'true');

        // blur and accessibility on the page content
        if (content) {
            if (active) {
                content.classList.add('blur-active');
                content.setAttribute('aria-hidden', 'true');
            } else {
                content.classList.remove('blur-active');
                content.setAttribute('aria-hidden', 'false');
            }
        }

        // also add a body-level class for compatibility
        document.body.classList.toggle('mobile-menu-open', active);

        // lock scroll
        document.body.style.overflow = active ? 'hidden' : '';

        // focus management
        if (active) {
            const firstLink = overlay.querySelector('a');
            firstLink && firstLink.focus();
        } else {
            const hamburger = document.getElementById('hamburger');
            hamburger && hamburger.focus();
        }
    };

    // Attach global handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('#hamburger') || e.target.closest('#close-menu')) {
            toggleMenu();
        }
        // clicking outside nav (on overlay) closes
        if (e.target === overlay) {
            if (overlay.classList.contains('active')) toggleMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Escape' || e.key === 'Esc') && overlay.classList.contains('active')) toggleMenu();
    });
})();
