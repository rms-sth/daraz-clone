/* global $, UI */

const CategoryPage = (() => {
  const state = {
    items: [],
    filtered: [],
    page: 1,
    pageSize: 9,
    category: null,
    subcategory: null,
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

  const getParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      cat: params.get('cat'),
      sub: params.get('sub'),
    };
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
    stock: Number($el.data('stock')) || 0,
    location: ($el.data('location') || '').toString(),
    image: $el.find('img').first().attr('src') || '../assets/img/products/product-01.jpg',
  });

  const applyFilters = () => {
    const minPrice = Number($('#minPrice').val()) || 0;
    const maxPrice = Number($('#maxPrice').val()) || Number.MAX_SAFE_INTEGER;
    const selectedBrands = $('.brand-filter:checked')
      .map((_, el) => $(el).val())
      .get();
    const rating = Number($('input[name="rating"]:checked').val());
    const inStockOnly = $('#inStockOnly').is(':checked');
    const localOnly = $('#localOnly').is(':checked');

    state.filtered = state.items.filter((item) => {
      const data = item.data;
      const priceOk = data.price >= minPrice && data.price <= maxPrice;
      const brandOk = !selectedBrands.length || selectedBrands.includes(data.brand);
      const ratingOk = rating === 0 || data.rating >= rating;
      const stockOk = !inStockOnly || data.stock > 0;
      const location = normalize(data.location);
      const localOk = !localOnly || location.includes('kathmandu') || location.includes('lalitpur');
      return priceOk && brandOk && ratingOk && stockOk && localOk;
    });

    state.page = 1;
    render();
  };

  const applySorting = (list) => {
    const sort = $('#sortSelect').val();
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
    const pagination = $('#pagination');
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
    const grid = $('#product-grid');

    grid.children('.product-item').addClass('d-none');
    $('#category-no-results').addClass('d-none');

    if (!paged.length) {
      $('#result-count').text(0);
      $('#category-no-results').removeClass('d-none');
      renderPagination(0);
      return;
    }
    paged.forEach((item) => {
      item.el.removeClass('d-none');
    });

    $('#result-count').text(list.length);
    renderPagination(list.length);
  };

  const bindEvents = () => {
    $('#minPrice, #maxPrice').on('input', applyFilters);
    $(document).on('change', '.brand-filter', applyFilters);
    $('input[name="rating"]').on('change', applyFilters);
    $('#inStockOnly, #localOnly').on('change', applyFilters);
    $('#sortSelect').on('change', render);

    $('#clearFilters').on('click', () => {
      $('#minPrice').val('');
      $('#maxPrice').val('');
      $('.brand-filter').prop('checked', false);
      $('#ratingAll').prop('checked', true);
      $('#inStockOnly').prop('checked', false);
      $('#localOnly').prop('checked', false);
      applyFilters();
    });

    $('#pagination').on('click', 'a', function (event) {
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
      if (UI && UI.showToast) UI.showToast('Added to cart', 'success');
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
    if ($('body').data('page') !== 'category') return;

    const params = getParams();
    state.category = params.cat;
    state.subcategory = params.sub;

    const items = $('#product-grid .product-item')
      .map((_, el) => {
        const $el = $(el);
        return { el: $el, data: extractItemData($el) };
      })
      .get();

    state.items = items.filter((item) => {
      const catMatch = state.category ? normalize(item.data.category) === normalize(state.category) : true;
      const subMatch = state.subcategory ? normalize(item.data.subcategory) === normalize(state.subcategory) : true;
      return catMatch && subMatch;
    });

    const title = state.subcategory || state.category || 'All Products';
    $('#category-title').text(title);
    $('#breadcrumb-category').text(title);

    state.filtered = [...state.items];
    updateWishlistState();
    render();
    bindEvents();
  };

  return { init };
})();

$(CategoryPage.init);
