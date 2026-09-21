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

  function updateCart(payload) {
    return fetch(rootUrl + 'cart/update.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(function(response) {
      return response.json().then(function(cart) {
        if (!response.ok || cart.errors) {
          throw new Error(cart.description || cart.message || cart.errors || 'Gift wrapping update failed');
        }
        return cart;
      });
    });
  }

  function announceCartUpdate(cart, source) {
    document.documentElement.dispatchEvent(new CustomEvent('cart:updated', {
      bubbles: true,
      detail: { cart: cart }
    }));

    if (source.closest('cart-drawer')) {
      document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
      return;
    }

    window.location.reload();
  }

  if (!customElements.get('gift-wrapping')) {
    customElements.define('gift-wrapping', class extends HTMLElement {
      connectedCallback() {
        if (this.dataset.ready === 'true') return;
        this.dataset.ready = 'true';
        this.checkbox = this.querySelector('[name="attributes[gift-wrapping]"]');
        this.note = this.querySelector('[name="attributes[gift-note]"]');
        this.loader = this.querySelector('.loader');

        if (this.checkbox) {
          this.checkbox.addEventListener('change', this.onToggle.bind(this));
        }
        if (this.note) {
          this.note.addEventListener('change', debounce(this.onNoteChange.bind(this), 250));
        }
      }

      onToggle(event) {
        this.setGiftWrap(event.target.checked);
      }

      onNoteChange(event) {
        this.setLoading(true);
        updateCart({ attributes: { 'gift-note': event.target.value } })
          .then(function(cart) {
            document.documentElement.dispatchEvent(new CustomEvent('cart:updated', {
              bubbles: true,
              detail: { cart: cart }
            }));
          })
          .catch(function(error) {
            window.alert(error.message);
          })
          .finally(this.setLoading.bind(this, false));
      }

      setGiftWrap(enabled) {
        var giftWrapId = this.dataset.giftWrapId;
        var itemCount = Number(this.getAttribute('items-in-cart')) || 0;
        var updates = {};
        updates[giftWrapId] = enabled ? itemCount : 0;

        this.setLoading(true);
        updateCart({
          updates: updates,
          attributes: {
            'gift-wrapping': enabled ? 'yes' : '',
            'gift-note': enabled ? (this.note ? this.note.value : '') : ''
          }
        })
          .then(function(cart) {
            announceCartUpdate(cart, this);
          }.bind(this))
          .catch(function(error) {
            if (this.checkbox) this.checkbox.checked = !enabled;
            window.alert(error.message);
          }.bind(this))
          .finally(this.setLoading.bind(this, false));
      }

      removeGiftWrap() {
        this.setGiftWrap(false);
      }

      setLoading(loading) {
        if (this.loader) this.loader.hidden = !loading;
        if (this.checkbox) this.checkbox.disabled = loading;
        if (this.note) this.note.disabled = loading;
      }
    });
  }

  document.addEventListener('click', function(event) {
    var removeLink = event.target.closest('[is="remove-gift-wrap"]');
    if (!removeLink) return;

    var scope = removeLink.closest('cart-drawer') || removeLink.closest('.cart') || document;
    var giftWrapping = scope.querySelector('gift-wrapping');
    if (!giftWrapping || typeof giftWrapping.removeGiftWrap !== 'function') return;

    event.preventDefault();
    giftWrapping.removeGiftWrap();
  });
})();
