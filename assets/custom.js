/**
 * DEVELOPER DOCUMENTATION
 *
 * Include your custom JavaScript here.
 *
 * The theme Focal has been developed to be easily extensible through the usage of a lot of different JavaScript
 * events, as well as the usage of custom elements (https://developers.google.com/web/fundamentals/web-components/customelements)
 * to easily extend the theme and re-use the theme infrastructure for your own code.
 *
 * The technical documentation is summarized here.
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN A VARIANT HAS CHANGED
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever a the user has changed the variant in a selector. The target get you the form
 * that triggered this event.
 *
 * Example:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   let variant = event.detail.variant; // Gives you access to the whole variant details
 *   let form = event.target;
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN A NEW VARIANT IS ADDED TO THE CART
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever a variant is added to the cart through a form selector (product page, quick
 * view...). This event DOES NOT include any change done through the cart on an existing variant. For that,
 * please refer to the "cart:updated" event.
 *
 * Example:
 *
 * document.addEventListener('variant:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN THE CART CONTENT HAS CHANGED
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever the cart content has changed (if the quantity of a variant has changed, if a variant
 * has been removed, if the note has changed...). This event will also be emitted when a new variant has been
 * added (so you will receive both "variant:added" and "cart:updated"). Contrary to the variant:added event,
 * this event will give you the complete details of the cart.
 *
 * Example:
 *
 * document.addEventListener('cart:updated', function(event) {
 *   var cart = event.detail.cart; // Get the updated content of the cart
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * REFRESH THE CART/MINI-CART
 * ------------------------------------------------------------------------------------------------------------
 *
 * If you are adding variants to the cart and would like to instruct the theme to re-render the cart, you cart
 * send the cart:refresh event, as shown below:
 *
 * document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
 *   bubbles: true
 * }));
 *
 * ------------------------------------------------------------------------------------------------------------
 * USAGE OF CUSTOM ELEMENTS
 * ------------------------------------------------------------------------------------------------------------
 *
 * Our theme makes extensive use of HTML custom elements. Custom elements are an awesome way to extend HTML
 * by creating new elements that carry their own JavaScript for adding new behavior. The theme uses a large
 * number of custom elements, but the two most useful are drawer and popover. Each of those components add
 * a "open" attribute that you can toggle on and off. For instance, let's say you would like to open the cart
 * drawer, whose id is "mini-cart", you simply need to retrieve it and set its "open" attribute to true (or
 * false to close it):
 *
 * document.getElementById('mini-cart').open = true;
 *
 * Thanks to the power of custom elements, the theme will take care automagically of trapping focus, maintaining
 * proper accessibility attributes...
 *
 * If you would like to create your own drawer, you can re-use the <drawer-content> content. Here is a simple
 * example:
 *
 * // Make sure you add "aria-controls", "aria-expanded" and "is" HTML attributes to your button:
 * <button type="button" is="toggle-button" aria-controls="id-of-drawer" aria-expanded="false">Open drawer</button>
 *
 * <drawer-content id="id-of-drawer">
 *   Your content
 * </drawer-content>
 *
 * The nice thing with custom elements is that you do not actually need to instantiate JavaScript yourself: this
 * is done automatically as soon as the element is inserted to the DOM.
 *
 * ------------------------------------------------------------------------------------------------------------
 * THEME DEPENDENCIES
 * ------------------------------------------------------------------------------------------------------------
 *
 * While the theme tries to keep outside dependencies as small as possible, the theme still uses third-party code
 * to power some of its features. Here is the list of all dependencies:
 *
 * "vendor.js":
 *
 * The vendor.js contains required dependencies. This file is loaded in parallel of the theme file.
 *
 * - custom-elements polyfill (used for built-in elements on Safari - v1.0.0): https://github.com/ungap/custom-elements
 * - web-animations-polyfill (used for polyfilling WebAnimations on Safari 12, this polyfill will be removed in 1 year - v2.3.2): https://github.com/web-animations/web-animations-js
 * - instant-page (v5.1.0): https://github.com/instantpage/instant.page
 * - tocca (v2.0.9); https://github.com/GianlucaGuarini/Tocca.js/
 * - seamless-scroll-polyfill (v2.0.0): https://github.com/magic-akari/seamless-scroll-polyfill
 *
 * "flickity.js": v2.2.0 (with the "fade" package). Flickity is only loaded on demand if there is a product image
 * carousel on the page. Otherwise it is not loaded.
 *
 * "photoswipe": v4.1.3. PhotoSwipe is only loaded on demand to power the zoom feature on product page. If the zoom
 * feature is disabled, then this script is never loaded.
 */
