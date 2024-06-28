const selectors = {
  customerAddresses: '[data-customer-addresses]',
  addressCountrySelect: '[data-address-country-select]',
  addressContainer: '[data-address]',
  toggleAddressButton: 'button[aria-expanded]',
  cancelAddressButton: 'button[type="reset"]',
  deleteAddressButton: 'button[data-confirm-message]'
};
document.addEventListener('DOMContentLoaded', function() {
  var buyButton = document.querySelector('.man-product-handle-button-buy');
  console.log('DOMContentLoaded event fired');
  if (buyButton) {
    console.log('Button element found');
    buyButton.addEventListener('click', function() {
      console.log('Button clicked');
      addToCart(41335578853424);
    });
  } else {
    console.log('Button element not found');
  }
});

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
function addToCart(productId, button, properties,quantity =1) {
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
  console.log('进来2')
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
