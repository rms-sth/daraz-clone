/* global $, UI, bootstrap */

const OrderDetailsPage = (() => {
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

  const requireLogin = () => {
    const session = storage.get('session', null);
    if (!session || !session.user) {
      window.location.href = 'login.html';
      return null;
    }
    return session.user;
  };

  const getOrderId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  };

  const renderTimeline = (status) => {
    const steps = ['placed', 'shipped', 'out for delivery', 'delivered'];
    return `
      <div class="timeline">
        ${steps
          .map((step) => {
            const active = steps.indexOf(step) <= steps.indexOf(status) ? 'active' : '';
            return `
              <div class="timeline-step ${active}">
                <div class="dot"></div>
                <div class="label">${step}</div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  };

  const renderOrder = (order) => {
    if (!order) {
      $('#order-detail').html('<div class="text-muted">Order not found.</div>');
      return;
    }

    const itemsHtml = order.items
      .map((item) => `
        <li>${item.productId} x${item.qty} - ${UI.formatNPR(item.price * item.qty)}</li>
      `)
      .join('');

    $('#order-detail').html(`
      <div class="card order-detail-card">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <div class="text-muted small">Order #${order.orderId}</div>
              <div class="fw-semibold">${order.date}</div>
            </div>
            <span class="badge bg-${order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'}">${order.status}</span>
          </div>
          <div class="mt-3">${renderTimeline(order.status)}</div>
          <div class="row mt-4">
            <div class="col-md-6">
              <h6>Shipping Address</h6>
              <div class="small text-muted">${order.shippingAddress ? order.shippingAddress.name : ''}</div>
              <div class="small">${order.shippingAddress ? `${order.shippingAddress.area}, ${order.shippingAddress.city}` : ''}</div>
              <div class="small text-muted">${order.shippingAddress ? order.shippingAddress.phone : ''}</div>
            </div>
            <div class="col-md-6">
              <h6>Payment</h6>
              <div class="small">${order.payment}</div>
              <div class="small text-muted">Total: ${UI.formatNPR(order.total)}</div>
            </div>
          </div>
          <div class="mt-4">
            <h6>Items</h6>
            <ul class="small">${itemsHtml}</ul>
          </div>
          <div class="d-flex align-items-center gap-2 mt-3">
            <button class="btn btn-outline-dark" data-bs-toggle="modal" data-bs-target="#returnModal">Request Return</button>
            <button class="btn btn-dark">Track Order</button>
          </div>
        </div>
      </div>
    `);
  };

  const bindEvents = (order) => {
    $('#returnModal').on('show.bs.modal', () => {
      $('#returnOrderId').val(order.orderId);
    });

    $('#returnForm').on('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      const returns = storage.get('returns', []);
      returns.unshift({
        id: `RET-${Date.now()}`,
        orderId: data.orderId,
        reason: data.reason,
        notes: data.notes,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
      storage.set('returns', returns);
      const modal = bootstrap.Modal.getInstance(document.getElementById('returnModal'));
      modal.hide();
      if (UI && UI.showToast) UI.showToast('Return request submitted.', 'success');
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'order-details') return;
    const user = requireLogin();
    if (!user) return;

    const orderId = getOrderId();
    const orders = storage.get('orders', []);
    const order = orders.find((item) => item.orderId === orderId);

    renderOrder(order);
    if (order) bindEvents(order);
    updateCartCount();
  };

  return { init };
})();

$(OrderDetailsPage.init);