window.UlikeCommon = window.UlikeCommon || {};

(function (namespace) {
  /**
   * 生成请求唯一标识 requestId
   *
   * 优先使用浏览器原生的 crypto.randomUUID，
   * 不支持时再使用自定义规则生成 GUID。
   *
   * @returns {string} 唯一标识字符串
   */
  function generateGUID() {
    // 优先使用浏览器原生能力，生成更标准的 UUID
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    // 生成 4 位十六进制随机字符串
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    // 按常见 GUID 格式进行拼接
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  /**
   * 通用 Ulike 接口请求方法
   *
   * 说明：
   * 1. 自动补充站点公共参数，如 siteCode、merchantCode、language、requestId
   * 2. 默认将相对路径拼接到 Ulike API 域名上
   * 3. 使用 jQuery.ajax 发起 POST 请求，并统一返回 Promise
   *
   * @param {string} url - 接口地址，支持相对路径或完整 http/https 地址
   * @param {Object} data - 请求参数对象
   * @returns {Promise<any>} - 返回接口请求结果
   */
  function sendUlikeApi(url, data) {
    // 复制一份入参，避免直接修改外部传入的 data 对象
    var payload = Object.assign({}, data || {});

    // 补充接口公共字段
    payload.siteCode = 'JP';
    payload.merchantCode = 'ULIKE';
    payload.language = window.Shopify && window.Shopify.locale ? window.Shopify.locale : 'ja';
    payload.requestId = generateGUID();

    // 如果传入的是相对路径，则自动补全接口域名
    var baseUrl = 'https://api.ulike.com';
    var requestUrl = /^https?:\/\//i.test(url) ? url : baseUrl + url;

    // jQuery.ajax 请求配置
    var settings = {
      url: requestUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(payload),
      xhrFields: {
        // 允许跨域请求时携带 cookie
        withCredentials: true,
      },
    };

    // 统一封装为 Promise，便于外部使用 then/catch 或 async/await
    return new Promise(function (resolve, reject) {
      // 某些页面如果未加载 jQuery，则直接抛出错误
      if (typeof $ === 'undefined' || typeof $.ajax !== 'function') {
        reject(new Error('jQuery.ajax is not available'));
        return;
      }

      $.ajax(settings)
        .done(function (response) {
          // 请求成功，返回接口响应数据
          resolve(response);
        })
        .fail(function (xhr, textStatus, errorThrown) {
          // 请求失败时输出更完整的日志，便于排查问题
          console.error('Error during API call:', {
            url: requestUrl,
            status: xhr && xhr.status,
            statusText: xhr && xhr.statusText,
            textStatus: textStatus,
            error: errorThrown,
            response: xhr && xhr.responseText,
          });

          // 统一返回失败对象
          reject({
            xhr: xhr,
            textStatus: textStatus,
            error: errorThrown,
          });
        });
    });
  }

  /**
   * GTM / GA 事件上报通用方法
   *
   * @param {string} category - 事件名称
   * @param {string} operating - 事件操作字段
   * @param {string} label - 事件标签字段
   */
  function commonGtmEvent(category, operating, label) {
    // 通过 gtag 上报自定义事件
    gtag('event', category, {
      operating: operating,
      label: label,
    });
  }

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  /**
   * 验证邮箱格式是否正确
   *
   * @param {string} email - 待验证的邮箱地址
   * @returns {boolean} true 表示邮箱格式正确，false 表示邮箱格式错误
   */
  function validateEmail(email) {
    // 基础邮箱格式校验规则
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // 返回校验结果
    return emailRegex.test(email);
  }
  function copyCodeFun(text, callBack) {
    if (navigator.clipboard) {
      // 确保运行在安全上下文（如 HTTPS）下才能使用 Clipboard API
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed'; // 使文本框不可见
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('复制成功:', text);
      } catch (err) {
        console.error('复制失败:', err);
      }
      document.body.removeChild(textArea); // 删除临时文本框
    }
    if (callBack) callBack()
  }

  /**
   * 独立加购方法
   * @param {number|string} productId - Shopify variant id
   * @param {HTMLElement|null} button - 当前触发按钮，可为空
   * @param {string} code - 折扣码
   * @param {number} quantity - 购买数量
   * @returns {Promise<Object>}
   */
  function addToCartPromise(
    productId,
    code = '',
    properties,
    quantity = 1
  ) {
    return new Promise((resolve, reject) => {
      var sectionsToBundle = [];

      document.documentElement.dispatchEvent(
        new CustomEvent('cart:bundled-sections', {
          bubbles: true,
          detail: { sections: sectionsToBundle },
        })
      );

      const requestBody = {
        id: productId,
        quantity: quantity,
        properties: properties || {},
        sections: sectionsToBundle,
      };

      const cartAddUrl =
        window.theme?.routes?.cart_add_url ||
        ((window.Shopify?.routes?.root || '/') + 'cart/add.js');

      const cartUrl =
        window.theme?.routes?.cart_url ||
        ((window.Shopify?.routes?.root || '/') + 'cart.js');

      fetch(cartAddUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then((response) => response.json())
        .then(async (parsedState) => {
          if (parsedState.status) {
            const errorData = {
              source: 'custom-add-to-cart',
              productVariantId: String(productId),
              errors: parsedState.errors || parsedState.description,
              message: parsedState.message,
            };

            if (
              window.theme?.pubsub &&
              window.theme?.pubsub?.PUB_SUB_EVENTS?.cartError
            ) {
              window.theme.pubsub.publish(
                window.theme.pubsub.PUB_SUB_EVENTS.cartError,
                errorData
              );
            }

            throw parsedState;
          }
          // 打开购物车抽屉。cart-drawer 使用 open 属性控制状态，并没有 show() 方法。
          const cartDrawer = document.querySelector('cart-drawer');
          if (cartDrawer && 'open' in cartDrawer) {
            cartDrawer.open = true;
          }

          const cartResponse = await fetch(
            cartUrl,
            window.theme?.utils?.fetchConfig
              ? { ...window.theme.utils.fetchConfig() }
              : {
                headers: {
                  Accept: 'application/json',
                },
              }
          );

          const cartData = await cartResponse.json();
          cartData.sections = parsedState.sections || {};

          if (
            window.theme?.pubsub &&
            window.theme?.pubsub?.PUB_SUB_EVENTS?.cartUpdate
          ) {
            window.theme.pubsub.publish(
              window.theme.pubsub.PUB_SUB_EVENTS.cartUpdate,
              { cart: cartData }
            );
          } else if (cartData.sections && Object.keys(cartData.sections).length) {
            document.documentElement.dispatchEvent(
              new CustomEvent('cart:refresh', {
                bubbles: true,
                detail: {
                  cart: cartData,
                  openMiniCart:
                    window.themeVariables?.settings?.cartType === 'drawer',
                },
              })
            );
          }

          if (code && typeof window.autoDiscountCode === 'function') {
            window.autoDiscountCode(code);
          }

          if (!parsedState.sections) {
            console.warn('cart/add response does not contain sections data');
          }
          resolve(cartData);
        })
        .catch((error) => {
          console.error('Error adding product to cart or getting cart contents:', error);
          reject(error);
        })
        .finally(() => {
          // no loading state handling here
        });
    });
  };


  namespace.generateGUID = generateGUID;
  namespace.sendUlikeApi = sendUlikeApi;
  namespace.commonGtmEvent = commonGtmEvent;
  namespace.isMobile = isMobile;
  namespace.validateEmail = validateEmail;
  namespace.copyCodeFun = copyCodeFun;
  namespace.addToCartPromise = addToCartPromise;

})(window.UlikeCommon);




class VideoCard extends HTMLElement {
  connectedCallback() {
    const button = this.querySelector('.brand-link');
    const video = this.querySelector('.deferred-poster');
    if (button) {

      button.addEventListener('click', (event) => {
        event.preventDefault();
        video.click();
      });
    }
  }
}

window.customElements.define('video-card', VideoCard);


class TextCollapse extends HTMLElement {
  constructor() {
    super();
    this.isExpanded = false;
    this.maxLength = parseInt(this.getAttribute('max-length')) || 50;
  }

  connectedCallback() {
    const textEl = this.querySelector('.doctor-des');
    const svgEl = this.querySelector('.doctor-svg');

    if (!textEl || !svgEl) return;

    this.fullText = textEl.textContent.trim();
    this.textEl = textEl;
    this.svgEl = svgEl;

    this.svgEl.style.cursor = 'pointer';
    this.svgEl.addEventListener('click', () => this.toggleText());

    this.render();
  }

  render() {
    if (this.isExpanded || this.fullText.length <= this.maxLength) {
      this.textEl.textContent = this.fullText;
    } else {
      this.textEl.textContent = this.fullText.slice(0, this.maxLength) + '...';
    }
  }

  toggleText() {
    this.isExpanded = !this.isExpanded;
    this.render();
  }
}

window.customElements.define('text-collapse', TextCollapse);



class TextCollapseNew extends HTMLElement {
  constructor() {
    super();
    this.isExpanded = false;
  }

  connectedCallback() {
    this.desEl = this.querySelector('.doctor-des');
    this.des1El = this.querySelector('.doctor-des1');
    this.svgEl = this.querySelector('.doctor-svg');

    if (!this.desEl || !this.des1El || !this.svgEl) return;

    this.svgEl.style.cursor = 'pointer';
    this.svgEl.addEventListener('click', () => this.toggle());

    this.render();
  }

  render() {
    if (this.isExpanded) {
      this.desEl.style.display = 'none';
      this.des1El.style.display = '';
    } else {
      this.desEl.style.display = '';
      this.des1El.style.display = 'none';
    }
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
    this.render();
  }
}

window.customElements.define('text-collapse-new', TextCollapseNew);



class CustomSwiperNew extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.initSwiper();
  }

  initSwiper() {
    const swiperContainer = this.querySelector('.swiper-container');
    if (!swiperContainer) {
      console.error('Swiper container not found');
      return;
    }

    //是否禁用 Swiper**
    const disableOn = this.getAttribute('disable-on'); // 'mobile' 或 'desktop'
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if ((disableOn === 'mobile' && isMobile) || (disableOn === 'desktop' && !isMobile)) {
      console.log(`Swiper disabled on ${disableOn}`);
      return;
    }

    const slidesPerView = parseFloat(this.getAttribute('slides-per-view')) || 1.3;
    const spaceBetween = parseFloat(this.getAttribute('space-between')) || 10;
    const autoplayEnabled = this.getAttribute('autoplay') === 'true';
    const autoplayDelay = parseInt(this.getAttribute('autoplay-delay')) || 3000;

    const loop = this.getAttribute('loop') !== 'false';
    const centeredSlides = this.getAttribute('centered-slides') !== 'false';
    const paginationEnabled = this.getAttribute('pagination') === 'true';
    const navigationEnabled = this.getAttribute('navigation') === 'true';
    let breakpoints = {};
    try {
      breakpoints = JSON.parse(this.getAttribute('breakpoints') || '{}');
    } catch (error) {
      console.error('Invalid breakpoints format. Expected JSON.');
    }

    // **动态控制 navigation 和 pagination**
    const prevButton = navigationEnabled ? this.querySelector('.swiper-prev') : null;
    const nextButton = navigationEnabled ? this.querySelector('.swiper-next') : null;
    const paginationEl = paginationEnabled ? { el: this.querySelector('.swiper-pagination'), clickable: true } : false;

    this.swiper = new Swiper(swiperContainer, {
      slidesPerView,
      spaceBetween,
      loop,
      centeredSlides,
      navigation: navigationEnabled ? { prevEl: prevButton, nextEl: nextButton } : false,
      pagination: paginationEl,
      breakpoints,
      autoplay: autoplayEnabled
        ? {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }
        : false
    });
  }
}

