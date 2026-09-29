document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.search-page-2026__form').forEach((form) => {
    const input = form.querySelector('.search-page-2026__input');
    const clear = form.querySelector('.search-page-2026__clear');

    const updateClear = () => { clear.hidden = input.value.length === 0; };
    input.addEventListener('input', updateClear);
    clear.addEventListener('click', () => {
      input.value = '';
      updateClear();
      input.focus();
    });
    updateClear();
  });

  const close = document.querySelector('.search-page-2026__mobile-close');
  if (close && document.referrer) {
    try {
      if (new URL(document.referrer).origin === location.origin) {
        close.addEventListener('click', (event) => {
          event.preventDefault();
          history.back();
        });
      }
    } catch (_) {
      // The link still returns to the storefront when the referrer is invalid.
    }
  }
});
