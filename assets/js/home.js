/* global $, UI, bootstrap */

const HomePage = (() => {
  const state = {
    products: [],
    rawProducts: [],
    categories: [],
    offset: 0,
    batchSize: 12,
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

  const getWishlist = () => storage.get('wishlist', []);
  const getCart = () => storage.get('cart', []);
  const getRecent = () => storage.get('recentlyViewed', []);

  const updateCartCount = () => {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const updateWishlistState = () => {
    const wishlist = new Set(getWishlist());
    $('.wishlist-btn').each(function () {
      const id = $(this).data('id');
      $(this).toggleClass('active', wishlist.has(id));
    });
  };

  const addRecent = (id) => {
    const recent = getRecent().filter((item) => item !== id);
    recent.unshift(id);
    storage.set('recentlyViewed', recent.slice(0, 8));
  };

  const addToCart = (id) => {
    if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
      Cart.add(id, { color: '', size: '' }, 1);
      return;
    }

    const cart = getCart();
    const key = `${id}||`;
    const existing = cart.find((item) => item.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ key, productId: id, qty: 1, variant: { color: '', size: '' } });
    }
    storage.set('cart', cart);
    $(document).trigger('cart:updated', [cart]);
    if (UI && UI.showToast) {
      UI.showToast('Added to cart', 'success');
    }
  };

  const toggleWishlist = (id) => {
    if (typeof Wishlist !== 'undefined' && typeof Wishlist.toggle === 'function') {
      Wishlist.toggle(id);
      return;
    }

    const wishlist = getWishlist();
    const index = wishlist.indexOf(id);
    if (index >= 0) {
      wishlist.splice(index, 1);
      if (UI && UI.showToast) {
        UI.showToast('Removed from wishlist', 'secondary');
      }
    } else {
      wishlist.unshift(id);
      if (UI && UI.showToast) {
        UI.showToast('Saved to wishlist', 'primary');
      }
    }
    storage.set('wishlist', wishlist);
    $(document).trigger('wishlist:updated', [wishlist]);
  };

  const categoryIcons = {
    "Women's Fashion": 'fa-person-dress',
    "Men's Fashion": 'fa-person',
    'Health & Beauty': 'fa-heart-pulse',
    'Watches & Accessories': 'fa-clock',
    'Electronic Devices': 'fa-mobile-screen',
    'TV & Home Appliances': 'fa-tv',
    'Electronic Accessories': 'fa-headphones',
    'Groceries & Pets': 'fa-basket-shopping',
    'Babies & Toys': 'fa-baby',
    'Home & Lifestyle': 'fa-couch',
    'Sports & Outdoor': 'fa-person-hiking',
    'Motors/Tools/DIY': 'fa-screwdriver-wrench',
  };

  const cardTemplate = `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="card product-card h-100" data-id="{{id}}">
        <div class="product-thumb position-relative ratio ratio-1x1">
          <a href="product.html?id={{id}}" class="product-link" data-id="{{id}}">
            <img src="{{image}}" alt="{{title}}" class="img-fluid" />
          </a>
          <button class="btn btn-sm btn-light wishlist-btn {{wishlistActive}}" data-id="{{id}}" aria-label="Toggle wishlist">
            <i class="fa-solid fa-heart"></i>
          </button>
          {{badgeHTML}}
        </div>
        <div class="card-body d-flex flex-column">
          <h3 class="product-title flex-grow-1">{{title}}</h3>
          <div class="price-row">
            <span class="price">{{priceText}}</span>
            <span class="old-price">{{oldPriceText}}</span>
            <span class="discount">{{discountText}}</span>
          </div>
          <div class="rating-row small">{{ratingHTML}} <span class="text-muted ms-1">({{ratingCount}})</span></div>
        </div>
        <div class="card-footer bg-white border-0 d-flex gap-2">
          <button class="btn btn-outline-dark btn-sm flex-grow-1 btn-quick-view" data-id="{{id}}">Quick View</button>
          <button class="btn btn-primary btn-sm flex-grow-1 btn-add-cart" data-id="{{id}}">Add to Cart</button>
        </div>
      </div>
    </div>
  `;

  const flashTemplate = `
    <div class="card flash-card" data-id="{{id}}">
      <div class="flash-thumb">
        <a href="product.html?id={{id}}" class="product-link" data-id="{{id}}">
          <img src="{{image}}" alt="{{title}}" />
        </a>
      </div>
      <div class="card-body">
        <div class="fw-semibold small">{{title}}</div>
        <div class="price-row mt-1">
          <span class="price">{{priceText}}</span>
          <span class="old-price">{{oldPriceText}}</span>
        </div>
      </div>
    </div>
  `;

  const categoryTemplate = `
    <div class="col-6 col-md-4 col-lg-2">
      <a href="{{link}}" class="category-card">
        <div class="icon"><i class="fa-solid {{icon}}"></i></div>
        <div class="fw-semibold">{{name}}</div>
      </a>
    </div>
  `;

  const enrichProduct = (product, wishlistSet) => {
    const image = product.images && product.images.length
      ? `../${product.images[0]}`
      : '../assets/img/placeholder.svg';
    const discountPct = product.discountPct || UI.calcDiscount(product.oldPrice, product.price);
    return {
      ...product,
      discountPct,
      image,
      priceText: UI.formatNPR(product.price),
      oldPriceText: product.oldPrice ? UI.formatNPR(product.oldPrice) : '',
      discountText: discountPct ? `-${discountPct}%` : '',
      ratingHTML: UI.starsHTML(product.rating),
      badgeHTML: product.badges && product.badges.length
        ? `<span class="badge bg-danger position-absolute start-0 top-0 m-2">${product.badges[0]}</span>`
        : '',
      wishlistActive: wishlistSet.has(product.id) ? 'active' : '',
    };
  };

  const renderFlashSale = () => {
    const flashEl = $('#flash-sale-list');
    const flashItems = [...state.products]
      .filter((product) => product.discountPct >= 15)
      .slice(0, 8);

    if (!flashItems.length) {
      flashEl.html('<div class="text-muted">No flash deals right now.</div>');
      return;
    }

    flashEl.html(flashItems.map((product) => UI.renderTemplate(flashTemplate, product)).join(''));
  };

  const renderCategories = () => {
    const categoryEl = $('#top-categories');
    if (!state.categories.length) {
      categoryEl.html('<div class="col-12 text-muted">No categories found.</div>');
      return;
    }

    const markup = state.categories
      .slice(0, 12)
      .map((category) => UI.renderTemplate(categoryTemplate, {
        name: category.name,
        icon: categoryIcons[category.name] || 'fa-tags',
        link: `category.html?cat=${encodeURIComponent(category.name)}`,
      }))
      .join('');

    categoryEl.html(markup);
  };

  const renderJustForYou = () => {
    const listEl = $('#just-for-you-list');
    const loadIndicator = $('#load-indicator');
    const nextBatch = state.products.slice(state.offset, state.offset + state.batchSize);

    if (!nextBatch.length) {
      loadIndicator.text('You have reached the end.');
      $(window).off('scroll', handleScroll);
      return;
    }

    const markup = nextBatch.map((product) => UI.renderTemplate(cardTemplate, product)).join('');
    listEl.append(markup);
    state.offset += nextBatch.length;
    updateWishlistState();

    if (state.offset < state.products.length) {
      loadIndicator.text('Loading more deals...');
    } else {
      loadIndicator.text('You have reached the end.');
    }
  };

  const renderRecentlyViewed = () => {
    const recentIds = getRecent();
    const recentEl = $('#recently-viewed-list');
    if (!recentIds.length) {
      recentEl.html('<div class="col-12 text-muted">Start browsing to see your recently viewed items.</div>');
      return;
    }

    const wishlistSet = new Set(getWishlist());
    const recentProducts = recentIds
      .map((id) => state.rawProducts.find((product) => product.id === id))
      .filter(Boolean)
      .map((product) => enrichProduct(product, wishlistSet));

    recentEl.html(recentProducts.map((product) => UI.renderTemplate(cardTemplate, product)).join(''));
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

  const handleScroll = () => {
    const scrollBottom = window.innerHeight + window.scrollY;
    if (scrollBottom >= document.body.offsetHeight - 200) {
      renderJustForYou();
    }
  };

  const bindEvents = () => {
    $(document).on('click', '.btn-add-cart', function () {
      const id = $(this).data('id');
      addToCart(id);
      updateCartCount();
    });

    $(document).on('click', '.wishlist-btn', function (event) {
      event.preventDefault();
      const id = $(this).data('id');
      toggleWishlist(id);
      $(this).toggleClass('active');
    });

    $(document).on('click', '.product-link', function () {
      const id = $(this).data('id');
      if (id) addRecent(id);
    });

    $(document).on('click', '.btn-quick-view', function () {
      const id = $(this).data('id');
      const product = state.rawProducts.find((item) => item.id === id);
      if (!product) return;
      const view = enrichProduct(product, new Set(getWishlist()));
      const modalHtml = `
        <div class="row g-3">
          <div class="col-md-5">
            <img src="${view.image}" alt="${view.title}" class="img-fluid rounded" />
          </div>
          <div class="col-md-7">
            <h4 class="mb-2">${view.title}</h4>
            <div class="mb-2">${view.ratingHTML} <span class="text-muted">(${view.ratingCount})</span></div>
            <div class="price-row mb-2">
              <span class="price">${view.priceText}</span>
              <span class="old-price">${view.oldPriceText}</span>
              <span class="discount">${view.discountText}</span>
            </div>
            <div class="text-muted small mb-3">Sold by ${product.seller} • ${product.location}</div>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-add-cart" data-id="${view.id}">Add to Cart</button>
              <a class="btn btn-outline-dark" href="product.html?id=${view.id}">View Details</a>
            </div>
          </div>
        </div>
      `;
      $('#quickViewBody').html(modalHtml);
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

    $('#flash-sale-list').html('<div class="text-muted">Loading flash deals...</div>');
    $('#top-categories').html('<div class="col-12 text-muted">Loading categories...</div>');
    $('#just-for-you-list').html('<div class="col-12 text-muted">Loading products...</div>');

    initCountdown();
    bindEvents();

    const wishlistSet = new Set(getWishlist());

    $.getJSON('../assets/data/products.json')
      .done((products) => {
        state.rawProducts = products;
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        state.products = shuffled.map((product) => enrichProduct(product, wishlistSet));
        state.offset = 0;
        $('#just-for-you-list').empty();
        renderFlashSale();
        renderJustForYou();
        renderRecentlyViewed();
        updateWishlistState();
        updateCartCount();
        $(window).on('scroll', handleScroll);
      })
      .fail(() => {
        $('#just-for-you-list').html('<div class="col-12 text-danger">Unable to load products.</div>');
      });

    $.getJSON('../assets/data/categories.json')
      .done((categories) => {
        state.categories = categories;
        renderCategories();
      })
      .fail(() => {
        $('#top-categories').html('<div class="col-12 text-danger">Unable to load categories.</div>');
      });
  };

  return { init };
})();

$(HomePage.init);
