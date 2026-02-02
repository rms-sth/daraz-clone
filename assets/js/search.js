/* global $ */

const SearchPage = (() => {
  const state = {
    items: [],
    filtered: [],
    page: 1,
    pageSize: 9,
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

  const getWishlistIds = () => {
    const items = storage.get('wishlist', []);
    return items.map((item) => (typeof item === 'string' ? item : item.id)).filter(Boolean);
  };

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

  const extractItemData = ($el) => ({
    id: ($el.data('id') || '').toString(),
    title: $el.data('title') || $el.find('.product-title').text().trim(),
    category: $el.data('category') || '',
    subcategory: $el.data('subcategory') || '',
    brand: $el.data('brand') || '',
    price: Number($el.data('price')) || 0,
    rating: Number($el.data('rating')) || 0,
    image: $el.find('img').first().attr('src') || '../assets/img/placeholder.svg',
  });

  const applyFilters = () => {
    const minPrice = Number($('#searchMinPrice').val()) || 0;
    const maxPrice = Number($('#searchMaxPrice').val()) || Number.MAX_SAFE_INTEGER;
    const selectedBrands = $('.search-brand-filter:checked')
      .map((_, el) => $(el).val())
      .get();
    const rating = Number($('input[name="searchRating"]:checked').val());

    state.filtered = state.items.filter((item) => {
      const data = item.data;
      const priceOk = data.price >= minPrice && data.price <= maxPrice;
      const brandOk = !selectedBrands.length || selectedBrands.includes(data.brand);
      const ratingOk = rating === 0 || data.rating >= rating;
      return priceOk && brandOk && ratingOk;
    });

    state.page = 1;
    render();
  };

  const applySorting = (list) => {
    const sort = $('#searchSort').val();
    const sorted = [...list];
    if (sort === 'price-asc') {
      sorted.sort((a, b) => a.data.price - b.data.price);
    } else if (sort === 'price-desc') {
      sorted.sort((a, b) => b.data.price - a.data.price);
    } else if (sort === 'rating') {
      sorted.sort((a, b) => b.data.rating - a.data.rating);
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
    const slots = pagination.find('.page-item');
    slots.addClass('d-none').removeClass('active');

    const visiblePages = Math.min(totalPages, slots.length);
    for (let i = 1; i <= visiblePages; i += 1) {
      const slot = slots.eq(i - 1);
      slot.removeClass('d-none');
      slot.toggleClass('active', i === state.page);
      const link = slot.find('a');
      link.attr('data-page', i).text(i);
    }
  };

  const updateWishlistState = () => {
    const wishlist = new Set(getWishlistIds());
    $('.wishlist-btn').each(function () {
      const id = $(this).data('id');
      $(this).toggleClass('active', wishlist.has(id));
    });
  };

  const render = () => {
    const list = applySorting(state.filtered);
    const paged = paginate(list);
    const grid = $('#search-grid');

    grid.children('.product-item').addClass('d-none');
    $('#search-no-results').addClass('d-none');

    if (!paged.length) {
      $('#search-no-results').removeClass('d-none');
      $('#search-count').text(0);
      renderPagination(0);
      return;
    }
    paged.forEach((item) => {
      const titleEl = item.el.find('.product-title');
      const rawTitle = item.data.title;
      titleEl.text(rawTitle);
      item.el.removeClass('d-none');
    });

    $('#search-count').text(list.length);
    renderPagination(list.length);
  };

  const findSuggestion = () => {
    const term = normalize(state.query);
    if (!term) return '';

    const brands = Array.from(new Set(state.items.map((item) => item.data.brand)));
    const categories = Array.from(new Set(state.items.map((item) => item.data.category)));

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
      const $item = $(this).closest('.product-item');
      const data = extractItemData($item);
      if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
        Cart.add(data.id, { color: '', size: '' }, 1, data);
      } else {
        const cart = getCart();
        const key = `${data.id}||`;
        const existing = cart.find((item) => item.key === key);
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({ key, productId: data.id, qty: 1, variant: { color: '', size: '' }, product: data });
        }
        storage.set('cart', cart);
        $(document).trigger('cart:updated', [cart]);
      }
      updateCartCount();
    });

    $(document).on('click', '.wishlist-btn', function () {
      const $item = $(this).closest('.product-item');
      const data = extractItemData($item);
      if (typeof Wishlist !== 'undefined' && typeof Wishlist.toggle === 'function') {
        Wishlist.toggle(data.id, data);
      } else {
        const wishlist = storage.get('wishlist', []);
        const ids = wishlist.map((item) => (typeof item === 'string' ? item : item.id));
        const index = ids.indexOf(data.id);
        if (index >= 0) {
          wishlist.splice(index, 1);
        } else {
          wishlist.unshift(data);
        }
        storage.set('wishlist', wishlist);
        $(document).trigger('wishlist:updated', [wishlist]);
      }
      $(this).toggleClass('active');
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
    $(document).on('wishlist:updated', updateWishlistState);
  };

  const init = () => {
    if ($('body').data('page') !== 'search') return;

    state.query = getQuery();
    $('#search-term').text(state.query || 'all items');

    const items = $('#search-grid .product-item')
      .map((_, el) => {
        const $el = $(el);
        return { el: $el, data: extractItemData($el) };
      })
      .get();

    const term = normalize(state.query);
    state.items = items.filter((item) => {
      if (!term) return true;
      return (
        normalize(item.data.title).includes(term)
        || normalize(item.data.brand).includes(term)
        || normalize(item.data.category).includes(term)
        || normalize(item.data.subcategory).includes(term)
      );
    });

    state.filtered = [...state.items];

    const suggestion = findSuggestion();
    const suggestionEl = $('#did-you-mean');
    if (!state.items.length && suggestion) {
      suggestionEl.removeClass('d-none');
      suggestionEl.find('a').attr('href', `search.html?q=${encodeURIComponent(suggestion)}`).text(suggestion);
    } else {
      suggestionEl.addClass('d-none');
    }

    updateWishlistState();
    render();
    bindEvents();
  };

  return { init };
})();

$(SearchPage.init);
