/* Site scripts: analytics consent and navbar behaviour. No dependencies. */
(() => {
  'use strict';

  /* ---------- Google Analytics, loaded only after the visitor accepts ---------- */

  const GA_ID = 'G-W9XHCK0310';
  const CONSENT_KEY = 'analytics-consent';

  // localStorage can throw (private mode, blocked site data).
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    },
  };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  function loadAnalytics() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  const consent = storage.get(CONSENT_KEY);
  const banner = document.getElementById('consent');

  if (consent === 'yes') {
    loadAnalytics();
  } else if (!consent && banner) {
    const answer = (value) => {
      storage.set(CONSENT_KEY, value);
      banner.hidden = true;
      if (value === 'yes') loadAnalytics();
    };
    document.getElementById('consent-yes').addEventListener('click', () => answer('yes'));
    document.getElementById('consent-no').addEventListener('click', () => answer('no'));
    banner.hidden = false;
  }

  /* ---------- Navbar ---------- */

  const navbar = document.querySelector('.custom-navbar');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const links = [...menu.querySelectorAll('.link')];
  const sections = links.map((link) => document.querySelector(link.hash)).filter(Boolean);
  const mobileMenu = window.matchMedia('(max-width: 991.98px)');

  function setMenuOpen(open) {
    menu.classList.toggle('show', open);
    toggle.classList.toggle('is-active', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('show')));

  // On small screens the menu covers the page: close it after choosing a section.
  menu.addEventListener('click', (event) => {
    if (event.target.closest('.link') && mobileMenu.matches) setMenuOpen(false);
  });

  function onScroll() {
    // White navbar once the page leaves the top.
    navbar.classList.toggle('affix', window.scrollY > 20);

    // Highlight the link of the section currently on screen.
    const y = window.scrollY + 80;
    let current = null;
    for (const section of sections) {
      if (section.offsetTop <= y) current = section;
    }
    for (const link of links) {
      link.classList.toggle('active', current !== null && link.hash === `#${current.id}`);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
