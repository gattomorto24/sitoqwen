// Funzione per caricare componenti HTML esterni e restituire stato
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath, { cache: 'no-cache' });
        if (response.ok) {
            const content = await response.text();
            const el = document.getElementById(elementId);
            if (el) {
                el.innerHTML = content;
                // Make component accessible now that it contains real interactive elements
                if (el.hasAttribute && el.hasAttribute('aria-hidden')) el.removeAttribute('aria-hidden');
                // mark loaded to help any logic that depends on it
                try { el.dataset.loaded = 'true'; } catch (e) {}
            }
            return true;
        } else {
            console.error('Errore nel caricamento del componente, status:', response.status, filePath);
            return false;
        }
    } catch (error) {
        console.error('Errore nel caricamento del componente:', filePath, error);
        return false;
    }
}

// Inizializza funzionalità globali dopo il caricamento dei componenti
async function initComponents() {
    await Promise.all([
        loadComponent('main-header', 'header.html'),
        loadComponent('main-footer', 'footer.html'),
        loadComponent('popup-widget', 'popup.html')
    ]);

    // Ensure fonts loaded before expensive paint
    if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; document.documentElement.classList.add('fonts-loaded'); } catch (e) {/* ignore */}
    }

    // Apply theme (header was injected above) and initialize toggle
    applyTheme(getPreferredTheme());
    initThemeToggle();

    initUI();

    // Popup menu logic (nuovo stile iOS)
    setTimeout(() => {
        const popupBtn = document.getElementById('popupBtnIOS');
        const popupMenu = document.getElementById('popupMenuIOS');
        const popupCancel = document.getElementById('popupCancelIOS');
        const popupOverlay = document.getElementById('popupOverlay');
            if (popupBtn && popupMenu && popupOverlay && popupCancel) {
            popupBtn.addEventListener('click',()=>{
                popupMenu.classList.add('active');
                popupOverlay.classList.add('active');
            });
        }
        if (popupCancel && popupMenu && popupOverlay) {
            popupCancel.addEventListener('click',()=>{
                popupMenu.classList.remove('active');
                popupOverlay.classList.remove('active');
            });
        }
        if (popupOverlay && popupMenu) {
            popupOverlay.addEventListener('click',()=>{
                popupMenu.classList.remove('active');
                popupOverlay.classList.remove('active');
            });
        }
            // Chiudi menu con ESC
            document.addEventListener("keydown", function(e) {
                if (popupMenu.classList.contains("active") && (e.key === "Escape" || e.key === "Esc")) {
                    popupMenu.classList.remove("active");
                    popupOverlay.classList.remove("active");
                    document.body.style.overflow = "";
                }
            });
    }, 300);
}

// Theme handling
function getPreferredTheme(){
    const stored = localStorage.getItem('theme');
    if(stored) return stored;
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
}
function applyTheme(theme){
    if(!theme) theme = getPreferredTheme();
    const btn = document.getElementById('theme-toggle');
    if(theme==='dark'){
        document.documentElement.setAttribute('data-theme','dark');
        if(btn) btn.setAttribute('aria-pressed','true');
        updateLogoForTheme('dark');
        updateMetaThemeColor('#0b1220');
        btn && (btn.querySelector('.material-icons').textContent = 'light_mode');
    } else {
        document.documentElement.setAttribute('data-theme','light');
        if(btn) btn.setAttribute('aria-pressed','false');
        updateLogoForTheme('light');
        updateMetaThemeColor('#ffffff');
        btn && (btn.querySelector('.material-icons').textContent = 'dark_mode');
    }
    try{localStorage.setItem('theme',theme);}catch(e){}
}
function toggleTheme(){
    const current = document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
    applyTheme(current==='dark'?'light':'dark');
}
function updateLogoForTheme(theme){
    const logo = document.querySelector('.logo-img');
    if(!logo) return;
    const light = logo.dataset.lightSrc;
    const dark = logo.dataset.darkSrc;
    const newSrc = (theme === 'dark' && dark) ? dark : (light || logo.src);
    try{
        if(logo.src === newSrc){ logo.style.opacity = '1'; return; }
        // fade out current logo, swap src, then fade in to avoid visible mismatch on theme change
        logo.style.opacity = '0';
        const onLoad = () => { logo.style.opacity = '1'; logo.removeEventListener('load', onLoad); };
        logo.addEventListener('load', onLoad);
        logo.src = newSrc;
        // In case image is cached and load doesn't fire
        if(logo.complete) requestAnimationFrame(()=>{ logo.style.opacity = '1'; logo.removeEventListener('load', onLoad); });
    }catch(e){/* ignore */}
}
function updateMetaThemeColor(color){
    let meta = document.querySelector('meta[name="theme-color"]');
    if(!meta){meta = document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta);}meta.content = color;
}
function initThemeToggle(){
    const btn = document.getElementById('theme-toggle');
    if(!btn) return;
    btn.addEventListener('click', ()=>{toggleTheme();});
}

function initUI() {
    initHeader();
    initGlobalBehaviors();
}

function initHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    const hamburger = header.querySelector('#hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const desktopNav = header.querySelector('.nav-desktop');

    // Active link highlighting
    try {
        const currentPage = (window.location.pathname.split('/').pop() || 'index.html');
        header.querySelectorAll('.nav-menu a, .mobile-menu-list a').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && (href === currentPage || href.endsWith(currentPage))) link.classList.add('active');
        });
    } catch (e) {}

    // Mobile menu open/close with focus trap
    if (hamburger && mobileMenu) {
        const focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
        let lastFocusedElement = null;

        const setMenuFocusable = (enable) => {
            const items = Array.from(mobileMenu.querySelectorAll(focusableSelector));
            items.forEach(el => {
                if (enable) {
                    if (el.dataset.prevTabIndex) {
                        el.setAttribute('tabindex', el.dataset.prevTabIndex);
                        delete el.dataset.prevTabIndex;
                    } else {
                        el.removeAttribute('tabindex');
                    }
                } else {
                    if (el.hasAttribute('tabindex')) el.dataset.prevTabIndex = el.getAttribute('tabindex');
                    el.setAttribute('tabindex', '-1');
                }
            });
        };

        const openMenu = () => {
            lastFocusedElement = document.activeElement;
            hamburger.setAttribute('aria-expanded', 'true');
            mobileMenu.setAttribute('aria-hidden', 'false');
            mobileMenu.setAttribute('aria-modal', 'true');
            mobileMenu.setAttribute('role', 'dialog');
            setMenuFocusable(true);
            const firstFocusable = mobileMenu.querySelectorAll(focusableSelector)[0];
            firstFocusable?.focus();
            document.body.style.overflow = 'hidden';
            const icon = hamburger.querySelector('.material-icons');
            if (icon) icon.textContent = 'close';
            hamburger.setAttribute('aria-label', 'Chiudi menu');
        };

        const closeMenu = () => {
            hamburger.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');
            mobileMenu.setAttribute('aria-modal', 'false');
            setMenuFocusable(false);
            document.body.style.overflow = '';
            try { lastFocusedElement?.focus(); } catch (e) {}
            const icon = hamburger.querySelector('.material-icons');
            if (icon) icon.textContent = 'menu';
            hamburger.setAttribute('aria-label', 'Apri menu');
        };

        // Ensure menu items are not tabbable until opened
        setMenuFocusable(false);

        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
            if (isOpen) closeMenu(); else openMenu();
        });

        // Close on outside click or Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') closeMenu();
        }, { passive: true });

        document.addEventListener('click', (e) => {
            if (mobileMenu.getAttribute('aria-hidden') === 'false' && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
                closeMenu();
            }
        });

        // Trap focus inside mobile menu
        mobileMenu.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            const focusable = Array.from(mobileMenu.querySelectorAll(focusableSelector));
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }
}

function initGlobalBehaviors() {
    // Smooth scroll for in-page links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#') return;
            const href = this.getAttribute('href');
            if (!href.startsWith('#')) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                history.replaceState(null, '', href);
            }
        });
    });

    // Efficient scroll handler using rAF
    const header = document.querySelector('header');
    let lastY = 0, ticking = false;
    window.addEventListener('scroll', () => {
        lastY = window.scrollY;
        if (!ticking) { window.requestAnimationFrame(() => { handleScroll(lastY); ticking = false; }); }
        ticking = true;
    }, { passive: true });

    function handleScroll(y) {
        if (!header) return;
        if (y > 40) {
            header.classList.add('scrolled');
            header.style.boxShadow = '0 8px 30px rgba(2,6,23,.06)';
        } else {
            header.classList.remove('scrolled');
            header.style.boxShadow = '';
        }
    }

    // Skip link
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', e => {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) { mainContent.tabIndex = -1; mainContent.focus(); }
        });
    }

    // Inquiry form
    const inquiryForm = document.getElementById('inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('name') ? document.getElementById('name').value : '';
            // Ideally this would call an API; keep friendly UX now
            alert(`Grazie ${name} per averci contattato! Ti risponderemo al più presto.`);
            inquiryForm.reset();
        });
    }

    // Accessible FAQ accordion behavior (smooth max-height toggling)
    document.querySelectorAll('.faq-question').forEach((btn, idx) => {
        const answer = btn.nextElementSibling;
        if (!answer) return;
        // Ensure each answer has an id for aria-controls
        if (!answer.id) answer.id = `faq-${idx+1}`;
        btn.setAttribute('aria-controls', answer.id);
        btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') === 'true' ? 'true' : 'false');

        const toggle = () => {
            const isOpen = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
            const parent = btn.closest('.faq-item');
            parent && parent.classList.toggle('active');
            if (!isOpen) {
                // expand
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                // collapse
                answer.style.maxHeight = null;
            }
        };

        btn.addEventListener('click', toggle);
        btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });

    // Reveal-on-scroll using IntersectionObserver with stagger support
    (function(){
        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        if (!revealElements.length) return;
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const idx = el.dataset.index ? Number(el.dataset.index) : 0;
                        // small stagger based on data-index
                        el.style.transitionDelay = (idx * 45) + 'ms';
                        el.classList.add('reveal');
                        obs.unobserve(el);
                    }
                });
            }, { threshold: 0.12 });
            revealElements.forEach(el => io.observe(el));
        } else {
            // fallback: reveal immediately
            revealElements.forEach(el => el.classList.add('reveal'));
        }
    })();
}

// Avvio carico componenti
window.addEventListener('DOMContentLoaded', () => {
    initComponents();
});

