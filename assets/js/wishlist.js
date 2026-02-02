/* global $, UI */

const WishlistPage = (() => {
  const state = {
    wishlist: [],
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

  const normalizeWishlist = (items) => items.map((item) => {
    if (typeof item === 'string') {
      return { id: item, title: 'Wishlist Item', price: 0, image: '../assets/img/placeholder.svg' };
    }
    return {
      id: item.id,
      title: item.title || 'Wishlist Item',
      price: item.price || 0,
      image: item.image || '../assets/img/placeholder.svg',
    };
  });

  const renderWishlist = () => {
    const grid = $('#wishlist-grid');
    const empty = $('#wishlist-empty');
    const items = normalizeWishlist(state.wishlist);
    const slots = grid.find('.wishlist-slot');

    slots.addClass('d-none');

    if (!items.length) {
      empty.removeClass('d-none');
      return;
    }

    empty.addClass('d-none');

    items.forEach((product, index) => {
      const card = slots.eq(index);
      if (!card.length) return;
      card.find('[data-field="image"]').attr('src', product.image).attr('alt', product.title);
      card.find('[data-field="title"]').text(product.title);
      card.find('[data-field="price"]').text(UI.formatNPR(product.price));
      card.find('[data-field="move"]').attr('data-id', product.id);
      card.find('[data-field="remove"]').attr('data-id', product.id);
      card.removeClass('d-none');
    });
  };

  const removeItem = (id) => {
    state.wishlist = state.wishlist.filter((item) => (typeof item === 'string' ? item !== id : item.id !== id));
    storage.set('wishlist', state.wishlist);
    renderWishlist();
  };

  const moveToCart = (id) => {
    const item = state.wishlist.find((entry) => (typeof entry === 'string' ? entry === id : entry.id === id));
    const product = typeof item === 'string' ? { id: item, title: 'Wishlist Item', price: 0, image: '../assets/img/placeholder.svg' } : item;

    if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
      Cart.add(product.id, { color: '', size: '' }, 1, product);
    } else {
      const cart = storage.get('cart', []);
      const key = `${product.id}||`;
      const existing = cart.find((entry) => entry.key === key);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ key, productId: product.id, qty: 1, variant: { color: '', size: '' }, product });
      }
      storage.set('cart', cart);
      $(document).trigger('cart:updated', [cart]);
    }
    removeItem(product.id);
  };

  const bindEvents = () => {
    $('#wishlist-grid').on('click', '.btn-remove', function () {
      const id = $(this).data('id');
      if (UI && UI.confirm) {
        UI.confirm('Remove this item from your wishlist?', () => removeItem(id), {
          title: 'Remove Item',
          confirmText: 'Remove',
        });
      } else {
        removeItem(id);
      }
    });

    $('#wishlist-grid').on('click', '.btn-move-cart', function () {
      const id = $(this).data('id');
      moveToCart(id);
      updateCartCount();
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'wishlist') return;

    state.wishlist = storage.get('wishlist', []);
    renderWishlist();

    bindEvents();
    updateCartCount();
  };

  return { init };
})();

$(WishlistPage.init);
