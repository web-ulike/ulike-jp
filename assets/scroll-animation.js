(() => {
  'use strict';

  const selector = '.scroll-animation, [data-scroll-animation]';

  const init = () => {
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
