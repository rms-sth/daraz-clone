/* global $, UI */

const SearchPage = (() => {
  const state = {
    products: [],
    filtered: [],
    page: 1,
    pageSize: 12,
    query: '',
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

  const updateCartCount = () => {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const getQuery = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  };

  const normalize = (value) => (value || '').toLowerCase();

  const highlight = (text, term) => {
    if (!term) return text;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'ig');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const enrichProduct = (product, wishlistSet) => {
    const image = product.images && product.images.length
      ? `../${product.images[0]}`
      : '../assets/img/placeholder.svg';
    const discountPct = product.discountPct || UI.calcDiscount(product.oldPrice, product.price);
    return {
      ...product,
      image,
      priceText: UI.formatNPR(product.price),
      oldPriceText: product.oldPrice ? UI.formatNPR(product.oldPrice) : '',
      discountText: discountPct ? `-${discountPct}%` : '',
      ratingHTML: UI.starsHTML(product.rating),
      wishlistActive: wishlistSet.has(product.id) ? 'active' : '',
      highlightedTitle: highlight(product.title, state.query),
    };
  };

  const productCardTemplate = `
    <div class="col-6 col-md-4">
      <div class="card product-card h-100" data-id="{{id}}">
        <div class="product-thumb position-relative ratio ratio-1x1">
          <a href="product.html?id={{id}}" class="product-link" data-id="{{id}}">
            <img src="{{image}}" alt="{{title}}" class="img-fluid" />
          </a>
          <button class="btn btn-sm btn-light wishlist-btn {{wishlistActive}}" data-id="{{id}}" aria-label="Toggle wishlist">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
        <div class="card-body">
          <h3 class="product-title mb-2">{{{highlightedTitle}}}</h3>
          <div class="price-row">
            <span class="price">{{priceText}}</span>
            <span class="old-price">{{oldPriceText}}</span>
            <span class="discount">{{discountText}}</span>
          </div>
          <div class="rating-row small">{{ratingHTML}} <span class="text-muted ms-1">({{ratingCount}})</span></div>
        </div>
        <div class="card-footer bg-white border-0">
          <button class="btn btn-outline-dark btn-sm w-100 btn-add-cart" data-id="{{id}}">Add to Cart</button>
        </div>
      </div>
    </div>
  `;

  const buildBrandFilters = (products) => {
    const brands = Array.from(new Set(products.map((item) => item.brand))).sort();
    const list = brands
      .map((brand) => `
        <div class="form-check">
          <input class="form-check-input search-brand-filter" type="checkbox" value="${brand}" id="search-brand-${brand.replace(/\s+/g, '-')}">
          <label class="form-check-label" for="search-brand-${brand.replace(/\s+/g, '-')}">${brand}</label>
        </div>
      `)
      .join('');
    $('#searchBrandFilters').html(list || '<div class="text-muted small">No brands</div>');
  };

  const applyFilters = () => {
    const minPrice = Number($('#searchMinPrice').val()) || 0;
    const maxPrice = Number($('#searchMaxPrice').val()) || Number.MAX_SAFE_INTEGER;
    const selectedBrands = $('.search-brand-filter:checked')
      .map((_, el) => $(el).val())
      .get();
    const rating = Number($('input[name="searchRating"]:checked').val());

    state.filtered = state.products.filter((product) => {
      const priceOk = product.price >= minPrice && product.price <= maxPrice;
      const brandOk = !selectedBrands.length || selectedBrands.includes(product.brand);
      const ratingOk = rating === 0 || product.rating >= rating;
      return priceOk && brandOk && ratingOk;
    });

    state.page = 1;
    render();
  };

  const applySorting = (list) => {
    const sort = $('#searchSort').val();
    const sorted = [...list];
    if (sort === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
  };

  const paginate = (list) => {
    const start = (state.page - 1) * state.pageSize;
    return list.slice(start, start + state.pageSize);
  };

  const renderPagination = (total) => {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const pagination = $('#search-pagination');
    pagination.empty();

    for (let i = 1; i <= totalPages; i += 1) {
      const item = `
        <li class="page-item ${i === state.page ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
      pagination.append(item);
    }
  };

  const render = () => {
    const list = applySorting(state.filtered);
    const paged = paginate(list);
    const wishlistSet = new Set(getWishlist());
    const grid = $('#search-grid');

    if (!paged.length) {
      grid.html('<div class="col-12 text-muted">No results found. Try another search.</div>');
      $('#search-count').text(0);
      renderPagination(0);
      return;
    }

    const markup = paged
      .map((product) => UI.renderTemplate(productCardTemplate, enrichProduct(product, wishlistSet)))
      .join('');

    grid.html(markup);
    $('#search-count').text(list.length);
    renderPagination(list.length);
  };

  const findSuggestion = (products) => {
    const term = normalize(state.query);
    if (!term) return '';

    const brands = Array.from(new Set(products.map((item) => item.brand)));
    const categories = Array.from(new Set(products.map((item) => item.category)));

    const suggestion = brands.find((brand) => normalize(brand).includes(term))
      || categories.find((category) => normalize(category).includes(term));

    return suggestion || '';
  };

  const bindEvents = () => {
    $('#searchMinPrice, #searchMaxPrice').on('input', applyFilters);
    $(document).on('change', '.search-brand-filter', applyFilters);
    $('input[name="searchRating"]').on('change', applyFilters);
    $('#searchSort').on('change', render);

    $('#searchClearFilters').on('click', () => {
      $('#searchMinPrice').val('');
      $('#searchMaxPrice').val('');
      $('.search-brand-filter').prop('checked', false);
      $('#searchRatingAll').prop('checked', true);
      applyFilters();
    });

    $('#search-pagination').on('click', 'a', function (event) {
      event.preventDefault();
      const page = Number($(this).data('page'));
      if (!Number.isNaN(page)) {
        state.page = page;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    $(document).on('click', '.btn-add-cart', function () {
      const id = $(this).data('id');
      if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
        Cart.add(id, { color: '', size: '' }, 1);
      } else {
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
      }
      if (UI && UI.showToast) UI.showToast('Added to cart', 'success');
      updateCartCount();
    });

    $(document).on('click', '.wishlist-btn', function () {
      const id = $(this).data('id');
      if (typeof Wishlist !== 'undefined' && typeof Wishlist.toggle === 'function') {
        Wishlist.toggle(id);
      } else {
        const wishlist = getWishlist();
        const index = wishlist.indexOf(id);
        if (index >= 0) {
          wishlist.splice(index, 1);
        } else {
          wishlist.unshift(id);
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
    if ($('body').data('page') !== 'search') return;

    state.query = getQuery();
    $('#search-term').text(state.query || 'all items');
    $('#search-grid').html('<div class="col-12 text-muted">Searching...</div>');

    $.getJSON('../assets/data/products.json')
      .done((products) => {
        const term = normalize(state.query);
        state.products = products.filter((product) => {
          if (!term) return true;
          return (
            normalize(product.title).includes(term)
            || normalize(product.brand).includes(term)
            || normalize(product.category).includes(term)
            || normalize(product.subcategory).includes(term)
          );
        });

        buildBrandFilters(state.products);
        state.filtered = [...state.products];
        const suggestion = findSuggestion(products);
        if (!state.products.length && suggestion) {
          $('#did-you-mean').html(`Did you mean <a href="search.html?q=${encodeURIComponent(suggestion)}">${suggestion}</a>?`);
        }
        render();
      })
      .fail(() => {
        $('#search-grid').html('<div class="col-12 text-danger">Unable to load products.</div>');
      });

    bindEvents();
  };

  return { init };
})();

$(SearchPage.init);
