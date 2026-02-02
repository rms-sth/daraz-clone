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

  const renderOrders = (orders) => {
    const list = $('#orders-list');
    if (!orders.length) {
      list.html('<div class="text-muted">No orders found.</div>');
      return;
    }

    list.html(
      orders
        .map((order) => `
          <div class="card order-card mb-3">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-muted small">Order #${order.orderId}</div>
                  <div class="fw-semibold">${order.date}</div>
                </div>
                <span class="badge bg-${order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'info' : order.status === 'cancelled' ? 'danger' : 'warning'}">${order.status}</span>
              </div>
              <div class="mt-2 small">${order.items.length} item(s) • ${order.payment}</div>
              <div class="d-flex align-items-center justify-content-between mt-3">
                <div class="fw-semibold">Total: ${UI.formatNPR(order.total)}</div>
                <a href="order-details.html?id=${order.orderId}" class="btn btn-sm btn-outline-dark">View Details</a>
              </div>
            </div>
          </div>
        `)
        .join('')
    );
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
