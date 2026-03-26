/* assets/u-scroll-module.all.js */
(function () {
  const ROOT_SELECTOR = '[data-scroll-module]';
  const MOBILE_MQ = '(max-width: 768px)';

  function isReady() {
    return !!(window.gsap && window.ScrollTrigger);
  }
  function getMode() {
    return window.matchMedia(MOBILE_MQ).matches ? 'm' : 'd';
  }

  function killInstance(root) {
    if (!root || !window.gsap || !window.ScrollTrigger) return;

    if (root.__uScroll_ST) {
      root.__uScroll_ST.kill();
      root.__uScroll_ST = null;
    }
    if (root.__uScroll_rotTL) {
      root.__uScroll_rotTL.kill();
      root.__uScroll_rotTL = null;
    }
    if (root.__uScroll_ticker) {
      gsap.ticker.remove(root.__uScroll_ticker);
      root.__uScroll_ticker = null;
    }

    ScrollTrigger.getAll().forEach((st) => {
      try {
        if (st && st.trigger && root.contains(st.trigger)) st.kill();
      } catch (e) {}
    });
  }

  function initOne(root) {
    if (!root || !isReady()) return;

    gsap.registerPlugin(ScrollTrigger);

    const container = root.querySelector('.card-container');
    const textEl = root.querySelector('.card-text');
    const cards = gsap.utils.toArray(root.querySelectorAll('.card-image'));
    if (!container || !textEl || !cards.length) return;

    const mode = getMode();
    root.__uScroll_mode = mode;

    killInstance(root);

    const cfg =
      mode === 'm'
        ? {
            imgStart: 0.42,
            end: '+=75%',
            startYvh: 20,
            endYvh: -0,
            scaleMax: 0.03,
            rotDuringMax: 4,
            rotEndMax: 14,
            lagFactor: 0.10,
            textEnd: 0.55,
            wobbleAmp: 0.9,
            rotEndDuration: 0.7,
            rotEndStagger: 0.04
          }
        : {
            imgStart: 0.42,        // 同上：图片动画的起始进度阈值
            end: '+60%',         // PC 端滚动区间更长：多给 100% 的滚动距离，动画更舒展

            baseYvh: 20,           // PC 端基础 Y 偏移（vh）：通常作为 y = baseYvh + deltaY 的基准位置
            baseScale: 0.08,       // PC 端基础缩放增量/基准量：常用于 scale = 1 + baseScale * f(t)
                                  //（具体是“增量”还是“绝对值”取决于你的实现公式）

            rotDuringMax: 6,       // PC 端过程旋转更小（deg）：桌面端更克制，避免晃眼
            rotEndMax: 14,         // PC 端末端定格角度上限（deg）：收尾落位依然可以稍明显一点

            lagFactor: 0.10,       // 同上：跟随拖尾/平滑系数
            textEnd: 0.55,         // 同上：文案动画结束点
            wobbleAmp: 1.2,        // PC 端微摆动幅度更大：视觉更“松弛”（前提是 rotDuringMax 较小）

            rotEndDuration: 0.8,   // PC 端收尾稍慢一点（秒）：落位更平滑
            rotEndStagger: 0.08    // PC 端错开更大（秒）：多图叠加时层次更明显
          };

    gsap.set(cards, { visibility: 'hidden', opacity: 1 });

    const rotLag = { current: cards.map(() => 0), target: cards.map(() => 0) };
    const rotSetters = cards.map((el) => gsap.quickSetter(el, 'rotation', 'deg'));

    root.__uScroll_ticker = () => {
      for (let i = 0; i < cards.length; i++) {
        rotLag.current[i] += (rotLag.target[i] - rotLag.current[i]) * cfg.lagFactor;
        rotSetters[i](rotLag.current[i]);
      }
    };
    gsap.ticker.add(root.__uScroll_ticker);

    const rotTL = gsap.timeline({ paused: true });
    root.__uScroll_rotTL = rotTL;

    rotTL.to(
      cards,
      {
        rotation: (i) => {
          const dir = i % 2 === 0 ? -1 : 1;
          const amp = cfg.rotEndMax;
          return dir * (amp * (0.75 + i * 0.1));
        },
        duration: cfg.rotEndDuration,
        ease: 'power3.out',
        stagger: cfg.rotEndStagger,
        overwrite: true
      },
      0
    );

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: cfg.end,
      pin: container,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const p = self.progress;

        const textP = Math.min(1, p / cfg.textEnd);
        const size = Math.max(0, Math.min(100, textP * 120));
        let bg = Math.min(100, size);
        // ✅ 当滚动接近结束（你可以用 p 或 ipClamped）就回灰
        if (p >= 0.9) bg = 0;

        textEl.style.setProperty('--num-backgroundSize', bg + '%');

        if (p < cfg.imgStart) {
          cards.forEach((el, i) => {
            gsap.set(el, {
              x: mode === 'm' ? 0 : '0vw',
              y: mode === 'm' ? cfg.startYvh + 'vh' : '22vh',
              scale: 1,
              opacity: 1,
              visibility: 'hidden',
              force3D: true,
              overwrite: true
            });
            rotLag.target[i] = 0;
          });
          rotTL.progress(0).pause();
          return;
        }

        gsap.set(cards, { visibility: 'visible', opacity: 1 });

        const ip = (p - cfg.imgStart) / (1 - cfg.imgStart);
        const ipClamped = Math.min(1, Math.max(0, ip));

        if (mode === 'm') {
          const e = 1 - Math.pow(1 - ipClamped, 3);
          const y = (1 - e) * cfg.startYvh + e * cfg.endYvh;

          cards.forEach((el, i) => {
            const dir = i % 2 === 0 ? -1 : 1;
            const k = 0.92 + i * 0.04;

            gsap.set(el, {
              x: 0,
              y: y + 'vh',
              scale: 1 + cfg.scaleMax * k * e,
              opacity: 1,
              force3D: true,
              overwrite: true
            });

            const wobble = Math.sin(e * Math.PI) * cfg.wobbleAmp;
            const r = dir * (cfg.rotDuringMax * (0.55 + i * 0.1)) * e + dir * wobble;
            rotLag.target[i] = r;
          });
        } else {
          const baseYvh = cfg.baseYvh;
          const baseScale = cfg.baseScale;

          cards.forEach((el, i) => {
            const dir = i % 2 === 0 ? -1 : 1;
            const k = 0.85 + i * 0.05;

            const y =
              (1 - ipClamped) * (baseYvh * (1.15 + i * 0.06)) - ipClamped * baseYvh * k;

            gsap.set(el, {
              x: '0vw',
              y: y + 'vh',
              scale: 1 + baseScale * k * ipClamped,
              opacity: 1,
              force3D: true,
              overwrite: true
            });

            const wobble = Math.sin(ipClamped * Math.PI) * cfg.wobbleAmp;
            const rDuring =
              dir * (cfg.rotDuringMax * (0.55 + i * 0.08)) * ipClamped + dir * wobble;
            rotLag.target[i] = rDuring;
          });
        }

        const playAt = 0.99;
        if (ipClamped >= playAt) {
          if (rotTL.paused() || rotTL.progress() < 1) rotTL.play();
        } else {
          if (rotTL.progress() > 0) rotTL.reverse();
        }
      }
    });

    root.__uScroll_ST = st;
  }

  function initAll() {
    if (!isReady()) return;
    document.querySelectorAll(ROOT_SELECTOR).forEach((root) => initOne(root));
  }

  function boot() {
    if (!isReady()) return;

    initAll();

    let lastMode = getMode();
    window.addEventListener('resize', () => {
      const nowMode = getMode();

      if (nowMode !== lastMode) {
        document.querySelectorAll(ROOT_SELECTOR).forEach((r) => killInstance(r));
        initAll();
        lastMode = nowMode;
      } else {
        ScrollTrigger.refresh();
      }
    });

    window.addEventListener(
      'load',
      () => {
        if (isReady()) ScrollTrigger.refresh();
      },
      { once: true }
    );

    document.addEventListener('shopify:section:load', (e) => {
      const section = e.target;
      const r = section && section.querySelector && section.querySelector(ROOT_SELECTOR);
      if (r) initOne(r);
    });
  }
  window.addEventListener('load', () => requestAnimationFrame(boot));
})();