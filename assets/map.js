(() => {
  const container = document.querySelector('#service-map');
  if (!container) return;

  const loadStyle = href => new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.append(link);
  });

  const loadScript = src => new Promise((resolve, reject) => {
    if (window.L) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });

  let started = false;
  const startMap = async () => {
    if (started) return;
    started = true;

    try {
      await Promise.all([
        loadStyle('/assets/vendor/leaflet/leaflet.css'),
        loadScript('/assets/vendor/leaflet/leaflet.js')
      ]);

      container.replaceChildren();
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 720px)').matches;
      const map = L.map(container, {
        center: [37.5079, 15.0830],
        zoom: 9,
        zoomControl: true,
        attributionControl: true,
        keyboard: true,
        scrollWheelZoom: false,
        dragging: !coarsePointer,
        touchZoom: !coarsePointer
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      L.circle([37.5079, 15.0830], {
        radius: 30000,
        color: '#B54A32',
        weight: 2,
        opacity: 0.9,
        fillColor: '#B54A32',
        fillOpacity: 0.13,
        interactive: false
      }).addTo(map);

      L.circleMarker([37.5079, 15.0830], {
        radius: 7,
        color: '#1C1D1B',
        weight: 3,
        fillColor: '#B54A32',
        fillOpacity: 1
      }).addTo(map).bindPopup('<strong>Catania — area operativa</strong><br><span>Il punto non indica una sede.</span>', {
        closeButton: false,
        autoPan: false
      }).openPopup();

      const activate = document.querySelector('.map-activate');
      if (coarsePointer && activate) {
        container.classList.add('service-map--locked');
        activate.hidden = false;
        activate.setAttribute('aria-pressed', 'false');
        activate.addEventListener('click', () => {
          const active = activate.getAttribute('aria-pressed') === 'true';
          if (active) {
            map.dragging.disable();
            map.touchZoom.disable();
            container.classList.add('service-map--locked');
            container.classList.remove('service-map--active');
            activate.setAttribute('aria-pressed', 'false');
            activate.textContent = 'Esplora la mappa';
          } else {
            map.dragging.enable();
            map.touchZoom.enable();
            container.classList.remove('service-map--locked');
            container.classList.add('service-map--active');
            activate.setAttribute('aria-pressed', 'true');
            activate.textContent = 'Blocca la mappa';
          }
        });
      }

      requestAnimationFrame(() => map.invalidateSize());
    } catch (error) {
      container.classList.add('service-map--error');
      const message = container.querySelector('.map-loading');
      if (message) message.textContent = 'La mappa non è disponibile. Operiamo a Catania e valutiamo richieste in tutta la provincia.';
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        startMap();
      }
    }, { rootMargin: '320px 0px' });
    observer.observe(container);
  } else {
    startMap();
  }
})();