window.customElements.define('custom-swiper', CustomSwiperNew);


//点击弹出弹框文字组件
class textModal extends HTMLElement {
      constructor() {
        super();
        this.textct = this.getAttribute('text-content') || 'jp';
        this.modal = null;
        this.setupEventListeners();
      }

      // 设置点击事件监听
      setupEventListeners() {
        this.addEventListener('click', () => this.createModal());
      }

      // 动态创建模态框
      createModal() {
        if (this.modal) return;

        this.modal = document.createElement('div');
        this.modal.id = 'cusvideoModal';
        this.modal.className = 'cusmodal';

        const modalContent = document.createElement('div');
        modalContent.className = 'cusmodal-content';

        const closeButton = document.createElement('button');
        closeButton.id = 'cuscloseModal';
        closeButton.className = 'cusclose-btn';
        closeButton.innerHTML = `
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        `;
        const textMd = document.createElement('div');
        textMd.className = 'cusmodal-txt';
        textMd.innerHTML = `${this.textct}`;

        modalContent.appendChild(closeButton);
        modalContent.appendChild(textMd);
        this.modal.appendChild(modalContent);
        document.body.appendChild(this.modal);

        // 触发滑入动画
        requestAnimationFrame(() => {
          this.modal.classList.add('cusshow');
        });

        // 绑定关闭事件
        closeButton.addEventListener('click', () => {
          this.modal.classList.remove('cusshow');
          setTimeout(() => {
            this.modal.remove();
            this.modal = null;
          }, 300); 
        });

        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) {
            this.modal.classList.remove('cusshow');
            setTimeout(() => {
              this.modal.remove(); 
              this.modal = null; 
            }, 300); 
          }
        });
      }
    }
    window.customElements.define('text-modal', textModal);


    class CountdownTimer1 extends HTMLElement {
  constructor() {
    super();
    this.label = 'End in';
    this.end = new Date();
    this.timer = null;
  }

  connectedCallback() {
    this.classList.add('countdown-ulike');
    const labelAttr = this.getAttribute('label');
    if (labelAttr) {
      this.label = labelAttr;
    }
    const endTimeStr = this.getAttribute('end-time');
    if (!endTimeStr) {
      console.error('CountdownTimer: "end-time" attribute is required.');
      return;
    }
    this.end = new Date(endTimeStr);
    this.init();
  }

  disconnectedCallback() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  init() {
    const s = (cls, txt = '') => Object.assign(document.createElement('span'), { className: cls, textContent: txt });
    const d = (cls) => Object.assign(document.createElement('div'), { className: `countdown-box ${cls}` });

    this.labelEl = s('countdown-label', this.label);
    this.days = d('days-box'); this.daysSep = s('countdown-separator', ':');
    this.hours = d('hours-box'); this.mSep = s('countdown-separator', ':');
    this.mins = d('minutes-box'); this.sSep = s('countdown-separator', ':');
    this.secs = d('seconds-box');

    this.append(this.labelEl, this.days, this.daysSep, this.hours, this.mSep, this.mins, this.sSep, this.secs);
    this.update();
    this.timer = setInterval(() => this.update(), 1000);
  }

  f(n) { return String(n).padStart(2, '0'); }

  update() {
    const t = this.end - new Date();
    if (t <= 0) {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      return this.render(0, 0, 0, 0);
    }
    const d = Math.floor(t / 864e5),
      h = Math.floor(t / 36e5 % 24),
      m = Math.floor(t / 6e4 % 60),
      s = Math.floor(t / 1e3 % 60);
    // this.days.style.display = this.daysSep.style.display = d ? '' : 'none';
    this.render(d, h, m, s);
  }

  render(d, h, m, s) {
    this.days.textContent = this.f(d);
    this.hours.textContent = this.f(h);
    this.mins.textContent = this.f(m);
    this.secs.textContent = this.f(s);
  }
}

