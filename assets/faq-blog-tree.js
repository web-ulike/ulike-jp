(() => {
  if (customElements.get('faq-blog-tree')) return;

  customElements.define('faq-blog-tree', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.panel = this.querySelector('[data-faq-panel]');
      if (!this.panel) return;
      this.initialized = true;
      this.votes = new Map();
      this.links = Array.from(this.querySelectorAll('[data-faq-article]'));
      this.classList.add('is-ready');
      this.querySelectorAll('[data-faq-node]').forEach(node => this.setExpanded(node, false));

      this.addEventListener('click', event => {
        const vote = event.target.closest('[data-faq-vote]');
        if (vote && this.panel.contains(vote)) {
          this.vote(vote.dataset.faqVote);
          return;
        }
        const crumb = event.target.closest('[data-faq-crumb]');
        if (crumb && this.panel.contains(crumb)) {
          const node = Array.from(this.querySelectorAll('[data-faq-node]'))
            .find(item => item.dataset.faqNode === crumb.dataset.faqCrumb);
          const label = node?.querySelector('.faq-blog-tree__row > .faq-blog-tree__label');
          if (label?.matches('[data-faq-article]')) this.selectArticle(label, true);
          else if (node) {
            this.setExpanded(node, true);
            label?.focus();
          }
          return;
        }
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
      this.currentLink = link;
      this.renderBreadcrumb(link);
      const feedback = this.querySelector('[data-faq-feedback-template]');
      if (feedback) this.panel.querySelector('article').append(feedback.content.cloneNode(true));
      this.updateVote(this.readVote(link.dataset.articleId));

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

    renderBreadcrumb(link) {
      const nodes = [];
      let node = link.closest('[data-faq-node]');
      while (node && this.contains(node)) {
        nodes.unshift(node);
        node = node.parentElement.closest('[data-faq-node]');
      }
      this.currentPath = nodes.map(item => item.dataset.faqLabel).join(' / ');
      const nav = document.createElement('nav');
      nav.className = 'faq-blog-tree__breadcrumbs';
      nav.setAttribute('aria-label', 'Breadcrumb');
      const list = document.createElement('ol');
      const root = document.createElement('li');
      root.textContent = this.dataset.breadcrumbRoot || 'FAQ';
      list.append(root);
      nodes.forEach((item, index) => {
        const li = document.createElement('li');
        const current = index === nodes.length - 1;
        const label = document.createElement(current ? 'span' : 'button');
        label.textContent = item.dataset.faqLabel;
        if (current) label.setAttribute('aria-current', 'location');
        else {
          label.type = 'button';
          label.dataset.faqCrumb = item.dataset.faqNode;
        }
        li.append(label);
        list.append(li);
      });
      nav.append(list);
      this.panel.prepend(nav);
    }

    readVote(articleId) {
      if (this.votes.has(articleId)) return this.votes.get(articleId);
      try {
        const value = localStorage.getItem(`faq-feedback:${articleId}`);
        return value === 'like' || value === 'dislike' ? value : null;
      } catch (_) {
        return this.votes.get(articleId) || null;
      }
    }

    updateVote(value) {
      this.panel.querySelectorAll('[data-faq-vote]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.faqVote === value));
      });
    }

    vote(value) {
      if (!this.currentLink || !['like', 'dislike'].includes(value)) return;
      const articleId = this.currentLink.dataset.articleId;
      const previous = this.readVote(articleId);
      const next = previous === value ? null : value;
      this.votes.set(articleId, next);
      try {
        if (next) localStorage.setItem(`faq-feedback:${articleId}`, next);
        else localStorage.removeItem(`faq-feedback:${articleId}`);
      } catch (_) { /* Feedback remains usable when browser storage is unavailable. */ }
      // Synchronize repeated articles and multiple instances in this document.
      document.querySelectorAll('faq-blog-tree').forEach(root => {
        if (root.currentLink?.dataset.articleId !== articleId) return;
        root.votes.set(articleId, next);
        root.updateVote(next);
      });
      const params = {
        article_id: articleId,
        article_title: (this.panel.querySelector('[data-faq-title]')?.textContent || '').slice(0, 100),
        article_path: this.currentPath.slice(0, 100),
        article_url: new URL(this.currentLink.getAttribute('href'), location.origin).pathname.slice(0, 100),
        feedback_type: value,
        feedback_action: next ? (previous ? 'change' : 'select') : 'remove',
        previous_feedback: previous || 'none',
        section_id: this.dataset.sectionId
      };
      // Use the existing Google tag only; editor previews must not generate analytics.
      if (this.dataset.designMode !== 'true' && typeof window.gtag === 'function') {
        try {
          window.gtag('event', 'faq_feedback', params);
        } catch (_) { /* Analytics must not interrupt the UI. */ }
      }
    }
  });
})();
