(() => {
  function initHeader2026(root = document) {
    root.querySelectorAll('[data-header-2026-topic]').forEach((button) => {
      if (button.dataset.ready) return;
      button.dataset.ready = 'true';
      button.addEventListener('click', () => {
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
        track.style.transform = `translateY(-${page * 354}px)`;
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
      const panel = drawer.querySelector('[data-header-2026-products]');
      const openButton = drawer.querySelector('[data-header-2026-open-products]');
      const backButton = drawer.querySelector('[data-header-2026-back]');
      const closeButton = drawer.querySelector('[data-action="close"]');
      const openPanel = () => { panel.hidden = false; };
      const closePanel = () => { panel.hidden = true; };
      openButton?.addEventListener('click', openPanel);
      backButton?.addEventListener('click', closePanel);
      closeButton?.addEventListener('click', closePanel);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initHeader2026());
  } else {
    initHeader2026();
  }

  document.addEventListener('shopify:section:load', (event) => initHeader2026(event.target));
})();