window.customElements.define('countdown-timer1', CountdownTimer1);



class CopyButton extends HTMLElement {
  static get observedAttributes() {
    return ['text', 'target', 'data-text'];
  }

  constructor() {
    super();
    this._textToCopy = '';
    this._timeout = null;
  }

  connectedCallback() {
    // 确保有点击事件
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    this.addEventListener('click', this._handleClick);
    this.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._handleClick();
      }
    });

    this._resolveText();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
    if (this._timeout) clearTimeout(this._timeout);
  }

  attributeChangedCallback() {
    this._resolveText();
  }

  // 优先级：text 属性 > data-text 属性 > target 指向的元素内容
  _resolveText() {
    if (this.hasAttribute('text')) {
      this._textToCopy = this.getAttribute('text');
    } else if (this.hasAttribute('data-text')) {
      this._textToCopy = this.getAttribute('data-text');
    } else if (this.hasAttribute('target')) {
      const targetEl = document.getElementById(this.getAttribute('target'));
      this._textToCopy = targetEl ? (targetEl.textContent || targetEl.value || '') : '';
    } else {
      this._textToCopy = this.textContent.trim();
    }
  }

  async _handleClick() {
    try {
      await navigator.clipboard.writeText(this._textToCopy);
      this._showFeedback('複製成功しました'); 
    } catch (err) {
      console.error('复制失败', err);
      this._showFeedback('Failed', '#dc3545');
    }
  }

  _showFeedback(message, bg = '#28a745') {
    const originalText = this.textContent;
    const originalBg = this.style.background || '';

    // 临时改成成功样式
    this.textContent = message;
    // this.style.background = bg;
    this.classList.add('copied');

    if (this._timeout) clearTimeout(this._timeout);

    this._timeout = setTimeout(() => {
      this.textContent = originalText;
      this.style.background = originalBg;
      this.classList.remove('copied');
    }, 2000);
  }
}

