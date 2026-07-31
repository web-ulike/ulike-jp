/**
 * 产品媒体轮播组件
 * - 主图轮播
 * - 缩略图轮播
 * - 上一张 / 下一张按钮
 * - 切换媒体时暂停视频或外部媒体播放
 *
 * 依赖：Swiper 需要在本文件执行前全局加载完成。
 */
(function () {
  'use strict';

  /**
   * 暂停产品媒体组件内的所有媒体播放。
   * 避免用户切换 slide 后，视频或音频仍然继续播放。
   *
   * @param {HTMLElement} root - 产品媒体组件根节点。
   */
  function pauseAllMedia(root) {
    if (!root) return;

    root.querySelectorAll('video').forEach(function (video) {
      try {
        video.pause();
      } catch (error) {
        // 忽略浏览器限制或媒体节点被移除导致的暂停异常。
      }
    });

    root.querySelectorAll('iframe').forEach(function (iframe) {
      if (!iframe.src) return;

      // 重置 iframe src，用于停止 YouTube / Vimeo 等外部视频播放。
      iframe.src = iframe.src;
    });
  }

  /**
   * 初始化单个产品媒体组件。
   *
   * @param {HTMLElement} root - 产品媒体组件根节点。
   */
  function initProductMedia(root) {
    if (!root || root.dataset.initialized === 'true') return;

    var mainEl = root.querySelector('[data-product-media-main]');
    var thumbsEl = root.querySelector('[data-product-media-thumbs]');
    var prevEl = root.querySelector('[data-product-media-prev]');
    var nextEl = root.querySelector('[data-product-media-next]');
    var paginationEl = root.querySelector('[data-product-media-pagination]');

    if (!mainEl || typeof window.Swiper === 'undefined') return;

    var slideCount = mainEl.querySelectorAll('.swiper-slide').length;

    // 只有一个媒体时不需要初始化 Swiper。
    if (slideCount <= 1) {
      root.dataset.initialized = 'true';
      return;
    }

    var thumbsSwiper = null;

    // 缩略图轮播：PC 端纵向排列，移动端横向排列。
    if (thumbsEl) {
      thumbsSwiper = new window.Swiper(thumbsEl, {
        direction: 'vertical',
        slidesPerView: 'auto',
        spaceBetween: 12,
        watchSlidesProgress: true,
        freeMode: true,
        mousewheel: true,
        breakpoints: {
          0: {
            direction: 'horizontal',
            spaceBetween: 8,
            mousewheel: false
          },
          768: {
            direction: 'vertical',
            spaceBetween: 12,
            mousewheel: true
          }
        }
      });
    }

    // 主图轮播。
    new window.Swiper(mainEl, {
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 450,
      autoHeight: false,
      watchOverflow: true,
      navigation: {
        prevEl: prevEl,
        nextEl: nextEl
      },
      pagination: paginationEl
        ? {
            el: paginationEl,
            clickable: true
          }
        : undefined,
      thumbs: thumbsSwiper
        ? {
            swiper: thumbsSwiper
          }
        : undefined,
      on: {
        slideChange: function () {
          pauseAllMedia(root);
        }
      }
    });

    root.dataset.initialized = 'true';
  }

  var photoSwipeConstructorPromise = null;

  /**
   * 加载 PhotoSwipe 构造器。
   *
   * @returns {Promise<Function|null>}
   */
  function loadPhotoSwipeConstructor() {
    if (typeof window.PhotoSwipe === 'function') {
      return Promise.resolve(window.PhotoSwipe);
    }

    if (photoSwipeConstructorPromise) return photoSwipeConstructorPromise;

    var moduleUrl =
      window.theme && window.theme.settings && window.theme.settings.pswpModule
        ? window.theme.settings.pswpModule
        : '';
    var photoSwipeScript = document.querySelector('script[src*="photoswipe.min.js"]');

    if (!moduleUrl && photoSwipeScript && photoSwipeScript.src) {
      moduleUrl = photoSwipeScript.src;
    }

    if (!moduleUrl) return Promise.resolve(null);

    photoSwipeConstructorPromise = import(moduleUrl)
      .then(function (module) {
        return module.default || module.PhotoSwipe || window.PhotoSwipe || null;
      })
      .catch(function (error) {
        console.warn('PhotoSwipe failed to load, using fallback zoom.', error);
        return null;
      });

    return photoSwipeConstructorPromise;
  }

  /**
   * 收集当前产品媒体中的图片数据。
   *
   * @param {HTMLElement} root - 产品媒体组件根节点。
   * @returns {Object[]}
   */
  function getZoomItems(root) {
    return Array.from(root.querySelectorAll('[data-product-media-zoom]')).map(function (item) {
      var image = item.querySelector('img');
      var width = parseInt(item.dataset.zoomWidth, 10) || (image ? image.naturalWidth : 1200) || 1200;
      var height = parseInt(item.dataset.zoomHeight, 10) || (image ? image.naturalHeight : 1200) || 1200;

      return {
        element: item,
        thumbnailElement: image,
        src: item.dataset.zoomSrc || (image ? image.currentSrc || image.src : ''),
        srcset: image ? image.srcset : '',
        msrc: image ? image.currentSrc || image.src : '',
        width: width,
        height: height,
        w: width,
        h: height,
        alt: image ? image.alt || '' : '',
        thumbCropped: true
      };
    });
  }

  /**
   * 打开 PhotoSwipe 图片放大。
   *
   * @param {HTMLElement} root - 产品媒体组件根节点。
   * @param {HTMLElement} targetItem - 当前点击图片。
   */
  function openFallbackZoom(items, index) {
    var currentIndex = index;

    var overlay = document.createElement('div');
    overlay.className = 'jp-product-media-zoom';
    overlay.innerHTML =
      '<div class="jp-product-media-zoom__counter" data-zoom-counter></div>' +
      '<button type="button" class="jp-product-media-zoom__close" aria-label="Close image zoom">×</button>' +
      '<button type="button" class="jp-product-media-zoom__arrow jp-product-media-zoom__arrow--prev" data-zoom-prev aria-label="Previous image">' +
        '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M17.5 7.5L10 15L17.5 22.5"></path></svg>' +
      '</button>' +
      '<div class="jp-product-media-zoom__stage">' +
        '<img class="jp-product-media-zoom__image" data-zoom-image alt="">' +
      '</div>' +
      '<button type="button" class="jp-product-media-zoom__arrow jp-product-media-zoom__arrow--next" data-zoom-next aria-label="Next image">' +
        '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M12.5 7.5L20 15L12.5 22.5"></path></svg>' +
      '</button>';

    var image = overlay.querySelector('[data-zoom-image]');
    var counter = overlay.querySelector('[data-zoom-counter]');
    var prevButton = overlay.querySelector('[data-zoom-prev]');
    var nextButton = overlay.querySelector('[data-zoom-next]');

    function renderImage() {
      var item = items[currentIndex];
      if (!item || !item.src) return;

      image.src = item.src;
      image.alt = item.alt || '';
      if (item.srcset) image.srcset = item.srcset;
      counter.textContent = currentIndex + 1 + ' / ' + items.length;
      prevButton.hidden = items.length <= 1;
      nextButton.hidden = items.length <= 1;
    }

    function showPrevious() {
      currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      renderImage();
    }

    function showNext() {
      currentIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
      renderImage();
    }

    function closeZoom() {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') closeZoom();
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    }

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay || event.target.closest('.jp-product-media-zoom__close')) {
        closeZoom();
      }
    });
    prevButton.addEventListener('click', showPrevious);
    nextButton.addEventListener('click', showNext);
    document.addEventListener('keydown', onKeydown);
    document.body.appendChild(overlay);
    renderImage();
  }

  function openPhotoSwipe(root, targetItem) {
    var items = getZoomItems(root).filter(function (item) {
      return item.src;
    });
    var index = items.findIndex(function (item) {
      return item.element === targetItem;
    });

    if (!items.length || index < 0) return;

    if (typeof window.PhotoSwipe !== 'function') {
      openFallbackZoom(items, index);
      return;
    }

    loadPhotoSwipeConstructor().then(function (PhotoSwipeConstructor) {
      if (!PhotoSwipeConstructor) {
        openFallbackZoom(items, index);
        return;
      }

      var pswp = new PhotoSwipeConstructor({
        dataSource: items,
        index: index,
        bgOpacity: 0.86,
        showHideAnimationType: 'zoom',
        arrowPrevSVG: '<svg class="pswp__icn icon" stroke="currentColor" fill="none" viewBox="0 0 30 30"><path d="M17.5 7.5L10 15L17.5 22.5"/></svg>',
        arrowNextSVG: '<svg class="pswp__icn icon" stroke="currentColor" fill="none" viewBox="0 0 30 30"><path d="M11.5 7.5L19 15L11.5 22.5"/></svg>',
        closeSVG: '<svg class="pswp__icn icon" stroke="currentColor" fill="none" viewBox="0 0 30 30"><path d="m7.5 22.5 15-15m-15 0 15 15"/></svg>'
      });
      pswp.init();
    });
  }

  /**
   * 初始化图片点击放大。
   *
   * @param {HTMLElement} root - 产品媒体组件根节点。
   */
  function initProductMediaZoom(root) {
    if (!root || root.dataset.zoomInitialized === 'true') return;

    root.querySelectorAll('[data-product-media-zoom]').forEach(function (item) {
      item.addEventListener('click', function () {
        openPhotoSwipe(root, item);
      });

      item.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPhotoSwipe(root, item);
        }
      });
    });

    root.dataset.zoomInitialized = 'true';
  }

  /**
   * 初始化页面中所有产品媒体组件。
   */
  function initAllProductMedia() {
    document.querySelectorAll('[data-product-media]').forEach(function (root) {
      initProductMedia(root);
      initProductMediaZoom(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllProductMedia);
  } else {
    initAllProductMedia();
  }

  // Shopify 主题编辑器中 section 重新加载后，需要重新初始化组件。
  document.addEventListener('shopify:section:load', function (event) {
    if (!event || !event.target) return;

    event.target.querySelectorAll('[data-product-media]').forEach(function (root) {
      root.dataset.initialized = 'false';
      root.dataset.zoomInitialized = 'false';
      initProductMedia(root);
      initProductMediaZoom(root);
    });
  });
})();

