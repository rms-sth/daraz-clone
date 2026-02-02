/* global $, UI */

const OrderSuccessPage = (() => {
  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (err) {
        return fallback;
      }
    },
  };

  const updateCartCount = () => {
    const cart = storage.get('cart', []);
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const renderOrder = () => {
    const order = storage.get('lastOrder', null);
    if (!order) {
      $('#order-summary').html('<div class="text-muted">Order details not available.</div>');
      return;
    }

    const items = order.items
      .map((item) => `<li>${item.productId} x${item.qty} - ${UI.formatNPR(item.price * item.qty)}</li>`)
      .join('');

    $('#order-summary').html(`
      <div class="row">
        <div class="col-md-6">
          <div class="small text-muted">Order Number</div>
          <div class="fw-semibold">${order.orderId}</div>
        </div>
        <div class="col-md-6">
          <div class="small text-muted">Date</div>
          <div class="fw-semibold">${order.date}</div>
        </div>
        <div class="col-md-6 mt-3">
          <div class="small text-muted">Total</div>
          <div class="fw-semibold">${UI.formatNPR(order.total)}</div>
        </div>
        <div class="col-md-6 mt-3">
          <div class="small text-muted">Payment</div>
          <div class="fw-semibold">${order.payment}</div>
        </div>
        <div class="col-md-6 mt-3">
          <div class="small text-muted">Shipping Address</div>
          <div class="fw-semibold">${order.shippingAddress ? order.shippingAddress.name : ''}</div>
          <div class="small text-muted">${order.shippingAddress ? `${order.shippingAddress.area}, ${order.shippingAddress.city}` : ''}</div>
        </div>
        <div class="col-md-6 mt-3">
          <div class="small text-muted">Items</div>
          <ul class="small">${items}</ul>
        </div>
      </div>
    `);
  };

  const init = () => {
    if ($('body').data('page') !== 'order-success') return;
    renderOrder();
    updateCartCount();
    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  return { init };
})();

$(OrderSuccessPage.init);