window.customElements.define('copy-button', CopyButton);




class Detail extends HTMLElement {
  constructor() {
    super();
    this._content = null;
    this._trigger = null;
    this._duration = 500;
  }

  connectedCallback() {
    this._trigger = this.querySelector('.instruction-list-top');
    this._content = this.querySelector('.instruction-list-content');

    if (!this._content || !this._trigger) return;

    this._content.style.overflow = 'hidden';
    this._content.style.transition = `height ${this._duration}ms ease`;

    this._content.style.height = '0';
    this._content.style.display = 'none';

    this._trigger.addEventListener('click', () => this.toggle());
  }

  slideUp() {
    const el = this._content;
    el.style.height = el.offsetHeight + 'px';
    this._trigger.classList.remove('active');
    requestAnimationFrame(() => {
      el.style.height = '0';
    });
    setTimeout(() => {
      el.style.display = 'none';
      // this._trigger.classList.remove('active');
    }, this._duration);
  }

  slideDown() {
    const el = this._content;
    el.style.removeProperty('display');
    const height = el.scrollHeight + 'px';
    el.style.height = '0';
     this._trigger.classList.add('active');
    requestAnimationFrame(() => {
      el.style.height = height;
    });
    setTimeout(() => {
      el.style.height = 'auto';
      // this._trigger.classList.add('active');
    }, this._duration);
  }

