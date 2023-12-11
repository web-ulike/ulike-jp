window.theme = window.theme || {};

theme.config = {
  mqlSmall: false,
  mediaQuerySmall: 'screen and (max-width: 749px)',
  isTouch: ('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
};

// Init section function when it's visible, then disable observer
theme.initWhenVisible = function(options) {
  const threshold = options.threshold ? options.threshold : 0;

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (typeof options.callback === 'function') {
          options.callback();
          observer.unobserve(entry.target);
        }
      }
    });
  }, {rootMargin: `0px 0px ${threshold}px 0px`});

  observer.observe(options.element);
};

let path = window.location.pathname;
if(path == '/en/collections/color-features/products/men-air2'){
  window.location.href = window.location.origin + '/collections/color-features/products/men-air2' + window.location.search
}

class ImageComparison extends HTMLElement {
  constructor() {
    super();

    this.active = false;
    this.button = this.querySelector('button');
    this.horizontal = this.dataset.layout === 'horizontal';
    this.init();

    theme.initWhenVisible({
      element: this.querySelector('.image-comparison__animate'),
      callback: this.animate.bind(this),
      threshold: 0
    });

  }

  animate() {
    this.setAttribute('animate', '');
    this.classList.add('animating');
    setTimeout(() => {
      this.classList.remove('animating');
    }, 1e3);
  }

  init() {
    if (theme.config.isTouch) {
      this.button.addEventListener('touchstart', this.startHandler.bind(this));
      document.body.addEventListener('touchend', this.endHandler.bind(this));
      document.body.addEventListener('touchmove', this.onHandler.bind(this));
    }
    else {
      this.button.addEventListener('mousedown', this.startHandler.bind(this));
      document.body.addEventListener('mouseup', this.endHandler.bind(this));
      document.body.addEventListener('mousemove', this.onHandler.bind(this));
    }
  }

  startHandler() {
    this.active = true;
    this.classList.add('scrolling');
  }

  endHandler() {
    this.active = false;
    this.classList.remove('scrolling');
  }

  onHandler(e) {
    if (!this.active) return;

    const event = (e.touches && e.touches[0]) || e;
    const x = this.horizontal
                ? event.pageX - this.offsetLeft
                : event.pageY - this.offsetTop;

    this.scrollIt(x);
  }

  scrollIt(x) {
    const distance = this.horizontal ? this.clientWidth : this.clientHeight;

    const max = distance - 20;
    const min = 20;
    const mouseX = Math.max(min, (Math.min(x, max)));
    const mousePercent = (mouseX * 100) / distance;
    this.style.setProperty('--percent', mousePercent + '%');
  }
}
customElements.define('image-comparison', ImageComparison);