/* global $, UI, bootstrap */

const CheckoutPage = (() => {
  const state = {
    cart: [],
    addresses: [],
    selectedAddressId: null,
    shippingMethod: 'standard',
    paymentMethod: 'COD',
  };

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

  const getCartItems = () => storage.get('cart', []);

  const hydrateCart = () => {
    const cartItems = getCartItems();
    state.cart = cartItems.map((item) => {
      const product = item.product || {};
      return {
        ...item,
        title: product.title || item.title || item.productId,
        price: product.price || item.price || 0,
      };
    });
  };

  const calculateTotals = () => {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = state.shippingMethod === 'express' ? 220 : state.cart.length ? 120 : 0;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  };

  const renderSummary = () => {
    const slots = $('#checkout-summary-items .summary-slot');
    slots.addClass('d-none');

    if (!state.cart.length) {
      $('#summary-empty').removeClass('d-none');
      return;
    }

    $('#summary-empty').addClass('d-none');

    state.cart.slice(0, slots.length).forEach((item, index) => {
      const slot = slots.eq(index);
      slot.removeClass('d-none');
      slot.find('[data-field="label"]').text(`${item.title} x${item.qty}`);
      slot.find('[data-field="value"]').text(UI.formatNPR(item.price * item.qty));
    });

    const totals = calculateTotals();
    $('#checkout-subtotal').text(UI.formatNPR(totals.subtotal));
    $('#checkout-shipping').text(UI.formatNPR(totals.shipping));
    $('#checkout-total').text(UI.formatNPR(totals.total));
  };

  const renderAddresses = () => {
    const slots = $('#address-list .address-slot');
    slots.addClass('d-none');

    if (!state.addresses.length) {
      $('#address-empty').removeClass('d-none');
      return;
    }

    $('#address-empty').addClass('d-none');

    state.addresses.slice(0, slots.length).forEach((address, index) => {
      const card = slots.eq(index);
      card.removeClass('d-none');
      const input = card.find('input[name="address"]');
      input.val(address.id).attr('id', `addr-${address.id}`).prop('checked', address.id === state.selectedAddressId);
      card.find('label').attr('for', `addr-${address.id}`);
      card.find('[data-field="name"]').text(address.name);
      card.find('[data-field="phone"]').text(address.phone);
      card.find('[data-field="line"]').text(`${address.area}, ${address.city}, ${address.province}`);
      card.find('[data-field="landmark"]').text(address.landmark || '');
    });
  };

  const saveAddress = (data) => {
    const address = {
      id: `ADDR-${Date.now()}`,
      ...data,
    };
    state.addresses.unshift(address);
    state.selectedAddressId = address.id;
    storage.set('addresses', state.addresses);
    renderAddresses();
  };

  const changeStep = (step) => {
    const tab = document.querySelector(`#checkoutSteps button[data-step="${step}"]`);
    if (tab) {
      const instance = bootstrap.Tab.getOrCreateInstance(tab);
      instance.show();
    }
  };

  const bindEvents = () => {
    $('#addressForm').on('submit', (event) => {
      event.preventDefault();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      saveAddress(formData);
      event.target.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById('addressModal'));
      modal.hide();
    });

    $('#address-list').on('change', 'input[name="address"]', function () {
      state.selectedAddressId = $(this).val();
      storage.set('selectedAddress', state.selectedAddressId);
    });

    $('#toShipping').on('click', () => {
      if (!state.selectedAddressId) {
        if (UI && UI.showToast) UI.showToast('Please select an address to continue.', 'danger');
        return;
      }
      changeStep(2);
    });

    $('#backToAddress').on('click', () => changeStep(1));

    $('#toPayment').on('click', () => changeStep(3));

    $('#backToShipping').on('click', () => changeStep(2));

    $('input[name="shipping"]').on('change', function () {
      state.shippingMethod = $(this).val();
      $('#shippingEta').text(state.shippingMethod === 'express' ? 'Estimated delivery: 1-2 days' : 'Estimated delivery: 2-4 days');
      renderSummary();
    });

    $('input[name="payment"]').on('change', function () {
      state.paymentMethod = $(this).val();
      $('#walletNote').toggleClass('d-none', state.paymentMethod === 'COD');
    });

    $('#placeOrder').on('click', () => {
      if (!state.cart.length) {
        if (UI && UI.showToast) UI.showToast('Cart is empty.', 'danger');
        return;
      }
      if (!state.selectedAddressId) {
        if (UI && UI.showToast) UI.showToast('Please add a delivery address.', 'danger');
        changeStep(1);
        return;
      }

      const totals = calculateTotals();
      const selectedAddress = state.addresses.find((addr) => addr.id === state.selectedAddressId);
      const order = {
        orderId: `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        date: new Date().toISOString().split('T')[0],
        status: 'placed',
        payment: state.paymentMethod,
        total: totals.total,
        items: state.cart.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          price: item.price,
        })),
        shippingAddress: selectedAddress,
      };

      const orders = storage.get('orders', []);
      orders.unshift(order);
      storage.set('orders', orders);
      storage.set('lastOrder', order);
      storage.set('cart', []);
      $(document).trigger('cart:updated', [[]]);
      window.location.href = 'order-success.html';
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'checkout') return;

    state.addresses = storage.get('addresses', []);
    state.selectedAddressId = storage.get('selectedAddress', state.addresses[0] ? state.addresses[0].id : null);

    hydrateCart();
    renderAddresses();
    renderSummary();

    bindEvents();
  };

  return { init };
})();

$(CheckoutPage.init);
