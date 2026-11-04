(() => {
  if (customElements.get('compare-product-new')) return;

  class CompareProductNew extends HTMLElement {
    connectedCallback() {
      if (this.controller) return;
      this.controller = new AbortController();
      const data = JSON.parse(this.querySelector('[data-compare-data]').textContent);
      this.products = data.products.filter(product => product.id && product.title?.trim());
      this.hidden = !this.products.length;
      if (this.hidden) return;

      this.swatches = new Map((data.swatches || '').split(/\r?\n/).map(line => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }).filter(([name, color]) => name && color));
      this.groups = new Map();
      data.groups.forEach(group => {
        const sort = Number(group.sort);
        if (!this.groups.has(sort)) this.groups.set(sort, []);
        this.groups.get(sort).push(group);
      });
      this.selected = [0, this.products.length > 1 ? 1 : 0];
      this.selectors = [0, 1].map(side => this.createSelector(side));
      this.querySelector('[data-select-container]').replaceChildren(...this.selectors.map(item => item.wrapper));
      this.listen(document, 'click', event => {
        if (!this.selectors.some(item => item.wrapper.contains(event.target))) this.closeMenus();
      });
      this.listen(this, 'focusout', event => {
        if (!this.contains(event.relatedTarget)) this.closeMenus();
      });
      this.render();
    }

    disconnectedCallback() {
      this.controller?.abort();
      this.controller = null;
    }

    listen(target, type, handler) {
      target.addEventListener(type, handler, { signal: this.controller.signal });
    }

    element(tag, className, text) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text != null) element.textContent = text;
      return element;
    }

    createSelector(side) {
      const wrapper = this.element('div', 'compare-select');
      const trigger = this.element('button', 'compare-select-trigger');
      trigger.type = 'button';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      const list = this.element('div', 'compare-select-options');
      list.id = `compare-options-${this.dataset.sectionId}-${side}`;
      list.setAttribute('role', 'listbox');
      list.setAttribute('aria-label', side === 0 ? '比較する商品（左）' : '比較する商品（右）');
      trigger.setAttribute('aria-controls', list.id);
      list.hidden = true;
      const options = this.products.map((product, index) => {
        const option = this.element('div', 'compare-select-option', product.title);
        option.setAttribute('role', 'option');
        option.tabIndex = -1;
        this.listen(option, 'click', () => this.choose(side, index));
        this.listen(option, 'keydown', event => {
          const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape', 'Tab'];
          if (!keys.includes(event.key)) return;
          if (event.key === 'Tab') { this.closeMenus(); return; }
          event.preventDefault();
          if (event.key === 'Escape') { this.closeMenus(); trigger.focus(); return; }
          if (event.key === 'Enter' || event.key === ' ') { this.choose(side, index); return; }
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
          options[next].focus();
        });
        return option;
      });
      list.append(...options);
      const open = () => {
        this.closeMenus();
        list.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        options[this.selected[side]].focus();
      };
      this.listen(trigger, 'click', () => list.hidden ? open() : this.closeMenus());
      this.listen(trigger, 'keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          open();
        }
      });
      wrapper.append(trigger, list);
      return { wrapper, trigger, list, options };
    }

    closeMenus() {
      this.selectors.forEach(({ trigger, list }) => {
        list.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      });
    }

    choose(side, index) {
      const previous = this.selected[side];
      this.selected[side] = index;
      if (this.products.length > 1 && this.selected[1 - side] === index) this.selected[1 - side] = previous;
      this.closeMenus();
      this.render();
      this.selectors[side].trigger.focus();
    }

    render() {
      this.selectors.forEach(({ trigger, options }, side) => {
        const title = this.products[this.selected[side]].title;
        trigger.textContent = title;
        trigger.setAttribute('aria-label', `${side === 0 ? '比較する商品（左）' : '比較する商品（右）'}: ${title}`);
        options.forEach((option, index) => option.setAttribute('aria-selected', String(index === this.selected[side])));
      });
      this.querySelector('[data-product-details]').replaceChildren(...this.selected.map(index => this.createCard(this.products[index])));
      this.renderTable();
    }

    createCard(product) {
      const card = this.element('article', 'product-area-item');
      const imageBox = this.element('div', 'product-area-img-list');
      const image = this.element('img');
      image.alt = product.title;
      image.width = 600;
      image.height = 600;
      image.loading = 'lazy';
      image.decoding = 'async';
      const variants = product.variants.filter(variant => variant.image);
      const initialImage = variants[0]?.image || product.image;
      if (initialImage) { image.src = initialImage; imageBox.append(image); }
      card.append(imageBox);
      const content = this.element('div', 'product-area-cont');
      const title = this.element('h3', 'product-area-h3', product.title);
      const price = this.element('span', 'product-area-price');
      // Shopify money formatting may contain the store's configured HTML.
      price.innerHTML = product.price || '';
      title.append(price);
      content.append(title);
      const dots = this.element('div', 'product-area-dot');
      const colors = new Set();
      variants.forEach(variant => {
        if (!variant.color || colors.has(variant.color)) return;
        colors.add(variant.color);
        const dot = this.element('button', 'product-area-dot-item');
        dot.type = 'button';
        dot.setAttribute('aria-label', `${product.title}: ${variant.color}`);
        dot.setAttribute('aria-pressed', String(dots.children.length === 0));
        dot.style.backgroundColor = this.swatches.get(variant.color) || '#000';
        // Card listeners are collected with their removed cards on rerender.
        dot.addEventListener('click', () => {
          image.src = variant.image;
          Array.from(dots.children).forEach(item => item.setAttribute('aria-pressed', String(item === dot)));
        });
        dots.append(dot);
      });
      if (dots.children.length > 1) content.append(dots);
      if (product.buttonText && product.link) {
        const button = this.element('a', 'btn-diy', product.buttonText);
        button.href = product.link;
        content.append(button);
      }
      card.append(content);
      return card;
    }

    createField(field) {
      const column = this.element('div', 'field-col');
      if (!field) return column;
      const content = this.element('div', 'field-content-container');
      if (field.image) {
        const image = this.element('img', 'field-icon');
        image.src = field.image;
        image.alt = '';
        image.width = 120;
        image.height = 120;
        image.loading = 'lazy';
        image.decoding = 'async';
        content.append(image);
      }
      if (field.text) {
        const text = this.element('div', 'field-title');
        // Rich text is authored in the Shopify section editor.
        text.innerHTML = field.text;
        content.append(text);
      }
      column.append(content);
      return column;
    }

    renderTable() {
      const [left, right] = this.selected.map(index => this.groups.get(this.products[index].sort) || []);
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < Math.max(left.length, right.length); index++) {
        const group = this.element('section', 'group');
        const fields = this.element('div', 'fields-container');
        for (let fieldIndex = 0; fieldIndex < 6; fieldIndex++) {
          const pair = [left[index]?.fields[fieldIndex], right[index]?.fields[fieldIndex]];
          if (!pair.some(field => field && (field.image || field.text?.replace(/<[^>]*>|&nbsp;/g, '').trim()))) continue;
          const row = this.element('div', 'fields-row');
          row.append(...pair.map(field => this.createField(field)));
          fields.append(row);
        }
        if (!fields.children.length) continue;
        const title = left[index]?.title || right[index]?.title;
        if (title) group.append(this.element('h3', 'group-title', title));
        group.append(fields);
        fragment.append(group);
      }
      this.querySelector('[data-compare-table]').replaceChildren(fragment);
    }
  }

  customElements.define('compare-product-new', CompareProductNew);
})();
