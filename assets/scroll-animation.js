(() => {
  'use strict';

  const selector = '.scroll-animation, [data-scroll-animation]';
  const legacySelector = '.to-top';

  const initLegacyToTop = () => {
    const elements = document.querySelectorAll(legacySelector);
    if (!elements.length) return;

    const reveal = (element) => {
      requestAnimationFrame(() => element.classList.add('appear'));
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.IntersectionObserver) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        reveal(entry.target);
        currentObserver.unobserve(entry.target);
      });
    }, {
      root: null,
      rootMargin: '0px 0px 50px 0px',
      threshold: 0.1
    });

    elements.forEach((element) => observer.observe(element));
  };

  const init = () => {
    initLegacyToTop();

    if (!window.gsap || !window.ScrollTrigger) return;

    window.gsap.registerPlugin(window.ScrollTrigger);

    document.querySelectorAll(selector).forEach((element) => {
      if (element.dataset.scrollAnimationInitialized === 'true') return;

      element.dataset.scrollAnimationInitialized = 'true';

      const animation = element.dataset.scrollAnimation || 'fade-up';
      const distance = Number(element.dataset.scrollDistance || 32);
      const duration = Number(element.dataset.scrollDuration || 0.7);
      const delay = Number(element.dataset.scrollDelay || 0);
      const from = {
        autoAlpha: 0,
        duration,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
          once: true
        }
      };

      if (animation === 'fade-left') from.x = distance;
      else if (animation === 'fade-right') from.x = -distance;
      else if (animation === 'fade-down') from.y = -distance;
      else if (animation === 'zoom-in') from.scale = 0.92;
      else if (animation !== 'fade') from.y = distance;

      window.gsap.from(element, from);
    });

    window.ScrollTrigger.refresh();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
