/* global $, UI, bootstrap */

const HomePage = (() => {
  const state = {
    quickProduct: null,
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

  const getCart = () => storage.get('cart', []);
  const getRecent = () => storage.get('recentlyViewed', []);

  const updateCartCount = () => {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const getProductData = ($item) => {
    if (!$item || !$item.length) return null;
    const image = $item.data('image') || $item.find('img').first().attr('src') || '../assets/img/products/product-01.jpg';
    return {
      id: $item.data('id')?.toString(),
      title: $item.data('title') || $item.find('.product-title').text().trim(),
      price: Number($item.data('price')) || 0,
      oldPrice: Number($item.data('old-price')) || 0,
      rating: Number($item.data('rating')) || 0,
      ratingCount: Number($item.data('rating-count')) || 0,
      image,
      brand: $item.data('brand') || '',
      seller: $item.data('seller') || '',
      location: $item.data('location') || '',
      category: $item.data('category') || '',
      subcategory: $item.data('subcategory') || '',
    };
  };

  const updateWishlistState = () => {
    const wishlist = new Set(getWishlistIds());
    $('.wishlist-btn').each(function () {
      const id = $(this).data('id');
      $(this).toggleClass('active', wishlist.has(id));
    });
  };

  const addRecent = (id) => {
    if (!id) return;
    const recent = getRecent().filter((item) => item !== id);
    recent.unshift(id);
    storage.set('recentlyViewed', recent.slice(0, 8));
  };

  const addToCart = (product) => {
    if (!product || !product.id) return;

    if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
      Cart.add(product.id, { color: '', size: '' }, 1, product);
    } else {
      const cart = getCart();
      const key = `${product.id}||`;
      const existing = cart.find((item) => item.key === key);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ key, productId: product.id, qty: 1, variant: { color: '', size: '' }, product });
      }
      storage.set('cart', cart);
      $(document).trigger('cart:updated', [cart]);
    }
    if (UI && UI.showToast) {
      UI.showToast('Added to cart', 'success');
    }
  };

  const toggleWishlist = (product) => {
    if (!product || !product.id) return;

    if (typeof Wishlist !== 'undefined' && typeof Wishlist.toggle === 'function') {
      Wishlist.toggle(product.id, product);
    } else {
      const wishlist = storage.get('wishlist', []);
      const ids = wishlist.map((item) => (typeof item === 'string' ? item : item.id));
      const index = ids.indexOf(product.id);
      if (index >= 0) {
        wishlist.splice(index, 1);
        if (UI && UI.showToast) UI.showToast('Removed from wishlist', 'secondary');
      } else {
        wishlist.unshift(product);
        if (UI && UI.showToast) UI.showToast('Saved to wishlist', 'primary');
      }
      storage.set('wishlist', wishlist);
      $(document).trigger('wishlist:updated', [wishlist]);
    }
  };

  const initCountdown = () => {
    const endTime = Date.now() + 6 * 60 * 60 * 1000;
    const countdownEl = $('#flashCountdown');

    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now());
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      countdownEl.text(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    tick();
    setInterval(tick, 1000);
  };

  const renderRecentlyViewed = () => {
    const recentIds = getRecent();
    const recentEl = $('#recently-viewed-list');
    const emptyEl = $('#recently-viewed-empty');
    const items = recentEl.find('.recent-item');

    items.addClass('d-none');

    if (!recentIds.length) {
      emptyEl.removeClass('d-none');
      return;
    }

    emptyEl.addClass('d-none');
    recentIds.forEach((id) => {
      const match = items.filter(`[data-id="${id}"]`).first();
      if (match.length) {
        match.removeClass('d-none');
      }
    });
  };

  const initInfiniteScroll = () => {
    let currentBatch = 1;
    const batches = $('[data-batch]').map((_, el) => Number($(el).data('batch'))).get();
    const maxBatch = batches.length ? Math.max(...batches) : 1;

    const loadNextBatch = () => {
      if (currentBatch >= maxBatch) {
        $('#load-indicator').text('You have reached the end.');
        $(window).off('scroll', handleScroll);
        return;
      }
      currentBatch += 1;
      $(`[data-batch="${currentBatch}"]`).removeClass('d-none');
      if (currentBatch >= maxBatch) {
        $('#load-indicator').text('You have reached the end.');
      }
    };

    const handleScroll = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      if (scrollBottom >= document.body.offsetHeight - 200) {
        loadNextBatch();
      }
    };

    $(window).on('scroll', handleScroll);
  };

  const bindEvents = () => {
    $(document).on('click', '.btn-add-cart', function () {
      const product = getProductData($(this).closest('.product-item')) || state.quickProduct;
      addToCart(product);
      updateCartCount();
    });

    $(document).on('click', '.wishlist-btn', function (event) {
      event.preventDefault();
      const product = getProductData($(this).closest('.product-item'));
      toggleWishlist(product);
      $(this).toggleClass('active');
    });

    $(document).on('click', '.product-link', function () {
      const id = $(this).closest('.product-item').data('id');
      if (id) addRecent(id);
    });

    $(document).on('click', '.btn-quick-view', function () {
      const product = getProductData($(this).closest('.product-item'));
      if (!product) return;
      state.quickProduct = product;

      $('#quickViewImage').attr('src', product.image).attr('alt', product.title);
      $('#quickViewTitle').text(product.title);
      $('#quickViewPrice').text(UI.formatNPR(product.price));
      $('#quickViewOldPrice').text(product.oldPrice ? UI.formatNPR(product.oldPrice) : '');
      $('#quickViewRatingCount').text(`(${product.ratingCount})`);
      $('#quickViewMeta').text(`Sold by ${product.seller || 'Daraz Seller'} • ${product.location || 'Kathmandu'}`);
      $('#quickViewLink').attr('href', `product.html?id=${product.id}`);

      const full = Math.floor(product.rating);
      const half = product.rating - full >= 0.5;
      $('#quickViewRating .quick-star').each(function () {
        const index = Number($(this).data('index'));
        $(this).removeClass('fa-solid fa-star fa-star-half-stroke fa-regular');
        if (index <= full) {
          $(this).addClass('fa-solid fa-star');
        } else if (index === full + 1 && half) {
          $(this).addClass('fa-solid fa-star-half-stroke');
        } else {
          $(this).addClass('fa-regular fa-star');
        }
      });

      const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('quickViewModal'));
      modal.show();
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('wishlist:updated', updateWishlistState);
    $(document).on('header:loaded', updateCartCount);

    const backToTop = $('#backToTop');
    $(window).on('scroll', () => {
      if (window.scrollY > 400) {
        backToTop.addClass('show');
      } else {
        backToTop.removeClass('show');
      }
    });
    backToTop.on('click', () => {
      $('html, body').animate({ scrollTop: 0 }, 400);
    });
  };

  const init = () => {
    if ($('body').data('page') !== 'home') return;

    initCountdown();
    bindEvents();
    updateWishlistState();
    updateCartCount();
    renderRecentlyViewed();
    initInfiniteScroll();
  };

  return { init };
})();

$(HomePage.init);
