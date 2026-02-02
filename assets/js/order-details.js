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

  const statusClass = (status) => {
    if (status === 'delivered') return 'bg-success';
    if (status === 'shipped') return 'bg-info';
    if (status === 'cancelled') return 'bg-danger';
    return 'bg-warning';
  };

  const updateTimeline = (status) => {
    const steps = ['placed', 'shipped', 'out for delivery', 'delivered'];
    const index = Math.max(0, steps.indexOf(status));
    $('.timeline-step').each(function () {
      const step = $(this).data('step');
      const stepIndex = steps.indexOf(step);
      $(this).toggleClass('active', stepIndex <= index);
    });
  };

  const renderOrder = (order) => {
    if (!order) {
      $('#order-not-found').removeClass('d-none');
      $('.order-detail-card').addClass('d-none');
      return;
    }

    $('#order-not-found').addClass('d-none');
    $('.order-detail-card').removeClass('d-none');

    $('[data-field="orderId"]').text(`#${order.orderId}`);
    $('[data-field="date"]').text(order.date);
    const badge = $('[data-field="status"]');
    badge.text(order.status);
    badge.removeClass('bg-success bg-info bg-danger bg-warning').addClass(statusClass(order.status));

    updateTimeline(order.status);

    $('[data-field="addressName"]').text(order.shippingAddress ? order.shippingAddress.name : '');
    $('[data-field="addressLine"]').text(order.shippingAddress ? `${order.shippingAddress.area}, ${order.shippingAddress.city}` : '');
    $('[data-field="addressPhone"]').text(order.shippingAddress ? order.shippingAddress.phone : '');
    $('[data-field="payment"]').text(order.payment);
    $('[data-field="total"]').text(`Total: ${UI.formatNPR(order.total)}`);

    const slots = $('#order-items .order-item-slot');
    slots.addClass('d-none');

    order.items.slice(0, slots.length).forEach((item, index) => {
      const slot = slots.eq(index);
      slot.text(`${item.productId} x${item.qty} - ${UI.formatNPR(item.price * item.qty)}`);
      slot.removeClass('d-none');
    });
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
    const order = orders.find((item) => item.orderId === orderId) || orders[0];

    renderOrder(order);
    if (order) bindEvents(order);
    updateCartCount();
  };

  return { init };
})();

$(OrderDetailsPage.init);