  closeOthers() {
    document.querySelectorAll('custom-detail').forEach(detail => {
      if (detail !== this && detail._content && window.getComputedStyle(detail._content).display !== 'none') {
        detail.slideUp();
        detail._trigger.classList.remove('active');
      }
    });
  }

  toggle() {
    const el = this._content;
    if (window.getComputedStyle(el).display === 'none') {
      this.closeOthers();
      this.slideDown();
    } else {
      this.slideUp();
    }
  }
}

customElements.define('custom-detail', Detail);


/**
 * Shopify Buy Now Web Component (Light DOM Version, No Shadow Root)
 * 
 * 使用方法：
 * 1. 在 HTML 中添加 <shopify-buy-now product-id="123456" variant-id="789012">自定义按钮 HTML</shopify-buy-now>
 *    - 如果提供内容（如 <button>现在购买</button>），组件会添加 click 事件到子按钮。
 *    - 如果不提供内容，会创建默认按钮。
 * 2. product-id 和 variant-id 是必需的。
 * 3. button-text 属性仅用于 fallback 按钮文本。
 * 4. 依赖 Shopify 的 AJAX Cart API。
 * 
 * 样式建议：使用外部 CSS 针对 .shopify-buy-now button { ... } 来自定义外观。
 * 注意：Light DOM 中样式不隔离，请在主题 CSS 中定义类。
 */

