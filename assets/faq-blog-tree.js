(() => {
  if (customElements.get('faq-blog-tree')) return;

  customElements.define('faq-blog-tree', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.panel = this.querySelector('[data-faq-panel]');
      if (!this.panel) return;
      this.initialized = true;
      this.links = Array.from(this.querySelectorAll('[data-faq-article]'));
      this.classList.add('is-ready');
      this.querySelectorAll('[data-faq-node]').forEach(node => this.setExpanded(node, false));

      this.addEventListener('click', event => {
        const toggle = event.target.closest('[data-faq-toggle]');
        if (toggle && this.contains(toggle)) {
          this.setExpanded(toggle.closest('[data-faq-node]'), toggle.getAttribute('aria-expanded') !== 'true');
          return;
        }
        const link = event.target.closest('[data-faq-article]');
        if (!link || !this.links.includes(link)) return;
        // Preserve native open-in-new-tab actions; ordinary clicks stay on the FAQ URL.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        this.selectArticle(link, true);
      });

      const initial = this.links.find(link => link.dataset.articleId === this.dataset.initialArticle) || this.links[0];
      if (initial) this.selectArticle(initial, false);
    }

    setExpanded(node, expanded) {
      const children = Array.from(node.children).find(child => child.matches('[data-faq-children]'));
      if (!children) return;
      children.hidden = !expanded;
      const row = Array.from(node.children).find(child => child.classList.contains('faq-blog-tree__row'));
      row.querySelectorAll('[data-faq-toggle]').forEach(toggle => toggle.setAttribute('aria-expanded', String(expanded)));
    }

    selectArticle(link, moveFocus) {
      const template = Array.from(this.querySelectorAll('[data-faq-template]'))
        .find(item => item.dataset.faqTemplate === link.dataset.faqArticle);
      if (!template) return;
      this.links.forEach(item => item.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'true');
      this.panel.replaceChildren(template.content.cloneNode(true));

      // Open the selected category and all its parents, including a default nested article.
      let node = link.closest('[data-faq-node]');
      while (node && this.contains(node)) {
        this.setExpanded(node, true);
        node = node.parentElement.closest('[data-faq-node]');
      }

      const title = this.panel.querySelector('[data-faq-title]');
      const status = this.querySelector('[data-faq-status]');
      if (status) status.textContent = title?.textContent || '';
      if (moveFocus && title) {
        title.focus({ preventScroll: true });
        // On mobile the directory precedes the article, so bring the answer into view.
        if (window.matchMedia('(max-width: 767px)').matches) {
          title.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
      }
    }
  });
})();
