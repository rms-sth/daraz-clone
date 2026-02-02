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
      $('#order-summary').addClass('d-none');
      $('#order-empty').removeClass('d-none');
      return;
    }

    $('#order-summary').removeClass('d-none');
    $('#order-empty').addClass('d-none');

    $('#order-number').text(order.orderId);
    $('#order-date').text(order.date);
    $('#order-total').text(UI.formatNPR(order.total));
    $('#order-payment').text(order.payment);
    $('#order-address-name').text(order.shippingAddress ? order.shippingAddress.name : '');
    $('#order-address-line').text(order.shippingAddress ? `${order.shippingAddress.area}, ${order.shippingAddress.city}` : '');

    const slots = $('#order-items .order-item-slot');
    slots.addClass('d-none');

    order.items.slice(0, slots.length).forEach((item, index) => {
      const slot = slots.eq(index);
      slot.text(`${item.productId} x${item.qty} - ${UI.formatNPR(item.price * item.qty)}`);
      slot.removeClass('d-none');
    });
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
