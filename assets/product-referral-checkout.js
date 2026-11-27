(async function () {
  const productUrl = new URL(window.location.href);
  const params = productUrl.searchParams;
  const discount = params.get('checkout')?.trim();
  if (!discount) return;

  const notice = document.querySelector('[data-product-referral-checkout]');
  if (!notice || notice.dataset.checkoutStarted) return;
  // 如果模板同时渲染两个商品主区块，只处理一次自动结账。
  notice.dataset.checkoutStarted = 'true';

  // 以 Shopify 渲染出的商品变体为准，失效的变体链接不应加购其他规格。
  const variantId = notice.dataset.productReferralCheckout;
  if (!variantId || (params.has('variant') && params.get('variant') !== variantId)) {
    notice.hidden = false;
    return;
  }

  const cartUrl = notice.dataset.cartUrl;
  async function requestCart(path, body) {
    const options = body ? {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    } : { cache: 'no-store' };
    const response = await fetch(cartUrl + path, options);
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    return response.json();
  }

  try {
    // 加购成功后若优惠请求失败，重试时沿用已有商品，避免增加购买数量。
    const cart = await requestCart('.js');
    if (!cart.items.some((item) => String(item.variant_id) === variantId)) {
      await requestCart('/add.js', { items: [{ id: variantId, quantity: 1 }] });
    }

    await requestCart('/update.js', { discount });

    // 从结账返回商品页时，避免再次自动进入结账。
    params.delete('checkout');
    window.history.replaceState(window.history.state, '', productUrl);
    window.location.assign('/checkout');
  } catch (error) {
    console.error('Referral checkout:', error);
    notice.hidden = false;
  }
})();
