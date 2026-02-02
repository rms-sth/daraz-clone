/* global $ */

const OrdersPage = (() => {
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

  const requireLogin = () => {
    const session = storage.get('session', null);
    if (!session || !session.user) {
      window.location.href = 'login.html';
      return null;
    }
    return session.user;
  };

  const statusClass = (status) => {
    if (status === 'delivered') return 'bg-success';
    if (status === 'shipped') return 'bg-info';
    if (status === 'cancelled') return 'bg-danger';
    return 'bg-warning';
  };

  const renderOrders = (orders) => {
    const slots = $('.order-slot');
    const empty = $('#orders-empty');

    slots.addClass('d-none');

    if (!orders.length) {
      empty.removeClass('d-none');
      return;
    }

    empty.addClass('d-none');

    orders.slice(0, slots.length).forEach((order, index) => {
      const card = slots.eq(index);
      card.removeClass('d-none');
      card.find('[data-field="orderId"]').text(`#${order.orderId}`);
      card.find('[data-field="date"]').text(order.date);
      const badge = card.find('[data-field="status"]');
      badge.text(order.status);
      badge.removeClass('bg-success bg-info bg-danger bg-warning').addClass(statusClass(order.status));
      card.find('[data-field="meta"]').text(`${order.items.length} item(s) • ${order.payment}`);
      card.find('[data-field="total"]').text(`Total: ${UI.formatNPR(order.total)}`);
      card.find('[data-field="detailsLink"]').attr('href', `order-details.html?id=${order.orderId}`);
    });
  };

  const init = () => {
    if ($('body').data('page') !== 'orders') return;
    const user = requireLogin();
    if (!user) return;

    const orders = storage.get('orders', []);
    renderOrders(orders);

    $('.btn-group button').on('click', function () {
      $('.btn-group button').removeClass('active');
      $(this).addClass('active');
      const status = $(this).data('status');
      const filtered = status === 'all' ? orders : orders.filter((order) => order.status === status);
      renderOrders(filtered);
    });

    updateCartCount();
    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  return { init };
})();

$(OrdersPage.init);