class ShopifyBuyNow extends HTMLElement {
  constructor() {
    super();
    this._defaultButtonCreated = false;
  }

  connectedCallback() {
    this.render();
    // 监听组件的 click 事件
    this.addEventListener('click', this.handleBuyNow.bind(this));
  }

  static get observedAttributes() {
    return ['product-id', 'variant-id', 'button-text'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this[name] = newValue;
      if (!this._defaultButtonCreated) {
        this.render();
      }
    }
  }

  get productId() {
    return this.getAttribute('product-id');
  }

  get variantId() {
    return this.getAttribute('variant-id');
  }

  get buttonText() {
    return this.getAttribute('button-text') || '今すぐ購入';
  }

  render() {
    // 检查是否有子内容（自定义按钮）
    const hasCustomContent = this.children.length > 0;

    if (!hasCustomContent && !this._defaultButtonCreated) {
      // 创建默认按钮
      const button = document.createElement('button');
      button.className = 'buy-now-btn';
      button.textContent = this.buttonText;
      this.appendChild(button);
      this._defaultButtonCreated = true;
    }

    // 添加类到宿主元素，用于外部 CSS 针对性
    this.classList.add('shopify-buy-now');
  }

  async handleBuyNow(event) {
    // 确保只处理按钮点击（忽略其他子元素）
    const button = event.target.closest('button');
    if (!button || !this.contains(button)) return;

    // 禁用按钮
    button.disabled = true;
    const originalText = button.textContent;
    // button.textContent = originalText.includes('今すぐ購入') || originalText.includes('立即购买') ? '添加中...' : originalText.replace(/今すぐ購入|今すぐ購入/, '添加中...');

    if (!this.variantId) {
      console.error('Variant ID is required');
      this.resetButton(button, originalText);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id', this.variantId);
      formData.append('quantity', 1);

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      window.location.href = '/checkout';
    } catch (error) {
      console.error('Buy Now error:', error);
      this.resetButton(button, '立即购买失败');
    }
  }

  resetButton(button, text) {
    if (button) {
      button.disabled = false;
      button.textContent = text || this.buttonText;
    }
  }
}

// 注册自定义元素
window.customElements.define('shopify-buy-now', ShopifyBuyNow);
