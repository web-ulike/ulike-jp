(function() {
  'use strict';

  var rootUrl = window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/';

  function debounce(callback, delay) {
    var timer;
    return function() {
      var context = this;
      var args = arguments;
      window.clearTimeout(timer);
      timer = window.setTimeout(function() {
        callback.apply(context, args);
      }, delay);
    };
  }

  function fetchConfig() {
    return {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
  }

  if (!customElements.get('cart-quantity')) {
    customElements.define('cart-quantity', class extends HTMLElement {
      connectedCallback() {
        if (this.dataset.ready === 'true') return;
        this.dataset.ready = 'true';
        this.input = this.querySelector('.quantity__input');
        this.addEventListener('click', this.onClick.bind(this));
        this.syncButtons();
      }

      onClick(event) {
        var button = event.target.closest('.quantity__button');
        if (!button || !this.contains(button) || !this.input) return;

        var current = Number(this.input.value) || 1;
        var min = Number(this.input.min) || 1;
        var max = this.input.max ? Number(this.input.max) : Infinity;
        var next = button.name === 'plus' ? current + 1 : current - 1;
        next = Math.max(min, Math.min(max, next));

        if (next === current) return;
        this.input.value = String(next);
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this.syncButtons();
      }

      syncButtons() {
        if (!this.input) return;
        var value = Number(this.input.value) || 1;
        var min = Number(this.input.min) || 1;
        var max = this.input.max ? Number(this.input.max) : Infinity;
        var minus = this.querySelector('[name="minus"]');
        var plus = this.querySelector('[name="plus"]');
        if (minus) minus.disabled = value <= min;
        if (plus) plus.disabled = value >= max;
      }
    });
  }

  if (!customElements.get('cart-items')) {
    customElements.define('cart-items', class extends HTMLElement {
      connectedCallback() {
        if (this.dataset.ready === 'true') return;
        this.dataset.ready = 'true';
        this.onQuantityChange = debounce(this.onQuantityChange.bind(this), 250);
        this.addEventListener('change', this.onQuantityChange);
        this.addEventListener('click', this.onClick.bind(this));
      }

      onClick(event) {
        var removeLink = event.target.closest('[data-cart-remove]');
        if (!removeLink || !this.contains(removeLink)) return;
        event.preventDefault();
        if (removeLink.getAttribute('aria-busy') === 'true') return;
        this.updateQuantity(removeLink.dataset.index, 0, removeLink);
      }

      onQuantityChange(event) {
        if (!event.target.matches('.quantity__input')) return;
        this.updateQuantity(event.target.dataset.index, event.target.value, event.target);
      }

      updateQuantity(line, quantity, source) {
        var mainCart = this.closest('main-cart');
        var sectionId = mainCart && mainCart.dataset.sectionId;
        if (!sectionId) {
          window.location.href = rootUrl + 'cart';
          return;
        }

        var loader = document.getElementById('Loader-' + sectionId + '-' + line);
        if (loader) loader.hidden = false;
        if (source) source.setAttribute('aria-busy', 'true');

        var body = JSON.stringify({
          line: Number(line),
          quantity: Number(quantity),
          sections: [sectionId],
          sections_url: window.location.pathname
        });

        fetch(rootUrl + 'cart/change.js', Object.assign(fetchConfig(), { body: body }))
          .then(function(response) {
            return response.json().then(function(data) {
              if (!response.ok || data.errors) throw new Error(data.description || data.message || data.errors || 'Cart update failed');
              return data;
            });
          })
          .then(function(cart) {
            var sectionHtml = cart.sections && cart.sections[sectionId];
            if (!sectionHtml) {
              window.location.reload();
              return;
            }

            var parsed = new DOMParser().parseFromString(sectionHtml, 'text/html');
            var updatedCart = parsed.querySelector('.cart');
            var currentCart = document.querySelector('#shopify-section-' + sectionId + ' .cart');

            if (updatedCart && currentCart) currentCart.replaceWith(updatedCart);

            document.documentElement.dispatchEvent(new CustomEvent('cart:updated', {
              bubbles: true,
              detail: { cart: cart }
            }));
          })
          .catch(function(error) {
            if (source && source.matches('.quantity__input')) source.value = source.defaultValue;
            window.alert(error.message);
          })
          .finally(function() {
            if (loader) loader.hidden = true;
            if (source) source.removeAttribute('aria-busy');
          });
      }
    });
  }

  if (!customElements.get('cart-page-note')) {
    customElements.define('cart-page-note', class extends HTMLElement {
      connectedCallback() {
        if (this.dataset.ready === 'true') return;
        this.dataset.ready = 'true';
        this.textarea = this.querySelector('textarea');
        if (!this.textarea) return;
        this.textarea.addEventListener('change', debounce(this.save.bind(this), 250));
      }

      save() {
        var body = JSON.stringify({ note: this.textarea.value });
        fetch(rootUrl + 'cart/update.js', Object.assign(fetchConfig(), { body: body }))
          .then(function(response) {
            if (!response.ok) throw new Error('Order note update failed');
            return response.json();
          })
          .then(function(cart) {
            document.documentElement.dispatchEvent(new CustomEvent('cart:updated', {
              bubbles: true,
              detail: { cart: cart }
            }));
          })
          .catch(function(error) {
            window.alert(error.message);
          });
      }
    });
  }
})();
