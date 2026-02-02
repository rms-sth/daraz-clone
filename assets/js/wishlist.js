/* global $, UI */

const WishlistPage = (() => {
  const state = {
    products: [],
    wishlist: [],
    sellers: [],
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

  const getWishlist = () => storage.get('wishlist', []);

  const renderWishlist = () => {
    const grid = $('#wishlist-grid');
    const empty = $('#wishlist-empty');
    const wishlistSet = new Set(state.wishlist);
    const items = state.products.filter((product) => wishlistSet.has(product.id));

    if (!items.length) {
      grid.empty();
      empty.removeClass('d-none');
      return;
    }

    empty.addClass('d-none');

    const markup = items
      .map((product) => `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="card product-card h-100">
            <div class="ratio ratio-1x1">
              <img src="${product.images && product.images.length ? `../${product.images[0]}` : '../assets/img/placeholder.svg'}" alt="${product.title}" class="img-fluid" />
            </div>
            <div class="card-body">
              <div class="fw-semibold small">${product.title}</div>
              <div class="price-row">
                <span class="price">${UI.formatNPR(product.price)}</span>
              </div>
            </div>
            <div class="card-footer bg-white border-0 d-flex gap-2">
              <button class="btn btn-sm btn-outline-dark flex-grow-1 btn-move-cart" data-id="${product.id}">Move to Cart</button>
              <button class="btn btn-sm btn-outline-danger btn-remove" data-id="${product.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `)
      .join('');

    grid.html(markup);
  };

  const renderFollowedStores = () => {
    const list = $('#followed-stores-list');
    if (!state.sellers.length) {
      list.html('<div class="col-12 text-muted">No followed stores yet.</div>');
      return;
    }

    const picks = state.sellers.slice(0, 3);
    const markup = picks
      .map((seller) => `
        <div class="col-md-4">
          <div class="card store-card">
            <div class="card-body">
              <div class="fw-semibold">${seller.name}</div>
              <div class="small text-muted">Positive Rating ${seller.ratingPct}%</div>
              <button class="btn btn-sm btn-outline-dark mt-2">Visit Store</button>
            </div>
          </div>
        </div>
      `)
      .join('');

    list.html(markup);
  };

  const removeItem = (id) => {
    state.wishlist = state.wishlist.filter((item) => item !== id);
    storage.set('wishlist', state.wishlist);
    renderWishlist();
  };

  const moveToCart = (id) => {
    if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
      Cart.add(id, { color: '', size: '' }, 1);
    } else {
      const cart = storage.get('cart', []);
      const key = `${id}||`;
      const existing = cart.find((item) => item.key === key);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ key, productId: id, qty: 1, variant: { color: '', size: '' } });
      }
      storage.set('cart', cart);
      $(document).trigger('cart:updated', [cart]);
    }
    removeItem(id);
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

    state.wishlist = getWishlist();

    $.when(
      $.getJSON('../assets/data/products.json'),
      $.getJSON('../assets/data/sellers.json')
    )
      .done((productsRes, sellersRes) => {
        state.products = productsRes[0];
        state.sellers = sellersRes[0];
        renderWishlist();
        renderFollowedStores();
      })
      .fail(() => {
        $('#wishlist-grid').html('<div class="col-12 text-danger">Unable to load wishlist.</div>');
      });

    bindEvents();
    updateCartCount();
  };

  return { init };
})();

$(WishlistPage.init);
