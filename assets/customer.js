const selectors = {
  customerAddresses: '[data-customer-addresses]',
  addressCountrySelect: '[data-address-country-select]',
  addressContainer: '[data-address]',
  toggleAddressButton: 'button[aria-expanded]',
  cancelAddressButton: 'button[type="reset"]',
  deleteAddressButton: 'button[data-confirm-message]'
};

const attributes = {
  expanded: 'aria-expanded',
  confirmMessage: 'data-confirm-message'
};

class CustomerAddresses {
  constructor() {
    this.elements = this._getElements();
    if (Object.keys(this.elements).length === 0) return;
    this._setupCountries();
    this._setupEventListeners();
  }

  _getElements() {
    const container = document.querySelector(selectors.customerAddresses);
    return container ? {
      container,
      addressContainer: container.querySelector(selectors.addressContainer),
      toggleButtons: document.querySelectorAll(selectors.toggleAddressButton),
      cancelButtons: container.querySelectorAll(selectors.cancelAddressButton),
      deleteButtons: container.querySelectorAll(selectors.deleteAddressButton),
      countrySelects: container.querySelectorAll(selectors.addressCountrySelect)
    } : {};
  }

  _setupCountries() {
    if (Shopify && Shopify.CountryProvinceSelector) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
        hideElement: 'AddressProvinceContainerNew'
      });
      this.elements.countrySelects.forEach((select) => {
        const formId = select.dataset.formId;
        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector(`AddressCountry_${formId}`, `AddressProvince_${formId}`, {
          hideElement: `AddressProvinceContainer_${formId}`
        });
      });
    }
  }

  _setupEventListeners() {
    this.elements.toggleButtons.forEach((element) => {
      element.addEventListener('click', this._handleAddEditButtonClick);
    });
    this.elements.cancelButtons.forEach((element) => {
      element.addEventListener('click', this._handleCancelButtonClick);
    });
    this.elements.deleteButtons.forEach((element) => {
      element.addEventListener('click', this._handleDeleteButtonClick);
    });
  }

  _toggleExpanded(target) {
    target.setAttribute(
      attributes.expanded,
      (target.getAttribute(attributes.expanded) === 'false').toString()
    );

    if (target.getAttribute(attributes.expanded) == 'true') {
      target
        .closest(selectors.addressContainer)
        .setAttribute('open', '')
    }
    else {
      target
        .closest(selectors.addressContainer)
        .removeAttribute('open')
    }
  }

  _handleAddEditButtonClick = ({ currentTarget }) => {
    this._toggleExpanded(currentTarget);
  }

  _handleCancelButtonClick = ({ currentTarget }) => {
    this._toggleExpanded(
      currentTarget
        .closest(selectors.addressContainer)
        .querySelector(`[${attributes.expanded}]`)
    )
  }

  _handleDeleteButtonClick = ({ currentTarget }) => {
    // eslint-disable-next-line no-alert
    if (confirm(currentTarget.getAttribute(attributes.confirmMessage))) {
      theme.utils.postLink(currentTarget.dataset.target, {
        parameters: { _method: 'delete' },
      });
    }
  }
}


/**
 * 
 * @param {产品id} productId 
 * @param {按钮是否需要动画} button 
 * @param {扩展字段} properties 
 * @returns 
 */
function addToCart(productId, button, properties，quantity =1) {
  // 获取文本元素和加载动画元素
 var textElement ;
 var loaderElement;
  if(button){
    textElement = button.querySelector('.loader-button__text');
    loaderElement = button.querySelector('.loader-button__loader');

     if(button.disabled) return
     // 禁用按钮
     button.setAttribute("disabled", "disabled");
     button.setAttribute("aria-busy", "true");
     // 显示加载动画
     textElement.hidden = true;
     loaderElement.hidden = false;
  }

  console.log(properties);

 fetch('/cart/add.js', {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json',
   },
   body: JSON.stringify({
     id: productId,
     quantity: quantity, // 可根据需求设置购买数量
     properties
   }),
 })
   .then(response => response.json())
   .then(data => {
     // 添加购物车成功后的处理逻辑
     console.log('Product added to cart:', data);
     // 获取购物车列表
     fetch('/cart.js')
       .then(response => response.json())
       .then(cartData => {
         // 获取购物车列表成功后的处理逻辑
         console.log('Cart contents:', cartData);
        
          //const cartJson = await (await fetch(`${theme.routes.cart_url}`, { ...theme.utils.fetchConfig()})).json();
        cartData['sections'] = data['sections'];

        theme.pubsub.publish(theme.pubsub.PUB_SUB_EVENTS.cartUpdate, { cart: cartData });
          if(button){
           // 恢复按钮状态
           button.removeAttribute("disabled");
           button.removeAttribute("aria-busy");
           // 显示 "Add to Cart"，隐藏加载动画
           textElement.hidden = false;
           loaderElement.hidden = true;
          }
       })
       .catch(error => {
         // 获取购物车列表失败的处理逻辑
         console.error('Error getting cart contents:', error);
         if(button){
           // 恢复按钮状态
           button.removeAttribute("disabled");
           button.removeAttribute("aria-busy");
           // 显示 "Add to Cart"，隐藏加载动画
           textElement.hidden = false;
           loaderElement.hidden = true;
         }
       });
   })
   .catch(error => {
     // 添加购物车失败的处理逻辑
     console.error('Error adding product to cart:', error);
   });
}

function sendUlikeApi(url, data) {
  // api.myulike.test  测试环境 手动打开一下
  // api.ulike.com  正式环境
  // 'https://api.myulike.com';  老接口
  data.siteCode = 'JP'; // Ensure the site code is set to 'UK' 
  var _url = 'https://api.ulike.com' + url;
  data.language = window.Shopify.locale;

  data.requestId = generateGUID();
  // Set up the AJAX settings
  var settings = {
    url: _url,
    method: 'POST', // POST is used as the request method
    headers: {
      'Content-Type': 'application/json', // Request payload is in JSON format
    },
    data: JSON.stringify(data), // Convert data object to JSON string
    xhrFields: {
      withCredentials: true, // Allow cookies and credentials to be sent
    },
  };

  // Return a new Promise
  return new Promise((resolve, reject) => {
    $.ajax(settings)
      .done(function (response) {
        resolve(response); // Resolve the promise with the response
      })
      .fail(function (error) {
        console.error('Error during API call:', error); // Log the error
        reject(error); // Reject the promise with the error
      });
  });
}

function generateGUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    s4() +
    s4()
  );
}