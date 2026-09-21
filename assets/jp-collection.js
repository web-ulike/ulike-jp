if (!customElements.get('jp-collection-grid')) {
  customElements.define('jp-collection-grid', class extends HTMLElement {
    connectedCallback() {
      this.controller?.abort();
      this.controller = new AbortController();
      const { signal } = this.controller;
      const mobileQuery = window.matchMedia('(max-width: 749px)');
      const syncCardDetails = () => {
        this.querySelectorAll('.jp-collection-card__details').forEach((details) => {
          details.open = !mobileQuery.matches;
        });
      };
      syncCardDetails();
      mobileQuery.addEventListener('change', syncCardDetails, { signal });
      const button = this.querySelector('[data-collection-more]');
      const extras = this.querySelectorAll('.jp-collection-card--extra');
      if (!button || !extras.length) return;
      button.hidden = false;
      this.setAttribute('data-ready', '');
      button.addEventListener('click', () => {
        this.setAttribute('data-expanded', '');
        button.setAttribute('aria-expanded', 'true');
        // Keep keyboard focus on the first revealed card when the button disappears.
        const target = extras[0].querySelector('a, summary');
        if (target) target.focus({ preventScroll: true });
        button.hidden = true;
      }, { signal });
      document.addEventListener('shopify:block:select', (event) => {
        if (this.contains(event.target)) {
          this.setAttribute('data-expanded', '');
          button.setAttribute('aria-expanded', 'true');
          button.hidden = true;
        }
      }, { signal });
    }
    disconnectedCallback() { this.controller?.abort(); }
  });
}
