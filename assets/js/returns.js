/* global $ */

const ReturnsPage = (() => {
  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  const updateCartCount = () => {
    const cart = storage.get('cart', []);
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const bindEvents = () => {
    $('#returnRequestForm').on('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      const returns = storage.get('returns', []);
      returns.unshift({
        id: `RET-${Date.now()}`,
        orderId: data.orderId,
        product: data.product,
        reason: data.reason,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
      storage.set('returns', returns);
      $('#returnMessage').text('Return request submitted successfully.').removeClass('text-danger').addClass('text-success');
      event.target.reset();
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'returns') return;
    updateCartCount();
    bindEvents();
  };

  return { init };
})();

$(ReturnsPage.init);
