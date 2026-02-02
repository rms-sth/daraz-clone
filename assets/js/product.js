/* global $, UI */

const ProductPage = (() => {
  const state = {
    product: null,
    quantity: 1,
    selectedColor: '',
    selectedSize: '',
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

  const getWishlistIds = () => {
    const items = storage.get('wishlist', []);
    return items.map((item) => (typeof item === 'string' ? item : item.id)).filter(Boolean);
  };

  const updateCartCount = () => {
    const cart = storage.get('cart', []);
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const updateRecent = (id) => {
    const recent = storage.get('recentlyViewed', []).filter((item) => item !== id);
    recent.unshift(id);
    storage.set('recentlyViewed', recent.slice(0, 8));
  };

  const readProduct = () => {
    const detail = $('#product-detail');
    const product = {
      id: detail.data('id')?.toString(),
      title: detail.data('title') || detail.find('[data-field="title"]').text().trim(),
      price: Number(detail.data('price')) || 0,
      oldPrice: Number(detail.data('old-price')) || 0,
      rating: Number(detail.data('rating')) || 0,
      ratingCount: Number(detail.data('rating-count')) || 0,
      brand: detail.data('brand') || '',
      stock: Number(detail.data('stock')) || 0,
      seller: detail.data('seller') || '',
      location: detail.data('location') || '',
      shippingFee: Number(detail.data('shipping-fee')) || 0,
      codAvailable: detail.data('cod') === true || detail.data('cod') === 'true',
      warranty: detail.data('warranty') || '',
      returnDays: Number(detail.data('return-days')) || 0,
      image: $('#mainImage').attr('src') || '../assets/img/placeholder.svg',
    };
    return product;
  };

  const updateWishlistState = () => {
    const wishlist = new Set(getWishlistIds());
    $('#btnWishlist').toggleClass('active', wishlist.has(state.product.id));
  };

  const addToCart = () => {
    const variant = { color: state.selectedColor, size: state.selectedSize };

    if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
      Cart.add(state.product.id, variant, state.quantity, state.product);
    } else {
      const cart = storage.get('cart', []);
      const key = `${state.product.id}|${variant.color || ''}|${variant.size || ''}`;
      const existing = cart.find((item) => item.key === key);
      if (existing) {
        existing.qty += state.quantity;
      } else {
        cart.push({ key, productId: state.product.id, qty: state.quantity, variant, product: state.product });
      }
      storage.set('cart', cart);
      $(document).trigger('cart:updated', [cart]);
    }

    if (UI && UI.showToast) UI.showToast('Added to cart', 'success');
    updateCartCount();
  };

  const bindEvents = () => {
    $('#product-detail').on('click', '.thumb-btn', function () {
      const image = $(this).data('image');
      $('#mainImage').attr('src', image);
      $('.thumb-btn').removeClass('active');
      $(this).addClass('active');
    });

    $('#product-detail').on('click', '.color-pill', function () {
      $('.color-pill').removeClass('active');
      $(this).addClass('active');
      state.selectedColor = $(this).data('value');
    });

    $('#product-detail').on('click', '.size-pill', function () {
      $('.size-pill').removeClass('active');
      $(this).addClass('active');
      state.selectedSize = $(this).data('value');
    });

    $('#product-detail').on('click', '#qtyMinus', () => {
      state.quantity = Math.max(1, state.quantity - 1);
      $('#qtyInput').val(state.quantity);
    });

    $('#product-detail').on('click', '#qtyPlus', () => {
      state.quantity += 1;
      $('#qtyInput').val(state.quantity);
    });

    $('#product-detail').on('change', '#qtyInput', function () {
      const value = Number($(this).val()) || 1;
      state.quantity = Math.max(1, value);
      $(this).val(state.quantity);
    });

    $('#product-detail').on('click', '#btnAddCart', addToCart);
    $('#mobile-add-cart').on('click', addToCart);

    $('#product-detail').on('click', '#btnBuyNow', () => {
      addToCart();
      window.location.href = 'checkout.html';
    });

    $('#product-detail').on('click', '#btnWishlist', function () {
      if (typeof Wishlist !== 'undefined' && typeof Wishlist.toggle === 'function') {
        Wishlist.toggle(state.product.id, state.product);
      } else {
        const wishlist = storage.get('wishlist', []);
        const ids = wishlist.map((item) => (typeof item === 'string' ? item : item.id));
        const index = ids.indexOf(state.product.id);
        if (index >= 0) {
          wishlist.splice(index, 1);
          if (UI && UI.showToast) UI.showToast('Removed from wishlist', 'secondary');
        } else {
          wishlist.unshift(state.product);
          if (UI && UI.showToast) UI.showToast('Saved to wishlist', 'primary');
        }
        storage.set('wishlist', wishlist);
        $(document).trigger('wishlist:updated', [wishlist]);
      }
      $(this).toggleClass('active');
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'product') return;

    state.product = readProduct();
    state.selectedColor = $('.color-pill.active').data('value') || '';
    state.selectedSize = $('.size-pill.active').data('value') || '';
    $('#mobile-price').text(UI.formatNPR(state.product.price));

    updateWishlistState();
    updateCartCount();
    updateRecent(state.product.id);

    bindEvents();
  };

  return { init };
})();

$(ProductPage.init);
