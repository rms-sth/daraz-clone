/* global $, UI */

const CartPage = (() => {
  const state = {
    cart: [],
    couponDiscount: 0,
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

  const normalizeKey = (item) => `${item.productId}|${item.variant && item.variant.color ? item.variant.color : ''}|${item.variant && item.variant.size ? item.variant.size : ''}`;

  const getCartItems = () => {
    const stored = storage.get('cart', []);
    return stored.map((item) => ({
      ...item,
      key: item.key || normalizeKey(item),
    }));
  };

  const mergeCart = (items) => {
    const merged = [];
    items.forEach((item) => {
      const key = item.key || normalizeKey(item);
      const existing = merged.find((entry) => entry.key === key);
      if (existing) {
        existing.qty += Number(item.qty || 0);
      } else {
        merged.push({ ...item, key });
      }
    });
    return merged;
  };

  const calculateTotals = () => {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = state.cart.length ? 120 : 0;
    const discount = state.couponDiscount;
    const total = Math.max(0, subtotal + shipping - discount);
    return { subtotal, shipping, discount, total };
  };

  const hydrateCart = () => {
    const cartItems = mergeCart(getCartItems());
    state.cart = cartItems.map((item) => {
      const product = item.product || {};
      return {
        ...item,
        title: product.title || item.title || 'Product',
        price: product.price || item.price || 0,
        image: product.image || item.image || '../assets/img/products/product-01.jpg',
        variantSummary: `${item.variant && item.variant.color ? item.variant.color : 'Standard'} / ${item.variant && item.variant.size ? item.variant.size : 'Free Size'}`,
      };
    });
  };

  const renderCart = () => {
    const list = $('#cart-list');
    const empty = $('#cart-empty');
    const slots = list.find('.cart-slot');

    slots.addClass('d-none');

    if (!state.cart.length) {
      empty.removeClass('d-none');
      updateSummary();
      return;
    }

    empty.addClass('d-none');

    state.cart.forEach((item, index) => {
      const card = slots.eq(index);
      if (!card.length) return;
      card.attr('data-key', item.key);
      card.find('[data-field="image"]').attr('src', item.image).attr('alt', item.title);
      card.find('[data-field="title"]').text(item.title);
      card.find('[data-field="variant"]').text(item.variantSummary);
      card.find('[data-field="price"]').text(UI.formatNPR(item.price));
      card.find('[data-field="subtotal"]').text(`Subtotal: ${UI.formatNPR(item.price * item.qty)}`);
      card.find('[data-field="remove"]').attr('data-key', item.key);
      card.find('[data-field="minus"]').attr('data-key', item.key);
      card.find('[data-field="plus"]').attr('data-key', item.key);
      card.find('[data-field="qty"]').attr('data-key', item.key).val(item.qty);
      card.removeClass('d-none');
    });

    updateSummary();
  };

  const updateSummary = () => {
    const totals = calculateTotals();
    $('#summary-subtotal').text(UI.formatNPR(totals.subtotal));
    $('#summary-shipping').text(UI.formatNPR(totals.shipping));
    $('#summary-discount').text(`- ${UI.formatNPR(totals.discount)}`);
    $('#summary-total').text(UI.formatNPR(totals.total));
  };

  const updateStorage = () => {
    const stripped = state.cart.map((item) => ({
      key: item.key,
      productId: item.productId,
      qty: item.qty,
      variant: item.variant,
      product: item.product || null,
    }));
    storage.set('cart', stripped);
    $(document).trigger('cart:updated', [stripped]);
  };

  const removeItem = (key) => {
    state.cart = state.cart.filter((item) => item.key !== key);
    updateStorage();
    renderCart();
    updateCartCount();
  };

  const bindEvents = () => {
    $('#cart-list').on('click', '.btn-remove', function () {
      const key = $(this).data('key');
      if (UI && UI.confirm) {
        UI.confirm('Remove this item from your cart?', () => removeItem(key), {
          title: 'Remove Item',
          confirmText: 'Remove',
        });
      } else {
        removeItem(key);
      }
    });

    $('#cart-list').on('click', '.btn-qty', function () {
      const key = $(this).data('key');
      const delta = Number($(this).data('delta'));
      state.cart = state.cart.map((item) => {
        if (item.key === key) {
          const qty = Math.max(1, item.qty + delta);
          return { ...item, qty };
        }
        return item;
      });
      updateStorage();
      renderCart();
      updateCartCount();
    });

    $('#cart-list').on('change', '.qty-input', function () {
      const key = $(this).data('key');
      const value = Math.max(1, Number($(this).val()) || 1);
      state.cart = state.cart.map((item) => (item.key === key ? { ...item, qty: value } : item));
      updateStorage();
      renderCart();
      updateCartCount();
    });

    $('#applyCoupon').on('click', () => {
      const code = $('#couponInput').val().trim().toUpperCase();
      if (!code) {
        $('#couponMessage').text('Enter a coupon code.').removeClass('text-success').addClass('text-danger');
        return;
      }
      if (code === 'DARAZ10') {
        state.couponDiscount = 150;
        $('#couponMessage').text('Coupon applied! NPR 150 off').removeClass('text-danger').addClass('text-success');
      } else {
        state.couponDiscount = 0;
        $('#couponMessage').text('Invalid coupon code').removeClass('text-success').addClass('text-danger');
      }
      updateSummary();
    });

    $('#checkoutBtn').on('click', () => {
      if (!state.cart.length) {
        if (UI && UI.showToast) UI.showToast('Your cart is empty.', 'danger');
        return;
      }
      window.location.href = 'checkout.html';
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'cart') return;

    hydrateCart();
    renderCart();
    bindEvents();
    updateCartCount();
  };

  return { init };
})();

$(CartPage.init);
