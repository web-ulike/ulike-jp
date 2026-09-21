(() => {
  function initHeader2026(root = document) {
    root.querySelectorAll('[data-header-2026-scroll-reveal]').forEach((header) => {
      if (header.dataset.scrollRevealReady) return;

      const section = header.closest('.shopify-section--header');
      if (!section) return;

      header.dataset.scrollRevealReady = 'true';
      let lastScrollY = window.scrollY;
      let isTicking = false;
      let lastDirection = 0;
      let directionalDistance = 0;

      const updateVisibility = () => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY;
        const direction = Math.sign(scrollDelta);

        if (direction && direction !== lastDirection) {
          directionalDistance = 0;
        }
        directionalDistance += Math.abs(scrollDelta);

        if (currentScrollY <= 8) {
          section.classList.remove('header-2026--scroll-hidden');
          directionalDistance = 0;
        } else if (directionalDistance >= 8 && direction < 0) {
          section.classList.remove('header-2026--scroll-hidden');
          directionalDistance = 0;
        } else if (directionalDistance >= 8 && direction > 0) {
          section.classList.add('header-2026--scroll-hidden');
          directionalDistance = 0;
        }

        lastScrollY = currentScrollY;
        lastDirection = direction || lastDirection;
        isTicking = false;
      };

      window.addEventListener('scroll', () => {
        if (!isTicking) {
          isTicking = true;
          window.requestAnimationFrame(updateVisibility);
        }
      }, { passive: true });
    });

    root.querySelectorAll('[data-header-2026-topic]').forEach((button) => {
      if (button.dataset.ready) return;
      button.dataset.ready = 'true';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const links = button.nextElementSibling;
        const open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(open));
        links.hidden = !open;
      });
    });

    root.querySelectorAll('[data-header-2026-product-carousel]').forEach((carousel) => {
      if (carousel.dataset.ready) return;
      carousel.dataset.ready = 'true';
      const track = carousel.querySelector('[data-header-2026-carousel-track]');
      const previous = carousel.querySelector('[data-header-2026-carousel-prev]');
      const next = carousel.querySelector('[data-header-2026-carousel-next]');
      if (!track || !previous || !next) return;
      const cardCount = track?.children.length || 0;
      const pageCount = Math.ceil(cardCount / 3);
      let page = 0;

      const update = () => {
        track.style.transform = `translateX(-${page * 100}%)`;
        previous.disabled = page === 0;
        next.disabled = page >= pageCount - 1;
      };

      previous?.addEventListener('click', () => {
        page = Math.max(0, page - 1);
        update();
      });
      next?.addEventListener('click', () => {
        page = Math.min(pageCount - 1, page + 1);
        update();
      });
      update();
    });

    root.querySelectorAll('.header-2026__mobile-drawer').forEach((drawer) => {
      if (drawer.dataset.header2026Ready) return;
      drawer.dataset.header2026Ready = 'true';
    });
  }

  function closeMobilePanels(drawer) {
    drawer.querySelectorAll('[data-header-2026-panel]').forEach((panel) => {
      panel.hidden = true;
    });
    drawer.querySelectorAll('[data-header-2026-open-panel]').forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
    });
  }

  function handleMobilePanelControl(event) {
    // `mobile-navigation` moves itself to <body> when append-body is present.
    // Delegate from document so panel controls keep working after that move and
    // after Shopify replaces the header section in the theme editor.
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return false;
    const opener = target.closest('[data-header-2026-open-panel]');
    const backButton = target.closest('[data-header-2026-back]');
    const closeButton = target.closest('.header-2026__mobile-drawer [data-action="close"]');
    const control = opener || backButton || closeButton;
    const drawer = control?.closest('.header-2026__mobile-drawer');
    if (!drawer) return false;

    if (opener) {
      // `data-header-2026-open-panel` cannot be read through `dataset`:
      // a hyphen followed by the numeric token `2026` is not camel-cased.
      const panelName = opener.getAttribute('data-header-2026-open-panel');
      const panel = drawer.querySelector(`[data-header-2026-panel="${panelName}"]`);
      if (!panel) return false;
      event.preventDefault();
      closeMobilePanels(drawer);
      panel.hidden = false;
      opener.setAttribute('aria-expanded', 'true');
      panel.querySelector('[data-header-2026-panel-scroll]')?.scrollTo(0, 0);
      return true;
    }

    if (backButton || closeButton) {
      closeMobilePanels(drawer);
      return true;
    }

    return false;
  }

  document.addEventListener('click', handleMobilePanelControl, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initHeader2026());
  } else {
    initHeader2026();
  }

  document.addEventListener('shopify:section:load', (event) => initHeader2026(event.target));
})();
