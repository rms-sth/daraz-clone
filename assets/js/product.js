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
      image: $('#mainImage').attr('src') || '../assets/img/products/product-01.jpg',
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

    const lightbox = $('#imageLightbox');
    const previewImage = $('#previewImage');
    const zoomStage = $('#zoomStage');
    const zoomRange = $('#zoomRange');
    const zoomValue = $('#zoomValue');
    let scale = 1;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const applyTransform = () => {
      previewImage.css('transform', `translate(${currentX}px, ${currentY}px) scale(${scale})`);
      zoomRange.val(scale);
      zoomValue.text(`${Math.round(scale * 100)}%`);
    };

    const resetTransform = () => {
      scale = 1;
      currentX = 0;
      currentY = 0;
      applyTransform();
    };

    const openPreview = () => {
      const src = $('#mainImage').attr('src');
      previewImage.attr('src', src);
      resetTransform();
      lightbox.addClass('active').attr('aria-hidden', 'false');
    };

    $('#product-detail').on('click', '#mainImage', openPreview);

    zoomStage.on('wheel', (event) => {
      event.preventDefault();
      const delta = event.originalEvent.deltaY;
      scale = clamp(scale + (delta > 0 ? -0.1 : 0.1), 1, 3);
      if (scale === 1) {
        currentX = 0;
        currentY = 0;
      }
      applyTransform();
    });

    zoomStage.on('mousedown', (event) => {
      event.preventDefault();
      if (scale <= 1) return;
      isDragging = true;
      zoomStage.addClass('dragging');
      startX = event.clientX - currentX;
      startY = event.clientY - currentY;
    });

    previewImage.on('dragstart', (event) => {
      event.preventDefault();
    });

    $(document).on('mousemove', (event) => {
      if (!isDragging) return;
      currentX = event.clientX - startX;
      currentY = event.clientY - startY;
      applyTransform();
    });

    $(document).on('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      zoomStage.removeClass('dragging');
    });

    zoomStage.on('dblclick', () => {
      if (scale === 1) {
        scale = 2;
        applyTransform();
      } else {
        resetTransform();
      }
    });

    zoomRange.on('input', function () {
      scale = clamp(Number($(this).val()) || 1, 1, 3);
      if (scale === 1) {
        currentX = 0;
        currentY = 0;
      }
      applyTransform();
    });

    $('#zoomIn').on('click', () => {
      scale = clamp(scale + 0.2, 1, 3);
      applyTransform();
    });

    $('#zoomOut').on('click', () => {
      scale = clamp(scale - 0.2, 1, 3);
      if (scale === 1) {
        currentX = 0;
        currentY = 0;
      }
      applyTransform();
    });

    $('#zoomReset').on('click', resetTransform);

    const closePreview = () => {
      lightbox.removeClass('active').attr('aria-hidden', 'true');
      resetTransform();
    };

    $('#lightboxClose').on('click', closePreview);
    lightbox.on('click', (event) => {
      if ($(event.target).is('#imageLightbox')) {
        closePreview();
      }
    });

    $(document).on('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.hasClass('active')) {
        closePreview();
      }
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