/**
 * 产品信息组件
 * - 变体切换
 * - 数量加减
 * - 优惠码复制
 * - 加购按钮 loading
 * - Buy now 直接跳转 checkout
 *
 * 说明：
 * 目前和 product-media-new.js 放在同一个文件里，方便产品主模块统一加载。
 */
(function () {
  'use strict';

  /**
   * 格式化 Shopify 金额。
   * 优先使用主题已有的 Shopify.formatMoney。
   *
   * @param {number} cents - Shopify 价格，单位为分。
   * @returns {string}
   */
  function formatMoney(cents) {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(cents);
    }

    return '¥' + Math.round(cents / 100).toLocaleString();
  }

  /**
   * 获取当前已选中的 options。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   * @returns {string[]}
   */
  function getSelectedOptions(root) {
    var options = [];

    root.querySelectorAll('[data-option-position]').forEach(function (field) {
      var position = Number(field.dataset.optionPosition) - 1;

      if (field.tagName === 'SELECT') {
        options[position] = field.value;
        return;
      }

      if (field.matches('input[type="radio"]') && field.checked) {
        options[position] = field.value;
      }
    });

    return options;
  }

  /**
   * 根据 options 匹配对应变体。
   *
   * @param {Object[]} variants - 产品所有变体。
   * @param {string[]} selectedOptions - 当前选中的 options。
   * @returns {Object|null}
   */
  function findMatchedVariant(variants, selectedOptions) {
    return (
      variants.find(function (variant) {
        return selectedOptions.every(function (optionValue, index) {
          return variant.options[index] === optionValue;
        });
      }) || null
    );
  }

  /**
   * 更新 URL 中的 variant 参数。
   *
   * @param {Object} variant - 当前变体。
   */
  function updateVariantUrl(variant) {
    if (!variant || !window.history || !window.history.replaceState) return;

    var url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * 根据下一条记录的 position，为每个变体补充媒体结束索引。
   *
   * @param {Object[]} items - 变体媒体位置数组。
   * @param {number} mediaCount - 商品媒体总数。
   * @returns {Object[]}
   */
  function addMaxProperty(items, mediaCount) {
    return items.map(function (item, index) {
      var nextItem = items.slice(index + 1).find(function (candidate) {
        return Number(candidate.position) > Number(item.position);
      });
      return Object.assign({}, item, {
        max: nextItem ? Number(nextItem.position) - 1 : mediaCount
      });
    });
  }

  /**
   * 将当前变体对应的商品图片同步到左侧媒体轮播。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   * @param {Object|null} variant - 当前变体。
   * @param {Object[]} variantArr - 带 position/max 的变体媒体映射。
   * @param {Object[]} productMediaArr - 商品媒体对象数组。
   */
  function updateProductMedia(root, variant, variantArr, productMediaArr) {
    var mediaRoot = document.querySelector('[data-product-media]');
    if (!mediaRoot) return;

    var mediaSlides = Array.from(mediaRoot.querySelectorAll('[data-product-media-main] [data-media-index]'));
    var mediaThumbs = Array.from(mediaRoot.querySelectorAll('[data-product-media-thumbs] [data-media-index]'));
    var currentVariantMedia = variant
      ? variantArr.find(function (item) {
          return String(item.vid) === String(variant.id);
        })
      : null;

    if (currentVariantMedia && Number(currentVariantMedia.position) > 0 && mediaSlides.length) {
      var mediaStart = Math.max(Number(currentVariantMedia.position) - 1, 0);
      var mediaEnd = Math.min(Number(currentVariantMedia.max), productMediaArr.length);
      var visibleSlides = [];
      var hiddenSlides = [];
      var visibleThumbs = [];
      var hiddenThumbs = [];

      mediaSlides.forEach(function (media) {
        var index = Number(media.dataset.mediaIndex);
        var isVisible = index >= mediaStart && index < mediaEnd;
        media.classList.toggle('is-variant-hidden', !isVisible);
        (isVisible ? visibleSlides : hiddenSlides).push(media);
      });

      mediaThumbs.forEach(function (media) {
        var index = Number(media.dataset.mediaIndex);
        var isVisible = index >= mediaStart && index < mediaEnd;
        media.classList.toggle('is-variant-hidden', !isVisible);
        (isVisible ? visibleThumbs : hiddenThumbs).push(media);
      });

      var mainWrapper = mediaSlides[0] ? mediaSlides[0].parentElement : null;
      var thumbsWrapper = mediaThumbs[0] ? mediaThumbs[0].parentElement : null;

      if (mainWrapper) {
        visibleSlides.concat(hiddenSlides).forEach(function (slide) {
          mainWrapper.appendChild(slide);
        });
      }
      if (thumbsWrapper) {
        visibleThumbs.concat(hiddenThumbs).forEach(function (thumb) {
          thumbsWrapper.appendChild(thumb);
        });
      }

      var firstVisibleThumb = visibleThumbs[0];

      if (firstVisibleThumb) {
        var mainElement = mediaRoot.querySelector('[data-product-media-main]');
        var thumbsElement = mediaRoot.querySelector('[data-product-media-thumbs]');
        var mainSwiper = mainElement ? mainElement.swiper : null;
        var thumbsSwiper = thumbsElement ? thumbsElement.swiper : null;

        if (mainSwiper) {
          mainSwiper.update();
          mainSwiper.slideTo(0, 0);
        }
        if (thumbsSwiper) {
          thumbsSwiper.update();
          thumbsSwiper.slideTo(0, 0);
        }
        if (!mainSwiper) firstVisibleThumb.click();
        return;
      }
    }

    var selectedField = root.querySelector('[data-option-position]:checked');
    var mediaId = selectedField ? selectedField.dataset.variantMediaId || '' : '';

    if (!mediaId && variant && variant.featured_media && variant.featured_media.id) {
      mediaId = String(variant.featured_media.id);
    }

    if (!mediaId && variant && variant.featured_media_id) {
      mediaId = String(variant.featured_media_id);
    }

    if (!mediaId) return;

    var mediaButton = Array.from(mediaRoot.querySelectorAll('[data-product-media-thumbs] [data-media-id]')).find(function (button) {
      return String(button.dataset.mediaId) === mediaId;
    });

    if (mediaButton) mediaButton.click();
  }

  /**
   * 更新价格、隐藏 variant input 和按钮状态。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   * @param {Object|null} variant - 当前变体。
   */
  function updateVariantState(root, variant, variantArr, productMediaArr) {
    var variantInput = root.querySelector('[data-product-variant-id]');
    var priceMoneyEl = root.querySelector('[data-product-price-money]');
    var comparePriceEl = root.querySelector('[data-product-compare-price]');
    var comparePriceMoneyEl = root.querySelector('[data-product-compare-price-money]');
    var comparePriceItemEl = comparePriceEl ? comparePriceEl.closest('.jp-product-info__price-item') : null;
    var addTextEl = root.querySelector('[data-add-to-cart-text]');
    var buttons = root.querySelectorAll('.jp-product-buttons__btn');

    if (!variant) {
      buttons.forEach(function (button) {
        button.disabled = true;
      });

      if (addTextEl) addTextEl.textContent = '売り切れ';
      return;
    }

    if (variantInput) variantInput.value = variant.id;
    if (priceMoneyEl && priceMoneyEl.dataset.staticPrice !== 'true') {
      priceMoneyEl.textContent = formatMoney(variant.price);
    }

    if (comparePriceEl && (!comparePriceMoneyEl || comparePriceMoneyEl.dataset.staticPrice !== 'true')) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        if (comparePriceMoneyEl) comparePriceMoneyEl.textContent = formatMoney(variant.compare_at_price);
        comparePriceEl.hidden = false;
        if (comparePriceItemEl) comparePriceItemEl.hidden = false;
      } else {
        comparePriceEl.hidden = true;
        if (comparePriceItemEl) comparePriceItemEl.hidden = true;
      }
    }

    buttons.forEach(function (button) {
      button.disabled = !variant.available;
    });

    if (addTextEl) {
      addTextEl.textContent = variant.available ? addTextEl.dataset.defaultText || 'カートに追加する' : '売り切れ';
    }

    updateProductMedia(root, variant, variantArr, productMediaArr);
    updateVariantUrl(variant);
  }

  /**
   * 初始化变体切换。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   */
  function initVariantPicker(root) {
    var variantsJsonEl = root.querySelector('[data-product-variants-json]');
    var variantMediaMapJsonEl = root.querySelector('[data-product-variant-media-map-json]');
    var productMediaJsonEl = root.querySelector('[data-product-media-json]');
    if (!variantsJsonEl || !variantMediaMapJsonEl || !productMediaJsonEl) return;

    var variants = [];
    var variantArr = [];
    var productMediaArr = [];

    try {
      variants = JSON.parse(variantsJsonEl.textContent || '[]');
      variantArr = JSON.parse(variantMediaMapJsonEl.textContent || '[]').filter(function (item) {
        return Number(item.position) > 0;
      });
      productMediaArr = JSON.parse(productMediaJsonEl.textContent || '[]');
      variantArr.sort(function (a, b) {
        return Number(a.position) - Number(b.position);
      });
      variantArr = addMaxProperty(variantArr, productMediaArr.length);
    } catch (error) {
      return;
    }

    root.querySelectorAll('[data-add-to-cart-text]').forEach(function (textEl) {
      textEl.dataset.defaultText = textEl.textContent.trim();
    });

    root.querySelectorAll('[data-option-position]').forEach(function (field) {
      field.addEventListener('change', function () {
        var selectedOptions = getSelectedOptions(root);
        var variant = findMatchedVariant(variants, selectedOptions);

        root.querySelectorAll('[data-option-selected-value]').forEach(function (selectedValueEl) {
          var position = Number(selectedValueEl.dataset.optionSelectedValue) - 1;
          if (selectedOptions[position]) selectedValueEl.textContent = selectedOptions[position];
        });

        updateVariantState(root, variant, variantArr, productMediaArr);
      });
    });

    var initialVariant = findMatchedVariant(variants, getSelectedOptions(root));
    updateProductMedia(root, initialVariant, variantArr, productMediaArr);
  }

  /**
   * 初始化数量加减。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   */
  function initQuantity(root) {
    var quantityInput = root.querySelector('[data-quantity-input]');
    var minusButton = root.querySelector('[data-quantity-minus]');
    var plusButton = root.querySelector('[data-quantity-plus]');

    if (!quantityInput) return;

    function normalizeQuantity(value) {
      var quantity = parseInt(value, 10);
      return Number.isNaN(quantity) || quantity < 1 ? 1 : quantity;
    }

    if (minusButton) {
      minusButton.addEventListener('click', function () {
        quantityInput.value = Math.max(1, normalizeQuantity(quantityInput.value) - 1);
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    if (plusButton) {
      plusButton.addEventListener('click', function () {
        quantityInput.value = normalizeQuantity(quantityInput.value) + 1;
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    quantityInput.addEventListener('change', function () {
      quantityInput.value = normalizeQuantity(quantityInput.value);
    });
  }

  /**
   * 复制优惠码。
   *
   * @param {string} code - 优惠码。
   * @returns {Promise<void>}
   */
  function copyCode(code) {
    function fallbackCopy() {
      return new Promise(function (resolve, reject) {
        var input = document.createElement('textarea');
        input.value = code;
        input.setAttribute('readonly', 'readonly');
        input.style.position = 'fixed';
        input.style.top = '0';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.focus();
        input.select();

        try {
          document.execCommand('copy');
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          document.body.removeChild(input);
        }
      });
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(code).catch(fallbackCopy);
    }

    return fallbackCopy();
  }

  /**
   * 初始化优惠码复制。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   */
  function initDiscountCode(root) {
    root.querySelectorAll('[data-discount-code-copy]').forEach(function (button) {
      button.addEventListener('click', function () {
        var code = button.dataset.code;

        if (!code) return;

        copyCode(code)
          .then(function () {
            button.classList.add('is-copied');

            window.setTimeout(function () {
              button.classList.remove('is-copied');
            }, 1600);

            if (button.dataset.autoApply === 'true') {
              window.location.href = '/discount/' + encodeURIComponent(code);
            }
          })
          .catch(function () {
            button.classList.add('is-copied');
          });
      });
    });
  }

  /**
   * 设置按钮 loading 状态。
   *
   * @param {HTMLButtonElement} button - 按钮元素。
   * @param {boolean} isLoading - 是否 loading。
   */
  function setButtonLoading(button, isLoading) {
    if (!button) return;

    button.classList.toggle('is-loading', isLoading);
    button.disabled = isLoading;
  }

  /**
   * 初始化加购和 Buy now。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   */
  function initProductForm(root) {
    var form = root.querySelector('form[action*="/cart/add"]');
    var buyNowButton = root.querySelector('[data-buy-now-button]');
    if (!form) return;

    if (!buyNowButton) return;

    buyNowButton.addEventListener('click', function (event) {
      event.preventDefault();
      if (buyNowButton.disabled) return;

      setButtonLoading(buyNowButton, true);

      var formData = new FormData(form);
      var cartAddUrl =
        (window.theme && window.theme.routes && window.theme.routes.cart_add_url) ||
        ((window.Shopify && window.Shopify.routes && window.Shopify.routes.root ? window.Shopify.routes.root : '/') + 'cart/add.js');

      fetch(cartAddUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      })
        .then(function (response) {
          if (!response.ok) throw response;
          return response.json();
        })
        .then(function () {
          window.location.href = '/checkout';
        })
        .catch(function () {
          var returnTo = form.querySelector('input[name="return_to"]');

          if (!returnTo) {
            returnTo = document.createElement('input');
            returnTo.type = 'hidden';
            returnTo.name = 'return_to';
            form.appendChild(returnTo);
          }

          returnTo.value = '/checkout';
          form.submit();
        })
        .finally(function () {
          setButtonLoading(buyNowButton, false);
        });
    });
  }

  /**
   * 初始化产品倒计时。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   */
  function initCountdown(root) {
    root.querySelectorAll('[data-product-countdown]').forEach(function (countdown) {
      if (countdown.dataset.countdownInitialized === 'true') return;

      var endValue = (countdown.dataset.countdownEnd || '').trim();
      var endTime = parseCountdownEndTime(endValue);
      var dayEl = countdown.querySelector('[data-countdown-days]');
      var hourEl = countdown.querySelector('[data-countdown-hours]');
      var minuteEl = countdown.querySelector('[data-countdown-minutes]');
      var secondEl = countdown.querySelector('[data-countdown-seconds]');

      countdown.classList.remove('is-active', 'is-ended');

      if (!endTime || Number.isNaN(endTime)) {
        countdown.dataset.countdownInitialized = 'true';
        return;
      }

      function pad(value) {
        return String(value).padStart(2, '0');
      }

      function renderCountdown() {
        var remaining = Math.max(0, endTime - Date.now());
        var totalSeconds = Math.floor(remaining / 1000);
        var days = Math.floor(totalSeconds / 86400);
        var hours = Math.floor((totalSeconds % 86400) / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        if (dayEl) dayEl.textContent = pad(days);
        if (hourEl) hourEl.textContent = pad(hours);
        if (minuteEl) minuteEl.textContent = pad(minutes);
        if (secondEl) secondEl.textContent = pad(seconds);

        return remaining;
      }

      if (renderCountdown() <= 0) {
        countdown.classList.add('is-ended');
        countdown.dataset.countdownInitialized = 'true';
        return;
      }

      countdown.classList.add('is-active');

      var timer = window.setInterval(function () {
        if (renderCountdown() <= 0) {
          window.clearInterval(timer);
          countdown.classList.remove('is-active');
          countdown.classList.add('is-ended');
        }
      }, 1000);
      countdown.dataset.countdownInitialized = 'true';
    });
  }

  /**
   * 解析倒计时结束时间，兼容 ISO 字符串、带空格的日期时间和毫秒时间戳。
   *
   * @param {string} value - 后台配置的结束时间。
   * @returns {number}
   */
  function parseCountdownEndTime(value) {
    if (!value) return NaN;

    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    var normalizedValue = value.replace(/\s+/, 'T');
    var parsedTime = Date.parse(normalizedValue);

    if (!Number.isNaN(parsedTime)) {
      return parsedTime;
    }

    var match = normalizedValue.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(Z|[+-]\d{2}:?\d{2})?$/
    );

    if (!match) return NaN;

    var year = Number(match[1]);
    var month = Number(match[2]) - 1;
    var day = Number(match[3]);
    var hour = Number(match[4]);
    var minute = Number(match[5]);
    var second = Number(match[6] || 0);
    var timezone = match[7];
    var utcTime = Date.UTC(year, month, day, hour, minute, second);

    if (!timezone || timezone === 'Z') {
      return timezone === 'Z' ? utcTime : new Date(year, month, day, hour, minute, second).getTime();
    }

    var timezoneMatch = timezone.match(/^([+-])(\d{2}):?(\d{2})$/);
    if (!timezoneMatch) return utcTime;

    var offsetMinutes = Number(timezoneMatch[2]) * 60 + Number(timezoneMatch[3]);
    return utcTime - (timezoneMatch[1] === '+' ? offsetMinutes : -offsetMinutes) * 60000;
  }

  /**
   * 初始化单个产品信息组件。
   *
   * @param {HTMLElement} root - 产品信息组件根节点。
   */
  function initProductInfo(root) {
    if (!root || root.dataset.infoInitialized === 'true') return;

    initCountdown(root);

    initVariantPicker(root);
    initQuantity(root);
    initDiscountCode(root);
    initProductForm(root);

    root.dataset.infoInitialized = 'true';
  }

  /**
   * 初始化 Judge.me 评分点击跳转评论区。
   */
  function initJudgeMeReviewScroll() {
    if (document.documentElement.dataset.judgeMeReviewScrollInitialized === 'true') return;

    document.addEventListener('click', function (event) {
      var badge = event.target.closest('.jdgm-prev-badge');

      if (!badge) return;

      event.preventDefault();

      var target = document.querySelector('#judgeme_product_reviews');

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });

    document.documentElement.dataset.judgeMeReviewScrollInitialized = 'true';
  }

  /**
   * 初始化页面中所有产品信息组件。
   */
  function initAllProductInfo() {
    document.querySelectorAll('[data-product-info]').forEach(function (root) {
      initProductInfo(root);
    });

    initCountdown(document);
    initJudgeMeReviewScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllProductInfo);
  } else {
    initAllProductInfo();
  }

  // Shopify 主题编辑器中 section 重新加载后，需要重新初始化组件。
  document.addEventListener('shopify:section:load', function (event) {
    if (!event || !event.target) return;

    event.target.querySelectorAll('[data-product-info]').forEach(function (root) {
      root.dataset.infoInitialized = 'false';
      initProductInfo(root);
    });
    initCountdown(event.target);
  });

})();
