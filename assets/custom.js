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
          // 打开购物车抽屉
          document.querySelector('cart-drawer')?.show();

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
  namespace.validateEmail = validateEmail;
  namespace.copyCodeFun = copyCodeFun;
  namespace.addToCartPromise = addToCartPromise;

})(window.UlikeCommon);

