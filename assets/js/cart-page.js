/* global $, UI */

const CartPage = (() => {
  const state = {
    products: [],
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

  const renderCart = () => {
    const list = $('#cart-list');
    const empty = $('#cart-empty');
    if (!state.cart.length) {
      list.empty();
      empty.removeClass('d-none');
      updateSummary();
      return;
    }

    empty.addClass('d-none');
    const markup = state.cart
      .map((item) => `
        <div class="card cart-item mb-3" data-key="${item.key}">
          <div class="card-body">
            <div class="d-flex gap-3">
              <div class="cart-thumb">
                <img src="${item.image}" alt="${item.title}" />
              </div>
              <div class="flex-grow-1">
                <div class="d-flex align-items-start justify-content-between">
                  <div>
                    <h3 class="h6 mb-1">${item.title}</h3>
                    <div class="text-muted small">${item.variantSummary}</div>
                  </div>
                  <button class="btn btn-sm btn-outline-danger btn-remove" data-key="${item.key}">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
                <div class="d-flex flex-wrap align-items-center gap-3 mt-3">
                  <div class="price fw-semibold">${UI.formatNPR(item.price)}</div>
                  <div class="qty-stepper d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-secondary btn-qty" data-delta="-1" data-key="${item.key}">-</button>
                    <input type="number" class="form-control form-control-sm qty-input" value="${item.qty}" min="1" data-key="${item.key}" />
                    <button class="btn btn-sm btn-outline-secondary btn-qty" data-delta="1" data-key="${item.key}">+</button>
                  </div>
                  <div class="text-muted">Subtotal: ${UI.formatNPR(item.price * item.qty)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `)
      .join('');

    list.html(markup);
    updateSummary();
  };

  const updateSummary = () => {
    const totals = calculateTotals();
    $('#summary-subtotal').text(UI.formatNPR(totals.subtotal));
    $('#summary-shipping').text(UI.formatNPR(totals.shipping));
    $('#summary-discount').text(`- ${UI.formatNPR(totals.discount)}`);
    $('#summary-total').text(UI.formatNPR(totals.total));
  };

  const hydrateCart = () => {
    const cartItems = mergeCart(getCartItems());
    state.cart = cartItems
      .map((item) => {
        const product = state.products.find((prod) => prod.id === item.productId);
        if (!product) return null;
        return {
          ...item,
          title: product.title,
          price: product.price,
          image: product.images && product.images.length ? `../${product.images[0]}` : '../assets/img/placeholder.svg',
          variantSummary: `${item.variant && item.variant.color ? item.variant.color : 'Standard'} / ${item.variant && item.variant.size ? item.variant.size : 'Free Size'}`,
          category: product.category,
        };
      })
      .filter(Boolean);
  };

  const renderRecommendations = () => {
    const recEl = $('#cart-recommendations');
    if (!state.products.length) {
      recEl.html('<div class="col-12 text-muted">No recommendations.</div>');
      return;
    }

    const categories = new Set(state.cart.map((item) => item.category));
    const candidates = state.products.filter((product) => categories.has(product.category));
    const picks = candidates.slice(0, 4);

    const markup = picks
      .map((product) => `
        <div class="col-6 col-md-3">
          <div class="card product-card h-100">
            <div class="ratio ratio-1x1">
              <img src="../${product.images[0]}" alt="${product.title}" class="img-fluid" />
            </div>
            <div class="card-body">
              <div class="small fw-semibold">${product.title}</div>
              <div class="price-row">
                <span class="price">${UI.formatNPR(product.price)}</span>
              </div>
            </div>
            <div class="card-footer bg-white border-0">
              <a href="product.html?id=${product.id}" class="btn btn-sm btn-outline-dark w-100">View</a>
            </div>
          </div>
        </div>
      `)
      .join('');

    recEl.html(markup || '<div class="col-12 text-muted">No recommendations yet.</div>');
  };

  const updateStorage = () => {
    const stripped = state.cart.map((item) => ({
      key: item.key,
      productId: item.productId,
      qty: item.qty,
      variant: item.variant,
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

    $('#cart-list').html('<div class="text-muted">Loading cart...</div>');

    $.getJSON('../assets/data/products.json')
      .done((products) => {
        state.products = products;
        state.cart = mergeCart(getCartItems());
        hydrateCart();
        renderCart();
        renderRecommendations();
      })
      .fail(() => {
        $('#cart-list').html('<div class="text-danger">Unable to load cart data.</div>');
      });

    bindEvents();
  };

  return { init };
})();

$(CartPage.init);
