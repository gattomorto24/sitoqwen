Developer notes — PageSpeed & performance
--------------------------------------

1) Images
- Convert all heavy images to WebP and/or AVIF. Use the `assets/convert-to-webp.sh` script as base.
- Serve via <picture> with AVIF -> WebP -> fallback PNG/JPG. Add `decoding="async" loading="lazy"` where appropriate.

2) Fonts & Icons
- Avoid third-party blocking fonts. Prefer local self-hosted Material Icons subset. Example: download only required icon font files and reference locally.
- Preload only critical fonts (`<link rel="preload" as="font" href="/fonts/Inter.woff2" type="font/woff2" crossorigin>`).

3) Critical CSS
- Inline minimal critical CSS for above-the-fold (hero + header). Keep it < 14KB where possible.
- Load main `style.css` asynchronously with `rel=preload` + `onload` fallback (already used in templates).

4) .htaccess (Apache) — aggressive caching snippet
-----------------------------------------------
Add to your server root (example):

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/avif "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\.(?:js|css|png|jpg|jpeg|webp|avif)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

5) Performance tips
- Use `preload` for hero image and critical fonts.
- Defer non-critical JS; keep `components.js` lightweight and non-blocking (defer used).
- Use `will-change: transform` only on elements that animate frequently.
- Minimize layout-thrashing: use transform/opacity instead of top/left.

6) Accessibility & SEO
- Ensure each generated page has unique title/meta and JSON-LD structured data where useful.
- Keep server responses gzipped/brotli and enable HTTP/2 where possible.

If you want, I can:
- Generate a small `critical.css` inlined snippet extracted from `style.css` for the homepage.
- Create a sample local subset of Material Icons and update the templates to load it.
