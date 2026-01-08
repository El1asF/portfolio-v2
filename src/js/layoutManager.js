// src/js/layoutManager.js
// Managed Header, Footer und Scroll-Buttons zentral

/**
 * Injiziert den Header (Navbar)
 * Jetzt inklusive integriertem Back-Button mit Smart-Logic
 */
export function injectHeader() {
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (!headerPlaceholder) return;

  const path = window.location.pathname;
  // Fallback für leeren Pfad oder '/'
  const page = path.split('/').pop() || 'index.html';
  const isHome = page === 'index.html' || page === '';

  // Back-Button HTML (nur wenn nicht Startseite)
  const backBtnHtml = isHome 
    ? '' 
    : `<button id="nav-back-btn" class="nav-back-btn" aria-label="Zurück"></button>`;

  // Navbar HTML
  headerPlaceholder.innerHTML = `
    <nav class="navbar">
      <div class="container">
        
        <div class="brand-group">
            ${backBtnHtml}
            <a href="index.html" class="logo">Elias Friderici</a>
        </div>

        <button class="hamburger" aria-label="Menü">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul class="nav-links">
          <li><a href="youtube.html" class="${page === 'youtube.html' ? 'active' : ''}">YouTube</a></li>
          <li><a href="filmprojects.html" class="${page === 'filmprojects.html' ? 'active' : ''}">Filmprojekte</a></li>
          <li><a href="weitere-arbeiten.html" class="${page === 'weitere-arbeiten.html' ? 'active' : ''}">Weitere Arbeiten</a></li>
        </ul>
      </div>
    </nav>
  `;

  // Event Listener für den Back-Button
  if (!isHome) {
      const btn = document.getElementById('nav-back-btn');
      if (btn) {
          btn.addEventListener('click', handleBackClick);
      }
  }

  initMobileMenu();
}

/**
 * Smarte Back-Button Logik
 */
function handleBackClick() {
    // 1. Prüfen, ob es einen Verlauf innerhalb der Seite gibt (Referrer check)
    // document.referrer gibt die URL zurück, von der man kam.
    // Wir prüfen, ob die eigene Domain (hostname) darin vorkommt.
    const hasInternalHistory = document.referrer && document.referrer.includes(window.location.hostname);

    if (hasInternalHistory) {
        // Normales Zurück
        window.history.back();
    } else {
        // Fallback: Wenn man direkt von Google/Link kommt, geht man zur Startseite
        window.location.href = 'index.html';
    }
}

/**
 * Injiziert den Footer
 */
export function injectFooter() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (!footerPlaceholder) return;

  const year = new Date().getFullYear();
  const displayYear = year > 2026 ? `2026 – ${year}` : '2026';

  footerPlaceholder.innerHTML = `
    <footer class="footer">
      <div class="container">
        <p>© ${displayYear} Elias Friderici – Alle Rechte vorbehalten.</p>
        <div class="footer-links">
          <a href="impressum.html">Impressum</a>
          <a href="datenschutz.html">Datenschutz</a>
        </div>
      </div>
    </footer>
  `;
}

function initMobileMenu() {
  const burger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
  }
}

/**
 * Initialisiert Scroll-Buttons
 */
export function initScrollControls() {
  const sliders = document.querySelectorAll('.video-slider-wrapper');

  sliders.forEach(wrapper => {
    const container = wrapper.querySelector('.video-grid');
    const btnLeft = wrapper.querySelector('.scroll-btn.left');
    const btnRight = wrapper.querySelector('.scroll-btn.right');

    if (!container || !btnLeft || !btnRight) return;

    const scrollMultiplier = container.id === 'latest-shorts' ? 2 : 1;

    const scroll = (direction) => {
      const firstItem = container.querySelector('.video-card');
      if (!firstItem) return;

      const itemWidth = firstItem.offsetWidth;
      const gap = parseInt(window.getComputedStyle(container).gap || '0');
      const scrollAmount = (itemWidth + gap) * scrollMultiplier;

      container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
      });
    };

    btnLeft.addEventListener('click', () => scroll(-1));
    btnRight.addEventListener('click', () => scroll(1));
  });
}